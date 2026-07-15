'use strict';
/**
 * Gift NPCs that hand out the new key items:
 *   • Cycle Shop clerk (Mossmere)      → Bike
 *   • Wandering Merchant (Tidesend)     → Amulet Coin, Exp. Share, Aurora Compass
 *   • Lorekeeper (Frosthollow)          → Saga Tome
 *   • Trail Ranger (Birchwick)          → Explorer Permit
 */

Scripts.register('cycle_shop', () => {
  if (Game.hasItem('bike') || Game.flags.gotBike) {
    Textbox.say('CYCLE CLERK: Enjoy the ride! USE the Bike from your Bag to hop on and off.', Scripts.done);
    return;
  }
  Textbox.say('CYCLE CLERK: Grand opening special — a free folding BIKE for promising trainers! Here you are. Twice the speed on the open road!', () => {
    Game.flags.gotBike = true;
    Scripts.giveItem('bike', 1, () => {
      Textbox.say('CYCLE CLERK: Open your BAG and USE the Bike to ride. No cycling indoors or on water, mind!', Scripts.done);
    });
  });
});

Scripts.register('key_merchant', () => {
  const gifts = [
    ['gotAmulet', 'amulet_coin', 'Take this AMULET COIN — keep it in your bag and trainers pay you DOUBLE prize money.'],
    ['gotExpShare', 'exp_share', 'And an old EXP. SHARE, so your whole team grows together. Toggle it on from the Bag.'],
    ['gotCompass', 'aurora_compass', 'One last curio — an AURORA COMPASS. Its needle leans toward the sky\'s great hearts.'],
  ];
  const next = gifts.find((g) => !Game.flags[g[0]]);
  if (!next) { Textbox.say('MERCHANT: Safe travels, friend! Spend those doubled winnings well.', Scripts.done); return; }
  Textbox.say('MERCHANT: A wandering trader, at your service! You look reliable — ' + next[2], () => {
    Game.flags[next[0]] = true;
    Scripts.giveItem(next[1], 1, Scripts.done);
  });
});

Scripts.register('lorekeeper', () => {
  if (Game.hasItem('saga_tome') || Game.flags.gotTome) {
    Textbox.say('LOREKEEPER: Read the SAGA TOME whenever you like — the old tales never grow stale.', Scripts.done);
    return;
  }
  Textbox.say('LOREKEEPER: You have the look of one who\'ll matter to these sagas. Here — my SAGA TOME. USE it to read Norvenna\'s oldest tale.', () => {
    Game.flags.gotTome = true;
    Scripts.giveItem('saga_tome', 1, Scripts.done);
  });
});

Scripts.register('permit_ranger', () => {
  if (Game.hasItem('explorer_permit') || Game.flags.gotPermit) {
    Textbox.say('RANGER: That EXPLORER PERMIT marks you as one of us. The wild side-trails east of the towns are yours to roam!', Scripts.done);
    return;
  }
  Textbox.say('RANGER: Heading off the beaten path? Make it official — here\'s an EXPLORER PERMIT. Norvenna\'s hidden trails welcome you.', () => {
    Game.flags.gotPermit = true;
    Scripts.giveItem('explorer_permit', 1, Scripts.done);
  });
});

// ---- place the gift NPCs ----
(() => {
  const put = (mapId, npc) => { const m = Maps[mapId]; if (m) (m.npcs || (m.npcs = [])).push(npc); };
  put('mossmere', { x: 16, y: 4, sprite: 'npc_villager', dir: 'down', move: 'static', passable: false, script: 'cycle_shop' });
  put('tidesend', { x: 16, y: 4, sprite: 'npc_oldman', dir: 'down', move: 'static', passable: false, script: 'key_merchant' });
  put('frosthollow', { x: 16, y: 14, sprite: 'npc_oldman', dir: 'down', move: 'static', passable: false, script: 'lorekeeper' });
  put('birchwick', { x: 16, y: 10, sprite: 'npc_ranger', dir: 'down', move: 'static', passable: false, script: 'permit_ranger' });
})();
