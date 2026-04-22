/* ============================================================
   Kellogg Class of 2026 · Farewell Crossword
   ------------------------------------------------------------
   TO CUSTOMIZE:
   Edit the PEOPLE array below. Each entry has:
     - name:   the 26's English first name (letters only, A-Z)
     - prompt: the clue text shown for that name
   ============================================================ */

// TEMP test toggle: when true, every cell's correct answer is "A" regardless
// of the real name. Use this to eyeball the green/red feedback + the full-
// correct celebration without having to know each name. Set to false to
// restore real answers.
const TEST_ALL_A = false;
const DEV_MODE = true;

const PEOPLE = [
  { name: "HUMPHREY",  prompt: "洋派兵馬俑" },
  { name: "SHELINA",   prompt: "外冷內熱" },
  { name: "JUNIOR",    prompt: "Super" },
  { name: "ALAN",      prompt: "西北 DoDoMan" },
  { name: "STEPHANIE", prompt: "2018 台大畢業歌女主角" },
  { name: "JERRY",     prompt: "文藝青年" },
  { name: "AL",        prompt: "大法官" },
  { name: "JUDY",      prompt: "兔子警察" },
  { name: "JESSICA",   prompt: "清華女神" },
  { name: "CATHERINE", prompt: "Tai灣人" },
  { name: "JUSTIN",    prompt: "比伯" },
  { name: "AUSTIN",    prompt: "唐來瘋" },
  { name: "TIFFANY",   prompt: "華爾街" },
  { name: "WILLIAM",   prompt: "工頁" },
];

/* ============================================================
   CROSSWORD GENERATOR
   Tries many random orderings to maximize words placed.
   ============================================================ */

const GRID_SIZE = 30; // virtual working size; trimmed at the end

function cleanName(n) { return n.toUpperCase().replace(/[^A-Z]/g, ""); }

function emptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

function tryPlace(grid, word, row, col, dir) {
  const rows = grid.length;
  const cols = grid[0].length;
  const w = word.length;

  // Bounds
  if (dir === "A") {
    if (col < 0 || col + w > cols || row < 0 || row >= rows) return null;
  } else {
    if (row < 0 || row + w > rows || col < 0 || col >= cols) return null;
  }

  // Cell before start / after end must be empty
  if (dir === "A") {
    if (col > 0 && grid[row][col - 1] != null) return null;
    if (col + w < cols && grid[row][col + w] != null) return null;
  } else {
    if (row > 0 && grid[row - 1][col] != null) return null;
    if (row + w < rows && grid[row + w][col] != null) return null;
  }

  let intersections = 0;

  for (let i = 0; i < w; i++) {
    const r = dir === "D" ? row + i : row;
    const c = dir === "A" ? col + i : col;
    const cell = grid[r][c];

    if (cell != null) {
      if (cell !== word[i]) return null;
      intersections++;
    } else {
      // Check perpendicular neighbors — cannot touch another word sideways
      if (dir === "A") {
        if (r > 0 && grid[r - 1][c] != null) return null;
        if (r < rows - 1 && grid[r + 1][c] != null) return null;
      } else {
        if (c > 0 && grid[r][c - 1] != null) return null;
        if (c < cols - 1 && grid[r][c + 1] != null) return null;
      }
    }
  }

  if (intersections === 0) return null; // must intersect
  return { row, col, dir, intersections };
}

function writeWord(grid, word, placement) {
  for (let i = 0; i < word.length; i++) {
    const r = placement.dir === "D" ? placement.row + i : placement.row;
    const c = placement.dir === "A" ? placement.col + i : placement.col;
    grid[r][c] = word[i];
  }
}

function findBestPlacement(grid, word, placed) {
  let best = null;
  for (const p of placed) {
    const pw = p.word;
    for (let i = 0; i < pw.length; i++) {
      for (let j = 0; j < word.length; j++) {
        if (pw[i] !== word[j]) continue;

        // Perpendicular to existing
        const newDir = p.dir === "A" ? "D" : "A";
        let r, c;
        if (newDir === "D") {
          r = p.row - j;
          c = p.col + i;
        } else {
          r = p.row + i;
          c = p.col - j;
        }
        const res = tryPlace(grid, word, r, c, newDir);
        if (res && (!best || res.intersections > best.intersections)) {
          best = res;
        }
      }
    }
  }
  return best;
}

