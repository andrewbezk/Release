import type { CommandRegistry } from "./CommandRegistry.js";
/** Strategy for registering a feature-specific command set. */
export interface ICommandStrategy { readonly name: string; registerCommands(registry: CommandRegistry): void; }
export class CallbackCommandStrategy implements ICommandStrategy {
  constructor(readonly name: string, private readonly configure: (registry: CommandRegistry) => void) {}
  registerCommands(registry: CommandRegistry): void { this.configure(registry); }
}
