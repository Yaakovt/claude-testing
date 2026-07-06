package com.aibuilder.build;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import net.fabricmc.loader.api.FabricLoader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Saved builds: a name -> design-JSON map persisted to config/aibuilder_builds.json.
 * Replaying a saved build re-parses its stored JSON, so it costs no AI tokens.
 */
public class BuildLibrary {
	private static final Logger LOGGER = LoggerFactory.getLogger("aibuilder");
	private static final Gson GSON = new Gson();

	private final Path file;
	private final Map<String, String> builds = new LinkedHashMap<>();

	public BuildLibrary() {
		this.file = FabricLoader.getInstance().getConfigDir().resolve("aibuilder_builds.json");
		load();
	}

	public synchronized void put(String name, String planJson) {
		builds.put(name, planJson);
		persist();
	}

	public synchronized String get(String name) {
		return builds.get(name);
	}

	public synchronized boolean remove(String name) {
		boolean removed = builds.remove(name) != null;
		if (removed) {
			persist();
		}
		return removed;
	}

	public synchronized List<String> names() {
		return new ArrayList<>(builds.keySet());
	}

	private void load() {
		try {
			if (Files.exists(file)) {
				Map<String, String> loaded = GSON.fromJson(Files.readString(file, StandardCharsets.UTF_8),
						new TypeToken<LinkedHashMap<String, String>>() {
						}.getType());
				if (loaded != null) {
					builds.putAll(loaded);
				}
			}
		} catch (Exception e) {
			LOGGER.warn("Couldn't read saved builds, starting empty", e);
		}
	}

	private void persist() {
		try {
			Files.writeString(file, GSON.toJson(builds), StandardCharsets.UTF_8);
		} catch (Exception e) {
			LOGGER.warn("Couldn't save builds library", e);
		}
	}
}