function generateOnce(people) {
  const grid = emptyGrid();
  const placed = [];
  const unplaced = [];

  // Sort: longest first gets placed as seed
  const pool = [...people].sort((a, b) => b.word.length - a.word.length);
  if (pool.length === 0) return { grid, placed, unplaced };

  const first = pool.shift();
  const r0 = Math.floor(GRID_SIZE / 2);
  const c0 = Math.floor((GRID_SIZE - first.word.length) / 2);
  for (let i = 0; i < first.word.length; i++) grid[r0][c0 + i] = first.word[i];
  placed.push({ ...first, row: r0, col: c0, dir: "A" });

  // For remaining, try repeatedly until stable
  let remaining = pool;
  let progress = true;
  while (progress && remaining.length > 0) {
    progress = false;
    const stillLeft = [];
    for (const p of remaining) {
      const spot = findBestPlacement(grid, p.word, placed);
      if (spot) {
        writeWord(grid, p.word, spot);
        placed.push({ ...p, row: spot.row, col: spot.col, dir: spot.dir });
        progress = true;
      } else {
        stillLeft.push(p);
      }
    }
    remaining = stillLeft;
  }
  unplaced.push(...remaining);

  return { grid, placed, unplaced };
}

function trim(grid, placed) {
  let minR = grid.length, maxR = -1, minC = grid[0].length, maxC = -1;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] != null) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }
  if (maxR < 0) return { grid: [[]], placed: [] };
  const trimmed = [];
  for (let r = minR; r <= maxR; r++) {
    const row = [];
    for (let c = minC; c <= maxC; c++) row.push(grid[r][c]);
    trimmed.push(row);
  }
  const shifted = placed.map(p => ({ ...p, row: p.row - minR, col: p.col - minC }));
  return { grid: trimmed, placed: shifted };
}

// Deterministic pseudo-random generator (mulberry32) — ensures the same
// crossword layout is produced for everyone, every time, regardless of
// device or how many times they hit Play Again.
function seededRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296);
  };
}

function seededShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Change this number if you want a completely different (but still fixed)
// layout for everyone. Seed 57 produces a 16r x 13c grid for the real
// 14-name set — the narrowest option found in the sweep, which keeps
// horizontal scrolling off on mobile screens as narrow as the iPhone SE.
const LAYOUT_SEED = 57;

function buildBestCrossword(people, attempts = 400) {
  const pool = people
    .map(p => ({ ...p, word: cleanName(p.name) }))
    .filter(p => p.word.length >= 2);

  const rng = seededRng(LAYOUT_SEED);
  let best = null;

  for (let t = 0; t < attempts; t++) {
    // Deterministic shuffle so every device produces the same layout.
    const shuffled = seededShuffle(pool, rng);
    const res = generateOnce(shuffled);
    const score =
      res.placed.length * 1000 -
      res.grid.length - res.grid[0].length +
      res.placed.reduce((s, p) => s + (p.intersections || 0), 0);
    if (!best || score > best.score) {
      best = { ...res, score };
      if (res.unplaced.length === 0) {
        // Still run a few more to try to compact
        if (t > 60) break;
      }
    }
  }

  const trimmed = trim(best.grid, best.placed);
  return { ...trimmed, unplaced: best.unplaced };
}

/* ============================================================
   GAME STATE + RENDERING
   ============================================================ */

const state = {
  grid: [],           // 2D of { answer, value } or null
  cells: {},          // "r,c" -> cell data { answer, value, row, col, words: {A, D}, number }
  words: [],          // [{ name, fact, word, row, col, dir, number, cells: [{r,c}] }]
  selected: null,     // { row, col }
  direction: "A",     // current typing direction
  rows: 0,
  cols: 0,
  unplaced: [],
};

