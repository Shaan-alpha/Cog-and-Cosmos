# Reality Reset (Ω) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the fourth and final meta-prestige layer — Reality Reset (Ω) — above Transcendence: a brutal global reset that mints Omega (Ω), grants a permanent +10%/Ω multiplier to both production and ★ mint, and feeds a 4-node Ω skill tree.

**Architecture:** Mirror the existing Transcendence layer one tier up. Reuse the single `recomputeUpgrades()` fold-point ([src/systems/skills.ts](../../../src/systems/skills.ts)), the `transcend()` reset shape and skill-fn trio ([src/stores/game.svelte.ts](../../../src/stores/game.svelte.ts)), the `SkillNode` tree shape, and the additive save-migration ladder ([src/systems/SaveManager.ts](../../../src/systems/SaveManager.ts), v11→v12). No new plumbing.

**Tech Stack:** Svelte 5 (runes), TypeScript (strict), break_eternity.js (`Decimal`), Vitest, Vite/PWA.

**Spec:** [docs/superpowers/specs/2026-06-13-reality-reset-omega-design.md](../specs/2026-06-13-reality-reset-omega-design.md)

**Conventions (from CLAUDE.md):** currencies are `Decimal` (import from `systems/Decimal.ts`); balance math lives in `formulas.ts`; components are render-only; no AI co-author trailer on commits; update docs in the same pass. Verify with `npm run check`, `npm test`, `npm run build`.

> **Note on Ω-state magnitudes:** like the existing Aether layer, `omega`/`omegaLifetime`/`aetherLifetime` are plain `number` (they stay well under 1e15), so the gain math uses native `Math`, not `Decimal`. Only currencies/costs use `Decimal`.

---

## File Structure

**Create:**
- `src/data/skills/omega.ts` — the 4-node Ω skill tree (`OMEGA_SKILLS`).
- `src/ui/OmegaPanel.svelte` — the Reality Reset view (clone of `TranscendencePanel.svelte`).
- `src/systems/skills.test.ts` — unit test for the `recomputeUpgrades` Ω fold.

**Modify:**
- `src/data/types.ts` — add `omega?`, `omegaLifetime?`, `omegaCount?` to `GameState`.
- `src/systems/formulas.ts` — add `OMEGA_SOFTCAP` + `omegaGain()`.
- `src/systems/skills.ts` — register `OMEGA_BY_ID`, fold `OMEGA_SKILLS` + `omegaBonus` into `recomputeUpgrades`.
- `src/stores/game.svelte.ts` — imports/re-export, `freshGameState` fields, accessors, `omegaPreview`/`realityReset`/`buyOmegaSkill`/`omegaSkillCostFor`/`omegaSkillStatus`.
- `src/ui/GameLayout.svelte` — `'omega'` view, import, gated nav button, render branch.
- `src/systems/SaveManager.ts` — `CURRENT_VERSION` 11→12 + v11→v12 migration step.
- `src/systems/formulas.test.ts` — `omegaGain` cases.
- `src/systems/SaveManager.test.ts` — bump local `CURRENT_VERSION` const + v12 assertions.
- Docs: `CHANGELOG.md`, `ROADMAP.md`, `README.md`, `CLAUDE.md`, `AGENTS.md`, `MASTER_PLAN.md`.

---

## Task 1: Ω gain formula (`omegaGain`)

**Files:**
- Modify: `src/systems/formulas.ts` (append after the `ascensionGain` block, ~line 138)
- Test: `src/systems/formulas.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/systems/formulas.test.ts` — first add `omegaGain` to the import list from `'./formulas'` (line 3-19), then append:

```ts
describe('omegaGain', () => {
  it('is 0 at or below zero lifetime Aether', () => {
    expect(omegaGain(0)).toBe(0)
    expect(omegaGain(-5)).toBe(0)
  })
  it('is the floored cube-root of (aetherLifetime / 1e3)', () => {
    // (1e3 / 1e3)^(1/3) = 1
    expect(omegaGain(1e3)).toBe(1)
    // (8e6 / 1e3)^(1/3) = 8000^(1/3) = 20
    expect(omegaGain(8e6)).toBe(20)
    // (1e3/1e3)^(1/3) = 1 just below 8 → still floors down between knees
    expect(omegaGain(7e3)).toBe(1) // 7^(1/3) ≈ 1.91 → floor 1
  })
  it('scales gain by the reality-multiplier level (+15%/level)', () => {
    // base at 8e6 = 20; level 2 → floor(20 * 1.30) = 26
    expect(omegaGain(8e6, 2)).toBe(26)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/systems/formulas.test.ts -t omegaGain`
Expected: FAIL — `omegaGain is not a function` / not exported.

- [ ] **Step 3: Implement `omegaGain`**

Append to `src/systems/formulas.ts`:

```ts
// ── Reality Reset gain (Omega Ω) ────────────────────────────────────────────
// Top meta layer: cube-root of all-time Aether for brutal, deliberate pacing.
//   Ω = floor( (aetherLifetime / OMEGA_SOFTCAP)^(1/3) · (1 + 0.15·multLevel) )
// `multLevel` is the om:reality_multiplier skill level (+15% Ω gain per level).
export const OMEGA_SOFTCAP = 1e3
export function omegaGain(aetherLifetime: number, multLevel = 0): number {
  if (aetherLifetime <= 0) return 0
  const base = Math.pow(aetherLifetime / OMEGA_SOFTCAP, 1 / 3)
  return Math.floor(base * (1 + 0.15 * multLevel))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/systems/formulas.test.ts -t omegaGain`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/systems/formulas.ts src/systems/formulas.test.ts
