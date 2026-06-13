# Challenges — Design Spec

**Date:** 2026-06-13
**Status:** Approved (brainstorm) — pending implementation plan
**Feature:** Phase 3 retention system — restricted runs that grant **Medals**, spent on a Challenge skill tree.

---

## 1. Goal & context

The prestige stack is complete (Prestige → Ascension → Transcendence → Reality Reset). Challenges add a **replayability layer**: optional restricted runs with a goal. Clearing one grants **Medals (🎖️)**, a currency spent on a dedicated **Challenge tree** that folds into the existing `recomputeUpgrades()` multiplier pipeline.

**Existing patterns reused:**
- **Data-driven defs** like `data/achievements.ts` (`{ id, check(gs), … }`).
- **Skill tree** = `SkillNode[]` folded into `recomputeUpgrades()` ([systems/skills.ts](../../../src/systems/skills.ts)) — same as Global/Ascension/Transcendence/Omega trees.
- **Save snapshot** via `exportSave(state): string` / `importSave(blob): GameState | null` ([systems/SaveManager.ts](../../../src/systems/SaveManager.ts)); `importSave` already decompresses + revives Decimals + migrates.
- **SPA view** pattern in `GameLayout.svelte` with a gated nav button.
- **`freshGameState()`** ([stores/game.svelte.ts](../../../src/stores/game.svelte.ts)) for a clean starting state.

---

## 2. Decisions locked in brainstorm

- **Enter/exit (Q1): snapshot-and-restore.** Entering stashes the real save and drops the player into a fresh restricted run; exiting restores the stash (and grants the reward if completed). Normal progress is never at risk. The challenge run starts from a fresh state — meta multipliers are **not** carried in, so the restriction defines the difficulty.
- **Reward (Q2): currency + tree.** Completing a challenge grants **Medals**; Medals buy nodes on a Challenge tree that folds into `recomputeUpgrades()`. `completedChallenges` is just the cleared-set (gating + UI + prevents double-reward); the production boost comes from spending Medals on the tree.
- **One active challenge at a time**; re-entering is blocked while `activeChallenge` is set.
- **Unlock gate:** the Challenges view appears after the player's **first Ascension** (`completedChallenges.length > 0 || any stage ascensionCount ≥ 1`) — mid-game, when meta systems are open.
- **Revision (post-approval): `disabledStages` dropped.** The stage-unlock chain is linear and gated on each stage's lifetime output (Mine needs `farm.primaryLifetime ≥ 5000`, Factory needs Mine, …), so a disabled/non-producing early stage permanently soft-locks every downstream unlock — making any goal past it unreachable. v1 ships **4 challenges** using only restrictions that *slow* the climb without gating it (`noAutoBuy`, `noBindings`, `prodMult`, `noPrestige`). A future "disable a mechanic" restriction would need to target a non-gating system (e.g. the Fortune Engine) — deferred.

---

## 3. State & save migration (v12 → v13)

### GameState additions ([src/data/types.ts](../../../src/data/types.ts)) — all optional, additive
```ts
medals?: number               // Challenge currency — spent on the Challenge (ch:*) tree
completedChallenges?: string[] // ids cleared (permanent; gates tree/roster, prevents double reward)
activeChallenge?: string | null // id of the in-progress restricted run, else null/undefined
challengeSnapshot?: string     // compressed real-save blob, present ONLY during a challenge run
```
Challenge-tree node levels live in `gs.skills` under the `ch:` prefix.

### Migration ([src/systems/SaveManager.ts](../../../src/systems/SaveManager.ts))
- `CURRENT_VERSION` 12 → **13**; `RESET_BELOW_VERSION` stays 5.
- Additive `v12 → v13` step: seed `medals = 0`, `completedChallenges = []`, `activeChallenge = null` when undefined. (`challengeSnapshot` stays undefined.)

### Persistence through resets
`transcend()` and `realityReset()` rebuild `gs.skills` keeping only `tr:*` (and `om:*`). **Add `ch:*` to those keep-lists** so the Challenge tree survives. `medals` and `completedChallenges` are meta and are **never** reset by any prestige (they live on the real save and are only ever touched on challenge completion).

> **Edge case:** a fresh challenge run is built from `freshGameState()`, so it has no `ch:*` skills, `medals 0`, `completedChallenges []` — a pure restricted climb. The real `medals`/`completedChallenges`/`ch:*` come back on restore.

