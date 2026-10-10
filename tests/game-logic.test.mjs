// Behavioral tests for the pure logic seams of game.js (Batalla de Matasiete).
// Run: node tests/game-logic.test.mjs
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

function heldState(map) {
  return { held: map, pressed: {} };
}

// --- normalizeIncomingKey -----------------------------------------------------

test('normalizeIncomingKey maps space to "space"', () => {
  assert.equal(g.normalizeIncomingKey(' '), 'space');
});

test('normalizeIncomingKey lowercases letter keys', () => {
  assert.equal(g.normalizeIncomingKey('W'), 'w');
  assert.equal(g.normalizeIncomingKey('Enter'), 'enter');
});

test('normalizeIncomingKey rejects empty and non-string input', () => {
  assert.equal(g.normalizeIncomingKey(''), '');
  assert.equal(g.normalizeIncomingKey(null), '');
  assert.equal(g.normalizeIncomingKey(42), '');
});

// --- isHighScoreEntry (storage survives releases: validate defensively) -------

const validEntry = { name: 'ABC', score: 1200, savedAt: '2026-10-10' };

test('isHighScoreEntry accepts a well-formed single-player entry', () => {
  assert.equal(g.isHighScoreEntry(validEntry), true);
});

test('isHighScoreEntry rejects null, arrays, and non-objects', () => {
  assert.equal(g.isHighScoreEntry(null), false);
  assert.equal(g.isHighScoreEntry(undefined), false);
  assert.equal(g.isHighScoreEntry([validEntry]), false);
  assert.equal(g.isHighScoreEntry('ABC'), false);
});

test('isHighScoreEntry rejects entries with a missing or non-string name', () => {
  assert.equal(g.isHighScoreEntry({ ...validEntry, name: undefined }), false);
  assert.equal(g.isHighScoreEntry({ ...validEntry, name: 42 }), false);
  assert.equal(g.isHighScoreEntry({ ...validEntry, name: '' }), false);
});

test('isHighScoreEntry rejects invalid scores', () => {
  assert.equal(g.isHighScoreEntry({ ...validEntry, score: '1200' }), false);
  assert.equal(g.isHighScoreEntry({ ...validEntry, score: NaN }), false);
  assert.equal(g.isHighScoreEntry({ ...validEntry, score: -5 }), false);
  assert.equal(g.isHighScoreEntry({ ...validEntry, score: Infinity }), false);
});

test('isHighScoreEntry rejects entries without a savedAt string', () => {
  assert.equal(g.isHighScoreEntry({ ...validEntry, savedAt: undefined }), false);
  assert.equal(g.isHighScoreEntry({ ...validEntry, savedAt: 1728000000000 }), false);
});

test('isHighScoreEntry rejects absurd names that would break the board layout', () => {
  assert.equal(g.isHighScoreEntry({ ...validEntry, name: 'A'.repeat(9) }), false);
  assert.equal(g.isHighScoreEntry({ ...validEntry, name: 'X'.repeat(200) }), false);
});

test('isHighScoreEntry accepts short arcade-style names', () => {
  assert.equal(g.isHighScoreEntry({ ...validEntry, name: 'A' }), true);
  assert.equal(g.isHighScoreEntry({ ...validEntry, name: 'ABC. -' }), true);
});

test('isHighScoreEntry rejects absurd scores', () => {
  assert.equal(g.isHighScoreEntry({ ...validEntry, score: 1e12 }), false);
});

// --- rankHighScores -----------------------------------------------------------

const entry = (name, score, savedAt) => ({ name, score, savedAt });

test('rankHighScores sorts highest score first', () => {
  const ranked = g.rankHighScores([
    entry('AAA', 100, '2026-01-01'),
    entry('BBB', 300, '2026-01-02'),
    entry('CCC', 200, '2026-01-03'),
  ]);
  assert.deepEqual(ranked.map((e) => e.name), ['BBB', 'CCC', 'AAA']);
});

