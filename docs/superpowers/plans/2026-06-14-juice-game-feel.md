# Juice & Game-Feel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a unified, performance-safe effects layer (floating number pop-ups, milestone/prestige particle bursts, currency counter bumps, subtle screen-shake) on top of the existing SFX, gated by an off/subtle/full preference with first-ever reduced-motion support.

**Architecture:** A pure `systems/juice.ts` gate + a `stores/effects.svelte.ts` transient queue rendered by one `<EffectsLayer>` overlay; a `use:bump` action for local counter pulses; `shake()` wired into the four reset functions. Game logic emits semantic effects; the render layer draws. Nothing runs in the 20 Hz sim loop. Mirrors the existing toast-bus + audio-mute patterns.

**Tech Stack:** Svelte 5 runes, TypeScript (strict), Vitest (the `core` node project + `ui` jsdom project), CSS keyframes + Web Animations API. break_eternity `Decimal` via `systems/Decimal.ts`.

**Spec:** `docs/superpowers/specs/2026-06-14-juice-game-feel-design.md`

---

### Task 1: Juice gate module (`systems/juice.ts`)

The intensity gate, mirroring `systems/audio.ts`’s mute module-flag. Pure, node-safe (no unguarded `window`).

**Files:**
- Create: `src/systems/juice.ts`
- Test: `src/systems/juice.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/systems/juice.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { getJuice, setJuice, cycleJuice, juiceAllows, defaultJuiceLevel } from './juice'

beforeEach(() => setJuice('full'))

describe('juice gate', () => {
  it('get/set round-trips', () => {
    setJuice('subtle')
    expect(getJuice()).toBe('subtle')
  })

  it('cycles off -> subtle -> full -> off', () => {
    setJuice('off')
    expect(cycleJuice()).toBe('subtle')
    expect(cycleJuice()).toBe('full')
    expect(cycleJuice()).toBe('off')
  })

  it('gate matrix by level (no reduced-motion in node)', () => {
    setJuice('off')
    expect(juiceAllows('floater')).toBe(false)
    expect(juiceAllows('burst')).toBe(false)
    expect(juiceAllows('bump')).toBe(false)
    expect(juiceAllows('shake')).toBe(false)

    setJuice('subtle')
    expect(juiceAllows('floater')).toBe(true)
    expect(juiceAllows('burst')).toBe(true)
    expect(juiceAllows('bump')).toBe(true)
    expect(juiceAllows('shake')).toBe(false)   // shake is full-only

    setJuice('full')
    expect(juiceAllows('shake')).toBe(true)
  })

  it('defaultJuiceLevel is full without reduced-motion (node has no matchMedia)', () => {
    expect(defaultJuiceLevel()).toBe('full')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/systems/juice.test.ts`
Expected: FAIL — cannot resolve `./juice`.

- [ ] **Step 3: Write the implementation**

```ts
// src/systems/juice.ts
/**
 * Juice gate — the intensity preference for the render-side effects layer.
 * Mirrors audio.ts: a module-level flag synced from settings (setJuice) so the
 * hot emit sites never touch the store. Pure & node-safe (guards window/matchMedia).
 */
export type JuiceLevel = 'off' | 'subtle' | 'full'
export type JuiceFeature = 'floater' | 'burst' | 'bump' | 'shake'

let level: JuiceLevel = 'full'

export function getJuice(): JuiceLevel { return level }
export function setJuice(l: JuiceLevel): void { level = l }

const ORDER: JuiceLevel[] = ['off', 'subtle', 'full']
export function cycleJuice(): JuiceLevel {
  level = ORDER[(ORDER.indexOf(level) + 1) % ORDER.length]
  return level
}

/** True when the OS asks for reduced motion. Node/SSR-safe (jsdom lacks matchMedia). */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Gate predicate used by every emit site.
 * - off                → nothing
 * - shake              → only at 'full' AND not reduced-motion (it's the most motion-heavy)
 * - bump               → not at 'off', and never under reduced-motion (WAAPI scale = motion the CSS backstop can't neutralise)
 * - floater / burst    → not at 'off'; under reduced-motion the CSS backstop (app.css) renders them instantly instead of moving
 */
export function juiceAllows(feature: JuiceFeature): boolean {
  if (level === 'off') return false
  if (feature === 'shake') return level === 'full' && !prefersReducedMotion()
  if (feature === 'bump') return !prefersReducedMotion()
  return true
}

/** Default for a fresh save: calm-by-default for reduced-motion users. */
export function defaultJuiceLevel(): JuiceLevel {
  return prefersReducedMotion() ? 'subtle' : 'full'
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/systems/juice.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/systems/juice.ts src/systems/juice.test.ts
git commit -m "feat(juice): intensity gate module (off/subtle/full + reduced-motion)"
```

