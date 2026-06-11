/**
 * ACT 2 — THE DISCIPLE (valleyWilds + samaraTrail). Lore-bible beats 8 + 11:
 * the rumor of the Sword Sage's death, meeting Yerin on the trail, and the
 * three stances — earn her trust (a hunt against the trail's dreadbeasts),
 * antagonize her, or sell her camp to Heaven's Glory.
 *
 * Story-gated JADE: once the Yerin beat resolves AND the player has reached
 * Iron through the normal shrine systems (condition stageGte Iron), Yerin
 * walks you through her master's purification cycling — a cutscene grants
 * Jade via giveStage. Below Iron, a journal quest points back at the shrines.
 *
 * Canon: Yerin (voice per lore §4 — country-blunt, prickly, loyal once
 * sworn). INVENTED: "Disciple Verren" (the Heaven's Glory emissary on the
 * trail) and the two gatekeepers — canon is silent; named in its style.
 */

import { registerQuest } from "../systems/story.js";
import { registerDialogue } from "../systems/dialogue.js";
import { registerCutscene } from "../systems/cutscene.js";
import { Stage } from "../systems/stats.js";
import { addMapEnemies, addMapNpcs, addMapOnEnter } from "../game/maps/registry.js";
import { NPC_PALETTES } from "../game/npc.js";

