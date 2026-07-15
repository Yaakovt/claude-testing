'use strict';
/**
 * Storyline & NPC scripts for Norvenna. Registered onto the Scripts engine.
 * The mandatory starter gift, gym battles, Team Ionar beats, and townsfolk.
 */

// ---- Professor Aspen: mandatory starter gift ----
Scripts.register('aspen_starter', () => {
  if (Game.flags.starter) {
    Textbox.say('ASPEN: How is your ' + Dex.byKey[Game.flags.starter].name + ' doing? A fine partner. Off you go — the aurora won\'t study itself!', Scripts.done);
    return;
  }
  const keys = ['trollsprout', 'cindrel', 'selkip'];
  const choose = () => {
    Textbox.say('ASPEN: Three young fakemon share my lab. One of them should go with you. Which calls to you?', () => {
      Textbox.ask('Choose your first partner:',
        ['Trollsprout — Grass', 'Cindrel — Fire', 'Selkip — Water'], (i) => {
          const key = keys[i];
          const d = Dex.byKey[key];
          Game.registerDex(key, 'seen');
          Textbox.ask('The ' + d.dex.species + ', ' + d.name + '. ' + d.dex.entry + ' ... Take this one?', ['Yes', 'No'], (yn) => {
            if (yn !== 0) { choose(); return; }
            Game.flags.starter = key;
            Scripts.giveMon(key, 5, () => {
              Textbox.say([
                'ASPEN: Excellent choice! ' + d.name + ' already likes you.',
                'ASPEN: Take these, too — a POKEDEX to record the fakemon you meet, and some Fieldorbs to catch them.',
                'ASPEN: Two young trainers set out today as well — my grandkid KAI, and a sharp one named VERA. You\'ll surely cross paths.',
                'ASPEN: Now — head south through Route 1 to BIRCHWICK TOWN and challenge Leader ASTRID. Your journey begins!',
              ], () => {
                Game.give('fieldorb', 5);
                Game.flags.gotStarter = true;
                Game.flags.hasDex = true;
                Scripts.done();
              });
            });
          });
        });
    });
  };
  choose();
});

// keep the player from leaving the lab before choosing (door script guard)
Scripts.register('lab_exit_guard', () => {
  if (!Game.flags.starter) { Textbox.say('(You shouldn\'t leave without a partner. The Professor is waiting.)', Scripts.done); }
  else Scripts.done();
});

// ---- generic post-trainer ----
Scripts.register('trainer_after', (npc) => {
  const tr = npc && npc.trainer ? Trainers[npc.trainer] : null;
  Textbox.say(tr && tr.loss ? tr.name + ': ' + tr.loss : 'Good battle!', Scripts.done);
});

// ---- Gym 1: Astrid (Normal) ----
Scripts.register('gym_astrid', () => {
  if (Game.badges[0]) { Textbox.say('ASTRID: That Steadfast Badge suits you. Onward — MOSSMERE\'s forest gym is next!', Scripts.done); return; }
  Textbox.say('ASTRID: So you\'re the newcomer from Frosthollow. I am ASTRID, the Steadfast Heart. Let me measure your bond!', () => {
    Music.play('battle_gym');
    Game.startTrainerBattle(Trainers.astrid, () => {
      Scripts.giveBadge(0, 'Steadfast', () => {
        Textbox.say('ASTRID: With the Steadfast Badge, fakemon up to Lv 20 will obey you, and you can use CUT outside battle.', () => {
          Game.flags.hm_cut = true;
          Scripts.giveItem('tm25', 1, () => {   // TM25 Body Slam
            Textbox.say('ASTRID: Head south to MOSSMERE TOWN. And... watch out for the grey-coated folk. They call themselves Team Ionar.', Scripts.done);
          });
        });
      });
    });
  });
});

// ---- Gym 2: Eirik (Grass) ----
Scripts.register('gym_eirik', () => {
  if (Game.badges[1]) { Textbox.say('EIRIK: The forest is proud of you. Head on — TIDESEND HARBOR and its Water gym await.', Scripts.done); return; }
  if (!Game.badges[0]) { Textbox.say('EIRIK: The roots only open to those who\'ve earned the Steadfast Badge. Come back then.', Scripts.done); return; }
  Textbox.say('EIRIK: I am EIRIK, the Rooted Will. Mossmere\'s forest chose me — let\'s see if it whispers your name too!', () => {
    Music.play('battle_gym');
    Game.startTrainerBattle(Trainers.eirik, () => {
      Scripts.giveBadge(1, 'Verdant', () => {
        Game.flags.hm_rock_smash = true;
        Scripts.giveItem('tm19', 1, () => {   // TM19 Sap Surge
          Textbox.say('EIRIK: The Verdant Badge lets fakemon up to Lv 30 obey you, and you can now use ROCK SMASH. Beware — Team Ionar was seen near the harbor.', Scripts.done);
        });
      });
    });
  });
});

