import { readFile, writeFile } from "node:fs/promises";
import { Character, Ability, Item } from "./Character.js";
import { SpaceExplorer, MissionEngineer, MedicalSupport, ResearchBoost, Scanner, ProtectiveSuit } from "./SpaceCrew.js";
import { AbilityStrategy, ChallengeStrategy, RecoveryStrategy, type ActionStrategy } from "./ActionStrategies.js";

export interface GameTurn {
  turn: number;
  timestamp: string;
  action: string;
  actorId: string;
  actorName: string;
  targetId: string;
  targetName: string;
  description: string;
}

interface AbilitySnapshot { kind: "medical" | "research"; id: string; name: string; }
interface ItemSnapshot { kind: "scanner" | "suit"; id: string; name: string; }
interface CharacterSnapshot {
  id: string; name: string; className: "SpaceExplorer" | "MissionEngineer";
  health: number; maxHealth: number; armor: number; attackPower: number; resist: number;
  abilities: AbilitySnapshot[]; items: ItemSnapshot[];
}
export interface GameSnapshot { version: 2; turnNumber: number; characters: CharacterSnapshot[]; abilities: AbilitySnapshot[]; items: ItemSnapshot[]; history: GameTurn[]; }

export class CharacterService {
  private chars = new Map<string, Character>();
  private abilities = new Map<string, Ability>();
  private items = new Map<string, Item>();
  private history: GameTurn[] = [];
  private turnNumber = 0;
  private readonly actions = new Map<string, ActionStrategy>([
    ["challenge", new ChallengeStrategy()], ["attack", new ChallengeStrategy()],
    ["recover", new RecoveryStrategy()], ["heal", new RecoveryStrategy()],
    ["ability", new AbilityStrategy()]
  ]);

  create(type: string, id: string, name: string): void {
    this.ensureUniqueId(id);
    if (type === "char" || type === "engineer" || type === "explorer") {
      const isEngineer = type === "engineer" || (type === "char" && name.toLowerCase().includes("engineer"));
      const character = isEngineer ? new MissionEngineer(id, name) : new SpaceExplorer(id, name);
      this.chars.set(id, character); return;
    }
    if (type === "ability") {
      const ability = (name.toLowerCase().includes("research") || name.toLowerCase().includes("analysis"))
        ? new ResearchBoost(id, name) : new MedicalSupport(id, name);
      this.abilities.set(id, ability); return;
    }
    if (type === "item") {
      const item = (name.toLowerCase().includes("suit") || name.toLowerCase().includes("protection") || name.toLowerCase().includes("armor"))
        ? new ProtectiveSuit(id, name) : new Scanner(id, name);
      this.items.set(id, item); return;
    }
    throw new Error("Type must be char, explorer, engineer, item or ability.");
  }

  private ensureUniqueId(id: string): void {
    if (!id.trim()) throw new Error("ID must not be empty.");
    if (this.chars.has(id) || this.abilities.has(id) || this.items.has(id)) throw new Error(`ID already exists: ${id}`);
  }

  getCharacters(): Character[] { return [...this.chars.values()]; }
  getItems(): Item[] { return [...this.items.values()]; }
  getAbilities(): Ability[] { return [...this.abilities.values()]; }
  getHistory(): GameTurn[] { return this.history.map(turn => ({ ...turn })); }
  getTurnNumber(): number { return this.turnNumber; }

  findChar(ref: string): Character | undefined { return this.chars.get(ref) || [...this.chars.values()].find(c => c.getName() === ref); }
  findAbility(ref: string): Ability | undefined { return this.abilities.get(ref) || [...this.abilities.values()].find(a => a.getName() === ref); }
  findItem(ref: string): Item | undefined { return this.items.get(ref) || [...this.items.values()].find(i => i.getName() === ref); }

  add(charRef: string, objRef: string): void {
    const character = this.findChar(charRef);
    if (!character) throw new Error(`Character not found: ${charRef}`);
    const ability = this.findAbility(objRef);
    if (ability) {
      if (character.getAbility(ability.getId())) throw new Error(`${character.getName()} already has this ability.`);
      character.addAbility(ability);
      console.log(`Ability "${ability.getName()}" assigned to ${character.getName()}.`);
      return;
    }
    const item = this.findItem(objRef);
    if (item) {
      if (character.getItems().some(existing => existing.getId() === item.getId())) throw new Error(`${character.getName()} already has this item equipped.`);
      character.addItem(item); item.equip(character);
      console.log(`${character.getName()} equipped ${item.getName()}.`);
      return;
    }
    throw new Error("Ability or item not found.");
  }

