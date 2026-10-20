// Platanus Hack 26 — Batalla de Matasiete
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const STORAGE_KEY = "batalla-matasiete-highscores";
const MAX_HIGH_SCORES = 5;
const WINNING_NAME_LENGTH = 3;
const NAME_PATTERN = new RegExp(`^[A-Z]{1,${WINNING_NAME_LENGTH}}$`);
const MAX_SCORE = 1e9;
const PATRIOTA_SPEED = 170;
const FIRE_INTERVAL = 200;
const SABLE_COOLDOWN = 400;
const SABLE_RANGE = 60;
const SABLE_HALF_ARC = Math.PI / 4;
// El tajo sigue activo mientras se ve el barrido, no solo en el primer frame.
const SABLE_ACTIVE_MS = 200;
const BULLET_SPEED = 460;
const BULLET_MARGIN = 12;
const LANCERO_SPEED = 64;
const LANCERO_HP = 2;
const LANCERO_SCORE = 100;
const FUSILERO_SPEED = 58;
const FUSILERO_HP = 2;
const FUSILERO_SCORE = 200;
const FUSILERO_RANGE = 230;
const FUSILERO_FROM_OLEADA = 2;
const FUSILERO_AIM_MS = 550;
const FUSILERO_COOLDOWN_MS = 1800;
const MUSKET_SPEED = 190;
const MUSKET_HIT_RANGE = 20;
const JINETE_SPEED = 150;
const JINETE_HP = 1;
const JINETE_SCORE = 150;
const JINETE_FROM_OLEADA = 3;
const JINETE_DASH_SPEED = 320;
const JINETE_DASH_MS = 450;
const JINETE_STUN_MS = 700;
const JINETE_EDGES = [1, 3];
const PIEDRA_STEP = 1500;
const PIEDRA_SPEED = 300;
const PIEDRA_HIT_RANGE = 44;
const PIEDRA_MARGIN = 24;
const PIEDRA_BAR = 620;
const PIEDRA_SPIN = 0.18;
const PIEDRA_ICON_SCALE = 0.5;
const PIEDRA_ICON_POP = 0.72;
const OLEADA_BASE_COUNT = 3;
const OLEADA_COUNT_CAP = 20;
const OLEADA_SPAWN_MS = 500;
const OLEADA_SPEED_CAP = 1.5;
const OLEADA_SPEED_STEP = 0.1;
const OLEADA_ENEMY_STEP = 0.05;
const OLEADA_ENEMY_CAP = 1.3;
const OLEADA_LULL_MS = 1500;
const OLEADA_BONUS = 50;
const CONTACT_RANGE = 22;
const HIT_RANGE = 22;
const LIVES_TOTAL = 3;
const INVULN_MS = 2000;
const BLINK_MS = 120;
const KNOCK_SPEED = 400;
const KNOCK_MS = 200;
const SPAWN_MARGIN = 60;
const SPAWN_OFFSET = 16;
const MUSIC_DUCK = 0.35;

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
  stoneLight: 0xb5afa0,
  mountain: 0x7a6a4a,
  mountainDark: 0x584b34,
  frame: 0x3a3020,
  accent: 0xf2c14e,
  teal: 0x3fd0c0,
  tealDark: 0x1f8f87,
  cell: 0x2a2214,
  overlay: 0x0d0b07,
  backdrop: 0x060504,
  patriota: 0xf2ead0,
  sash: 0xc0392b,
  skin: 0xd9a066,
  hat: 0x4a3c28,
  royalist: 0x3c5a8e,
  royalistDark: 0x2a4066,
  trim: 0xe8e4d8,
  horse: 0x6b4a2f,
  horseDark: 0x432e1c,
  heart: 0xe74c3c,
  leather: 0x241c12,
  dim: 0x8a7a50,
};

const {
  sand,
  sandDark,
  sandDune,
  olive,
  oliveDark,
  cactus,
  cactusDark,
  stone,
  stoneDark,
  stoneLight,
  mountain,
  mountainDark,
  frame,
  accent,
  teal,
  tealDark,
  cell,
  overlay,
  backdrop,
  patriota,
  sash,
  skin,
  hat,
  royalist,
  royalistDark,
  trim,
  horse,
  horseDark,
  heart,
  leather,
  dim,
} = COLORS;

const DEFEAT_LINES = [
  "¡La isla aún resiste, patriota!",
  "¡No dejes que Matasiete caiga!",
  "¡Margarita cuenta contigo!",
  "¡Aún queda lucha en la montaña!",
];

// Solo A-Z: el tablero pide tres iniciales, sin puntos ni guiones.
const LETTER_GRID = [
  ["A", "B", "C", "D", "E", "F", "G"],
  ["H", "I", "J", "K", "L", "M", "N"],
  ["O", "P", "Q", "R", "S", "T", "U"],
  ["V", "W", "X", "Y", "Z"],
  ["BORRAR", "LISTO"],
];

// DO NOT replace existing keys — they match the physical arcade cabinet wiring.
// To add local testing shortcuts, append extra keys to any array.
const CABINET_KEYS = {
  P1_U: ["w"],
  P1_D: ["s"],
  P1_L: ["a"],
  P1_R: ["d"],
  P1_1: ["u"],
  P1_2: ["i"],
  P1_3: ["o"],
  P1_4: ["j"],
  P1_5: ["k"],
  P1_6: ["l"],
  P2_U: ["ArrowUp"],
  P2_D: ["ArrowDown"],
  P2_L: ["ArrowLeft"],
  P2_R: ["ArrowRight"],
  P2_1: ["r"],
  P2_2: ["t"],
  P2_3: ["y"],
  P2_4: ["f"],
  P2_5: ["g"],
  P2_6: ["h"],
  START1: ["Enter"],
  START2: ["2"],
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
  parent: "game-root",
  backgroundColor: "#cdb276",
  // La fuente de píxel usa filtrado NEAREST (ver makeFont) y todo se redondea
  // a píxeles enteros: el texto queda nítido y el fondo conserva su trazo suave.
  roundPixels: true,
  physics: {
    default: "arcade",
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
    phase: "loading",
    run: freshRun(),
    highScores: [],
    saveStatus: "Cargando puntuaciones...",
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
  };

  makeFont(scene);
  createHearts(scene);
  createStage(scene);
  createPatriota(scene);
  createBullets(scene);
  createSable(scene);
  createPiedra(scene);
  createEspanoles(scene);
  createMusketBalls(scene);
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
      scene.state.saveStatus =
        "Termina una partida para registrar tu puntuación.";
      refreshAllLeaderboards(scene);
    })
    .catch(() => {
      scene.state.highScores = [];
      scene.state.saveStatus =
        "Almacenamiento no disponible. Se juega sin guardar.";
      refreshAllLeaderboards(scene);
    });
}

function update(time) {
  const scene = this;
  if (!scene.state) {
    return;
  }

  const phase = scene.state.phase;

  if (phase === "start") {
    handleStartMenu(scene, time);
    return;
  }

  if (phase === "leaderboard" || phase === "controls") {
    if (
      consumeAnyPressedControl(scene, [
        "START1",
        "START2",
        "P1_1",
        "P2_1",
        "P1_2",
        "P2_2",
      ])
    ) {
      closeAttractScreen(scene);
    }
    return;
  }

  if (phase === "playing") {
    updatePatriota(scene, time);
    updateBullets(scene);
    updateEspanoles(scene, time);
    updateMusketBalls(scene);
    resolveBulletHits(scene);
    resolveMusketHits(scene, time);
    updatePiedras(scene);
    checkContactDamage(scene, time);
    if (scene.state.phase !== "playing") {
      return;
    }
    scheduleOleadaSpawn(scene, time);
    if (consumeAnyPressedControl(scene, ["START1", "START2"])) {
      pauseRun(scene);
    }
    return;
  }

  if (phase === "paused") {
    handlePauseMenu(scene, time);
    return;
  }

  if (phase === "gameover") {
    handleNameEntry(scene, time);
    return;
  }

  if (phase === "saved") {
    if (consumeAnyPressedControl(scene, ["START1", "START2"])) {
      startRun(scene);
      return;
    }
    if (consumeAnyPressedControl(scene, ["P1_1", "P2_1"])) {
      returnToStart(scene);
    }
  }
}

// --- escenario y patriota -----------------------------------------------------

function createStage(scene) {
  const rng = new Phaser.Math.RandomDataGenerator([1817]);
  const g = scene.add.graphics();

  g.fillStyle(mountainDark, 1);
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  g.fillStyle(sand, 1);
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

  g.fillStyle(mountain, 1);
  for (let i = 0; i < 26; i += 1) {
    const edge = rng.integerInRange(0, 3);
    const along = rng.integerInRange(
      70,
      edge % 2 === 0 ? GAME_HEIGHT - 70 : GAME_WIDTH - 70,
    );
    const x =
      edge === 0 || edge === 2 ? along : edge === 1 ? 52 : GAME_WIDTH - 52;
    const y = edge === 0 ? 52 : edge === 2 ? GAME_HEIGHT - 52 : along;
    g.fillEllipse(x, y, rng.integerInRange(18, 40), rng.integerInRange(12, 26));
  }

  g.fillStyle(sandDune, 0.55);
  for (let i = 0; i < 10; i += 1) {
    g.fillEllipse(
      rng.integerInRange(120, GAME_WIDTH - 120),
      rng.integerInRange(110, GAME_HEIGHT - 110),
      rng.integerInRange(60, 150),
      rng.integerInRange(18, 40),
    );
  }

  g.fillStyle(sandDark, 0.5);
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
    g.fillStyle(olive, 0.85);
    g.fillEllipse(
      spot.x,
      spot.y,
      rng.integerInRange(10, 22),
      rng.integerInRange(6, 12),
    );
    g.fillStyle(oliveDark, 0.7);
    g.fillEllipse(
      spot.x + 3,
      spot.y + 2,
      rng.integerInRange(6, 12),
      rng.integerInRange(4, 8),
    );
  }

  g.generateTexture("escenario", GAME_WIDTH, GAME_HEIGHT);
  g.destroy();
  scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "escenario").setDepth(0);
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
  const size = rng.integerInRange(14, 32);
  g.fillStyle(stoneDark, 1);
  g.fillEllipse(x, y + 3, size, size * 0.62);
  g.fillStyle(stone, 1);
  g.fillEllipse(x - 1, y - 1, size * 0.86, size * 0.52);
  g.fillStyle(stoneLight, 1);
  g.fillEllipse(x - size * 0.2, y - size * 0.22, size * 0.3, size * 0.18);
}

function drawCactus(g, x, y, rng) {
  const h = rng.integerInRange(30, 46);
  g.fillStyle(cactusDark, 1);
  g.fillRoundedRect(x - 6, y - h / 2, 12, h, 6);
  g.fillStyle(cactus, 1);
  g.fillRoundedRect(x - 4, y - h / 2 - 1, 7, h - 2, 4);
  const armY = y - h / 4;
  g.fillStyle(cactus, 1);
  g.fillRoundedRect(x + 4, armY, 12, 7, 3.5);
  g.fillRoundedRect(x + 12, armY - 9, 7, 15, 3.5);
}

// Los cuatro soldados se dibujan desde arriba y miran al este. El cuerpo es
// corto y los brazos van al arma, para que se lean como personas y no como
// máquinas; la rotación del sprite sigue el rumbo de cada uno.
function soldierShadow(g, x, y, w, h) {
  g.fillStyle(0x000000, 0.16);
  g.fillEllipse(x, y, w, h);
}

function soldierArm(g, x1, y1, x2, y2, coat) {
  g.lineStyle(5, frame, 1);
  g.lineBetween(x1, y1, x2, y2);
  g.lineStyle(3, coat, 1);
  g.lineBetween(x1, y1, x2, y2);
}

function soldierHand(g, x, y) {
  g.fillStyle(frame, 1);
  g.fillCircle(x, y, 3);
  g.fillStyle(skin, 1);
  g.fillCircle(x, y, 2.2);
}

function soldierBody(g, cx, cy, coat) {
  g.fillStyle(frame, 1);
  g.fillRoundedRect(cx - 12, cy - 11, 22, 22, 8);
  g.fillStyle(coat, 1);
  g.fillRoundedRect(cx - 10, cy - 9, 18, 18, 6);
}

