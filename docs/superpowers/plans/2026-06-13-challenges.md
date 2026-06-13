# Challenges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Challenges system — optional restricted runs (snapshot-and-restore) that grant **Medals**, spent on a 4-node Challenge tree that folds into the existing multiplier pipeline.

**Architecture:** Entering a challenge stashes the real save via `SaveManager.exportSave` and swaps `gs` to a fresh restricted run; the win-check restores it via `importSave` and credits Medals. Restrictions are plain data read via one `activeChallengeRestriction()` helper at 4 hook points. The Medal tree reuses the `SkillNode` + `recomputeUpgrades()` pattern (like the Omega tree). Save **v12 → v13**, additive.

**Tech Stack:** Svelte 5 (runes), TypeScript (strict), break_eternity.js (`Decimal`), Vitest, Vite/PWA.

**Spec:** [docs/superpowers/specs/2026-06-13-challenges-design.md](../specs/2026-06-13-challenges-design.md)

**Conventions:** currencies are `Decimal` (import from `systems/Decimal`); balance math in `formulas.ts`; components render-only; **no AI co-author trailer** on commits; docs updated same pass. Verify with `npm run check`, `npm test`, `npm run build`.

> **Note:** `medals`/`completedChallenges`/`activeChallenge` are plain fields (no Decimal). The store layer (`gs =` reassignment via `importSave`, like `importActiveSave`/`initGame`) isn't unit-testable in vitest → covered by a dev-server smoke test (Task 8). Pure tests cover challenge `check` predicates, the v13 migration, and the `ch:*` recompute fold.

---

## File Structure

**Create:**
- `src/data/challenges.ts` — `ChallengeRestriction` + `Challenge` types, the `CHALLENGES` roster (4), `CHALLENGE_BY_ID`.
- `src/data/skills/challenge.ts` — the 4-node Medal tree (`CHALLENGE_SKILLS`).
- `src/ui/ChallengesPanel.svelte` — the Challenges view (roster + Medal tree + active-run banner).
- `src/data/challenges.test.ts` — challenge `check` predicate tests.

**Modify:**
- `src/data/types.ts` — `medals?`, `completedChallenges?`, `activeChallenge?`, `challengeSnapshot?` on `GameState`.
- `src/systems/skills.ts` — register `CHALLENGE_SKILL_BY_ID`, fold `CHALLENGE_SKILLS` into `recomputeUpgrades`.
- `src/systems/SaveManager.ts` — `CURRENT_VERSION` 12→13 + v12→v13 migration.
- `src/stores/game.svelte.ts` — imports/re-export, `freshGameState` fields, restriction helper + 4 hooks, `enterChallenge`/`abandonChallenge`/`maybeCompleteChallenge`, the win-check call in `checkUnlocks`, challenge-tree skill fns, accessors, `ch:*` in the transcend/realityReset keep-lists.
- `src/ui/GameLayout.svelte` — `'challenges'` view + gated nav button + render branch.
- `src/systems/SaveManager.test.ts`, `src/systems/skills.test.ts` — v13 + `ch:*` fold.
- Docs: `CHANGELOG.md`, `ROADMAP.md`, `README.md`, `CLAUDE.md`, `AGENTS.md`.

---

## Task 1: Challenge defs + roster (`data/challenges.ts`)

**Files:**
- Create: `src/data/challenges.ts`
- Test: `src/data/challenges.test.ts`

- [ ] **Step 1: Write the failing test**

`src/data/challenges.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { D } from '../systems/Decimal'
import { CHALLENGE_BY_ID } from './challenges'
import type { GameState } from './types'

function gsWith(over: Record<string, unknown>): GameState {
  return { stages: {}, engine: {}, ...over } as unknown as GameState
}

describe('challenge check predicates', () => {
  it('spartan_cogs — 1e9 lifetime Coins', () => {
    const c = CHALLENGE_BY_ID['spartan_cogs']
    expect(c.check(gsWith({ stages: { village: { primaryLifetime: D(1e8) } } }))).toBe(false)
    expect(c.check(gsWith({ stages: { village: { primaryLifetime: D(1e9) } } }))).toBe(true)
  })
  it('broken_chain — Mine unlocked', () => {
    const c = CHALLENGE_BY_ID['broken_chain']
    expect(c.check(gsWith({ stages: { mine: { unlocked: false } } }))).toBe(false)
    expect(c.check(gsWith({ stages: { mine: { unlocked: true } } }))).toBe(true)
  })
  it('half_measures — 100 lifetime Fortune', () => {
    const c = CHALLENGE_BY_ID['half_measures']
    expect(c.check(gsWith({ engine: { fortuneLifetime: D(99) } }))).toBe(false)
    expect(c.check(gsWith({ engine: { fortuneLifetime: D(100) } }))).toBe(true)
  })
  it('purist — 1e12 lifetime Coins, requires spartan_cogs', () => {
    const c = CHALLENGE_BY_ID['purist']
    expect(c.requires).toContain('spartan_cogs')
    expect(c.check(gsWith({ stages: { village: { primaryLifetime: D(1e11) } } }))).toBe(false)
    expect(c.check(gsWith({ stages: { village: { primaryLifetime: D(1e12) } } }))).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/challenges.test.ts`
Expected: FAIL — cannot resolve `./challenges`.

