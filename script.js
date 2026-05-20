const gameContainer = document.getElementById('gameContainer');
const gameTitle = document.getElementById('gameTitle');
const gameSubtitle = document.getElementById('gameSubtitle');
const gameStatus = document.getElementById('gameStatus');
const navButtons = [...document.querySelectorAll('.nav-btn')];
const hubPanel = document.getElementById('hubPanel');
const resetGameButton = document.getElementById('resetGame');
const returnHubButton = document.getElementById('returnHub');
const modePanel = document.getElementById('modePanel');
const humanModeButton = document.getElementById('humanMode');
const aiModeButton = document.getElementById('aiMode');
const snakeSettingsPanel = document.getElementById('snakeSettingsPanel');
const snakeAutoRestartCheckbox = document.getElementById('snakeAutoRestart');
const snakeSpeedRange = document.getElementById('snakeSpeed');
const snakeSpeedValue = document.getElementById('snakeSpeedValue');
// Non-linear mapping curve (0 < curve < 1 -> concave, >1 -> convex)
const snakeSpeedCurve = 0.9;

function mapSliderToTickRate(raw) {
  const min = 1;
  const max = 100;
  const n = Math.max(0, Math.min(1, (Number(raw) - 1) / 99));
  const mapped = min + Math.pow(n, snakeSpeedCurve) * (max - min);
  return Math.max(min, Math.round(mapped));
}

const games = {
  ticTacToe: {
    title: 'Tic Tac Toe',
    subtitle: 'Three-in-a-row showdown',
    description: 'Take turns or challenge the AI to get the winning line.',
    init: initTicTacToe,
    reset: resetTicTacToe,
  },
  memory: {
    title: 'Memory Match',
    subtitle: 'Flip and recall pairs',
    description: 'Match the icons before the board fills up.',
    init: initMemoryMatch,
    reset: resetMemoryMatch,
  },
  snake: {
    title: 'Snake',
    subtitle: 'Classic arcade chase',
    description: 'Use arrow keys or watch the AI snake chase the food.',
    init: initSnake,
    reset: resetSnake,
  },
  fps: {
    title: 'First Person Shooter',
    subtitle: '3D first-person action',
    description: 'Use W/S to move, A/D to turn, and space to shoot the targets.',
    init: initFPS,
    reset: resetFPS,
  },
  minesweeper: {
    title: 'Minesweeper',
    subtitle: 'Safe tile logic',
    description: 'Reveal tiles, avoid mines, and clear the board.',
    init: initMinesweeper,
    reset: resetMinesweeper,
  },
  trivia: {
    title: 'Trivia Quiz',
    subtitle: 'Rapid-fire knowledge',
    description: 'Answer questions and compete against the AI.',
    init: initTrivia,
    reset: resetTrivia,
  },
};

let currentGame = null;
let currentMode = 'human';
let snakeState = null;
let snakeAutoRestart = false;
let fpsState = null;
let ticState = null;
let memoryState = null;
let minesState = null;
let triviaState = null;

function updateStatus(text) {
  gameStatus.textContent = text;
}

function createGrid(container, rows, cols) {
  container.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
}

function setGameMode(mode) {
  if (mode === currentMode) return;
  currentMode = mode;
  humanModeButton.classList.toggle('active', mode === 'human');
  aiModeButton.classList.toggle('active', mode === 'ai');
  updateStatus(mode === 'ai' ? 'AI mode is active.' : 'Human mode is active.');
  if (currentGame && currentGame !== 'hub' && games[currentGame] && games[currentGame].reset) {
    games[currentGame].reset();
  }
}

function bindModeButtons() {
  humanModeButton.addEventListener('click', () => setGameMode('human'));
  aiModeButton.addEventListener('click', () => setGameMode('ai'));
  snakeAutoRestartCheckbox.addEventListener('change', () => {
    snakeAutoRestart = snakeAutoRestartCheckbox.checked;
  });
  if (snakeSpeedRange) {
    // keep displayed value and state in sync (display mapped tick rate)
    const initial = Number(snakeSpeedRange.value || 12);
    snakeSpeedValue.textContent = String(mapSliderToTickRate(initial));
    snakeSpeedRange.addEventListener('input', () => {
      const raw = Math.max(1, Math.min(100, Number(snakeSpeedRange.value || 12)));
      const mapped = mapSliderToTickRate(raw);
      snakeSpeedValue.textContent = String(mapped);
      if (snakeState) snakeState.tickRate = mapped;
    });
  }
}

function bindNavigation() {
  // Use pointerdown for faster response on touch/pointer devices, with a click guard
  navButtons.forEach((button) => {
    let lastPointer = 0;
    const doNavigate = () => {
      const target = button.dataset.game;
      if (target === 'hub') return setActiveGame('hub');
      setActiveGame(target);
    };
    button.addEventListener('pointerdown', (e) => { lastPointer = Date.now(); e.preventDefault(); doNavigate(); });
    button.addEventListener('click', (e) => { if (Date.now() - lastPointer < 400) return; doNavigate(); });
  });

  document.querySelectorAll('.game-card').forEach((card) => {
    let lastPointer = 0;
    const doOpen = () => { const gameKey = card.dataset.game; setActiveGame(gameKey); };
    card.addEventListener('pointerdown', (e) => { lastPointer = Date.now(); e.preventDefault(); doOpen(); });
    card.addEventListener('click', (e) => { if (Date.now() - lastPointer < 400) return; doOpen(); });
  });

  // make footer buttons respond faster on touch while preserving keyboard access
  (function setupButton(btn, fn) {
    let lastPointer = 0;
    btn.addEventListener('pointerdown', (e) => { lastPointer = Date.now(); e.preventDefault(); fn(); });
    btn.addEventListener('click', (e) => { if (Date.now() - lastPointer < 400) return; fn(); });
  }(resetGameButton, () => {
    if (currentGame && games[currentGame] && games[currentGame].reset) games[currentGame].reset();
  }));

  (function setupButton2(btn, fn) {
    let lastPointer = 0;
    btn.addEventListener('pointerdown', (e) => { lastPointer = Date.now(); e.preventDefault(); fn(); });
    btn.addEventListener('click', (e) => { if (Date.now() - lastPointer < 400) return; fn(); });
  }(returnHubButton, () => { setActiveGame('hub'); }));

  bindModeButtons();
}

