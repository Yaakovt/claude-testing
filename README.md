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

### 1. Install Fabric

1. Download the Fabric installer from <https://fabricmc.net/use/installer/> and run it.
2. Pick game version **26.2**, click **Install**.
3. Download the **Fabric API** mod jar for 26.2 from <https://modrinth.com/mod/fabric-api/versions>
   (pick the newest one marked `26.2`).

### 2. Install this mod

1. Get `aibuilder-1.0.0.jar` (see **Building the mod** below, or download it from this repo's
   GitHub Actions artifacts).
2. Press `Win+R`, type `%APPDATA%\.minecraft\mods`, press Enter.
3. Drop **both** jars in there: `fabric-api-....jar` and `aibuilder-1.0.0.jar`.

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

- No chest loot / command blocks / NBT data (by design, for safety).
- `/undo` history is kept in memory only — it's lost when you quit the world.
- One build at a time per player.
- The builder mob is cosmetic — killing the fun by looking away won't stop the build. 🙂
