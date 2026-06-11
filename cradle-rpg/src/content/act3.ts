/**
 * ACT 3 — HEAVEN'S GLORY (heavensGlory). Lore-bible beats 10 + 14-15:
 * hospitality masking a knife (the orchard, the ancestor's hall, Elder
 * Whitehall), THE TURN — the school killed the Sword Sage and wants the
 * marble and his blade — then the theft of the Lesser Treasure Hall and the
 * flight down Mount Samara.
 *
 * Mechanics note (the brief's open question, resolved): NPCs cannot fight,
 * so the hostile turn DESPAWNS the friendly school (NpcDef.unlessFlag
 * "heavensGlory.hostile") and the map's enemy table gains hostile spawns
 * through the addMapEnemies content hook (EnemySpawn.ifFlag) — both filtered
 * on the map rebuild the turn cutscene forces via moveMap. The chase down
 * the trail works the same way (pursuit spawns + an on-enter cutscene).
 *
 * Canon: Elder Whitehall, Elder Rahm, the parasite ring / Thousand-Mile
 * Cloud / sylvan riverseed theft. INVENTED: "Disciple Ona" (the orchard).
 */

import { registerQuest } from "../systems/story.js";
import { registerDialogue } from "../systems/dialogue.js";
import { registerCutscene, type CutsceneStep } from "../systems/cutscene.js";
import { addMapEnemies, addMapNpcs, addMapOnEnter } from "../game/maps/registry.js";
import { NPC_PALETTES } from "../game/npc.js";

