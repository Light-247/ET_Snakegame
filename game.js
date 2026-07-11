// Standalone Rounded Rectangle Drawing Helper (for 100% cross-browser compatibility)
function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Shortest path linear interpolation for wrapping grid coordinates
function interpolateCoord(p1, p2, t, maxGrid) {
  let diff = p2 - p1;
  if (diff < -maxGrid / 2) {
    diff += maxGrid;
  } else if (diff > maxGrid / 2) {
    diff -= maxGrid;
  }
  return p1 + diff * t;
}

// Safe LocalStorage Helper Functions (prevent security/incognito mode crashes)
function safeGetItem(key, defaultValue) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn("LocalStorage blocked by privacy settings:", e);
  }
}

// Game Constants & Configuration
const GRID_SIZE = 20; 
const CANVAS_SIZE = 600; 
const TILE_SIZE = CANVAS_SIZE / GRID_SIZE; // 30px per tile

// Game State Variables
let snake = [];
let prevSnake = []; // Track previous tick for smooth slither interpolation
let direction = 'RIGHT';
let nextDirection = 'RIGHT';
let food = { x: 0, y: 0 };
let bonusFoods = []; // Extra stars created by Three's special ability
let score = 1;
let highScore = parseInt(safeGetItem('numberblocks_highScore', '1')) || 1;
let maxLengthReached = parseInt(safeGetItem('numberblocks_maxLength', '1')) || 1;
let isPlaying = false;
let isGameOver = false;
let isPaused = false;
let gameMode = 'nodie'; 
let speedSetting = 'slow'; 
let theme = 'space'; 

// Player 2 Co-op Mode Variables
let playMode = 'single'; // 'single' or 'coop'
let snake2 = [];
let prevSnake2 = [];
let direction2 = 'LEFT';
let nextDirection2 = 'LEFT';
let score2 = 1;
let isAlive2 = true;

// Items & Specials
let magnetItem = null; 
let magnetActive = false;
let magnetTimeLeft = 0; 

// V2 Upgrades State
let mathGate = null;
let currentMission = null; // target length, e.g., 7
let monsters = []; // terrible two monsters
let activeAbility = null; // null, 'three', 'four', 'five', 'eight', 'ten'
let activeAbilitySnake = 1; // 1 = Player 1, 2 = Player 2
let abilityTimeLeft = 0; 

// Particle Systems
let particles = [];        
let ambientParticles = []; 
let frameCount = 0;
let lastUpdateTime = 0;
let lastMilestone = 1;

// Animated Background Elements State
let bgWhale = { x: 700, y: 240, size: 75, speed: 0.3 };
let bgJellyfish = { x: 150, y: 320, size: 36, phase: 0, speed: 0.016 };
let bgAstronaut = { x: 300, y: 200, orbitAngle: 0, rotAngle: 0 };
let bgRocket = { x: -100, y: 150, speed: 0.6, angle: 0.12 };
let bgGalaxyAngle = 0;

// Adventure Mode Levels Configuration
const adventureLevels = [
  {
    id: 1,
    name: "레벨 1: 1 더하기 2는?",
    desc: "별을 먹어 길이 3이 되면 포탈이 열려요! 포탈을 통해 탈출하세요! 🚪",
    targetLen: 3,
    snakeStart: { x: 3, y: 10 },
    snake2Start: { x: 3, y: 12 },
    exitPortal: { x: 16, y: 10 },
    theme: "space",
    walls: [
      { x: 10, y: 6 }, { x: 10, y: 7 }, { x: 10, y: 8 }, { x: 10, y: 9 }, 
      { x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }, { x: 10, y: 13 }, { x: 10, y: 14 }
    ]
  },
  {
    id: 2,
    name: "레벨 2: 꼬불꼬불 우주 미로",
    desc: "몸이 길어지면 부딪히기 쉬워져요! 길이 5를 만들고 미로를 탈출하세요!",
    targetLen: 5,
    snakeStart: { x: 2, y: 2 },
    snake2Start: { x: 2, y: 4 },
    exitPortal: { x: 17, y: 17 },
    theme: "galaxy",
    walls: [
      // Top horizontal dividing wall
      { x: 5, y: 0 }, { x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 }, { x: 5, y: 8 }, { x: 5, y: 9 }, { x: 5, y: 10 }, { x: 5, y: 11 }, { x: 5, y: 12 }, { x: 5, y: 13 }, { x: 5, y: 14 },
      // Bottom horizontal dividing wall
      { x: 11, y: 5 }, { x: 11, y: 6 }, { x: 11, y: 7 }, { x: 11, y: 8 }, { x: 11, y: 9 }, { x: 11, y: 10 }, { x: 11, y: 11 }, { x: 11, y: 12 }, { x: 11, y: 13 }, { x: 11, y: 14 }, { x: 11, y: 15 }, { x: 11, y: 16 }, { x: 11, y: 17 }, { x: 11, y: 18 }, { x: 11, y: 19 },
      // Right horizontal dividing wall
      { x: 15, y: 0 }, { x: 15, y: 1 }, { x: 15, y: 2 }, { x: 15, y: 3 }, { x: 15, y: 4 }, { x: 15, y: 5 }, { x: 15, y: 6 }, { x: 15, y: 7 }, { x: 15, y: 8 }, { x: 15, y: 9 }, { x: 15, y: 10 }, { x: 15, y: 11 }, { x: 15, y: 12 }, { x: 15, y: 13 }, { x: 15, y: 14 }
    ]
  },
  {
    id: 3,
    name: "레벨 3: 더하기와 빼기 게이트",
    desc: "더하기(+3)와 빼기(-1)를 이용해 꼬리 길이를 정확히 6으로 맞추세요!",
    targetLen: 6,
    requireExactLength: true,
    snakeStart: { x: 2, y: 10 },
    snake2Start: { x: 2, y: 12 },
    exitPortal: { x: 17, y: 10 },
    theme: "volcano",
    fixedGates: [
      { x: 8, y: 7, value: 3, type: 'add' },
      { x: 12, y: 13, value: 1, type: 'sub' }
    ],
    walls: [
      { x: 7, y: 4 }, { x: 8, y: 4 }, { x: 9, y: 4 }, { x: 10, y: 4 }, { x: 11, y: 4 }, { x: 12, y: 4 }, { x: 13, y: 4 },
      { x: 7, y: 16 }, { x: 8, y: 16 }, { x: 9, y: 16 }, { x: 10, y: 16 }, { x: 11, y: 16 }, { x: 12, y: 16 }, { x: 13, y: 16 }
    ]
  },
  {
    id: 4,
    name: "레벨 4: 테러블 투의 방해",
    desc: "움직이는 테러블 투 몬스터를 피해 별을 모으고 길이 7을 달성하세요!",
    targetLen: 7,
    snakeStart: { x: 3, y: 3 },
    snake2Start: { x: 3, y: 5 },
    exitPortal: { x: 17, y: 17 },
    theme: "mars",
    monsters: [
      { x: 10, y: 10, moveTick: 0 },
      { x: 14, y: 6, moveTick: 0 }
    ],
    walls: [
      { x: 8, y: 8 }, { x: 9, y: 8 }, { x: 10, y: 8 }, { x: 11, y: 8 }, { x: 12, y: 8 },
      { x: 8, y: 12 }, { x: 9, y: 12 }, { x: 10, y: 12 }, { x: 11, y: 12 }, { x: 12, y: 12 }
    ]
  },
  {
    id: 5,
    name: "레벨 5: 옥토블록 관문",
    desc: "최종 보스 단계! 길이 8(옥토블록!)을 완성하고 포탈로 과감히 탈출하세요!",
    targetLen: 8,
    snakeStart: { x: 3, y: 10 },
    snake2Start: { x: 3, y: 12 },
    exitPortal: { x: 17, y: 10 },
    theme: "ocean",
    walls: [
      { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 }, { x: 10, y: 5 }, { x: 11, y: 5 }, { x: 12, y: 5 }, { x: 13, y: 5 }, { x: 14, y: 5 }, { x: 15, y: 5 },
      { x: 5, y: 15 }, { x: 6, y: 15 }, { x: 7, y: 15 }, { x: 8, y: 15 }, { x: 9, y: 15 }, { x: 10, y: 15 }, { x: 11, y: 15 }, { x: 12, y: 15 }, { x: 13, y: 15 }, { x: 14, y: 15 }, { x: 15, y: 15 }
    ]
  }
];

// Adventure Mode States
let currentLevelIndex = 0;
let levelWalls = [];
let exitPortal = null;
let fixedGates = [];

// DOM Elements
let canvas, ctx;
let startOverlay, gameOverOverlay, pauseOverlay;
let scoreValEl, highScoreValEl;
let startBtn, restartBtn, galleryBtn, closeGalleryBtn;
let galleryModal, galleryGrid;
let speedSlowBtn, speedNormalBtn, speedFastBtn;
let modeClassicBtn, modeNodieBtn, modeAdventureBtn;
let playSingleBtn, playCoopBtn; // V2
let voiceSelect; // V2
let score2ValEl, p2ScoreBoxEl, p1ScoreLabelEl; // V2
let abilityBtn; // V2
let missionBanner, missionText; // V2
let themeSelect;
let muteBtn;
let levelClearOverlay, clearDescEl, nextLevelBtn, pauseBtn, resumeBtn;

// Initialize the game
function startInit() {
  setupElements();
  setupEventListeners();
  loadSavedSettings();
  initGame();
  renderGallery();
  requestAnimationFrame(gameLoop);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startInit);
} else {
  startInit();
}

function setupElements() {
  canvas = document.getElementById('game-canvas');
  if (canvas) {
    ctx = canvas.getContext('2d');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
  }
  
  startOverlay = document.getElementById('start-overlay');
  gameOverOverlay = document.getElementById('game-over-overlay');
  pauseOverlay = document.getElementById('pause-overlay');
  
  scoreValEl = document.getElementById('score-val');
  highScoreValEl = document.getElementById('highscore-val');
  
  startBtn = document.getElementById('start-btn');
  restartBtn = document.getElementById('restart-btn');
  galleryBtn = document.getElementById('gallery-btn');
  closeGalleryBtn = document.getElementById('close-gallery-btn');
  galleryModal = document.getElementById('gallery-modal');
  galleryGrid = document.getElementById('gallery-grid');
  
  speedSlowBtn = document.getElementById('speed-slow');
  speedNormalBtn = document.getElementById('speed-normal');
  speedFastBtn = document.getElementById('speed-fast');
  
  modeClassicBtn = document.getElementById('mode-classic');
  modeNodieBtn = document.getElementById('mode-nodie');
  modeAdventureBtn = document.getElementById('mode-adventure');
  
  // V2 elements
  playSingleBtn = document.getElementById('play-single');
  playCoopBtn = document.getElementById('play-coop');
  voiceSelect = document.getElementById('voice-select');
  score2ValEl = document.getElementById('score2-val');
  p2ScoreBoxEl = document.getElementById('p2-score-box');
  p1ScoreLabelEl = document.getElementById('p1-score-label');
  abilityBtn = document.getElementById('ability-btn');
  missionBanner = document.getElementById('mission-banner');
  missionText = document.getElementById('mission-text');
  
  themeSelect = document.getElementById('theme-select');
  muteBtn = document.getElementById('mute-btn');
  
  levelClearOverlay = document.getElementById('level-clear-overlay');
  clearDescEl = document.getElementById('clear-desc');
  nextLevelBtn = document.getElementById('next-level-btn');
  pauseBtn = document.getElementById('pause-btn');
  resumeBtn = document.getElementById('resume-btn');
  
  if (highScoreValEl) {
    highScoreValEl.textContent = highScore;
  }
}

function setupEventListeners() {
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      audio.playClick();
      startGame();
    });
  }
  
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      audio.playClick();
      startGame();
    });
  }
  
  if (galleryBtn) {
    galleryBtn.addEventListener('click', () => {
      audio.playClick();
      openGallery();
    });
  }
  
  if (closeGalleryBtn) {
    closeGalleryBtn.addEventListener('click', () => {
      audio.playClick();
      closeGallery();
    });
  }
  
  window.addEventListener('keydown', handleKeyDown);
  
  const btnUp = document.getElementById('dpad-up');
  const btnDown = document.getElementById('dpad-down');
  const btnLeft = document.getElementById('dpad-left');
  const btnRight = document.getElementById('dpad-right');
  
  if (btnUp) btnUp.addEventListener('click', () => setDirection('UP'));
  if (btnDown) btnDown.addEventListener('click', () => setDirection('DOWN'));
  if (btnLeft) btnLeft.addEventListener('click', () => setDirection('LEFT'));
  if (btnRight) btnRight.addEventListener('click', () => setDirection('RIGHT'));
  
  setupTouchControls();
  
  if (speedSlowBtn) speedSlowBtn.addEventListener('click', () => setSpeed('slow'));
  if (speedNormalBtn) speedNormalBtn.addEventListener('click', () => setSpeed('normal'));
  if (speedFastBtn) speedFastBtn.addEventListener('click', () => setSpeed('fast'));
  
  if (modeClassicBtn) modeClassicBtn.addEventListener('click', () => setMode('classic'));
  if (modeNodieBtn) modeNodieBtn.addEventListener('click', () => setMode('nodie'));
  if (modeAdventureBtn) modeAdventureBtn.addEventListener('click', () => setMode('adventure'));
  if (nextLevelBtn) nextLevelBtn.addEventListener('click', handleNextLevelButton);
  if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
  if (resumeBtn) resumeBtn.addEventListener('click', togglePause);
  
  // V2 listeners
  if (playSingleBtn) playSingleBtn.addEventListener('click', () => setPlayMode('single'));
  if (playCoopBtn) playCoopBtn.addEventListener('click', () => setPlayMode('coop'));
  if (voiceSelect) {
    voiceSelect.addEventListener('change', (e) => {
      setVoiceLanguage(e.target.value);
    });
  }
  if (abilityBtn) {
    abilityBtn.addEventListener('click', () => {
      triggerAbility();
    });
  }
  
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      audio.playClick();
      setTheme(e.target.value);
    });
  }
  
  if (muteBtn) {
    muteBtn.addEventListener('click', toggleMute);
  }
}

function setPlayMode(mode) {
  playMode = mode;
  safeSetItem('numberblocks_playMode', mode);
  
  if (playSingleBtn && playCoopBtn) {
    playSingleBtn.classList.remove('active');
    playCoopBtn.classList.remove('active');
    if (mode === 'single') {
      playSingleBtn.classList.add('active');
      if (p2ScoreBoxEl) p2ScoreBoxEl.classList.add('hidden');
      if (p1ScoreLabelEl) p1ScoreLabelEl.textContent = "현재 길이 (Score)";
    } else {
      playCoopBtn.classList.add('active');
      if (p2ScoreBoxEl) p2ScoreBoxEl.classList.remove('hidden');
      if (p1ScoreLabelEl) p1ScoreLabelEl.textContent = "현재 길이 (P1)";
    }
  }
  
  // Reset game if play mode changes
  if (isPlaying) {
    initGame();
  }
}

function setVoiceLanguage(lang) {
  audio.playClick();
  setVoiceLanguageSilent(lang);
  if (lang !== 'off') {
    audio.speakCount(1);
  }
}

