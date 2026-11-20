/** Visitor operations are kept outside the document elements, so new traversals
 * (export, validation, statistics, etc.) do not have to enlarge the element classes. */
export interface TextVisitor {
  visitContainer(container: Container, showId: boolean): string;
  visitLeaf(leaf: Leaf, showId: boolean): string;
}

export abstract class TextElement {
  constructor(public readonly id: string, public name: string) {}
  abstract accept(visitor: TextVisitor, showId: boolean): string;
  render(showId: boolean): string { return this.accept(new TextRenderVisitor(), showId); }
}

export class Container extends TextElement {
  public readonly children: TextElement[] = [];
  constructor(id: string, name: string, public parent: Container | null = null) { super(id, name); }
  add(element: TextElement): void { if (element instanceof Container) element.parent = this; this.children.push(element); }
  remove(element: TextElement): void { const index = this.children.indexOf(element); if (index >= 0) this.children.splice(index, 1); }
  accept(visitor: TextVisitor, showId: boolean): string { return visitor.visitContainer(this, showId); }
}

export class Leaf extends TextElement {
  constructor(id: string, name: string, public readonly type: string) { super(id, name); }
  accept(visitor: TextVisitor, showId: boolean): string { return visitor.visitLeaf(this, showId); }
}

/** Concrete Visitor reproduces the document's existing textual representation. */
export class TextRenderVisitor implements TextVisitor {
  visitContainer(container: Container, showId: boolean): string {
    const prefix = showId ? `[${container.id}] ` : "";
    return `${prefix}/${container.name}/` + container.children.map(child => `\n${child.accept(this, showId)}`).join("");
  }
  visitLeaf(leaf: Leaf, showId: boolean): string {
    return `${showId ? `[${leaf.id}] ` : ""}${leaf.type}: ${leaf.name}`;
  }
}

/** Memento stores an opaque snapshot. The caretaker can persist it, but only the
 * originator-facing restore operation interprets its private state. */
export class TextDocumentMemento {
  constructor(private readonly state: TextDocumentState) {}
  toJSON(): TextDocumentState { return structuredClone(this.state); }
  restoreInto(document: TextDocument): void { document.importState(this.state); }
  static fromJSON(state: TextDocumentState): TextDocumentMemento { return new TextDocumentMemento(structuredClone(state)); }
}

export class TextDocument {
  public readonly root = new Container("root", "root");
  private current: Container = this.root;
  pwd(): string { const parts: string[] = []; let current: Container | null = this.current; while (current) { if (current !== this.root) parts.unshift(current.name); current = current.parent; } return "/" + parts.join("/"); }
  getCurrent(): Container { return this.current; }
  cd(path: string): void {
    if (path === "/") { this.current = this.root; return; }
    const parts = path.split("/").filter(Boolean); let container = this.root;
    for (const part of parts) { const next = container.children.find(x => x instanceof Container && x.name === part) as Container | undefined; if (!next) throw new Error(`Шлях не знайдено: ${path}`); container = next; }
    this.current = container;
  }
  up(): void { if (this.current.parent) this.current = this.current.parent; }
  addContainer(id: string, name: string): void { this.current.add(new Container(id, name)); }
  addLeaf(id: string, type: string, name: string): void { this.current.add(new Leaf(id, name, type)); }
  findContainerById(id: string): Container | undefined {
    if (this.root.id === id) return this.root;
    const stack: Container[] = [this.root];
    while (stack.length) { const container = stack.pop()!; for (const child of container.children) if (child instanceof Container) { if (child.id === id) return child; stack.push(child); } }
    return undefined;
  }
  remove(name?: string): void {
    if (name) { const element = this.current.children.find(x => x.name === name); if (!element) throw new Error("Елемент не знайдено"); this.current.remove(element); }
    else if (this.current.parent) { const parent = this.current.parent; parent.remove(this.current); this.current = parent; }
  }
  /** Originator creates its own Memento, keeping snapshot details encapsulated. */
  createMemento(): TextDocumentMemento { return new TextDocumentMemento(this.exportState()); }
  restoreMemento(memento: TextDocumentMemento): void { memento.restoreInto(this); }
  exportState(): TextDocumentState {
    const encode = (element: TextElement): TextNodeState => ({ id: element.id, name: element.name, kind: element instanceof Container ? "container" : "leaf", ...(element instanceof Leaf ? { type: element.type } : {}), children: element instanceof Container ? element.children.map(encode) : [] });
    return { root: encode(this.root), currentPath: this.pwd() };
  }
  importState(state: TextDocumentState): void {
    const decode = (node: TextNodeState, parent: Container | null = null): TextElement => {
      if (node.kind === "leaf") return new Leaf(node.id, node.name, node.type ?? "text");
      const container = new Container(node.id, node.name, parent); for (const child of node.children ?? []) container.add(decode(child, container)); return container;
    };
    const restored = decode(state.root) as Container;
    this.root.children.splice(0, this.root.children.length); for (const child of restored.children) this.root.add(child);
    this.current = this.root; if (state.currentPath && state.currentPath !== "/") this.cd(state.currentPath);
  }
  print(whole: boolean, id: boolean): void {
    const visitor = new TextRenderVisitor();
    console.log((whole ? this.root : this.current).accept(visitor, id));
  }
}

export interface TextNodeState { id: string; name: string; kind: "container" | "leaf"; type?: string; children: TextNodeState[]; }
export interface TextDocumentState { root: TextNodeState; currentPath: string; }