export function registerAct3(): void {
  // ------------------------------------------------------------- quests

  registerQuest({
    id: "the-mountains-hospitality",
    title: "The Mountain's Hospitality",
    description:
      "Heaven's Glory has opened its gate to you — flawless courtesy that fits like a glove around the throat. Earn your keep, and learn what the smiles are for.",
    objectives: [
      { id: "enter", text: "Present yourself at Heaven's Glory School", flag: "a3.enteredSchool" },
      { id: "orchard", text: "Earn your keep in the ancestor's orchard", flag: "a3.orchardTended" },
      { id: "hall", text: "Answer Elder Whitehall's summons in the ancestor's hall", flag: "a3.facedWhitehall" },
    ],
  });

  registerQuest({
    id: "flight-from-the-peak",
    title: "Flight from the Peak",
    description:
      "The mask is off: they murdered the Sword Sage for his belongings, and your belongings are next. The treasures are in your pack and the alarm scripts are singing. Down the mountain — now.",
    objectives: [{ id: "escape", text: "Escape down Mount Samara", flag: "a3.escapedPeak" }],
    reward: [{ kind: "startQuest", quest: "leave-the-valley" }],
  });

  // ------------------------------------------------------------ dialogues

  registerDialogue({
    id: "a3-rahm",
    start: "start",
    nodes: [
      {
        id: "start",
        speaker: "Elder Rahm",
        text: "(A broad old man smelling of lamp oil and Remnant parts — keeper of the Lesser Treasure Hall.) New guest. Hm. You have working hands. That already puts you above half my disciples.",
        branches: [
          { when: [{ kind: "flag", key: "a3.orchardTended" }], next: "after" },
          { when: [{ kind: "flag", key: "a3.rahmTask" }], next: "remind" },
        ],
        next: "task",
      },
      {
        id: "task",
        speaker: "Elder Rahm",
        text: "The ancestor's orchard wants tending before the frost — orus trees older than the school's manners. See Disciple Ona among the rows. Do honest work, and the school's generosity stays generous.",
        effects: [{ kind: "setFlag", key: "a3.rahmTask" }],
      },
      {
        id: "remind",
        speaker: "Elder Rahm",
        text: "The orchard, guest. Ona waits among the trees, and the frost waits for no one's schedule.",
      },
      {
        id: "after",
        speaker: "Elder Rahm",
        text: "Good work in the rows.",
        branches: [{ when: [{ kind: "flag", key: "a2.betrayedYerin" }], next: "uneasy" }],
        next: "warning",
      },
      {
        id: "warning",
        speaker: "Elder Rahm",
        text: "(quieter) Whatever the elders promise you, keep your own pack packed. Old man's habit. Habits keep old men old.",
      },
      {
        id: "uneasy",
        speaker: "Elder Rahm",
        text: "(He studies you a moment too long.) The school paid out scales last week — for a 'friend of the school'. Whoever that friend was: debts on this mountain get settled in directions nobody expects. Keep your pack packed.",
      },
    ],
  });

  registerDialogue({
    id: "a3-ona",
    start: "start",
    nodes: [
      {
        id: "start",
        speaker: "Disciple Ona", // INVENTED — the orchard hand
        text: "(She bows, palms stained orus-purple.)",
        branches: [
          { when: [{ kind: "flag", key: "a3.orchardTended" }], next: "after" },
          { when: [{ kind: "flag", key: "a3.rahmTask" }], next: "work" },
        ],
        next: "shy",
      },
      {
        id: "shy",
        speaker: "Disciple Ona",
        text: "Guests mostly walk the orchard at dawn. The trees like the quiet. So do I.",
      },
      {
        id: "work",
        speaker: "Disciple Ona",
        text: "Elder Rahm sent you? Take the east rows — mind the roots, thank the trees. (You spend the morning in ladder-work and leaf-light. It is the most peaceful hour this mountain will ever give you.)",
        effects: [{ kind: "setFlag", key: "a3.orchardTended" }, { kind: "giveScales", amount: 3 }],
      },
      {
        id: "after",
        speaker: "Disciple Ona",
        text: "The trees remember you now. Up here, that's worth more than the elders' smiles. Don't tell them I said so.",
      },
    ],
  });

  // Yerin inside the school, if she came with you (the trusted route).
  registerDialogue({
    id: "a3-yerin-school",
    start: "start",
    nodes: [
      {
        id: "start",
        speaker: "Yerin",
        text: "They gave me a room with a view and a door that locks from the outside. 'Honored guest.' — Eyes open, {playerName}. This place killed my master and smiled through the funeral. When it goes wrong, it'll go wrong all at once.",
      },
    ],
  });

  // Elder Whitehall — the mask, then the turn.
  registerDialogue({
    id: "a3-whitehall",
    start: "start",
    nodes: [
      {
        id: "start",
        speaker: "Elder Whitehall",
        text: "(An old man in a boy's body; the eyes have been waiting far longer than the face.) Our Jade guest. The mountain is honored. Have you found our hospitality... thorough?",
        branches: [{ when: [{ kind: "flag", key: "a3.orchardTended" }], next: "summons" }],
        next: "deflect",
      },
      {
        id: "deflect",
        speaker: "Elder Whitehall",
        text: "Guests earn the ancestor's hall by service. Elder Rahm finds work for idle hands — the school finds uses for everyone. Everyone.",
      },
      {
        id: "summons",
        speaker: "Elder Whitehall",
        text: "Work in the orchard, friends on the trail... you fit our mountain well. Come — the ancestor's hall, a private word. The school has one more kindness to offer you.",
        next: "reveal",
      },
      {
        id: "reveal",
        speaker: "Elder Whitehall",
        text: "We know what you carry — the heavens marked you, and the valley talks. A marble that hums across worlds. And the squatter's master had such a beautiful sword. The Sage declined to share his treasures, too. He found our hospitality thorough in the end.",
        choices: [
          {
            label: "You already bought her camp from me. We're square.",
            conditions: [{ kind: "flag", key: "a2.betrayedYerin" }],
            effects: [
              { kind: "setFlag", key: "a3.facedWhitehall" },
              { kind: "cutscene", id: "a3-turn-betrayed" },
            ],
          },
          {
            label: "Yerin was right about this place.",
            conditions: [{ kind: "flag", key: "a2.yerin.trusted" }],
            effects: [
              { kind: "setFlag", key: "a3.facedWhitehall" },
              { kind: "cutscene", id: "a3-turn-trusted" },
            ],
          },
          {
            label: "Step away from me.",
            conditions: [
              { kind: "flag", key: "a2.yerin.trusted", truthy: false },
              { kind: "flag", key: "a2.betrayedYerin", truthy: false },
            ],
            effects: [
              { kind: "setFlag", key: "a3.facedWhitehall" },
              { kind: "cutscene", id: "a3-turn" },
            ],
          },
        ],
      },
    ],
  });

  // ------------------------------------------------------------ cutscenes

  // Shared spine of the turn: hostile flag -> the theft -> dumped at the
  // gate with the alarm singing. The moveMap rebuild despawns the friendly
  // school and spawns the enforcers (their ifFlag is the hostile flag).
  const turnCore = (extra: CutsceneStep[]): CutsceneStep[] => [
    {
      kind: "say",
      speaker: "Elder Whitehall",
      text: "Take the guest's belongings into the school's keeping. Gently, if convenient.",
    },
    ...extra,
    { kind: "shake", intensity: 3, seconds: 0.8 },
    { kind: "setFlag", key: "heavensGlory.hostile" },
    {
      kind: "say",
      speaker: "",
      text: "The hall doors slide open on a wall of cream-and-gold robes. The hospitality is over. The knife it was wrapped around is not.",
    },
    { kind: "fadeOut", seconds: 0.5 },
    {
      kind: "say",
      speaker: "",
      text: "(You go through the Lesser Treasure Hall like a storm through a market stall: a ring of braided halfsilver, a folded cloud straining at its strap, a tiny blue spirit asleep in a jar — and the Sword Sage's white blade, which you take because they wanted it most.)",
    },
    { kind: "effect", effect: { kind: "giveItem", item: "parasiteRing", label: "the parasite ring" } },
    { kind: "effect", effect: { kind: "giveItem", item: "thousandMileCloud", label: "a Thousand-Mile Cloud" } },
    { kind: "effect", effect: { kind: "giveItem", item: "sylvanRiverseed", label: "the sylvan riverseed" } },
    { kind: "moveMap", map: "heavensGlory", entry: "gate" },
    { kind: "wait", seconds: 0.9 },
    { kind: "fadeIn", seconds: 0.4 },
    { kind: "shake", intensity: 2, seconds: 0.6 },
    {
      kind: "say",
      speaker: "",
      text: "Alarm scripts shriek across the terraces. The gate is at your back and the long dark trail is the only road left in the world.",
    },
    { kind: "effect", effect: { kind: "startQuest", quest: "flight-from-the-peak" } },
  ];

  registerCutscene("a3-turn", turnCore([]));

  registerCutscene(
    "a3-turn-trusted",
    turnCore([
      {
        kind: "say",
        speaker: "Yerin",
        text: "(Her voice, from the doorway — her sword already wet with lamplight.) Told you to keep your back to a wall. Treasure hall, then the trail. Move like you mean it!",
      },
      { kind: "setFlag", key: "a3.fleeingWithYerin" },
    ]),
  );

  registerCutscene(
    "a3-turn-betrayed",
    turnCore([
      {
        kind: "say",
        speaker: "Elder Whitehall",
        text: "And do convey our thanks for the swordswoman's camp. The school settles its debts in full — with everyone. Take this one as well.",
      },
      {
        kind: "say",
        speaker: "",
        text: "(Sold, and sold again. The fifteen scales in your pouch feel suddenly very heavy.)",
      },
      { kind: "effect", effect: { kind: "reputation", faction: "wei", amount: -2 } },
      { kind: "effect", effect: { kind: "reputation", faction: "heavensGlory", amount: -3 } },
    ]),
  );

  // Arrival at the peak (once, and only once the story has opened the gate).
  registerCutscene("a3-arrival", [
    {
      kind: "say",
      speaker: "",
      text: "Heaven's Glory School. Stone terraces under a sky that never quite goes dark — Samara's Ring burns on the horizon like a held breath.",
    },
    {
      kind: "say",
      speaker: "",
      text: "Disciples in cream and gold bow exactly as deep as they must. The hospitality is flawless. It fits like a glove around the throat.",
    },
    { kind: "setFlag", key: "a3.enteredSchool" },
  ]);
  addMapOnEnter("heavensGlory", {
    cutscene: "a3-arrival",
    onceFlag: "a3.sawArrival",
    when: [{ kind: "flag", key: "a2.jade" }],
  });

  // The flight down the mountain — Whitehall at the snow line. The Empty-
  // Palm-style trickery beat is narrated origin-neutrally (lore §5 beat 15).
  const flightCore: CutsceneStep[] = [
    { kind: "shake", intensity: 2, seconds: 0.6 },
    {
      kind: "say",
      speaker: "",
      text: "Down through the switchbacks with the school's light at your heels. At the snow line, Elder Whitehall is simply THERE — an old man's patience in a boy's body, glowing like a struck bell.",
    },
    {
      kind: "say",
      speaker: "Elder Whitehall",
      text: "The mountain misplaces people. No one will even count you.",
    },
    {
      kind: "say",
      speaker: "",
      text: "(You fight the only way the valley ever let you learn: scripts scratched in snow, terrain, timing — your whole self driven into his cycling at the one breath it matters. His technique collapses inward. The cliff does the rest.)",
    },
    { kind: "shake", intensity: 4, seconds: 0.8 },
  ];

  registerCutscene("a3-flight-yerin", [
    ...flightCore,
    {
      kind: "say",
      speaker: "Yerin",
      text: "(A shadow sweeps in low — a stolen cloud, a white sword, a grin with too much blood on it.) Get ON. Master's cloud flies better angry.",
    },
    { kind: "setFlag", key: "a3.escapedPeak" },
    {
      kind: "say",
      speaker: "",
      text: "(You drop down Mount Samara on a Thousand-Mile Cloud, the white blade across her knees, the school's light shrinking above you. The valley floor — and the gate you grew up behind — waits below.)",
    },
  ]);

  registerCutscene("a3-flight-alone", [
    ...flightCore,
    {
      kind: "say",
      speaker: "",
      text: "What rises from the ravine afterward is not Whitehall but his Remnant — light and spite in a man's shape. You do not stay to study it.",
    },
    { kind: "setFlag", key: "a3.escapedPeak" },
    {
      kind: "say",
      speaker: "",
      text: "(The trail below is open. The valley floor — and the gate you grew up behind — waits at the bottom.)",
    },
  ]);

  // Fired by the samaraTrail entry while the school is hostile; both
  // variants share one once-flag so exactly one of them ever plays.
  addMapOnEnter("samaraTrail", {
    cutscene: "a3-flight-yerin",
    onceFlag: "a3.sawFlight",
    when: [
      { kind: "flag", key: "heavensGlory.hostile" },
      { kind: "flag", key: "a3.fleeingWithYerin" },
    ],
  });
  addMapOnEnter("samaraTrail", {
    cutscene: "a3-flight-alone",
    onceFlag: "a3.sawFlight",
    when: [{ kind: "flag", key: "heavensGlory.hostile" }],
  });

  // ------------------------------------------------------------- the maps

  addMapNpcs("heavensGlory", [
    {
      id: "a3-whitehall",
      name: "Elder Whitehall",
      tx: 23,
      ty: 7,
      sprite: { hair: "#15131c", robe: "#e8dcc4", trim: "#c9a85c", skin: "#efd9be" },
      facing: "down",
      dialogueId: "a3-whitehall",
      unlessFlag: "heavensGlory.hostile",
    },
    {
      id: "a3-rahm",
      name: "Elder Rahm",
      tx: 33,
      ty: 13,
      sprite: { hair: "#c2cad8", robe: "#e8dcc4", trim: "#8a6a3a", skin: "#d9a87e" },
      facing: "left",
      dialogueId: "a3-rahm",
      unlessFlag: "heavensGlory.hostile",
    },
    {
      id: "a3-ona",
      name: "Disciple Ona", // INVENTED
      tx: 8,
      ty: 13,
      sprite: NPC_PALETTES["glorySchool"]!,
      facing: "down",
      behavior: { wanderRadius: 10 },
      dialogueId: "a3-ona",
      unlessFlag: "heavensGlory.hostile",
    },
    {
      id: "a3-yerin-school",
      name: "Yerin",
      tx: 37,
      ty: 17,
      sprite: { hair: "#15131c", robe: "#d8d4cc", trim: "#a83a3a", skin: "#e0b490" },
      facing: "left",
      dialogueId: "a3-yerin-school",
      ifFlag: "a2.yerin.trusted",
      unlessFlag: "heavensGlory.hostile",
    },
  ]);

  // The school's enforcers, once the ground turns hostile (forever — exile).
  addMapEnemies("heavensGlory", [
    { kind: "stalker", tx: 19, ty: 24, ifFlag: "heavensGlory.hostile", name: "Heaven's Glory enforcer" },
    { kind: "stalker", tx: 12, ty: 18, ifFlag: "heavensGlory.hostile", name: "Heaven's Glory enforcer" },
    { kind: "stalker", tx: 30, ty: 20, ifFlag: "heavensGlory.hostile", name: "Heaven's Glory enforcer" },
  ]);

  // Pursuit on the trail during the flight; gone once you've broken through.
  addMapEnemies("samaraTrail", [
    {
      kind: "stalker",
      tx: 19,
      ty: 6,
      ifFlag: "heavensGlory.hostile",
      unlessFlag: "a3.escapedPeak",
      name: "Heaven's Glory enforcer",
    },
    {
      kind: "stalker",
      tx: 8,
      ty: 11,
      ifFlag: "heavensGlory.hostile",
      unlessFlag: "a3.escapedPeak",
      name: "Heaven's Glory enforcer",
    },
  ]);
}
