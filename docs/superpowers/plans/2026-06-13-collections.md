# Collections (Relics) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Collections — relics that drop on prestige-stack events and grant permanent passive bonuses, with rarity-tier set bonuses.

**Architecture:** Data-driven relic defs (like achievements); a `grantDrop(rarity, chance)` helper hooked into the five reset/clear events; bonuses fold into `recomputeUpgrades()` like every other multiplier; `collectedRelics: string[]` is permanent meta surviving all resets. Save v13 → v14, additive.

**Tech Stack:** Svelte 5 (runes), TypeScript, break_eternity, Vitest, Vite/PWA.

**Spec:** [docs/superpowers/specs/2026-06-13-collections-design.md](../specs/2026-06-13-collections-design.md)

**Conventions:** app.css tokens; **no AI co-author trailer**; docs same pass. Verify `npm run check` / `npm test` / `npm run build`. The runes store is unit-testable in vitest (proven by `game.svelte.test.ts`).

---

## File Structure
**Create:** `src/data/collections.ts`, `src/data/collections.test.ts`, `src/ui/CollectionsPanel.svelte`.
**Modify:** `src/data/types.ts`, `src/systems/skills.ts` (+`src/systems/skills.test.ts`), `src/systems/SaveManager.ts` (+`.test.ts`), `src/stores/game.svelte.ts` (+`src/stores/game.svelte.test.ts`), `src/ui/GameLayout.svelte`, `src/ui/panels.render.test.ts`, docs.

---

## Task 1: Relic defs + roster (`data/collections.ts`)

**Files:** Create `src/data/collections.ts`, `src/data/collections.test.ts`

- [ ] **Step 1: Write the failing data-integrity test**

`src/data/collections.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { RELICS, RELIC_SETS, RELIC_BY_ID, type RelicRarity } from './collections'

const RARITIES: RelicRarity[] = ['common', 'uncommon', 'rare', 'legendary']

describe('relic data integrity', () => {
  it('has unique ids and a by-id map', () => {
    const ids = RELICS.map(r => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(Object.keys(RELIC_BY_ID).length).toBe(ids.length)
  })
  it('every rarity is non-empty with exactly one guaranteed centrepiece', () => {
    for (const rar of RARITIES) {
      const pool = RELICS.filter(r => r.rarity === rar)
      expect(pool.length).toBeGreaterThan(0)
      expect(pool.filter(r => r.guaranteed).length).toBe(1)
    }
  })
  it('every relic has a positive bonus and a valid effect', () => {
    for (const r of RELICS) {
      expect(r.bonusPct).toBeGreaterThan(0)
      expect(['global', 'engine']).toContain(r.effect)
    }
  })
  it('has one set per rarity with a positive completion bonus', () => {
    for (const rar of RARITIES) {
      const set = RELIC_SETS.find(s => s.rarity === rar)
      expect(set).toBeDefined()
      expect(set!.completionPct).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Run → FAIL** (`npx vitest run src/data/collections.test.ts`) — cannot resolve `./collections`.

- [ ] **Step 3: Create the defs**

`src/data/collections.ts`:
```ts
export type RelicRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export interface Relic {
  id: string
  name: string
  icon: string
  rarity: RelicRarity
  effect: 'global' | 'engine'   // global production or ★ mint
  bonusPct: number
  description: string
  guaranteed?: boolean          // the deterministic centrepiece of its tier
}

export interface RelicSet {
  rarity: RelicRarity
  name: string
  effect: 'global' | 'engine'
  completionPct: number         // bonus for collecting every relic of this rarity
}