// El rostro asoma por delante del sombrero: así se entiende hacia dónde mira.
function soldierFace(g, x, y) {
  g.fillStyle(skin, 1);
  g.fillCircle(x + 3, y, 3.2);
  g.fillStyle(frame, 1);
  g.fillCircle(x + 4, y - 1, 1.1);
}

function drawBicorn(g, x, y) {
  g.fillStyle(frame, 1);
  g.fillEllipse(x, y, 12, 18);
  g.fillTriangle(x - 6, y - 6, x + 6, y - 6, x, y - 10);
  g.fillTriangle(x - 6, y + 6, x + 6, y + 6, x, y + 10);
  g.fillStyle(hat, 1);
  g.fillEllipse(x - 1, y, 9, 15);
  g.fillStyle(accent, 1);
  g.fillRect(x - 4, y - 1, 7, 2);
  g.fillStyle(sash, 1);
  g.fillCircle(x + 1, y - 7, 2.2);
  soldierFace(g, x, y);
}

function drawTricorn(g, x, y, plume) {
  g.fillStyle(frame, 1);
  g.fillCircle(x, y, 9);
  g.fillTriangle(x - 8, y - 7, x - 8, y + 7, x + 9, y);
  g.fillStyle(hat, 1);
  g.fillCircle(x - 1, y, 7);
  g.fillTriangle(x - 6, y - 5, x - 6, y + 5, x + 7, y);
  g.lineStyle(1.5, accent, 1);
  g.strokeCircle(x - 1, y, 7);
  if (plume) {
    g.fillStyle(trim, 1);
    g.fillCircle(x - 6, y - 7, 3);
  }
  soldierFace(g, x, y);
}

function drawMusket(g, cx, cy, len, hands) {
  const y = cy + 11;
  g.lineStyle(5, frame, 1);
  g.lineBetween(cx + 3, y, cx + len, y);
  g.lineStyle(3, horseDark, 1);
  g.lineBetween(cx + 4, y, cx + len - 3, y);
  g.lineStyle(2, trim, 1);
  g.lineBetween(cx + len - 3, y, cx + len, y);
  g.fillStyle(trim, 1);
  g.fillTriangle(cx + len, y - 3.5, cx + len + 3, y, cx + len, y + 3.5);
  for (const h of hands) soldierHand(g, cx + h, y);
}

function createPatriota(scene) {
  for (let f = 0; f < 2; f += 1) {
    const g = scene.add.graphics();
    const cx = 23;
    const cy = 23;
    soldierShadow(g, cx, cy, 34, 30);
    soldierBody(g, cx, cy, patriota);
    g.lineStyle(4, sash, 1);
    g.lineBetween(cx - 8, cy + 8, cx + 6, cy - 8);
    soldierArm(g, cx + 2, cy - 8, cx + 10, cy + 11, patriota);
    soldierArm(g, cx + 2, cy + 8, cx + 16, cy + 11, patriota);
    drawMusket(g, cx, cy, 18, [10, 16]);
    drawBicorn(g, cx + 11, cy - 1);
    g.generateTexture(`patriota${f ? "B" : "A"}`, 46, 46);
    g.destroy();
  }

  const hero = scene.add
    .sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, "patriotaA")
    .setDepth(5);
  scene.physics.add.existing(hero);
  hero.body.setSize(20, 20);
  hero.body.setOffset(13, 13);
  hero.body.setAllowGravity(false);
  hero.body.setCollideWorldBounds(true);
  hero.body.setBounce(0, 0);
  hero.setRotation(facingRotation("N"));
  scene.patriota = hero;
}

function createBullets(scene) {
  const g = scene.add.graphics();
  g.fillStyle(frame, 1);
  g.fillEllipse(12, 8, 24, 12);
  g.fillStyle(accent, 1);
  g.fillEllipse(12, 8, 19, 8);
  g.fillStyle(0xfdf6e3, 1);
  g.fillEllipse(15, 7.5, 8, 4);
  g.generateTexture("bala", 24, 16);
  g.destroy();

  scene.bullets = scene.physics.add.group();
}

function createSable(scene) {
  // Estela: una franja curva que marca el barrido, no un cono relleno.
  const t = scene.add.graphics();
  t.lineStyle(12, trim, 0.32);
  t.beginPath();
  t.arc(64, 64, 54, -SABLE_HALF_ARC, SABLE_HALF_ARC);
  t.strokePath();
  t.lineStyle(2, 0xffffff, 0.55);
  t.beginPath();
  t.arc(64, 64, 60, -SABLE_HALF_ARC, SABLE_HALF_ARC);
  t.strokePath();
  t.generateTexture("arco", 128, 128);
  t.destroy();

  // Sable: hoja curva con filo, guarnición dorada, empuñadura y pomo.
  const g = scene.add.graphics();
  g.fillStyle(trim, 1);
  g.lineStyle(2, frame, 1);
  g.beginPath();
  g.moveTo(32, 57);
  g.lineTo(56, 55);
  g.lineTo(78, 50);
  g.lineTo(92, 43);
  g.lineTo(92, 48);
  g.lineTo(80, 55);
  g.lineTo(58, 61);
  g.lineTo(32, 71);
  g.closePath();
  g.fillPath();
  g.strokePath();
  g.lineStyle(1.5, 0xffffff, 0.9);
  g.beginPath();
  g.moveTo(38, 58);
  g.lineTo(66, 53);
  g.lineTo(88, 46);
  g.strokePath();
  g.fillStyle(accent, 1);
  g.fillRoundedRect(24, 44, 9, 40, 4);
  g.fillStyle(leather, 1);
  g.fillRoundedRect(11, 58, 15, 12, 5);
  g.lineStyle(2, accent, 1);
  g.beginPath();
  g.moveTo(12, 69);
  g.lineTo(24, 80);
  g.lineTo(30, 68);
  g.strokePath();
  g.fillStyle(accent, 1);
  g.fillCircle(10, 64, 5);
  g.fillStyle(trim, 0.85);
  g.fillCircle(8, 62, 1.6);
  g.generateTexture("filo", 128, 128);
  g.destroy();

  const blade = scene.add.image(0, 0, "filo").setOrigin(0.25, 0.5);
  const arc = scene.add
    .container(scene.patriota.x, scene.patriota.y, [
      scene.add.image(0, 0, "arco"),
      blade,
    ])
    .setDepth(7)
    .setVisible(false);
  arc.blade = blade;
  scene.sableArc = arc;
}

function swingSable(scene, facing) {
  const arc = scene.sableArc;
  const blade = arc.blade;
  arc
    .setPosition(scene.patriota.x, scene.patriota.y)
    .setRotation(facingRotation(facing))
    .setAlpha(1)
    .setScale(0.95)
    .setVisible(true);
  blade.setRotation(-SABLE_HALF_ARC);
  scene.tweens.killTweensOf(blade);
  scene.tweens.add({
    targets: arc,
    scale: 1,
    alpha: 0,
    duration: SABLE_ACTIVE_MS,
    onComplete: () => arc.setVisible(false),
  });
  scene.tweens.add({
    targets: blade,
    rotation: SABLE_HALF_ARC,
    duration: SABLE_ACTIVE_MS,
    ease: "Cubic.easeOut",
  });
}

function resolveSableHits(scene, facing) {
  const run = scene.state.run;
  const px = scene.patriota.x;
  const py = scene.patriota.y;
  let kills = 0;
  for (const espanol of scene.espanoles.getChildren().slice()) {
    if (!inSableArc(px, py, facing, espanol.x, espanol.y)) {
      continue;
    }
    espanol.destroy();
    run.score += pointsForKill(espanol.kind);
    kills += 1;
  }
  let deflected = 0;
  for (const ball of scene.musketBalls.getChildren().slice()) {
    if (!inSableArc(px, py, facing, ball.x, ball.y)) {
      continue;
    }
    ball.destroy();
    deflected += 1;
  }
  if (kills > 0) {
    refreshHud(scene);
    playSound(scene, "kill");
  }
  if (deflected > 0) {
    playSound(scene, "deflect");
  }
}

function fireBullet(scene) {
  const facing = scene.state.run.facing;
  const direction = facingVector(facing);
  const bullet = scene.bullets.create(
    scene.patriota.x + direction.x * 28,
    scene.patriota.y + direction.y * 28,
    "bala",
  );
  if (!bullet) {
    return;
  }
  bullet.setDepth(6);
  bullet.setRotation(facingRotation(facing));
  bullet.body.setAllowGravity(false);
  bullet.body.setVelocity(
    direction.x * BULLET_SPEED,
    direction.y * BULLET_SPEED,
  );
}

function cullOutOfBounds(group, isOutOfBounds) {
  const children = group.getChildren();
  for (let i = children.length - 1; i >= 0; i -= 1) {
    if (isOutOfBounds(children[i].x, children[i].y)) {
      children[i].destroy();
    }
  }
}

function updateBullets(scene) {
  cullOutOfBounds(scene.bullets, bulletOutOfBounds);
}

function updateMusketBalls(scene) {
  cullOutOfBounds(scene.musketBalls, bulletOutOfBounds);
}

function clearGroup(group) {
  const children = group.getChildren().slice();
  for (const child of children) {
    child.destroy();
  }
}

function clearBullets(scene) {
  clearGroup(scene.bullets);
}

function clearMusketBalls(scene) {
  clearGroup(scene.musketBalls);
}

// --- la Piedra ----------------------------------------------------------------

// El gran golpe: una Piedra del tamaño de un cabo de tropa que atraviesa una
// fila entera de españoles y aplasta cualquier balón de fusil en su camino.
function createPiedra(scene) {
  const g = scene.add.graphics();

  g.fillStyle(stoneDark, 1);
  g.fillCircle(28, 29, 26);
  g.fillStyle(stone, 1);
  g.fillCircle(28, 26, 24);
  g.fillStyle(stoneLight, 1);
  g.fillCircle(19, 16, 8);
  g.fillCircle(15, 12, 3);
  g.fillStyle(stoneDark, 1);
  g.fillCircle(11, 36, 5.5);
  g.fillCircle(38, 41, 6.5);
  g.fillCircle(30, 45, 4.5);
  g.fillCircle(44, 17, 5);
  g.fillCircle(37, 27, 3.5);
  g.lineStyle(2, stoneDark, 1);
  g.beginPath();
  g.moveTo(28, 6);
  g.lineTo(24, 20);
  g.lineTo(30, 30);
  g.lineTo(25, 41);
  g.strokePath();
  g.beginPath();
  g.moveTo(46, 24);
  g.lineTo(37, 30);
  g.lineTo(42, 42);
  g.strokePath();

  g.generateTexture("piedra", 56, 56);
  g.destroy();

  scene.piedras = scene.physics.add.group();
}

function maybeThrowPiedra(scene) {
  const run = scene.state.run;
  if (!piedraCanThrow(run.piedraBank, scene.piedras.getLength())) {
    return;
  }
  run.piedraBank = 0;
  const direction = facingVector(run.facing);
  const piedra = scene.piedras.create(
    scene.patriota.x + direction.x * 36,
    scene.patriota.y + direction.y * 36,
    "piedra",
  );
  if (!piedra) {
    return;
  }
  piedra.setDepth(6);
  piedra.body.setAllowGravity(false);
  piedra.body.setVelocity(
    direction.x * PIEDRA_SPEED,
    direction.y * PIEDRA_SPEED,
  );
  refreshHud(scene);
  playSound(scene, "piedraThrow");
  scene.cameras.main.shake(130, 0.005);
}

function isThrowingPiedra(controls) {
  return Boolean(controls.held.P1_3 || controls.held.P2_3);
}

function updatePiedras(scene) {
  cullOutOfBounds(scene.piedras, piedraOutOfBounds);
  for (const piedra of scene.piedras.getChildren()) {
    piedra.rotation += PIEDRA_SPIN;
  }
  resolvePiedraHits(scene);
}

function resolvePiedraHits(scene) {
  const piedras = scene.piedras.getChildren();
  for (let i = piedras.length - 1; i >= 0; i -= 1) {
    const piedra = piedras[i];
    let crushed = 0;
    for (const espanol of scene.espanoles.getChildren().slice()) {
      if (
        !withinRange(piedra.x, piedra.y, espanol.x, espanol.y, PIEDRA_HIT_RANGE)
      ) {
        continue;
      }
      espanol.destroy();
      scene.state.run.score += pointsForKill(espanol.kind);
      crushed += 1;
    }
    for (const ball of scene.musketBalls.getChildren().slice()) {
      if (withinRange(piedra.x, piedra.y, ball.x, ball.y, PIEDRA_HIT_RANGE)) {
        ball.destroy();
      }
    }
    if (crushed > 0) {
      refreshHud(scene);
      playSound(scene, "crush");
    }
  }
}

