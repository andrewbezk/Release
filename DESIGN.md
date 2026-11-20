# Space Expedition — P14 Design Document

## 1. Purpose and scope

Space Expedition is a local TypeScript console game. This P14 version extends the previous project instead of replacing it. The selected assignment variant is the text game; the API/catalog variant is intentionally not used. The game has a crew roster, turn-based actions, character abilities and equipment, a turn history, and save/load support.

## 2. Business rules and game mathematics

### Character parameters

- **Health (HP):** current and maximum health. A character is incapacitated at 0 HP and cannot act or be targeted by a turn action.
- **Armor:** flat damage reduction.
- **Damage / Attack Power:** base damage for a challenge.
- **Resistance:** percentage reduction applied after armor, from 0% to 100%.

### Standard challenge formula

1. Armor mitigation: `mitigated = max(0, actor.attackPower - target.armor)`.
2. Resistance: `damage = floor(mitigated * (1 - target.resist / 100))`.
3. Target health: `target.health = max(0, target.health - damage)`.

Damage is non-negative and cannot reduce health below zero.

### Recovery

Recovery restores 30 HP, capped at the target's maximum HP:

`restored = min(30, target.maxHealth - target.health)`.

### Abilities

- **Medical Support:** restores up to 30 HP to the selected target.
- **Research Boost:** performs an attack with a temporary +10 damage bonus. The bonus applies only to this action and is not permanently added to the character's base damage.

An ability must be assigned to the actor before it can be used.

### Equipment

- **Research Scanner:** permanently increases the equipped character's Attack Power by 15.
- **Protective Suit:** permanently increases Armor by 20.

An item cannot be equipped more than once on the same character. Save restoration does not reapply equipment bonuses.

### Turn system

Each successful `challenge`, `recover`, or `ability` command advances the global turn counter by one and records a turn entry containing timestamp, action, actor, target, and description. Failed commands do not consume a turn. The CLI is command-driven: the user selects the actor for each action; there is no automatic alternating player/AI initiative in this version.

## 3. Character classes

| Class | HP | Armor | Damage | Resist |
|---|---:|---:|---:|---:|
| SpaceExplorer | 100 | 15 | 25 | 5% |
| MissionEngineer | 110 | 25 | 20 | 10% |

Loaded JSON characters can override their initial stats.

## 4. Architecture

| Component | Responsibility |
|---|---|
| `Character` | Encapsulates stats, damage, healing, attack calculation, ability/item assignment |
| `SpaceCrew` | Concrete character classes, abilities, equipment |
| `ActionStrategies` | Strategy implementations for challenge, recovery and ability actions |
| `CharacterService` | Domain orchestration, roster and object lookup, validation, turns, history, local JSON import, save/load |
| `CharsMode` | CLI presentation and command-to-service mapping; contains no game rules |
| `GameSnapshot` | Serializable versioned state for persistence |
| `FileExplorerApp` and states | Existing file explorer mode retained from prior work |
| `TextDocument` and `Repository` | Existing structured text mode and Memento-based persistence retained |

## 5. Design patterns

- **Strategy:** interchangeable action algorithms implement `ActionStrategy`.
- **Command:** user commands are represented through the existing command interface and registry.
- **Facade:** `CLI` keeps the interactive loop and parsing details behind a simple interface.
- **State:** file explorer states control allowed operations and transitions.
- **Memento / Repository:** structured text snapshots remain managed by the previous mode's persistence implementation.
- **Separation of concerns:** command handlers delegate to `CharacterService`; domain rules live in domain classes and action strategies.

## 6. Persistence and local character loading

`load-characters <file.json>` reads a local JSON roster. The file can contain an array directly or an object with a `characters` array. Records contain an ID, name, class, and optional stats. No remote API is called.

`save [filename]` stores a versioned JSON snapshot of the roster, current character stats, assigned abilities/equipment, turn number, and turn history. `load [filename]` reconstructs the game. Default file: `game-save.json`.

## 7. Example session

```text
load-characters characters.json
create ability
ID: medical-01
Name: Medical Support
create ability
ID: research-01
Name: Research Boost
create item
ID: scanner-01
Name: Research Scanner
add --char_id explorer-01 --id research-01
add --char_id explorer-01 --id scanner-01
act challenge explorer-01 engineer-01
act ability explorer-01 engineer-01 --id research-01
act recover engineer-01 explorer-01
status
history
save campaign.json
```

## 8. Scope limitations

The project is a local text game prototype. It has no external API, network dependency, graphics, automatic AI opponent, or multiplayer. The user manually chooses an actor and target for each action.


## P15 — Persistent latest game session

The `chars` game mode uses JSON persistence for the latest session. On startup, `CharacterService.loadLastSession()` attempts to restore `last-session.json`; if the file does not exist, the service writes an initial snapshot and starts a new game. The mode automatically writes the snapshot after mutations (creating objects, importing characters, assigning abilities/items, actions, and manual save/load).

The snapshot stores a version number, turn counter, crew members and their current stats, each character's assigned abilities and equipment, the full ability/item catalogs (including unassigned objects), and turn history with timestamps. Equipment is restored without re-applying its stat bonus because the saved character stats already include that bonus. Version 1 manual saves remain loadable; version 2 snapshots include the complete object catalogs.

The automatic file is `last-session.json` in the working directory. Manual named saves remain supported through `save [file.json]` and `load [file.json]`.


## P16 — GUI Layer

The desktop GUI is implemented with Electron. The renderer is HTML/CSS/JavaScript and communicates with the main process through a restricted preload bridge (context isolation enabled; Node integration disabled). IPC handlers call the existing `CharacterService`; the GUI does not duplicate character, combat, equipment, or persistence rules.

The window includes a mission log, crew roster and statistics, action form, equipment/ability catalog and assignment controls, character JSON import, save/load controls, Continue, and confirmed New Mission. The existing CLI modes are retained. Manual JSON saves are placed in `saves/`; the latest session continues to use `last-session.json`. Mutating operations trigger automatic session persistence.
