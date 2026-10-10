// Platanus Hack 26 — Batalla de Matasiete
// Un patriota defiende la isla de Margarita. Esqueleto del casco arcade:
// flujo completo (título → partida → pausa → derrota → iniciales → mejores
// puntuaciones), escenario árido y patriota placeholder con movimiento en 8 vías.

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const STORAGE_KEY = 'batalla-matasiete-highscores';
const MAX_HIGH_SCORES = 5;
const WINNING_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 8;
const MAX_SCORE = 1e9;
const PATRIOTA_SPEED = 170;
const FIRE_INTERVAL = 200;
const BULLET_SPEED = 460;
const BULLET_MARGIN = 12;

const FACING_ROTATION = {
  E: 0,
  SE: Math.PI / 4,
  S: Math.PI / 2,
  SW: (3 * Math.PI) / 4,
  W: Math.PI,
  NW: (-3 * Math.PI) / 4,
  N: -Math.PI / 2,
  NE: -Math.PI / 4,
};

const COLORS = {
  sand: 0xcdb276,
  sandDark: 0xb39a5f,
  sandDune: 0xc0a468,
  olive: 0x6f7a3a,
  oliveDark: 0x59632e,
  cactus: 0x3f6b2f,
  cactusDark: 0x2c4d20,
  stone: 0x8a8578,
  stoneDark: 0x5c584e,
  mountain: 0x7a6a4a,
  mountainDark: 0x584b34,
  frame: 0x3a3020,
  accent: 0xf2c14e,
  cell: 0x2a2214,
  overlay: 0x0d0b07,
  backdrop: 0x060504,
  patriota: 0xf2ead0,
  sash: 0xc0392b,
  skin: 0xd9a066,
  hat: 0x4a3c28,
};

const DEFEAT_LINES = [
  '¡La isla aún resiste, patriota!',
  '¡No dejes que Matasiete caiga!',
  '¡Margarita cuenta contigo!',
  '¡Aún queda lucha en la montaña!',
];

const LETTER_GRID = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
  ['O', 'P', 'Q', 'R', 'S', 'T', 'U'],
  ['V', 'W', 'X', 'Y', 'Z', '.', '-'],
  ['BORRAR', 'LISTO'],
];

// DO NOT replace existing keys — they match the physical arcade cabinet wiring.
// To add local testing shortcuts, append extra keys to any array.
const CABINET_KEYS = {
  P1_U: ['w'],
  P1_D: ['s'],
  P1_L: ['a'],
  P1_R: ['d'],
  P1_1: ['u'],
  P1_2: ['i'],
  P1_3: ['o'],
  P1_4: ['j'],
  P1_5: ['k'],
  P1_6: ['l'],
  P2_U: ['ArrowUp'],
  P2_D: ['ArrowDown'],
  P2_L: ['ArrowLeft'],
  P2_R: ['ArrowRight'],
  P2_1: ['r'],
  P2_2: ['t'],
  P2_3: ['y'],
  P2_4: ['f'],
  P2_5: ['g'],
  P2_6: ['h'],
  START1: ['Enter'],
  START2: ['2'],
};

const KEYBOARD_TO_ARCADE = {};
for (const [arcadeCode, keys] of Object.entries(CABINET_KEYS)) {
  for (const key of keys) {
    KEYBOARD_TO_ARCADE[normalizeIncomingKey(key)] = arcadeCode;
  }
}

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-root',
  backgroundColor: '#cdb276',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: {
    preload,
    create,
    update,
  },
};

new Phaser.Game(config);

function preload() {}

function create() {
  const scene = this;

  scene.state = {
    phase: 'loading',
    run: { score: 0, oleada: 1, facing: 'N', nextFireAt: 0 },
    highScores: [],
    saveStatus: 'Cargando puntuaciones...',
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
  };

  createStage(scene);
  createPatriota(scene);
  createBullets(scene);
  createHud(scene);
  createEndGameUi(scene);
  createStartScreen(scene);
  createLeaderboardScreen(scene);
  createControlsScreen(scene);
  createPauseScreen(scene);
  createControls(scene);
  showStartScreen(scene);

  loadHighScores()
    .then((highScores) => {
      scene.state.highScores = highScores;
      scene.state.saveStatus = 'Termina una partida para registrar tu puntuación.';
      refreshAllLeaderboards(scene);
    })
    .catch(() => {
      scene.state.highScores = [];
      scene.state.saveStatus = 'Almacenamiento no disponible. Se juega sin guardar.';
      refreshAllLeaderboards(scene);
    });
}

function update(time) {
  const scene = this;
  if (!scene.state) {
    return;
  }

  const phase = scene.state.phase;

  if (phase === 'start') {
    handleStartMenu(scene, time);
    return;
  }

  if (phase === 'leaderboard' || phase === 'controls') {
    if (consumeAnyPressedControl(scene, ['START1', 'START2', 'P1_1', 'P2_1', 'P1_2', 'P2_2'])) {
      closeAttractScreen(scene);
    }
    return;
  }

  if (phase === 'playing') {
    updatePatriota(scene, time);
    updateBullets(scene);
    if (consumeAnyPressedControl(scene, ['START1', 'START2'])) {
      pauseRun(scene);
    }
    return;
  }

  if (phase === 'paused') {
    handlePauseMenu(scene, time);
    return;
  }

  if (phase === 'gameover') {
    handleNameEntry(scene, time);
    return;
  }

  if (phase === 'saved') {
    if (consumeAnyPressedControl(scene, ['START1', 'START2', 'P1_1', 'P2_1'])) {
      returnToStart(scene);
    }
  }
}

// --- escenario y patriota -----------------------------------------------------

