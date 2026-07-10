import { world, system } from "@minecraft/server";

const HAMMER = "md:knight_hammer";
const FANG = "md:searing_fang";

function heldItem(player) {
  try {
    const eq = player.getComponent("minecraft:equippable");
    return eq ? eq.getEquipment("Mainhand") : undefined;
  } catch {
    return undefined;
  }
}

function safeParticle(dim, name, loc) {
  try {
    dim.spawnParticle(name, loc);
  } catch {}
}

function safeSound(dim, id, loc) {
  try {
    dim.playSound(id, loc);
  } catch {}
}

// ---------------------------------------------------------------
// Weapon abilities
// ---------------------------------------------------------------
// Warhammer of the Fallen Knight: every hit slams the ground -
// nearby enemies take splash damage and are launched away.
// Searing Fang: every hit ignites the target and scorches
// everything around it with a burst of flame.
world.afterEvents.entityHitEntity.subscribe((ev) => {
  const src = ev.damagingEntity;
  const tgt = ev.hitEntity;
  if (!src || !tgt || src.typeId !== "minecraft:player") return;

  const item = heldItem(src);
  if (!item) return;

  if (item.typeId === HAMMER) {
    const dim = tgt.dimension;
    const loc = tgt.location;
    safeParticle(dim, "minecraft:knockback_roar_particle", loc);
    safeSound(dim, "mob.irongolem.attack", loc);
    // launch the struck target
    try {
      const dx = tgt.location.x - src.location.x;
      const dz = tgt.location.z - src.location.z;
      const len = Math.max(0.01, Math.hypot(dx, dz));
      tgt.applyKnockback(dx / len, dz / len, 2.5, 0.55);
    } catch {}
    // shockwave: damage + knock back everything near the target
    let nearby = [];
    try {
      nearby = dim.getEntities({
        location: loc,
        maxDistance: 3.5,
        excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:xp_orb"],
      });
    } catch {}
    for (const e of nearby) {
      if (e.id === tgt.id) continue;
      try {
        e.applyDamage(7);
        const dx = e.location.x - loc.x;
        const dz = e.location.z - loc.z;
        const len = Math.max(0.01, Math.hypot(dx, dz));
        e.applyKnockback(dx / len, dz / len, 1.8, 0.45);
      } catch {}
    }
  }

  if (item.typeId === FANG) {
    const dim = tgt.dimension;
    const loc = tgt.location;
    safeParticle(dim, "minecraft:mobflame_single", loc);
    safeSound(dim, "mob.blaze.shoot", loc);
    try {
      tgt.setOnFire(6, true);
    } catch {}
    let nearby = [];
    try {
      nearby = dim.getEntities({
        location: loc,
        maxDistance: 2.5,
        excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:xp_orb"],
      });
    } catch {}
    for (const e of nearby) {
      if (e.id === tgt.id) continue;
      try {
        e.applyDamage(5);
        e.setOnFire(4, true);
      } catch {}
    }
  }
});

// ---------------------------------------------------------------
// Fire Dragon: cast the Fire Sphere AT THE PLAYER, not at itself.
// The dragon's behavior sets md:state to "sphere" while it channels;
// we watch for that and conjure the orb on the nearest player.
// ---------------------------------------------------------------
const sphereCast = new Set();

system.runInterval(() => {
  for (const dimName of ["overworld", "nether", "the_end"]) {
    let dim;
    try {
      dim = world.getDimension(dimName);
    } catch {
      continue;
    }
    let dragons = [];
    try {
      dragons = dim.getEntities({ type: "md:fire_dragon" });
    } catch {
      continue;
    }
    for (const dragon of dragons) {
      let state;
      try {
        state = dragon.getProperty("md:state");
      } catch {
        continue;
      }
      if (state === "sphere") {
        if (!sphereCast.has(dragon.id)) {
          sphereCast.add(dragon.id);
          let players = [];
          try {
            players = dim.getPlayers({ location: dragon.location, maxDistance: 64, closest: 1 });
          } catch {}
          const target = players[0];
          if (target) {
            try {
              dim.spawnEntity("md:fire_sphere", target.location);
              safeSound(dim, "mob.enderdragon.growl", target.location);
            } catch {}
          }
        }
      } else {
        sphereCast.delete(dragon.id);
      }
    }
  }
}, 8);
