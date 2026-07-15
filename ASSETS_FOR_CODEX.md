# CODEX HAND-OFF — NORVENNA ART (this file is self-contained; paste it whole)

## YOUR TASK (read first)
You are a pixel-art asset generator for a finished 2D game. Produce original
Gen-3-style (GBA Ruby/Sapphire/Emerald) pixel art per the spec below. Do NOT copy
any real Pokemon designs, names, or sprites — everything is original.
- Honor the EXACT pixel dimensions, transparent-PNG requirement, and file paths.
  The game blits every asset 1:1, so wrong sizes render broken.
- Save all files under the `assets/` folder tree described below, and also write
  `assets/manifest.json` listing every PNG you created (format shown below).
- Partial deliveries work: start with the 100 fakemon (front+back, 64x64), then
  characters, tiles, battle backgrounds, and finally the GUI frames/icons.
- Back sprites face away but with the head/gaze angled UP-AND-RIGHT toward the foe.
- Keep filenames lowercase and exactly as written. Work top to bottom.

---

# COMPLETE ART ASSET BRIEF

You are producing the pixel-art assets for an original Gen-3-style (Ruby/Sapphire/
Emerald era) 2D monster-catching game called **Legends of Norvenna**. Everything is
ORIGINAL — do not copy any real Pokémon designs, names, or sprites.

## GLOBAL STYLE
- Era look: GBA Gen-3. Bold dark outline around each sprite, 3–4 tone cel shading,
  light source upper-left, a soft cast shadow where forms overlap. No anti-aliasing
  fuzz, no gradients — clean indexed-looking pixels.
- **Transparent background (PNG alpha).** No background fill, no ground shadow baked in
  unless noted.
- Readable silhouette first: the black outline alone must identify the creature.
- Vary poses so no two designs read as the same blob recolored. Rotate body plans:
  quadruped / biped / serpentine / floating / winged / insectoid / aquatic.
- Exact canvas sizes below are HARD requirements (the engine blits them 1:1).

## FOLDER LAYOUT (create these folders; filenames are exact, lowercase)
```
assets/
  pokemon/front/<key>.png     64x64  three-quarter FRONT view
  pokemon/back/<key>.png      64x64  BACK view, head turned slightly UP-RIGHT
                                     (as if looking at the opponent up-right)
  chars/<id>_<dir>_<frame>.png 16x22 overworld walker (dir: down/up/left/right,
                                     frame: 0 idle-step, 1 alt-step)
  tiles/<id>.png              16x16  (animated tiles: <id>_0.png, <id>_1.png, ...)
  battlebg/<kind>.png         240x112 battle backdrop (opaque OK)
  ui/title_logo.png           ~180x48 transparent logo art (optional)
  ui/ball.png                 16x16  the capture "orb" (red/white)
```
Also write **`assets/manifest.json`** listing every PNG you delivered, e.g.:
```json
{ "files": ["pokemon/front/cindrel.png", "pokemon/back/cindrel.png", "tiles/grass.png"] }
```
The engine reads that manifest and auto-substitutes each listed PNG for its built-in
procedural art. Anything you DON'T deliver keeps the built-in art, so partial
deliveries work fine — start with the 100 fakemon front+back if you like.

## 1) FAKEMON SPRITES — 100 species × (front 64×64 + back 64×64)
For EACH species: draw a **front** (three-quarter, facing camera) and a **back**
(rear view, but the head/gaze angled up-and-right toward the off-screen opponent).
Match the type mood: cute basics, fierce finals, majestic legendary. Fill the frame
(final stages ~52px tall; basics ~28–34px). Use the concept + dex text as direction.

