# Juice & Game-Feel — Design Spec

**Date:** 2026-06-14
**Status:** Approved (brainstorm) — pending implementation plan
**Feature:** Phase 4 polish — a unified, performance-safe effects layer that adds felt feedback (floating number pop-ups, milestone/prestige particle bursts, currency counter bumps, subtle screen-shake) on top of the existing synthesized SFX.

---

## 1. Goal & context

Make every meaningful action *feel* good without touching game balance or the simulation. The economy, SFX, and event hook points already exist — this layer is **purely render-side and event-driven**, firing at the same call sites that already trigger audio (`playBuy` / `playMilestone` / `playPrestige`).

**Reused machinery / patterns:**
- The **toast bus** (`activeToasts` `$state` + `getToasts`/`pushToast`/`removeToast` accessors) is the model for a transient effect queue.
- The **`audio.ts` mute module-flag** (`setMuted`/`isMuted`/`toggleMuted`) is the model for the juice gate.
- Existing `app.css` keyframes (`count-bump`, `flash-buy`, `brass-pulse`, `star-twinkle`, `rise-in`) — reuse `count-bump`; add `floater-rise`, `burst-fly`, `screen-shake`.
- Audio call sites already mark every juice moment: `StagePanel` buy (`:55`), milestone (`:73`), prestige (`:84`); `AscensionPanel`/`TranscendencePanel`/`OmegaPanel` resets; relic drops via `grantDrop` (`pushToast` at `game.svelte.ts:159`).
- The `numberFormat` 3-button group in `SettingsPanel` is the model for the Effects selector.

**Non-goals (YAGNI):** no Pixi particles, no per-frame animation driver, no new currency/number-flight-to-counter choreography, no balance changes, no haptics.

---

## 2. Decisions locked in brainstorm

