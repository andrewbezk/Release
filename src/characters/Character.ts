/** Base domain entity for expedition crew members. */
export abstract class Character {
  private health: number;
  private maxHealth: number;
  private armor: number;
  private attackPower: number;
  private resist: number;
  private readonly abilities = new Map<string, Ability>();
  private readonly items = new Map<string, Item>();

  public constructor(
    private readonly id: string,
    private readonly name: string,
    health: number,
    armor: number,
    attackPower: number,
    resist = 0
  ) {
    if (!id.trim() || !name.trim()) throw new Error("Character ID and name must not be empty.");
    if (health <= 0 || armor < 0 || attackPower < 0 || resist < 0 || resist > 100) {
      throw new Error("Invalid character stats: health must be positive; other stats must be non-negative and resist <= 100.");
    }
    this.health = health;
    this.maxHealth = health;
    this.armor = armor;
    this.attackPower = attackPower;
    this.resist = resist;
  }

  public getId(): string { return this.id; }
  public getName(): string { return this.name; }
  public getHealth(): number { return this.health; }
  public getMaxHealth(): number { return this.maxHealth; }
  public getArmor(): number { return this.armor; }
  public getAttackPower(): number { return this.attackPower; }
  public getResist(): number { return this.resist; }
  public isAlive(): boolean { return this.health > 0; }

  public getStats(): string {
    return `${this.id}: ${this.name} | HP ${this.health}/${this.maxHealth} | Armor ${this.armor} | Damage ${this.attackPower} | Resist ${this.resist}%`;
  }

  public takeDamage(amount: number): number {
    const actual = Math.max(0, Math.floor(amount));
    const before = this.health;
    this.health = Math.max(0, this.health - actual);
    return before - this.health;
  }

  public heal(amount: number): number {
    const actual = Math.max(0, Math.floor(amount));
    const before = this.health;
    this.health = Math.min(this.maxHealth, this.health + actual);
    return this.health - before;
  }

  public increaseAttack(amount: number): void { this.attackPower += amount; }
  public increaseArmor(amount: number): void { this.armor += amount; }
  public addAbility(a: Ability): void { this.abilities.set(a.getId(), a); }
  public addItem(i: Item): void { this.items.set(i.getId(), i); }
  public getAbility(id: string): Ability | undefined { return this.abilities.get(id); }
  public getAbilities(): Ability[] { return [...this.abilities.values()]; }
  public getItems(): Item[] { return [...this.items.values()]; }

  /** Physical challenge damage: (base damage - armor) reduced by target resistance. */
  public attack(target: Character, bonus = 0): number {
    const mitigated = Math.max(0, this.attackPower + bonus - target.armor);
    const finalDamage = Math.floor(mitigated * (1 - target.resist / 100));
    return target.takeDamage(finalDamage);
  }

  /** Used only when restoring a saved game; does not re-apply equipment bonuses. */
  public restoreStats(stats: { health: number; maxHealth?: number; armor: number; attackPower: number; resist?: number }): void {
    this.maxHealth = Math.max(1, stats.maxHealth ?? this.maxHealth);
    this.health = Math.max(0, Math.min(this.maxHealth, stats.health));
    this.armor = Math.max(0, stats.armor);
    this.attackPower = Math.max(0, stats.attackPower);
    this.resist = Math.max(0, Math.min(100, stats.resist ?? this.resist));
  }
}

export interface Ability {
  getId(): string;
  getName(): string;
  use(actor: Character, target: Character): string;
  getUsers(): string[];
}

export interface Item {
  getId(): string;
  getName(): string;
  equip(character: Character): void;
  getUsers(): string[];
}
