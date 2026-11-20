import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CharacterService } from '../dist/characters/CharacterService.js';

test('challenge uses armor and resistance and records a turn', () => {
  const game = new CharacterService();
  game.create('char', 'explorer', 'Explorer');
  game.create('char', 'engineer', 'Engineer');
  const turn = game.act('challenge', 'engineer', 'explorer');
  assert.equal(turn.turn, 1);
  // Engineer: 20 damage - Explorer armor 15 = 5; 5% resistance => floor(4.75) = 4.
  assert.equal(game.findChar('explorer').getHealth(), 96);
  assert.equal(game.getHistory().length, 1);
});

test('recovery is capped at max health and research boost is temporary', () => {
  const game = new CharacterService();
  game.create('char', 'e', 'Explorer');
  game.create('char', 'm', 'Mission Engineer');
  game.create('ability', 'med', 'Medical Support');
  game.create('ability', 'boost', 'Research Boost');
  game.add('e', 'med');
  game.add('e', 'boost');
  game.act('challenge', 'm', 'e');
  const damagedHealth = game.findChar('e').getHealth();
  game.act('ability', 'e', 'e', 'med');
  assert.equal(game.findChar('e').getHealth(), Math.min(100, damagedHealth + 30));
  const before = game.findChar('e').getAttackPower();
  game.act('ability', 'e', 'm', 'boost');
  assert.equal(game.findChar('e').getAttackPower(), before);
});

test('save/load restores roster, stats, assignments, turn counter and history', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'space-expedition-'));
  const file = join(dir, 'save.json');
  try {
    const game = new CharacterService();
    game.create('char', 'e', 'Explorer');
    game.create('char', 'm', 'Mission Engineer');
    game.create('ability', 'research', 'Research Boost');
    game.create('item', 'scanner', 'Research Scanner');
    game.add('e', 'research');
    game.add('e', 'scanner');
    game.act('challenge', 'e', 'm');
    await game.saveGame(file);
    const restored = new CharacterService();
    await restored.loadGame(file);
    assert.equal(restored.getTurnNumber(), 1);
    assert.equal(restored.getHistory().length, 1);
    assert.equal(restored.findChar('e').getAttackPower(), 40);
    assert.equal(restored.findChar('e').getAbilities().length, 1);
    assert.equal(restored.findChar('e').getItems().length, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('local JSON character loader supports a characters collection', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'space-expedition-'));
  const file = join(dir, 'crew.json');
  try {
    await writeFile(file, JSON.stringify({ characters: [{ id: 'custom', name: 'Custom', class: 'engineer', stats: { health: 80, armor: 12, damage: 17, resist: 3 } }] }));
    const game = new CharacterService();
    assert.equal(await game.loadCharacters(file), 1);
    assert.equal(game.findChar('custom').getHealth(), 80);
    assert.equal(game.findChar('custom').getAttackPower(), 17);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('GUI can explicitly create both crew classes', () => {
  const game = new CharacterService();
  game.create('explorer', 'x', 'Nova');
  game.create('engineer', 'y', 'Mira');
  assert.equal(game.findChar('x').getArmor(), 15);
  assert.equal(game.findChar('y').getArmor(), 25);
});
