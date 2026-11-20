import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { runChars } from "./modes/CharsMode.js";
import { runText } from "./modes/TextMode.js";
import { FileExplorerApp } from "./states/FileExplorerApp.js";

async function main(): Promise<void> {
  const args=process.argv.slice(2);
  if(args.includes("--chars")){ await runChars(); return; }
  if(args.includes("--text")){ await runText(); return; }
  if(args.includes("--files") || args.length===0){ await new FileExplorerApp().run(); return; }
  const io=readline.createInterface({input,output});
  const mode=await io.question("Select mode (files/chars/text): "); io.close();
  if(mode.trim()==="files") await new FileExplorerApp().run();
  else if(mode.trim()==="chars") await runChars();
  else if(mode.trim()==="text") await runText();
  else console.log("Unknown mode.");
}
main().catch(error=>{ console.error(error); process.exitCode=1; });