- [ ] **Step 3: Create the defs**

`src/data/challenges.ts`:

```ts
import { D } from '../systems/Decimal'
import type { GameState } from './types'

export interface ChallengeRestriction {
  noAutoBuy?: boolean   // auto-buyers disabled during the run
  noBindings?: boolean  // cross-stage binding multipliers forced to 1
  prodMult?: number     // flat global production multiplier (e.g. 0.5)
  noPrestige?: boolean  // stage prestige disabled
}

export interface Challenge {
  id: string
  name: string
  icon: string
  description: string
  restriction: ChallengeRestriction
  goalLabel: string
  check: (gs: GameState) => boolean
  medalReward: number
  requires?: string[]
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'spartan_cogs', name: 'Spartan Cogs', icon: '🔧',
    description: 'Climb with no auto-buyers — every cog placed by hand.',
    restriction: { noAutoBuy: true },
    goalLabel: 'Reach 1e9 lifetime Coins',
    check: (gs) => (gs.stages.village?.primaryLifetime ?? D(0)).gte(D(1e9)),
    medalReward: 1,
  },
  {
    id: 'broken_chain', name: 'Broken Chain', icon: '⛓️',
    description: 'Cross-stage bindings are severed — no stage feeds another.',
    restriction: { noBindings: true },
    goalLabel: 'Unlock the Mine',
    check: (gs) => gs.stages.mine?.unlocked === true,
    medalReward: 2,
  },
  {
    id: 'half_measures', name: 'Half Measures', icon: '🌗',
    description: 'All production is halved.',
    restriction: { prodMult: 0.5 },
    goalLabel: 'Mint 100 ★ Fortune',
    check: (gs) => (gs.engine?.fortuneLifetime ?? D(0)).gte(D(100)),
    medalReward: 3,
  },
  {
    id: 'purist', name: 'Purist', icon: '🧘',
    description: 'No prestige, no auto-buyers — a pure manual climb.',
    restriction: { noPrestige: true, noAutoBuy: true },
    goalLabel: 'Reach 1e12 lifetime Coins',
    check: (gs) => (gs.stages.village?.primaryLifetime ?? D(0)).gte(D(1e12)),
    medalReward: 3,
    requires: ['spartan_cogs'],
  },
]

export const CHALLENGE_BY_ID: Record<string, Challenge> =
  Object.fromEntries(CHALLENGES.map(c => [c.id, c]))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/challenges.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/challenges.ts src/data/challenges.test.ts
git commit -m "feat(challenges): add challenge defs + roster + check tests"
```

---

## Task 2: GameState fields + save v12 → v13 migration

**Files:**
- Modify: `src/data/types.ts` (after `omegaCount?: number`)
- Modify: `src/systems/SaveManager.ts` (`CURRENT_VERSION` line 11; new step before `raw.version = CURRENT_VERSION`)
- Test: `src/systems/SaveManager.test.ts`

- [ ] **Step 1: Write the failing test**

In `src/systems/SaveManager.test.ts`: change `const CURRENT_VERSION = 12` to `= 13`; add to the v5-ladder test (after the `out.omegaCount` assert):

```ts
    expect(out.medals).toBe(0)
    expect(out.completedChallenges).toEqual([])
    expect(out.activeChallenge).toBe(null)
```

And append a new test in the `describe('migrate: version ladder', …)` block:

```ts
  it('v12 → v13 seeds Challenge fields and preserves existing ones', () => {
    const raw = {
      version: 12,
      medals: 4, completedChallenges: ['spartan_cogs'], activeChallenge: null,
      stages: {},
    } as unknown as GameState
    const out = migrate(raw)
    expect(out.version).toBe(CURRENT_VERSION)
    expect(out.medals).toBe(4)
    expect(out.completedChallenges).toEqual(['spartan_cogs'])
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/systems/SaveManager.test.ts`
Expected: FAIL — `out.version` 12 ≠ 13, `out.medals` undefined.

- [ ] **Step 3a: Add the GameState fields**

In `src/data/types.ts`, after `omegaCount?: number       // number of Reality Resets performed`:

```ts
  medals?: number               // Challenge currency — spent on the Challenge (ch:*) tree
  completedChallenges?: string[] // ids cleared (permanent; gates roster, prevents double reward)
  activeChallenge?: string | null // id of the in-progress restricted run, else null
  challengeSnapshot?: string     // compressed real-save blob, present ONLY during a challenge run
```

- [ ] **Step 3b: Bump version + migration step**

`src/systems/SaveManager.ts` line 11:

```ts
const CURRENT_VERSION = 13
```

Before `raw.version = CURRENT_VERSION` (after the v11→v12 block):

```ts
  // v12 → v13: Challenges system (Medals, completed set, active-run marker) — additive.
  if (raw.version < 13) {
    if (raw.medals === undefined) raw.medals = 0
    if (raw.completedChallenges === undefined) raw.completedChallenges = []
    if (raw.activeChallenge === undefined) raw.activeChallenge = null
    raw.version = 13
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/systems/SaveManager.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/types.ts src/systems/SaveManager.ts src/systems/SaveManager.test.ts
git commit -m "feat(challenges): add Challenge GameState fields + save v13 migration"
```

---

## Task 3: Challenge (Medal) tree data (`data/skills/challenge.ts`)