| # | key (filename) | Name | Type(s) | Class | Visual direction (from dex) |
|---|---|---|---|---|---|
| 1 | `trollsprout` | Trollsprout | Grass | Seedling Troll | It naps beneath the taiga moss. The sprout on its head grows a new ring for every winter it survives. |
| 2 | `bryteknott` | Bryteknott | Grass | Knotted Troll | Bark plates knit across its shoulders. It wrestles young pines to test its growing strength. |
| 3 | `jotunwald` | Jotunwald | Grass/Ground | Forest Jotunn | Old maps mark lone hills that turned out to be sleeping Jotunwald. A whole grove grows from its shoulders. |
| 4 | `cindrel` | Cindrel | Fire | Hearth Newt | It sleeps curled in cooling hearths. Villagers consider one moving in to be a blessing on the house. |
| 5 | `pyrolisk` | Pyrolisk | Fire | Ember Drake | It sprints across snowfields on burning soles, leaving lines of steam that glow at dusk. |
| 6 | `fafnirn` | Fafnirn | Fire/Dragon | Lindworm | The old sagas tell of a serpent coiled on a hoard of embers. Its molten seams never cool, even in blizzards. |
| 7 | `selkip` | Selkip | Water | Selkie Pup | Fisherfolk swear it borrows lost mittens to sleep on. It sheds a single tear when winter's first snow falls. |
| 8 | `selkora` | Selkora | Water | Selkie | On moonlit nights it sheds its outer coat on the rocks. Anyone who touches the coat is led safely home through fog. |
| 9 | `krakelott` | Krakelott | Water/Dark | Storm Kraken | Sailors' charts mark its hunting grounds with a crown of tentacles. It drags whole storms behind it like a cloak. |
| 10 | `sprigfawn` | Sprigfawn | Grass | Moss Fawn | Born where the Whisperwood moss grows thickest. If it stands still in a Route meadow, songbirds nest between its sprout-antlers. |
| 11 | `mossbuck` | Mossbuck | Grass | Sapling Buck | Its antlers are living saplings that leaf out each spring. Birchwick foresters follow its trails to find the healthiest stands of birch. |
| 12 | `elderhorn` | Elderhorn | Grass/Psychic | Elk Spirit | The old wardens of Whisperwood swore oaths beneath its tree-crowned brow. Where its runic spots glow, the taiga dreams aloud. |
| 13 | `puffinch` | Puffinch | Normal/Flying | Puffball Chick | Too round to fly, it rolls downhill through the Route meadows to build up speed. Birchwick children race them down the lumber chutes. |
| 14 | `galewing` | Galewing | Normal/Flying | Gale Bird | It outruns squalls rolling in off the fjord and threads the Whisperwood pines at full speed. Its wingbeats sound like snapping sailcloth. |
| 15 | `stormgull` | Stormgull | Water/Flying | Storm Gull | Fisherfolk read the sea by its wings: when the wave-marks darken, a gale follows within the hour. It rides the storm it carries. |
| 16 | `nibbit` | Nibbit | Normal | Seed Hoard | It stuffs one seed in its paws and refuses to share, even mid-battle. Route farmers lose a tithe of every harvest to its burrows. |
| 17 | `lemmoth` | Lemmoth | Normal | Fur Avalanche | When it dozes off on a slope, whole snowbanks come down with it. Birchwick paid it in grain to sleep somewhere else. |
| 18 | `larvel` | Larvel | Bug | Glowworm | On moonless nights the Whisperwood floor is stitched with its faint green lights. Wanderers who follow them are led gently back to the road. |
| 19 | `chrysalisk` | Chrysalisk | Bug | Ice Cocoon | It hangs among true icicles and lets the frost seal it shut. One patient eye watches winter pass through a window of clear ice. |
| 20 | `aurorwing` | Aurorwing | Bug/Psychic | Aurora Moth | Skalders say the northern lights are the wake of a thousand Aurorwing flying too high to see. Its wingbeats scatter dream-bright dust. |
| 21 | `brockle` | Brockle | Dark/Normal | Sour Badger | It has never once been in a good mood. Birchwick loggers leave the day's first felled trunk across its den as rent, or lose their boots. |
| 22 | `pineling` | Pineling | Grass/Bug | Pinecone Hog | It is exactly the size and shape of a Whisperwood pinecone, and naps in the litterfall. Squirrels that grab one never do it twice. |
| 23 | `conifurze` | Conifurze | Grass/Bug | Bristle Boar | Its cone-scale armor turns axes, and its needle mane drips stinging resin. When it charges, the whole taiga steps aside. |
| 24 | `sparkit` | Sparkit | Electric | Static Kit | Its tail frays like a snapped rope and spits sparks when it sneezes. Petting one is a rite of passage on the Route meadows. |
| 25 | `voltuft` | Voltuft | Electric | Storm Squirrel | The charge in its tail could light Birchwick for a week. Before a thunderstorm, whole drays of them climb the tallest pines to drink the sky. |
| 26 | `cairnling` | Cairnling | Rock | Waystone | Travelers stack trail-cairns to mark the way through the taiga; some of the cairns stack themselves. It shuffles a step whenever no one watches. |
| 27 | `dolmenor` | Dolmenor | Rock/Ground | Dolmen Golem | The oldest waystones on the moor rise on pillar legs when the fog is thick. Its capstone shoulders bear runes no living skald can read. |
| 28 | `minnowisp` | Minnowisp | Water | Lantern Minnow | Shoals of them drift under the Tidesend piers like sunken stars. A single one is said to light a drowned soul home. |
| 29 | `herrdart` | Herrdart | Water | Arrow Pike | It crosses the ferry lane faster than the ferry. Fisherfolk mend the holes it punches clean through their nets. |
| 30 | `krillbit` | Krillbit | Water/Bug | Lance Krill | A knight no larger than a herring bucket. It drills its lance-antenna against mooring posts each dawn. |
| 31 | `puffle` | Puffle | Ice/Flying | Frost Chick | It tumbles off the drift-ice shelf before its wings can carry it. The frost dusting its down never melts. |
| 32 | `berguin` | Berguin | Ice/Water | Waistcoat Bird | It waddles the ferry gangway like a purser inspecting tickets. Its ice-blue waistcoat marking never wrinkles. |
| 33 | `emperoyal` | Emperoyal | Ice/Water | Corsair Emperor | Old harbormasters dip their flags when it surfaces. Its wave-cloak marking is said to hold a piece of every storm it has outswum. |
| 34 | `clampike` | Clampike | Water/Steel | Snug Clam | The pike sheltering inside pays rent in scraps. When danger nears, the shell slams shut on friend and foe alike. |
| 35 | `reefclad` | Reefclad | Water/Steel | Shell Knight | Its shell has turned away harpoon, anchor and gale. The coral plume atop it is a living banner grown over a hundred years. |
| 36 | `draklet` | Draklet | Dragon | Fjord Dragonet | It claims one wave-washed rock and defends it for life. Ferry pilots steer around its perch out of respect. |
| 37 | `fjorddrake` | Fjorddrake | Dragon/Water | Wave Wyrm | Seen from the cliffs it is just one more swell rolling up the fjord — until the swell opens its eyes. |
| 38 | `shiverfin` | Shiverfin | Ice/Water | Star Whale | Its spiral horn is cold enough to freeze the spray it breaches through. Skippers navigate the drift ice by the stars on its back. |
| 39 | `walrust` | Walrust | Ice/Steel | Anchor Walrus | Its tusks rusted iron-red from a lifetime prying anchors off the seabed. The chain scar across its shoulder never fully healed. |
| 40 | `jelluna` | Jelluna | Water/Psychic | Moon Jelly | On clear nights the ferry crossing glitters with them. Each carries a sliver of moonlight inside its bell, waxing as the month grows old. |
| 41 | `lumedusa` | Lumedusa | Water/Psychic | Radiant Medusa | It rises from Tidegrot Cave when the moon is full, wearing the tide like a gown. Sailors who follow its glow are never seen wrecked — or again. |
| 42 | `anglow` | Anglow | Water/Electric | Storm Lure | It hangs below the drift ice where no light reaches, sipping stray lightning from winter storms. Its lure crackles like a bottled gale. |
| 43 | `mudlusk` | Mudlusk | Water/Ground | Mudskip | It hauls itself up the harbor steps on stiff fin-arms to watch the ferry come in. Its grin is stuck that way. |
| 44 | `mirelurk` | Mirelurk | Water/Ground | Fen Lurker | Wildfowl nest in the reeds on its back, never guessing the fen bank beneath them breathes. It surfaces once a day to yawn. |
| 45 | `coralith` | Coralith | Rock/Water | Reef Relic | Revived from a Fin Fossil pried out of Tidegrot Cave. The reef it once anchored is long gone; it keeps patrolling where the reef used to be. |
| 46 | `glimmouse` | Glimmouse | Fairy | Lantern Mouse | Miners of Irondeep follow its glowing tail-tuft through pitch-black galleries. It dims the light when strangers feel unkind. |
| 47 | `sylphund` | Sylphund | Fairy | Sylph Hound | It pads soundlessly through the Whisperwood depths, ribbon-ears streaming light. Lost children wake at the old lodge with no memory of the road. |
| 48 | `scrappup` | Scrappup | Fighting | Scrapper Pup | It picks fights with creatures thrice its size behind the old lodge. The strap across its chest is a badge, not a bandage — it has never once given up. |
| 49 | `gulomaul` | Gulomaul | Fighting/Dark | Wolverine Bruiser | Even the foremen of Irondeep down tools when one wanders into a gallery. Its torn ear marks the one fight it did not finish — the other fighter kept the rest. |
| 50 | `ramlet` | Ramlet | Rock | Pebble Lamb | Its wool sets into pebbles as it grows, shed each spring in little cairns. Shepherds near Tidegrot Cave stack them for luck. |
| 51 | `boulderam` | Boulderam | Rock/Fighting | Battering Ram | Old raiding songs say fortress gates were tested against a charging Boulderam. Its stone horns strike sparks that light the Whisperwood at dusk. |
| 52 | `echomite` | Echomite | Poison/Flying | Echo Bat | Swarms of them roost in Tidegrot Cave, ears twitching at every drip. A single drop of its fang-venom can numb a bear's paw. |
| 53 | `screechelon` | Screechelon | Poison/Flying | Radar Bat | Its dish-shaped ears map the Irondeep Mines to the last pebble. One screech at full pitch can shiver ore straight out of the wall. |
| 54 | `sporeling` | Sporeling | Grass/Poison | Cap Sprite | It sprouts overnight in fairy rings deep in the Whisperwood. Foragers count the polka dots — an odd number means the whole ring is watching. |
| 55 | `myceloom` | Myceloom | Grass/Poison | Spore Shaman | It sways at the heart of the Whisperwood depths, swinging censers of dream-spores. Those who breathe deep sleep a year and wake speaking with mushrooms. |
| 56 | `shardling` | Shardling | Rock/Ice | Ice Quartz | Clusters of it stud the walls of Tidegrot Cave, blinking when lanterns pass. Prospectors who pocket one find their packs mysteriously heavier by morning. |
| 57 | `prismarok` | Prismarok | Rock/Ice | Prism Monolith | A standing stone that was never raised by hands. Lantern light entering its facets leaves as ribbons of color that dance along the mine walls. |
| 58 | `wickwisp` | Wickwisp | Ghost/Fire | Candle Wisp | It is the stub of a candle that lit the old lodge for a hundred winters. Its face melted long ago; it keeps smiling anyway, more or less. |
| 59 | `pyrelight` | Pyrelight | Ghost/Fire | Pyre Lantern | An iron mine-lantern that outlived every hand that carried it. It drifts the Irondeep galleries at shift-end, counting miners out — and grieving any short count. |
| 60 | `barrowght` | Barrowght | Ghost/Ground | Barrow Wight | What hikers map as a mossy knoll behind the old lodge is sometimes gone by morning. Whatever was buried beneath it walks with it, and wants its ring back. |
| 61 | `oreling` | Oreling | Steel/Rock | Ore Nugget | It bristles with magnetic shavings that stand on end when a pick swings nearby. Irondeep crews rate a seam by how many Oreling doze inside it. |
| 62 | `ingotaur` | Ingotaur | Steel/Rock | Ingot Minotaur | Smelted slab by slab in a forge nobody remembers firing, it still glows along every seam. It guards the deepest gallery of Irondeep, horns lowered. |
| 63 | `loadstork` | Loadstork | Steel/Flying | Magnetite Stork | It wades the flooded levels of Irondeep on girder-straight legs, its magnet bill hoisting dropped bolts. Nests near Tidegrot Cave are held together by nothing but pull. |
| 64 | `wispurr` | Wispurr | Psychic | Moonspot Kit | It naps on dusk roads where the aurora first touches the heather. The moon-mark on its brow brightens when it dreams. |
| 65 | `mystrix` | Mystrix | Psychic | Aurora Lynx | Its ear-tassels stream ribbons of living light across the Lumenveil highlands. Herders read tomorrow's weather in their colors. |
| 66 | `nokkolt` | Nokkolt | Water/Dark | River Foal | It grazes by fords at dusk, always dripping though it never rains. Children are told never to accept a ride. |
| 67 | `nokkmare` | Nokkmare | Water/Dark | Nixie Horse | A horse poured from black river-water. Its mane falls upward like an inverted falls, and riders who mount it are never seen ashore again. |
| 68 | `frostkit` | Frostkit | Ice | Arctic Kit | Its frost-tipped tail leaves a line of rime wherever it drags. Trappers follow the sparkle to find safe paths over thin ice. |
| 69 | `vulpaura` | Vulpaura | Ice/Fairy | Aurora Fox | When it fans its banded tails the sky answers in the same colors. Highland folk say the northern lights are Vulpaura counting its tails. |
| 70 | `trolltoad` | Trolltoad | Poison/Fighting | Bridge Troll | It squats beneath dusk-road bridges and demands a toll of berries. Those who refuse are knuckle-rolled into the ditch. |
| 71 | `mammorost` | Mammorost | Ice/Ground | Frost Mammoth | Revived from a tusk locked in Glacier Cavern ice. The crevasse marks on its flanks deepen each winter, as if the glacier still remembers it. |
| 72 | `chimebud` | Chimebud | Fairy/Grass | Bluebell Bud | It hangs from its own crooked stem among the harebells and rings softly at moonrise. Only the wind can tell which flower is listening. |
| 73 | `bellsylph` | Bellsylph | Fairy/Grass | Carillon Sylph | It drifts over aurora fields, its skirt of bell-flowers pealing a lullaby. Whole caravans have slept sweetly through the coldest nights. |
| 74 | `zapkid` | Zapkid | Electric | Static Kid | Its wool stands on end with stored charge. Shearing one calls for wooden combs and a great deal of nerve. |
| 75 | `thundram` | Thundram | Electric/Fighting | Thunder Ram | It stamps the high passes until thunderheads gather to answer. Its horns are said to be bolts that struck twice and stayed. |
| 76 | `corvusk` | Corvusk | Dark/Flying | Masked Raven | It wears the bleached mask of a bird that came before it. Dusk-road travelers count them: one for secrets, two for storms. |
| 77 | `grimcorvid` | Grimcorvid | Dark/Flying | Doom Raven | It holds a rune-coin no smith remembers striking. Where it drops the coin, folk quietly rewrite their wills. |
| 78 | `skimmerling` | Skimmerling | Bug/Dragon | Wyrm Nymph | It lurks in tarn shallows, whiskers tasting the current for storms. Anglers who hook one apologize twice and cut the line. |
| 79 | `wyrmskim` | Wyrmskim | Bug/Dragon | Jeweled Darner | Four glass wings carry it faster than the eye can follow. Old wives say each wing was cut from a different frozen lake. |
| 80 | `yetiling` | Yetiling | Ice/Fighting | Young Yeti | It shadow-boxes avalanches for practice on the Glacier Cavern approaches. Its icicle knuckles regrow overnight, sharper each time. |
| 81 | `runelith` | Runelith | Psychic/Rock | Runestone | A standing stone that wandered off its barrow one solstice night. The runes spell a name that hurts to remember. |
| 82 | `sulfimer` | Sulfimer | Poison/Fire | Mudpot Imp | It wallows in the Cinder Vents where sulfur bubbles up hot. Each pop of a bubble makes it giggle and belch a spark. |
| 83 | `geysmog` | Geysmog | Poison/Fire | Geyser Fiend | A column of scalding steam given a will of its own. It erupts from a stone vent it wears like a pair of boots. |
| 84 | `hullghast` | Hullghast | Ghost/Water | Wreck Maiden | The carved figurehead of a ship lost with all hands. It drifts the harbor fog, trailing the ghost of a hull that will never make port. |
| 85 | `umbrafloe` | Umbrafloe | Dark/Ice | Floe Shadow | The dark shape gliding under the drift ice. By the time a lone traveler sees the claw break through, it is already too late. |
| 86 | `forgeling` | Forgeling | Steel/Dragon | Forge Wyrmlet | Hatched in the heart of an Irondeep forge, it curls around a lump of ember-iron and will not let it cool. |
| 87 | `jarnwyrm` | Jarnwyrm | Steel/Dragon | Iron Wyrm | Its riveted plates ring like a smith's hammer when it moves. Molten light bleeds from the seams between every segment. |
| 88 | `skjaldhawk` | Skjaldhawk | Flying/Fighting | Shield Hawk | Its wings are painted like war-shields. It clashes them together to sound a challenge that echoes off the fjords. |
| 89 | `cubbly` | Cubbly | Normal | Cub | A roly-poly snow-bear cub. It licks its paws for warmth and tumbles down drifts for the sheer joy of it. |
| 90 | `ursnow` | Ursnow | Normal/Ice | Snow Bear | It plows through blizzards without slowing. Its breath plumes so thick that hunters mistake it for a moving snow-squall. |
| 91 | `seidkona` | Seidkona | Psychic/Ghost | Veiled Seer | A hooded seeress who drifts a hand-span above the snow. Those who glimpse the single eye behind her veil dream only of it for a year. |
| 92 | `rattenkin` | Rattenkin | Dark/Poison | Plague Trickster | A cunning rat that stitches itself a hood from stolen scraps. It always carries one coin it will never, ever spend. |
| 93 | `drillvole` | Drillvole | Ground/Steel | Drill Vole | Its steel snout spins fast enough to bore through Irondeep's hardest ore. It surfaces only to sneeze out the tailings. |
| 94 | `cindercrag` | Cindercrag | Fire/Rock | Crag Hound | A hound of cooled basalt with a furnace still roaring inside. It sleeps in the Cinder Vents and wakes hungry, cracks glowing. |
| 95 | `frostfern` | Frostfern | Grass/Ice | Rime Fern | When a glacierling crystallizes under the aurora, its heart sprouts an eternal fern of frost that never wilts and never thaws. |
| 96 | `dreamlyn` | Dreamlyn | Fairy/Psychic | Dream Ewe | Its cloud-soft wool drinks in dreams as it drifts off. Shepherds who nap against it wake with the answer to a question they forgot they had. |
| 97 | `glacierling` | Glacierling | Dragon/Ice | Glacier Cub | A chunk of living glacier just learning to walk. Its deep-blue eyes hold the slow memory of a thousand frozen winters. |
| 98 | `frystdrake` | Frystdrake | Dragon/Ice | Rime Drake | Ice wings still budding, it races down glacier slopes faster than an avalanche and just as impossible to stop. |
| 99 | `fimbulwyrm` | Fimbulwyrm | Dragon/Ice | Winter Wyrm | The saga-beast said to bring the fimbulwinter that ends the world. Its crown of icicles glints with a captive scrap of aurora. |
| 101 | `mothpyre` | Mothpyre | Bug/Fire | Ember Moth | It drinks the heat of dying campfires. Its wing-dust glows like embers on the night wind. |
| 102 | `gloamcat` | Gloamcat | Dark | Dusk Kit | A kitten of the twilight. The crescent on its brow glows faintly when it hunts by night. |
| 103 | `nocturnyx` | Nocturnyx | Dark/Psychic | Panther of Dusk | It stalks the space between waking and dreaming. Prey never hears it — they simply stop remembering the moment before. |
| 104 | `lilypip` | Lilypip | Water/Grass | Lilypad Frog | It rides a lily pad it grew itself. When startled, it curls the pad over its head like a green umbrella. |
| 105 | `lotanic` | Lotanic | Water/Grass | Lotus Toad | A great lotus blooms from its back, opening at dawn. Ponds where it lives run crystal clear. |
| 106 | `volteel` | Volteel | Water/Electric | Coil Eel | It coils in kelp and waits. A touch of its skin delivers a jolt strong enough to stun a Fjorddrake. |
| 107 | `claydoll` | Claydoll | Rock/Fairy | Kiln Doll | An ancient votive figure fired in a forgotten kiln. The glowing glyphs on its body are a prayer no one now can read. |
| 108 | `aurorpix` | Aurorpix | Fairy/Electric | Aurora Sprite | A sliver of the aurora that slipped loose and learned to dance. It leaves a trail of light that lingers for hours. |
| 109 | `mantasurge` | Mantasurge | Water/Flying | Sky Ray | It breaches the waves and glides on sea-wind for miles. Sailors call a passing Mantasurge the promise of fair weather. |
| 110 | `umbryx` | Umbryx | Dark/Ghost | Night-Heart | When the aurora sleeps, its shadow wakes. The sagas say Auroryx and Umbryx are one being split by the turning of day into night. |
| 111 | `clodling` | Clodling | Ground | Clod Pup | A pup of packed earth and stubborn will. It headbutts boulders for fun and never seems to tire. |
| 112 | `terrawyrm` | Terrawyrm | Ground/Dragon | Burrow Wyrm | It tunnels the foothills for miles, following veins of ore it can taste through the stone. |
| 113 | `magnadrake` | Magnadrake | Ground/Dragon | Titan Wyrm | The mountains themselves are said to be old Magnadrake, curled up and gone to sleep for good. Waking one is a very bad idea. |
| 114 | `pupperine` | Pupperine | Normal | Loyal Pup | It bonds for life with the first trainer to share a meal. It sleeps pressed to their boots so it will wake if they stir. |
| 115 | `lealkin` | Lealkin | Normal/Fairy | Noble Hound | Its coat gained a starlit sheen the day its bond with its trainer was sealed. It will not leave their side, in this life or beyond. |
| 116 | `pollywisp` | Pollywisp | Water | Wisp Tadpole | A tadpole with a will-o-the-wisp for a tail. Where it grows up decides what it becomes: firm marsh, or haunted bog. |
| 117 | `marshgil` | Marshgil | Water/Ground | Marsh Newt | It plants its broad feet in the mud and refuses to budge. Floods break around it like a stone in a stream. |
| 118 | `mirephantom` | Mirephantom | Water/Ghost | Bog Wraith | A tadpole that drowned in a haunted fen and rose again as mist. The lights it dances are the last thoughts of the lost. |
| 119 | `gemkit` | Gemkit | Rock | Gem Kit | A small beast studded with raw crystal. Under the right light it hums a note only its own kind can hear. |
| 120 | `prismyx` | Prismyx | Rock/Fairy | Prism Fox | When an Aurora Stone touched its crystals, they bloomed into a living prism. It scatters the aurora into a thousand colors as it runs. |
| 100 | `auroryx` | Auroryx | Dragon/Electric | Storm-Heart | The aurora over Norvenna is the light of its sleeping heartbeat. The sagas warn: the sky it dreams is gentler than the sky it wakes to. |

