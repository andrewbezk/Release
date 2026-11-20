import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { ICommandStrategy } from "./CommandStrategy.js";
import { CommandRegistry } from "./CommandRegistry.js";
import type { Renderer } from "../output/Renderer.js";
import { ConsoleRenderer } from "../output/Renderer.js";

/** Facade: owns the interactive loop, help/exit handling, command execution and output errors. */
export class CLI {
  readonly registry = new CommandRegistry();
  private running = false;
  constructor(private readonly prompt = "> ", private readonly renderer: Renderer = new ConsoleRenderer(), private readonly io = readline.createInterface({ input, output })) {}
  useStrategy(strategy: ICommandStrategy): void { strategy.registerCommands(this.registry); }
  async run(title: string): Promise<void> {
    this.running = true; this.renderer.write(`${title}. Type help or exit.`);
    while (this.running) {
      let line: string;
      try { line = await this.io.question(this.prompt); } catch { break; }
      const inputLine = line.trim();
      if (!inputLine) continue;
      if (inputLine === "exit" || inputLine === "quit") { this.running = false; continue; }
      if (inputLine === "help") { this.renderer.write(this.registry.help() || "No commands registered."); continue; }
      try { await this.registry.execute(inputLine); }
      catch (error) { this.renderer.error(`Error: ${error instanceof Error ? error.message : String(error)}`); }
    }
    this.io.close();
  }
}
