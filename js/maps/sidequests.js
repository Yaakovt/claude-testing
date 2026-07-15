'use strict';
/**
 * Classic optional sidequests, each with a fakemon or item reward:
 *   1. Lost Moss-Fawn   — Mossmere kid + Whisperwood Hollow  → gift Sprigfawn
 *   2. Lighthouse Lamp  — Tidesend keeper + Route 3 old lamp → Super Rod
 *   3. Ghost in the Lodge — Frostmoor old lodge (haunt battle) → Aurora Stone
 *   4. Herbalist's List — Lumenveil herbalist (gather 3 herbs) → 3 Rare Candies
 *
 * Quest steps are tracked with a per-quest flag (0/unset = not started, 1 =
 * accepted, 2 = objective met, 3 = complete). NPCs/signs are appended to the
 * existing town/route maps (loaded earlier), so no map geometry is rewritten.
 */

function sqAdd(mapId, kind, entry) {
  const m = Maps[mapId];
  if (!m) return;
  (m[kind] || (m[kind] = [])).push(entry);
}

// ================================================================ 1. Lost Moss-Fawn
Scripts.register('sq_fawn_giver', () => {
  const f = Game.flags.q_fawn || 0;
  if (f >= 3) { Textbox.say('KID: Our Sprigfawn is home safe thanks to you! It won\'t stop nuzzling everyone.', Scripts.done); return; }
  if (f === 2) {
    Textbox.say(['KID: You found it! Oh, thank goodness — come here, you silly fawn!',
      'KID: Listen... our doe had twins this spring, and this little one has taken a shine to you. Please, keep it. You clearly have a gift.'], () => {
      Game.flags.q_fawn = 3;
      Scripts.giveMon('sprigfawn', 8, Scripts.done);
    });
    return;
  }
  if (f === 1) { Textbox.say('KID: Please, my Sprigfawn is still lost somewhere in WHISPERWOOD HOLLOW, off Route 2!', Scripts.done); return; }
  Textbox.say(['KID: *sniffle* My pet Sprigfawn bolted into WHISPERWOOD HOLLOW when a wild fakemon spooked it...',
    'KID: I\'m too afraid of the dark to follow. You look brave — could you please find my fawn and bring it home?'], () => {
    Game.flags.q_fawn = 1; Scripts.done();
  });
});
Scripts.register('sq_fawn_find', () => {
  const f = Game.flags.q_fawn || 0;
  if (f === 1) {
    Textbox.say(['A trembling Sprigfawn is huddled in this nook!',
      'It catches the familiar scent on you, steadies... and trots out at your heel toward Mossmere.'], () => {
      Game.flags.q_fawn = 2; Scripts.done();
    });
  } else if (f >= 2) {
    Textbox.say('The quiet nook where the frightened fawn had been hiding.', Scripts.done);
  } else {
    Textbox.say('Something small skittered deeper into the dark. It sounded... frightened.', Scripts.done);
  }
});
sqAdd('mossmere', 'npcs', { x: 6, y: 10, sprite: 'npc_villager', dir: 'down', move: 'static', script: 'sq_fawn_giver' });
sqAdd('whisperwood_cave', 'signs', { x: 3, y: 7, script: 'sq_fawn_find', text: '...' });

// ================================================================ 2. Lighthouse Keeper's Lamp
Scripts.register('sq_lamp_giver', () => {
  if (Game.flags.q_lamp === 3) { Textbox.say('KEEPER: The harbor light burns bright again — every ship home safe. I owe you, friend.', Scripts.done); return; }
  if (Game.hasItem('old_lamp')) {
    Textbox.say(['KEEPER: My OLD LAMP! You found it on the rocks — you\'ve saved tonight\'s ships from the reef!',
      'KEEPER: Take my spare SUPER ROD as thanks. She hooks the rarest catches in the deep water.'], () => {
      Game.removeItem('old_lamp');
      Game.flags.q_lamp = 3;
      Scripts.giveItem('super_rod', 1, Scripts.done);
    });
    return;
  }
  if (Game.flags.q_lamp === 1) { Textbox.say('KEEPER: The lamp must have rolled down among the rocks along ROUTE 3, north of the harbor.', Scripts.done); return; }
  Textbox.say(['KEEPER: I keep the harbor beacon lit, but my OLD LAMP slipped off the coast road — ROUTE 3 — and I\'m too old to clamber the rocks.',
    'KEEPER: Without it, ships will founder on the reef tonight. Could you search Route 3 for my lamp?'], () => {
    Game.flags.q_lamp = 1; Scripts.done();
  });
});
sqAdd('tidesend', 'npcs', { x: 11, y: 9, sprite: 'npc_oldman', dir: 'down', move: 'static', script: 'sq_lamp_giver' });
sqAdd('route3', 'items', { x: 3, y: 12, item: 'old_lamp', flag: 'r3_oldlamp' });