---

## 4. Challenge definitions (`src/data/challenges.ts`)

Data-driven, mirroring `achievements.ts`:

```ts
export interface ChallengeRestriction {
  noAutoBuy?: boolean        // auto-buyers disabled
  noBindings?: boolean       // cross-stage binding multipliers forced to 1
  prodMult?: number          // flat global production multiplier (e.g. 0.5)
  noPrestige?: boolean       // stage prestige disabled
}

export interface Challenge {
  id: string
  name: string
  icon: string
  description: string
  restriction: ChallengeRestriction
  goalLabel: string                 // human text of the win condition
  check: (gs: GameState) => boolean // win condition, evaluated on the challenge-run state
  medalReward: number               // Medals granted on completion
  requires?: string[]               // challenge ids that must be completed first (gating)
}
```

### v1 roster (4)
| id | name | restriction | goal (`check`) | medals | requires |
|---|---|---|---|---|---|
| `spartan_cogs` | Spartan Cogs | `noAutoBuy` | `village.primaryLifetime ≥ 1e9` | 1 | — |
| `broken_chain` | Broken Chain | `noBindings` | `mine.unlocked` | 2 | — |
| `half_measures` | Half Measures | `prodMult:0.5` | `engine.fortuneLifetime ≥ 100` | 3 | — |
| `purist` | Purist | `noPrestige` + `noAutoBuy` | `village.primaryLifetime ≥ 1e12` | 3 | `['spartan_cogs']` |

(`check` uses `Decimal.gte`/`.unlocked` against the run state, exactly like achievement checks.)

---

## 5. Restriction hooks (the implementation surface)

A single store helper exposes the active restriction:
```ts
function activeChallengeRestriction(): ChallengeRestriction | null  // null when not in a challenge
```
Read at these points (each a small guard):
1. **`stepSim` per-stage loop** — `if (restriction?.noAutoBuy)` → skip the `autoBuyTick` branch.
2. **`bindingMultFor()`** — `if (restriction?.noBindings) return ONE` (before computing rule multipliers + duplication).
3. **`effGlobalMult(state)`** — multiply by the active challenge's `prodMult ?? 1`, read from the *passed state* (so it applies both in the live loop and offline).
4. **`prestigeStage()`** — `if (activeChallengeRestriction()?.noPrestige) return 0` (and the panel disables the prestige button while a challenge is active).

> All four restrictions only *slow* the climb — none gates the linear unlock chain — so no `checkUnlocks` guarding is needed. The win-check (§6) is still called from `checkUnlocks`.

---

## 6. Enter / win / abandon (store fns, `stores/game.svelte.ts`)

```
enterChallenge(id): boolean
  if gs.activeChallenge return false        // one at a time
  const def = CHALLENGE_BY_ID[id]; if !def return false
  if def.requires?.some(r => !(gs.completedChallenges ?? []).includes(r)) return false  // gating
  // (repeats are allowed — re-entering a cleared challenge is fine; it just grants no new Medals)
  const blob = exportSave(gs)               // real save (activeChallenge is null here)
  const run = freshGameState()
  run.activeChallenge = id
  run.challengeSnapshot = blob
  gs = run; recomputeUpgrades(gs); saveGame(gs)
  return true

// win-check — called from checkUnlocks() each frame while a challenge is active
maybeCompleteChallenge():
  if !gs.activeChallenge return
  const def = CHALLENGE_BY_ID[gs.activeChallenge]
  if !def or !def.check(gs) return
  const earned = def.medalReward, id = def.id, blob = gs.challengeSnapshot
  const real = blob ? importSave(blob) : null
  if !real { /* fail-safe: just clear activeChallenge */ gs.activeChallenge = null; return }
  if (!real.completedChallenges) real.completedChallenges = []
  if (!real.completedChallenges.includes(id)) { real.completedChallenges.push(id); real.medals = (real.medals ?? 0) + earned }
  real.activeChallenge = null
  delete real.challengeSnapshot
  gs = real; recomputeUpgrades(gs); saveGame(gs)
  pushToast(`🎖️ Challenge complete: ${def.name} (+${earned} Medals)`)

abandonChallenge():
  if !gs.activeChallenge return
  const real = gs.challengeSnapshot ? importSave(gs.challengeSnapshot) : null
  if !real return            // nothing to restore → stay put (shouldn't happen)
  real.activeChallenge = null; delete real.challengeSnapshot
  gs = real; recomputeUpgrades(gs); saveGame(gs)
```

