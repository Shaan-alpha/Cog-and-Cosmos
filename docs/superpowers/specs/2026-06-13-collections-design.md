# Collections — Design Spec

**Date:** 2026-06-13
**Status:** Approved (brainstorm) — pending implementation plan
**Feature:** Phase 3 content/depth — collectible relics that drop on prestige-stack events and grant permanent passive bonuses, with rarity-tier set bonuses.

---

## 1. Goal & context

Add a **Collections** layer: relics the player accrues by performing the resets the game already revolves around. Each relic grants a small permanent passive multiplier; completing a rarity tier grants a set bonus. It deepens the long game and rewards repeated prestiging without a new currency or external infra.

**Established patterns reused:**
- Data-driven defs like [`data/achievements.ts`](../../../src/data/achievements.ts) (`{ id, … }`).
- Bonuses folded into [`recomputeUpgrades()`](../../../src/systems/skills.ts) (same place achievements/Æ/Ω fold).
- Permanent meta fields that survive every reset (like `medals`, `completedChallenges`).
- Gated SPA view + panel in `GameLayout`; additive save migration; store-integration + render-smoke tests.
- Gameplay RNG already exists ([`game.svelte.ts` `Math.random() < risk`](../../../src/stores/game.svelte.ts)) — random drops fit the codebase; dropped IDs persist in the save, so there's no determinism concern.

---

## 2. Decisions locked in brainstorm

- **Acquisition (Q1): drops on prestige-stack events.** Rolling for relics when you prestige / ascend / transcend / reality-reset / clear a challenge; deeper resets roll rarer tiers. A few **guaranteed** relics drop deterministically on first occurrences so the system always reveals itself.
- **Sets (Q2): rarity tiers.** Relics group into **Common / Uncommon / Rare / Legendary**, matching the drop pools. Each relic gives its own small bonus; collecting *all* relics of a rarity completes that set for an extra bonus.
- Each relic's bonus is a rarity-scaled **global production** or **★ mint** %, folded into `recomputeUpgrades`. **All collected relics are always-active** (no equipping).

---

## 3. State & save migration (v13 → v14)

### GameState (`src/data/types.ts`)
One additive field (beside `completedChallenges`):
```ts
collectedRelics?: string[]   // relic ids collected — PERMANENT meta, survives every reset
```

### Migration (`src/systems/SaveManager.ts`)
- `CURRENT_VERSION` 13 → **14**; `RESET_BELOW_VERSION` stays 5.
- Additive `v13 → v14`: seed `collectedRelics = []` when undefined.

### Persistence
`collectedRelics` is a top-level field that the prestige/ascension/transcend/Ω/challenge wipes never touch (they reset stages/skills/specific fields only). So relics persist through everything automatically — and because drops happen *during* those events, the granted relic lands on the surviving field.

---

## 4. Relic definitions (`src/data/collections.ts`)

```ts
export type RelicRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export interface Relic {
  id: string
  name: string
  icon: string
  rarity: RelicRarity
  effect: 'global' | 'engine'   // global production or ★ mint
  bonusPct: number              // this relic's own passive bonus
  description: string
  guaranteed?: boolean          // the one deterministic centrepiece of its tier
}

// One set per rarity; completing the whole tier grants this extra bonus.
export interface RelicSet { rarity: RelicRarity; name: string; effect: 'global' | 'engine'; completionPct: number }
```

**Roster: ~18 relics** — Common 6, Uncommon 5, Rare 4, Legendary 3. Rarity-scaled magnitudes (placeholders, tunable):
| Rarity | per-relic `bonusPct` | set `completionPct` | drops on |
|---|---|---|---|
| common | +2% | +5% | stage prestige |
| uncommon | +5% | +10% | ascension (+ challenge clear) |
| rare | +12% | +20% | transcendence |
| legendary | +25% | +40% | reality reset (Ω) |

Exactly **one `guaranteed: true` relic per rarity** (4 total) — the deterministic centrepiece granted on the first event of that tier.

---

## 5. Acquisition (store, `src/stores/game.svelte.ts`)

```
grantRelic(id):                      // collect one relic + recompute + persist + toast
  if gs.collectedRelics already has id → return false
  push id; recomputeUpgrades(gs); saveGame(gs); pushToast(`🏺 Relic found: ${name}`)
  return true

grantDrop(rarity, chance):           // called on a qualifying event
  // 1) guaranteed centrepiece first (deterministic — the player reliably gets it)
  const g = RELICS.find(r => r.rarity===rarity && r.guaranteed && !collected.has(r.id))
  if (g) { grantRelic(g.id); return }
  // 2) otherwise a chance to grant a random uncollected relic of this rarity
  if (Math.random() < chance) {
    const pool = RELICS.filter(r => r.rarity===rarity && !collected.has(r.id))
    if (pool.length) grantRelic(pool[Math.floor(Math.random()*pool.length)].id)
  }
```

