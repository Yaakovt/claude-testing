package com.aibuilder.build;

import com.aibuilder.config.AiBuilderConfig;
import com.aibuilder.plan.BuildPlan;
import net.minecraft.core.BlockPos;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.sounds.SoundSource;
import net.minecraft.world.Container;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.block.Rotation;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraft.world.level.block.state.BlockState;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * One in-flight build for one player: from "designing" through mob-paced placement.
 * All world access happens on the server thread via tickPlacement().
 */
public class BuildSession {
	public enum State {GENERATING, PLACING, DONE, FAILED, CANCELLED}

	public record Placement(BlockPos pos, BlockState state, boolean attachable,
							List<BuildPlan.ContainerItem> items) {
	}

	public record UndoEntry(BlockPos pos, BlockState previousState) {
	}

	public final UUID playerId;
	public final String request;
	public final ServerLevel level;
	/** Player's feet position when they ran /build. */
	public final BlockPos anchor;
	/** Number of clockwise 90-degree rotations from the canonical (+z-facing) frame. */
	public final int rotationSteps;

	public volatile State state = State.GENERATING;
	public com.aibuilder.ai.AiBackend backend;

	public BuildPlan plan;
	/** Tokens the AI used to design this build (0 for a replayed/saved build). */
	public long tokensUsed;
	/** The design's JSON, kept so the player can /buildsave and replay it later. */
	public String planJson;
	private List<Placement> placements = List.of();
	private int cursor;
	private int placedCount;
	private int soundCycle;
	public final List<UndoEntry> undoEntries = new ArrayList<>();
	public BuilderMob builder;
	private int tickCounter;

	public BuildSession(UUID playerId, String request, ServerLevel level, BlockPos anchor, float yaw) {
		this.playerId = playerId;
		this.request = request;
		this.level = level;
		this.anchor = anchor;
		this.rotationSteps = Math.floorMod(Math.round(yaw / 90.0F), 4);
	}

	public Rotation rotation() {
		return switch (rotationSteps) {
			case 1 -> Rotation.CLOCKWISE_90;
			case 2 -> Rotation.CLOCKWISE_180;
			case 3 -> Rotation.COUNTERCLOCKWISE_90;
			default -> Rotation.NONE;
		};
	}

	/**
	 * Expands the plan's ops into a final per-position block map (later ops overwrite
	 * earlier ones), rotates everything into world space, and orders placement
	 * bottom-up with solid blocks before attachables.
	 */
	public void preparePlacements(BuildPlan buildPlan) {
		this.plan = buildPlan;
		Rotation rotation = rotation();
		Map<BlockPos, Placement> finalStates = new LinkedHashMap<>();

		int halfX = buildPlan.sizeX() / 2;
		for (BuildPlan.Op op : buildPlan.ops()) {
			BlockState rotated = op.state().rotate(rotation);
			for (int y = op.y1(); y <= op.y2(); y++) {
				for (int z = op.z1(); z <= op.z2(); z++) {
					for (int x = op.x1(); x <= op.x2(); x++) {
						// Center on the player, start 2 blocks in front, then rotate to face them.
						int cx = x - halfX;
						int cz = z + 2;
						int rx = cx, rz = cz;
						for (int i = 0; i < rotationSteps; i++) {
							int tmp = rx;
							rx = -rz;
							rz = tmp;
						}
						BlockPos world = anchor.offset(rx, y, rz);
						finalStates.remove(world); // re-insert so later ops also place later
						finalStates.put(world, new Placement(world, rotated, op.attachable(), op.items()));
					}
				}
			}
		}

		List<Placement> ordered = new ArrayList<>(finalStates.values());
		ordered.sort(Comparator
				.comparingInt((Placement p) -> p.attachable() ? 1 : 0)
				.thenComparingInt(p -> p.pos().getY()));
		this.placements = ordered;
		this.cursor = 0;
	}

	public int totalPlacements() {
		return placements.size();
	}

	public int placedSoFar() {
		return cursor;
	}

	/**
	 * Advances one tick of building: the mob flies toward the next block and,
	 * once close, places a small burst. Returns true when the build is finished.
	 */
	public boolean tickPlacement(AiBuilderConfig config) {
		tickCounter++;
		if (cursor >= placements.size()) {
			return true;
		}

		Placement next = placements.get(cursor);
		boolean inPosition = builder == null || builder.moveToward(next.pos());
		if (!inPosition) {
			return false;
		}

		int budget = Math.max(1, config.blocksPerTick);
		while (budget > 0 && cursor < placements.size()) {
			Placement placement = placements.get(cursor);
			if (builder != null && !builder.isNear(placement.pos())) {
				break; // fly there next tick
			}
			placeBlock(placement);
			cursor++;
			budget--;
		}
		return cursor >= placements.size();
	}

	private void placeBlock(Placement placement) {
		BlockState previous = level.getBlockState(placement.pos());
		if (previous == placement.state()) {
			return; // nothing to change; no undo entry, no effects
		}
		undoEntries.add(new UndoEntry(placement.pos(), previous));
		level.setBlock(placement.pos(), placement.state(), 3);
		placedCount++;

		if (!placement.items().isEmpty()) {
			fillContainer(placement);
		}

		if (!placement.state().isAir()) {
			double x = placement.pos().getX() + 0.5;
			double y = placement.pos().getY() + 0.5;
			double z = placement.pos().getZ() + 0.5;
			level.sendParticles(net.minecraft.core.particles.ParticleTypes.CLOUD, x, y, z, 2, 0.2, 0.2, 0.2, 0.01);
			if (++soundCycle % 3 == 0) {
				try {
					level.playSound(null, placement.pos(),
							placement.state().getSoundType().getPlaceSound(), SoundSource.BLOCKS, 0.5F, 1.0F);
				} catch (Exception ignored) {
				}
			}
		}
	}

	/** Drops the op's items into the container block just placed at this position, if it is one. */
	private void fillContainer(Placement placement) {
		try {
			BlockEntity blockEntity = level.getBlockEntity(placement.pos());
			if (!(blockEntity instanceof Container container)) {
				return;
			}
			int size = container.getContainerSize();
			int nextSlot = 0;
			for (BuildPlan.ContainerItem ci : placement.items()) {
				int slot = ci.slot() >= 0 ? ci.slot() : nextSlot++;
				if (slot >= 0 && slot < size) {
					container.setItem(slot, new ItemStack(ci.item(), ci.count()));
				}
			}
			container.setChanged();
		} catch (Exception ignored) {
			// never let a container-fill problem break the build
		}
	}

	/** Every ~3 seconds of placing, worth a progress message. */
	public boolean wantsProgressMessage() {
		return tickCounter % 60 == 0;
	}

	public void cancel() {
		state = State.CANCELLED;
		if (backend != null) {
			backend.cancel();
		}
		if (builder != null) {
			builder.remove();
			builder = null;
		}
	}
}
