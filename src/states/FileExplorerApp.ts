import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import path from "node:path";
import { CommandParser } from "../core/CommandParser.js";
import { Canvas } from "../output/Canvas.js";
import { FileSystemService } from "../filesystem/FileSystemService.js";
import { DirectoryState } from "./DirectoryState.js";
import { FileViewState } from "./FileViewState.js";
import { EditState } from "./EditState.js";
import type { FileExplorerState } from "./FileExplorerState.js";

export class FileExplorerApp {
  readonly files = new FileSystemService();
  readonly canvas = new Canvas();
  readonly pageSize = 20;
  state: FileExplorerState = new DirectoryState();
  running = true;
  openedFile: string | undefined = undefined;
  fileLines: string[] = [];
  editLines: string[] = [];
  private page = 1;
  private readonly parser = new CommandParser();
  constructor(private readonly io = readline.createInterface({input, output})) {}
  async refresh(): Promise<void> { this.draw(await this.state.render(this)); }
  draw(lines: string[]): void { console.log(this.canvas.render(`${this.state.name} | ${this.files.cwd}${this.openedFile ? ` | ${path.basename(this.openedFile)}` : ""}`, lines, "help | exit")); }
  async openFile(name: string): Promise<void> { this.openedFile = this.files.resolve(name); this.fileLines = (await this.files.readFile(name)).split(/\r?\n/); this.page=1; this.state=new FileViewState(); await this.showFilePage(1); }
  get currentPage(): number { return this.page; }
  async showFilePage(page: number): Promise<void> {
    const total = Math.max(1, Math.ceil(this.fileLines.length/this.pageSize)); if (!Number.isFinite(page) || page < 1 || page > total) throw new Error(`Page must be between 1 and ${total}`);
    this.page=page; const start=(page-1)*this.pageSize; const lines=this.fileLines.slice(start,start+this.pageSize).map((line,i)=>`${start+i+1}: ${line}`);
    this.draw([...lines, `Page ${page}/${total}`]);
  }
  enterEdit(): void { this.editLines=[...this.fileLines]; this.state=new EditState(); this.draw(this.editLines.map((line,i)=>`${i+1}: ${line}`)); }
  async saveEdit(): Promise<void> { if (!this.openedFile) throw new Error("No file opened"); await this.files.writeFile(this.openedFile, this.editLines.join("\n")); this.fileLines=[...this.editLines]; this.state=new FileViewState(); await this.showFilePage(this.page); console.log("File saved."); }
  cancelEdit(): void { this.state=new FileViewState(); this.editLines=[]; console.log("Editing cancelled; changes discarded."); }
  closeFile(): void { this.openedFile=undefined; this.fileLines=[]; this.editLines=[]; this.state=new DirectoryState(); console.log("File closed."); }
  stop(): void { this.running=false; }
  showHelp(): void {
    const common="Commands: help, exit";
    const text=this.state.name==="Directory" ? "Directory: ls | cd <directory> | open <file> | exit" : this.state.name==="File View" ? "File View: show | page <number> | edit | close" : "Edit: append <text> | set <line> <text> | delete <line> | save | cancel";
    console.log(`${common}\n${text}`);
  }
  async run(): Promise<void> {
    console.log("File Explorer — one-process stateful console application. Type help.");
    await this.refresh();
    for await (const line of this.io) {
      if(!this.running) break;
      console.log(`${this.state.name}>`);
      const parsed=this.parser.parse(line);
      if(!parsed.name) continue;
      try { await this.state.handle(this, parsed.name, parsed.args); if(this.running && parsed.name!=="help") await this.refresh(); }
      catch(error){ console.error(`Error: ${(error as Error).message}`); }
    }
    this.running=false;
    this.io.close();
  }
}
