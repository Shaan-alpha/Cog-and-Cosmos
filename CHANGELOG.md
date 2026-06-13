# Changelog

All notable changes to **Cog & Cosmos — The Fortune Engine** are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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

### Added — Phase 3: Reality Reset (Ω) meta-layer · Save v12
- **Reality Reset (Ω)** — the fourth and final meta-prestige layer, above Transcendence. A brutal
  global reset that mints **Omega (Ω)** from all-time Aether (`floor(cbrt(aetherLifetime/1e3) · (1+0.15·L))`),
  granting a permanent **+10% to both global production and ★ mint per Ω**. Wipes the live game **and** the
  Aether pool + transcend count; keeps the Aether tree, `aetherLifetime`, `fortuneAllTime`, and the Ω layer.
- **Reality (Ω) tree** ([omega.ts](./src/data/skills/omega.ts)) — 4 nodes (Reality Foundation +50%/lvl global,
  Reality Multiplier +15% Ω gain/lvl, Mint Resonance +50%/lvl mint, Eternal Engine — persist autobuyers +
  Engine slots through the reset). Folds into the same `recomputeUpgrades()` pass, so it's save-safe.
- **Reality Reset view** ([OmegaPanel.svelte](./src/ui/OmegaPanel.svelte)) — gated `Ω Reality` SPA view with
  the collapse altar (lost/kept), gain preview, and the Ω tree.
- **Save Version v12** — additive migration seeding `omega`, `omegaLifetime`, `omegaCount` (no reset).

### Changed — Codebase audit: toolchain upgrade, test suite & structural refactor
A full audit/refine pass. No gameplay or balance changes — behaviour is pinned by a
new test suite and verified unchanged throughout.

- **Toolchain upgraded to Vite 8.** Vite 5 → 8, `@sveltejs/vite-plugin-svelte` 4 → 7,
  plus svelte-check / svelte / TypeScript to current. The CJS-API deprecation warning is gone.
- **TypeScript upgraded to 6.0** (`typescript` 5.9 → 6.0.3). Removed the now-deprecated `baseUrl`
  (and the unused `$lib`/`$data` `paths` — dead config) from `tsconfig.json`; under
  `moduleResolution: "bundler"` neither is needed, so no `ignoreDeprecations` escape hatch. Added the
  standard `src/vite-env.d.ts` (`/// <reference types="vite/client" />`) so TS 6.0's stricter
  side-effect-import rule accepts `import './app.css'` in `main.ts` (also types `import.meta.env`).
  `target` stays ES2022 — that's the browser-support floor, not a stale dep. check/build/test all green.
- **Fixed the type-checker (it was a silent no-op).** `npm run check` was throwing
  `vite.resolveConfig is not a function` while loading config out of `vite.config.ts`,
  so **all 12 `.svelte` files were skipped** (it exited 0, looking green). Added a
  standalone [svelte.config.js](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/svelte.config.js)
  that svelte-check loads directly; `check` now type-checks the whole UI (0 errors).
  Dropped `noEmit` from `tsconfig.node.json` to clear the last warning.
- **Test suite (Vitest).** New characterization tests (77 total) pinning the pure core —
  `formulas`, `StageEconomy` (incl. a `tick()/rates()` parity guard for every stage's
  starvation/throttle path), `FortuneEngine`, and `SaveManager.migrate` — plus a jsdom
  render-smoke suite that mounts the extracted stage tabs. `npm test` / `npm run test:watch`.
- **Unified the StageEconomy production core.** `tick()`, `rates()` and `autoBuyTick()`
  shared ~250 hand-synced lines of per-stage starvation/throttle/production logic each.
  Extracted shared `_baseMults` / `_spaceDemands` / `_computeFactors` / `_produceGen`
  helpers (mutations stay tick-only via `_siphonSpaceBuffers` / `_applyConsumption`), so
  `rates()` and `tick()` now run the *same* math — parity is guaranteed, not maintained by
  hand. `StageEconomy.ts` 833 → 619 lines.
- **Split `StagePanel.svelte`** (1804 → 1233 lines) — extracted the Magic, Time and
  Multiverse tabs into [EnchantsTab](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/ui/EnchantsTab.svelte),
  [WarpTab](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/ui/WarpTab.svelte) and
  [DuplicationTab](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/ui/DuplicationTab.svelte);
  shared dashboard styles promoted to `app.css`.