function clearPiedras(scene) {
  clearGroup(scene.piedras);
}

function piedraOutOfBounds(x, y) {
  return (
    x < -PIEDRA_MARGIN ||
    x > GAME_WIDTH + PIEDRA_MARGIN ||
    y < -PIEDRA_MARGIN ||
    y > GAME_HEIGHT + PIEDRA_MARGIN
  );
}

// --- españoles en escena ------------------------------------------------------

function createEspanoles(scene) {
  drawLanceroTexture(scene);
  drawFusileroTexture(scene);
  drawJineteTexture(scene);
  scene.espanoles = scene.physics.add.group();
}

function drawLanceroTexture(scene) {
  for (let f = 0; f < 2; f += 1) {
    const g = scene.add.graphics();
    const cx = 27;
    const cy = 20;
    soldierShadow(g, cx, cy, 34, 28);
    soldierBody(g, cx, cy, royalist);
    g.lineStyle(3, trim, 1);
    g.lineBetween(cx - 8, cy + 8, cx + 6, cy - 8);
    soldierArm(g, cx + 2, cy - 7, cx + 10, cy + 11, royalist);
    soldierArm(g, cx + 2, cy + 7, cx + 18, cy + 11, royalist);
    const y = cy + 11;
    g.lineStyle(4, frame, 1);
    g.lineBetween(cx + 2, y, cx + 23, y);
    g.lineStyle(2, horse, 1);
    g.lineBetween(cx + 3, y, cx + 22, y);
    g.fillStyle(trim, 1);
    g.fillTriangle(cx + 23, y - 4, cx + 26, y, cx + 23, y + 4);
    g.fillStyle(sash, 1);
    g.fillTriangle(cx + 20, y - 1, cx + 24, y - 8, cx + 24, y - 1);
    soldierHand(g, cx + 10, y);
    soldierHand(g, cx + 18, y);
    drawTricorn(g, cx + 11, cy - 1, false);
    g.generateTexture(`lancero${f ? "B" : "A"}`, 54, 40);
    g.destroy();
  }
}

function drawFusileroTexture(scene) {
  for (let f = 0; f < 2; f += 1) {
    const g = scene.add.graphics();
    const cx = 29;
    const cy = 21;
    soldierShadow(g, cx, cy, 34, 28);
    soldierBody(g, cx, cy, royalist);
    g.lineStyle(3, trim, 1);
    g.lineBetween(cx - 8, cy + 8, cx + 6, cy - 8);
    soldierArm(g, cx + 2, cy - 8, cx + 12, cy + 11, royalist);
    soldierArm(g, cx + 2, cy + 8, cx + 19, cy + 11, royalist);
    drawMusket(g, cx, cy, 22, [12, 19]);
    g.fillStyle(accent, 1);
    g.fillRect(cx + 15, cy + 8, 2, 6);
    drawTricorn(g, cx + 11, cy - 1, true);
    g.generateTexture(`fusilero${f ? "B" : "A"}`, 58, 42);
    g.destroy();
  }
}

// El Jinete va montado a caballo, de perfil y mirando al este como el resto;
// el sprite entero gira con la dirección de su embestida.
function drawJineteTexture(scene) {
  for (let f = 0; f < 2; f += 1) {
    const g = scene.add.graphics();
    soldierShadow(g, 36, 44, 52, 6);
    g.fillStyle(horseDark, 1);
    g.fillTriangle(17, 28, 2, 24 + f * 3, 5, 39 - f * 3);
    const legs = f
      ? [[42, 43, 7, 4], [51, 39, 7, 8], [18, 39, 7, 8], [27, 43, 7, 4]]
      : [[42, 40, 7, 7], [51, 40, 7, 7], [18, 40, 7, 7], [27, 40, 7, 7]];
    for (const [x, y, w, h] of legs) {
      g.fillRect(x, y, w, h);
    }
    g.fillStyle(horse, 1);
    g.fillRoundedRect(12, 25, 46, 18, 9);
    g.fillRoundedRect(52, 13, 12, 16, 6);
    g.fillRoundedRect(57, 11, 14, 10, 5);
    g.fillStyle(horseDark, 1);
    g.fillTriangle(63, 12, 65, 5, 68, 12);
    g.fillStyle(sash, 1);
    g.fillRect(31, 33, 16, 6);
    const by = f ? -1 : 0;
    g.fillStyle(royalist, 1);
    g.fillRoundedRect(32, 8 + by, 15, 17, 4);
    g.fillStyle(trim, 1);
    g.fillRect(33, 16 + by, 13, 2);
    g.fillStyle(royalistDark, 1);
    g.fillRoundedRect(30, 2 + by, 16, 8, 3);
    g.fillStyle(accent, 1);
    g.fillRect(30, 5 + by, 16, 2);
    g.fillStyle(sash, 1);
    g.fillCircle(34, 6 + by, 2);
    g.fillStyle(skin, 1);
    g.fillCircle(47, 11 + by, 3);
    g.lineStyle(4, frame, 1);
    g.lineBetween(42, 16 + by, 48, 16 + by);
    g.lineStyle(2, royalist, 1);
    g.lineBetween(42, 16 + by, 48, 16 + by);
    g.lineStyle(3, frame, 1);
    g.lineBetween(48, 16 + by, 69, 4 + by);
    g.lineStyle(1.5, horse, 1);
    g.lineBetween(49, 15.5 + by, 68, 4.5 + by);
    g.fillStyle(trim, 1);
    g.fillTriangle(67, 1.5 + by, 67, 6.5 + by, 71, 4 + by);
    g.fillStyle(sash, 1);
    g.fillTriangle(57, 7 + by, 64, 1 + by, 62, 9 + by);
    soldierHand(g, 48, 16 + by);
    g.generateTexture(`jinete${f ? "B" : "A"}`, 72, 48);
    g.destroy();
  }
}

function createMusketBalls(scene) {
  const g = scene.add.graphics();
  g.fillStyle(stoneDark, 1);
  g.fillCircle(9, 9, 7);
  g.fillStyle(stone, 1);
  g.fillCircle(7.5, 7.5, 4.5);
  g.fillStyle(stoneLight, 1);
  g.fillCircle(6, 6, 2);
  g.generateTexture("balaFusil", 18, 18);
  g.destroy();

  scene.musketBalls = scene.physics.add.group();
}

function spawnEspanol(scene, kind, spawnIndex, time) {
  const point = edgeSpawnPoint(
    spawnEdgeFor(kind, spawnIndex),
    Phaser.Math.RND.frac(),
  );
  const espanol = scene.espanoles.create(point.x, point.y, `${kind}A`);
  espanol.setDepth(4);
  espanol.kind = kind;
  espanol.walkFrame = 0;
  espanol.hp = hpForKind(kind);
  espanol.facing = facingFromVector(
    towardVector(point.x, point.y, GAME_WIDTH / 2, GAME_HEIGHT / 2),
  );
  if (kind === "jinete") {
    espanol.body.setSize(34, 24);
    espanol.body.setOffset(19, 12);
  } else if (kind === "lancero") {
    espanol.body.setSize(26, 22);
    espanol.body.setOffset(14, 9);
  } else {
    espanol.body.setSize(26, 22);
    espanol.body.setOffset(16, 10);
  }
  espanol.body.setAllowGravity(false);
  espanol.body.setCollideWorldBounds(false);
  if (kind === "fusilero") {
    espanol.nextShotAt = time + FUSILERO_COOLDOWN_MS;
    espanol.aimUntil = 0;
  }
  if (kind === "jinete") {
    espanol.dashDir = { x: point.x < GAME_WIDTH / 2 ? 1 : -1, y: 0 };
    espanol.dashUntil = time + JINETE_DASH_MS;
    espanol.stunnedUntil = 0;
  }
}

function fireMusketBall(scene, fusilero) {
  const direction = towardVector(
    fusilero.x,
    fusilero.y,
    scene.patriota.x,
    scene.patriota.y,
  );
  const ball = scene.musketBalls.create(
    fusilero.x + direction.x * 14,
    fusilero.y + direction.y * 14,
    "balaFusil",
  );
  if (!ball) {
    return;
  }
  ball.setDepth(6);
  ball.body.setAllowGravity(false);
  ball.body.setVelocity(direction.x * MUSKET_SPEED, direction.y * MUSKET_SPEED);
}

function beginOleada(run, oleada, startTime) {
  run.oleada = oleada;
  run.oleadaTotal = oleadaSize(oleada);
  run.oleadaFusileros = oleadaFusileros(oleada);
  run.oleadaJinetes = oleadaJinetes(oleada);
  run.oleadaSpawned = 0;
  run.oleadaJinetesSpawned = 0;
  run.oleadaInterval = oleadaSpawnInterval(oleada);
  run.nextSpawnAt = startTime;
}

function scheduleOleadaSpawn(scene, time) {
  const run = scene.state.run;

  if (run.lullUntil > 0) {
    if (time < run.lullUntil) {
      return;
    }
    run.lullUntil = 0;
    run.nextSpawnAt = time;
  }

  if (run.oleadaSpawned < run.oleadaTotal && time >= run.nextSpawnAt) {
    const kind = spawnKindAt(
      run.oleadaSpawned,
      run.oleadaTotal,
      run.oleadaFusileros,
      run.oleadaJinetes,
    );
    // Cada Jinete usa su propio ordinal para alternar de costado.
    const spawnIndex =
      kind === "jinete" ? run.oleadaJinetesSpawned : run.oleadaSpawned;
    if (kind === "jinete") {
      run.oleadaJinetesSpawned += 1;
    }
    spawnEspanol(scene, kind, spawnIndex, time);
    run.oleadaSpawned += 1;
    run.nextSpawnAt = time + run.oleadaInterval;
    return;
  }

  if (isOleadaCleared(run) && scene.espanoles.getLength() === 0) {
    run.score += oleadaBonus(run.oleada);
    beginOleada(run, run.oleada + 1, time + OLEADA_LULL_MS);
    run.lullUntil = time + OLEADA_LULL_MS;
    refreshHud(scene);
    playSound(scene, "bonus");
    showOleadaSplash(scene, run.oleada);
    playSound(scene, "oleada");
  }
}

function clearEspanoles(scene) {
  clearGroup(scene.espanoles);
}

// Dos fotogramas de marcha: las botas alternan y, al detenerse, vuelve el
// fotograma de firme. El guardado de setTexture mantiene vivos los mocks.
function march(sprite, kind, time, moving) {
  const frame = moving ? Math.floor(time / 140) % 2 : 0;
  if (sprite.walkFrame !== frame && sprite.setTexture) {
    sprite.walkFrame = frame;
    sprite.setTexture(kind + (frame ? "B" : "A"));
  }
}

function updateEspanoles(scene, time) {
  const target = scene.patriota;
  const enemyScale = oleadaEnemySpeed(scene.state.run.oleada);
  for (const espanol of scene.espanoles.getChildren()) {
    const direction = towardVector(espanol.x, espanol.y, target.x, target.y);
    if (espanol.kind === "fusilero") {
      updateFusilero(scene, espanol, direction, time, enemyScale);
    } else if (espanol.kind === "jinete") {
      updateJinete(espanol, direction, time, enemyScale);
    } else {
      espanol.body.setVelocity(
        direction.x * LANCERO_SPEED * enemyScale,
        direction.y * LANCERO_SPEED * enemyScale,
      );
      espanol.facing = nextFacing(espanol.facing, direction);
      espanol.setRotation(facingRotation(espanol.facing));
      espanol.moving = true;
    }
    march(espanol, espanol.kind, time, espanol.moving !== false);
  }
}

// El Jinete entra comprometido en una embestida lateral y, al agotarse,
// persigue al Patriota a galope tendido.
function updateJinete(jinete, direction, time, speedScale) {
  const enemyScale = speedScale || 1;
  const tick = jineteTick(jinete, time);
  jinete.moving = !tick.stunned;
  // Se empina: se detiene en seco, sin perseguir al Patriota que huye.
  if (tick.stunned) {
    jinete.body.setVelocity(0, 0);
    return;
  }
  const vector = tick.dashing ? jinete.dashDir : direction;
  const speed =
    (tick.dashing ? JINETE_DASH_SPEED : JINETE_SPEED) * enemyScale;
  jinete.body.setVelocity(vector.x * speed, vector.y * speed);
  // El caballo siempre se ve erguido: no se rota el sprite, solo se refleja
  // en horizontal cuando su rumbo apunta hacia el oeste.
  if (vector.x !== 0) {
    jinete.setFlipX(vector.x < 0);
  }
}