**Hooks** (drop chances are tunable constants in the store):
| Store fn | call | notes |
|---|---|---|
| `prestigeStage` (on success, gain>0) | `grantDrop('common', ~0.5)` | mutates `gs` in place |
| `ascendStage` (on success) | `grantDrop('uncommon', ~0.6)` | mutates `gs` in place |
| `transcend` (on success) | `grantDrop('rare', 1.0)` | before the fn's final `recomputeUpgrades` |
| `realityReset` (on success) | `grantDrop('legendary', 1.0)` | before the fn's final `recomputeUpgrades` |
| `maybeCompleteChallenge` (after `gs = real`) | `grantDrop('uncommon', ~0.5)` | operates on the restored save |

> Because `grantRelic` recomputes + saves itself, the per-event hook needs no extra bookkeeping. The first prestige's guaranteed-common drop is what unlocks the Collections view (§7) — so the player meets the system on their first reset. transcend/Ω roll the guaranteed rare/legendary on first occurrence, then random thereafter.

---

## 6. Bonus fold (`src/systems/skills.ts` `recomputeUpgrades`)

After the existing folds, add the relic contribution:
```
relicGlobalPct = Σ collected relics with effect 'global' (bonusPct)
              + Σ completed rarity-sets with effect 'global' (completionPct)
relicEnginePct = same for effect 'engine'
relicGlobalMult  = 1 + relicGlobalPct / 100
relicEngineMult  = 1 + relicEnginePct / 100
gs.globalMult        = D(global * achMult * omegaBonus * relicGlobalMult)
gs.engine.engineMult = D(engine * aetherBonus * omegaBonus * relicEngineMult)
```
A rarity-set is "completed" when every relic of that rarity is in `collectedRelics`. All collected relics are always-active. Base 1 → no relics = ×1.

---

## 7. UI (`src/ui/CollectionsPanel.svelte` + gated `'collections'` view)

- A grid grouped by rarity tier (Common → Legendary). Collected relics show a card (icon, name, bonus); uncollected show a **locked silhouette** with its drop source ("drops on Transcendence"). Each tier shows a **completion bar** (`n / total`) + its set bonus (greyed until complete).
- Header: total collected `n / 18`, and the summed live relic multiplier.
- **GameLayout:** add `'collections'` to the `View` union, an import, a gated nav button **⬡ Collections** shown when `canSeeCollections = collectedRelics().length > 0`, and an `{:else if view === 'collections'}` branch. Accent color via a `--relic` CSS var (inline fallback, like `--omega`/`--challenge`).
- Accessors: `collectedRelics()`, plus a small `relicStats()` (counts + live mult) for the header if convenient.

---

## 8. Testing

- `collections.test.ts` — data integrity: unique ids; each rarity non-empty; exactly one `guaranteed` per rarity; all `bonusPct`/`completionPct` > 0; every `effect` ∈ {global, engine}.
- `skills.test.ts` — `recomputeUpgrades` folds collected relics into `globalMult`/`engineMult`; a completed rarity set adds its `completionPct`.
- `game.svelte.test.ts` — `grantDrop` grants the guaranteed centrepiece first, then a random uncollected relic; never duplicates; pool-exhaust is a no-op; a relic **survives `transcend` and `realityReset`**; first-transcend grants the guaranteed rare.
- `SaveManager.test.ts` — v13 → v14 seeds `collectedRelics` and preserves existing fields.
- `panels.render.test.ts` — CollectionsPanel mounts.
- Acceptance: `npm run check` 0/0 · `npm test` green · `npm run build`.

> RNG in tests: `grantDrop`'s guaranteed branch is deterministic (no RNG) — assert that directly. For the random branch, drive `grantRelic(id)` directly (it's the deterministic unit), and test `grantDrop` with `chance = 1` against a pool that has only the targeted relics left, so the outcome is determinate without stubbing `Math.random`.

---

## 9. Out of scope (deferred)

Relic equipping/loadouts (all collected are always-active), relic leveling/fusion/upgrading, trading, animated drop-reveal cutscenes, pity counters, per-stage themed sets, and relics that affect non-multiplier stats (offline cap, prestige gain, etc.).