  act(action: string, actorRef: string, targetRef: string, abilityRef?: string): GameTurn {
    const actor = this.findChar(actorRef), target = this.findChar(targetRef);
    if (!actor || !target) throw new Error("Actor or target not found.");
    if (!actor.isAlive()) throw new Error(`${actor.getName()} is incapacitated and cannot act.`);
    if (!target.isAlive()) throw new Error(`${target.getName()} is incapacitated and cannot be targeted.`);
    const strategy = this.actions.get(action);
    if (!strategy) throw new Error("Action must be challenge, recover or ability.");
    const ability = action === "ability" ? actor.getAbility(abilityRef ?? "") : undefined;
    if (action === "ability" && !ability) throw new Error("The selected ability is not assigned to the actor.");

    const description = strategy.execute(actor, target, ability);
    const turn: GameTurn = {
      turn: ++this.turnNumber, timestamp: new Date().toISOString(), action,
      actorId: actor.getId(), actorName: actor.getName(), targetId: target.getId(), targetName: target.getName(), description
    };
    this.history.push(turn);
    console.log(`Turn ${turn.turn}: ${description}`);
    return { ...turn };
  }

  list(type: string, ref?: string): void {
    if (type === "char") {
      const character = ref ? this.findChar(ref) : undefined;
      if (ref && !character) throw new Error(`Character not found: ${ref}`);
      (character ? [character] : this.getCharacters()).forEach(c => console.log(c.getStats()));
      return;
    }
    if (type === "ability") {
      const ability = ref ? this.findAbility(ref) : undefined;
      if (ref && !ability) throw new Error(`Ability not found: ${ref}`);
      (ability ? [ability] : this.getAbilities()).forEach(a => console.log(`${a.getId()}: ${a.getName()} | users: ${a.getUsers().join(", ")}`));
      return;
    }
    if (type === "item") {
      const item = ref ? this.findItem(ref) : undefined;
      if (ref && !item) throw new Error(`Item not found: ${ref}`);
      (item ? [item] : this.getItems()).forEach(i => console.log(`${i.getId()}: ${i.getName()} | users: ${i.getUsers().join(", ")}`));
      return;
    }
    throw new Error("Category must be char, item or ability.");
  }

  /** Import locally defined characters from JSON; no network/API dependency. */
  async loadCharacters(filePath: string): Promise<number> {
    const raw: unknown = JSON.parse(await readFile(filePath, "utf8"));
    const entries = Array.isArray(raw) ? raw : (raw && typeof raw === "object" && "characters" in raw ? (raw as { characters: unknown }).characters : [raw]);
    if (!Array.isArray(entries)) throw new Error("Character file must contain an array or a characters array.");
    let loaded = 0;
    for (const entry of entries) {
      if (!entry || typeof entry !== "object") throw new Error("Invalid character record in file.");
      const record = entry as Record<string, unknown>;
      const id = String(record.id ?? "");
      const name = String(record.name ?? "");
      const className = String(record.class ?? record.type ?? "explorer").toLowerCase();
      this.ensureUniqueId(id);
      const character = className.includes("engineer") ? new MissionEngineer(id, name) : new SpaceExplorer(id, name);
      const stats = record.stats && typeof record.stats === "object" ? record.stats as Record<string, unknown> : record;
      character.restoreStats({
        health: Number(stats.currentHealth ?? stats.health ?? stats.hp ?? character.getHealth()),
        maxHealth: Number(stats.maxHealth ?? stats.health ?? stats.hp ?? character.getMaxHealth()),
        armor: Number(stats.armor ?? character.getArmor()),
        attackPower: Number(stats.attackPower ?? stats.damage ?? character.getAttackPower()),
        resist: Number(stats.resist ?? character.getResist())
      });
      this.chars.set(id, character); loaded++;
    }
    return loaded;
  }

