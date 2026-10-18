// Behavioral tests for the Piedra seams of game.js.
// Run: node tests/piedra.test.mjs
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

const PIEDRA_STEP = 1500;
const PIEDRA_MARGIN = 24;

// --- piedraGaugeTick (una Piedra lista por cada 1500 puntos) ------------------

test('piedraGaugeTick awards nothing without enough new score', () => {
  const first = g.piedraGaugeTick(0, 0, 900);
  assert.equal(first.bank, 0);
  assert.equal(first.granted, false);
  assert.equal(first.progress, 900);
});

test('piedraGaugeTick grants a charge on the 1500th point', () => {
  const first = g.piedraGaugeTick(0, 0, 900);
  const second = g.piedraGaugeTick(first.bank, first.progress, 600);
  assert.equal(second.bank, 1);
  assert.equal(second.granted, true);
});

test('piedraGaugeTick carries the leftover score into the next gauge', () => {
  const tick = g.piedraGaugeTick(0, PIEDRA_STEP - 200, 500);
  assert.equal(tick.bank, 1);
  assert.equal(tick.progress, 300, 'the 200 over the step carries over');
});

test('piedraGaugeTick caps the bank at one charge', () => {
  const tick = g.piedraGaugeTick(1, 0, PIEDRA_STEP);
  assert.equal(tick.bank, 1);
  assert.equal(tick.granted, false);
});

test('piedraGaugeTick loses the score that overflows a capped bank', () => {
  const tick = g.piedraGaugeTick(1, 0, PIEDRA_STEP * 3);
  assert.equal(tick.bank, 1, 'never stores more than one charge');
  assert.equal(tick.progress, 0, 'overflow does not carry past the cap');
  assert.equal(tick.granted, false);
});

test('piedraGaugeTick keeps filling from where it was after the throw', () => {
  const ready = g.piedraGaugeTick(0, 0, 700);
  // El Patriota lanza: su lanzamiento vacía el banco, no el medidor.
  const refill = g.piedraGaugeTick(0, ready.progress, 800);
  assert.equal(refill.bank, 1);
  assert.equal(refill.granted, true);
});

test('piedraGaugeTick ignores a shrinking score', () => {
  const tick = g.piedraGaugeTick(0, 750, -1);
  assert.equal(tick.progress, 750);
  assert.equal(tick.bank, 0);
  assert.equal(tick.granted, false);
});

test('piedraGaugeTick does not lose credit while the bank is empty across a long run', () => {
  let bank = 0;
  let progress = 0;
  const grants = [];
  for (let score = 100; score <= 6000; score += 100) {
    const tick = g.piedraGaugeTick(bank, progress, 100);
    bank = tick.bank;
    progress = tick.progress;
    if (tick.granted) {
      grants.push(score);
      bank = 0; // el Patriota la lanza en cuanto está lista
    }
  }
  assert.deepEqual(grants, [1500, 3000, 4500, 6000], 'one charge per 1500');
});

// --- piedraCanThrow (un solo proyectil, una sola Piedra lista) ----------------

test('piedraCanThrow requires a stored charge', () => {
  assert.equal(g.piedraCanThrow(0, 0), false);
  assert.equal(g.piedraCanThrow(1, 0), true);
});

test('piedraCanThrow refuses while a Piedra is already in flight', () => {
  assert.equal(g.piedraCanThrow(1, 1), false);
});

// --- piedraOutOfBounds (la roca abandona la pantalla entera) ------------------

test('piedraOutOfBounds keeps the boulder while it is on screen', () => {
  assert.equal(g.piedraOutOfBounds(400, 300), false);
  assert.equal(g.piedraOutOfBounds(800 + PIEDRA_MARGIN - 1, 300), false);
  assert.equal(g.piedraOutOfBounds(-PIEDRA_MARGIN + 1, 300), false);
  assert.equal(g.piedraOutOfBounds(400, 600 + PIEDRA_MARGIN - 1), false);
});

test('piedraOutOfBounds culls the boulder once it leaves the screen', () => {
  assert.equal(g.piedraOutOfBounds(800 + PIEDRA_MARGIN + 1, 300), true);
  assert.equal(g.piedraOutOfBounds(-PIEDRA_MARGIN - 1, 300), true);
  assert.equal(g.piedraOutOfBounds(400, 600 + PIEDRA_MARGIN + 1), true);
  assert.equal(g.piedraOutOfBounds(400, -PIEDRA_MARGIN - 1), true);
});

// --- summary ------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