Stage/evolution context (draw evolved forms bigger & more elaborate than their pre-evos):
- Trollsprout → Bryteknott (Lv16)
- Bryteknott → Jotunwald (Lv34)
- Cindrel → Pyrolisk (Lv16)
- Pyrolisk → Fafnirn (Lv34)
- Selkip → Selkora (Lv16)
- Selkora → Krakelott (Lv34)
- Sprigfawn → Mossbuck (Lv16)
- Mossbuck → Elderhorn (Lv32)
- Puffinch → Galewing (Lv14)
- Galewing → Stormgull (Lv30)
- Nibbit → Lemmoth (Lv18)
- Larvel → Chrysalisk (Lv10)
- Chrysalisk → Aurorwing (Lv22)
- Pineling → Conifurze (Lv20)
- Sparkit → Voltuft (stone)
- Cairnling → Dolmenor (Lv25)
- Minnowisp → Herrdart (Lv18)
- Puffle → Berguin (Lv16)
- Berguin → Emperoyal (Lv34)
- Clampike → Reefclad (Lv28)
- Draklet → Fjorddrake (Lv35)
- Jelluna → Lumedusa (stone)
- Mudlusk → Mirelurk (Lv26)
- Glimmouse → Sylphund (friendship)
- Scrappup → Gulomaul (Lv24)
- Ramlet → Boulderam (Lv22)
- Echomite → Screechelon (Lv20)
- Sporeling → Myceloom (Lv23)
- Shardling → Prismarok (Lv30)
- Wickwisp → Pyrelight (stone)
- Oreling → Ingotaur (Lv28)
- Wispurr → Mystrix (Lv28)
- Nokkolt → Nokkmare (Lv30)
- Frostkit → Vulpaura (stone)
- Chimebud → Bellsylph (stone)
- Zapkid → Thundram (Lv26)
- Corvusk → Grimcorvid (Lv31)
- Skimmerling → Wyrmskim (Lv33)
- Sulfimer → Geysmog (Lv32)
- Forgeling → Jarnwyrm (Lv38)
- Cubbly → Ursnow (Lv30)
- Glacierling → Frystdrake (Lv35)  OR  Frostfern (stone)
- Frystdrake → Fimbulwyrm (Lv45)
- Gloamcat → Nocturnyx (Lv30)
- Lilypip → Lotanic (Lv28)
- Clodling → Terrawyrm (Lv32)
- Terrawyrm → Magnadrake (Lv52)
- Pupperine → Lealkin (friendship)
- Pollywisp → Marshgil (Lv30)  OR  Mirephantom (stone)
- Gemkit → Prismyx (stone)