---

### Task 2: Effects bus (`stores/effects.svelte.ts`)

The transient effect queue + `shake()` signal. Reactive `$state` lives here (NOT in `game.svelte.ts`); exported only via accessor functions per the Svelte-5 module-rune rule.

**Files:**
- Create: `src/stores/effects.svelte.ts`
- Test: `src/stores/effects.svelte.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/stores/effects.svelte.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { emitFloater, emitBurst, getEffects, removeEffect, shake, getShakeStamp, MAX_FLOATERS } from './effects.svelte'
import { setJuice } from '../systems/juice'

beforeEach(() => {
  setJuice('full')
  getEffects().slice().forEach(e => removeEffect(e.id))
})

describe('effects bus', () => {
  it('emitFloater queues a floater and returns its id', () => {
    const id = emitFloater({ x: 5, y: 9, text: '+42' })
    const fl = getEffects().filter(e => e.kind === 'floater')
    expect(fl.length).toBe(1)
    expect(fl[0].id).toBe(id)
    expect(fl[0].text).toBe('+42')
  })

  it('caps floaters at MAX_FLOATERS, dropping the oldest', () => {
    for (let i = 0; i < MAX_FLOATERS + 6; i++) emitFloater({ x: 0, y: 0, text: `+${i}` })
    const fl = getEffects().filter(e => e.kind === 'floater')
    expect(fl.length).toBe(MAX_FLOATERS)
    expect(fl[0].text).toBe('+6')          // first 6 dropped
  })

  it('removeEffect drops by id', () => {
    const id = emitBurst({ x: 1, y: 1, count: 4 })
    expect(getEffects().some(e => e.id === id)).toBe(true)
    removeEffect(id)
    expect(getEffects().some(e => e.id === id)).toBe(false)
  })

  it('emits nothing when juice is off', () => {
    setJuice('off')
    emitFloater({ x: 0, y: 0, text: '+1' })
    emitBurst({ x: 0, y: 0, count: 4 })
    expect(getEffects().length).toBe(0)
  })

  it('shake increments the stamp at full, no-ops at subtle/off', () => {
    setJuice('full'); const a = getShakeStamp(); shake(); expect(getShakeStamp()).toBe(a + 1)
    setJuice('subtle'); const b = getShakeStamp(); shake(); expect(getShakeStamp()).toBe(b)
    setJuice('off');    const c = getShakeStamp(); shake(); expect(getShakeStamp()).toBe(c)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/stores/effects.svelte.test.ts`
Expected: FAIL — cannot resolve `./effects.svelte`.

- [ ] **Step 3: Write the implementation**

```ts
// src/stores/effects.svelte.ts
/**
 * Effects bus — the transient, render-only queue for the juice layer.
 * Mirrors the toast bus: reactive $state here, exposed via accessor functions
 * (you cannot export a raw $state from a .svelte.ts module). Every emit no-ops
 * when the juice gate disallows it, so call sites stay dumb. Hard caps keep the
 * DOM bounded; nodes self-remove on animationend via removeEffect().
 */
import { juiceAllows } from '../systems/juice'

export type BurstKind = 'spark' | 'star'
export interface Floater { id: number; kind: 'floater'; x: number; y: number; text: string; color: string }
export interface Burst { id: number; kind: 'burst'; x: number; y: number; particle: BurstKind; count: number }
export type Effect = Floater | Burst

export const MAX_FLOATERS = 24
export const MAX_BURSTS = 8
const MAX_PARTICLES = 24

let effects = $state<Effect[]>([])
let shakeStamp = $state(0)
let nextId = 0

export function getEffects(): Effect[] { return effects }
export function getShakeStamp(): number { return shakeStamp }
export function removeEffect(id: number): void { effects = effects.filter(e => e.id !== id) }

function pushCapped(e: Effect, kind: Effect['kind'], cap: number): number {
  let next = effects
  const sameKind = next.filter(x => x.kind === kind)
  if (sameKind.length >= cap) next = next.filter(x => x.id !== sameKind[0].id)  // drop oldest of kind
  effects = [...next, e]
  return e.id
}

export function emitFloater(opts: { x: number; y: number; text: string; color?: string }): number {
  if (!juiceAllows('floater')) return -1
  return pushCapped(
    { id: nextId++, kind: 'floater', x: opts.x, y: opts.y, text: opts.text, color: opts.color ?? 'var(--brass-bright)' },
    'floater', MAX_FLOATERS,
  )
}

export function emitBurst(opts: { x: number; y: number; count?: number; particle?: BurstKind }): number {
  if (!juiceAllows('burst')) return -1
  const count = Math.max(1, Math.min(opts.count ?? 12, MAX_PARTICLES))
  return pushCapped(
    { id: nextId++, kind: 'burst', x: opts.x, y: opts.y, particle: opts.particle ?? 'spark', count },
    'burst', MAX_BURSTS,
  )
}

/** Bump the shake stamp; the app root watches it and runs a brief WAAPI shake. */
export function shake(): void {
  if (!juiceAllows('shake')) return
  shakeStamp++
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/stores/effects.svelte.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/stores/effects.svelte.ts src/stores/effects.svelte.test.ts
git commit -m "feat(juice): effects bus (floaters/bursts queue + shake signal, capped + gated)"
```