export const RELICS: Relic[] = [
  // ── Common (drops on stage prestige) ── +2% each
  { id: 'rl_brass_cog',   name: 'Brass Cog',     icon: '⚙️', rarity: 'common', effect: 'global', bonusPct: 2, guaranteed: true, description: 'The first tooth of the great machine.' },
  { id: 'rl_copper_coin', name: 'Copper Coin',   icon: '🪙', rarity: 'common', effect: 'global', bonusPct: 2, description: 'Worn smooth by a thousand hands.' },
  { id: 'rl_oil_can',     name: 'Oil Can',       icon: '🛢️', rarity: 'common', effect: 'engine', bonusPct: 2, description: 'Keeps the cogs turning sweet.' },
  { id: 'rl_worn_ledger', name: 'Worn Ledger',   icon: '📒', rarity: 'common', effect: 'global', bonusPct: 2, description: 'Every fortune begins as a tally.' },
  { id: 'rl_tin_lantern', name: 'Tin Lantern',   icon: '🏮', rarity: 'common', effect: 'global', bonusPct: 2, description: 'A small light against the ledger-dark.' },
  { id: 'rl_gear_tooth',  name: 'Gear Tooth',    icon: '🦷', rarity: 'common', effect: 'engine', bonusPct: 2, description: 'One tooth, faithfully meshing.' },

  // ── Uncommon (drops on ascension / challenge clear) ── +5% each
  { id: 'rl_legacy_seal',     name: 'Legacy Seal',     icon: '🔰', rarity: 'uncommon', effect: 'global', bonusPct: 5, guaranteed: true, description: 'Pressed into the wax of every inheritance.' },
  { id: 'rl_silver_gear',     name: 'Silver Gear',     icon: '🔩', rarity: 'uncommon', effect: 'global', bonusPct: 5, description: 'Finer than brass, and prouder.' },
  { id: 'rl_ancestral_key',   name: 'Ancestral Key',   icon: '🗝️', rarity: 'uncommon', effect: 'engine', bonusPct: 5, description: 'Opens doors your forebears sealed.' },
  { id: 'rl_heritage_map',    name: 'Heritage Map',    icon: '🗺️', rarity: 'uncommon', effect: 'global', bonusPct: 5, description: 'Charts the long road already walked.' },
  { id: 'rl_inheritance_ring',name: 'Inheritance Ring',icon: '💍', rarity: 'uncommon', effect: 'engine', bonusPct: 5, description: 'Passed down, never sold.' },

  // ── Rare (drops on transcendence) ── +12% each
  { id: 'rl_aether_prism', name: 'Aether Prism',   icon: '🔮', rarity: 'rare', effect: 'global', bonusPct: 12, guaranteed: true, description: 'Splits raw Aether into colour and force.' },
  { id: 'rl_void_shard',   name: 'Void Shard',     icon: '🌑', rarity: 'rare', effect: 'global', bonusPct: 12, description: 'A splinter of the space between.' },
  { id: 'rl_cosmic_lens',  name: 'Cosmic Lens',    icon: '🪞', rarity: 'rare', effect: 'engine', bonusPct: 12, description: 'Focuses the Mill on distant stars.' },
  { id: 'rl_star_ember',   name: 'Starforge Ember',icon: '🔥', rarity: 'rare', effect: 'global', bonusPct: 12, description: 'Still warm from a sun that has set.' },

  // ── Legendary (drops on Reality Reset) ── +25% each
  { id: 'rl_reality_core', name: 'Reality Core',   icon: '💠', rarity: 'legendary', effect: 'global', bonusPct: 25, guaranteed: true, description: 'The seed a universe folds into.' },
  { id: 'rl_omega_sigil',  name: 'Omega Sigil',    icon: 'Ω',  rarity: 'legendary', effect: 'engine', bonusPct: 25, description: 'The last mark, after which nothing.' },
  { id: 'rl_infinity_loom',name: 'Infinity Loom',  icon: '♾️', rarity: 'legendary', effect: 'global', bonusPct: 25, description: 'Weaves the thread that has no end.' },
]

export const RELIC_SETS: RelicSet[] = [
  { rarity: 'common',    name: 'Tinkerer’s Trove',  effect: 'global', completionPct: 5 },
  { rarity: 'uncommon',  name: 'Ancestral Hoard',   effect: 'global', completionPct: 10 },
  { rarity: 'rare',      name: 'Cosmic Reliquary',  effect: 'global', completionPct: 20 },
  { rarity: 'legendary', name: 'Apex Vault',        effect: 'global', completionPct: 40 },
]