function createStage(scene) {
  const rng = new Phaser.Math.RandomDataGenerator([1817]);
  const g = scene.add.graphics();

  g.fillStyle(COLORS.mountainDark, 1);
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  g.fillStyle(COLORS.sand, 1);
  g.beginPath();
  g.moveTo(58, 46);
  for (let x = 58; x <= GAME_WIDTH - 58; x += 40) {
    g.lineTo(x, 40 + rng.integerInRange(-12, 12));
  }
  g.lineTo(GAME_WIDTH - 46, 60);
  for (let y = 60; y <= GAME_HEIGHT - 60; y += 40) {
    g.lineTo(GAME_WIDTH - 50 + rng.integerInRange(-12, 12), y);
  }
  g.lineTo(GAME_WIDTH - 58, GAME_HEIGHT - 46);
  for (let x = GAME_WIDTH - 58; x >= 58; x -= 40) {
    g.lineTo(x, GAME_HEIGHT - 40 + rng.integerInRange(-12, 12));
  }
  g.lineTo(46, GAME_HEIGHT - 60);
  for (let y = GAME_HEIGHT - 60; y >= 60; y -= 40) {
    g.lineTo(50 + rng.integerInRange(-12, 12), y);
  }
  g.closePath();
  g.fillPath();

  g.fillStyle(COLORS.mountain, 1);
  for (let i = 0; i < 26; i += 1) {
    const edge = rng.integerInRange(0, 3);
    const along = rng.integerInRange(70, edge % 2 === 0 ? GAME_HEIGHT - 70 : GAME_WIDTH - 70);
    const x = edge === 0 || edge === 2 ? along : edge === 1 ? 52 : GAME_WIDTH - 52;
    const y = edge === 0 ? 52 : edge === 2 ? GAME_HEIGHT - 52 : along;
    g.fillEllipse(x, y, rng.integerInRange(18, 40), rng.integerInRange(12, 26));
  }

  g.fillStyle(COLORS.sandDune, 0.55);
  for (let i = 0; i < 10; i += 1) {
    g.fillEllipse(
      rng.integerInRange(120, GAME_WIDTH - 120),
      rng.integerInRange(110, GAME_HEIGHT - 110),
      rng.integerInRange(60, 150),
      rng.integerInRange(18, 40),
    );
  }

  g.fillStyle(COLORS.sandDark, 0.5);
  for (let i = 0; i < 12; i += 1) {
    g.fillEllipse(
      rng.integerInRange(100, GAME_WIDTH - 100),
      rng.integerInRange(100, GAME_HEIGHT - 100),
      rng.integerInRange(10, 26),
      rng.integerInRange(6, 14),
    );
  }

  for (let i = 0; i < 8; i += 1) {
    const spot = safeSpot(rng);
    drawStone(g, spot.x, spot.y, rng);
  }

  for (let i = 0; i < 5; i += 1) {
    const spot = safeSpot(rng);
    drawCactus(g, spot.x, spot.y, rng);
  }

  for (let i = 0; i < 14; i += 1) {
    const spot = safeSpot(rng);
    g.fillStyle(COLORS.olive, 0.85);
    g.fillEllipse(spot.x, spot.y, rng.integerInRange(10, 22), rng.integerInRange(6, 12));
    g.fillStyle(COLORS.oliveDark, 0.7);
    g.fillEllipse(spot.x + 3, spot.y + 2, rng.integerInRange(6, 12), rng.integerInRange(4, 8));
  }

  g.generateTexture('escenario', GAME_WIDTH, GAME_HEIGHT);
  g.destroy();
  scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'escenario').setDepth(0);
}

function safeSpot(rng) {
  let x = 0;
  let y = 0;
  do {
    x = rng.integerInRange(90, GAME_WIDTH - 90);
    y = rng.integerInRange(90, GAME_HEIGHT - 90);
  } while (Math.hypot(x - GAME_WIDTH / 2, y - GAME_HEIGHT / 2) < 90);
  return { x, y };
}

function drawStone(g, x, y, rng) {
  const size = rng.integerInRange(10, 22);
  g.fillStyle(COLORS.stoneDark, 1);
  g.fillEllipse(x, y + 2, size, size * 0.62);
  g.fillStyle(COLORS.stone, 1);
  g.fillEllipse(x - 1, y - 1, size * 0.86, size * 0.52);
}

function drawCactus(g, x, y, rng) {
  const h = rng.integerInRange(20, 32);
  g.fillStyle(COLORS.cactusDark, 1);
  g.fillRoundedRect(x - 4, y - h / 2, 8, h, 4);
  g.fillStyle(COLORS.cactus, 1);
  g.fillRoundedRect(x - 3, y - h / 2 - 1, 5, h - 2, 3);
  const armY = y - h / 4;
  g.fillStyle(COLORS.cactus, 1);
  g.fillRoundedRect(x + 3, armY, 8, 5, 2.5);
  g.fillRoundedRect(x + 8, armY - 6, 5, 10, 2.5);
}

