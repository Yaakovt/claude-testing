// Boss brains that Bedrock behavior JSON can't express on its own:
//  - Fire Dragon: altitude leash, summons placed at the player, and
//    telegraphed per-phase super attacks (blockable — every super is either
//    a projectile volley or an explosion, both of which shields mitigate).
//  - Lich King: blink-teleports when struck, summons skeleton mages,
//    and a telegraphed Death Nova.
//  - Siege Golem: telegraphed ground slam with a shockwave ring.
//  - Black Knight: telegraphed rally charge (lunges at his target).
import { world, system } from "@minecraft/server";

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

// big visible wind-up: expanding rings + warning text so players can raise
// a shield in time
function telegraph(dim, center, particle, sound, warning) {
  safeSound(dim, sound, center);
  for (let step = 0; step < 4; step++) {
    system.runTimeout(() => {
      ring(dim, particle, center, 1.5 + step * 1.6, 10 + step * 4);
    }, step * 8);
  }
  let players = [];
  try {
    players = dim.getPlayers({ location: center, maxDistance: 40 });
  } catch {}
  for (const p of players) {
    try {
      p.onScreenDisplay.setActionBar(warning);
    } catch {}
    try {
      p.playSound("mob.enderdragon.growl", { volume: 0.6, pitch: 1.4 });
    } catch {}
  }
}

function nearestPlayer(dim, loc, dist) {
  try {
    const players = dim.getPlayers({ location: loc, maxDistance: dist, closest: 1 });
    return players[0];
  } catch {
    return undefined;
  }
}

// robust liveness check across API versions (isValid is a method on older
// @minecraft/server and a property on newer ones) — reading .location throws
// once an entity is removed, so this doubles as the guard the timers need.
function isAlive(e) {
  if (!e) return false;
  try {
    const v = e.isValid;
    if (typeof v === "function") return v.call(e);
    if (typeof v === "boolean") return v;
    void e.location;
    return true;
  } catch {
    return false;
  }
}

// spawn a projectile and hurl it at a target point (shield-blockable)
function hurl(dim, type, from, at, speed) {
  let proj;
  try {
    proj = dim.spawnEntity(type, from);
  } catch {
    return;
  }
  const dx = at.x - from.x, dy = at.y - from.y, dz = at.z - from.z;
  const len = Math.max(0.01, Math.hypot(dx, dy, dz));
  const v = { x: (dx / len) * speed, y: (dy / len) * speed, z: (dz / len) * speed };
  try {
    const pc = proj.getComponent("minecraft:projectile");
    if (pc) {
      pc.shoot(v);
      return;
    }
  } catch {}
  try {
    proj.applyImpulse(v);
  } catch {}
}

function groundAt(dim, x, yGuess, z) {
  for (let y = Math.floor(yGuess) + 6; y > Math.floor(yGuess) - 12; y--) {
    let b;
    try {
      b = dim.getBlock({ x: Math.floor(x), y, z: Math.floor(z) });
    } catch {
      continue;
    }
    if (b && b.typeId !== "minecraft:air") return y + 1;
  }
  return Math.floor(yGuess);
}

// ---------------------------------------------------------------
// Fire Dragon extras
// ---------------------------------------------------------------
const LEASH_ABOVE = 12; // max blocks the dragon may fly above its target

const summonDone = new Set();
const superDone = new Set();

