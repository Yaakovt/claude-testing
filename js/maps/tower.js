'use strict';
/**
 * The Battle Tower — a postgame endless-streak facility on Tempest Isle.
 *
 * Rules (chosen by the player):
 *   • Bring your OWN team, level-capped to Lv 50 (mons above 50 are scaled down;
 *     mons at or below 50 keep their level). Held items — including a Rift Stone —
 *     carry over, so you can still Mega Evolve.
 *   • One loss ends the run. Your team is fully healed between every battle.
 *   • Every 7th battle is a tougher BOSS trainer with a themed, item-holding team.
 *   • Wins pay Battle Points (BP): 3 per normal win, 10 per boss.
 *   • Spend BP at the exchange counter on rare items, stones, TMs and held items.
 *   • Streak milestones award a trophy TITLE shown on your Trainer Card.
 */
const Tower = {
  active: false,
  savedParty: null,

  // Strong, fully-evolved species the tower draws ordinary challengers from.
  POOL: [
    'jotunwald', 'fafnirn', 'krakelott', 'elderhorn', 'fimbulwyrm', 'jarnwyrm',
    'gulomaul', 'ingotaur', 'mystrix', 'grimcorvid', 'ursnow', 'geysmog',
    'vulpaura', 'seidkona', 'reefclad', 'fjorddrake', 'wyrmskim', 'stormgull',
    'skjaldhawk', 'emperoyal', 'walrust', 'shiverfin', 'frystdrake', 'terrawyrm',
    'boulderam', 'prismarok', 'nokkmare', 'hullghast', 'barrowght', 'pyrelight',
    'dreamlyn', 'sylphund', 'bellsylph', 'trolltoad', 'thundram', 'loadstork',
    'drillvole', 'cindercrag', 'myceloom', 'conifurze', 'sulfimer', 'mammorost',
    'screechelon', 'umbrafloe', 'nocturnyx', 'lotanic', 'mirephantom', 'magnadrake',
  ],
  // Held items sprinkled onto ordinary tower mons for extra bite.
  HELDS: ['mendmoss', 'focus_charm', 'rally_berry', 'soothe_berry',
    'emberband', 'tideband', 'leafband', 'voltband', 'wyrmband'],

  // Four rotating bosses, each every 7 wins. Their teams grow as the rotation cycles.
  BOSSES: [
    { name: 'Halvard', cls: 'Tower Ace', flavor: 'Not bad! But the higher floors will grind you down.',
      team: [['stormgull', 'voltband'], ['ingotaur', 'rally_berry'], ['fjorddrake', 'tideband'], ['vulpaura', 'focus_charm']] },
    { name: 'Ingrid', cls: 'Tower Sage', flavor: 'The mind tires before the body. You held both together — impressive.',
      team: [['mystrix', 'mendmoss'], ['seidkona', 'focus_charm'], ['dreamlyn', 'soothe_berry'], ['bellsylph', 'mendmoss'], ['umbrafloe', 'rally_berry']] },
    { name: 'Bjorn', cls: 'Tower Warden', flavor: 'You cracked the wall. Few ever do. Climb on, challenger.',
      team: [['ursnow', 'mendmoss'], ['boulderam', 'rally_berry'], ['gulomaul', 'focus_charm'], ['magnadrake', 'wyrmband'], ['thundram', 'voltband']] },
    { name: 'Astra', cls: 'Tower Tycoon', flavor: 'The peak bows to you today. But the Tower is endless — and so am I. Come again.',
      team: [['fafnirn', 'wyrmband'], ['krakelott', 'tideband'], ['jotunwald', 'leafband'], ['fimbulwyrm', 'mendmoss'], ['elderhorn', 'focus_charm'], ['grimcorvid', 'rally_berry']] },
  ],

  // Milestone titles (streak >= n). Highest earned is kept on the card.
  TITLES: [
    { n: 100, t: 'Tower Legend' },
    { n: 49, t: 'Tower Master' },
    { n: 21, t: 'Tower Veteran' },
    { n: 7, t: 'Tower Challenger' },
  ],

  /** Fully-healed copy of a party mon, level-capped to 50. */
  capMon(m) {
    const d = m.serialize();
    d.level = Math.min(50, m.level);
    d.exp = expForLevel(m.def.growth, d.level);
    const cm = Mon.deserialize(d);
    cm.fullHeal();
    return cm;
  },

  /** An ordinary tower challenger: 3-6 random Lv50 mons that grow in number. */
  randTrainer(battleNo) {
    const n = Math.min(6, 3 + Math.floor(battleNo / 14));
    const pool = Tower.POOL.slice();
    const party = [];
    for (let i = 0; i < n && pool.length; i++) {
      const key = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      const p = { key, level: 50 };
      if (Math.random() < 0.4) p.held = Tower.HELDS[Math.floor(Math.random() * Tower.HELDS.length)];
      party.push(p);
    }
    const names = ['Cool Trainer', 'Ace', 'Veteran', 'Champion Hopeful', 'Elite Aspirant', 'Battle Sage'];
    return {
      id: 'tower_foe', name: 'from Floor ' + battleNo, cls: names[Math.floor(Math.random() * names.length)],
      reward: 0, ai: 'smart', music: 'battle_elite', party,
    };
  },

  /** A boss trainer for battle numbers divisible by 7. */
  bossTrainer(battleNo) {
    const cycle = Math.floor(battleNo / 7) - 1;   // 0-based boss index
    const boss = Tower.BOSSES[cycle % Tower.BOSSES.length];
    return {
      id: 'tower_boss', name: boss.name, cls: boss.cls, reward: 0, ai: 'smart',
      music: 'battle_champion', leader: true, loss: boss.flavor,
      party: boss.team.map(([key, held]) => ({ key, level: 50, held })),
    };
  },

  /** Begin a fresh challenge run. */
  begin() {
    if (!Game.partyAlive()) { Textbox.say('Your team is in no shape to battle. Heal up first!', Scripts.done); return; }
    Tower.savedParty = Game.party;
    Game.party = Game.party.map((m) => Tower.capMon(m));
    Tower.active = true;
    Game.flags.towerStreak = 0;
    Tower.next();
  },

  /** Run the next battle in the streak. */
  next() {
    const battleNo = (Game.flags.towerStreak || 0) + 1;
    const isBoss = battleNo % 7 === 0;
    const tr = isBoss ? Tower.bossTrainer(battleNo) : Tower.randTrainer(battleNo);
    Game.setState('battle');
    Battle.start({
      kind: 'trainer', trainer: tr, env: 'aurora',
      onEnd: (result) => {
        Game.setState('overworld');
        if (result !== 'win') { Tower.endRun(false); return; }
        Game.flags.towerStreak = battleNo;
        const bp = isBoss ? 10 : 3;
        Game.bp = (Game.bp || 0) + bp;
        for (const m of Game.party) m.fullHeal();
        if (isBoss) {
          Textbox.say([tr.cls + ' ' + tr.name + ': ' + tr.loss,
            'Streak: ' + battleNo + '!  You earned ' + bp + ' BP.  (Total: ' + Game.bp + ' BP)'], () => {
            Textbox.ask('Keep climbing the Battle Tower?', ['Yes, onward!', 'No, collect my winnings'], (pick) => {
              if (pick === 0) Tower.next(); else Tower.endRun(true);
            });
          });
        } else {
          Music.play('battle_elite');
          Textbox.say('Win! Streak: ' + battleNo + '  (+' + bp + ' BP)', () => Tower.next());
        }
      },
    });
  },

  /** End the run (voluntary = stepped off after a boss; else a loss). */
  endRun(voluntary) {
    const streak = Game.flags.towerStreak || 0;
    if (Tower.savedParty) { Game.party = Tower.savedParty; Tower.savedParty = null; }
    Game.healParty();
    Tower.active = false;
    let newTitle = null;
    if (streak > (Game.flags.towerBest || 0)) {
      Game.flags.towerBest = streak;
      for (const { n, t } of Tower.TITLES) {
        if (streak >= n) { if (Game.flags.towerTitle !== t) newTitle = t; Game.flags.towerTitle = t; break; }
      }
    }
    Game.flags.towerStreak = 0;
    Music.play(Overworld.currentMusic());
    const lines = [];
    lines.push(voluntary
      ? 'You step off the floor with a streak of ' + streak + '. Your team is fully restored.'
      : 'Your challenge ends at a streak of ' + streak + '. Your team is fully restored.');
    if (newTitle) lines.push('★ For reaching a streak of ' + Game.flags.towerBest + ', you earned the title "' + newTitle + '"! It now shows on your Trainer Card.');
    Textbox.say(lines, Scripts.done);
  },
};

