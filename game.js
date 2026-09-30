const TOTAL_ROUNDS = 10;
const TOTAL_LEVELS = 3;
const MAX_LIVES = 3;
const WORLD = { width: 800, height: 500, playerRadius: 15 };
const KEYS = {
  ArrowUp: "up", w: "up", W: "up",
  ArrowDown: "down", s: "down", S: "down",
  ArrowLeft: "left", a: "left", A: "left",
  ArrowRight: "right", d: "right", D: "right",
};

const screens = {
  welcome: document.querySelector("#welcome-screen"),
  game: document.querySelector("#game-screen"),
  result: document.querySelector("#result-screen"),
};

const elements = {
  modeCards: document.querySelectorAll(".mode-card"),
  startButton: document.querySelector("#start-button"),
  soundToggle: document.querySelector("#sound-toggle"),
  installButton: document.querySelector("#install-button"),
  topbar: document.querySelector(".topbar"),
  homeButton: document.querySelector("#home-button"),
  resultHomeButton: document.querySelector("#result-home-button"),
  playAgainButton: document.querySelector("#play-again-button"),
  modeLabel: document.querySelector("#game-mode-label"),
  difficultyLabel: document.querySelector("#difficulty-label"),
  roundLabel: document.querySelector("#round-label"),
  question: document.querySelector("#question"),
  lives: document.querySelector("#lives"),
  pauseButton: document.querySelector("#pause-button"),
  pauseOverlay: document.querySelector("#pause-overlay"),
  levelOverlay: document.querySelector("#level-overlay"),
  levelTitle: document.querySelector("#level-title"),
  levelCopy: document.querySelector("#level-copy"),
  nextLevelButton: document.querySelector("#next-level-button"),
  resumeButton: document.querySelector("#resume-button"),
  pauseHomeButton: document.querySelector("#pause-home-button"),
  progressTrack: document.querySelector(".progress-track"),
  progressFill: document.querySelector("#progress-fill"),
  progressCount: document.querySelector("#progress-count"),
  score: document.querySelector("#score-value"),
  streak: document.querySelector("#streak-value"),
  hintButton: document.querySelector("#hint-button"),
  guideMessage: document.querySelector("#guide-message"),
  powerStatus: document.querySelector("#power-status"),
  missionSelect: document.querySelector("#mission-select"),
  canvasMessage: document.querySelector("#canvas-message"),
  feedback: document.querySelector("#feedback-message"),
  abandonButton: document.querySelector("#skip-button"),
  canvas: document.querySelector("#dungeon-canvas"),
  touchButtons: document.querySelectorAll(".touch-controls button"),
  resultEmoji: document.querySelector("#result-emoji"),
  resultEyebrow: document.querySelector("#result-eyebrow"),
  resultTitle: document.querySelector("#result-title"),
  resultCopy: document.querySelector("#result-copy"),
  finalScore: document.querySelector("#final-score"),
  finalCorrect: document.querySelector("#final-correct"),
  resultBadge: document.querySelector("#result-badge"),
  resultStreak: document.querySelector("#result-streak"),
};

const modeNames = {
  equations: "EL SELLO ALGEBRAICO",
  mental: "PRUEBA DEL INGENIO",
  fractions: "CÁMARA DE PARTES",
  powers: "PODER ANCESTRAL",
  percentages: "MERCADO DEL REINO",
  order: "PUERTA ENCANTADA",
};

const difficultyNames = {
  easy: "APRENDIZ",
  medium: "AVENTURERO",
  hard: "MAESTRO",
};

const chapterTitles = {
  1: "La puerta rota",
  2: "El corredor de humo",
  3: "La cámara del dragón",
};

const chapterStories = {
  1: "La primera cámara guarda la llave del reino. Cada respuesta correcta abre una ruta más segura al tesoro.",
  2: "La piedra vibra con el choque de los limos. Aquí los enigmas se vuelven más rápidos y cada paso importa.",
  3: "El corazón de la mazmorra palpita. La última prueba exige calma, precisión y una racha implacable.",
};

const state = {
  mode: "equations",
  difficulty: "easy",
  mission: "story",
  level: 1,
  round: 0,
  score: 0,
  streak: 0,
  bestStreak: 0,
  correct: 0,
  lives: MAX_LIVES,
  currentQuestion: null,
  player: { x: 400, y: 426, facing: "up", moving: false },
  runes: [],
  slimes: [],
  particles: [],
  powerUps: [],
  heldDirections: new Set(),
  invulnerableUntil: 0,
  lastFrame: 0,
  animationFrame: null,
  advanceTimeout: null,
  waveResolved: false,
  hintUsed: false,
  abandoned: false,
  time: 0,
  paused: false,
  installPrompt: null,
  soundEnabled: true,
  waitingForNextLevel: false,
  shieldUntil: 0,
  speedUntil: 0,
  goldMultiplier: 1,
  boss: null,
  bossDefeated: false,
};

const audio = {
  context: null,
  masterGain: null,
  musicTimer: null,
  enabled: true,
};

const ctx = elements.canvas.getContext("2d");
const modeGenerators = {
  equations: makeEquationQuestion,
  mental: makeMentalQuestion,
  fractions: makeFractionQuestion,
  powers: makePowerQuestion,
  percentages: makePercentageQuestion,
  order: makeOrderQuestion,
};

const walls = [
  { x: 258, y: 92, width: 92, height: 36 },
  { x: 468, y: 91, width: 78, height: 36 },
  { x: 155, y: 212, width: 78, height: 36 },
  { x: 343, y: 197, width: 108, height: 42 },
  { x: 570, y: 222, width: 76, height: 36 },
  { x: 242, y: 328, width: 86, height: 37 },
  { x: 494, y: 337, width: 94, height: 37 },
];

const runeSpots = [
  { x: 95, y: 122 }, { x: 400, y: 118 }, { x: 705, y: 122 },
  { x: 100, y: 285 }, { x: 400, y: 287 }, { x: 700, y: 287 },
  { x: 105, y: 410 }, { x: 695, y: 409 },
];

const slimeSpawns = [
  { x: 70, y: 62 }, { x: 730, y: 62 }, { x: 730, y: 438 },
  { x: 70, y: 438 }, { x: 400, y: 58 }, { x: 400, y: 442 },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(items) {
  return items[randomInt(0, items.length - 1)];
}

function ensureAudio() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return false;
  if (!audio.context) {
    audio.context = new AudioCtor();
    audio.masterGain = audio.context.createGain();
    audio.masterGain.gain.value = state.soundEnabled ? 0.18 : 0;
    audio.masterGain.connect(audio.context.destination);
  }
  if (audio.context.state === "suspended") {
    audio.context.resume();
  }
  return true;
}