function initTicTacToe() {
  ticState = { board: Array(9).fill(null), turn: 'X', finished: false };
  gameContainer.innerHTML = `
    <div class="game-info status-bar">Use the board to choose a square. First player wins.</div>
    <div class="grid-board" id="ticTacToeBoard"></div>
    <div class="score-panel"><span>Next: <strong id="ticNext">X</strong></span></div>
  `;
  const board = document.getElementById('ticTacToeBoard');
  board.className = 'grid-board';
  createGrid(board, 3, 3);
  for (let i = 0; i < 9; i += 1) {
    const cell = document.createElement('button');
    cell.className = 'cell';
    cell.dataset.index = i;
    // pointerdown + click guard for responsive and precise input
    (function attachHandlers(el, idx) {
      let lastPointer = 0;
      const handler = () => chooseTicCell(idx, el);
      el.addEventListener('pointerdown', (e) => { lastPointer = Date.now(); e.preventDefault(); handler(); });
      el.addEventListener('click', (e) => { if (Date.now() - lastPointer < 400) return; handler(); });
    }(cell, i));
    board.appendChild(cell);
  }
  updateStatus(currentMode === 'ai' ? 'Your turn as X. AI will play O.' : 'Tap a square to place X or O.');
}

function chooseTicCell(index, cell) {
  if (ticState.finished || ticState.board[index]) return;
  if (currentMode === 'ai' && ticState.turn === 'O') return;
  ticState.board[index] = ticState.turn;
  cell.textContent = ticState.turn;
  const winner = getTicWinner(ticState.board);
  if (winner) {
    ticState.finished = true;
    updateStatus(`${winner} wins!`);
    return;
  }
  if (!ticState.board.includes(null)) {
    ticState.finished = true;
    updateStatus('Tie game. Try again.');
    return;
  }
  ticState.turn = ticState.turn === 'X' ? 'O' : 'X';
  document.getElementById('ticNext').textContent = ticState.turn;
  if (currentMode === 'ai' && ticState.turn === 'O') {
    updateStatus('AI is choosing a move...');
    setTimeout(aiTicMove, 700);
    return;
  }
  updateStatus(`Move: ${ticState.turn}`);
}

function aiTicMove() {
  if (ticState.finished) return;
  const aiMark = 'O';
  const humanMark = 'X';
  const winMove = findBestTicMove(aiMark);
  const blockMove = findBestTicMove(humanMark);
  const emptyIndices = ticState.board.map((value, index) => (value === null ? index : null)).filter((value) => value !== null);
  const index = winMove ?? blockMove ?? emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  const cell = document.querySelector(`.cell[data-index="${index}"]`);
  if (!cell) return;
  ticState.board[index] = aiMark;
  cell.textContent = aiMark;
  const winner = getTicWinner(ticState.board);
  if (winner) {
    ticState.finished = true;
    updateStatus(`${winner} wins!`);
    return;
  }
  if (!ticState.board.includes(null)) {
    ticState.finished = true;
    updateStatus('Tie game. Try again.');
    return;
  }
  ticState.turn = 'X';
  document.getElementById('ticNext').textContent = 'X';
  updateStatus('Your turn.');
}

function findBestTicMove(player) {
  const combos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of combos) {
    const line = [ticState.board[a], ticState.board[b], ticState.board[c]];
    if (line.filter((mark) => mark === player).length === 2) {
      const emptyIndex = [a, b, c].find((idx) => ticState.board[idx] === null);
      if (emptyIndex !== undefined) return emptyIndex;
    }
  }
  return null;
}

function getTicWinner(board) {
  const combos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of combos) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function resetTicTacToe() {
  if (currentGame === 'ticTacToe') initTicTacToe();
}

function initMemoryMatch() {
  const deck = shuffle([...icons, ...icons]);
  memoryState = { deck, flipped: [], matched: [], moves: 0, turn: 'human', aiSeen: {} };
  gameContainer.innerHTML = `
    <div class="game-info status-bar">Flip cards and match pairs. Tap two cards each turn.</div>
    <div class="grid-board" id="memoryBoard"></div>
    <div class="score-panel"><span>Moves: <strong id="memoryMoves">0</strong></span></div>
  `;
  const board = document.getElementById('memoryBoard');
  board.className = 'grid-board';
  createGrid(board, 4, 4);
  deck.forEach((icon, index) => {
    const card = document.createElement('button');
    card.className = 'card';
    card.dataset.index = index;
    (function attachHandlers(el, idx) {
      let lastPointer = 0;
      const handler = () => flipMemoryCard(idx, el, 'human');
      el.addEventListener('pointerdown', (e) => { lastPointer = Date.now(); e.preventDefault(); handler(); });
      el.addEventListener('click', (e) => { if (Date.now() - lastPointer < 400) return; handler(); });
    }(card, index));
    board.appendChild(card);
  });
  updateStatus(currentMode === 'ai' ? 'Your turn to flip. AI will follow.' : 'Your turn to flip cards.');
}

function flipMemoryCard(index, element, actor = 'human') {
  if (memoryState.flipped.includes(index) || memoryState.matched.includes(index) || memoryState.flipped.length === 2) return;
  if (currentMode === 'ai' && memoryState.turn !== actor) return;
  memoryState.flipped.push(index);
  element.classList.add('revealed');
  element.textContent = memoryState.deck[index];
  noteMemorySeen(memoryState.deck[index], index);

  if (memoryState.flipped.length === 2) {
    memoryState.moves += 1;
    document.getElementById('memoryMoves').textContent = memoryState.moves;
    const [first, second] = memoryState.flipped;
    if (memoryState.deck[first] === memoryState.deck[second]) {
      memoryState.matched.push(first, second);
      removeMemorySeen(memoryState.deck[first], first);
      removeMemorySeen(memoryState.deck[second], second);
      memoryState.flipped = [];
      if (memoryState.matched.length === memoryState.deck.length) {
        updateStatus('All matched! Nice work.');
        return;
      }
      if (currentMode === 'ai' && actor === 'human') {
        memoryState.turn = 'ai';
        setTimeout(playMemoryAiTurn, 900);
        return;
      }
      updateStatus(actor === 'human' ? 'Good match! Your turn again.' : 'AI found a match! Your turn.');
      if (currentMode === 'ai') memoryState.turn = 'human';
      return;
    }

    updateStatus('Not a match.');
    setTimeout(() => {
      memoryState.flipped.forEach((idx) => {
        const card = document.querySelector(`.card[data-index="${idx}"]`);
        if (card) {
          card.classList.remove('revealed');
          card.textContent = '';
        }
      });
      memoryState.flipped = [];
      if (currentMode === 'ai') {
        memoryState.turn = actor === 'human' ? 'ai' : 'human';
        if (memoryState.turn === 'ai') {
          updateStatus('AI is selecting cards...');
          setTimeout(playMemoryAiTurn, 900);
        } else {
          updateStatus('Your turn.');
        }
      } else {
        updateStatus('Try the next pair.');
      }
    }, 950);
  }
}

