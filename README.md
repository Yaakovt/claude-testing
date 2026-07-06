# AI Builder — a Minecraft mod that builds anything you ask for

Type `/build a cozy medieval house with a working redstone piston door` in chat, and a little
builder mob flies down and constructs it in front of you, block by block. Regular builds,
redstone contraptions, whatever you can describe — the design is done by Claude AI, using the
Claude subscription you already have (no API key needed).

- **Minecraft:** Java Edition **26.2** with the **Fabric** loader
- **Commands:** `/build <anything>`, `/undo`, `/buildcancel`
- **AI:** your locally installed [Claude Code](https://claude.com/claude-code) app (Pro/Max
  subscription), or optionally a direct Anthropic API key

---

## Installation (Windows)

### 1. Install Fabric (one-time, ~30 seconds)

Minecraft can't load mods on its own, so this one small step is unavoidable:

1. Download the Fabric installer from <https://fabricmc.net/use/installer/> and run it.
2. Pick game version **26.2**, click **Install**. Done.

### 2. Install this mod — just one file

The Fabric API is bundled inside the mod, so there is only ONE jar to install:

1. Get `aibuilder-1.0.0.jar` (from this repo's GitHub Actions artifacts, or see
   **Building the mod** below).
2. Press `Win+R`, type `%APPDATA%\.minecraft\mods`, press Enter.
3. Drop `aibuilder-1.0.0.jar` in there. That's the whole install.

### 3. Install Claude Code (the AI brain)

1. Install Claude Code for Windows — instructions at <https://claude.com/claude-code>
   (PowerShell: `irm https://claude.ai/install.ps1 | iex`).
2. Open a terminal (`Win+R` → `cmd`), run `claude`, and sign in with your Claude account once.
3. That's it. The mod runs Claude Code in the background whenever you `/build`.

### 4. Play

Start Minecraft with the **fabric-loader-26.2** profile, open a singleplayer world
(**cheats need to be ON** — for an existing world, use *Open to LAN → Allow Cheats: ON*), and try:

```
/build a small stone hut with a torch inside
/build a 10 block tall wizard tower with a spiral staircase
/build a hidden 2x2 piston door in a hillside, opened by a lever
```

A builder mob appears and gets to work. Designs take **1–3 minutes of AI thinking** before
building starts — the chat tells you what's happening.

| Command | What it does |
|---|---|
| `/build <description>` | Designs and builds it in front of you (facing you) |
| `/buildcancel` | Stops the current design/build |
| `/undo` | Reverts your last build (up to 3, configurable) |
| `/buildset model <name>` | Switch AI model without leaving the game, e.g. `/buildset model sonnet` (or `default`) |
| `/buildset timeout <seconds>` | Change how long to wait for a design, e.g. `/buildset timeout 600` |
| `/buildset speed <n>` | Blocks placed per tick, e.g. `/buildset speed 5` (higher = faster building) |
| `/buildstatus` | Show the current model, timeout, and speed |
| `/buildsave <name>` | Save the build you just made under a name |
| `/buildmake <name>` | Rebuild a saved design in front of you — no AI, no tokens, instant |
| `/buildlist` | List your saved builds |
| `/buildideas` | Get suggestions for what to build |
| `/buildadd <text>` | Add a chunk to a long description (chat limits one command to 256 chars) |
| `/buildgo` | Build the description you assembled with `/buildadd` |
| `/buildclear` | Discard the assembled description |

**Long descriptions:** Minecraft caps a single chat command at 256 characters. For a detailed build,
use `/buildadd` several times to pile up the description, then `/buildgo`:
```
/buildadd a two-story oak and cobblestone house with a peaked roof
/buildadd inside: a bed, a chest of food and tools, 2 furnaces, a crafting table
/buildadd out back, a fenced garden with flowers and a small pond
/buildgo
```

Settings changed with `/buildset` are saved and take effect on your next `/build` — no restart needed.

**Saving & replaying builds:** after any build finishes, the mod tells you its token cost and offers
`/buildsave <name>`. Once saved, `/buildmake <name>` rebuilds that exact design wherever you're standing
— it replays the stored plan, so it's instant and costs zero AI tokens. Great for builds you want to place
more than once (a house design, a working redstone door, etc.). Saved builds persist in
`config/aibuilder_builds.json`.