function createPatriota(scene) {
  const g = scene.add.graphics();

  g.fillStyle(COLORS.patriota, 1);
  g.fillRoundedRect(5, 6, 13, 12, 4);
  g.fillStyle(COLORS.sash, 1);
  g.fillRect(6, 11, 11, 3);
  g.fillStyle(COLORS.skin, 1);
  g.fillRoundedRect(8, 4, 5, 4, 1.5);
  g.fillRoundedRect(8, 16, 5, 4, 1.5);

  g.fillStyle(COLORS.hat, 1);
  g.fillCircle(11, 12, 5);
  g.fillStyle(COLORS.skin, 1);
  g.fillEllipse(13, 12, 5, 6);

  g.fillStyle(COLORS.frame, 1);
  g.fillRect(15, 11, 8, 2);
  g.fillStyle(0xcfc7b2, 1);
  g.fillCircle(22, 12, 1.5);

  g.generateTexture('patriota', 24, 24);
  g.destroy();

  const patriota = scene.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'patriota').setDepth(5);
  scene.physics.add.existing(patriota);
  patriota.body.setSize(14, 14);
  patriota.body.setOffset(5, 5);
  patriota.body.setAllowGravity(false);
  patriota.body.setCollideWorldBounds(true);
  patriota.body.setBounce(0, 0);
  patriota.setRotation(facingRotation('N'));
  scene.patriota = patriota;
}

function createBullets(scene) {
  const g = scene.add.graphics();
  g.fillStyle(COLORS.frame, 1);
  g.fillEllipse(8, 6, 16, 8);
  g.fillStyle(COLORS.accent, 1);
  g.fillEllipse(8, 6, 13, 5);
  g.fillStyle(0xfdf6e3, 1);
  g.fillEllipse(10, 5.5, 6, 2.6);
  g.generateTexture('bala', 16, 12);
  g.destroy();

  scene.bullets = scene.physics.add.group();
}

function fireBullet(scene) {
  const facing = scene.state.run.facing;
  const direction = facingVector(facing);
  const bullet = scene.bullets.create(
    scene.patriota.x + direction.x * 20,
    scene.patriota.y + direction.y * 20,
    'bala',
  );
  if (!bullet) {
    return;
  }
  bullet.setDepth(6);
  bullet.setRotation(facingRotation(facing));
  bullet.body.setAllowGravity(false);
  bullet.body.setVelocity(direction.x * BULLET_SPEED, direction.y * BULLET_SPEED);
}

function updateBullets(scene) {
  const children = scene.bullets.getChildren();
  for (let i = children.length - 1; i >= 0; i -= 1) {
    if (bulletOutOfBounds(children[i].x, children[i].y)) {
      children[i].destroy();
    }
  }
}

function clearBullets(scene) {
  const children = scene.bullets.getChildren().slice();
  for (const bullet of children) {
    bullet.destroy();
  }
}

function updatePatriota(scene, time) {
  const vector = getMoveVector(scene.controls);
  const body = scene.patriota.body;
  body.setVelocity(vector.x * PATRIOTA_SPEED, vector.y * PATRIOTA_SPEED);

  const run = scene.state.run;
  run.facing = nextFacing(run.facing, vector);
  scene.patriota.setRotation(facingRotation(run.facing));

  const shot = fireTick(isFiring(scene.controls), time, run.nextFireAt);
  run.nextFireAt = shot.nextFireAt;
  if (shot.fire) {
    fireBullet(scene);
    playSound(scene, 'shot');
  }
}

function getMoveVector(controls) {
  let x = 0;
  let y = 0;
  if (controls.held.P1_L || controls.held.P2_L) x -= 1;
  if (controls.held.P1_R || controls.held.P2_R) x += 1;
  if (controls.held.P1_U || controls.held.P2_U) y -= 1;
  if (controls.held.P1_D || controls.held.P2_D) y += 1;
  if (x !== 0 && y !== 0) {
    x *= Math.SQRT1_2;
    y *= Math.SQRT1_2;
  }
  return { x, y };
}

function facingFromVector(vector) {
  const x = vector.x;
  const y = vector.y;
  if (x === 0 && y === 0) {
    return null;
  }
  if (y === 0) {
    return x > 0 ? 'E' : 'W';
  }
  if (x === 0) {
    return y > 0 ? 'S' : 'N';
  }
  if (x > 0) {
    return y > 0 ? 'SE' : 'NE';
  }
  return y > 0 ? 'SW' : 'NW';
}

function nextFacing(facing, vector) {
  return facingFromVector(vector) || facing;
}

function facingRotation(facing) {
  const rotation = FACING_ROTATION[facing];
  return rotation === undefined ? 0 : rotation;
}

function facingVector(facing) {
  const rotation = facingRotation(facing);
  return { x: Math.cos(rotation), y: Math.sin(rotation) };
}

function isFiring(controls) {
  return Boolean(controls.held.P1_1 || controls.held.P2_1);
}

function fireTick(held, now, nextFireAt) {
  if (!held || now < nextFireAt) {
    return { fire: false, nextFireAt };
  }
  return { fire: true, nextFireAt: now + FIRE_INTERVAL };
}

function bulletOutOfBounds(x, y) {
  return (
    x < -BULLET_MARGIN ||
    x > GAME_WIDTH + BULLET_MARGIN ||
    y < -BULLET_MARGIN ||
    y > GAME_HEIGHT + BULLET_MARGIN
  );
}

// --- HUD ----------------------------------------------------------------------

function createHud(scene) {
  scene.hud = {};

  scene.hud.score = scene.add
    .text(28, 22, 'PUNTOS 0000', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#f2c14e',
      fontStyle: 'bold',
    })
    .setDepth(10);

  scene.hud.oleada = scene.add
    .text(GAME_WIDTH - 28, 22, 'OLEADA 01', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#f2ead0',
      fontStyle: 'bold',
    })
    .setOrigin(1, 0)
    .setDepth(10);

  scene.hud.status = scene.add
    .text(GAME_WIDTH / 2, GAME_HEIGHT - 20, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#f2ead0',
      align: 'center',
    })
    .setOrigin(0.5)
    .setDepth(10);
}

