import type { Ability, Character } from "./Character.js";

export interface ActionStrategy {
  execute(actor: Character, target: Character, ability?: Ability): string;
}

export class ChallengeStrategy implements ActionStrategy {
  execute(actor: Character, target: Character): string {
    const damage = actor.attack(target);
    return `${actor.getName()} challenged ${target.getName()} and dealt ${damage} damage.`;
  }
}

export class RecoveryStrategy implements ActionStrategy {
  execute(actor: Character, target: Character): string {
    const restored = target.heal(30);
    return `${actor.getName()} assisted ${target.getName()} and restored ${restored} HP.`;
  }
}

export class AbilityStrategy implements ActionStrategy {
  execute(actor: Character, target: Character, ability?: Ability): string {
    if (!ability) throw new Error("Ability not found or not assigned to the actor.");
    return ability.use(actor, target);
  }
}
