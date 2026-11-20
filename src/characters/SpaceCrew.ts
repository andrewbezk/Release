import { Character, Ability, Item } from "./Character.js";

/** General-purpose expedition specialist. */
export class SpaceExplorer extends Character {
  public constructor(id: string, name: string) { super(id, name, 100, 15, 25, 5); }
}

/** Engineer: higher armor, lower base damage. */
export class MissionEngineer extends Character {
  public constructor(id: string, name: string) { super(id, name, 110, 25, 20, 10); }
}

/** Restores up to 30 HP, never exceeding maximum health. */
export class MedicalSupport implements Ability {
  public constructor(private readonly id: string, private readonly name = "Medical Support") {}
  getId() { return this.id; }
  getName() { return this.name; }
  getUsers() { return ["SpaceExplorer", "MissionEngineer"]; }
  use(actor: Character, target: Character): string {
    const restored = target.heal(30);
    return `${actor.getName()} used ${this.name} on ${target.getName()} and restored ${restored} HP.`;
  }
}

/** Research boost adds +10 damage to this action only. */
export class ResearchBoost implements Ability {
  public constructor(private readonly id: string, private readonly name = "Research Boost") {}
  getId() { return this.id; }
  getName() { return this.name; }
  getUsers() { return ["SpaceExplorer", "MissionEngineer"]; }
  use(actor: Character, target: Character): string {
    const damage = actor.attack(target, 10);
    return `${actor.getName()} used ${this.name} against ${target.getName()} (+10 damage bonus); ${damage} damage dealt.`;
  }
}

/** Scanner permanently increases attack power by 15 when equipped. */
export class Scanner implements Item {
  public constructor(private readonly id: string, private readonly name = "Research Scanner") {}
  getId() { return this.id; }
  getName() { return this.name; }
  getUsers() { return ["SpaceExplorer", "MissionEngineer"]; }
  equip(character: Character) { character.increaseAttack(15); }
}

/** Protective suit permanently increases armor by 20 when equipped. */
export class ProtectiveSuit implements Item {
  public constructor(private readonly id: string, private readonly name = "Protective Suit") {}
  getId() { return this.id; }
  getName() { return this.name; }
  getUsers() { return ["SpaceExplorer", "MissionEngineer"]; }
  equip(character: Character) { character.increaseArmor(20); }
}