function setVoiceLanguageSilent(lang) {
  safeSetItem('numberblocks_voiceLang', lang);
  audio.setVoiceLanguage(lang);
}

function loadSavedSettings() {
  const savedSpeed = safeGetItem('numberblocks_speed', 'slow');
  const savedMode = safeGetItem('numberblocks_mode', 'nodie');
  const savedTheme = safeGetItem('numberblocks_theme', 'space');
  const savedMuted = safeGetItem('numberblocks_muted', 'false') === 'true';
  const savedPlayMode = safeGetItem('numberblocks_playMode', 'single');
  const savedVoiceLang = safeGetItem('numberblocks_voiceLang', 'ko');
  
  setSpeed(savedSpeed);
  setMode(savedMode);
  setTheme(savedTheme);
  setPlayMode(savedPlayMode);
  setVoiceLanguageSilent(savedVoiceLang);
  if (voiceSelect) voiceSelect.value = savedVoiceLang;
  
  if (savedMuted) {
    audio.muted = true;
    updateMuteUI(true);
  }
}

function initGame() {
  if (gameMode === 'adventure') {
    initAdventureLevel();
    return;
  }
  const startX = Math.floor(GRID_SIZE / 2);
  const startY = Math.floor(GRID_SIZE / 2);
  
  if (playMode === 'coop') {
    // Player 1 starts on the left moving RIGHT
    snake = [{ x: startX - 4, y: startY }];
    prevSnake = [{ x: startX - 4, y: startY }];
    direction = 'RIGHT';
    nextDirection = 'RIGHT';
    score = 1;
    
    // Player 2 starts on the right moving LEFT
    snake2 = [{ x: startX + 4, y: startY }];
    prevSnake2 = [{ x: startX + 4, y: startY }];
    direction2 = 'LEFT';
    nextDirection2 = 'LEFT';
    score2 = 1;
    isAlive2 = true;
    
    if (score2ValEl) score2ValEl.textContent = score2;
  } else {
    snake = [{ x: startX, y: startY }];
    prevSnake = [{ x: startX, y: startY }];
    direction = 'RIGHT';
    nextDirection = 'RIGHT';
    score = 1;
    
    snake2 = [];
    prevSnake2 = [];
    isAlive2 = false;
  }
  
  if (scoreValEl) scoreValEl.textContent = score;
  isGameOver = false;
  isPaused = false;
  updatePauseUI();
  
  magnetItem = null;
  bonusFoods = [];
  magnetActive = false;
  magnetTimeLeft = 0;
  
  // V2 variables reset
  mathGate = null;
  activeAbility = null;
  activeAbilitySnake = 1;
  abilityTimeLeft = 0;
  monsters = [];
  starProjectiles = [];
  
  particles = [];
  ambientParticles = [];
  lastMilestone = 1;
  
  bgWhale.x = CANVAS_SIZE + 100;
  bgJellyfish.x = 80;
  bgRocket.x = -150;
  
  // Set up V2 elements
  resetMission();
  spawnMonster();
  spawnMathGate();
  
  spawnFood();
}

function initAdventureLevel() {
  const level = adventureLevels[currentLevelIndex] || adventureLevels[0];
  
  if (level.theme) {
    setTheme(level.theme);
  }
  
  const startX = level.snakeStart.x;
  const startY = level.snakeStart.y;
  
  if (playMode === 'coop') {
    const start2X = level.snake2Start ? level.snake2Start.x : startX;
    const start2Y = level.snake2Start ? level.snake2Start.y : startY + 2;
    
    snake = [{ x: startX, y: startY }];
    prevSnake = [{ x: startX, y: startY }];
    direction = 'RIGHT';
    nextDirection = 'RIGHT';
    score = 1;
    
    snake2 = [{ x: start2X, y: start2Y }];
    prevSnake2 = [{ x: start2X, y: start2Y }];
    direction2 = 'LEFT';
    nextDirection2 = 'LEFT';
    score2 = 1;
    isAlive2 = true;
    
    if (score2ValEl) score2ValEl.textContent = score2;
  } else {
    snake = [{ x: startX, y: startY }];
    prevSnake = [{ x: startX, y: startY }];
    direction = 'RIGHT';
    nextDirection = 'RIGHT';
    score = 1;
    
    snake2 = [];
    prevSnake2 = [];
    isAlive2 = false;
  }
  
  if (scoreValEl) scoreValEl.textContent = score;
  isGameOver = false;
  isPaused = false;
  updatePauseUI();
  
  magnetItem = null;
  bonusFoods = [];
  magnetActive = false;
  magnetTimeLeft = 0;
  
  // V2 variables reset
  mathGate = null;
  activeAbility = null;
  activeAbilitySnake = 1;
  abilityTimeLeft = 0;
  monsters = [];
  starProjectiles = [];
  
  particles = [];
  ambientParticles = [];
  lastMilestone = 1;
  
  bgWhale.x = CANVAS_SIZE + 100;
  bgJellyfish.x = 80;
  bgRocket.x = -150;
  
  // Load adventure level elements
  levelWalls = level.walls ? level.walls.map(w => ({ ...w })) : [];
  exitPortal = { x: level.exitPortal.x, y: level.exitPortal.y, isOpen: false };
  
  if (level.monsters) {
    monsters = level.monsters.map(m => ({ ...m }));
  }
  fixedGates = level.fixedGates ? level.fixedGates.map(g => ({ ...g })) : [];
  
  updateMissionBannerUI();
  spawnFood();
}

function handleLevelClear() {
  isPlaying = false;
  audio.stopMusic();
  audio.playFanfare();
  
  if (audio.voiceLang === 'ko') {
    audio.speak("레벨 클리어! 정말 대단해요 태양이!");
  } else {
    audio.speak("Level cleared! You did it Taeyang!");
  }
  
  if (levelClearOverlay) {
    levelClearOverlay.classList.remove('hidden');
    if (clearDescEl) {
      const currentLevelName = adventureLevels[currentLevelIndex].name;
      if (audio.voiceLang === 'ko') {
        clearDescEl.innerHTML = `<strong>${currentLevelName}</strong> 완료!<br>태양이가 모든 퍼즐을 풀고 무사히 탈출구로 들어갔어요! 🎉`;
      } else {
        clearDescEl.innerHTML = `<strong>${currentLevelName}</strong> Completed!<br>Taeyang solved the puzzle and escaped! 🎉`;
      }
    }
  }
  
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      triggerConfetti(Math.floor(Math.random() * GRID_SIZE), Math.floor(Math.random() * GRID_SIZE));
    }, i * 300);
  }
}

function handleNextLevelButton() {
  if (currentLevelIndex >= adventureLevels.length) {
    restartAdventure();
  } else {
    nextLevel();
  }
}

function nextLevel() {
  audio.playClick();
  if (levelClearOverlay) levelClearOverlay.classList.add('hidden');
  
  currentLevelIndex++;
  if (currentLevelIndex >= adventureLevels.length) {
    showVictoryScreen();
  } else {
    startGame();
  }
}

function restartAdventure() {
  audio.playClick();
  currentLevelIndex = 0;
  if (levelClearOverlay) levelClearOverlay.classList.add('hidden');

  const modalTitle = levelClearOverlay?.querySelector('.modal-title');
  if (modalTitle) {
    modalTitle.textContent = "✨ 레벨 클리어! ✨";
    modalTitle.style.color = "#38d638";
    modalTitle.style.textShadow = "0 0 15px rgba(56, 214, 56, 0.4)";
  }
  if (nextLevelBtn) nextLevelBtn.textContent = "다음 스테이지 출발! 🚀";
  startGame();
}

function showVictoryScreen() {
  isPlaying = false;
  if (levelClearOverlay) {
    levelClearOverlay.classList.remove('hidden');
    
    const modalTitle = levelClearOverlay.querySelector('.modal-title');
    if (modalTitle) {
      modalTitle.textContent = "🏆 모험 완료! 🏆";
      modalTitle.style.color = "#ffd200";
      modalTitle.style.textShadow = "0 0 20px rgba(255, 210, 0, 0.6)";
    }
    
    if (clearDescEl) {
      if (audio.voiceLang === 'ko') {
        clearDescEl.innerHTML = `우와! 태양이가 아빠랑 힘을 합쳐 모든 숫자 퍼즐 스테이지를 격파했어요!<br><strong>당신은 이제 진정한 넘버블록스 마스터입니다!</strong> 🌟`;
      } else {
        clearDescEl.innerHTML = `Wow! Taeyang cleared all the number puzzle stages!<br><strong>You are now a true Numberblocks Master!</strong> 🌟`;
      }
    }
    
    if (nextLevelBtn) nextLevelBtn.textContent = "첫 번째 레벨부터 다시 하기 🔄";
  }
  
  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      triggerConfetti(Math.floor(Math.random() * GRID_SIZE), Math.floor(Math.random() * GRID_SIZE));
    }, i * 200);
  }
}

function startGame() {
  initGame();
  isPlaying = true;
  updatePauseUI();
  if (startOverlay) startOverlay.classList.add('hidden');
  if (gameOverOverlay) gameOverOverlay.classList.add('hidden');
  if (pauseOverlay) pauseOverlay.classList.add('hidden');
  
  audio.startMusic();
  if (playMode === 'coop') {
    audio.speakReaction('coop_start');
  } else {
    if (audio.voiceLang !== 'off') {
      audio.speakCount(1);
    }
  }
}

function handleGameOver() {
  isPlaying = false;
  isGameOver = true;
  isPaused = false;
  updatePauseUI();
  audio.stopMusic();
  audio.playCrash();
  
  if (gameOverOverlay) gameOverOverlay.classList.remove('hidden');
  
  const finalScore = playMode === 'coop' ? (score + score2) : score;
  
  if (finalScore > highScore) {
    highScore = finalScore;
    safeSetItem('numberblocks_highScore', highScore);
    if (highScoreValEl) highScoreValEl.textContent = highScore;
  }
  
  if (finalScore > maxLengthReached) {
    maxLengthReached = finalScore;
    safeSetItem('numberblocks_maxLength', maxLengthReached);
    renderGallery();
  }
}

function spawnFood() {
  let freeSpotFound = false;
  let attempts = 0;
  
  while (!freeSpotFound && attempts < 200) {
    attempts++;
    const rx = Math.floor(Math.random() * GRID_SIZE);
    const ry = Math.floor(Math.random() * GRID_SIZE);
    
    const onSnake = snake.some(segment => segment.x === rx && segment.y === ry);
    const onSnake2 = snake2.some(segment => segment.x === rx && segment.y === ry);
    const onBonusFood = bonusFoods.some(item => item.x === rx && item.y === ry);
    const onMagnet = magnetItem && magnetItem.x === rx && magnetItem.y === ry;
    const onGate = mathGate && mathGate.x === rx && mathGate.y === ry;
    const onFixedGate = gameMode === 'adventure' && fixedGates.some(g => g.x === rx && g.y === ry);
    const onWall = gameMode === 'adventure' && levelWalls.some(w => w.x === rx && w.y === ry);
    const onPortal = gameMode === 'adventure' && exitPortal && exitPortal.x === rx && exitPortal.y === ry;
    const onMonster = monsters.some(m => m.x === rx && m.y === ry);
    
    if (!onSnake && !onSnake2 && !onBonusFood && !onMagnet && !onGate && !onFixedGate && !onWall && !onPortal && !onMonster) {
      food = { x: rx, y: ry };
      freeSpotFound = true;
    }
  }
  
  // Fallback
  if (!freeSpotFound) {
    for (let rx = 0; rx < GRID_SIZE; rx++) {
      for (let ry = 0; ry < GRID_SIZE; ry++) {
        const onSnake = snake.some(segment => segment.x === rx && segment.y === ry);
        const onSnake2 = snake2.some(segment => segment.x === rx && segment.y === ry);
        const onWall = gameMode === 'adventure' && levelWalls.some(w => w.x === rx && w.y === ry);
        const onBonusFood = bonusFoods.some(item => item.x === rx && item.y === ry);
        if (!onSnake && !onSnake2 && !onWall && !onBonusFood) {
          food = { x: rx, y: ry };
          return;
        }
      }
    }
  }
}

function getFoodAt(x, y) {
  if (food.x === x && food.y === y) {
    return { type: 'primary', x, y };
  }
  const bonusIndex = bonusFoods.findIndex(item => item.x === x && item.y === y);
  return bonusIndex >= 0 ? { type: 'bonus', index: bonusIndex, x, y } : null;
}

function spawnBonusFood() {
  let attempts = 0;
  while (attempts < 200) {
    attempts++;
    const rx = Math.floor(Math.random() * GRID_SIZE);
    const ry = Math.floor(Math.random() * GRID_SIZE);
    const occupied = [food, ...bonusFoods, ...snake, ...snake2, ...monsters].some(item => item.x === rx && item.y === ry)
      || (magnetItem && magnetItem.x === rx && magnetItem.y === ry)
      || (mathGate && mathGate.x === rx && mathGate.y === ry)
      || (gameMode === 'adventure' && (levelWalls.some(w => w.x === rx && w.y === ry)
        || fixedGates.some(g => g.x === rx && g.y === ry)
        || (exitPortal && exitPortal.x === rx && exitPortal.y === ry)));
    if (!occupied) {
      bonusFoods.push({ x: rx, y: ry });
      return true;
    }
  }
  return false;
}

function spawnMagnet() {
  let freeSpotFound = false;
  let attempts = 0;
  while (!freeSpotFound && attempts < 100) {
    attempts++;
    const rx = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1; 
    const ry = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
    
    const onSnake = snake.some(segment => segment.x === rx && segment.y === ry);
    const onSnake2 = snake2.some(segment => segment.x === rx && segment.y === ry);
    const onFood = food.x === rx && food.y === ry || bonusFoods.some(item => item.x === rx && item.y === ry);
    const onGate = mathGate && mathGate.x === rx && mathGate.y === ry;
    const onMonster = monsters.some(item => item.x === rx && item.y === ry);
    
    if (!onSnake && !onSnake2 && !onFood && !onGate && !onMonster) {
      magnetItem = { x: rx, y: ry };
      freeSpotFound = true;
    }
  }
}

function setDirection(newDir) {
  if (isGameOver || !isPlaying || isPaused) return;
  
  if (newDir === 'UP' && direction !== 'DOWN') nextDirection = 'UP';
  else if (newDir === 'DOWN' && direction !== 'UP') nextDirection = 'DOWN';
  else if (newDir === 'LEFT' && direction !== 'RIGHT') nextDirection = 'LEFT';
  else if (newDir === 'RIGHT' && direction !== 'LEFT') nextDirection = 'RIGHT';
}

function setDirection2(newDir) {
  if (isGameOver || !isPlaying || isPaused || !isAlive2) return;
  
  if (newDir === 'UP' && direction2 !== 'DOWN') nextDirection2 = 'UP';
  else if (newDir === 'DOWN' && direction2 !== 'UP') nextDirection2 = 'DOWN';
  else if (newDir === 'LEFT' && direction2 !== 'RIGHT') nextDirection2 = 'LEFT';
  else if (newDir === 'RIGHT' && direction2 !== 'LEFT') nextDirection2 = 'RIGHT';
}

