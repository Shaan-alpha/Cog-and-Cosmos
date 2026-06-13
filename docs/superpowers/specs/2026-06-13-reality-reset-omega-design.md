# Reality Reset (Ω) — Design Spec

**Date:** 2026-06-13
**Status:** Approved (brainstorm) — pending implementation plan
**Feature:** The fourth and final meta-prestige layer, sitting above Transcendence.

---

## 1. Goal & context

Cog & Cosmos has a four-tier prestige stack. Three tiers ship today:

1. **Prestige** (per-stage) → Renown/Heritage/… ; sqrt gain; `+25%/level` `productionMult`.
2. **Ascension** (per-stage deep reset) → **Legacy Points (LP)**; `^0.33` gain; LP tree.
3. **Transcendence** (global reset) → **Aether (Æ)**; `floor(5·log10(1+F/1e6))` gain; Æ passive-mints ★ (`+5%/Æ`); 4-node Æ tree.

This spec adds the top tier:

4. **Reality Reset (Ω)** — a brutal global reset *above* Transcendence that mints **Omega (Ω)** and grants a permanent multiplier to both production and ★ mint, plus a small Ω skill tree.

**Design principle (the chosen approach):** mirror the Transcendence layer one tier up. Reuse the exact same plumbing — the single `recomputeUpgrades()` fold-point, the `transcend()` reset shape, the `SkillNode` tree shape, and the additive save-migration pattern. No new architectural machinery. This is the lowest-risk, maximally-consistent path and keeps every derived multiplier save-safe.

MASTER_PLAN §"Master Formula Sheet" #13 sketches the layer:
`Omega_gain = floor((totalAetherEverEarned / 1e3)^(1/3))`, `Ω_QoLmult = 1 + 0.10·totalOmega`.

---

## 2. Decisions locked in brainstorm

- **Reset scope (Q1):** Ω wipes everything Transcendence wipes **plus** the spent Aether pool (`aether → 0`) and `transcendCount → 0`. It **keeps** the purchased Æ skill-tree levels (`tr:*`), `aetherLifetime`, and `fortuneAllTime`. (Consistent with the Æ tree surviving a Transcend.)
- **Reward & scope (Q2):** a passive `+10%/Ω` to **both** global production and ★ mint, **plus** a ~4-node Ω tree. **New-Game+ modifiers are deferred** to a separate future feature.
- **Gain driver:** `aetherLifetime` (total Æ ever earned) — it persists across Ω resets and keeps growing as the player Transcends, so the Ω loop is: Ω-reset → Transcend repeatedly (raising `aetherLifetime`) → eventually `deserved` Ω rises → Ω-reset again.
- **Passive-mult tradeoff:** the `+10%/Ω` bonus tracks the **current `omega` pool** (not all-time), exactly like the Æ `+5%` bonus tracks `gs.aether`. Spending Ω on its tree trades passive mult for tree power — a deliberate, consistent decision.
- **Unlock gate:** mirror `canSeeTrans`. Self-gating — reaching ≥1 Ω requires substantial cumulative Æ, so no separate hard gate is needed.

---

## 3. State & save migration

### GameState additions (`src/data/types.ts`)
All optional, additive (placed beside the existing Æ fields `aether?/aetherLifetime?/transcendCount?/fortuneAllTime?`):

```ts
omega?: number          // Ω pool — spendable on the Ω tree AND drives the +10%/Ω passive mult
omegaLifetime?: number  // total Ω ever earned — used to compute each reset's increment
omegaCount?: number     // number of Reality Resets performed — gate + stats
```

### Migration (`src/systems/SaveManager.ts`)
- `CURRENT_VERSION` 11 → **12**. `RESET_BELOW_VERSION` stays 5 (no wipe).
- Add an additive `v11 → v12` step seeding `omega`, `omegaLifetime`, `omegaCount` to `0` when undefined (same shape as the v9→v10 Aether step).

---

## 4. Gain curve & passive power