  toSnapshot(): GameSnapshot {
    return {
      version: 2,
      turnNumber: this.turnNumber,
      history: this.getHistory(),
      abilities: [...this.abilities.values()].map(a => ({ kind: a instanceof ResearchBoost ? "research" : "medical", id: a.getId(), name: a.getName() })),
      items: [...this.items.values()].map(i => ({ kind: i instanceof ProtectiveSuit ? "suit" : "scanner", id: i.getId(), name: i.getName() })),
      characters: this.getCharacters().map(character => ({
        id: character.getId(), name: character.getName(),
        className: character instanceof MissionEngineer ? "MissionEngineer" : "SpaceExplorer",
        health: character.getHealth(), maxHealth: character.getMaxHealth(), armor: character.getArmor(),
        attackPower: character.getAttackPower(), resist: character.getResist(),
        abilities: character.getAbilities().map(a => ({ kind: a instanceof ResearchBoost ? "research" : "medical", id: a.getId(), name: a.getName() })),
        items: character.getItems().map(i => ({ kind: i instanceof ProtectiveSuit ? "suit" : "scanner", id: i.getId(), name: i.getName() }))
      }))
    };
  }

  async saveGame(filePath = "game-save.json"): Promise<void> { await writeFile(filePath, JSON.stringify(this.toSnapshot(), null, 2), "utf8"); }

  /** Automatically restore the latest session, or create an initial save if none exists. */
  async loadLastSession(filePath = "last-session.json"): Promise<boolean> {
    try {
      await this.loadGame(filePath);
      return true;
    } catch (error) {
      if ((error as { code?: string }).code === "ENOENT") {
        await this.saveGame(filePath);
        return false;
      }
      throw error;
    }
  }

  async saveLastSession(filePath = "last-session.json"): Promise<void> { await this.saveGame(filePath); }

  async loadGame(filePath = "game-save.json"): Promise<void> {
    const snapshot = JSON.parse(await readFile(filePath, "utf8")) as GameSnapshot;
    if (![1, 2].includes(snapshot.version) || !Array.isArray(snapshot.characters) || !Array.isArray(snapshot.history)) throw new Error("Invalid or unsupported save file.");
    const newChars = new Map<string, Character>(), newAbilities = new Map<string, Ability>(), newItems = new Map<string, Item>();
    // Version 2 stores the complete catalog, including objects not assigned to a character.
    for (const a of (snapshot.version === 2 ? snapshot.abilities ?? [] : [])) {
      const ability = a.kind === "research" ? new ResearchBoost(a.id, a.name) : new MedicalSupport(a.id, a.name);
      newAbilities.set(a.id, ability);
    }
    for (const i of (snapshot.version === 2 ? snapshot.items ?? [] : [])) {
      const item = i.kind === "suit" ? new ProtectiveSuit(i.id, i.name) : new Scanner(i.id, i.name);
      newItems.set(i.id, item);
    }
    for (const data of snapshot.characters) {
      const character = data.className === "MissionEngineer" ? new MissionEngineer(data.id, data.name) : new SpaceExplorer(data.id, data.name);
      character.restoreStats({ health: data.health, maxHealth: data.maxHealth, armor: data.armor, attackPower: data.attackPower, resist: data.resist });
      for (const a of data.abilities ?? []) {
        let ability = newAbilities.get(a.id);
        if (!ability) { ability = a.kind === "research" ? new ResearchBoost(a.id, a.name) : new MedicalSupport(a.id, a.name); newAbilities.set(a.id, ability); }
        character.addAbility(ability);
      }
      for (const i of data.items ?? []) {
        let item = newItems.get(i.id);
        if (!item) { item = i.kind === "suit" ? new ProtectiveSuit(i.id, i.name) : new Scanner(i.id, i.name); newItems.set(i.id, item); }
        character.addItem(item);
      }
      if (newChars.has(data.id)) throw new Error(`Duplicate character ID in save: ${data.id}`);
      newChars.set(data.id, character);
    }
    this.chars = newChars; this.abilities = newAbilities; this.items = newItems;
    this.history = snapshot.history.map(turn => ({ ...turn }));
    this.turnNumber = Math.max(snapshot.turnNumber ?? 0, this.history.length);
  }

  printHistory(): void {
    if (!this.history.length) { console.log("No turns have been recorded yet."); return; }
    this.history.forEach(turn => console.log(`#${turn.turn} [${turn.action}] ${turn.description} (${turn.timestamp})`));
  }
}
