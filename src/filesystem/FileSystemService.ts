import { readdir, stat, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface DirectoryEntry { name: string; isDirectory: boolean; isFile: boolean; }
export class FileSystemService {
  private currentDirectory = process.cwd();
  get cwd(): string { return this.currentDirectory; }
  async list(directory = this.currentDirectory): Promise<DirectoryEntry[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries.map(entry => ({ name: entry.name, isDirectory: entry.isDirectory(), isFile: entry.isFile() }))
      .sort((a,b) => Number(b.isDirectory)-Number(a.isDirectory) || a.name.localeCompare(b.name));
  }
  async changeDirectory(target: string): Promise<void> {
    const resolved = path.resolve(this.currentDirectory, target);
    const metadata = await stat(resolved);
    if (!metadata.isDirectory()) throw new Error(`Not a directory: ${resolved}`);
    this.currentDirectory = resolved;
  }
  resolve(target: string): string { return path.resolve(this.currentDirectory, target); }
  async readFile(target: string): Promise<string> {
    const resolved = this.resolve(target); const metadata = await stat(resolved);
    if (!metadata.isFile()) throw new Error(`Not a file: ${resolved}`);
    return readFile(resolved, "utf8");
  }
  async writeFile(target: string, content: string): Promise<void> {
    const resolved = this.resolve(target); const metadata = await stat(resolved);
    if (!metadata.isFile()) throw new Error(`Not a file: ${resolved}`);
    await writeFile(resolved, content, "utf8");
  }
}
