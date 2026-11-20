import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { CLI } from "../core/CLI.js";
import { CallbackCommandStrategy } from "../core/CommandStrategy.js";
import { LambdaCommand } from "../core/Command.js";
import { TextDocument, TextDocumentMemento, TextDocumentState } from "../text/TextModel.js";
import { Repository } from "../persistence/Repository.js";

function option(args: string[], name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

export async function runText(): Promise<void> {
  const document = new TextDocument();
  const repository = new Repository<TextDocumentState>();
  const io = readline.createInterface({ input, output });
  const cli = new CLI("> ", undefined, io);
  const strategy = new CallbackCommandStrategy("text", commands => {
  const ask = async (question: string) => io.question(question);

  commands.register(new LambdaCommand("pwd", "pwd", () => console.log(document.pwd())));
  commands.register(new LambdaCommand("save", "save [snapshot-name] [file.json]", async args => {
    const name = args[0] ?? "text-state";
    const file = args[1] ?? `${name}.json`;
    // Memento: the document (Originator) creates the snapshot; Repository is the Caretaker.
    await repository.write(name, document.createMemento().toJSON(), file);
    console.log(`Знімок «${name}» збережено у файлі ${file}.`);
  }));
  commands.register(new LambdaCommand("load", "load [snapshot-name] [file.json]", async args => {
    const name = args[0] ?? "text-state";
    const file = args[1] ?? `${name}.json`;
    const state = await repository.read(name, file);
    // Rebuild the opaque Memento from persisted data and ask the Originator to restore itself.
    document.restoreMemento(TextDocumentMemento.fromJSON(state));
    console.log(`Знімок «${name}» завантажено з файлу ${file}.`);
  }));
  commands.register(new LambdaCommand("snapshots", "snapshots — list snapshots loaded in this session", () => {
    const names = repository.listSnapshots();
    console.log(names.length ? names.join("\\n") : "У цьому сеансі немає знімків.");
  }));
  commands.register(new LambdaCommand("print", "print [--whole|--id]", args => document.print(args.includes("--whole"), args.includes("--id"))));
  commands.register(new LambdaCommand("add", "add <container|leaf> <type>", async args => {
    const kind = args[0], type = args[1];
    if (!kind || !type) throw new Error("Використання: add <container|leaf> <type>");
    const id = await ask("Ідентифікатор: ");
    const name = await ask("Назва: ");
    if (kind === "container") document.addContainer(id, name);
    else if (kind === "leaf") document.addLeaf(id, type, name);
    else throw new Error("Тип має бути container або leaf.");
  }));
  commands.register(new LambdaCommand("rm", "rm [<elem_name>]", args => document.remove(args[0])));
  commands.register(new LambdaCommand("up", "up", () => document.up()));
  commands.register(new LambdaCommand("cd", "cd <path>|[--id <container_id>]", args => {
    const id = option(args, "id");
    if (id) {
      const container = document.findContainerById(id);
      if (!container) throw new Error(`Контейнер не знайдено: ${id}`);
      // Navigate by rebuilding the path from the root.
      const names: string[] = []; let current = container;
      while (current.parent) { names.unshift(current.name); current = current.parent; }
      document.cd("/" + names.join("/"));
      return;
    }
    const path = args[0];
    if (!path) throw new Error("Не вказано шлях.");
    document.cd(path);
  }));

  });
  cli.useStrategy(strategy);
  await cli.run("Текстовий режим");
}