// ---------------------------------------------------------------- BP exchange
const TowerShop = {
  // [itemId, bpCost]
  CATALOG: [
    ['rare_candy', 20], ['rift_stone', 48], ['aurora_stone', 16], ['verdant_stone', 16],
    ['ember_stone', 16], ['tide_stone', 16], ['storm_stone', 16], ['max_revive', 16],
    ['full_heal', 6], ['ether', 8], ['ultraorb', 6], ['focus_charm', 12],
    ['emberband', 12], ['tideband', 12], ['leafband', 12], ['voltband', 12], ['wyrmband', 12],
    ['mendmoss', 10],
  ],
  open() {
    const build = () => {
      const opts = TowerShop.CATALOG.map(([id, cost]) => Items[id].name + '  (' + cost + ' BP)');
      opts.push('Leave');
      Textbox.ask('BP EXCHANGE — you have ' + (Game.bp || 0) + ' BP. What catches your eye?', opts, (pick) => {
        if (pick >= TowerShop.CATALOG.length) { Textbox.say('Come spend your BP any time!', Scripts.done); return; }
        const [id, cost] = TowerShop.CATALOG[pick];
        if ((Game.bp || 0) < cost) { Textbox.say('That costs ' + cost + ' BP — you only have ' + (Game.bp || 0) + '. Earn more in the Tower!', build); return; }
        Textbox.ask(Items[id].name + ' for ' + cost + ' BP?  (' + Items[id].desc + ')', ['Buy it', 'Not now'], (yn) => {
          if (yn !== 0) { build(); return; }
          Game.bp -= cost;
          Game.give(id, 1);
          AudioSys.sfx('jingle_item');
          Textbox.say('Here you go — one ' + Items[id].name + '! (' + Game.bp + ' BP left)', build);
        });
      });
    };
    build();
  },
};