function noteMemorySeen(icon, index) {
  if (!memoryState.aiSeen[icon]) memoryState.aiSeen[icon] = [];
  if (!memoryState.aiSeen[icon].includes(index)) memoryState.aiSeen[icon].push(index);
}

function removeMemorySeen(icon, index) {
  if (!memoryState.aiSeen[icon]) return;
  memoryState.aiSeen[icon] = memoryState.aiSeen[icon].filter((i) => i !== index);
}

function playMemoryAiTurn() {
  if (currentMode !== 'ai' || memoryState.turn !== 'ai' || memoryState.matched.length === memoryState.deck.length) return;
  const pair = getMemoryAIPair();
  const available = memoryState.deck.map((_, idx) => idx).filter((idx) => !memoryState.matched.includes(idx));
  let firstIndex = pair ? pair[0] : available[Math.floor(Math.random() * available.length)];
  let secondIndex = pair ? pair[1] : null;
  const remaining = available.filter((idx) => idx !== firstIndex);
  if (secondIndex === null) secondIndex = remaining[Math.floor(Math.random() * remaining.length)];
  const firstCard = document.querySelector(`.card[data-index="${firstIndex}"]`);
  const secondCard = document.querySelector(`.card[data-index="${secondIndex}"]`);
  if (firstCard) flipMemoryCard(firstIndex, firstCard, 'ai');
  setTimeout(() => {
    if (secondCard) flipMemoryCard(secondIndex, secondCard, 'ai');
  }, 700);
}

function getMemoryAIPair() {
  for (const [icon, indexes] of Object.entries(memoryState.aiSeen)) {
    const unmatched = indexes.filter((idx) => !memoryState.matched.includes(idx));
    if (unmatched.length >= 2) return unmatched.slice(0, 2);
  }
  return null;
}

function resetMemoryMatch() {
  if (currentGame === 'memory') initMemoryMatch();
}

function initSnake() {
  snakeState = {
    direction: 'right',
    nextDirection: 'right',
    snake: [{ x: 2, y: 2 }],
    food: { x: 5, y: 5 },
    tickRate: mapSliderToTickRate(Number(snakeSpeedRange?.value ?? 12)),
    width: 12,
    height: 12,
    running: true,
    lastFrameTime: null,
    accumulatedTime: 0,
    frameRequest: null,
    previousSnake: null,
    deathTimeout: null,
  };
  gameContainer.innerHTML = `
    <div class="game-info status-bar">Use arrow keys to move. Eat food and grow without hitting the wall.</div>
    <canvas id="snakeCanvas" width="360" height="360"></canvas>
    <div class="score-panel"><span>Length: <strong id="snakeScore">1</strong></span></div>
  `;
  const canvas = document.getElementById('snakeCanvas');
  const ctx = canvas.getContext('2d');
  // ensure UI reflects chosen speed
  if (snakeSpeedRange) snakeSpeedRange.value = String(snakeState.tickRate);
  if (snakeSpeedValue) snakeSpeedValue.textContent = String(snakeState.tickRate);
  drawSnake(ctx, 0);
  document.addEventListener('keydown', handleSnakeInput);
  snakeState.frameRequest = requestAnimationFrame((timestamp) => animateSnake(timestamp, ctx));
  updateStatus(currentMode === 'ai' ? 'AI snake is playing. Watch the chase.' : 'Control the snake with arrow keys.');
}

function handleSnakeInput(event) {
  if (currentGame !== 'snake' || currentMode === 'ai') return;
  const directions = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up',
    W: 'up',
    s: 'down',
    S: 'down',
    a: 'left',
    A: 'left',
    d: 'right',
    D: 'right',
  };
  const next = directions[event.key];
  if (!next) return;
  // prevent page scrolling / default behaviors for movement keys
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'].includes(event.key)) {
    event.preventDefault();
  }
  const opposite = {
    up: 'down', down: 'up', left: 'right', right: 'left',
  };
  if (next !== opposite[snakeState.direction]) {
    snakeState.nextDirection = next;
  }
}

function animateSnake(timestamp, ctx) {
  if (!snakeState.lastFrameTime) snakeState.lastFrameTime = timestamp;
  const delta = timestamp - snakeState.lastFrameTime;
  snakeState.lastFrameTime = timestamp;
  snakeState.accumulatedTime += delta;
  const tickDuration = 1000 / snakeState.tickRate;

  while (snakeState.accumulatedTime >= tickDuration) {
    snakeState.accumulatedTime -= tickDuration;
    updateSnake(ctx);
  }

  const progress = Math.min(1, snakeState.accumulatedTime / tickDuration);
  drawSnake(ctx, progress);
  snakeState.frameRequest = requestAnimationFrame((ts) => animateSnake(ts, ctx));
}

