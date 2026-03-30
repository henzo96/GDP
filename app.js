/**
 * app.js — UI logic for Sudoku + Doggo rewards
 */

const DOG_API = 'https://dog.ceo/api/breeds/image/random';

const DOG_BREEDS_FACTS = [
  'Tail wags detected: maximum happiness!',
  'This pupper approves your math skills.',
  'Professional good boy. 10/10.',
  'Would solve Sudoku for treats.',
  'Alert: extreme fluffiness ahead.',
  'Certified zoomies champion.',
  'Full-time napper, part-time genius.',
  'Has never done a bad thing in their life.',
];

// ─── State ────────────────────────────────────────────────────────────────────

let puzzle = [];          // 9x9 current values (0 = empty)
let solution = [];        // 9x9 correct values
let given = [];           // 9x9 boolean — true = pre-filled clue
let selected = null;      // { row, col } or null
let earnedDogs = [];      // array of image URLs
let completedGroups = new Set(); // "r0", "c3", "b11" etc.

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const boardEl        = document.getElementById('board');
const statusEl       = document.getElementById('status');
const diffSelect     = document.getElementById('difficulty');
const newGameBtn     = document.getElementById('new-game');
const galleryEl      = document.getElementById('doggo-gallery');
const overlay        = document.getElementById('reward-overlay');
const rewardImg      = document.getElementById('reward-img');
const rewardLabel    = document.getElementById('reward-label');
const rewardCaption  = document.getElementById('reward-caption');
const closeRewardBtn = document.getElementById('close-reward');

// ─── Init ─────────────────────────────────────────────────────────────────────

newGameBtn.addEventListener('click', startGame);
closeRewardBtn.addEventListener('click', () => overlay.classList.add('hidden'));
overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });

document.addEventListener('keydown', handleKeyDown);

startGame();

// ─── Game setup ───────────────────────────────────────────────────────────────

function startGame() {
  const diff = diffSelect.value;
  const result = Sudoku.generate(diff);
  puzzle   = result.puzzle.map(r => [...r]);
  solution = result.solution;
  given    = result.puzzle.map(r => r.map(v => v !== 0));
  selected = null;
  earnedDogs = [];
  completedGroups = new Set();
  statusEl.textContent = '';

  // Remove old win banner if present
  document.querySelector('.win-banner')?.remove();

  renderBoard();
  renderNumpad();
  renderGallery();
}

// ─── Board rendering ──────────────────────────────────────────────────────────

function renderBoard() {
  boardEl.innerHTML = '';
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = row;
      cell.dataset.col = col;

      const val = puzzle[row][col];
      if (val !== 0) cell.textContent = val;

      if (given[row][col]) {
        cell.classList.add('given');
      } else {
        cell.addEventListener('click', () => selectCell(row, col));
      }

      boardEl.appendChild(cell);
    }
  }
  updateSelection();
}

function cellEl(row, col) {
  return boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

function updateSelection() {
  // Clear highlights
  boardEl.querySelectorAll('.cell').forEach(c => {
    c.classList.remove('selected', 'highlight');
  });
  if (!selected) return;
  const { row, col } = selected;
  cellEl(row, col)?.classList.add('selected');

  // Highlight peers
  Sudoku.peers(row, col).forEach(({ row: r, col: c }) => {
    cellEl(r, c)?.classList.add('highlight');
  });
}

// ─── Numpad ───────────────────────────────────────────────────────────────────

function renderNumpad() {
  // Remove existing pad if present
  document.getElementById('numpad')?.remove();

  const pad = document.createElement('div');
  pad.id = 'numpad';

  for (let n = 1; n <= 9; n++) {
    const btn = document.createElement('button');
    btn.textContent = n;
    btn.addEventListener('click', () => enterNumber(n));
    pad.appendChild(btn);
  }

  const erase = document.createElement('button');
  erase.textContent = '⌫';
  erase.className = 'erase';
  erase.addEventListener('click', () => enterNumber(0));
  pad.appendChild(erase);

  document.getElementById('board-container').appendChild(pad);
}

// ─── Input handling ───────────────────────────────────────────────────────────

function selectCell(row, col) {
  selected = { row, col };
  updateSelection();
}

function handleKeyDown(e) {
  if (!selected) return;
  const { row, col } = selected;

  if (e.key >= '1' && e.key <= '9') {
    enterNumber(parseInt(e.key, 10));
  } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
    enterNumber(0);
  } else if (e.key === 'ArrowUp'    && row > 0) selectCell(row - 1, col);
  else if   (e.key === 'ArrowDown'  && row < 8) selectCell(row + 1, col);
  else if   (e.key === 'ArrowLeft'  && col > 0) selectCell(row, col - 1);
  else if   (e.key === 'ArrowRight' && col < 8) selectCell(row, col + 1);
}

