/**
 * ACT 1 — THE FESTIVAL (weiVillage). Book-1 beats 3-7 of docs/lore-bible.md:
 * festival preparation with the family, the exhibition duel against Wei Jin
 * Amon (branch: trick / honest / refuse / sabotage), Li Markuth's descent,
 * Suriel's intervention, and the three-way answer to the heavens' warning.
 *
 * Origin mirroring (lore bible §5 note): the Unsouled start gets the shame
 * framing; clan starts get the expectation framing — routed by `origin`
 * conditions inside the family dialogues.
 *
 * Canon names: Seisha, Jaran, Kelsa (the Shi household), Wei Jin Sairus,
 * Wei Jin Amon, Li Markuth, Suriel. The game's one on-map family carries the
 * canon Shi names for every origin (documented deviation — NPCs are static
 * map data; the dialogue framing, not the name plate, mirrors the origin).
 * INVENTED names are marked inline.
 */

import { registerQuest } from "../systems/story.js";
import { registerDialogue } from "../systems/dialogue.js";
import { registerCutscene } from "../systems/cutscene.js";
import {
  addMapEnemies,
  addMapEntries,
  addMapNpcs,
  addMapOnEnter,
} from "../game/maps/registry.js";
import { NPC_PALETTES } from "../game/npc.js";

/** Arena ring interior (tile coords) — the duel/descent stage. */
const ARENA = { tx: 22, ty: 17 };

