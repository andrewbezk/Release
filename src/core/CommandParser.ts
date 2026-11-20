export interface ParsedCommand { name: string; args: string[]; options: Map<string, string | true>; }

/** Parses command lines with quoted values, positional arguments and long/short options. */
export class CommandParser {
  public parse(line: string): ParsedCommand {
    const tokens = this.tokenize(line.trim());
    const name = tokens.shift() ?? "";
    const args: string[] = [];
    const options = new Map<string, string | true>();
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]!;
      if (token.startsWith("--") && token.length > 2) {
        const key = token.slice(2); const next = tokens[i + 1];
        if (next !== undefined && !this.isOption(next)) { options.set(key, next); i++; }
        else options.set(key, true);
      } else if (token.startsWith("-") && token.length > 1) {
        const key = token.slice(1); const next = tokens[i + 1];
        if (next !== undefined && !this.isOption(next)) { options.set(key, next); i++; }
        else options.set(key, true);
      } else args.push(token);
    }
    return { name, args, options };
  }
  private isOption(token: string): boolean { return token.startsWith("-"); }
  private tokenize(line: string): string[] {
    const result: string[] = []; let current = ""; let quote: "'" | '"' | null = null; let escaping = false; let started = false;
    for (const char of line) {
      if (escaping) { current += char; escaping = false; started = true; continue; }
      if (char === "\\" && quote) { escaping = true; continue; }
      if (quote) { if (char === quote) quote = null; else current += char; started = true; continue; }
      if (char === "'" || char === '"') { quote = char; started = true; continue; }
      if (/\s/.test(char)) { if (started) { result.push(current); current = ""; started = false; } continue; }
      current += char; started = true;
    }
    if (quote) throw new Error("Unclosed quotation mark in command.");
    if (escaping) current += "\\";
    if (started) result.push(current);
    return result;
  }
}
