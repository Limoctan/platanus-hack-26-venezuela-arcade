// Behavioral tests for the Jinete seams of game.js.
// Run: node tests/jinete.test.mjs
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

// --- pointsForKill / hpForKind (el Jinete es rápido, frágil y vale 150) -------

test('pointsForKill scores 150 for a Jinete', () => {
  assert.equal(g.pointsForKill('jinete'), 150);
});

test('pointsForKill keeps the foot soldiers at their value', () => {
  assert.equal(g.pointsForKill('lancero'), 100);
  assert.equal(g.pointsForKill('fusilero'), 200);
});

test('hpForKind gives the Jinete a single bullet of resistance', () => {
  assert.equal(g.hpForKind('jinete'), 1);
  assert.equal(g.damageAfterBullet(g.hpForKind('jinete')), 0);
});

test('hpForKind keeps the foot soldiers tougher', () => {
  assert.equal(g.hpForKind('lancero'), 2);
  assert.equal(g.hpForKind('fusilero'), 2);
});

// --- oleadaJinetes (la caballería entra desde la oleada 3) --------------------

test('oleadaJinetes keeps the first two oleadas on foot', () => {
  assert.equal(g.oleadaJinetes(1), 0);
  assert.equal(g.oleadaJinetes(2), 0);
});

test('oleadaJinetes brings the first Jinete on oleada 3', () => {
  assert.equal(g.oleadaJinetes(3), 1);
});

test('oleadaJinetes grows the cavalry share with N', () => {
  assert.ok(g.oleadaJinetes(9) > g.oleadaJinetes(3), 'grows with N');
});

test('oleadaJinetes never outnumbers a third of the oleada', () => {
  for (let oleada = 1; oleada <= 100; oleada += 1) {
    const jinetes = g.oleadaJinetes(oleada);
    const total = g.oleadaSize(oleada);
    assert.ok(jinetes >= 0, `oleada ${oleada}: ${jinetes} >= 0`);
    assert.ok(
      jinetes <= total / 3 + 1e-9,
      `oleada ${oleada}: ${jinetes} is at most a third of ${total}`,
    );
  }
});

test('oleadaJinetes always leaves room for the Fusileros', () => {
  for (let oleada = 1; oleada <= 100; oleada += 1) {
    const specialists = g.oleadaFusileros(oleada) + g.oleadaJinetes(oleada);
    assert.ok(
      specialists <= g.oleadaSize(oleada),
      `oleada ${oleada}: ${specialists} specialists fit in ${g.oleadaSize(oleada)}`,
    );
  }
});

test('oleadaJinetes caps with the wave size on endless oleadas', () => {
  assert.equal(g.oleadaJinetes(40), g.oleadaJinetes(200));
});

// --- spawnKindAt (los Jinetes se reparten dentro de la oleada) ----------------

test('spawnKindAt leaves the Jinete out of a cavalry-free wave', () => {
  for (let i = 0; i < 8; i += 1) {
    assert.notEqual(g.spawnKindAt(i, 8, 2, 0), 'jinete');
  }
});

test('spawnKindAt spreads exactly the announced Jinetes through the wave', () => {
  const waves = [
    [7, 2, 1],
    [10, 3, 2],
    [16, 6, 4],
    [20, 10, 6],
  ];
  for (const [total, fusileros, jinetes] of waves) {
    const plan = Array.from({ length: total }, (_, i) =>
      g.spawnKindAt(i, total, fusileros, jinetes),
    );
    const counts = {
      lancero: plan.filter((kind) => kind === 'lancero').length,
      fusilero: plan.filter((kind) => kind === 'fusilero').length,
      jinete: plan.filter((kind) => kind === 'jinete').length,
    };
    assert.equal(counts.jinete, jinetes, `oleada of ${total} has ${jinetes} jinetes`);
    assert.equal(counts.fusilero, fusileros, `oleada of ${total} has ${fusileros} fusileros`);
    assert.equal(counts.lancero, total - fusileros - jinetes, 'the rest are lanceros');
  }
});

test('spawnKindAt never packs two Jinetes side by side unless they are all the wave has', () => {
  const plan = Array.from({ length: 9 }, (_, i) => g.spawnKindAt(i, 9, 6, 3));
  for (let i = 1; i < plan.length; i += 1) {
    assert.ok(
      !(plan[i] === 'jinete' && plan[i - 1] === 'jinete'),
      `Jinetes packed at ${i - 1} and ${i}`,
    );
  }
});

test('spawnKindAt still reproduces the Fusilero-only waves', () => {
  const waves = [
    [5, 1],
    [7, 2],
    [13, 5],
    [20, 10],
  ];
  for (const [total, fusileros] of waves) {
    const plan = Array.from({ length: total }, (_, i) =>
      g.spawnKindAt(i, total, fusileros),
    );
    const count = plan.filter((kind) => kind === 'fusilero').length;
    assert.equal(count, fusileros, `oleada of ${total} has ${fusileros}`);
    assert.ok(plan.every((kind) => kind === 'lancero' || kind === 'fusilero'));
  }
  assert.equal(g.spawnKindAt(0, 5, 1), 'fusilero');
});

// --- spawnEdgeFor (los Jinetes embisten por los costados) --------------------