git commit -m "feat(omega): add omegaGain cube-root formula + tests"
```

---

## Task 2: GameState fields + save v11→v12 migration

**Files:**
- Modify: `src/data/types.ts` (after `fortuneAllTime?: Decimal`, ~line 118)
- Modify: `src/systems/SaveManager.ts` (`CURRENT_VERSION` line 11; migrate before `raw.version = CURRENT_VERSION` line 177)
- Test: `src/systems/SaveManager.test.ts`

- [ ] **Step 1: Write the failing test**

In `src/systems/SaveManager.test.ts`: change the local constant (line 10) to `const CURRENT_VERSION = 12`, extend the v5-ladder assertions (after line 26), and add a v11→v12 case. Insert these assertions inside the existing `'upgrades a v5 save…'` test (after the `unlockedAchievements` assert, line 26):

```ts
    expect(out.omega).toBe(0)
    expect(out.omegaLifetime).toBe(0)
    expect(out.omegaCount).toBe(0)
```

And append a new test in the `describe('migrate: version ladder', …)` block:

```ts
  it('v11 → v12 seeds Omega fields and preserves existing ones', () => {
    const raw = {
      version: 11,
      omega: 7, omegaLifetime: 9, omegaCount: 2,
      stages: {},
    } as unknown as GameState
    const out = migrate(raw)
    expect(out.version).toBe(CURRENT_VERSION)
    expect(out.omega).toBe(7)
    expect(out.omegaLifetime).toBe(9)
    expect(out.omegaCount).toBe(2)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/systems/SaveManager.test.ts`
Expected: FAIL — `out.version` is 11 not 12, and `out.omega` is `undefined`.

- [ ] **Step 3a: Add the GameState fields**

In `src/data/types.ts`, after the line `fortuneAllTime?: Decimal  // all-time ★ minted (survives resets, drives Æ gain)`:

```ts
  omega?: number            // Omega (Ω) pool — minted by Reality Reset; drives the +10%/Ω passive mult
  omegaLifetime?: number    // total Omega ever earned (drives the per-reset increment)
  omegaCount?: number       // number of Reality Resets performed
```

- [ ] **Step 3b: Bump the version + add the migration step**

In `src/systems/SaveManager.ts`, change line 11:

```ts
const CURRENT_VERSION = 12
```

Then, immediately before `raw.version = CURRENT_VERSION` (the line after the v10→v11 block), add:

```ts
  // v11 → v12: Reality Reset meta layer (Omega pool, lifetime, count) — additive.
  if (raw.version < 12) {
    if (raw.omega === undefined) raw.omega = 0
    if (raw.omegaLifetime === undefined) raw.omegaLifetime = 0
    if (raw.omegaCount === undefined) raw.omegaCount = 0
    raw.version = 12
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/systems/SaveManager.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/types.ts src/systems/SaveManager.ts src/systems/SaveManager.test.ts
git commit -m "feat(omega): add Omega GameState fields + save v12 migration"
```

---

## Task 3: Ω skill tree data (`omega.ts`)

**Files:**
- Create: `src/data/skills/omega.ts`

- [ ] **Step 1: Create the tree file**

`src/data/skills/omega.ts`:

```ts
/**
 * The Reality (Omega Ω) Meta Tree — spent in Omega (Ω), earned by performing a
 * Reality Reset. Reuses the global SkillNode shape and the same recompute path
 * (systems/skills.ts), so it is fully save-safe and never drifts.
 *
 * effect:
 *   'global' → multiplies global production (gs.globalMult)
 *   'engine' → multiplies Fortune mint rate (gs.engine.engineMult)
 *
 * om:reality_multiplier and om:eternal_engine carry effectPerLevel 0 — their
 * effects are read explicitly in omegaPreview()/realityReset(), exactly like the
 * Aether tree's tr:trans_multiplier / tr:meta_automation.
 */
import type { SkillNode } from './global'

export const OMEGA_SKILLS: SkillNode[] = [
  {
    id: 'om:foundation', name: 'Reality Foundation', icon: '🌑', tier: 0,
    description: '+50% global production per level. Survives the Reality Reset.',
    effect: 'global', effectPerLevel: 0.50, maxLevel: 5, baseCost: 3, costGrowth: 2.0, requires: [],
  },
  {
    id: 'om:reality_multiplier', name: 'Reality Multiplier', icon: 'Ω', tier: 1,
    description: '+15% future Omega (Ω) gain per level on Reality Reset.',
    effect: 'global', effectPerLevel: 0, maxLevel: 5, baseCost: 6, costGrowth: 2.2, requires: ['om:foundation'],
  },
  {
    id: 'om:mint_resonance', name: 'Mint Resonance', icon: '💠', tier: 1,
    description: '+50% Fortune mint per level.',
    effect: 'engine', effectPerLevel: 0.50, maxLevel: 5, baseCost: 6, costGrowth: 2.2, requires: ['om:foundation'],
  },
  {
    id: 'om:eternal_engine', name: 'Eternal Engine', icon: '♾️', tier: 2,
    description: 'All autobuyers and Fortune Engine slots persist through the Reality Reset.',
    effect: 'global', effectPerLevel: 0, maxLevel: 1, baseCost: 12, costGrowth: 1.0, requires: ['om:reality_multiplier'],
  },
]
```

- [ ] **Step 2: Verify it type-checks**

Run: `npm run check`
Expected: 0 errors (the file is imported nowhere yet, but must compile).

- [ ] **Step 3: Commit**

```bash
git add src/data/skills/omega.ts
git commit -m "feat(omega): add the 4-node Omega skill tree data"
```

---

## Task 4: Fold the Ω tree + passive bonus into `recomputeUpgrades`

**Files:**
- Modify: `src/systems/skills.ts`
- Test: `src/systems/skills.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `src/systems/skills.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { recomputeUpgrades } from './skills'
import { D } from './Decimal'
import type { GameState } from '../data/types'

// Minimal GameState slice: recomputeUpgrades only reads skills/aether/omega/
// unlockedAchievements and writes globalMult + engine.engineMult.
function makeState(over: Partial<GameState> = {}): GameState {
  return {
    skills: {},
    aether: 0,
    omega: 0,
    unlockedAchievements: [],
    globalMult: D(1),
    engine: { engineMult: D(1) },
    ...over,
  } as unknown as GameState
}

describe('recomputeUpgrades — Omega fold', () => {
  it('with no Omega, leaves both multipliers at 1', () => {
    const gs = makeState()
    recomputeUpgrades(gs)
    expect(gs.globalMult.toNumber()).toBeCloseTo(1, 9)
    expect(gs.engine.engineMult.toNumber()).toBeCloseTo(1, 9)
  })
  it('applies +10% per Omega to BOTH global and engine', () => {
    const gs = makeState({ omega: 5 })
    recomputeUpgrades(gs)
    // omegaBonus = 1 + 0.10*5 = 1.5
    expect(gs.globalMult.toNumber()).toBeCloseTo(1.5, 9)
    expect(gs.engine.engineMult.toNumber()).toBeCloseTo(1.5, 9)
  })
  it('stacks Omega bonus multiplicatively with the Aether mint bonus', () => {
    const gs = makeState({ omega: 5, aether: 4 })
    recomputeUpgrades(gs)
    // global: 1.5 ; engine: (1 + 0.05*4) * 1.5 = 1.2 * 1.5 = 1.8
    expect(gs.globalMult.toNumber()).toBeCloseTo(1.5, 9)
    expect(gs.engine.engineMult.toNumber()).toBeCloseTo(1.8, 9)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/systems/skills.test.ts`
Expected: FAIL — Omega bonus not applied (global/engine stay 1.0 / aether-only).

- [ ] **Step 3: Implement the fold**

In `src/systems/skills.ts`:

(a) After the `TRANSCENDENCE_SKILLS` import (line 8), add:

```ts
import { OMEGA_SKILLS } from '../data/skills/omega'
```

(b) After the `TRANSCEND_BY_ID` map (line 20-22), add:

```ts
export const OMEGA_BY_ID: Record<string, SkillNode> = Object.fromEntries(
  OMEGA_SKILLS.map(n => [n.id, n]),
)
```

(c) Change the tree loop (line 44) to include `OMEGA_SKILLS`:

```ts
  for (const node of [...GLOBAL_SKILLS, ...ASCENSION_SKILLS, ...TRANSCENDENCE_SKILLS, ...OMEGA_SKILLS]) {
```

(d) Replace the final assignment block (lines 52-66) with:

```ts
  // Fold in Aether passive mill bonus: +5% Fortune mint per Aether
  const aetherBonus = 1 + 0.05 * (gs.aether ?? 0)

  // Fold in Omega passive bonus: +10% to BOTH global production and Fortune mint per Ω
  const omegaBonus = 1 + 0.10 * (gs.omega ?? 0)

  // Sum up unlocked achievements boosts: each grants its b_i % global production.
  const unlocked = gs.unlockedAchievements ?? []
  let achBoost = 0
  for (const ach of ACHIEVEMENTS) {
    if (unlocked.includes(ach.id)) {
      achBoost += ach.bonusPct
    }
  }
  const achMult = 1 + achBoost / 100

  gs.globalMult = D(global * achMult * omegaBonus)
  gs.engine.engineMult = D(engine * aetherBonus * omegaBonus)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/systems/skills.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the full suite (no regressions)**

Run: `npm test`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add src/systems/skills.ts src/systems/skills.test.ts
git commit -m "feat(omega): fold Omega tree + 10%/Ω bonus into recomputeUpgrades"
```

---

## Task 5: Store API — accessors, preview, reset, skill fns

**Files:**
- Modify: `src/stores/game.svelte.ts`

- [ ] **Step 1: Add imports + re-export**

(a) Line 9 — add `OMEGA_BY_ID` to the skills import:

```ts
import { recomputeUpgrades, skillCost, prereqsMet, SKILL_BY_ID, ASCENSION_BY_ID, TRANSCEND_BY_ID, OMEGA_BY_ID } from '../systems/skills'
```

(b) After line 12 (`import { TRANSCENDENCE_SKILLS } …`), add:

```ts
import { OMEGA_SKILLS } from '../data/skills/omega'
```

(c) Line 938 — add `OMEGA_SKILLS` to the re-export:

```ts
export { GLOBAL_SKILLS, ASCENSION_SKILLS, TRANSCENDENCE_SKILLS, OMEGA_SKILLS }
```

- [ ] **Step 2: Seed Ω fields in `freshGameState`**

In `freshGameState()`, after `fortuneAllTime: ZERO,` (line 84), add:

```ts
    omega: 0,
    omegaLifetime: 0,
    omegaCount: 0,
```

- [ ] **Step 3: Add accessors**

After `export function aetherLifetime() { return gs.aetherLifetime ?? 0 }` (line 113), add:

```ts
export function omega() { return gs.omega ?? 0 }
export function omegaLifetime() { return gs.omegaLifetime ?? 0 }
export function omegaCount() { return gs.omegaCount ?? 0 }
```

- [ ] **Step 4: Import the formula**

In `src/stores/game.svelte.ts`, change line 8 from:

```ts
import { offlineGain } from '../systems/formulas'
```
to:
```ts
import { offlineGain, omegaGain } from '../systems/formulas'
```

- [ ] **Step 5: Add `omegaPreview`, `realityReset`, and the Ω skill fns**

After the `transcend()` function's closing brace (line 1078, before `export function fmt`), add:

```ts
// ── Reality Reset meta-prestige (Omega Ω) — the layer above Transcendence ────
export function omegaSkillCostFor(id: string): number {
  const node = OMEGA_BY_ID[id]
  if (!node) return 0
  const lvl = gs.skills[id] ?? 0
  return Math.ceil(skillCost(node, lvl).toNumber())
}

export function omegaSkillStatus(id: string): SkillStatus {
  const node = OMEGA_BY_ID[id]
  const lvl = gs.skills[id] ?? 0
  const maxed = !node || lvl >= node.maxLevel
  const locked = !node || !prereqsMet(node, gs.skills)
  const cost = omegaSkillCostFor(id)
  const affordable = !maxed && (gs.omega ?? 0) >= cost
  return { maxed, locked, affordable, buyable: !maxed && !locked && affordable }
}

export function buyOmegaSkill(id: string): boolean {
  const node = OMEGA_BY_ID[id]
  if (!node) return false
  const lvl = gs.skills[id] ?? 0
  if (lvl >= node.maxLevel) return false
  if (!prereqsMet(node, gs.skills)) return false
  const cost = omegaSkillCostFor(id)
  if ((gs.omega ?? 0) < cost) return false

  gs.omega = (gs.omega ?? 0) - cost
  gs.skills[id] = lvl + 1
  recomputeUpgrades(gs)
  saveGame(gs).catch(console.error)
  return true
}

export function omegaPreview(): { omegaGained: number; totalOmega: number; ready: boolean } {
  const lvl = gs.skills['om:reality_multiplier'] ?? 0
  const deserved = omegaGain(gs.aetherLifetime ?? 0, lvl)
  const pending = Math.max(0, deserved - (gs.omegaLifetime ?? 0))
  return {
    omegaGained: pending,
    totalOmega: (gs.omega ?? 0) + pending,
    ready: pending > 0,
  }
}

export function realityReset(): boolean {
  const preview = omegaPreview()
  if (!preview.ready) return false

  const pending = preview.omegaGained
  playTranscend()

  const metaActive = (gs.skills['om:eternal_engine'] ?? 0) >= 1
  const savedAutoBuySettings: Record<string, {
    autoBuy?: boolean
    autoBuyMode?: 'cheapest' | 'priority'
    autoBuyReserve?: number
    autoBuyMilestoneSnipe?: boolean
    autoBuyVault?: string[]
  }> = {}
  if (metaActive) {
    for (const [sid, st] of Object.entries(gs.stages) as [string, StageState][]) {
      savedAutoBuySettings[sid] = {
        autoBuy: st.autoBuy,
        autoBuyMode: st.autoBuyMode,
        autoBuyReserve: st.autoBuyReserve,
        autoBuyMilestoneSnipe: st.autoBuyMilestoneSnipe,
        autoBuyVault: st.autoBuyVault ? [...st.autoBuyVault] : [],
      }
    }
  }

  // Wipe stages → fresh, locked except Village
  for (const sid of Object.keys(STAGE_ECONOMIES)) {
    gs.stages[sid] = STAGE_ECONOMIES[sid].freshState()
    if (metaActive && savedAutoBuySettings[sid]) {
      const saved = savedAutoBuySettings[sid]
      const st = gs.stages[sid]
      st.autoBuy = saved.autoBuy
      st.autoBuyMode = saved.autoBuyMode
      st.autoBuyReserve = saved.autoBuyReserve
      st.autoBuyMilestoneSnipe = saved.autoBuyMilestoneSnipe
      st.autoBuyVault = saved.autoBuyVault
    }
  }
  for (const sid of Object.keys(gs.stages)) {
    gs.stages[sid].unlocked = (sid === 'village')
  }

  // Seed Village — honor the (persisting) Aether Start Boost, else default 15.
  const startBoostLvl = gs.skills['tr:start_boost'] ?? 0
  const boostAmt = startBoostLvl > 0 ? D(Math.pow(10, 2 * startBoostLvl)) : ZERO
  if (boostAmt.gt(ZERO)) {
    gs.stages.village.primaryAmount = boostAmt
    gs.stages.village.primaryLifetime = boostAmt
  } else {
    gs.stages.village.primaryAmount = D(15)
    gs.stages.village.primaryLifetime = D(15)
  }

  // Reset Engine (restore slots if Eternal Engine owned)
  const savedSlots = gs.engine.slots
  gs.engine = fortuneEngine.freshState()
  if (metaActive) gs.engine.slots = savedSlots

  // Reset LP
  gs.legacyPoints = 0

  // Wipe Global + Ascension skills; KEEP Aether (tr:*) AND Omega (om:*) trees
  const nextSkills: Record<string, number> = {}
  for (const node of [...TRANSCENDENCE_SKILLS, ...OMEGA_SKILLS]) {
    const lvl = gs.skills[node.id] ?? 0
    if (lvl > 0) nextSkills[node.id] = lvl
  }
  gs.skills = nextSkills

  // Wipe enchants, space buffers, warp, multiverse, convergence
  gs.activeEnchants = []
  gs.spaceBuffers = { ore: ZERO, power: ZERO }
  gs.warp = { charges: WARP_BASE_CHARGE_CAP, recharge: 0 }
  gs.multiverse = { branchSlots: [] }
  gs.convergenceMult = ONE

  // Wipe the Aether POOL + transcend count (design Q1: Ω wipes Æ pool, keeps Æ tree)
  gs.aether = 0
  gs.transcendCount = 0

  // Update Omega state
  gs.omegaCount = (gs.omegaCount ?? 0) + 1
  gs.omega = (gs.omega ?? 0) + pending
  gs.omegaLifetime = (gs.omegaLifetime ?? 0) + pending

  recomputeUpgrades(gs)
  saveGame(gs).catch(console.error)
  return true
}
```

- [ ] **Step 6: Type-check**

Run: `npm run check`
Expected: 0 errors, 0 warnings. (If `StageState` is not already imported in `game.svelte.ts`, it is — `transcend()` uses the same cast; no new import needed.)

- [ ] **Step 7: Commit**

```bash
git add src/stores/game.svelte.ts
git commit -m "feat(omega): store API — omegaPreview, realityReset, Omega skill fns"
```

---

## Task 6: `OmegaPanel.svelte` (the Reality Reset view)

**Files:**
- Create: `src/ui/OmegaPanel.svelte`

This is a faithful clone of `TranscendencePanel.svelte` retargeted to Ω. Create the file with this exact content:

- [ ] **Step 1: Create the panel**

`src/ui/OmegaPanel.svelte`:

```svelte
<script lang="ts">
  import {
    omega, omegaLifetime, omegaCount, aetherLifetime,
    omegaPreview, realityReset,
    OMEGA_SKILLS, omegaSkillStatus, omegaSkillCostFor, skillLevel, buyOmegaSkill,
    fmt,
  } from '../stores/game.svelte'
  import OnboardingTooltip from './OnboardingTooltip.svelte'
  import { playBuy } from '../systems/audio'

  const om = $derived(omega())
  const omCount = $derived(omegaCount())
  const aethLife = $derived(aetherLifetime())

  const preview = $derived(omegaPreview())
  const rmLevel = $derived(skillLevel('om:reality_multiplier'))
  // All-time Aether needed for the next Ω: invert the cube-root gain curve.
  const nextAetherNeed = $derived(
    Math.pow((preview.totalOmega + 1) / (1 + 0.15 * rmLevel), 3) * 1e3
  )

  function handleReset() {
    if (!preview.ready) return
    if (confirm(`Collapse this Reality?\n\nThis resets ALL stages, stage prestige currencies, Legacy Points (LP) + the LP tree, Fortune (★) global upgrades, AND your Aether (Æ) pool + transcend count back to zero.\n\nYou will keep your Aether (Æ) tree, Omega (Ω) + the Omega tree, achievements, and statistics.\n\nIn return, you will gain +${preview.omegaGained} Omega (Ω) to spend on the permanent Reality tree.`)) {
      realityReset()
    }
  }

  const tiers = [...new Set(OMEGA_SKILLS.map(n => n.tier))].sort((a, b) => a - b)
  function reqNames(reqs: string[]): string {
    return reqs.map(r => OMEGA_SKILLS.find(n => n.id === r)?.name ?? r).join(' + ')
  }
  function buy(id: string) { if (buyOmegaSkill(id)) playBuy() }
</script>

<div class="om-wrap">
  <header class="om-head frame bracketed">
    <div class="om-title-block">
      <h2 class="om-title">Ω REALITY RESET</h2>
      <p class="om-sub">Collapse the entire Aether realm into a new reality. Condense all-time <strong>Aether (Æ)</strong> into <strong>Omega (Ω)</strong> — a permanent boost to all production and ★ mint that outlasts every other reset.</p>
    </div>
    <div class="om-stats">
      <div class="stat">
        <span class="stat-val om tnum">Ω {om}</span>
        <span class="stat-name">Omega</span>
      </div>
      <div class="stat">
        <span class="stat-val tnum">{omCount}</span>
        <span class="stat-name">reality resets</span>
      </div>
      <div class="stat">
        <span class="stat-val ae tnum">Æ {fmt(aethLife)}</span>
        <span class="stat-name">all-time Aether</span>
      </div>
    </div>
  </header>

  <OnboardingTooltip
    id="omega"
    title="The Reality Reset Layer"
    content="A Reality Reset collapses everything — including your spent Aether pool — into Omega (Ω), earned from all-time Aether. Ω is spent on the permanent Reality tree and grants a passive +10% to BOTH global production and Fortune mint per Ω. Your Aether tree is kept."
  />

  <div class="om-row">
    <section class="om-altar frame">
      <h3 class="section-title">The Reality Collapse</h3>
      <p class="altar-intro">Fold the realized universe — and the Aether you spent shaping it — into a single seed of Omega.</p>

      <div class="altar-grid">
        <div class="altar-group lost">
          <h4>What is Lost</h4>
          <ul>
            <li>All eight stages & their prestige currencies</li>
            <li>Legacy Points (LP) & LP Ascension Tree</li>
            <li>Current ★ Fortune & Global Upgrade Tree</li>
            <li>Aether (Æ) pool & transcend count</li>
            <li>Active enchants & space buffers</li>
            <li>Warp charges & Multiverse branch slots</li>
          </ul>
        </div>

        <div class="altar-group kept">
          <h4>What is Kept</h4>
          <ul>
            <li>Omega (Ω) & the Reality Tree</li>
            <li>Aether (Æ) Skill Tree (levels only)</li>
            <li>Achievements & Game Statistics</li>
            <li>Autobuyer toggles & Engine slots <span class="spec-highlight">(requires Eternal Engine)</span></li>
          </ul>
        </div>
      </div>

      <div class="altar-preview">
        <div class="preview-item">
          <span class="lbl">Pending Omega:</span>
          <span class="val positive tnum">+{preview.omegaGained} Ω</span>
        </div>
        <div class="preview-item">
          <span class="lbl">Next Omega at:</span>
          <span class="val tnum">Æ {fmt(nextAetherNeed)} all-time</span>
        </div>
      </div>

      <button class="reset-btn" disabled={!preview.ready} onclick={handleReset}>
        {preview.ready ? 'Collapse Reality' : 'Reality Not Ready'}
      </button>
      {#if !preview.ready}
        <p class="ready-hint">Earn more all-time Aether (Æ) to qualify for Omega (+1 Ω at Æ 1,000 all-time, cube-root scaled).</p>
      {/if}
    </section>

    <section class="om-tree frame">
      <h3 class="section-title">Reality Upgrade Tree <span class="muted">— spend Omega</span></h3>
      <div class="tiers">
        {#each tiers as tier}
          <div class="tier">
            <span class="tier-label">tier {tier}</span>
            <div class="tier-nodes">
              {#each OMEGA_SKILLS.filter(n => n.tier === tier) as node}
                {@const lvl = skillLevel(node.id)}
                {@const st = omegaSkillStatus(node.id)}
                {@const cost = omegaSkillCostFor(node.id)}
                <button
                  class="node {st.locked ? 'locked' : ''} {st.maxed ? 'maxed' : ''} {st.buyable ? 'buyable' : ''}"
                  onclick={() => buy(node.id)}
                  disabled={!st.buyable}
                  title={node.description}
                >
                  <div class="node-top">
                    <span class="node-icon">{node.icon}</span>
                    <span class="node-name">{node.name}</span>
                    <span class="node-lvl tnum">{lvl}/{node.maxLevel}</span>
                  </div>
                  <p class="node-desc">{node.description}</p>

                  <div class="node-foot">
                    {#if st.maxed}
                      <span class="foot maxed">Ω MAXED</span>
                    {:else if st.locked}
                      <span class="foot locked">🔒 needs {reqNames(node.requires)}</span>
                    {:else}
                      <span class="foot cost {st.affordable ? 'ok' : 'no'}">Ω {cost}</span>
                    {/if}
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </section>
  </div>
</div>

<style>
  .om-wrap { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

  .om-head {
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; padding: 14px 18px; border-color: var(--omega, #ffd76b); flex-wrap: wrap;
  }
  .om-title { font-family: var(--font-display); font-size: 1rem; color: var(--omega, #ffd76b); letter-spacing: 1px; }
  .om-sub { font-family: var(--font-flavor); font-style: italic; font-size: 0.9rem; color: var(--parchment-dim); margin-top: 4px; max-width: 64ch; }
  .om-stats { display: flex; gap: 18px; }
  .stat { display: flex; flex-direction: column; align-items: flex-end; }
  .stat-val { font-size: 1.1rem; font-weight: 700; color: var(--brass-bright); }
  .stat-val.om { color: var(--omega, #ffd76b); text-shadow: 0 0 8px rgba(255, 215, 107, 0.4); }
  .stat-val.ae { color: var(--aether, #9d5fe3); }
  .stat-name { font-family: var(--font-flavor); font-style: italic; font-size: 0.74rem; color: var(--parchment-faint); }

  .om-row { display: grid; grid-template-columns: 1fr 1.3fr; gap: 16px; }
  @media (max-width: 900px) {
    .om-row { grid-template-columns: 1fr; }
  }

  .om-altar { padding: 16px; display: flex; flex-direction: column; gap: 14px; border-color: var(--line); }
  .section-title { font-family: var(--font-display); font-size: 0.82rem; letter-spacing: 1px; color: var(--brass); margin-bottom: 4px; }
  .section-title .muted { color: var(--parchment-faint); font-size: 0.72rem; }

  .altar-intro { font-family: var(--font-flavor); font-style: italic; font-size: 0.84rem; color: var(--parchment-dim); }

  .altar-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .altar-group { background: var(--ink-850); border: 1px solid var(--line); padding: 10px; border-radius: 4px; }
  .altar-group h4 { font-size: 0.76rem; font-weight: 700; margin-bottom: 6px; letter-spacing: 0.5px; }
  .altar-group.lost h4 { color: var(--danger); }
  .altar-group.kept h4 { color: var(--positive); }
  .altar-group ul { list-style: none; font-size: 0.72rem; display: flex; flex-direction: column; gap: 4px; color: var(--parchment-dim); }
  .altar-group.lost li::before { content: '× '; color: var(--danger); font-weight: 700; }
  .altar-group.kept li::before { content: '✓ '; color: var(--positive); font-weight: 700; }
  .spec-highlight { color: var(--omega, #ffd76b); font-style: italic; font-size: 0.68rem; }

  .altar-preview { background: var(--ink-900); border: 1px solid var(--line-bright); padding: 12px; border-radius: 4px; display: flex; flex-direction: column; gap: 6px; }
  .preview-item { display: flex; justify-content: space-between; font-size: 0.82rem; }
  .preview-item .lbl { color: var(--parchment-dim); }
  .preview-item .val { font-weight: 700; }
  .preview-item .val.positive { color: var(--omega, #ffd76b); text-shadow: 0 0 6px rgba(255, 215, 107, 0.3); }

  .reset-btn {
    padding: 10px; background: linear-gradient(135deg, var(--ink-700), var(--ink-600)); border: 1px solid var(--line-bright);
    color: var(--parchment-dim); font-family: var(--font-display); font-size: 0.8rem; letter-spacing: 1.5px;
    border-radius: 4px; cursor: pointer; transition: all 0.22s var(--ease-out); text-transform: uppercase;
  }
  .reset-btn:not(:disabled) {
    background: linear-gradient(135deg, var(--ink-700), #8a6a14); border-color: var(--omega, #ffd76b);
    color: var(--parchment);
    box-shadow: 0 0 12px rgba(255, 215, 107, 0.15);
  }
  .reset-btn:not(:disabled):hover {
    background: linear-gradient(135deg, #8a6a14, #b8902a);
    box-shadow: 0 0 20px rgba(255, 215, 107, 0.4), inset 0 0 8px rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
  .reset-btn:not(:disabled):active { transform: translateY(0); }
  .reset-btn:disabled { cursor: not-allowed; opacity: 0.5; }

  .ready-hint { font-size: 0.68rem; font-family: var(--font-flavor); font-style: italic; color: var(--parchment-faint); text-align: center; margin-top: -4px; }

  .om-tree { padding: 16px; border-color: var(--line); display: flex; flex-direction: column; gap: 14px; }
  .tiers { display: flex; flex-direction: column; gap: 12px; }
  .tier { display: flex; flex-direction: column; gap: 6px; }
  .tier-label { font-family: var(--font-display); font-size: 0.58rem; letter-spacing: 2px; color: var(--brass-deep); text-transform: uppercase; }
  .tier-nodes { display: flex; flex-wrap: wrap; gap: 10px; }

  .node {
    width: 100%; max-width: 250px; text-align: left; display: flex; flex-direction: column; gap: 6px;
    padding: 11px 13px; background: var(--ink-800); border: 1px solid var(--line); border-radius: 5px;
    cursor: pointer; font-family: var(--font-mono); color: var(--parchment);
    transition: transform 0.14s var(--ease-out), border-color 0.14s, box-shadow 0.14s;
    --accent: var(--omega, #ffd76b);
  }
  .node.buyable { border-color: var(--accent); box-shadow: inset 0 0 18px color-mix(in srgb, var(--accent) 8%, transparent); }
  .node.buyable:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.4), 0 0 14px color-mix(in srgb, var(--accent) 40%, transparent); }
  .node.buyable:active { transform: translateY(0) scale(0.98); }
  .node.locked { opacity: 0.45; cursor: not-allowed; filter: saturate(0.4); }
  .node.maxed { border-color: var(--brass-bright); opacity: 0.92; cursor: default; }
  .node:disabled:not(.maxed):not(.locked) { cursor: not-allowed; }

  .node-top { display: flex; align-items: center; gap: 8px; }
  .node-icon { font-size: 1.2rem; }
  .node-name { flex: 1; font-size: 0.82rem; font-weight: 700; color: var(--accent); letter-spacing: 0.3px; }
  .node-lvl { font-size: 0.78rem; color: var(--parchment-faint); }
  .node-desc { font-family: var(--font-flavor); font-style: italic; font-size: 0.74rem; line-height: 1.35; color: var(--parchment-dim); min-height: 2.7em; }

  .node-foot { margin-top: 2px; }
  .foot { font-size: 0.78rem; font-weight: 600; }
  .foot.maxed { color: var(--brass-bright); }
  .foot.locked { color: var(--parchment-faint); font-weight: 400; font-style: italic; }
  .foot.cost.ok { color: var(--omega, #ffd76b); text-shadow: 0 0 6px rgba(255, 215, 107, 0.3); }
  .foot.cost.no { color: var(--parchment-faint); }
</style>
```

- [ ] **Step 2: Type-check**

Run: `npm run check`
Expected: 0 errors (panel imports resolve against Task 5 exports).

- [ ] **Step 3: Commit**

```bash
git add src/ui/OmegaPanel.svelte
git commit -m "feat(omega): add the Reality Reset (OmegaPanel) view"
```

---

## Task 7: Wire the Ω view into GameLayout

**Files:**
- Modify: `src/ui/GameLayout.svelte`

- [ ] **Step 1: Import + view union + gate**

(a) After line 6 (`import TranscendencePanel …`), add:

```ts
  import OmegaPanel from './OmegaPanel.svelte'
```

(b) Line 9 — add `omegaCount, omegaPreview` to the store import:

```ts
  import { fortune, fmt, isStageUnlocked, transcendCount, transcendPreview, omegaCount, omegaPreview, getToasts, removeToast } from '../stores/game.svelte'
```

(c) Line 18 — add `'omega'` to the `View` union:

```ts
  type View = 'stages' | 'skills' | 'ascension' | 'stats' | 'settings' | 'transcendence' | 'omega'
```

(d) After line 24 (`const canSeeTrans = …`), add:

```ts
  const canSeeOmega = $derived(omegaCount() > 0 || omegaPreview().omegaGained > 0)
```

- [ ] **Step 2: Add the nav button**

After the Transcendence button block (lines 59-61, the `{#if canSeeTrans} … {/if}`), add:

```svelte
      {#if canSeeOmega}
        <button class="view-btn om-btn {view === 'omega' ? 'active' : ''}" onclick={() => view = 'omega'}>Ω Reality</button>
      {/if}
```

- [ ] **Step 3: Add the render branch**

After the `{:else if view === 'transcendence'}` branch (lines 127-130), add:

```svelte
  {:else if view === 'omega'}
    <div class="skills-view">
      <OmegaPanel />
    </div>
```

- [ ] **Step 4: (Optional) accent the nav button**

In the `<style>` block, near the `.tr-btn` rule if one exists, add:

```css
  .om-btn.active, .om-btn:hover { color: var(--omega, #ffd76b); border-color: var(--omega, #ffd76b); }
```

(If there is no `.tr-btn` rule, skip — the default `.view-btn` styling is sufficient.)

- [ ] **Step 5: Type-check + build**

Run: `npm run check && npm run build`
Expected: check 0/0; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/ui/GameLayout.svelte
git commit -m "feat(omega): wire the Omega 'Reality' view into GameLayout"
```

---

## Task 8: Dev-server smoke test (manual verification)

The store layer (`realityReset`) uses Svelte runes and isn't unit-testable in this harness; verify it live.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (→ http://localhost:5173)

- [ ] **Step 2: Verify (use a save with prior Transcends, or temporarily seed `aetherLifetime` via the console / a test save)**

Confirm:
- The `Ω Reality` nav button appears once `omegaPreview().omegaGained > 0` (i.e. `aetherLifetime ≥ 1000`).
- The OmegaPanel renders: pending Ω, "next Omega at" Æ value, lost/kept lists, the tree.
- Clicking **Collapse Reality** (confirm dialog) wipes stages/Engine/LP/global+ascension skills + the Æ pool, keeps the Æ and Ω tree levels, and credits Ω.
- After reset, global production and ★ mint reflect `1 + 0.10·Ω` (compare the Stats panel global-mult before/after buying nothing else).
- Buying an Ω node deducts Ω and (for `om:foundation`/`om:mint_resonance`) raises the multiplier; `om:eternal_engine` preserves autobuyer toggles + Engine slots through the next reset.

- [ ] **Step 3: Stop the server.** No commit (verification only).

---

## Task 9: Documentation pass (operating rule #2)

**Files:** `CHANGELOG.md`, `ROADMAP.md`, `README.md`, `CLAUDE.md`, `AGENTS.md`, `MASTER_PLAN.md`

- [ ] **Step 1: CHANGELOG.md** — add a new entry at the top of `[Unreleased]`:

```markdown
### Added — Phase 3: Reality Reset (Ω) meta-layer · Save v12
- **Reality Reset (Ω)** — the fourth and final meta-prestige layer, above Transcendence. A brutal
  global reset that mints **Omega (Ω)** from all-time Aether (`floor((aetherLifetime/1e3)^(1/3) · (1+0.15·L))`),
  granting a permanent **+10% to both global production and ★ mint per Ω**. Wipes the live game **and** the
  Aether pool + transcend count; keeps the Aether tree, `aetherLifetime`, `fortuneAllTime`, and the Ω layer.
- **Reality (Ω) tree** ([omega.ts](./src/data/skills/omega.ts)) — 4 nodes (Reality Foundation +50%/lvl global,
  Reality Multiplier +15% Ω gain/lvl, Mint Resonance +50%/lvl mint, Eternal Engine — persist autobuyers +
  Engine slots through the reset). Folds into the same `recomputeUpgrades()` pass, so it's save-safe.
- **Reality Reset view** ([OmegaPanel.svelte](./src/ui/OmegaPanel.svelte)) — gated `Ω Reality` SPA view with
  the collapse altar (lost/kept), gain preview, and the Ω tree.
- **Save Version v12** — additive migration seeding `omega`, `omegaLifetime`, `omegaCount` (no reset).
```

- [ ] **Step 2: ROADMAP.md** — change the Phase 3 line `- 📦 Reality Reset (Omega Ω) meta layer` to:

```markdown
- ✅ **Reality Reset** (Omega Ω) meta layer — the prestige stack is now complete (Prestige → Ascension → Transcendence → Reality Reset)
```

- [ ] **Step 3: README.md** — change the status row `| Reality Reset (Ω) meta layer | 🔜 roadmap |` to:

```markdown
| **Reality Reset (Ω) meta-layer (+10%/Ω global & mint) + Ω tree** | ✅ live |
```

- [ ] **Step 4: CLAUDE.md** — two edits:
  - In the Project paragraph, change "The remaining meta-prestige layer (Reality Reset Ω) is still on the roadmap." to "All four prestige tiers are live: Prestige → Ascension (LP) → Transcendence (Æ) → **Reality Reset (Ω)**."
  - In the conventions, change "Saves are versioned (currently v11)" → "currently v12", and in the architecture file-tree's `SaveManager.ts` line "currently v11" → "currently v12". Add to the `data/skills/` block: `│   ├── skills/omega.ts     Reality (Ω) meta tree (4 nodes, spent in Omega)`. Add to the `ui/` block: `│   ├── OmegaPanel.svelte   Reality Reset view: Ω collapse altar + Ω tree`. Update the GameLayout view-switch line and the "SPA views" bullet to include `Omega`. Add a "where systems live" bullet: "**Reality Reset layer** — `realityReset()` (deepest reset) mints **Omega (Ω)** via `omegaGain()`; the Ω tree (`buyOmegaSkill()`) folds into `recomputeUpgrades()`, and `1 + 0.10·Ω` multiplies both `globalMult` and `engineMult`."

- [ ] **Step 5: AGENTS.md** — in the TL;DR, change "only the Reality Reset (Ω) meta layer is still roadmap." to "All four prestige tiers are live (Prestige → Ascension → Transcendence → **Reality Reset Ω**)."

- [ ] **Step 6: MASTER_PLAN.md** — annotate sheet #13 (Reality Reset). After the existing `Omega_gain`/`Ω_QoLmult` lines, add a `// shipped:` note: `Omega_gain = floor((aetherLifetime/1e3)^(1/3) · (1 + 0.15·L))` where L = `om:reality_multiplier` level; `Ω bonus = 1 + 0.10·Ω` applied to BOTH global production and ★ mint; NG+ modifiers deferred.

- [ ] **Step 7: Commit**

```bash
git add CHANGELOG.md ROADMAP.md README.md CLAUDE.md AGENTS.md MASTER_PLAN.md
git commit -m "docs: record the Reality Reset (Omega) layer · save v12"
```

---

## Task 10: Final verification

- [ ] **Step 1: Full gate**

Run: `npm run check`
Expected: `0 ERRORS 0 WARNINGS`.

Run: `npm test`
Expected: all suites green (incl. new `omegaGain`, migration v12, and `skills.test.ts` cases).

Run: `npm run build`
Expected: build succeeds; PWA precache regenerated.

- [ ] **Step 2: Confirm clean tree**

Run: `git status --short`
Expected: clean (all work committed).

---

## Verification checklist (acceptance)

- [ ] `npm run check` → 0/0
- [ ] `npm test` → all green, including `omegaGain`, v12 migration, and `recomputeUpgrades` Ω fold
- [ ] `npm run build` → succeeds
- [ ] Dev smoke: Ω view gates correctly, reset wipes Æ pool + keeps Æ/Ω trees, +10%/Ω applies to global & mint, Eternal Engine persists automation
- [ ] Docs updated (CHANGELOG/ROADMAP/README/CLAUDE/AGENTS/MASTER_PLAN); no AI co-author trailer on any commit
