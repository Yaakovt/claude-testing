package com.aibuilder.plan;

import com.aibuilder.config.AiBuilderConfig;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import net.minecraft.resources.Identifier;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.state.BlockState;

import java.util.ArrayList;
import java.util.List;

/**
 * Parses the AI's JSON build plan into a validated BuildPlan.
 * See PromptBuilder for the schema the AI is instructed to emit.
 */
public final class PlanParser {
	private PlanParser() {
	}

	public static class PlanException extends Exception {
		public PlanException(String message) {
			super(message);
		}
	}

	public static BuildPlan parse(String rawText, AiBuilderConfig config) throws PlanException {
		JsonObject root;
		try {
			root = JsonParser.parseString(extractJson(rawText)).getAsJsonObject();
		} catch (Exception e) {
			throw new PlanException("The AI's response was not valid JSON: " + shortMessage(e));
		}

		try {
			String name = root.has("name") ? root.get("name").getAsString() : "Build";
			String notes = root.has("notes") ? root.get("notes").getAsString() : "";

			JsonArray size = require(root, "size").getAsJsonArray();
			if (size.size() != 3) {
				throw new PlanException("'size' must have exactly 3 numbers");
			}
			int sx = size.get(0).getAsInt();
			int sy = size.get(1).getAsInt();
			int sz = size.get(2).getAsInt();
			if (sx < 1 || sy < 1 || sz < 1 || sx > config.maxSize || sy > config.maxSize || sz > config.maxSize) {
				throw new PlanException("Build size " + sx + "x" + sy + "x" + sz
						+ " is out of range (each axis must be 1.." + config.maxSize + ")");
			}

			JsonArray palette = require(root, "palette").getAsJsonArray();
			if (palette.isEmpty() || palette.size() > 256) {
				throw new PlanException("'palette' must have 1..256 entries");
			}
			List<BlockState> states = new ArrayList<>(palette.size());
			List<Boolean> attachables = new ArrayList<>(palette.size());
			List<String> warnings = new ArrayList<>();
			BlockState air = Blocks.AIR.defaultBlockState();
			// Be forgiving: one slightly-wrong block string must never throw away the whole design.
			// Fall back to the plain block (ignore bad properties), or skip it (air) if unknown.
			for (JsonElement entry : palette) {
				String spec = entry.getAsString();
				attachables.add(isAttachable(spec));
				try {
					states.add(BlockStateResolver.resolve(spec));
				} catch (BlockStateResolver.InvalidBlockException e) {
					BlockState fallback = BlockStateResolver.resolveBlockOnly(spec);
					if (fallback != null) {
						states.add(fallback);
						if (warnings.size() < 6) warnings.add("used a plain version of " + spec);
					} else {
						states.add(air);
						if (warnings.size() < 6) warnings.add("skipped unknown block " + spec);
					}
				}
			}

			JsonArray ops = require(root, "ops").getAsJsonArray();
			if (ops.isEmpty()) {
				throw new PlanException("the plan contains no ops");
			}
			if (ops.size() > config.maxOps) {
				throw new PlanException("the plan has " + ops.size() + " ops (limit " + config.maxOps + ")");
			}

			List<BuildPlan.Op> parsedOps = new ArrayList<>(ops.size());
			long volume = 0;
			for (JsonElement element : ops) {
				JsonObject op = element.getAsJsonObject();
				BuildPlan.Op parsed;
				if (op.has("f")) {
					JsonArray f = op.getAsJsonArray("f");
					if (f.size() != 7) throw new PlanException("a fill op must have 7 numbers [x1,y1,z1,x2,y2,z2,palette]");
					int x1 = f.get(0).getAsInt(), y1 = f.get(1).getAsInt(), z1 = f.get(2).getAsInt();
					int x2 = f.get(3).getAsInt(), y2 = f.get(4).getAsInt(), z2 = f.get(5).getAsInt();
					int index = f.get(6).getAsInt();
					parsed = new BuildPlan.Op(
							Math.min(x1, x2), Math.min(y1, y2), Math.min(z1, z2),
							Math.max(x1, x2), Math.max(y1, y2), Math.max(z1, z2),
							paletteState(states, index), attachables.get(index), List.of());
				} else if (op.has("s")) {
					JsonArray s = op.getAsJsonArray("s");
					if (s.size() != 4) throw new PlanException("a set op must have 4 numbers [x,y,z,palette]");
					int x = s.get(0).getAsInt(), y = s.get(1).getAsInt(), z = s.get(2).getAsInt();
					int index = s.get(3).getAsInt();
					List<BuildPlan.ContainerItem> items = op.has("items")
							? parseItems(op.getAsJsonArray("items")) : List.of();
					parsed = new BuildPlan.Op(x, y, z, x, y, z, paletteState(states, index), attachables.get(index), items);
				} else {
					throw new PlanException("each op must have an \"f\" (fill) or \"s\" (set) key");
				}
				checkBounds(parsed, sx, sy, sz);
				volume += parsed.volume();
				parsedOps.add(parsed);
			}
			if (volume > config.maxVolume) {
				throw new PlanException("the plan touches ~" + volume + " blocks (limit " + config.maxVolume
						+ "). Try asking for something smaller.");
			}

			return new BuildPlan(name, sx, sy, sz, notes, parsedOps, warnings);
		} catch (PlanException e) {
			throw e;
		} catch (Exception e) {
			throw new PlanException("The AI's plan had an unexpected shape: " + shortMessage(e));
		}
	}