// ---- Gym 3: Runa (Water) ----
Scripts.register('gym_runa', () => {
  if (Game.badges[2]) { Textbox.say('RUNA: Ride safe out there. They say Team Ionar has moved on the Lumenveil observatory...', Scripts.done); return; }
  if (!Game.badges[1]) { Textbox.say('RUNA: Earn the Verdant Badge in Mossmere first, little wave. Then the tide will test you.', Scripts.done); return; }
  Textbox.say('RUNA: I am RUNA, the Turning Tide. Let\'s see if your resolve floats or sinks!', () => {
    Music.play('battle_gym');
    Game.startTrainerBattle(Trainers.runa, () => {
      Scripts.giveBadge(2, 'Tidal', () => {
        Game.flags.hm_surf = true;
        Scripts.giveItem('tm03', 1, () => {   // TM03 Glacier Ray
          Textbox.say('RUNA: The Tidal Badge lets fakemon up to Lv 40 obey you, and you can now use SURF! The sea is yours to cross.', Scripts.done);
        });
      });
    });
  });
});

// ---- Gyms 4-8 (shared helper) ----
function gymBattle(badgeIdx, prevIdx, leaderKey, badgeName, hmFlag, hmMoveName, tmId, afterMsg) {
  return () => {
    if (Game.badges[badgeIdx]) { Textbox.say(Trainers[leaderKey].name + ': ' + afterMsg, Scripts.done); return; }
    if (prevIdx >= 0 && !Game.badges[prevIdx]) { Textbox.say(Trainers[leaderKey].name + ': Come back once you\'ve earned the previous badge.', Scripts.done); return; }
    Textbox.say(Trainers[leaderKey].intro, () => {
      Music.play('battle_gym');
      Game.startTrainerBattle(Trainers[leaderKey], () => {
        Scripts.giveBadge(badgeIdx, badgeName, () => {
          const finish = () => {
            if (tmId) Scripts.giveItem(tmId, 1, Scripts.done); else Scripts.done();
          };
          if (hmFlag) { Game.flags[hmFlag] = true; Textbox.say('You can now use ' + hmMoveName + ' in the field!', finish); }
          else finish();
        });
      });
    });
  };
}
Scripts.register('gym_brandt', gymBattle(3, 2, 'brandt', 'Ember', 'hm_strength', 'STRENGTH', 'tm04', 'Stay fiery out there!'));
Scripts.register('gym_sylja', gymBattle(4, 3, 'sylja', 'Lumen', 'hm_flash', 'FLASH', 'tm05', 'The aurora watches over you.'));
Scripts.register('gym_torvald', gymBattle(5, 4, 'torvald', 'Iron', 'hm_fly', 'FLY', 'tm20', 'Stand firm, always.'));
Scripts.register('gym_yrsa', gymBattle(6, 5, 'yrsa', 'Glacier', 'hm_waterfall', 'WATERFALL', 'tm03', 'Keep your warmth close.'));
Scripts.register('gym_signe', gymBattle(7, 6, 'signe', 'Storm', null, null, 'tm22', 'Go — the League is yours to claim.'));

// ---- Team Ionar first appearance (Route 2 grunt, optional trigger) ----
Scripts.register('ionar_grunt_r2', (npc) => {
  Textbox.say('GRUNT: Team Ionar is "borrowing" the aurora\'s energy. You didn\'t see anything, kid — unless you want a battle!', () => {
    Music.play('battle_ionar');
    Game.startTrainerBattle(Trainers.ionar_grunt1, () => {
      Textbox.say('GRUNT: Ugh! This isn\'t over. The boss will wake Auroryx with or without you!', Scripts.done);
    });
  });
});