function updateFusilero(scene, fusilero, direction, time, speedScale) {
  const approach = FUSILERO_SPEED * (speedScale || 1);
  const distance = Math.hypot(
    scene.patriota.x - fusilero.x,
    scene.patriota.y - fusilero.y,
  );
  const planted = distance <= FUSILERO_RANGE;
  fusilero.moving = !planted;

  fusilero.body.setVelocity(
    planted ? 0 : direction.x * approach,
    planted ? 0 : direction.y * approach,
  );
  fusilero.facing = nextFacing(fusilero.facing, direction);
  fusilero.setRotation(facingRotation(fusilero.facing));

  const shot = musketTick(fusilero, planted, time);
  const wasAiming = fusilero.aimUntil > 0;
  fusilero.aimUntil = shot.aimUntil;
  fusilero.nextShotAt = shot.nextShotAt;

  if (shot.aimUntil > 0) {
    fusilero.setTint(accent);
  } else if (wasAiming) {
    fusilero.clearTint();
  }
  if (shot.aim) {
    playSound(scene, "aim");
  }
  if (shot.fire) {
    fireMusketBall(scene, fusilero);
    playSound(scene, "musket");
  }
}

function flashEspanol(scene, espanol) {
  espanol.setTintFill(0xffffff);
  scene.time.delayedCall(70, () => {
    if (espanol.active) {
      espanol.clearTint();
    }
  });
}

function resolveBulletHits(scene) {
  const bullets = scene.bullets.getChildren();
  const espanoles = scene.espanoles.getChildren();
  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const bullet = bullets[i];
    for (let j = espanoles.length - 1; j >= 0; j -= 1) {
      const espanol = espanoles[j];
      if (!withinRange(bullet.x, bullet.y, espanol.x, espanol.y, HIT_RANGE)) {
        continue;
      }
      bullet.destroy();
      espanol.hp = damageAfterBullet(espanol.hp);
      if (espanol.hp > 0) {
        flashEspanol(scene, espanol);
        playSound(scene, "hit");
      } else {
        espanol.destroy();
        scene.state.run.score += pointsForKill(espanol.kind);
        refreshHud(scene);
        playSound(scene, "kill");
      }
      break;
    }
  }
}

function checkContactDamage(scene, time) {
  const patriota = scene.patriota;
  for (const espanol of scene.espanoles.getChildren()) {
    if (
      !withinRange(patriota.x, patriota.y, espanol.x, espanol.y, CONTACT_RANGE)
    ) {
      continue;
    }
    applyDamage(scene, time, espanol);
    return;
  }
}

function resolveMusketHits(scene, time) {
  const patriota = scene.patriota;
  for (const ball of scene.musketBalls.getChildren().slice()) {
    if (
      !withinRange(patriota.x, patriota.y, ball.x, ball.y, MUSKET_HIT_RANGE)
    ) {
      continue;
    }
    ball.destroy();
    applyDamage(scene, time);
    return;
  }
}

function applyDamage(scene, time, culprit) {
  const run = scene.state.run;
  const patriota = scene.patriota;
  const contact = applyContact(run.lives, run.invulnerableUntil, time);
  if (!contact.hit) {
    return;
  }
  run.lives = contact.lives;
  run.invulnerableUntil = contact.invulnerableUntil;
  run.knock = knockbackVector(patriota.x, patriota.y);
  run.knockUntil = time + KNOCK_MS;
  // El Jinete no se queda encima del Patriota: si lo atropella en plena
  // embestida galopa de largo; sin embestida, el caballo se empina y cede
  // terreno mientras la invulnerabilidad protege a su víctima.
  if (culprit && culprit.kind === "jinete") {
    if (time < culprit.dashUntil) {
      culprit.dashUntil = time + JINETE_DASH_MS;
    } else {
      culprit.stunnedUntil = time + JINETE_STUN_MS;
    }
  }
  refreshHud(scene);
  playSound(scene, "hurt");
  if (isDefeated(run.lives)) {
    finishRun(scene);
  }
}

function updatePatriota(scene, time) {
  const run = scene.state.run;
  const vector = getMoveVector(scene.controls);
  const body = scene.patriota.body;
  if (time < run.knockUntil) {
    body.setVelocity(run.knock.x * KNOCK_SPEED, run.knock.y * KNOCK_SPEED);
  } else {
    body.setVelocity(vector.x * PATRIOTA_SPEED, vector.y * PATRIOTA_SPEED);
  }

  run.facing = nextFacing(run.facing, vector);
  scene.patriota.setRotation(facingRotation(run.facing));
  march(
    scene.patriota,
    "patriota",
    time,
    vector.x !== 0 || vector.y !== 0 || time < run.knockUntil,
  );

  const invulnerable = isInvulnerable(time, run.invulnerableUntil);
  scene.patriota.setVisible(!invulnerable || blinkVisible(time));

  if (scene.sableArc.visible) {
    scene.sableArc.setPosition(scene.patriota.x, scene.patriota.y);
  }

  const shot = fireTick(isFiring(scene.controls), time, run.nextFireAt);
  run.nextFireAt = shot.nextFireAt;
  if (shot.fire) {
    fireBullet(scene);
    playSound(scene, "shot");
  }

  const swing = swingTick(isSwinging(scene.controls), time, run.nextSwingAt);
  run.nextSwingAt = swing.nextSwingAt;
  if (swing.swing) {
    run.sableUntil = time + SABLE_ACTIVE_MS;
    run.sableFacing = run.facing;
    swingSable(scene, run.facing);
    playSound(scene, "sable");
  }
  // El tajo se resuelve en cada frame de su ventana activa: así alcanza a quien
  // entra en el arco durante el barrido, no solo a quien ya estaba al empezar.
  if (time < run.sableUntil) {
    resolveSableHits(scene, run.sableFacing);
  }

  if (isThrowingPiedra(scene.controls)) {
    maybeThrowPiedra(scene);
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

const FACINGS_BY_SECTOR = ["E", "SE", "S", "SW", "W", "NW", "N", "NE"];

function facingFromVector(vector) {
  const x = vector.x;
  const y = vector.y;
  if (x === 0 && y === 0) {
    return null;
  }
  const sector = Math.round(Math.atan2(y, x) / (Math.PI / 4));
  return FACINGS_BY_SECTOR[((sector % 8) + 8) % 8];
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

function isSwinging(controls) {
  return Boolean(controls.held.P1_2 || controls.held.P2_2);
}

function swingTick(held, now, nextSwingAt) {
  if (!held || now < nextSwingAt) {
    return { swing: false, nextSwingAt };
  }
  return { swing: true, nextSwingAt: now + SABLE_COOLDOWN };
}

// --- la Piedra (lógica pura) --------------------------------------------------

// El medidor se llena con puntos: una Piedra lista por cada 1500. El banco
// guarda máximo una, y la puntuación que sobra mientras la Piedra espera se
// pierde; el lanzamiento solo vacía el banco, no el medidor, que sigue
// llenándose.
function piedraGaugeTick(bank, progress, scoreDelta) {
  if (bank > 0) {
    return { bank: 1, progress: 0, granted: false };
  }
  const filled = progress + Math.max(0, scoreDelta);
  const gained = Math.floor(filled / PIEDRA_STEP);
  if (gained === 0) {
    return { bank: 0, progress: filled, granted: false };
  }
  return { bank: 1, progress: gained > 1 ? 0 : filled - PIEDRA_STEP, granted: true };
}

// Solo se lanza con una Piedra guardada y sin otra Piedra en vuelo.
function piedraCanThrow(bank, inFlight) {
  return bank > 0 && inFlight <= 0;
}

function inSableArc(px, py, facing, ex, ey) {
  const dx = ex - px;
  const dy = ey - py;
  const length = Math.hypot(dx, dy);
  if (length > SABLE_RANGE) {
    return false;
  }
  if (length === 0) {
    return true;
  }
  const direction = facingVector(facing);
  const dot = (dx * direction.x + dy * direction.y) / length;
  return dot >= Math.cos(SABLE_HALF_ARC);
}

function bulletOutOfBounds(x, y) {
  return (
    x < -BULLET_MARGIN ||
    x > GAME_WIDTH + BULLET_MARGIN ||
    y < -BULLET_MARGIN ||
    y > GAME_HEIGHT + BULLET_MARGIN
  );
}

// --- españoles, vidas y derrota (lógica pura) --------------------------------

function musketTick(fusilero, planted, now) {
  const state = {
    aim: false,
    fire: false,
    nextShotAt: fusilero.nextShotAt,
    aimUntil: fusilero.aimUntil,
  };
  if (!planted) {
    state.aimUntil = 0;
    return state;
  }
  if (state.aimUntil === 0) {
    if (now >= state.nextShotAt) {
      state.aim = true;
      state.aimUntil = now + FUSILERO_AIM_MS;
    }
  } else if (now >= state.aimUntil) {
    state.fire = true;
    state.aimUntil = 0;
    state.nextShotAt = now + FUSILERO_COOLDOWN_MS;
  }
  return state;
}

function jineteTick(jinete, now) {
  const stunned = now < jinete.stunnedUntil;
  return { stunned, dashing: !stunned && now < jinete.dashUntil };
}

function towardVector(fromX, fromY, toX, toY) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (dx === 0 && dy === 0) {
    return { x: 0, y: 0 };
  }
  const length = Math.hypot(dx, dy);
  return { x: dx / length, y: dy / length };
}

// Los Jinetes solo entran por los costados (derecha 1, izquierda 3); la
// infantería sigue repartiéndose por los cuatro bordes.
function spawnEdgeFor(kind, spawnIndex) {
  if (kind === "jinete") {
    return JINETE_EDGES[spawnIndex % JINETE_EDGES.length];
  }
  return spawnIndex % 4;
}

function edgeSpawnPoint(edge, t) {
  const u = Math.max(0, Math.min(1, t));
  if (edge === 0) {
    return {
      x: SPAWN_MARGIN + u * (GAME_WIDTH - 2 * SPAWN_MARGIN),
      y: -SPAWN_OFFSET,
    };
  }
  if (edge === 1) {
    return {
      x: GAME_WIDTH + SPAWN_OFFSET,
      y: SPAWN_MARGIN + u * (GAME_HEIGHT - 2 * SPAWN_MARGIN),
    };
  }
  if (edge === 2) {
    return {
      x: SPAWN_MARGIN + u * (GAME_WIDTH - 2 * SPAWN_MARGIN),
      y: GAME_HEIGHT + SPAWN_OFFSET,
    };
  }
  return {
    x: -SPAWN_OFFSET,
    y: SPAWN_MARGIN + u * (GAME_HEIGHT - 2 * SPAWN_MARGIN),
  };
}

function damageAfterBullet(hp) {
  return Math.max(0, hp - 1);
}

function hpForKind(kind) {
  if (kind === "jinete") {
    return JINETE_HP;
  }
  if (kind === "fusilero") {
    return FUSILERO_HP;
  }
  return LANCERO_HP;
}

function pointsForKill(kind) {
  if (kind === "lancero") {
    return LANCERO_SCORE;
  }
  if (kind === "fusilero") {
    return FUSILERO_SCORE;
  }
  if (kind === "jinete") {
    return JINETE_SCORE;
  }
  return 0;
}

// --- director de oleadas (lógica pura) ---------------------------------------

function oleadaSize(oleada) {
  return Math.min(OLEADA_BASE_COUNT + oleada, OLEADA_COUNT_CAP);
}

function oleadaSpawnSpeed(oleada) {
  return Math.min(
    1 + Math.max(0, oleada - 1) * OLEADA_SPEED_STEP,
    OLEADA_SPEED_CAP,
  );
}

function oleadaSpawnInterval(oleada) {
  return Math.round(OLEADA_SPAWN_MS / oleadaSpawnSpeed(oleada));
}

// Leve apuro en el paso de los españoles: cada oleada los une un 5 % hasta un
// tope firme de 1.3x. El Patriota (170 px/s) nunca deja de correr más que
// ellos, pero de la oleada 7 en adelante el margen se siente.
function oleadaEnemySpeed(oleada) {
  return Math.min(
    1 + Math.max(0, oleada - 1) * OLEADA_ENEMY_STEP,
    OLEADA_ENEMY_CAP,
  );
}

function oleadaBonus(oleada) {
  return oleada > 0 ? OLEADA_BONUS * oleada : 0;
}

// Presupuesto de legibilidad: los Fusileros ocupan a lo sumo un tercio de la
// oleada y los Jinetes un cuarto; el resto queda de Lancero y así siempre hay
// filas de a pie que avanzan de frente. Con eso la mezcla se estanca en
// ~55 % de especialistas a lo más, y pasada la oleada 10 solo crecen la
// cadencia de aparición (tope 1.5x) y el paso (tope 1.3x).
function oleadaFusileros(oleada) {
  if (oleada < FUSILERO_FROM_OLEADA) {
    return 0;
  }
  return Math.min(
    Math.floor((oleada + 1) / 3),
    Math.floor(oleadaSize(oleada) / 3),
  );
}

function oleadaJinetes(oleada) {
  if (oleada < JINETE_FROM_OLEADA) {
    return 0;
  }
  return Math.min(
    Math.floor((oleada - 1) / 2),
    Math.floor(oleadaSize(oleada) / 4),
  );
}

// Bresenham: dado un hueco y cuántos aciertos repartir en total, decide si
// aquí cae uno. Reparte los especiales con espaciado parejo en la oleada.
function spaced(ahead, hits, total) {
  return (
    Math.floor((ahead * hits) / total) > Math.floor(((ahead - 1) * hits) / total)
  );
}

// Reparte los españoles especiales dentro de la oleada: primero elige en qué
// posiciones aparecen y luego si el hueco es Jinete o Fusilero.
function spawnKindAt(index, total, fusileroCount, jineteCount = 0) {
  const specialCount = fusileroCount + jineteCount;
  if (specialCount <= 0 || total <= 0) {
    return "lancero";
  }
  const ahead = total - index;
  if (!spaced(ahead, specialCount, total)) {
    return "lancero";
  }
  const specialsAhead = Math.floor((ahead * specialCount) / total);
  const isJinete =
    jineteCount > 0 && spaced(specialsAhead, jineteCount, specialCount);
  return isJinete ? "jinete" : "fusilero";
}

function isOleadaCleared(run) {
  return run.oleadaSpawned >= run.oleadaTotal;
}

function withinRange(x1, y1, x2, y2, range) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy <= range * range;
}

function applyContact(lives, invulnerableUntil, now) {
  if (now < invulnerableUntil) {
    return { lives, invulnerableUntil, hit: false };
  }
  return {
    lives: Math.max(0, lives - 1),
    invulnerableUntil: now + INVULN_MS,
    hit: true,
  };
}

function isInvulnerable(now, until) {
  return now < until;
}

function blinkVisible(now) {
  return now % BLINK_MS < BLINK_MS / 2;
}

function knockbackVector(x, y) {
  return towardVector(x, y, GAME_WIDTH / 2, GAME_HEIGHT / 2);
}

function isDefeated(lives) {
  return lives <= 0;
}

// --- fuente de píxel ----------------------------------------------------------
// Tipografía arcade 5x7: cada glifo son siete filas en 14 dígitos hex (el bit 4
// es la columna izquierda). Todo el texto del juego — del marcador a las
// iniciales — se dibuja con esta fuente, así el texto se ve igual en la
// máquina del gabinete, sin depender de fuentes del sistema.

const FONT_SPEC =
  " 00000000000000" +
  "A0E11111F111111" +
  "B1E11111E11111E" +
  "C0E11101010110E" +
  "D1E11111111111E" +
  "E1F10101E10101F" +
  "F1F10101E101010" +
  "G0E11101711110E" +
  "H1111111F111111" +
  "I0E04040404040E" +
  "J0702020202120C" +
  "K11121418141211" +
  "L1010101010101F" +
  "M111B1515111111" +
  "N11191513111111" +
  "O0E11111111110E" +
  "P1E11111E101010" +
  "Q0E11111115120D" +
  "R1E11111E141211" +
  "S0F10100E01011E" +
  "T1F040404040404" +
  "U1111111111110E" +
  "V11111111110A04" +
  "W1111111515150A" +
  "X11110A040A1111" +
  "Y11110A04040404" +
  "Z1F01020408101F" +
  "Á040E111F111111" +
  "É0410101E10101F" +
  "Í040E040404040E" +
  "Ó040E111111110E" +
  "Ú0411111111110E" +
  "Ñ0E111915131111" +
  "00E11131519110E" +
  "1040C040404040E" +
  "20E11010608101F" +
  "31E01010E01011E" +
  "402060A121F0202" +
  "51F101E0101110E" +
  "60E10101E11110E" +
  "71F010204080808" +
  "80E11110E11110E" +
  "90E11110F01010E" +
  "¡04000404040404" +
  "!04040404040004" +
  "¿0400040C10110E" +
  "?0E110106080004" +
  "·00000004000000" +
  ":00060600060600" +
  ".00000000000606" +
  ",00000000020408" +
  "(02040808080402" +
  ")08040202020408" +
  "/01020204080810" +
  "_0000000000001F";

const FONT_COLUMNS = 16;

// Estampa el abecedario en una textura en cuadrícula y la registra como fuente
// de mapa de bits (RetroFont): 6x9 por celda, glifo de 5x7 con aire para respirar.
function makeFont(scene) {
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 1);
  const chars = [];
  for (let i = 0; i < FONT_SPEC.length; i += 15) {
    const cell = chars.length;
    chars.push(FONT_SPEC[i]);
    for (let row = 0; row < 7; row += 1) {
      const bits = parseInt(FONT_SPEC.substr(i + 1 + row * 2, 2), 16);
      for (let col = 0; col < 5; col += 1) {
        if (bits & (16 >> col)) {
          g.fillRect(
            (cell % FONT_COLUMNS) * 6 + col,
            ((cell / FONT_COLUMNS) | 0) * 9 + row,
            1,
            1,
          );
        }
      }
    }
  }
  g.generateTexture("pixfont", 96, 36);
  g.destroy();
  scene.cache.bitmapFont.add(
    "pix",
    Phaser.GameObjects.RetroFont.Parse(scene, {
      image: "pixfont",
      width: 6,
      height: 9,
      chars: chars.join(""),
      charsPerRow: FONT_COLUMNS,
    }),
  );
  // Sin NEAREST el escalado de la fuente de 5x7 sale borroso en WebGL.
  scene.textures.get("pixfont").setFilter(Phaser.Textures.FilterMode.NEAREST);
}