- **Lazy-loaded the decorative Pixi canvas.** Dynamic-imported behind `{#await}` in
  GameLayout, moving `pixi.js` out of the initial bundle: main chunk **587 kB → 250 kB**
  (gzip 172 → 75 kB), Pixi now a separate async chunk after first paint.
- **FortuneEngine** — replaced the `(def as any)._fortuneThreshold` mutation of shared
  static defs with a `WeakMap` cache, and de-duplicated the surplus-building loop shared
  by `tick()`/`ratePreview()`.
- **Micro-perf & cleanups** — hoisted `effGlobalMult()` out of the per-stage step loop;
  removed a dead `castEnchant` mana guard and an unused import; normalised a skill read to
  `?? 0`; added `.gitattributes` for consistent LF line endings.
- **Doc-drift sweep.** Re-synced the agent guides with the shipped code — `CLAUDE.md` and
  `AGENTS.md` still billed the project as *Phase 2* with Transcendence/Achievements "on the
  roadmap" and the save schema at *v8* (it is **v11**). Refreshed the state summaries, the
  architecture file-tree (added `achievements.ts`, `skills/transcendence.ts`,
  `TranscendencePanel.svelte`, `SettingsPanel.svelte`, `OnboardingTooltip.svelte`), the
  `unlockNotice` → `pushToast()` stacking-toast note, the two-mode (`cheapest`/`priority`)
  auto-buyer description, and the six-view SPA switch (incl. Transcendence); fixed the README's
  SPA-view row. Docs-only — no code or behaviour change.
- **`rates()` memoized per sim step.** `stageRates()` now caches each stage's `economy.rates()` behind a
  reactive `ratesStamp` (`$state`) bumped once per `stepSim`, so the Decimal-heavy rate math runs at most
  once per stage per step instead of once per stage per render frame (the Statistics panel reads every
  stage each frame). Reactivity is preserved — the stamp is `$state`, so cache-hit readers still re-derive;
  rate readouts lag the sim by ≤1 step (50 ms). Guarded by the existing `tick()`/`rates()` parity tests.
- **Removed dead `getUnlockNotice()` / `clearUnlockNotice()`** store exports — vestigial no-ops left from the
  `unlockNotice` → stacking-toast migration, with zero callers anywhere.
- **Reconciled MASTER_PLAN's "Balancing & Formula Reference"** with the shipped code. It still presented the
  pre-v5-rebalance numbers as "the authoritative contract": milestone ×7/×10 (now flat ×2), a sqrt→log
  prestige split (now sqrt for every stage), ascension exponent 0.40 (code uses 0.33), and per-stage
  k/Csoft/fortuneWeight tables that were wrong in every cell. Added a **SUPERSEDED** banner pointing to
  `formulas.ts` + the stage defs as the source of truth, corrected the two constant tables and the regime
  map, and fixed two stale references (`break_infinity.js` → `break_eternity.js`; a non-existent `balance.json`).

### Optimized — Phase 3 Codebase Refactoring & Allocation Optimization
- **Milestone Cache** ([formulas.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/systems/formulas.ts)) — Pre-allocated static Decimal multipliers for all milestone tiers, reducing dynamic object instantiation in `milestoneMult()` to $O(1)$ memory.
- **Arithmetic Allocation Reductions** ([formulas.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/systems/formulas.ts)) — Optimized production functions to multiply numeric primitives (`count * dt`) before converting to Decimals, removing multiple dynamic Decimal wrappers inside the loop.
- **Starvation and Upkeep Allocation Cleanup** ([StageEconomy.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/systems/StageEconomy.ts)) — Replaced redundant `D(number)` allocations inside `autoBuyTick()`, `tick()`, and `rates()` loops with primitive parameters, drastically cutting down memory allocations in hot paths.
- **Lazy-Cached Engine Thresholds** ([FortuneEngine.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/systems/FortuneEngine.ts)) — Stage surplus thresholds are cached after first computation (since reworked to a `WeakMap` rather than a hidden field on the shared `StageDefinition` — see the audit entry above).

