'use strict';
/**
 * Trainer definitions: overworld trainers, gym leaders, Team Ionar, Elite Four
 * and the Champion. `party` entries are {key, level, moves?}. `ai:'smart'`
 * enables matchup-aware move selection.
 */
const Trainers = {};
function T(id, def) { Trainers[id] = Object.assign({ id }, def); }

// ---- Route trainers ----
T('youngster_finn', {
  name: 'Finn', cls: 'Youngster', reward: 240, music: 'battle_trainer',
  intro: 'A real trainer needs a real team! Let\'s see yours!',
  loss: 'Whoa, you\'re strong!',
  party: [{ key: 'nibbit', level: 5 }, { key: 'sparkit', level: 6 }],
});
T('hiker_greta', {
  name: 'Greta', cls: 'Hiker', reward: 480, music: 'battle_trainer', ai: 'smart',
  intro: 'These hills are MINE. Prove you belong here!',
  loss: 'Solid footing you\'ve got.',
  party: [{ key: 'cairnling', level: 10 }, { key: 'pineling', level: 11 }],
});
T('fisher_odd', {
  name: 'Odd', cls: 'Fisher', reward: 360, music: 'battle_trainer',
  intro: 'The one that got away was THIS big! You won\'t get away though.',
  loss: 'Reel good battle.',
  party: [{ key: 'minnowisp', level: 9 }, { key: 'mudlusk', level: 10 }],
});

// ---- Route trainers (extra battles for a longer journey) ----
function RT(id, name, cls, reward, party, intro, loss) {
  T(id, { name, cls, reward, ai: 'smart', music: 'battle_trainer',
    intro: intro || 'Hey you! Let\'s battle!', loss: loss || 'You got me!', party });
}
// Route 1
RT('r1_lass', 'Poppy', 'Lass', 200, [{ key: 'puffinch', level: 4 }, { key: 'larvel', level: 4 }], 'My fakemon are so cute AND tough!', 'Aww, good match!');
RT('r1_bugcatcher', 'Timo', 'Bug Catcher', 160, [{ key: 'larvel', level: 5 }], 'Bugs are the best! Wanna see?', 'Aw, bugs...');
// Route 2
RT('r2_camper', 'Nils', 'Camper', 320, [{ key: 'nibbit', level: 9 }, { key: 'pineling', level: 10 }], 'Out here in the wild, only the tough survive!', 'You\'re tougher!');
RT('r2_picnicker', 'Bea', 'Picnicker', 300, [{ key: 'mossbuck', level: 10 }], 'Care to battle before my picnic?', 'What a lovely loss!');
// Route 3
RT('r3_sailor', 'Kregg', 'Sailor', 480, [{ key: 'minnowisp', level: 13 }, { key: 'puffle', level: 14 }], 'Salt in my veins, kid! Let\'s go!', 'Fair winds to ya.');
RT('r3_twins', 'Ida & Ines', 'Twins', 520, [{ key: 'glimmouse', level: 13 }, { key: 'chimebud', level: 13 }], 'We battle as one!', 'We lost as one...');
// Route 4
RT('r4_hiker', 'Sten', 'Hiker', 560, [{ key: 'ramlet', level: 17 }, { key: 'cairnling', level: 18 }], 'These slopes made me strong. You?', 'Solid climbing.');
RT('r4_fisher', 'Marn', 'Fisher', 500, [{ key: 'herrdart', level: 18 }], 'Reeled in a big one today — you!', 'The one that got away.');
// Route 5
RT('r5_psychic', 'Vale', 'Psychic', 640, [{ key: 'wispurr', level: 20 }, { key: 'corvusk', level: 20 }], 'I foresaw this battle. And my victory!', 'My vision... was wrong?');
RT('r5_aroma', 'Linnea', 'Aroma Lady', 600, [{ key: 'chimebud', level: 21 }], 'The aurora smells of victory tonight!', 'Sweet defeat.');
// Route 6
RT('r6_miner', 'Dag', 'Miner', 720, [{ key: 'oreling', level: 23 }, { key: 'shardling', level: 24 }], 'Dug up a fight just for you!', 'Back to the mines.');
RT('r6_hiker', 'Bram', 'Hiker', 700, [{ key: 'boulderam', level: 24 }], 'Rock solid, that\'s me!', 'Crumbled...');
// Route 7
RT('r7_skier', 'Elsa', 'Skier', 820, [{ key: 'frostkit', level: 26 }, { key: 'corvusk', level: 27 }], 'Cold never bothered my team!', 'Brrr, nice one.');
RT('r7_veteran', 'Old Ulf', 'Veteran', 900, [{ key: 'gulomaul', level: 27 }, { key: 'ramlet', level: 27 }], 'Been battling since before you were born!', 'Youth wins again.');
// Route 8
RT('r8_snowboarder', 'Kit', 'Snowboarder', 900, [{ key: 'yetiling', level: 29 }, { key: 'zapkid', level: 29 }], 'Catch me if you can — then battle me!', 'Wiped out!');
RT('r8_blackbelt', 'Ragna', 'Black Belt', 940, [{ key: 'trolltoad', level: 30 }], 'My fists and my fakemon — both iron!', 'A humbling loss.');
// Route 9
RT('r9_dragontamer', 'Sindri', 'Dragon Tamer', 1100, [{ key: 'skimmerling', level: 32 }, { key: 'frystdrake', level: 33 }], 'Dragons answer only to the worthy!', 'You are worthy.');
RT('r9_ace', 'Halla', 'Ace Trainer', 1200, [{ key: 'grimcorvid', level: 33 }, { key: 'nokkmare', level: 33 }], 'No badges? Doesn\'t matter. I\'ll win anyway!', 'You\'ve earned those badges.');
// Victory Road
RT('vr_ace1', 'Torsten', 'Ace Trainer', 1600, [{ key: 'ingotaur', level: 44 }, { key: 'stormgull', level: 44 }], 'Only the best reach Victory Road. Prove it!', 'You belong here.');
RT('vr_ace2', 'Mira', 'Ace Trainer', 1600, [{ key: 'vulpaura', level: 44 }, { key: 'gulomaul', level: 45 }], 'The League is close. I am closer!', 'Go claim it.');
RT('vr_veteran', 'Grand Ivar', 'Veteran', 2000, [{ key: 'ursnow', level: 45 }, { key: 'boulderam', level: 45 }, { key: 'wyrmskim', level: 46 }], 'One last wall before the League. That\'s me!', 'The wall has fallen. Go.');

