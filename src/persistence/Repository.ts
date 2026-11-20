import { readFile, writeFile } from "node:fs/promises";

/** Small persistence boundary; storage can be replaced without changing domain code. */
export interface StateStorage<T> {
  save(state: T, filePath: string): Promise<void>;
  load(filePath: string): Promise<T>;
}

export class JsonFileStorage<T> implements StateStorage<T> {
  async save(state: T, filePath: string): Promise<void> {
    await writeFile(filePath, JSON.stringify(state, null, 2), "utf8");
  }
  async load(filePath: string): Promise<T> {
    return JSON.parse(await readFile(filePath, "utf8")) as T;
  }
}

/** Repository keeps named snapshots and delegates file I/O to StateStorage. */
export class Repository<T> {
  private readonly snapshots = new Map<string, T>();
  constructor(private readonly storage: StateStorage<T> = new JsonFileStorage<T>()) {}
  saveSnapshot(name: string, state: T): void {
    if (!name.trim()) throw new Error("Назва знімка не може бути порожньою.");
    this.snapshots.set(name, structuredClone(state));
  }
  getSnapshot(name: string): T | undefined {
    const value = this.snapshots.get(name);
    return value === undefined ? undefined : structuredClone(value);
  }
  listSnapshots(): string[] { return [...this.snapshots.keys()]; }
  async write(name: string, state: T, filePath = `${name}.json`): Promise<void> {
    this.saveSnapshot(name, state);
    await this.storage.save(state, filePath);
  }
  async read(name: string, filePath = `${name}.json`): Promise<T> {
    const state = await this.storage.load(filePath);
    this.saveSnapshot(name, state);
    return state;
  }
}
