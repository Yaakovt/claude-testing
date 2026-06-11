/**
 * Game technique data — the four starts' kits, as pure data on the M2
 * registry (src/systems/techniques.ts). No new plumbing: each def's
 * execute() works through the TechniqueContext (combat/entities/map/spawn).
 *
 * Canon/invention labels (docs/lore-bible.md):
 *  - Fox Fire / Fox Dream / (cloak riffs on Fox Tail) — White Fox canon §3.1.
 *    Canon Fox Fire deals no physical damage; the game version trades that
 *    purity for playability and deals spirit-fear damage.
 *  - Empty Palm — canon, Lindon's own invention (§3.2): pure madra driven
 *    into the enemy's core; here it dazes and SEALS the victim's specials.
 *  - Sunset Lake + Mountain's Spine techniques — INVENTED FOR GAME (§1.3).
 *  - Burst of Effort — INVENTED FOR GAME (M2); now the Unsouled's cycling
 *    exercise turned technique, granted alongside the Empty Palm. Clan
 *    starts get their Path kits instead.
 */

import { registerTechnique, type TechniqueDef } from "../systems/techniques.js";
import { facingVector } from "../systems/combat.js";
import { Dreadbeast } from "./enemies/dreadbeast.js";
import {
  ExpandingRing,
  MadraBolt,
  SlowPool,
  StoneWallSegment,
} from "./techniqueEntities.js";

// ------------------------------------------------------------ shared bits

const FOX_DREAM_RADIUS = 55;
const FOX_DREAM_DAZE = 3;
const EMPTY_PALM_DAZE = 1.2;
const EMPTY_PALM_LOCK = 5;

// ----------------------------------------------------------- Unsouled kit

/**
 * "Burst of Effort" — INVENTED FOR GAME. A cycling exercise driven so hard
 * it becomes an Enforcer technique: raw madra flooded through the limbs.
 * +40% move speed and damage for 3 s.
 */
export const BURST_OF_EFFORT: TechniqueDef = {
  id: "burst-of-effort",
  name: "Burst of Effort",
  type: "Enforcer",
  madraCost: 9,
  cooldown: 6,
  execute(ctx) {
    ctx.user.applyBuff(1.4, 1.4, 3);
    ctx.fx?.spawnText(ctx.user.x, ctx.user.y - 26, "Burst of Effort!", "#8a6cc0", 0.8);
    return true;
  },
};

/**
 * "Empty Palm" — CANON (Lindon's invention). A palm strike that drives pure
 * madra into the enemy's core: bonus damage, a daze, and a long seal on the
 * victim's special moves (madra lock).
 */
export const EMPTY_PALM: TechniqueDef = {
  id: "empty-palm",
  name: "Empty Palm",
  type: "Striker",
  madraCost: 8,
  cooldown: 4,
  execute(ctx) {
    const { user, combat, entities, fx } = ctx;
    if (!combat || !entities) return false;
    const hits = combat.meleeAttack(user, entities.all, 12, 14, {
      multiplier: 1.3,
      knockback: 170,
      hitstun: 0.4,
    });
    for (const h of hits) {
      if (h instanceof Dreadbeast) {
        h.applyDaze(EMPTY_PALM_DAZE);
        h.applyMadraLock(EMPTY_PALM_LOCK);
        fx?.spawnText(h.x, h.y - 24, "spirit scattered!", "#b88fd4", 0.8);
      }
    }
    ctx.spawn?.(new ExpandingRing(user.x, user.y, "#e8dcf6", 4, 14, 0.3));
    fx?.spawnText(user.x, user.y - 26, "Empty Palm!", "#e8dcf6", 0.7);
    return true;
  },
};

// ---------------------------------------------------- Wei: White Fox kit