---

### Task 3: CSS keyframes + reduced-motion backstop (`app.css`)

Global styles for the effect nodes. Kept in `app.css` (not the component) so the global reduced-motion `@media` rule reliably matches and Svelte keyframe-scoping never interferes. Only `transform`/`opacity` so everything stays on the compositor.

**Files:**
- Modify: `src/app.css` (append after the existing `@keyframes flash-buy` block / the `.animate-fade` utility, ~line 199)

- [ ] **Step 1: Append the styles**

Add this block right after the `.animate-fade { ... }` line in `src/app.css`:

```css
/* ── Juice / game-feel effects (rendered by ui/EffectsLayer.svelte) ───────── */
.fx-layer { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 60; }

.fx-floater {
  position: absolute;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.95rem;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.65);
  animation: floater-rise 0.9s var(--ease-out) forwards;
  will-change: transform, opacity;
}

.fx-burst { position: absolute; width: 0; height: 0; animation: burst-life 0.7s linear forwards; }
.fx-particle {
  position: absolute; top: 0; left: 0;
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--brass-bright);
  transform-origin: 0 0;
  animation: burst-fly 0.7s var(--ease-out) forwards;
  will-change: transform, opacity;
}
.fx-particle.star { background: var(--brass-bright); box-shadow: 0 0 6px var(--brass-glow); }

@keyframes floater-rise {
  0%   { opacity: 0; transform: translate(-50%, -40%) scale(0.9); }
  20%  { opacity: 1; transform: translate(-50%, -60%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -160%) scale(1); }
}
@keyframes burst-life { 0% { opacity: 1; } 100% { opacity: 1; } }   /* lifetime carrier; fires animationend */
@keyframes burst-fly {
  0%   { opacity: 1; transform: rotate(var(--a)) translateX(0) scale(1); }
  100% { opacity: 0; transform: rotate(var(--a)) translateX(var(--d)) scale(0.3); }
}

/* First reduced-motion support in the app: effects still emit + self-clean, but
   collapse to an instant flash instead of moving. (shake/bump are gated off in juice.ts.) */
@media (prefers-reduced-motion: reduce) {
  .fx-floater, .fx-burst, .fx-particle { animation-duration: 0.01ms !important; }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build succeeds (CSS is valid; no other change yet).

- [ ] **Step 3: Commit**

```bash
git add src/app.css
git commit -m "feat(juice): effect keyframes + first prefers-reduced-motion backstop"
```

---

### Task 4: EffectsLayer overlay + mount in GameLayout

One overlay renders the queue; each node self-removes on `animationend`. Mounted once in `GameLayout`, plus the WAAPI screen-shake driver on the layout root.

**Files:**
- Create: `src/ui/EffectsLayer.svelte`
- Modify: `src/ui/GameLayout.svelte` (imports ~line 13–15; root `<div class="layout">` ~line 47; add `<EffectsLayer />` and the shake `$effect`)
- Test: `src/ui/effectslayer.render.test.ts`

- [ ] **Step 1: Write the failing render test**

```ts
// src/ui/effectslayer.render.test.ts
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import EffectsLayer from './EffectsLayer.svelte'
import { emitFloater, emitBurst, getEffects, removeEffect } from '../stores/effects.svelte'
import { setJuice } from '../systems/juice'

let cleanup: (() => void) | null = null
afterEach(() => {
  cleanup?.(); cleanup = null
  getEffects().slice().forEach(e => removeEffect(e.id))
})