### Added — Phase 3 Achievements & Multi-stack Toast Notification Bus · Save v11
- **Achievement System** ([achievements.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/data/achievements.ts)) — 20 achievements (17 visible, 3 secret) rewarding custom check criteria and compounding +1% or +2% global output multipliers.
- **Achievements UI** ([StatsPanel.svelte](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/ui/StatsPanel.svelte)) — nested tab deck (📊 Stats vs 🏆 Achievements) inside the Statistics Panel showing unlocked achievements count, golden progress indicators, custom colored cards per achievement, and hidden state details.
- **Stacking Toast Notifications** ([game.svelte.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/stores/game.svelte.ts)) — replacement of single-string `unlockNotice` banner with a modern stacking notification container in the top-right, with fade-out animations.
- **Save Version v11** — additive migration for `unlockedAchievements` array on all saves.

### Added — Phase 3: Transcendence meta-layer (Aether Æ) · Save v10
- **Transcendence Prestige** — A new global prestige reset. Spend all stages, LP, and upgrades to earn **Aether (Æ)**, which passive-mints ★ Fortune at +5% per Æ owned.
- **Aether Tree** ([transcendence.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/data/skills/transcendence.ts)) — 4-node tree including *Aether Wellspring* (+50% production/level), *Transcend Multiplier* (+15% Aether gain), *Start Boost* (seeds cash), and *Meta Automation+* (preserves Engine slots and auto-buyer toggles across resets).
- **Transcendence Altar** ([TranscendencePanel.svelte](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/ui/TranscendencePanel.svelte)) — elegant dashboard displaying Aether counts, gain thresholds, dynamic reset previews, and a portal trigger button with custom cosmic sweep audio.
- **Save Version v10** — additive migration for Aether progress fields (`aether`, `aetherLifetime`, `transcendCount`, `fortuneAllTime`).

### Added — Phase 2: Fortune Engine slot assignment & Smart-Priority Auto-Buyers · Save v9
- **Fortune Engine Slot Assignment UI** ([FortuneEnginePanel.svelte](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/ui/FortuneEnginePanel.svelte)) — interactive dropdowns added to each of the 8 slots in the Fortune Engine Panel, allowing players to assign and wire any unlocked stage, or disconnect it, preventing duplicate allocations automatically.
- **Smart-Priority Auto-Buyers** ([StageEconomy.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/systems/StageEconomy.ts)) — a new smart automation mode (unlocked at first Ascension per stage) that evaluates the marginal output-to-cost ratio (`ΔRate / cost`) of all candidates, allowing players to vault specific generators from auto-buying and set a spend reserve fraction (0% to 90%).
- **Automation Control Panel** ([StagePanel.svelte](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/ui/StagePanel.svelte)) — elegant dashboard displaying Mode toggles (Cheapest/Priority), Reserve sliders, and Milestone Snipe checkboxes when a stage's auto-buyer is unlocked and the stage has ascended.
- **Save Version v9** — additive migration for the new automation properties (`autoBuyMode`, `autoBuyReserve`, `autoBuyMilestoneSnipe`, `autoBuyVault`) on all stages.

### Added — Phase 2: Ascension meta-layer (Legacy Points) · Save v8
- **Ascension** — a new top-level **🜲 Ascension** view ([AscensionPanel.svelte](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/ui/AscensionPanel.svelte)) and the second prestige layer. Ascending a stage performs a *deep* reset — wiping generators, currencies, **and** the stage's own prestige currency/count — in exchange for **Legacy Points (LP)**, a permanent global meta-currency.
- **Harsher meta curve** — LP uses the canonical deeper exponent (MASTER_PLAN §"ASCENSION"): `LP = floor(5 · (lifetime / softcap)^0.33)` ([ascensionGain](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/systems/formulas.ts)), a slower loop than stage prestige's `^0.5`. A stage can Ascend once it has prestiged at least once and would mint ≥ 1 LP.
- **Ascension Tree** ([ascension.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/data/skills/ascension.ts)) — a 6-node LP-spent meta tree (Legacy → Inheritance / Ancestral Engine → Eternal Return / Mint Dynasty → Apotheosis) granting large permanent global-production and ★-mint multipliers. It folds into the **same** `recomputeUpgrades()` path as the ★ tree, so it is fully save-safe and never drifts.
- **Per-stage Ascension count** tracked on every stage; the panel shows each reached stage's live LP preview, ascend button, and 🜲× ascension tally.
- **Save Version v8** — additive migration (no reset): seeds `legacyPoints` (0) and per-stage `ascensionCount` (0) on existing saves.

