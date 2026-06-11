# Path of Ascension — A Cradle-Inspired 2D Action RPG

**Status:** Proposal for review — no code written yet.
**Fan project disclaimer:** Based on Will Wight's *Cradle* series. Non-commercial fan work; all original setting elements belong to Will Wight / Hidden Gnome Publishing. Names can be kept canon (fan-game style) or lightly renamed — your call (see Open Questions).

---

## 1. The Pitch

You are born into Sacred Valley — weak, sheltered, and ignorant of how vast the world really is. Choose your clan, walk a sacred artist's Path, and advance from Foundation toward Gold and beyond. The game follows the spine of Lindon's journey through the first arc of the series, but **you are not Lindon**: at every major story beat you can make the choice he made, or a different one, and the world reacts.

- **Genre:** 2D action RPG, real-time combat
- **View:** Third-person top-down/overhead (Zelda: Link to the Past / Stardew style) — your character is always visible on screen, and **combat happens right in the overworld in the same view**. No separate battle screens, no turn-based menus.
- **Length target (v1):** 2–4 hours of content covering the Sacred Valley arc (book 1, *Unsouled*), with systems built to extend into later arcs.

## 2. View & Controls (clarifying "2D third person")

The camera floats above and behind the world looking down at it; you see your whole character sprite and the area around them (the classic "2D third person" of SNES-era RPGs). The camera follows the player smoothly and never cuts away — story scenes, exploration, and fights all happen in this one continuous view.

