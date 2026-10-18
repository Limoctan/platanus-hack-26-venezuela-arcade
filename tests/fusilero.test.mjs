// Behavioral tests for the Fusilero seams of game.js.
// Run: node tests/fusilero.test.mjs
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

// --- pointsForKill (el Fusilero suma 200 puntos) ------------------------------

test('pointsForKill scores 200 for a Fusilero', () => {
  assert.equal(g.pointsForKill('fusilero'), 200);
});

test('pointsForKill keeps the Lancero at 100', () => {
  assert.equal(g.pointsForKill('lancero'), 100);
});

// --- oleadaFusileros (el Fusilero se une desde la oleada 2) -------------------

test('oleadaFusileros keeps oleada 1 free of Fusileros', () => {
  assert.equal(g.oleadaFusileros(1), 0);
});

test('oleadaFusileros brings the first Fusilero on oleada 2', () => {
  assert.equal(g.oleadaFusileros(2), 1);
});

test('oleadaFusileros grows the Fusilero share with N', () => {
  assert.ok(g.oleadaFusileros(9) > g.oleadaFusileros(2), 'grows with N');
});

test('oleadaFusileros never outnumbers the rest of the oleada', () => {
  for (let oleada = 1; oleada <= 60; oleada += 1) {
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

// --- spawnKindAt (los Fusileros se reparten dentro de la oleada) --------------

test('spawnKindAt fills an oleada without Fusileros with only Lanceros', () => {
  for (let i = 0; i < 4; i += 1) {
    assert.equal(g.spawnKindAt(i, 4, 0), 'lancero');
  }
});

test('spawnKindAt spreads exactly the announced Fusileros through the wave', () => {
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
    for (const kind of plan) {
      assert.ok(
        kind === 'lancero' || kind === 'fusilero',
        `unexpected kind ${kind}`,
      );
    }
  }
});

test('spawnKindAt never packs two Fusileros back to back', () => {
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
    for (let i = 1; i < plan.length; i += 1) {
      assert.ok(
        !(plan[i] === 'fusilero' && plan[i - 1] === 'fusilero'),
        `oleada of ${total} packs Fusileros at ${i - 1} and ${i}`,
      );
    }
  }
});

test('spawnKindAt opens a Fusilero wave with its Fusilero', () => {
  assert.equal(g.spawnKindAt(0, 5, 1), 'fusilero');
  assert.equal(g.spawnKindAt(0, 7, 2), 'fusilero');
});

// --- musketTick (apunta, avisa y dispara con cadencia) ------------------------

const FUSILERO_AIM_MS = 550;
const FUSILERO_COOLDOWN_MS = 1800;

test('musketTick stays quiet while the Fusilero is still closing in', () => {
  const state = g.musketTick({ nextShotAt: 0, aimUntil: 0 }, false, 1000);
  assert.equal(state.aim, false);
  assert.equal(state.fire, false);
  assert.equal(state.aimUntil, 0);
});

test('musketTick waits for the cooldown before telegraphing again', () => {
  const state = g.musketTick({ nextShotAt: 1300, aimUntil: 0 }, true, 1000);
  assert.equal(state.aim, false);
  assert.equal(state.fire, false);
});

test('musketTick telegraphs once the cooldown is over', () => {
  const state = g.musketTick({ nextShotAt: 1300, aimUntil: 0 }, true, 1300);
  assert.equal(state.aim, true);
  assert.equal(state.fire, false);
  assert.equal(state.aimUntil, 1300 + FUSILERO_AIM_MS);
});

test('musketTick holds the telegraph until the aim window elapses', () => {
  const ready = g.musketTick({ nextShotAt: 1300, aimUntil: 0 }, true, 1300);
  const held = g.musketTick(
    { nextShotAt: ready.nextShotAt, aimUntil: ready.aimUntil },
    true,
    1300 + FUSILERO_AIM_MS - 1,
  );
  assert.equal(held.aim, false);
  assert.equal(held.fire, false);
});

test('musketTick fires the musket ball at the end of the telegraph', () => {
  const ready = g.musketTick({ nextShotAt: 1300, aimUntil: 0 }, true, 1300);
  const fired = g.musketTick(
    { nextShotAt: ready.nextShotAt, aimUntil: ready.aimUntil },
    true,
    1300 + FUSILERO_AIM_MS,
  );
  assert.equal(fired.aim, false);
  assert.equal(fired.fire, true);
  assert.equal(fired.aimUntil, 0);
  assert.equal(fired.nextShotAt, 1300 + FUSILERO_AIM_MS + FUSILERO_COOLDOWN_MS);
});

test('musketTick cancels the telegraph when the Fusilero must move again', () => {
  const state = g.musketTick({ nextShotAt: 0, aimUntil: 1850 }, false, 1500);
  assert.equal(state.aim, false);
  assert.equal(state.fire, false);
  assert.equal(state.aimUntil, 0);
});

test('musketTick holds one shot per cooldown while planted', () => {
  const fus = { nextShotAt: 0, aimUntil: 0 };
  const shots = [];
  for (let t = 0; t <= 6000; t += 10) {
    const state = g.musketTick(fus, true, t);
    fus.nextShotAt = state.nextShotAt;
    fus.aimUntil = state.aimUntil;
    if (state.fire) {
      shots.push(t);
    }
  }
  assert.deepEqual(shots, [
    550,
    550 + FUSILERO_COOLDOWN_MS + FUSILERO_AIM_MS,
    550 + 2 * (FUSILERO_COOLDOWN_MS + FUSILERO_AIM_MS),
  ]);
});

// --- escena: el Sable y el contacto -------------------------------------------

function mockHud() {
  const setText = () => {};
  return {
    score: { setText },
    lives: { setText },
    oleada: { setText },
    piedraBarBg: { setVisible() {} },
    piedraFill: { setVisible() {}, setDisplaySize() {} },
    piedraCaption: { setVisible() {} },
    piedraReady: { setVisible() {} },
  };
}

function mockBall(x, y) {
  return { x, y, dead: false, destroy() { this.dead = true; } };
}

function mockScene({ espanoles = [], balls = [], ...rest } = {}) {
  return {
    state: {
      phase: 'playing',
      run: {
        lives: 3,
        score: 0,
        invulnerableUntil: 0,
        knockUntil: 0,
        knock: { x: 0, y: 0 },
        piedraBank: 0,
        piedraProgress: 0,
        piedraScoreSeen: 0,
      },
    },
    patriota: { x: 400, y: 300 },
    hud: mockHud(),
    espanoles: { getChildren: () => espanoles },
    musketBalls: { getChildren: () => balls },
    ...rest,
  };
}

test('resolveSableHits destroys the musket balls caught in the arc', () => {
  const ahead = mockBall(440, 300);
  const behind = mockBall(360, 300);
  const scene = mockScene({ balls: [ahead, behind] });
  g.resolveSableHits(scene, 'E');
  assert.equal(ahead.dead, true, 'ball ahead is deflected');
  assert.equal(behind.dead, false, 'ball behind the swing survives');
});

test('resolveSableHits never deflects a ball out of the arc', () => {
  const beside = mockBall(400, 340);
  const scene = mockScene({ balls: [beside] });
  g.resolveSableHits(scene, 'E');
  assert.equal(beside.dead, false);
});

test('resolveSableHits kills a Fusilero in the arc for 200 points', () => {
  let destroyed = false;
  const fusilero = {
    x: 450,
    y: 300,
    kind: 'fusilero',
    destroy() { destroyed = true; },
  };
  const scene = mockScene({ espanoles: [fusilero] });
  g.resolveSableHits(scene, 'E');
  assert.equal(destroyed, true, 'fusilero dies to the one-hit Sable');
  assert.equal(scene.state.run.score, 200);
});

test('resolveMusketHits costs a life and consumes the musket ball', () => {
  const ball = mockBall(408, 300);
  const scene = mockScene({ balls: [ball] });
  g.resolveMusketHits(scene, 1000);
  assert.equal(scene.state.run.lives, 2);
  assert.equal(scene.state.run.invulnerableUntil, 3000, 'opens the 2s window');
  assert.equal(ball.dead, true, 'the ball is consumed on contact');
});

test('resolveMusketHits ignores a ball still far from the Patriota', () => {
  const ball = mockBall(700, 300);
  const scene = mockScene({ balls: [ball] });
  g.resolveMusketHits(scene, 1000);
  assert.equal(scene.state.run.lives, 3);
  assert.equal(ball.dead, false);
});

test('resolveMusketHits spends no extra life during invulnerability', () => {
  const ball = mockBall(408, 300);
  const scene = mockScene({ balls: [ball] });
  scene.state.run.invulnerableUntil = 2000;
  g.resolveMusketHits(scene, 1000);
  assert.equal(scene.state.run.lives, 3);
  assert.equal(ball.dead, true, 'the ball is still spent on contact');
});

test('checkContactDamage costs a life when a Fusilero touches the Patriota', () => {
  const fusilero = { x: 412, y: 300, kind: 'fusilero', destroy() {} };
  const scene = mockScene({ espanoles: [fusilero] });
  g.checkContactDamage(scene, 1000);
  assert.equal(scene.state.run.lives, 2);
  assert.equal(scene.state.run.invulnerableUntil, 3000);
});

test('checkContactDamage ignores a Fusilero holding mid-range', () => {
  const fusilero = { x: 620, y: 300, kind: 'fusilero', destroy() {} };
  const scene = mockScene({ espanoles: [fusilero] });
  g.checkContactDamage(scene, 1000);
  assert.equal(scene.state.run.lives, 3);
});

// --- summary ------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
