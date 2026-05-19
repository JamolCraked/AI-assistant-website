const gameContainer = document.getElementById('gameContainer');
const gameTitle = document.getElementById('gameTitle');
const gameSubtitle = document.getElementById('gameSubtitle');
const gameStatus = document.getElementById('gameStatus');
const navButtons = [...document.querySelectorAll('.nav-btn')];
const hubPanel = document.getElementById('hubPanel');
const resetGameButton = document.getElementById('resetGame');
const returnHubButton = document.getElementById('returnHub');

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
    description: 'Use arrow keys to eat, grow, and avoid your tail.',
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
    description: 'Answer questions and earn points while you play.',
    init: initTrivia,
    reset: resetTrivia,
  },
};

let currentGame = null;
let snakeState = null;

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
}

function updateStatus(text) {
  gameStatus.textContent = text;
}

function createGrid(container, rows, cols) {
  container.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
}

// Tic Tac Toe
let ticState = null;
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
}

function chooseTicCell(index, cell) {
  if (ticState.finished || ticState.board[index]) return;
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
  updateStatus(`Move: ${ticState.turn}`);
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

// Memory Match
let memoryState = null;
const icons = ['🔥', '❄️', '🌟', '⚡', '🍀', '🎯', '🧩', '🚀'];
function initMemoryMatch() {
  const deck = shuffle([...icons, ...icons]);
  memoryState = { deck, flipped: [], matched: [], moves: 0 };
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
    card.addEventListener('click', () => flipMemoryCard(index, card));
    board.appendChild(card);
  });
}

function flipMemoryCard(index, element) {
  if (memoryState.flipped.includes(index) || memoryState.matched.includes(index) || memoryState.flipped.length === 2) return;
  memoryState.flipped.push(index);
  element.classList.add('revealed');
  element.textContent = memoryState.deck[index];
  if (memoryState.flipped.length === 2) {
    memoryState.moves += 1;
    document.getElementById('memoryMoves').textContent = memoryState.moves;
    const [first, second] = memoryState.flipped;
    if (memoryState.deck[first] === memoryState.deck[second]) {
      memoryState.matched.push(first, second);
      memoryState.flipped = [];
      if (memoryState.matched.length === memoryState.deck.length) {
        updateStatus('All matched! Nice work.');
      }
    } else {
      updateStatus('Not a match. Try again.');
      setTimeout(() => {
        memoryState.flipped.forEach((idx) => {
          const card = document.querySelector(`.card[data-index="${idx}"]`);
          if (card) {
            card.classList.remove('revealed');
            card.textContent = '';
          }
        });
        memoryState.flipped = [];
        updateStatus('Flip the next pair.');
      }, 950);
    }
  }
}

function resetMemoryMatch() {
  if (currentGame === 'memory') initMemoryMatch();
}

function shuffle(array) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

// Snake
function initSnake() {
  snakeState = {
    direction: 'right',
    snake: [{ x: 2, y: 2 }],
    food: { x: 5, y: 5 },
    speed: 120,
    size: 12,
    width: 12,
    height: 12,
    running: true,
  };
  gameContainer.innerHTML = `
    <div class="game-info status-bar">Use arrow keys to move. Eat food and grow without hitting the wall.</div>
    <canvas id="snakeCanvas" width="360" height="360"></canvas>
    <div class="score-panel"><span>Length: <strong id="snakeScore">1</strong></span></div>
  `;
  const canvas = document.getElementById('snakeCanvas');
  const ctx = canvas.getContext('2d');
  drawSnake(ctx);
  document.addEventListener('keydown', handleSnakeInput);
  snakeState.loop = setInterval(() => updateSnake(ctx), snakeState.speed);
}

function handleSnakeInput(event) {
  if (currentGame !== 'snake') return;
  const directions = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
  };
  const next = directions[event.key];
  if (!next) return;
  const opposite = {
    up: 'down', down: 'up', left: 'right', right: 'left',
  };
  if (next !== opposite[snakeState.direction]) {
    snakeState.direction = next;
  }
}

function updateSnake(ctx) {
  if (!snakeState.running) return;
  const head = { ...snakeState.snake[0] };
  if (snakeState.direction === 'up') head.y -= 1;
  if (snakeState.direction === 'down') head.y += 1;
  if (snakeState.direction === 'left') head.x -= 1;
  if (snakeState.direction === 'right') head.x += 1;

  if (head.x < 0 || head.y < 0 || head.x >= snakeState.width || head.y >= snakeState.height || snakeState.snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
    snakeState.running = false;
    updateStatus('Game over. Hit a wall or yourself.');
    return;
  }

  snakeState.snake.unshift(head);
  if (head.x === snakeState.food.x && head.y === snakeState.food.y) {
    snakeState.food = placeSnakeFood();
  } else {
    snakeState.snake.pop();
  }

  document.getElementById('snakeScore').textContent = snakeState.snake.length;
  drawSnake(ctx);
}

