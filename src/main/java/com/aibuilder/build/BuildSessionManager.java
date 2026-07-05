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
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
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

	private final AiBuilderConfig config;
	private final UsageTracker usageTracker = new UsageTracker();
	private final Map<UUID, BuildSession> sessions = new ConcurrentHashMap<>();
	private final Map<UUID, Deque<List<BuildSession.UndoEntry>>> undoHistory = new HashMap<>();
	private final List<RestoreJob> restoreJobs = new ArrayList<>();
	private final ExecutorService executor = Executors.newSingleThreadExecutor(runnable -> {
		Thread thread = new Thread(runnable, "aibuilder-ai");
		thread.setDaemon(true);
		return thread;
	});

	private record RestoreJob(ServerLevel level, List<BuildSession.UndoEntry> entries, int[] cursor) {
	}

	public BuildSessionManager(AiBuilderConfig config) {
		this.config = config;
	}

	public AiBuilderConfig config() {
		return config;
	}

	// ------------------------------------------------------------------ /build

	public void startBuild(ServerPlayer player, String request) {
		if (sessions.containsKey(player.getUUID())) {
			tell(player, "You already have a build in progress. Use /buildcancel first.", ChatFormatting.RED);
			return;
		}

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
		executor.submit(() -> {
			try {
				AiBackend.GenResult result = session.backend.generate(session.request, previousError);
				usageTracker.record(result.tokensUsed());
				server.execute(() -> {
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

		session.preparePlacements(plan);
		Vec3 spawnPos = Vec3.atCenterOf(session.anchor).add(0, 2.5, 0);
		session.builder = BuilderMob.spawn(session.level, spawnPos, config);
		session.state = BuildSession.State.PLACING;

		ServerPlayer player = player(server, session.playerId);
		if (player != null) {
			tell(player, "⚒ Design ready: " + plan.name() + " (" + plan.sizeX() + "x" + plan.sizeY() + "x"
					+ plan.sizeZ() + ", " + session.totalPlacements() + " blocks). Building...", ChatFormatting.GREEN);
		}
	}

	private void failSession(MinecraftServer server, BuildSession session, String message) {
		session.state = BuildSession.State.FAILED;
		sessions.remove(session.playerId, session);
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
				pushUndo(session.playerId, session.undoEntries);
				iterator.remove();
				if (player != null) {
					tell(player, "✅ " + session.plan.name() + " is finished!", ChatFormatting.GREEN);
					if (session.plan.notes() != null && !session.plan.notes().isBlank()) {
						tell(player, session.plan.notes(), ChatFormatting.GRAY);
					}
					tell(player, "(/undo removes it)", ChatFormatting.DARK_GRAY);
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
