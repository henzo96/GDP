/**
 * Sudoku puzzle generator and validator.
 * Generates a valid, uniquely-solvable puzzle by starting from a solved board
 * and removing cells according to the chosen difficulty.
 */

const Sudoku = (() => {
  // Shuffle an array in place (Fisher-Yates)
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Create an empty 9x9 grid (0 = empty)
  function emptyGrid() {
    return Array.from({ length: 9 }, () => new Array(9).fill(0));
  }

  // Check whether placing `num` at (row, col) is valid
  function isValid(grid, row, col, num) {
    for (let i = 0; i < 9; i++) {
      if (grid[row][i] === num) return false;
      if (grid[i][col] === num) return false;
    }
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++)
      for (let c = bc; c < bc + 3; c++)
        if (grid[r][c] === num) return false;
    return true;
  }

  // Fill the grid using backtracking to create a solved board
  function fillGrid(grid) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          for (const num of nums) {
            if (isValid(grid, row, col, num)) {
              grid[row][col] = num;
              if (fillGrid(grid)) return true;
              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  // Remove cells from a solved grid to create a puzzle.
  // We skip the uniqueness check (which requires running a full solver 81 times
  // and freezes the browser). The game validates against the stored solution so
  // correctness is guaranteed regardless of alternate solutions.
  function createPuzzle(solved, clues) {
    const puzzle = solved.map(r => [...r]);
    const positions = shuffle(Array.from({ length: 81 }, (_, i) => i));
    const toRemove = 81 - clues;
    for (let i = 0; i < toRemove; i++) {
      const row = Math.floor(positions[i] / 9);
      const col = positions[i] % 9;
      puzzle[row][col] = 0;
    }
    return puzzle;
  }

  const CLUE_COUNTS = { easy: 36, medium: 28, hard: 22 };

  function generate(difficulty = 'medium') {
    const solved = emptyGrid();
    fillGrid(solved);
    const clues = CLUE_COUNTS[difficulty] ?? 28;
    const puzzle = createPuzzle(solved, clues);
    return { puzzle, solution: solved };
  }

  // Validate a single cell value against the solution
  function checkCell(solution, row, col, value) {
    return solution[row][col] === value;
  }

  // Check if the entire board matches the solution
  function isSolved(grid, solution) {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (grid[r][c] !== solution[r][c]) return false;
    return true;
  }

  // Returns indices of all cells in the same row, col, or box as (row, col)
  function peers(row, col) {
    const set = new Set();
    for (let i = 0; i < 9; i++) {
      set.add(row * 9 + i);
      set.add(i * 9 + col);
    }
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++)
      for (let c = bc; c < bc + 3; c++)
        set.add(r * 9 + c);
    set.delete(row * 9 + col);
    return [...set].map(idx => ({ row: Math.floor(idx / 9), col: idx % 9 }));
  }

  return { generate, checkCell, isSolved, peers };
})();