// ---- Sky Spire climax: Magnus Voll, then Auroryx ----
Scripts.register('spire_boss', () => {
  if (Game.flags.caughtAuroryx || Game.flags.beat_ionar_boss) {
    Textbox.say('(The summit altar is quiet now. The aurora drifts gently overhead.)', Scripts.done);
    return;
  }
  Textbox.say(Trainers.ionar_boss.intro, () => {
    Music.play('battle_ionar');
    Game.startTrainerBattle(Trainers.ionar_boss, () => {
      Game.flags.beat_ionar_boss = true;
      Textbox.say([Trainers.ionar_boss.name + ': ' + Trainers.ionar_boss.loss,
        'MAGNUS VOLL: The Storm-Heart rejects me... but it has already half-woken. AURORYX descends! It falls to YOU now!',
        '(Magnus flees down the spire. Above the altar, the aurora gathers into a single, blazing shape.)'], () => {
        Game.give('ultraorb', 10);
        Textbox.say('(Prof. Aspen\'s voice crackles over your radio: "I gave you Ultraorbs — CATCH it, or Norvenna\'s sky will never be calm again!")', () => {
          Game.registerDex('auroryx', 'seen');
          Music.play('battle_champion');
          Overworld.beginBattleFlash(() => {
            Game.startWildBattle('auroryx', 50, 'aurora');
            Game.flags.auroryxEncountered = true;
          });
        });
      });
    });
  });
});

// ---- Aurora Plateau gauntlet: rival -> Elite Four (in order) -> Champion ----
// Each challenger blocks the hall until beaten, then steps aside (passable).
function plateauBattle(trainerKey, prereqFlag, prereqMsg, nextHint, music, resolver) {
  return (npc) => {
    if (Game.flags['beat_' + trainerKey]) {
      if (npc) npc.passable = true;
      Textbox.say(Trainers[trainerKey].name + ': ' + Trainers[trainerKey].loss + ' ' + nextHint, Scripts.done);
      return;
    }
    if (Game.badgeCount() < 8) { Textbox.say('An attendant stops you: "Only trainers with all EIGHT badges may enter the League."', Scripts.done); return; }
    if (prereqFlag && !Game.flags[prereqFlag]) { Textbox.say(prereqMsg, Scripts.done); return; }
    const tr = resolver ? resolver(Trainers[trainerKey]) : Trainers[trainerKey];
    Textbox.say(tr.intro, () => {
      Music.play(music || 'battle_elite');
      Game.startTrainerBattle(tr, () => {
        Game.flags['beat_' + trainerKey] = true;
        if (npc) npc.passable = true;
        Textbox.say(tr.name + ': ' + tr.loss + ' ' + nextHint, Scripts.done);
      });
    });
  };
}
Scripts.register('rival_final', plateauBattle('rival_vera_final', null, '', 'The Elite Four await beyond.', 'battle_champion', resolveRivalParty));
Scripts.register('e4_1', plateauBattle('e4_corvin', 'beat_rival_vera_final', 'VERA blocks the way: "Beat me first if you want the League!"', 'Freyda is next.'));
Scripts.register('e4_2', plateauBattle('e4_freyda', 'beat_e4_corvin', 'Defeat Corvin before you pass.', 'Mara awaits.'));
Scripts.register('e4_3', plateauBattle('e4_mara', 'beat_e4_freyda', 'Defeat Freyda before you pass.', 'Only Liv remains before the Champion.'));
Scripts.register('e4_4', plateauBattle('e4_liv', 'beat_e4_mara', 'Defeat Mara before you pass.', 'Beyond lies the Champion...'));
Scripts.register('champion', (npc) => {
  if (Game.flags.champion) { if (npc) npc.passable = true; Textbox.say('SIGRID: The aurora is calm, and Norvenna has its Champion — you. Come challenge me any time!', Scripts.done); return; }
  if (Game.badgeCount() < 8) { Textbox.say('The Champion\'s hall is sealed.', Scripts.done); return; }
  if (!Game.flags.beat_e4_liv) { Textbox.say('The Champion\'s hall is sealed until the Elite Four are defeated.', Scripts.done); return; }
  Textbox.say(Trainers.champion_sigrid.intro, () => {
    Music.play('battle_champion');
    Game.startTrainerBattle(Trainers.champion_sigrid, () => {
      Game.flags.champion = true;
      Music.play('victory');
      Textbox.say([Trainers.champion_sigrid.name + ': ' + Trainers.champion_sigrid.loss,
        'SIGRID: From the ranger who walked Route 1 with you, to the Champion who bested me — what a journey. The aurora sleeps peacefully tonight, thanks to you.',
        '★ ' + Game.playerName + ' became the CHAMPION of Norvenna! ★',
        'Team Ionar is scattered, Auroryx is at peace, and eight badges shine on your card. Thank you for playing LEGENDS OF NORVENNA!'], () => {
        Game.flags.gameComplete = true;
        Scripts.done();
      });
    });
  });
});