// ---- Gym 1: Astrid (Normal) ----
T('gym_helper1', { name: 'Bo', cls: 'Gym Trainee', reward: 200, intro: 'Astrid taught me to never give up!', loss: 'Go on ahead!', party: [{ key: 'puffinch', level: 8 }] });
T('gym_helper2', { name: 'Wren', cls: 'Gym Trainee', reward: 200, intro: 'Normal types are anything but boring!', loss: 'You earned this.', party: [{ key: 'nibbit', level: 8 }, { key: 'brockle', level: 9 }] });
T('astrid', {
  name: 'Astrid', cls: 'Leader', reward: 1500, music: 'battle_gym', ai: 'smart', leader: true,
  intro: 'Welcome, challenger. I am ASTRID. Show me the bond you share with your fakemon!',
  loss: 'Your resolve is genuine. The Steadfast Badge is yours!',
  party: [{ key: 'lemmoth', level: 11 }, { key: 'brockle', level: 13 }],
});

// ---- Route 3 trainer ----
T('sailor_bram', {
  name: 'Bram', cls: 'Sailor', reward: 720, music: 'battle_trainer', ai: 'smart',
  intro: 'Ahoy! No landlubber passes the coast without besting me!',
  loss: 'Ha! You\'ve got sea legs after all.',
  party: [{ key: 'berguin', level: 15 }, { key: 'mudlusk', level: 15 }, { key: 'clampike', level: 16 }],
});

// ---- Gym 3: Runa (Water) ----
T('runa', {
  name: 'Runa', cls: 'Leader', reward: 3000, music: 'battle_gym', ai: 'smart', leader: true,
  intro: 'The tide turns for no one — but it does test everyone. I am RUNA. Show me your current!',
  loss: 'You rode the wave beautifully. The Tidal Badge is yours.',
  party: [{ key: 'reefclad', level: 21 }, { key: 'jelluna', level: 21 }, { key: 'fjorddrake', level: 23 }],
});

// ---- Gym 2: Eirik (Grass) ----
T('eirik', {
  name: 'Eirik', cls: 'Leader', reward: 2200, music: 'battle_gym', ai: 'smart', leader: true,
  intro: 'The Mossmere forest tests all who enter. Let\'s see if it accepts you!',
  loss: 'You read the forest well. Take the Verdant Badge.',
  party: [{ key: 'conifurze', level: 16 }, { key: 'sporeling', level: 16 }, { key: 'myceloom', level: 18 }],
});