function refreshHud(scene) {
  scene.hud.score.setText(`PUNTOS ${String(scene.state.run.score).padStart(4, '0')}`);
  scene.hud.oleada.setText(`OLEADA ${String(scene.state.run.oleada).padStart(2, '0')}`);
}

function showOleadaSplash(scene, oleada) {
  const splash = scene.add
    .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, `¡OLEADA ${oleada}!`, {
      fontFamily: 'monospace',
      fontSize: '44px',
      color: '#f2c14e',
      fontStyle: 'bold',
      stroke: '#584b34',
      strokeThickness: 6,
    })
    .setOrigin(0.5)
    .setDepth(30);

  scene.tweens.add({
    targets: splash,
    alpha: 0.12,
    duration: 150,
    yoyo: true,
    repeat: 7,
  });
  scene.time.delayedCall(1700, () => {
    scene.tweens.killTweensOf(splash);
    splash.destroy();
  });
}

// --- flujo de partida ---------------------------------------------------------

function startRun(scene) {
  scene.startScreen.container.setVisible(false);
  scene.endGame.container.setVisible(false);
  scene.pauseScreen.container.setVisible(false);
  clearPressedControls(scene);

  scene.state.run = { score: 0, oleada: 1, facing: 'N', nextFireAt: 0 };
  clearBullets(scene);
  scene.patriota.body.reset(GAME_WIDTH / 2, GAME_HEIGHT / 2);
  scene.patriota.setRotation(facingRotation('N'));
  scene.patriota.setActive(true).setVisible(true);

  refreshHud(scene);
  scene.hud.status.setText('BOTÓN 1: DISPARAR   START: PAUSA');
  scene.state.phase = 'playing';
  scene.physics.resume();
  showOleadaSplash(scene, 1);
  playSound(scene, 'oleada');
}

function pauseRun(scene) {
  clearPressedControls(scene);
  scene.state.phase = 'paused';
  scene.patriota.body.setVelocity(0, 0);
  scene.physics.pause();
  scene.state.pauseMenu = { cursor: 0, cooldown: 0, lastAxis: 0 };
  updateMenuHighlight(scene.pauseScreen.buttons, 0);
  scene.pauseScreen.container.setVisible(true);
}

function resumeRun(scene) {
  clearPressedControls(scene);
  scene.pauseScreen.container.setVisible(false);
  scene.physics.resume();
  scene.state.phase = 'playing';
}

function finishRun(scene) {
  if (scene.state.phase !== 'playing' && scene.state.phase !== 'paused') {
    return;
  }

  scene.pauseScreen.container.setVisible(false);
  scene.patriota.body.setVelocity(0, 0);
  clearBullets(scene);
  scene.physics.pause();
  clearPressedControls(scene);
  scene.state.phase = 'gameover';
  scene.hud.status.setText('');

  scene.endGame.rally.setText(Phaser.Math.RND.pick(DEFEAT_LINES));
  scene.endGame.summary.setText(
    `PUNTOS ${String(scene.state.run.score).padStart(4, '0')} · OLEADA ${String(
      scene.state.run.oleada,
    ).padStart(2, '0')}`,
  );
  scene.endGame.saveStatus.setText(scene.state.saveStatus);
  scene.endGame.container.setVisible(true);

  scene.state.nameEntry.letters = [];
  scene.state.nameEntry.row = 0;
  scene.state.nameEntry.col = 0;
  scene.state.nameEntry.moveCooldownUntil = 0;
  scene.state.nameEntry.confirmCooldownUntil = 0;
  scene.state.nameEntry.lastMoveVector = { x: 0, y: 0 };
  refreshNameEntry(scene);
  updateLetterGridHighlight(scene);
  playSound(scene, 'defeat');
}

function returnToStart(scene) {
  scene.endGame.container.setVisible(false);
  refreshAllLeaderboards(scene);
  showStartScreen(scene);
}

// --- controles del gabinete ---------------------------------------------------

function createControls(scene) {
  scene.controls = {
    held: Object.create(null),
    pressed: Object.create(null),
  };

  const onKeyDown = (event) => {
    const key = normalizeIncomingKey(event.key);
    const arcadeCode = KEYBOARD_TO_ARCADE[key];
    if (!arcadeCode) {
      return;
    }
    if (!scene.controls.held[arcadeCode]) {
      scene.controls.pressed[arcadeCode] = true;
    }
    scene.controls.held[arcadeCode] = true;
  };

  const onKeyUp = (event) => {
    const arcadeCode = KEYBOARD_TO_ARCADE[normalizeIncomingKey(event.key)];
    if (!arcadeCode) {
      return;
    }
    scene.controls.held[arcadeCode] = false;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  scene.events.once('shutdown', () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  });
}

function normalizeIncomingKey(key) {
  if (typeof key !== 'string' || key.length === 0) {
    return '';
  }
  if (key === ' ') {
    return 'space';
  }
  return key.toLowerCase();
}

function consumeAnyPressedControl(scene, controlCodes) {
  for (const controlCode of controlCodes) {
    if (scene.controls.pressed[controlCode]) {
      scene.controls.pressed[controlCode] = false;
      return true;
    }
  }
  return false;
}

function clearPressedControls(scene) {
  scene.controls.pressed = Object.create(null);
}

function getHorizontalMenuAxis(controls) {
  let axis = 0;
  if (controls.held.P1_L || controls.held.P2_L) axis -= 1;
  if (controls.held.P1_R || controls.held.P2_R) axis += 1;
  return Phaser.Math.Clamp(axis, -1, 1);
}

function getVerticalMenuAxis(controls) {
  let axis = 0;
  if (controls.held.P1_U || controls.held.P2_U) axis -= 1;
  if (controls.held.P1_D || controls.held.P2_D) axis += 1;
  return Phaser.Math.Clamp(axis, -1, 1);
}

