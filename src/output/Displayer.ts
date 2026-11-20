/** Output port keeps presentation replaceable (console, file, tests, GUI). */
export interface Displayer {
  display(message: string): void;
}
export class ConsoleDisplayer implements Displayer {
  display(message: string): void { console.log(message); }
}