function updateSnake(ctx) {
  if (!snakeState.running) return;
  snakeState.previousSnake = snakeState.snake.map((segment) => ({ ...segment }));
  if (currentMode === 'ai') {
    snakeState.nextDirection = getSnakeAIDirection();
  }

  const opposite = {
    up: 'down', down: 'up', left: 'right', right: 'left',
  };
  if (snakeState.nextDirection && snakeState.nextDirection !== opposite[snakeState.direction]) {
    snakeState.direction = snakeState.nextDirection;
  }

  const head = { ...snakeState.snake[0] };
  if (snakeState.direction === 'up') head.y -= 1;
  if (snakeState.direction === 'down') head.y += 1;
  if (snakeState.direction === 'left') head.x -= 1;
  if (snakeState.direction === 'right') head.x += 1;

  if (head.x < 0 || head.y < 0 || head.x >= snakeState.width || head.y >= snakeState.height || snakeState.snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
    // collision detected -> stop the game cleanly to avoid flashing
    snakeState.running = false;
    updateStatus('Game over. Restarting in a moment...');
    // cancel animation loop to prevent draw flicker
    if (snakeState.frameRequest) {
      cancelAnimationFrame(snakeState.frameRequest);
      snakeState.frameRequest = null;
    }
    // remove input listener to freeze controls until reset
    document.removeEventListener('keydown', handleSnakeInput);
    // draw one final static frame
    snakeState.previousSnake = snakeState.previousSnake || snakeState.snake.map((s) => ({ ...s }));
    drawSnake(ctx, 1);
    if (snakeAutoRestart && !snakeState.deathTimeout) {
      snakeState.deathTimeout = setTimeout(() => {
        snakeState.deathTimeout = null;
        if (currentGame === 'snake') resetSnake();
      }, 900);
    }
    return;
  }

  snakeState.snake.unshift(head);
  if (head.x === snakeState.food.x && head.y === snakeState.food.y) {
    snakeState.food = placeSnakeFood();
  } else {
    snakeState.snake.pop();
  }

  document.getElementById('snakeScore').textContent = snakeState.snake.length;
}

function isSnakeCell(x, y, body) {
  return body.some((segment) => segment.x === x && segment.y === y);
}

function movePoint(point, direction) {
  const next = { x: point.x, y: point.y };
  if (direction === 'up') next.y -= 1;
  if (direction === 'down') next.y += 1;
  if (direction === 'left') next.x -= 1;
  if (direction === 'right') next.x += 1;
  return next;
}

function gridKey(point) {
  return `${point.x},${point.y}`;
}

function buildBlockedSet(body, allowTail) {
  const blocked = new Set();
  body.forEach((segment, index) => {
    if (allowTail && index === body.length - 1) return;
    blocked.add(gridKey(segment));
  });
  return blocked;
}

function bfsPath(start, target, blocked, width, height) {
  const queue = [{ point: start, path: [] }];
  const visited = new Set([gridKey(start)]);
  const directions = ['up', 'down', 'left', 'right'];

  while (queue.length) {
    const { point, path } = queue.shift();
    if (point.x === target.x && point.y === target.y) return path;

    for (const dir of directions) {
      const next = movePoint(point, dir);
      const key = gridKey(next);
      if (next.x < 0 || next.y < 0 || next.x >= width || next.y >= height) continue;
      if (blocked.has(key) || visited.has(key)) continue;
      visited.add(key);
      queue.push({ point: next, path: [...path, dir] });
    }
  }
  return null;
}

function countReachableCells(start, blocked, width, height) {
  const queue = [start];
  const visited = new Set([gridKey(start)]);
  const directions = ['up', 'down', 'left', 'right'];
  let count = 0;

  while (queue.length) {
    const point = queue.shift();
    count += 1;
    for (const dir of directions) {
      const next = movePoint(point, dir);
      const key = gridKey(next);
      if (next.x < 0 || next.y < 0 || next.x >= width || next.y >= height) continue;
      if (blocked.has(key) || visited.has(key)) continue;
      visited.add(key);
      queue.push(next);
    }
  }

  return count;
}

function getSnakeAIDirection() {
  const head = snakeState.snake[0];
  const target = snakeState.food;
  const directions = ['up', 'down', 'left', 'right'];
  const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const currentDir = snakeState.direction;
  const snakeBody = snakeState.snake;

  const candidates = [];
  for (const dir of directions) {
    if (dir === opposite[currentDir]) continue;
    const next = movePoint(head, dir);
    const nextKey = gridKey(next);
    if (next.x < 0 || next.y < 0 || next.x >= snakeState.width || next.y >= snakeState.height) continue;
    if (isSnakeCell(next.x, next.y, snakeBody)) continue;

    const willEat = next.x === target.x && next.y === target.y;
    const blocked = buildBlockedSet(snakeBody, !willEat);
    blocked.add(nextKey);

    const pathToFood = bfsPath(next, target, blocked, snakeState.width, snakeState.height);
    const reachable = countReachableCells(next, blocked, snakeState.width, snakeState.height);
    const distance = pathToFood ? pathToFood.length : Infinity;
    const directFood = willEat || (pathToFood && pathToFood.length > 0 && pathToFood[0] === dir);

    candidates.push({ dir, pathToFood, reachable, distance, directFood, willEat });
  }

  if (!candidates.length) return snakeState.direction;

  candidates.sort((a, b) => {
    if (Boolean(a.pathToFood) !== Boolean(b.pathToFood)) return b.pathToFood ? 1 : -1;
    if (a.reachable !== b.reachable) return b.reachable - a.reachable;
    if (a.distance !== b.distance) return a.distance - b.distance;
    if (a.willEat !== b.willEat) return a.willEat ? -1 : 1;
    if (a.directFood !== b.directFood) return a.directFood ? -1 : 1;
    if (a.dir === currentDir) return -1;
    if (b.dir === currentDir) return 1;
    return 0;
  });

  return candidates[0].dir;
}