	private static void checkBounds(BuildPlan.Op op, int sx, int sy, int sz) throws PlanException {
		if (op.x1() < 0 || op.y1() < 0 || op.z1() < 0 || op.x2() >= sx || op.y2() >= sy || op.z2() >= sz) {
			throw new PlanException("an op reaches outside the declared size " + sx + "x" + sy + "x" + sz);
		}
	}

	/**
	 * Parses a container "items" array: each entry is ["id", count] or ["id", count, slot].
	 * Invalid item ids are skipped (a bad item shouldn't fail the whole build).
	 */
	private static List<BuildPlan.ContainerItem> parseItems(JsonArray itemsArray) {
		List<BuildPlan.ContainerItem> result = new ArrayList<>();
		for (JsonElement element : itemsArray) {
			try {
				JsonArray entry = element.getAsJsonArray();
				if (entry.size() < 2) {
					continue;
				}
				String idText = entry.get(0).getAsString().trim();
				int count = Math.max(1, Math.min(64, entry.get(1).getAsInt()));
				int slot = entry.size() >= 3 ? entry.get(2).getAsInt() : -1;
				Identifier id = idText.contains(":")
						? Identifier.fromNamespaceAndPath(idText.split(":", 2)[0], idText.split(":", 2)[1])
						: Identifier.fromNamespaceAndPath("minecraft", idText);
				var item = net.minecraft.core.registries.BuiltInRegistries.ITEM.getOptional(id);
				item.ifPresent(value -> result.add(new BuildPlan.ContainerItem(value, count, slot)));
			} catch (Exception ignored) {
				// skip malformed / unknown item entries
			}
		}
		return result;
	}

	private static BlockState paletteState(List<BlockState> states, int index) throws PlanException {
		if (index < 0 || index >= states.size()) {
			throw new PlanException("op references palette index " + index + " but the palette has " + states.size() + " entries");
		}
		return states.get(index);
	}

	private static JsonElement require(JsonObject root, String key) throws PlanException {
		if (!root.has(key)) {
			throw new PlanException("the plan is missing '" + key + "'");
		}
		return root.get(key);
	}

	/** Strips markdown fences / prose and returns the substring from the first '{' to the last '}'. */
	public static String extractJson(String text) {
		int start = text.indexOf('{');
		int end = text.lastIndexOf('}');
		if (start >= 0 && end > start) {
			return text.substring(start, end + 1);
		}
		return text;
	}

	private static final java.util.List<String> ATTACHABLE_KEYWORDS = java.util.List.of(
			"torch", "button", "pressure_plate", "rail", "door", "sign", "banner", "carpet",
			"lever", "ladder", "vine", "lantern", "candle", "flower", "sapling", "redstone_wire",
			"repeater", "comparator", "tripwire", "bell", "chain", "rod", "pot", "fern", "grass",
			"bush", "roots", "fungus", "kelp", "seagrass", "bamboo", "coral_fan", "snow", "amethyst_cluster");

	/** Decides from the raw palette string whether a block needs its support placed first. */
	static boolean isAttachable(String spec) {
		String path = spec;
		int colon = path.indexOf(':');
		if (colon >= 0) path = path.substring(colon + 1);
		int bracket = path.indexOf('[');
		if (bracket >= 0) path = path.substring(0, bracket);
		for (String keyword : ATTACHABLE_KEYWORDS) {
			if (path.contains(keyword)) {
				return true;
			}
		}
		return false;
	}

	private static String shortMessage(Exception e) {
		String message = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
		return message.length() > 160 ? message.substring(0, 160) + "..." : message;
	}
}
