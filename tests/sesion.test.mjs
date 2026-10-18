// Behavioral smoke test for "Audio y pulido final" (issue #11): a full play
// session at the logic seam — title → nueva partida → oleada 10+ → derrota →
// iniciales → récord → retry — with no exceptions along the way. The scene is
// a mock, but every state transition goes through the real game.js functions.
// Run: node tests/sesion.test.mjs
import assert from 'node:assert/strict';
import { loadGame } from './harness.mjs';

const g = loadGame();
// Determinismo para las apariciones en los bordes.
g.Phaser.Math.RND.frac = () => 0.5;

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

async function asyncTest(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`ok   - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL - ${name}`);
    console.error(`       ${error.message}`);
  }
}

// --- mocks -------------------------------------------------------------------

function chainable() {
  const obj = {};
  for (const method of [
    'setOrigin', 'setDepth', 'setVisible', 'setActive', 'setRotation',
    'setAlpha', 'setScale', 'setPosition', 'setTint', 'setTintFill',
    'clearTint', 'setFlipX', 'setText', 'setDisplaySize',
  ]) {
    obj[method] = () => obj;
  }
  obj.destroy = () => {};
  return obj;
}

function mockEspanol(x, y, kind) {
  const espanol = chainable();
  espanol.x = x;
  espanol.y = y;
  espanol.kind = kind;
  espanol.hp = g.hpForKind(kind);
  espanol.body = {
    setSize() {},
    setOffset() {},
    setAllowGravity() {},
    setCollideWorldBounds() {},
    setVelocity() {},
  };
  return espanol;
}

function makeGroup() {
  const list = [];
  return {
    list,
    getChildren: () => list,
    getLength: () => list.length,
    create: (x, y, kind) => {
      const created = mockEspanol(x, y, kind);
      list.push(created);
      return created;
    },
  };
}

function mockHud() {
  const chain = () => ({ setText() {} });
  return {
    score: { setText: chain },
    lives: { setText: chain },
    oleada: { setText: chain },
    status: { setText: chain },
    piedraBarBg: { setVisible() {} },
    piedraFill: { setVisible() {}, setDisplaySize() {} },
    piedraCaption: { setVisible() {} },
    piedraReady: { setVisible() {} },
  };
}

function makeScene() {
  const scene = {
    state: {
      phase: 'start',
      run: g.freshRun(),
      highScores: [],
      saveStatus: '',
      menu: { cursor: 0, cooldown: 0, lastAxis: 0 },
      pauseMenu: { cursor: 0, cooldown: 0, lastAxis: 0 },
      nameEntry: {
        letters: [],
        row: 0,
        col: 0,
        moveCooldownUntil: 0,
        confirmCooldownUntil: 0,
        lastMoveVector: { x: 0, y: 0 },
      },
      audioUnlocked: false,
      audioGen: 0,
      musicKind: null,
      musicOut: null,
    },
    patriota: Object.assign(chainable(), { body: { setVelocity() {}, reset() {} } }),
    hud: mockHud(),
    bullets: makeGroup(),
    musketBalls: makeGroup(),
    piedras: makeGroup(),
    espanoles: makeGroup(),
    sableArc: chainable(),
    controls: { held: Object.create(null), pressed: Object.create(null) },
    add: { text: () => chainable(), rectangle: () => chainable(), image: () => chainable(), graphics: () => chainable() },
    tweens: { add() {}, killTweensOf() {} },
    time: { delayedCall() {} },
    physics: { pause() {}, resume() {} },
    pauseScreen: { container: chainable(), buttons: [] },
    startScreen: { container: chainable(), buttons: [], leaderboard: { setText() {} } },
    leaderScreen: { container: chainable(), list: { setText() {} } },
    controlsScreen: { container: chainable() },
    endGame: {
      container: chainable(),
      rally: chainable(),
      summary: chainable(),
      saveStatus: chainable(),
      nameLabel: chainable(),
      nameValue: chainable(),
      instructions: chainable(),
      leaderboardTitle: chainable(),
      leaderboard: chainable(),
      gridLabels: [],
    },
  };
  return scene;
}