## 2) OVERWORLD CHARACTERS — 16×22, 4 directions × 2 walk frames
Chibi Gen-3 overworld style (2-head-tall). For each id below produce 8 files:
`<id>_down_0 _down_1 _up_0 _up_1 _left_0 _left_1 _right_0 _right_1`.
Left/right may be mirrors. Frame 0/1 alternate the stepping leg. Transparent bg.

| id (filename prefix) | who they are |
|---|---|
| `player_m` | Male player hero (red cap + jacket) |
| `player_f` | Female player hero (pink cap, longer hair) |
| `prof` | Professor Aspen (white lab coat, grey hair) |
| `rival_m` | Rival Kai (friendly, blue hair, green top) |
| `rival_f` | Rival Vera (arrogant, pink hair, purple top) |
| `ionar_grunt` | Team Ionar grunt (storm-grey uniform, cap) |
| `ionar_boss` | Magnus Voll, Ionar leader (dark coat, silver hair) |
| `npc_villager` | Generic villager man |
| `npc_woman` | Generic woman (long hair) |
| `npc_oldman` | Old man (grey hair, cane vibe) |
| `npc_fisher` | Fisher (hat, blue coat) |
| `npc_hiker` | Hiker (orange coat, brown hat) |
| `npc_sailor` | Sailor (white uniform) |
| `npc_ranger` | Ranger (green, hat) |
| `nurse` | Pokecenter nurse (pink hair, white uniform) |
| `clerk` | Pokemart clerk (blue uniform) |
| `gym_leader` | Gym leader Astrid (gold hair, purple outfit) |
| `champion` | Champion Sigrid (ranger-turned-champion) |

