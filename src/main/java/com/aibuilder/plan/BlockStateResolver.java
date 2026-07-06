package com.aibuilder.plan;

import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.Identifier;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.properties.Property;

import java.util.Locale;
import java.util.Optional;

/**
 * Resolves vanilla blockstate strings like "minecraft:repeater[facing=north,delay=2]"
 * into BlockStates. Hand-rolled to keep the API surface small.
 */
public final class BlockStateResolver {
	private BlockStateResolver() {
	}

	public static class InvalidBlockException extends Exception {
		public InvalidBlockException(String message) {
			super(message);
		}
	}

	/**
	 * Lenient fallback: returns the block's default state ignoring any properties,
	 * or {@code null} if the block id itself is unknown. Never throws.
	 */
	public static BlockState resolveBlockOnly(String spec) {
		try {
			String idPart = spec.trim();
			int bracket = idPart.indexOf('[');
			if (bracket >= 0) {
				idPart = idPart.substring(0, bracket);
			}
			int brace = idPart.indexOf('{');
			if (brace >= 0) {
				idPart = idPart.substring(0, brace);
			}
			idPart = idPart.trim();
			Identifier id = idPart.contains(":")
					? Identifier.fromNamespaceAndPath(idPart.split(":", 2)[0], idPart.split(":", 2)[1])
					: Identifier.fromNamespaceAndPath("minecraft", idPart);
			return BuiltInRegistries.BLOCK.getOptional(id).map(Block::defaultBlockState).orElse(null);
		} catch (Exception e) {
			return null;
		}
	}

	public static BlockState resolve(String spec) throws InvalidBlockException {
		String trimmed = spec.trim();
		String idPart = trimmed;
		String propsPart = null;

		int bracket = trimmed.indexOf('[');
		if (bracket >= 0) {
			if (!trimmed.endsWith("]")) {
				throw new InvalidBlockException("'" + spec + "': missing closing ']'");
			}
			idPart = trimmed.substring(0, bracket);
			propsPart = trimmed.substring(bracket + 1, trimmed.length() - 1);
		}
		if (idPart.contains("{")) {
			throw new InvalidBlockException("'" + spec + "': NBT data is not supported");
		}

		Identifier id;
		try {
			id = idPart.contains(":")
					? Identifier.fromNamespaceAndPath(idPart.split(":", 2)[0], idPart.split(":", 2)[1])
					: Identifier.fromNamespaceAndPath("minecraft", idPart);
		} catch (Exception e) {
			throw new InvalidBlockException("'" + spec + "': not a valid block id");
		}
		// No denylist: any registered block is allowed. Unknown ids still error below.

		Optional<Block> block = BuiltInRegistries.BLOCK.getOptional(id);
		if (block.isEmpty()) {
			throw new InvalidBlockException("'" + spec + "': unknown block");
		}

		BlockState state = block.get().defaultBlockState();
		if (propsPart != null && !propsPart.isBlank()) {
			for (String pair : propsPart.split(",")) {
				String[] kv = pair.split("=", 2);
				if (kv.length != 2) {
					throw new InvalidBlockException("'" + spec + "': bad property '" + pair + "'");
				}
				state = withProperty(state, block.get(), kv[0].trim().toLowerCase(Locale.ROOT), kv[1].trim().toLowerCase(Locale.ROOT), spec);
			}
		}
		return state;
	}

	private static BlockState withProperty(BlockState state, Block block, String key, String value, String spec)
			throws InvalidBlockException {
		Property<?> property = null;
		for (Property<?> candidate : block.getStateDefinition().getProperties()) {
			if (candidate.getName().equals(key)) {
				property = candidate;
				break;
			}
		}
		if (property == null) {
			throw new InvalidBlockException("'" + spec + "': block has no property '" + key + "'");
		}
		return setValue(state, property, value, spec);
	}

	private static <T extends Comparable<T>> BlockState setValue(BlockState state, Property<T> property, String value, String spec)
			throws InvalidBlockException {
		Optional<T> parsed = property.getValue(value);
		if (parsed.isEmpty()) {
			throw new InvalidBlockException("'" + spec + "': invalid value '" + value + "' for property '" + property.getName() + "'");
		}
		return state.setValue(property, parsed.get());
	}
}