test('spawnEdgeFor sends the Jinete only through the side edges', () => {
  for (let i = 0; i < 12; i += 1) {
    const edge = g.spawnEdgeFor('jinete', i);
    assert.ok(edge === 1 || edge === 3, `edge ${edge} is a side edge`);
  }
});

test('spawnEdgeFor alternates the Jinete between the two flanks', () => {
  assert.equal(g.spawnEdgeFor('jinete', 0), 1);
  assert.equal(g.spawnEdgeFor('jinete', 1), 3);
  assert.equal(g.spawnEdgeFor('jinete', 2), 1);
});

test('spawnEdgeFor keeps the foot soldiers on all four edges', () => {
  const edges = new Set(
    Array.from({ length: 8 }, (_, i) => g.spawnEdgeFor('lancero', i)),
  );
  assert.equal(edges.size, 4);
});

// --- jineteTick (embestida lateral y luego persecución) ----------------------

test('jineteTick reports the Jinete dashing right after it enters', () => {
  assert.equal(g.jineteTick({ dashUntil: 500 }, 0).dashing, true);
  assert.equal(g.jineteTick({ dashUntil: 500 }, 499).dashing, true);
});

test('jineteTick ends the dash once the window elapses', () => {
  assert.equal(g.jineteTick({ dashUntil: 500 }, 500).dashing, false);
  assert.equal(g.jineteTick({ dashUntil: 500 }, 900).dashing, false);
});

// --- updateJinete (embestida lateral y persecución a alta velocidad) ---------

const JINETE_DASH_SPEED = 320;
const JINETE_SPEED = 150;

function mockJinete(overrides = {}) {
  const jinete = {
    kind: 'jinete',
    x: 40,
    y: 300,
    facing: 'E',
    dashUntil: 500,
    dashDir: { x: 1, y: 0 },
    velocity: null,
    rotation: 0,
    body: {
      setVelocity(x, y) {
        jinete.velocity = { x, y };
      },
    },
    setRotation(rotation) {
      jinete.rotation = rotation;
    },
    ...overrides,
  };
  return jinete;
}

test('updateJinete dashes straight in from the flank at full gallop', () => {
  const jinete = mockJinete();
  g.updateJinete(jinete, { x: 0, y: -1 }, 100);
  assert.deepEqual(jinete.velocity, { x: JINETE_DASH_SPEED, y: 0 });
});

test('updateJinete homes on the Patriota once the dash is spent', () => {
  const jinete = mockJinete({ dashUntil: 400 });
  g.updateJinete(jinete, { x: 0, y: 1 }, 500);
  assert.deepEqual(jinete.velocity, { x: 0, y: JINETE_SPEED });
});

test('updateJinete turns to face the way it dashes and then pursues', () => {
  const jinete = mockJinete({ dashUntil: 400, dashDir: { x: -1, y: 0 } });
  g.updateJinete(jinete, { x: 1, y: 0 }, 100);
  assert.equal(jinete.facing, 'W');
  g.updateJinete(jinete, { x: 0, y: 1 }, 500);
  assert.equal(jinete.facing, 'S');
});

// --- escena: el Jinete en combate --------------------------------------------

function mockHud() {
  const setText = () => {};
  return { score: { setText }, lives: { setText }, oleada: { setText } };
}

function mockScene({ espanoles = [], bullets = [] } = {}) {
  return {
    state: {
      phase: 'playing',
      run: { lives: 3, score: 0, oleada: 3, invulnerableUntil: 0 },
    },
    patriota: { x: 400, y: 300 },
    hud: mockHud(),
    time: { delayedCall() {} },
    sound: {},
    bullets: { getChildren: () => bullets },
    musketBalls: { getChildren: () => [] },
    espanoles: { getChildren: () => espanoles },
  };
}

test('resolveBulletHits fells a Jinete with a single bullet for 150 points', () => {
  let destroyed = false;
  const jinete = {
    x: 408,
    y: 300,
    kind: 'jinete',
    hp: g.hpForKind('jinete'),
    destroy() {
      destroyed = true;
    },
  };
  const bullet = { x: 408, y: 300, destroy() {} };
  const scene = mockScene({ espanoles: [jinete], bullets: [bullet] });
  g.resolveBulletHits(scene);
  assert.equal(destroyed, true, 'one bullet is enough against cavalry');
  assert.equal(scene.state.run.score, 150);
});

test('resolveSableHits kills a Jinete in the arc for 150 points', () => {
  let destroyed = false;
  const jinete = {
    x: 450,
    y: 300,
    kind: 'jinete',
    destroy() {
      destroyed = true;
    },
  };
  const scene = mockScene({ espanoles: [jinete] });
  g.resolveSableHits(scene, 'E');
  assert.equal(destroyed, true, 'the Sable fells cavalry in one sweep');
  assert.equal(scene.state.run.score, 150);
});

test('checkContactDamage costs a life when a Jinete runs into the Patriota', () => {
  const jinete = { x: 412, y: 300, kind: 'jinete' };
  const scene = mockScene({ espanoles: [jinete] });
  g.checkContactDamage(scene, 1000);
  assert.equal(scene.state.run.lives, 2);
});

// --- summary ------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