// --- pantalla de inicio (atracción) -------------------------------------------

function createStartScreen(scene) {
  scene.startScreen = {};
  const c = scene.add.container(0, 0).setDepth(15);
  scene.startScreen.container = c;

  c.add(scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.overlay, 0.96));

  c.add(
    scene.add
      .text(GAME_WIDTH / 2, 44, 'PLATANUS HACK 26 · EDICIÓN CARACAS', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#b39a5f',
      })
      .setOrigin(0.5),
  );

  const marqueeTop = scene.add
    .text(GAME_WIDTH / 2, 100, 'BATALLA DE', {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: '#f2ead0',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);
  const marqueeBottom = scene.add
    .text(GAME_WIDTH / 2, 150, 'MATASIETE', {
      fontFamily: 'monospace',
      fontSize: '52px',
      color: '#f2c14e',
      fontStyle: 'bold',
      stroke: '#584b34',
      strokeThickness: 5,
    })
    .setOrigin(0.5);
  c.add(marqueeTop);
  c.add(marqueeBottom);
  scene.tweens.add({
    targets: [marqueeTop, marqueeBottom],
    scale: 1.03,
    alpha: 0.88,
    duration: 1100,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  scene.startScreen.buttons = createMenuButtons(
    scene,
    c,
    ['JUGAR', 'MEJORES PUNTUAJES', '¿CONTROLES?'],
    236,
    48,
    300,
  );

  c.add(
    scene.add
      .text(GAME_WIDTH / 2, 396, 'MEJORES PUNTUAJES', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#f2c14e',
        fontStyle: 'bold',
      })
      .setOrigin(0.5),
  );
  scene.startScreen.leaderboard = scene.add
    .text(GAME_WIDTH / 2, 418, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#f2ead0',
      align: 'center',
      lineSpacing: 4,
    })
    .setOrigin(0.5, 0);
  c.add(scene.startScreen.leaderboard);

  c.add(
    scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 22, 'JOYSTICK: MOVER   BOTÓN 1 / START: CONFIRMAR', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#8a7a50',
      })
      .setOrigin(0.5),
  );

  c.setVisible(false);
}

function createMenuButtons(scene, container, labels, yStart, yStep, width) {
  const buttons = [];
  for (let i = 0; i < labels.length; i += 1) {
    const y = yStart + i * yStep;
    const bg = scene.add.rectangle(GAME_WIDTH / 2, y, width, 40, COLORS.cell, 0.95);
    bg.setStrokeStyle(2, COLORS.frame, 0.8);
    const label = scene.add
      .text(GAME_WIDTH / 2, y, labels[i], {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#f2ead0',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    container.add(bg);
    container.add(label);
    buttons.push({ bg, label });
  }
  return buttons;
}

function updateMenuHighlight(buttons, cursor) {
  buttons.forEach(({ bg, label }, i) => {
    const active = i === cursor;
    bg.setFillStyle(active ? COLORS.accent : COLORS.cell, active ? 1 : 0.95);
    bg.setStrokeStyle(2, active ? COLORS.sand : COLORS.frame, active ? 1 : 0.8);
    label.setColor(active ? '#2a2214' : '#f2ead0');
  });
}

function handleMenuNavigation(scene, time, menu, buttonCount) {
  const axisY = getVerticalMenuAxis(scene.controls);
  let moved = false;

  if (time >= menu.cooldown && axisY !== 0 && menu.lastAxis !== axisY) {
    menu.cursor = Phaser.Math.Wrap(menu.cursor + axisY, 0, buttonCount);
    menu.cooldown = time + 160;
    moved = true;
    playSound(scene, 'click');
  }
  menu.lastAxis = axisY;
  return moved;
}

function showStartScreen(scene) {
  clearPressedControls(scene);
  scene.state.phase = 'start';
  scene.state.menu = { cursor: 0, cooldown: 0, lastAxis: 0 };
  refreshStartScreenLeaderboard(scene);
  updateMenuHighlight(scene.startScreen.buttons, scene.state.menu.cursor);
  scene.startScreen.container.setVisible(true);
}

function handleStartMenu(scene, time) {
  const menu = scene.state.menu;
  if (handleMenuNavigation(scene, time, menu, scene.startScreen.buttons.length)) {
    updateMenuHighlight(scene.startScreen.buttons, menu.cursor);
  }

  if (consumeAnyPressedControl(scene, ['P1_1', 'P2_1', 'START1', 'START2'])) {
    playSound(scene, 'select');
    startAmbientMusic(scene);
    if (menu.cursor === 0) {
      startRun(scene);
    } else if (menu.cursor === 1) {
      showLeaderboardScreen(scene);
    } else {
      showControlsScreen(scene);
    }
  }
}

// --- pantallas de atracción ---------------------------------------------------

function createLeaderboardScreen(scene) {
  scene.leaderScreen = {};
  const c = scene.add.container(0, 0).setDepth(16);
  scene.leaderScreen.container = c;

  c.add(scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.overlay, 0.98));
  c.add(
    scene.add
      .text(GAME_WIDTH / 2, 90, 'MEJORES PUNTUAJES', {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: '#f2c14e',
        fontStyle: 'bold',
      })
      .setOrigin(0.5),
  );

  scene.leaderScreen.list = scene.add
    .text(GAME_WIDTH / 2, 170, '', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#f2ead0',
      align: 'center',
      lineSpacing: 14,
    })
    .setOrigin(0.5, 0);
  c.add(scene.leaderScreen.list);

  c.add(
    scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 28, 'PULSA START PARA VOLVER', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#8a7a50',
      })
      .setOrigin(0.5),
  );

  c.setVisible(false);
}