test('rankHighScores breaks ties with the most recent entry first', () => {
  const ranked = g.rankHighScores([
    entry('OLD', 500, '2026-01-01'),
    entry('NEW', 500, '2026-06-01'),
  ]);
  assert.deepEqual(ranked.map((e) => e.name), ['NEW', 'OLD']);
});

test('rankHighScores caps the board at 5 entries', () => {
  const many = Array.from({ length: 8 }, (_, i) => entry(`P${i}`, (i + 1) * 100, '2026-01-01'));
  assert.equal(g.rankHighScores(many).length, 5);
  assert.equal(g.rankHighScores(many)[0].score, 800);
});

test('rankHighScores does not mutate its input', () => {
  const input = [entry('AAA', 100, '2026-01-01'), entry('BBB', 200, '2026-01-01')];
  g.rankHighScores(input);
  assert.equal(input[0].name, 'AAA');
});

// --- formatHighScores (Spanish leaderboard copy) ------------------------------

test('formatHighScores shows the Spanish empty-board line', () => {
  assert.deepEqual([...g.formatHighScores([])], ['SIN PUNTOS AÚN']);
});

test('formatHighScores formats rank, padded name, and 5-digit score', () => {
  const lines = g.formatHighScores([entry('AB', 42, '2026-01-01')]);
  assert.deepEqual(lines, ['01 AB  00042']);
});

// --- getMoveVector (8-way Patriota movement) ----------------------------------

test('getMoveVector is zero when nothing is held', () => {
  assert.deepEqual({ ...g.getMoveVector(heldState({})) }, { x: 0, y: 0 });
});

test('getMoveVector reads the four cardinal directions', () => {
  assert.deepEqual({ ...g.getMoveVector(heldState({ P1_L: true })) }, { x: -1, y: 0 });
  assert.deepEqual({ ...g.getMoveVector(heldState({ P1_R: true })) }, { x: 1, y: 0 });
  assert.deepEqual({ ...g.getMoveVector(heldState({ P1_U: true })) }, { x: 0, y: -1 });
  assert.deepEqual({ ...g.getMoveVector(heldState({ P1_D: true })) }, { x: 0, y: 1 });
});

test('getMoveVector normalizes diagonals to unit speed', () => {
  const vector = g.getMoveVector(heldState({ P1_L: true, P1_U: true }));
  assert.ok(Math.abs(vector.x + Math.SQRT1_2) < 1e-9, `x was ${vector.x}`);
  assert.ok(Math.abs(vector.y + Math.SQRT1_2) < 1e-9, `y was ${vector.y}`);
  const magnitude = Math.hypot(vector.x, vector.y);
  assert.ok(Math.abs(magnitude - 1) < 1e-9, `magnitude was ${magnitude}`);
});

test('getMoveVector cancels opposing directions', () => {
  assert.deepEqual({ ...g.getMoveVector(heldState({ P1_L: true, P1_R: true })) }, { x: 0, y: 0 });
  assert.deepEqual(
    { ...g.getMoveVector(heldState({ P1_U: true, P1_D: true, P1_L: true })) },
    { x: -1, y: 0 },
  );
});

test('getMoveVector also honors the second joystick (cabinet test alias)', () => {
  assert.deepEqual({ ...g.getMoveVector(heldState({ P2_R: true, P2_D: true })) }, {
    x: Math.SQRT1_2,
    y: Math.SQRT1_2,
  });
});

// --- clearPressedControls (stale presses must not leak across phases) ---------

test('clearPressedControls wipes pending presses but keeps held state', () => {
  const scene = {
    controls: { held: { P1_1: true }, pressed: { P1_1: true, START1: true } },
  };
  g.clearPressedControls(scene);
  assert.deepEqual({ ...scene.controls.pressed }, {});
  assert.equal(scene.controls.held.P1_1, true);
});

// --- summary ------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
