import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { CLI } from "../core/CLI.js";
import { CallbackCommandStrategy } from "../core/CommandStrategy.js";
import { LambdaCommand } from "../core/Command.js";
import { CharacterService } from "../characters/CharacterService.js";

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
}

export async function runChars(): Promise<void> {
  const service = new CharacterService();
  try {
    const restored = await service.loadLastSession();
    console.log(restored ? "Previous game session restored from last-session.json." : "New session started. Automatic saving is enabled (last-session.json). ");
  } catch (error) {
    console.warn(`Could not restore last session: ${(error as Error).message}`);
  }
  const autosave = async () => service.saveLastSession();
  const io = readline.createInterface({ input, output });
  const cli = new CLI("> ", undefined, io);
  const strategy = new CallbackCommandStrategy("chars", commands => {
    const ask = (question: string) => io.question(question);

    commands.register(new LambdaCommand("create", "create <char|item|ability> — create a local game object", async args => {
      const type = args[0];
      if (!type) throw new Error("Specify object type: char, item or ability.");
      const id = await ask("ID: ");
      const name = await ask("Name: ");
      service.create(type, id.trim(), name.trim());
      await autosave();
      console.log("Object created and saved.");
    }));

    commands.register(new LambdaCommand("load-characters", "load-characters <file.json> — load local characters from JSON", async args => {
      const file = args[0];
      if (!file) throw new Error("Usage: load-characters <file.json>");
      const count = await service.loadCharacters(file);
      await autosave();
      console.log(`Loaded ${count} character(s) from ${file} and saved the session.`);
    }));

    commands.register(new LambdaCommand("save", "save [file.json] — save game state and turn history", async args => {
      const file = args[0] ?? "game-save.json";
      await service.saveGame(file);
      await autosave();
      console.log(`Game saved to ${file} and latest session updated.`);
    }));

    commands.register(new LambdaCommand("load", "load [file.json] — restore game state and turn history", async args => {
      const file = args[0] ?? "game-save.json";
      await service.loadGame(file);
      await autosave();
      console.log(`Game loaded from ${file} and latest session updated.`);
    }));

    commands.register(new LambdaCommand("history", "history — show recorded turns", () => service.printHistory()));
    commands.register(new LambdaCommand("status", "status — show turn number and crew status", () => {
      console.log(`Current turn: ${service.getTurnNumber()}`);
      service.list("char");
    }));

    commands.register(new LambdaCommand("add", "add --char_id <character> --id <ability|item> — assign ability/equipment", async args => {
      const character = option(args, "char_id"), object = option(args, "id");
      if (!character || !object) throw new Error("Usage: add --char_id <character> --id <ability|item>");
      service.add(character, object);
      await autosave();
    }));

    commands.register(new LambdaCommand("act", "act <challenge|recover|ability> <actor> <target> [--id <ability>] — take a turn", async args => {
      const action = args[0], actor = args[1], target = args[2], ability = option(args, "id");
      if (!action || !actor || !target) throw new Error("Usage: act <challenge|recover|ability> <actor> <target> [--id <ability>]");
      service.act(action, actor, target, ability);
      await autosave();
    }));

    commands.register(new LambdaCommand("ls", "ls <char|item|ability> [--id <id|name>] — list game objects", args => {
      const type = args[0];
      if (!type) throw new Error("Specify category: char, item or ability.");
      service.list(type, option(args, "id"));
    }));
  });
  cli.useStrategy(strategy);
  await cli.run("Space Expedition — turn-based game mode (offline/local data)");
}
