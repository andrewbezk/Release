declare module "node:process" { export const stdin: NodeJS.ReadableStream; export const stdout: NodeJS.WritableStream; }
declare module "node:readline/promises" { interface Interface { question(prompt?: string): Promise<string>; close(): void; [Symbol.asyncIterator](): AsyncIterator<string>; } export function createInterface(options: {input: NodeJS.ReadableStream; output: NodeJS.WritableStream}): Interface; }
declare namespace NodeJS { interface ReadableStream {} interface WritableStream {} }
declare const process: { argv: string[]; cwd(): string; exitCode?: number; exit(code?: number): never; };

declare module "node:fs/promises" {
  export function writeFile(path: string, data: string, encoding: string): Promise<void>;
  export function readdir(path: string, options: { withFileTypes: true }): Promise<{ name: string; isDirectory(): boolean; isFile(): boolean }[]>;
  export function stat(path: string): Promise<{ isDirectory(): boolean; isFile(): boolean }>;
  export function readFile(path: string, encoding: string): Promise<string>;
}

declare module "node:path" { const path: { resolve(...parts: string[]): string; basename(path: string): string; join(...parts: string[]): string }; export default path; }
