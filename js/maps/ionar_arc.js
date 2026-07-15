'use strict';
/**
 * Expanded Team Ionar arc — three mid-game cutscene confrontations that build
 * the villain plot before the Sky Spire climax:
 *   1. Depot Theft (Birchwick)        — a grunt raiding the town depot for coils.
 *   2. Observatory Raid (Lumenveil)   — Lt. Sable aiming the aurora-lens skyward.
 *   3. Glacier Shrine (Glacierholm)   — Lt. Torr seizing the Storm Charm.
 * Each is a one-time scene: talk → dialogue → battle → the foe steps aside and
 * a story item / lead is handed over. None gate main progression.
 */

// ---- Two new Team Ionar lieutenants ----
T('ionar_sable', {
  name: 'Sable', cls: 'Ionar Lieutenant', reward: 2600, music: 'battle_ionar', ai: 'smart', leader: true,
  intro: 'I am SABLE, Team Ionar\'s field lieutenant. Turn back — this is bigger than you.',
  loss: 'Impressive... but the coordinates are already on their way to the boss.',
  party: [{ key: 'voltusk', level: 29 }, { key: 'grimcorvid', level: 30 }, { key: 'walrust', level: 31, held: 'rally_berry' }],
});
T('ionar_torr', {
  name: 'Torr', cls: 'Ionar Lieutenant', reward: 3400, music: 'battle_ionar', ai: 'smart', leader: true,
  intro: 'TORR, of Team Ionar. Can\'t have you playing hero with our prize!',
  loss: 'Ngh — take the trinket, then! Fat lot of good it\'ll do against the boss.',
  party: [{ key: 'gulomaul', level: 37 }, { key: 'aurovolt', level: 38 }, { key: 'geysmog', level: 39, held: 'mendmoss' }],
});

// ---- Scene 1: Depot Theft (Birchwick) ----
Scripts.register('ionar_depot', (npc) => {
  if (Game.flags.ionar_depot) { if (npc) npc.passable = true; Textbox.say('GRUNT: ...just gathering supplies for the cause. You\'ll understand when the sky burns bright forever.', Scripts.done); return; }
  Textbox.say(['You round the corner to find a grey-coated figure prying the town depot open, arms loaded with copper induction coils.',
    'GRUNT: Team Ionar requisitions what Team Ionar needs. Forget you saw this... or make me!'], () => {
    Music.play('battle_ionar');
    Game.startTrainerBattle(Trainers.ionar_grunt1, () => {
      Game.flags.ionar_depot = true;
      if (npc) npc.passable = true;
      Textbox.say(['GRUNT: Tch! Take the scrap — we\'ve enough coils to charge the whole array now.',
        '(In the scuffle the grunt dropped an ID card. You pocket the IONAR BADGE — it may open doors later.)'], () => {
        Scripts.giveItem('ionar_badge', 1, () => {
          Textbox.say('(Rumor says Team Ionar has seized the LUMENVEIL observatory to the north...)', Scripts.done);
        });
      });
    });
  });
});

// ---- Scene 2: Observatory Raid (Lumenveil) ----
Scripts.register('ionar_observatory', (npc) => {
  if (Game.flags.ionar_observatory) { if (npc) npc.passable = true; Textbox.say('LT. SABLE: The lens has done its work. You\'re too late to matter now, challenger.', Scripts.done); return; }
  Textbox.say(['At the seized observatory gate, a sharp-eyed officer directs grunts tilting the great aurora-lens skyward.',
    Trainers.ionar_sable.intro,
    'LT. SABLE: We\'ve mapped the Storm-Heart\'s resting place with this lens. But if you insist on meddling...'], () => {
    Music.play('battle_ionar');
    Game.startTrainerBattle(Trainers.ionar_sable, () => {
      Game.flags.ionar_observatory = true;
      if (npc) npc.passable = true;
      Textbox.say([Trainers.ionar_sable.name + ': ' + Trainers.ionar_sable.loss,
        'LT. SABLE: One relic could still undo us — the STORM CHARM, sealed in the old glacier shrine past GLACIERHOLM. Not that you\'ll reach it in time.'], Scripts.done);
    });
  });
});

// ---- Scene 3: Glacier Shrine (Glacierholm) ----
Scripts.register('ionar_glacier', (npc) => {
  if (Game.flags.ionar_glacier) { if (npc) npc.passable = true; Textbox.say('(The shrine is quiet now. The Storm Charm is safe in your pack.)', Scripts.done); return; }
  Textbox.say(['At the frozen shrine, a burly officer pries an ancient amulet from its cradle, then sneers as you approach.',
    'LT. TORR: This "Storm Charm" is the one thing that could calm Auroryx once it wakes.',
    Trainers.ionar_torr.intro], () => {
    Music.play('battle_ionar');
    Game.startTrainerBattle(Trainers.ionar_torr, () => {
      Game.flags.ionar_glacier = true;
      if (npc) npc.passable = true;
      Textbox.say([Trainers.ionar_torr.name + ': ' + Trainers.ionar_torr.loss,
        'You recovered the STORM CHARM! If Auroryx wakes atop the Sky Spire, this ancient relic may be your one way to soothe it.'], () => {
        Game.flags.gotStormCharm = true;
        Scripts.giveItem('storm_charm', 1, Scripts.done);
      });
    });
  });
});

// ---- Place the three cutscene antagonists on their town maps ----
function ionarNpc(mapId, x, y, script) {
  const m = Maps[mapId];
  if (m) (m.npcs || (m.npcs = [])).push({ x, y, sprite: 'ionar_grunt', dir: 'down', move: 'static', passable: false, script });
}
ionarNpc('birchwick', 16, 4, 'ionar_depot');
ionarNpc('lumenveil', 6, 11, 'ionar_observatory');
ionarNpc('glacierholm', 11, 6, 'ionar_glacier');