function drawSnake(ctx, progress = 1) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const cellSize = ctx.canvas.width / snakeState.width;
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const previous = snakeState.previousSnake || snakeState.snake;
  ctx.save();
  ctx.lineWidth = cellSize * 0.78;
  ctx.strokeStyle = '#5b8df9';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(79,141,255,0.4)';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  snakeState.snake.forEach((segment, index) => {
    const from = index === 0 ? previous[0] : previous[index - 1] || segment;
    const to = segment;
    const x = from.x + (to.x - from.x) * progress;
    const y = from.y + (to.y - from.y) * progress;
    const cx = x * cellSize + cellSize / 2;
    const cy = y * cellSize + cellSize / 2;
    if (index === 0) {
      ctx.moveTo(cx, cy);
    } else {
      ctx.lineTo(cx, cy);
    }
  });
  ctx.stroke();
  ctx.restore();

  const head = snakeState.snake[0];
  const prevHead = previous[0] || head;
  const headX = (prevHead.x + (head.x - prevHead.x) * progress) * cellSize + cellSize / 2;
  const headY = (prevHead.y + (head.y - prevHead.y) * progress) * cellSize + cellSize / 2;

  ctx.save();
  ctx.fillStyle = '#7de7ff';
  ctx.shadowColor = 'rgba(125,231,255,0.9)';
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.arc(headX, headY, cellSize * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#ffd166';
  ctx.shadowColor = 'rgba(255,209,102,0.6)';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(snakeState.food.x * cellSize + cellSize / 2, snakeState.food.y * cellSize + cellSize / 2, cellSize * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function placeSnakeFood() {
  let position;
  do {
    position = { x: Math.floor(Math.random() * snakeState.width), y: Math.floor(Math.random() * snakeState.height) };
  } while (snakeState.snake.some((segment) => segment.x === position.x && segment.y === position.y));
  return position;
}

function resetSnake() {
  if (currentGame !== 'snake') return;
  if (snakeState.deathTimeout) {
    clearTimeout(snakeState.deathTimeout);
    snakeState.deathTimeout = null;
  }
  if (snakeState.frameRequest) {
    cancelAnimationFrame(snakeState.frameRequest);
    snakeState.frameRequest = null;
  }
  document.removeEventListener('keydown', handleSnakeInput);
  initSnake();
}

function initFPS() {
  const map = [
    '##########',
    '#   #    #',
    '#   #  # #',
    '#   #  # #',
    '#   #    #',
    '#        #',
    '#  ##  ##',
    '#   #    #',
    '#        #',
    '##########',
  ];
  const targets = [
    { x: 7.3, y: 2.7, hit: false },
    { x: 3.2, y: 6.5, hit: false },
    { x: 6.8, y: 7.4, hit: false },
    { x: 2.5, y: 3.8, hit: false },
  ];
  fpsState = {
    player: { x: 5.2, y: 5.2, angle: 1.4, speed: 2.4, turnSpeed: 2.9, radius: 0.2 },
    map,
    width: map[0].length,
    height: map.length,
    fov: Math.PI / 3,
    maxDepth: 16,
    keys: { forward: false, back: false, left: false, right: false },
    frameRequest: null,
    lastTime: null,
    time: 0,
    hits: 0,
    totalTargets: targets.length,
    targets,
    hitMessage: 'Ready to shoot.',
    shooting: false,
  };

  gameContainer.innerHTML = `
    <div class="fps-hud">
      <canvas id="fpsCanvas" class="fps-canvas" width="820" height="460"></canvas>
      <div class="fps-overlay">
        <div class="crosshair">+</div>
      </div>
      <div class="fps-controls">
        <span>Targets: <strong id="fpsTargets">0 / ${targets.length}</strong></span>
        <span>Message: <strong id="fpsMessage">Ready to shoot.</strong></span>
      </div>
      <div class="fps-controls">
        <span>Controls: W/S move, A/D turn, space shoot</span>
        <span>Goal: Hit all targets</span>
      </div>
    </div>
  `;

  const canvas = document.getElementById('fpsCanvas');
  const ctx = canvas.getContext('2d');
  document.addEventListener('keydown', handleFPSKeyDown);
  document.addEventListener('keyup', handleFPSKeyUp);
  document.addEventListener('click', handleFPSClick);
  fpsState.frameRequest = requestAnimationFrame((timestamp) => animateFPS(timestamp, ctx));
  updateStatus(currentMode === 'ai' ? 'AI mode is enabled. Human controls are still visible.' : 'Use W/S to move, A/D to turn, and space to shoot.');
}

function handleFPSKeyDown(event) {
  if (currentGame !== 'fps') return;
  const key = event.key.toLowerCase();
  if (['w', 'a', 's', 'd', ' '].includes(key)) event.preventDefault();
  if (key === 'w') fpsState.keys.forward = true;
  if (key === 's') fpsState.keys.back = true;
  if (key === 'a') fpsState.keys.left = true;
  if (key === 'd') fpsState.keys.right = true;
  if (key === ' ') {
    shootFPS();
  }
}

function handleFPSKeyUp(event) {
  if (currentGame !== 'fps') return;
  const key = event.key.toLowerCase();
  if (key === 'w') fpsState.keys.forward = false;
  if (key === 's') fpsState.keys.back = false;
  if (key === 'a') fpsState.keys.left = false;
  if (key === 'd') fpsState.keys.right = false;
}

function handleFPSClick() {
  if (currentGame !== 'fps') return;
  shootFPS();
}

function shootFPS() {
  if (!fpsState || fpsState.shooting) return;
  fpsState.shooting = true;
  const hitTarget = getFPSHitTarget();
  if (hitTarget) {
    hitTarget.hit = true;
    fpsState.hits += 1;
    fpsState.hitMessage = `Hit! ${fpsState.hits}/${fpsState.totalTargets}`;
  } else {
    fpsState.hitMessage = 'Missed. Try again.';
  }
  document.getElementById('fpsTargets').textContent = `${fpsState.hits} / ${fpsState.totalTargets}`;
  document.getElementById('fpsMessage').textContent = fpsState.hitMessage;

  if (fpsState.hits >= fpsState.totalTargets) {
    fpsState.hitMessage = 'All targets down. You win!';
    document.getElementById('fpsMessage').textContent = fpsState.hitMessage;
  }

  setTimeout(() => { fpsState.shooting = false; }, 180);
}

function getFPSHitTarget() {
  const player = fpsState.player;
  const rayAngle = player.angle;
  let bestTarget = null;
  let bestDistance = Infinity;
  for (const target of fpsState.targets) {
    if (target.hit) continue;
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const angleToTarget = Math.atan2(dy, dx);
    let diff = angleToTarget - rayAngle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    const distance = Math.hypot(dx, dy);
    if (Math.abs(diff) < 0.14 && distance < 12) {
      if (hasLineOfSight(player.x, player.y, target.x, target.y) && distance < bestDistance) {
        bestDistance = distance;
        bestTarget = target;
      }
    }
  }
  return bestTarget;
}

function hasLineOfSight(x1, y1, x2, y2) {
  const steps = 40;
  const dx = (x2 - x1) / steps;
  const dy = (y2 - y1) / steps;
  for (let i = 1; i < steps; i += 1) {
    const px = x1 + dx * i;
    const py = y1 + dy * i;
    if (fpsState.map[Math.floor(py)]?.[Math.floor(px)] === '#') return false;
  }
  return true;
}

function animateFPS(timestamp, ctx) {
  if (!fpsState.lastTime) fpsState.lastTime = timestamp;
  const delta = (timestamp - fpsState.lastTime) / 1000;
  fpsState.lastTime = timestamp;
  fpsState.time += delta;
  updateFPSPlayer(delta);
  drawFPS(ctx);
  fpsState.frameRequest = requestAnimationFrame((ts) => animateFPS(ts, ctx));
}

function updateFPSPlayer(delta) {
  const player = fpsState.player;
  const moveStep = player.speed * delta;
  const turnStep = player.turnSpeed * delta;
  if (fpsState.keys.left) player.angle -= turnStep;
  if (fpsState.keys.right) player.angle += turnStep;
  const moveX = Math.cos(player.angle) * (fpsState.keys.forward ? moveStep : fpsState.keys.back ? -moveStep : 0);
  const moveY = Math.sin(player.angle) * (fpsState.keys.forward ? moveStep : fpsState.keys.back ? -moveStep : 0);
  if (moveX !== 0 || moveY !== 0) {
    const nextX = player.x + moveX;
    const nextY = player.y + moveY;
    if (fpsState.map[Math.floor(player.y)]?.[Math.floor(nextX)] !== '#') player.x = nextX;
    if (fpsState.map[Math.floor(nextY)]?.[Math.floor(player.x)] !== '#') player.y = nextY;
  }
}

function drawFPS(ctx) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);

  const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.5);
  skyGradient.addColorStop(0, '#0b1b3a');
  skyGradient.addColorStop(1, '#12264a');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height * 0.5);

  const floorGradient = ctx.createLinearGradient(0, height * 0.5, 0, height);
  floorGradient.addColorStop(0, '#111b2f');
  floorGradient.addColorStop(1, '#0c1723');
  ctx.fillStyle = floorGradient;
  ctx.fillRect(0, height * 0.5, width, height * 0.5);

  const bobOffset = Math.sin(fpsState.time * 2.7) * 10;
  const horizon = height * 0.5 + bobOffset * 0.08;
  const halfFov = fpsState.fov / 2;
  const rayCount = 140;
  const projectionPlane = width / 2 / Math.tan(halfFov);
  const distances = [];

  for (let ray = 0; ray < rayCount; ray += 1) {
    const rayAngle = fpsState.player.angle - halfFov + (ray / rayCount) * fpsState.fov;
    let distanceToWall = 0;
    let hitWall = false;
    let boundary = false;
    const eyeX = Math.cos(rayAngle);
    const eyeY = Math.sin(rayAngle);

    while (!hitWall && distanceToWall < fpsState.maxDepth) {
      distanceToWall += 0.04;
      const testX = Math.floor(fpsState.player.x + eyeX * distanceToWall);
      const testY = Math.floor(fpsState.player.y + eyeY * distanceToWall);
      if (testX < 0 || testX >= fpsState.width || testY < 0 || testY >= fpsState.height) {
        hitWall = true;
        distanceToWall = fpsState.maxDepth;
      } else if (fpsState.map[testY][testX] === '#') {
        hitWall = true;
        const corners = [];
        for (let tx = 0; tx < 2; tx += 1) {
          for (let ty = 0; ty < 2; ty += 1) {
            const vx = testX + tx - fpsState.player.x;
            const vy = testY + ty - fpsState.player.y;
            const d = Math.sqrt(vx * vx + vy * vy);
            const dot = (eyeX * vx / d) + (eyeY * vy / d);
            corners.push({ distance: d, dot });
          }
        }
        corners.sort((a, b) => b.dot - a.dot);
        if (Math.acos(corners[0].dot) < 0.12) boundary = true;
      }
    }

    const ceiling = Math.floor(horizon - projectionPlane / distanceToWall);
    const floor = height - ceiling;
    const shade = distanceToWall <= fpsState.maxDepth ? 1 - Math.min(1, distanceToWall / fpsState.maxDepth) : 0;
    const wallShade = boundary ? '#ffffff' : `rgba(${Math.floor(30 + shade * 90)}, ${Math.floor(80 + shade * 130)}, ${Math.floor(140 + shade * 90)}, 1)`;
    const wallWidth = width / rayCount + 1;

    ctx.fillStyle = wallShade;
    ctx.fillRect(ray * wallWidth, ceiling, wallWidth, floor - ceiling);
    if (!boundary) {
      const stripeAlpha = 0.18 + shade * 0.3;
      ctx.fillStyle = `rgba(255,255,255,${stripeAlpha})`;
      if ((ray + Math.floor(distanceToWall * 5)) % 8 < 2) {
        ctx.fillRect(ray * wallWidth, ceiling, wallWidth, floor - ceiling);
      }
    }
    distances[ray] = distanceToWall;
  }

  const floorStripeSize = 18;
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i < width; i += floorStripeSize) {
    const offset = (i + fpsState.time * 60) % floorStripeSize;
    ctx.beginPath();
    ctx.moveTo(i + offset, height * 0.5);
    ctx.lineTo(i + offset - width * 0.02, height);
    ctx.stroke();
  }

  for (const target of fpsState.targets) {
    if (target.hit) continue;
    const dx = target.x - fpsState.player.x;
    const dy = target.y - fpsState.player.y;
    const distance = Math.hypot(dx, dy);
    const angleToTarget = Math.atan2(dy, dx);
    let diff = angleToTarget - fpsState.player.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    if (Math.abs(diff) > halfFov) continue;
    const size = Math.min(170, Math.max(18, 420 / distance));
    const x = Math.tan(diff) * projectionPlane + width / 2 - size / 2;
    const top = horizon - size / 2;
    const bottom = horizon + size / 2;
    const rayIndex = Math.floor((diff + halfFov) / fpsState.fov * rayCount);
    if (rayIndex >= 0 && rayIndex < rayCount && distances[rayIndex] > distance) {
      const gradient = ctx.createLinearGradient(0, top, 0, bottom);
      gradient.addColorStop(0, '#ff4b4b');
      gradient.addColorStop(1, '#ffbb00');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, top, size, size);
      ctx.strokeStyle = '#ffffffcc';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, top, size, size);
      ctx.fillStyle = '#ffffffcc';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText('TARGET', x + 6, bottom - 8);
    }
  }

  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(0, height - 74, width, 74);
  ctx.fillStyle = '#d0e6ff';
  ctx.font = '16px Inter, sans-serif';
  ctx.fillText(`Position: ${fpsState.player.x.toFixed(1)}, ${fpsState.player.y.toFixed(1)}`, 16, height - 46);
  ctx.fillText(`Angle: ${fpsState.player.angle.toFixed(2)}`, 16, height - 22);
}

