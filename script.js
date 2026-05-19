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
}

function bindNavigation() {
  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.game;
      if (target === 'hub') return setActiveGame('hub');
      setActiveGame(target);
    });
  });

  document.querySelectorAll('.game-card').forEach((card) => {
    card.addEventListener('click', () => {
      const gameKey = card.dataset.game;
      setActiveGame(gameKey);
    });
  });

  resetGameButton.addEventListener('click', () => {
    if (currentGame && games[currentGame] && games[currentGame].reset) {
      games[currentGame].reset();
    }
  });

  returnHubButton.addEventListener('click', () => {
    setActiveGame('hub');
  });

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
    cell.addEventListener('click', () => chooseTicCell(i, cell));
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
    card.addEventListener('click', () => flipMemoryCard(index, card, 'human'));
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
    tickRate: 12,
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
    snakeState.running = false;
    updateStatus('Game over. Restarting in a moment...');
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

function getSnakeAIDirection() {
  const head = snakeState.snake[0];
  const target = snakeState.food;
  const directions = ['up', 'down', 'left', 'right'];
  const safeMoves = directions.filter((dir) => {
    const next = { x: head.x, y: head.y };
    if (dir === 'up') next.y -= 1;
    if (dir === 'down') next.y += 1;
    if (dir === 'left') next.x -= 1;
    if (dir === 'right') next.x += 1;
    return next.x >= 0 && next.y >= 0 && next.x < snakeState.width && next.y < snakeState.height && !snakeState.snake.some((segment) => segment.x === next.x && segment.y === next.y);
  });
  if (!safeMoves.length) return snakeState.direction;
  safeMoves.sort((a, b) => {
    const aPos = { x: head.x, y: head.y };
    const bPos = { x: head.x, y: head.y };
    if (a === 'up') aPos.y -= 1;
    if (a === 'down') aPos.y += 1;
    if (a === 'left') aPos.x -= 1;
    if (a === 'right') aPos.x += 1;
    if (b === 'up') bPos.y -= 1;
    if (b === 'down') bPos.y += 1;
    if (b === 'left') bPos.x -= 1;
    if (b === 'right') bPos.x += 1;
    return (Math.abs(aPos.x - target.x) + Math.abs(aPos.y - target.y)) - (Math.abs(bPos.x - target.x) + Math.abs(bPos.y - target.y));
  });
  return safeMoves[0];
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
