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

// ---- Team Ionar first appearance (Route 2 grunt, optional trigger) ----
Scripts.register('ionar_grunt_r2', (npc) => {
  Textbox.say('GRUNT: Team Ionar is "borrowing" the aurora\'s energy. You didn\'t see anything, kid — unless you want a battle!', () => {
    Music.play('battle_ionar');
    Game.startTrainerBattle(Trainers.ionar_grunt1, () => {
      Textbox.say('GRUNT: Ugh! This isn\'t over. The boss will wake Auroryx with or without you!', Scripts.done);
    });
  });
});

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
