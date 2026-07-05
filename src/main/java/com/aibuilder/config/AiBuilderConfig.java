package com.aibuilder.config;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import net.fabricmc.loader.api.FabricLoader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Config file at config/aibuilder.json, created with defaults on first launch.
 */
public class AiBuilderConfig {
	private static final Logger LOGGER = LoggerFactory.getLogger("aibuilder");
	private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();

	/** "claude-cli" (uses the Claude Code app + your Claude subscription) or "api" (needs apiKey). */
	public String backend = "claude-cli";
	/** Full path to the claude executable. Leave empty to auto-detect. */
	public String claudePath = "";
	/** Model passed to the Claude CLI. Empty = your account's default model. */
	public String cliModel = "";
	/** Anthropic API key for backend="api". May also be set via the ANTHROPIC_API_KEY environment variable. */
	public String apiKey = "";
	/** Model used by the direct API backend. */
	public String apiModel = "claude-opus-4-8";
	/** Max output tokens for the API backend (non-streaming; keep at or below 16000). */
	public int apiMaxTokens = 16000;
	/** Seconds to wait for the AI to design a build before giving up. */
	public int timeoutSeconds = 600;
	/** Maximum size of a build along each axis. */
	public int maxSize = 64;
	/** Maximum total volume (blocks) of a build. */
	public int maxVolume = 100000;
	/** Maximum number of ops in a build plan. */
	public int maxOps = 4000;
	/** How many blocks the builder mob places per tick once it is in position. */
	public int blocksPerTick = 3;
	/** Builder mob flight speed in blocks per tick. */
	public double builderSpeed = 0.9;
	/** Which mob builds for you (must be a living mob id). */
	public String builderMob = "minecraft:allay";
	/** Display name of the builder mob. */
	public String builderName = "Claude the Builder";
	/** How many past builds can be undone with /undo. */
	public int undoHistory = 3;
	/** Retry once with error feedback if the AI returns malformed JSON. */
	public boolean retryOnParseError = true;
	/**
	 * Estimated token budget per rolling 5-hour window, used only for the in-chat
	 * usage warning. Claude doesn't let the mod read your plan's real meter, so this
	 * tracks the mod's own consumption against this number. Tune it to your plan
	 * (check /usage inside Claude Code); 0 disables the warning.
	 */
	public long fiveHourTokenBudget = 250000;
	/** Warn in chat when the mod has used this percent of fiveHourTokenBudget. 0 disables. */
	public int usageWarnPercent = 75;

	public static AiBuilderConfig load() {
		Path path = FabricLoader.getInstance().getConfigDir().resolve("aibuilder.json");
		AiBuilderConfig config = new AiBuilderConfig();
		if (Files.exists(path)) {
			try {
				String json = Files.readString(path, StandardCharsets.UTF_8);
				AiBuilderConfig loaded = GSON.fromJson(json, AiBuilderConfig.class);
				if (loaded != null) {
					config = loaded;
				}
			} catch (Exception e) {
				LOGGER.error("Failed to read config/aibuilder.json, using defaults", e);
			}
		}
		// Always rewrite so new options appear in the file after mod updates.
		try {
			Files.createDirectories(path.getParent());
			Files.writeString(path, GSON.toJson(config), StandardCharsets.UTF_8);
		} catch (IOException e) {
			LOGGER.error("Failed to write config/aibuilder.json", e);
		}
		return config;
	}

	public String resolvedApiKey() {
		if (apiKey != null && !apiKey.isBlank()) {
			return apiKey;
		}
		String env = System.getenv("ANTHROPIC_API_KEY");
		return env == null ? "" : env;
	}
}