function setSoundEnabled(enabled) {
  state.soundEnabled = enabled;
  audio.enabled = enabled;
  if (elements.soundToggle) {
    elements.soundToggle.textContent = enabled ? "🔊" : "🔇";
    elements.soundToggle.setAttribute("aria-label", enabled ? "Silenciar sonido" : "Activar sonido");
    elements.soundToggle.setAttribute("aria-pressed", String(!enabled));
  }
  if (audio.masterGain) {
    audio.masterGain.gain.value = enabled ? 0.18 : 0;
  }
  if (enabled) startMusic();
  else stopMusic();
}

function startMusic() {
  if (!state.soundEnabled || !ensureAudio() || !audio.context || audio.musicTimer) return;
  const melody = [220, 277.18, 329.63, 392, 329.63, 277.18];
  let noteIndex = 0;
  audio.musicTimer = window.setInterval(() => {
    if (!state.soundEnabled || !audio.context || !audio.masterGain) return;
    const now = audio.context.currentTime;
    const note = melody[noteIndex % melody.length];
    const oscillator = audio.context.createOscillator();
    const gain = audio.context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(note, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.022, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
    oscillator.connect(gain);
    gain.connect(audio.masterGain);
    oscillator.start(now);
    oscillator.stop(now + 0.5);
    noteIndex += 1;
  }, 420);
}

function stopMusic() {
  if (audio.musicTimer) {
    window.clearInterval(audio.musicTimer);
    audio.musicTimer = null;
  }
}

function playSfx(type) {
  if (!state.soundEnabled || !ensureAudio() || !audio.context || !audio.masterGain) return;
  const now = audio.context.currentTime;
  const oscillator = audio.context.createOscillator();
  const volume = audio.context.createGain();
  oscillator.connect(volume);
  volume.connect(audio.masterGain);

  const configs = {
    ui: { type: "triangle", frequency: 440, duration: 0.08, volume: 0.05, sweep: 80 },
    start: { type: "sine", frequency: 220, duration: 0.18, volume: 0.08, sweep: 180 },
    correct: { type: "triangle", frequency: 620, duration: 0.18, volume: 0.07, sweep: 260 },
    wrong: { type: "sawtooth", frequency: 180, duration: 0.18, volume: 0.07, sweep: -120 },
    hit: { type: "square", frequency: 90, duration: 0.15, volume: 0.06, sweep: -60 },
    hint: { type: "triangle", frequency: 500, duration: 0.12, volume: 0.05, sweep: 120 },
    pause: { type: "sine", frequency: 300, duration: 0.1, volume: 0.05, sweep: -80 },
    finish: { type: "sine", frequency: 390, duration: 0.28, volume: 0.09, sweep: 220 },
  };

  const config = configs[type] || configs.ui;
  oscillator.type = config.type;
  oscillator.frequency.setValueAtTime(config.frequency, now);
  if (config.sweep) {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(30, config.frequency + config.sweep),
      now + config.duration,
    );
  }
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(config.volume, now + 0.01);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);
  oscillator.start(now);
  oscillator.stop(now + config.duration + 0.04);
}

function gcd(first, second) {
  let a = Math.abs(first);
  let b = Math.abs(second);
  while (b !== 0) [a, b] = [b, a % b];
  return a || 1;
}

function formatLinearTerm(coefficient) {
  if (coefficient === 1) return "x";
  if (coefficient === -1) return "−x";
  return `${coefficient < 0 ? "−" : ""}${Math.abs(coefficient)}x`;
}

function makeEquationQuestion() {
  const maxCoefficient = { easy: 5, medium: 9, hard: 12 }[state.difficulty];
  const maxAnswer = { easy: 8, medium: 15, hard: 25 }[state.difficulty];
  const coefficient = randomInt(1, maxCoefficient) * (Math.random() < 0.35 ? -1 : 1);
  const answer = randomInt(-maxAnswer, maxAnswer);
  const offset = randomInt(-12, 12);
  return {
    prompt: `${formatLinearTerm(coefficient)}${offset < 0 ? ` − ${Math.abs(offset)}` : ` + ${offset}`} = ${coefficient * answer + offset}`,
    answer,
    hint: "Deshazte primero del número que acompaña a la x; luego divide entre su coeficiente.",
    explanation: `Al despejar x, el resultado es ${answer}.`,
  };
}

function makeMentalQuestion() {
  let first;
  let second;
  let operator;
  let answer;
  if (state.difficulty === "easy") {
    operator = Math.random() < 0.5 ? "+" : "−";
    first = randomInt(5, 30);
    second = randomInt(2, 20);
    if (operator === "−" && second > first) [first, second] = [second, first];
    answer = operator === "+" ? first + second : first - second;
  } else if (state.difficulty === "medium") {
    operator = Math.random() < 0.55 ? "×" : "+";
    first = operator === "×" ? randomInt(3, 12) : randomInt(30, 100);
    second = operator === "×" ? randomInt(3, 12) : randomInt(10, 80);
    answer = operator === "×" ? first * second : first + second;
  } else {
    operator = pick(["×", "÷", "−"]);
    if (operator === "×") {
      first = randomInt(8, 25);
      second = randomInt(4, 16);
      answer = first * second;
    } else if (operator === "÷") {
      second = randomInt(3, 12);
      answer = randomInt(3, 15);
      first = second * answer;
    } else {
      first = randomInt(100, 500);
      second = randomInt(25, 99);
      answer = first - second;
    }
  }
  return { prompt: `${first} ${operator} ${second} = ?`, answer, hint: "Sigue el signo de la operación y revisa el cálculo.", explanation: `El resultado es ${answer}.` };
}

function makeFractionQuestion() {
  const limit = { easy: 5, medium: 9, hard: 12 }[state.difficulty];
  let denominatorA = randomInt(2, limit);
  let denominatorB = randomInt(2, limit);
  let numeratorA = randomInt(1, denominatorA - 1);
  let numeratorB = randomInt(1, denominatorB - 1);
  const operator = state.difficulty === "easy" || Math.random() < 0.5 ? "+" : "−";
  if (operator === "−" && numeratorA * denominatorB < numeratorB * denominatorA) {
    [numeratorA, numeratorB] = [numeratorB, numeratorA];
    [denominatorA, denominatorB] = [denominatorB, denominatorA];
  }
  const numerator = operator === "+"
    ? numeratorA * denominatorB + numeratorB * denominatorA
    : numeratorA * denominatorB - numeratorB * denominatorA;
  const denominator = denominatorA * denominatorB;
  const divisor = gcd(numerator, denominator);
  const reducedNumerator = numerator / divisor;
  const reducedDenominator = denominator / divisor;
  const answer = reducedNumerator / reducedDenominator;
  const displayAnswer = reducedDenominator === 1 ? String(reducedNumerator) : `${reducedNumerator}/${reducedDenominator}`;
  return {
    prompt: `${numeratorA}/${denominatorA} ${operator} ${numeratorB}/${denominatorB} = ?`,
    answer,
    displayAnswer,
    hint: `Busca un denominador común para ${denominatorA} y ${denominatorB}.`,
    explanation: `La fracción simplificada es ${displayAnswer}.`,
  };
}