function showLeaderboardScreen(scene) {
  clearPressedControls(scene);
  scene.leaderScreen.list.setText(formatHighScores(scene.state.highScores).join('\n'));
  scene.startScreen.container.setVisible(false);
  scene.leaderScreen.container.setVisible(true);
  scene.state.phase = 'leaderboard';
}

function createControlsScreen(scene) {
  scene.controlsScreen = {};
  const c = scene.add.container(0, 0).setDepth(16);
  scene.controlsScreen.container = c;

  c.add(scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.overlay, 0.98));
  c.add(
    scene.add
      .text(GAME_WIDTH / 2, 100, '¿CONTROLES?', {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: '#f2c14e',
        fontStyle: 'bold',
      })
      .setOrigin(0.5),
  );

  const lines = [
    'JOYSTICK ....... MOVER · ELEGIR',
    'BOTÓN 1 ........ CONFIRMAR',
    'START .......... PAUSA · COMENZAR',
    '',
    'EN COMBATE',
    'JOYSTICK ....... MOVER · MIRAR',
    'BOTÓN 1 ........ DISPARAR (SOSTENER)',
    '',
    'EN PAUSA',
    'JOYSTICK ....... ELEGIR OPCIÓN',
    'START .......... CONFIRMAR',
    '',
    'RENDIRSE TERMINA LA PARTIDA',
  ];
  c.add(
    scene.add
      .text(GAME_WIDTH / 2, 180, lines.join('\n'), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#f2ead0',
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5, 0),
  );

  c.add(
    scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 28, 'PULSA START PARA VOLVER', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#8a7a50',
      })
      .setOrigin(0.5),
  );

  c.setVisible(false);
}

function showControlsScreen(scene) {
  clearPressedControls(scene);
  scene.startScreen.container.setVisible(false);
  scene.controlsScreen.container.setVisible(true);
  scene.state.phase = 'controls';
}

function closeAttractScreen(scene) {
  scene.leaderScreen.container.setVisible(false);
  scene.controlsScreen.container.setVisible(false);
  showStartScreen(scene);
}

function refreshStartScreenLeaderboard(scene) {
  scene.startScreen.leaderboard.setText(formatHighScores(scene.state.highScores).join('\n'));
}

function refreshLeaderboard(scene) {
  scene.endGame.leaderboard.setText(formatHighScores(scene.state.highScores).join('\n'));
}

function refreshAllLeaderboards(scene) {
  refreshStartScreenLeaderboard(scene);
  refreshLeaderboard(scene);
}

function formatHighScores(entries) {
  if (!entries.length) {
    return ['SIN PUNTOS AÚN'];
  }
  return entries.map((entry, index) => {
    const rank = String(index + 1).padStart(2, '0');
    const name = entry.name.padEnd(3, ' ');
    const score = String(entry.score).padStart(5, '0');
    return `${rank} ${name} ${score}`;
  });
}

// --- pausa --------------------------------------------------------------------

function createPauseScreen(scene) {
  scene.pauseScreen = {};
  const c = scene.add.container(0, 0).setDepth(25);
  scene.pauseScreen.container = c;

  c.add(scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.overlay, 0.85));
  c.add(
    scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, 'PAUSA', {
        fontFamily: 'monospace',
        fontSize: '52px',
        color: '#f2c14e',
        fontStyle: 'bold',
      })
      .setOrigin(0.5),
  );

  scene.pauseScreen.buttons = createMenuButtons(
    scene,
    c,
    ['CONTINUAR', 'RENDIRSE'],
    GAME_HEIGHT / 2 - 10,
    52,
    280,
  );

  c.add(
    scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120, 'JOYSTICK: ELEGIR   START: CONFIRMAR', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#8a7a50',
      })
      .setOrigin(0.5),
  );

  c.setVisible(false);
}

function handlePauseMenu(scene, time) {
  const menu = scene.state.pauseMenu;
  if (handleMenuNavigation(scene, time, menu, scene.pauseScreen.buttons.length)) {
    updateMenuHighlight(scene.pauseScreen.buttons, menu.cursor);
  }

  if (consumeAnyPressedControl(scene, ['START1', 'START2', 'P1_1', 'P2_1'])) {
    playSound(scene, 'select');
    if (menu.cursor === 0) {
      resumeRun(scene);
    } else {
      finishRun(scene);
    }
  }
}

// --- derrota e iniciales ------------------------------------------------------

