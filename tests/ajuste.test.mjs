// Behavioral tests for "Audio y pulido final" (issue #11): the balance pass on
// the oleada director (legible especial mix, capped enemy-speed growth) and
// the procedural chiptune tracks. Run: node tests/ajuste.test.mjs
import assert from 'node:assert/strict';
import { loadGame, readGameBinding } from './harness.mjs';

const g = loadGame();

const TRACK_BATTLE = readGameBinding(g, 'TRACK_BATTLE');
const TRACK_TITLE = readGameBinding(g, 'TRACK_TITLE');

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

// --- oleadaEnemySpeed (los españoles apuran el paso con cada oleada, con tope) --

test('oleadaEnemySpeed is baseline on oleada 1', () => {
  assert.equal(g.oleadaEnemySpeed(1), 1);
});

test('oleadaEnemySpeed climbs with the oleada number', () => {
  assert.ok(g.oleadaEnemySpeed(8) > g.oleadaEnemySpeed(2), 'grows with N');
});

test('oleadaEnemySpeed caps so the horde never outruns the arcade', () => {
  assert.ok(g.oleadaEnemySpeed(999) <= 1.3 + 1e-9, 'caps at 1.3x');
  assert.equal(g.oleadaEnemySpeed(50), g.oleadaEnemySpeed(200), 'flat after the cap');
});

test('oleadaEnemySpeed keeps the Patriota the faster runner', () => {
  // El Patriota corre a 170 px/s; el Lancero no puede alcanzarlo jamás.
  for (let oleada = 1; oleada <= 100; oleada += 1) {
    const lanceroSpeed = 64 * g.oleadaEnemySpeed(oleada);
    assert.ok(lanceroSpeed <= 170, `lancero runs at ${lanceroSpeed} on oleada ${oleada}`);
  }
});

// --- oleadaFusileros (la oleada sigue legible oleada 10+) ----------------------

test('oleadaFusileros keeps oleada 1 free of Fusileros', () => {
  assert.equal(g.oleadaFusileros(1), 0);
});

test('oleadaFusileros brings the first Fusilero on oleada 2', () => {
  assert.equal(g.oleadaFusileros(2), 1);
});

test('oleadaFusileros grows the Fusilero share with N', () => {
  assert.ok(g.oleadaFusileros(12) > g.oleadaFusileros(3), 'grows with N');
});

test('oleadaFusileros never outnumbers the rest of the oleada', () => {
  for (let oleada = 1; oleada <= 100; oleada += 1) {
    const fusileros = g.oleadaFusileros(oleada);
    const total = g.oleadaSize(oleada);
    assert.ok(fusileros >= 0, `oleada ${oleada}: ${fusileros} >= 0`);
    assert.ok(
      fusileros <= total / 2,
      `oleada ${oleada}: ${fusileros} is at most half of ${total}`,
    );
  }
});

test('oleadaFusileros caps with the wave size on endless oleadas', () => {
  assert.equal(g.oleadaFusileros(40), g.oleadaFusileros(100));
});

// --- mezcla de especialistas: la mitad o menos, siempre con lanceros de frente --

test('the special mix settles inside the 7/12 readability budget', () => {
  // Fusileros ≤ un tercio, Jinetes ≤ un cuarto: la mezcla se estanca en
  // ~55 % de especialistas y siempre quedan filas de a pie al frente.
  for (let oleada = 1; oleada <= 100; oleada += 1) {
    const total = g.oleadaSize(oleada);
    const specials = g.oleadaFusileros(oleada) + g.oleadaJinetes(oleada);
    assert.ok(
      specials <= Math.ceil((total * 7) / 12),
      `oleada ${oleada}: ${specials} specialists in ${total}`,
    );
  }
});

test('oleada 10 keeps the wave inside the readability budget', () => {
  const total = g.oleadaSize(10);
  const specials = g.oleadaFusileros(10) + g.oleadaJinetes(10);
  assert.ok(specials <= Math.ceil(total / 2), `${specials} specialists in ${total}`);
});

// --- pistas de chiptune (los datos del motor de audio son coherentes) -----------

test('both tracks pitch a square lead over a bass line of equal length', () => {
  for (const track of [TRACK_BATTLE, TRACK_TITLE]) {
    assert.ok(track.lead.length > 0, 'lead loops');
    assert.ok(track.bass.length > 0, 'bass loops');
    assert.ok(track.lead.length % 8 === 0, 'lead quantized to bars of 8 steps');
    assert.ok(track.bass.length % 8 === 0, 'bass quantized to bars of 8 steps');
    assert.ok(track.lead.length === track.bass.length, 'lead and bass stay in sync');
    assert.ok(track.step > 0.05 && track.step < 0.5, 'sane step size');
  }
});

test('the battle track is the driving one and carries drums', () => {
  assert.ok(TRACK_BATTLE.step <= TRACK_TITLE.step, 'battle marches faster');
  assert.equal(TRACK_BATTLE.drums, true, 'battle has percussion');
  assert.equal(TRACK_TITLE.drums, false, 'title is percussion-free');
});

test('track notes read as MIDI numbers or rests (0)', () => {
  for (const track of [TRACK_BATTLE, TRACK_TITLE]) {
    for (const note of track.lead.concat(track.bass)) {
      assert.ok(Number.isInteger(note) && note >= 0 && note <= 108, `note ${note}`);
    }
  }
});

// --- playSound cubre cada efecto pedido por el ticket ---------------------------

const SFX_NAMES = [
  'click', 'select', 'oleada', 'bonus', 'shot', 'aim', 'musket',
  'deflect', 'sable', 'hit', 'kill', 'hurt', 'piedraThrow', 'crush',
  'listo', 'defeat',
];

test('playSound never throws on every declared effect', () => {
  const scene = { sound: {} };
  for (const name of SFX_NAMES) {
    g.playSound(scene, name);
  }
});

// --- summary ------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
