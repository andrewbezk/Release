import type { Command } from "./Command.js";
import { Args } from "./Args.js";
import { CommandParser, type ParsedCommand } from "./CommandParser.js";

/** Invoker: resolves a parsed command and executes its registered implementation. */
export class CommandRegistry {
  private readonly commands = new Map<string, Command>();
  private readonly parser: CommandParser;
  constructor(parser = new CommandParser()) { this.parser = parser; }
  register(command: Command): void {
    if (!command.name.trim()) throw new Error("Command name cannot be empty.");
    this.commands.set(command.name, command);
  }
  has(name: string): boolean { return this.commands.has(name); }
  list(): readonly Command[] { return [...this.commands.values()]; }
  parse(line: string): ParsedCommand { return this.parser.parse(line); }
  async execute(line: string): Promise<void> {
    const parsed = this.parse(line);
    if (!parsed.name) return;
    const command = this.commands.get(parsed.name);
    if (!command) { console.log(`Невідома команда: ${parsed.name}`); return; }
    await command.execute(new Args(parsed.args, parsed.options));
  }
  help(): string { return this.list().map(c => `  ${c.name.padEnd(25)} ${c.description}`).join("\n"); }

}