### `src/systems/formulas.ts` — new pure fn
```ts
// Reality Reset gain (cube-root: brutal, deliberate). L = om:reality_multiplier level.
// total = floor( (aetherEverEarned / 1e3)^(1/3) * (1 + 0.15*L) )
export const OMEGA_SOFTCAP = 1e3
export function omegaGain(aetherLifetime: number, multLevel = 0): number {
  if (aetherLifetime <= 0) return 0
  const base = Math.pow(aetherLifetime / OMEGA_SOFTCAP, 1 / 3)
  return Math.floor(base * (1 + 0.15 * multLevel))
}
```
(Aether counts are plain `number`, like the existing Æ math — no Decimal needed at these magnitudes.)

### `recomputeUpgrades()` (`src/systems/skills.ts`) — fold in
Add `OMEGA_SKILLS` to the tree loop (alongside `GLOBAL_SKILLS`, `ASCENSION_SKILLS`, `TRANSCENDENCE_SKILLS`), then:
```ts
const omegaBonus = 1 + 0.10 * (gs.omega ?? 0)
gs.globalMult       = D(global * achMult * omegaBonus)
gs.engine.engineMult = D(engine * aetherBonus * omegaBonus)
```
So Ω multiplies **both** channels. Base remains 1 → zero Ω = ×1 (no effect).

---

## 5. Ω skill tree (`src/data/skills/omega.ts`)

Reuses the `SkillNode` type from `data/skills/global.ts`; `effect` is `'global'` or `'engine'`; folds into the same recompute; spent in Ω; **survives the Ω reset** (like `tr:*`). Constants are placeholders, tunable later.

| id | tier | effect | effectPerLevel | maxLevel | baseCost | costGrowth | description |
|---|---|---|---|---|---|---|---|
| `om:foundation` | 0 | global | 0.50 | 5 | 3 | 2.0 | +50%/lvl global production. Survives Reality Reset. |
| `om:reality_multiplier` | 1 | global | 0 | 5 | 6 | 2.2 | +15%/lvl future Ω gain (read in `omegaPreview`). Requires `om:foundation`. |
| `om:mint_resonance` | 1 | engine | 0.50 | 5 | 6 | 2.2 | +50%/lvl ★ mint. Requires `om:foundation`. |
| `om:eternal_engine` | 2 | global | 0 | 1 | 12 | 1.0 | Autobuyers + Fortune Engine slots persist through Reality Reset. Requires `om:reality_multiplier`. |

`om:reality_multiplier` and `om:eternal_engine` use `effectPerLevel: 0` (no direct mult); their effects are read explicitly in `omegaPreview()` / `realityReset()` — same idiom as `tr:trans_multiplier` / `tr:meta_automation`.

Register in `skills.ts`: `OMEGA_BY_ID` map + include `OMEGA_SKILLS` in the recompute loop.

---

## 6. Reset logic — `realityReset()` (clone of `transcend()`)

New store fns in `src/stores/game.svelte.ts`, structurally identical to the transcend block:

```
omegaPreview(): { omegaGained, totalOmega, ready }
  L          = gs.skills['om:reality_multiplier'] ?? 0
  deserved   = omegaGain(gs.aetherLifetime ?? 0, L)
  pending    = max(0, deserved - (gs.omegaLifetime ?? 0))
  → { omegaGained: pending, totalOmega: (gs.omega ?? 0) + pending, ready: pending > 0 }

realityReset(): boolean
  if !omegaPreview().ready return false
  playTranscend()                              // reuse SFX for v1
  metaActive = (gs.skills['om:eternal_engine'] ?? 0) >= 1
  if metaActive: snapshot per-stage autobuy settings + Engine slots
  WIPE:  every stage → freshState() (unlocked = sid==='village')
         Engine → fresh (restore slots if metaActive)
         legacyPoints = 0
         activeEnchants = []; spaceBuffers = {ore,power:0}
         warp = {charges: WARP_BASE_CHARGE_CAP, recharge:0}
         multiverse = {branchSlots:[]}; convergenceMult = ONE
         aether = 0; transcendCount = 0
  SKILLS: nextSkills = kept tr:* levels + kept om:* levels   (wipe global + ascension)
  SEED:   Village primary reuses transcend()'s exact seeding logic — honor the
          (persisting) tr:start_boost level if owned, else default D(15)
  Ω STATE: omegaCount++; omega += pending; omegaLifetime += pending
  recomputeUpgrades(gs); saveGame(gs)
  return true
```

