/**
 * The in-game world: map, player, enemies, combat wiring, HUD, death
 * sequence, advancement flow, aura sight, spirit panel, and save building.
 * Extracted from main.ts in M3 so the game can flow
 * title -> creation -> world without booting the world at module load.
 *
 * M3 additions on top of the M2 behavior (all of which still applies):
 * shrines + advancement, Copper aura sight, Tab spirit panel, the four
 * Path kits, and the v3 save schema (character + advancement buckets).
 */

import { Input } from "../engine/input.js";
import { Camera } from "../engine/camera.js";
import { EntityManager } from "../engine/entity.js";
import { DebugOverlay } from "../engine/debug.js";
import { overlapsSolid } from "../engine/collision.js";
import { defaultSave, type SaveData } from "../engine/save.js";
import { CombatSystem } from "../systems/combat.js";
import { FxManager } from "../systems/fx.js";
import { Stage, STAGE_NAMES } from "../systems/stats.js";
import { Player } from "./player.js";
import { Dreadbeast } from "./enemies/dreadbeast.js";
import { spawnTestValleyEnemies } from "./enemies/spawns.js";
import { ScalePickup } from "./pickups.js";
import { RemnantStub } from "./remnantStub.js";
import { createTestValley, TEST_VALLEY_SPAWN } from "./maps/testValley.js";
import { Shrine, spawnTestValleyShrines } from "./shrine.js";
import { AdvancementFlow } from "./advancementFlow.js";
import { AuraSight } from "./auraSight.js";
import { drawSpiritPanel } from "./spiritPanel.js";
import { kitInfo, type OriginId } from "./paths.js";
import { IRON_CHANNEL_SECONDS } from "../systems/advancement.js";

const PIXEL_SCALE = 3;
const MAP_ID = "testValley";

export interface CharacterInfo {
  origin: OriginId;
  name: string;
}

interface CombatSave {
  health: number;
  madra: number;
  scales: number;
}

export interface WorldOpts {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  input: Input;
  character: CharacterInfo;
  /** Save to restore from (Continue), or null for a fresh start. */
  saveData: SaveData | null;
}

const DEATH_FADE_IN = 1.1; // screen fades to black
const DEATH_RESPAWN_AT = 2.4; // teleport + refill
const DEATH_DONE = 3.2; // fade back in, control returns

export class World {
  readonly map = createTestValley();
  readonly camera = new Camera(PIXEL_SCALE);
  readonly entities = new EntityManager();
  readonly debug = new DebugOverlay();
  readonly fx = new FxManager();
  readonly combat = new CombatSystem();
  readonly gameState = { scales: 0 };
  readonly player: Player;
  readonly shrines: Shrine[];
  readonly advancement: AdvancementFlow;
  readonly auraSight: AuraSight;
  readonly character: CharacterInfo;
  readonly spawn = { ...TEST_VALLEY_SPAWN };

  panelOpen = false;

  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly input: Input;
  private hudTime = 0;
  private deathSeq = { active: false, t: 0 };