function resetFPS() {
  if (currentGame !== 'fps') return;
  if (fpsState.frameRequest) {
    cancelAnimationFrame(fpsState.frameRequest);
    fpsState.frameRequest = null;
  }
  document.removeEventListener('keydown', handleFPSKeyDown);
  document.removeEventListener('keyup', handleFPSKeyUp);
  document.removeEventListener('click', handleFPSClick);
  initFPS();
}

function initMinesweeper() {
  const rows = 6;
  const cols = 6;
  const mineCount = 8;
  const grid = Array(rows).fill(null).map(() => Array(cols).fill(0));
  const mines = [];
  while (mines.length < mineCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    const key = `${row}-${col}`;
    if (!mines.includes(key)) mines.push(key);
  }
  mines.forEach((key) => {
    const [r, c] = key.split('-').map(Number);
    grid[r][c] = 'M';
  });
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (grid[r][c] === 'M') continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nc >= 0 && nr < rows && nc < cols && grid[nr][nc] === 'M') {
            count += 1;
          }
        }
      }
      grid[r][c] = count;
    }
  }

  minesState = {
    rows,
    cols,
    grid,
    revealed: Array(rows).fill(null).map(() => Array(cols).fill(false)),
    finished: false,
    aiLoop: null,
  };
  gameContainer.innerHTML = `
    <div class="game-info status-bar">Reveal all safe tiles without triggering a mine.</div>
    <div class="grid-board" id="minesBoard"></div>
  `;
  const boardEl = document.getElementById('minesBoard');
  boardEl.className = 'grid-board';
  createGrid(boardEl, cols, rows);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cell = document.createElement('button');
      cell.className = 'minesweeper-cell';
      cell.dataset.position = `${r}-${c}`;
      cell.addEventListener('click', () => revealMineCell(r, c, cell));
      boardEl.appendChild(cell);
    }
  }

  if (currentMode === 'ai') {
    startMinesAI();
    updateStatus('AI is solving the board...');
  } else {
    updateStatus('Click a tile to reveal it.');
  }
}