function drawSnake(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const cellSize = ctx.canvas.width / snakeState.width;
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  snakeState.snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? '#7de7ff' : '#5b8df9';
    ctx.fillRect(segment.x * cellSize + 2, segment.y * cellSize + 2, cellSize - 4, cellSize - 4);
  });
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(snakeState.food.x * cellSize + 4, snakeState.food.y * cellSize + 4, cellSize - 8, cellSize - 8);
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
  clearInterval(snakeState.loop);
  document.removeEventListener('keydown', handleSnakeInput);
  initSnake();
}

// Minesweeper
let minesState = null;
function initMinesweeper() {
  const rows = 6;
  const cols = 6;
  const mineCount = 8;
  const board = Array(rows).fill(null).map(() => Array(cols).fill({}));
  const cells = [];
  while (cells.length < mineCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    const key = `${row}-${col}`;
    if (!cells.includes(key)) cells.push(key);
  }
  const grid = Array(rows).fill(null).map(() => Array(cols).fill(0));
  cells.forEach((key) => {
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

  minesState = { rows, cols, grid, revealed: Array(rows).fill(null).map(() => Array(cols).fill(false)), finished: false };
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
  }
}

function resetMinesweeper() {
  if (currentGame === 'minesweeper') initMinesweeper();
}

// Trivia Quiz
let triviaState = null;
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
  triviaState = { index: 0, score: 0 };
  loadTriviaQuestion();
}

function loadTriviaQuestion() {
  const question = triviaQuestions[triviaState.index];
  gameContainer.innerHTML = `
    <div class="game-info status-bar">Choose the correct answer to score points.</div>
    <div class="trivia-card">
      <h3>${question.question}</h3>
      <div class="trivia-options"></div>
    </div>
    <div class="score-panel"><span>Score: <strong id="triviaScore">${triviaState.score}</strong></span></div>
  `;
  const optionsEl = gameContainer.querySelector('.trivia-options');
  question.options.forEach((option) => {
    const button = document.createElement('button');
    button.className = 'option-btn';
    button.textContent = option;
    button.addEventListener('click', () => selectTriviaOption(option, button));
    optionsEl.appendChild(button);
  });
}

function selectTriviaOption(option, button) {
  const question = triviaQuestions[triviaState.index];
  const correct = option === question.answer;
  if (correct) {
    triviaState.score += 1;
    button.classList.add('correct');
    updateStatus('Correct! Nice answer.');
  } else {
    button.classList.add('wrong');
    updateStatus(`Wrong answer. The correct answer was ${question.answer}.`);
  }
  document.getElementById('triviaScore').textContent = triviaState.score;
  Array.from(document.querySelectorAll('.option-btn')).forEach((btn) => btn.disabled = true);
  setTimeout(() => {
    triviaState.index += 1;
    if (triviaState.index >= triviaQuestions.length) {
      showTriviaResults();
    } else {
      loadTriviaQuestion();
    }
  }, 900);
}

function showTriviaResults() {
  gameContainer.innerHTML = `
    <div class="welcome-screen">
      <h3>Quiz Complete</h3>
      <p>You scored <strong>${triviaState.score}</strong> out of ${triviaQuestions.length}.</p>
      <p>Click restart to play again or choose a different game.</p>
    </div>
  `;
}

function resetTrivia() {
  if (currentGame === 'trivia') initTrivia();
}

// Helpers
function setActiveNavButton(key) {
  navButtons.forEach((button) => button.classList.toggle('active', button.dataset.game === key));
}

function stopSnakeLoop() {
  if (snakeState && snakeState.loop) {
    clearInterval(snakeState.loop);
    snakeState.loop = null;
  }
}

function clearGameArea() {
  stopSnakeLoop();
  if (currentGame === 'snake') {
    document.removeEventListener('keydown', handleSnakeInput);
  }
}

function setActiveGame(key) {
  clearGameArea();
  if (key === 'hub') {
    currentGame = 'hub';
  } else {
    currentGame = key;
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
  game.init();
}

bindNavigation();
setActiveGame('hub');