> `gs = real` reassigns the reactive store root; this mirrors how `loadGame()` swaps `gs` on load (the established mechanism for replacing whole state). The plan must follow `loadGame`'s exact reassignment idiom so Svelte reactivity holds.

### Challenge-tree skill fns (mirror the Omega trio)
`challengeSkillCostFor(id)`, `challengeSkillStatus(id)`, `buyChallengeSkill(id)` — spend `gs.medals`, use `CHALLENGE_BY_ID_TREE` (the `ch:*` map). Accessors: `medals()`, `completedChallenges()`, `activeChallenge()`.

---

## 7. Reward tree (`src/data/skills/challenge.ts`, ~4 nodes)

`SkillNode` shape; `effect` `'global'`/`'engine'`; spent in Medals; folded by adding `CHALLENGE_SKILLS` to the `recomputeUpgrades` loop (same line that lists Global/Ascension/Transcendence/Omega). Persists through all resets (`ch:*` kept).

| id | tier | effect | perLvl | max | baseCost (Medals) | growth |
|---|---|---|---|---|---|---|
| `ch:proven` | 0 | global | 0.25 | 5 | 2 | 1.8 |
| `ch:tempered` | 1 | engine | 0.25 | 5 | 3 | 1.8 |
| `ch:relentless` | 1 | global | 0.40 | 3 | 4 | 2.0 |
| `ch:crucible` | 2 | global | 1.00 | 1 | 8 | 1.0 |

(Costs/values tunable; Medals are scarce so costs are small integers.)

---

## 8. UI (`src/ui/ChallengesPanel.svelte` + `'challenges'` view)

- **Active run** → a banner: challenge name, restriction summary, `goalLabel` + live progress, and an **Abandon** button (confirm dialog).
- **Not in a run** → the roster (cards: available / locked-by-`requires` / completed ✓ with **Enter** button + confirm dialog), the Medal count, and the Medal tree (tiered nodes, same component shape as `OmegaPanel`'s tree).
- **GameLayout**: add `'challenges'` to the `View` union, an import, a gated nav button (`⚔ Challenges`) shown when `canSeeChallenges`, and an `{:else if view === 'challenges'}` branch. While `activeChallenge` is set, other nav buttons remain usable (the player can watch stages climb), but **the prestige/transcend/omega actions that conflict with the run are blocked** (noPrestige restriction; entering another challenge blocked).
- `canSeeChallenges = !!activeChallenge() || completedChallenges().length > 0 || anyStageAscended()`. The `activeChallenge()` clause is **essential**: during a run the state is fresh (no ascensions/completions), so without it the nav button would vanish mid-challenge and strand the player with no way to Abandon.

---

## 9. recompute fold (`systems/skills.ts`)

Add `CHALLENGE_SKILLS` to the tree loop (alongside the other four). No separate currency math — the `ch:*` nodes' `effectPerLevel` fold into `global`/`engine` automatically. Register a `CHALLENGE_TREE_BY_ID` map for the store skill fns.

---

## 10. Testing

- `challenges.test.ts` (new) — each challenge `check(gs)` predicate against crafted minimal states (true/false cases).
- `SaveManager.test.ts` — v12→v13 migration seeds `medals`/`completedChallenges`/`activeChallenge` and preserves existing fields.
- `skills.test.ts` — `recomputeUpgrades` folds `ch:*` levels into `globalMult`/`engineMult`.
- Snapshot enter/restore + restriction hooks are store-level (runes) → **dev-server smoke test** (boot, enter a challenge, verify the restriction applies, hit the goal, confirm restore + Medals; abandon path).
- Acceptance: `npm run check` 0/0 · `npm test` green · `npm run build`.

---

## 11. Out of scope (deferred)

- Time-limited / endless / scaling challenges (needs timer + scaling infra).
- Bespoke per-challenge functional unlocks.
- A dedicated Challenge sound/animation (reuse existing SFX).
- Repeatable-for-stacking-reward challenges (each grants Medals once; re-entering for practice is allowed but yields no extra Medals).