function dragonTick(dim, dragon) {
  let state, phase;
  try {
    state = dragon.getProperty("md:state");
    phase = dragon.getProperty("md:phase");
  } catch {
    return;
  }

  // altitude leash — never soar out of the fight
  const target = nearestPlayer(dim, dragon.location, 64);
  if (target) {
    const excess = dragon.location.y - (target.location.y + LEASH_ABOVE);
    if (excess > 0) {
      const drop = Math.min(excess, 3);
      try {
        dragon.teleport(
          { x: dragon.location.x, y: dragon.location.y - drop, z: dragon.location.z },
          { facingLocation: target.location }
        );
        safeParticle(dim, "minecraft:dragon_breath_trail", dragon.location);
      } catch {}
    }
  }

  // summons appear around the player on the ground — not in the sky
  if (state === "summon") {
    if (!summonDone.has(dragon.id) && target) {
      summonDone.add(dragon.id);
      const t = target.location;
      const kind = phase >= 2 ? "md:plague_rat" : "md:frost_wisp";
      const n = phase >= 2 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const sx = t.x + Math.cos(a) * 3;
        const sz = t.z + Math.sin(a) * 3;
        const sy = groundAt(dim, sx, t.y, sz) + (kind === "md:frost_wisp" ? 1 : 0);
        try {
          dim.spawnEntity(kind, { x: sx, y: sy, z: sz });
          safeParticle(dim, "minecraft:knockback_roar_particle", { x: sx, y: sy, z: sz });
        } catch {}
      }
      safeSound(dim, "mob.enderdragon.growl", t);
    }
  } else {
    summonDone.delete(dragon.id);
  }

  // per-phase super attacks — long telegraph, then a blockable barrage
  if (state === "super") {
    if (!superDone.has(dragon.id) && target) {
      superDone.add(dragon.id);
      const dloc = { ...dragon.location };
      if (phase === 1) {
        telegraph(dim, dloc, "minecraft:snowflake_particle", "mob.enderdragon.growl",
          "§b§lThe dragon draws in a glacial breath — SHIELD UP!");
        ring(dim, "minecraft:snowflake_particle", target.location, 4, 16);
        system.runTimeout(() => {
          try {
            const t2 = isAlive(dragon) ? nearestPlayer(dim, dragon.location, 64) : undefined;
            const at = t2 ? t2.location : (isAlive(target) ? target.location : dloc);
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * Math.PI * 2;
              const from = {
                x: at.x + Math.cos(a) * 7,
                y: at.y + 8,
                z: at.z + Math.sin(a) * 7,
              };
              hurl(dim, "md:ice_shard", from, { x: at.x, y: at.y + 1, z: at.z }, 1.4);
            }
            ring(dim, "minecraft:snowflake_particle", at, 6, 24);
            safeSound(dim, "random.glass", at);
          } catch {}
        }, 40);
      } else if (phase === 2) {
        telegraph(dim, dloc, "minecraft:splash_spell_emitter", "mob.enderdragon.growl",
          "§2§lThe dragon's throat swells with venom — SHIELD UP!");
        ring(dim, "minecraft:splash_spell_emitter", target.location, 4, 16);
        system.runTimeout(() => {
          try {
            const t2 = isAlive(dragon) ? nearestPlayer(dim, dragon.location, 64) : undefined;
            const at = t2 ? t2.location : (isAlive(target) ? target.location : dloc);
            for (let i = 0; i < 9; i++) {
              const from = {
                x: at.x + (Math.random() - 0.5) * 8,
                y: at.y + 9 + Math.random() * 2,
                z: at.z + (Math.random() - 0.5) * 8,
              };
              hurl(dim, "md:venom_glob", from, { x: at.x, y: at.y + 1, z: at.z }, 1.3);
            }
            ring(dim, "minecraft:splash_spell_emitter", at, 6, 24);
            safeSound(dim, "mob.slime.big", at);
          } catch {}
        }, 40);
      }
    }
  } else {
    superDone.delete(dragon.id);
  }
}

// ---------------------------------------------------------------
// Lich King
// ---------------------------------------------------------------
const lichSummonDone = new Set();
const lichNovaDone = new Set();
const lichBlinkAt = new Map();