**Files:**
- Create: `src/data/skills/challenge.ts`

- [ ] **Step 1: Create the tree**

`src/data/skills/challenge.ts`:

```ts
/**
 * The Challenge (Medal 🎖️) Tree — spent in Medals, earned by completing Challenges.
 * Reuses the global SkillNode shape and the same recompute path (systems/skills.ts),
 * so it is save-safe and persists through every prestige reset.
 */
import type { SkillNode } from './global'

export const CHALLENGE_SKILLS: SkillNode[] = [
  {
    id: 'ch:proven', name: 'Proven Mettle', icon: '🎖️', tier: 0,
    description: '+25% global production per level.',
    effect: 'global', effectPerLevel: 0.25, maxLevel: 5, baseCost: 2, costGrowth: 1.8, requires: [],
  },
  {
    id: 'ch:tempered', name: 'Tempered Edge', icon: '⚔️', tier: 1,
    description: '+25% Fortune mint per level.',
    effect: 'engine', effectPerLevel: 0.25, maxLevel: 5, baseCost: 3, costGrowth: 1.8, requires: ['ch:proven'],
  },
  {
    id: 'ch:relentless', name: 'Relentless', icon: '🔥', tier: 1,
    description: '+40% global production per level.',
    effect: 'global', effectPerLevel: 0.40, maxLevel: 3, baseCost: 4, costGrowth: 2.0, requires: ['ch:proven'],
  },
  {
    id: 'ch:crucible', name: 'The Crucible', icon: '🏆', tier: 2,
    description: '+100% global production. The trial-forged engine roars.',
    effect: 'global', effectPerLevel: 1.0, maxLevel: 1, baseCost: 8, costGrowth: 1.0, requires: ['ch:relentless'],
  },
]
```

- [ ] **Step 2: Type-check**

Run: `npm run check`
Expected: 0 errors (file compiles, imported nowhere yet).

- [ ] **Step 3: Commit**

```bash
git add src/data/skills/challenge.ts
git commit -m "feat(challenges): add the 4-node Medal (challenge) tree"
```

---

## Task 4: Fold the Medal tree into `recomputeUpgrades`

**Files:**
- Modify: `src/systems/skills.ts`
- Test: `src/systems/skills.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/systems/skills.test.ts` inside the existing `describe('recomputeUpgrades — Omega fold', …)` block (or a new describe):

```ts
  it('folds the Challenge tree (ch:*) into globalMult and engineMult', () => {
    const gs = makeState({ skills: { 'ch:proven': 2, 'ch:tempered': 1 } })
    recomputeUpgrades(gs)
    // ch:proven +0.25*2 = global ×1.5 ; ch:tempered +0.25*1 = engine ×1.25
    expect(gs.globalMult.toNumber()).toBeCloseTo(1.5, 9)
    expect(gs.engine.engineMult.toNumber()).toBeCloseTo(1.25, 9)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/systems/skills.test.ts`
Expected: FAIL — `ch:*` not folded (globalMult/engineMult stay 1).

- [ ] **Step 3: Implement the fold**

In `src/systems/skills.ts`:

(a) After the `OMEGA_SKILLS` import, add:

```ts
import { CHALLENGE_SKILLS } from '../data/skills/challenge'
```

(b) After the `OMEGA_BY_ID` map, add:

```ts
export const CHALLENGE_SKILL_BY_ID: Record<string, SkillNode> = Object.fromEntries(
  CHALLENGE_SKILLS.map(n => [n.id, n]),
)
```

(c) Add `...CHALLENGE_SKILLS` to the tree loop:

```ts
  for (const node of [...GLOBAL_SKILLS, ...ASCENSION_SKILLS, ...TRANSCENDENCE_SKILLS, ...OMEGA_SKILLS, ...CHALLENGE_SKILLS]) {
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/systems/skills.test.ts`
Expected: PASS.

- [ ] **Step 5: Run full suite**

Run: `npm test`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add src/systems/skills.ts src/systems/skills.test.ts
git commit -m "feat(challenges): fold the Medal tree into recomputeUpgrades"
```

---

## Task 5: Store — restriction hooks, enter/abandon/complete, tree fns, accessors

**Files:**
- Modify: `src/stores/game.svelte.ts`

- [ ] **Step 1: Imports + re-export**

(a) Add `CHALLENGE_SKILL_BY_ID` to the skills import (line 9 — the one with `OMEGA_BY_ID`):

```ts
import { recomputeUpgrades, skillCost, prereqsMet, SKILL_BY_ID, ASCENSION_BY_ID, TRANSCEND_BY_ID, OMEGA_BY_ID, CHALLENGE_SKILL_BY_ID } from '../systems/skills'
```

(b) After the `OMEGA_SKILLS` import line, add:

```ts
import { CHALLENGE_SKILLS } from '../data/skills/challenge'
import { CHALLENGES, CHALLENGE_BY_ID, type ChallengeRestriction } from '../data/challenges'
```

(c) Add the data exports to the existing re-export line:

```ts
export { GLOBAL_SKILLS, ASCENSION_SKILLS, TRANSCENDENCE_SKILLS, OMEGA_SKILLS, CHALLENGE_SKILLS, CHALLENGES, CHALLENGE_BY_ID }
```

- [ ] **Step 2: Seed Challenge fields in `freshGameState`**

After `omegaCount: 0,` (the Omega trio added earlier):

```ts
    medals: 0,
    completedChallenges: [],
    activeChallenge: null,