// Todo texto del juego nace aquí: mayúsculas, tinte y escala del tipo arcade.
function pixText(scene, x, y, text, scale, color, originX = 0.5, originY = 0.5) {
  return scene.add
    .bitmapText(x, y, "pix", String(text).toUpperCase())
    .setOrigin(originX, originY)
    .setScale(scale)
    .setTint(color);
}

// Cambiar texto a un rótulo ya creado: sin mayúsculas se pierden glifos.
function setPixText(target, text) {
  target.setText(String(text).toUpperCase());
}

function createHearts(scene) {
  const g = scene.add.graphics();
  const drawHeart = (color) => {
    g.clear();
    g.fillStyle(frame, 1);
    g.fillCircle(5, 5, 5.2);
    g.fillCircle(12, 5, 5.2);
    g.fillTriangle(0.4, 6, 16.6, 6, 8.5, 15.6);
    g.fillStyle(color, 1);
    g.fillCircle(5, 5, 3.8);
    g.fillCircle(12, 5, 3.8);
    g.fillTriangle(1.9, 6.5, 15.1, 6.5, 8.5, 13.8);
    if (color === heart) {
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(4, 3.5, 1.4);
    }
  };
  drawHeart(heart);
  g.generateTexture("corazonLleno", 17, 16);
  drawHeart(leather);
  g.generateTexture("corazonVacio", 17, 16);
  g.destroy();
}

// --- HUD ----------------------------------------------------------------------

function createHud(scene) {
  scene.hud = { livesShown: LIVES_TOTAL };

  // Franja superior de dos filas: puntos/vidas/oleada arriba y el medidor de
  // la Piedra abajo, con panel propio y filo de oro.
  scene.add
    .rectangle(GAME_WIDTH / 2, 34, GAME_WIDTH, 68, backdrop, 0.62)
    .setDepth(9);
  scene.add
    .rectangle(GAME_WIDTH / 2, 68, GAME_WIDTH, 2, accent, 0.35)
    .setDepth(9);

  scene.hud.score = pixText(scene, 16, 22, "PUNTOS 0000", 3, accent, 0, 0.5).setDepth(10);

  // Tres corazones: llenos son vidas; vacíos, recuerdan lo perdido.
  scene.hud.hearts = [0, 1, 2].map((i) =>
    scene.add
      .image(GAME_WIDTH / 2 + (i - 1) * 27, 22, "corazonLleno")
      .setDepth(10),
  );

  scene.hud.oleada = pixText(scene, GAME_WIDTH - 16, 22, "OLEADA 01", 3, patriota, 1, 0.5).setDepth(10);

  scene.hud.status = pixText(scene, GAME_WIDTH / 2, GAME_HEIGHT - 16, "", 2, patriota).setDepth(10);

  // Medidor de la Piedra: una fila entera del HUD, con la roca en su anillo de
  // latón, la barra teal segmentada y un marco de oro que late al quedar lista.
  scene.add
    .rectangle(GAME_WIDTH / 2, 52, 776, 28, leather, 0.9)
    .setStrokeStyle(2, tealDark, 1)
    .setDepth(9);
  scene.hud.piedraGlow = scene.add
    .rectangle(GAME_WIDTH / 2, 52, 780, 32)
    .setStrokeStyle(3, accent)
    .setDepth(9)
    .setVisible(false);
  scene.add
    .circle(30, 52, 16, cell, 0.95)
    .setStrokeStyle(2, accent, 0.9)
    .setDepth(10);
  scene.hud.piedraIcon = scene.add.image(30, 52, "piedra").setScale(PIEDRA_ICON_SCALE).setDepth(11);
  scene.hud.piedraLabel = pixText(scene, 54, 52, "PIEDRA", 2, dim, 0, 0.5).setDepth(10);
  scene.hud.piedraBarBg = scene.add
    .rectangle(136 + PIEDRA_BAR / 2, 52, PIEDRA_BAR + 8, 16, cell, 1)
    .setStrokeStyle(2, tealDark, 1)
    .setDepth(10);
  scene.hud.piedraFill = scene.add
    .rectangle(136, 52, PIEDRA_BAR, 8, teal)
    .setOrigin(0, 0.5)
    .setDepth(10);
  scene.hud.piedraTicks = [0.25, 0.5, 0.75].map((mark) =>
    scene.add
      .rectangle(136 + PIEDRA_BAR * mark, 52, 1.5, 8, frame, 0.65)
      .setDepth(10),
  );

  scene.hud.piedraReady = pixText(scene, 136 + PIEDRA_BAR / 2, 52, "¡PIEDRA LISTA! B3", 2, accent)
    .setDepth(10)
    .setVisible(false);
  scene.hud.piedraGlowShown = false;
  // Parpadeo del rótulo listo: un solo latido desde la creación, corre siempre
  // y solo se ve cuando el medidor lo muestra.
  scene.tweens.add({
    targets: scene.hud.piedraReady,
    alpha: 0.15,
    duration: 220,
    yoyo: true,
    repeat: -1,
  });
}

function tickPiedraGauge(scene) {
  const run = scene.state.run;
  const delta = run.score - run.piedraScoreSeen;
  run.piedraScoreSeen = run.score;
  const tick = piedraGaugeTick(run.piedraBank, run.piedraProgress, delta);
  run.piedraBank = tick.bank;
  run.piedraProgress = tick.progress;
  return tick;
}

