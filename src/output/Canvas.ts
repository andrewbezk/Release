/** Console canvas: builds a stable text frame independently from terminal I/O. */
export class Canvas {
  constructor(private readonly width = 80) {}
  render(title: string, lines: string[], footer = ""):
    string {
    const border = "─".repeat(Math.max(10, this.width - 2));
    const fit = (value: string) => value.length > this.width - 4 ? value.slice(0, this.width - 7) + "..." : value;
    return [`┌${border}┐`, `│ ${fit(title).padEnd(this.width - 4)} │`, `├${border}┤`, ...lines.map(line => `│ ${fit(line).padEnd(this.width - 4)} │`), `├${border}┤`, `│ ${fit(footer).padEnd(this.width - 4)} │`, `└${border}┘`].join("\n");
  }
}