function createEndGameUi(scene) {
  scene.endGame = {};
  const c = scene.add.container(0, 0).setDepth(20);
  scene.endGame.container = c;

  c.add(scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.backdrop, 0.98));

  scene.endGame.title = scene.add
    .text(GAME_WIDTH / 2, 64, '¡DERROTA!', {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: '#c0392b',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);

  scene.endGame.rally = scene.add
    .text(GAME_WIDTH / 2, 112, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#f2c14e',
      align: 'center',
    })
    .setOrigin(0.5);

  scene.endGame.summary = scene.add
    .text(GAME_WIDTH / 2, 144, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#f2ead0',
      align: 'center',
    })
    .setOrigin(0.5);

  scene.endGame.nameLabel = scene.add
    .text(GAME_WIDTH / 2, 180, 'INICIALES', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#8a7a50',
      align: 'center',
    })
    .setOrigin(0.5);

  scene.endGame.nameValue = scene.add
    .text(GAME_WIDTH / 2, 214, '___', {
      fontFamily: 'monospace',
      fontSize: '34px',
      color: '#f2c14e',
      fontStyle: 'bold',
      align: 'center',
      letterSpacing: 10,
    })
    .setOrigin(0.5);

  scene.endGame.instructions = scene.add
    .text(GAME_WIDTH / 2, 246, 'MOVER: ELEGIR   BOTÓN 1: CONFIRMAR', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#8a7a50',
      align: 'center',
    })
    .setOrigin(0.5);

  scene.endGame.leaderboardTitle = scene.add
    .text(GAME_WIDTH / 2, 280, 'MEJORES PUNTUAJES', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#f2c14e',
      fontStyle: 'bold',
      align: 'center',
    })
    .setOrigin(0.5);

  scene.endGame.leaderboard = scene.add
    .text(GAME_WIDTH / 2, 300, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#f2ead0',
      align: 'center',
      lineSpacing: 3,
    })
    .setOrigin(0.5, 0);

  scene.endGame.gridLabels = [];
  for (let row = 0; row < LETTER_GRID.length; row += 1) {
    const rowValues = LETTER_GRID[row];
    const rowWidth = rowValues.length * 58;
    for (let col = 0; col < rowValues.length; col += 1) {
      const value = rowValues[col];
      const cellX = GAME_WIDTH / 2 - rowWidth / 2 + 29 + col * 58;
      const cellY = 408 + row * 30;
      const wide = value.length > 1;

      const cell = scene.add.rectangle(cellX, cellY, wide ? 96 : 42, 24, COLORS.cell, 0.95);
      cell.setStrokeStyle(2, COLORS.frame, 0.8);

      const label = scene.add
        .text(cellX, cellY, value, {
          fontFamily: 'monospace',
          fontSize: wide ? '13px' : '18px',
          color: '#f2ead0',
          fontStyle: 'bold',
          align: 'center',
        })
        .setOrigin(0.5);

      scene.endGame.gridLabels.push({ cell, label, row, col, value });
      c.add(cell);
      c.add(label);
    }
  }

  scene.endGame.saveStatus = scene.add
    .text(GAME_WIDTH / 2, 584, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#f2c14e',
      align: 'center',
    })
    .setOrigin(0.5);

  c.add(scene.endGame.title);
  c.add(scene.endGame.rally);
  c.add(scene.endGame.summary);
  c.add(scene.endGame.nameLabel);
  c.add(scene.endGame.nameValue);
  c.add(scene.endGame.instructions);
  c.add(scene.endGame.leaderboardTitle);
  c.add(scene.endGame.leaderboard);
  c.add(scene.endGame.saveStatus);

  c.setVisible(false);
}

function handleNameEntry(scene, time) {
  const entry = scene.state.nameEntry;
  const axisX = getHorizontalMenuAxis(scene.controls);
  const axisY = getVerticalMenuAxis(scene.controls);

  if (
    time >= entry.moveCooldownUntil &&
    (axisX !== 0 || axisY !== 0) &&
    (entry.lastMoveVector.x !== axisX || entry.lastMoveVector.y !== axisY)
  ) {
    moveLetterSelection(scene, axisX, axisY);
    entry.moveCooldownUntil = time + 160;
    playSound(scene, 'click');
  }

  if (axisX === 0 && axisY === 0) {
    entry.lastMoveVector = { x: 0, y: 0 };
  } else {
    entry.lastMoveVector = { x: axisX, y: axisY };
  }

  if (
    time >= entry.confirmCooldownUntil &&
    consumeAnyPressedControl(scene, ['P1_1', 'P2_1', 'START1', 'START2'])
  ) {
    entry.confirmCooldownUntil = time + 180;
    playSound(scene, 'select');
    activateCurrentLetter(scene);
  }
}

function moveLetterSelection(scene, axisX, axisY) {
  const entry = scene.state.nameEntry;

  if (axisY !== 0) {
    entry.row = Phaser.Math.Wrap(entry.row + axisY, 0, LETTER_GRID.length);
    entry.col = Math.min(entry.col, LETTER_GRID[entry.row].length - 1);
  }
  if (axisX !== 0) {
    entry.col = Phaser.Math.Wrap(entry.col + axisX, 0, LETTER_GRID[entry.row].length);
  }

  updateLetterGridHighlight(scene);
}

function updateLetterGridHighlight(scene) {
  const entry = scene.state.nameEntry;
  for (const item of scene.endGame.gridLabels) {
    const active = item.row === entry.row && item.col === entry.col;
    item.cell.setFillStyle(active ? COLORS.accent : COLORS.cell, active ? 1 : 0.95);
    item.cell.setStrokeStyle(2, active ? COLORS.sand : COLORS.frame, active ? 1 : 0.8);
    item.label.setColor(active ? '#2a2214' : '#f2ead0');
  }
}

function activateCurrentLetter(scene) {
  const entry = scene.state.nameEntry;
  const selectedValue = LETTER_GRID[entry.row][entry.col];

  if (selectedValue === 'BORRAR') {
    entry.letters.pop();
    refreshNameEntry(scene);
    return;
  }

  if (selectedValue === 'LISTO') {
    if (entry.letters.length === 0) {
      scene.endGame.saveStatus.setText('Elige al menos un carácter antes de guardar.');
      return;
    }
    submitHighScore(scene);
    return;
  }

  if (entry.letters.length >= WINNING_NAME_LENGTH) {
    entry.letters.shift();
  }
  entry.letters.push(selectedValue);
  refreshNameEntry(scene);
}

function refreshNameEntry(scene) {
  const letters = scene.state.nameEntry.letters.slice();
  while (letters.length < WINNING_NAME_LENGTH) {
    letters.push('_');
  }
  scene.endGame.nameValue.setText(letters.join(' '));
}

