// Behavioral tests for the Patriota orientation & fire seams of game.js.
// Run: node tests/patriota.test.mjs
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

function approx(actual, expected, label) {
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `${label}: expected ${expected}, got ${actual}`,
  );
}

// --- facingFromVector (8 directions from the joystick) ------------------------

const ALL_FACINGS = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];

test('facingFromVector reports no change when the joystick is centred', () => {
  assert.equal(g.facingFromVector({ x: 0, y: 0 }), null);
});

test('facingFromVector maps the four cardinal move vectors', () => {
  assert.equal(g.facingFromVector({ x: 1, y: 0 }), 'E');
  assert.equal(g.facingFromVector({ x: -1, y: 0 }), 'W');
  assert.equal(g.facingFromVector({ x: 0, y: -1 }), 'N');
  assert.equal(g.facingFromVector({ x: 0, y: 1 }), 'S');
});

test('facingFromVector maps the four diagonal move vectors', () => {
  const d = Math.SQRT1_2;
  assert.equal(g.facingFromVector({ x: d, y: -d }), 'NE');
  assert.equal(g.facingFromVector({ x: -d, y: -d }), 'NW');
  assert.equal(g.facingFromVector({ x: d, y: d }), 'SE');
  assert.equal(g.facingFromVector({ x: -d, y: d }), 'SW');
});

test('facingFromVector covers all eight directions exactly once', () => {
  const d = Math.SQRT1_2;
  const vectors = [
    { x: 1, y: 0 },
    { x: d, y: d },
    { x: 0, y: 1 },
    { x: -d, y: d },
    { x: -1, y: 0 },
    { x: -d, y: -d },
    { x: 0, y: -1 },
    { x: d, y: -d },
  ];
  const found = vectors.map((v) => g.facingFromVector(v));
  assert.deepEqual([...found].sort(), [...ALL_FACINGS].sort());
});

// --- nextFacing (faces the last direction moved) -----------------------------

test('nextFacing keeps the current facing when nothing moves', () => {
  assert.equal(g.nextFacing('E', { x: 0, y: 0 }), 'E');
  assert.equal(g.nextFacing('SW', { x: 0, y: 0 }), 'SW');
});

test('nextFacing adopts the last direction moved', () => {
  assert.equal(g.nextFacing('E', { x: 0, y: -1 }), 'N');
  assert.equal(g.nextFacing('N', { x: -1, y: 0 }), 'W');
});