function handleKeyDown(e) {
  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      setDirection('UP');
      break;
    case 'ArrowDown':
      e.preventDefault();
      setDirection('DOWN');
      break;
    case 'ArrowLeft':
      e.preventDefault();
      setDirection('LEFT');
      break;
    case 'ArrowRight':
      e.preventDefault();
      setDirection('RIGHT');
      break;
      
    // WASD controls - coop steers Player 2, single steers Player 1
    case 'w':
    case 'W':
      e.preventDefault();
      if (playMode === 'coop') {
        setDirection2('UP');
      } else {
        setDirection('UP');
      }
      break;
    case 's':
    case 'S':
      e.preventDefault();
      if (playMode === 'coop') {
        setDirection2('DOWN');
      } else {
        setDirection('DOWN');
      }
      break;
    case 'a':
    case 'A':
      e.preventDefault();
      if (playMode === 'coop') {
        setDirection2('LEFT');
      } else {
        setDirection('LEFT');
      }
      break;
    case 'd':
    case 'D':
      e.preventDefault();
      if (playMode === 'coop') {
        setDirection2('RIGHT');
      } else {
        setDirection('RIGHT');
      }
      break;
      
    // Spacebar to trigger ability
    case ' ':
      e.preventDefault();
      triggerAbility();
      break;
    case 'p':
    case 'P':
      e.preventDefault();
      togglePause();
      break;
  }
}

function setupTouchControls() {
  if (!canvas) return;
  let touchStartX = 0;
  let touchStartY = 0;
  
  canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  
  canvas.addEventListener('touchend', (e) => {
    if (!touchStartX || !touchStartY) return;
    
    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;
    const threshold = 30;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) setDirection('RIGHT');
        else setDirection('LEFT');
      }
    } else {
      if (Math.abs(diffY) > threshold) {
        if (diffY > 0) setDirection('DOWN');
        else setDirection('UP');
      }
    }
    touchStartX = 0;
    touchStartY = 0;
  }, { passive: true });
}

function setSpeed(speed) {
  speedSetting = speed;
  safeSetItem('numberblocks_speed', speed);
  
  if (speedSlowBtn && speedNormalBtn && speedFastBtn) {
    [speedSlowBtn, speedNormalBtn, speedFastBtn].forEach(btn => btn.classList.remove('active'));
    if (speed === 'slow') speedSlowBtn.classList.add('active');
    else if (speed === 'normal') speedNormalBtn.classList.add('active');
    else if (speed === 'fast') speedFastBtn.classList.add('active');
  }
}

function setMode(mode) {
  gameMode = mode;
  safeSetItem('numberblocks_mode', mode);
  
  const buttons = [
    { el: modeClassicBtn, id: 'classic' },
    { el: modeNodieBtn, id: 'nodie' },
    { el: modeAdventureBtn, id: 'adventure' }
  ];
  
  buttons.forEach(btn => {
    if (btn.el) {
      if (btn.id === mode) btn.el.classList.add('active');
      else btn.el.classList.remove('active');
    }
  });
  
  if (mode === 'adventure') {
    currentLevelIndex = 0;
  }
  
  if (isPlaying) {
    initGame();
  }
}

function setTheme(themeName) {
  theme = themeName;
  safeSetItem('numberblocks_theme', themeName);
  
  if (document.body) {
    document.body.className = '';
    document.body.classList.add(`theme-${themeName}`);
  }
  
  if (themeSelect) {
    themeSelect.value = themeName;
  }
  
  ambientParticles = [];
}

function toggleMute() {
  const isMuted = audio.toggleMute();
  safeSetItem('numberblocks_muted', isMuted ? 'true' : 'false');
  updateMuteUI(isMuted);
}

function updateMuteUI(isMuted) {
  if (muteBtn) {
    if (isMuted) {
      muteBtn.innerHTML = '🔇';
      muteBtn.title = '음악 켜기';
    } else {
      muteBtn.innerHTML = '🔊';
      muteBtn.title = '음악 끄기';
    }
  }
}

function togglePause() {
  if (!isPlaying || isGameOver) return;
  isPaused = !isPaused;
  if (isPaused) {
    audio.stopMusic();
  } else if (!audio.muted) {
    audio.startMusic();
  }
  updatePauseUI();
}

function updatePauseUI() {
  if (pauseBtn) {
    pauseBtn.disabled = !isPlaying;
    pauseBtn.textContent = isPaused ? '▶️ 계속하기 (P)' : '⏸️ 잠깐 쉬기 (P)';
  }
  if (pauseOverlay) {
    pauseOverlay.classList.toggle('hidden', !isPaused);
  }
}