// ---- Gym 4: Brandt (Fire) ----
T('brandt', {
  name: 'Brandt', cls: 'Leader', reward: 3600, music: 'battle_gym', ai: 'smart', leader: true,
  intro: 'Emberfall\'s springs run hot, and so does my spirit! I\'m BRANDT. Don\'t get burned!',
  loss: 'Ha! You blaze brighter than I do. The Ember Badge is yours.',
  party: [{ key: 'sulfimer', level: 26 }, { key: 'cindercrag', level: 27 }, { key: 'geysmog', level: 29, held: 'emberband' }],
});
// ---- Gym 5: Sylja (Psychic) ----
T('sylja', {
  name: 'Sylja', cls: 'Leader', reward: 4200, music: 'battle_gym', ai: 'smart', leader: true,
  intro: 'The aurora speaks to those who listen. I am SYLJA. Let me read your mind... and your moves.',
  loss: 'Your will is louder than your doubt. Take the Lumen Badge.',
  party: [{ key: 'mystrix', level: 30 }, { key: 'runelith', level: 31 }, { key: 'seidkona', level: 33, held: 'mendmoss' }],
});
// ---- Gym 6: Torvald (Steel) ----
T('torvald', {
  name: 'Torvald', cls: 'Leader', reward: 4800, music: 'battle_gym', ai: 'smart', leader: true,
  intro: 'Irondeep forges the sturdiest fakemon in Norvenna. I am TORVALD. Let\'s test your temper!',
  loss: 'Well struck. You\'ve earned the Iron Badge, and my respect.',
  party: [{ key: 'ingotaur', level: 34 }, { key: 'drillvole', level: 35 }, { key: 'loadstork', level: 37, held: 'rally_berry' }],
});
// ---- Gym 7: Yrsa (Ice) ----
T('yrsa', {
  name: 'Yrsa', cls: 'Leader', reward: 5400, music: 'battle_gym', ai: 'smart', leader: true,
  intro: 'The glacier does not forgive the unprepared. I am YRSA. Show me your warmth won\'t fail you.',
  loss: 'You did not freeze. The Glacier Badge is yours.',
  party: [{ key: 'emperoyal', level: 38 }, { key: 'shiverfin', level: 39 }, { key: 'walrust', level: 40 }, { key: 'frystdrake', level: 41, held: 'mendmoss' }],
});
// ---- Gym 8: Signe (Dragon) ----
T('signe', {
  name: 'Signe', cls: 'Leader', reward: 6400, music: 'battle_gym', ai: 'smart', leader: true,
  intro: 'You\'ve climbed to the foot of the Sky Spire. I am SIGNE, last leader before the League. Draconic fury — meet it!',
  loss: 'Magnificent! The Storm Badge is yours. The Aurora Plateau awaits — and so does your destiny.',
  party: [{ key: 'fjorddrake', level: 42 }, { key: 'wyrmskim', level: 43 }, { key: 'jarnwyrm', level: 44 }, { key: 'fimbulwyrm', level: 45, held: 'wyrmband' }],
});

// ---- Scaled gym-trainee helpers (reused across gyms) ----
T('trainee_mid', { name: 'Trainee', cls: 'Gym Trainee', reward: 600, ai: 'smart', intro: 'The Leader taught me well!', loss: 'Go on ahead!', party: [{ key: 'brockle', level: 24 }, { key: 'scrappup', level: 25 }] });
T('trainee_high', { name: 'Veteran', cls: 'Gym Veteran', reward: 1200, ai: 'smart', intro: 'Few make it this far. Prove you belong!', loss: 'The Leader is just ahead.', party: [{ key: 'gulomaul', level: 38 }, { key: 'boulderam', level: 39 }] });

// ---- Team Ionar ----
T('ionar_grunt1', {
  name: 'Ionar Grunt', cls: 'Team Ionar', reward: 500, music: 'battle_ionar', ai: 'smart',
  intro: 'Team Ionar will light the whole sky with free energy! Out of our way!',
  loss: 'Tch! You can\'t stop the future!',
  party: [{ key: 'echomite', level: 12 }, { key: 'rattenkin', level: 13 }],
});
T('ionar_grunt2', {
  name: 'Ionar Grunt', cls: 'Team Ionar', reward: 550, music: 'battle_ionar', ai: 'smart',
  intro: 'Auroryx\'s power belongs to Team Ionar! Beat it!',
  loss: 'The boss won\'t like this...',
  party: [{ key: 'sulfimer', level: 13 }, { key: 'anglow', level: 14 }],
});
T('ionar_boss', {
  name: 'Magnus Voll', cls: 'Ionar Leader', reward: 5000, music: 'battle_ionar', ai: 'smart', leader: true,
  intro: 'I am MAGNUS VOLL. When Auroryx wakes, the sky will burn bright forever — and I will hold the switch. You would deny mankind limitless light?',
  loss: 'Impossible... the Storm-Heart chose YOU over me?',
  party: [{ key: 'geysmog', level: 34 }, { key: 'grimcorvid', level: 34 }, { key: 'walrust', level: 35 }, { key: 'jarnwyrm', level: 37 }],
});

