/** Output abstraction used by the CLI facade. */
export interface Renderer { write(message: string): void; error(message: string): void; }
export class ConsoleRenderer implements Renderer {
  write(message: string): void { console.log(message); }
  error(message: string): void { console.error(message); }
}
