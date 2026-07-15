'use strict';
/**
 * Helper-NPC services:
 *   • Berry Garden (Mossmere)     — plant held-berries, harvest more over time.
 *   • Move Relearner (Frostmoor)  — remember any past level-up move, free.
 *   • Move Tutor (Battle Tower)    — teach coverage moves for Battle Points.
 *   • Research Aide (Aspen's Lab)  — Professor Aspen's dex-milestone bounties.
 */

// ---------------------------------------------------------------- Berry Garden
Scripts.register('berry_garden', () => {
  const plots = Game.flags.berryPlots || (Game.flags.berryPlots = [null, null, null, null]);
  const RIPE = 5400;   // frames of play (~90s) until a berry ripens
  const PLANTABLE = ['rally_berry', 'soothe_berry', 'mendmoss'];

  const harvested = [];
  for (let i = 0; i < plots.length; i++) {
    const p = plots[i];
    if (p && Game.playtime - p.plantedAt >= RIPE) {
      const amount = 2 + (i % 2);   // 2-3 berries
      Game.give(p.berry, amount);
      harvested.push(amount + '× ' + Items[p.berry].name);
      plots[i] = null;
    }
  }
  const growing = plots.filter((p) => p).length;
  const empty = plots.filter((p) => !p).length;
  const inBag = PLANTABLE.filter((id) => Game.hasItem(id));

  const afterHarvest = () => {
    if (empty > 0 && inBag.length) {
      Textbox.ask('GARDENER: ' + empty + ' plot(s) are free. Plant a berry?', ['Plant', 'No thanks'], (pick) => {
        if (pick !== 0) { Textbox.say('GARDENER: The garden\'s always here for you.', Scripts.done); return; }
        const opts = inBag.map((id) => Items[id].name.replace(' Berry', '')).concat(['Back']);
        Textbox.ask('Which berry?', opts, (bi) => {
          if (bi >= inBag.length) { Textbox.say('GARDENER: Maybe next time.', Scripts.done); return; }
          const id = inBag[bi];
          const slot = plots.indexOf(null);
          plots[slot] = { berry: id, plantedAt: Game.playtime };
          Game.removeItem(id, 1);
          AudioSys.sfx('confirm');
          Textbox.say('You planted a ' + Items[id].name + '. Go journey a while, then come back to harvest more!', Scripts.done);
        });
      });
    } else if (growing > 0) {
      Textbox.say('GARDENER: ' + growing + ' plant(s) are still ripening. Patience — take a walk and return!', Scripts.done);
    } else {
      Textbox.say('GARDENER: The plots are bare. Bring a Rally Berry, Soothe Berry, or Mendmoss to plant, and I\'ll grow you more!', Scripts.done);
    }
  };

  if (harvested.length) {
    AudioSys.sfx('jingle_item');
    Textbox.say('The garden is ripe! You harvested ' + harvested.join(', ') + '!', afterHarvest);
  } else afterHarvest();
});

// ---------------------------------------------------------------- Move Relearner
Scripts.register('move_relearner', () => {
  Textbox.say('RELEARNER: I can help a fakemon recall a move it learned long ago. Who needs a refresher?', () => {
    PartyUI.open({
      mode: 'use-item',
      onPick: (ti) => {
        const mon = Game.party[ti];
        const known = new Set(mon.moves.map((m) => m.id));
        const relearn = [...new Set(mon.def.learn.filter(([lv]) => lv <= mon.level).map(([, id]) => id))]
          .filter((id) => !known.has(id) && Moves[id]);
        if (!relearn.length) {
          Textbox.say(mon.name + ' has no forgotten moves to recall.', () => Game.setState('overworld'));
          Scripts.done();
          return;
        }
        MoveRelearn.open(mon, relearn, () => { Scripts.done(); Game.setState('overworld'); });
      },
      onCancel: () => { Scripts.done(); Game.setState('overworld'); },
    });
  });
});

