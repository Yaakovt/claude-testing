// Relic powers — boss-dropped items that give the player active abilities.
// Each relic also carries a minecraft:cooldown component, so the item itself
// refuses to re-fire until it's off cooldown; the visuals here are gravy.
//
//  Talon of the Fire Dragon  — use: dash forward in a burst of flame
//  Soul Staff                — use: homing soul bolt; sneak-use: 2 soul wisps
//  Golem Gauntlet            — use: ground slam (knockup + damage ring)
//  Champion's Banner         — use: rally nearby allies (buffs)
//  Knight's Greatsword       — on hit: sweeping cleave around the target
//  Full dragonscale armor    — passive: permanent fire resistance
import { world, system } from "@minecraft/server";

const TALON = "md:dragon_talon";
const STAFF = "md:soul_staff";
const GAUNTLET = "md:golem_gauntlet";
const BANNER = "md:champion_banner";
const GREATSWORD = "md:greatsword";

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

function ring(dim, name, center, radius, count) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    safeParticle(dim, name, {
      x: center.x + Math.cos(a) * radius,
      y: center.y + 0.3,
      z: center.z + Math.sin(a) * radius,
    });
  }
}

// extra script-side gate for the staff's wisp summon (longer than the item CD)
const wispSummonAt = new Map();

world.afterEvents.itemUse.subscribe((ev) => {
  const p = ev.source;
  const item = ev.itemStack;
  if (!p || !item || p.typeId !== "minecraft:player") return;
  const dim = p.dimension;
  const loc = p.location;

  // ---- Dragonfire Dash ----
  if (item.typeId === TALON) {
    let view = { x: 0, y: 0, z: 1 };
    try {
      view = p.getViewDirection();
    } catch {}
    const hlen = Math.max(0.05, Math.hypot(view.x, view.z));
    try {
      p.applyKnockback(view.x / hlen, view.z / hlen, 5.2, 0.34);
    } catch {}
    safeSound(dim, "mob.blaze.shoot", loc);
    safeSound(dim, "mob.enderdragon.flap", loc);
    // flame trail that scorches everything you dash through
    for (let step = 1; step <= 8; step++) {
      const px = loc.x + (view.x / hlen) * step;
      const pz = loc.z + (view.z / hlen) * step;
      const at = { x: px, y: loc.y + 0.6, z: pz };
      system.runTimeout(() => {
        safeParticle(dim, "minecraft:mobflame_single", at);
        safeParticle(dim, "minecraft:basic_flame_particle", at);
        let hit = [];
        try {
          hit = dim.getEntities({
            location: at,
            maxDistance: 1.6,
            excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:xp_orb"],
          });
        } catch {}
        for (const e of hit) {
          try {
            e.applyDamage(4);
            e.setOnFire(5, true);
          } catch {}
        }
      }, step);
    }
  }

  // ---- Soul Staff ----
  if (item.typeId === STAFF) {
    let sneaking = false;
    try {
      sneaking = p.isSneaking;
    } catch {}
    if (sneaking) {
      const now = system.currentTick;
      if ((wispSummonAt.get(p.id) ?? -700) + 600 > now) {
        // still on cooldown — a soft click is the only feedback
        safeSound(dim, "note.bass", loc);
        return;
      }
      wispSummonAt.set(p.id, now);
      for (const side of [-1, 1]) {
        try {
          const w = dim.spawnEntity("md:soul_wisp", {
            x: loc.x + side * 1.5, y: loc.y + 1.5, z: loc.z,
          });
          safeParticle(dim, "minecraft:soul_particle", w.location);
        } catch {}
      }
      safeSound(dim, "mob.evocation_illager.prepare_summon", loc);
    } else {
      let view = { x: 0, y: 0, z: 1 };
      try {
        view = p.getViewDirection();
      } catch {}
      const from = { x: loc.x + view.x, y: loc.y + 1.5 + view.y, z: loc.z + view.z };
      try {
        const bolt = dim.spawnEntity("md:soul_bolt", from);
        const v = { x: view.x * 1.6, y: view.y * 1.6, z: view.z * 1.6 };
        try {
          const pc = bolt.getComponent("minecraft:projectile");
          if (pc) {
            pc.owner = p;
            pc.shoot(v);
          } else {
            bolt.applyImpulse(v);
          }
        } catch {
          bolt.applyImpulse(v);
        }
      } catch {}
      safeParticle(dim, "minecraft:soul_particle", from);
      safeSound(dim, "mob.shulker.shoot", loc);
    }
  }

  // ---- Golem Gauntlet ground slam ----
  if (item.typeId === GAUNTLET) {
    safeSound(dim, "mob.irongolem.attack", loc);
    safeParticle(dim, "minecraft:knockback_roar_particle", loc);
    for (let r = 1; r <= 3; r++) {
      system.runTimeout(() => {
        ring(dim, "minecraft:knockback_roar_particle", loc, r * 1.8, 6 + r * 5);
        ring(dim, "minecraft:basic_crit_particle", loc, r * 1.8 + 0.8, 8 + r * 5);
      }, r * 2);
    }
    let victims = [];
    try {
      victims = dim.getEntities({
        location: loc,
        maxDistance: 4.5,
        excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:xp_orb"],
      });
    } catch {}
    for (const e of victims) {
      try {
        e.applyDamage(10);
        const dx = e.location.x - loc.x, dz = e.location.z - loc.z;
        const len = Math.max(0.01, Math.hypot(dx, dz));
        e.applyKnockback(dx / len, dz / len, 1.6, 0.85);
      } catch {}
    }
  }

  // ---- Champion's Banner rally ----
  if (item.typeId === BANNER) {
    let allies = [p];
    try {
      allies = dim.getPlayers({ location: loc, maxDistance: 12 });
    } catch {}
    for (const a of allies) {
      try {
        a.addEffect("strength", 400, { amplifier: 0 });
        a.addEffect("speed", 400, { amplifier: 0 });
        a.addEffect("resistance", 400, { amplifier: 0 });
      } catch {}
      safeParticle(dim, "minecraft:totem_particle", a.location);
    }
    ring(dim, "minecraft:totem_particle", loc, 2.5, 16);
    safeSound(dim, "raid.horn", loc);
  }
});