## 3) TILES — 16×16 each, seamless/tileable, transparent where noted
Overworld & interior tiles. Animated tiles need one PNG per frame (`<id>_0.png` ...).

| id (filename) | frames | what it is |
|---|---|---|
| `grass` | 1 | Base grass |
| `tallgrass` | 1 | Tall grass (encounters) |
| `flowers` | 2 | Flower grass (anim sway) |
| `path` | 1 | Dirt path |
| `snow` | 1 | Snow ground |
| `tallsnow` | 1 | Tall snow grass |
| `ice` | 1 | Slippery ice |
| `water` | 4 | Water (anim) |
| `waterfall` | 2 | Waterfall (anim) |
| `rock` | 1 | Rock wall/cliff |
| `boulder` | 1 | Pushable boulder (Strength) |
| `crackrock` | 1 | Cracked rock (Rock Smash) |
| `tree` | 1 | Leafy tree (solid) |
| `pine` | 1 | Snow-capped pine |
| `snowpine` | 1 | Snowy pine |
| `cutbush` | 1 | Cuttable bush (Cut) |
| `ledge` | 1 | Jump-down ledge |
| `fence` | 1 | Wooden fence |
| `sign` | 1 | Signpost |
| `sand` | 1 | Sand |
| `cavefloor` | 1 | Cave floor |
| `cavewall` | 1 | Cave wall |
| `crystal` | 2 | Glowing crystal (anim) |
| `roof_l` | 1 | Red roof left |
| `roof_m` | 1 | Red roof mid |
| `roof_r` | 1 | Red roof right |
| `roofb_l` | 1 | Blue roof left |
| `roofb_m` | 1 | Blue roof mid |
| `roofb_r` | 1 | Blue roof right |
| `roofg_l` | 1 | Green roof left (lab) |
| `roofg_m` | 1 | Green roof mid |
| `roofg_r` | 1 | Green roof right |
| `roofp_l` | 1 | Purple roof left (gym) |
| `roofp_m` | 1 | Purple roof mid |
| `roofp_r` | 1 | Purple roof right |
| `wall` | 1 | Building wall |
| `window` | 2 | Lit window (anim) |
| `door` | 1 | Door |
| `mat` | 1 | Welcome mat |
| `center_sign` | 2 | Pokecenter sign (anim) |
| `mart_sign` | 1 | Pokemart sign |
| `gym_statue` | 1 | Gym statue |
| `floor_wood` | 1 | Wood floor |
| `floor_tile` | 1 | Tile floor |
| `rug` | 1 | Rug |
| `wall_in` | 1 | Interior wall |
| `table` | 1 | Table |
| `chair` | 1 | Chair |
| `bed` | 1 | Bed |
| `bookshelf` | 1 | Bookshelf |
| `counter` | 1 | Shop/center counter |
| `pc` | 2 | Storage PC (anim) |
| `plant` | 1 | Potted plant |
| `lab_machine` | 2 | Lab machine (anim) |
| `healer` | 2 | Healing machine (anim) |
| `stairs_down` | 1 | Cave stairs |

