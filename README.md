# Space Expedition — P14 Business Logic

A TypeScript console application extended from the previous practical project. P14 uses the **offline text-game variant**: all game data is local; there is no API integration or network dependency.

## Requirements

- Node.js 18+.
- Install dependencies, compile, and run:

```bash
npm install
npm run build
npm start -- --chars
```

For development:

```bash
npm run dev -- --chars
```

The existing `files` and `text` modes are retained:

```bash
npm start -- --files
npm start -- --text
```

## Game mode (`chars`)

Commands:

| Command | Description |
|---|---|
| `help` | List commands |
| `create char\|item\|ability` | Create a local game object interactively |
| `load-characters <file.json>` | Load character definitions from a local JSON file |
| `ls char\|item\|ability [--id <id-or-name>]` | List/find objects |
| `add --char_id <character> --id <ability-or-item>` | Assign an ability or equip an item |
| `act challenge <actor> <target>` | Perform a standard attack/challenge; consumes a turn |
| `act recover <actor> <target>` | Restore up to 30 HP to target; consumes a turn |
| `act ability <actor> <target> --id <ability>` | Use an assigned ability; consumes a turn |
| `status` | Show turn counter and crew health/statistics |
| `history` | Show recorded actions |
| `save [file.json]` | Save roster, stats, assignments, turn counter and history; also refresh the automatic latest-session file |
| `load [file.json]` | Restore a saved game and update the automatic latest-session file |
| `exit` | Leave game mode |

The default manual save filename is `game-save.json`.

### Automatic session persistence (P15)

The game mode automatically restores the most recent session from `last-session.json` when it starts. If no such file exists, a new session is created and the file is initialized. The session is automatically saved after every state-changing operation: creating game objects, importing characters, assigning abilities/equipment, and performing actions. It stores the crew and their current stats, abilities, items/equipment, the object catalogs, turn number, and action history. This means the game can be closed and reopened without losing progress; the `save` and `load` commands remain available for named/manual save files.

### Quick start example

```text
> load-characters characters.json
> ls char
> create ability
ID: medical-01
Name: Medical Support
> create ability
ID: research-01
Name: Research Boost
> create item
ID: scanner-01
Name: Research Scanner
> add --char_id explorer-01 --id research-01
> add --char_id explorer-01 --id scanner-01
> act challenge explorer-01 engineer-01
> act ability explorer-01 engineer-01 --id research-01
> act recover engineer-01 explorer-01
> status
> history
> save campaign.json
```

### Character JSON format

`characters.json` is included as a starter roster. Character data can be an array or an object with a `characters` array. Each record has `id`, `name`, `class` (`explorer` or `engineer`), and optional `stats`:

```json
{
  "characters": [
    {
      "id": "custom-01",
      "name": "Rhea",
      "class": "engineer",
      "stats": {
        "health": 110,
        "armor": 25,
        "attackPower": 20,
        "resist": 10
      }
    }
  ]
}
```

If stats are omitted, class defaults are used. `health`/`hp`, `attackPower`/`damage` aliases are accepted.

## Existing modes retained

- `files` — state-based file explorer (Directory, File View, Edit).
- `text` — structured text tree editor with JSON snapshots.

## Tests/build

```bash
npm run build
npm test
```

The application uses only local files for the game mode. No API key or internet access is required.


## P16 — Desktop GUI (Electron)

A desktop GUI is available for the Space Expedition game mode. It provides a mission log, crew roster and status cards, action controls, item/ability catalog, assignment controls, JSON import, and save/load controls. The GUI uses the existing `CharacterService` domain logic and the P15 JSON persistence mechanism; the CLI modes remain available.

### Run the desktop application

```bash
npm install
npm run desktop
```

On Windows, you can also double-click `RUN_GUI.bat`. It installs dependencies if Electron is not present, then builds and opens the app.

`npm run desktop` builds the TypeScript project and opens the Electron window. `npm run desktop-dev` opens the desktop app without rebuilding (run `npm run build` first).

Manual saves are stored in `saves/` as JSON files. The most recent session is automatically stored in `last-session.json` in the project folder.

## Desktop distribution (P17)

The desktop GUI can be packaged for Windows as a portable executable (no installer required):

1. Install Node.js 22 LTS or newer.
2. Run `PACKAGE_WINDOWS.bat` from this project folder, or run `npm install` and `npm run package:win`.
3. The portable executable is written to `release/`.
4. Copy the generated `Space-Expedition-1.1.0-Portable.exe` to another Windows computer and launch it directly.

The packaged application stores autosaves and named save files in Electron's per-user application data directory, not inside the executable. The app does not require an internet connection while running.