// ---- Knight's Greatsword: sweeping cleave ----
world.afterEvents.entityHitEntity.subscribe((ev) => {
  const src = ev.damagingEntity;
  const tgt = ev.hitEntity;
  if (!src || !tgt || src.typeId !== "minecraft:player") return;
  let item;
  try {
    const eq = src.getComponent("minecraft:equippable");
    item = eq ? eq.getEquipment("Mainhand") : undefined;
  } catch {}
  if (!item || item.typeId !== GREATSWORD) return;

  const dim = tgt.dimension;
  const loc = tgt.location;
  ring(dim, "minecraft:critical_hit_emitter", loc, 2.4, 10);
  safeSound(dim, "game.player.attack.strong", loc);
  let nearby = [];
  try {
    nearby = dim.getEntities({
      location: loc,
      maxDistance: 3.0,
      excludeTypes: ["minecraft:player", "minecraft:item", "minecraft:xp_orb"],
    });
  } catch {}
  for (const e of nearby) {
    if (e.id === tgt.id) continue;
    try {
      e.applyDamage(5);
      const dx = e.location.x - src.location.x;
      const dz = e.location.z - src.location.z;
      const len = Math.max(0.01, Math.hypot(dx, dz));
      e.applyKnockback(dx / len, dz / len, 0.9, 0.3);
    } catch {}
  }
});

// ---- Dragonscale set bonus: full set = walking fire immunity ----
const DRAGON_SET = {
  Head: "md:dragon_helmet",
  Chest: "md:dragon_chestplate",
  Legs: "md:dragon_leggings",
  Feet: "md:dragon_boots",
};

system.runInterval(() => {
  let players = [];
  try {
    players = world.getAllPlayers();
  } catch {
    return;
  }
  for (const p of players) {
    let eq;
    try {
      eq = p.getComponent("minecraft:equippable");
    } catch {}
    if (!eq) continue;
    let full = true;
    for (const [slot, id] of Object.entries(DRAGON_SET)) {
      let it;
      try {
        it = eq.getEquipment(slot);
      } catch {}
      if (!it || it.typeId !== id) {
        full = false;
        break;
      }
    }
    if (full) {
      try {
        p.addEffect("fire_resistance", 90, { amplifier: 0, showParticles: false });
      } catch {}
      if (Math.random() < 0.3) {
        safeParticle(p.dimension, "minecraft:basic_flame_particle", {
          x: p.location.x, y: p.location.y + 0.2, z: p.location.z,
        });
      }
    }
  }
}, 60);