## 4) BATTLE BACKGROUNDS — 240×112, opaque
Each has distant scenery + two ground platforms (enemy upper-right, player lower-left).
| kind (filename) | scene |
|---|---|
| `grass` | Grassy meadow, treeline |
| `snow` | Snowfield with mountains |
| `cave` | Dark cavern, stalactites |
| `water` | Open sea / shore |
| `volcano` | Geothermal crags, lava glow |
| `aurora` | Night highlands under the aurora |
| `interior` | Indoor gym/room floor |

## 5) GUI / INTERFACE ART — the on-screen frames, bars, and icons
These skin the menus, dialogue, and battle HUD. All transparent PNG unless noted.
Frames are drawn as 9-slice (corners fixed, edges/centre stretch), so make a clean
bordered box with a 3px corner. Keep a cohesive icy/parchment Gen-3 UI theme.
```
assets/ui/frame_msg.png     32x32  9-slice dialogue/message box (cream fill, blue border)
assets/ui/frame_menu.png    32x32  9-slice menu/panel box (lighter, thinner border)
assets/ui/frame_battle.png  32x32  9-slice battle HUD info box (rounded, opaque-ish)
assets/ui/cursor.png         8x8   the "▶" selection arrow (red)
assets/ui/hpbar.png         64x8   HP bar frame + fill guide (green>yellow>red zones)
assets/ui/expbar.png        64x4   EXP bar (blue fill on dark track)
assets/ui/ball.png          16x16  capture orb: top red, bottom white, dark band, shine
assets/ui/title_logo.png   180x48  "LEGENDS OF NORVENNA" logo, icy blue, transparent
assets/ui/badge_<0-7>.png   16x16  the 8 gym badges (see list below), transparent
assets/ui/status_<id>.png   20x9   status tags: id = psn,brn,par,slp,frz,tox
assets/ui/type_<type>.png   40x11  the 18 type chips (colored pill + short label)
```
The 18 TYPES (for type_<type>.png, lowercase): normal, fire, water, electric, grass,
ice, fighting, poison, ground, flying, psychic, bug, rock, ghost, dragon, dark,
steel, fairy. Use these theme colors as the pill fill:
```
  normal   #a8a090
  fire     #e8613a
  water    #3f7fe0
  electric #f0c020
  grass    #58b04a
  ice      #6fd0d8
  fighting #b3382d
  poison   #9046a0
  ground   #d0a850
  flying   #8fa0e8
  psychic  #e85888
  bug      #98ac20
  rock     #a89058
  ghost    #635090
  dragon   #6048d8
  dark     #5c4a42
  steel    #a0a0b8
  fairy    #e89ae0
```
The 8 GYM BADGES (badge_0..badge_7) — small emblem, ~14px, distinct color/shape each:
  badge_0: Steadfast (Normal, Astrid) — a shield/heart, grey-gold
  badge_1: Verdant (Grass, Eirik) — a leaf, green
  badge_2: Tidal (Water, Runa) — a wave drop, blue
  badge_3: Ember (Fire, Brandt) — a flame, orange-red
  badge_4: Lumen (Psychic, Sylja) — an eye/star, pink
  badge_5: Iron (Steel, Torvald) — a gear, steel-grey
  badge_6: Glacier (Ice, Yrsa) — a snowflake, cyan
  badge_7: Storm (Dragon, Signe) — a lightning wing, violet