function makePowerQuestion() {
  let base;
  let exponent;
  if (state.difficulty === "easy") {
    base = randomInt(2, 12);
    exponent = 2;
  } else if (state.difficulty === "medium") {
    base = Math.random() < 0.65 ? randomInt(6, 18) : randomInt(2, 5);
    exponent = base <= 5 ? 3 : 2;
  } else {
    base = randomInt(3, 10);
    exponent = 3;
  }
  const answer = base ** exponent;
  return { prompt: `${base}${exponent === 2 ? "²" : "³"} = ?`, answer, hint: `Multiplica ${base} por sí mismo ${exponent} veces.`, explanation: `El resultado es ${answer}.` };
}

function makePercentageQuestion() {
  const options = {
    easy: [10, 25, 50],
    medium: [10, 20, 25, 50, 75],
    hard: [5, 10, 15, 20, 25, 50, 75],
  }[state.difficulty];
  const percentage = pick(options);
  const amount = randomInt(2, state.difficulty === "hard" ? 30 : 15) * 100;
  const answer = amount * percentage / 100;
  return {
    prompt: `¿Cuánto es el ${percentage}% de ${amount}?`,
    answer,
    hint: `Calcula ${percentage}/100 × ${amount}.`,
    explanation: `El ${percentage}% de ${amount} es ${answer}.`,
  };
}

function makeOrderQuestion() {
  const first = randomInt(state.difficulty === "easy" ? 2 : 3, state.difficulty === "hard" ? 12 : 9);
  const second = randomInt(2, state.difficulty === "hard" ? 12 : 9);
  const third = randomInt(2, state.difficulty === "hard" ? 12 : 9);
  const variant = randomInt(0, 2);
  if (variant === 0) {
    const answer = first + second * third;
    return { prompt: `${first} + ${second} × ${third} = ?`, answer, hint: "Haz primero la multiplicación; después suma.", explanation: `El resultado, respetando el orden de operaciones, es ${answer}.` };
  }
  if (variant === 1) {
    const answer = (first + second) * third;
    return { prompt: `(${first} + ${second}) × ${third} = ?`, answer, hint: "Empieza resolviendo lo que está dentro de los paréntesis.", explanation: `El resultado es ${answer}.` };
  }
  const answer = third + first;
  return { prompt: `${second * third} ÷ ${second} + ${first} = ?`, answer, hint: "La división va antes que la suma.", explanation: `El resultado es ${answer}.` };
}

function showScreen(name) {
  Object.entries(screens).forEach(([screenName, screen]) => {
    screen.hidden = name !== screenName;
  });
}

function createChoices() {
  const answer = state.currentQuestion.answer;
  const spread = Number.isInteger(answer) ? [1, -2, 3, -4, 5] : [0.25, -0.5, 0.5, -0.75, 1];
  const values = [answer];
  for (const delta of spread) {
    const candidate = Number.isInteger(answer) ? answer + delta : Number((answer + delta).toFixed(2));
    if (!values.some((value) => Math.abs(value - candidate) < 0.000001)) values.push(candidate);
    if (values.length === 3) break;
  }
  const choices = values.map((value) => ({
    value,
    label: Math.abs(value - answer) < 0.000001 && state.currentQuestion.displayAnswer
      ? state.currentQuestion.displayAnswer
      : Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2))),
    correct: Math.abs(value - answer) < 0.000001,
  }));
  for (let i = choices.length - 1; i > 0; i -= 1) {
    const swap = randomInt(0, i);
    [choices[i], choices[swap]] = [choices[swap], choices[i]];
  }
  return choices;
}

function startGame() {
  stopGame();
  configureCanvas();
  window.clearTimeout(state.advanceTimeout);
  state.advanceTimeout = null;
  state.difficulty = document.querySelector('input[name="difficulty"]:checked').value;
  state.mission = elements.missionSelect ? elements.missionSelect.value : "story";
  state.level = 1;
  state.round = 0;
  state.score = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.correct = 0;
  state.lives = MAX_LIVES;
  state.abandoned = false;
  state.paused = false;
  state.waitingForNextLevel = false;
  state.invulnerableUntil = 0;
  state.shieldUntil = 0;
  state.speedUntil = 0;
  state.goldMultiplier = 1;
  state.player = { x: 400, y: 426, facing: "up", moving: false };
  state.particles = [];
  state.powerUps = [];
  state.boss = null;
  state.bossDefeated = false;
  elements.modeLabel.textContent = modeNames[state.mode];
  elements.difficultyLabel.textContent = `${difficultyNames[state.difficulty]} · NIVEL ${state.level}`;
  elements.topbar.classList.remove("installable");
  elements.feedback.textContent = "";
  elements.feedback.className = "feedback-message";
  elements.pauseOverlay.hidden = true;
  elements.levelOverlay.hidden = true;
  elements.pauseButton.disabled = false;
  elements.progressTrack.setAttribute("aria-valuemax", String(TOTAL_ROUNDS));
  showScreen("game");
  updateStoryText();
  startMusic();
  playSfx("start");
  nextRound();
  elements.canvas.focus();
  state.lastFrame = performance.now();
  state.animationFrame = window.requestAnimationFrame(gameLoop);
}