// ---- Sidequest: choose one of two fossils, then revive it ----
Scripts.register('fossil_choice', () => {
  if (Game.flags.gotFossil) { Textbox.say('MINER: That was the last fossil I had spare. Get it revived at the lab bench!', Scripts.done); return; }
  Textbox.ask('MINER: I dug up two fossils but can only part with one. Which speaks to you?',
    ['Fin Fossil', 'Tusk Fossil', 'Neither'], (pick) => {
      if (pick === 2) { Textbox.say('MINER: Ha, take your time. I\'m not going anywhere.', Scripts.done); return; }
      Game.flags.gotFossil = true;
      Scripts.giveItem(pick === 0 ? 'fin_fossil' : 'tusk_fossil', 1, Scripts.done);
    });
});
Scripts.register('fossil_reviver', () => {
  const has = Game.hasItem('fin_fossil') ? 'fin_fossil' : Game.hasItem('tusk_fossil') ? 'tusk_fossil' : null;
  if (!has) { Textbox.say('SCIENTIST: Bring me an ancient FOSSIL and my machine will breathe life back into it!', Scripts.done); return; }
  const species = Items[has].fossil;
  Textbox.say('SCIENTIST: A genuine fossil! Onto the machine it goes... stand back!', () => {
    Game.removeItem(has);
    Scripts.giveMon(species, 20, () => Textbox.say('SCIENTIST: Extraordinary! An ancient fakemon, alive after all these ages!', Scripts.done));
  });
});

// ---- Rival (Vera) battles: team evolves across the story ----
function rivalMeet(flag, trainerKey, stage, count) {
  return () => {
    if (Game.flags[flag]) { Textbox.say('VERA: Don\'t slow down now. I certainly won\'t.', Scripts.done); return; }
    const tr = resolveRivalParty(Trainers[trainerKey], { stage, count });
    Textbox.say(tr.intro, () => {
      Music.play('battle_trainer');
      Game.startTrainerBattle(tr, () => { Game.flags[flag] = true; Textbox.say('VERA: ' + tr.loss, Scripts.done); });
    });
  };
}
Scripts.register('rival_r1', rivalMeet('beat_rival_early', 'rival_vera_early', 0, 1));
Scripts.register('rival_mid', rivalMeet('beat_rival_mid', 'rival_vera_mid', 1, 3));