test('nextFacing walks a full rotation through all eight directions', () => {
  const d = Math.SQRT1_2;
  const path = [
    { x: 0, y: -1 },
    { x: d, y: -d },
    { x: 1, y: 0 },
    { x: d, y: d },
    { x: 0, y: 1 },
    { x: -d, y: d },
    { x: -1, y: 0 },
    { x: -d, y: -d },
  ];
  let facing = 'N';
  const seen = [facing];
  for (const vector of path) {
    facing = g.nextFacing(facing, vector);
    seen.push(facing);
  }
  assert.deepEqual(seen, ['N', 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']);
});

test('nextFacing holds the facing while standing still between moves', () => {
  let facing = g.nextFacing('N', { x: 1, y: 0 });
  facing = g.nextFacing(facing, { x: 0, y: 0 });
  facing = g.nextFacing(facing, { x: 0, y: 0 });
  assert.equal(facing, 'E');
});

// --- facingRotation / facingVector (aim of the shot) -------------------------

test('facingRotation angles match the eight directions on screen', () => {
  approx(g.facingRotation('E'), 0, 'E');
  approx(g.facingRotation('SE'), Math.PI / 4, 'SE');
  approx(g.facingRotation('S'), Math.PI / 2, 'S');
  approx(g.facingRotation('SW'), (3 * Math.PI) / 4, 'SW');
  approx(g.facingRotation('W'), Math.PI, 'W');
  approx(g.facingRotation('NW'), (-3 * Math.PI) / 4, 'NW');
  approx(g.facingRotation('N'), -Math.PI / 2, 'N');
  approx(g.facingRotation('NE'), -Math.PI / 4, 'NE');
});

test('facingRotation falls back to east for an unknown facing', () => {
  approx(g.facingRotation('nope'), 0, 'unknown');
  approx(g.facingRotation(undefined), 0, 'undefined');
});

test('facingVector points exactly along the facing', () => {
  const cases = [
    ['E', 1, 0],
    ['W', -1, 0],
    ['N', 0, -1],
    ['S', 0, 1],
    ['SE', Math.SQRT1_2, Math.SQRT1_2],
    ['SW', -Math.SQRT1_2, Math.SQRT1_2],
    ['NE', Math.SQRT1_2, -Math.SQRT1_2],
    ['NW', -Math.SQRT1_2, -Math.SQRT1_2],
  ];
  for (const [facing, x, y] of cases) {
    const vector = g.facingVector(facing);
    approx(vector.x, x, `${facing}.x`);
    approx(vector.y, y, `${facing}.y`);
  }
});

test('facingVector always has unit length so bullets share one speed', () => {
  for (const facing of ALL_FACINGS) {
    const v = g.facingVector(facing);
    approx(Math.hypot(v.x, v.y), 1, `${facing} magnitude`);
  }
});

test('facingVector agrees with facingRotation', () => {
  for (const facing of ALL_FACINGS) {
    const r = g.facingRotation(facing);
    const v = g.facingVector(facing);
    approx(v.x, Math.cos(r), `${facing}.x`);
    approx(v.y, Math.sin(r), `${facing}.y`);
  }
});

test('the shot leaves the Patriota in the facing held while standing still', () => {
  let facing = 'N';
  facing = g.nextFacing(facing, { x: 1, y: 0 });
  facing = g.nextFacing(facing, { x: 0, y: 0 });
  const v = g.facingVector(facing);
  approx(v.x, 1, 'x while idle');
  approx(v.y, 0, 'y while idle');
});

// --- fireTick (one bullet per 0.2s while the button is held) -----------------

test('fireTick does not fire while the button is released', () => {
  const shot = g.fireTick(false, 1000, 0);
  assert.equal(shot.fire, false);
});

test('fireTick fires immediately when the cadence is clear', () => {
  const shot = g.fireTick(true, 1000, 0);
  assert.equal(shot.fire, true);
  assert.equal(shot.nextFireAt, 1200);
});

test('fireTick never fires twice inside the 0.2s interval', () => {
  let nextFireAt = 0;
  const shots = [];
  for (let t = 0; t < 1000; t += 10) {
    const shot = g.fireTick(true, t, nextFireAt);
    nextFireAt = shot.nextFireAt;
    if (shot.fire) {
      shots.push(t);
    }
  }
  assert.deepEqual(shots, [0, 200, 400, 600, 800]);
});

test('fireTick holds exactly one shot per 0.2s across irregular frame times', () => {
  let nextFireAt = 0;
  const shots = [];
  for (const t of [0, 30, 31, 90, 200, 210, 500, 700, 701, 899]) {
    const shot = g.fireTick(true, t, nextFireAt);
    nextFireAt = shot.nextFireAt;
    if (shot.fire) {
      shots.push(t);
    }
  }
  assert.deepEqual(shots, [0, 200, 500, 700]);
});

test('fireTick keeps the cadence when tapping instead of holding', () => {
  const first = g.fireTick(true, 0, 0);
  assert.equal(first.fire, true);

  const released = g.fireTick(false, 50, first.nextFireAt);
  assert.equal(released.fire, false);
  assert.equal(released.nextFireAt, 200);

  const tapped = g.fireTick(true, 120, released.nextFireAt);
  assert.equal(tapped.fire, false);

  const ready = g.fireTick(true, 240, tapped.nextFireAt);
  assert.equal(ready.fire, true);
});

test('fireTick re-arms after a long pause without firing', () => {
  const idle = g.fireTick(false, 5000, 300);
  assert.equal(idle.fire, false);
  assert.equal(idle.nextFireAt, 300);
  assert.equal(g.fireTick(true, 5001, idle.nextFireAt).fire, true);
});

// --- bulletOutOfBounds (despawn off-screen) ----------------------------------

test('bulletOutOfBounds keeps bullets that are still on screen', () => {
  assert.equal(g.bulletOutOfBounds(400, 300), false);
  assert.equal(g.bulletOutOfBounds(0, 0), false);
  assert.equal(g.bulletOutOfBounds(800, 600), false);
  assert.equal(g.bulletOutOfBounds(-12, 300), false);
  assert.equal(g.bulletOutOfBounds(812, 300), false);
});

test('bulletOutOfBounds despawns bullets once they leave the play field', () => {
  assert.equal(g.bulletOutOfBounds(-13, 300), true);
  assert.equal(g.bulletOutOfBounds(813, 300), true);
  assert.equal(g.bulletOutOfBounds(400, -13), true);
  assert.equal(g.bulletOutOfBounds(400, 613), true);
});

// --- summary ------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
