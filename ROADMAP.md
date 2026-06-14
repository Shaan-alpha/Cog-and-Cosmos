# 🗺️ Roadmap — Cog & Cosmos

A condensed, build-oriented roadmap. The exhaustive design for everything below lives in
**[MASTER_PLAN.md](./MASTER_PLAN.md)**. Durations assume a solo dev using free tools.

Legend: ✅ done · 🔨 in progress · 🔜 next · 📦 planned

---

## Phase 0 — Prototype ✅ *(complete)*
**Goal:** prove the core loop is fun with one stage + the Fortune Engine.

- ✅ Vite + Svelte 5 + TS + PixiJS scaffold
- ✅ Decimal math, FormulaEngine, StageEconomy, FortuneEngine, SaveManager
- ✅ Village stage (7 generators), prestige, milestones
- ✅ Offline progress + autosave (IndexedDB/lz-string)
- ✅ "Brass & Ink" production UI + pixel canvas
- **Exit criteria:** a player can idle, buy, hit milestones, mint ★, and prestige. ✔

## Phase 1 — Vertical Slice ✅  *(complete)*
**Goal:** the interdependence hook is real with 3 stages.

- ✅ **Farm** stage (Grain/Water) + **Village→Farm Labor** binding
- ✅ **Mine** stage (Ore/Gems) + **Labor + Grain** compounding bindings
- ✅ Stage unlock flow + unlock toast
- ✅ Three-stage interdependence chain (Village → Farm → Mine)
- ✅ **Global skill tree** spending Fortune (★) — 9-node tiered tree
- ✅ **Architecture locked in:** SPA (one persistent runtime, multi-view) + installable **PWA** with offline play
- ✅ Settings panel: export/import, hard reset, number-format toggle
- ✅ "New system" onboarding tooltips
- **Exit criteria:** unlocking a stage visibly accelerates the others. ✔

## Phase 2 — Alpha ✅ *(complete)*
**Goal:** all 8 stages + the second prestige layer.

- ✅ **All 8 stages live** (Factory, Magic, Space, Time, **Multiverse**) — full Village → Multiverse roster
- ✅ Cross-stage bindings (Labor/Grain, Alloy fusion, Mana enchant, Chronon time-warp, **Shard duplication** all live)
- ✅ Fortune Engine slot assignment UI
- ✅ **Ascension** layer (per-stage deep reset → **Legacy Points**) + LP meta tree — live
- ✅ Automation: **per-stage auto-buyers live** (prestige-gated); **smart priority live**
- **Exit criteria:** full first-prestige-stack playthrough, ~10+ hours of content. ✔

## Phase 3 — Beta 🔨 *(in progress)*
**Goal:** the meta layers + retention systems.

- ✅ **Transcendence** (Aether Æ) layer and LP/upgrade tree resets
- ✅ **Achievements** (20 normal/hidden milestones + global output boosts)
- ✅ **QoL & UI Refinements**: Multi-stack Toast Notification Bus, Statistics sub-tabs, and major Decimal allocation performance optimizations
- ✅ **Reality Reset** (Omega Ω) meta layer — the prestige stack is now complete (Prestige → Ascension → Transcendence → Reality Reset)
- 🔨 **Events** — v1 live: claimable random-encounter production buffs; 📦 seasonal / bosses / mini-games deferred
- ✅ **Collections** (18 relics that drop on resets → passive bonuses + rarity-set bonuses)
- ✅ **Challenges** (restricted runs → Medals + a Trial tree) — restriction runs live; time/endless deferred
- ✅ **Mobile/touch UX** (responsive shell + ≥44px touch targets + safe-area); 📦 encyclopedia deferred
- ✅ **Free cloud sync** (Supabase free tier) — env-gated, magic-link auth, manual timestamp-guarded Push/Pull; self-disables when unconfigured; no save-format change
- **Exit criteria:** 100+ hours of meaningful progression; healthy D7 retention in playtests.

## Phase 4 — Polish & Launch 📦
**Goal:** ship it.

- 📦 Full balance pass (spreadsheet-driven, pacing targets from MASTER_PLAN §17)
- 📦 Audio: SFX (jsfxr/ChipTone) + chiptune music (Bosca Ceoil/LMMS)
- 📦 Juice: screen-shake, particle bursts, milestone fanfare
- 📦 Accessibility + hotkeys
- 📦 Deploy to **itch.io** + GitHub Pages (free)
- **Exit criteria:** public 1.0 release.

## Post-Launch 📦
- 📦 Seasonal event cadence
- 📦 Mobile wrapper via **Capacitor** or **Tauri 2** (free)
- 📦 Balance/QoL updates from player feedback

---

### MVP cut-line
If time is tight, the minimum lovable product is **Phases 0–1 + Ascension from Phase 2**:
three interdependent stages, the Fortune Engine, a global tree, and one meta-prestige layer.
Everything past that deepens engagement but isn't required to demonstrate the core fantasy.
