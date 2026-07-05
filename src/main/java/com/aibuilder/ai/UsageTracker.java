package com.aibuilder.ai;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import net.fabricmc.loader.api.FabricLoader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * Tracks how many tokens THIS MOD has spent in the rolling 5-hour window that
 * Claude subscriptions use. It can't see the account's real meter (other Claude
 * usage counts against the same limit), so this is a best-effort estimate
 * measured against the budget configured in aibuilder.json.
 *
 * Persisted to config/aibuilder_usage.json so it survives restarts.
 */
public class UsageTracker {
	private static final Logger LOGGER = LoggerFactory.getLogger("aibuilder");
	private static final long WINDOW_MS = 5L * 60 * 60 * 1000;
	private static final Gson GSON = new Gson();

	private record Entry(long atMs, long tokens) {
	}

	private final Path file;
	private final List<Entry> entries = new ArrayList<>();
	private boolean warnedThisWindow;

	public UsageTracker() {
		this.file = FabricLoader.getInstance().getConfigDir().resolve("aibuilder_usage.json");
		load();
	}

	public synchronized void record(long tokens) {
		if (tokens <= 0) {
			return;
		}
		prune();
		entries.add(new Entry(System.currentTimeMillis(), tokens));
		save();
	}

	public synchronized long windowTokens() {
		prune();
		long total = 0;
		for (Entry entry : entries) {
			total += entry.tokens();
		}
		return total;
	}

	/**
	 * Returns the percent (0..100+) of the configured budget used in the current
	 * window, or -1 if the budget is disabled.
	 */
	public synchronized int percentUsed(long budgetTokens) {
		if (budgetTokens <= 0) {
			return -1;
		}
		return (int) Math.min(999, windowTokens() * 100 / budgetTokens);
	}

	/**
	 * True exactly once per window when usage first crosses the warn threshold;
	 * resets once usage decays back below it.
	 */
	public synchronized boolean shouldWarn(long budgetTokens, int warnPercent) {
		if (budgetTokens <= 0 || warnPercent <= 0) {
			return false;
		}
		int percent = percentUsed(budgetTokens);
		if (percent < warnPercent) {
			warnedThisWindow = false;
			return false;
		}
		if (warnedThisWindow) {
			return false;
		}
		warnedThisWindow = true;
		return true;
	}

	private void prune() {
		long cutoff = System.currentTimeMillis() - WINDOW_MS;
		Iterator<Entry> iterator = entries.iterator();
		while (iterator.hasNext()) {
			if (iterator.next().atMs() < cutoff) {
				iterator.remove();
			}
		}
	}

	private void load() {
		try {
			if (Files.exists(file)) {
				List<Entry> loaded = GSON.fromJson(Files.readString(file, StandardCharsets.UTF_8),
						new TypeToken<List<Entry>>() {
						}.getType());
				if (loaded != null) {
					entries.addAll(loaded);
					prune();
				}
			}
		} catch (Exception e) {
			LOGGER.warn("Couldn't read usage history, starting fresh", e);
		}
	}

	private void save() {
		try {
			Files.writeString(file, GSON.toJson(entries), StandardCharsets.UTF_8);
		} catch (Exception e) {
			LOGGER.warn("Couldn't save usage history", e);
		}
	}
}
