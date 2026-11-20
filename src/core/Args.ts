/** Immutable, convenient view over positional arguments and command options. */
export class Args {
  constructor(readonly positional: readonly string[], readonly options: ReadonlyMap<string, string | true> = new Map()) {}
  get(index: number): string | undefined { return this.positional[index]; }
  getOption(name: string): string | undefined { const value = this.options.get(name); return typeof value === 'string' ? value : undefined; }
  hasOption(name: string): boolean { return this.options.has(name); }
  all(): string[] { return [...this.positional]; }
  toLegacyArray(): string[] { const result = [...this.positional]; for (const [key, value] of this.options) result.push(`--${key}`, String(value)); return result; }
}