export function registerAct1(): void {
  // ------------------------------------------------------------- quests

  registerQuest({
    id: "the-seven-year-festival",
    title: "The Seven-Year Festival",
    description:
      "Seven years of lanterns go up in one dawn, and your name is on the rolls. Make the rounds before the matches begin.",
    objectives: [
      { id: "mother", text: "Speak with your mother, Seisha", flag: "a1.metMother" },
      { id: "father", text: "Speak with your father, Jaran", flag: "a1.metFather" },
      { id: "kelsa", text: "Find your sister Kelsa in the courtyard", flag: "a1.metKelsa" },
      { id: "patriarch", text: "Present yourself to Patriarch Wei Jin Sairus by the ring", flag: "a1.metPatriarch" },
    ],
    reward: [{ kind: "giveScales", amount: 2 }, { kind: "startQuest", quest: "the-exhibition-match" }],
    autoStart: true,
  });

  registerQuest({
    id: "the-exhibition-match",
    title: "The Exhibition Match",
    description:
      "To soothe the Heaven's Glory delegation, the Patriarch has fed you to an exhibition against Wei Jin Amon — two full stages above you. How you meet him is yours to decide.",
    objectives: [
      { id: "choose", text: "Decide how to face Wei Jin Amon", flag: "a1.duelChosen" },
      { id: "settle", text: "Settle the exhibition, one way or another", flag: "a1.duelResolved" },
    ],
    // The festival's true ending arrives the moment the match is settled.
    reward: [{ kind: "cutscene", id: "a1-markuth" }],
  });

  // ------------------------------------------------------- the family

  // Mother — Seisha-figure (canon: clinical Soulsmith; love via equipment).
  registerDialogue({
    id: "a1-mother",
    start: "greet",
    nodes: [
      {
        id: "greet",
        speaker: "Seisha",
        text: "Hold still. Spirit first, breakfast after. {playerName}, your channels read... adequate. The drudge agrees.",
        effects: [{ kind: "setFlag", key: "a1.metMother" }],
        branches: [
          { when: [{ kind: "flag", key: "a1.suriel.toldFamily" }], next: "told" },
          { when: [{ kind: "origin", origin: "unsouled" }], next: "shame" },
        ],
        next: "expect",
      },
      {
        id: "told",
        speaker: "Seisha",
        text: "You died in the festival sand, you say, and a woman out of heaven wound you back like thread on a spool. Your pulse is steady. Dream-aura residue presents exactly this way. (She says it very kindly, which is worse.)",
        next: "kit",
      },
      {
        id: "shame",
        speaker: "Seisha",
        text: "The clan list has you down as an exhibition, not a contestant. Ignore the engraving on their faces — read your opponent's footwork instead. Data wins matches; pride loses them.",
        next: "kit",
      },
      {
        id: "expect",
        speaker: "Seisha",
        text: "The {clanName} expects a finalist this festival. Expectation is a weight. Wear it like training bands, not like a stone.",
        next: "kit",
      },
      {
        id: "kit",
        speaker: "Seisha",
        text: "I have reground your travel salves and re-scripted the seals on your pack. Take both. And take notes.",
        choices: [
          {
            label: "Ask about her Soulsmithing.",
            conditions: [{ kind: "flag", key: "a1.askedDrudge", truthy: false }],
            effects: [{ kind: "setFlag", key: "a1.askedDrudge" }, { kind: "knowledge", amount: 1 }],
            next: "drudge",
          },
          { label: "Thank her and go." },
        ],
      },
      {
        id: "drudge",
        speaker: "Seisha",
        text: "The drudge reads madra the way you read weather. Remnants are only weather that remembers being someone — bindings, aspects, habits. Everything can be taken apart. Remember that today.",
      },
    ],
  });

  // Father — Jaran-figure (canon: gruff, wounded pride, crippled leg).
  registerDialogue({
    id: "a1-father",
    start: "greet",
    nodes: [
      {
        id: "greet",
        speaker: "Jaran",
        text: "Hm. Up early. Good.",
        effects: [{ kind: "setFlag", key: "a1.metFather" }],
        branches: [
          { when: [{ kind: "flag", key: "a1.suriel.toldFamily" }], next: "told" },
          {
            when: [{ kind: "flag", key: "a1.duel.honest" }, { kind: "flag", key: "a1.duelResolved" }],
            next: "proud",
          },
          { when: [{ kind: "flag", key: "a1.duel.refused" }], next: "ashamed" },
          { when: [{ kind: "origin", origin: "unsouled" }], next: "shame" },
        ],
        next: "expect",
      },
      {
        id: "told",
        speaker: "Jaran",
        text: "Dead men don't eat breakfast. Whatever the Li slipped into your cup at the festival, walk it off. And stop repeating that story where the elders can hear you.",
      },
      {
        id: "proud",
        speaker: "Jaran",
        text: "You stood in the ring and let them see you bleed. That's the only language this valley respects. (He gives you a nod. From him, it is a ceremony.)",
        next: "advice",
      },
      {
        id: "ashamed",
        speaker: "Jaran",
        text: "You turned your back on the sand. The clan will forget it in seven years. I won't carry it for you in the meantime.",
      },
      {
        id: "shame",
        speaker: "Jaran",
        text: "When they laugh at the badge, boy, they're laughing at me too. A crippled leg and a crippled spirit under one roof — the clan keeps count. Make them choke on it quietly.",
        next: "advice",
      },
      {
        id: "expect",
        speaker: "Jaran",
        text: "Spear up, elbow in. The {clanName} doesn't send its children to the sand to lose. It sends them to be seen winning.",
        next: "advice",
      },
      {
        id: "advice",
        speaker: "Jaran",
        text: "The festival eats the unprepared. When your mother's done fussing, present yourself to the Patriarch by the ring. And bow lower than feels right.",
      },
    ],
  });

  // Sister — Kelsa-figure (canon: drill-sergeant warmth, fierce in private).
  registerDialogue({
    id: "a1-kelsa",
    start: "greet",
    nodes: [
      {
        id: "greet",
        speaker: "Kelsa",
        text: "There you are. Forms first, feelings later.",
        effects: [{ kind: "setFlag", key: "a1.metKelsa" }],
        branches: [{ when: [{ kind: "flag", key: "a1.suriel.toldFamily" }], next: "told" }],
        next: "main",
      },
      {
        id: "told",
        speaker: "Kelsa",
        text: "Heaven's messengers and a drowned mountain. Mother says dream residue; father says Li poison. (quietly) If you believe it, then train like it's true. That part I can help with.",
        next: "main",
      },
      {
        id: "main",
        speaker: "Kelsa",
        text: "The rolls are posted and you're on them. Don't make me watch you freeze in front of the whole valley.",
        choices: [
          {
            label: "Spar with me before the matches.",
            conditions: [{ kind: "flag", key: "a1.sparredKelsa", truthy: false }],
            effects: [{ kind: "setFlag", key: "a1.sparredKelsa" }, { kind: "knowledge", amount: 1 }],
            next: "spar",
          },
          { label: "Any advice for the ring?", next: "advice" },
          { label: "Just came to see you.", next: "warm" },
        ],
      },
      {
        id: "spar",
        speaker: "Kelsa",
        text: "(Three rounds by the training dummies. She puts you in the dirt twice; the third time you read the feint before her shoulder moves.) Better. Watch the shoulders, not the hands. Hands lie for a living.",
      },
      {
        id: "advice",
        speaker: "Kelsa",
        text: "Wei Jin Amon fights like the rules were written for him. They were. So read them closer than he ever bothered to.",
      },
      {
        id: "warm",
        speaker: "Kelsa",
        text: "Then see me after the sand settles. Win or lose, you eat with us. That's not negotiable.",
      },
    ],
  });

  // ------------------------------------------- the Patriarch & the duel

  registerDialogue({
    id: "a1-sairus",
    start: "greet",
    nodes: [
      {
        id: "greet",
        speaker: "Wei Jin Sairus",
        text: "Ah. The young one of the hour. The Seven-Year Festival smiles upon us all — and upon some of us it must also lean.",
        effects: [{ kind: "setFlag", key: "a1.metPatriarch" }],
        branches: [
          { when: [{ kind: "flag", key: "a1.duelResolved" }], next: "after" },
          {
            when: [{ kind: "flag", key: "a1.duelWon" }, { kind: "flag", key: "a1.duel.trick" }],
            next: "wonTrick",
          },
          { when: [{ kind: "flag", key: "a1.duelWon" }], next: "wonHonest" },
          { when: [{ kind: "flag", key: "a1.duelChosen" }], next: "pending" },
        ],
        next: "offer",
      },
      {
        id: "offer",
        speaker: "Wei Jin Sairus",
        text: "Heaven's Glory honors us with observers today, and observers must be soothed. You will face my grandson, Wei Jin Amon, in exhibition. Two stages above you — the delegation finds the arithmetic comforting.",
        next: "choose",
      },
      {
        id: "choose",
        speaker: "Wei Jin Sairus",
        text: "The ring is scripted, the judges are bought— forgive me, *appointed*. How will you meet him?",
        choices: [
          {
            // Canon-style rigging (lore §5 beat 4) — second nature to an Unsouled.
            label: "Palm a halfsilver token into the salute. (Rig the duel.)",
            conditions: [{ kind: "origin", origin: "unsouled" }],
            effects: [
              { kind: "setFlag", key: "a1.duel.trick" },
              { kind: "setFlag", key: "a1.duelChosen" },
              { kind: "resolve", amount: 1 },
              { kind: "cutscene", id: "a1-duel-trick" },
            ],
          },
          {
            // Clan starts need to have learned how matches are really won.
            label: "Palm a halfsilver token into the salute. (Rig the duel.)",
            conditions: [
              { kind: "origin", origin: "unsouled", not: true },
              { kind: "flag", key: "axis.knowledge", gte: 1 },
            ],
            effects: [
              { kind: "setFlag", key: "a1.duel.trick" },
              { kind: "setFlag", key: "a1.duelChosen" },
              { kind: "resolve", amount: 1 },
              { kind: "cutscene", id: "a1-duel-trick" },
            ],
          },
          {
            label: "Fight him honestly, strength against strength.",
            effects: [
              { kind: "setFlag", key: "a1.duel.honest" },
              { kind: "setFlag", key: "a1.duelChosen" },
              { kind: "cutscene", id: "a1-duel-honest" },
            ],
          },
          {
            label: "Refuse the exhibition.",
            effects: [
              { kind: "setFlag", key: "a1.duel.refused" },
              { kind: "setFlag", key: "a1.duelChosen" },
              { kind: "setFlag", key: "a1.duelResolved" },
              { kind: "reputation", faction: "wei", amount: -2 },
            ],
            next: "refused",
          },
          {
            // The Resolve route: ruthless pragmatism, paid in reputation.
            label: "(Quietly) See that Amon's tea is... fortifying. And place a bet.",
            conditions: [{ kind: "flag", key: "axis.resolve", gte: 1 }],
            effects: [
              { kind: "setFlag", key: "a1.duel.sabotage" },
              { kind: "setFlag", key: "a1.duelChosen" },
              { kind: "setFlag", key: "a1.duelResolved" },
              { kind: "reputation", faction: "wei", amount: -2 },
              { kind: "resolve", amount: 2 },
              { kind: "giveScales", amount: 10 },
            ],
            next: "sabotaged",
          },
          { label: "Give me a moment." },
        ],
      },
      {
        id: "refused",
        speaker: "Wei Jin Sairus",
        text: "(The Patriarch's smile does not move a hair.) Then the clan will remember who declined to be useful. The delegation will hear that you were... unwell. Do try to look it.",
      },
      {
        id: "sabotaged",
        speaker: "",
        text: "(By midday the word is everywhere: Wei Jin Amon collapsed at the salute. The judges call it festival nerves. The quiet money you placed comes back tenfold, and nobody looks at you twice. Yet.)",
      },
      {
        id: "pending",
        speaker: "Wei Jin Sairus",
        text: "The ring waits, and Heaven's Glory does not. My grandson is in the sand, warming up his pride.",
        choices: [
          {
            label: "Concede the exhibition.",
            effects: [
              { kind: "setFlag", key: "a1.duelResolved" },
              { kind: "reputation", faction: "wei", amount: -1 },
            ],
          },
          { label: "I'm not done with him." },
        ],
      },
      {
        id: "wonTrick",
        speaker: "Wei Jin Sairus",
        text: "Amon's techniques failed him in the ring. 'Curious,' said the judges. You said nothing at all. (His eyes hold yours one beat too long.) Heaven's Glory is not soothed — but they are *quiet*, which I will accept.",
        choices: [
          {
            label: "Bow, and step out of the sand.",
            effects: [
              { kind: "setFlag", key: "a1.duelResolved" },
              { kind: "reputation", faction: "wei", amount: 1 },
              { kind: "reputation", faction: "heavensGlory", amount: -2 },
              { kind: "knowledge", amount: 1 },
            ],
          },
        ],
      },
      {
        id: "wonHonest",
        speaker: "Wei Jin Sairus",
        text: "Two stages beneath him, and you made the sand argue otherwise. The crowd loved it. The delegation did not, which is a different kind of victory and a worse kind of problem.",
        choices: [
          {
            label: "Bow, and step out of the sand.",
            effects: [
              { kind: "setFlag", key: "a1.duelResolved" },
              { kind: "reputation", faction: "wei", amount: 2 },
              { kind: "reputation", faction: "heavensGlory", amount: -2 },
              { kind: "resolve", amount: 1 },
            ],
          },
        ],
      },
      {
        id: "after",
        speaker: "Wei Jin Sairus",
        text: "(quieter than you have ever heard him) I have buried festivals before. Never the sky. Whatever the heavens said to you — keep it off your face, and off my square.",
      },
    ],
  });

  // The rival, before the match (he vanishes from the square once it's decided).
  registerDialogue({
    id: "a1-amon",
    start: "taunt",
    nodes: [
      {
        id: "taunt",
        speaker: "Wei Jin Amon",
        text: "(He looks through you first, and only then at you.) Ah — the exhibition. Don't worry. I'm told mercy photographs well.",
        next: "out",
      },
      {
        id: "out",
        speaker: "Wei Jin Amon",
        text: "Grandfather wants the delegation soothed, so smile when you fall. Twice, if you can manage it.",
      },
    ],
  });

  // The south gate guard. INVENTED: "Wei Guard Tana" — canon is silent on
  // the village watch; named in the lore bible's style.
  registerDialogue({
    id: "a1-gate-guard",
    start: "halt",
    nodes: [
      {
        id: "halt",
        speaker: "Wei Guard Tana",
        text: "Festival rules, {playerName}: the gates stay shut until the lanterns come down. Nobody walks the wilds while the whole valley's wealth is standing in one square.",
        branches: [{ when: [{ kind: "flag", key: "a1.surielResolved" }], next: "open" }],
      },
      {
        id: "open",
        speaker: "Wei Guard Tana",
        text: "Orders changed after... whatever that was. The road south is yours. Mind the dreadbeasts — and whatever's left of the sky.",
      },
    ],
  });

  // ------------------------------------------------- Suriel (the choice)

  registerDialogue({
    id: "a1-suriel",
    start: "start",
    nodes: [
      {
        id: "start",
        speaker: "Suriel",
        text: "You died well. That is rarer than you would think. (Her voice is unhurried, the way a mountain is unhurried.) I have put the day back where it was — with three exceptions. You remember. Markuth answers elsewhere. And you have seen what comes.",
        next: "charge",
      },
      {
        id: "charge",
        speaker: "Suriel",
        text: "Decades from now the Wandering Titan crosses this valley without noticing it. Every face you know ends under one footfall. The one who can take you beyond these mountains is on Mount Samara: Yerin, the Sword Sage's disciple. The Sage is dead. She should not be.",
        next: "choice",
      },
      {
        id: "choice",
        speaker: "Suriel",
        text: "I cannot stay. What you do with the warning is yours alone.",
        choices: [
          {
            label: "Take the marble. Find the disciple.",
            effects: [
              { kind: "giveItem", item: "surielsMarble", label: "Suriel's marble" },
              { kind: "setFlag", key: "a1.suriel.accepted" },
              { kind: "setFlag", key: "a1.surielResolved" },
              { kind: "knowledge", amount: 2 },
              { kind: "startQuest", quest: "the-swordsages-disciple" },
              { kind: "cutscene", id: "a1-suriel-departs" },
            ],
          },
          {
            label: "Keep your marble. This valley will stand — I'll make it stand.",
            effects: [
              { kind: "setFlag", key: "a1.suriel.rejected" },
              { kind: "setFlag", key: "a1.surielResolved" },
              { kind: "resolve", amount: 2 },
              { kind: "startQuest", quest: "the-swordsages-disciple" },
              { kind: "cutscene", id: "a1-suriel-departs" },
            ],
          },
          {
            label: "Take the marble — and warn the family, whatever it costs.",
            effects: [
              { kind: "giveItem", item: "surielsMarble", label: "Suriel's marble" },
              { kind: "setFlag", key: "a1.suriel.toldFamily" },
              { kind: "setFlag", key: "a1.surielResolved" },
              { kind: "resolve", amount: 1 },
              { kind: "knowledge", amount: 1 },
              { kind: "reputation", faction: "wei", amount: -2 },
              { kind: "startQuest", quest: "the-swordsages-disciple" },
              { kind: "cutscene", id: "a1-told-family" },
            ],
          },
        ],
      },
    ],
  });

  // ------------------------------------------------------------ cutscenes

  // The opening: festival morning with the family (plays once, at boot).
  registerCutscene("a1-opening", [
    { kind: "face", entity: "player", facing: "down" },
    {
      kind: "say",
      speaker: "",
      text: "Festival morning. Seven years of lanterns go up in a single dawn, and the whole Wei village smells of crushed cedar and hot lamp oil.",
    },
    {
      kind: "say",
      speaker: "Seisha",
      text: "Eat standing up if you must. The rolls are posted, and the drudge says your channels read... adequate.",
    },
    {
      kind: "say",
      speaker: "Kelsa",
      text: "'Adequate' is her word for 'don't embarrass us'. Come find me before the matches.",
    },
    {
      kind: "say",
      speaker: "",
      text: "(The Seven-Year Festival has come to Wei territory — and your name is on the exhibition rolls.)",
    },
  ]);
  addMapOnEnter("weiVillage", { cutscene: "a1-opening", onceFlag: "a1.sawOpening" });

  // Walking into the ring — honest.
  registerCutscene("a1-duel-honest", [
    { kind: "fadeOut", seconds: 0.4 },
    { kind: "moveMap", map: "weiVillage", entry: "arena" },
    { kind: "wait", seconds: 0.9 },
    { kind: "fadeIn", seconds: 0.4 },
    {
      kind: "say",
      speaker: "",
      text: "The ring is roped and scripted; the crowd is a wall of festival silk. Wei Jin Amon returns your salute with a smile he has clearly been saving.",
    },
    { kind: "say", speaker: "Wei Jin Amon", text: "Try to make it look like a match." },
  ]);

  // Walking into the ring — rigged with halfsilver (lore §2.3: halfsilver
  // disrupts madra on contact; his techniques are sealed for the bout).
  registerCutscene("a1-duel-trick", [
    { kind: "fadeOut", seconds: 0.4 },
    { kind: "moveMap", map: "weiVillage", entry: "arena" },
    { kind: "wait", seconds: 0.9 },
    { kind: "fadeIn", seconds: 0.4 },
    {
      kind: "say",
      speaker: "",
      text: "You return Amon's salute with both hands — and a sliver of halfsilver pressed flat into his palm-guard. The script-ring hums. His madra grates like a cartwheel on gravel.",
    },
    {
      kind: "say",
      speaker: "Wei Jin Amon",
      text: "What— (His opening technique sputters into sparks. The judges see nothing. You made sure of that.)",
    },
  ]);

  // Li Markuth descends; you die; Suriel intervenes (lore §5 beat 6).
  registerCutscene("a1-markuth", [
    { kind: "shake", intensity: 3, seconds: 1.2 },
    {
      kind: "say",
      speaker: "",
      text: "The sky tears. Not the clouds — the SKY, like silk under a knife. Light bleeds through the wound, and a man steps down out of it as if descending a stair.",
    },
    {
      kind: "spawn",
      entity: "markuth",
      def: {
        id: "markuth",
        name: "Li Markuth",
        tx: ARENA.tx,
        ty: ARENA.ty + 1,
        sprite: { hair: "#e8e4da", robe: "#1f2f4a", trim: "#c9a85c", skin: "#e0c9a8" },
        facing: "down",
      },
    },
    { kind: "panCamera", to: { x: ARENA.tx * 16 + 8, y: ARENA.ty * 16 }, seconds: 1.0 },
    {
      kind: "say",
      speaker: "Li Markuth",
      text: "Eight hundred years, and the valley still smells of small ambitions. Kneel. Your patriarchs may keep their heads — as furniture for mine.",
    },
    { kind: "shake", intensity: 4, seconds: 0.8 },
    {
      kind: "say",
      speaker: "",
      text: "Elders move. Light answers. It does not matter. He unmakes the square the way you would brush crumbs from a table — and when you step between him and your family, he notices you the way a wheel notices a beetle.",
    },
    { kind: "fadeOut", seconds: 0.8 },
    {
      kind: "say",
      speaker: "",
      text: "(Your heart stops. There is no wound to press. You are simply — ended.)",
    },
    {
      kind: "say",
      speaker: "",
      text: "Then: a blue-white presence, vast and very gentle, threading time backward through the eye of a needle. The dead breathe. The square reassembles. The man out of heaven is taken by the wrist like a child.",
    },
    {
      kind: "say",
      speaker: "Suriel",
      text: "Li Markuth. Spatial violation. Attempted dominion of a protected world. You will answer elsewhere.",
    },
    { kind: "despawn", entity: "markuth" },
    { kind: "setFlag", key: "a1.markuthSeen" },
    { kind: "moveMap", map: "weiVillage", entry: "arena" },
    { kind: "wait", seconds: 0.9 },
    { kind: "fadeIn", seconds: 0.4 },
    {
      kind: "say",
      speaker: "",
      text: "Time resumes. The crowd remembers a bad dream and a broken festival. And in the ring stands a woman in grey, hair the color of dusk — waiting, impossibly, for you.",
    },
    {
      kind: "say",
      speaker: "",
      text: "(A vision still sears behind your eyes: a Titan the size of a horizon wading through Sacred Valley. Mount Samara snapping like a reed. Everyone you know, decades from now, under one footfall.)",
    },
  ]);

  registerCutscene("a1-suriel-departs", [
    {
      kind: "say",
      speaker: "Suriel",
      text: "I have already broken three laws for you. The fourth would be staying. Mount Samara. The disciple. Hurry slowly.",
    },
    { kind: "despawn", entity: "a1-suriel" },
    { kind: "shake", intensity: 2, seconds: 0.5 },
    {
      kind: "say",
      speaker: "",
      text: "She does not leave so much as stop insisting on being somewhere. Around the empty ring, the festival lanterns flicker back to life.",
    },
  ]);

  registerCutscene("a1-told-family", [
    { kind: "say", speaker: "Suriel", text: "Truth is heavier than the marble. Carry both." },
    { kind: "despawn", entity: "a1-suriel" },
    { kind: "shake", intensity: 2, seconds: 0.5 },
    { kind: "fadeOut", seconds: 0.5 },
    {
      kind: "say",
      speaker: "",
      text: "That night you tell them everything: the sky, your death, the Titan. Your father stares at the table. Your mother checks your pulse twice and says 'dream-aura residue' very kindly. Kelsa says nothing at all.",
    },
    {
      kind: "say",
      speaker: "",
      text: "(They do not believe you. The story spreads anyway — by morning, half the village has heard the one about the heavens' chosen.)",
    },
    { kind: "fadeIn", seconds: 0.5 },
  ]);

  // ------------------------------------------------------------- the map

  addMapEntries("weiVillage", {
    /** Inside the festival ring (duel + descent staging). */
    arena: { x: 22 * 16 + 8, y: 20 * 16 + 12, facing: "up" },
  });

  addMapNpcs("weiVillage", [
    {
      id: "a1-mother",
      name: "Seisha",
      tx: 7,
      ty: 8,
      sprite: NPC_PALETTES["villagerC"]!,
      facing: "down",
      dialogueId: "a1-mother",
    },
    {
      id: "a1-father",
      name: "Jaran",
      tx: 12,
      ty: 8,
      sprite: NPC_PALETTES["villagerA"]!,
      facing: "down",
      dialogueId: "a1-father",
    },
    {
      id: "a1-kelsa",
      name: "Kelsa",
      tx: 9,
      ty: 10,
      sprite: NPC_PALETTES["villagerB"]!,
      facing: "down",
      behavior: { wanderRadius: 12 },
      dialogueId: "a1-kelsa",
      // After the escape from Mount Samara she waits at the gate instead.
      unlessFlag: "a3.escapedPeak",
    },
    {
      id: "a1-sairus",
      name: "Wei Jin Sairus",
      tx: 23,
      ty: 14,
      sprite: NPC_PALETTES["weiElder"]!,
      facing: "down",
      dialogueId: "a1-sairus",
    },
    {
      id: "a1-amon",
      name: "Wei Jin Amon",
      tx: 27,
      ty: 14,
      sprite: NPC_PALETTES["villagerA"]!,
      facing: "left",
      dialogueId: "a1-amon",
      unlessFlag: "a1.duelChosen",
    },
    {
      id: "a1-gate-guard",
      name: "Wei Guard Tana", // INVENTED (style of the lore bible)
      tx: 22,
      ty: 31,
      sprite: NPC_PALETTES["weiGuard"]!,
      facing: "up",
      dialogueId: "a1-gate-guard",
      guard: { untilFlag: "a1.surielResolved", stepAside: { dx: -14, dy: -16 } },
    },
    {
      id: "a1-suriel",
      name: "Suriel",
      tx: 22,
      ty: 18,
      sprite: { hair: "#7a6fb0", robe: "#e8ecf4", trim: "#8a6cc0", skin: "#e6cdb4" },
      facing: "down",
      dialogueId: "a1-suriel",
      ifFlag: "a1.markuthSeen",
      unlessFlag: "a1.surielResolved",
    },
  ]);

  // The duel "enemy": Wei Jin Amon in the ring, two stages above you (the
  // Iron-stage stalker statline). Spawned by the map rebuild inside the
  // duel-begin cutscene; his death sets a1.duelWon. The trick variant fights
  // with his techniques sealed (halfsilver). Win, lose, or yield — the story
  // proceeds through Sairus either way.
  addMapEnemies("weiVillage", [
    {
      kind: "stalker",
      tx: ARENA.tx,
      ty: ARENA.ty,
      ifFlag: "a1.duel.honest",
      unlessFlag: "a1.duelResolved",
      onDeathFlag: "a1.duelWon",
      name: "Wei Jin Amon",
    },
    {
      kind: "stalker",
      tx: ARENA.tx,
      ty: ARENA.ty,
      ifFlag: "a1.duel.trick",
      unlessFlag: "a1.duelResolved",
      onDeathFlag: "a1.duelWon",
      sealed: true,
      name: "Wei Jin Amon (sealed)",
    },
  ]);
}
