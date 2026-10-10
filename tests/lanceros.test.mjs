// Behavioral tests for the Lancero / vidas / derrota seams of game.js.
// Run: node tests/lanceros.test.mjs
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

// --- towardVector (el Lancero avanza directo hacia el Patriota) ---------------

test('towardVector is zero when the target is already reached', () => {
  assert.deepEqual({ ...g.towardVector(400, 300, 400, 300) }, { x: 0, y: 0 });
});

test('towardVector points at the four cardinal targets', () => {
  assert.deepEqual({ ...g.towardVector(0, 0, 10, 0) }, { x: 1, y: 0 });
  assert.deepEqual({ ...g.towardVector(0, 0, -7, 0) }, { x: -1, y: 0 });
  assert.deepEqual({ ...g.towardVector(0, 0, 0, 5) }, { x: 0, y: 1 });
  assert.deepEqual({ ...g.towardVector(0, 0, 0, -9) }, { x: 0, y: -1 });
});

test('towardVector normalizes diagonals to unit speed', () => {
  const v = g.towardVector(0, 0, 30, 40);
  approx(v.x, 0.6, 'x');
  approx(v.y, 0.8, 'y');
  approx(Math.hypot(v.x, v.y), 1, 'magnitude');
});

test('towardVector ignores how far away the target is', () => {
  const near = g.towardVector(100, 100, 110, 100);
  const far = g.towardVector(100, 100, 500, 100);
  approx(near.x, far.x, 'x');
  approx(near.y, far.y, 'y');
});

// --- edgeSpawnPoint (los Lanceros entran por los cuatro bordes) ---------------

const W = 800;
const H = 600;

test('edgeSpawnPoint places edge 0 above the top of the screen', () => {
  const p = g.edgeSpawnPoint(0, 0.5);
  assert.ok(p.y < 0, `y was ${p.y}`);
  assert.ok(p.x > 0 && p.x < W, `x was ${p.x}`);
});

test('edgeSpawnPoint places edge 1 beyond the right of the screen', () => {
  const p = g.edgeSpawnPoint(1, 0.5);
  assert.ok(p.x > W, `x was ${p.x}`);
  assert.ok(p.y > 0 && p.y < H, `y was ${p.y}`);
});

test('edgeSpawnPoint places edge 2 below the bottom of the screen', () => {
  const p = g.edgeSpawnPoint(2, 0.5);
  assert.ok(p.y > H, `y was ${p.y}`);
  assert.ok(p.x > 0 && p.x < W, `x was ${p.x}`);
});

test('edgeSpawnPoint places edge 3 beyond the left of the screen', () => {
  const p = g.edgeSpawnPoint(3, 0.5);
  assert.ok(p.x < 0, `x was ${p.x}`);
  assert.ok(p.y > 0 && p.y < H, `y was ${p.y}`);
});

test('edgeSpawnPoint slides the spawn along the edge as t grows', () => {
  const start = g.edgeSpawnPoint(0, 0);
  const end = g.edgeSpawnPoint(0, 1);
  assert.ok(end.x > start.x, `start.x ${start.x} end.x ${end.x}`);
  assert.equal(start.y, end.y);
});

test('edgeSpawnPoint clamps t outside the 0..1 range', () => {
  assert.deepEqual({ ...g.edgeSpawnPoint(0, -3) }, { ...g.edgeSpawnPoint(0, 0) });
  assert.deepEqual({ ...g.edgeSpawnPoint(0, 9) }, { ...g.edgeSpawnPoint(0, 1) });
});

// --- damageAfterBullet (cada Lancero resiste dos balas) ----------------------

test('damageAfterBullet takes the Lancero from 2 hit points to 1', () => {
  assert.equal(g.damageAfterBullet(2), 1);
});

test('damageAfterBullet removes a Lancero on the second bullet', () => {
  assert.equal(g.damageAfterBullet(1), 0);
});

test('damageAfterBullet never goes below zero', () => {
  assert.equal(g.damageAfterBullet(0), 0);
});

// --- pointsForKill (cada baja suma 100 puntos) -------------------------------

test('pointsForKill scores 100 for a Lancero', () => {
  assert.equal(g.pointsForKill('lancero'), 100);
});

test('pointsForKill scores nothing for an unknown español', () => {
  assert.equal(g.pointsForKill('nope'), 0);
  assert.equal(g.pointsForKill(undefined), 0);
});

// --- withinRange (contacto y impacto de bala) --------------------------------

test('withinRange accepts two points closer than the range', () => {
  assert.equal(g.withinRange(100, 100, 105, 104, 10), true);
});

test('withinRange rejects two points beyond the range', () => {
  assert.equal(g.withinRange(100, 100, 115, 100, 10), false);
});

test('withinRange accepts a point exactly on the range', () => {
  assert.equal(g.withinRange(0, 0, 6, 8, 10), true);
});

// --- applyContact (tocar a un español cuesta una vida) -----------------------

test('applyContact costs one life and opens the invulnerability window', () => {
  const result = g.applyContact(3, 0, 100);
  assert.equal(result.lives, 2);
  assert.equal(result.invulnerableUntil, 2100);
  assert.equal(result.hit, true);
});

test('applyContact does nothing while the Patriota is invulnerable', () => {
  const result = g.applyContact(2, 2100, 1500);
  assert.equal(result.lives, 2);
  assert.equal(result.invulnerableUntil, 2100);
  assert.equal(result.hit, false);
});

test('applyContact never drops lives below zero', () => {
  const result = g.applyContact(0, 0, 100);
  assert.equal(result.lives, 0);
  assert.equal(result.hit, true);
});

// --- isInvulnerable / blinkVisible (parpadeo de invulnerabilidad) -------------

test('isInvulnerable is true inside the window and false after it', () => {
  assert.equal(g.isInvulnerable(1500, 2100), true);
  assert.equal(g.isInvulnerable(2100, 2100), false);
  assert.equal(g.isInvulnerable(2500, 2100), false);
});

test('blinkVisible alternates every half blink period', () => {
  assert.equal(g.blinkVisible(0), true);
  assert.equal(g.blinkVisible(59), true);
  assert.equal(g.blinkVisible(60), false);
  assert.equal(g.blinkVisible(119), false);
  assert.equal(g.blinkVisible(120), true);
  assert.equal(g.blinkVisible(1500), false);
});

// --- knockbackVector (empujón hacia el centro de la pantalla) ----------------

test('knockbackVector pushes a Patriota on the top edge toward the center', () => {
  const v = g.knockbackVector(400, 40);
  approx(v.x, 0, 'x');
  approx(v.y, 1, 'y');
});

test('knockbackVector pushes a Patriota on the left edge to the right', () => {
  const v = g.knockbackVector(30, 300);
  approx(v.x, 1, 'x');
  approx(v.y, 0, 'y');
});

test('knockbackVector points inward from a corner', () => {
  const v = g.knockbackVector(80, 60);
  approx(v.x, 0.8, 'x');
  approx(v.y, 0.6, 'y');
});

test('knockbackVector is zero when the Patriota is at the center', () => {
  assert.deepEqual({ ...g.knockbackVector(400, 300) }, { x: 0, y: 0 });
});

// --- isDefeated (la tercera vida perdida termina la partida) ------------------

test('isDefeated is false while lives remain', () => {
  assert.equal(g.isDefeated(3), false);
  assert.equal(g.isDefeated(1), false);
});

test('isDefeated is true once the third life is gone', () => {
  assert.equal(g.isDefeated(0), true);
  assert.equal(g.isDefeated(-1), true);
});

// --- summary ------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