// Particle System
function triggerConfetti(gridX, gridY) {
  const pixelX = gridX * TILE_SIZE + TILE_SIZE/2;
  const pixelY = gridY * TILE_SIZE + TILE_SIZE/2;
  const colors = ['#ff385c', '#ff7700', '#ffd200', '#38d638', '#00bfff', '#8b38ff', '#ff007f'];
  
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: pixelX,
      y: pixelY,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      size: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: Math.random() * 0.02 + 0.015
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;
    
    if (p.alpha <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// Background Illustrations Animation Updates
function updateBackgroundAnimations() {
  bgWhale.x -= bgWhale.speed;
  if (bgWhale.x < -140) {
    bgWhale.x = CANVAS_SIZE + 140;
    bgWhale.y = Math.random() * (CANVAS_SIZE * 0.45) + CANVAS_SIZE * 0.15;
  }
  
  bgJellyfish.phase += bgJellyfish.speed;
  bgJellyfish.y += Math.sin(bgJellyfish.phase) * 0.3;
  bgJellyfish.x += 0.12;
  if (bgJellyfish.x > CANVAS_SIZE + 100) {
    bgJellyfish.x = -100;
    bgJellyfish.y = Math.random() * (CANVAS_SIZE * 0.4) + CANVAS_SIZE * 0.2;
  }
  
  bgAstronaut.orbitAngle += 0.0022;
  bgAstronaut.rotAngle += 0.005;
  bgAstronaut.x = CANVAS_SIZE * 0.45 + Math.cos(bgAstronaut.orbitAngle) * 170;
  bgAstronaut.y = CANVAS_SIZE * 0.45 + Math.sin(bgAstronaut.orbitAngle) * 170;
  
  bgRocket.x += bgRocket.speed;
  if (bgRocket.x > CANVAS_SIZE + 120) {
    bgRocket.x = -120;
    bgRocket.y = Math.random() * (CANVAS_SIZE * 0.5) + CANVAS_SIZE * 0.1;
  }
  
  bgGalaxyAngle += 0.0012;
}

// Ambient Theme Particles
function updateAmbientParticles() {
  if (theme === 'ocean' && Math.random() < 0.15) {
    ambientParticles.push({
      x: Math.random() * CANVAS_SIZE,
      y: CANVAS_SIZE + 10,
      vy: -(Math.random() * 1.5 + 0.5),
      vx: 0,
      size: Math.random() * 5 + 2,
      color: 'rgba(100, 225, 255, 0.35)',
      type: 'bubble',
      phase: Math.random() * 100
    });
  } else if (theme === 'volcano' && Math.random() < 0.22) {
    ambientParticles.push({
      x: Math.random() * CANVAS_SIZE,
      y: CANVAS_SIZE + 10,
      vy: -(Math.random() * 2.2 + 0.8),
      vx: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3.5 + 1.2,
      color: Math.random() < 0.5 ? '#ff3c00' : '#ff9900',
      type: 'ember'
    });
  } else if (theme === 'deepsea' && Math.random() < 0.08) {
    ambientParticles.push({
      x: Math.random() * CANVAS_SIZE,
      y: Math.random() * CANVAS_SIZE,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      size: Math.random() * 3 + 1,
      color: 'rgba(0, 255, 180, 0.45)',
      alpha: 0.1,
      alphaDir: 0.015,
      type: 'plankton'
    });
  } else if (theme === 'mars' && Math.random() < 0.16) {
    ambientParticles.push({
      x: -10,
      y: Math.random() * CANVAS_SIZE,
      vx: Math.random() * 2 + 0.5,
      vy: (Math.random() - 0.5) * 0.2,
      size: Math.random() * 2 + 1,
      color: 'rgba(230, 110, 60, 0.3)',
      type: 'dust'
    });
  } else if (theme === 'moon' && Math.random() < 0.07) {
    ambientParticles.push({
      x: Math.random() * CANVAS_SIZE,
      y: Math.random() * CANVAS_SIZE,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      size: Math.random() * 2 + 0.6,
      color: 'rgba(180, 180, 180, 0.22)',
      type: 'dust'
    });
  } else if (theme === 'space') {
    const starCount = ambientParticles.filter(p => p.type === 'star').length;
    if (starCount < 35) {
      ambientParticles.push({
        x: Math.random() * CANVAS_SIZE,
        y: Math.random() * CANVAS_SIZE,
        size: Math.random() * 1.5 + 0.4,
        color: '#ffffff',
        alpha: Math.random(),
        twinkleSpeed: 0.01 + Math.random() * 0.02,
        type: 'star'
      });
    }
  } else if (theme === 'galaxy' && Math.random() < 0.18) {
    ambientParticles.push({
      x: Math.random() * CANVAS_SIZE,
      y: Math.random() * CANVAS_SIZE,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      size: Math.random() * 3 + 1,
      color: Math.random() < 0.6 ? 'rgba(255, 50, 180, 0.28)' : 'rgba(150, 50, 255, 0.28)',
      type: 'cosmic'
    });
  }

  // Particle updates
  for (let i = ambientParticles.length - 1; i >= 0; i--) {
    const p = ambientParticles[i];
    
    if (p.type === 'bubble') {
      p.y += p.vy;
      p.x += Math.sin(p.phase + p.y * 0.07) * 0.6;
      if (p.y < -10) ambientParticles.splice(i, 1);
    } else if (p.type === 'ember') {
      p.y += p.vy;
      p.x += p.vx;
      p.size -= 0.015;
      if (p.y < -10 || p.size <= 0) ambientParticles.splice(i, 1);
    } else if (p.type === 'plankton') {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha += p.alphaDir;
      if (p.alpha >= 0.75 || p.alpha <= 0.05) p.alphaDir = -p.alphaDir;
      if (p.x < -10 || p.x > CANVAS_SIZE + 10 || p.y < -10 || p.y > CANVAS_SIZE + 10) {
        ambientParticles.splice(i, 1);
      }
    } else if (p.type === 'dust') {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x > CANVAS_SIZE + 10 || p.y < -10 || p.y > CANVAS_SIZE + 10) {
        ambientParticles.splice(i, 1);
      }
    } else if (p.type === 'star') {
      p.alpha += p.twinkleSpeed;
      if (p.alpha >= 1 || p.alpha <= 0.15) p.twinkleSpeed = -p.twinkleSpeed;
    } else if (p.type === 'cosmic') {
      p.x += p.vx;
      p.y += p.vy;
      p.size -= 0.006;
      if (p.x < -10 || p.x > CANVAS_SIZE + 10 || p.y < -10 || p.y > CANVAS_SIZE + 10 || p.size <= 0) {
        ambientParticles.splice(i, 1);
      }
    }
  }
}

function drawAmbientParticles() {
  ambientParticles.forEach(p => {
    ctx.save();
    if (p.type === 'star' || p.type === 'plankton') {
      ctx.globalAlpha = Math.max(0.1, Math.min(1, p.alpha));
    }
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// V2 Upgrades State helpers
let starProjectiles = [];

function resetMission() {
  const targets = [4, 5, 6, 7, 8, 9, 10];
  currentMission = targets[Math.floor(Math.random() * targets.length)];
  
  if (missionBanner) {
    missionBanner.classList.remove('hidden');
  }
  updateMissionBannerUI();
}

function updateMissionBannerUI() {
  if (!missionText) return;
  const currentTotal = playMode === 'coop' ? (snake.length + snake2.length) : snake.length;
  
  if (gameMode === 'adventure') {
    const level = adventureLevels[currentLevelIndex] || adventureLevels[0];
    if (audio.voiceLang === 'ko') {
      missionText.textContent = `🎯 ${level.name} - 목표 길이: ${level.targetLen} (현재: ${currentTotal})`;
    } else {
      missionText.textContent = `🎯 ${level.name} - Goal Length: ${level.targetLen} (Current: ${currentTotal})`;
    }
    const subtitleEl = document.querySelector('.subtitle');
    if (subtitleEl) {
      subtitleEl.textContent = level.desc;
    }
  } else {
    if (audio.voiceLang === 'ko') {
      missionText.textContent = `미션: 총 길이 ${currentMission}을 만드세요! (현재: ${currentTotal})`;
    } else {
      missionText.textContent = `Mission: Make total length ${currentMission}! (Current: ${currentTotal})`;
    }
    const subtitleEl = document.querySelector('.subtitle');
    if (subtitleEl) {
      subtitleEl.textContent = "태양이랑 아빠랑 함께 만드는 신나는 블록 쌓기 놀이 🎮";
    }
  }
}

function checkMissionCompletion() {
  if (gameMode === 'adventure') {
    updateMissionBannerUI();
    return;
  }
  
  const totalScore = playMode === 'coop' ? (score + score2) : score;
  if (totalScore === currentMission) {
    audio.playFanfare();
    audio.speakReaction('rainbow');
    for (let c = 0; c < 3; c++) {
      setTimeout(() => triggerConfetti(Math.floor(GRID_SIZE/2), Math.floor(GRID_SIZE/2)), c * 180);
    }
    resetMission();
  } else {
    updateMissionBannerUI();
  }
}

function spawnMonster() {
  if (monsters.length >= 2) return;
  
  let freeSpotFound = false;
  let attempts = 0;
  while (!freeSpotFound && attempts < 150) {
    attempts++;
    const rx = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
    const ry = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
    
    // Distance to Player 1 head
    const head1 = snake[0];
    const dist1 = head1 ? Math.abs(head1.x - rx) + Math.abs(head1.y - ry) : 10;
    
    // Distance to Player 2 head
    const head2 = snake2[0];
    const dist2 = head2 ? Math.abs(head2.x - rx) + Math.abs(head2.y - ry) : 10;
    
    // Keep at least 3 tiles away from heads to prevent instant collisions
    if (dist1 <= 3 || (playMode === 'coop' && isAlive2 && dist2 <= 3)) {
      continue;
    }
    
    const onSnake1 = snake.some(s => s.x === rx && s.y === ry);
    const onSnake2 = snake2.some(s => s.x === rx && s.y === ry);
    const onFood = food.x === rx && food.y === ry || bonusFoods.some(item => item.x === rx && item.y === ry);
    const onMagnet = magnetItem && magnetItem.x === rx && magnetItem.y === ry;
    const onGate = mathGate && mathGate.x === rx && mathGate.y === ry;
    const onOtherMonster = monsters.some(m => m.x === rx && m.y === ry);
    
    if (!onSnake1 && !onSnake2 && !onFood && !onMagnet && !onGate && !onOtherMonster) {
      monsters.push({
        x: rx,
        y: ry,
        moveTick: 0
      });
      freeSpotFound = true;
    }
  }
}

function updateMonsters() {
  monsters.forEach(m => {
    m.moveTick++;
    if (m.moveTick >= 4) { // Move every 4 ticks
      m.moveTick = 0;
      const choices = [
        { x: 0, y: -1 }, // UP
        { x: 0, y: 1 },  // DOWN
        { x: -1, y: 0 }, // LEFT
        { x: 1, y: 0 }   // RIGHT
      ];
      
      const shuffled = choices.sort(() => Math.random() - 0.5);
      for (let i = 0; i < shuffled.length; i++) {
        const move = shuffled[i];
        let nx = m.x + move.x;
        let ny = m.y + move.y;
        
        if (gameMode === 'adventure') {
          const isOut = nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE;
          const hitWall = levelWalls.some(w => w.x === nx && w.y === ny);
          const hitPortal = exitPortal && exitPortal.x === nx && exitPortal.y === ny;
          if (!isOut && !hitWall && !hitPortal) {
            m.x = nx;
            m.y = ny;
            break;
          }
        } else {
          m.x = (nx + GRID_SIZE) % GRID_SIZE;
          m.y = (ny + GRID_SIZE) % GRID_SIZE;
          break;
        }
      }
    }
  });
}

function spawnMathGate() {
  let freeSpotFound = false;
  let attempts = 0;
  while (!freeSpotFound && attempts < 100) {
    attempts++;
    const rx = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
    const ry = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
    
    const onSnake = snake.some(s => s.x === rx && s.y === ry);
    const onSnake2 = snake2.some(s => s.x === rx && s.y === ry);
    const onFood = food.x === rx && food.y === ry;
    
    if (!onSnake && !onSnake2 && !onFood) {
      const isAdd = Math.random() < 0.65; // 65% addition, 35% subtraction
      const val = isAdd ? (Math.random() < 0.5 ? 1 : 2) : 1; // +1, +2 or -1
      mathGate = {
        x: rx,
        y: ry,
        value: val,
        type: isAdd ? 'add' : 'sub'
      };
      freeSpotFound = true;
    }
  }
}

function triggerAbility() {
  if (activeAbility || !isPlaying || isGameOver) return;
  
  let targetLen = 0;
  let activeSnakeIdx = 1; // 1 = snake1, 2 = snake2
  
  if (playMode === 'coop') {
    if ([3, 4, 5, 8, 10].includes(snake.length)) {
      targetLen = snake.length;
      activeSnakeIdx = 1;
    } else if ([3, 4, 5, 8, 10].includes(snake2.length)) {
      targetLen = snake2.length;
      activeSnakeIdx = 2;
    }
  } else {
    if ([3, 4, 5, 8, 10].includes(snake.length)) {
      targetLen = snake.length;
      activeSnakeIdx = 1;
    }
  }
  
  if (targetLen === 0) return;
  
  activeAbilitySnake = activeSnakeIdx;
  
  const triggeringSnake = activeSnakeIdx === 1 ? snake : snake2;
  const triggeringHead = triggeringSnake[0];
  const triggeringDir = activeSnakeIdx === 1 ? direction : direction2;
  
  if (targetLen === 3) {
    activeAbility = 'three';
    abilityTimeLeft = 20;
    audio.speakReaction('magnet');
    // Spawn two independently collectible bonus stars.
    spawnBonusFood();
    spawnBonusFood();
    triggerConfetti(triggeringHead.x, triggeringHead.y);
  } 
  else if (targetLen === 4) {
    activeAbility = 'four';
    abilityTimeLeft = 40; // 2x2 square mode
    audio.speakReaction('octoblock'); // square blocks
    triggerConfetti(triggeringHead.x, triggeringHead.y);
  }
  else if (targetLen === 5) {
    activeAbility = 'five';
    abilityTimeLeft = 15;
    audio.speakReaction('high_five');
    fireStarProjectile(triggeringHead, triggeringDir, activeSnakeIdx);
  }
  else if (targetLen === 8) {
    activeAbility = 'eight';
    abilityTimeLeft = 50; // shield duration
    audio.speakReaction('octoblock');
    triggerConfetti(triggeringHead.x, triggeringHead.y);
  }
  else if (targetLen === 10) {
    activeAbility = 'ten';
    abilityTimeLeft = 45; // rocket flight
    audio.speakReaction('rocket');
    triggerConfetti(triggeringHead.x, triggeringHead.y);
  }
  
  updateAbilityButtonUI();
}

function fireStarProjectile(head, dir, ownerIdx = 1) {
  let vx = 0, vy = 0;
  if (dir === 'UP') vy = -0.5;
  else if (dir === 'DOWN') vy = 0.5;
  else if (dir === 'LEFT') vx = -0.5;
  else if (dir === 'RIGHT') vx = 0.5;
  
  starProjectiles.push({
    x: head.x,
    y: head.y,
    vx: vx,
    vy: vy,
    owner: ownerIdx
  });
}

function updateAbilityButtonUI() {
  if (!abilityBtn) return;
  
  if (activeAbility) {
    abilityBtn.disabled = true;
    abilityBtn.className = "btn btn-ability disabled";
    abilityBtn.textContent = `✨ 능력 진행 중... (${Math.ceil(abilityTimeLeft / 5)}s)`;
    return;
  }
  
  let targetLen = 0;
  if (playMode === 'coop') {
    if ([3, 4, 5, 8, 10].includes(snake.length)) targetLen = snake.length;
    else if ([3, 4, 5, 8, 10].includes(snake2.length)) targetLen = snake2.length;
  } else {
    if ([3, 4, 5, 8, 10].includes(snake.length)) targetLen = snake.length;
  }
  
  if (targetLen > 0) {
    abilityBtn.disabled = false;
    abilityBtn.className = "btn btn-ability active-glow";
    const names = { 3: '셋(3)', 4: '넷(4)', 5: '다섯(5)', 8: '여덟(8)', 10: '열(10)' };
    abilityBtn.textContent = `✨ ${names[targetLen]} 능력 활성화! (Space)`;
  } else {
    abilityBtn.disabled = true;
    abilityBtn.className = "btn btn-ability disabled";
    abilityBtn.textContent = "✨ 스페셜 능력 준비 중...";
  }
}

function isSnakeInvulnerable(playerIdx) {
  if (activeAbility === 'eight' && activeAbilitySnake === playerIdx) return true;
  if (activeAbility === 'ten' && activeAbilitySnake === playerIdx) return true;
  if (activeAbility === 'four' && activeAbilitySnake === playerIdx) return true;
  return false;
}

function updateGame() {
  if (!isPlaying || isGameOver || isPaused) return;
  
  // Update abilities
  if (activeAbility) {
    abilityTimeLeft--;
    if (abilityTimeLeft <= 0) {
      activeAbility = null;
    }
    updateAbilityButtonUI();
  }
  
  // Update star projectiles (Five's ability)
  if (starProjectiles.length > 0) {
    for (let i = starProjectiles.length - 1; i >= 0; i--) {
      const p = starProjectiles[i];
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.x < 0 || p.x >= GRID_SIZE || p.y < 0 || p.y >= GRID_SIZE) {
        starProjectiles.splice(i, 1);
        continue;
      }
      
      // Pull food if close to projectile
      const distFood = Math.abs(p.x - food.x) + Math.abs(p.y - food.y);
      if (distFood < 1.5) {
        const ownerSnake = p.owner === 2 ? snake2 : snake;
        if (ownerSnake.length > 0) {
          food.x = ownerSnake[0].x;
          food.y = ownerSnake[0].y;
        }
      }
    }
  }
  
  // Player 1 head movement
  prevSnake = snake.map(s => ({ ...s }));
  direction = nextDirection;
  
  const head = snake[0];
  let newHead = { x: head.x, y: head.y };
  
  if (direction === 'UP') newHead.y -= 1;
  else if (direction === 'DOWN') newHead.y += 1;
  else if (direction === 'LEFT') newHead.x -= 1;
  else if (direction === 'RIGHT') newHead.x += 1;
  
  const isP1OutOfBounds = (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE);
  const isP1HitWall = gameMode === 'adventure' && levelWalls.some(w => w.x === newHead.x && w.y === newHead.y);
  
  if (isP1OutOfBounds || isP1HitWall) {
    if (gameMode === 'adventure') {
      const isInvul1 = (activeAbility === 'eight' && activeAbilitySnake === 1) || (activeAbility === 'ten' && activeAbilitySnake === 1);
      if (gameMode === 'nodie' || isInvul1) {
        newHead.x = head.x;
        newHead.y = head.y;
      } else {
        handleGameOver();
        return;
      }
    } else {
      const isInvul1 = (activeAbility === 'eight' && activeAbilitySnake === 1) || (activeAbility === 'ten' && activeAbilitySnake === 1);
      if (gameMode === 'nodie' || isInvul1) {
        newHead.x = (newHead.x + GRID_SIZE) % GRID_SIZE;
        newHead.y = (newHead.y + GRID_SIZE) % GRID_SIZE;
      } else {
        handleGameOver();
        return;
      }
    }
  }
  
  // Self collision P1
  if (snake.length > 1 && !isSnakeInvulnerable(1)) {
    const isSelfCollide = snake.some(segment => segment.x === newHead.x && segment.y === newHead.y);
    if (isSelfCollide && gameMode !== 'nodie') {
      handleGameOver();
      return;
    }
  }
  
  // Player 2 head movement (if coop)
  let newHead2 = null;
  if (playMode === 'coop' && isAlive2) {
    prevSnake2 = snake2.map(s => ({ ...s }));
    direction2 = nextDirection2;
    
    const head2 = snake2[0];
    newHead2 = { x: head2.x, y: head2.y };
    
    if (direction2 === 'UP') newHead2.y -= 1;
    else if (direction2 === 'DOWN') newHead2.y += 1;
    else if (direction2 === 'LEFT') newHead2.x -= 1;
    else if (direction2 === 'RIGHT') newHead2.x += 1;
    
    const isP2OutOfBounds = (newHead2.x < 0 || newHead2.x >= GRID_SIZE || newHead2.y < 0 || newHead2.y >= GRID_SIZE);
    const isP2HitWall = gameMode === 'adventure' && levelWalls.some(w => w.x === newHead2.x && w.y === newHead2.y);
    
    if (isP2OutOfBounds || isP2HitWall) {
      if (gameMode === 'adventure') {
        const isInvul2 = (activeAbility === 'eight' && activeAbilitySnake === 2) || (activeAbility === 'ten' && activeAbilitySnake === 2);
        if (gameMode === 'nodie' || isInvul2) {
          newHead2.x = head2.x;
          newHead2.y = head2.y;
        } else {
          handleGameOver();
          return;
        }
      } else {
        const isInvul2 = (activeAbility === 'eight' && activeAbilitySnake === 2) || (activeAbility === 'ten' && activeAbilitySnake === 2);
        if (gameMode === 'nodie' || isInvul2) {
          newHead2.x = (newHead2.x + GRID_SIZE) % GRID_SIZE;
          newHead2.y = (newHead2.y + GRID_SIZE) % GRID_SIZE;
        } else {
          handleGameOver();
          return;
        }
      }
    }
    
    // Self collision P2
    if (snake2.length > 1 && !isSnakeInvulnerable(2)) {
      const isSelfCollide2 = snake2.some(segment => segment.x === newHead2.x && segment.y === newHead2.y);
      if (isSelfCollide2 && gameMode !== 'nodie') {
        handleGameOver();
        return;
      }
    }
    
    // Coop collisions
    if (gameMode !== 'nodie') {
      const p1HitsP2 = snake2.some(segment => segment.x === newHead.x && segment.y === newHead.y);
      if (p1HitsP2 && !isSnakeInvulnerable(1)) {
        handleGameOver();
        return;
      }
      const p2HitsP1 = snake.some(segment => segment.x === newHead2.x && segment.y === newHead2.y);
      if (p2HitsP1 && !isSnakeInvulnerable(2)) {
        handleGameOver();
        return;
      }
    }
  }
  
  // Unshift heads
  snake.unshift(newHead);
  const p1Food = getFoodAt(newHead.x, newHead.y);
  const p1Ate = Boolean(p1Food);
  
  let p2Food = null;
  if (playMode === 'coop' && isAlive2) {
    snake2.unshift(newHead2);
    p2Food = getFoodAt(newHead2.x, newHead2.y);
  }
  const p2Ate = Boolean(p2Food);

  if (newHead2 && newHead.x === newHead2.x && newHead.y === newHead2.y && gameMode !== 'nodie') {
    handleGameOver();
    return;
  }

  // Each snake grows only when that specific player reaches a star.
  if (!p1Ate) snake.pop();
  if (playMode === 'coop' && isAlive2 && !p2Ate) snake2.pop();
  
  // Star eating check
  if (p1Ate || p2Ate) {
    const eatenFoods = [p1Food, p2Food].filter(Boolean);
    const primaryEaten = eatenFoods.some(item => item.type === 'primary');
    const eatenBonusIndexes = new Set(
      eatenFoods.filter(item => item.type === 'bonus').map(item => item.index)
    );
    bonusFoods = bonusFoods.filter((item, index) => !eatenBonusIndexes.has(index));

    audio.playPop();
    eatenFoods.forEach(item => triggerConfetti(item.x, item.y));
    
    score = snake.length;
    if (scoreValEl) scoreValEl.textContent = score;
    
    if (playMode === 'coop' && isAlive2) {
      score2 = snake2.length;
      if (score2ValEl) score2ValEl.textContent = score2;
    }
    
    const totalScore = playMode === 'coop' ? (score + score2) : score;
    audio.speakCount(totalScore);
    
    // Milestone check
    const currentMilestone = Math.floor(totalScore / 10);
    if (currentMilestone > lastMilestone) {
      audio.playFanfare();
      lastMilestone = currentMilestone;
    }
    
    // Mission sum check
    checkMissionCompletion();
    
    // Save high score
    if (totalScore > highScore) {
      highScore = totalScore;
      safeSetItem('numberblocks_highScore', highScore);
      if (highScoreValEl) highScoreValEl.textContent = highScore;
    }
    
    if (totalScore > maxLengthReached) {
      maxLengthReached = totalScore;
      safeSetItem('numberblocks_maxLength', maxLengthReached);
      renderGallery();
    }
    
    updateAbilityButtonUI();
    
    if (Math.random() < 0.15 && !magnetActive && !magnetItem) {
      spawnMagnet();
    }
    
    if (gameMode !== 'adventure' && Math.random() < 0.35 && !mathGate) {
      spawnMathGate();
    }
    if (gameMode !== 'adventure' && Math.random() < 0.3 && monsters.length < 2) {
      spawnMonster();
    }
    
    if (primaryEaten) {
      spawnFood();
    }
  }
  
  // Magnet Pulling
  if (magnetActive) {
    magnetTimeLeft--;
    if (magnetTimeLeft <= 0) {
      magnetActive = false;
    }
    
    const pullToSnake = (s) => {
      const headPos = s[0];
      const dx = Math.abs(headPos.x - food.x);
      const dy = Math.abs(headPos.y - food.y);
      if (dx <= 2 && dy <= 2) {
        audio.playMagnetPull();
        food.x = headPos.x;
        food.y = headPos.y;
      }
    };
    
    pullToSnake(snake);
    if (playMode === 'coop' && isAlive2) {
      pullToSnake(snake2);
    }
  }
  
  // Magnet Item Eating
  const checkMagnetEat = (s) => {
    if (magnetItem && s[0].x === magnetItem.x && s[0].y === magnetItem.y) {
      magnetActive = true;
      magnetTimeLeft = 45;
      magnetItem = null;
      audio.playMagnet();
      audio.speakReaction('magnet');
      triggerConfetti(s[0].x, s[0].y);
    }
  };
  
  checkMagnetEat(snake);
  if (playMode === 'coop' && isAlive2) {
    checkMagnetEat(snake2);
  }
  
  // Math Gates Collision Check
  if (mathGate) {
    const checkGateHit = (s, playerIdx) => {
      const headPos = s[0];
      if (headPos.x === mathGate.x && headPos.y === mathGate.y) {
        const oldLen = s.length;
        const val = mathGate.value;
        
        if (mathGate.type === 'add') {
          for (let k = 0; k < val; k++) {
            s.push({ ...s[s.length - 1] });
          }
          audio.playPop();
          triggerConfetti(mathGate.x, mathGate.y);
          audio.speakMath(oldLen, '+', val, s.length);
        } else {
          const shrinkCount = Math.min(val, s.length - 1);
          if (shrinkCount > 0) {
            for (let k = 0; k < shrinkCount; k++) {
              s.pop();
            }
            audio.playCrash();
            audio.speakMath(oldLen, '-', val, s.length);
          }
        }
        
        score = snake.length;
        if (scoreValEl) scoreValEl.textContent = score;
        if (playMode === 'coop' && isAlive2) {
          score2 = snake2.length;
          if (score2ValEl) score2ValEl.textContent = score2;
        }
        
        checkMissionCompletion();
        updateAbilityButtonUI();
        
        mathGate = null;
        setTimeout(spawnMathGate, 4000);
        return true;
      }
      return false;
    };
    
    const hit = checkGateHit(snake, 1);
    if (!hit && playMode === 'coop' && isAlive2) {
      checkGateHit(snake2, 2);
    }
  }
  
  // Portal status check (Adventure Mode)
  if (gameMode === 'adventure' && exitPortal) {
    const totalScore = playMode === 'coop' ? (snake.length + snake2.length) : snake.length;
    const level = adventureLevels[currentLevelIndex] || adventureLevels[0];
    const hasReachedTarget = level.requireExactLength ? totalScore === level.targetLen : totalScore >= level.targetLen;
    if (hasReachedTarget) {
      if (!exitPortal.isOpen) {
        exitPortal.isOpen = true;
        audio.playFanfare();
        if (audio.voiceLang === 'ko') {
          audio.speak("출구가 열렸어요! 탈출하세요!");
        } else {
          audio.speak("Exit is open! Escape!");
        }
        triggerConfetti(exitPortal.x, exitPortal.y);
      }
    } else {
      exitPortal.isOpen = false;
    }
  }

  // Monsters Collision Check
  updateMonsters();
  if (monsters.length > 0) {
    for (let i = monsters.length - 1; i >= 0; i--) {
      const m = monsters[i];
      
      const checkMonsterHit = (s, playerIdx) => {
        const headPos = s[0];
        if (headPos.x === m.x && headPos.y === m.y) {
          if (activeAbility === 'eight') {
            monsters.splice(i, 1);
            audio.playPop();
            triggerConfetti(m.x, m.y);
            return true;
          }
          
          audio.playCrash();
          audio.speakReaction('terrible_two_hit');
          
          if (gameMode === 'classic') {
            handleGameOver();
            return true;
          } else {
            const shrink = Math.min(2, s.length - 1);
            for (let k = 0; k < shrink; k++) {
              s.pop();
            }
            
            const dir = playerIdx === 1 ? direction : direction2;
            let bounceX = 0, bounceY = 0;
            if (dir === 'UP') bounceY = 2;
            else if (dir === 'DOWN') bounceY = -2;
            else if (dir === 'LEFT') bounceX = 2;
            else if (dir === 'RIGHT') bounceX = -2;
            
            let bx = headPos.x + bounceX;
            let by = headPos.y + bounceY;
            
            const outOfBounds = bx < 0 || bx >= GRID_SIZE || by < 0 || by >= GRID_SIZE;
            const hitsWall = gameMode === 'adventure' && levelWalls.some(w => w.x === bx && w.y === by);
            if (!outOfBounds && !hitsWall) {
              headPos.x = bx;
              headPos.y = by;
            } else {
              if (gameMode !== 'adventure') {
                headPos.x = (bx + GRID_SIZE) % GRID_SIZE;
                headPos.y = (by + GRID_SIZE) % GRID_SIZE;
              }
            }
            
            if (gameMode === 'adventure') {
              const level = adventureLevels[currentLevelIndex];
              const origM = level.monsters ? level.monsters[i] : null;
              if (origM) {
                m.x = origM.x;
                m.y = origM.y;
              } else {
                monsters.splice(i, 1);
              }
            } else {
              monsters.splice(i, 1);
              setTimeout(spawnMonster, 6000);
            }
          }
          
          score = snake.length;
          if (scoreValEl) scoreValEl.textContent = score;
          if (playMode === 'coop' && isAlive2) {
            score2 = snake2.length;
            if (score2ValEl) score2ValEl.textContent = score2;
          }
          checkMissionCompletion();
          updateAbilityButtonUI();
          return true;
        }
        return false;
      };
      
      const hit = checkMonsterHit(snake, 1);
      if (!hit && playMode === 'coop' && isAlive2) {
        checkMonsterHit(snake2, 2);
      }
    }
  }

  // Fixed Gates Collision Check (Adventure Mode)
  if (gameMode === 'adventure' && fixedGates.length > 0) {
    const checkFixedGateHit = (s, playerIdx) => {
      const headPos = s[0];
      for (let i = fixedGates.length - 1; i >= 0; i--) {
        const fg = fixedGates[i];
        if (headPos.x === fg.x && headPos.y === fg.y) {
          const oldLen = s.length;
          const val = fg.value;
          
          if (fg.type === 'add') {
            for (let k = 0; k < val; k++) {
              s.push({ ...s[s.length - 1] });
            }
            audio.playPop();
            triggerConfetti(fg.x, fg.y);
            audio.speakMath(oldLen, '+', val, s.length);
          } else {
            const shrinkCount = Math.min(val, s.length - 1);
            if (shrinkCount > 0) {
              for (let k = 0; k < shrinkCount; k++) {
                s.pop();
              }
              audio.playCrash();
              audio.speakMath(oldLen, '-', val, s.length);
            }
          }
          
          score = snake.length;
          if (scoreValEl) scoreValEl.textContent = score;
          if (playMode === 'coop' && isAlive2) {
            score2 = snake2.length;
            if (score2ValEl) score2ValEl.textContent = score2;
          }
          
          updateMissionBannerUI();
          updateAbilityButtonUI();
          
          fixedGates.splice(i, 1);
          return true;
        }
      }
      return false;
    };
    
    const hit = checkFixedGateHit(snake, 1);
    if (!hit && playMode === 'coop' && isAlive2) {
      checkFixedGateHit(snake2, 2);
    }
  }

  // Reach Exit Portal Check (Adventure Mode)
  if (gameMode === 'adventure' && exitPortal && exitPortal.isOpen) {
    const head1 = snake[0];
    const head2 = (playMode === 'coop' && isAlive2) ? snake2[0] : null;
    
    const p1AtPortal = head1.x === exitPortal.x && head1.y === exitPortal.y;
    const p2AtPortal = head2 && head2.x === exitPortal.x && head2.y === exitPortal.y;
    
    if (p1AtPortal || p2AtPortal) {
      handleLevelClear();
      return;
    }
  }
}

// Draw Theme Illustrations Behind Grid Lines
function drawThemeBackgroundIllustrations() {
  if (!ctx) return;
  if (theme === 'ocean') {
    drawWhale(ctx, bgWhale.x, bgWhale.y, bgWhale.size);
    drawSeaweeds(ctx);
  } else if (theme === 'volcano') {
    drawVolcano(ctx);
  } else if (theme === 'deepsea') {
    drawJellyfish(ctx, bgJellyfish.x, bgJellyfish.y, bgJellyfish.size, bgJellyfish.phase);
    drawDeepSeaFlora(ctx);
  } else if (theme === 'mars') {
    drawMarsMountains(ctx);
  } else if (theme === 'moon') {
    drawMoonBackground(ctx);
    drawAstronaut(ctx, bgAstronaut.x, bgAstronaut.y, bgAstronaut.rotAngle);
  } else if (theme === 'space') {
    drawSpacePlanet(ctx, CANVAS_SIZE * 0.75, CANVAS_SIZE * 0.35, 120);
    drawRocket(ctx, bgRocket.x, bgRocket.y, bgRocket.angle);
  } else if (theme === 'galaxy') {
    drawGalaxyNebula(ctx, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 220, bgGalaxyAngle);
  }
}

function drawWhale(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0, 170, 220, 0.45)'; 
  
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.8, size * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(-size * 0.7, 0);
  ctx.lineTo(-size * 1.15, -size * 0.35);
  ctx.lineTo(-size * 1.05, 0);
  ctx.lineTo(-size * 1.15, size * 0.35);
  ctx.closePath();
  ctx.fill();
  
  ctx.beginPath();
  ctx.ellipse(-size * 0.1, size * 0.3, size * 0.18, size * 0.32, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.beginPath();
  ctx.arc(size * 0.4, -size * 0.08, size * 0.04, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(size * 0.15, -size * 0.4);
  ctx.quadraticCurveTo(size * 0.2, -size * 0.75, size * 0.45, -size * 0.65);
  ctx.moveTo(size * 0.15, -size * 0.4);
  ctx.quadraticCurveTo(size * 0.08, -size * 0.75, -size * 0.12, -size * 0.62);
  ctx.stroke();
  
  ctx.restore();
}

function drawSeaweeds(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 195, 155, 0.38)';
  const waves = [150, 300, 450];
  waves.forEach((wx, idx) => {
    const waveH = 100 + idx * 30;
    const waveOffset = Math.sin(frameCount * 0.02 + idx * 2) * 12;
    
    ctx.beginPath();
    ctx.moveTo(wx - 15, CANVAS_SIZE);
    ctx.quadraticCurveTo(wx - 10 + waveOffset, CANVAS_SIZE - waveH * 0.5, wx + waveOffset, CANVAS_SIZE - waveH);
    ctx.quadraticCurveTo(wx + 10 + waveOffset, CANVAS_SIZE - waveH * 0.5, wx + 15, CANVAS_SIZE);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}

function drawVolcano(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(115, 28, 14, 0.58)';
  ctx.beginPath();
  ctx.moveTo(0, CANVAS_SIZE);
  ctx.lineTo(CANVAS_SIZE * 0.22, CANVAS_SIZE * 0.62);
  ctx.lineTo(CANVAS_SIZE * 0.4, CANVAS_SIZE * 0.62); 
  ctx.lineTo(CANVAS_SIZE * 0.48, CANVAS_SIZE * 0.56); 
  ctx.lineTo(CANVAS_SIZE * 0.56, CANVAS_SIZE * 0.62);
  ctx.lineTo(CANVAS_SIZE * 0.78, CANVAS_SIZE * 0.62);
  ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = `rgba(255, 80, 0, ${0.58 + Math.sin(frameCount * 0.08) * 0.1})`;
  ctx.beginPath();
  ctx.ellipse(CANVAS_SIZE * 0.48, CANVAS_SIZE * 0.59, CANVAS_SIZE * 0.08, CANVAS_SIZE * 0.02, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = 'rgba(85, 16, 8, 0.42)';
  ctx.beginPath();
  ctx.moveTo(0, CANVAS_SIZE);
  ctx.lineTo(CANVAS_SIZE * 0.5, CANVAS_SIZE * 0.72);
  ctx.lineTo(CANVAS_SIZE * 0.75, CANVAS_SIZE * 0.68);
  ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE * 0.82);
  ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

function drawJellyfish(ctx, x, y, size, phase) {
  ctx.save();
  ctx.translate(x, y);
  
  ctx.fillStyle = 'rgba(0, 255, 180, 0.46)';
  ctx.strokeStyle = 'rgba(0, 255, 180, 0.38)';
  ctx.lineWidth = 2;
  
  const scaleY = 1 + Math.sin(phase) * 0.08;
  const scaleX = 1 - Math.sin(phase) * 0.04;
  ctx.scale(scaleX, scaleY);
  
  ctx.beginPath();
  ctx.arc(0, 0, size, Math.PI, 0, false);
  ctx.quadraticCurveTo(size, size * 0.22, 0, size * 0.12);
  ctx.quadraticCurveTo(-size, size * 0.22, -size, 0);
  ctx.closePath();
  ctx.fill();
  
  ctx.beginPath();
  for (let i = -2; i <= 2; i++) {
    const sx = i * size * 0.28;
    ctx.moveTo(sx, size * 0.12);
    ctx.bezierCurveTo(
      sx + Math.sin(phase * 1.5 + i) * 6, size * 0.6,
      sx - Math.sin(phase * 1.2 + i) * 6, size * 1.1,
      sx + Math.sin(phase * 0.9 + i) * 6, size * 1.7
    );
  }
  ctx.stroke();
  ctx.restore();
}

function drawDeepSeaFlora(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 160, 255, 0.38)';
  ctx.beginPath();
  ctx.arc(CANVAS_SIZE * 0.85, CANVAS_SIZE, 90, Math.PI, Math.PI * 1.5, false);
  ctx.lineTo(CANVAS_SIZE * 0.85, CANVAS_SIZE);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = 'rgba(0, 255, 150, 0.32)';
  ctx.beginPath();
  ctx.arc(CANVAS_SIZE * 0.1, CANVAS_SIZE, 70, Math.PI * 1.5, Math.PI * 2, false);
  ctx.lineTo(CANVAS_SIZE * 0.1, CANVAS_SIZE);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMarsMountains(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(145, 62, 28, 0.58)';
  ctx.beginPath();
  ctx.moveTo(0, CANVAS_SIZE);
  ctx.lineTo(0, CANVAS_SIZE * 0.74);
  ctx.lineTo(CANVAS_SIZE * 0.18, CANVAS_SIZE * 0.63);
  ctx.lineTo(CANVAS_SIZE * 0.38, CANVAS_SIZE * 0.71);
  ctx.lineTo(CANVAS_SIZE * 0.62, CANVAS_SIZE * 0.56);
  ctx.lineTo(CANVAS_SIZE * 0.82, CANVAS_SIZE * 0.68);
  ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE * 0.61);
  ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = 'rgba(175, 75, 35, 0.42)';
  ctx.beginPath();
  ctx.moveTo(0, CANVAS_SIZE);
  ctx.lineTo(0, CANVAS_SIZE * 0.84);
  ctx.lineTo(CANVAS_SIZE * 0.28, CANVAS_SIZE * 0.76);
  ctx.lineTo(CANVAS_SIZE * 0.52, CANVAS_SIZE * 0.81);
  ctx.lineTo(CANVAS_SIZE * 0.78, CANVAS_SIZE * 0.72);
  ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE * 0.8);
  ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMoonBackground(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.beginPath();
  ctx.arc(CANVAS_SIZE * 0.9, CANVAS_SIZE * 0.9, CANVAS_SIZE * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.stroke();
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  
  const craters = [
    { x: CANVAS_SIZE * 0.72, y: CANVAS_SIZE * 0.74, r: 35 },
    { x: CANVAS_SIZE * 0.58, y: CANVAS_SIZE * 0.86, r: 24 },
    { x: CANVAS_SIZE * 0.82, y: CANVAS_SIZE * 0.62, r: 18 }
  ];
  
  craters.forEach(c => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  
  ctx.restore();
}

function drawAstronaut(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.46)';
  
  drawRoundedRect(ctx, -12, -12, 24, 25, 7);
  ctx.fill();
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.arc(0, -17, 9, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = 'rgba(100, 210, 255, 0.68)';
  drawRoundedRect(ctx, -6, -19, 12, 7, 3);
  ctx.fill();
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
  ctx.fillRect(-17, -9, 5, 18);
  
  ctx.restore();
}

function drawSpacePlanet(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
  ctx.lineWidth = 9;
  ctx.save();
  ctx.scale(2.2, 0.42);
  ctx.rotate(-Math.PI / 8);
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.66, Math.PI, 0, false);
  ctx.stroke();
  ctx.restore();
  
  ctx.fillStyle = 'rgba(225, 195, 150, 0.42)';
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
  ctx.lineWidth = 9;
  ctx.save();
  ctx.scale(2.2, 0.42);
  ctx.rotate(-Math.PI / 8);
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.66, 0, Math.PI, false);
  ctx.stroke();
  ctx.restore();
  
  ctx.restore();
}

function drawRocket(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
  
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-16, -9);
  ctx.lineTo(-16, 9);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = 'rgba(255, 50, 50, 0.42)';
  ctx.beginPath();
  ctx.moveTo(-16, -9);
  ctx.lineTo(-24, -16);
  ctx.lineTo(-16, -4);
  ctx.closePath();
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(-16, 9);
  ctx.lineTo(-24, 16);
  ctx.lineTo(-16, 4);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = 'rgba(255, 130, 0, 0.68)';
  ctx.beginPath();
  ctx.moveTo(-16, -4);
  ctx.lineTo(-30, 0);
  ctx.lineTo(-16, 4);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

function drawGalaxyNebula(ctx, x, y, size, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  
  ctx.strokeStyle = 'rgba(255, 50, 180, 0.38)';
  ctx.lineWidth = 2.5;
  
  for (let arm = 0; arm < 3; arm++) {
    const startAngle = (arm * Math.PI * 2) / 3;
    ctx.beginPath();
    for (let r = 0; r < size; r += 3) {
      const theta = startAngle + (r * 0.014);
      const px = Math.cos(theta) * r;
      const py = Math.sin(theta) * r;
      
      if (r === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.11, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

// Core Game Drawing
function drawGame(t = 1) {
  if (!ctx) return;
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  
  drawAmbientParticles();
  drawThemeBackgroundIllustrations();
  
  // Draw Grid Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * TILE_SIZE, 0);
    ctx.lineTo(i * TILE_SIZE, CANVAS_SIZE);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, i * TILE_SIZE);
    ctx.lineTo(CANVAS_SIZE, i * TILE_SIZE);
    ctx.stroke();
  }
  
  // Draw Level Walls (Adventure Mode)
  if (gameMode === 'adventure') {
    levelWalls.forEach(w => {
      drawWall(ctx, w.x, w.y, TILE_SIZE);
    });
    if (exitPortal) {
      drawExitPortal(ctx, exitPortal.x, exitPortal.y, TILE_SIZE, frameCount, exitPortal.isOpen);
    }
    fixedGates.forEach(g => {
      drawMathGate(ctx, g.x, g.y, TILE_SIZE, frameCount, g);
    });
  }

  // Draw V2 Math Gate
  if (mathGate) {
    drawMathGate(ctx, mathGate.x, mathGate.y, TILE_SIZE, frameCount, mathGate);
  }
  
  // Draw V2 Monsters
  monsters.forEach(m => {
    drawMonster(ctx, m.x, m.y, TILE_SIZE, frameCount);
  });
  
  // Draw V2 Projectiles
  starProjectiles.forEach(p => {
    drawStarProjectile(ctx, p.x, p.y, TILE_SIZE, frameCount);
  });
  
  if (magnetItem) {
    drawMagnetItem(ctx, magnetItem.x * TILE_SIZE, magnetItem.y * TILE_SIZE, TILE_SIZE, frameCount);
  }
  
  drawFood(ctx, food.x * TILE_SIZE, food.y * TILE_SIZE, TILE_SIZE, frameCount);
  bonusFoods.forEach(item => {
    drawFood(ctx, item.x * TILE_SIZE, item.y * TILE_SIZE, TILE_SIZE, frameCount + 12);
  });
  
  // Draw Player 2 Snake (Co-op)
  if (playMode === 'coop' && isAlive2 && snake2.length > 0) {
    const isFourP2 = (activeAbility === 'four' && activeAbilitySnake === 2 && snake2.length === 4);
    if (isFourP2) {
      const headPos = snake2[0];
      const prevPos = (prevSnake2 && prevSnake2[0]) ? prevSnake2[0] : headPos;
      let interpX = interpolateCoord(prevPos.x, headPos.x, t, GRID_SIZE);
      let interpY = interpolateCoord(prevPos.y, headPos.y, t, GRID_SIZE);
      interpX = (interpX + GRID_SIZE) % GRID_SIZE;
      interpY = (interpY + GRID_SIZE) % GRID_SIZE;
      
      const px = interpX * TILE_SIZE;
      const py = interpY * TILE_SIZE;
      const size = TILE_SIZE * 0.46;
      const offset = TILE_SIZE * 0.24;
      
      // Draw 2x2 blocks for P2 (indices 1 to 4 with isP2 = true)
      drawBlock(ctx, px - offset, py - offset, size, 1, direction2, true, true);
      drawBlock(ctx, px + offset, py - offset, size, 2, direction2, true, true);
      drawBlock(ctx, px - offset, py + offset, size, 3, direction2, true, true);
      drawBlock(ctx, px + offset, py + offset, size, 4, direction2, true, true);
    } else {
      for (let i = snake2.length - 1; i >= 0; i--) {
        const isHead = (i === 0);
        const numValue = i + 1;
        const currPos = snake2[i];
        const prevPos = (prevSnake2 && prevSnake2[i]) ? prevSnake2[i] : currPos;
        
        let interpX = interpolateCoord(prevPos.x, currPos.x, t, GRID_SIZE);
        let interpY = interpolateCoord(prevPos.y, currPos.y, t, GRID_SIZE);
        
        interpX = (interpX + GRID_SIZE) % GRID_SIZE;
        interpY = (interpY + GRID_SIZE) % GRID_SIZE;
        
        let isMovingX = (currPos.x !== prevPos.x);
        let isMovingY = (currPos.y !== prevPos.y);
        if (!isMovingX && !isMovingY) {
          if (direction2 === 'LEFT' || direction2 === 'RIGHT') isMovingX = true;
          else isMovingY = true;
        }
        
        let drawX = interpX;
        let drawY = interpY;
        
        if (isPlaying && !isGameOver) {
          const wiggleAmp = 0.12 * TILE_SIZE;
          const wiggleSpeedFactor = 0.28;
          const wigglePhase = frameCount * wiggleSpeedFactor + i * 0.75;
          const offset = Math.sin(wigglePhase) * wiggleAmp;
          
          if (isMovingX) drawY += offset / TILE_SIZE;
          else drawX += offset / TILE_SIZE;
        }
        
        // P2 Rocket Hover flame trail
        if (activeAbility === 'ten' && activeAbilitySnake === 2 && isHead && isPlaying && !isGameOver) {
          ctx.save();
          ctx.translate(drawX * TILE_SIZE + TILE_SIZE/2, drawY * TILE_SIZE + TILE_SIZE/2);
          ctx.fillStyle = '#ff7700';
          ctx.beginPath();
          ctx.arc((Math.random() - 0.5) * 10, TILE_SIZE * 0.5 + Math.random() * 8, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        
        drawBlock(ctx, drawX * TILE_SIZE, drawY * TILE_SIZE, TILE_SIZE, numValue, direction2, isHead, true);
        
        // P2 Trail Emission
        if (isPlaying && !isGameOver && Math.random() < 0.35) {
          emitTrailParticle(drawX * TILE_SIZE + TILE_SIZE/2, drawY * TILE_SIZE + TILE_SIZE/2, theme);
        }
        
        // P2 Shield Ring
        if (activeAbility === 'eight' && activeAbilitySnake === 2 && isHead && isPlaying && !isGameOver) {
          ctx.save();
          const px = drawX * TILE_SIZE + TILE_SIZE/2;
          const py = drawY * TILE_SIZE + TILE_SIZE/2;
          ctx.translate(px, py);
          ctx.rotate(frameCount * 0.08);
          
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ff007f';
          ctx.strokeStyle = 'rgba(255, 0, 127, 0.6)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, TILE_SIZE * 0.9, 0, Math.PI * 2);
          ctx.stroke();
          
          for (let s = 0; s < 4; s++) {
            ctx.save();
            ctx.rotate((s * Math.PI) / 2);
            ctx.fillStyle = '#ff007f';
            ctx.beginPath();
            ctx.arc(TILE_SIZE * 0.9, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          ctx.restore();
        }
      }
    }
  }
  
  // Draw Player 1 Snake
  const isFourP1 = (activeAbility === 'four' && activeAbilitySnake === 1 && snake.length === 4);
  if (isFourP1) {
    const headPos = snake[0];
    const prevPos = (prevSnake && prevSnake[0]) ? prevSnake[0] : headPos;
    let interpX = interpolateCoord(prevPos.x, headPos.x, t, GRID_SIZE);
    let interpY = interpolateCoord(prevPos.y, headPos.y, t, GRID_SIZE);
    interpX = (interpX + GRID_SIZE) % GRID_SIZE;
    interpY = (interpY + GRID_SIZE) % GRID_SIZE;
    
    const px = interpX * TILE_SIZE;
    const py = interpY * TILE_SIZE;
    const size = TILE_SIZE * 0.46;
    const offset = TILE_SIZE * 0.24;
    
    // Draw 2x2 blocks for P1 (indices 1 to 4)
    drawBlock(ctx, px - offset, py - offset, size, 1, direction, true, false);
    drawBlock(ctx, px + offset, py - offset, size, 2, direction, true, false);
    drawBlock(ctx, px - offset, py + offset, size, 3, direction, true, false);
    drawBlock(ctx, px + offset, py + offset, size, 4, direction, true, false);
  } else {
    for (let i = snake.length - 1; i >= 0; i--) {
      const isHead = (i === 0);
      const numValue = i + 1;
      const currPos = snake[i];
      const prevPos = (prevSnake && prevSnake[i]) ? prevSnake[i] : currPos;
      
      let interpX = interpolateCoord(prevPos.x, currPos.x, t, GRID_SIZE);
      let interpY = interpolateCoord(prevPos.y, currPos.y, t, GRID_SIZE);
      
      interpX = (interpX + GRID_SIZE) % GRID_SIZE;
      interpY = (interpY + GRID_SIZE) % GRID_SIZE;
      
      let isMovingX = (currPos.x !== prevPos.x);
      let isMovingY = (currPos.y !== prevPos.y);
      if (!isMovingX && !isMovingY) {
        if (direction === 'LEFT' || direction === 'RIGHT') isMovingX = true;
        else isMovingY = true;
      }
      
      let drawX = interpX;
      let drawY = interpY;
      
      if (isPlaying && !isGameOver) {
        const wiggleAmp = 0.12 * TILE_SIZE; 
        let wiggleSpeedFactor = 0.28;
        if (speedSetting === 'normal') wiggleSpeedFactor = 0.38;
        else if (speedSetting === 'fast') wiggleSpeedFactor = 0.52;
        
        const wigglePhase = frameCount * wiggleSpeedFactor + i * 0.75;
        const offset = Math.sin(wigglePhase) * wiggleAmp;
        
        if (isMovingX) {
          drawY += offset / TILE_SIZE; 
        } else {
          drawX += offset / TILE_SIZE; 
        }
      }
      
      // P1 Rocket Hover flame trail
      if (activeAbility === 'ten' && activeAbilitySnake === 1 && isHead && isPlaying && !isGameOver) {
        ctx.save();
        ctx.translate(drawX * TILE_SIZE + TILE_SIZE/2, drawY * TILE_SIZE + TILE_SIZE/2);
        ctx.fillStyle = '#ff7700';
        ctx.beginPath();
        ctx.arc((Math.random() - 0.5) * 10, TILE_SIZE * 0.5 + Math.random() * 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      
      drawBlock(
        ctx, 
        drawX * TILE_SIZE, 
        drawY * TILE_SIZE, 
        TILE_SIZE, 
        numValue, 
        direction, 
        isHead,
        false
      );
      
      // P1 Trail Emission
      if (isPlaying && !isGameOver && Math.random() < 0.35) {
        emitTrailParticle(drawX * TILE_SIZE + TILE_SIZE/2, drawY * TILE_SIZE + TILE_SIZE/2, theme);
      }
      
      // P1 Shield Ring
      if (activeAbility === 'eight' && activeAbilitySnake === 1 && isHead && isPlaying && !isGameOver) {
        ctx.save();
        const px = drawX * TILE_SIZE + TILE_SIZE/2;
        const py = drawY * TILE_SIZE + TILE_SIZE/2;
        ctx.translate(px, py);
        ctx.rotate(frameCount * 0.08);
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff007f';
        ctx.strokeStyle = 'rgba(255, 0, 127, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, TILE_SIZE * 0.9, 0, Math.PI * 2);
        ctx.stroke();
        
        for (let s = 0; s < 4; s++) {
          ctx.save();
          ctx.rotate((s * Math.PI) / 2);
          ctx.fillStyle = '#ff007f';
          ctx.beginPath();
          ctx.arc(TILE_SIZE * 0.9, 0, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }
    }
  }
  
  if (magnetActive) {
    const drawMagnetRing = (s, prevS) => {
      if (s.length === 0) return;
      const headPos = s[0];
      const prevHeadPos = (prevS && prevS[0]) ? prevS[0] : headPos;
      
      let interpHeadX = interpolateCoord(prevHeadPos.x, headPos.x, t, GRID_SIZE);
      let interpHeadY = interpolateCoord(prevHeadPos.y, headPos.y, t, GRID_SIZE);
      
      interpHeadX = (interpHeadX + GRID_SIZE) % GRID_SIZE;
      interpHeadY = (interpHeadY + GRID_SIZE) % GRID_SIZE;
      
      const headPixelX = interpHeadX * TILE_SIZE + TILE_SIZE / 2;
      const headPixelY = interpHeadY * TILE_SIZE + TILE_SIZE / 2;
      
      ctx.save();
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(headPixelX, headPixelY, TILE_SIZE * 2.2, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = `rgba(0, 255, 255, ${0.05 + Math.sin(frameCount * 0.12) * 0.025})`;
      ctx.fill();
      ctx.restore();
    };
    
    drawMagnetRing(snake, prevSnake);
    if (playMode === 'coop' && isAlive2) {
      drawMagnetRing(snake2, prevSnake2);
    }
  }
  
  drawParticles();
}

function drawMathGate(ctx, x, y, size, frameCount, gate = mathGate) {
  if (!gate) return;
  ctx.save();
  const px = x * size + size/2;
  const py = y * size + size/2;
  const pulse = 1 + Math.sin(frameCount * 0.15) * 0.08;
  
  ctx.translate(px, py);
  ctx.scale(pulse, pulse);
  
  const isAdd = gate.type === 'add';
  ctx.shadowBlur = 15;
  ctx.shadowColor = isAdd ? '#38d638' : '#ff385c';
  ctx.strokeStyle = isAdd ? '#38d638' : '#ff385c';
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 4]);
  
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.65, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.fillStyle = isAdd ? 'rgba(56, 214, 56, 0.12)' : 'rgba(255, 56, 92, 0.12)';
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.55, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.shadowBlur = 5;
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(size * 0.42)}px var(--font-main)`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const label = (isAdd ? '+' : '-') + gate.value;
  ctx.fillText(label, 0, 0);
  ctx.restore();
}

function drawWall(ctx, x, y, size) {
  ctx.save();
  ctx.fillStyle = '#6b7280'; // Cute cartoon grey wall block
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 2.5;
  drawRoundedRect(ctx, x * size + 2, y * size + 2, size - 4, size - 4, 6);
  ctx.fill();
  ctx.stroke();
  
  // Highlight reflection for cute cartoon look
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.ellipse(x * size + size * 0.3, y * size + size * 0.3, size * 0.12, size * 0.08, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  
  // A tiny inner panel for texture
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.strokeRect(x * size + 5, y * size + 5, size - 10, size - 10);
  ctx.restore();
}

function drawExitPortal(ctx, x, y, size, frameCount, isOpen) {
  ctx.save();
  const px = x * size + size / 2;
  const py = y * size + size / 2;
  ctx.translate(px, py);
  ctx.rotate(frameCount * 0.05);
  
  ctx.shadowBlur = 15;
  ctx.shadowColor = isOpen ? '#10b981' : '#ef4444';
  
  ctx.strokeStyle = isOpen ? '#10b981' : '#ef4444';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
  ctx.stroke();
  
  // Swirl texture
  ctx.strokeStyle = isOpen ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, i * Math.PI / 2, i * Math.PI / 2 + Math.PI / 3);
    ctx.stroke();
  }
  
  // Center vortex
  ctx.fillStyle = isOpen ? '#3b82f6' : '#7f1d1d';
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.18, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
  ctx.save();
  ctx.translate(px, py);
  ctx.font = 'bold 9px var(--font-main)';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isOpen ? "EXIT" : "LOCK", 0, 0);
  ctx.restore();
}

function drawMonster(ctx, x, y, size, frameCount) {
  ctx.save();
  const px = x * size + size/2;
  const py = y * size + size/2;
  ctx.translate(px, py);
  
  const bounce = Math.sin(frameCount * 0.2) * 2;
  ctx.translate(0, bounce);
  
  const w = size * 0.85;
  const h = size * 1.5;
  
  ctx.fillStyle = '#8b38ff';
  ctx.strokeStyle = '#5e1dbd';
  ctx.lineWidth = 2;
  
  drawRoundedRect(ctx, -w/2, -h/2, w, h, size * 0.18);
  ctx.fill();
  ctx.stroke();
  
  ctx.fillStyle = '#ffd200';
  ctx.beginPath();
  ctx.arc(-w * 0.22, -h * 0.18, size * 0.15, 0, Math.PI * 2);
  ctx.arc(w * 0.22, -h * 0.18, size * 0.15, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(-w * 0.22, -h * 0.18, size * 0.06, 0, Math.PI * 2);
  ctx.arc(w * 0.22, -h * 0.18, size * 0.06, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.42, -h * 0.32);
  ctx.lineTo(-w * 0.1, -h * 0.22);
  ctx.moveTo(w * 0.42, -h * 0.32);
  ctx.lineTo(w * 0.1, -h * 0.22);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(-w * 0.22, h * 0.12);
  ctx.quadraticCurveTo(0, h * 0.28, w * 0.22, h * 0.12);
  ctx.stroke();
  
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, h * 0.3, size * 0.18, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#000000';
  ctx.font = `bold ${Math.round(size * 0.28)}px var(--font-main)`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('2', 0, h * 0.3);
  
  ctx.restore();
}

function drawStarProjectile(ctx, x, y, size, frameCount) {
  ctx.save();
  const px = x * size + size/2;
  const py = y * size + size/2;
  ctx.translate(px, py);
  ctx.rotate(frameCount * 0.18);
  
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#ffd200';
  ctx.fillStyle = '#ffd200';
  ctx.strokeStyle = '#ff7700';
  ctx.lineWidth = 1.8;
  
  ctx.beginPath();
  const outerR = size * 0.35;
  const innerR = size * 0.15;
  for (let i = 0; i < 5; i++) {
    ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * outerR,
               Math.sin((18 + i * 72) * Math.PI / 180) * outerR);
    ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * innerR,
               Math.sin((54 + i * 72) * Math.PI / 180) * innerR);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// RequestAnimationFrame loop scheduler
function gameLoop(timestamp) {
  if (!timestamp) timestamp = performance.now();
  if (!lastUpdateTime) lastUpdateTime = timestamp;
  const elapsed = timestamp - lastUpdateTime;
  
  let speedMs = 280; 
  if (speedSetting === 'normal') speedMs = 180;
  else if (speedSetting === 'fast') speedMs = 100;
  
  let t = elapsed / speedMs;
  if (t > 1) t = 1;
  if (t < 0) t = 0;
  
  if (elapsed >= speedMs) {
    updateGame();
    lastUpdateTime = timestamp;
    t = 0; 
  }
  
  updateParticles();
  updateAmbientParticles();
  updateBackgroundAnimations(); 
  
  drawGame(t);
  
  frameCount++;
  requestAnimationFrame(gameLoop);
}

// Drawer function for Numberblock blocks (reused by game and gallery!)
// Dynamic Facial Expression Helpers
function getSnakeExpression(s, isP2) {
  if (isGameOver) return 'dizzy';
  if (!s || s.length === 0) return 'normal';
  
  const headPos = s[0];
  
  // 1. Happy expression when food is close (distance <= 2)
  const distToFood = Math.abs(headPos.x - food.x) + Math.abs(headPos.y - food.y);
  if (distToFood <= 2) {
    return 'happy';
  }
  
  // 2. Scared expression when a monster is close (distance <= 2)
  for (let m of monsters) {
    const distToMonster = Math.abs(headPos.x - m.x) + Math.abs(headPos.y - m.y);
    if (distToMonster <= 2) {
      return 'scared';
    }
  }
  
  // 3. Scared expression when a wall is directly ahead (Adventure mode)
  if (gameMode === 'adventure' && levelWalls) {
    const dir = isP2 ? direction2 : direction;
    let nextX = headPos.x;
    let nextY = headPos.y;
    if (dir === 'UP') nextY -= 1;
    else if (dir === 'DOWN') nextY += 1;
    else if (dir === 'LEFT') nextX -= 1;
    else if (dir === 'RIGHT') nextX += 1;
    
    const hitWall = levelWalls.some(w => w.x === nextX && w.y === nextY);
    if (hitWall) {
      return 'scared';
    }
  }
  
  return 'normal';
}

function getBlockExpression(index, isHead, isP2, isGallery = false) {
  if (isGallery) return 'normal';
  if (isGameOver) return 'dizzy';
  if (!isHead) return 'normal';
  return getSnakeExpression(isP2 ? snake2 : snake, isP2);
}

function drawCharacterEyes(ctx, x1, y1, r1, x2, y2, r2, expr, size) {
  ctx.save();
  if (expr === 'dizzy') {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = size * 0.05;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(x1 - r1, y1 - r1);
    ctx.lineTo(x1 + r1, y1 + r1);
    ctx.moveTo(x1 + r1, y1 - r1);
    ctx.lineTo(x1 - r1, y1 + r1);
    ctx.stroke();
    
    if (x2 !== null) {
      ctx.beginPath();
      ctx.moveTo(x2 - r2, y2 - r2);
      ctx.lineTo(x2 + r2, y2 + r2);
      ctx.moveTo(x2 + r2, y2 - r2);
      ctx.lineTo(x2 - r2, y2 + r2);
      ctx.stroke();
    }
  } else if (expr === 'happy') {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = size * 0.06;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.arc(x1, y1 + r1 * 0.2, r1, Math.PI, 0);
    ctx.stroke();
    
    if (x2 !== null) {
      ctx.beginPath();
      ctx.arc(x2, y2 + r2 * 0.2, r2, Math.PI, 0);
      ctx.stroke();
    }
  } else if (expr === 'scared') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x1, y1, r1, 0, Math.PI * 2);
    if (x2 !== null) ctx.arc(x2, y2, r2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x1, y1, r1 * 0.3, 0, Math.PI * 2);
    if (x2 !== null) ctx.arc(x2, y2, r2 * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x1, y1, r1, 0, Math.PI * 2);
    if (x2 !== null) ctx.arc(x2, y2, r2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x1, y1, r1 * 0.5, 0, Math.PI * 2);
    if (x2 !== null) ctx.arc(x2, y2, r2 * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x1 - r1 * 0.2, y1 - r1 * 0.2, r1 * 0.15, 0, Math.PI * 2);
    if (x2 !== null) ctx.arc(x2 - r2 * 0.2, y2 - r2 * 0.2, r2 * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSquareEyes(ctx, x1, y1, w1, x2, y2, w2, expr) {
  ctx.save();
  if (expr === 'dizzy') {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = w1 * 0.12;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(x1 - w1/2, y1 - w1/2); ctx.lineTo(x1 + w1/2, y1 + w1/2);
    ctx.moveTo(x1 + w1/2, y1 - w1/2); ctx.lineTo(x1 - w1/2, y1 + w1/2);
    ctx.moveTo(x2 - w2/2, y2 - w2/2); ctx.lineTo(x2 + w2/2, y2 + w2/2);
    ctx.moveTo(x2 + w2/2, y2 - w2/2); ctx.lineTo(x2 - w2/2, y2 + w2/2);
    ctx.stroke();
  } else if (expr === 'happy') {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = w1 * 0.14;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.arc(x1, y1 + w1*0.1, w1*0.5, Math.PI, 0);
    ctx.arc(x2, y2 + w2*0.1, w2*0.5, Math.PI, 0);
    ctx.stroke();
  } else if (expr === 'scared') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x1 - w1/2, y1 - w1/2, w1, w1);
    ctx.fillRect(x2 - w2/2, y2 - w2/2, w2, w2);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x1 - w1/2, y1 - w1/2, w1, w1);
    ctx.strokeRect(x2 - w2/2, y2 - w2/2, w2, w2);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(x1 - w1*0.15, y1 - w1*0.15, w1*0.3, w1*0.3);
    ctx.fillRect(x2 - w2*0.15, y2 - w2*0.15, w2*0.3, w2*0.3);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x1 - w1/2, y1 - w1/2, w1, w1);
    ctx.fillRect(x2 - w2/2, y2 - w2/2, w2, w2);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x1 - w1/2, y1 - w1/2, w1, w1);
    ctx.strokeRect(x2 - w2/2, y2 - w2/2, w2, w2);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(x1 - w1*0.25, y1 - w1*0.25, w1*0.5, w1*0.5);
    ctx.fillRect(x2 - w2*0.25, y2 - w2*0.25, w2*0.5, w2*0.5);
  }
  ctx.restore();
}

function drawCharacterMouth(ctx, mx, my, r, expr) {
  ctx.save();
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#000000';
  ctx.lineCap = 'round';
  
  if (expr === 'happy') {
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, Math.PI);
    ctx.closePath();
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.fillStyle = '#ff385c';
    ctx.fill();
  } else if (expr === 'scared') {
    ctx.beginPath();
    ctx.arc(mx, my, r * 0.65, 0, Math.PI * 2);
    ctx.lineWidth = 2.2;
    ctx.stroke();
  } else if (expr === 'dizzy') {
    ctx.beginPath();
    ctx.moveTo(mx - r, my);
    ctx.quadraticCurveTo(mx - r*0.5, my - r*0.3, mx, my);
    ctx.quadraticCurveTo(mx + r*0.5, my + r*0.3, mx + r, my);
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, Math.PI);
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawSquareMouth(ctx, mx, my, w, h, expr) {
  ctx.save();
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#000000';
  
  if (expr === 'happy') {
    ctx.strokeRect(mx - w/2, my, w, h);
    ctx.fillStyle = '#ff385c';
    ctx.fillRect(mx - w/2 + 1.5, my + 1.5, w - 3, h - 3);
  } else if (expr === 'scared') {
    ctx.strokeRect(mx - w*0.3, my + h*0.2, w*0.6, h*0.6);
  } else if (expr === 'dizzy') {
    ctx.beginPath();
    ctx.moveTo(mx - w/2, my + h/2);
    ctx.lineTo(mx - w/4, my);
    ctx.lineTo(mx, my + h/2);
    ctx.lineTo(mx + w/4, my);
    ctx.lineTo(mx + w/2, my + h/2);
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    ctx.lineWidth = 2.2;
    ctx.strokeRect(mx - w/2, my, w, h);
  }
  ctx.restore();
}

function emitTrailParticle(pixelX, pixelY, themeName) {
  let color = '#ffffff';
  let size = Math.random() * 3.5 + 2;
  let vx = (Math.random() - 0.5) * 0.8;
  let vy = (Math.random() - 0.5) * 0.8;
  let decay = Math.random() * 0.025 + 0.02; // fades out in ~30-50 frames
  
  if (themeName === 'ocean') {
    color = 'rgba(100, 225, 255, 0.65)';
    vy = -Math.random() * 0.7 - 0.3; // float up
    size = Math.random() * 4.5 + 1.5;
  } else if (themeName === 'volcano') {
    color = Math.random() < 0.55 ? '#ff3c00' : '#ff9900';
    vy = -Math.random() * 0.6;
    size = Math.random() * 3.5 + 1.2;
  } else if (themeName === 'deepsea') {
    color = 'rgba(0, 255, 180, 0.65)';
    size = Math.random() * 3 + 1;
  } else if (themeName === 'mars') {
    color = 'rgba(230, 110, 60, 0.55)';
    vx = -Math.random() * 0.6 - 0.1; // blow slightly left
  } else if (themeName === 'moon') {
    color = 'rgba(220, 220, 220, 0.45)';
  } else if (themeName === 'space') {
    color = '#ffffff';
    size = Math.random() * 2.5 + 1;
  } else if (themeName === 'galaxy') {
    color = Math.random() < 0.55 ? 'rgba(255, 50, 180, 0.65)' : 'rgba(150, 50, 255, 0.65)';
  }
  
  particles.push({
    x: pixelX,
    y: pixelY,
    vx: vx,
    vy: vy,
    size: size,
    color: color,
    alpha: 0.85,
    decay: decay
  });
}

function drawBlock(ctx, x, y, size, index, dir, isHead, isP2 = false, isGallery = false) {
  const drawSingleBlock = (bx, by) => {
    const num = isP2 ? (((index - 1 + 4) % 10) + 1) : (((index - 1) % 10) + 1); 
    
    ctx.save();
    ctx.translate(bx + size/2, by + size/2);
    
    if (isHead) {
      if (dir === 'UP') ctx.rotate(0);
      else if (dir === 'RIGHT') ctx.rotate(Math.PI / 2);
      else if (dir === 'DOWN') ctx.rotate(Math.PI);
      else if (dir === 'LEFT') ctx.rotate(-Math.PI / 2);
    }
    
    let bodyColor = '#fff';
    if (num === 1) bodyColor = '#ff385c';      
    else if (num === 2) bodyColor = '#ff7700'; 
    else if (num === 3) bodyColor = '#ffd200'; 
    else if (num === 4) bodyColor = '#38d638'; 
    else if (num === 5) bodyColor = '#00bfff'; 
    else if (num === 6) bodyColor = '#8b38ff'; 
    else if (num === 8) bodyColor = '#ff007f'; 
    else if (num === 9) bodyColor = '#a8b0c0'; 
    else if (num === 10) bodyColor = '#ffffff'; 
    
    const radius = size * 0.22;
    drawRoundedRect(ctx, -size/2 + 1, -size/2 + 1, size - 2, size - 2, radius);
  
    if (num === 7) {
      const grad = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
      grad.addColorStop(0, '#ff385c');
      grad.addColorStop(0.2, '#ff7700');
      grad.addColorStop(0.4, '#ffd200');
      grad.addColorStop(0.6, '#38d638');
      grad.addColorStop(0.8, '#00bfff');
      grad.addColorStop(1, '#8b38ff');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = bodyColor;
    }
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    
    if (num === 10) {
      ctx.strokeStyle = '#ff385c';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    
    if (num === 9) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      const w = size / 3;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if ((i + j) % 2 === 0) {
            ctx.fillRect(-size/2 + i*w, -size/2 + j*w, w, w);
          }
        }
      }
    }
    
    const expr = getBlockExpression(index, isHead, isP2, isGallery);
    
    if (num === 1) {
      drawCharacterEyes(ctx, 0, -size*0.08, size * 0.2, null, 0, 0, expr, size);
      drawCharacterMouth(ctx, 0, size*0.12, size*0.12, expr);
    }
    else if (num === 2) {
      ctx.fillStyle = '#d35400';
      ctx.fillRect(-size*0.35, -size*0.22, size*0.3, size*0.22);
      ctx.fillRect(size*0.05, -size*0.22, size*0.3, size*0.22);
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-size*0.35, -size*0.22, size*0.3, size*0.22);
      ctx.strokeRect(size*0.05, -size*0.22, size*0.3, size*0.22);
      
      ctx.beginPath();
      ctx.moveTo(-size*0.05, -size*0.11);
      ctx.lineTo(size*0.05, -size*0.11);
      ctx.lineWidth = 2;
      ctx.stroke();
      
      drawCharacterEyes(ctx, -size*0.2, -size*0.11, size*0.08, size*0.2, -size*0.11, size*0.08, expr, size);
      drawCharacterMouth(ctx, 0, size*0.14, size*0.09, expr);
    }
    else if (num === 3) {
      drawCharacterEyes(ctx, -size*0.15, -size*0.1, size*0.09, size*0.15, -size*0.1, size*0.09, expr, size);
      drawCharacterMouth(ctx, 0, size*0.08, size*0.08, expr);
      
      ctx.fillStyle = '#ff2222';
      ctx.beginPath();
      ctx.arc(0, size*0.28, size*0.05, 0, Math.PI*2);
      ctx.arc(-size*0.18, size*0.28, size*0.05, 0, Math.PI*2);
      ctx.arc(size*0.18, size*0.28, size*0.05, 0, Math.PI*2);
      ctx.fill();
    }
    else if (num === 4) {
      drawSquareEyes(ctx, -size*0.19, -size*0.11, size*0.18, size*0.19, -size*0.11, size*0.18, expr);
      drawSquareMouth(ctx, 0, size*0.08, size*0.24, size*0.12, expr);
    }
    else if (num === 5) {
      ctx.save();
      ctx.translate(size*0.18, -size*0.08);
      ctx.fillStyle = '#ffd200';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * size * 0.22,
                   Math.sin((18 + i * 72) * Math.PI / 180) * size * 0.22);
        ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * size * 0.09,
                   Math.sin((54 + i * 72) * Math.PI / 180) * size * 0.09);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ff7700';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      
      drawCharacterEyes(ctx, -size*0.18, -size*0.08, size*0.095, size*0.18, -size*0.08, size*0.09, expr, size);
      drawCharacterMouth(ctx, 0, size*0.14, size*0.09, expr);
    }
    else if (num === 6) {
      drawCharacterEyes(ctx, -size*0.16, -size*0.08, size*0.09, size*0.16, -size*0.08, size*0.09, expr, size);
      drawCharacterMouth(ctx, 0, size*0.1, size*0.08, expr);
      
      ctx.fillStyle = '#fff';
      const spotR = size * 0.045;
      ctx.beginPath();
      ctx.arc(-size*0.38, -size*0.28, spotR, 0, Math.PI*2);
      ctx.arc(-size*0.38, 0, spotR, 0, Math.PI*2);
      ctx.arc(-size*0.38, size*0.28, spotR, 0, Math.PI*2);
      ctx.arc(size*0.38, -size*0.28, spotR, 0, Math.PI*2);
      ctx.arc(size*0.38, 0, spotR, 0, Math.PI*2);
      ctx.arc(size*0.38, size*0.28, spotR, 0, Math.PI*2);
      ctx.fill();
    }
    else if (num === 7) {
      drawCharacterEyes(ctx, -size*0.16, -size*0.08, size*0.09, size*0.16, -size*0.08, size*0.09, expr, size);
      drawCharacterMouth(ctx, 0, size*0.1, size*0.12, expr);
    }
    else if (num === 8) {
      drawCharacterEyes(ctx, -size*0.16, -size*0.08, size*0.09, size*0.16, -size*0.08, size*0.09, expr, size);
      drawCharacterMouth(ctx, 0, size*0.1, size*0.08, expr);
      
      ctx.fillStyle = '#ff007f';
      const tw = size * 0.08;
      const th = size * 0.055;
      ctx.fillRect(-size/2 - tw + 1.5, -size*0.3, tw, th);
      ctx.fillRect(-size/2 - tw + 1.5, -size*0.1, tw, th);
      ctx.fillRect(-size/2 - tw + 1.5, size*0.1, tw, th);
      ctx.fillRect(-size/2 - tw + 1.5, size*0.3, tw, th);
      ctx.fillRect(size/2 - 1.5, -size*0.3, tw, th);
      ctx.fillRect(size/2 - 1.5, -size*0.1, tw, th);
      ctx.fillRect(size/2 - 1.5, size*0.1, tw, th);
      ctx.fillRect(size/2 - 1.5, size*0.3, tw, th);
    }
    else if (num === 9) {
      drawCharacterEyes(ctx, -size*0.16, -size*0.08, size*0.09, size*0.16, -size*0.08, size*0.09, expr, size);
      drawCharacterMouth(ctx, 0, size*0.1, size*0.08, expr);
    }
    else if (num === 10) {
      drawCharacterEyes(ctx, -size*0.16, -size*0.08, size*0.09, size*0.16, -size*0.08, size*0.09, expr, size);
      drawCharacterMouth(ctx, 0, size*0.1, size*0.1, expr);
      
      ctx.fillStyle = '#ff385c';
      
      ctx.save();
      ctx.translate(-size*0.48, 0);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos((i*72)*Math.PI/180)*size*0.1, Math.sin((i*72)*Math.PI/180)*size*0.1);
        ctx.lineTo(Math.cos((36+i*72)*Math.PI/180)*size*0.04, Math.sin((36+i*72)*Math.PI/180)*size*0.04);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      
      ctx.save();
      ctx.translate(size*0.48, 0);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos((i*72)*Math.PI/180)*size*0.1, Math.sin((i*72)*Math.PI/180)*size*0.1);
        ctx.lineTo(Math.cos((36+i*72)*Math.PI/180)*size*0.04, Math.sin((36+i*72)*Math.PI/180)*size*0.04);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    
    if (isHead) {
      ctx.rotate(0);
      if (dir === 'UP') {}
      else if (dir === 'RIGHT') ctx.rotate(-Math.PI / 2);
      else if (dir === 'DOWN') ctx.rotate(Math.PI);
      else if (dir === 'LEFT') ctx.rotate(Math.PI / 2);
      
      const textY = -size * 0.72;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      drawRoundedRect(ctx, -size*0.35, textY - size*0.25, size*0.7, size*0.5, size*0.15);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(size * 0.42)}px var(--font-main)`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(index.toString(), 0, textY);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = `bold ${Math.round(size * 0.32)}px var(--font-main)`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(index.toString(), 0, 0);
    }
    
    ctx.restore();
  };
  
  drawSingleBlock(x, y);
  
  if (ctx === window.ctx) {
    const margin = size;
    const drawDupX = (x < margin) ? x + CANVAS_SIZE : (x > CANVAS_SIZE - margin ? x - CANVAS_SIZE : null);
    const drawDupY = (y < margin) ? y + CANVAS_SIZE : (y > CANVAS_SIZE - margin ? y - CANVAS_SIZE : null);
    
    if (drawDupX !== null) {
      drawSingleBlock(drawDupX, y);
    }
    if (drawDupY !== null) {
      drawSingleBlock(x, drawDupY);
    }
    if (drawDupX !== null && drawDupY !== null) {
      drawSingleBlock(drawDupX, drawDupY);
    }
  }
}

function drawFood(ctx, x, y, size, frameCount) {
  ctx.save();
  ctx.translate(x + size/2, y + size/2);
  
  const scale = 1 + Math.sin(frameCount * 0.18) * 0.09;
  ctx.scale(scale, scale);
  
  ctx.fillStyle = '#ffd200';
  ctx.strokeStyle = '#ff7700';
  ctx.lineWidth = 2.2;
  
  ctx.beginPath();
  const outerR = size * 0.4;
  const innerR = size * 0.18;
  for (let i = 0; i < 5; i++) {
    ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * outerR,
               Math.sin((18 + i * 72) * Math.PI / 180) * outerR);
    ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * innerR,
               Math.sin((54 + i * 72) * Math.PI / 180) * innerR);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.07, 0, Math.PI*2);
  ctx.fill();
  
  ctx.restore();
}

function drawMagnetItem(ctx, x, y, size, frameCount) {
  ctx.save();
  ctx.translate(x + size/2, y + size/2);
  
  const bounce = Math.sin(frameCount * 0.15) * size * 0.08;
  const rotate = Math.sin(frameCount * 0.08) * 0.15;
  ctx.translate(0, bounce);
  ctx.rotate(rotate);
  
  ctx.font = `${Math.round(size * 0.72)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧲', 0, 0);
  
  ctx.restore();
}

// Gallery System & Card Rendering
const CHARACTER_INFO = [
  { val: 1, name: '하나 (One)', desc: '빨간색 블록! 눈이 하나 있어요.', note: 'C4' },
  { val: 2, name: '둘 (Two)', desc: '주황색 블록! 안경을 썼어요.', note: 'D4' },
  { val: 3, name: '셋 (Three)', desc: '노란색 블록! 빨간 단추 세 개.', note: 'E4' },
  { val: 4, name: '넷 (Four)', desc: '초록색 블록! 네모를 좋아해요.', note: 'G4' },
  { val: 5, name: '다섯 (Five)', desc: '파란색 블록! 얼굴에 예쁜 별.', note: 'A4' },
  { val: 6, name: '여섯 (Six)', desc: '보라색 블록! 주사위 놀이 점들.', note: 'C5' },
  { val: 7, name: '일곱 (Seven)', desc: '무지개색 블록! 운이 정말 좋아요.', note: 'D5' },
  { val: 8, name: '여덟 (Eight)', desc: '분홍 옥토블록! 힘이 아주 세요.', note: 'E5' },
  { val: 9, name: '아홉 (Nine)', desc: '회색 블록! 3x3 네모 모양.', note: 'G5' },
  { val: 10, name: '열 (Ten)', desc: '하얗고 빨간 테두리! 반짝이는 별 손.', note: 'A5' }
];

function renderGallery() {
  if (!galleryGrid) return;
  galleryGrid.innerHTML = '';
  
  CHARACTER_INFO.forEach(char => {
    const isLocked = maxLengthReached < char.val;
    
    const card = document.createElement('div');
    card.className = `gallery-card ${isLocked ? 'locked' : ''}`;
    
    card.innerHTML = `
      <span class="card-numling">${char.val}</span>
      <canvas class="card-canvas" width="60" height="60"></canvas>
      <div class="card-name">${isLocked ? '???' : char.name}</div>
      <div class="card-desc">${isLocked ? `길이 ${char.val}을 달성하면 열려요!` : char.desc}</div>
    `;
    
    galleryGrid.appendChild(card);
    
    const cardCanvas = card.querySelector('.card-canvas');
    const cardCtx = cardCanvas.getContext('2d');
    
    if (!isLocked) {
      const colors = {
        1: '#ff385c', 2: '#ff7700', 3: '#ffd200', 4: '#38d638', 5: '#00bfff',
        6: '#8b38ff', 7: '#ff33bb', 8: '#ff007f', 9: '#a8b0c0', 10: '#ffffff'
      };
      const charColor = colors[char.val] || '#ffffff';
      card.style.borderColor = charColor;
      card.style.boxShadow = `0 6px 20px rgba(0, 0, 0, 0.45), 0 0 15px ${charColor}44`;
      
      drawBlock(cardCtx, 0, 0, 60, char.val, 'UP', true, false, true);
      
      card.addEventListener('click', () => {
        card.classList.remove('wiggle');
        void card.offsetWidth; 
        card.classList.add('wiggle');
        
        audio.init();
        playMelodyForCard(char.val, char.note);
      });
    } else {
      cardCtx.fillStyle = 'rgba(255,255,255,0.1)';
      cardCtx.font = '30px serif';
      cardCtx.textAlign = 'center';
      cardCtx.textBaseline = 'middle';
      cardCtx.fillText('🔒', 30, 30);
    }
  });
}

function playMelodyForCard(val, primaryNote) {
  const notesSequence = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5'];
  if (audio.muted) return;
  
  const now = audio.ctx.currentTime;
  for (let i = 0; i < Math.min(val, 5); i++) {
    const playTime = now + i * 0.08;
    const note = notesSequence[i];
    const freq = audio.noteFreqs[note];
    
    if (freq) {
      const osc = audio.ctx.createOscillator();
      const gain = audio.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, playTime);
      gain.gain.linearRampToValueAtTime(0.08, playTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, playTime + 0.25);
      
      osc.connect(gain);
      gain.connect(audio.ctx.destination);
      
      osc.start(playTime);
      osc.stop(playTime + 0.3);
    }
  }
}

function openGallery() {
  if (galleryModal) galleryModal.classList.add('show');
}

function closeGallery() {
  if (galleryModal) galleryModal.classList.remove('show');
}