function startMinesAI() {
  if (!minesState) return;
  stopMinesAI();
  minesState.aiLoop = setInterval(() => {
    if (minesState.finished) {
      stopMinesAI();
      return;
    }
    const options = [];
    document.querySelectorAll('.minesweeper-cell').forEach((cell) => {
      const [r, c] = cell.dataset.position.split('-').map(Number);
      if (!minesState.revealed[r][c]) options.push({ cell, r, c });
    });
    if (!options.length) {
      stopMinesAI();
      return;
    }
    const choice = options[Math.floor(Math.random() * options.length)];
    revealMineCell(choice.r, choice.c, choice.cell);
  }, 900);
}

function stopMinesAI() {
  if (minesState && minesState.aiLoop) {
    clearInterval(minesState.aiLoop);
    minesState.aiLoop = null;
  }
}

function revealMineCell(row, col, cell) {
  if (!minesState || minesState.finished || minesState.revealed[row][col]) return;
  minesState.revealed[row][col] = true;
  cell.classList.add('revealed');
  const value = minesState.grid[row][col];
  if (value === 'M') {
    cell.textContent = '💣';
    minesState.finished = true;
    updateStatus('Boom! You hit a mine. Restart to try again.');
    revealAllMines();
    stopMinesAI();
    return;
  }
  cell.textContent = value === 0 ? '' : value;
  if (value === 0) {
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nc >= 0 && nr < minesState.rows && nc < minesState.cols && !minesState.revealed[nr][nc]) {
          const nextCell = document.querySelector(`.minesweeper-cell[data-position="${nr}-${nc}"]`);
          revealMineCell(nr, nc, nextCell);
        }
      }
    }
  }
  checkMinesClear();
}

function revealAllMines() {
  document.querySelectorAll('.minesweeper-cell').forEach((cell) => {
    const [r, c] = cell.dataset.position.split('-').map(Number);
    if (minesState.grid[r][c] === 'M') {
      cell.classList.add('revealed');
      cell.textContent = '💣';
    }
  });
}

function checkMinesClear() {
  const safeCells = minesState.rows * minesState.cols - minesState.grid.flat().filter((item) => item === 'M').length;
  const revealedCount = minesState.revealed.flat().filter(Boolean).length;
  if (revealedCount === safeCells && !minesState.finished) {
    minesState.finished = true;
    updateStatus('Victory! You cleared the board.');
    stopMinesAI();
  }
}

function resetMinesweeper() {
  if (currentGame === 'minesweeper') initMinesweeper();
}

const triviaQuestions = [
  {
    question: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    answer: 'Mars',
  },
  {
    question: 'What is the fastest land animal?',
    options: ['Cheetah', 'Lion', 'Horse', 'Kangaroo'],
    answer: 'Cheetah',
  },
  {
    question: 'Which element is represented by the symbol O?',
    options: ['Gold', 'Oxygen', 'Silver', 'Iron'],
    answer: 'Oxygen',
  },
  {
    question: 'What is 12 × 8?',
    options: ['92', '96', '102', '88'],
    answer: '96',
  },
  {
    question: 'Which sport uses a puck?',
    options: ['Basketball', 'Hockey', 'Soccer', 'Baseball'],
    answer: 'Hockey',
  },
];