// --- la sesión ----------------------------------------------------------------

const scene = makeScene();
let oleadaAlCaer = 0;

test('título → nueva partida arranca limpio', () => {
  g.showStartScreen(scene);
  assert.equal(scene.state.phase, 'start');
  g.startRun(scene);
  assert.equal(scene.state.phase, 'playing');
  assert.equal(scene.state.run.lives, 3);
  assert.equal(scene.state.run.oleada, 1);
});

test('oleada 10+ se alcanza y la partida sobrevive sin errores', () => {
  const run = scene.state.run;
  // Punta del jugador: un disparo cada 170 ms (algo más lento que el arcade).
  let nextKillAt = 400;
  // Golpes de los españoles: a los 32 s, 40 s y 48 s cae el Patriota.
  const damageAt = [32000, 40000, 48000];
  let damageIndex = 0;

  for (let time = 0; time < 60000; time += 25) {
    if (time >= nextKillAt && scene.espanoles.list.length > 0) {
      const fallen = scene.espanoles.list.shift();
      fallen.destroy();
      run.score += g.pointsForKill(fallen.kind);
      nextKillAt = time + 170;
    }
    if (
      damageIndex < damageAt.length &&
      time >= damageAt[damageIndex] &&
      scene.state.phase === 'playing'
    ) {
      damageIndex += 1;
      g.applyDamage(scene, time);
    }
    if (scene.state.phase !== 'playing') {
      break;
    }
    g.scheduleOleadaSpawn(scene, time);
  }

  oleadaAlCaer = run.oleada;
  assert.ok(oleadaAlCaer >= 10, `reached oleada ${oleadaAlCaer}`);
  assert.ok(run.score > 0, `score was ${run.score}`);
  assert.ok(scene.state.run.lives === 0, `lives were ${scene.state.run.lives}`);
});

test('derrota pide iniciales porque la puntuación entra en la tabla', () => {
  assert.equal(scene.state.phase, 'gameover');
  assert.equal(
    g.qualifiesForHighScore(
      scene.state.run.score,
      scene.state.highScores,
    ),
    true,
  );
});

await asyncTest('iniciales → récord guardado → pantalla de guardado', async () => {
  scene.state.nameEntry.letters = ['P', 'A', 'B'];
  g.submitHighScore(scene);
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(scene.state.phase, 'saved');
  assert.equal(scene.state.highScores.length, 1);
  assert.equal(scene.state.highScores[0].name, 'PAB');
});

test('retry: START sobrevive una partida tras otra sin ensuciarse', () => {
  g.startRun(scene);
  assert.equal(scene.state.phase, 'playing');
  assert.equal(scene.state.run.lives, 3);
  assert.equal(scene.state.run.score, 0);
  assert.equal(scene.state.run.oleada, 1);
  assert.equal(scene.espanoles.getLength(), 0, 'the battlefield was swept');
  assert.equal(scene.bullets.getLength(), 0);
  assert.equal(scene.piedras.getLength(), 0);
});

test('el título siempre vuelve a su fase de atracción', () => {
  g.returnToStart(scene);
  assert.equal(scene.state.phase, 'start');
  g.startRun(scene);
  assert.equal(scene.state.phase, 'playing');
});

test('la batalla sigue creciendo sin romperse hasta la oleada 20', () => {
  const run = scene.state.run;
  for (let oleada = 10; oleada <= 20; oleada += 1) {
    g.beginOleada(run, oleada, 0);
    for (let i = 0; i < run.oleadaTotal; i += 1) {
      const kind = g.spawnKindAt(
        i,
        run.oleadaTotal,
        run.oleadaFusileros,
        run.oleadaJinetes,
      );
      g.spawnEspanol(scene, kind, i, 0);
      scene.espanoles.list.pop().destroy();
    }
    run.score += g.oleadaBonus(oleada);
    assert.ok(
      g.oleadaEnemySpeed(oleada) <= 1.3 + 1e-9,
      `enemy speed ${g.oleadaEnemySpeed(oleada)} on oleada ${oleada}`,
    );
  }
});

// --- summary ------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