function configureCanvas() {
  if (!ctx) return;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.round(WORLD.width * pixelRatio);
  const pixelHeight = Math.round(WORLD.height * pixelRatio);
  if (elements.canvas.width !== pixelWidth || elements.canvas.height !== pixelHeight) {
    elements.canvas.width = pixelWidth;
    elements.canvas.height = pixelHeight;
  }
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function stopGame() {
  if (state.animationFrame !== null) {
    window.cancelAnimationFrame(state.animationFrame);
    state.animationFrame = null;
  }
  state.heldDirections.clear();
  state.paused = false;
}

function returnToMissions() {
  stopMusic();
  stopGame();
  window.clearTimeout(state.advanceTimeout);
  state.advanceTimeout = null;
  state.level = 1;
  state.round = 0;
  state.score = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.correct = 0;
  state.lives = MAX_LIVES;
  state.currentQuestion = null;
  state.runes = [];
  state.slimes = [];
  state.particles = [];
  state.powerUps = [];
  state.waveResolved = false;
  state.hintUsed = false;
  state.abandoned = false;
  state.paused = false;
  state.waitingForNextLevel = false;
  state.shieldUntil = 0;
  state.speedUntil = 0;
  state.goldMultiplier = 1;
  state.boss = null;
  state.bossDefeated = false;
  elements.feedback.textContent = "";
  elements.pauseOverlay.hidden = true;
  elements.levelOverlay.hidden = true;
  elements.pauseButton.disabled = false;
  elements.hintButton.disabled = false;
  elements.guideMessage.textContent = "Muévete por la cámara. Toca la runa con la respuesta correcta.";
  elements.progressTrack.setAttribute("aria-valuenow", "0");
  elements.progressFill.style.width = "0%";
  elements.progressCount.textContent = "0%";
  updateHud();
  showScreen("welcome");
}

function nextRound() {
  if (state.lives <= 0) {
    finishGame();
    return;
  }
  if (state.round >= TOTAL_ROUNDS) {
    if (state.level >= TOTAL_LEVELS) {
      finishGame();
    } else {
      showLevelComplete();
    }
    return;
  }
  state.round += 1;
  state.waveResolved = false;
  state.hintUsed = false;
  state.currentQuestion = modeGenerators[state.mode]();
  const choices = createChoices();
  const positions = [...runeSpots];
  for (let i = positions.length - 1; i > 0; i -= 1) {
    const swap = randomInt(0, i);
    [positions[i], positions[swap]] = [positions[swap], positions[i]];
  }
  state.runes = choices.map((choice, index) => ({
    ...choice,
    x: positions[index].x,
    y: positions[index].y,
    pulse: Math.random() * Math.PI * 2,
  }));

  const baseCount = state.difficulty === "easy" ? 2 : state.difficulty === "medium" ? 3 : 4;
  const spawnCount = state.mission === "arcade" ? Math.min(7, baseCount + state.level) : Math.min(6, baseCount + state.level - 1);
  const safeSpawns = slimeSpawns
    .filter((spawn) => distance(spawn, state.player) > 150)
    .sort((first, second) => distance(second, state.player) - distance(first, state.player));

  const enemyTypes = ["slime", "slime", "wisp", "golem"];
  state.slimes = Array.from({ length: spawnCount }, (_, index) => {
    const spawn = safeSpawns[(index + state.round - 1) % safeSpawns.length];
    const type = enemyTypes[(state.round + index) % enemyTypes.length];
    const levelBoost = { easy: 6, medium: 8, hard: 10 }[state.difficulty];
    const speedMap = { slime: { easy: 28, medium: 38, hard: 48 }, wisp: { easy: 34, medium: 48, hard: 60 }, golem: { easy: 20, medium: 26, hard: 34 } };
    return {
      x: spawn.x,
      y: spawn.y,
      type,
      phase: Math.random() * 6,
      speed: speedMap[type][state.difficulty] + (state.level - 1) * levelBoost,
      radius: type === "golem" ? 18 : type === "wisp" ? 12 : 14,
      hp: type === "golem" ? 2 : 1,
    };
  });

  if (state.mission === "boss" && (state.round === 3 || state.round === 6 || state.round === TOTAL_ROUNDS)) {
    state.boss = { x: 400, y: 100, hp: 5 + state.level, maxHp: 5 + state.level, phase: 0, radius: 28 };
  } else {
    state.boss = null;
  }

  elements.question.textContent = state.currentQuestion.prompt;
  elements.roundLabel.textContent = `${String(state.round).padStart(2, "0")} / ${TOTAL_ROUNDS}`;
  elements.canvasMessage.textContent = state.mission === "boss" && state.boss ? "¡Jefe activo! Derrota la amenaza." : "BUSCA LA RUNA CORRECTA";
  elements.canvasMessage.className = state.mission === "boss" && state.boss ? "canvas-message message-danger" : "canvas-message";
  elements.pauseButton.disabled = false;
  elements.feedback.textContent = "";
  elements.hintButton.disabled = false;
  updateStoryText();
  elements.progressTrack.setAttribute("aria-valuenow", String(state.round - 1));
  elements.progressFill.style.width = `${((state.round - 1) / TOTAL_ROUNDS) * 100}%`;
  elements.progressCount.textContent = `${Math.round(((state.round - 1) / TOTAL_ROUNDS) * 100)}%`;
  elements.canvasMessage.classList.remove("combo-flash");
  updateHud();
}

function updateStoryText() {
  const chapterTitle = chapterTitles[state.level] || "La cámara del reino";
  const chapterText = chapterStories[state.level] || "La aventura se intensifica.";
  const missionLabel = state.mission === "boss" ? "Misión: Jefe final" : state.mission === "arcade" ? "Misión: Arcade" : "Misión: Historia";
  elements.guideMessage.textContent = `${missionLabel} · Capítulo ${state.level}: ${chapterTitle}. ${chapterText}`;
  const activePower = [];
  if (state.shieldUntil > state.time) activePower.push("escudo");
  if (state.speedUntil > state.time) activePower.push("velocidad");
  if (state.goldMultiplier > 1) activePower.push(`oro x${state.goldMultiplier}`);
  elements.powerStatus.textContent = activePower.length ? `Mejoras: ${activePower.join(", ")}` : "Sin mejoras activas";
}

function showLevelComplete() {
  const nextLevel = state.level + 1;
  const isFinalLevel = state.level >= TOTAL_LEVELS;
  state.waitingForNextLevel = !isFinalLevel;
  state.paused = true;
  if (state.animationFrame !== null) {
    window.cancelAnimationFrame(state.animationFrame);
    state.animationFrame = null;
  }
  elements.pauseOverlay.hidden = true;
  elements.levelOverlay.hidden = false;
  elements.levelTitle.textContent = isFinalLevel ? "¡La mazmorra ha sido dominada!" : `¡Nivel ${state.level} completado!`;
  elements.levelCopy.textContent = isFinalLevel
    ? "Has salvado las ruinas y la historia de Numeria te dedica una corona de luz."
    : `El reino se abre a la cámara ${nextLevel}. Los limos se vuelven más rápidos y aparecerá más peligro en cada paso.`;
  elements.nextLevelButton.innerHTML = isFinalLevel
    ? '<span>VER CRÓNICA FINAL</span><span class="button-arrow">→</span>'
    : '<span>AVANZAR AL SIGUIENTE NIVEL</span><span class="button-arrow">→</span>';
  updateStoryText();
  elements.nextLevelButton.focus();
}

function advanceToNextLevel() {
  if (state.waitingForNextLevel) {
    const nextLevelNumber = state.level + 1;
    state.level = nextLevelNumber;
    state.round = 0;
    state.streak = 0;
    state.waitingForNextLevel = false;
    state.paused = false;
    elements.levelOverlay.hidden = true;
    elements.difficultyLabel.textContent = `${difficultyNames[state.difficulty]} · NIVEL ${state.level}`;
    state.lives = Math.min(MAX_LIVES, state.lives + 1);
    state.player = { x: 400, y: 426, facing: "up", moving: false };
    elements.pauseButton.disabled = false;
    elements.feedback.textContent = "";
    elements.feedback.className = "feedback-message";
    updateStoryText();
    state.invulnerableUntil = 0;
    state.lastFrame = performance.now();
    nextRound();
    state.animationFrame = window.requestAnimationFrame(gameLoop);
    return;
  }

  finishGame();
}

function gameLoop(timestamp) {
  if (screens.game.hidden || state.paused || !ctx) {
    state.animationFrame = null;
    return;
  }
  const delta = Math.min((timestamp - state.lastFrame) / 1000, 0.04);
  state.lastFrame = timestamp;
  state.time = timestamp / 1000;
  updateGame(delta, timestamp);
  if (screens.game.hidden) return;
  drawDungeon(timestamp);
  state.animationFrame = window.requestAnimationFrame(gameLoop);
}

function updateGame(delta, timestamp) {
  if (!state.waveResolved) {
    movePlayer(delta);
    updateSlimes(delta);
    const touchedRune = state.runes.find((rune) => distance(state.player, rune) < 31);
    if (touchedRune) resolveRune(touchedRune);

    if (state.boss) {
      const bossHit = distance(state.player, state.boss) < state.boss.radius + 18;
      if (bossHit && timestamp >= state.invulnerableUntil) {
        const damage = state.shieldUntil > state.time ? 0 : 1;
        if (damage === 0) {
          elements.canvasMessage.textContent = "¡Escudo activo! El jefe no te alcanza.";
        } else {
          state.lives -= 1;
          state.streak = 0;
          state.invulnerableUntil = timestamp + 1200;
          state.player.x = state.player.x < WORLD.width / 2 ? 80 : WORLD.width - 80;
          state.player.y = WORLD.height - 80;
          elements.feedback.textContent = "¡El jefe te golpeó! Pierdes una vida.";
          elements.feedback.className = "feedback-message warning";
          playSfx("hit");
          updateHud();
          if (state.lives <= 0) finishGame();
        }
      }
    }

    if (timestamp >= state.invulnerableUntil && !state.waveResolved) {
      const touchingSlime = state.slimes.find((slime) => distance(state.player, slime) < slime.radius + 16);
      if (touchingSlime) {
        const damage = state.shieldUntil > state.time ? 0 : 1;
        if (damage === 0) {
          elements.canvasMessage.textContent = "¡Escudo activo! No pierdes vida.";
        } else {
          state.lives -= 1;
          state.streak = 0;
          state.invulnerableUntil = timestamp + 1200;
          state.player.x = state.player.x < WORLD.width / 2 ? 60 : WORLD.width - 60;
          state.player.y = WORLD.height - 60;
          elements.canvasMessage.textContent = "¡CUIDADO CON LOS LIMOS!";
          elements.feedback.textContent = "¡Un limo te atrapó! Has perdido una vida.";
          elements.feedback.className = "feedback-message warning";
          playSfx("hit");
          updateHud();
          if (state.lives <= 0) finishGame();
        }
      }
    }
  }
  state.powerUps.forEach((power, index) => {
    power.t = (power.t || 0) + delta;
    if (distance(state.player, power) < 24) {
      if (power.kind === "shield") state.shieldUntil = state.time + 7;
      if (power.kind === "speed") state.speedUntil = state.time + 7;
      if (power.kind === "gold") state.goldMultiplier = 2;
      elements.feedback.textContent = `¡Poder obtenido: ${power.kind}!`;
      elements.feedback.className = "feedback-message success";
      state.powerUps.splice(index, 1);
      playSfx("hint");
      updateStoryText();
    }
  });
  updateParticles(delta);
}

function movePlayer(delta) {
  const directionX = Number(state.heldDirections.has("right")) - Number(state.heldDirections.has("left"));
  const directionY = Number(state.heldDirections.has("down")) - Number(state.heldDirections.has("up"));
  const length = Math.hypot(directionX, directionY) || 1;
  const speed = { easy: 230, medium: 245, hard: 260 }[state.difficulty];
  const dx = directionX / length * speed * delta;
  const dy = directionY / length * speed * delta;
  state.player.moving = directionX !== 0 || directionY !== 0;
  if (directionX !== 0) state.player.facing = directionX > 0 ? "right" : "left";
  if (directionY !== 0) state.player.facing = directionY > 0 ? "down" : "up";
  const nextX = clamp(state.player.x + dx, 20, WORLD.width - 20);
  if (!hitsWall(nextX, state.player.y, WORLD.playerRadius)) state.player.x = nextX;
  const nextY = clamp(state.player.y + dy, 20, WORLD.height - 20);
  if (!hitsWall(state.player.x, nextY, WORLD.playerRadius)) state.player.y = nextY;
}

function updateSlimes(delta) {
  state.slimes.forEach((slime) => {
    slime.phase += delta * 5;
    const dx = state.player.x - slime.x;
    const dy = state.player.y - slime.y;
    const length = Math.hypot(dx, dy) || 1;
    const moveX = dx / length * slime.speed * delta;
    const moveY = dy / length * slime.speed * delta;
    if (!hitsWall(slime.x + moveX, slime.y, slime.radius)) slime.x += moveX;
    if (!hitsWall(slime.x, slime.y + moveY, slime.radius)) slime.y += moveY;
  });
  if (state.boss) {
    state.boss.phase = (state.boss.phase || 0) + delta * 4;
    const dx = state.player.x - state.boss.x;
    const dy = state.player.y - state.boss.y;
    const length = Math.hypot(dx, dy) || 1;
    const moveX = dx / length * 32 * delta;
    const moveY = dy / length * 32 * delta;
    if (!hitsWall(state.boss.x + moveX, state.boss.y, state.boss.radius)) state.boss.x += moveX;
    if (!hitsWall(state.boss.x, state.boss.y + moveY, state.boss.radius)) state.boss.y += moveY;
  }
}

function updateParticles(delta) {
  state.particles.forEach((particle) => {
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.life -= delta;
  });
  state.particles = state.particles.filter((particle) => particle.life > 0);
}

function resolveRune(rune) {
  if (state.waveResolved) return;
  state.waveResolved = true;
  if (rune.correct) {
    state.correct += 1;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    const reward = 100 + Math.min(state.streak - 1, 5) * 25;
    state.score += Math.round(reward * state.goldMultiplier);
    const comboActive = state.streak >= 3;
    elements.canvasMessage.textContent = comboActive
      ? `¡COMBO x${state.streak}! +${Math.round(reward * state.goldMultiplier)} ORO`
      : `¡RUNA CONSEGUIDA! +${Math.round(reward * state.goldMultiplier)} ORO`;
    elements.canvasMessage.classList.add("message-success");
    elements.canvasMessage.classList.toggle("combo-flash", comboActive);
    elements.feedback.textContent = `¡Correcto! ${state.currentQuestion.explanation}`;
    elements.feedback.className = "feedback-message success";
    playSfx("correct");
    createBurst(rune.x, rune.y, "#ffe18a", comboActive ? 36 : 22);

    if (state.boss) {
      state.boss.hp -= 1;
      if (state.boss.hp <= 0) {
        state.score += 350;
        elements.canvasMessage.textContent = `¡Jefe derrotado! +350 ORO`;
        elements.feedback.textContent = `¡Has derrotado al jefe! ${state.currentQuestion.explanation}`;
        state.boss = null;
        state.bossDefeated = true;
      }
      if (Math.random() < 0.35) {
        const powers = ["shield", "speed", "gold"];
        const kind = powers[randomInt(0, powers.length - 1)];
        state.powerUps.push({ x: state.player.x + randomInt(-30, 30), y: state.player.y + randomInt(-30, 30), kind, life: 8 });
      }
    } else if (Math.random() < 0.28) {
      const powers = ["shield", "speed", "gold"];
      const kind = powers[randomInt(0, powers.length - 1)];
      state.powerUps.push({ x: state.player.x + randomInt(-20, 20), y: state.player.y + randomInt(-20, 20), kind, life: 8 });
    }
  } else {
    state.lives -= 1;
    state.streak = 0;
    elements.canvasMessage.textContent = "RUNA EQUIVOCADA";
    elements.canvasMessage.classList.add("message-danger");
    elements.feedback.textContent = `Esa no era. ${state.currentQuestion.explanation}`;
    elements.feedback.className = "feedback-message warning";
    playSfx("wrong");
    createBurst(rune.x, rune.y, "#ec7b78");
  }
  elements.pauseButton.disabled = true;
  updateHud();
  updateStoryText();
  window.clearTimeout(state.advanceTimeout);
  state.advanceTimeout = window.setTimeout(nextRound, 1000);
}

function createBurst(x, y, color, count = 22) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 35 + Math.random() * 150;
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.35 + Math.random() * 0.5,
      color,
      size: 2 + Math.random() * 3,
    });
  }
}