```

- [ ] **Step 3: Restriction helper + accessors**

After the Omega accessors (`omega()/omegaLifetime()/omegaCount()`), add:

```ts
export function medals() { return gs.medals ?? 0 }
export function completedChallenges() { return gs.completedChallenges ?? [] }
export function activeChallenge() { return gs.activeChallenge ?? null }
export function anyStageAscended() { return Object.values(gs.stages).some(s => (s.ascensionCount ?? 0) >= 1) }

/** The restriction of the active challenge for a given state (null when not in a challenge). */
function restrictionFor(state: GameState): ChallengeRestriction | null {
  const id = state.activeChallenge
  return id ? (CHALLENGE_BY_ID[id]?.restriction ?? null) : null
}
export function activeChallengeRestriction(): ChallengeRestriction | null { return restrictionFor(gs) }
```

- [ ] **Step 4: Apply the 4 restriction hooks**

(a) **`effGlobalMult`** — multiply by the active challenge's `prodMult` (reads the passed state, so it applies live + offline):

```ts
function effGlobalMult(state: GameState = gs): Dec {
  return state.globalMult.mul(state.convergenceMult ?? ONE).mul(D(restrictionFor(state)?.prodMult ?? 1))
}
```

(b) **`bindingMultFor`** — at the very top of the function body, before `const rules = …`:

```ts
  if (stages === gs.stages && activeChallengeRestriction()?.noBindings) return ONE