---

## Configuration

After the first launch, edit `%APPDATA%\.minecraft\config\aibuilder.json`:

| Option | Default | Meaning |
|---|---|---|
| `backend` | `"claude-cli"` | `"claude-cli"` = use Claude Code + your subscription. `"api"` = use an Anthropic API key directly |
| `claudePath` | `""` | Full path to `claude.exe` if the mod can't find it on its own |
| `cliModel` | `""` | Model for Claude Code (empty = your account default) |
| `apiKey` | `""` | Anthropic API key, only for `backend: "api"` (env var `ANTHROPIC_API_KEY` also works) |
| `apiModel` | `"claude-opus-4-8"` | Model for the API backend |
| `timeoutSeconds` | `300` | How long to wait for a design |
| `maxSize` / `maxVolume` / `maxOps` | `64` / `100000` / `4000` | Build size limits |
| `blocksPerTick` | `3` | Build speed once the mob is in position (higher = faster) |
| `builderSpeed` | `0.9` | How fast the mob flies (blocks per tick) |
| `builderMob` | `"minecraft:allay"` | Which mob does the building (try `"minecraft:bee"`...) |
| `builderName` | `"Claude the Builder"` | The mob's name tag |
| `undoHistory` | `3` | How many builds `/undo` remembers (per session; cleared when you quit) |
| `fiveHourTokenBudget` | `250000` | Estimated Claude tokens per 5-hour window, for the usage warning (0 = off) |
| `usageWarnPercent` | `75` | Warn in chat when builds have used this % of the budget (0 = off) |

### About the usage warning

When your builds have consumed ~75% of `fiveHourTokenBudget` within the last 5 hours, the mod
warns you in chat so you don't hit your Claude plan's limit mid-build. One honest caveat:
Claude doesn't let apps read your plan's real usage meter, so the mod counts only its own
token usage. If you also use Claude Code/claude.ai heavily outside Minecraft, the real meter
fills faster than the mod can see. Check the real numbers anytime by typing `/usage` inside
Claude Code, and tune `fiveHourTokenBudget` to match your plan.

---

## Building the mod from source

You don't need anything installed except a JDK — Gradle downloads itself.

```
gradlew build          (Windows)
./gradlew build        (Mac/Linux)
```

Requires **Java (JDK) 25** — get it from <https://adoptium.net> if `gradlew build` complains.
The finished jar lands in `build/libs/aibuilder-1.0.0.jar`.

Alternatively, every push to GitHub builds the jar automatically (see the **Actions** tab →
latest run → **Artifacts** → `ai-builder-mod`).

---

## Troubleshooting

- **"Couldn't find the Claude Code app"** — open a terminal and check that `claude --version`
  works. If you installed it somewhere unusual, set `claudePath` in the config to the full path
  of `claude.exe`. After installing Claude Code, restart Minecraft (it needs a fresh PATH).
- **"Claude Code isn't logged in"** — run `claude` in a terminal and sign in once.
- **"Build failed: The AI took longer than 300s"** — big/complex requests take a while; ask for
  something smaller or raise `timeoutSeconds`.
- **"The plan touches ~N blocks (limit ...)"** — the AI designed something huge; ask for a
  smaller build or raise `maxVolume` in the config.
- **`/build` says "Unknown command"** — cheats are off in that world. Open to LAN with cheats
  ON, or on a server give yourself op (`/op <name>`).
- **The redstone doesn't quite work** — AI redstone is good but not infallible. `/undo` and try
  re-phrasing ("a SIMPLE piston door" helps), or ask for the same build again — each design is fresh.

## Limitations

- Every vanilla block is available (including command/structure blocks), and the AI can stock
  containers (chests, barrels, furnaces, etc.) with items. Raw NBT in block strings is still not
  supported — container contents use a dedicated, safer mechanism instead.
- `/undo` history is kept in memory only — it's lost when you quit the world.
- One build at a time per player.
- The builder mob is cosmetic — killing the fun by looking away won't stop the build. 🙂