function initTrivia() {
  triviaState = { index: 0, humanScore: 0, aiScore: 0 };
  loadTriviaQuestion();
}

function loadTriviaQuestion() {
  const question = triviaQuestions[triviaState.index];
  gameContainer.innerHTML = `
    <div class="game-info status-bar">Choose the correct answer to score points and beat the AI.</div>
    <div class="trivia-card">
      <h3>${question.question}</h3>
      <div class="trivia-options"></div>
    </div>
    <div class="score-panel"><span>You: <strong id="triviaScoreHuman">${triviaState.humanScore}</strong></span><span>AI: <strong id="triviaScoreAI">${triviaState.aiScore}</strong></span></div>
  `;
  const optionsEl = gameContainer.querySelector('.trivia-options');
  question.options.forEach((option) => {
    const button = document.createElement('button');
    button.className = 'option-btn';
    button.textContent = option;
    button.addEventListener('click', () => selectTriviaOption(option, button));
    optionsEl.appendChild(button);
  });
  updateStatus(currentMode === 'ai' ? 'Select your answer. AI is guessing too.' : 'Select your answer to score.');
}

function selectTriviaOption(option, button) {
  const question = triviaQuestions[triviaState.index];
  const correct = option === question.answer;
  if (correct) {
    triviaState.humanScore += 1;
    button.classList.add('correct');
    updateStatus('Correct! You scored a point.');
  } else {
    button.classList.add('wrong');
    updateStatus(`Incorrect. The right answer was ${question.answer}.`);
  }
  document.getElementById('triviaScoreHuman').textContent = triviaState.humanScore;
  Array.from(document.querySelectorAll('.option-btn')).forEach((btn) => btn.disabled = true);

  const aiAnswer = currentMode === 'ai' ? aiChooseTrivia(question) : question.options[Math.floor(Math.random() * question.options.length)];
  if (aiAnswer === question.answer) {
    triviaState.aiScore += 1;
    updateStatus((correct ? '' : 'AI also got it right. ') + 'AI scored a point.');
  } else {
    updateStatus((correct ? '' : 'AI missed it too. ') + `AI chose ${aiAnswer}.`);
  }
  document.getElementById('triviaScoreAI').textContent = triviaState.aiScore;

  setTimeout(() => {
    triviaState.index += 1;
    if (triviaState.index >= triviaQuestions.length) {
      showTriviaResults();
    } else {
      loadTriviaQuestion();
    }
  }, 1100);
}

function aiChooseTrivia(question) {
  const knowCorrect = Math.random() < 0.72;
  if (knowCorrect) return question.answer;
  const wrongOptions = question.options.filter((option) => option !== question.answer);
  return wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
}

function showTriviaResults() {
  const winner = triviaState.humanScore > triviaState.aiScore ? 'You win!' : triviaState.humanScore < triviaState.aiScore ? 'AI wins this round.' : 'It’s a tie!';
  gameContainer.innerHTML = `
    <div class="welcome-screen">
      <h3>Quiz Complete</h3>
      <p>You scored <strong>${triviaState.humanScore}</strong> and AI scored <strong>${triviaState.aiScore}</strong>.</p>
      <p>${winner}</p>
      <p>Click restart to play again or choose a different game.</p>
    </div>
  `;
}

function resetTrivia() {
  if (currentGame === 'trivia') initTrivia();
}

function setActiveNavButton(key) {
  navButtons.forEach((button) => button.classList.toggle('active', button.dataset.game === key));
}

function stopSnakeLoop() {
  if (snakeState && snakeState.frameRequest) {
    cancelAnimationFrame(snakeState.frameRequest);
    snakeState.frameRequest = null;
  }
}

function clearGameArea() {
  stopSnakeLoop();
  if (currentGame === 'snake') {
    document.removeEventListener('keydown', handleSnakeInput);
    if (snakeState && snakeState.deathTimeout) {
      clearTimeout(snakeState.deathTimeout);
      snakeState.deathTimeout = null;
    }
  }
  if (currentGame === 'fps') {
    if (fpsState && fpsState.frameRequest) {
      cancelAnimationFrame(fpsState.frameRequest);
      fpsState.frameRequest = null;
    }
    document.removeEventListener('keydown', handleFPSKeyDown);
    document.removeEventListener('keyup', handleFPSKeyUp);
    document.removeEventListener('click', handleFPSClick);
  }
  if (currentGame === 'minesweeper') {
    stopMinesAI();
  }
}

function setActiveGame(key) {
  clearGameArea();
  if (key === 'hub') {
    currentGame = 'hub';
    modePanel.classList.add('hidden');
    snakeSettingsPanel.classList.add('hidden');
  } else {
    currentGame = key;
    modePanel.classList.remove('hidden');
    snakeSettingsPanel.classList.toggle('hidden', key !== 'snake');
  }
  setActiveNavButton(key);
  hubPanel.classList.toggle('hidden', key !== 'hub');

  if (key === 'hub') {
    gameTitle.textContent = 'Ready to play?';
    gameSubtitle.textContent = 'Game Hub';
    gameStatus.textContent = 'Pick a game to begin.';
    gameContainer.innerHTML = `
      <div class="welcome-screen">
        <h3>Welcome to PlayHub</h3>
        <p>Tap one of the cards on the left or use the top menu to open a game instantly.</p>
        <p>Each game loads directly in the same page for a fast, seamless arcade experience.</p>
      </div>
    `;
    return;
  }

  const game = games[key];
  if (!game) return;
  gameTitle.textContent = game.title;
  gameSubtitle.textContent = game.subtitle;
  gameStatus.textContent = game.description;
  setGameMode(currentMode);
  game.init();
}

bindNavigation();
setGameMode('human');
setActiveGame('hub');

function startKeepAlive() {
  const keepAliveMs = 240000;
  setInterval(() => {
    fetch(window.location.href, { cache: 'no-store' }).catch(() => {});
  }, keepAliveMs);
}

startKeepAlive();