describe('EffectsLayer', () => {
  it('renders queued floaters and burst particles', () => {
    setJuice('full')
    emitFloater({ x: 10, y: 20, text: '+5', color: 'tomato' })
    emitBurst({ x: 30, y: 40, count: 6, particle: 'star' })

    const target = document.createElement('div')
    document.body.appendChild(target)
    const inst = mount(EffectsLayer, { target, props: {} })
    flushSync()
    cleanup = () => { unmount(inst); target.remove() }

    const floater = target.querySelector('.fx-floater') as HTMLElement
    expect(floater).toBeTruthy()
    expect(floater.textContent).toBe('+5')
    expect(target.querySelectorAll('.fx-particle').length).toBe(6)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/ui/effectslayer.render.test.ts`
Expected: FAIL — cannot resolve `./EffectsLayer.svelte`.

- [ ] **Step 3: Create the component**

```svelte
<!-- src/ui/EffectsLayer.svelte -->
<script lang="ts">
  import { getEffects, removeEffect } from '../stores/effects.svelte'
  const effects = $derived(getEffects())
</script>

<div class="fx-layer" aria-hidden="true">
  {#each effects as fx (fx.id)}
    {#if fx.kind === 'floater'}
      <span
        class="fx-floater"
        style="left:{fx.x}px; top:{fx.y}px; color:{fx.color}"
        onanimationend={() => removeEffect(fx.id)}
      >{fx.text}</span>
    {:else}
      <span
        class="fx-burst"
        style="left:{fx.x}px; top:{fx.y}px"
        onanimationend={(e) => { if (e.target === e.currentTarget) removeEffect(fx.id) }}
      >
        {#each Array.from({ length: fx.count }) as _, i}
          <span
            class="fx-particle {fx.particle}"
            style="--a:{Math.round((360 / fx.count) * i)}deg; --d:{18 + (i % 5) * 7}px"
          ></span>
        {/each}
      </span>
    {/if}
  {/each}
</div>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/ui/effectslayer.render.test.ts`
Expected: PASS (1 test). (`animationend` never fires in jsdom, so the nodes persist for assertions — correct.)

- [ ] **Step 5: Mount it + add the shake driver in GameLayout**

In `src/ui/GameLayout.svelte`, extend the store import on line 13 to also import `getShakeStamp`:

```ts
  import { fortune, fmt, isStageUnlocked, transcendCount, transcendPreview, omegaCount, omegaPreview, completedChallenges, activeChallenge, anyStageAscended, collectedRelics, getToasts, removeToast, getShakeStamp } from '../stores/game.svelte'
```

Add two imports just below line 15 (`import { toggleMuted, isMuted } from '../systems/audio'`):

```ts
  import EffectsLayer from './EffectsLayer.svelte'
  import { bump } from './actions/bump'
```

In the `<script>`, after the `const toasts = $derived(getToasts())` line (~line 32), add:

```ts
  // Screen-shake: watch the effects stamp and run a brief WAAPI shake on the root.
  let layoutEl = $state<HTMLElement | null>(null)
  $effect(() => {
    const s = getShakeStamp()
    if (s > 0 && layoutEl) {
      layoutEl.animate(
        [
          { transform: 'translate(0,0)' },
          { transform: 'translate(-3px,2px)' },
          { transform: 'translate(3px,-2px)' },
          { transform: 'translate(-2px,1px)' },
          { transform: 'translate(0,0)' },
        ],
        { duration: 240, easing: 'ease-in-out' },
      )
    }
  })
```

> Note: `getShakeStamp` must be re-exported from the store — see Task 6, Step 3 (it re-exports the effects-bus accessors so the rest of the UI imports from one place). If implementing Task 4 before Task 6, import `getShakeStamp` directly from `'../stores/effects.svelte'` instead, then switch to the store re-export.

Bind the root and mount the layer. Change line 47 from `<div class="layout">` to:

```svelte
<div class="layout" bind:this={layoutEl}>
  <EffectsLayer />
```

(Leave the existing `<div class="toast-container" ...>` and everything else as-is, now nested below `<EffectsLayer />`.)

Make the masthead ★ pulse: change line 94 from
`<span class="fr-val tnum">{fmt(fort)}</span>` to:

```svelte
        <span class="fr-val tnum" use:bump={fort.toNumber()}>{fmt(fort)}</span>
```

- [ ] **Step 6: Verify build + full suite**

Run: `npm run check && npm test && npm run build`
Expected: check 0 errors; all tests pass (incl. the new render test); build succeeds.

> If `bump` (Task 5) isn’t created yet, do Task 5 before this step’s `use:bump` edit, or temporarily omit the `use:bump` attribute. Recommended order: implement Task 5 immediately before Step 5 here.

- [ ] **Step 7: Commit**

```bash
git add src/ui/EffectsLayer.svelte src/ui/effectslayer.render.test.ts src/ui/GameLayout.svelte
git commit -m "feat(juice): EffectsLayer overlay + screen-shake driver + masthead star bump"
```

---

### Task 5: `use:bump` action (counter pulse)

A Svelte action that replays a scale pulse via the Web Animations API when the bound number increases. WAAPI is guarded (`node.animate?.(...)`) so it’s safe where jsdom lacks it.

**Files:**
- Create: `src/ui/actions/bump.ts`
- Test: `src/ui/bump.action.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/ui/bump.action.test.ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { bump } from './actions/bump'
import { setJuice } from '../systems/juice'

beforeEach(() => setJuice('full'))

describe('use:bump', () => {
  it('animates on increase only (not equal or decrease)', () => {
    const node = document.createElement('span')
    const calls: unknown[][] = []
    ;(node as unknown as { animate: (...a: unknown[]) => Animation }).animate =
      (...a: unknown[]) => { calls.push(a); return {} as Animation }

    const handle = bump(node, 0)!
    handle.update!(5)   // increase → animate
    handle.update!(5)   // equal    → no
    handle.update!(2)   // decrease → no
    handle.update!(9)   // increase → animate

    expect(calls.length).toBe(2)
  })

  it('does not animate when juice is off', () => {
    setJuice('off')
    const node = document.createElement('span')
    let n = 0
    ;(node as unknown as { animate: () => Animation }).animate = () => { n++; return {} as Animation }
    const handle = bump(node, 0)!
    handle.update!(100)
    expect(n).toBe(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/ui/bump.action.test.ts`
Expected: FAIL — cannot resolve `./actions/bump`.

- [ ] **Step 3: Write the action**

```ts
// src/ui/actions/bump.ts
import type { Action } from 'svelte/action'
import { juiceAllows } from '../../systems/juice'

const FRAMES: Keyframe[] = [
  { transform: 'scale(1)' },
  { transform: 'scale(1.28)', offset: 0.35 },
  { transform: 'scale(1)' },
]
const OPTS: KeyframeAnimationOptions = { duration: 320, easing: 'ease-out' }

/**
 * use:bump={value} — replays a brief scale pulse whenever `value` increases.
 * Render-only feedback; gated by juiceAllows('bump'). WAAPI is optional-chained
 * so it no-ops where unavailable (e.g. jsdom without a stub).
 */
export const bump: Action<HTMLElement, number> = (node, value) => {
  let prev = value ?? 0
  return {
    update(next: number) {
      const n = next ?? 0
      if (n > prev && juiceAllows('bump')) node.animate?.(FRAMES, OPTS)
      prev = n
    },
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/ui/bump.action.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: (Optional, spec coverage) apply to the stage primary total**

In `src/ui/StagePanel.svelte`, add to the existing effects/action imports (added in Task 6) `import { bump } from './actions/bump'`, then in the “Currency ledger” section (~line 209+) add `use:bump={stageState.primaryAmount.toNumber()}` to the element that displays the primary currency amount. This is a nice-to-have; the masthead ★ (Task 4) is the required bump.

- [ ] **Step 6: Commit**

```bash
git add src/ui/actions/bump.ts src/ui/bump.action.test.ts
git commit -m "feat(juice): use:bump action for counter pulses"
```

---

### Task 6: Wire floaters + bursts into StagePanel; shake into reset functions

Emit positional effects at the existing audio call sites. `shake()` is wired once into each reset function in the store (no DOM coords needed → DRY), while bursts/floaters are UI-wired where the click rect is available.

**Files:**
- Modify: `src/stores/game.svelte.ts` (re-export the effects accessors; call `shake()` in the four reset functions)
- Modify: `src/ui/StagePanel.svelte` (handlers at lines 53/67/77; buy `onclick` at line 463)

- [ ] **Step 1: Re-export the effects accessors + wire shake in the store**

In `src/stores/game.svelte.ts`, near the top imports, add (only `shake` is used in the store body — the rest reach the UI via the re-export below, so importing them here too would trip `noUnusedLocals`):

```ts
import { shake } from './effects.svelte'
```

Add a re-export so the rest of the UI imports effects helpers from the store (single entry point), placed near `export function getToasts()` (~line 786):

```ts
// Re-export the juice effects bus so UI imports from the store like everything else.
export { emitFloater, emitBurst, shake, getEffects, getShakeStamp, removeEffect } from './effects.svelte'
```

Then add `shake()` immediately after the `grantDrop(...)` call inside each reset function (`grantDrop` is already hooked into all four per CLAUDE.md):
- `prestigeStage` — after `grantDrop('common', RELIC_DROP.common)` (~line 809).
- `ascendStage` — after its `grantDrop('uncommon', ...)`.
- `transcend` — after its `grantDrop('rare', ...)`.
- `realityReset` — after its `grantDrop('legendary', ...)`.

Example (prestigeStage):

```ts
  const gain = economy.prestige(st)
  if (gain > 0) grantDrop('common', RELIC_DROP.common)
  if (gain > 0) shake()
```

(For `ascendStage`/`transcend`/`realityReset`, add `shake()` on the same success path right after their `grantDrop(...)`.)

- [ ] **Step 2: Wire StagePanel handlers**

In `src/ui/StagePanel.svelte`, add to the imports block (after line 30’s store import) the effects helpers — if importing from the store re-export, extend the existing `'../stores/game.svelte'` import to include `emitFloater, emitBurst`. Then replace the three handlers (lines 53–85) with:

```ts
  function handleGather(e?: MouseEvent) {
    const got = manualGather(stageId)
    playBuy()
    const rect = (e?.currentTarget as HTMLElement | undefined)?.getBoundingClientRect()
    if (rect) emitFloater({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      text: `+${fmt(got)}`,
      color: def.color,
    })
  }

  let buyMode = $state<1 | 10 | 100 | -1>(1)
  const prestigeGainPreview = $derived(prestigePreview(stageId))

  // Auto-buyer (unlocks after the stage's first prestige).
  const autoUnlocked = $derived(autoBuyUnlocked(stageId))
  const autoOn = $derived(isAutoBuyOn(stageId))
  function handleToggleAuto() { toggleAutoBuy(stageId) }

  // Milestone tiers are owned centrally by formulas.ts BALANCE — single source of truth.
  function handleBuy(genId: string, e?: MouseEvent) {
    const before = stageState.generators[genId]?.count ?? 0
    const ok = buyGenerator(stageId, genId, buyMode)
    if (!ok) return
    const after = stageState.generators[genId]?.count ?? 0
    const crossedMilestone = BALANCE.milestoneTiers.some(m => before < m && after >= m)
    const rect = (e?.currentTarget as HTMLElement | undefined)?.getBoundingClientRect()
    const cx = rect ? rect.left + rect.width / 2 : 0
    const cy = rect ? rect.top + rect.height / 2 : 0
    if (crossedMilestone) {
      playMilestone()
      if (rect) emitBurst({ x: cx, y: cy, particle: 'star', count: 12 })
    } else {
      playBuy()
      if (rect) emitFloater({ x: cx, y: cy, text: `+${after - before}`, color: def.color })
    }
  }

  function handlePrestige(e?: MouseEvent) {
    const gain = prestigePreview(stageId)
    if (gain === 0) return
    const ok = confirm(
      `Prestige the ${def.name}?\n\nYou will earn +${gain} ${def.prestigeCurrency.name} ` +
      `but reset all generators and ${def.primaryCurrency.name} in this stage.`
    )
    if (ok) {
      prestigeStage(stageId)
      playPrestige()
      const rect = (e?.currentTarget as HTMLElement | undefined)?.getBoundingClientRect()
      if (rect) emitBurst({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        particle: 'star',
        count: 20,
      })
    }
  }
```

`manualGather` returns a `Dec` (the amount gathered), so `fmt(got)` is valid (`fmt` accepts `Dec | number` and is already imported).

- [ ] **Step 3: Pass the event to the buy button**

In `src/ui/StagePanel.svelte` line 463, change:

```svelte
              onclick={() => handleBuy(gdef.id)}
```
to:
```svelte
              onclick={(e) => handleBuy(gdef.id, e)}
```

(The gather button at line 330 `onclick={handleGather}` and the prestige button at line 560 `onclick={handlePrestige}` already forward the `MouseEvent` as the first argument in Svelte 5 — no markup change needed there.)

- [ ] **Step 4: Verify build + full suite**

Run: `npm run check && npm test && npm run build`
Expected: check 0 errors (note `_` unused in EffectsLayer each-block is fine); all tests pass — including the existing `stagepanel.reactivity.test.ts` (it sets `setMuted(true)`; effects default to `full` so emits run but jsdom lacks `getBoundingClientRect` sizes → coords default to 0, harmless); build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/stores/game.svelte.ts src/ui/StagePanel.svelte
git commit -m "feat(juice): wire floaters/bursts into StagePanel + shake into resets"
```

---

### Task 7: Persist the preference — save v15

Add `settings.juice`, bump the save version, hydrate the gate on load.

**Files:**
- Modify: `src/data/types.ts` (settings interface, ~line 128)
- Modify: `src/systems/SaveManager.ts` (`CURRENT_VERSION` line 11; `migrate()` add v14→v15 ~line 195)
- Modify: `src/stores/game.svelte.ts` (`freshGameState` settings ~line 99; `initGame` hydrate ~line 1649)
- Modify: `src/systems/SaveManager.test.ts` (`CURRENT_VERSION` const line 10 + a juice assertion)

- [ ] **Step 1: Update the SaveManager migration test (failing first)**

In `src/systems/SaveManager.test.ts`, change line 10 `const CURRENT_VERSION = 14` to `15`, and add to the v5→current test (after the `collectedRelics` assertion, ~line 33):

```ts
    expect(out.settings.juice).toBe('full')
```

Run: `npx vitest run src/systems/SaveManager.test.ts`
Expected: FAIL — `out.version` is 14 (not 15) and `out.settings` is undefined.

- [ ] **Step 2: Add the field to the type**

In `src/data/types.ts`, change the `settings` block (line 128) to include `juice`:

```ts
  settings: {
    numberFormat: 'short' | 'scientific' | 'engineering'
    juice: 'off' | 'subtle' | 'full'
    autoSaveInterval: number  // ms
    offlineProgress: boolean
    seenTutorials?: Record<string, boolean>
  }
```

- [ ] **Step 3: Bump the version + add the migration**

In `src/systems/SaveManager.ts` line 11, change `const CURRENT_VERSION = 14` to `15`.

In `migrate()`, add this step right before the final `raw.version = CURRENT_VERSION` line (~line 196):

```ts
  // v14 → v15: juice/game-feel intensity preference (additive). Defensive: seed a
  // settings object for any settings-less legacy save, then default juice to 'full'.
  if (raw.version < 15) {
    if (!raw.settings) raw.settings = { numberFormat: 'short', juice: 'full', autoSaveInterval: 30_000, offlineProgress: true } as GameState['settings']
    if ((raw.settings as { juice?: string }).juice === undefined) raw.settings.juice = 'full'
    raw.version = 15
  }
```

- [ ] **Step 4: Run the SaveManager test to verify it passes**

Run: `npx vitest run src/systems/SaveManager.test.ts`
Expected: PASS.

- [ ] **Step 5: Seed the fresh-game default + hydrate the gate on load**

In `src/stores/game.svelte.ts`:

Add to the imports near the top: `import { defaultJuiceLevel, setJuice } from '../systems/juice'`.

In `freshGameState()` settings (line 99), add the `juice` field:

```ts
    settings: {
      numberFormat: 'short',
      juice: defaultJuiceLevel(),
      autoSaveInterval: 30_000,
      offlineProgress: true,
      seenTutorials: {},
    },
```

In `initGame()`, just before `initialized = true` (line 1649), sync the gate to the (possibly migrated/fresh) saved value:

```ts
  setJuice(gs.settings?.juice ?? 'full')
  initialized = true
```

- [ ] **Step 6: Verify build + full suite**

Run: `npm run check && npm test && npm run build`
Expected: check 0 errors; all tests pass; build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/data/types.ts src/systems/SaveManager.ts src/systems/SaveManager.test.ts src/stores/game.svelte.ts
git commit -m "feat(juice): persist Effects preference as settings.juice (save v14 -> v15)"
```

---

### Task 8: Settings — Effects selector

A 3-button group mirroring the existing Number-Notation toggles, wired to `settings.juice` + `setJuice`.

**Files:**
- Modify: `src/ui/SettingsPanel.svelte` (imports ~line 11; `selectFormat` ~line 90; the format-toggles markup ~line 121–143)

- [ ] **Step 1: Add the handler + derived value**

In `src/ui/SettingsPanel.svelte`:

Extend the audio import (line 11) and add the juice import below it:

```ts
  import { playBuy, playMilestone } from '../systems/audio'
  import { setJuice, type JuiceLevel } from '../systems/juice'
```

Add a derived for the active value, next to `numberFormat` (~line 18):

```ts
  const juice = $derived(settings?.juice ?? 'full')
```

Add a handler next to `selectFormat` (~line 96):

```ts
  function selectJuice(level: JuiceLevel) {
    if (settings && gameState) {
      settings.juice = level
      setJuice(level)
      saveGame(gameState).catch(console.error)
      playBuy()
    }
  }
```

- [ ] **Step 2: Add the markup**

In the “Performance & Display” card, immediately after the Number-Notation `setting-row` (closes ~line 143), add:

```svelte
        <div class="setting-row">
          <span class="setting-label">Effects (Juice)</span>
          <div class="format-toggles">
            <button class="format-btn {juice === 'off' ? 'active' : ''}" onclick={() => selectJuice('off')}>Off</button>
            <button class="format-btn {juice === 'subtle' ? 'active' : ''}" onclick={() => selectJuice('subtle')}>Subtle</button>
            <button class="format-btn {juice === 'full' ? 'active' : ''}" onclick={() => selectJuice('full')}>Full</button>
          </div>
        </div>
```

- [ ] **Step 3: Verify build + full suite**

Run: `npm run check && npm test && npm run build`
Expected: check 0 errors; all tests pass; build succeeds.

- [ ] **Step 4: Manual smoke (dev server)**

Run: `npm run dev`, open the app. Buy a generator (floater), buy through a milestone (burst), prestige a stage (burst + brief shake), watch the masthead ★ pulse as Fortune ticks. In Settings, switch Effects → Off (everything stops) → Subtle (no shake) → Full. Verify the choice survives a page reload.

- [ ] **Step 5: Commit**

```bash
git add src/ui/SettingsPanel.svelte
git commit -m "feat(juice): Effects (Off/Subtle/Full) selector in Settings"
```

---

### Task 9: Docs + final verification

**Files:**
- Modify: `CHANGELOG.md` (under `[Unreleased]`)
- Modify: `ROADMAP.md` (Phase 4 — mark the Juice item in progress/done)

- [ ] **Step 1: CHANGELOG entry**

Add under `## [Unreleased]` (above the test-fix entry):

```markdown
### Added — Phase 4: Juice & game-feel · Save v15
- **Effects layer.** Floating number pop-ups on gather/buy, brass-spark/star **particle bursts** on
  milestone crossings + prestige, **counter bumps** on the masthead ★ (and stage totals), and a brief
  **screen-shake** on the four reset events. Rendered by a single `EffectsLayer` overlay fed by a
  capped, render-only effects bus (`stores/effects.svelte.ts`) — zero sim-loop involvement,
  GPU-composited transforms only, nodes self-clean on `animationend`.
- **Effects: Off / Subtle / Full** in Settings (`subtle` = no shake), persisted as `settings.juice`
  (**save v14 → v15**, additive). Defaults to `full`, or `subtle` for new players whose OS requests
  reduced motion.
- **First `prefers-reduced-motion` support** — shake/bump gate off and floaters/bursts collapse to an
  instant flash under reduced motion.
```

- [ ] **Step 2: ROADMAP update**

In `ROADMAP.md`, under `## Phase 4 — Polish & Launch`, change the `📦 Juice` line to:

```markdown
- ✅ Juice: screen-shake, particle bursts, floating number pop-ups, counter bumps, milestone fanfare (+ reduced-motion support)
```

- [ ] **Step 3: Final full verification**

Run: `npm run check && npm test && npm run build`
Expected: check 0 errors; **all tests pass (count grew by the new juice/effects/bump/render tests)**; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add CHANGELOG.md ROADMAP.md
git commit -m "docs(juice): changelog + roadmap for the Phase 4 game-feel layer"
```

---

## Build order summary

1. `systems/juice.ts` (gate) → 2. `stores/effects.svelte.ts` (queue) → 3. `app.css` (keyframes + reduced-motion) → **5. `ui/actions/bump.ts`** → 4. `EffectsLayer` + GameLayout mount/shake/★-bump → 6. wire StagePanel + store shake → 7. save v15 persistence → 8. Settings selector → 9. docs + verify.

(Do Task 5 before Task 4’s `use:bump` edit — noted inline.)

## Notes for the executor

- **Decimal:** import only from `systems/Decimal.ts`. `manualGather`/`gatherPreview` return `Dec`; `fmt` accepts `Dec | number`.
- **Svelte-5 module rune:** never export a raw `$state` — `effects.svelte.ts` exports accessor functions only. `{@const}` must be an immediate child of a block.
- **Perf rule #4:** nothing here may run in `stepSim`/the 20 Hz loop. All emits are UI-event-driven; caps are hard; only `transform`/`opacity` animate.
- **No AI co-authorship** in commits (CLAUDE.md rule #1).
- Work continues on the existing `feat/juice-game-feel` branch.
```