```

(c) **`stepSim`** auto-buyer branch — change the condition:

```ts
    if (st.autoBuy && st.prestigeCount >= 1 && !activeChallengeRestriction()?.noAutoBuy) {
```

(d) **`prestigeStage`** — first line of the function body:

```ts
export function prestigeStage(stageId: string): number {
  if (activeChallengeRestriction()?.noPrestige) return 0
  const economy = STAGE_ECONOMIES[stageId]
```

- [ ] **Step 5: Win-check call in `checkUnlocks`**

Make `checkUnlocks`'s first line:

```ts
function checkUnlocks() {
  if (gs.activeChallenge && maybeCompleteChallenge()) return  // completed + restored this frame
  const startBoostLvl = gs.skills['tr:start_boost'] ?? 0
```

- [ ] **Step 6: enter / abandon / complete**

Add near the Omega block (after `realityReset()` / before `fmt`), the challenge functions:

```ts
// ── Challenges (snapshot-and-restore restricted runs) ────────────────────────
export function enterChallenge(id: string): boolean {
  if (gs.activeChallenge) return false                       // one at a time
  const def = CHALLENGE_BY_ID[id]
  if (!def) return false
  if (def.requires?.some(r => !(gs.completedChallenges ?? []).includes(r))) return false
  const blob = exportSave(gs)                                // stash the real save
  const run = freshGameState()
  run.activeChallenge = id
  run.challengeSnapshot = blob
  gs = run
  recomputeUpgrades(gs)
  saveGame(gs).catch(console.error)
  pushToast(`⚔ Challenge started: ${def.name}`)
  return true
}

/** Called once per frame from checkUnlocks while a challenge is active. Returns true if it completed + restored. */
function maybeCompleteChallenge(): boolean {
  const id = gs.activeChallenge
  if (!id) return false
  const def = CHALLENGE_BY_ID[id]
  if (!def || !def.check(gs)) return false
  const earned = def.medalReward
  const real = gs.challengeSnapshot ? importSave(gs.challengeSnapshot) : null
  if (!real) { gs.activeChallenge = null; return true }       // fail-safe: clear the marker
  if (!real.completedChallenges) real.completedChallenges = []
  if (!real.completedChallenges.includes(id)) {
    real.completedChallenges.push(id)
    real.medals = (real.medals ?? 0) + earned
  }
  real.activeChallenge = null
  real.challengeSnapshot = undefined
  gs = real
  recomputeUpgrades(gs)
  saveGame(gs).catch(console.error)
  pushToast(`🎖️ Challenge complete: ${def.name} (+${earned} Medals)`)
  return true
}

export function abandonChallenge(): boolean {
  if (!gs.activeChallenge) return false
  const real = gs.challengeSnapshot ? importSave(gs.challengeSnapshot) : null
  if (!real) return false
  real.activeChallenge = null
  real.challengeSnapshot = undefined
  gs = real
  recomputeUpgrades(gs)
  saveGame(gs).catch(console.error)
  pushToast('Challenge abandoned — your reality is restored.')
  return true
}
```

- [ ] **Step 7: Challenge-tree skill fns**

Add (mirroring the Omega trio):

```ts
export function challengeSkillCostFor(id: string): number {
  const node = CHALLENGE_SKILL_BY_ID[id]
  if (!node) return 0
  const lvl = gs.skills[id] ?? 0
  return Math.ceil(skillCost(node, lvl).toNumber())
}

export function challengeSkillStatus(id: string): SkillStatus {
  const node = CHALLENGE_SKILL_BY_ID[id]
  const lvl = gs.skills[id] ?? 0
  const maxed = !node || lvl >= node.maxLevel
  const locked = !node || !prereqsMet(node, gs.skills)
  const cost = challengeSkillCostFor(id)
  const affordable = !maxed && (gs.medals ?? 0) >= cost
  return { maxed, locked, affordable, buyable: !maxed && !locked && affordable }
}

export function buyChallengeSkill(id: string): boolean {
  const node = CHALLENGE_SKILL_BY_ID[id]
  if (!node) return false
  const lvl = gs.skills[id] ?? 0
  if (lvl >= node.maxLevel) return false
  if (!prereqsMet(node, gs.skills)) return false
  const cost = challengeSkillCostFor(id)
  if ((gs.medals ?? 0) < cost) return false

  gs.medals = (gs.medals ?? 0) - cost
  gs.skills[id] = lvl + 1
  recomputeUpgrades(gs)
  saveGame(gs).catch(console.error)
  return true
}
```

- [ ] **Step 8: Keep `ch:*` through transcend + realityReset**

In `transcend()`, change the keep-loop:

```ts
  for (const node of TRANSCENDENCE_SKILLS) {
```
to:
```ts
  for (const node of [...TRANSCENDENCE_SKILLS, ...CHALLENGE_SKILLS]) {
```

In `realityReset()`, change:

```ts
  for (const node of [...TRANSCENDENCE_SKILLS, ...OMEGA_SKILLS]) {
```
to:
```ts
  for (const node of [...TRANSCENDENCE_SKILLS, ...OMEGA_SKILLS, ...CHALLENGE_SKILLS]) {
```

> `medals` and `completedChallenges` are top-level fields that neither reset touches, so they persist automatically; only the `ch:*` skill levels need adding to the keep-lists.

- [ ] **Step 9: Type-check**

Run: `npm run check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 10: Commit**

```bash
git add src/stores/game.svelte.ts
git commit -m "feat(challenges): store API - enter/abandon/complete, restriction hooks, Medal tree fns"
```

---

## Task 6: `ChallengesPanel.svelte`

**Files:**
- Create: `src/ui/ChallengesPanel.svelte`

- [ ] **Step 1: Create the panel**

`src/ui/ChallengesPanel.svelte`:

```svelte
<script lang="ts">
  import {
    medals, completedChallenges, activeChallenge,
    CHALLENGES, CHALLENGE_BY_ID,
    enterChallenge, abandonChallenge,
    CHALLENGE_SKILLS, challengeSkillStatus, challengeSkillCostFor, skillLevel, buyChallengeSkill,
  } from '../stores/game.svelte'
  import { playBuy } from '../systems/audio'

  const med = $derived(medals())
  const done = $derived(completedChallenges())
  const active = $derived(activeChallenge())
  const activeDef = $derived(active ? CHALLENGE_BY_ID[active] : null)

  function reqUnmet(reqs: string[] | undefined): boolean {
    return !!reqs?.some(r => !done.includes(r))
  }
  function onEnter(id: string) {
    const def = CHALLENGE_BY_ID[id]
    if (confirm(`Enter "${def.name}"?\n\nYour current game is saved and set aside. You'll start a fresh, restricted run:\n${def.description}\n\nGoal: ${def.goalLabel}\n\nReach the goal to earn ${def.medalReward} Medal(s); abandon any time to return to your saved game.`)) {
      enterChallenge(id)
    }
  }
  function onAbandon() {
    if (confirm('Abandon this challenge and restore your saved game? You will earn no Medals.')) abandonChallenge()
  }

  const tiers = [...new Set(CHALLENGE_SKILLS.map(n => n.tier))].sort((a, b) => a - b)
  function reqNames(reqs: string[]): string {
    return reqs.map(r => CHALLENGE_SKILLS.find(n => n.id === r)?.name ?? r).join(' + ')
  }
  function buy(id: string) { if (buyChallengeSkill(id)) playBuy() }
</script>

<div class="ch-wrap">
  <header class="ch-head frame bracketed">
    <div>
      <h2 class="ch-title">⚔ CHALLENGES</h2>
      <p class="ch-sub">Set your progress aside and climb a fresh, restricted run. Clear the goal to earn <strong>Medals (🎖️)</strong> — spent on a permanent Trial tree.</p>
    </div>
    <div class="ch-stats">
      <div class="stat"><span class="stat-val med tnum">🎖️ {med}</span><span class="stat-name">Medals</span></div>
      <div class="stat"><span class="stat-val tnum">{done.length}/{CHALLENGES.length}</span><span class="stat-name">cleared</span></div>
    </div>
  </header>

  {#if active && activeDef}
    <section class="ch-active frame">
      <h3 class="section-title">Active Trial — {activeDef.name}</h3>
      <p class="active-desc">{activeDef.description}</p>
      <div class="active-goal"><span class="lbl">Goal:</span> <span class="val">{activeDef.goalLabel}</span></div>
      <p class="active-hint">Reach the goal anywhere in this run to claim <strong>+{activeDef.medalReward} 🎖️</strong>. Your saved game is waiting.</p>
      <button class="abandon-btn" onclick={onAbandon}>Abandon Trial</button>
    </section>
  {:else}
    <section class="ch-roster frame">
      <h3 class="section-title">Trials</h3>
      <div class="roster-grid">
        {#each CHALLENGES as c}
          {@const cleared = done.includes(c.id)}
          {@const locked = reqUnmet(c.requires)}
          <div class="ch-card {cleared ? 'cleared' : ''} {locked ? 'locked' : ''}">
            <div class="card-top">
              <span class="card-icon">{c.icon}</span>
              <span class="card-name">{c.name}</span>
              {#if cleared}<span class="card-badge">✓ cleared</span>{/if}
            </div>
            <p class="card-desc">{c.description}</p>
            <div class="card-goal"><span class="lbl">Goal:</span> {c.goalLabel}</div>
            <div class="card-foot">
              <span class="reward">🎖️ {c.medalReward}</span>
              {#if locked}
                <span class="req">🔒 needs {reqNames(c.requires ?? [])}</span>
              {:else}
                <button class="enter-btn" onclick={() => onEnter(c.id)}>{cleared ? 'Replay' : 'Enter'}</button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </section>

    <section class="ch-tree frame">
      <h3 class="section-title">Trial Tree <span class="muted">— spend Medals</span></h3>
      <div class="tiers">
        {#each tiers as tier}
          <div class="tier">
            <span class="tier-label">tier {tier}</span>
            <div class="tier-nodes">
              {#each CHALLENGE_SKILLS.filter(n => n.tier === tier) as node}
                {@const lvl = skillLevel(node.id)}
                {@const st = challengeSkillStatus(node.id)}
                {@const cost = challengeSkillCostFor(node.id)}
                <button
                  class="node {st.locked ? 'locked' : ''} {st.maxed ? 'maxed' : ''} {st.buyable ? 'buyable' : ''}"
                  onclick={() => buy(node.id)} disabled={!st.buyable} title={node.description}
                >
                  <div class="node-top">
                    <span class="node-icon">{node.icon}</span>
                    <span class="node-name">{node.name}</span>
                    <span class="node-lvl tnum">{lvl}/{node.maxLevel}</span>
                  </div>
                  <p class="node-desc">{node.description}</p>
                  <div class="node-foot">
                    {#if st.maxed}<span class="foot maxed">🎖️ MAXED</span>
                    {:else if st.locked}<span class="foot locked">🔒 needs {reqNames(node.requires)}</span>
                    {:else}<span class="foot cost {st.affordable ? 'ok' : 'no'}">🎖️ {cost}</span>{/if}
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .ch-wrap { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
  .ch-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 18px; border-color: var(--challenge, #e06b3b); flex-wrap: wrap; }
  .ch-title { font-family: var(--font-display); font-size: 1rem; color: var(--challenge, #e06b3b); letter-spacing: 1px; }
  .ch-sub { font-family: var(--font-flavor); font-style: italic; font-size: 0.9rem; color: var(--parchment-dim); margin-top: 4px; max-width: 64ch; }
  .ch-stats { display: flex; gap: 18px; }
  .stat { display: flex; flex-direction: column; align-items: flex-end; }
  .stat-val { font-size: 1.1rem; font-weight: 700; color: var(--brass-bright); }
  .stat-val.med { color: var(--challenge, #e06b3b); text-shadow: 0 0 8px rgba(224, 107, 59, 0.4); }
  .stat-name { font-family: var(--font-flavor); font-style: italic; font-size: 0.74rem; color: var(--parchment-faint); }

  .section-title { font-family: var(--font-display); font-size: 0.82rem; letter-spacing: 1px; color: var(--brass); margin-bottom: 8px; }
  .section-title .muted { color: var(--parchment-faint); font-size: 0.72rem; }

  .ch-active { padding: 16px; display: flex; flex-direction: column; gap: 10px; border-color: var(--challenge, #e06b3b); }
  .active-desc { font-family: var(--font-flavor); font-style: italic; color: var(--parchment-dim); font-size: 0.86rem; }
  .active-goal { font-size: 0.9rem; } .active-goal .lbl { color: var(--parchment-dim); } .active-goal .val { font-weight: 700; color: var(--brass-bright); }
  .active-hint { font-size: 0.74rem; color: var(--parchment-faint); font-style: italic; }
  .abandon-btn { align-self: flex-start; padding: 8px 14px; background: var(--ink-700); border: 1px solid var(--danger); color: var(--danger); font-family: var(--font-display); font-size: 0.72rem; letter-spacing: 1px; border-radius: 4px; cursor: pointer; }
  .abandon-btn:hover { background: var(--danger); color: var(--ink-900); }

  .ch-roster { padding: 16px; border-color: var(--line); }
  .roster-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
  .ch-card { background: var(--ink-800); border: 1px solid var(--line); border-radius: 6px; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
  .ch-card.cleared { border-color: var(--brass-bright); }
  .ch-card.locked { opacity: 0.55; }
  .card-top { display: flex; align-items: center; gap: 8px; }
  .card-icon { font-size: 1.2rem; } .card-name { flex: 1; font-weight: 700; color: var(--challenge, #e06b3b); font-size: 0.86rem; }
  .card-badge { font-size: 0.68rem; color: var(--brass-bright); }
  .card-desc { font-family: var(--font-flavor); font-style: italic; font-size: 0.76rem; color: var(--parchment-dim); min-height: 2.4em; }
  .card-goal { font-size: 0.76rem; color: var(--parchment); } .card-goal .lbl { color: var(--parchment-faint); }
  .card-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
  .reward { color: var(--challenge, #e06b3b); font-weight: 700; font-size: 0.82rem; }
  .req { font-size: 0.72rem; color: var(--parchment-faint); font-style: italic; }
  .enter-btn { padding: 6px 14px; background: linear-gradient(135deg, var(--ink-700), #7a3a1f); border: 1px solid var(--challenge, #e06b3b); color: var(--parchment); font-family: var(--font-display); font-size: 0.7rem; letter-spacing: 1px; border-radius: 4px; cursor: pointer; }
  .enter-btn:hover { background: linear-gradient(135deg, #7a3a1f, #b8542a); box-shadow: 0 0 12px rgba(224,107,59,0.4); }

  .ch-tree { padding: 16px; border-color: var(--line); display: flex; flex-direction: column; gap: 14px; }
  .tiers { display: flex; flex-direction: column; gap: 12px; }
  .tier { display: flex; flex-direction: column; gap: 6px; }
  .tier-label { font-family: var(--font-display); font-size: 0.58rem; letter-spacing: 2px; color: var(--brass-deep); text-transform: uppercase; }
  .tier-nodes { display: flex; flex-wrap: wrap; gap: 10px; }
  .node { width: 100%; max-width: 250px; text-align: left; display: flex; flex-direction: column; gap: 6px; padding: 11px 13px; background: var(--ink-800); border: 1px solid var(--line); border-radius: 5px; cursor: pointer; font-family: var(--font-mono); color: var(--parchment); transition: transform 0.14s var(--ease-out), border-color 0.14s, box-shadow 0.14s; --accent: var(--challenge, #e06b3b); }
  .node.buyable { border-color: var(--accent); box-shadow: inset 0 0 18px color-mix(in srgb, var(--accent) 8%, transparent); }
  .node.buyable:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.4), 0 0 14px color-mix(in srgb, var(--accent) 40%, transparent); }
  .node.locked { opacity: 0.45; cursor: not-allowed; filter: saturate(0.4); }
  .node.maxed { border-color: var(--brass-bright); opacity: 0.92; cursor: default; }
  .node-top { display: flex; align-items: center; gap: 8px; }
  .node-icon { font-size: 1.2rem; } .node-name { flex: 1; font-size: 0.82rem; font-weight: 700; color: var(--accent); }
  .node-lvl { font-size: 0.78rem; color: var(--parchment-faint); }
  .node-desc { font-family: var(--font-flavor); font-style: italic; font-size: 0.74rem; line-height: 1.35; color: var(--parchment-dim); min-height: 2.7em; }
  .node-foot { margin-top: 2px; } .foot { font-size: 0.78rem; font-weight: 600; }
  .foot.maxed { color: var(--brass-bright); } .foot.locked { color: var(--parchment-faint); font-weight: 400; font-style: italic; }
  .foot.cost.ok { color: var(--challenge, #e06b3b); } .foot.cost.no { color: var(--parchment-faint); }
</style>
```

- [ ] **Step 2: Type-check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/ui/ChallengesPanel.svelte
git commit -m "feat(challenges): add the Challenges panel (roster + Medal tree + active banner)"
```

---

## Task 7: Wire the Challenges view into GameLayout

**Files:**
- Modify: `src/ui/GameLayout.svelte`

- [ ] **Step 1: Import + view union + gate**

(a) After `import OmegaPanel from './OmegaPanel.svelte'`:

```ts
  import ChallengesPanel from './ChallengesPanel.svelte'
```

(b) Add `completedChallenges, activeChallenge, anyStageAscended` to the store import:

```ts
  import { fortune, fmt, isStageUnlocked, transcendCount, transcendPreview, omegaCount, omegaPreview, completedChallenges, activeChallenge, anyStageAscended, getToasts, removeToast } from '../stores/game.svelte'
```

(c) Add `'challenges'` to the `View` union:

```ts
  type View = 'stages' | 'skills' | 'ascension' | 'stats' | 'settings' | 'transcendence' | 'omega' | 'challenges'
```

(d) After `const canSeeOmega = …`:

```ts
  const canSeeChallenges = $derived(!!activeChallenge() || completedChallenges().length > 0 || anyStageAscended())
```

- [ ] **Step 2: Nav button** — after the `{#if canSeeOmega} … {/if}` block:

```svelte
      {#if canSeeChallenges}
        <button class="view-btn ch-btn {view === 'challenges' ? 'active' : ''}" onclick={() => view = 'challenges'}>⚔ Challenges</button>
      {/if}
```

- [ ] **Step 3: Render branch** — after the `{:else if view === 'omega'}` block:

```svelte
  {:else if view === 'challenges'}
    <div class="skills-view">
      <ChallengesPanel />
    </div>
```

- [ ] **Step 4: Nav accent** — after the `.om-btn` rules in `<style>`:

```css
  .view-btn.active.ch-btn { background: #7a3a1f; color: var(--parchment); font-weight: 700; border-color: var(--challenge, #e06b3b); box-shadow: 0 0 10px rgba(224, 107, 59, 0.4); }
  .view-btn.ch-btn:hover:not(.active) { color: var(--challenge, #e06b3b); }
```

- [ ] **Step 5: Type-check + build**

Run: `npm run check && npm run build`
Expected: check 0/0; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/ui/GameLayout.svelte
git commit -m "feat(challenges): wire the Challenges view into GameLayout"
```

---

## Task 8: Dev-server smoke test (manual verification)

The snapshot enter/restore reassigns `gs` (runes) and isn't unit-testable here — verify live.

- [ ] **Step 1:** Run `npm run dev` (→ http://localhost:5173).

- [ ] **Step 2: Verify** (with a save that has ascended once, or seed `ascensionCount` via console so the tab shows):
  - The `⚔ Challenges` tab appears (`anyStageAscended` true).
  - **Enter** "Spartan Cogs" → confirm dialog → you drop into a fresh run; auto-buyers do nothing (toggle is inert); the tab stays visible.
  - The roster is hidden; the **Active Trial** banner shows the goal.
  - Hit the goal (seed `village.primaryLifetime` via console to ≥ 1e9) → toast "Challenge complete (+1 Medal)", your **original save is restored**, Medals = 1.
  - Spend a Medal on `ch:proven` → global mult rises; **Abandon** from another challenge restores without reward.
  - Reload mid-challenge → the challenge run (with its `challengeSnapshot`) persists; you can still Abandon back to the real save.

- [ ] **Step 3:** Stop the server. No commit.

---

## Task 9: Documentation pass

**Files:** `CHANGELOG.md`, `ROADMAP.md`, `README.md`, `CLAUDE.md`, `AGENTS.md`

- [ ] **Step 1: CHANGELOG.md** — new entry at the top of `[Unreleased]`:

```markdown
### Added — Phase 3: Challenges (restricted runs → Medals) · Save v13
- **Challenges** — optional restricted runs (snapshot-and-restore: your save is stashed via `exportSave`
  and restored via `importSave` on exit, so normal progress is never at risk). v1 roster of 4
  ([challenges.ts](./src/data/challenges.ts)): Spartan Cogs (no auto-buyers), Broken Chain (no bindings),
  Half Measures (×0.5 production), Purist (no prestige + no auto-buy). Restrictions are read via one
  `activeChallengeRestriction()` helper at 4 hooks (stepSim, bindingMultFor, effGlobalMult, prestigeStage).
- **Medals (🎖️) + Trial tree** ([skills/challenge.ts](./src/data/skills/challenge.ts)) — clearing a challenge
  grants Medals, spent on a 4-node tree that folds into `recomputeUpgrades()` and persists through every reset.
- **Challenges view** ([ChallengesPanel.svelte](./src/ui/ChallengesPanel.svelte)) — gated `⚔ Challenges` SPA
  view (after first Ascension) with the roster, active-run banner, and the Medal tree.
- **Save Version v13** — additive migration seeding `medals`, `completedChallenges`, `activeChallenge`.
```

- [ ] **Step 2: ROADMAP.md** — change `- 📦 Challenges (restriction/time/endless)` to:

```markdown
- ✅ **Challenges** (restricted runs → Medals + a Trial tree) — restriction runs live; time/endless deferred
```

- [ ] **Step 3: README.md** — add a status row after the Reality Reset row:

```markdown
| **Challenges (restricted runs → Medals 🎖️ + Trial tree)** | ✅ live |
```

- [ ] **Step 4: CLAUDE.md**
  - Architecture tree `data/` block — add: `│   ├── challenges.ts       4 restricted-run defs (restriction + goal + Medal reward)`
  - Architecture `skills/` block — add: `│   ├── skills/challenge.ts Challenge (Medal) tree (4 nodes, spent in Medals)`
  - `ui/` block — add: `│   ├── ChallengesPanel.svelte  Challenges view: roster + active-run banner + Medal tree`
  - `SaveManager.ts` tree line + rule #7: `currently v12` → `currently v13`.
  - GameLayout view-switch line + the "SPA views" bullet — append `/Challenges`.
  - Add a "where systems live" bullet: "**Challenges** — `enterChallenge()` stashes the real save (`exportSave`) and swaps `gs` to a fresh restricted run; `maybeCompleteChallenge()` (in `checkUnlocks`) restores it (`importSave`) and credits **Medals**; `activeChallengeRestriction()` gates auto-buy/bindings/prodMult/prestige; the `ch:*` Medal tree folds into `recomputeUpgrades()`."

- [ ] **Step 5: AGENTS.md** — append to the state summary: "Challenges (restricted snapshot runs → Medals 🎖️ + a Trial tree) are live."

- [ ] **Step 6: Commit**

```bash
git add CHANGELOG.md ROADMAP.md README.md CLAUDE.md AGENTS.md
git commit -m "docs: record the Challenges system - save v13"
```

---

## Task 10: Final verification

- [ ] **Step 1:** `npm run check` → `0 ERRORS 0 WARNINGS`.
- [ ] **Step 2:** `npm test` → all green (incl. `challenges.test.ts`, v13 migration, `ch:*` fold).
- [ ] **Step 3:** `npm run build` → succeeds.
- [ ] **Step 4:** `git status --short` → clean.

---

## Verification checklist (acceptance)

- [ ] `npm run check` 0/0
- [ ] `npm test` green (challenge predicates, v13 migration, Medal-tree fold)
- [ ] `npm run build` succeeds
- [ ] Dev smoke: enter → restriction applies → goal → restore + Medals; abandon restores; mid-run reload survives; tab gated correctly
- [ ] Docs updated (CHANGELOG/ROADMAP/README/CLAUDE/AGENTS); no AI co-author trailer