  constructor(opts: WorldOpts) {
    this.canvas = opts.canvas;
    this.ctx = opts.ctx;
    this.input = opts.input;
    this.character = opts.character;
    const { input, map } = this;
    const existing = opts.saveData;

    this.camera.setBounds(map.pixelWidth, map.pixelHeight);

    // Restore position from a previous session when it's still valid.
    let spawnAt = { ...TEST_VALLEY_SPAWN };
    if (existing && existing.player.map === MAP_ID) {
      spawnAt = { x: existing.player.x, y: existing.player.y };
    }
    this.player = this.entities.add(
      new Player(input, map, spawnAt.x, spawnAt.y, opts.character.origin, opts.character.name),
    );
    if (overlapsSolid(this.player.aabb, map)) {
      // Stale/corrupt save put us inside a wall — fall back to the trailhead.
      this.player.x = TEST_VALLEY_SPAWN.x;
      this.player.y = TEST_VALLEY_SPAWN.y;
      this.player.resetInterpolation();
    }

    this.combat.init({ player: this.player, camera: this.camera, fx: this.fx });
    this.player.wireCombat(this.combat, this.entities, this.fx);

    // ---- enemies + shrines ------------------------------------------------
    spawnTestValleyEnemies({
      map,
      combat: this.combat,
      player: this.player,
      entities: this.entities,
    });
    this.shrines = spawnTestValleyShrines((s) => this.entities.add(s));

    // ---- advancement + aura sight ------------------------------------------
    this.auraSight = new AuraSight(map);
    this.advancement = new AdvancementFlow({
      player: this.player,
      input,
      combat: this.combat,
      fx: this.fx,
      shrines: this.shrines,
      gameState: this.gameState,
      spawn: (e) => this.entities.add(e),
      camera: this.camera,
      onStageUp: (to) => {
        if (to >= Stage.Copper) this.auraSight.enabled = true;
      },
    });
    this.player.pc!.onBasicHit = (n) => this.advancement.recordBasicHits(n);

    // Restore advancement FIRST (stage-ups rescale max stats), then clamp
    // health/madra/scales from the combat bucket.
    const adv = existing?.systems["advancement"] as
      | { stage?: number; madraFills?: number; basicHits?: number; emptyPalmLearned?: boolean }
      | undefined;
    this.advancement.restore(adv ?? {});
    this.auraSight.enabled = this.player.stats.stage >= Stage.Copper;

    const cs = existing?.systems["combat"] as Partial<CombatSave> | undefined;
    if (cs) {
      if (typeof cs.health === "number") {
        this.player.stats.health = Math.max(1, Math.min(this.player.stats.maxHealth, cs.health));
      }
      if (typeof cs.madra === "number") {
        this.player.stats.madra = Math.max(0, Math.min(this.player.stats.maxMadra, cs.madra));
      }
      if (typeof cs.scales === "number") this.gameState.scales = Math.max(0, cs.scales);
    }

    // ---- death drops --------------------------------------------------------
    this.combat.onDeath = (victim) => {
      if (victim === this.player) return; // respawn sequence handles the player
      if (victim instanceof Dreadbeast) {
        // Dreadbeasts leave no Remnant (lore §6.3) — render down to scales.
        this.dropScales(victim.x, victim.y, 1 + Math.floor(Math.random() * 3));
      } else if (victim.leavesRemnant) {
        // TODO(M5): real Remnant system — this is the stub hook.
        this.entities.add(new RemnantStub(victim.x, victim.y));
      }
    };

    this.camera.follow(this.player);
    this.camera.setScreenSize(this.canvas.width, this.canvas.height);
    this.camera.snapToTarget();
  }