// ---- Rivals ----
// Kai — the friendly childhood-friend rival (a couple of casual battles).
T('rival_kai_1', {
  name: 'Kai', cls: 'Rival', reward: 400, music: 'battle_trainer', ai: 'smart',
  intro: 'Hey! Let\'s see how our starters stack up. No hard feelings, okay?',
  loss: 'Haha, you\'re a natural! Let\'s both get stronger!',
  party: [{ key: 'RIVAL_WEAK', level: 6 }, { key: 'nibbit', level: 6 }],
});
// Vera — the arrogant prodigy whose team EVOLVES across three meetings.
T('rival_vera_early', {
  name: 'Vera', cls: 'Rival', reward: 500, music: 'battle_trainer', ai: 'smart',
  intro: 'I picked the starter that beats yours on purpose. Don\'t take it personally — I just intend to win.',
  loss: 'Hmph. Beginner\'s luck. Don\'t expect it twice.',
  party: [{ key: 'RIVAL_STARTER', level: 8 }], fullTeam: true,   // stage 0, count 1
});
T('rival_vera_mid', {
  name: 'Vera', cls: 'Rival', reward: 2000, music: 'battle_trainer', ai: 'smart',
  intro: 'You\'ve grown. So have I — and so has my team. Let\'s find out who grew faster.',
  loss: 'Tch. You\'re still ahead. For now.',
  party: [{ key: 'RIVAL_STARTER', level: 27 }], fullTeam: true,  // stage 1, count 3
});

// ---- Elite Four + Champion (endgame; scaffolding) ----
T('e4_corvin', { name: 'Corvin', cls: 'Elite Four', reward: 8000, music: 'battle_elite', ai: 'smart', leader: true,
  intro: 'Darkness is not evil. It is honest. Face mine.',
  loss: 'You saw through the shadows.',
  party: [{ key: 'grimcorvid', level: 48 }, { key: 'umbrafloe', level: 48 }, { key: 'gulomaul', level: 49 }, { key: 'rattenkin', level: 50 }] });
T('e4_freyda', { name: 'Freyda', cls: 'Elite Four', reward: 8000, music: 'battle_elite', ai: 'smart', leader: true,
  intro: 'Strength of body, strength of will. Show me both.',
  loss: 'A worthy blow!',
  party: [{ key: 'boulderam', level: 49 }, { key: 'thundram', level: 49 }, { key: 'skjaldhawk', level: 50 }, { key: 'trolltoad', level: 51 }] });
T('e4_mara', { name: 'Mara', cls: 'Elite Four', reward: 8000, music: 'battle_elite', ai: 'smart', leader: true,
  intro: 'The departed still whisper. Can you hear them?',
  loss: 'The spirits favor you.',
  party: [{ key: 'pyrelight', level: 50 }, { key: 'hullghast', level: 50 }, { key: 'barrowght', level: 51 }, { key: 'seidkona', level: 52 }] });
T('e4_liv', { name: 'Liv', cls: 'Elite Four', reward: 8000, music: 'battle_elite', ai: 'smart', leader: true,
  intro: 'One last dance before the throne. Shall we?',
  loss: 'Beautifully played.',
  party: [{ key: 'vulpaura', level: 51 }, { key: 'bellsylph', level: 51 }, { key: 'dreamlyn', level: 52 }, { key: 'sylphund', level: 53 }] });
T('champion_sigrid', { name: 'Sigrid', cls: 'Champion', reward: 20000, music: 'battle_champion', ai: 'smart', leader: true,
  intro: 'Remember me? The ranger from Route 1. I never stopped climbing either. As Champion of Norvenna, I\'ll give you everything I have!',
  loss: 'The aurora chose well. Norvenna has a new Champion!',
  party: [{ key: 'stormgull', level: 54 }, { key: 'mystrix', level: 54 }, { key: 'ingotaur', level: 55 },
    { key: 'fjorddrake', level: 55 }, { key: 'ursnow', level: 56 }, { key: 'fimbulwyrm', level: 58 }] });