| Input | Action |
|---|---|
| WASD / Arrows | Move (8-directional) |
| J / Left-click | Basic attack (your Path's strike) |
| K, L, U, I | Technique slots 1–4 |
| Space | Dodge / Burst movement |
| C (hold) | **Cycle** — regenerate madra (see §5) |
| E | Interact / Talk |
| Tab | Character sheet (core, Path, techniques, inventory) |

Gamepad support is a stretch goal; keyboard/mouse is v1.

## 3. Tech Stack

**Recommendation: TypeScript + HTML5 Canvas, zero runtime dependencies.**

- Runs in any browser — open `index.html` (or `npm run dev` for a dev server). Easy for you to playtest from anywhere.
- No engine lock-in, no asset licensing problems: all art is **original pixel art**, generated as code-drawn sprite sheets (procedural pixel sprites) so the repo stays self-contained.
- A small custom engine (game loop, ECS-lite entities, tile maps, camera, collision, dialogue, save system) is very tractable at this scope and keeps everything inspectable in the repo.
- Saves via `localStorage` (with export/import as JSON).

Alternative considered: **Phaser 3** (faster to stand up physics/tilemaps, but adds a dependency and bends the architecture to the framework). I'll default to the custom-engine route unless you prefer Phaser.

## 4. Character Creation

### 4.1 Choose your clan (Sacred Valley)

| Clan | Flavor | Starting Path | Mechanical identity |
|---|---|---|---|
| **Wei** | Proud, political, masters of illusion | Path of the White Fox (light & dream madra) | Trickster — decoys, invisibility blinks, confusion debuffs |
| **Li** | Aggressive rivals of the Wei | Path of the Golden Light (sword aura) | Duelist — fast strikes, parry/riposte, ranged sword crescents |
| **Kazan** | Mountain folk, smiths and brawlers | Path of the Broken Stone | Bruiser — armor-Enforcement, ground slams, knockback |
| **Unsouled** | Clanless / cast out (the Lindon start) | **No Path** — empty core | Hardest start: no techniques at first, but the only start that can later take **Twin Cores** and forbidden Paths. Scavenge, scheme, and out-prepare everyone. |

Clan choice also sets your starting reputation, family questline, and how NPCs in each part of the Valley treat you.

### 4.2 Advancement (the progression spine)

Foundation → **Copper** (perceive aura) → **Iron** (body remade: faster, tougher — visible in moment-to-moment gameplay) → **Jade** (sense techniques, minimap aura-sense) → **Gold** (Remnant ascension; v1 endgame) → *(later arcs: Truegold, Underlord…)*.

Each stage is earned through a **story-gated trial + resource cost**, not grinding alone — true to the books, advancement requires opportunity, treasures (elixirs, the Starlotus, parasite ring as a training multiplier), and willingness to take risks.

### 4.3 Techniques follow the books' four-part grammar

- **Enforcer** — buff self/weapon (e.g., White Fox cloak, Iron body surge)
- **Striker** — ranged madra attacks (sword crescents, dream-bolts)
- **Ruler** — area control via aura (zones of fox-fire, stone spikes)
- **Forger** — create solid madra (walls, weapons, the Thousand-Mile Cloud as your mount!)

Each Path unlocks techniques across these four types as you advance; technique slots (4) force loadout choices.

## 5. Real-Time Combat (in-world, same camera)

- Enemies roam the overworld; aggro is proximity/faction based. Fights start and end in place — flee by actually running away.
- **Madra is your everything-resource:** techniques drain it; your basic attack is free but weak. When empty you're nearly helpless (very Cradle).
- **Cycling is the core risk/reward mechanic:** hold C to cycle and visibly refill madra — but you slow to a walk and take +50% damage while cycling. Finding the rhythm of when to cycle *mid-fight* is the skill ceiling.
- **Stage gaps matter brutally**, like the books: a Jade fighting an Iron is a horror-movie monster. Some fights are *meant* to be fled or solved by cleverness (terrain, items, NPC allies) — the game telegraphs enemy stages through aura visuals once you reach Copper.
- Enemies leave **Remnants** on death (a second, spirit-form mini-fight or a harvest opportunity). Harvested Remnant parts + **scales** (currency, condensed madra) feed the Soulsmithing crafting system (weapons/bindings — v1 keeps this simple: 1 crafting NPC, Fisher Gesha style).

## 6. Story: Lindon's road, your choices

Act structure for v1 (the *Unsouled* arc), with branch points. "Canon" = what Lindon did.

| Beat | Canon choice | Alternative branches |
|---|---|---|
| **The Festival** | Cheat the duel with a halfsilver trick | Fight honestly (and likely lose — with consequences), refuse to fight, or sabotage a rival |
| **The Heaven's Glory vision** | Accept the heavens' warning and the marble; resolve to leave the Valley | Reject it (locks a "defend the Valley" ending path), tell your family (they don't believe you — reputation hit), or bargain for more |
| **The sword sage's disciple** (Yerin) | Earn her trust, become allies | Antagonize her (she becomes a recurring rival), or betray her location to the Heaven's Glory School (dark path, big short-term rewards) |
| **The Trial / Mount Samara** | Steal the ancestor's treasure and run | Stand trial, fight openly, or strike a deal with a faction elder |
| **Leaving the Valley** | Walk out with Yerin into the Desolate Wilds | Stay (Valley-defender ending for v1) or leave alone (harder Act 2 hook) |

Choices move three tracked axes — **Reputation** (per faction), **Resolve** (Lindon-style ruthless pragmatism vs. honor), and **Knowledge** (what you've learned about the outside world) — which gate dialogue, prices, quests, and the v1 endings (3 endings planned).

Unsouled-start players get extra Lindon-specific beats (the family shame scenes, the parasite ring, the Twin Core decision). Clan-start players get a mirrored version: their clan *expects* greatness, which creates different pressure and different betrayals.

## 7. World Map (v1)

1. **Wei Clan territory** — tutorial, festival arena, your family home
2. **Valley wilds** — Mount Samara foothills, dreadbeast dens, ruins (optional dungeons with advancement treasures)
3. **Heaven's Glory School** — late-game zone, vertical climb, stealth-or-fight design
4. **The Valley rim** — finale + ending split

Each zone is a hand-authored tile map with secrets that reward aura-sense (Jade unlocks hidden paths on the minimap — making advancement feel like new eyes, not just bigger numbers).

## 8. Build Plan & Subagent Delegation

I'll act as architect/integrator and **outsource to independent subagents**, as you asked:

| Subagent | Mission | Output |
|---|---|---|
| **Lore Research** | Verify canon details (clans, Paths, technique names, advancement requirements, book-1 timeline) so the game respects the source | `docs/lore-bible.md` |
| **Engine** | Game loop, tilemap renderer, camera, collision, input, save system | `src/engine/` |
| **Combat & Systems** | Madra/cycling, techniques, enemy AI, advancement stages, Remnants/Soulsmithing | `src/systems/` |
| **Content & Narrative** | Dialogue trees, quest scripts, branch/flag logic, the three endings | `src/content/` |
| **Art & Audio** | Procedural pixel sprite sheets, tile sets, aura VFX; simple WebAudio synth SFX | `src/art/` |
| **QA** | Playtest scripts, save/load integrity, balance pass on stage-gap math | `tests/` |

**Milestones** (each one playable, committed, and pushed):
1. **M1 — Walkable world:** engine core, one map, player movement, camera ✅ playable
2. **M2 — First blood:** combat loop, madra/cycling, 3 enemy types, death/respawn
3. **M3 — The Path system:** character creation, 4 starts, techniques, Copper→Iron advancement
4. **M4 — The story:** dialogue/quests, all Act beats, branches, endings, full Valley map
5. **M5 — Polish:** Remnants/Soulsmithing, VFX/SFX, balance, save slots, title screen

## 9. Open Questions for You

1. **Names:** Keep canon names (Wei clan, White Fox, Yerin, Suriel's marble) or lightly rename everything? (Canon is more fun; renamed is safer if you'd ever share it widely.)
2. **Engine:** OK with the zero-dependency TypeScript/Canvas approach, or do you prefer Phaser?
3. **Scope check:** v1 = the full *Unsouled* arc as scoped above. Want it bigger (start of Desolate Wilds) or smaller/faster (festival → escape only)?
4. **Difficulty default:** Books-accurate brutality (fleeing is often correct) as default with an easier mode, or the reverse?

---

*Once you approve (with any changes), I'll spin up the subagents and start at M1.*
