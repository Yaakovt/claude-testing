'use strict';
/**
 * Event scripts. Each entry in Scripts.lib is a function(npc) that drives a
 * scripted sequence, mostly via Textbox callbacks. Scripts.running blocks
 * overworld input while a sequence plays.
 *
 * Reusable services (Pokecenter, Pokemart) plus the Norvenna storyline hooks
 * live here; longer set-pieces are attached to maps in js/maps/*.
 */
const Scripts = {
  running: false,
  lib: {},

  run(name, npc) {
    const fn = Scripts.lib[name];
    if (!fn) { Textbox.say('...'); return; }
    Scripts.running = true;
    fn(npc);
  },
  done() { Scripts.running = false; },
  update() {},   // sequences are callback-driven; nothing per-frame needed

  register(name, fn) { Scripts.lib[name] = fn; },
};

// ------------------------------------------------------------------ services
Scripts.register('nurse', () => {
  Textbox.ask('Welcome to the Pokecenter! Shall I heal your fakemon to full health?',
    ['Yes', 'No'], (pick) => {
      if (pick !== 0) { Textbox.say('We hope to see you again!', Scripts.done); return; }
      AudioSys.sfx('pc');
      HealAnim.play(() => {
        Game.healParty();
        Game.flags.lastCenter = { mapId: Overworld.map.id, px: Overworld.player.tx, py: Overworld.player.ty + 1 };
        AudioSys.sfx('jingle_heal');
        Textbox.say('Your fakemon are fighting fit! We hope to see you again!', Scripts.done);
      });
    });
});

Scripts.register('mart', (npc) => {
  const stock = (npc && npc.def.stock) || ['fieldorb', 'potion', 'antidote', 'paralyze_heal', 'repel'];
  Mart.open(stock, Scripts.done);
});

Scripts.register('pc_box', () => {
  AudioSys.sfx('pc');
  Textbox.say('You booted up the Storage PC. ' + Game.box.length + ' fakemon are in the box. (Auto-managed on capture.)', Scripts.done);
});

// ------------------------------------------------------------------ helpers
Scripts.giveMon = function (key, level, then) {
  const mon = new Mon(key, level, { ot: Game.playerName });
  Game.registerDex(key, 'caught');
  const where = Game.addToParty(mon);
  AudioSys.sfx('jingle_item');
  const msg = where === 'party'
    ? Game.playerName + ' received ' + mon.name + '!'
    : mon.name + ' was sent to the Storage Box!';
  Textbox.say(msg, then);
};

Scripts.giveItem = function (id, n, then) {
  Game.give(id, n || 1);
  AudioSys.sfx('jingle_item');
  Textbox.say(Game.playerName + ' received ' + (n > 1 ? n + ' ' : '') + Items[id].name + '!', then);
};

Scripts.giveBadge = function (index, name, then) {
  Game.badges[index] = true;
  AudioSys.sfx('jingle_badge');
  Textbox.say(Game.playerName + ' received the ' + name + ' Badge!', then);
};

Scripts.giveHM = function (flag, move, then) {
  Game.flags['hm_' + flag] = true;
  Textbox.say('You can now use ' + Moves[move].name + ' in the field!', then);
};
