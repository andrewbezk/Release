import type { FileExplorerApp } from "./FileExplorerApp.js";
import type { FileExplorerState } from "./FileExplorerState.js";
export class EditState implements FileExplorerState {
  readonly name = "Edit";
  async handle(app: FileExplorerApp, command: string, args: string[]): Promise<void> {
    const text = args.join(" ");
    switch(command) {
      case "append": app.editLines.push(text); break;
      case "set": {
        const index = Number(args[0]); if (!Number.isInteger(index) || index < 1 || args.length < 2) throw new Error("Usage: set <line-number> <text>");
        if (index > app.editLines.length) throw new Error("Line number is out of range.");
        app.editLines[index-1] = args.slice(1).join(" "); break;
      }
      case "delete": {
        const index = Number(args[0]); if (!Number.isInteger(index) || index < 1 || index > app.editLines.length) throw new Error("Usage: delete <line-number>");
        app.editLines.splice(index-1, 1); break;
      }
      case "save": await app.saveEdit(); break;
      case "cancel": app.cancelEdit(); break;
      case "help": app.showHelp(); break;
      default: throw new Error(`Unknown command in Edit mode: ${command}. Type help.`);
    }
  }
  async render(app: FileExplorerApp): Promise<string[]> { return app.editLines.map((line,i)=>`${String(i+1).padStart(4)} │ ${line}`); }
}