// ---------------------------------------------------------------- Move Tutor (BP)
const TUTOR_MOVES = ['dragon_claw', 'seed_bomb', 'shadow_maw', 'zen_ram', 'prism_flare'];
const TUTOR_COST = 8;   // BP per move
Scripts.register('move_tutor', () => {
  const teachable = TUTOR_MOVES.filter((id) => Moves[id]);
  const menu = () => {
    const opts = teachable.map((id) => Moves[id].name + ' (' + Moves[id].type + ')').concat(['Leave']);
    Textbox.ask('TUTOR: I teach rare moves for ' + TUTOR_COST + ' BP each. You have ' + (Game.bp || 0) + ' BP. Which move?', opts, (pick) => {
      if (pick >= teachable.length) { Textbox.say('TUTOR: Come back with more Battle Points!', Scripts.done); return; }
      const mv = teachable[pick];
      if ((Game.bp || 0) < TUTOR_COST) { Textbox.say('TUTOR: That costs ' + TUTOR_COST + ' BP — you don\'t have enough yet.', menu); return; }
      Textbox.say('TUTOR: ' + Moves[mv].name + ' is a ' + Moves[mv].type + '-type move. Which fakemon should learn it? (It must share the type.)', () => {
        PartyUI.open({
          mode: 'use-item',
          onPick: (ti) => {
            const mon = Game.party[ti];
            if (!mon.types.includes(Moves[mv].type)) { Textbox.say(mon.name + ' can\'t handle a ' + Moves[mv].type + ' move.', () => { Game.setState('overworld'); menu(); }); return; }
            if (mon.knows(mv)) { Textbox.say(mon.name + ' already knows ' + Moves[mv].name + '.', () => { Game.setState('overworld'); menu(); }); return; }
            Game.bp -= TUTOR_COST;
            const finishTeach = () => { AudioSys.sfx('jingle_item'); Textbox.say(mon.name + ' learned ' + Moves[mv].name + '!  (' + Game.bp + ' BP left)', () => { Scripts.done(); Game.setState('overworld'); }); };
            if (mon.moves.length < 4) { mon.teach(mv); finishTeach(); }
            else MoveForget.open(mon, mv, finishTeach);
          },
          onCancel: () => { Game.setState('overworld'); menu(); },
        });
      });
    });
  };
  menu();
});

// ---------------------------------------------------------------- Research Aide (Aspen bounties)
Scripts.register('research_aide', () => {
  const M = [
    { n: 15, give: ['greatorb', 5] }, { n: 30, give: ['ultraorb', 5] }, { n: 50, give: ['rare_candy', 2] },
    { n: 75, give: ['aurora_stone', 1] }, { n: 100, give: ['max_revive', 3] }, { n: 121, give: ['rare_candy', 5], bp: 25 },
  ];
  const caught = Game.dexCaughtCount();
  for (const m of M) {
    if (caught >= m.n && !Game.flags['dexr_' + m.n]) {
      Game.flags['dexr_' + m.n] = true;
      const [id, ct] = m.give;
      Game.give(id, ct);
      if (m.bp) Game.bp = (Game.bp || 0) + m.bp;
      AudioSys.sfx('jingle_item');
      Textbox.say(['AIDE: ' + caught + ' species registered — Professor Aspen is thrilled with your field research!',
        'You received ' + ct + '× ' + Items[id].name + (m.bp ? ' and ' + m.bp + ' BP' : '') + '!'], Scripts.done);
      return;
    }
  }
  const next = M.find((m) => caught < m.n);
  if (next) Textbox.say('AIDE: You\'ve registered ' + caught + ' species so far. Reach ' + next.n + ' for the Professor\'s next reward!', Scripts.done);
  else Textbox.say('AIDE: The Norvenna Dex is COMPLETE! You are a true master of research — Aspen could not be prouder.', Scripts.done);
});

// ---------------------------------------------------------------- place the service NPCs
(() => {
  const put = (mapId, npc) => { const m = Maps[mapId]; if (m) (m.npcs || (m.npcs = [])).push(npc); };
  put('mossmere', { x: 13, y: 4, sprite: 'npc_woman', dir: 'down', move: 'static', passable: false, script: 'berry_garden' });
  put('frostmoor', { x: 11, y: 10, sprite: 'npc_oldman', dir: 'down', move: 'static', passable: false, script: 'move_relearner' });
  put('battle_tower', { x: 6, y: 2, sprite: 'npc_villager', dir: 'down', move: 'static', passable: false, script: 'move_tutor' });
  put('aspen_lab', { x: 10, y: 3, sprite: 'npc_villager', dir: 'down', move: 'static', passable: false, script: 'research_aide' });
})();