export const RELIC_BY_ID: Record<string, Relic> = Object.fromEntries(RELICS.map(r => [r.id, r]))
```

- [ ] **Step 4: Run → PASS** (4 tests). 
- [ ] **Step 5: Commit**
```bash
git add src/data/collections.ts src/data/collections.test.ts
git commit -m "feat(collections): relic + set defs (18 relics, 4 rarity tiers) + integrity tests"
```

---

## Task 2: GameState field + save v13 → v14

**Files:** `src/data/types.ts`, `src/systems/SaveManager.ts`, `src/systems/SaveManager.test.ts`

- [ ] **Step 1: Failing test** — in `SaveManager.test.ts`, change `const CURRENT_VERSION = 13` → `14`; add to the v5-ladder test (after the challenge asserts): `expect(out.collectedRelics).toEqual([])`. Append a new test:
```ts
  it('v13 → v14 seeds collectedRelics and preserves existing', () => {
    const raw = { version: 13, collectedRelics: ['rl_brass_cog'], stages: {} } as unknown as GameState
    const out = migrate(raw)
    expect(out.version).toBe(CURRENT_VERSION)
    expect(out.collectedRelics).toEqual(['rl_brass_cog'])
  })
```

- [ ] **Step 2: Run → FAIL** (`npx vitest run src/systems/SaveManager.test.ts`).

- [ ] **Step 3a:** In `src/data/types.ts`, after `activeChallenge?: string | null` / `challengeSnapshot?: string`:
```ts
  collectedRelics?: string[]    // relic ids collected — permanent meta, survives every reset
```

- [ ] **Step 3b:** In `src/systems/SaveManager.ts`, `CURRENT_VERSION` → `14`; before `raw.version = CURRENT_VERSION` add:
```ts
  // v13 → v14: Collections (relics) — additive.
  if (raw.version < 14) {
    if (raw.collectedRelics === undefined) raw.collectedRelics = []
    raw.version = 14
  }
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit**
```bash
git add src/data/types.ts src/systems/SaveManager.ts src/systems/SaveManager.test.ts
git commit -m "feat(collections): collectedRelics GameState field + save v14 migration"
```

---

## Task 3: Fold relics + set bonuses into `recomputeUpgrades`

**Files:** `src/systems/skills.ts`, `src/systems/skills.test.ts`

- [ ] **Step 1: Failing test** — append to `skills.test.ts`. (Note: `makeState` in that file builds a minimal GameState; pass `collectedRelics`.)
```ts
import { RELICS } from '../data/collections'

describe('recomputeUpgrades — relic fold', () => {
  it('folds a collected global relic into globalMult', () => {
    const cog = RELICS.find(r => r.id === 'rl_brass_cog')!  // +2% global
    const gs = makeState({ collectedRelics: ['rl_brass_cog'] })
    recomputeUpgrades(gs)
    expect(gs.globalMult.toNumber()).toBeCloseTo(1 + cog.bonusPct / 100, 9)
  })
  it('adds the set completion bonus when a whole rarity is collected', () => {
    const commons = RELICS.filter(r => r.rarity === 'common').map(r => r.id)
    const gs = makeState({ collectedRelics: commons })
    recomputeUpgrades(gs)
    // sum of common global bonuses + the common set completionPct (5%)
    const sumPct = RELICS.filter(r => r.rarity === 'common' && r.effect === 'global')
      .reduce((a, r) => a + r.bonusPct, 0) + 5
    expect(gs.globalMult.toNumber()).toBeCloseTo(1 + sumPct / 100, 9)
  })
})
```
(All 6 commons are `effect: 'global'` per Task 1, so the set is global and the math is clean.)

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement.** In `src/systems/skills.ts`:

(a) After the `CHALLENGE_SKILLS` import: `import { RELICS, RELIC_SETS } from '../data/collections'`

(b) Replace the final assignment block (the `gs.globalMult = …` / `gs.engine.engineMult = …` lines) with:
```ts
  // Fold in collected relics + completed rarity-set bonuses (Collections).
  const collected = new Set(gs.collectedRelics ?? [])
  let relicGlobalPct = 0, relicEnginePct = 0
  for (const r of RELICS) {
    if (!collected.has(r.id)) continue
    if (r.effect === 'global') relicGlobalPct += r.bonusPct
    else relicEnginePct += r.bonusPct
  }
  for (const s of RELIC_SETS) {
    const full = RELICS.filter(r => r.rarity === s.rarity).every(r => collected.has(r.id))
    if (full) { if (s.effect === 'global') relicGlobalPct += s.completionPct; else relicEnginePct += s.completionPct }
  }
  const relicGlobalMult = 1 + relicGlobalPct / 100
  const relicEngineMult = 1 + relicEnginePct / 100

  gs.globalMult = D(global * achMult * omegaBonus * relicGlobalMult)
  gs.engine.engineMult = D(engine * aetherBonus * omegaBonus * relicEngineMult)
```