// ================================================================ 3. Ghost in the Old Lodge
Scripts.register('sq_ghost_giver', () => {
  const g = Game.flags.q_ghost || 0;
  if (g >= 3) { Textbox.say('VILLAGER: Bless you — the old lodge is peaceful again. I even sleep with the lights off now!', Scripts.done); return; }
  if (g >= 1) { Textbox.say('VILLAGER: That wailing... it\'s coming from the back room. I daren\'t look. Please!', Scripts.done); return; }
  Textbox.say(['VILLAGER: Th-thank goodness, a trainer! Something moved into this old lodge — hear that wailing?',
    'VILLAGER: I don\'t dare go in the back room. You look like you can handle a fakemon or two. Would you drive it out?'], () => {
    Game.flags.q_ghost = 1; Scripts.done();
  });
});
Scripts.register('sq_ghost_battle', () => {
  const g = Game.flags.q_ghost || 0;
  if (g >= 3) { Textbox.say('The back room is still and quiet now. Just an old dusty chest.', Scripts.done); return; }
  if (g < 1) { Textbox.say('An old chest rattles faintly... but whatever\'s inside won\'t stir for a stranger.', Scripts.done); return; }
  if (!Game.partyAlive()) { Textbox.say('A chill wail rises — but your team is in no shape to face it. Heal up first!', Scripts.done); return; }
  Textbox.say(['You throw open the back room. A shape of cold flame uncoils from the rafters —',
    'the "ghost" is a wild WICKWISP, and it does NOT want to be disturbed!'], () => {
    const mon = new Mon('wickwisp', 28);
    Game.registerDex('wickwisp', 'seen');
    Game.setState('battle');
    Music.play('battle_wild');
    Battle.start({
      kind: 'wild', mon, env: 'interior',
      onEnd: (result) => {
        Game.setState('overworld');
        if (result === 'lose') { Game.whiteout(); return; }
        Game.flags.q_ghost = 3;
        Music.play(Overworld.currentMusic());
        const tail = result === 'caught'
          ? 'With the Wickwisp caught, the lodge falls quiet. Where it hovered, a warm shard glows —'
          : 'The Wickwisp flees out the window with a fading wail. Where it hovered, a warm shard glows —';
        Textbox.say([tail, 'you found an AURORA STONE left cooling on the floorboards!'], () => {
          Scripts.giveItem('aurora_stone', 1, Scripts.done);
        });
      },
    });
  });
});
// The old lodge interior (reached via Frostmoor's east house door — rewired below).
defineMap({
  id: 'old_lodge', name: 'Old Lodge', music: 'cave', battleEnv: 'interior', indoor: true,
  legend: ILEG,
  ground: [
    'wwwwwwwww',
    'wk     kw',
    'w       w',
    'w       w',
    'w   s   w',
    'wl     lw',
    'w   d   w',
    'wwwwdwwww',
  ],
  warps: [{ x: 4, y: 7, to: 'frostmoor', tx: 14, ty: 12, dir: 'down', always: true }],
  npcs: [{ x: 2, y: 2, sprite: 'npc_oldman', dir: 'down', move: 'static', script: 'sq_ghost_giver' }],
  signs: [{ x: 4, y: 4, script: 'sq_ghost_battle', text: 'A dusty chest in the back room.' }],
  onEnter() { if (Overworld.map) Overworld.map.name = 'Old Lodge'; },
});

// ================================================================ 4. Herbalist's Gathering List
Scripts.register('sq_herb_giver', () => {
  const h = Game.flags.q_herb || 0;
  if (h === 3) { Textbox.say('HERBALIST: My shelves are full thanks to your foraging. Stay healthy out there, dear.', Scripts.done); return; }
  const need = ['rally_berry', 'soothe_berry', 'mendmoss'];
  if (h >= 1 && need.every((id) => Game.hasItem(id))) {
    Textbox.say(['HERBALIST: A Rally Berry, a Soothe Berry, AND a sprig of Mendmoss — perfect specimens, all three!'], () => {
      for (const id of need) Game.removeItem(id, 1);
      Game.flags.q_herb = 3;
      Textbox.say('HERBALIST: For your trouble, take these — RARE CANDIES, grown from concentrated aurora-sap. A rare treat indeed!', () => {
        Scripts.giveItem('rare_candy', 3, Scripts.done);
      });
    });
    return;
  }
  if (h >= 1) { Textbox.say('HERBALIST: I still need one each of a RALLY BERRY, a SOOTHE BERRY, and some MENDMOSS. The Pokemart stocks them if foraging fails!', Scripts.done); return; }
  Textbox.say(['HERBALIST: Oh! You have a forager\'s eye. I brew remedies from three wild ingredients:',
    'HERBALIST: a RALLY BERRY, a SOOTHE BERRY, and a sprig of MENDMOSS. Bring me one of each and I\'ll reward you well.',
    'HERBALIST: If the wilds are stingy, the Pokemart carries all three.'], () => {
    Game.flags.q_herb = 1; Scripts.done();
  });
});
sqAdd('lumenveil', 'npcs', { x: 16, y: 8, sprite: 'npc_woman', dir: 'left', move: 'static', script: 'sq_herb_giver' });

// Rewire Frostmoor's eastern house door to open into the haunted Old Lodge.
(() => {
  const fm = Maps['frostmoor'];
  if (!fm || !fm.warps) return;
  for (const w of fm.warps) {
    if (w.to === 'birchwick_house') { w.to = 'old_lodge'; w.tx = 4; w.ty = 6; }
  }
})();
