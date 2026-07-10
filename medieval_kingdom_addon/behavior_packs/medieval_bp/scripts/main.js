import { world, system } from "@minecraft/server";
import { buildVillage } from "./village.js";
import { initWorldgen, locateStructure, setWorldgen } from "./structures.js";
import { buildGraveyard, buildSiegeCamp, buildArena, buildBanditCamp } from "./arenas.js";
import "./bosses.js";
import "./relics.js";

const ARENA_BUILDERS = {
  graveyard: buildGraveyard,
  siegecamp: buildSiegeCamp,
  arena: buildArena,
  banditcamp: buildBanditCamp,
};

// ---------------------------------------------------------------
// scriptevent router (fired by /function build_*, locate_*, worldgen_*)
// ---------------------------------------------------------------
try {
  system.afterEvents.scriptEventReceive.subscribe((ev) => {
    const p = ev.sourceEntity;
    if (!p) return;
    if (ev.id === "md:village") {
      buildVillage(p.dimension, Math.floor(p.location.x), Math.floor(p.location.y), Math.floor(p.location.z), p.name);
    } else if (ev.id === "md:build") {
      const kind = (ev.message || "").trim();
      const builder = ARENA_BUILDERS[kind];
      if (builder) {
        builder(p.dimension, Math.floor(p.location.x) + 14, Math.floor(p.location.y), Math.floor(p.location.z));
      }
    } else if (ev.id === "md:locate") {
      locateStructure(p, (ev.message || "").trim());
    } else if (ev.id === "md:worldgen") {
      setWorldgen(p, (ev.message || "").trim() !== "off");
    }
  });
} catch {}

initWorldgen();

const HAMMER = "md:knight_hammer";
const FANG = "md:searing_fang";
const HEART = "md:dragon_heart";

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

// spawn a ring of particles around a point
function particleRing(dim, name, center, radius, count) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    safeParticle(dim, name, {
      x: center.x + Math.cos(a) * radius,
      y: center.y + 0.3,
      z: center.z + Math.sin(a) * radius,
    });
  }
}

// ---------------------------------------------------------------
// Weapon abilities
// ---------------------------------------------------------------
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
    particleRing(dim, "minecraft:critical_hit_emitter", loc, 2.2, 8);
    particleRing(dim, "minecraft:basic_crit_particle", loc, 3.2, 10);
    safeSound(dim, "mob.irongolem.attack", loc);
    try {
      const dx = tgt.location.x - src.location.x;
      const dz = tgt.location.z - src.location.z;
      const len = Math.max(0.01, Math.hypot(dx, dz));
      tgt.applyKnockback(dx / len, dz / len, 2.5, 0.55);
    } catch {}
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
    particleRing(dim, "minecraft:basic_flame_particle", loc, 1.6, 10);
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
// Dragon Heart: eat it for draconic power
// ---------------------------------------------------------------
try {
  world.afterEvents.itemCompleteUse.subscribe((ev) => {
    if (!ev.itemStack || ev.itemStack.typeId !== HEART) return;
    const p = ev.source;
    if (!p) return;
    try {
      p.addEffect("strength", 1800, { amplifier: 1 });
      p.addEffect("regeneration", 300, { amplifier: 2 });
      p.addEffect("fire_resistance", 1800, { amplifier: 0 });
      p.addEffect("absorption", 1800, { amplifier: 1 });
    } catch {}
    particleRing(p.dimension, "minecraft:mobflame_single", p.location, 1.5, 12);
    safeSound(p.dimension, "mob.enderdragon.growl", p.location);
  });
} catch {}

// ---------------------------------------------------------------
// Boss watcher: runs every 8 ticks across dimensions.
//  - Fire Dragon: teleports it down beside its target for tail whips,
//    casts the fire sphere at the player, bursts particles on phase change.
//  - Animated Armor: particle + sound bursts when plates shatter.
//  - Fire Sphere: growing flame ring while it channels.
// ---------------------------------------------------------------
const sphereCast = new Set();
const whipDone = new Set();
const dragonPhase = new Map();
const armorStage = new Map();

system.runInterval(() => {
  for (const dimName of ["overworld", "nether", "the_end"]) {
    let dim;
    try {
      dim = world.getDimension(dimName);
    } catch {
      continue;
    }

    // ---- dragons ----
    let dragons = [];
    try {
      dragons = dim.getEntities({ type: "md:fire_dragon" });
    } catch {
      continue;
    }
    for (const dragon of dragons) {
      let state, phase;
      try {
        state = dragon.getProperty("md:state");
        phase = dragon.getProperty("md:phase");
      } catch {
        continue;
      }

      // phase transition fanfare
      const prev = dragonPhase.get(dragon.id);
      if (prev !== undefined && prev !== phase) {
        const pname = phase === 1 ? "minecraft:snowflake_particle" : "minecraft:splash_spell_emitter";
        for (let r = 1; r <= 4; r++) particleRing(dim, pname, dragon.location, r, 10);
        safeSound(dim, "mob.enderdragon.growl", dragon.location);
      }
      dragonPhase.set(dragon.id, phase);

      // fire sphere: conjured on the nearest player
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

      // tail whip: slam down next to the target player
      if (state === "tailwhip") {
        if (!whipDone.has(dragon.id)) {
          whipDone.add(dragon.id);
          let players = [];
          try {
            players = dim.getPlayers({ location: dragon.location, maxDistance: 64, closest: 1 });
          } catch {}
          const target = players[0];
          if (target) {
            try {
              const t = target.location;
              dragon.teleport(
                { x: t.x + 3, y: t.y, z: t.z },
                { facingLocation: t }
              );
              safeParticle(dim, "minecraft:huge_explosion_emitter", { x: t.x + 3, y: t.y, z: t.z });
              particleRing(dim, "minecraft:lava_particle", t, 3, 12);
              particleRing(dim, "minecraft:basic_flame_particle", t, 4.5, 14);
              safeSound(dim, "mob.enderdragon.flap", t);
            } catch {}
          }
        }
      } else {
        whipDone.delete(dragon.id);
      }
    }

    // ---- fire spheres: burning aura while they grow ----
    let spheres = [];
    try {
      spheres = dim.getEntities({ type: "md:fire_sphere" });
    } catch {}
    for (const s of spheres) {
      particleRing(dim, "minecraft:basic_flame_particle", s.location, 2.5, 10);
      safeParticle(dim, "minecraft:mobflame_emitter", s.location);
    }

    // ---- animated armor: plate-shatter bursts ----
    let armors = [];
    try {
      armors = dim.getEntities({ type: "md:animated_armor" });
    } catch {}
    for (const a of armors) {
      let stage;
      try {
        stage = a.getProperty("md:stage");
      } catch {
        continue;
      }
      const prev = armorStage.get(a.id);
      if (prev !== undefined && stage > prev) {
        safeParticle(dim, "minecraft:knockback_roar_particle", a.location);
        particleRing(dim, "minecraft:critical_hit_emitter", a.location, 1.8, 10);
        safeSound(dim, "random.break", a.location);
        safeSound(dim, "mob.irongolem.hit", a.location);
      }
      armorStage.set(a.id, stage);
    }
  }
}, 8);
