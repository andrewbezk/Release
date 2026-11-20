import type { FileExplorerApp } from "./FileExplorerApp.js";
import type { FileExplorerState } from "./FileExplorerState.js";
export class FileViewState implements FileExplorerState {
  readonly name = "File View";
  async handle(app: FileExplorerApp, command: string, args: string[]): Promise<void> {
    switch(command) {
      case "show": case "view": app.showFilePage(1); break;
      case "page": app.showFilePage(Number(args[0] ?? 1)); break;
      case "edit": app.enterEdit(); break;
      case "close": app.closeFile(); break;
      case "help": app.showHelp(); break;
      default: throw new Error(`Unknown command in File View mode: ${command}. Type help.`);
    }
  }
  async render(app: FileExplorerApp): Promise<string[]> { const start=(app.currentPage-1)*app.pageSize; return app.fileLines.slice(start, start+app.pageSize).map((line,i)=>`${start+i+1}: ${line}`); }
}
