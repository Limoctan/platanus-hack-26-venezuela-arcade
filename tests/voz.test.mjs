// Behavioral tests for "La voz del juego" (issue #10): the demo of Spanish
// copy, the rallying defeat lines, the 3-letter A-Z initials gate, and the
// defensively validated top-5 leaderboard.
// Run: node tests/voz.test.mjs
import assert from 'node:assert/strict';
import { loadGame, readGameBinding } from './harness.mjs';

const g = loadGame();

const DEFEAT_LINES = readGameBinding(g, 'DEFEAT_LINES');
const LETTER_GRID = readGameBinding(g, 'LETTER_GRID');

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

// --- DEFEAT_LINES (la derrota arenga, no deprime) ------------------------------

test('DEFEAT_LINES keeps an example line from the spec', () => {
  assert.ok(DEFEAT_LINES.includes('¡La isla aún resiste, patriota!'));
  assert.ok(DEFEAT_LINES.includes('¡No dejes que Matasiete caiga!'));
});

test('DEFEAT_LINES is a pool of several rallying lines', () => {
  assert.ok(DEFEAT_LINES.length >= 4);
  for (const line of DEFEAT_LINES) {
    assert.equal(typeof line, 'string');
    assert.ok(line.length > 0);
    assert.match(line, /¡/);
  }
});

// --- LETTER_GRID (3 letras, solo A-Z) ------------------------------------------

test('LETTER_GRID offers exactly the 26 A-Z letters', () => {
  const values = LETTER_GRID.flat();
  const commands = ['BORRAR', 'LISTO'];
  const letters = values.filter((value) => !commands.includes(value));
  assert.equal(letters.length, 26);
  assert.equal(new Set(letters).size, 26);
  for (const letter of letters) {
    assert.match(letter, /^[A-Z]$/);
  }
});

test('LETTER_GRID exposes BORRAR and LISTO commands', () => {
  const values = LETTER_GRID.flat();
  assert.ok(values.includes('BORRAR'));
  assert.ok(values.includes('LISTO'));
});

// --- qualifiesForHighScore (solo la entrada que clasifica pide iniciales) -------

const boardOf = (scores) => scores.map((score, i) => ({ name: 'PAB', score, savedAt: `2020-01-0${i + 1}` }));

test('qualifiesForHighScore on an empty board with a positive score', () => {
  assert.equal(g.qualifiesForHighScore(500, []), true);
});

test('qualifiesForHighScore rejects a zero or negative score', () => {
  assert.equal(g.qualifiesForHighScore(0, []), false);
  assert.equal(g.qualifiesForHighScore(-10, []), false);
});

test('qualifiesForHighScore accepts a short board regardless of score', () => {
  assert.equal(g.qualifiesForHighScore(1, boardOf([200, 300])), true);
  assert.equal(g.qualifiesForHighScore(1, boardOf([200, 300, 400, 500])), true);
});

test('qualifiesForHighScore on a full board requires beating the fifth', () => {
  const board = boardOf([100, 200, 300, 400, 500]);
  assert.equal(g.qualifiesForHighScore(1000, board), true);
  assert.equal(g.qualifiesForHighScore(50, board), false);
});

test('qualifiesForHighScore is clear when the score ties the fifth place', () => {
  const board = boardOf([100, 200, 300, 400, 500]);
  assert.equal(g.qualifiesForHighScore(500, board), true);
});

// --- isHighScoreEntry (foreign shapes are ignored) ------------------------------

const validEntry = { name: 'ABC', score: 1200, savedAt: '2026-10-10' };

test('isHighScoreEntry accepts a well-formed entry', () => {
  assert.equal(g.isHighScoreEntry(validEntry), true);
});

test('isHighScoreEntry accepts names of one to three A-Z letters', () => {
  assert.equal(g.isHighScoreEntry({ ...validEntry, name: 'A' }), true);
  assert.equal(g.isHighScoreEntry({ ...validEntry, name: 'AB' }), true);
  assert.equal(g.isHighScoreEntry({ ...validEntry, name: 'ABC' }), true);
});

test('isHighScoreEntry ignores names with punctuation or lowercase', () => {
  assert.equal(g.isHighScoreEntry({ ...validEntry, name: 'ABC. -' }), false);
  assert.equal(g.isHighScoreEntry({ ...validEntry, name: 'abc' }), false);
  assert.equal(g.isHighScoreEntry({ ...validEntry, name: 'A B' }), false);
});

test('isHighScoreEntry ignores names longer than three letters', () => {
  assert.equal(g.isHighScoreEntry({ ...validEntry, name: 'ABCD' }), false);
  assert.equal(g.isHighScoreEntry({ ...validEntry, name: 'A'.repeat(200) }), false);
});

test('isHighScoreEntry rejects null, arrays, and non-objects', () => {
  assert.equal(g.isHighScoreEntry(null), false);
  assert.equal(g.isHighScoreEntry([validEntry]), false);
  assert.equal(g.isHighScoreEntry('ABC'), false);
});

test('isHighScoreEntry rejects entries missing a name, score, or savedAt', () => {
  assert.equal(g.isHighScoreEntry({ ...validEntry, name: undefined }), false);
  assert.equal(g.isHighScoreEntry({ ...validEntry, name: '' }), false);
  assert.equal(g.isHighScoreEntry({ ...validEntry, score: '1200' }), false);
  assert.equal(g.isHighScoreEntry({ ...validEntry, score: NaN }), false);
  assert.equal(g.isHighScoreEntry({ ...validEntry, score: -5 }), false);
  assert.equal(g.isHighScoreEntry({ ...validEntry, score: Infinity }), false);
  assert.equal(g.isHighScoreEntry({ ...validEntry, savedAt: undefined }), false);
  assert.equal(g.isHighScoreEntry({ ...validEntry, savedAt: 42 }), false);
});

// --- parseHighScores validation over raw stored shapes ---------------------------

test('parseHighScores discards foreign elements and caps at five', () => {
  const junk = {
    found: true,
    value: [
      { name: 'XAC', score: 700, savedAt: 'x' },
      'nope',
      42,
      null,
      { name: 'ab', score: 5, savedAt: 'x' },
      { name: 'TOO LONG', score: 9, savedAt: 'x' },
      ...boardOf([100, 200, 300, 400, 500, 600]),
    ],
  };
  const scores = g.parseHighScores(junk);
  assert.equal(scores.length, 5);
  assert.deepEqual(
    [...scores.map((entry) => entry.score)],
    [700, 600, 500, 400, 300],
  );
  assert.equal(scores[0].name, 'XAC');
});

test('parseHighScores gracefully handles missing, empty, and non-array values', () => {
  assert.deepEqual([...g.parseHighScores(null)], []);
  assert.deepEqual([...g.parseHighScores({ found: false, value: null })], []);
  assert.deepEqual([...g.parseHighScores({ found: true, value: 'junk' })], []);
  assert.deepEqual([...g.parseHighScores({ found: true, value: [] })], []);
});

// --- summary --------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