function enterNumber(num) {
  if (!selected) return;
  const { row, col } = selected;
  if (given[row][col]) return; // can't change a clue

  puzzle[row][col] = num;
  const cell = cellEl(row, col);

  if (num === 0) {
    cell.textContent = '';
    cell.classList.remove('player', 'error');
    return;
  }

  cell.textContent = num;
  cell.classList.add('player');

  if (Sudoku.checkCell(solution, row, col, num)) {
    cell.classList.remove('error');
    triggerCorrectAnimation(cell);
    checkGroupCompletions(row, col);
    if (Sudoku.isSolved(puzzle, solution)) {
      showWin();
    }
  } else {
    cell.classList.remove('error');
    // Re-trigger animation even if error class already present
    void cell.offsetWidth;
    cell.classList.add('error');
  }
}

// ─── Group completion check ───────────────────────────────────────────────────

function isRowComplete(row) {
  for (let c = 0; c < 9; c++)
    if (puzzle[row][c] !== solution[row][c]) return false;
  return true;
}

function isColComplete(col) {
  for (let r = 0; r < 9; r++)
    if (puzzle[r][col] !== solution[r][col]) return false;
  return true;
}

function isBoxComplete(boxRow, boxCol) {
  const br = boxRow * 3, bc = boxCol * 3;
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++)
      if (puzzle[r][c] !== solution[r][c]) return false;
  return true;
}

function checkGroupCompletions(row, col) {
  const rewards = [];

  const rowKey = `r${row}`;
  if (!completedGroups.has(rowKey) && isRowComplete(row)) {
    completedGroups.add(rowKey);
    highlightGroup('row', row);
    rewards.push(`Row ${row + 1} complete!`);
  }

  const colKey = `c${col}`;
  if (!completedGroups.has(colKey) && isColComplete(col)) {
    completedGroups.add(colKey);
    highlightGroup('col', col);
    rewards.push(`Column ${col + 1} complete!`);
  }

  const br = Math.floor(row / 3), bc = Math.floor(col / 3);
  const boxKey = `b${br}${bc}`;
  if (!completedGroups.has(boxKey) && isBoxComplete(br, bc)) {
    completedGroups.add(boxKey);
    highlightGroup('box', br, bc);
    rewards.push(`Box complete!`);
  }

  if (rewards.length > 0) {
    awardDoggo(rewards.join(' '));
  }
}

function highlightGroup(type, a, b) {
  const cells = [];
  if (type === 'row') {
    for (let c = 0; c < 9; c++) cells.push(cellEl(a, c));
  } else if (type === 'col') {
    for (let r = 0; r < 9; r++) cells.push(cellEl(r, a));
  } else {
    const br = a * 3, bc = b * 3;
    for (let r = br; r < br + 3; r++)
      for (let c = bc; c < bc + 3; c++)
        cells.push(cellEl(r, c));
  }
  cells.forEach(c => {
    if (!c) return;
    c.classList.add('completed-group');
    setTimeout(() => c.classList.remove('completed-group'), 700);
  });
}

// ─── Animations ───────────────────────────────────────────────────────────────

function triggerCorrectAnimation(cell) {
  cell.classList.remove('correct');
  void cell.offsetWidth;
  cell.classList.add('correct');
  setTimeout(() => cell.classList.remove('correct'), 450);
}

// ─── Doggo rewards ────────────────────────────────────────────────────────────

async function awardDoggo(label) {
  // Add placeholder to gallery immediately
  const placeholder = document.createElement('div');
  placeholder.className = 'doggo-placeholder';
  placeholder.textContent = '🐾';
  galleryEl.appendChild(placeholder);

  try {
    const res  = await fetch(DOG_API);
    const data = await res.json();
    const url  = data.message;

    earnedDogs.push(url);
    placeholder.remove();

    // Add thumbnail
    const img = document.createElement('img');
    img.className = 'doggo-thumb';
    img.src = url;
    img.alt = 'cute dog';
    img.title = 'Click to enlarge';
    img.addEventListener('click', () => showReward(url, label));
    galleryEl.appendChild(img);

    // Show reward popup
    showReward(url, label);
  } catch {
    placeholder.textContent = '🐶';
  }
}

function showReward(url, label) {
  rewardLabel.textContent = label || 'Here\'s your doggo!';
  rewardImg.src = url;
  rewardCaption.textContent = DOG_BREEDS_FACTS[Math.floor(Math.random() * DOG_BREEDS_FACTS.length)];
  overlay.classList.remove('hidden');
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

function renderGallery() {
  galleryEl.innerHTML = '';
  earnedDogs.forEach((url, i) => {
    const img = document.createElement('img');
    img.className = 'doggo-thumb';
    img.src = url;
    img.alt = 'cute dog';
    img.addEventListener('click', () => showReward(url, `Doggo #${i + 1}`));
    galleryEl.appendChild(img);
  });
}

// ─── Win screen ───────────────────────────────────────────────────────────────

async function showWin() {
  statusEl.textContent = '🎉 Puzzle solved!';

  const banner = document.createElement('div');
  banner.className = 'win-banner';
  banner.textContent = '🎉 You solved it! Here's your final doggo! 🐶';
  document.querySelector('main').prepend(banner);

  // Award a final grand doggo
  try {
    const res  = await fetch(DOG_API);
    const data = await res.json();
    showReward(data.message, '🏆 Puzzle complete! Grand doggo reward!');
    earnedDogs.push(data.message);
    renderGallery();
  } catch {
    // Silently ignore network errors on win
  }
}