function buildState() {
  const { grid: g, placed, unplaced } = buildBestCrossword(PEOPLE);
  state.rows = g.length;
  state.cols = g[0].length;
  state.unplaced = unplaced;

  // Build cell map
  const cells = {};
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      if (g[r][c] != null) {
        cells[`${r},${c}`] = {
          answer: g[r][c],
          value: "",
          row: r,
          col: c,
          words: {},
          number: null,
        };
      }
    }
  }

  // Words, assign numbering in row-major order
  const words = [];
  let nextNumber = 1;
  const startCells = new Map(); // "r,c" -> number

  // Sort placements for stable numbering — by row, then col
  const sortedPlaced = [...placed].sort((a, b) => (a.row - b.row) || (a.col - b.col));

  for (const p of sortedPlaced) {
    const key = `${p.row},${p.col}`;
    if (!startCells.has(key)) {
      startCells.set(key, nextNumber++);
    }
  }

  for (const p of sortedPlaced) {
    const startKey = `${p.row},${p.col}`;
    const number = startCells.get(startKey);
    const wordCells = [];
    for (let i = 0; i < p.word.length; i++) {
      const r = p.dir === "D" ? p.row + i : p.row;
      const c = p.dir === "A" ? p.col + i : p.col;
      wordCells.push({ r, c });
      const cell = cells[`${r},${c}`];
      cell.words[p.dir] = words.length; // index of this word
    }
    const w = {
      name: p.name,
      prompt: p.prompt || "",
      word: p.word,
      row: p.row,
      col: p.col,
      dir: p.dir,
      number,
      cells: wordCells,
    };
    words.push(w);
    cells[startKey].number = cells[startKey].number || number;
  }

  state.cells = cells;
  state.words = words;

  // TEST mode: override every cell's correct answer to "A" so the user can
  // easily verify live feedback + celebration. The displayed grid shape
  // and clues stay intact; only the expected letter changes.
  if (typeof TEST_ALL_A !== "undefined" && TEST_ALL_A) {
    for (const k in state.cells) state.cells[k].answer = "A";
    for (const w of state.words) w.word = "A".repeat(w.word.length);
  }
}

/* ============================================================
   DOM RENDERING
   ============================================================ */

const gridEl = document.getElementById("grid");
const clueLabelEl = document.getElementById("clueLabel");
const clueTextEl = document.getElementById("clueText");
const prevClueBtn = document.getElementById("prevClueBtn");
const nextClueBtn = document.getElementById("nextClueBtn");
const acrossListEl = document.getElementById("acrossList");
const downListEl = document.getElementById("downList");
const keyboardEl = document.getElementById("keyboard");
const celebrationEl = document.getElementById("celebration");
const closeCelebrationBtn = document.getElementById("closeCelebration");
const shareGridEl = document.getElementById("shareGrid");
const shareNamesEl = document.getElementById("shareNames");
const confettiEl = document.getElementById("confetti");
const toastEl = document.getElementById("toast");
const restartBtn = document.getElementById("restartBtn");
const restartConfirm = document.getElementById("restartConfirm");
const confirmCancelBtn = document.getElementById("confirmCancel");
const confirmOkBtn = document.getElementById("confirmOk");

function renderGrid() {
  document.documentElement.style.setProperty("--grid-cols", state.cols);
  gridEl.innerHTML = "";
  gridEl.style.gridTemplateColumns = `repeat(${state.cols}, var(--cell-size))`;

  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const key = `${r},${c}`;
      const cellData = state.cells[key];
      const div = document.createElement("div");
      div.className = "cell" + (cellData ? "" : " empty");
      if (cellData) {
        div.dataset.r = r;
        div.dataset.c = c;
        if (cellData.number) {
          const num = document.createElement("span");
          num.className = "number";
          num.textContent = cellData.number;
          div.appendChild(num);
        }
        const letter = document.createElement("span");
        letter.className = "letter";
        letter.textContent = cellData.value;
        div.appendChild(letter);
        div.addEventListener("click", () => onCellClick(r, c));
      }
      gridEl.appendChild(div);
    }
  }
}

function updateCellsVisual() {
  document.querySelectorAll(".cell").forEach(div => {
    div.classList.remove("selected", "highlight", "correct", "incorrect");
    const r = Number(div.dataset.r);
    const c = Number(div.dataset.c);
    if (isNaN(r)) return;
    const cell = state.cells[`${r},${c}`];
    if (!cell) return;
    const letter = div.querySelector(".letter");
    if (letter) letter.textContent = cell.value;
    // Live correctness feedback: color each typed letter green/red.
    if (cell.value) {
      div.classList.add(cell.value === cell.answer ? "correct" : "incorrect");
    }
  });
  if (state.selected) {
    const { row, col } = state.selected;
    const sel = state.cells[`${row},${col}`];
    if (sel) {
      // Highlight whole word
      const wIdx = sel.words[state.direction] ?? sel.words[state.direction === "A" ? "D" : "A"];
      if (wIdx != null) {
        const word = state.words[wIdx];
        for (const { r, c } of word.cells) {
          const el = gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
          if (el) el.classList.add("highlight");
        }
      }
      const selEl = gridEl.querySelector(`[data-r="${row}"][data-c="${col}"]`);
      if (selEl) {
        selEl.classList.remove("highlight");
        selEl.classList.add("selected");
      }
    }
  }
}

