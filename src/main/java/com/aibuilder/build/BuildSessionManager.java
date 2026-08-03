package com.aibuilder.build;

import com.aibuilder.ai.AiBackend;
import com.aibuilder.ai.AnthropicApiBackend;
import com.aibuilder.ai.ClaudeCliBackend;
import com.aibuilder.ai.UsageTracker;
import com.aibuilder.config.AiBuilderConfig;
import com.aibuilder.plan.BuildPlan;
import com.aibuilder.plan.PlanParser;
import net.minecraft.ChatFormatting;
import net.minecraft.network.chat.Component;
import net.minecraft.server.MinecraftServer;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.phys.Vec3;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Owns all build sessions, the undo history, and the server-tick pump.
 * AI calls run on a background executor; every world mutation happens in tick().
 */
public class BuildSessionManager {
	private static final Logger LOGGER = LoggerFactory.getLogger("aibuilder");

	// Re-read from disk at the start of each /build so config edits apply without
	// restarting Minecraft; hence not final.
	private AiBuilderConfig config;
	private final UsageTracker usageTracker = new UsageTracker();
	private final BuildLibrary library = new BuildLibrary();
	/** The last completed design's JSON per player, so /buildsave can keep it. */
	private final Map<UUID, String> lastPlanJson = new ConcurrentHashMap<>();
	/** Accumulated long-prompt text per player (Minecraft caps a single command at 256 chars). */
	private final Map<UUID, StringBuilder> promptBuffers = new ConcurrentHashMap<>();
	private final Map<UUID, BuildSession> sessions = new ConcurrentHashMap<>();
	private final Map<UUID, Deque<List<BuildSession.UndoEntry>>> undoHistory = new HashMap<>();
	private final List<RestoreJob> restoreJobs = new ArrayList<>();
	// Not final: leaving a singleplayer world fires SERVER_STOPPING, which shuts this
	// executor down. Opening another world reuses this same manager, so we must be able
	// to spin up a fresh executor - otherwise the next /build hits a dead worker and
	// throws RejectedExecutionException.
	private ExecutorService executor = newExecutor();

	private static ExecutorService newExecutor() {
		return Executors.newSingleThreadExecutor(runnable -> {
			Thread thread = new Thread(runnable, "aibuilder-ai");
			thread.setDaemon(true);
			return thread;
		});
	}

	private record RestoreJob(ServerLevel level, List<BuildSession.UndoEntry> entries, int[] cursor) {
	}

	public BuildSessionManager(AiBuilderConfig config) {
		this.config = config;
	}

	public AiBuilderConfig config() {
		return config;
	}

	// ------------------------------------------------------------------ /buildset

	/** Applies an in-game config change, persists it to disk, and returns a confirmation line. */
	public synchronized String applySetting(String key, String value) {
		config = AiBuilderConfig.load(); // start from what's on disk
		String result;
		switch (key.toLowerCase(java.util.Locale.ROOT)) {
			case "model" -> {
				config.cliModel = value.equalsIgnoreCase("default") ? "" : value.toLowerCase(java.util.Locale.ROOT);
				result = "AI model set to " + (config.cliModel.isBlank() ? "your account default" : config.cliModel);
			}
			case "timeout" -> {
				int seconds = parsePositiveInt(value);
				if (seconds < 30 || seconds > 3600) {
					return "timeout must be between 30 and 3600 seconds";
				}
				config.timeoutSeconds = seconds;
				result = "Design timeout set to " + seconds + "s";
			}
			case "speed" -> {
				int bpt = parsePositiveInt(value);
				if (bpt < 1 || bpt > 200) {
					return "speed (blocks per tick) must be between 1 and 200";
				}
				config.blocksPerTick = bpt;
				result = "Build speed set to " + bpt + " blocks/tick";
			}
			default -> {
				return "Unknown setting '" + key + "'. Try: model, timeout, speed";
			}
		}
		config.save();
		return result;
	}

	public String settingsSummary() {
		AiBuilderConfig c = AiBuilderConfig.load();
		return "AI Builder settings - model: " + (c.cliModel == null || c.cliModel.isBlank() ? "account default" : c.cliModel)
				+ ", timeout: " + c.timeoutSeconds + "s, speed: " + c.blocksPerTick + " blocks/tick, backend: " + c.backend;
	}