function updatePiedraHud(scene, tick) {
  const hud = scene.hud;
  const ready = scene.state.run.piedraBank > 0;
  const fill = Math.max(0, Math.min(1, tick.progress / PIEDRA_STEP));
  hud.piedraBarBg.setVisible(!ready);
  hud.piedraFill.setVisible(!ready);
  hud.piedraFill.setDisplaySize(Math.max(fill * PIEDRA_BAR, 2), 8);
  hud.piedraReady.setVisible(ready);
  // Los adornos del medidor nacen en createHud; el afino aquí los respeta
  // cuando están (paneles, rótulo y marco de oro latiendo al quedar lista).
  if (hud.piedraTicks) {
    for (const mark of hud.piedraTicks) {
      mark.setVisible(!ready);
    }
  }
  if (hud.piedraLabel) {
    hud.piedraLabel.setTint(ready ? accent : dim);
  }
  if (hud.piedraGlow) {
    hud.piedraGlow.setVisible(ready);
    if (ready !== hud.piedraGlowShown) {
      hud.piedraGlowShown = ready;
      scene.tweens.killTweensOf(hud.piedraGlow);
      if (ready) {
        hud.piedraGlow.setAlpha(1);
        scene.tweens.add({
          targets: hud.piedraGlow,
          alpha: 0.2,
          duration: 300,
          yoyo: true,
          repeat: -1,
        });
      }
    }
  }
  if (tick.granted) {
    scene.tweens.killTweensOf(hud.piedraIcon);
    scene.tweens.add({
      targets: hud.piedraIcon,
      scale: { from: PIEDRA_ICON_POP, to: PIEDRA_ICON_SCALE },
      duration: 220,
      ease: "Bounce.easeOut",
    });
    playSound(scene, "listo");
  }
}

function refreshHud(scene) {
  // El medidor de la Piedra avanza aquí: todo punto que sume a la puntuación
  // termina pasando por refreshHud, y así el medidor nunca queda atrás.
  setPixText(scene.hud.score, `PUNTOS ${String(scene.state.run.score).padStart(4, "0")}`);
  setPixText(
    scene.hud.oleada,
    `OLEADA ${String(scene.state.run.oleada).padStart(2, "0")}`,
  );
  // Los corazones solo se repintan cuando la vida cambia; perder un corazón
  // se anuncia con un latido fuerte, y recobrarlo con uno suave.
  const lives = scene.state.run.lives;
  if (lives !== scene.hud.livesShown) {
    scene.hud.livesShown = lives;
    for (let i = 0; i < scene.hud.hearts.length; i += 1) {
      const heart = scene.hud.hearts[i];
      const full = i < lives;
      const texture = full ? "corazonLleno" : "corazonVacio";
      if (heart.texture.key === texture) {
        continue;
      }
      heart.setTexture(texture);
      scene.tweens.add({
        targets: heart,
        scale: { from: full ? 1 : 1.5, to: 1 },
        duration: 200,
        ease: full ? "Back.easeOut" : "Quad.easeIn",
      });
    }
  }
  updatePiedraHud(scene, tickPiedraGauge(scene));
}

function showOleadaSplash(scene, oleada) {
  const text = `¡OLEADA ${oleada}!`;
  const shadow = pixText(scene, GAME_WIDTH / 2 + 3, GAME_HEIGHT / 2 - 57, text, 6, frame).setDepth(29);
  const splash = pixText(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, text, 6, accent).setDepth(30);

  scene.tweens.add({
    targets: [splash, shadow],
    alpha: 0.12,
    duration: 150,
    yoyo: true,
    repeat: 9,
  });
  scene.time.delayedCall(1700, () => {
    scene.tweens.killTweensOf([splash, shadow]);
    splash.destroy();
    shadow.destroy();
  });
}

// --- flujo de partida ---------------------------------------------------------

function freshRun() {
  const run = {
    score: 0,
    oleada: 1,
    facing: "N",
    nextFireAt: 0,
    nextSwingAt: 0,
    lives: LIVES_TOTAL,
    invulnerableUntil: 0,
    knock: { x: 0, y: 0 },
    knockUntil: 0,
    piedraBank: 0,
    piedraProgress: 0,
    piedraScoreSeen: 0,
    oleadaTotal: 0,
    oleadaSpawned: 0,
    oleadaInterval: 0,
    nextSpawnAt: 0,
    lullUntil: 0,
  };
  beginOleada(run, 1, 0);
  return run;
}

function startRun(scene) {
  scene.startScreen.container.setVisible(false);
  scene.endGame.container.setVisible(false);
  scene.pauseScreen.container.setVisible(false);
  clearPressedControls(scene);

  scene.state.run = freshRun();
  clearBullets(scene);
  clearMusketBalls(scene);
  clearPiedras(scene);
  clearEspanoles(scene);
  scene.tweens.killTweensOf(scene.sableArc);
  scene.sableArc.setVisible(false);
  scene.patriota.body.reset(GAME_WIDTH / 2, GAME_HEIGHT / 2);
  scene.patriota.setRotation(facingRotation("N"));
  scene.patriota.setActive(true).setVisible(true);

  refreshHud(scene);
  setPixText(
    scene.hud.status,
    "B1: DISPARAR  B2: SABLE  B3: PIEDRA  START: PAUSA",
  );
  scene.state.phase = "playing";
  scene.physics.resume();
  showOleadaSplash(scene, 1);
  playSound(scene, "oleada");
  startMusic(scene, "battle");
}

function pauseRun(scene) {
  clearPressedControls(scene);
  scene.state.phase = "paused";
  scene.patriota.body.setVelocity(0, 0);
  scene.physics.pause();
  scene.state.pauseMenu = { cursor: 0, cooldown: 0, lastAxis: 0 };
  updateMenuHighlight(scene.pauseScreen.buttons, 0);
  scene.pauseScreen.container.setVisible(true);
  duckMusic(scene, true);
}

function resumeRun(scene) {
  clearPressedControls(scene);
  scene.pauseScreen.container.setVisible(false);
  scene.physics.resume();
  scene.state.phase = "playing";
  duckMusic(scene, false);
}

function finishRun(scene) {
  if (scene.state.phase !== "playing" && scene.state.phase !== "paused") {
    return;
  }

  scene.pauseScreen.container.setVisible(false);
  scene.patriota.body.setVelocity(0, 0);
  scene.patriota.setVisible(true);
  clearBullets(scene);
  clearMusketBalls(scene);
  clearPiedras(scene);
  clearEspanoles(scene);
  scene.physics.pause();
  clearPressedControls(scene);
  scene.state.phase = "gameover";
  setPixText(scene.hud.status, "");

  setPixText(scene.endGame.rally, Phaser.Math.RND.pick(DEFEAT_LINES));
  setPixText(
    scene.endGame.summary,
    `PUNTOS ${String(scene.state.run.score).padStart(4, "0")} · OLEADA ${String(
      scene.state.run.oleada,
    ).padStart(2, "0")}`,
  );
  scene.endGame.container.setVisible(true);
  // Solo la puntuación que entra en la tabla pide tus iniciales.
  const qualifies = qualifiesForHighScore(
    scene.state.run.score,
    scene.state.highScores,
  );
  setNameEntryVisible(scene, qualifies);

  const entry = scene.state.nameEntry;
  entry.letters = [];
  entry.row = 0;
  entry.col = 0;
  entry.moveCooldownUntil = 0;
  entry.confirmCooldownUntil = 0;
  entry.lastMoveVector = { x: 0, y: 0 };

  if (qualifies) {
    scene.state.phase = "gameover";
    refreshNameEntry(scene);
    updateLetterGridHighlight(scene);
  } else {
    scene.state.phase = "saved";
    scene.state.saveStatus =
      "NO ENTRÓ EN LA TABLA. START: OTRA PARTIDA · BOTÓN 1: TÍTULO";
  }
  setPixText(scene.endGame.saveStatus, scene.state.saveStatus);
  stopMusic(scene);
  playSound(scene, "defeat");
}

function setNameEntryVisible(scene, visible) {
  scene.endGame.nameLabel.setVisible(visible);
  scene.endGame.nameValue.setVisible(visible);
  scene.endGame.instructions.setVisible(visible);
  for (const item of scene.endGame.gridLabels) {
    item.cell.setVisible(visible);
    item.label.setVisible(visible);
  }
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
    // Primera tecla del gabinete: despierta el audio y arranca el tema del
    // título (los navegadores mantienen el sonido dormido hasta el primer gesto).
    if (!scene.state.audioUnlocked) {
      scene.state.audioUnlocked = true;
      if (scene.state.phase === "start") {
        playTitleTheme(scene);
      }
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

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  scene.events.once("shutdown", () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  });
}

