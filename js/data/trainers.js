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
T('rival_kai_1', {
  name: 'Kai', cls: 'Rival', reward: 400, music: 'battle_trainer', ai: 'smart',
  intro: 'Hey! Let\'s see how our starters stack up. No hard feelings, okay?',
  loss: 'Haha, you\'re a natural! Let\'s both get stronger!',
  party: [{ key: 'RIVAL_WEAK', level: 6 }],   // resolved from player's choice
});
T('rival_vera_1', {
  name: 'Vera', cls: 'Rival', reward: 500, music: 'battle_trainer', ai: 'smart',
  intro: 'I chose the starter that beats yours on purpose. Don\'t take it personally — I just intend to win.',
  loss: 'Hmph. Beginner\'s luck. Don\'t expect it twice.',
  party: [{ key: 'RIVAL_STRONG', level: 7 }],
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

/** Resolve rival placeholder keys from the player's starter choice. */
function resolveRivalParty(trainer) {
  const map = {
    RIVAL_WEAK: { trollsprout: 'selkip', cindrel: 'trollsprout', selkip: 'cindrel' },
    RIVAL_STRONG: { trollsprout: 'cindrel', cindrel: 'selkip', selkip: 'trollsprout' },
  };
  const starter = Game.flags.starter || 'cindrel';
  return {
    ...trainer,
    party: trainer.party.map((p) => {
      if (map[p.key]) return { ...p, key: map[p.key][starter] };
      return p;
    }),
  };
}