function renderClueLists() {
  acrossListEl.innerHTML = "";
  downListEl.innerHTML = "";
  const acrossWords = state.words.filter(w => w.dir === "A").sort((a, b) => a.number - b.number);
  const downWords = state.words.filter(w => w.dir === "D").sort((a, b) => a.number - b.number);
  for (const w of acrossWords) acrossListEl.appendChild(clueLi(w));
  for (const w of downWords) downListEl.appendChild(clueLi(w));
}

function clueLi(w) {
  const li = document.createElement("li");
  li.dataset.wIdx = state.words.indexOf(w);
  li.innerHTML = `
    <span class="num">${w.number}.</span>
    <span class="prompt-text">${escapeHtml(w.prompt)}</span>`;
  li.addEventListener("click", () => {
    selectWord(state.words.indexOf(w));
  });
  return li;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function updateClueListStates() {
  const activeWIdx = currentWordIdx();
  document.querySelectorAll(".clue-list li").forEach(li => {
    const idx = Number(li.dataset.wIdx);
    const w = state.words[idx];
    li.classList.toggle("active", idx === activeWIdx);
    // Mark done if all its cells have the correct letter
    const done = w.cells.every(({ r, c }) => {
      const cell = state.cells[`${r},${c}`];
      return cell && cell.value === cell.answer;
    });
    li.classList.toggle("done", done);
  });
}

/* ============================================================
   SELECTION + INPUT
   ============================================================ */

// A cell is "locked" once its value matches the correct answer — locked
// cells stay green, are skipped by the cursor, and are never overwritten
// by typing or backspace.
function isLocked(cell) {
  return !!(cell && cell.value && cell.value === cell.answer);
}

function onCellClick(r, c) {
  const cell = state.cells[`${r},${c}`];
  if (!cell) return;
  // If already selected, toggle direction (if both possible)
  if (state.selected && state.selected.row === r && state.selected.col === c) {
    const other = state.direction === "A" ? "D" : "A";
    if (cell.words[other] != null) state.direction = other;
  } else {
    // Prefer current direction if available; otherwise flip
    if (cell.words[state.direction] == null) {
      const other = state.direction === "A" ? "D" : "A";
      if (cell.words[other] != null) state.direction = other;
    }
    state.selected = { row: r, col: c };
  }
  // If the tapped cell is locked, jump the cursor to the first editable cell
  // in the same word so typing lands on a modifiable square.
  const wIdx = currentWordIdx();
  if (wIdx != null && isLocked(state.cells[`${state.selected.row},${state.selected.col}`])) {
    const w = state.words[wIdx];
    for (const { r: rr, c: cc } of w.cells) {
      if (!isLocked(state.cells[`${rr},${cc}`])) {
        state.selected = { row: rr, col: cc };
        break;
      }
    }
  }
  refreshUI();
}

function currentWordIdx() {
  if (!state.selected) return null;
  const cell = state.cells[`${state.selected.row},${state.selected.col}`];
  if (!cell) return null;
  if (cell.words[state.direction] != null) return cell.words[state.direction];
  const other = state.direction === "A" ? "D" : "A";
  return cell.words[other] ?? null;
}

function selectWord(wIdx) {
  const w = state.words[wIdx];
  if (!w) return;
  state.direction = w.dir;
  state.selected = { row: w.row, col: w.col };
  // Prefer first empty cell; else first not-yet-locked (i.e. wrong) cell;
  // else fall back to start of word.
  let target = null;
  for (const { r, c } of w.cells) {
    const cell = state.cells[`${r},${c}`];
    if (!cell.value) { target = { row: r, col: c }; break; }
  }
  if (!target) {
    for (const { r, c } of w.cells) {
      const cell = state.cells[`${r},${c}`];
      if (!isLocked(cell)) { target = { row: r, col: c }; break; }
    }
  }
  if (target) state.selected = target;
  refreshUI();
}

function typeLetter(letter) {
  if (!state.selected) {
    // Auto-select first word
    selectWord(0);
    if (!state.selected) return;
  }
  // Safety: if the current cell happens to be locked (e.g. cursor landed
  // on a correct cell via arrow navigation), advance past it first.
  if (isLocked(state.cells[`${state.selected.row},${state.selected.col}`])) {
    skipForwardPastLocked();
  }
  const { row, col } = state.selected;
  const cell = state.cells[`${row},${col}`];
  if (!cell) return;
  if (isLocked(cell)) return; // nowhere editable left in this word
  cell.value = letter;
  advanceSelection();
  refreshUI();
  checkCompletion();
}

function deleteLetter() {
  if (!state.selected) return;
  const { row, col } = state.selected;
  const cell = state.cells[`${row},${col}`];
  if (!cell) return;
  // If current cell has a wrong/unlocked letter, just clear it in place.
  if (cell.value && !isLocked(cell)) {
    cell.value = "";
    refreshUI();
    return;
  }
  // Otherwise step back to the nearest editable (not-locked) cell and clear it.
  retreatSelection();
  const { row: nr, col: nc } = state.selected;
  const prev = state.cells[`${nr},${nc}`];
  if (prev && !isLocked(prev)) prev.value = "";
  refreshUI();
}

function skipForwardPastLocked() {
  const wIdx = currentWordIdx();
  if (wIdx == null) return;
  const word = state.words[wIdx];
  const idx = word.cells.findIndex(
    c => c.r === state.selected.row && c.c === state.selected.col
  );
  for (let i = idx; i < word.cells.length; i++) {
    const nc = state.cells[`${word.cells[i].r},${word.cells[i].c}`];
    if (!isLocked(nc)) {
      state.selected = { row: word.cells[i].r, col: word.cells[i].c };
      return;
    }
  }
}

function advanceSelection() {
  const wIdx = currentWordIdx();
  if (wIdx == null) return;
  const word = state.words[wIdx];
  const idx = word.cells.findIndex(
    c => c.r === state.selected.row && c.c === state.selected.col
  );
  // Advance to the next editable (non-locked) cell in the word.
  for (let i = idx + 1; i < word.cells.length; i++) {
    const nc = state.cells[`${word.cells[i].r},${word.cells[i].c}`];
    if (!isLocked(nc)) {
      state.selected = { row: word.cells[i].r, col: word.cells[i].c };
      return;
    }
  }
}

function retreatSelection() {
  const wIdx = currentWordIdx();
  if (wIdx == null) return;
  const word = state.words[wIdx];
  const idx = word.cells.findIndex(
    c => c.r === state.selected.row && c.c === state.selected.col
  );
  // Retreat to the nearest previous editable (non-locked) cell.
  for (let i = idx - 1; i >= 0; i--) {
    const prev = word.cells[i];
    const pCell = state.cells[`${prev.r},${prev.c}`];
    if (!isLocked(pCell)) {
      state.selected = { row: prev.r, col: prev.c };
      return;
    }
  }
}

function nextClue(delta) {
  const ordered = [
    ...state.words.filter(w => w.dir === "A").sort((a, b) => a.number - b.number),
    ...state.words.filter(w => w.dir === "D").sort((a, b) => a.number - b.number),
  ];
  const cur = currentWordIdx();
  let idx = 0;
  if (cur != null) {
    const w = state.words[cur];
    idx = ordered.findIndex(x => x === w);
  }
  idx = (idx + delta + ordered.length) % ordered.length;
  const target = ordered[idx];
  selectWord(state.words.indexOf(target));
}

/* ============================================================
   CLUE BAR
   ============================================================ */

function updateClueBar() {
  const wIdx = currentWordIdx();
  if (wIdx == null) {
    clueLabelEl.textContent = "Tap a cell to start";
    clueTextEl.textContent = "每個字都是一位 26 的名字，每道提示是他們的外號。";
    return;
  }
  const w = state.words[wIdx];
  clueLabelEl.textContent = `${w.number} ${w.dir === "A" ? "ACROSS" : "DOWN"}  ·  ${w.word.length} letters`;
  clueTextEl.textContent = w.prompt || "";
}

function refreshUI() {
  updateCellsVisual();
  updateClueBar();
  updateClueListStates();
}

/* ============================================================
   KEYBOARD
   ============================================================ */

function buildKeyboard() {
  const rows = [
    ["Q","W","E","R","T","Y","U","I","O","P"],
    ["A","S","D","F","G","H","J","K","L"],
    ["ENTER","Z","X","C","V","B","N","M","DEL"],
  ];
  keyboardEl.innerHTML = "";
  rows.forEach(row => {
    const rd = document.createElement("div");
    rd.className = "kb-row";
    row.forEach(k => {
      const btn = document.createElement("button");
      btn.className = "key";
      if (k === "DEL") { btn.className += " wide special"; btn.textContent = "⌫"; }
      else if (k === "ENTER") { btn.className += " wide special"; btn.textContent = "↵"; }
      else btn.textContent = k;
      btn.addEventListener("click", () => onKey(k));
      rd.appendChild(btn);
    });
    keyboardEl.appendChild(rd);
  });
}

function onKey(k) {
  if (k === "DEL") deleteLetter();
  else if (k === "ENTER") nextClue(1);
  else typeLetter(k);
}

document.addEventListener("keydown", (e) => {
  if (celebrationEl && !celebrationEl.classList.contains("hidden")) return;
  if (e.key === "Backspace") { e.preventDefault(); deleteLetter(); }
  else if (e.key === "Enter") { e.preventDefault(); nextClue(1); }
  else if (e.key === "ArrowRight" || e.key === "ArrowDown") { nextClue(1); }
  else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { nextClue(-1); }
  else if (/^[a-zA-Z]$/.test(e.key)) { typeLetter(e.key.toUpperCase()); }
});

prevClueBtn.addEventListener("click", () => nextClue(-1));
nextClueBtn.addEventListener("click", () => nextClue(1));

/* ============================================================
   COMPLETION CHECK
   ============================================================ */

function isComplete() {
  for (const k in state.cells) {
    const cell = state.cells[k];
    if (cell.value !== cell.answer) return false;
  }
  return true;
}

function isFullyFilled() {
  for (const k in state.cells) {
    if (!state.cells[k].value) return false;
  }
  return true;
}

function checkCompletion() {
  if (isComplete()) {
    setTimeout(celebrate, 250);
    return;
  }
  if (isFullyFilled()) {
    showToast("Almost! A few letters need another look 💡");
    // Shake wrong cells briefly
    for (const k in state.cells) {
      const cell = state.cells[k];
      if (cell.value !== cell.answer) {
        const el = gridEl.querySelector(`[data-r="${cell.row}"][data-c="${cell.col}"]`);
        if (el) {
          el.classList.add("wrong");
          setTimeout(() => el.classList.remove("wrong"), 400);
        }
      }
    }
  }
}

function showToast(msg, ms = 2200) {
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.add("hidden"), ms);
}

