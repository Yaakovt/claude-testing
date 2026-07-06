package com.aibuilder.plan;

import net.minecraft.world.item.Item;
import net.minecraft.world.level.block.state.BlockState;

import java.util.List;

/**
 * A parsed, validated build plan in canonical space:
 * the player stands at the origin looking toward +z, +y is up, y=0 is at the player's feet.
 */
public record BuildPlan(String name, int sizeX, int sizeY, int sizeZ, String notes, List<Op> ops) {

	/** An item to drop into a container block. slot < 0 means "next free slot". */
	public record ContainerItem(Item item, int count, int slot) {
	}

	/**
	 * A single operation in canonical space. Fill covers the inclusive cuboid [x1..x2, y1..y2, z1..z2].
	 * Attachable blocks (torches, dust, doors, ...) are placed after all solid blocks.
	 * {@code items} is non-empty only for single-block container ops (chests, barrels, ...).
	 */
	public record Op(int x1, int y1, int z1, int x2, int y2, int z2, BlockState state, boolean attachable,
					 List<ContainerItem> items) {
		public long volume() {
			return (long) (x2 - x1 + 1) * (y2 - y1 + 1) * (z2 - z1 + 1);
		}
	}

	public long totalVolume() {
		return ops.stream().mapToLong(Op::volume).sum();
	}
}