function submitHighScore(scene) {
  if (scene.state.phase !== 'gameover') {
    return;
  }

  const initials =
    scene.state.nameEntry.letters.join('').slice(0, WINNING_NAME_LENGTH) || '???';

  const entry = {
    name: initials,
    score: scene.state.run.score,
    savedAt: new Date().toISOString().slice(0, 10),
  };

  scene.state.saveStatus = `¡Guardado ${initials}! Pulsa START para otra partida.`;
  scene.endGame.saveStatus.setText(scene.state.saveStatus);
  clearPressedControls(scene);
  scene.state.phase = 'saved';

  persistHighScore(entry)
    .then((nextScores) => {
      scene.state.highScores = nextScores;
      refreshAllLeaderboards(scene);
    })
    .catch(() => {
      scene.state.saveStatus = 'No se pudo guardar, pero la partida cuenta.';
      if (scene.state.phase === 'saved') {
        scene.endGame.saveStatus.setText(scene.state.saveStatus);
      }
    });
}

// --- almacenamiento -----------------------------------------------------------

function rankHighScores(entries) {
  return entries
    .slice()
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.savedAt < right.savedAt ? 1 : -1;
    })
    .slice(0, MAX_HIGH_SCORES);
}

async function persistHighScore(entry) {
  const existing = await loadHighScores();
  const nextScores = rankHighScores(existing.concat(entry));
  await storageSet(STORAGE_KEY, nextScores);
  return nextScores;
}

async function loadHighScores() {
  const result = await storageGet(STORAGE_KEY);
  if (!result.found || !Array.isArray(result.value)) {
    return [];
  }
  return result.value.filter(isHighScoreEntry).slice(0, MAX_HIGH_SCORES);
}

function isHighScoreEntry(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof value.name === 'string' &&
      value.name.length > 0 &&
      value.name.length <= MAX_NAME_LENGTH &&
      typeof value.score === 'number' &&
      isFinite(value.score) &&
      value.score >= 0 &&
      value.score <= MAX_SCORE &&
      typeof value.savedAt === 'string',
  );
}

function getStorage() {
  if (window.platanusArcadeStorage) {
    return window.platanusArcadeStorage;
  }

  return {
    async get(key) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw === null
          ? { found: false, value: null }
          : { found: true, value: JSON.parse(raw) };
      } catch {
        return { found: false, value: null };
      }
    },
    async set(key, value) {
      window.localStorage.setItem(key, JSON.stringify(value));
    },
  };
}

async function storageGet(key) {
  return getStorage().get(key);
}

async function storageSet(key, value) {
  return getStorage().set(key, value);
}

// --- audio --------------------------------------------------------------------

function startAmbientMusic(scene) {
  if (scene.state.musicStarted) {
    return;
  }
  scene.state.musicStarted = true;

  try {
    const ctx = scene.sound.context;
    if (!ctx) {
      return;
    }

    const out = ctx.createGain();
    out.gain.value = 0.16;
    out.connect(ctx.destination);

    const dly = ctx.createDelay(2);
    const dlFb = ctx.createGain();
    dly.delayTime.value = 0.48;
    dlFb.gain.value = 0.28;
    dly.connect(dlFb);
    dlFb.connect(dly);
    dlFb.connect(out);

    const padFilt = ctx.createBiquadFilter();
    padFilt.type = 'lowpass';
    padFilt.frequency.value = 800;
    padFilt.Q.value = 1.4;
    padFilt.connect(out);
    padFilt.connect(dly);

    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 0.055;
    lfoG.gain.value = 430;
    lfo.connect(lfoG);
    lfoG.connect(padFilt.frequency);
    lfo.start();

    [
      [110, 0, 'sawtooth'],
      [110, 11, 'sawtooth'],
      [110, -11, 'sawtooth'],
      [130.81, 0, 'triangle'],
      [164.81, 5, 'triangle'],
      [196, -4, 'triangle'],
    ].forEach(([f, d, type]) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = f;
      osc.detune.value = d;
      g.gain.value = 0.028;
      osc.connect(g);
      g.connect(padFilt);
      osc.start();
    });

    const ARP = [220, 261.63, 293.66, 329.63, 392, 440, 392, 329.63, 293.66, 261.63];
    const STEP = 0.43;
    const ALEN = ARP.length * STEP;

    function scheduleArp(t0) {
      ARP.forEach((freq, i) => {
        const t = t0 + i * STEP;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        osc.connect(g);
        g.connect(out);
        g.connect(dly);
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.044, t + 0.018);
        g.gain.exponentialRampToValueAtTime(0.0001, t + STEP * 0.65);
        osc.start(t);
        osc.stop(t + STEP * 0.72);
      });
      scene.time.delayedCall((ALEN - 0.06) * 1000, () => scheduleArp(t0 + ALEN));
    }

    const BEAT = 1.0;
    function scheduleBass(t) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 55;
      osc.connect(g);
      g.connect(out);
      g.gain.setValueAtTime(0.26, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.55);
      scene.time.delayedCall(BEAT * 1000, () => scheduleBass(t + BEAT));
    }

    const t0 = ctx.currentTime + 0.3;
    scheduleArp(t0);
    scheduleBass(t0);
  } catch (_) {}
}

function playSound(scene, type) {
  try {
    const ctx = scene.sound && scene.sound.context ? scene.sound.context : new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'click') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'select') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'oleada') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.09);
      osc.frequency.setValueAtTime(784, now + 0.18);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      osc.start(now);
      osc.stop(now + 0.34);
    } else if (type === 'shot') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.07);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === 'defeat') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.6);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc.start(now);
      osc.stop(now + 0.65);
    }
  } catch (_) {}
}