- [ ] **Step 4: Run → PASS** (`npx vitest run src/systems/skills.test.ts`).
- [ ] **Step 5: Full suite** (`npm test`) → green.
- [ ] **Step 6: Commit**
```bash
git add src/systems/skills.ts src/systems/skills.test.ts
git commit -m "feat(collections): fold relic + set bonuses into recomputeUpgrades"
```

---

## Task 4: Store — grantRelic / grantDrop + drop hooks + accessors + tests

**Files:** `src/stores/game.svelte.ts`, `src/stores/game.svelte.test.ts`

- [ ] **Step 1: Imports + freshGameState + accessors + drop constants + grant fns**

(a) After the `import { CHALLENGES, CHALLENGE_BY_ID, … }` line, add:
```ts
import { RELICS, RELIC_BY_ID, type RelicRarity } from '../data/collections'
```
(b) In `freshGameState`, after `activeChallenge: null,`: `collectedRelics: [],`
(c) Near the challenge accessors, add:
```ts
export function collectedRelics() { return gs.collectedRelics ?? [] }
export function relicStats() {
  const c = (gs.collectedRelics ?? []).length
  return { collected: c, total: RELICS.length }
}

// Per-event drop chances (tunable). Guaranteed centrepieces ignore chance.
const RELIC_DROP: Record<RelicRarity, number> = { common: 0.5, uncommon: 0.6, rare: 1.0, legendary: 1.0 }

function grantRelic(id: string): boolean {
  if (!gs.collectedRelics) gs.collectedRelics = []
  if (gs.collectedRelics.includes(id)) return false
  gs.collectedRelics.push(id)
  recomputeUpgrades(gs)
  saveGame(gs).catch(console.error)
  pushToast(`🏺 Relic found: ${RELIC_BY_ID[id]?.name ?? id}`)
  return true
}

/** Roll a relic drop of `rarity`: the guaranteed centrepiece first (deterministic), then a random uncollected one. */
function grantDrop(rarity: RelicRarity, chance: number): boolean {
  const owned = new Set(gs.collectedRelics ?? [])
  const guaranteed = RELICS.find(r => r.rarity === rarity && r.guaranteed && !owned.has(r.id))
  if (guaranteed) return grantRelic(guaranteed.id)
  if (Math.random() < chance) {
    const pool = RELICS.filter(r => r.rarity === rarity && !owned.has(r.id))
    if (pool.length) return grantRelic(pool[Math.floor(Math.random() * pool.length)].id)
  }
  return false
}
```
(`RelicRarity` and `RELICS`/`RELIC_BY_ID` come from the import in (a). `recomputeUpgrades`, `pushToast`, `saveGame` are already in scope.)

- [ ] **Step 2: Hook the five events**