/** "Fox Fire" — canon name. A short cone of illusory violet flames. */
export const FOX_FIRE: TechniqueDef = {
  id: "fox-fire",
  name: "Fox Fire",
  type: "Striker",
  madraCost: 8,
  cooldown: 1.6,
  execute(ctx) {
    const { user, combat, entities, map, spawn } = ctx;
    if (!combat || !entities || !map || !spawn) return false;
    const { dx, dy } = facingVector(user.facing);
    const base = Math.atan2(dy, dx);
    for (const off of [-0.28, 0, 0.28]) {
      spawn(
        new MadraBolt({
          x: user.x + dx * 6,
          y: user.y - 2 + dy * 6,
          angle: base + off,
          speed: 150,
          range: 52,
          multiplier: 0.8,
          knockback: 60,
          style: "foxfire",
          owner: user,
          combat,
          entities,
          map,
        }),
      );
    }
    return true;
  },
};

/** "Fox Dream" — canon name. Dream aura unhooks every nearby beast's mind. */
export const FOX_DREAM: TechniqueDef = {
  id: "fox-dream",
  name: "Fox Dream",
  type: "Ruler",
  madraCost: 10,
  cooldown: 8,
  execute(ctx) {
    const { user, entities, fx } = ctx;
    if (!entities) return false;
    let caught = 0;
    for (const e of entities.all) {
      if (!(e instanceof Dreadbeast) || !e.alive) continue;
      if (Math.hypot(e.x - user.x, e.y - user.y) <= FOX_DREAM_RADIUS) {
        e.applyDaze(FOX_DREAM_DAZE);
        caught++;
      }
    }
    ctx.spawn?.(new ExpandingRing(user.x, user.y, "#b88fd4", 8, FOX_DREAM_RADIUS, 0.5));
    fx?.spawnText(user.x, user.y - 26, caught > 0 ? "Fox Dream" : "Fox Dream...", "#b88fd4", 0.8);
    return true;
  },
};

/**
 * "White Fox Cloak" — INVENTED name riffing on the canon Fox Tail Enforcer
 * (your image lies about where you are). Afterimage blur: faster, and
 * enemies sometimes strike the lie. Iron-sealed.
 */
export const WHITE_FOX_CLOAK: TechniqueDef = {
  id: "white-fox-cloak",
  name: "White Fox Cloak",
  type: "Enforcer",
  madraCost: 14,
  cooldown: 12,
  execute(ctx) {
    ctx.user.applyBuff(1.3, 1, 5);
    ctx.user.applyEvasion(0.35, 5);
    ctx.fx?.spawnText(ctx.user.x, ctx.user.y - 26, "White Fox Cloak", "#e8dcf6", 0.8);
    return true;
  },
};

// ------------------------------------------------- Li: Sunset Lake kit
// All three INVENTED FOR GAME (lore bible labels the Li Path an invention).

/** "Crescent Wake" — a fast crescent of water-light. */
export const CRESCENT_WAKE: TechniqueDef = {
  id: "crescent-wake",
  name: "Crescent Wake",
  type: "Striker",
  madraCost: 7,
  cooldown: 1.2,
  execute(ctx) {
    const { user, combat, entities, map, spawn } = ctx;
    if (!combat || !entities || !map || !spawn) return false;
    const { dx, dy } = facingVector(user.facing);
    spawn(
      new MadraBolt({
        x: user.x + dx * 6,
        y: user.y - 2 + dy * 6,
        angle: Math.atan2(dy, dx),
        speed: 220,
        range: 110,
        multiplier: 1.2,
        knockback: 140,
        style: "crescent",
        owner: user,
        combat,
        entities,
        map,
      }),
    );
    return true;
  },
};

/**
 * "Still Surface" — a parry stance (~0.45 s). A melee attacker who strikes
 * the still water is staggered and takes a riposte (CombatSystem.strike
 * resolves the parry; the stance roots the caster).
 */
export const STILL_SURFACE: TechniqueDef = {
  id: "still-surface",
  name: "Still Surface",
  type: "Enforcer",
  madraCost: 6,
  cooldown: 5,
  execute(ctx) {
    ctx.user.parryTimer = 0.45;
    ctx.fx?.spawnText(ctx.user.x, ctx.user.y - 26, "Still Surface", "#bfe3f2", 0.6);
    return true;
  },
};