	private static int parsePositiveInt(String value) {
		try {
			return Integer.parseInt(value.trim());
		} catch (NumberFormatException e) {
			return -1;
		}
	}

	// ------------------------------------------------------------------ long prompts (/buildadd, /buildgo)

	/** Appends a chunk to the player's pending prompt, for descriptions longer than one command. */
	public void addToPrompt(ServerPlayer player, String text) {
		StringBuilder buf = promptBuffers.computeIfAbsent(player.getUUID(), k -> new StringBuilder());
		if (buf.length() > 0) {
			buf.append(' ');
		}
		buf.append(text.trim());
		String full = buf.toString();
		tell(player, "✍ Added (" + full.length() + " chars so far): "
				+ (full.length() <= 120 ? full : full.substring(0, 120) + "..."), ChatFormatting.AQUA);
		tell(player, "Add more with /buildadd, then /buildgo to build it (/buildclear to reset).",
				ChatFormatting.DARK_GRAY);
	}

	/** Runs the accumulated prompt as a build, then clears the buffer. */
	public void runBufferedBuild(ServerPlayer player) {
		StringBuilder buf = promptBuffers.get(player.getUUID());
		if (buf == null || buf.length() == 0) {
			tell(player, "Nothing queued. Use /buildadd <text> (repeat for long prompts), then /buildgo.",
					ChatFormatting.RED);
			return;
		}
		String prompt = buf.toString().trim();
		promptBuffers.remove(player.getUUID());
		startBuild(player, prompt);
	}

	public void clearPrompt(ServerPlayer player) {
		promptBuffers.remove(player.getUUID());
		tell(player, "Cleared your queued build prompt.", ChatFormatting.YELLOW);
	}

	// ------------------------------------------------------------------ save / replay / ideas

	/** Saves the player's most recent finished build under a name. */
	public void saveLastBuild(ServerPlayer player, String name) {
		String json = lastPlanJson.get(player.getUUID());
		if (json == null) {
			tell(player, "Build something first, then /buildsave <name> to keep it.", ChatFormatting.RED);
			return;
		}
		if (!name.matches("[A-Za-z0-9_-]{1,32}")) {
			tell(player, "Pick a simple name: 1-32 letters, numbers, - or _ (no spaces).", ChatFormatting.RED);
			return;
		}
		library.put(name, json);
		tell(player, "💾 Saved as \"" + name + "\". Rebuild it anytime with /buildmake " + name
				+ " (free - no AI).", ChatFormatting.GREEN);
	}

	/** Rebuilds a saved design in front of the player without calling the AI. */
	public void buildSaved(ServerPlayer player, String name) {
		if (sessions.containsKey(player.getUUID())) {
			tell(player, "You already have a build in progress. Use /buildcancel first.", ChatFormatting.RED);
			return;
		}
		String json = library.get(name);
		if (json == null) {
			tell(player, "No saved build called \"" + name + "\". See yours with /buildlist.", ChatFormatting.RED);
			return;
		}
		config = AiBuilderConfig.load();
		MinecraftServer server = player.level().getServer();
		BuildSession session = new BuildSession(player.getUUID(), "saved:" + name,
				(ServerLevel) player.level(), player.blockPosition(), player.getYRot());
		sessions.put(player.getUUID(), session);

		BuildPlan plan;
		try {
			plan = PlanParser.parse(json, config);
		} catch (PlanParser.PlanException e) {
			failSession(server, session, "that saved build is no longer valid: " + e.getMessage());
			return;
		}
		session.planJson = json;
		tell(player, "🔁 Rebuilding saved \"" + name + "\" - no AI needed...", ChatFormatting.AQUA);
		beginPlacement(server, session, plan);
	}

	public String savedList() {
		List<String> names = library.names();
		if (names.isEmpty()) {
			return "No saved builds yet. After a build finishes, use /buildsave <name>.";
		}
		return "Saved builds (" + names.size() + "): " + String.join(", ", names)
				+ "  -  rebuild with /buildmake <name>";
	}