`prestigeStage` — change its body's last line `return economy.prestige(st)` to:
```ts
  const gain = economy.prestige(st)
  if (gain > 0) grantDrop('common', RELIC_DROP.common)
  return gain
```
`ascendStage` — inside `if (gain > 0) { gs.legacyPoints += gain; saveGame(gs).catch(console.error) }`, add a line after `saveGame(...)`:
```ts
    grantDrop('uncommon', RELIC_DROP.uncommon)
```
`transcend` — immediately before its closing `recomputeUpgrades(gs)` (the one before `return true`), add:
```ts
  grantDrop('rare', RELIC_DROP.rare)
```
`realityReset` — immediately before its closing `recomputeUpgrades(gs)`, add:
```ts
  grantDrop('legendary', RELIC_DROP.legendary)
```
`maybeCompleteChallenge` — after `gs = real` and before its `recomputeUpgrades(gs)`, add:
```ts
  grantDrop('uncommon', RELIC_DROP.uncommon)
```
(Each `grantDrop` → `grantRelic` recomputes + saves on a hit, so the surrounding fn's own recompute is just a harmless second pass.)

- [ ] **Step 3: Failing tests** — first extend the **existing top-of-file import** from `'./game.svelte'` to add `prestigeStage` and `collectedRelics` (the file already imports `getState`, `transcend`, `realityReset`, `__resetStoreForTest`, etc.; `D` is imported from `../systems/Decimal`). Then append:
```ts
describe('Collections — drops + persistence', () => {
  it('a stage prestige grants the guaranteed common relic first', () => {
    const g = getState()
    g.collectedRelics = []
    g.stages.village.prestigeCount = 0
    g.stages.village.primaryLifetime = D(1e9)   // ensure prestige yields > 0
    // prestige Village (uses its own k/softcap); just call the store fn
    prestigeStage('village')
    expect(collectedRelics()).toContain('rl_brass_cog')   // the guaranteed common
  })
  it('relics survive transcend and realityReset', () => {
    const g = getState()
    g.collectedRelics = ['rl_brass_cog']
    g.fortuneAllTime = D(1e8)                    // transcend ready (10 Æ)
    transcend()
    expect(collectedRelics()).toContain('rl_brass_cog')
    const g2 = getState()
    g2.aetherLifetime = 2000                     // realityReset ready
    realityReset()
    expect(collectedRelics()).toContain('rl_brass_cog')
  })
})
```
(The guaranteed-common drop is deterministic — `grantDrop` grants the guaranteed centrepiece before any RNG — so this test never depends on `Math.random`.)

- [ ] **Step 4: Run → PASS** (`npx vitest run src/stores/game.svelte.test.ts`). `npm run check` → 0 errors.
- [ ] **Step 5: Commit**
```bash
git add src/stores/game.svelte.ts src/stores/game.svelte.test.ts
git commit -m "feat(collections): grantRelic/grantDrop + drop hooks on the 5 reset events + store tests"
```

---

## Task 5: `CollectionsPanel.svelte`

**Files:** Create `src/ui/CollectionsPanel.svelte`

- [ ] **Step 1: Create the panel**

`src/ui/CollectionsPanel.svelte`:
```svelte
<script lang="ts">
  import { collectedRelics, relicStats } from '../stores/game.svelte'
  import { RELICS, RELIC_SETS, type RelicRarity } from '../data/collections'

  const owned = $derived(new Set(collectedRelics()))
  const stats = $derived(relicStats())
  const tiers: RelicRarity[] = ['common', 'uncommon', 'rare', 'legendary']
  const TIER_LABEL: Record<RelicRarity, string> = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', legendary: 'Legendary' }
  const DROP_SRC: Record<RelicRarity, string> = {
    common: 'drops on stage prestige', uncommon: 'drops on ascension / challenge clear',
    rare: 'drops on transcendence', legendary: 'drops on reality reset',
  }
  function tierRelics(r: RelicRarity) { return RELICS.filter(x => x.rarity === r) }
  function setFor(r: RelicRarity) { return RELIC_SETS.find(s => s.rarity === r)! }
  function setComplete(r: RelicRarity) { return tierRelics(r).every(x => owned.has(x.id)) }
  function ownedCount(r: RelicRarity) { return tierRelics(r).filter(x => owned.has(x.id)).length }
</script>

<div class="col-wrap">
  <header class="col-head frame bracketed">
    <div>
      <h2 class="col-title">⬡ COLLECTIONS</h2>
      <p class="col-sub">Relics drop as you reset the cosmos. Each grants a permanent passive bonus; complete a rarity set for more.</p>
    </div>
    <div class="col-stats">
      <span class="stat-val rel tnum">{stats.collected} / {stats.total}</span>
      <span class="stat-name">relics</span>
    </div>
  </header>

  {#each tiers as tier}
    {@const relics = tierRelics(tier)}
    {@const set = setFor(tier)}
    {@const complete = setComplete(tier)}
    <section class="tier frame">
      <div class="tier-head">
        <h3 class="tier-title r-{tier}">{TIER_LABEL[tier]}</h3>
        <span class="tier-count tnum">{ownedCount(tier)} / {relics.length}</span>
        <span class="tier-set {complete ? 'done' : ''}">Set: +{set.completionPct}% {set.effect === 'engine' ? 'mint' : 'production'} {complete ? '✓' : ''}</span>
      </div>
      <div class="relic-grid">
        {#each relics as r}
          {@const have = owned.has(r.id)}
          <div class="relic {have ? 'have' : 'locked'} r-{tier}" title={have ? r.description : DROP_SRC[tier]}>
            <span class="relic-icon">{have ? r.icon : '❔'}</span>
            <span class="relic-name">{have ? r.name : '???'}</span>
            <span class="relic-bonus">{have ? `+${r.bonusPct}% ${r.effect === 'engine' ? 'mint' : 'prod'}` : DROP_SRC[tier]}</span>
          </div>
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
  .col-wrap { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
  .col-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 18px; border-color: var(--relic, #6fae8f); flex-wrap: wrap; }
  .col-title { font-family: var(--font-display); font-size: 1rem; color: var(--relic, #6fae8f); letter-spacing: 1px; }
  .col-sub { font-family: var(--font-flavor); font-style: italic; font-size: 0.9rem; color: var(--parchment-dim); margin-top: 4px; max-width: 64ch; }
  .col-stats { display: flex; flex-direction: column; align-items: flex-end; }
  .stat-val { font-size: 1.1rem; font-weight: 700; color: var(--brass-bright); }
  .stat-val.rel { color: var(--relic, #6fae8f); }
  .stat-name { font-family: var(--font-flavor); font-style: italic; font-size: 0.74rem; color: var(--parchment-faint); }

  .tier { padding: 14px 16px; border-color: var(--line); display: flex; flex-direction: column; gap: 10px; }
  .tier-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .tier-title { font-family: var(--font-display); font-size: 0.8rem; letter-spacing: 1px; }
  .tier-title.r-common { color: var(--parchment-dim); }
  .tier-title.r-uncommon { color: var(--positive); }
  .tier-title.r-rare { color: var(--aether, #9d5fe3); }
  .tier-title.r-legendary { color: var(--omega, #ffd76b); }
  .tier-count { font-size: 0.78rem; color: var(--parchment-faint); }
  .tier-set { margin-left: auto; font-size: 0.74rem; color: var(--parchment-faint); }
  .tier-set.done { color: var(--brass-bright); }

  .relic-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
  .relic { display: flex; flex-direction: column; gap: 4px; padding: 10px; background: var(--ink-800); border: 1px solid var(--line); border-radius: 5px; }
  .relic.locked { opacity: 0.5; filter: saturate(0.3); }
  .relic.have.r-rare { border-color: color-mix(in srgb, var(--aether, #9d5fe3) 50%, var(--line)); }
  .relic.have.r-legendary { border-color: color-mix(in srgb, var(--omega, #ffd76b) 50%, var(--line)); }
  .relic-icon { font-size: 1.4rem; }
  .relic-name { font-size: 0.8rem; font-weight: 700; color: var(--parchment); }
  .relic-bonus { font-family: var(--font-flavor); font-style: italic; font-size: 0.72rem; color: var(--parchment-dim); }
  @media (max-width: 720px) { .relic-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); } }
</style>
```

- [ ] **Step 2:** `npm run check` → 0 errors.
- [ ] **Step 3: Commit**
```bash
git add src/ui/CollectionsPanel.svelte
git commit -m "feat(collections): add the Collections panel (relic grid by rarity tier)"
```

---

## Task 6: Wire the Collections view + render-smoke

**Files:** `src/ui/GameLayout.svelte`, `src/ui/panels.render.test.ts`

- [ ] **Step 1: GameLayout** —
  (a) after `import ChallengesPanel …`: `import CollectionsPanel from './CollectionsPanel.svelte'`
  (b) add `collectedRelics` to the store import line.
  (c) `View` union: add `| 'collections'`.
  (d) after `const canSeeChallenges = …`: `const canSeeCollections = $derived(collectedRelics().length > 0)`
  (e) nav button after the `{#if canSeeChallenges} … {/if}` block:
```svelte
      {#if canSeeCollections}
        <button class="view-btn rl-btn {view === 'collections' ? 'active' : ''}" onclick={() => view = 'collections'}>⬡ Collections</button>
      {/if}
```
  (f) render branch after the `{:else if view === 'challenges'}` block:
```svelte
  {:else if view === 'collections'}
    <div class="skills-view">
      <CollectionsPanel />
    </div>
```
  (g) nav accent in `<style>` after the `.ch-btn` rules:
```css
  .view-btn.active.rl-btn { background: #2f5e47; color: var(--parchment); font-weight: 700; border-color: var(--relic, #6fae8f); box-shadow: 0 0 10px rgba(111, 174, 143, 0.4); }
  .view-btn.rl-btn:hover:not(.active) { color: var(--relic, #6fae8f); }
```

- [ ] **Step 2: Render-smoke** — in `src/ui/panels.render.test.ts`, add the import `import CollectionsPanel from './CollectionsPanel.svelte'` and a test:
```ts
  it('CollectionsPanel renders the relic tiers', () => {
    const el = render(CollectionsPanel)
    expect(el.textContent).toContain('COLLECTIONS')
    expect(el.textContent).toContain('Legendary')
  })
```

- [ ] **Step 3:** `npm run check` → 0/0; `npm test` → green (incl. the new render-smoke); `npm run build` → succeeds.
- [ ] **Step 4: Commit**
```bash
git add src/ui/GameLayout.svelte src/ui/panels.render.test.ts
git commit -m "feat(collections): wire the Collections view + render-smoke"
```

---

## Task 7: Dev-server smoke

- [ ] `npm run dev`; confirm boots/serves (HTTP 200). The relic-drop loop is exercised by the store tests; a quick manual check: prestige once → 🏺 toast + the ⬡ Collections tab appears with the Brass Cog collected. Stop the server. No commit.

---

## Task 8: Documentation pass

**Files:** `CHANGELOG.md`, `ROADMAP.md`, `README.md`, `CLAUDE.md`

- [ ] **Step 1: CHANGELOG.md** — top of `[Unreleased]`:
```markdown
### Added — Phase 3: Collections (relics) · Save v14
- **Collections** — 18 collectible relics across four rarity tiers that **drop as you reset**: prestige →
  Common, ascension/challenge-clear → Uncommon, transcendence → Rare, reality-reset → Legendary (the
  centrepiece of each tier is a guaranteed first-time drop). Each relic grants a permanent passive global/mint
  %, and completing a rarity set grants a bonus — all folded into `recomputeUpgrades()`.
- **Collections view** ([CollectionsPanel.svelte](./src/ui/CollectionsPanel.svelte)) — a gated `⬡ Collections`
  grid by rarity (collected cards vs locked silhouettes, per-tier set completion). `collectedRelics` is
  permanent meta surviving every reset.
- **Save Version v14** — additive migration seeding `collectedRelics`.
```

- [ ] **Step 2: ROADMAP.md** — change `- 📦 Collections (relics/pets/artifacts/cards) + set bonuses` to:
```markdown
- ✅ **Collections** (relics that drop on resets → passive bonuses + rarity-set bonuses)
```

- [ ] **Step 3: README.md** — add a row:
```markdown
| **Collections (18 relics, rarity sets, drop on resets)** | ✅ live |
```

- [ ] **Step 4: CLAUDE.md** — add to the `data/` tree: `│   ├── collections.ts      18 relic defs (4 rarity tiers) + set bonuses`; to `ui/`: `│   ├── CollectionsPanel.svelte  Collections view: relic grid by rarity tier`; bump SaveManager line + rule #7 `v13` → `v14`; append `/Collections` to the view-switch + SPA-views lines; add a "where systems live" bullet: "**Collections** — relics drop via `grantDrop(rarity, chance)` (guaranteed centrepiece first, then random) hooked into `prestigeStage`/`ascendStage`/`transcend`/`realityReset`/`maybeCompleteChallenge`; `collectedRelics` is permanent and its bonuses + rarity-set bonuses fold into `recomputeUpgrades()`."

- [ ] **Step 5: Commit**
```bash
git add CHANGELOG.md ROADMAP.md README.md CLAUDE.md
git commit -m "docs: record the Collections system - save v14"
```

---

## Task 9: Final verification

- [ ] `npm run check` → 0/0 · `npm test` → all green (collections integrity, v14 migration, relic fold, drop/persistence, render-smoke) · `npm run build` → ✓ · `git status --short` → clean.

---

## Verification checklist (acceptance)
- [ ] `npm run check` 0/0 · `npm test` green · `npm run build` ✓
- [ ] Data integrity (unique ids, one guaranteed per tier); relic + set fold into globalMult/engineMult
- [ ] Drops fire on the 5 events (guaranteed-first, no dupes); relics survive transcend + realityReset; v14 migration
- [ ] Collections view gated on first relic; mounts; relic grid + set completion render
- [ ] Docs updated; no AI co-author trailer
```
