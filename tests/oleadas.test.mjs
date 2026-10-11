// Behavioral tests for the oleadas / puntuacion seams of game.js.
// Run: node tests/oleadas.test.mjs
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const g = loadGame();

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`ok   - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL - ${name}`);
    console.error(`       ${error.message}`);
  }
}

// --- oleadaSize (los españoles por oleada crecen con N) ------------------

test('oleadaSize starts small on oleada 1', () => {
  assert.equal(g.oleadaSize(1), 4);
});

test('oleadaSize grows as the oleadas advance', () => {
  assert.ok(g.oleadaSize(5) > g.oleadaSize(4), 'grows with N');
  assert.equal(g.oleadaSize(5), 8);
});

test('oleadaSize caps so late oleadas stay readable', () => {
  assert.equal(g.oleadaSize(50), g.oleadaSize(100));
  assert.ok(g.oleadaSize(100) <= 20, 'cap around 20');
});

// --- oleadaSpawnSpeed (la velocidad de aparición se acerca a 1.5x y se topa) --

test('oleadaSpawnSpeed is baseline on oleada 1', () => {
  assert.equal(g.oleadaSpawnSpeed(1), 1);
});

test('oleadaSpawnSpeed climbs with the oleada number', () => {
  assert.ok(g.oleadaSpawnSpeed(4) > g.oleadaSpawnSpeed(2), 'grows with N');
});

test('oleadaSpawnSpeed caps around 1.5x no matter how late the oleada', () => {
  assert.ok(Math.abs(g.oleadaSpawnSpeed(999) - 1.5) < 1e-9, 'caps at 1.5x');
});

// --- oleadaSpawnInterval (el intervalo entre españoles se acorta con N) --------

test('oleadaSpawnInterval is slowest on oleada 1', () => {
  assert.ok(
    g.oleadaSpawnInterval(1) > g.oleadaSpawnInterval(2),
    'baseline is the slowest interval',
  );
});

test('oleadaSpawnInterval shortens as the oleadas advance', () => {
  assert.ok(g.oleadaSpawnInterval(6) < g.oleadaSpawnInterval(3), 'shrinks with N');
});

test('oleadaSpawnInterval never drops below the 1.5x cap', () => {
  assert.ok(
    g.oleadaSpawnInterval(999) >= g.oleadaSpawnInterval(1) / 1.5 - 1,
    'floors at baseline/1.5 (within rounding)',
  );
});

// --- oleadaBonus (limpiar una oleada premia 50 x N) -------------------------

test('oleadaBonus awards 50 points for oleada 1', () => {
  assert.equal(g.oleadaBonus(1), 50);
});

test('oleadaBonus scales linearly with the oleada number', () => {
  assert.equal(g.oleadaBonus(7), 350);
  assert.equal(g.oleadaBonus(20), 1000);
});

test('oleadaBonus is zero or negative for non-positive oleadas', () => {
  assert.equal(g.oleadaBonus(0), 0);
  assert.equal(g.oleadaBonus(-3), 0);
});

// --- summary ------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}

