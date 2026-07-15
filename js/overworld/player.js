'use strict';
/**
 * Grid-based player movement (GBA style): hold a direction to face then slide
 * one tile; ledges hop; doors/stairs queue a warp; running toggled with B.
 */
class Player {
  constructor(tx, ty, dir) {
    this.tx = tx; this.ty = ty;
    this.px = tx * 16; this.py = ty * 16;
    this.dir = dir || 'down';
    this.moving = false;
    this.frameToggle = 0;
    this.stepCount = 0;
    this.surfing = false;
    this.biking = false;
    this.hopping = false;
    this.hopT = 0;
  }

  get spriteId() {
    if (this.surfing) return null;
    return Game.gender === 'F' ? 'player_f' : 'player_m';
  }

  update() {
    if (this.moving) { this.advance(); return; }
    // interaction
    if (Input.pressed.a) { if (Overworld.interact()) return; }
    const dir = Input.dirHeld();
    if (!dir) { this.frameToggle = 0; return; }
    if (dir !== this.dir) {
      // turn in place first (one-frame tap just turns)
      this.dir = dir;
      this.turnDelay = 4;
      return;
    }
    if (this.turnDelay > 0) { this.turnDelay--; return; }
    this.tryMove(dir);
  }

  tryMove(dir) {
    const [dx, dy] = DIRV[dir];
    const nx = this.tx + dx, ny = this.ty + dy;
    const m = Overworld.map;
    const destDef = m.tileDef(nx, ny);
    // ledge hop (only downward ledges, moving down)
    const curDef = m.tileDef(this.tx, this.ty);
    if (destDef && destDef.ledge === 'down' && dir === 'down') {
      this.beginMove(this.tx, this.ty + 2, dir, true); return;
    }
    // surfing transitions
    if (this.surfing) {
      // step off surf onto land
      if (destDef && !destDef.water && !m.solidAt(nx, ny)) {
        this.surfing = false;
      } else if (!destDef || !destDef.water) { AudioSys.sfx('bump'); return; }
    } else if (destDef && destDef.water) {
      // Walking into water: offer to Surf if able, else bump (A-button fishes).
      if (Game.flags.hm_surf) { this.dir = dir; Overworld.promptSurf(nx, ny); return; }
      AudioSys.sfx('bump'); return;
    }
    // An exit/door warp on the destination tile is always steppable, even if the
    // tile itself is "solid" (e.g. a path gap through a tree/rock border row).
    const warp = m.warpAt(nx, ny);
    const isExit = warp && (warp.always || (destDef && (destDef.door || destDef.stairs)));
    if (m.solidAt(nx, ny) && !isExit) {
      AudioSys.sfx('bump');
      return;
    }
    // warp tiles trigger on step
    if (warp && (destDef && (destDef.door || destDef.stairs || warp.always))) {
      Game.flags.pendingWarp = warp;
    }
    this.beginMove(nx, ny, dir, false);
  }

  beginMove(nx, ny, dir, hop) {
    this.startX = this.px; this.startY = this.py;
    this.tx = nx; this.ty = ny;
    this.targetX = nx * 16; this.targetY = ny * 16;
    this.moving = true;
    this.moveT = 0;
    this.hopping = hop;
    this.frameToggle ^= 1;
  }

  advance() {
    this.moveT += this.biking ? 4 : this.surfing ? 3 : 2;
    const dur = 16;
    const t = Math.min(1, this.moveT / dur);
    this.px = Util.lerp(this.startX, this.targetX, t);
    this.py = Util.lerp(this.startY, this.targetY, t);
    if (t >= 1) {
      this.px = this.targetX; this.py = this.targetY;
      this.moving = false;
      this.stepCount++;
      Overworld.onStep(this.tx, this.ty);
      // continue walking if still held
    }
  }

  startSurf(x, y) {
    this.surfing = true;
    AudioSys.sfx('confirm');
    Music.play('surf');
    // step onto the water tile
    const dir = this.dir;
    this.beginMove(x, y, dir, false);
  }

  draw(ctx, camX, camY) {
    let x = Math.round(this.px - camX);
    let y = Math.round(this.py - camY) - 6; // sprite taller than tile
    let hopOff = 0;
    if (this.moving && this.hopping) hopOff = -Math.sin(Math.min(1, this.moveT / 16) * Math.PI) * 8;
    // surf platform
    if (this.surfing) {
      ctx.fillStyle = '#3f7fd8';
      ctx.beginPath(); ctx.ellipse(x + 8, y + 20, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7fb8f0';
      ctx.beginPath(); ctx.ellipse(x + 8, y + 19, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
    }
    const frame = this.moving ? (Math.floor(this.moveT / 8) % 2) : 0;
    // Bike placeholder: two wheels under the trainer until Fable draws the real
    // cycling sprites. Wheel spokes spin while moving for a sense of speed.
    if (this.biking && !this.surfing) {
      ctx.fillStyle = '#303038';
      const spin = (Game.frame >> 1) % 4;
      for (const wx of [x + 3, x + 12]) {
        ctx.beginPath(); ctx.arc(wx, y + 21, 3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#a0a0b0'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(wx - 2 + spin * 0.5, y + 21); ctx.lineTo(wx + 2 - spin * 0.5, y + 21); ctx.stroke();
      }
      ctx.strokeStyle = '#c04040'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 3, y + 21); ctx.lineTo(x + 12, y + 21); ctx.stroke();
    }
    const spr = Chars.get(this.spriteId, this.dir, frame);
    ctx.drawImage(spr, x, y + hopOff);
  }
}