	public List<String> ideas() {
		return List.of(
				"Try one of these (type /build <idea>):",
				"  a cozy log cabin with a stone chimney and a porch",
				"  a 3-story medieval watchtower with a spiral staircase",
				"  a small wizard's cottage with a garden and lanterns",
				"  a Japanese-style pagoda with a red roof",
				"  a hidden 2x2 piston door in a stone wall, opened by a lever",
				"  an automatic sugar cane farm with an observer and pistons",
				"  a working redstone combination lock with 3 levers",
				"  a suspension bridge across a ravine",
				"  a lighthouse with a glowstone beacon on top",
				"  a fountain plaza with symmetric water features",
				"Tip: /buildset model opus for tricky redstone; sonnet or haiku for quick builds.");
	}

	// ------------------------------------------------------------------ /build

	public void startBuild(ServerPlayer player, String request) {
		if (sessions.containsKey(player.getUUID())) {
			tell(player, "You already have a build in progress. Use /buildcancel first.", ChatFormatting.RED);
			return;
		}

		// Pick up any edits to config/aibuilder.json without a game restart.
		config = AiBuilderConfig.load();

		BuildSession session = new BuildSession(player.getUUID(), request,
				(ServerLevel) player.level(), player.blockPosition(), player.getYRot());
		session.backend = createBackend();
		sessions.put(player.getUUID(), session);

		tell(player, "🤖 Designing \"" + request + "\" - this can take a minute or two...", ChatFormatting.AQUA);
		MinecraftServer server = player.level().getServer();
		generateAsync(server, session, null, 0);
	}

	private AiBackend createBackend() {
		if ("api".equalsIgnoreCase(config.backend)) {
			return new AnthropicApiBackend(config);
		}
		return new ClaudeCliBackend(config);
	}

	private void generateAsync(MinecraftServer server, BuildSession session, String previousError, int attempt) {
		// A previous world's SERVER_STOPPING may have shut the executor down; revive it.
		if (executor.isShutdown()) {
			executor = newExecutor();
		}
		executor.submit(() -> {
			try {
				AiBackend.GenResult result = session.backend.generate(session.request, previousError);
				usageTracker.record(result.tokensUsed());
				server.execute(() -> {
					session.tokensUsed = result.tokensUsed();
					warnAboutUsage(server, session);
					onGenerated(server, session, result.text(), attempt);
				});
			} catch (AiBackend.BackendException e) {
				server.execute(() -> failSession(server, session, e.getMessage()));
			} catch (InterruptedException e) {
				Thread.currentThread().interrupt();
			} catch (Exception e) {
				LOGGER.error("Unexpected error while generating a build", e);
				server.execute(() -> failSession(server, session, "Unexpected error: " + e.getMessage()));
			}
		});
	}

	/**
	 * Chat warning when the mod's own AI usage crosses the configured share of the
	 * 5-hour budget. Best effort: Claude doesn't expose the account's real meter,
	 * and Claude usage outside this mod counts against the same limit.
	 */
	private void warnAboutUsage(MinecraftServer server, BuildSession session) {
		if (usageTracker.shouldWarn(config.fiveHourTokenBudget, config.usageWarnPercent)) {
			ServerPlayer player = player(server, session.playerId);
			if (player != null) {
				int percent = usageTracker.percentUsed(config.fiveHourTokenBudget);
				tell(player, "⚠ Heads up: builds have used ~" + percent + "% of your 5-hour Claude budget ("
						+ usageTracker.windowTokens() + " of " + config.fiveHourTokenBudget
						+ " tokens). It refills as time passes.", ChatFormatting.GOLD);
				tell(player, "(Estimate of this mod's usage only - tune fiveHourTokenBudget in config/aibuilder.json)",
						ChatFormatting.DARK_GRAY);
			}
		}
	}