function lichTick(dim, lich) {
  let state;
  try {
    state = lich.getProperty("md:state");
  } catch {
    return;
  }
  const loc = lich.location;

  // ambient soul flames
  safeParticle(dim, "minecraft:soul_particle", {
    x: loc.x + (Math.random() - 0.5) * 1.4,
    y: loc.y + 1.5 + Math.random(),
    z: loc.z + (Math.random() - 0.5) * 1.4,
  });

  if (state === "summon") {
    if (!lichSummonDone.has(lich.id)) {
      lichSummonDone.add(lich.id);
      let stage = 0;
      try {
        stage = lich.getProperty("md:stage");
      } catch {}
      const n = stage >= 2 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random();
        const sx = loc.x + Math.cos(a) * 3;
        const sz = loc.z + Math.sin(a) * 3;
        const sy = groundAt(dim, sx, loc.y, sz);
        try {
          dim.spawnEntity("md:skeleton_mage", { x: sx, y: sy, z: sz });
          safeParticle(dim, "minecraft:soul_particle", { x: sx, y: sy + 1, z: sz });
          safeParticle(dim, "minecraft:knockback_roar_particle", { x: sx, y: sy, z: sz });
        } catch {}
      }
      safeSound(dim, "mob.evocation_illager.prepare_summon", loc);
    }
  } else {
    lichSummonDone.delete(lich.id);
  }

  if (state === "nova") {
    if (!lichNovaDone.has(lich.id)) {
      lichNovaDone.add(lich.id);
      const center = { x: loc.x, y: loc.y, z: loc.z };
      telegraph(dim, center, "minecraft:soul_particle", "mob.evocation_illager.prepare_attack",
        "§5§lThe Lich King gathers a DEATH NOVA — shield or flee!");
      system.runTimeout(() => {
        const at = isAlive(lich) ? lich.location : center;
        try {
          dim.createExplosion(at, 4.5, { breaksBlocks: false, causesFire: false, source: lich });
        } catch {}
        for (let r = 1; r <= 6; r++) ring(dim, "minecraft:soul_particle", at, r, 8 + r * 4);
        safeParticle(dim, "minecraft:huge_explosion_emitter", at);
        safeSound(dim, "mob.wither.death", at);
      }, 44);
    }
  } else {
    lichNovaDone.delete(lich.id);
  }
}

// blink away when struck (with a cooldown so he stays hittable)
try {
  world.afterEvents.entityHurt.subscribe((ev) => {
    const e = ev.hurtEntity;
    if (!e || e.typeId !== "md:lich_king") return;
    const now = system.currentTick;
    if ((lichBlinkAt.get(e.id) ?? -200) + 100 > now) return;
    if (Math.random() > 0.4) return;
    lichBlinkAt.set(e.id, now);
    const dim = e.dimension;
    const from = { ...e.location };
    const a = Math.random() * Math.PI * 2;
    const bx = from.x + Math.cos(a) * (4 + Math.random() * 4);
    const bz = from.z + Math.sin(a) * (4 + Math.random() * 4);
    const by = groundAt(dim, bx, from.y, bz);
    try {
      e.teleport({ x: bx, y: by, z: bz });
      for (const spot of [from, { x: bx, y: by, z: bz }]) {
        safeParticle(dim, "minecraft:soul_particle", { x: spot.x, y: spot.y + 1, z: spot.z });
        safeParticle(dim, "minecraft:knockback_roar_particle", spot);
      }
      safeSound(dim, "mob.endermen.portal", from);
    } catch {}
  });
} catch {}

// ---------------------------------------------------------------
// Siege Golem
// ---------------------------------------------------------------
const golemSlamDone = new Set();

function golemTick(dim, golem) {
  let state, stage;
  try {
    state = golem.getProperty("md:state");
    stage = golem.getProperty("md:stage");
  } catch {
    return;
  }
  const loc = golem.location;

  // exposed core sputters embers in the final stage
  if (stage >= 3) {
    safeParticle(dim, "minecraft:basic_flame_particle", {
      x: loc.x + (Math.random() - 0.5), y: loc.y + 1.8, z: loc.z + (Math.random() - 0.5),
    });
  }

  if (state === "slam") {
    if (!golemSlamDone.has(golem.id)) {
      golemSlamDone.add(golem.id);
      telegraph(dim, loc, "minecraft:basic_crit_particle", "mob.irongolem.throw",
        "§6§lThe Siege Golem raises its fists — GROUND SLAM incoming!");
      const slamOrigin = { x: loc.x, y: loc.y, z: loc.z };
      system.runTimeout(() => {
        const at = isAlive(golem) ? golem.location : slamOrigin;
        try {
          dim.createExplosion(at, 3.5, { breaksBlocks: false, causesFire: false, source: golem });
        } catch {}
        for (let r = 1; r <= 3; r++) {
          system.runTimeout(() => {
            ring(dim, "minecraft:knockback_roar_particle", at, r * 2.2, 6 + r * 6);
            ring(dim, "minecraft:basic_crit_particle", at, r * 2.2 + 1, 8 + r * 6);
          }, r * 3);
        }
        let victims = [];
        try {
          victims = dim.getEntities({
            location: at,
            maxDistance: 6.5,
            excludeTypes: ["minecraft:item", "minecraft:xp_orb"],
            excludeFamilies: ["golem_boss"],
          });
        } catch {}
        for (const v of victims) {
          try {
            const dx = v.location.x - at.x, dz = v.location.z - at.z;
            const len = Math.max(0.01, Math.hypot(dx, dz));
            v.applyKnockback(dx / len, dz / len, 2.2, 0.9);
          } catch {}
        }
        safeSound(dim, "mob.irongolem.attack", at);
      }, 34);
    }
  } else {
    golemSlamDone.delete(golem.id);
  }
}