/* ============================================================
   CELEBRATION
   ============================================================ */

function celebrate() {
  buildShareGrid();
  buildShareNames();
  launchConfetti();
  celebrationEl.classList.remove("hidden");
  document.body.classList.add("playing");
}

closeCelebrationBtn.addEventListener("click", () => {
  celebrationEl.classList.add("hidden");
  document.body.classList.remove("playing");
});

document.getElementById("downloadBtn").addEventListener("click", downloadShareCard);
document.getElementById("shareBtn").addEventListener("click", shareCard);

// Clones #shareCard onto <body> (away from the purple overlay ancestor) and
// renders it to a canvas. Both download and share use this.
async function generateShareCanvas() {
  const card = document.getElementById("shareCard");
  const clone = card.cloneNode(true);
  Object.assign(clone.style, {
    position: "fixed",
    left: "-9999px",
    top: "0",
    width: "440px",
    maxWidth: "440px",
    animation: "none",
    transform: "none",
    opacity: "1",
  });
  document.body.appendChild(clone);
  try {
    await document.fonts.ready;
    return await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#FFFDF6",
      logging: false,
      width: 440,
    });
  } finally {
    document.body.removeChild(clone);
  }
}

async function downloadShareCard() {
  const btn = document.getElementById("downloadBtn");
  btn.disabled = true;
  try {
    const canvas = await generateShareCanvas();
    const link = document.createElement("a");
    link.download = "kellogg-farewell-26.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  } finally {
    btn.disabled = false;
  }
}

