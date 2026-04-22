# Kellogg Class of 2026 · Farewell Crossword

A mobile-first crossword game to send off our amazing Kellogg MBA 26's. Each
word is a 26's first name; each clue is their fun fact. Solve the whole thing,
get a confetti celebration, and screenshot the branded card to post on
Instagram.

## Files

```
index.html   – Page structure
style.css    – All styling (Kellogg purple #4F2582, graduation touches)
script.js    – Data + crossword generator + game logic + celebration
```

Flat structure, no build step, no dependencies. Just static files.

## Customize the names & clues

Open `script.js` and edit the `PEOPLE` array near the top:

```js
const PEOPLE = [
  { name: "HUMPHREY", prompt: "洋派兵馬俑" },
  { name: "JESSICA",  prompt: "清華女神" },
  // ... up to ~15 names
];
```

Rules:
- `name` should be **letters only** (A–Z). If your classmate goes by a
  nickname with spaces or punctuation, pick the cleanest single-word form.
- `prompt` is shown as the clue — keep it short (a few characters to a
  short phrase works best on mobile). Chinese, English, or a mix are all fine.
- The layout is **deterministic** — everyone on every device sees the
  exact same grid, and Play Again keeps the same puzzle. This is driven
  by `LAYOUT_SEED` in `script.js`.
- If a name can't be placed in the grid (no letter intersections work),
  it will appear under the "+ bonus names" line on the share card and
  a toast will tell you. If that happens: try a different `LAYOUT_SEED`
  value (see below), or swap one letter-sparse name for a longer one.

### Choosing a layout seed

After swapping in real names, you may want to sweep a few seed values
to find a compact grid. Open `script.js` and change `LAYOUT_SEED` to a
different integer (try 1, 42, 90, 100, 2026, etc.) and refresh. Pick
the one that looks best on your phone — smaller `rows × cols` is better
for small screens. Once you're happy, commit that value and everyone
will see the same layout.

## Deploy to GitHub Pages

1. Create a new public repo on GitHub.
2. Upload `index.html`, `style.css`, `script.js` (and this README) to the
   repo root.
3. Go to **Settings → Pages**. Source: `Deploy from a branch`. Branch:
   `main` (or `master`) · Folder: `/ (root)`. Save.
4. Wait ~1 minute, then visit `https://<your-username>.github.io/<repo-name>/`.

Share that link with classmates — it works on any phone browser, no
install needed.

## Tips for the big day

- Test on your phone first — the initial layout is random, so what you
  see on desktop may differ from what friends see.
- If you want a **fixed** layout for everyone, let me know and I'll
  freeze one (so no one gets an "unplaceable" name).
- The celebration screen is designed to look clean on a screenshot.
  Remind folks to screenshot *before* tapping "Keep celebrating".