### Added — Phase 2: Multiverse (Stage 8) — Duplication & Convergence · Save v7
- **Multiverse Stage** ([multiverse.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/data/stages/multiverse.ts)) — 6 generators (Rift → Convergence Core), **Shards** primary + **Echoes** secondary + **Convergence** prestige currency, Fortune weight **3.0 (highest in game)**. The capstone stage; unlocks once all of stages 1–7 are open, Space is supplying Alloy, and Time has reached 10M lifetime Chronons.
- **Production Duplication (the twist)** — each **Branch Node** opens a slot that *clones* a chosen stage's live output by **dupPct** (5%, or 12% with *Wider Branches*; +0.5%/Mirror-Self, +1%/Reality Loom, cap 100%). Clones are sustained by **Echoes**; if Echoes run dry the duplication fades (`mvEchoSustain` ratio). New **Duplication** tab with per-slot stage pickers and live bonus readouts. Folded into `bindingMultFor()` so it flows through ticking, rates, and the header math.
- **Convergence collapse (endgame)** — with a Convergence Core, all 8 stages unlocked, and ≥ 1e12 Shards, *collapse* bakes a **permanent global ×multiplier** into every stage (`1 + coeff·log10(Σ lifetime)`, coeff 0.10 → 0.14 with *Stable Convergence*) and grants Convergence points, resetting the Multiverse. Stored in a new persisted `convergenceMult` that multiplies the skill-derived `globalMult` at every production call-site (it is **not** recomputed from skills, so it survives loads).
- **Cross-stage sinks** — Rifts consume **Space Alloy**, Paradox Mirrors consume **Time Paradox** (turning two upstream by-products into Shards); Branch Nodes carry a 5 Shards/s upkeep. Shortage throttles the respective producers, mirroring the Space input chain.
- **Multiverse Local Upgrades** ([local.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/data/skills/local.ts)) — Convergence-gated tree: *Shard Flow* (+40%/lvl), *Echo Reservoir* (−40% upkeep), *Wider Branches*, *Extra Slot*, *Paradox Harvest* (Paradox Mirror ×2.5), *Stable Convergence*.
- **Save Version v7** — additive migration (no reset): seeds `multiverse.branchSlots` and `convergenceMult` (×1) on existing saves. Sanitizer guards `convergenceMult` against a missing → ZERO collapse.