function showHint() {
  if (!state.currentQuestion || state.hintUsed || state.waveResolved) return;
  state.hintUsed = true;
  state.score = Math.max(0, state.score - 10);
  elements.hintButton.disabled = true;
  elements.guideMessage.textContent = `Pista: ${state.currentQuestion.hint} Busca la runa correcta en la cámara.`;
  elements.canvasMessage.textContent = `LA RUNA CORRECTA ES ${state.currentQuestion.displayAnswer || state.currentQuestion.answer}`;
  elements.canvasMessage.className = "canvas-message message-hint";
  playSfx("hint");
  updateHud();
}

function updateHud() {
  elements.score.textContent = String(state.score).padStart(4, "0");
  elements.streak.innerHTML = `${state.streak} <i>${state.streak === 1 ? "acierto" : "aciertos"}</i>`;
  const hearts = elements.lives.querySelectorAll("span");
  hearts.forEach((heart, index) => heart.classList.toggle("heart-lost", index >= state.lives));
  elements.lives.setAttribute("aria-label", `${state.lives} de ${MAX_LIVES} vidas`);
  if (state.goldMultiplier > 1) {
    elements.score.setAttribute("title", "Multiplicador de oro activo");
  } else {
    elements.score.removeAttribute("title");
  }
}

function finishGame() {
  if (screens.game.hidden) return;
  stopGame();
  window.clearTimeout(state.advanceTimeout);
  state.advanceTimeout = null;
  stopMusic();
  const wasAbandoned = state.abandoned;
  elements.resultEyebrow.textContent = wasAbandoned ? "EXPEDICIÓN INTERRUMPIDA" : state.lives === 0 ? "FIN DE LA EXPEDICIÓN" : "CRÓNICA DE LA EXPEDICIÓN";
  elements.resultEmoji.textContent = state.correct >= 8 ? "♛" : state.correct >= 4 ? "✦" : "◇";
  elements.resultTitle.textContent = wasAbandoned ? "Hasta la próxima, aventurero." : state.correct >= 8 ? "¡Leyenda de Numeria!" : state.correct >= 4 ? "¡Buen viaje, explorador!" : "Las ruinas te esperan.";
  elements.resultCopy.textContent = wasAbandoned
    ? "Guardamos tus monedas de esta expedición solo para mostrar el resultado. Una nueva aventura empezará desde cero."
    : state.lives === 0
      ? "Los limos defendieron las ruinas, pero cada intento te hace más hábil. ¡Vuelve a intentarlo!"
      : `Has terminado la misión de ${difficultyNames[state.difficulty].toLowerCase()}. ¡El reino celebra tu regreso!`;
  elements.finalScore.textContent = String(state.score);
  elements.finalCorrect.textContent = `${state.correct}/${state.round}`;
  elements.resultBadge.textContent = state.correct === TOTAL_ROUNDS
    ? "✧ MAESTRO DE LAS RUNAS"
    : state.correct >= 7 ? "✧ EXPLORADOR DE ÉLITE"
      : state.correct >= 4 ? "✧ CAZADOR DE TESOROS"
        : "✧ VALIENTE APRENDIZ";
  elements.resultStreak.textContent = `Mejor racha: ${state.bestStreak} ${state.bestStreak === 1 ? "runa" : "runas"}`;
  elements.progressTrack.setAttribute("aria-valuenow", String(state.round));
  elements.progressTrack.setAttribute("aria-valuemax", String(TOTAL_ROUNDS));
  elements.progressFill.style.width = `${(state.round / TOTAL_ROUNDS) * 100}%`;
  elements.progressCount.textContent = `${Math.round((state.round / TOTAL_ROUNDS) * 100)}%`;
  elements.pauseOverlay.hidden = true;
  elements.levelOverlay.hidden = true;
  playSfx("finish");
  showScreen("result");
}