	private void onGenerated(MinecraftServer server, BuildSession session, String rawText, int attempt) {
		if (session.state == BuildSession.State.CANCELLED) {
			sessions.remove(session.playerId, session);
			return;
		}
		BuildPlan plan;
		try {
			plan = PlanParser.parse(rawText, config);
		} catch (PlanParser.PlanException e) {
			if (config.retryOnParseError && attempt == 0) {
				ServerPlayer player = player(server, session.playerId);
				if (player != null) {
					tell(player, "The first design didn't come out right (" + e.getMessage()
							+ "). Asking the AI to fix it...", ChatFormatting.YELLOW);
				}
				generateAsync(server, session, e.getMessage(), 1);
				return;
			}
			failSession(server, session, e.getMessage());
			return;
		}

		// Keep the design's JSON so the player can /buildsave it after it finishes.
		session.planJson = PlanParser.extractJson(rawText);
		beginPlacement(server, session, plan);
	}

	/** Spawns the builder and starts placement for an already-parsed plan (AI or saved). */
	private void beginPlacement(MinecraftServer server, BuildSession session, BuildPlan plan) {
		session.preparePlacements(plan);
		Vec3 spawnPos = Vec3.atCenterOf(session.anchor).add(0, 2.5, 0);
		session.builder = BuilderMob.spawn(session.level, spawnPos, config);
		session.state = BuildSession.State.PLACING;

		// Start fanfare: a "ding" plus a burst of sparks where the build will rise.
		Vec3 center = Vec3.atCenterOf(session.anchor).add(0, 1.0, 0);
		session.level.playSound(null, session.anchor, SoundEvents.EXPERIENCE_ORB_PICKUP,
				SoundSource.PLAYERS, 0.9F, 1.3F);
		session.level.sendParticles(ParticleTypes.END_ROD, center.x, center.y, center.z, 50, 1.6, 1.0, 1.6, 0.06);
		session.level.sendParticles(ParticleTypes.HAPPY_VILLAGER, center.x, center.y, center.z, 25, 1.4, 0.8, 1.4, 0.1);

		ServerPlayer player = player(server, session.playerId);
		if (player != null) {
			tell(player, "⚒ Design ready: " + plan.name() + " (" + plan.sizeX() + "x" + plan.sizeY() + "x"
					+ plan.sizeZ() + ", " + session.totalPlacements() + " blocks). Building...", ChatFormatting.GREEN);
			if (plan.warnings() != null && !plan.warnings().isEmpty()) {
				tell(player, "(Minor: " + String.join("; ", plan.warnings())
						+ " - building everything else.)", ChatFormatting.DARK_GRAY);
			}
		}
	}

	private void failSession(MinecraftServer server, BuildSession session, String message) {
		// If this session is no longer the active one, the player already cancelled it -
		// and cancelling kills the AI process, which then reports a non-zero exit. Don't
		// surface a scary "Build failed (code 1)" for a build the player stopped on purpose.
		if (!sessions.remove(session.playerId, session)) {
			return;
		}
		session.state = BuildSession.State.FAILED;
		ServerPlayer player = player(server, session.playerId);
		if (player != null) {
			tell(player, "❌ Build failed: " + message, ChatFormatting.RED);
		}
	}

	// ------------------------------------------------------------------ /undo & /buildcancel

	public void undo(ServerPlayer player) {
		BuildSession active = sessions.get(player.getUUID());
		if (active != null) {
			tell(player, "A build is still in progress - /buildcancel it first, then /undo.", ChatFormatting.RED);
			return;
		}
		Deque<List<BuildSession.UndoEntry>> history = undoHistory.get(player.getUUID());
		if (history == null || history.isEmpty()) {
			tell(player, "Nothing to undo.", ChatFormatting.RED);
			return;
		}
		List<BuildSession.UndoEntry> entries = history.pop();
		restoreJobs.add(new RestoreJob((ServerLevel) player.level(), entries, new int[]{entries.size() - 1}));
		tell(player, "↩ Undoing " + entries.size() + " blocks...", ChatFormatting.AQUA);
	}

	public void cancel(ServerPlayer player) {
		BuildSession session = sessions.remove(player.getUUID());
		if (session == null) {
			tell(player, "No build in progress.", ChatFormatting.RED);
			return;
		}
		boolean placedSomething = !session.undoEntries.isEmpty();
		session.cancel();
		if (placedSomething) {
			pushUndo(player.getUUID(), session.undoEntries);
			tell(player, "Build cancelled. " + session.placedSoFar()
					+ " blocks were already placed - /undo removes them.", ChatFormatting.YELLOW);
		} else {
			tell(player, "Build cancelled.", ChatFormatting.YELLOW);
		}
	}