/** "Evening Tide" — a pool of heavy twilight water that slows. Iron-sealed. */
export const EVENING_TIDE: TechniqueDef = {
  id: "evening-tide",
  name: "Evening Tide",
  type: "Ruler",
  madraCost: 16,
  cooldown: 10,
  execute(ctx) {
    const { user, entities, spawn } = ctx;
    if (!entities || !spawn) return false;
    const { dx, dy } = facingVector(user.facing);
    spawn(new SlowPool(user.x + dx * 28, user.y + dy * 28, 34, 5, entities));
    ctx.fx?.spawnText(user.x, user.y - 26, "Evening Tide", "#7fb4d8", 0.8);
    return true;
  },
};

// -------------------------------------------- Kazan: Mountain's Spine kit
// All three INVENTED FOR GAME.

/** "Spine Breaker" — a heavy overhead slam with a small shock AoE. */
export const SPINE_BREAKER: TechniqueDef = {
  id: "spine-breaker",
  name: "Spine Breaker",
  type: "Enforcer",
  madraCost: 9,
  cooldown: 2.5,
  execute(ctx) {
    const { user, combat, entities } = ctx;
    if (!combat || !entities) return false;
    combat.meleeAttack(user, entities.all, 18, 26, {
      multiplier: 1.8,
      knockback: 260,
      hitstun: 0.35,
    });
    const { dx, dy } = facingVector(user.facing);
    ctx.spawn?.(
      new ExpandingRing(user.x + dx * 12, user.y + dy * 12, "#aaabb4", 3, 16, 0.3),
    );
    ctx.fx?.spawnText(user.x, user.y - 26, "Spine Breaker!", "#aaabb4", 0.7);
    return true;
  },
};

/** "Stone Mantle" — Forged earth madra coats the body: −3 incoming, 6 s. */
export const STONE_MANTLE: TechniqueDef = {
  id: "stone-mantle",
  name: "Stone Mantle",
  type: "Forger",
  madraCost: 10,
  cooldown: 9,
  execute(ctx) {
    ctx.user.applyArmor(3, 6);
    ctx.fx?.spawnText(ctx.user.x, ctx.user.y - 26, "Stone Mantle", "#8d8e96", 0.8);
    return true;
  },
};

/**
 * "Ridgeline" — Forged stone wall (Ruler-guided earth aura, Forger by
 * taxonomy): a 3-segment line that blocks movement for 6 s. The wall is a
 * temporary collision entity — the map is never edited. Iron-sealed.
 */
export const RIDGELINE: TechniqueDef = {
  id: "ridgeline",
  name: "Ridgeline",
  type: "Forger",
  madraCost: 18,
  cooldown: 14,
  execute(ctx) {
    const { user, entities, map, spawn } = ctx;
    if (!entities || !map || !spawn) return false;
    const { dx, dy } = facingVector(user.facing);
    // Perpendicular line of 3 segments, 24px ahead of the caster.
    const px = -dy;
    const py = dx;
    let placed = 0;
    for (const k of [-1, 0, 1]) {
      const wx = user.x + dx * 24 + px * 15 * k;
      const wy = user.y + dy * 24 + py * 15 * k;
      if (map.isSolidAtWorld(wx, wy)) continue; // never inside terrain
      spawn(new StoneWallSegment(wx, wy, 6, entities, map));
      placed++;
    }
    if (placed === 0) return false; // fizzle against a cliff face: no cost
    ctx.fx?.spawnText(user.x, user.y - 26, "Ridgeline!", "#aaabb4", 0.8);
    return true;
  },
};

// ------------------------------------------------------------ registration

export const ALL_TECHNIQUES: TechniqueDef[] = [
  BURST_OF_EFFORT,
  EMPTY_PALM,
  FOX_FIRE,
  FOX_DREAM,
  WHITE_FOX_CLOAK,
  CRESCENT_WAKE,
  STILL_SURFACE,
  EVENING_TIDE,
  SPINE_BREAKER,
  STONE_MANTLE,
  RIDGELINE,
];

let registered = false;

/** Register every game technique exactly once (idempotent for tests). */
export function registerGameTechniques(): void {
  if (registered) return;
  registered = true;
  for (const def of ALL_TECHNIQUES) registerTechnique(def);
}
