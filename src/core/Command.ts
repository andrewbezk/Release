import { Args } from "./Args.js";
export type CommandHandler = (args: string[]) => Promise<void> | void;
/** Command pattern: each command has a uniform execute contract. */
export interface Command {
  readonly name: string;
  readonly description: string;
  execute(args: Args): Promise<void> | void;
}
/** ConcreteCommand adapter retains compatibility with existing handlers using string arrays. */
export class LambdaCommand implements Command {
  public constructor(public readonly name: string, public readonly description: string, private readonly handler: CommandHandler) {}
  public execute(args: Args): Promise<void> | void { return this.handler(args.toLegacyArray()); }
}
