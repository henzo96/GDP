# 🧩 Sudoku + Doggos

A Sudoku puzzle game that rewards you with cute dog pictures every time you complete a row, column, or 3×3 box.

## Play it

**Easiest — single file, works on any phone:**
Download [`sudoku-standalone.html`](sudoku-standalone.html) and open it in your browser. No internet connection needed to play — only the doggo pics require a connection.

**Via GitHub Pages:**
Enable GitHub Pages on this repo (Settings → Pages → Branch: `main`, folder: `/`) and it will be live at:
```
https://henzo96.github.io/GDP/sudoku-standalone.html
```

## How to play

- Tap/click a cell, then tap a number (or use the on-screen pad)
- **Keyboard:** type 1–9 to fill, Backspace to erase, arrow keys to move
- Complete a **row**, **column**, or **3×3 box** → earn a doggo 🐶
- Solve the whole puzzle → grand final doggo 🏆

## Difficulties

| Difficulty | Clues |
|-----------|-------|
| Easy      | 36    |
| Medium    | 28    |
| Hard      | 22    |

## Files

| File | Description |
|------|-------------|
| `sudoku-standalone.html` | **Single-file version** — everything inlined, easiest to share |
| `index.html` | Main HTML (loads separate CSS/JS) |
| `style.css` | Styles |
| `sudoku.js` | Puzzle generator & validator |
| `app.js` | Game logic & dog API integration |