	private void pushUndo(UUID playerId, List<BuildSession.UndoEntry> entries) {
		Deque<List<BuildSession.UndoEntry>> history =
				undoHistory.computeIfAbsent(playerId, key -> new ArrayDeque<>());
		history.push(new ArrayList<>(entries));
		while (history.size() > Math.max(1, config.undoHistory)) {
			history.removeLast();
		}
	}

	// ------------------------------------------------------------------ tick pump

	public void tick(MinecraftServer server) {
		Iterator<Map.Entry<UUID, BuildSession>> iterator = sessions.entrySet().iterator();
		while (iterator.hasNext()) {
			BuildSession session = iterator.next().getValue();
			if (session.state != BuildSession.State.PLACING) {
				continue;
			}
			boolean done;
			try {
				done = session.tickPlacement(config);
			} catch (Exception e) {
				LOGGER.error("Error while placing blocks", e);
				iterator.remove();
				session.cancel();
				continue;
			}
			ServerPlayer player = player(server, session.playerId);
			if (done) {
				session.state = BuildSession.State.DONE;
				if (session.builder != null) {
					session.builder.celebrate();
					session.builder.remove();
				}
				// Completion fanfare.
				session.level.playSound(null, session.anchor, SoundEvents.PLAYER_LEVELUP,
						SoundSource.PLAYERS, 1.0F, 1.0F);
				pushUndo(session.playerId, session.undoEntries);
				iterator.remove();
				if (session.planJson != null) {
					lastPlanJson.put(session.playerId, session.planJson);
				}
				if (player != null) {
					tell(player, "✅ " + session.plan.name() + " is finished!", ChatFormatting.GREEN);
					if (session.plan.notes() != null && !session.plan.notes().isBlank()) {
						tell(player, session.plan.notes(), ChatFormatting.GRAY);
					}
					if (session.tokensUsed > 0) {
						tell(player, "🔢 This design used ~" + String.format("%,d", session.tokensUsed)
								+ " tokens.", ChatFormatting.GRAY);
					} else {
						tell(player, "🔢 Rebuilt from a saved design - no AI tokens used.", ChatFormatting.GRAY);
					}
					tell(player, "💾 Like it? /buildsave <name> keeps it - then /buildmake <name> rebuilds it "
							+ "anytime for free. (/undo removes it)", ChatFormatting.DARK_GRAY);
				}
			} else if (player != null && session.wantsProgressMessage()) {
				tell(player, "Building... " + session.placedSoFar() + "/" + session.totalPlacements()
						+ " blocks", ChatFormatting.GRAY);
			}
		}

		// Undo restores run without the mob, a big batch per tick, in reverse order.
		Iterator<RestoreJob> restores = restoreJobs.iterator();
		while (restores.hasNext()) {
			RestoreJob job = restores.next();
			int budget = 500;
			int index = job.cursor()[0];
			while (budget-- > 0 && index >= 0) {
				BuildSession.UndoEntry entry = job.entries().get(index--);
				job.level().setBlock(entry.pos(), entry.previousState(), 3);
			}
			job.cursor()[0] = index;
			if (index < 0) {
				restores.remove();
			}
		}
	}

	// ------------------------------------------------------------------ lifecycle

	public void shutdown() {
		for (BuildSession session : sessions.values()) {
			session.cancel();
		}
		sessions.clear();
		executor.shutdownNow();
	}

	/** True if this entity UUID is one of our currently active builder mobs. */
	public boolean isActiveBuilder(UUID entityId) {
		for (BuildSession session : sessions.values()) {
			if (session.builder != null && entityId.equals(session.builder.entityId())) {
				return true;
			}
		}
		return false;
	}

	private static ServerPlayer player(MinecraftServer server, UUID id) {
		return server.getPlayerList().getPlayer(id);
	}

	private static void tell(ServerPlayer player, String message, ChatFormatting color) {
		player.sendSystemMessage(Component.literal(message).withStyle(color));
	}
}
