// Behavioral tests for the Sable seams of game.js.
// Run: node tests/sable.test.mjs
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

// --- swingTick (un golpe por 0.4s con el botón 2) ----------------------------

test('swingTick does not swing while the button is released', () => {
  const swing = g.swingTick(false, 1000, 0);
  assert.equal(swing.swing, false);
});

test('swingTick never swings twice inside the 0.4s cooldown', () => {
  const first = g.swingTick(true, 1000, 0);
  assert.equal(first.swing, true);

  const blocked = g.swingTick(true, 1399, first.nextSwingAt);
  assert.equal(blocked.swing, false);

  const ready = g.swingTick(true, 1400, blocked.nextSwingAt);
  assert.equal(ready.swing, true);
  assert.equal(ready.nextSwingAt, 1800);
});

test('swingTick holds exactly one swing per 0.4s while held', () => {
  let nextSwingAt = 0;
  const swings = [];
  for (let t = 0; t <= 1000; t += 10) {
    const swing = g.swingTick(true, t, nextSwingAt);
    nextSwingAt = swing.nextSwingAt;
    if (swing.swing) {
      swings.push(t);
    }
  }
  assert.deepEqual(swings, [0, 400, 800]);
});

// --- inSableArc (el barrido alcanza solo el arco frontal) ---------------------

test('inSableArc catches an español straight ahead inside the swing', () => {
  assert.equal(g.inSableArc(400, 300, 'N', 400, 250), true);
  assert.equal(g.inSableArc(400, 300, 'E', 450, 300), true);
});

test('inSableArc never reaches an español behind the swing', () => {
  assert.equal(g.inSableArc(400, 300, 'N', 400, 350), false);
  assert.equal(g.inSableArc(400, 300, 'E', 350, 300), false);
});

test('inSableArc misses an español flanking to the side', () => {
  assert.equal(g.inSableArc(400, 300, 'N', 450, 300), false);
  assert.equal(g.inSableArc(400, 300, 'S', 400 - 40, 300), false);
});

test('inSableArc keeps the 45° edge of the sweep, inside out, outside in', () => {
  const inAngle = (44 * Math.PI) / 180;
  const outAngle = (46 * Math.PI) / 180;
  assert.equal(
    g.inSableArc(400, 300, 'E', 400 + 50 * Math.cos(inAngle), 300 - 50 * Math.sin(inAngle)),
    true,
  );
  assert.equal(
    g.inSableArc(400, 300, 'E', 400 + 50 * Math.cos(outAngle), 300 - 50 * Math.sin(outAngle)),
    false,
  );
});

test('inSableArc falls short of an español ahead but out of reach', () => {
  assert.equal(g.inSableArc(400, 300, 'N', 400, 239), false);
  assert.equal(g.inSableArc(400, 300, 'N', 400, 240), true);
});

test('inSableArc always catches an español right on top of the swing', () => {
  assert.equal(g.inSableArc(400, 300, 'N', 400, 300), true);
  assert.equal(g.inSableArc(400, 300, 'SW', 400, 300), true);
});

test('inSableArc sweeps with the Patriota through all eight facings', () => {
  const facings = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
  for (const facing of facings) {
    const dir = g.facingVector(facing);
    const ahead = g.inSableArc(400, 300, facing, 400 + dir.x * 45, 300 + dir.y * 45);
    const beside = g.inSableArc(400, 300, facing, 400 - dir.y * 45, 300 + dir.x * 45);
    assert.equal(ahead, true, `${facing} catches ahead`);
    assert.equal(beside, false, `${facing} misses the flank`);
  }
});

// --- summary ------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