// ---------------------------------------------------------------
// Black Knight
// ---------------------------------------------------------------
const bkChargeDone = new Set();
const bkStage = new Map();

function blackKnightTick(dim, bk) {
  let state, stage;
  try {
    state = bk.getProperty("md:state");
    stage = bk.getProperty("md:stage");
  } catch {
    return;
  }
  const loc = bk.location;

  // gear-break fanfare (shield, plume, cape) — same feel as the Animated Armor
  const prev = bkStage.get(bk.id);
  if (prev !== undefined && stage > prev) {
    safeParticle(dim, "minecraft:knockback_roar_particle", loc);
    ring(dim, "minecraft:critical_hit_emitter", loc, 1.6, 10);
    safeSound(dim, "random.break", loc);
    if (stage >= 3) safeSound(dim, "mob.wolf.growl", loc);
  }
  bkStage.set(bk.id, stage);

  if (stage >= 3) {
    safeParticle(dim, "minecraft:mobflame_single", {
      x: loc.x, y: loc.y + 2.1, z: loc.z,
    });
  }

  if (state === "guard") {
    ring(dim, "minecraft:basic_crit_particle", loc, 1.2, 6);
  }

  if (state === "charge") {
    if (!bkChargeDone.has(bk.id)) {
      bkChargeDone.add(bk.id);
      telegraph(dim, loc, "minecraft:critical_hit_emitter", "mob.irongolem.repair",
        "§c§lThe Black Knight lowers his blade — CHARGE incoming!");
      system.runTimeout(() => {
        try {
          if (!isAlive(bk)) return;
          const here = bk.location;
          const target = nearestPlayer(dim, here, 24);
          if (!target || !isAlive(target)) return;
          const dx = target.location.x - here.x;
          const dz = target.location.z - here.z;
          const len = Math.max(0.01, Math.hypot(dx, dz));
          bk.applyKnockback(dx / len, dz / len, 3.6, 0.12);
          safeSound(dim, "mob.enderdragon.flap", here);
          for (let s = 0; s < 5; s++) {
            system.runTimeout(() => {
              if (!isAlive(bk)) return;
              safeParticle(dim, "minecraft:critical_hit_emitter", bk.location);
              safeParticle(dim, "minecraft:basic_flame_particle", bk.location);
            }, s * 2);
          }
        } catch {}
      }, 24);
    }
  } else {
    bkChargeDone.delete(bk.id);
  }
}

// ---------------------------------------------------------------
// watcher loop
// ---------------------------------------------------------------
const WATCHED = [
  ["md:fire_dragon", dragonTick],
  ["md:lich_king", lichTick],
  ["md:siege_golem", golemTick],
  ["md:black_knight", blackKnightTick],
];

system.runInterval(() => {
  for (const dimName of ["overworld", "nether", "the_end"]) {
    let dim;
    try {
      dim = world.getDimension(dimName);
    } catch {
      continue;
    }
    for (const [type, tick] of WATCHED) {
      let list = [];
      try {
        list = dim.getEntities({ type });
      } catch {
        continue;
      }
      for (const e of list) {
        try {
          tick(dim, e);
        } catch {}
      }
    }
  }
}, 8);