// ---- Final rival (Vera): full randomized team of 6 incl. her evolved starter ----
T('rival_vera_final', {
  name: 'Vera', cls: 'Rival', reward: 9000, music: 'battle_champion', ai: 'smart', leader: true,
  intro: 'So you made it to the Plateau too. Of course you did. One last time, then — no holding back. My full team against yours!',
  loss: 'Heh... all these years chasing you, and you\'re STILL a step ahead. Go on. Go be Champion. I\'ll be right behind you.',
  party: [{ key: 'RIVAL_STARTER', level: 52 }], fullTeam: true,   // stage 2, count 5
});

const STARTER_WEAK = { trollsprout: 'selkip', cindrel: 'trollsprout', selkip: 'cindrel' };
const STARTER_STRONG = { trollsprout: 'cindrel', cindrel: 'selkip', selkip: 'trollsprout' };
const STARTER_MID = { trollsprout: 'bryteknott', cindrel: 'pyrolisk', selkip: 'selkora' };
const STARTER_FINAL = { trollsprout: 'jotunwald', cindrel: 'fafnirn', selkip: 'krakelott' };
/** A tougher rematch copy of a trainer: every mon's level bumped up. */
function rematchTrainer(tr, bump) {
  return { ...tr, party: tr.party.map((p) => ({ ...p, level: Math.min(72, p.level + bump) })) };
}

/** Walk `n` pre-evolutions back from a species (stops at the base form). */
function preEvoStages(key, n) {
  let k = key;
  for (let i = 0; i < n; i++) { const pre = (typeof Dex !== 'undefined') ? Dex.preEvo(k) : null; if (pre) k = pre; else break; }
  return k;
}

/**
 * The rival's 5 support slots. Each slot is a themed short list, and ONE entry
 * per slot is chosen once at the start of a playthrough (stored in the save),
 * so the rival's team is consistent across their battles but differs run-to-run.
 * e.g. slot 1 is always a flyer, slot 2 always a Water type, slot 3 always a
 * stone-evolution, and so on.
 */
const RIVAL_SLOTS = [
  ['stormgull', 'grimcorvid', 'skjaldhawk'],   // a flyer
  ['fjorddrake', 'hullghast', 'walrust'],       // a Water type
  ['vulpaura', 'pyrelight', 'bellsylph'],       // a stone-evolution
  ['ingotaur', 'boulderam', 'gulomaul'],        // a heavy bruiser
  ['mystrix', 'seidkona', 'wyrmskim'],          // an ace
];

/** Chosen once per playthrough and remembered in the save. */
function rivalTeamKeys() {
  if (!Game.flags.rivalTeam) Game.flags.rivalTeam = RIVAL_SLOTS.map((pool) => Util.pick(pool));
  return Game.flags.rivalTeam;
}

/**
 * Resolve the rival's team. opts:
 *   stage: 0 basic / 1 mid / 2 final — the rival's mons EVOLVE across battles.
 *   count: how many support mons (fills toward 6) — grows across the story.
 * The support species come from the fixed per-playthrough slot picks (finals),
 * de-evolved to match `stage`, so it's the SAME team getting stronger each time.
 */
function resolveRivalParty(trainer, opts) {
  opts = opts || {};
  const stage = opts.stage !== undefined ? opts.stage : 2;
  const starter = Game.flags.starter || 'cindrel';
  const strongBasic = STARTER_STRONG[starter];
  const starterAtStage = [strongBasic, STARTER_MID[strongBasic], STARTER_FINAL[strongBasic]][stage];
  const party = trainer.party.map((p) => {
    if (p.key === 'RIVAL_WEAK') return { ...p, key: STARTER_WEAK[starter] };
    if (p.key === 'RIVAL_STRONG') return { ...p, key: strongBasic };
    if (p.key === 'RIVAL_STARTER') return { ...p, key: starterAtStage };
    if (p.key === 'RIVAL_STARTER_FINAL') return { ...p, key: STARTER_FINAL[strongBasic] };
    return p;
  });
  if (trainer.fullTeam || opts.count) {
    const finals = rivalTeamKeys().filter((k) => k !== STARTER_FINAL[strongBasic]);
    const baseLv = party[0] ? party[0].level : 52;
    const n = opts.count || 5;
    for (let i = 0; i < n && party.length < 6; i++) {
      party.push({ key: preEvoStages(finals[i % finals.length], 2 - stage), level: baseLv - 1 - (i % 3) });
    }
  }
  return { ...trainer, party };
}
