import type { FileExplorerApp } from "./FileExplorerApp.js";
export interface FileExplorerState { readonly name: string; handle(app: FileExplorerApp, command: string, args: string[]): Promise<void>; render(app: FileExplorerApp): Promise<string[]>; }