## 6) ITEM ICONS — 16×16, transparent
One small icon per item, shown in the bag, shop, and party screens. Keep them
crisp and readable at 16px. Group by kind (balls look like capture orbs, potions
like bottles, berries/charms for held items, gems for stones, discs for TMs, etc.).
`items/<id>.png` for each id below:

| id (filename) | name | kind | look |
|---|---|---|---|
| `fieldorb` | Fieldorb | ball | capture orb (red top / white bottom, tinted) |
| `greatorb` | Greatorb | ball | capture orb (red top / white bottom, tinted) |
| `ultraorb` | Ultraorb | ball | capture orb (red top / white bottom, tinted) |
| `meshorb` | Meshorb | ball | capture orb (red top / white bottom, tinted) |
| `gloomorb` | Gloomorb | ball | capture orb (red top / white bottom, tinted) |
| `rushorb` | Rushorb | ball | capture orb (red top / white bottom, tinted) |
| `denorb` | Denorb | ball | capture orb (red top / white bottom, tinted) |
| `primeorb` | Primeorb | ball | capture orb (red top / white bottom, tinted) |
| `potion` | Potion | medicine | bottle/potion |
| `super_potion` | Super Potion | medicine | bottle/potion |
| `hyper_potion` | Hyper Potion | medicine | bottle/potion |
| `max_potion` | Max Potion | medicine | bottle/potion |
| `antidote` | Antidote | medicine | bottle/potion |
| `burn_salve` | Burn Salve | medicine | bottle/potion |
| `ice_thaw` | Ice Thaw | medicine | bottle/potion |
| `awakening` | Awakening | medicine | bottle/potion |
| `paralyze_heal` | Paralyze Heal | medicine | bottle/potion |
| `full_heal` | Full Heal | medicine | bottle/potion |
| `revive` | Revive | medicine | bottle/potion |
| `max_revive` | Max Revive | medicine | bottle/potion |
| `ether` | Ether | medicine | bottle/potion |
| `rare_candy` | Rare Candy | medicine | bottle/potion |
| `repel` | Repel | misc | spray can / charm |
| `super_repel` | Super Repel | misc | spray can / charm |
| `escape_rope` | Escape Rope | misc | spray can / charm |
| `x_attack` | X Attack | battle | stat vial |
| `x_defense` | X Defense | battle | stat vial |
| `x_special` | X Special | battle | stat vial |
| `x_speed` | X Speed | battle | stat vial |
| `verdant_stone` | Verdant Stone | stone | faceted gem |
| `ember_stone` | Ember Stone | stone | faceted gem |
| `tide_stone` | Tide Stone | stone | faceted gem |
| `storm_stone` | Storm Stone | stone | faceted gem |
| `aurora_stone` | Aurora Stone | stone | faceted gem |
| `mendmoss` | Mendmoss | held | berry or charm |
| `focus_charm` | Focus Charm | held | berry or charm |
| `soothe_berry` | Soothe Berry | held | berry or charm |
| `rally_berry` | Rally Berry | held | berry or charm |
| `stillstone` | Stillstone | held | berry or charm |
| `rift_stone` | Rift Stone | held | berry or charm |
| `emberband` | Emberband | held | berry or charm |
| `tideband` | Tideband | held | berry or charm |
| `leafband` | Leafband | held | berry or charm |
| `voltband` | Voltband | held | berry or charm |
| `wyrmband` | Wyrmband | held | berry or charm |
| `town_map` | Town Map | key | key/quest item |
| `old_rod` | Old Rod | key | key/quest item |
| `good_rod` | Good Rod | key | key/quest item |
| `super_rod` | Super Rod | key | key/quest item |
| `old_lamp` | Old Lamp | key | key/quest item |
| `ferry_pass` | Ferry Pass | key | key/quest item |
| `ionar_badge` | Ionar Badge | key | key/quest item |
| `storm_charm` | Storm Charm | key | key/quest item |
| `shrine_key` | Shrine Key | key | key/quest item |
| `fin_fossil` | Fin Fossil | key | key/quest item |
| `tusk_fossil` | Tusk Fossil | key | key/quest item |
| `tm01` | TM01 Storm Bolt | tm | data disc (type-colored) |
| `tm02` | TM02 Fire Lance | tm | data disc (type-colored) |
| `tm03` | TM03 Glacier Ray | tm | data disc (type-colored) |
| `tm04` | TM04 Mind Crush | tm | data disc (type-colored) |
| `tm05` | TM05 Phantom Orb | tm | data disc (type-colored) |
| `tm06` | TM06 Blightbrew | tm | data disc (type-colored) |
| `tm07` | TM07 Earthshatter | tm | data disc (type-colored) |
| `tm08` | TM08 Muscle Flex | tm | data disc (type-colored) |
| `tm09` | TM09 Prism Flare | tm | data disc (type-colored) |
| `tm10` | TM10 Sludge Blast | tm | data disc (type-colored) |
| `tm11` | TM11 Sunblessing | tm | data disc (type-colored) |
| `tm12` | TM12 Stormcall | tm | data disc (type-colored) |
| `tm13` | TM13 Hailstorm | tm | data disc (type-colored) |
| `tm14` | TM14 Duststorm | tm | data disc (type-colored) |
| `tm15` | TM15 Rock Slide | tm | data disc (type-colored) |
| `tm16` | TM16 Gale Blade | tm | data disc (type-colored) |
| `tm17` | TM17 Protect | tm | data disc (type-colored) |
| `tm18` | TM18 Wicked Scheme | tm | data disc (type-colored) |
| `tm19` | TM19 Sap Surge | tm | data disc (type-colored) |
| `tm20` | TM20 Chrome Cannon | tm | data disc (type-colored) |
| `tm21` | TM21 Swift Stars | tm | data disc (type-colored) |
| `tm22` | TM22 Wyrm Pulse | tm | data disc (type-colored) |
| `tm23` | TM23 Dread Pulse | tm | data disc (type-colored) |
| `tm24` | TM24 Verdant Orb | tm | data disc (type-colored) |
| `tm25` | TM25 Body Slam | tm | data disc (type-colored) |
| `hm01` | HM01 Cut | tm | data disc (type-colored) |
| `hm02` | HM02 Fly | tm | data disc (type-colored) |
| `hm03` | HM03 Surf | tm | data disc (type-colored) |
| `hm04` | HM04 Strength | tm | data disc (type-colored) |
| `hm05` | HM05 Flash | tm | data disc (type-colored) |
| `hm06` | HM06 Rock Smash | tm | data disc (type-colored) |
| `hm07` | HM07 Waterfall | tm | data disc (type-colored) |

## 7) MANIFEST
Write `assets/manifest.json` listing every PNG you delivered, e.g.:
```json
{ "files": ["pokemon/front/cindrel.png", "pokemon/back/cindrel.png",
            "chars/player_m_down_0.png", "tiles/grass.png", "ui/type_fire.png"] }
```

## DELIVERY
Drop the PNGs into the folder tree above (relative to the game root). Keep exact
names and sizes. The game will pick them up automatically. Thank you!