- **Effect set (Q):** all four — floating number pop-ups, milestone & prestige bursts, currency counter bumps, subtle screen-shake.
- **Architecture (approach A):** a dedicated effects bus module + a single `<EffectsLayer>` overlay; a `use:bump` action for local counter pulses; a `shake()` helper for the global root. One settings gate governs all of it. (Approach B per-component-local and approach C Pixi-particles were rejected — see spec history / the brainstorm.)
- **Intensity gate:** `'off' | 'subtle' | 'full'`. `subtle` = pop-ups + bumps + small bursts, **no shake**; `full` = everything; `off` = nothing.
- **Persistence (Q):** **persist as `settings.juice`** — additive save migration **v14 → v15**.
- **Default rule (single source of truth):** A *fresh* save (`freshGameState()`) sets `settings.juice` to `'subtle'` when `prefers-reduced-motion: reduce` matches at creation, else `'full'`. The v14→v15 *migration* (existing saves) seeds `'full'`. Once stored, the value is the user's choice and is never auto-overridden; reduced-motion users can still raise it, and the `@media` CSS backstop (§8) suppresses motion regardless.
- **Performance:** zero sim-loop involvement; GPU-composited `transform`/`opacity` only; hard caps with oldest-dropped; self-cleaning nodes on `animationend`. (Perf rule #4.)

---

## 3. Modules & boundaries

| Unit | Responsibility | Depends on |
|---|---|---|
| `systems/juice.ts` | The intensity gate. `getJuice()/setJuice(level)/cycleJuice()` over `JuiceLevel`; `juiceAllows(feature)` predicate; one-time `prefers-reduced-motion` seed. Mirrors `audio.ts`. | nothing (pure module) |
| `stores/effects.svelte.ts` | The transient effect queue. `$state` array of effects + `emitFloater(opts)`, `emitBurst(opts)`, `getEffects()`, `removeEffect(id)`, `shake(level)`, `getShake()`. All emits no-op when the gate disallows. Enforces caps. | `systems/juice.ts` |
| `ui/EffectsLayer.svelte` | One fixed `pointer-events:none` overlay. Renders queued floaters + bursts as absolutely-positioned CSS-animated nodes; each calls `removeEffect(id)` on `animationend`. Applies the shake class to itself / signals the root. | `stores/effects.svelte.ts` |
| `ui/actions/bump.ts` | `use:bump={value}` Svelte action — replays `count-bump` via the Web Animations API when the numeric value increases (no class-reflow thrash). Gated by `juiceAllows('bump')`. | `systems/juice.ts` |

Game logic (`game.svelte.ts`) stays clean: it emits **semantic** effects (or the UI does, from the click rect) and never imports the DOM. `game.svelte.ts` is **not** grown — the queue lives in its own module.

---

## 4. Types & constants

```ts
// systems/juice.ts
export type JuiceLevel = 'off' | 'subtle' | 'full'

// stores/effects.svelte.ts
export type FloaterKind = 'gain' | 'spend'
export type BurstKind = 'spark' | 'star'
interface Floater { id: number; kind: 'floater'; x: number; y: number; text: string; color: string }
interface Burst   { id: number; kind: 'burst'; x: number; y: number; particle: BurstKind; count: number }

const MAX_FLOATERS = 24    // drop oldest beyond this
const MAX_BURSTS    = 8     // concurrent bursts
const BURST_MILESTONE = 12  // particles
const BURST_PRESTIGE  = 20  // particles (capped by MAX particle budget)
```

The gate predicate:

```ts
// 'shake' only at 'full'; everything else at 'subtle' and 'full'; nothing at 'off'
export function juiceAllows(feature: 'floater' | 'burst' | 'bump' | 'shake'): boolean {
  const lvl = getJuice()
  if (lvl === 'off') return false
  if (feature === 'shake') return lvl === 'full'
  return true
}
```

---

## 5. The four effects — data flow

1. **Floating pop-ups.** At the existing gather/buy sites in `StagePanel`, compute the delta text (`+340`, `+1.2K ★`) and the source element's `getBoundingClientRect()` centre, then `emitFloater({ x, y, text, color: stageAccent, kind })`. Rises ~40px and fades over ~0.9s.
2. **Milestone & prestige bursts.** At `playMilestone`/`playPrestige` sites and the meta-reset/relic sites, `emitBurst({ x, y, particle, count })`. `EffectsLayer` spawns `count` capped particle spans radiating outward (randomised angle/distance derived from particle index, **not** `Math.random` in any sim path — render-layer only).
3. **Currency counter bumps.** `use:bump={value}` on the masthead ★ readout and key stage currency totals; pulses on increase only.
4. **Subtle screen-shake.** `shake('full')` on the four big resets (prestige, ascension, transcendence, omega). Brief (~0.25s), low amplitude (≤4px), `animationend`-cleared. Skipped at `subtle`/reduced-motion.

---

## 6. Settings & gate

- `SettingsPanel` gains an **Effects: Off / Subtle / Full** 3-button group mirroring `numberFormat`, wired to `setJuice` + a persisted `settings.juice`.
- On load, `initGame`/store hydration calls `setJuice(gs.settings.juice)` so the module gate reflects the saved value. The stored default follows the single rule in §2 (fresh save: reduced-motion-aware; migrated save: `'full'`).
- A masthead quick-cycle next to mute is **out of scope for v1** (the Settings selector is the control surface); it can be added later without schema change.

---

## 7. Save migration (v14 → v15)

- Add `juice: JuiceLevel` to `GameState.settings` in `types.ts`.
- Bump `CURRENT_VERSION` to `15` in `SaveManager.ts`; add a `migrate()` step seeding `settings.juice = 'full'` when absent (existing-player rule per §2).
- `freshGameState()` sets `settings.juice` to the reduced-motion-aware default (`'subtle'` if `prefers-reduced-motion` matches at creation, else `'full'`).
- Purely additive; no derived-value or `recomputeUpgrades` impact.

---

## 8. CSS (`app.css`)

- Add `@keyframes floater-rise` (translateY up + opacity→0), `@keyframes burst-fly` (translate to a per-particle `--dx/--dy` CSS var + fade/scale), `@keyframes screen-shake`.
- Add a global `@media (prefers-reduced-motion: reduce)` block that neutralises motion-heavy animations as a backstop (independent of the gate). **This is the project's first reduced-motion handling** — a deliberate accessibility addition.
- All effect nodes use `will-change: transform, opacity` sparingly and only `transform`/`opacity` so they stay on the compositor.

---

## 9. Performance guarantees (perf rule #4)

- **Nothing runs in `stepSim`/the 20 Hz loop.** Effects are emitted from UI event handlers only.
- Caps: ≤`MAX_FLOATERS` floaters, ≤`MAX_BURSTS` bursts; oldest dropped on overflow.
- Nodes self-remove on `animationend`; no timers polling, no rAF driver.
- No allocation in any hot loop; the queue mutates only on discrete user/meta events.
- `EffectsLayer` is `pointer-events:none` and never gates input or the sim.

---

## 10. Testing (fits the `core` / `ui` Vitest projects)

- **`stores/effects.svelte.test.ts` (core):** emit caps the queue (oldest dropped), `removeEffect` works, every `emit*`/`shake` no-ops when `getJuice()==='off'`, `shake` no-ops at `'subtle'`.
- **`systems/juice.test.ts` (core):** `cycleJuice` cycles off→subtle→full→off; `juiceAllows` matrix (esp. `shake` only at `full`).
- **`ui/effectslayer.render.test.ts` (ui/jsdom):** mounting `<EffectsLayer>` with a queued floater + burst renders the nodes without throwing (matches `panels.render` smoke style).
- **`ui/bump.action.test.ts` (ui/jsdom):** `use:bump` triggers an animation on value increase, not on decrease/equal.
- **Migration:** extend `SaveManager.test.ts` — a v14 save loads to v15 with `settings.juice === 'full'`.

---

## 11. Build sequence

1. `systems/juice.ts` + `systems/juice.test.ts` (gate, no UI).
2. `stores/effects.svelte.ts` + `effects.svelte.test.ts` (queue + caps + gate).
3. `app.css` keyframes + reduced-motion block.
4. `ui/EffectsLayer.svelte` + render test; mount it in `GameLayout`.
5. `ui/actions/bump.ts` + test; apply to masthead ★ + stage totals.
6. Wire `emitFloater`/`emitBurst`/`shake` into `StagePanel` + meta panels + relic drops.
7. `types.ts` + `SaveManager.ts` v15 migration + test; `SettingsPanel` Effects selector; hydrate via `setJuice`.
8. `npm run check` + `npm test` + `npm run build`; CHANGELOG + ROADMAP (Phase 4 juice item) updated in the same pass.

---

## 12. Risks & mitigations

- **Coordinate sourcing** — floaters need screen coords. Mitigation: read the triggering element's rect in the handler; fall back to the pointer event; if neither, skip the floater (audio still fires).
- **Reduced-motion correctness** — gate + CSS media query are belt-and-suspenders so motion is suppressed even if a future call site forgets the gate.
- **Mobile/compact** — effects are CSS overlays, so they survive the ≤480px Pixi-hidden mode; caps keep low-end phones cool.