async function shareCard() {
  const btn = document.getElementById("shareBtn");
  btn.disabled = true;
  try {
    const canvas = await generateShareCanvas();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
    const file = new File([blob], "kellogg-farewell-26.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] });
    } else {
      // Desktop fallback: download the image instead
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "kellogg-farewell-26.png";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      showToast("Sharing not supported here — image saved instead 📥");
    }
  } catch (err) {
    if (err.name !== "AbortError") showToast("Couldn't share — try the Save button instead.");
  } finally {
    btn.disabled = false;
  }
}

/* ---------- Restart flow ---------- */
function restartGame() {
  // Clear every cell value; keep the same layout & clues.
  for (const k in state.cells) state.cells[k].value = "";
  // Put the cursor back at the first word.
  if (state.words.length) selectWord(0);
  refreshUI();
  showToast("Board cleared — have fun! 💜");
}

restartBtn.addEventListener("click", () => {
  restartConfirm.classList.remove("hidden");
});

confirmCancelBtn.addEventListener("click", () => {
  restartConfirm.classList.add("hidden");
});

confirmOkBtn.addEventListener("click", () => {
  restartConfirm.classList.add("hidden");
  // If the celebration is still up, close it too.
  celebrationEl.classList.add("hidden");
  document.body.classList.remove("playing");
  restartGame();
});