  /** Scatter `count` scales near a death spot (never inside solid tiles). */
  private dropScales(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      let px = x + (Math.random() * 2 - 1) * 10;
      let py = y + (Math.random() * 2 - 1) * 8;
      if (overlapsSolid({ x: px - 4, y: py - 5, w: 8, h: 6 }, this.map)) {
        px = x;
        py = y;
      }
      this.entities.add(
        new ScalePickup(px, py, this.player, (value) => {
          this.gameState.scales += value;
          this.fx.spawnText(this.player.x, this.player.y - 26, `+${value} scale`, "#bfe3f2", 0.7);
        }),
      );
    }
  }

  // ----------------------------------------------------- death & respawn

  private updateDeathSequence(dt: number): void {
    const player = this.player;
    if (!this.deathSeq.active) {
      if (player.stats.health <= 0) {
        this.deathSeq.active = true;
        this.deathSeq.t = 0;
        player.controlEnabled = false;
      }
      return;
    }
    this.deathSeq.t += dt;
    if (this.deathSeq.t >= DEATH_RESPAWN_AT && player.stats.health <= 0) {
      // Forgiving respawn: full health, half madra, nothing lost.
      player.x = TEST_VALLEY_SPAWN.x;
      player.y = TEST_VALLEY_SPAWN.y;
      player.resetInterpolation();
      player.stats.health = player.stats.maxHealth;
      player.stats.madra = player.stats.maxMadra / 2;
      player.kbVx = 0;
      player.kbVy = 0;
      player.hitstun = 0;
      player.iframes = 1.5;
      this.camera.snapToTarget();
    }
    if (this.deathSeq.t >= DEATH_DONE) {
      this.deathSeq.active = false;
      player.controlEnabled = true;
    }
  }

  /** 0..1 darkness of the death overlay. */
  private deathFadeAlpha(): number {
    if (!this.deathSeq.active) return 0;
    if (this.deathSeq.t < DEATH_RESPAWN_AT) return Math.min(1, this.deathSeq.t / DEATH_FADE_IN);
    return Math.max(0, (DEATH_DONE - this.deathSeq.t) / (DEATH_DONE - DEATH_RESPAWN_AT));
  }

  // ------------------------------------------------------------------- save

  buildSave(base: SaveData | null): SaveData {
    const data = base ?? defaultSave();
    data.player.x = Math.round(this.player.x);
    data.player.y = Math.round(this.player.y);
    data.player.map = MAP_ID;
    data.player.facing = this.player.facing;
    data.player.stage = STAGE_NAMES[this.player.stats.stage];
    data.systems["combat"] = {
      health: Math.round(this.player.stats.health),
      madra: Math.round(this.player.stats.madra),
      scales: this.gameState.scales,
    } satisfies CombatSave;
    data.systems["character"] = { ...this.character };
    data.systems["advancement"] = this.advancement.serialize();
    return data;
  }

  // ------------------------------------------------------------------ update

  update(dt: number): void {
    if (this.input.pressed("debug")) this.debug.toggle();
    if (this.input.pressed("sheet")) this.panelOpen = !this.panelOpen;

    // Hit pause: freeze the world for a few frames on player hits.
    if (this.combat.hitPauseFrames > 0) {
      this.combat.hitPauseFrames--;
      this.camera.update(dt);
      return;
    }

    this.combat.update(dt);
    this.entities.update(dt);
    this.fx.update(dt);
    this.advancement.update(dt);
    this.updateDeathSequence(dt);
    this.auraSight.update(dt);
    this.map.update(dt);
    this.camera.update(dt);
    this.hudTime += dt;
  }

  // -------------------------------------------------------------------- HUD

  private drawBar(
    x: number,
    y: number,
    w: number,
    h: number,
    frac: number,
    fill: string,
    frame: string,
  ): void {
    const ctx = this.ctx;
    ctx.strokeStyle = frame;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.fillStyle = "rgba(10, 8, 18, 0.5)";
    ctx.fillRect(x + 1.5, y + 1.5, w - 2, h - 2);
    if (frac > 0) {
      ctx.fillStyle = fill;
      ctx.fillRect(x + 1.5, y + 1.5, Math.max(1, (w - 2) * Math.min(1, frac)), h - 2);
    }
  }

  private drawHud(): void {
    const ctx = this.ctx;
    const player = this.player;
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Copper bloom under the HUD, over the world.
    this.auraSight.drawScreenTint(ctx, this.canvas.width, this.canvas.height);

    // Panel: stage label, health bar, madra bar, scales counter.
    ctx.fillStyle = "rgba(10, 8, 18, 0.65)";
    ctx.fillRect(10, 10, 170, 84);
    ctx.font = "bold 14px Georgia, serif";
    ctx.fillStyle = "#cfc8e8";
    ctx.fillText(STAGE_NAMES[player.stats.stage], 20, 28);
    ctx.font = "10px Georgia, serif";
    ctx.fillStyle = "#5c5478";
    ctx.fillText("Tab — spirit", 118, 28);

    // Health.
    this.drawBar(20, 36, 130, 10, player.stats.health / player.stats.maxHealth, "#b8434e", "#8a4a52");

    // Madra — pulses while cycling.
    const cycling = player.cyclingActive;
    const pulse = cycling ? 0.65 + 0.35 * Math.sin(this.hudTime * 8) : 1;
    const madraFill = cycling
      ? `rgba(138, 108, 192, ${pulse})`
      : "rgba(138, 108, 192, 0.9)";
    this.drawBar(20, 50, 130, 10, player.stats.madra / player.stats.maxMadra, madraFill, "#6d4f94");

    // Scales: a small diamond glyph + count.
    ctx.save();
    ctx.translate(26, 74);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#bfe3f2";
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
    ctx.font = "bold 13px Georgia, serif";
    ctx.fillStyle = "#bfe3f2";
    ctx.fillText(`${this.gameState.scales}`, 38, 79);
    ctx.fillStyle = "#8d97a8";
    ctx.font = "11px Georgia, serif";
    ctx.fillText("scales", 60, 79);

    // Noticed enemy: stage label of whatever the player last traded blows with.
    if (this.combat.noticedLabel) {
      ctx.fillStyle = "rgba(10, 8, 18, 0.65)";
      ctx.fillRect(10, 100, 170, 22);
      ctx.font = "italic 12px Georgia, serif";
      ctx.fillStyle = "#e0c9a8";
      ctx.fillText(this.combat.noticedLabel, 20, 115);
    }

    this.drawChannelOverlay();
    this.drawCeremony();

    if (this.panelOpen) {
      drawSpiritPanel(ctx, this.canvas.width, this.canvas.height, {
        name: this.character.name,
        pathLabel: this.advancement.pathLabel,
        stage: player.stats.stage,
        slots: kitInfo(this.character.origin, player.stats.stage, this.advancement.progress),
        progressLines: this.advancement.progressLines(),
      });
    }

    // Death overlay: fade + message.
    const fade = this.deathFadeAlpha();
    if (fade > 0) {
      ctx.fillStyle = `rgba(5, 4, 10, ${fade * 0.92})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      if (this.deathSeq.t > 0.7 && this.deathSeq.t < DEATH_RESPAWN_AT + 0.4) {
        ctx.font = "italic 22px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(207, 200, 232, ${Math.min(1, fade * 1.2)})`;
        ctx.fillText("Your spirit fades...", this.canvas.width / 2, this.canvas.height / 2);
        ctx.textAlign = "left";
      }
    }
  }

  /** Iron refining: red vignette + endure bar while channeling. */
  private drawChannelOverlay(): void {
    if (this.advancement.state !== "channel") return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const t = this.advancement.channelT;
    const a = 0.07 + 0.05 * Math.sin(t * 6);
    ctx.fillStyle = `rgba(180, 40, 30, ${a})`;
    ctx.fillRect(0, 0, w, h);

    const bw = 260;
    const bx = w / 2 - bw / 2;
    const by = h - 70;
    ctx.fillStyle = "rgba(10, 8, 18, 0.75)";
    ctx.fillRect(bx - 10, by - 26, bw + 20, 52);
    ctx.font = "italic 14px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#e0c9a8";
    ctx.fillText("the refining — hold still and endure", w / 2, by - 8);
    ctx.textAlign = "left";
    this.drawBar(bx, by, bw, 10, t / IRON_CHANNEL_SECONDS, "#b8434e", "#8a4a52");
  }

  /** Stage-up / Empty Palm banner. */
  private drawCeremony(): void {
    const c = this.advancement.ceremony;
    if (!c) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const fadeIn = Math.min(1, c.t / 0.4);
    const fadeOut = Math.min(1, Math.max(0, (4 - c.t) / 0.8));
    const a = Math.min(fadeIn, fadeOut);
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 36px Georgia, serif";
    ctx.fillStyle = `rgba(224, 201, 168, ${a})`;
    ctx.fillText(c.title, w / 2, h * 0.3);
    ctx.font = "italic 15px Georgia, serif";
    ctx.fillStyle = `rgba(207, 200, 232, ${a * 0.9})`;
    ctx.fillText(c.sub, w / 2, h * 0.3 + 28);
    ctx.restore();
  }

  /** World-space shrine prompt (drawn with the camera transform active). */
  private drawPrompt(): void {
    const p = this.advancement.prompt;
    if (!p) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.font = "6px Georgia, serif";
    ctx.textAlign = "center";
    for (let i = 0; i < p.lines.length; i++) {
      const ly = p.y - 24 + i * 8;
      ctx.fillStyle = "rgba(11, 10, 16, 0.8)";
      ctx.fillText(p.lines[i]!, Math.round(p.x) + 1, Math.round(ly) + 1);
      ctx.fillStyle = i === 0 ? "#e8e0c8" : "#9a93b4";
      ctx.fillText(p.lines[i]!, Math.round(p.x), Math.round(ly));
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ render

  render(alpha: number): void {
    const ctx = this.ctx;
    this.debug.tickFrame();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#0b0a10";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.camera.applyTransform(ctx);
    // Pad the view rect by a tile so edge tiles/sprites never pop.
    const ts = this.map.tileSize;
    const vx = this.camera.left - ts;
    const vy = this.camera.top - ts;
    const vw = this.camera.viewW + ts * 2;
    const vh = this.camera.viewH + ts * 2;

    this.map.drawGround(ctx, vx, vy, vw, vh);
    this.entities.drawSorted(ctx, alpha, this.map.getSortedDecor(vx, vy, vw, vh));
    this.fx.drawWorld(ctx);
    this.auraSight.drawWorld(ctx, vx, vy, vw, vh);
    this.drawPrompt();
    this.debug.drawWorld(ctx, this.entities.all, this.map, this.camera);

    this.drawHud();
    this.debug.drawScreen(ctx, [
      `pos ${this.player.x.toFixed(1)}, ${this.player.y.toFixed(1)}`,
      `tile ${Math.floor(this.player.x / ts)}, ${Math.floor(this.player.y / ts)}`,
      `cam ${this.camera.x.toFixed(1)}, ${this.camera.y.toFixed(1)}`,
      `entities ${this.entities.all.length}`,
      `facing ${this.player.facing}`,
      `hp ${this.player.stats.health.toFixed(0)}/${this.player.stats.maxHealth} madra ${this.player.stats.madra.toFixed(1)}/${this.player.stats.maxMadra}`,
      `scales ${this.gameState.scales}  cycling ${this.player.cyclingActive}`,
      `stage ${STAGE_NAMES[this.player.stats.stage]}  adv ${this.advancement.state}`,
    ]);
  }
}