Note: Village seeding is identical to `transcend()` — since `tr:*` (including `tr:start_boost`) persists through Ω, an owned Start Boost still seeds Village; otherwise the default `D(15)`. There is **no dedicated Ω start node** in the v1 4-node tree (kept tight).

### Skill-purchase fns (mirror the transcend trio)
`omegaSkillCostFor(id)`, `omegaSkillStatus(id)`, `buyOmegaSkill(id)` — identical to `transcSkillCostFor` / `transcSkillStatus` / `buyTranscendenceSkill`, but reading/spending `gs.omega` and using `OMEGA_BY_ID`.

### Accessors (for UI `$derived`)
`omega()`, `omegaCount()`, `omegaLifetime()`.

---

## 7. UI

- **`src/ui/OmegaPanel.svelte`** — clone of `TranscendencePanel.svelte`: shows Ω pool / count, gain preview, the dynamic reset preview (what will be wiped/kept), a reset button, and the Ω tree. Wording reflects Q1 (wipes Æ pool, keeps Æ tree). Uses existing app.css design tokens; per-stage accent for the Ω layer.
- **`src/ui/GameLayout.svelte`** — add `'omega'` to the `View` union; add a gated nav button after Transcendence:
  ```svelte
  {#if canSeeOmega}
    <button ... onclick={() => view = 'omega'}>Ω Reality</button>
  {/if}
  ```
  with `const canSeeOmega = $derived(omegaCount() > 0 || omegaPreview().omegaGained > 0)`, and an `{:else if view === 'omega'}` branch rendering `OmegaPanel`.

---

## 8. Docs (same pass — operating rule #2)

- **CHANGELOG.md** — `Added — Phase 3: Reality Reset (Ω) · Save v12`.
- **ROADMAP.md** — Reality Reset (Ω) `📦 → ✅`; note the meta-prestige stack is complete.
- **README.md** — move the Reality Reset (Ω) row from `🔜 roadmap` to `✅ live`.
- **CLAUDE.md** + **AGENTS.md** — change "only Reality Reset Ω remains roadmap" → all meta-layers live; save version v11 → **v12**; add `skills/omega.ts`, `OmegaPanel.svelte`, and the `omega` view to the architecture map + the "where systems live" notes.
- **MASTER_PLAN.md** — annotate sheet #13 with the shipped constants (gain `(aetherLifetime/1e3)^(1/3)·(1+0.15·L)`, passive `1+0.10·Ω` on global & mint).

---

## 9. Testing

Follow the existing pure-core test pattern (`*.test.ts` in `systems/`):
- `formulas.test.ts` — `omegaGain`: zero/▷threshold/known-value cases, `multLevel` scaling, `floor` behaviour.
- `SaveManager.test.ts` — v11→v12 migration seeds `omega/omegaLifetime/omegaCount` and preserves existing fields.
- A focused store-level characterization (where feasible) for `realityReset()`: wipes the live game + Æ pool, keeps `tr:*`/`om:*`/`aetherLifetime`, credits Ω; and `recomputeUpgrades` applies `omegaBonus` to both `globalMult` and `engineMult`.

Acceptance: `npm run check` (0/0), `npm test` (all green incl. new cases), `npm run build`.

---

## 10. Out of scope (deferred)

- New-Game+ modifiers (permanent toggles) — their own subsystem/spec.
- Ω-specific achievements.
- A bespoke Ω sound/animation (reuse `playTranscend` for v1).
- Balance tuning beyond the placeholder constants here.
- An Ω-specific Pixi scene.