function pauseGame() {
  if (screens.game.hidden || state.paused || state.waveResolved) return;
  state.paused = true;
  state.heldDirections.clear();
  if (state.animationFrame !== null) {
    window.cancelAnimationFrame(state.animationFrame);
    state.animationFrame = null;
  }
  elements.pauseOverlay.hidden = false;
  elements.pauseButton.setAttribute("aria-label", "Reanudar juego");
  playSfx("pause");
  elements.resumeButton.focus();
}

function resumeGame() {
  if (!state.paused || screens.game.hidden) return;
  state.paused = false;
  elements.pauseOverlay.hidden = true;
  elements.pauseButton.setAttribute("aria-label", "Pausar juego");
  playSfx("pause");
  state.lastFrame = performance.now();
  state.animationFrame = window.requestAnimationFrame(gameLoop);
  elements.canvas.focus();
}

async function installGame() {
  if (!state.installPrompt) return;
  await state.installPrompt.prompt();
  state.installPrompt = null;
  elements.installButton.hidden = true;
  elements.topbar.classList.remove("installable");
}

function drawDungeon(timestamp) {
  if (!ctx) return;
  drawFloor(ctx);
  drawWalls(ctx);
  drawDecorations(ctx, timestamp);
  state.runes.forEach((rune, index) => drawRune(ctx, rune, index, timestamp));
  state.powerUps.forEach((power) => {
    ctx.save();
    ctx.translate(power.x, power.y);
    const glow = power.kind === "shield" ? "#8de0b2" : power.kind === "speed" ? "#d9a9ff" : "#ffd77d";
    ctx.shadowColor = glow;
    ctx.shadowBlur = 16;
    ctx.fillStyle = power.kind === "shield" ? "#2f7d5d" : power.kind === "speed" ? "#724cb0" : "#c8922d";
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  state.slimes.forEach((slime) => drawSlime(ctx, slime));
  if (state.boss) {
    ctx.save();
    ctx.translate(state.boss.x, state.boss.y);
    ctx.shadowColor = "rgba(255, 119, 97, 0.55)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "#bf4a3d";
    ctx.beginPath();
    ctx.arc(0, 0, state.boss.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffd7b5";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff4df";
    ctx.font = "700 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(state.boss.hp), 0, 4);
    ctx.restore();
  }
  state.particles.forEach((particle) => {
    ctx.globalAlpha = Math.max(0, particle.life / 0.85);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  if (timestamp < state.invulnerableUntil && Math.floor(timestamp / 100) % 2 === 0) return;
  drawPlayer(ctx, state.player, timestamp);
}

function drawFloor(context) {
  const background = context.createLinearGradient(0, 0, 0, WORLD.height);
  background.addColorStop(0, "#28302a");
  background.addColorStop(1, "#1b211d");
  context.fillStyle = background;
  context.fillRect(0, 0, WORLD.width, WORLD.height);
  const tileSize = 50;
  for (let row = 0; row < WORLD.height / tileSize; row += 1) {
    for (let column = 0; column < WORLD.width / tileSize; column += 1) {
      const shade = (row + column) % 2 === 0 ? "rgba(204, 202, 162, 0.025)" : "rgba(4, 9, 6, 0.045)";
      context.fillStyle = shade;
      context.fillRect(column * tileSize, row * tileSize, tileSize, tileSize);
      context.strokeStyle = "rgba(216, 210, 170, 0.035)";
      context.lineWidth = 1;
      context.strokeRect(column * tileSize + 0.5, row * tileSize + 0.5, tileSize - 1, tileSize - 1);
    }
  }
  context.strokeStyle = "rgba(219, 179, 98, 0.45)";
  context.lineWidth = 5;
  context.strokeRect(3, 3, WORLD.width - 6, WORLD.height - 6);
  context.strokeStyle = "rgba(232, 208, 145, 0.15)";
  context.lineWidth = 1;
  context.strokeRect(10, 10, WORLD.width - 20, WORLD.height - 20);
}

function drawWalls(context) {
  walls.forEach((wall) => {
    context.fillStyle = "rgba(0, 0, 0, 0.23)";
    roundedRect(context, wall.x + 4, wall.y + 6, wall.width, wall.height, 8);
    context.fill();
    const stone = context.createLinearGradient(wall.x, wall.y, wall.x, wall.y + wall.height);
    stone.addColorStop(0, "#626858");
    stone.addColorStop(1, "#343d35");
    context.fillStyle = stone;
    context.strokeStyle = "#8a8b70";
    context.lineWidth = 2;
    roundedRect(context, wall.x, wall.y, wall.width, wall.height, 8);
    context.fill();
    context.stroke();
    context.fillStyle = "rgba(224, 222, 174, 0.16)";
    context.fillRect(wall.x + 9, wall.y + 7, wall.width - 18, 2);
    context.fillStyle = "rgba(14, 19, 15, 0.3)";
    context.fillRect(wall.x + wall.width * 0.45, wall.y + 15, 2, wall.height - 20);
  });
}

function drawDecorations(context, timestamp) {
  const torches = [{ x: 33, y: 37 }, { x: 767, y: 37 }, { x: 33, y: 463 }, { x: 767, y: 463 }];
  torches.forEach((torch, index) => {
    const flicker = Math.sin(timestamp / 100 + index) * 3;
    const glow = context.createRadialGradient(torch.x, torch.y - 4, 1, torch.x, torch.y - 4, 34 + flicker);
    glow.addColorStop(0, "rgba(247, 189, 101, 0.24)");
    glow.addColorStop(1, "rgba(247, 189, 101, 0)");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(torch.x, torch.y - 4, 36 + flicker, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#d09b58";
    context.fillRect(torch.x - 3, torch.y, 6, 12);
    context.fillStyle = "#ffd483";
    context.beginPath();
    context.arc(torch.x, torch.y - 5, 4 + flicker * 0.15, 0, Math.PI * 2);
    context.fill();
  });
}

function drawRune(context, rune, index, timestamp) {
  const pulse = Math.sin(timestamp / 250 + rune.pulse) * 3;
  const radius = 34 + pulse;
  const colors = [
    { glow: "#8de0b2", dark: "#385a46", edge: "#c2efbe" },
    { glow: "#dfa76e", dark: "#70503a", edge: "#ffd599" },
    { glow: "#a7bbeb", dark: "#455272", edge: "#d7e1ff" },
  ][index];
  context.save();
  context.shadowColor = colors.glow;
  context.shadowBlur = 16;
  context.fillStyle = colors.dark;
  context.strokeStyle = colors.edge;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(rune.x, rune.y - radius);
  context.lineTo(rune.x + radius * 0.82, rune.y - radius * 0.4);
  context.lineTo(rune.x + radius * 0.82, rune.y + radius * 0.45);
  context.lineTo(rune.x, rune.y + radius);
  context.lineTo(rune.x - radius * 0.82, rune.y + radius * 0.45);
  context.lineTo(rune.x - radius * 0.82, rune.y - radius * 0.4);
  context.closePath();
  context.fill();
  context.stroke();
  context.shadowBlur = 0;
  context.fillStyle = "#fbf4dc";
  context.font = `700 ${rune.label.length > 5 ? 13 : 17}px "DM Sans", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(rune.label, rune.x, rune.y);
  context.restore();
}

function drawSlime(context, slime) {
  const bounce = Math.sin(slime.phase) * 3;
  context.save();
  context.translate(slime.x, slime.y + bounce);
  if (slime.type === "wisp") {
    context.shadowColor = "rgba(156, 178, 255, 0.45)";
    context.shadowBlur = 18;
    context.fillStyle = "#7da6ff";
    context.strokeStyle = "#dfe9ff";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, 0, slime.radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.shadowBlur = 0;
    context.fillStyle = "#f3f7ff";
    context.beginPath();
    context.arc(-3, -2, 2, 0, Math.PI * 2);
    context.arc(4, -2, 2, 0, Math.PI * 2);
    context.fill();
    context.restore();
    return;
  }
  if (slime.type === "golem") {
    context.shadowColor = "rgba(204, 154, 98, 0.38)";
    context.shadowBlur = 18;
    context.fillStyle = "#967351";
    context.strokeStyle = "#d7b084";
    context.lineWidth = 2;
    context.beginPath();
    context.rect(-slime.radius, -slime.radius, slime.radius * 2, slime.radius * 2);
    context.fill();
    context.stroke();
    context.restore();
    return;
  }
  context.shadowColor = "rgba(145, 214, 112, 0.35)";
  context.shadowBlur = 12;
  context.fillStyle = "#81985d";
  context.strokeStyle = "#b0bb79";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-16, 8);
  context.quadraticCurveTo(-18, -8, -8, -12);
  context.quadraticCurveTo(-2, -19, 5, -11);
  context.quadraticCurveTo(18, -9, 16, 8);
  context.quadraticCurveTo(0, 16, -16, 8);
  context.fill();
  context.stroke();
  context.shadowBlur = 0;
  context.fillStyle = "#273329";
  context.fillRect(-7, -3, 3, 4);
  context.fillRect(5, -3, 3, 4);
  context.restore();
}

function drawPlayer(context, player, timestamp) {
  const bob = player.moving ? Math.sin(timestamp / 60) * 2 : 0;
  context.save();
  context.translate(player.x, player.y + bob);
  context.fillStyle = "rgba(0, 0, 0, 0.26)";
  context.beginPath();
  context.ellipse(0, 14, 16, 6, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#9a5241";
  context.beginPath();
  context.moveTo(-10, -3);
  context.lineTo(-17, 13);
  context.lineTo(0, 8);
  context.lineTo(16, 13);
  context.lineTo(10, -3);
  context.closePath();
  context.fill();
  context.fillStyle = "#d0a76d";
  context.strokeStyle = "#f1d59d";
  context.lineWidth = 2;
  context.beginPath();
  roundedRect(context, -10, -9, 20, 22, 7);
  context.fill();
  context.stroke();
  context.fillStyle = "#d9b787";
  context.beginPath();
  context.arc(0, -15, 9, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#573c32";
  context.beginPath();
  context.arc(0, -18, 10, Math.PI, Math.PI * 2);
  context.fill();
  context.fillStyle = "#252a23";
  const eyeOffset = player.facing === "left" ? -3 : player.facing === "right" ? 3 : 0;
  context.fillRect(eyeOffset - 3, -16, 2, 2);
  context.fillRect(eyeOffset + 3, -16, 2, 2);
  context.restore();
}

function hitsWall(x, y, radius) {
  return walls.some((wall) => {
    const nearX = clamp(x, wall.x, wall.x + wall.width);
    const nearY = clamp(y, wall.y, wall.y + wall.height);
    return Math.hypot(x - nearX, y - nearY) < radius;
  });
}

function distance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

elements.modeCards.forEach((card) => {
  card.addEventListener("click", () => {
    elements.modeCards.forEach((item) => {
      const selected = item === card;
      item.classList.toggle("selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    state.mode = card.dataset.mode;
    playSfx("ui");
  });
});

elements.startButton.addEventListener("click", () => {
  playSfx("ui");
  startGame();
});
elements.soundToggle.addEventListener("click", () => {
  setSoundEnabled(!state.soundEnabled);
  if (state.soundEnabled) playSfx("ui");
});
elements.playAgainButton.addEventListener("click", () => {
  playSfx("ui");
  startGame();
});
elements.homeButton.addEventListener("click", returnToMissions);
elements.resultHomeButton.addEventListener("click", returnToMissions);
elements.hintButton.addEventListener("click", showHint);
elements.abandonButton.addEventListener("click", () => {
  state.abandoned = true;
  finishGame();
});
elements.pauseButton.addEventListener("click", pauseGame);
elements.nextLevelButton.addEventListener("click", advanceToNextLevel);
elements.resumeButton.addEventListener("click", resumeGame);
elements.pauseHomeButton.addEventListener("click", returnToMissions);
elements.installButton.addEventListener("click", installGame);

elements.touchButtons.forEach((button) => {
  const direction = button.dataset.direction;
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    state.heldDirections.add(direction);
    button.setPointerCapture(event.pointerId);
  });
  button.addEventListener("pointerup", () => state.heldDirections.delete(direction));
  button.addEventListener("pointercancel", () => state.heldDirections.delete(direction));
  button.addEventListener("lostpointercapture", () => state.heldDirections.delete(direction));
});

document.addEventListener("keydown", (event) => {
  if (screens.game.hidden) return;
  if (event.key === "Escape" || event.key.toLowerCase() === "p") {
    event.preventDefault();
    if (state.paused) resumeGame();
    else pauseGame();
    return;
  }
  if (state.paused) return;
  const direction = KEYS[event.key];
  if (direction) {
    event.preventDefault();
    state.heldDirections.add(direction);
  }
});

document.addEventListener("keyup", (event) => {
  const direction = KEYS[event.key];
  if (direction) state.heldDirections.delete(direction);
});

window.addEventListener("blur", () => state.heldDirections.clear());
window.addEventListener("resize", configureCanvas);
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  state.installPrompt = event;
  elements.installButton.hidden = false;
  elements.topbar.classList.add("installable");
});
window.addEventListener("appinstalled", () => {
  state.installPrompt = null;
  elements.installButton.hidden = true;
  elements.topbar.classList.remove("installable");
});

setSoundEnabled(state.soundEnabled);
window.addEventListener("pointerdown", () => ensureAudio(), { once: true });

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("./sw.js").catch((error) => {
    console.error("No se pudo preparar el modo sin conexión:", error);
  });
}