// ---- townsfolk & flavor ----
const chats = {
  fh_villager1: 'Under the aurora, they say a great fakemon sleeps. On calm nights you can almost hear it breathe.',
  fh_villager2: 'Professor Aspen studies the aurora day and night. Kind soul, if a bit scattered!',
  fh_oldman: 'In my day we walked to Stormcrest in the snow, uphill both ways! ...Well, it felt that way.',
  fh_kid: 'When I grow up I\'m gonna catch every fakemon in Norvenna! You\'ll see!',
  r1_catcher: 'Sneak up through tall grass and wild fakemon appear. Weaken one, then throw an orb to catch it!',
  bw_villager1: 'BIRCHWICK smells of fresh-cut pine year round. The gym\'s just south of the square.',
  bw_villager2: 'The Pokecenter heals your whole team for free. The mart sells orbs and potions. Handy pair!',
  bw_hiker: 'Route 2 has a bush you can CUT once you\'ve got the knack. Beat Astrid and she\'ll show you.',
  bw_oldman: 'Team Ionar? Bunch of engineers who think they can bottle the sky. No good will come of it.',
  bw_kid: 'I saw a grey-coated stranger poking around the old depot. Gave me the shivers!',
  r2_hint: 'That cave — Whisperwood Hollow — is full of cave fakemon. Bring a light... or FLASH.',
  center_chat: 'Rested up? A healthy team makes all the difference out there.',
  mart_chat: 'Greatorbs cost more but catch better. Worth it for a tough fakemon!',
  house_mom: 'Oh, be careful out there! Come home any time to rest. ...Well, if this were your house.',
  house_oldman: 'Evolution! Some fakemon change with levels, some with stones, some with friendship. Marvelous!',
  mm_villager1: 'MOSSMERE grows over old ruins. Sometimes the moss glows at night — no one knows why.',
  mm_villager2: 'Leader EIRIK never loses on his home turf. Bring a Fire or Flying type, maybe!',
  mm_ranger: 'South of here is TIDESEND HARBOR. You\'ll need SURF to go much further, though.',
  mm_oldman: 'Team Ionar bought up the old aurora-observatory in Lumenveil. For "research," they say. Ha!',
  r3_hint: 'Beat Leader RUNA and you can SURF. Then this whole coast opens up — fishing spots, hidden isles, everything!',
  ts_sailor: 'Tidesend never sleeps. Ships in at dawn, ships out at dusk, and RUNA training in between.',
  ts_fisher: 'Cast a rod on the docks and who knows what bites. Bigger rods, bigger catches!',
  ts_villager: 'RUNA once out-swam a Fjorddrake, they say. Bring your sturdiest team!',
  r4_hint: 'Found a GOOD ROD out here once. Better rod, rarer fish — check the springs!',
  ef_villager1: 'Emberfall\'s hot springs never cool. Brandt trains in the hottest one!',
  ef_villager2: 'Water and Ground moves cool Brandt\'s Fire types right down.',
  ef_hiker: 'North of here, Route 5 glows under the aurora all the way to Lumenveil.',
  lv_villager1: 'Team Ionar took over our observatory! They keep muttering about "waking the sky."',
  lv_villager2: 'Sylja reads minds, they say. Dark and Ghost types cloud her sight, though.',
  lv_grunt: 'Team Ionar\'s work is almost done! Soon the whole sky will be OURS to power! ...Now scram.',
  id_villager1: 'Irondeep\'s fakemon are tough as the ore we mine. Fire and Fighting crack their shells.',
  id_villager2: 'Torvald forged his own badge, you know. Steel through and through.',
  fm_villager1: 'Frostmoor\'s got no gym — just a warm bed and a hot meal before the glacier road. Rest up!',
  fm_villager2: 'Not every town needs a gym. Some just need to be home.',
  fm_villager3: 'The Center here heals for free, same as anywhere. Take your time.',
  gh_villager1: 'Yrsa\'s ice is no joke. Fire, Rock, and Steel moves will serve you well.',
  gh_villager2: 'Past Glacierholm, Route 9 climbs to Stormcrest and the Sky Spire itself.',
  sc_villager1: 'The Sky Spire pierces the aurora. Team Ionar climbed it to wake Auroryx — someone has to stop them!',
  sc_villager2: 'Beat Signe for your eighth badge, then the Aurora Plateau opens to the east.',
  sc_grunt: 'You again?! The boss is at the summit finishing the ritual. You\'ll NEVER reach him in time!',
};
for (const name in chats) {
  const line = chats[name];
  Scripts.register(name, () => Textbox.say(line, Scripts.done));
}

// The Tidesend fisher gifts the Old Rod (so Water types are catchable).
Scripts.register('ts_fisher', () => {
  if (!Game.flags.gotOldRod) {
    Textbox.say('FISHER: You\'ve the look of an angler! Here — take my spare OLD ROD. Face the water and give it a cast!', () => {
      Game.flags.gotOldRod = true;
      Scripts.giveItem('old_rod', 1, Scripts.done);
    });
  } else Textbox.say('FISHER: Cast a rod on the docks and who knows what bites. Bigger rods, bigger catches!', Scripts.done);
});

// A Team Ionar grunt at the harbor — beating them drops their prototype Primeorb (once).
Scripts.register('ionar_tidesend', (npc) => {
  if (Game.flags.beat_ionar_harbor) { Textbox.say('GRUNT: ...Just leave me alone. The boss will have my head for losing the prototype.', Scripts.done); return; }
  Textbox.say('GRUNT: Hey! This crate\'s Team Ionar property! It\'s got our prototype capture coil — worth more than your whole team. Back OFF!', () => {
    Music.play('battle_ionar');
    Game.startTrainerBattle(Trainers.ionar_grunt2, () => {
      Game.flags.beat_ionar_harbor = true;
      Textbox.say('GRUNT: No! The prototype — it\'s rolling away! ...Ugh, keep it, just don\'t tell the boss!', () => {
        Scripts.giveItem('primeorb', 1, () => {
          Textbox.say('(The PRIMEORB hums with captured aurora-light. Team Ionar built only one. Use it wisely — it never fails.)', Scripts.done);
        });
      });
    });
  });
});
