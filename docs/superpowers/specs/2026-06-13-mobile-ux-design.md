# Mobile / Touch UX Pass — Design Spec

**Date:** 2026-06-13
**Status:** Approved (brainstorm) — pending implementation plan
**Feature:** Phase 3 polish — make the installable PWA genuinely playable on a phone.

---

## 1. Goal & context

Cog & Cosmos is an installable, offline PWA whose stated core goal (CLAUDE.md rule #4) is **"silky on a low-end laptop and a mid-range phone."** But the UI is a desktop-style dense layout with **essentially no responsive handling** — the only `@media` queries in the app are two tree-grid collapses at 900px (Æ/Ω panels). On a phone the masthead's 8-item view-nav overflows, the 8-dial stage bar overflows, the 3-column Stages deck (`viewport | StagePanel | engine`) can't fit, and tap targets are mouse-sized.

This is a **CSS/layout/interaction pass** — no save-schema change, no game-logic change, no new runtime state (one tiny guarded `scrollIntoView`). It makes the existing deep game usable on the target device.

### Current shell (`src/ui/GameLayout.svelte`)
- `.layout` — `flex column; height:100%; overflow:hidden`.
- `.masthead` — `flex row`: brand (cog + "COG & COSMOS" + "the fortune engine" subtitle) · `.view-nav` (up to 8 buttons) · ★ Fortune readout + mute.
- `.dial-bar` — 8 stage dials (Stages view only).
- `.content` — the 3-column deck: `.viewport-col` (lazy Pixi) · `.stage-col` (StagePanel) · `.engine-col` (FortuneEnginePanel).
- Other views render a single `.skills-view` / `.settings-view` wrapper around one panel.

### Global (`src/app.css`, `index.html`)
- `* { box-sizing: border-box }`; `html, body { height:100%; overflow:hidden }`; `#app { width:100%; height:100% }`.
- `:root` design tokens at the top of app.css.
- `<meta viewport>` = `width=device-width, initial-scale=1.0, maximum-scale=1.0` (no `viewport-fit`).

> **Scroll architecture consequence:** because `html, body { overflow:hidden }`, mobile vertical scrolling must live in an **inner** container, not the body. The masthead + nav stay pinned; the content region below them becomes the scroll container (`overflow-y:auto`). This is desirable — sticky masthead/nav, scrollable content.

---

## 2. Decisions locked in brainstorm

- **Scope:** full responsive pass (not minimal triage). (Q1)
- **View-nav:** a **horizontally-scrollable strip** on mobile — every view one tap away, active button auto-scrolls into view. Not a bottom tab-bar or drawer. (Q2)
- **Stages deck:** **single scrollable column** — order **StagePanel → Fortune Engine → slim Pixi banner**, with Pixi hidden on the smallest screens. Not swipe-panes. (Q3)

---

## 3. Breakpoints

| Token | Width | What changes |
|---|---|---|
| **mobile** | `≤ 720px` | Deck → single column; view-nav + dial-bar → scroll strips; slim masthead; content region scrolls; tap targets ≥ 44px; 2-col panel grids collapse. |
| **compact** | `≤ 480px` | Hide the Pixi viewport banner entirely (space + perf); tighten paddings/font sizes a notch. |
| (existing) | `≤ 900px` | Æ/Ω tree-grid collapse — keep; add the same to the Challenges altar grid. |

Breakpoint values are written directly in each `@media` (CSS custom properties can't be used in media-query conditions). A short comment block in app.css documents the two canonical widths so they stay consistent.

---

## 4. Changes by file

### `index.html`
- Append `viewport-fit=cover` to the viewport meta (enables `env(safe-area-inset-*)`).

### `src/app.css`
- Add `:root { --tap-min: 44px; }`.
- Add safe-area padding hooks usable by the shell (e.g. a `--safe-top`/`--safe-bottom` via `env(safe-area-inset-*)`, falling back to 0).
- Global `button { touch-action: manipulation; }` (kills the 300 ms tap delay) — scoped so it doesn't fight existing styles.
- A documentation comment recording the 720/480 breakpoints.

### `src/ui/GameLayout.svelte` (the bulk)
Add a mobile `@media (max-width: 720px)` block to its `<style>`:
- **Masthead:** reduce padding; hide `.brand-sub` ("the fortune engine"); compact the ★ readout (`.fr-label` hidden, smaller font). Apply `padding-top: max(8px, var(--safe-top))`.
- **`.view-nav`:** `overflow-x: auto; flex-wrap: nowrap; scrollbar-width: none;` + `::-webkit-scrollbar { display: none }`; each `.view-btn` gets `min-height: var(--tap-min); flex: 0 0 auto; white-space: nowrap`.
- **`.dial-bar`:** same horizontal-scroll treatment; `.dial` sized for touch (min-height ≥ 44px).
- **`.content`:** `grid-template-columns: 1fr` (single column); reorder children with `order:` so the buy controls are immediately visible without scrolling past decoration — `.stage-col {order:0}` (top), `.engine-col {order:1}`, `.viewport-col {order:2}` as a slim decorative strip at the bottom (`height: ~120px`); set the content region `overflow-y: auto; -webkit-overflow-scrolling: touch; padding-bottom: max(0px, var(--safe-bottom))`.
- **`@media (max-width: 480px)`:** `.viewport-col { display: none }`.
- **JS:** after `view` changes, scroll the active `.view-btn` into view: a `$effect` (guarded with `?.scrollIntoView({ inline: 'center', block: 'nearest' })`) keyed on `view`. Tiny, render-only, no sim impact.

### Per-panel `@media (max-width: 720px)` (co-located, scoped)
- **StagePanel.svelte:** generator rows / rate readouts stack; buy buttons (×1/×10/×100/Max) wrap and each gets `min-height: var(--tap-min)`; stage-twist tab strip scrolls/wraps.
- **AscensionPanel / TranscendencePanel / OmegaPanel / ChallengesPanel:** collapse the altar/2-col grids to 1 column (extend the existing 900px rule to the Challenges altar; verify the others already collapse via their 900px rule and tighten if needed); skill-tree nodes go full-width.
- **SkillTree.svelte:** node grid → 1–2 columns; nodes meet tap target.
- **StatsPanel.svelte:** wrap the per-stage table in `overflow-x: auto` so it scrolls rather than breaking; sub-tab buttons meet tap target.
- **FortuneEnginePanel.svelte:** slot board wraps to fewer columns.
- **SettingsPanel.svelte:** controls stack; buttons meet tap target.

> Exact per-panel selectors are determined during implementation by reading each component's existing `<style>`; the pattern is uniform (add a `@media (max-width: 720px)` block adjusting grid/flex + tap sizing).

---

## 5. Non-goals (deferred)

Swipe/gesture navigation, landscape-specific layouts, a hamburger drawer, haptics, custom install-prompt UX, orientation lock, reworking the Pixi scenes for mobile, and bottom-tab-bar navigation.

---

## 6. Testing & verification

- `npm run check` (svelte-check) + `npm run build` cover compile + CSS validity.
- Existing render-smokes (`tabs.render.test.ts`, `panels.render.test.ts`) still guard that panels mount.
- Responsive CSS is **not unit-testable** and a true phone render can't be produced in this environment, so visual verification is **manual / the user's**: DevTools responsive mode (or a real phone) at **360×640** (small phone), **414×896** (large phone), and **768px** (tablet/breakpoint edge). I will boot the dev server and confirm it serves; the user confirms the reflow looks right.
- Acceptance signals: no horizontal page overflow at ≤ 720px; nav + dial bar scroll horizontally; Stages deck is a single vertical scroll (StagePanel → Engine, Pixi banner hidden ≤ 480px); all primary buttons ≥ 44px; content clears the notch/home-bar on a notched device.

---

## 7. Risks / notes

- **`maximum-scale=1.0`** in the viewport meta disables pinch-zoom (kept — deliberate for a fullscreen game; not changed here).
- Relaxing the desktop `overflow:hidden` to an inner scroll container must not regress the desktop fixed-viewport layout — the scroll/`order` rules live **only** inside the `≤ 720px` media block, so desktop is untouched.
- Hiding Pixi at ≤ 480px is safe: it's lazy-loaded + decorative; the sim and store never depend on it.