// ---------------------------------------------------------------- lobby scripts
Scripts.register('tower_reception', () => {
  if (!Game.flags.champion) {
    Textbox.say('ATTENDANT: The Battle Tower opens its floors only to those who have conquered the League. Return when you are Champion of Norvenna!', Scripts.done);
    return;
  }
  const best = Game.flags.towerBest || 0;
  const title = Game.flags.towerTitle ? '  Title: ' + Game.flags.towerTitle : '';
  Textbox.say('ATTENDANT: Welcome to the Battle Tower, Champion! Best streak: ' + best + '.' + title, () => {
    Textbox.ask('Take on the Tower? Your team battles at a Lv 50 cap, healed between rounds. One loss ends the run.',
      ['Challenge the Tower', 'How does this work?', 'Not right now'], (pick) => {
        if (pick === 0) {
          Textbox.say('ATTENDANT: Then climb, and let the aurora witness your strength!', () => Tower.begin());
        } else if (pick === 1) {
          Textbox.say(['ATTENDANT: Every mon on your team is set to Lv 50 for the duration — stronger ones scale down, weaker ones stay. Held items and Rift Stones still work.',
            'ATTENDANT: Win to build your streak and earn BP. Every seventh foe is a Tower boss worth extra BP. Spend BP at the exchange counter beside me.',
            'ATTENDANT: Lose even once and the run ends — but you keep every BP you earned, and your team is healed.'], Scripts.done);
        } else {
          Textbox.say('ATTENDANT: The floors will be waiting.', Scripts.done);
        }
      });
  });
});

Scripts.register('tower_shop', () => {
  if (!Game.flags.champion) { Textbox.say('CLERK: The BP Exchange serves Tower challengers only. Best of luck earning your first Battle Points!', Scripts.done); return; }
  TowerShop.open();
});

Scripts.register('tower_records', () => {
  const best = Game.flags.towerBest || 0;
  const title = Game.flags.towerTitle || '(none yet)';
  Textbox.say('HALL OF FLOORS — Longest streak: ' + best + '.  Current title: ' + title + '.  Titles: 7 → Challenger, 21 → Veteran, 49 → Master, 100 → Legend.', Scripts.done);
});

// ---------------------------------------------------------------- lobby map
defineMap({
  id: 'battle_tower', name: 'Battle Tower', music: 'town', battleEnv: 'interior', indoor: true,
  legend: ILEG,
  ground: [
    'wwwwwwwwwww',
    'w n     n w',
    'w         w',
    'w  s      w',
    'w  rrrrr  w',
    'w  rrrrr  w',
    'w         w',
    'w    d    w',
    'wwwwwdwwwww',
  ],
  warps: [{ x: 5, y: 8, to: 'tempest_isle', tx: 7, ty: 7, dir: 'down', always: true }],
  npcs: [
    { x: 2, y: 1, sprite: 'nurse', dir: 'down', move: 'static', passable: false, script: 'tower_reception' },
    { x: 8, y: 1, sprite: 'clerk', dir: 'down', move: 'static', passable: false, script: 'tower_shop' },
  ],
  signs: [{ x: 3, y: 3, script: 'tower_records', text: 'THE BATTLE TOWER — climb an endless streak of Lv 50 duels. Talk to the attendant to begin.' }],
});
