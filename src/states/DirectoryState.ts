import type { FileExplorerApp } from "./FileExplorerApp.js";
import type { FileExplorerState } from "./FileExplorerState.js";
export class DirectoryState implements FileExplorerState {
  readonly name = "Directory";
  async handle(app: FileExplorerApp, command: string, args: string[]): Promise<void> {
    switch(command) {
      case "ls": case "dir": await app.refresh(); break;
      case "cd": if (!args[0]) throw new Error("Usage: cd <directory>"); await app.files.changeDirectory(args.join(" ")); await app.refresh(); break;
      case "open": if (!args[0]) throw new Error("Usage: open <file>"); await app.openFile(args.join(" ")); break;
      case "help": app.showHelp(); break;
      case "exit": app.stop(); break;
      default: throw new Error(`Unknown command in Directory mode: ${command}. Type help.`);
    }
  }
  async render(app: FileExplorerApp): Promise<string[]> {
    const entries = await app.files.list();
    return entries.map(e => `${e.isDirectory ? "[DIR] " : "[FILE]"} ${e.name}`);
  }
}