function normalizeIncomingKey(key) {
  if (typeof key !== "string" || key.length === 0) {
    return "";
  }
  if (key === " ") {
    return "space";
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

  c.add(
    scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      overlay,
      0.96,
    ),
  );

  c.add(pixText(scene, GAME_WIDTH / 2, 44, "PLATANUS HACK 26 · EDICIÓN CARACAS", 2, dim));

  const marqueeTop = pixText(scene, GAME_WIDTH / 2, 96, "BATALLA DE", 5, patriota);
  c.add(pixText(scene, GAME_WIDTH / 2 + 4, 163, "MATASIETE", 7, frame));
  const marqueeBottom = pixText(scene, GAME_WIDTH / 2, 160, "MATASIETE", 7, accent);
  c.add(marqueeTop);
  c.add(marqueeBottom);
  scene.tweens.add({
    targets: [marqueeTop, marqueeBottom],
    // Pulso de brillo sin escala: escalar el tipo de píxel por fracciones
    // desalinea los píxeles y los emborrona; la luz basta para que respire.
    alpha: 0.72,
    duration: 1100,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  scene.startScreen.buttons = createMenuButtons(
    scene,
    c,
    ["JUGAR", "MEJORES PUNTUAJES", "¿CONTROLES?"],
    236,
    48,
    330,
  );

  c.add(pixText(scene, GAME_WIDTH / 2, 400, "MEJORES PUNTUAJES", 3, accent));
  scene.startScreen.leaderboard = pixText(scene, GAME_WIDTH / 2, 424, "", 2, patriota, 0.5, 0);
  scene.startScreen.leaderboard.lineSpacing = 4;
  c.add(scene.startScreen.leaderboard);

  c.add(pixText(scene, GAME_WIDTH / 2, GAME_HEIGHT - 22, "JOYSTICK: MOVER   BOTÓN 1 / START: CONFIRMAR", 2, dim));

  c.setVisible(false);
}

function createMenuButtons(scene, container, labels, yStart, yStep, width) {
  const buttons = [];
  for (let i = 0; i < labels.length; i += 1) {
    const y = yStart + i * yStep;
    const label = pixText(scene, GAME_WIDTH / 2, y, labels[i], 3, patriota);
    // La caja se ajusta al rótulo: ningún texto cuelga fuera de su botón.
    const bgWidth = Math.max(width, Math.ceil(label.width) + 32);
    const bg = scene.add.rectangle(
      GAME_WIDTH / 2,
      y,
      bgWidth,
      40,
      cell,
      0.95,
    );
    bg.setStrokeStyle(2, frame, 0.8);
    container.add(bg);
    container.add(label);
    buttons.push({ bg, label });
  }
  return buttons;
}

function updateMenuHighlight(buttons, cursor) {
  buttons.forEach(({ bg, label }, i) => {
    const active = i === cursor;
    bg.setFillStyle(active ? accent : cell, active ? 1 : 0.95);
    bg.setStrokeStyle(2, active ? sand : frame, active ? 1 : 0.8);
    label.setTint(active ? cell : patriota);
  });
}

function handleMenuNavigation(scene, time, menu, buttonCount) {
  const axisY = getVerticalMenuAxis(scene.controls);
  let moved = false;

  if (time >= menu.cooldown && axisY !== 0 && menu.lastAxis !== axisY) {
    menu.cursor = Phaser.Math.Wrap(menu.cursor + axisY, 0, buttonCount);
    menu.cooldown = time + 160;
    moved = true;
    playSound(scene, "click");
  }
  menu.lastAxis = axisY;
  return moved;
}

function showStartScreen(scene) {
  clearPressedControls(scene);
  scene.state.phase = "start";
  scene.state.menu = { cursor: 0, cooldown: 0, lastAxis: 0 };
  refreshStartScreenLeaderboard(scene);
  updateMenuHighlight(scene.startScreen.buttons, scene.state.menu.cursor);
  scene.startScreen.container.setVisible(true);
  // Vuelta al título: la fanfarria y el tema vuelven a sonar (de todo lo que
  // ya se alzaron, la generación del motor descarta las cadenas viejas).
  playTitleTheme(scene);
}

function handleStartMenu(scene, time) {
  const menu = scene.state.menu;
  if (
    handleMenuNavigation(scene, time, menu, scene.startScreen.buttons.length)
  ) {
    updateMenuHighlight(scene.startScreen.buttons, menu.cursor);
  }

  if (consumeAnyPressedControl(scene, ["P1_1", "P2_1", "START1", "START2"])) {
    playSound(scene, "select");
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

  c.add(
    scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      overlay,
      0.98,
    ),
  );
  c.add(pixText(scene, GAME_WIDTH / 2, 88, "MEJORES PUNTUAJES", 4, accent));

  scene.leaderScreen.list = pixText(scene, GAME_WIDTH / 2, 160, "", 3, patriota, 0.5, 0);
  scene.leaderScreen.list.lineSpacing = 14;
  c.add(scene.leaderScreen.list);

  c.add(pixText(scene, GAME_WIDTH / 2, GAME_HEIGHT - 28, "PULSA START PARA VOLVER", 2, dim));

  c.setVisible(false);
}

function showLeaderboardScreen(scene) {
  clearPressedControls(scene);
  setPixText(scene.leaderScreen.list, formatHighScores(scene.state.highScores).join("\n"));
  scene.startScreen.container.setVisible(false);
  scene.leaderScreen.container.setVisible(true);
  scene.state.phase = "leaderboard";
}

function createControlsScreen(scene) {
  scene.controlsScreen = {};
  const c = scene.add.container(0, 0).setDepth(16);
  scene.controlsScreen.container = c;

  c.add(
    scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      overlay,
      0.98,
    ),
  );
  c.add(pixText(scene, GAME_WIDTH / 2, 96, "¿CONTROLES?", 4, accent));

  const lines = [
    "JOYSTICK ....... MOVER · ELEGIR",
    "BOTÓN 1 ........ CONFIRMAR",
    "START .......... PAUSA · COMENZAR",
    "",
    "EN COMBATE",
    "JOYSTICK ....... MOVER · MIRAR",
    "BOTÓN 1 ........ DISPARAR (SOSTENER)",
    "BOTÓN 2 ........ SABLE (GOLPE CERCANO)",
    "BOTÓN 3 ........ PIEDRA (AL LLENAR EL MEDIDOR)",
    "",
    "EN PAUSA",
    "JOYSTICK ....... ELEGIR OPCIÓN",
    "START .......... CONFIRMAR",
    "",
    "RENDIRSE TERMINA LA PARTIDA",
  ];
  let lineY = 146;
  for (const line of lines) {
    if (line === "") {
      lineY += 10;
      continue;
    }
    c.add(pixText(scene, GAME_WIDTH / 2, lineY, line, 2, patriota));
    lineY += 24;
  }

  c.add(pixText(scene, GAME_WIDTH / 2, GAME_HEIGHT - 28, "PULSA START PARA VOLVER", 2, dim));

  c.setVisible(false);
}

function showControlsScreen(scene) {
  clearPressedControls(scene);
  scene.startScreen.container.setVisible(false);
  scene.controlsScreen.container.setVisible(true);
  scene.state.phase = "controls";
}

function closeAttractScreen(scene) {
  scene.leaderScreen.container.setVisible(false);
  scene.controlsScreen.container.setVisible(false);
  showStartScreen(scene);
}

function refreshStartScreenLeaderboard(scene) {
  setPixText(scene.startScreen.leaderboard, formatHighScores(scene.state.highScores).join("\n"));
}

function refreshLeaderboard(scene) {
  setPixText(scene.endGame.leaderboard, formatHighScores(scene.state.highScores).join("\n"));
}

function refreshAllLeaderboards(scene) {
  refreshStartScreenLeaderboard(scene);
  refreshLeaderboard(scene);
}

function formatHighScores(entries) {
  if (!entries.length) {
    return ["SIN PUNTOS AÚN"];
  }
  return entries.map((entry, index) => {
    const rank = String(index + 1).padStart(2, "0");
    const name = entry.name.padEnd(3, " ");
    const score = String(entry.score).padStart(5, "0");
    return `${rank} ${name} ${score}`;
  });
}

// --- pausa --------------------------------------------------------------------

function createPauseScreen(scene) {
  scene.pauseScreen = {};
  const c = scene.add.container(0, 0).setDepth(25);
  scene.pauseScreen.container = c;

  c.add(
    scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      overlay,
      0.85,
    ),
  );
  c.add(pixText(scene, GAME_WIDTH / 2 + 3, GAME_HEIGHT / 2 - 97, "PAUSA", 7, frame));
  c.add(pixText(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, "PAUSA", 7, accent));

  scene.pauseScreen.buttons = createMenuButtons(
    scene,
    c,
    ["CONTINUAR", "RENDIRSE"],
    GAME_HEIGHT / 2 - 10,
    52,
    280,
  );

  c.add(pixText(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120, "JOYSTICK: ELEGIR   START: CONFIRMAR", 2, dim));

  c.setVisible(false);
}

function handlePauseMenu(scene, time) {
  const menu = scene.state.pauseMenu;
  if (
    handleMenuNavigation(scene, time, menu, scene.pauseScreen.buttons.length)
  ) {
    updateMenuHighlight(scene.pauseScreen.buttons, menu.cursor);
  }

  if (consumeAnyPressedControl(scene, ["START1", "START2", "P1_1", "P2_1"])) {
    playSound(scene, "select");
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

  c.add(
    scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      backdrop,
      0.98,
    ),
  );

  c.add(pixText(scene, GAME_WIDTH / 2 + 3, 67, "¡DERROTA!", 6, frame));
  scene.endGame.title = pixText(scene, GAME_WIDTH / 2, 64, "¡DERROTA!", 6, sash);

  scene.endGame.rally = pixText(scene, GAME_WIDTH / 2, 116, "", 3, accent);

  scene.endGame.summary = pixText(scene, GAME_WIDTH / 2, 150, "", 3, patriota);

  scene.endGame.nameLabel = pixText(scene, GAME_WIDTH / 2, 186, "INICIALES", 2, dim);

  scene.endGame.nameValue = pixText(scene, GAME_WIDTH / 2, 224, "___", 5, accent);
  scene.endGame.nameValue.setLetterSpacing(10);

  scene.endGame.instructions = pixText(scene, GAME_WIDTH / 2, 258, "MOVER: ELEGIR   BOTÓN 1: CONFIRMAR", 2, dim);

  scene.endGame.leaderboardTitle = pixText(scene, GAME_WIDTH / 2, 288, "MEJORES PUNTUAJES", 3, accent);

  scene.endGame.leaderboard = pixText(scene, GAME_WIDTH / 2, 304, "", 2, patriota, 0.5, 0);
  scene.endGame.leaderboard.lineSpacing = 0;

  scene.endGame.gridLabels = [];
  for (let row = 0; row < LETTER_GRID.length; row += 1) {
    const rowValues = LETTER_GRID[row];
    const widths = rowValues.map((value) => (value.length > 1 ? 96 : 42));
    const gap = 16;
    const rowWidth =
      widths.reduce((sum, width) => sum + width, 0) + gap * (widths.length - 1);
    let cursor = GAME_WIDTH / 2 - rowWidth / 2;
    for (let col = 0; col < rowValues.length; col += 1) {
      const value = rowValues[col];
      const width = widths[col];
      const cellX = cursor + width / 2;
      cursor += width + gap;
      const cellY = 412 + row * 30;
      const wide = value.length > 1;

      const slate = scene.add.rectangle(
        cellX,
        cellY,
        width,
        26,
        cell,
        0.95,
      );
      slate.setStrokeStyle(2, frame, 0.8);

      const label = pixText(
        scene,
        cellX,
        cellY,
        value,
        wide ? 2 : 3,
        patriota,
      );

      scene.endGame.gridLabels.push({ cell: slate, label, row, col, value });
      c.add(slate);
      c.add(label);
    }
  }

  scene.endGame.saveStatus = pixText(scene, GAME_WIDTH / 2, 584, "", 2, accent);

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
    playSound(scene, "click");
  }

  if (axisX === 0 && axisY === 0) {
    entry.lastMoveVector = { x: 0, y: 0 };
  } else {
    entry.lastMoveVector = { x: axisX, y: axisY };
  }

  if (
    time >= entry.confirmCooldownUntil &&
    consumeAnyPressedControl(scene, ["P1_1", "P2_1", "START1", "START2"])
  ) {
    entry.confirmCooldownUntil = time + 180;
    playSound(scene, "select");
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
    entry.col = Phaser.Math.Wrap(
      entry.col + axisX,
      0,
      LETTER_GRID[entry.row].length,
    );
  }

  updateLetterGridHighlight(scene);
}

function updateLetterGridHighlight(scene) {
  const entry = scene.state.nameEntry;
  for (const item of scene.endGame.gridLabels) {
    const active = item.row === entry.row && item.col === entry.col;
    item.cell.setFillStyle(
      active ? accent : cell,
      active ? 1 : 0.95,
    );
    item.cell.setStrokeStyle(
      2,
      active ? sand : frame,
      active ? 1 : 0.8,
    );
    item.label.setTint(active ? cell : patriota);
  }
}

