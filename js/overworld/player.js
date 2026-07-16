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
    // Guarded warp: needs a flag first (e.g. can't leave the first town without
    // a starter, or you'd hit tall grass with an empty party).
    if (warp && warp.needFlag && !Game.flags[warp.needFlag]) {
      AudioSys.sfx('bump');
      this.dir = dir;
      Textbox.say(warp.blockMsg || 'You can\'t go that way yet.');
      return;
    }
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
    // surf platform: a bobbing wave mount with a foam wake
    if (this.surfing) {
      const bob = Math.round(Math.sin(Game.frame / 12) * 1.2);
      hopOff += bob;
      // wake foam behind the mount (little arcs that flicker)
      ctx.fillStyle = 'rgba(232,248,255,0.75)';
      const wob = (Game.frame >> 3) % 2;
      ctx.fillRect(x - 1, y + 19 + bob + wob, 2, 1);
      ctx.fillRect(x + 15, y + 20 + bob - wob, 2, 1);
      ctx.fillRect(x + 3, y + 23 + bob, 3, 1);
      ctx.fillRect(x + 10, y + 23 + bob - wob, 3, 1);
      // mount body: dark rim, blue shell, sun-lit crown
      ctx.fillStyle = '#2c5ca8';
      ctx.beginPath(); ctx.ellipse(x + 8, y + 20 + bob, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4890d8';
      ctx.beginPath(); ctx.ellipse(x + 8, y + 19 + bob, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8cc8f0';
      ctx.beginPath(); ctx.ellipse(x + 7, y + 18 + bob, 5, 1.6, 0, 0, Math.PI * 2); ctx.fill();
    }
    // Gen-3 stride: step frame on the first half of the tile, settle on the
    // second half, alternating which foot leads each tile (frameToggle).
    const stepFrame = this.frameToggle ? 1 : 2;
    const frame = this.moving && (Math.floor(this.moveT / 8) % 2 === 0) ? stepFrame : 0;
    // Bike: side-profile frame with spinning spokes; compact when facing up/down.
    // The rider sits 3px higher so the wheels and frame read underneath.
    if (this.biking && !this.surfing) {
      hopOff -= 3;
      const side = this.dir === 'left' || this.dir === 'right';
      const spin = this.moving ? (Game.frame >> 1) % 2 : 0;
      const wheels = side ? [x + 3, x + 13] : [x + 8];
      for (const wx of wheels) {
        ctx.fillStyle = '#282830';
        ctx.beginPath(); ctx.arc(wx, y + 21, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#484858';
        ctx.beginPath(); ctx.arc(wx, y + 21, 2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#b8b8c8'; ctx.lineWidth = 1;
        ctx.beginPath();
        if (spin) { ctx.moveTo(wx - 2, y + 21); ctx.lineTo(wx + 2, y + 21); ctx.moveTo(wx, y + 19); ctx.lineTo(wx, y + 23); }
        else { ctx.moveTo(wx - 1.5, y + 19.5); ctx.lineTo(wx + 1.5, y + 22.5); ctx.moveTo(wx + 1.5, y + 19.5); ctx.lineTo(wx - 1.5, y + 22.5); }
        ctx.stroke();
        ctx.fillStyle = '#d8d8e0'; ctx.fillRect(wx, y + 21, 1, 1);   // hub
      }
      if (side) {
        // diamond frame + seat + handlebar (flips with facing)
        const fwd = this.dir === 'right' ? 1 : -1;
        const rear = fwd > 0 ? x + 3 : x + 13, front = fwd > 0 ? x + 13 : x + 3;
        ctx.strokeStyle = '#c04040'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(rear, y + 21); ctx.lineTo(rear + fwd * 4, y + 17);          // seat tube
        ctx.lineTo(front - fwd * 1, y + 17); ctx.lineTo(front, y + 21);        // down tube to front hub
        ctx.moveTo(rear + fwd * 4, y + 17); ctx.lineTo(front - fwd * 2, y + 21); // chainstay diagonal
        ctx.stroke();
        ctx.fillStyle = '#303038';
        ctx.fillRect(rear + fwd * 3 - 1, y + 15, 3, 1);                        // seat
        ctx.fillRect(front - fwd * 1 - 1, y + 14, 2, 3);                       // handlebar stem
      } else {
        ctx.strokeStyle = '#c04040'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x + 8, y + 21); ctx.lineTo(x + 8, y + 17); ctx.stroke();
        ctx.fillStyle = '#303038'; ctx.fillRect(x + 5, y + 15, 7, 1);          // handlebar seen head-on
      }
    }
    const spr = Chars.get(this.spriteId, this.dir, frame);
    ctx.drawImage(spr, x, y + hopOff);

    // Fishing: a rod held out toward the water tile, line dropping to a bobber.
    if (this.fishing) {
      const [fx, fy] = DIRV[this.dir];
      // hands roughly at the trainer's front; rod tip reaches out over the water
      const hx = x + 8 + fx * 4, hy = y + 12 + (fy > 0 ? 2 : -1);
      const tipX = x + 8 + fx * 15, tipY = y + 10 + fy * 12;
      ctx.strokeStyle = '#7a4a26'; ctx.lineWidth = 2;                 // rod pole
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tipX, tipY); ctx.stroke();
      ctx.strokeStyle = '#d8b048'; ctx.lineWidth = 1;                 // gold rod tip
      ctx.beginPath(); ctx.moveTo((hx + tipX) / 2, (hy + tipY) / 2); ctx.lineTo(tipX, tipY); ctx.stroke();
      // line + bobber dropping onto the water tile in front
      const bobT = Math.sin(Game.frame / 12) * 1.5;
      const bx = this.fishing.x * 16 - camX + 8, by = this.fishing.y * 16 - camY + 8 + bobT;
      ctx.strokeStyle = 'rgba(230,240,255,0.8)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(bx, by); ctx.stroke();
      ctx.fillStyle = '#e83828'; ctx.fillRect(bx - 1, by - 1, 2, 1);  // red bobber top
      ctx.fillStyle = '#f8f8f8'; ctx.fillRect(bx - 1, by, 2, 1);      // white bobber bottom
      // ripple ring around the bobber
      ctx.strokeStyle = 'rgba(200,232,255,0.5)';
      ctx.beginPath(); ctx.ellipse(bx, by + 1, 4 + (Game.frame >> 3) % 3, 2, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
}