export function registerAct2(): void {
  // ------------------------------------------------------------- quests

  registerQuest({
    id: "the-swordsages-disciple",
    title: "The Sword Sage's Disciple",
    description:
      "Rumor and heaven agree for once: the Sword Sage died on Mount Samara, and his disciple lingers near the snow line. Find Yerin — and decide what she is to you.",
    objectives: [
      { id: "find", text: "Find the Sword Sage's disciple on the Samara Trail", flag: "a2.metYerin" },
      { id: "stance", text: "Settle where you stand with Yerin", flag: "a2.yerinResolved" },
    ],
    reward: [{ kind: "knowledge", amount: 1 }],
  });

  registerQuest({
    id: "blood-on-the-snow",
    title: "Blood on the Snow",
    description:
      "A hollow-eyed dreadbeast has dogged Yerin's camp since her master's funeral. It dens in the ruins down in the Valley Wilds. Bleed it out, and she'll talk to you like a partner.",
    objectives: [
      { id: "kill", text: "Slay the hollow-eyed dreadbeast in the wilds", flag: "a2.denStalkerSlain" },
      { id: "return", text: "Return to Yerin on the trail", flag: "a2.yerin.trusted" },
    ],
    reward: [{ kind: "heal" }],
  });

  registerQuest({
    id: "temper-the-body",
    title: "Temper Your Body",
    description:
      "Yerin won't open your spirit while your body is still soft enough to splatter. Temper it at the meditation shrines — reach Iron — then climb back to her.",
    objectives: [
      // "reached.iron" is a documented game event: World sets reached.<stage>
      // flags whenever the advancement systems grant a stage-up.
      { id: "iron", text: "Forge your body at the shrines — reach Iron", flag: "reached.iron" },
      { id: "return", text: "Return to Yerin for the opening of your spirit", flag: "a2.jade" },
    ],
  });

  // --------------------------------------------------------------- Yerin

  registerDialogue({
    id: "a2-yerin",
    start: "start",
    nodes: [
      {
        id: "start",
        speaker: "Yerin",
        text: "(White robe gone grey at the hem. Red eyes. A sword that looks better fed than she does.) You smell like the valley floor. Say your piece or start swinging.",
        effects: [{ kind: "setFlag", key: "a2.metYerin" }],
        branches: [
          { when: [{ kind: "flag", key: "a2.yerin.trusted" }], next: "trusted" },
          { when: [{ kind: "flag", key: "a2.betrayedYerin" }], next: "betrayedIdle" },
          { when: [{ kind: "flag", key: "a2.yerin.rival" }], next: "rivalIdle" },
          {
            when: [
              { kind: "flag", key: "a2.yerin.helping" },
              { kind: "flag", key: "a2.denStalkerSlain" },
            ],
            next: "oath",
          },
          { when: [{ kind: "flag", key: "a2.yerin.helping" }], next: "helping" },
        ],
        next: "meet",
      },
      {
        id: "meet",
        speaker: "Yerin",
        text: "Name's Yerin. My master's dead on this mountain, the school above smiles too much, and I'm not partial to company. Last chance to be elsewhere.",
        choices: [
          {
            label: "The heavens sent me to find you.",
            conditions: [{ kind: "flag", key: "a1.suriel.accepted" }],
            next: "heavens",
          },
          {
            label: "I'm not company. I'm help — point me at something.",
            effects: [
              { kind: "setFlag", key: "a2.yerin.helping" },
              { kind: "startQuest", quest: "blood-on-the-snow" },
            ],
            next: "task",
          },
          {
            label: "The Sword Sage's disciple? You look more like his laundry.",
            effects: [
              { kind: "setFlag", key: "a2.yerin.rival" },
              { kind: "setFlag", key: "a2.yerinResolved" },
              { kind: "resolve", amount: 1 },
            ],
            next: "rivalMade",
          },
        ],
      },
      {
        id: "heavens",
        speaker: "Yerin",
        text: "(Her sword-hand goes very still.) A woman out of the sky. Marble and all. ...My master talked about the heavens like they owed him money. Maybe they're paying. Fine — you want off this mountain alive, make yourself useful first.",
        choices: [
          {
            label: "Point me at something.",
            effects: [
              { kind: "setFlag", key: "a2.yerin.helping" },
              { kind: "startQuest", quest: "blood-on-the-snow" },
            ],
            next: "task",
          },
          {
            label: "Useful? I don't fetch. (Turn away.)",
            effects: [
              { kind: "setFlag", key: "a2.yerin.rival" },
              { kind: "setFlag", key: "a2.yerinResolved" },
              { kind: "resolve", amount: 1 },
            ],
            next: "rivalMade",
          },
        ],
      },
      {
        id: "task",
        speaker: "Yerin",
        text: "Hollow-eyed dreadbeast's been dogging my camp since the funeral. Dens in the old ruins down in the wilds. Bleed it out and we'll talk like partners. True as a tombstone.",
      },
      {
        id: "helping",
        speaker: "Yerin",
        text: "Beast's still breathing, which means you're either slow or careful. Wilds. Old ruins. Hollow eyes. It'll find you if you stand still long enough.",
      },
      {
        id: "rivalMade",
        speaker: "Yerin",
        text: "Huh. The valley floor breeds them mouthy. Keep clear of my camp, and I'll keep my sword bored. Best deal you'll get today.",
      },
      {
        id: "oath",
        speaker: "Yerin",
        text: "(She reads the beast's blood on you like a letter.) Contrary of you, not dying. All right, valley-born. Oath-light or not: you and me, out of this valley, both alive or neither. That's the whole contract.",
        effects: [
          { kind: "setFlag", key: "a2.yerin.trusted" },
          { kind: "setFlag", key: "a2.yerinResolved" },
          { kind: "knowledge", amount: 1 },
        ],
        branches: [
          {
            when: [{ kind: "stageGte", stage: Stage.Iron }, { kind: "flag", key: "a2.jade", truthy: false }],
            next: "jadeOffer",
          },
          { when: [{ kind: "flag", key: "a2.jade", truthy: false }], next: "temper" },
        ],
      },
      {
        id: "trusted",
        speaker: "Yerin",
        text: "Still breathing? Good habit. Keep it.",
        branches: [
          {
            when: [{ kind: "stageGte", stage: Stage.Iron }, { kind: "flag", key: "a2.jade", truthy: false }],
            next: "jadeOffer",
          },
          { when: [{ kind: "flag", key: "a2.jade", truthy: false }], next: "temper" },
        ],
      },
      {
        id: "rivalIdle",
        speaker: "Yerin",
        text: "Still here. Still flapping. (She doesn't look up from her whetstone.) World's ending anyway, so fine — what.",
        branches: [
          {
            when: [
              { kind: "flag", key: "a2.yerinResolved" },
              { kind: "stageGte", stage: Stage.Iron },
              { kind: "flag", key: "a2.jade", truthy: false },
            ],
            next: "jadeOffer",
          },
          {
            when: [
              { kind: "flag", key: "a2.yerinResolved" },
              { kind: "flag", key: "a2.jade", truthy: false },
            ],
            next: "temper",
          },
        ],
      },
      {
        id: "betrayedIdle",
        speaker: "Yerin",
        text: "Something's crawling on the wind today. Smells like white robes and counted coin. (She studies the trail below, not you.) Well. You're here — what.",
        branches: [
          {
            when: [{ kind: "stageGte", stage: Stage.Iron }, { kind: "flag", key: "a2.jade", truthy: false }],
            next: "jadeOffer",
          },
          { when: [{ kind: "flag", key: "a2.jade", truthy: false }], next: "temper" },
        ],
      },
      {
        id: "jadeOffer",
        speaker: "Yerin",
        text: "Your body's iron and your spirit's still wearing house clothes. My master had a purification cycle — runs like swallowing a thunderstorm. You want your spirit opened or not?",
        choices: [
          { label: "Open it.", effects: [{ kind: "cutscene", id: "a2-spirit-opens" }] },
          { label: "Not yet." },
        ],
      },
      {
        id: "temper",
        speaker: "Yerin",
        text: "You want up this mountain proper, temper that body first — Iron or better. The shrines down-valley will hammer you into shape. Mountain's not going anywhere. Neither is the school's patience, sadly.",
        effects: [{ kind: "startQuest", quest: "temper-the-body" }],
      },
    ],
  });

  // ----------------------------------------- the emissary (the dark path)

  registerDialogue({
    id: "a2-verren",
    start: "start",
    nodes: [
      {
        id: "start",
        speaker: "Disciple Verren", // INVENTED — Heaven's Glory emissary
        text: "(A disciple in cream and gold, far too clean for the trail.) Heaven's Glory keeps this path safe, traveler. The school is generous to its friends.",
        branches: [
          { when: [{ kind: "flag", key: "a2.betrayedYerin" }], next: "done" },
          {
            when: [{ kind: "flag", key: "a2.metYerin" }, { kind: "flag", key: "a1.duel.sabotage" }],
            next: "sabEcho",
          },
          {
            when: [{ kind: "flag", key: "a2.metYerin" }, { kind: "flag", key: "a1.duel.trick" }],
            next: "trickEcho",
          },
          { when: [{ kind: "flag", key: "a2.metYerin" }], next: "offer" },
        ],
        next: "smalltalk",
      },
      {
        id: "trickEcho",
        speaker: "Disciple Verren",
        text: "Word climbed the mountain ahead of you: Wei Jin Amon's madra failing mid-bout, of all improbable things. The school knows a halfsilver stink when it smells one. We rather admired the nerve.",
        next: "offer",
      },
      {
        id: "smalltalk",
        speaker: "Disciple Verren",
        text: "Mind the stalkers past the snow line. And if you happen upon a white-robed squatter up there... the school worries for her safety. Deeply.",
      },
      {
        id: "sabEcho",
        speaker: "Disciple Verren",
        text: "We hear things, even up here. A festival favorite who collapsed at the salute... You have a reputation for flexibility. Good. Flexible friends prosper.",
        next: "offer",
      },
      {
        id: "offer",
        speaker: "Disciple Verren",
        text: "The swordswoman — our 'honored guest' who refuses her room. Confirm where she camps, and the school pays in scales and remembers its friends.",
        choices: [
          {
            label: "She camps near the high switchback. (Report Yerin.)",
            effects: [
              { kind: "setFlag", key: "a2.betrayedYerin" },
              { kind: "setFlag", key: "a2.yerinResolved" },
              { kind: "giveScales", amount: 15 },
              { kind: "reputation", faction: "heavensGlory", amount: 2 },
              { kind: "resolve", amount: 2 },
            ],
            next: "paid",
          },
          {
            label: "She's a ghost. I've seen nothing.",
            effects: [
              { kind: "setFlag", key: "a2.refusedVerren" },
              { kind: "reputation", faction: "heavensGlory", amount: -1 },
            ],
            next: "refused",
          },
          { label: "Another time." },
        ],
      },
      {
        id: "paid",
        speaker: "Disciple Verren",
        text: "(The scales are cold, and heavier than they should be.) The school remembers its friends. Climb whenever you please — the gate will know your face.",
      },
      {
        id: "refused",
        speaker: "Disciple Verren",
        text: "(His smile doesn't reach anything at all.) Of course. Ghosts. Travel safely — the mountain misplaces people.",
      },
      {
        id: "done",
        speaker: "Disciple Verren",
        text: "Our arrangement is concluded, friend of the school. Debts here are settled... thoroughly.",
      },
    ],
  });

  // The peak gate — held until the spirit is Jade (keeps Act 3 story-gated).
  registerDialogue({
    id: "a2-peak-gate",
    start: "halt",
    nodes: [
      {
        id: "halt",
        speaker: "Gatekeeper of Heaven's Glory", // INVENTED post
        text: "The school mourns and trains, and admits no petitioners below Jade. The mountain takes the unprepared — and we tire of carrying them down.",
        branches: [{ when: [{ kind: "flag", key: "a2.jade" }], next: "open" }],
      },
      {
        id: "open",
        speaker: "Gatekeeper of Heaven's Glory",
        text: "(He reads your spirit the way you'd read a posted notice, and steps aside.) Jade. So the valley still makes them. Be welcome — the school is generous to its guests.",
      },
    ],
  });

  // ------------------------------------------------------------ cutscenes

  // First steps beyond the wall (same shape as the M4a seed scene: pan, two
  // narration lines, glide back — smokeContinue drives it by these timings).
  registerCutscene("a2-wilds-intro", [
    { kind: "panCamera", to: { x: 27 * 16, y: 5 * 16 }, seconds: 1.4 },
    {
      kind: "say",
      speaker: "",
      text: "The Valley Wilds. Beyond the village wall the aura runs thicker — and wilder. Dreadbeasts den in the ruins, spirits mangled into their meat.",
    },
    {
      kind: "say",
      speaker: "",
      text: "North and east, Mount Samara climbs toward its ring of white fire. Somewhere on that trail, a dead Sage's living disciple is waiting for nobody.",
    },
    { kind: "resetCamera", seconds: 0.8 },
    { kind: "setFlag", key: "a2.enteredWilds" },
  ]);
  addMapOnEnter("valleyWilds", { cutscene: "a2-wilds-intro", onceFlag: "a2.sawWildsIntro" });

  // JADE — story-gated through giveStage (requires Iron via the M3 systems;
  // the offer itself is conditioned stageGte Iron in a2-yerin).
  registerCutscene("a2-spirit-opens", [
    {
      kind: "say",
      speaker: "Yerin",
      text: "Breathe like I show you. In through the teeth. If your channels catch fire, that's the working half.",
    },
    { kind: "shake", intensity: 2, seconds: 1.0 },
    {
      kind: "say",
      speaker: "",
      text: "Madra scours through you like floodwater down a dry creek — and then the noise resolves. The world HUMS. Light aura streams off Samara's Ring like silk; every stone on the trail mutters in earth-tongue.",
    },
    { kind: "giveStage", stage: Stage.Jade, title: "JADE", sub: "Your spirit opens — the world hums with aura." },
    { kind: "setFlag", key: "a2.jade" },
    {
      kind: "say",
      speaker: "Yerin",
      text: "There you stand. Jade, and not even crying about it. School's at the top — smile at them, and keep your back to a wall.",
    },
    { kind: "effect", effect: { kind: "startQuest", quest: "the-mountains-hospitality" } },
  ]);

  // ------------------------------------------------------------- the maps

  addMapNpcs("samaraTrail", [
    {
      id: "a2-yerin",
      name: "Yerin",
      tx: 24,
      ty: 2,
      sprite: { hair: "#15131c", robe: "#d8d4cc", trim: "#a83a3a", skin: "#e0b490" },
      facing: "down",
      dialogueId: "a2-yerin",
      // Once the school turns, she is fled, captive, or beside you — not camped.
      unlessFlag: "heavensGlory.hostile",
    },
    {
      id: "a2-verren",
      name: "Disciple Verren", // INVENTED
      tx: 10,
      ty: 5,
      sprite: NPC_PALETTES["glorySchool"]!,
      facing: "down",
      dialogueId: "a2-verren",
      unlessFlag: "heavensGlory.hostile",
    },
    // The peak gate is a two-tile choke; two gatekeepers hold it until Jade.
    {
      id: "a2-gatekeeper-a",
      name: "Gatekeeper", // INVENTED post
      tx: 19,
      ty: 1,
      sprite: NPC_PALETTES["glorySchool"]!,
      facing: "down",
      dialogueId: "a2-peak-gate",
      guard: { untilFlag: "a2.jade", stepAside: { dx: -14, dy: 14 } },
      unlessFlag: "heavensGlory.hostile",
    },
    {
      id: "a2-gatekeeper-b",
      name: "Gatekeeper", // INVENTED post
      tx: 20,
      ty: 1,
      sprite: NPC_PALETTES["glorySchool"]!,
      facing: "down",
      dialogueId: "a2-peak-gate",
      guard: { untilFlag: "a2.jade", stepAside: { dx: 14, dy: 14 } },
      unlessFlag: "heavensGlory.hostile",
    },
  ]);

  // Yerin's hunt target: dens in the wilds' walled courtyard once you've
  // agreed to help; stays dead forever once slain (unlessFlag its own kill).
  addMapEnemies("valleyWilds", [
    {
      kind: "stalker",
      tx: 17,
      ty: 16,
      ifFlag: "a2.yerin.helping",
      unlessFlag: "a2.denStalkerSlain",
      onDeathFlag: "a2.denStalkerSlain",
      name: "Hollow-eyed dreadbeast",
    },
  ]);
}