function activateCurrentLetter(scene) {
  const entry = scene.state.nameEntry;
  const selectedValue = LETTER_GRID[entry.row][entry.col];

  if (selectedValue === "BORRAR") {
    entry.letters.pop();
    refreshNameEntry(scene);
    return;
  }

  if (selectedValue === "LISTO") {
    if (entry.letters.length === 0) {
      setPixText(
        scene.endGame.saveStatus,
        "Elige al menos un carácter antes de guardar.",
      );
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
    letters.push("_");
  }
  setPixText(scene.endGame.nameValue, letters.join(" "));
}

function submitHighScore(scene) {
  if (scene.state.phase !== "gameover") {
    return;
  }

  // El tablero honesto: sin iniciales no se registra nada, nada de
  // marcadores fantasma que la validación por carga descartaría.
  const initials = scene.state.nameEntry.letters.join("");
  if (!NAME_PATTERN.test(initials)) {
    return;
  }

  const entry = {
    name: initials,
    score: scene.state.run.score,
    savedAt: new Date().toISOString().slice(0, 10),
  };

  scene.state.saveStatus = `¡Guardado ${initials}! START: OTRA PARTIDA · BOTÓN 1: TÍTULO`;
  setPixText(scene.endGame.saveStatus, scene.state.saveStatus);
  clearPressedControls(scene);
  scene.state.phase = "saved";

  persistHighScore(entry)
    .then((nextScores) => {
      scene.state.highScores = nextScores;
      refreshAllLeaderboards(scene);
    })
    .catch(() => {
      scene.state.saveStatus = "No se pudo guardar, pero la partida cuenta.";
      if (scene.state.phase === "saved") {
        setPixText(scene.endGame.saveStatus, scene.state.saveStatus);
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
  return parseHighScores(result);
}

// Dado el resultado crudo del almacenamiento, valida cada forma y devuelve
// las cinco mejores puntuaciones: formas ajenas o desactualizadas se
// descartan y el resto se ordena de mayor a menor.
function parseHighScores(result) {
  if (!result || !result.found || !Array.isArray(result.value)) {
    return [];
  }
  return rankHighScores(result.value.filter(isHighScoreEntry));
}

// ¿La puntuación merece pedir iniciales? Solo si es positiva y entra en la
// tabla, completándola (menos de cinco) o superando a la quinta.
function qualifiesForHighScore(score, highScores) {
  if (!Number.isFinite(score) || score <= 0) {
    return false;
  }
  if (!Array.isArray(highScores) || highScores.length < MAX_HIGH_SCORES) {
    return true;
  }
  const fifth = highScores[MAX_HIGH_SCORES - 1];
  if (
    !fifth ||
    typeof fifth.score !== "number" ||
    !Number.isFinite(fifth.score)
  ) {
    return true;
  }
  return score >= fifth.score;
}

function isHighScoreEntry(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof value.name === "string" &&
    NAME_PATTERN.test(value.name) &&
    typeof value.score === "number" &&
    isFinite(value.score) &&
    value.score >= 0 &&
    value.score <= MAX_SCORE &&
    typeof value.savedAt === "string",
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

// Chiptune procedural: cada pista es una progresión escrita en MIDI (0 =
// silencio) sobre Am–F–Dm–E (lamentación menor con dominante y su G# de
// tensión), programada nota por nota con Web Audio y cadencia de caja
// militar. La generación invalida la repetición cuando suena el siguiente
// estado, así dos pistas jamás quedan encimadas y la derrota deja el salón
// en silencio.

const TRACK_TITLE = {
  step: 0.33,
  drums: true,
  leadType: "sawtooth",
  leadVol: 0.04,
  // Marcha fúnebre: golpe largo al inicio de cada compás y suspiro al final.
  lead: [
    69, 0, 0, 0, 76, 0, 72, 0,
    74, 0, 0, 0, 77, 0, 76, 0,
    72, 0, 0, 0, 74, 0, 71, 0,
    68, 0, 0, 0, 64, 0, 0, 0,
  ],
  // Pedal grave que re-marca la mitad del compás una octava arriba.
  bass: [
    33, 0, 0, 0, 45, 0, 0, 0,
    29, 0, 0, 0, 41, 0, 0, 0,
    26, 0, 0, 0, 38, 0, 0, 0,
    28, 0, 0, 0, 40, 0, 0, 0,
  ],
  kicks: [0],
  snares: [4],
  hats: [],
};

const TRACK_BATTLE = {
  step: 0.21,
  drums: true,
  leadType: "sawtooth",
  leadVol: 0.05,
  // Corneta marcial en Am armónica: repeticiones punteadas, lamento
  // descendente en F y cadencia con G# sobre la dominante.
  lead: [
    69, 0, 0, 69, 72, 0, 71, 0,
    77, 0, 76, 0, 74, 0, 72, 0,
    74, 0, 0, 74, 77, 0, 76, 0,
    68, 0, 71, 0, 64, 0, 0, 0,
    69, 0, 69, 76, 81, 0, 76, 0,
    74, 0, 74, 77, 81, 0, 77, 0,
    77, 0, 77, 81, 84, 0, 81, 0,
    80, 0, 76, 0, 68, 0, 64, 0,
  ],
  // El bajo camina por las raíces de la progresión: negras en la primera
  // vuelta, con corchea extra cuando el tema arranca a galopar (compases 5-8).
  bass: (() => {
    const bass = new Array(64).fill(0);
    [33, 29, 26, 28, 33, 26, 29, 28].forEach((root, bar) => {
      for (const hit of bar < 4 ? [0, 2, 4] : [0, 2, 4, 6]) {
        bass[bar * 8 + hit] = root;
      }
    });
    return bass;
  })(),
  kicks: [0, 4],
  snares: [2, 5, 6],
  hats: [],
};

function audioContext(scene) {
  try {
    const ctx =
      scene.sound && scene.sound.context
        ? scene.sound.context
        : new AudioContext();
    if (ctx.state === "suspended" && ctx.resume) {
      ctx.resume();
    }
    return ctx;
  } catch (_) {
    return null;
  }
}

function midiFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function tone(ctx, out, freq, t, len, type, vol) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  osc.connect(g);
  g.connect(out);
  osc.start(t);
  osc.stop(t + len + 0.02);
  osc.onended = () => g.disconnect();
}

function kickDrum(ctx, out, t) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
  g.gain.setValueAtTime(0.4, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.connect(g);
  g.connect(out);
  osc.start(t);
  osc.stop(t + 0.14);
  osc.onended = () => g.disconnect();
}

function hatTick(ctx, out, t, noise) {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  f.type = "highpass";
  f.frequency.value = 6500;
  g.gain.setValueAtTime(0.09, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  src.connect(f);
  f.connect(g);
  g.connect(out);
  src.start(t);
  src.stop(t + 0.06);
  src.onended = () => g.disconnect();
}

// La caja militar: chasquido de parche con banda centrada, seco y marcial.
function snareDrum(ctx, out, t, noise) {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  f.type = "bandpass";
  f.frequency.value = 1900;
  f.Q.value = 0.9;
  g.gain.setValueAtTime(0.2, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  src.connect(f);
  f.connect(g);
  g.connect(out);
  src.start(t);
  src.stop(t + 0.09);
  src.onended = () => g.disconnect();
}

function stopMusic(scene) {
  scene.state.audioGen += 1;
  scene.state.musicKind = null;
  const out = scene.state.musicOut;
  scene.state.musicOut = null;
  if (!out) {
    return;
  }
  try {
    rampGain(out, scene.sound.context, 0.0005, 0.3);
  } catch (_) {
    try {
      out.disconnect();
    } catch (_again) {}
    return;
  }
  scene.time.delayedCall(320, () => {
    try {
      out.disconnect();
    } catch (_) {}
  });
}

// El puño del volumen: toda la música pasa por aquí, en pausa y al apagarse.
function rampGain(out, ctx, target, seconds) {
  const now = ctx.currentTime;
  out.gain.cancelScheduledValues(now);
  out.gain.setValueAtTime(Math.max(0.0005, out.gain.value), now);
  out.gain.exponentialRampToValueAtTime(Math.max(0.0005, target), now + seconds);
}

// En pausa la música se baja, no se corta: la sala sigue viva tras el overlay.
function duckMusic(scene, ducked) {
  const out = scene.state.musicOut;
  const ctx = scene.sound && scene.sound.context;
  if (!out || !ctx) {
    return;
  }
  try {
    rampGain(out, ctx, ducked ? MUSIC_DUCK : 1, 0.2);
  } catch (_) {}
}

function startMusic(scene, kind, delaySec) {
  if (scene.state.musicKind === kind) {
    return;
  }
  const ctx = audioContext(scene);
  if (!ctx) {
    return;
  }
  if (ctx.state !== "running") {
    // Sin gesto del usuario el contexto queda dormido: se reintenta hasta que
    // la primera tecla del gabinete lo despierte.
    const gen = scene.state.audioGen;
    scene.time.delayedCall(250, () => {
      if (scene.state.audioGen === gen && !scene.state.musicKind) {
        startMusic(scene, kind, delaySec);
      }
    });
    return;
  }
  stopMusic(scene);
  const gen = scene.state.audioGen;
  const track = kind === "battle" ? TRACK_BATTLE : TRACK_TITLE;
  const out = ctx.createGain();
  out.gain.value = 1;
  out.connect(ctx.destination);
  scene.state.musicOut = out;
  scene.state.musicKind = kind;

  const noise = ctx.createBuffer(1, 2048, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < 2048; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  const barMs = Math.round(track.step * 8 * 1000);
  const scheduleBar = (bar, audioTime) => {
    if (gen !== scene.state.audioGen) {
      return;
    }
    // Si el reloj de la escena se durmió (pestaña oculta, tirón del hilo), el
    // compás quedaba agendado en el pasado: Web Audio lo arrancaba y paraba a
    // la vez, en silencio, y el retraso se arrastraba para siempre. Aquí se
    // reengancha al reloj de audio.
    audioTime = Math.max(audioTime, ctx.currentTime + 0.03);
    for (let i = 0; i < 8; i += 1) {
      const step = bar * 8 + i;
      const at = audioTime + i * track.step;
      const lead = track.lead[step % track.lead.length];
      if (lead) {
        tone(
          ctx,
          out,
          midiFreq(lead),
          at,
          track.step * 0.9,
          track.leadType,
          track.leadVol,
        );
      }
      const bass = track.bass[step % track.bass.length];
      if (bass) {
        tone(ctx, out, midiFreq(bass), at, track.step * 1.7, "triangle", 0.14);
      }
      if (track.drums) {
        const kicks = track.kicks || [0, 4];
        const snares = track.snares || [];
        const hats = track.hats === undefined ? [2, 6] : track.hats;
        if (kicks.includes(i)) {
          kickDrum(ctx, out, at);
        }
        if (snares.includes(i)) {
          snareDrum(ctx, out, at, noise);
        }
        if (hats.includes(i)) {
          hatTick(ctx, out, at, noise);
        }
      }
    }
    // La barra siguiente ya está en el reloj de audio y se agenda con
    // antelación: aunque el navegador estrangule los callbacks, el compás no
    // se corta ni se atrasa.
    scene.time.delayedCall(barMs - 120, () =>
      scheduleBar(bar + 1, audioTime + track.step * 8),
    );
  };
  scheduleBar(0, ctx.currentTime + 0.06 + (delaySec || 0));
}

// Fanfarria de farola del título: A A A → E → D → A con pedal de A abajo.
function playTitleJingle(scene) {
  const ctx = audioContext(scene);
  if (!ctx || ctx.state !== "running") {
    return;
  }
  const out = ctx.createGain();
  out.gain.value = 0.9;
  out.connect(ctx.destination);
  const notes = [
    [69, 0, 0.11],
    [69, 0.13, 0.11],
    [76, 0.26, 0.11],
    [81, 0.39, 0.5],
    [80, 0.95, 0.12],
    [76, 1.1, 0.65],
  ];
  const t0 = ctx.currentTime + 0.05;
  for (const [midi, at, len] of notes) {
    tone(ctx, out, midiFreq(midi), t0 + at, len, "square", 0.09);
  }
  tone(ctx, out, midiFreq(45), t0, 1.7, "triangle", 0.1);
  scene.time.delayedCall(2100, () => {
    try {
      out.disconnect();
    } catch (_) {}
  });
}

function playTitleTheme(scene) {
  if (scene.state.musicKind === "title") {
    return;
  }
  const ctx = audioContext(scene);
  if (!ctx) {
    return;
  }
  if (ctx.state !== "running") {
    // Igual que en la batalla: sin gesto no hay audio, se reintenta hasta que
    // la primera tecla del gabinete lo despierte y sigamos en el título.
    const gen = scene.state.audioGen;
    scene.time.delayedCall(250, () => {
      if (
        scene.state.audioGen === gen &&
        !scene.state.musicKind &&
        scene.state.phase === "start"
      ) {
        playTitleTheme(scene);
      }
    });
    return;
  }
  playTitleJingle(scene);
  startMusic(scene, "title", 1.8);
}

// [onda, duración, volumen, ...pasos [frecuencia, instante, rampa?]]
// rampa: 1 exponencial, 2 lineal; sin rampa, la nota se mantiene.
// onda: 0 cuadrada, 1 triangular, 2 diente de sierra.
const SFX = {
  click: [0, 0.05, 0.08, [1200, 0], [600, 0.04, 1]],
  select: [0, 0.1, 0.12, [700, 0], [1400, 0.08, 1]],
  oleada: [0, 0.34, 0.14, [523, 0], [659, 0.09], [784, 0.18]],
  bonus: [1, 0.3, 0.14, [784, 0], [988, 0.08], [1175, 0.16]],
  shot: [0, 0.09, 0.09, [920, 0], [160, 0.07, 1]],
  aim: [0, 0.32, 0.05, [280, 0], [840, 0.3, 1]],
  musket: [2, 0.22, 0.2, [240, 0], [55, 0.2, 1]],
  deflect: [0, 0.1, 0.09, [1500, 0], [2600, 0.08, 1]],
  sable: [1, 0.15, 0.12, [1500, 0], [280, 0.13, 1]],
  hit: [0, 0.06, 0.07, [500, 0], [220, 0.05, 1]],
  kill: [1, 0.18, 0.14, [300, 0], [60, 0.16, 1]],
  hurt: [2, 0.24, 0.16, [440, 0], [90, 0.22, 1]],
  piedraThrow: [2, 0.3, 0.22, [320, 0], [70, 0.28, 2]],
  crush: [0, 0.16, 0.2, [180, 0], [45, 0.14, 1]],
  listo: [0, 0.34, 0.12, [660, 0], [880, 0.1], [1100, 0.2]],
  defeat: [2, 1, 0.2, [440, 0], [349, 0.16], [293, 0.32], [220, 0.48], [60, 0.95, 1]],
};

function playSound(scene, type) {
  try {
    const sound = SFX[type];
    if (!sound) {
      return;
    }
    const ctx =
      scene.sound && scene.sound.context
        ? scene.sound.context
        : new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    const [wave, end, volume, ...steps] = sound;
    osc.type = ["square", "triangle", "sawtooth"][wave];
    for (const [frequency, at, ramp] of steps) {
      const time = now + at;
      if (ramp === 1) {
        osc.frequency.exponentialRampToValueAtTime(frequency, time);
      } else if (ramp === 2) {
        osc.frequency.linearRampToValueAtTime(frequency, time);
      } else {
        osc.frequency.setValueAtTime(frequency, time);
      }
    }
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + end);
    osc.start(now);
    osc.stop(now + end);
    osc.onended = () => gain.disconnect();
  } catch (_) {}
}