// Dismiss the modal by tapping the dim area outside the box.
restartConfirm.addEventListener("click", (e) => {
  if (e.target === restartConfirm) restartConfirm.classList.add("hidden");
});

function buildShareGrid() {
  // Pick cell size based on grid dimensions so it fits
  const maxW = 360;
  const size = Math.max(14, Math.min(26, Math.floor((maxW - 20) / state.cols)));
  document.documentElement.style.setProperty("--share-cell-size", size + "px");

  shareGridEl.innerHTML = "";
  shareGridEl.style.gridTemplateColumns = `repeat(${state.cols}, ${size}px)`;

  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const cell = state.cells[`${r},${c}`];
      const div = document.createElement("div");
      div.className = "share-cell" + (cell ? "" : " empty");
      if (cell) {
        if (cell.number) {
          const n = document.createElement("span");
          n.className = "num";
          n.textContent = cell.number;
          div.appendChild(n);
        }
        const l = document.createElement("span");
        l.textContent = cell.answer;
        div.appendChild(l);
      }
      shareGridEl.appendChild(div);
    }
  }
}

function buildShareNames() {
  const names = state.words.map(w => toTitle(w.name));
  let extra = "";
  if (state.unplaced.length) {
    extra = " + " + state.unplaced.map(p => toTitle(p.name)).join(" · ");
  }
  shareNamesEl.textContent = names.join(" · ") + extra;
}

function toTitle(w) { return w[0] + w.slice(1).toLowerCase(); }

/* ---- Confetti ---- */
// Confetti intentionally uses Math.random (not the seeded layout rng) —
// the celebration can look a little different each time, while the
// crossword layout itself stays fixed.
function launchConfetti() {
  confettiEl.innerHTML = "";
  const colors = ["#4F2582", "#6B3AA0", "#E6B422", "#F2D06B", "#FFFFFF", "#BFA3E6"];
  const N = 70;
  for (let i = 0; i < N; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "%";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    const dur = 2 + Math.random() * 3;
    const delay = Math.random() * 2;
    piece.style.animationDuration = dur + "s";
    piece.style.animationDelay = delay + "s";
    const w = 6 + Math.random() * 8;
    const h = 10 + Math.random() * 8;
    piece.style.width = w + "px";
    piece.style.height = h + "px";
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    confettiEl.appendChild(piece);
  }
}

/* ============================================================
   BOOT
   ============================================================ */

function init() {
  buildState();
  renderGrid();
  renderClueLists();
  buildKeyboard();
  if (state.words.length) selectWord(0);
  refreshUI();

  if (state.unplaced.length) {
    console.warn("Some names could not be placed:", state.unplaced.map(p => p.name));
    showToast(`Heads up: ${state.unplaced.length} name(s) couldn't fit this layout.`, 3500);
  }

  if (DEV_MODE) {
    const skipBtn = document.createElement("button");
    skipBtn.textContent = "⚡ Skip to Solution";
    skipBtn.style.cssText = "display:block;margin:8px auto;padding:6px 16px;background:#c0392b;color:#fff;border:none;border-radius:12px;font-size:12px;cursor:pointer;font-family:inherit;opacity:0.75;";
    skipBtn.addEventListener("click", () => {
      for (const k in state.cells) state.cells[k].value = state.cells[k].answer;
      refreshUI();
      celebrate();
    });
    document.querySelector(".restart-wrap").insertAdjacentElement("afterend", skipBtn);
  }
}

init();