### Added — Phase 2: Time (Stage 7) & the Warp-Tick system · Save v6
- **Time Stage** ([time.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/data/stages/time.ts)) — 6 generators (Sundial → Eternity Spindle), **Chronons** primary + **Paradox** secondary + **Epoch** prestige currency, Fortune weight 2.25. Unlocks at 5M lifetime Stardust once any two stages have ascended (Time is meta-aware — it can only manipulate stages you've already "looped").
- **Warp-Tick bursts (the twist)** — spend Chronons + a warp charge to apply *T* seconds of simulated time to **any** chosen stage, granting instant offline-like gains (`gain = targetRate · T · warpEff`). Warp charges (cap = 2 + Chrono-Engines + *Echo Charges*) recharge one per 5 min on a wall-clock cadence. New **Warp** tab + a target/duration dashboard with live cost, efficiency, gain, and Paradox-accrual previews.
- **Paradox risk-resource** — Causal Loops leak Paradox; Hourglass Arrays vent it. Paradox softly throttles all Chronon output via `timeMult = 1 / (1 + √(Paradox/200))` ([paradoxThrottle](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/systems/formulas.ts) in formulas.ts). A **Paradox/Warp-Charge status banner** surfaces throttle %, Paradox held, charges, and next-charge ETA. Each Epoch grants permanent −0.5% Paradox accrual per warp (temporal tolerance).
- **Time Local Upgrades** ([local.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/data/skills/local.ts)) — Epoch-gated tree: *Chronon Flow* (+30%/lvl), *Paradox Vent* (×2 vent), *Stable Loop* (−50% leak), *Deep Warp* (max warp 300s→900s), *Echo Charges* (+2 charge cap), *Warp Mastery* (+25% warp efficiency).
- **Save Version v6** — additive migration (no reset): seeds the `warp` charge state on existing v5 saves; fresh games start with 2 charges.

### Changed — Economy rebalance (slower, fairer grind) · Save v5
- **Milestone multiplier ×8 → ×2**, with finer/deeper tiers `[10, 25, 50, 100, 250, 500, 1000, 2500]`.
  The old curve handed out a cumulative **×2,097,152** by 1,000 of a generator; the new curve tops out
  at **×256** by 2,500. This was the single biggest driver of runaway wealth.
- **Global cost-growth bump (+0.04)** applied centrally to every generator's `r`, steepening the whole
  climb without rewriting 40+ data values.
- **Centralised the balance knobs** — new `BALANCE` block in [formulas.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/systems/formulas.ts)
  (`milestoneMult`, `milestoneTiers`, `costGrowthBump`) is now the single source of truth; UI and
  economy both read it. Future balance passes are a one-line edit.
- **Hard reset on load** — `CURRENT_VERSION` → **5**. Saves earned on the old runaway curve are
  discarded on load (a fresh start on the new pacing) and the player is told why via a toast.

### Added — Quality-of-life
- **Statistics panel** ([StatsPanel.svelte](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/ui/StatsPanel.svelte)) —
  a new top-level **📊 Stats** view: playtime, ★ Fortune (current/lifetime/rate), global multiplier,
  stages unlocked, engine slots, and a live per-stage table (held / rate / lifetime / generators /
  prestige / auto-buy status).
- **Prestige-gated auto-buyers** — a per-stage **Auto ON/OFF** toggle (unlocks once a stage has
  prestiged at least once) that buys the cheapest affordable generator each tick. O(generators), so it
  respects the hot-loop performance rules. New `autoBuy` field on `StageState`.
- **Milestone progress on generators** — each generator row now shows its current ×mult badge and the
  next-tier target/percentage, both sourced from `BALANCE`.

### Fixed — Offline progress & dead code
- **Offline progress** ([game.svelte.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/stores/game.svelte.ts))
  rewritten to use the read-only `rates()` path: it now honours **cross-stage bindings, skills, and
  enchants**, credits **secondary currency**, and **mints Fortune** while away (the old path ticked a
  throwaway state copy and ignored all of those). `BindingRule.read` now takes an explicit `stages`
  argument so it works on a loaded save, not just the live store.
- Removed the dead `fortuneRate(stageId)` placeholder branch that always returned `0`.

### Performance
- **Per-frame binding-mult memoisation** — `sqrt()`/`log10()` Decimal chains for cross-stage bindings
  are cached per sim step (invalidated each `stepSim`), so repeated UI `rates()` reads in one render
  frame don't recompute them. The sim loop deliberately bypasses the cache to keep in-step Labor fresh.

### Added — Phase 2: Magic Realm (Stage 5) & Space (Stage 6)
- **Magic Realm Stage** ([magic.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/data/stages/magic.ts)) — 7 generators (Sigil → Arcane Citadel), **Mana** primary + **Essence** secondary + **Insight** prestige currency, Fortune weight 1.75.
- **Space Stage** ([space.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/data/stages/space.ts)) — 7 generators (Alloy Smelter → Warp Gate), **Stardust** primary + **Alloy** secondary + **Telemetry** prestige currency, Fortune weight 2.0.
- **Enchantment casting dashboard** — cast spells (Quicken, Greater Quicken, Mass Enchant, Overcharge) that consume Mana and optionally Essence to grant massive production multipliers to other stages, with slots limits and overcharge backfire risk checks.
- **Space Input-chain Starvation & Buffer System** — Smelters/Refineries/Dyson Frames consume Mine Ore and Factory Power to smelt Alloy, and Probes/Colonies/Forges/Gates consume Alloy to generate Stardust; resource shortage dynamically throttles output down the manufacturing chain.
- **Local Upgrades Skill Tree** ([local.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/data/skills/local.ts)) — permanent local enhancements gated by prestige currencies (Insight / Telemetry), unlocking features like *Twin Casting*, *Backfire Ward*, *Buffer Tanks* (siphons Mine/Factory surpluses into buffer tanks), *Logistics AI*, *Self-Mining Drones*, and *Power Recapture*.
- **Magic & Space Pixi Scenes** ([PixiCanvas.svelte](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/pixi/PixiCanvas.svelte)) — added custom backgrounds and interactive central structures (floating/bobbing crystal for Magic; rotating solar arrays space station and flashing beacon for Space) with custom particles (rising violet sparks and floating teal dust).
- **Save Version v4** — bumped save version to 4, added `activeEnchants` and `spaceBuffers` state fields, and wrote the `v3 → v4` migration path.

### Fixed — Settings Panel Navigation & Bulk Cost Display
- **Decimal Serialization Override** ([Decimal.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/systems/Decimal.ts)) — Overrode `Decimal.prototype.toJSON` to properly serialize `Decimal` instances as wrapper objects, resolving the issue where raw strings bypassed the JSON replacer.
- **Save State Sanitizer & Healing** ([SaveManager.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/systems/SaveManager.ts)) — Implemented `sanitizeState` to recursively identify and convert string-serialized numeric fields back to `Decimal` instances upon loading, preventing `TypeError` page crashes and healing corrupt player saves.
- **Settings Toggle Highlights** ([SettingsPanel.svelte](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/ui/SettingsPanel.svelte)) — Derived primitive properties (`numberFormat`, `offlineProgress`, `autoSaveInterval`) to ensure Svelte 5 reactively updates active toggles instantly in real-time.
- **Geometric Bulk Cost Display** ([StagePanel.svelte](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/ui/StagePanel.svelte)) — Modified generator card cost displays to compute and show the total geometric cost of the selected purchase mode (e.g. ×10, ×100, or MAX) instead of only the cost of a single unit.

### Added — Phase 2: Factory Stage (Stage 4)
- **Factory Stage** ([factory.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/data/stages/factory.ts)) — 7 generators (Boiler Assistant → Megafactory Core), **Widgets** primary + **Power (kW)** secondary + **Patents** prestige currency, Fortune weight 1.6.
- **Factory Unlock Flow** — Factory unlocks dynamically once Mine lifetime Ore reaches 5,000, seeding 35 starting Widgets, wiring a new Fortune Engine slot, and announcing with a toast notification.
- **Farm → Factory Binding** — Farm's Grain surplus feeds Factory workers, multiplying production rate.
- **Factory Pixi Scene** ([PixiCanvas.svelte](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/pixi/PixiCanvas.svelte)) — custom industrial factory backdrop with charcoal layout, copper/iron piping, steam dials, a large animated rotating central cog, and glowing orange spark particles.

### Added — Settings Panel & Onboarding Tooltips
- **Settings View** ([SettingsPanel.svelte](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/ui/SettingsPanel.svelte)) — dynamic number notation settings (`'short'`, `'scientific'`, or `'engineering'`), auto-save cadence (10s to 5m), offline progress toggle, Base64 save import/export, hard reset double-confirmation, and onboarding tutorial reset.
- **Onboarding Tooltip Component** ([OnboardingTooltip.svelte](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/ui/OnboardingTooltip.svelte)) — elegant, theme-compliant inline tooltips with persistent seen state in GameState.
- **Stage & Engine Integration** — integrated onboarding prompts for manual gathering, stage synergies (bindings), prestige altar ascension, Fortune Engine, and global skills.
- **Reactive Formatting** — wrapped `fmt` and `fmtRate` in [game.svelte.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/stores/game.svelte.ts) so they reactively update instantly on notation settings changes.
- **Save Version v3** — added seen tutorials state, bumped [SaveManager.ts](file:///c:/Users/shaan/Desktop/Cog%20and%20Cosmos/src/systems/SaveManager.ts) version to 3, and wrote the `v2 → v3` migration path.

### Fixed — Early-game bootstrap deadlock
- You started with 0 Coins and 0 Cottages while the cheapest Cottage cost 10 ¢ — leaving **no way to
  earn the first Coin** (and the same trap would recur after every prestige). Added a **manual gather**
  action (`manualGather`) — a stage-flavoured "Collect / Harvest / Mine" button that always yields
  ≥1 (or ~3 s of current output) and counts toward lifetime, so any stage can be bootstrapped from zero.
- New games now **seed 15 starting Coins** so the first Cottage is affordable immediately (no click wall).
- Bumped Cottage base rate `0.1 → 0.5 ¢/s` so early passive income feels alive.
- `freshGameState()` now stamps the current save version (2) directly.

### Added — Architecture: installable PWA + SPA multi-view
- **Progressive Web App** (`vite-plugin-pwa`) — the game is now **installable** (desktop & mobile)
  and **plays fully offline**: a generated service worker precaches the app shell (~716 KiB, 23
  entries) and runtime-caches Google Fonts so type survives offline. Brass-cog app icons (192 /
  512 / 512-maskable / apple-touch / favicon) generated by a **dependency-free pure-Node PNG
  encoder** (`scripts/generate-icons.mjs`).
- **SPA top-level view system** — a masthead **Stages ⚙ / Skills ✦** switch swaps views inside the
  one persistent runtime (no reloads, the game loop never stops). Confirms the SPA-over-MPA choice.

### Added — Global Skill Tree (spend Fortune ★)
- **9-node tiered tree** (`data/skills/global.ts`) with prerequisites and per-node levels: production
  and Fortune-mint multipliers from *Spark of Fortune* up to the *Grand Design* capstone.
- Effects are **recomputed deterministically from levels** (`systems/skills.ts`), so `globalMult` and
  the Engine's mint multiplier are always save-safe and never drift.
- **Save schema v2** with a `v1 → v2` migration that adds the `skills` map to existing saves.
- Skill-tree UI: live Fortune balance, current ×production / ×mint totals, buyable/locked/maxed
  states, prereq hints, and a coin blip on purchase.

### Added — Phase 1: the Mine & a compounding synergy chain
- **Mine stage** (`data/stages/mine.ts`) — 7 generators (Prospector → Core Crusher), **Ore** primary +
  **Gems** secondary + **Depth** prestige, Fortune weight 1.4.
- **Multi-binding system** — bindings are now **data-driven and compounding**. The Mine is fed by
  *both* **Village Labor** (√) and the **Farm Grain** stockpile (log-scaled), and the two multipliers
  stack. Adding a stage's synergy is now a single entry in `STAGE_BINDINGS`.
- **Village → Farm → Mine chain** — investing in the Village now visibly accelerates the Farm, which
  in turn accelerates the Mine. The full chain proves the core fantasy scales.
- **Mine unlock** at 5,000 lifetime Grain — seeds 30 Ore, auto-wires a Fortune bay, toasts the player.
- **Multiple binding badges** in the stage header, each tinted to its source stage.
- **Mine cavern pixel scene** — rock strata, timber supports, **gem veins that spread as you dig**,
  two **flickering wall torches**, a loaded **minecart on rails**, and drifting dust motes.

### Added — Phase 1: the Farm & the first cross-stage binding
- **Farm stage** (`data/stages/farm.ts`) — 7 generators (Tilled Field → Estate), **Grain** primary +
  **Water** secondary + **Heritage** prestige currency, Fortune weight 1.2.
- **Village → Farm Labor binding** — the Village's exported Townsfolk Labor now multiplies *all* Farm
  output (`1 labor/s → ×2`, `4 → ×3`, `100 → ×11`, via `√labor`). The first real taste of
  interdependence; shown live as a badge in the Farm header.
- **Runtime unlock flow** — the Farm opens once the Village reaches 5,000 lifetime Coins, seeds 25
  Grain so the first Field is affordable, auto-wires itself into a Fortune Engine bay, and announces
  itself with a dismissible **unlock toast**.
- **Generalized stage rendering** — `StagePanel` and `PixiCanvas` now work for any stage by id; the
  dial bar's Farm ghost-dial becomes live on unlock.
- **Farm pixel scene** — a daytime field with a glowing sun, rolling hills, a red barn, a fence, a
  **rotating windmill**, drifting clouds, and crop rows that sprout as you buy Fields.

### Changed — Engine generalization
- Renamed `GeneratorDef.woodRate` → `secondaryRate` (generic across all stages' secondary currencies).
- `StageEconomy.tick()` / `.rates()` accept an `extraMult` for cross-stage binding multipliers.

### Added — Interface & feel (v0.1 polish pass)
- **Per-second production readouts** on the Village currency chips (¢/s, 🌲/s) via a non-mutating
  `StageEconomy.rates()` that mirrors tick math exactly — turn green when actively earning.
- **Full 8-stage dial bar:** all stages now appear as numbered dials; unlocked stages are live,
  future stages render as locked "ghost" dials with teaser tooltips so the journey is visible.
- **Synthesized retro SFX** (`systems/audio.ts`) via the Web Audio API — zero asset files: soft
  coin blip on purchase, bright sweep on milestone crossings, ascending fanfare on prestige, with
  a **mute toggle** in the masthead.
- **Living pixel village scene** (PixiJS): a cohesive full-canvas night hamlet that exists even at
  0 cottages and grows into a town as you buy — twinkling stars, a drifting cloud, a glowing moon,
  pine treeline, a winding path, a well, lit windows, and rising **chimney smoke**. Animated layers
  mutate properties only; the static layer redraws solely when the village changes (perf rule #4).

### Changed — Performance (operating rule #4)
- **Decoupled the simulation from render** with a fixed **20 Hz timestep + accumulator** and a
  5-step catch-up cap. The economy no longer ticks once per animation frame, so CPU stays flat on
  60/120/144 Hz displays — less heat, no high-refresh thrash.
- Cached the economy iteration list and removed `Object.entries()` from the hot loop.
- Hoisted the PixiJS number-pop `TextStyle` out of the per-frame ticker (no allocations in the hot loop).

### Added — Governance
- Codified four **operating rules** in [CLAUDE.md](./CLAUDE.md) and [AGENTS.md](./AGENTS.md):
  no AI co-authorship in git, docs-never-lag-code, free-but-best-in-class tooling, and
  performance-is-a-feature.

### Planned (next up — see [ROADMAP.md](./ROADMAP.md))
- **Farm** stage with Grain/Water economy and Village→Farm Labor binding.
- **Global skill tree** spending Fortune (★).
- Achievements system with Starlight rewards.
- Settings panel: export/import save, hard reset, number-format toggle.
- SFX via jsfxr; milestone screen-shake juice.

---

## [0.1.0] — 2026-06-12 — *"First Cog Turns"*

The Phase 0 prototype: a complete, playable vertical slice of the Village stage
feeding a working Fortune Engine.

### Added — Game systems
- **Decimal layer** (`break_eternity.js`) with `fmt()` short-notation formatting
  (K/M/B/T/Qa/Qi → scientific) for values beyond `1e308`.
- **FormulaEngine** (`systems/formulas.ts`) implementing all MASTER_PLAN §17 math:
  generator cost growth (`base · r^n`), bulk-cost & max-affordable solving,
  production with milestone tier multipliers (×8 at 10/25/50/100/200/500/1000),
  square-root prestige gain, soft caps, Fortune-mint (log10-weighted), offline
  gains, and taxed currency exchange.
- **StageEconomy** — per-stage tick, buy (×1/×10/×100/Max), and prestige with
  +25%-per-prestige production multiplier and surplus calculation.
- **FortuneEngine** — mints ★ from assigned-slot stage surpluses; 8-slot system
  with per-stage Fortune weights; reactive mint-rate preview.
- **SaveManager** — IndexedDB primary + localStorage fallback, lz-string
  compression, versioned schema with migration hook, base64 export/import,
  Decimal-aware JSON (de)serialization.
- **Village stage** — 7 generators (Cottage, Market Stall, Tavern, Blacksmith,
  Guild Hall, Cathedral, Castle) with Coins (¢) primary + Wood secondary +
  Renown prestige currency, and cross-stage Labor output.

### Added — Game loop & state
- Svelte 5 runes store (`stores/game.svelte.ts`) running a 15 Hz fixed-ish loop
  via `requestAnimationFrame` with dt-capping.
- Offline progress on load (100% to a 2 h window, 35% beyond, 24 h cap) with a
  "while you were away" summary.
- Autosave every 30 s.

### Added — Interface ("Brass & Ink" theme)
- Global theme (`app.css`): ink-navy + parchment + brass-gold palette with
  per-stage jewel accents, starfield + grain + vignette atmosphere, and a full
  keyframe library.
- Type system: **Silkscreen** (pixel display) · **Spline Sans Mono** (data) ·
  **Newsreader** italic (flavor lore).
- `GameLayout` instrument-deck shell: masthead Fortune readout, stage "dial" bar,
  three-column deck.
- `StagePanel`: generator cards with milestone tier-rails, tabular-figure counts
  with bump animation, buy-mode toggle, and a prestige "altar".
- `FortuneEnginePanel`: dual brass cogs whose spin speed tracks the live mint
  rate, ★ readout, 8-bay slot board.
- `OfflineSummary` modal and a cog-driven loading screen.
- **PixiJS v8** canvas: pixel night-village scene (sky/moon/stars/path) where
  cottages appear as you buy them, plus floating gold `+X` number-pops.

### Project scaffolding
- Vite + Svelte 5 + TypeScript setup, path aliases, strict TS.
- Full documentation suite: `MASTER_PLAN.md` (design bible), `README`,
  `ROADMAP`, `CONTRIBUTING`, `CLAUDE.md`, `AGENTS.md`, `LICENSE`.

[Unreleased]: https://example.com/compare/v0.1.0...HEAD
[0.1.0]: https://example.com/releases/tag/v0.1.0
