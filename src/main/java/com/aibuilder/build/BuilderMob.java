package com.aibuilder.build;

import com.aibuilder.config.AiBuilderConfig;
import net.minecraft.core.BlockPos;
import net.minecraft.core.particles.ParticleTypes;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.Identifier;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EntitySpawnReason;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.Mob;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.phys.Vec3;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

/**
 * The visible builder: a vanilla mob (an allay by default) that the mod puppets
 * server-side - no AI goals, no gravity, flown from block to block by setPos each tick.
 */
public class BuilderMob {
	private static final Logger LOGGER = LoggerFactory.getLogger("aibuilder");
	/**
	 * True while we are adding our own builder to the world, so the orphan-cleanup
	 * ENTITY_LOAD listener doesn't delete the mob we just spawned. Server thread only.
	 */
	public static boolean spawningNow = false;

	/** How orphaned builders (left by a crash) are recognized when chunks load. */
	public static boolean looksLikeBuilder(Entity entity, String builderName) {
		return entity instanceof Mob mob
				&& mob.isNoAi()
				&& mob.isNoGravity()
				&& mob.getCustomName() != null
				&& mob.getCustomName().getString().equals(builderName);
	}

	private final ServerLevel level;
	private final double speed;
	private Mob entity;
	private int age;

	private BuilderMob(ServerLevel level, Mob entity, double speed) {
		this.level = level;
		this.entity = entity;
		this.speed = speed;
	}

	/** Spawns the builder hovering above the given position. Returns null if spawning failed. */
	public static BuilderMob spawn(ServerLevel level, Vec3 pos, AiBuilderConfig config) {
		try {
			String idText = config.builderMob == null || config.builderMob.isBlank()
					? "minecraft:allay" : config.builderMob;
			String[] parts = idText.contains(":") ? idText.split(":", 2) : new String[]{"minecraft", idText};
			Identifier id = Identifier.fromNamespaceAndPath(parts[0], parts[1]);
			Optional<EntityType<?>> type = BuiltInRegistries.ENTITY_TYPE.getOptional(id);
			if (type.isEmpty()) {
				LOGGER.warn("Unknown builderMob '{}' in config, no builder will be shown", idText);
				return null;
			}
			Entity created = type.get().create(level, EntitySpawnReason.COMMAND);
			if (!(created instanceof Mob mob)) {
				LOGGER.warn("builderMob '{}' is not a mob, no builder will be shown", idText);
				return null;
			}
			mob.setPos(pos.x, pos.y, pos.z);
			mob.setNoAi(true);
			mob.setNoGravity(true);
			mob.setInvulnerable(true);
			mob.setCustomName(Component.literal(config.builderName == null || config.builderName.isBlank()
					? "Claude the Builder" : config.builderName));
			mob.setCustomNameVisible(true);
			spawningNow = true;
			try {
				if (!level.addFreshEntity(mob)) {
					return null;
				}
			} finally {
				spawningNow = false;
			}
			return new BuilderMob(level, mob, Math.max(0.2, config.builderSpeed));
		} catch (Exception e) {
			LOGGER.warn("Failed to spawn builder mob; building without one", e);
			return null;
		}
	}

	public boolean isAlive() {
		return entity != null && entity.isAlive();
	}

	public java.util.UUID entityId() {
		return entity == null ? null : entity.getUUID();
	}

	/**
	 * Moves toward a hover point near the target block.
	 * Returns true when close enough to that block to place it.
	 */
	public boolean moveToward(BlockPos target) {
		if (!isAlive()) {
			return true; // never stall the build if the mob is gone
		}
		age++;
		Vec3 hover = hoverPoint(target);
		Vec3 current = entity.position();
		double distance = current.distanceTo(hover);

		if (distance > 48) {
			entity.setPos(hover.x, hover.y, hover.z);
			return true;
		}
		if (distance > 0.4) {
			double step = Math.min(speed, distance);
			Vec3 direction = hover.subtract(current).normalize();
			Vec3 next = current.add(direction.scale(step));
			entity.setPos(next.x, next.y, next.z);
			try {
				entity.lookAt(net.minecraft.commands.arguments.EntityAnchorArgument.Anchor.EYES,
						Vec3.atCenterOf(target));
			} catch (Exception ignored) {
			}
			// A sparkly trail so it's easy to follow the builder as it flies.
			if (age % 2 == 0) {
				level.sendParticles(ParticleTypes.END_ROD,
						next.x, next.y, next.z, 1, 0.05, 0.05, 0.05, 0.005);
			}
		}
		return entity.position().distanceTo(Vec3.atCenterOf(target)) <= 3.5;
	}

	/** True if the mob is close enough to also place this block in the same burst. */
	public boolean isNear(BlockPos pos) {
		return !isAlive() || entity.position().distanceTo(Vec3.atCenterOf(pos)) <= 4.5;
	}

	/** A gentle bobbing hover spot beside/above the target block. */
	private Vec3 hoverPoint(BlockPos target) {
		double bob = Math.sin(age * 0.15) * 0.15;
		return new Vec3(target.getX() + 0.5, target.getY() + 1.6 + bob, target.getZ() + 0.5);
	}

	public void celebrate() {
		if (!isAlive()) {
			return;
		}
		double x = entity.getX(), y = entity.getY() + 0.5, z = entity.getZ();
		level.sendParticles(ParticleTypes.HEART, x, y, z, 8, 0.4, 0.4, 0.4, 0.02);
		level.sendParticles(ParticleTypes.HAPPY_VILLAGER, x, y, z, 30, 0.5, 0.6, 0.5, 0.2);
		level.sendParticles(ParticleTypes.END_ROD, x, y, z, 25, 0.3, 0.5, 0.3, 0.15);
	}

	public void remove() {
		if (entity != null) {
			level.sendParticles(ParticleTypes.POOF,
					entity.getX(), entity.getY() + 0.3, entity.getZ(), 10, 0.3, 0.3, 0.3, 0.02);
			entity.discard();
			entity = null;
		}
	}
}
