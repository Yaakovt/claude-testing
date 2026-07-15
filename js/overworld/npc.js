'use strict';
/**
 * Overworld NPCs: static, wandering, or path-looking. Trainers face a
 * direction and challenge on line-of-sight if not yet beaten.
 */
class NPC {
  constructor(def) {
    this.def = def;
    this.tx = def.x; this.ty = def.y;
    this.px = def.x * 16; this.py = def.y * 16;
    this.dir = def.dir || 'down';
    this.spriteId = def.sprite || 'npc_villager';
    this.script = def.script || null;
    this.move = def.move || 'static';   // static | wander | look
    this.passable = def.passable || false;
    this.trainer = def.trainer || null; // trainer id for LOS battles
    this.sight = def.sight || 0;        // tiles of line-of-sight
    this.moving = false;
    this.timer = Util.rand(120);
  }

  face(dir) { this.dir = dir; }

  get beaten() { return this.trainer && Game.flags['beat_' + this.trainer]; }

  update() {
    if (this.moving) { this.advance(); return; }
    // Trainer line-of-sight
    if (this.trainer && !this.beaten && !Scripts.running && Game.state === 'overworld') {
      if (this.seesPlayer()) { this.challenge(); return; }
    }
    if (this.move === 'wander' && Util.rand(140) === 0) {
      const dir = Util.pick(['up', 'down', 'left', 'right']);
      const [dx, dy] = DIRV[dir];
      this.dir = dir;
      const nx = this.tx + dx, ny = this.ty + dy;
      if (!Overworld.map.solidAt(nx, ny) && !(Overworld.player.tx === nx && Overworld.player.ty === ny)) {
        this.beginMove(nx, ny);
      }
    } else if (this.move === 'look' && Util.rand(90) === 0) {
      this.dir = Util.pick(['up', 'down', 'left', 'right']);
    }
  }

  seesPlayer() {
    const p = Overworld.player;
    const [dx, dy] = DIRV[this.dir];
    for (let i = 1; i <= this.sight; i++) {
      const x = this.tx + dx * i, y = this.ty + dy * i;
      if (Overworld.map.solidAt(x, y) && !(p.tx === x && p.ty === y)) return false;
      if (p.tx === x && p.ty === y) return true;
    }
    return false;
  }

  challenge() {
    Scripts.running = true;
    const tr = Trainers[this.trainer];
    Textbox.say((tr.intro || 'Hey! Let\'s battle!'), () => {
      Music.play('battle_trainer');
      Game.startTrainerBattle(tr, () => {
        Scripts.running = false;
        if (this.script) Scripts.run(this.script, this);
      });
    });
  }

  beginMove(nx, ny) {
    this.startX = this.px; this.startY = this.py;
    this.tx = nx; this.ty = ny;
    this.targetX = nx * 16; this.targetY = ny * 16;
    this.moving = true; this.moveT = 0;
  }
  advance() {
    this.moveT += 2;
    const t = Math.min(1, this.moveT / 16);
    this.px = Util.lerp(this.startX, this.targetX, t);
    this.py = Util.lerp(this.startY, this.targetY, t);
    if (t >= 1) { this.px = this.targetX; this.py = this.targetY; this.moving = false; }
  }

  draw(ctx, camX, camY) {
    const x = Math.round(this.px - camX);
    const y = Math.round(this.py - camY) - 6;
    const frame = this.moving ? (Math.floor(this.moveT / 8) % 2) : 0;
    ctx.drawImage(Chars.get(this.spriteId, this.dir, frame), x, y);
    // trainer "!" when about to battle
    if (this.trainer && !this.beaten && this.exclaim > 0) {
      this.exclaim--;
      ctx.fillStyle = '#f8d030';
      Font.draw(ctx, '!', x + 7, y - 8, { color: '#e83030', shadow: '#fff' });
    }
  }
}
