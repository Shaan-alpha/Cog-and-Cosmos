# Events — Design Spec

**Date:** 2026-06-14
**Status:** Approved (brainstorm) — pending implementation plan
**Feature:** Phase 3 retention — claimable, time-limited "Golden Cog" events that grant a transient global-production buff.

---

## 1. Goal & context

Add light active-play spice: every few minutes a claimable event appears; claiming it grants a short global-production surge. Tightly scoped, **pure-client, runtime-only** — it touches no save data and no `recomputeUpgrades`.

**Reused machinery:**
- Timed buffs that decay each `stepSim` (like `activeEnchants`).
- The wall-clock timer pattern in `stepSim` (`achCheckTimer`, warp recharge).
- Module-level reactive `$state` (like `activeToasts`) — events live here, not in `GameState`.
- Production multiplier applied at the call-site via [`effGlobalMult()`](../../../src/stores/game.svelte.ts) (where the Challenge `prodMult` already folds in).
- The stacking toast bus (`pushToast`) and GameLayout overlay rendering.

---

## 2. Decisions locked in brainstorm

- **Model (Q1): claimable buff.** A "Golden Cog"-style event appears; claiming applies a transient global-production buff; it expires if unclaimed.
- **Cadence (Q2): random interval, no offline.** The next event spawns at a random time within `[MIN_GAP, MAX_GAP]` of active play, sits claimable for `CLAIM_WINDOW` seconds, then expires and the timer resets. Offline neither spawns nor accrues events.
- **Runtime-only (refinement): no save change.** Buffs are ≤60s, so all event state is ephemeral module `$state` — **no `GameState` field, no migration, no save bump.** (Persisting across reload was considered and deferred.)
- All v1 buffs are **global-production** multipliers (mint-effect buffs deferred).

---

## 3. Constants (store)

```
MIN_GAP = 180        // seconds — soonest the next event spawns
MAX_GAP = 420        // seconds — latest
CLAIM_WINDOW = 30    // seconds an unclaimed event stays claimable
```

---

## 4. Event defs (`src/data/events.ts`, data-driven)

```ts
export interface GameEvent {
  id: string
  name: string
  icon: string
  mult: number      // production multiplier while active (e.g. 3 = +200%)
  duration: number  // seconds the buff lasts after claiming
}

export const EVENTS: GameEvent[] = [
  { id: 'golden_cog',  name: 'Golden Cog',  icon: '⚙️', mult: 3,   duration: 30 },
  { id: 'lucky_surge', name: 'Lucky Surge', icon: '🍀', mult: 5,   duration: 15 },
  { id: 'steady_boon', name: 'Steady Boon', icon: '🕯️', mult: 2,   duration: 60 },
  { id: 'overclock',   name: 'Overclock',   icon: '⚡', mult: 3.5, duration: 25 },
]
export const EVENT_BY_ID: Record<string, GameEvent> = Object.fromEntries(EVENTS.map(e => [e.id, e]))
```

---

## 5. Runtime state + logic (`src/stores/game.svelte.ts`)

### Module `$state` (ephemeral)
```ts
type EventBuff = { id: string; mult: number; durationLeft: number }
type PendingEvent = { id: string; timeLeft: number }
let eventBuff = $state<EventBuff | null>(null)
let pendingEvent = $state<PendingEvent | null>(null)
let eventSpawnTimer = randGap()   // seconds to next spawn (randomised)
function randGap() { return MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP) }
```

### `tickEvents(dt)` — called once per `stepSim`
```
1. Decay buff:    if eventBuff → durationLeft -= dt; clear at ≤ 0.
2. If pendingEvent: timeLeft -= dt; on ≤ 0 → expire (clear pending; eventSpawnTimer = randGap()).
   Else:           eventSpawnTimer -= dt; on ≤ 0 → spawn a random EVENT as pendingEvent {timeLeft: CLAIM_WINDOW}.
```
(Reassign the `$state` vars so the UI countdowns update each step. `stepSim` adds one line: `tickEvents(SIM_STEP)`.)

### Apply via `effGlobalMult` (live state only)
```ts
function eventBuffMult(): number { return eventBuff?.mult ?? 1 }
// effGlobalMult(state = gs):
//   …existing folds… .mul(D(state === gs ? eventBuffMult() : 1))
```
Gated on `state === gs` so a loaded/offline `state` (which has no events) is unaffected. No `recomputeUpgrades` — `effGlobalMult` is evaluated each tick/rate call, so the buff applies instantly on claim and lifts on decay.

### Store API
- `claimEvent(): boolean` — if `pendingEvent`, set `eventBuff = { id, mult, durationLeft: def.duration }` (replaces any active buff), clear `pendingEvent`, `eventSpawnTimer = randGap()`, `pushToast('⚡ {name}! +X% production for Ns')`.
- Accessors: `activeEventBuff()` → `eventBuff`; `claimableEvent()` → `pendingEvent`; `eventBuffMult()` (exported for the fold test).
- `tickEvents(dt)` exported (called by `stepSim`, and the test seam) + `__forceSpawnEventForTest(id?)` (sets `pendingEvent` deterministically).

---

## 6. UI (`src/ui/EventBanner.svelte`, rendered in GameLayout — no SPA view)

- **Claimable banner** (when `claimableEvent()`): a prominent strip near the toast container — event icon + name + a **Claim** button + a thin claim-window countdown bar. Tapping Claim → `claimEvent()`.
- **Active-buff pill** (when `activeEventBuff()`): a small masthead pill `⚡ {name} +X% · {remaining}s`.
- The component imports `EVENT_BY_ID` to resolve name/icon/mult from the id. GameLayout renders `<EventBanner />` once (alongside the toast container). **No nav button, no view** — events are transient overlays.

---

## 7. Testing

- `events.test.ts` — defs integrity: unique ids; every `mult > 1`; every `duration > 0`.
- `game.svelte.test.ts` — drive the exported `tickEvents` deterministically (no `Math.random` reliance, via the force-spawn seam):
  - `__forceSpawnEventForTest('golden_cog')` → `claimableEvent()` set.
  - `claimEvent()` → `activeEventBuff()?.id === 'golden_cog'`, `claimableEvent()` null, `eventBuffMult() === 3`.
  - `tickEvents(31)` → buff expired (`activeEventBuff()` null, `eventBuffMult() === 1`).
  - force-spawn then `tickEvents(CLAIM_WINDOW + 1)` (without claiming) → `claimableEvent()` null (expired). (The spawn timer resets to ≥ `MIN_GAP` on expiry, so no immediate respawn within the same call.)
- Acceptance: `npm run check` 0/0 · `npm test` green · `npm run build`. Dev-smoke confirms the live surge (claim → production jumps, then lifts).

---

## 8. Out of scope (deferred)

Seasonal calendar, rare bosses/combat, mini-games, mint-effect buffs, offline/while-away events, persisting the buff across reload, stacking multiple buffs, a dedicated Events SPA view, randomised on-screen click positions.
