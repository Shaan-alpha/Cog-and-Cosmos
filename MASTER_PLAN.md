# COG & COSMOS — The Fortune Engine
### Master Design & Technical Production Plan

> A pixel-art, web-first **interconnected incremental/idle game** inspired by the linked-stage structure of *Fortune Mill*. Eight interdependent stages feed a central **Fortune Engine** that mints the universal currency **Fortune (★)**. Designed to be built entirely with **free tools**, prioritizing extensibility, replayability, and 100+ hours of engagement.

**Status:** Design complete — ready for prototyping.  
**Document type:** Comprehensive master plan (research + design + architecture + balancing + roadmap).

## Table of Contents
1. [Executive Summary & Design Pillars](#executive-summary-design-pillars)
2. [Research Findings & Pattern Extraction](#research-findings-pattern-extraction)
3. [Competitor Comparison Table](#competitor-comparison-table)
4. [Core Gameplay Loop & Player Journey](#core-gameplay-loop-player-journey)
5. [Stage Design — Part I: Village, Farm, Mine, Factory](#stage-design-part-i-village-farm-mine-factory)
6. [Stage Design — Part II: Magic Realm, Space, Time, Multiverse](#stage-design-part-ii-magic-realm-space-time-multiverse)
7. [Cross-Stage Synergy & Interdependence Web](#cross-stage-synergy-interdependence-web)
8. [Currency Systems & Economy Design](#currency-systems-economy-design)
9. [Skill Tree System](#skill-tree-system)
10. [Progression Layers](#progression-layers)
11. [Systems I — Automation, Achievements & Events](#systems-i-automation-achievements-events)
12. [Systems II — Collections, Challenges & Quality of Life](#systems-ii-collections-challenges-quality-of-life)
13. [Technical Architecture](#technical-architecture)
14. [Technology & Tooling (Free-Only)](#technology-tooling-free-only)
15. [Folder Structure & Project Layout](#folder-structure-project-layout)
16. [Save System Design](#save-system-design)
17. [Balancing & Formula Reference](#balancing-formula-reference)
18. [Development Roadmap — Prototype to Release](#development-roadmap-prototype-to-release)

---

## Executive Summary & Design Pillars

### Vision Statement

> **COG & COSMOS — The Fortune Engine** is a free-to-build, web-first pixel-art incremental where eight idle economies are never abandoned but permanently *wired together*: a central machine — the **Fortune Engine** ("the Mill") — siphons surplus from every unlocked stage and mints **FORTUNE (★)**, the universal currency that funds the cross-stage links making each economy depend on the others.

#### Elevator Pitch

You begin as a humble medieval **Village** clicking out **Coins (¢)** and chopping **Wood**. But the Village's **Townsfolk** become **LABOR** that powers the **Farm** and **Mine**; the Farm's **Grain** feeds the workers of the Mine and **Factory**; **Ore** and **Power (kW)** fuse into **Space Alloy**; **Magic** **Mana** enchants any generator; **Time** **Chronons** buy time-warp ticks; and **Multiverse** **Shards** duplicate a chosen stage's output. Bolted over all of it, the **Fortune Engine** has assignable **slots** that convert each stage's surplus into **FORTUNE (★)** — the binding currency you spend on a global skill tree, on the cross-stage links themselves, and on Engine upgrades. Prestige loops stack five layers deep (**Stage Prestige → Ascension/LP → Transcendence/Æ → Reality Reset/Ω → Meta**), so there is always a satisfying number to pop and a deeper system to unlock. It costs nothing to build (Phaser 3 / Svelte + free art/audio/hosting) and nothing to play.

---

### Design Pillars

The eight pillars below are the constitution of the game. Every feature, number, and sprite must serve at least one; any feature serving none is cut.

#### 1. Interdependence Over Isolation (the core differentiator)

Stages are **never silos and never abandoned**. Once unlocked, a stage produces forever AND feeds later stages. This is the inverse of the genre default (Antimatter Dimensions / Realm Grinder reset or sideline prior layers). The dependency graph is the game.

```
   ┌─────────────────────── THE FORTUNE ENGINE (mints ★) ──────────────────────┐
   │   slot1   slot2   slot3   slot4   slot5   slot6   slot7   slot8           │
   └──▲────────▲───────▲───────▲───────▲───────▲───────▲───────▲──────────────┘
      │surplus │       │       │       │       │       │       │  (★ weight per stage)
 ┌────┴───┐ ┌──┴───┐ ┌─┴────┐ ┌┴──────┐ ┌┴─────┐ ┌┴─────┐ ┌┴─────┐ ┌┴──────────┐
 │VILLAGE │ │ FARM │ │ MINE │ │FACTORY│ │MAGIC │ │SPACE │ │ TIME │ │MULTIVERSE │
 │ Coins¢ │ │Grain │ │ Ore  │ │Widgets│ │ Mana │ │Stardst│ │Chron.│ │ Shards    │
 │ Wood   │ │Water │ │ Gems │ │Power  │ │Essnce│ │Alloy │ │Pardx │ │ Echoes    │
 └───┬────┘ └──┬───┘ └──┬───┘ └───┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └─────┬─────┘
     │Townsfolk │Grain   │Ore     │Power    │Mana    │        │Chronons   │Shards
     │=LABOR    │feeds    │+Power →│→ Alloy  │enchants│        │time-warp  │dup %
     ▼          ▼workers  └───────►Space    │any gen ▼        ▼any stage  ▼any stage
   Farm,Mine  Mine,                          (temp mult)   (burst gain)  (×% output)
              Factory
```

| Binding | Source → Target | In-game effect |
|---|---|---|
| **Labor** | Village Townsfolk → Farm, Mine | Townsfolk count is consumed as a labor pool that scales Farm/Mine output |
| **Sustenance** | Farm Grain → Mine, Factory | Grain feeds workers, multiplying their production |
| **Alloy fusion** | Mine Ore + Factory Power → Space | Both are *inputs* to Space's Alloy secondary |
| **Enchant** | Magic Mana → any stage | Temporary multiplier on a chosen stage's generators |
| **Time-warp** | Time Chronons → any stage | Buys burst "offline-like" ticks for one stage |
| **Duplication** | Multiverse Shards → any stage | Duplicates a chosen stage's production by a % |
| **Minting** | Any stage surplus → Engine slot | Converts surplus to ★ at a per-stage `fortuneWeight` |

#### 2. Always a Number to Pop, Always a System to Unlock

Two retention engines run in parallel: short-loop dopamine (number-pop "juice", floating `+X`, milestone tier multipliers) and long-loop mystery (grayed-out UI that lights up at named milestones). The player is *never* idle-bored: if production feels flat, a new binding, slot, or prestige layer is always within one session's reach.

#### 3. Five-Layer Prestige Stack, Each Adding a *New Mechanic Class*

Resetting must teach, not just multiply (the #1 cause of D7 drop-off is pure-multiplier stacks). Each layer introduces a genuinely new system class:

```
Idle play
  └─► Stage Prestige (per stage, soft)   →  Renown/Heritage/Depth/… local boosts
        └─► Ascension (per stage, LP)     →  permanent local trees
              └─► Transcendence (global, Æ) →  global/ascension meta trees
                    └─► Reality Reset (Ω)   →  New-Game+ modifiers + permanent QoL
                          └─► Meta          →  achievements/collections that SURVIVE Ω
```

| Layer | Currency | Resets | Keeps | New mechanic class introduced |
|---|---|---|---|---|
| Stage Prestige | local (Renown…Convergence) | one stage's progress | everything else | per-stage soft multipliers |
| Ascension | **LP** | one stage deeper | ★, other stages, meta | per-stage permanent tree |
| Transcendence | **Æ** | ALL stages + ★ | meta, achievements | global meta tree |
| Reality Reset | **Ω** | everything incl. Æ | meta unlocks | NG+ modifiers + QoL |
| Meta | achievements/collections | nothing | — | permanent cross-Ω unlocks |

#### 4. Respect the Player's Time (idle-first, offline-honest)

Designed for the **5–15 min mobile / 30 min–2 hr desktop** check-in rhythm. Offline progress is generous and transparent: **100% rate to a 2 h base window, 25–50% beyond, cap raised toward ~24 h** by upgrades, with a "while you were away" summary. No FOMO: events accrue offline; nothing is missed by logging in once a day.

#### 5. Visible, Diegetic Math

Every multiplier is inspectable. Upgrades show exact `%` before purchase; each stage panel shows its production breakdown (`base × count × tierMult × globalMult`) and which bindings are feeding/draining it. The interdependence is only a selling point if the player can *see* the Village's Townsfolk physically raising the Farm's Grain bar.

#### 6. Free to Build, Free to Play, Free to Host (the no-money ethos)

Zero-budget end to end. No paid engine, no paid asset, no paid host, no paid backend, no monetization dark patterns. The constraint is a feature: it forces lean, web-native, instantly-loadable design.

| Layer | Tool (all free) |
|---|---|
| Engine | **Phaser 3 + TS** (primary) or **Svelte 5 + PixiJS** (UI-heavy hybrid) |
| Big numbers | `break_infinity.js` (1e15–1e9e15), `break_eternity.js` post-Transcendence |
| Art | Pixelorama (or self-compiled Aseprite) — 16×16 & 32×32 sprites |
| Audio | jsfxr + ChipTone (SFX), Bosca Ceoil (loops), Audacity (edit) |
| Save | localStorage + lz-string; IndexedDB via idb-keyval for large saves |
| Cloud (opt.) | Firebase Spark (no pause) or Supabase free |
| Host | itch.io (audience) + Cloudflare Pages (unlimited bandwidth) + GitHub Pages (preview) |

#### 7. Distinct Identity Per Stage (cozy-meets-cosmic)

Each of the eight stages is a self-contained mini-world with its own theme, palette, signature generator, secondary currency, and local-prestige flavor — Fortune Mill's "distinct minigame skin per zone" lesson. Parallax backdrops sell the journey from medieval hamlet to branching realities.

#### 8. Strategic Configuration, Not a Linear Climb

Borrowing Realm Grinder's faction-lock insight: the **Engine slots, binding allocations, and prestige-tree choices** are scarce, so every player's "build" is a meaningfully different routing of resources. Which stage gets the high-weight ★ slot? Where do you point Mana, Chronons, and Shards? There is no single optimal path.

---

### Target Audience & Player Fantasy

| Dimension | Definition |
|---|---|
| **Primary audience** | Incremental/idle veterans (Cookie Clicker, Antimatter Dimensions, Realm Grinder, NGU Idle players) hungry for a *novel* core hook, not another clone |
| **Secondary audience** | Cozy-game and pixel-art fans drawn by the medieval-to-cosmic aesthetic and low-pressure pacing |
| **Tertiary audience** | "Optimizer" min-maxers who live in spreadsheets — served by visible math and build diversity |
| **Player skill range** | Newcomer-friendly first hour (Village only), spreadsheet-deep by Transcendence |
| **Session shape** | 5–15 min mobile check-ins; 30 min–2 hr desktop deep sessions; both fully rewarding |

#### The Player Fantasy

> *"I am the architect of a machine that turns an entire braided multiverse of little economies into pure Fortune."*

You don't just grow one number — you **engineer a supply chain across realities**. The fantasy is the satisfying click of *systems locking into each other*: routing a Village's surplus labor into a Farm whose grain feeds a Mine whose ore fuses into Space alloy, all while the Fortune Engine hums in the center converting the overflow into ★. Mastery feels like conducting an orchestra of interlocking gears (the **COG**) that together sing across the **COSMOS**.

---

### Platform Plan & Free-Tools Ethos

```
TARGET:  Web-first (desktop + mobile browser), PWA-installable.
BUILD:   Phaser 3 + TypeScript  ──►  static HTML/JS/WASM-free bundle
DEPLOY:  Push ──► Cloudflare Pages (prod, unlimited BW)
              └─► itch.io HTML5 embed (discovery/audience)
              └─► GitHub Pages (dev preview)
SAVE:    localStorage + lz-string  (┤ versioned root {version, data} ├)
              └─► optional Firebase Spark cloud sync (no-pause free tier)
MOBILE:  same bundle, responsive canvas; Capacitor wrap = future store path
COST:    $0 engine · $0 art · $0 audio · $0 host · $0 backend
```

- **Web-first** because the genre lives in the browser; instant load (Phaser = zero WASM cold-start) beats Unity/Godot for a number-heavy 2D idle.
- **Save schema is versioned from day one** (`{version, data}` + migration chain) so V1→V2 saves never break.
- **Number formatting** is player-toggled: Standard (1.23M) / Scientific (1.23e6) / engineering / hybrid-log (`e1234.56`) once values exceed `break_infinity` range.

---

### Unique Selling Points

Ranked, leading with the differentiator:

| # | USP | Why it's defensible |
|---|---|---|
| **1** | **The Fortune Engine + true interdependence.** Stages are wired together, never abandoned; a central mill mints ★ from *all* of them. | No mainstream incremental makes *every prior layer a live input to later ones AND a feedstock for one binding currency.* AD sidelines layers; Realm Grinder resets them; here they compound. |
| **2** | **Assignable Engine slots = build identity.** Scarce ★-minting slots + binding allocations force strategic routing. | Realm Grinder's faction-lock depth without locking you out of content. |
| **3** | **Five-layer prestige, each a new mechanic class.** | Matches AD's gold-standard "new mechanic per layer" while theming it across 8 worlds. |
| **4** | **Cozy-meets-cosmic pixel journey** from medieval hamlet to multiverse, 8 distinct skins. | Aesthetic variety most number-games lack (Fortune Mill's "minigame skin per zone" at 8× scale). |
| **5** | **100% free, instant-load, no FOMO, no paywall.** | Working-adult-friendly; offline-honest; differentiates from predatory mobile idles. |
| **6** | **Visible, inspectable math.** Every multiplier and binding is transparent. | Serves the optimizer audience and builds trust. |

---

### Scope Tiers — MVP vs V1 vs V2

| Feature area | **MVP** (ship-the-loop) | **V1** (the full pitch) | **V2** (endgame depth) |
|---|---|---|---|
| **Stages** | 1–3: Village, Farm, Mine | + 4–6: Factory, Magic, Space | + 7–8: Time, Multiverse |
| **Generators** | Cottage, Field, Shaft (+secondaries) | all 8 signature gens + secondaries | full milestone tier tables to ×10 |
| **Fortune Engine** | basic ★ mint from 3 slots | 8 slots, per-stage `fortuneWeight`, Engine upgrades | Engine prestige interactions |
| **Bindings** | Labor (Village→Farm/Mine) only | + Sustenance, Alloy-fusion, Enchant | + Time-warp, Duplication |
| **Prestige** | Stage Prestige (sqrt) | + Ascension (LP), Transcendence (Æ) | + Reality Reset (Ω), Meta layer |
| **Offline** | delta-time, 2 h cap, summary | efficiency decay + upgradable cap → ~12 h | cap → ~24 h, time-warp catch-up |
| **Automation** | manual buy x1/x10/Max | milestone-gated auto-buyers | priority-queue auto-buy + presets |
| **Meta systems** | achievements (count only) | achievements grant multipliers, collections | challenges, events (Tokens), Starlight rares |
| **Number lib** | `break_infinity.js` | same + formatting modes | `break_eternity.js` for post-Transcend |
| **Art/Audio** | 3 stage skins, core SFX | 6 skins, parallax, music loops | 8 skins, full juice, boss/event audio |
| **Persistence** | localStorage + lz-string + versioning | + IndexedDB for large saves | + optional Firebase/Supabase cloud sync |
| **Target playtime** | ~2–4 h to first Transcendence-adjacent wall | ~30–50 h | 100+ h |

#### Core Numeric Baselines (locked across all tiers)

```text
Generator cost:      cost_n   = base * r^n          # r ≈ 1.07 early → 1.15 late
Bulk-buy k from n:   cost_k   = base*r^n*(r^k-1)/(r-1)
Max affordable k:    k_max    = floor( log_r( c*(r-1)/(base*r^n) + 1 ) )
Production:          output   = count * baseRate * tierMult * globalMult
Milestone tiers:     tierMult ∈ {×7…×10} at counts 10/25/50/100/200/500…
Stage prestige:      gain     = floor( k * (lifetimePrimary / softcap)^0.5 )   # sqrt
Soft cap (x>C):      eff(x)   = C * (1 + (x - C)/C)^0.5
Fortune mint:        dStar/dt = Σ_stages( log10(1 + stageSurplus) * fortuneWeight * engineMult )
Offline gain:        gained   = prodPerSec * elapsed * eff   # eff: 1.0 ≤2h, 0.25–0.50 beyond
```

**Worked example (Village, MVP).** Cottage `base = 15`, `r = 1.07`, owned `n = 10`. Next Cottage = `15·1.07^10 ≈ 29.5 ¢`. Buy 10 more from n=10: `15·1.07^10·(1.07^10−1)/(1.07−1) ≈ 407 ¢`. At `count = 25` the ×7 milestone tier fires, so a `baseRate = 0.1` Cottage with `globalMult = 1` yields `25 · 0.1 · 7 · 1 = 17.5 ¢/s`. If Village surplus to its Engine slot is `1,000 ¢/s` at `fortuneWeight = 1.0`, `engineMult = 1`: `dStar/dt = log10(1001) ≈ 3.0 ★/s`.

---

### Why This Retains Players for 100+ Hours

```text
1. PARALLEL STACKING ECONOMIES — 8 never-abandoned stages mean idle output
   compounds across worlds, not one curve; there is always a lagging stage to optimize.
2. FIVE PRESTIGE LAYERS, EACH A NEW MECHANIC — Stage→Ascension→Transcendence→
   Reality→Meta keeps the player learning, not just re-grinding (AD's anti-churn rule).
3. THE BINDING WEB CREATES COMBINATORIAL DEPTH — Labor/Grain/Alloy/Mana/Chronons/
   Shards routing + scarce Engine slots = a fresh optimization puzzle every reset.
4. MILESTONE-GATED MYSTERY + ACHIEVEMENT MULTIPLIERS — grayed-out UI lighting up and
   economically meaningful achievements (Cookie-Clicker milk pattern) drive completionism.
5. OFFLINE-HONEST, FOMO-FREE PACING — generous offline + no timed-event loss respects
   adult schedules, making the daily check-in loop sustainable for months, not days.
```

---

## Research Findings & Pattern Extraction

This section distills the RESEARCH DIGEST into actionable, adopted patterns for **COG & COSMOS — The Fortune Engine**. Each subsection maps an extracted pattern to the exemplar game(s) it was mined from and the concrete decision for our eight-stage design. All formulas, currencies, and stage names use the canonical SPEC.

### 3.1 Core Progression Systems

| Pattern | Exemplar Game(s) | What We Adopt in COG & COSMOS |
|---|---|---|
| Sequential zone unlock where prior zones keep producing & cross-pollinate | Fortune Mill (4 rooms), Antimatter Dimensions (stacked dims) | Eight stages unlock in order VILLAGE→…→MULTIVERSE; **none is ever abandoned** — each keeps producing and feeds later stages via the Cross-Stage Binding table. |
| Boss-gated room advancement ($1M-in-currency gate) | Fortune Mill (Verminus/Gorgon/Hivemind/Executor) | Each stage unlock gated by a lifetime-PRIMARY threshold (e.g. VILLAGE→FARM at 1e6 Coins ¢), themed as a "Mill Seal" mini-boss the Fortune Engine cracks open. |
| Generator buy + buy-10 milestone tier multipliers | Cookie Clicker (×1.15/unit), Antimatter Dimensions (×2 per 10) | Generators (Cottage, Field, Shaft, Assembly Line, Sigil, Probe, Clocktower, Rift) use `cost_n = base·r^n`, r=1.07 early → 1.15 late, with milestone tier multipliers ×7..×10 at counts 10/25/50/100/200/500. |
| Workers/jobs assigned to resource gathering | Trimps (Food/Wood/Metal jobs) | VILLAGE Townsfolk are LABOR units consumed by FARM & MINE; reassignable allocation, not just passive count. |
| Click-to-bootstrap, then automate | Cookie Clicker (big cookie), Orb of Creation (spell keys) | Stage 1 has a manual "Turn the Crank" click for the first ~5 min; all later production is idle-first. |

```
COG & COSMOS PRODUCTION CHAIN (interdependence is mandatory)
 VILLAGE ──Townsfolk(LABOR)──▶ FARM ──Grain──▶ MINE ──Ore──┐
    │                          │                            ├─▶ SPACE (Alloy)
    └──────────────────────────┴──▶ FACTORY ──Power(kW)─────┘
 MAGIC ──Mana enchant (×mult, any stage)──▶ [ALL]
 TIME ──Chronon time-warp ticks──▶ [chosen stage]
 MULTIVERSE ──Shard duplication %──▶ [chosen stage]
 ALL STAGES ──surplus──▶ [THE FORTUNE ENGINE] ──mints──▶ FORTUNE (★)
```

### 3.2 Prestige & Rebirth Mechanics

| Pattern | Exemplar Game(s) | What We Adopt in COG & COSMOS |
|---|---|---|
| Soft reset for permanent local multiplier | Cookie Clicker (Ascension/Heavenly Chips), Idle Wizard (Exile/Mysteries) | **Stage Prestige** (per stage, soft): resets that stage's generators/local currency, grants the stage's local-prestige currency (Renown/Heritage/Depth/Patents/Insight/Telemetry/Epoch/Convergence). |
| Square-root prestige gain (lenient loop) | AdVenture Capitalist (`150·√(earn/1e15)`), Realm Grinder (triangular) | `gain = floor(k·(lifetimePrimary / softcap)^0.5)`; 4× lifetime primary = 2× prestige — matches SPEC baseline. |
| Cube-root / harsher meta reset | Cookie Clicker (`∛(cookies/1e12)`), Egg Inc. (^0.14) | **ASCENSION** (per stage, LP) uses harsher exponent 0.33 to enforce a slower meta loop: `LP = floor(k_A·(lifetimePrimary/C_A)^0.33)`. |
| Stacked global reset that keeps meta | Antimatter Dimensions (Infinity→Eternity→Reality), Synergism (6-tier stack) | **TRANSCENDENCE** resets ALL stages + Fortune (★) but keeps achievements/collections; mints AETHER (Æ). |
| Top-layer reset that wipes the prior meta-currency | Synergism (Singularity→Golden Quarks), AD (Reality) | **REALITY RESET** wipes everything incl. Aether; grants OMEGA CORES (Ω) + NG+ modifiers + permanent QoL. |
| Milestone-restored QoL after repeat resets | Antimatter Dimensions (Eternity Milestones) | Repeat Transcendences progressively restore autobuyers & starting resources, removing re-grind sting. |

```
PROGRESSION LAYER STACK (low → high)
 Idle ─▶ Stage Prestige(local cur.) ─▶ Ascension(LP) ─▶ Transcendence(Æ) ─▶ Reality Reset(Ω) ─▶ Meta(survives Ω)
 reset scope:  1 stage local      1 stage local     ALL+★              ALL+★+Æ            nothing (permanent)
 gain exponent:    0.50               0.33              log/√               threshold-tiered     achievement-driven
```

```python
# Concrete prestige numbers (VILLAGE example, softcap C = 1e6 Coins)
def stage_prestige_gain(lifetime_primary, k=10, softcap=1e6):
    return floor(k * (lifetime_primary / softcap) ** 0.5)
# lifetime 1e8 ¢  -> floor(10 * 100^0.5)  = 100 Renown
# lifetime 4e8 ¢  -> floor(10 * 400^0.5)  = 200 Renown  (4x earnings -> 2x gain)

def ascension_gain(lifetime_primary, k_A=5, C_A=1e9):
    return floor(k_A * (lifetime_primary / C_A) ** 0.33)
# lifetime 1e12 ¢ -> floor(5 * 1000^0.33) ≈ 47 LP
```

### 3.3 Multi-Layer Resource Systems

| Pattern | Exemplar Game(s) | What We Adopt in COG & COSMOS |
|---|---|---|
| Primary + secondary currency per zone | Cookie Clicker (Cookies + Sugar Lumps), Trimps (Food/Wood/Metal) | Each stage = PRIMARY + SECONDARY pair (e.g. Coins¢+Wood, Grain+Water, Ore+Gems … Shards+Echoes). |
| Universal binding currency siphoned from all sources | Fortune Mill (cross-room feeds), Synergism (cubes from all) | **FORTUNE (★)** minted by the Fortune Engine from every unlocked stage's surplus; never reset by stage prestige. |
| Rare slow-maturing currency | Cookie Clicker (Sugar Lumps ~24h), Idle Wizard (Runes 1/24h) | **STARLIGHT** — rare currency from rare events/bosses; gates premium Engine modules. |
| Resource web feeding upgrade gates | Realm Grinder (Coins→Gems→Faction Coins→RP), IMR (8 prestige resources) | Layered meta stack: local-prestige cur. → ★ → LP → Æ → Ω, each gating a distinct upgrade tree. |
| Seasonal/event currency | Cookie Clicker (egg/reindeer drops) | **TOKENS** — seasonal EVENT currency, spent in rotating event shop; FOMO-free (offline accrues). |

```
CURRENCY DEPENDENCY GRAPH
 [stage PRIMARY/SECONDARY ×8] ──surplus──▶ ★ FORTUNE ──┐
                                                       ├─▶ global skill tree / Engine upgrades / cross-stage links
 stage local-prestige (Renown…Convergence) ────────────┘
 LP (Ascension, per-stage) ─▶ local meta trees
 Æ (Transcendence, global) ─▶ global/ascension meta trees
 Ω (Reality Reset)        ─▶ NG+ modifiers + permanent QoL
 TOKENS (events) · STARLIGHT (rare bosses) ─▶ side shops
```

### 3.4 Skill-Tree Structures

| Pattern | Exemplar Game(s) | What We Adopt in COG & COSMOS |
|---|---|---|
| Mutually-exclusive branching study tree | Antimatter Dimensions (Time Studies), Synergism (research grid) | **Global Fortune Tree** (spent in ★): mutually-exclusive forks force build identity (e.g. "Surplus Siphon" vs "Stage Multiplier" branch). |
| Grid of node upgrades unlocked by milestones | Synergism (research r8x25), Melvor (skill trees) | Each stage has a local node grid bought with its local-prestige currency; nodes unlock at generator-count milestones. |
| Faction/alignment lock that gates whole tree | Realm Grinder (Good/Evil/Neutral), Idle Wizard (T1/T2 classes) | **Engine Doctrines** chosen at first Transcendence: *Industrial* (FACTORY/MINE weight), *Arcane* (MAGIC/SPACE), *Temporal* (TIME/MULTIVERSE) — biases ★ weights & unlocks. Re-pickable on Reality Reset. |
| Preset save/load for tree configs | Antimatter Dimensions (study presets), NGUInjector | Named Fortune-Tree presets for one-click swap between farming vs challenge layouts. |

```
GLOBAL FORTUNE TREE (★-gated, mutually-exclusive forks)
                  [Engine Core]
                  /     |      \
        Surplus Siphon  |   Stage Multiplier
         (★/s +log)     |    (×prod all)
              \         |        /
            [Cross-Stage Links node]  ← unlocks binding slots
              /                  \
      Mana-Weave fork        Time-Warp fork   (doctrine-biased)
```

### 3.5 Cross-Resource Interactions

| Pattern | Exemplar Game(s) | What We Adopt in COG & COSMOS |
|---|---|---|
| One zone's output buffs another (signature mechanic) | Fortune Mill (jackpot buffs Room1), Cookie Clicker (synergy upgrades ±5%) | The entire SPEC Cross-Stage Binding: Township→LABOR, Grain→worker output, Ore+Power→Alloy, etc. — visible in every stage. |
| Spell/aura temporary multiplier applied to chosen target | Orb of Creation (potions), Realm Grinder (spells), Cookie Clicker (Grimoire) | **MAGIC Mana** "enchants" any stage's generators for a timed ×multiplier (e.g. ×3 for 60 s). |
| Burst/time-skip applied to a target | Cookie Clicker (Force the Hand of Fate), NGU (time machine) | **TIME Chronons** buy time-warp ticks → burst offline-like gains on a chosen stage. |
| Production duplication / mirroring | Synergism (multiplicative cube stacks), IMR (collapsed stars ×all ranks) | **MULTIVERSE Shards** duplicate a chosen stage's production by a % (additive within stage, multiplicative across binding sources). |
| Slot-assignment converting output to meta-currency | Cookie Clicker (Pantheon slots), Antimatter (Glyph slots) | **Fortune Engine SLOTS**: assign a stage to a slot to convert its surplus into ★ at a stage-specific `fortuneWeight`. |

```python
# Mana enchant: multiplicative across binding sources, additive within a source
def enchant_mult(base_mult, mana_spent, decay_s, t):
    return 1 + base_mult * exp(-t / decay_s)          # 60s decay, ×3 peak

# Shard duplication stacks WITH binding, not replacing it:
# eff_output = base * (1 + labor_bonus + grain_bonus) * (1 + shard_pct) * enchant_mult
```

```
FORTUNE ENGINE SLOTS (assign stage → slot → ★)   fortuneWeight (★ minting weight)
 ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
 │VILLAGE FARM   MINE  FACTORY MAGIC SPACE  TIME   MULTI  │
 │ 0.10  0.14   0.20   0.28   0.36   0.50   0.70   1.00   │ (rises with depth)
 └──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
```

### 3.6 Automation Mechanics

| Pattern | Exemplar Game(s) | What We Adopt in COG & COSMOS |
|---|---|---|
| Auto-buyers unlocked per building/tier | Cookie Clicker (per-building auto-buy), Trimps (AutoUpgrade Z59) | Per-generator auto-buyers unlocked via local node grid + ★ Engine upgrades. |
| Automation gated behind prestige count | Antimatter Dimensions (1 Eternity=auto-dims, 1000=auto-Eternity) | Stage auto-prestige unlocks at N Ascensions; auto-Transcend at N Transcendences. |
| Best-ratio smart priority purchasing | Cookie Clicker (CPS/cost), NGUInjector (priority lists) | Auto-buyer evaluates best `Δproduction/cost` each tick, skips locked items, recalcs after each buy. |
| Buy x1/x10/x100/Max with closed-form max | Cookie Clicker (Buy Max), genre standard | Bulk-buy closed form (see Balancing) — no O(k) loop. |
| Scriptable automation / ordered queue | Antimatter (Automator), Cell (Automation Hub queue) | Late-game "Engine Macros": reorderable purchase queue executed per tick (Reality-Reset QoL unlock). |

```python
# Closed-form bulk buy (used by Buy-Max and auto-buyer)
def cost_buy_k(base, r, owned, k):
    return base * r**owned * (r**k - 1) / (r - 1)
def max_affordable_k(base, r, owned, currency):
    return floor(log(currency*(r-1)/(base*r**owned) + 1, r))
# base=15, r=1.07, owned=20, currency=1e4 -> k = 38 Cottages affordable
```

### 3.7 Offline Progress Systems

| Pattern | Exemplar Game(s) | What We Adopt in COG & COSMOS |
|---|---|---|
| Delta-time snapshot at logout | Genre-universal | `gained = prod_per_sec · elapsed · efficiency`, applied once on load. |
| 100% window then efficiency decay | Egg Inc. (2h cap), genre decay curves | **100% rate to a 2h base window, then 25–50% efficiency**; cap raised by upgrades toward ~24h (SPEC baseline). |
| Cap raised by upgrade tree | Cookie Clicker (Angel/Demon 1h→128h), Melvor (24h) | ★/Æ upgrades extend the 2h window and lift the decayed-efficiency floor toward 50%. |
| "While you were away" summary | Genre standard, Melvor | Pixel-art **"While You Were Away"** modal: per-stage gains, ★ minted, events missed, with number-pop juice. |
| Catch-up via prestige multipliers (no special currency) | Antimatter Dimensions (post-Reality instant Infinity) | Post-Transcendence multipliers naturally re-clear early stages in seconds — prestige reward IS the catch-up. |

```python
def offline_gain(rate_per_s, elapsed_s, base_window_s=7200, decay_eff=0.35, cap_s=86400):
    t = min(elapsed_s, cap_s)
    full = min(t, base_window_s)
    decayed = max(0, t - base_window_s)
    return rate_per_s * (full + decayed * decay_eff)
# rate=500★/s, away 6h: full 7200s + 14400s*0.35 -> 500*(7200+5040)=6.12M ★
```

### 3.8 Milestones & Achievements

| Pattern | Exemplar Game(s) | What We Adopt in COG & COSMOS |
|---|---|---|
| Achievements grant economically-meaningful bonus | Cookie Clicker (538 achv → +milk% → ×CpS) | Each achievement grants **+0.5% global production** (Cog & Cosmos "Renown Glow"), compounding additively into globalMult. |
| Milestone tier multipliers at owned-counts | Cookie Clicker, Antimatter Dimensions | Generator milestones ×7..×10 at 10/25/50/100/200/500 owned (SPEC baseline). |
| QoL milestone ladder via repeat prestige | Antimatter Dimensions (Eternity Milestones 1→1000) | Transcendence milestone ladder restores autobuyers / starting stages / offline ★. |
| Hidden/secret achievements drive FOMO | Cookie Clicker (hidden icons), Revolution Idle (33 secret) | Hidden "Cosmic Secrets" with no hint; each unlocks +0.1% ★ mint weight. |
| Challenge-completion permanent multiplier | Antimatter Dimensions (EC ×5 completions) | Stage Challenges (no-MAGIC, no-LABOR, decay) repeatable, each completion = permanent stage multiplier. |

```python
global_mult = base * (1 + 0.005 * achievements_unlocked) * prod_milestone_stack
# 200 achievements -> +100% global production (×2.0)
```

### 3.9 Meta-Progression

| Pattern | Exemplar Game(s) | What We Adopt in COG & COSMOS |
|---|---|---|
| Persistent meta-currency surviving all resets | Synergism (Golden Quarks), AD (Reality Machines) | **OMEGA CORES (Ω)** survive everything; spent on NG+ modifiers + permanent QoL. |
| Permanent global multiplier per prestige level | Cookie Clicker (+1%/prestige level) | AETHER (Æ) skill nodes give permanent +% to ★ mint rate and all-stage production. |
| Stacked meta trees (global + ascension) | Idle Wizard (Paragon), FAP Idle (3 layers) | Two Æ trees: **Global** (all-stage / ★) and **Ascension** (cross-stage link power). |
| New-Game+ randomized/chosen modifiers | Orb of Creation (NG+ random build), Trimps (Challenge²) | Reality Reset unlocks NG+ modifiers: e.g. "stages start at Ascension 3", "★ weight ×2 but generators ×0.5". |
| Collections that survive resets | Melvor (Mastery), Idle Slayer (Divinities) | Sprite/event **Collections** + achievement log persist through Ω; gate cosmetic + small permanent bonuses. |

### 3.10 Random Events & Special Bonuses

| Pattern | Exemplar Game(s) | What We Adopt in COG & COSMOS |
|---|---|---|
| Timed clickable bonus (golden cookie) | Cookie Clicker (golden cookies, 300–900s, 13s window) | **Lucky Cog**: spawns every 300–900 s on the parallax backdrop, 13 s window; grants ★ windfall or timed ×7 stage buff. |
| Tension entity: looks bad, pays out | Cookie Clicker (Wrinklers ×1.1, shiny ×3.3) | **Paradox Leech** (TIME stage): drains Chronons but pops for ×1.1 lump (×3.3 rare "shiny"), reinforcing TIME theme. |
| Seasonal events, offline-friendly | Cookie Clicker (Halloween/Easter), Melvor (permanent) | TOKEN events accrue offline; rotating event shop; FOMO-free per retention research. |
| Rare boss → rare currency | Fortune Mill (room bosses), FAP Idle | Rare "Mill Seal" bosses drop **STARLIGHT**; gate premium Engine modules. |
| Random target buff (faction-flavored) | Realm Grinder (Titans Lightning Strike), Druids (least productive) | **Engine Surge**: random stage gets ×10 for 30 s; "Balance Surge" variant buffs the weakest stage. |

### 3.11 Balancing Approaches

| Pattern | Exemplar Game(s) | What We Adopt in COG & COSMOS |
|---|---|---|
| Exponential cost `base·r^n` | Universal (AdVenture r=1.07, Cookie r≈1.15) | r ramps 1.07 (VILLAGE) → 1.15 (MULTIVERSE) per SPEC. |
| Square-root prestige (4×→2×) | AdVenture Capitalist | Stage prestige exponent 0.5 (SPEC). |
| Soft cap via fractional power | TV Tropes "Too Many Softcaps", Elden Ring breakpoints | `eff(x) = C·(1 + (x−C)/C)^0.5` beyond threshold C (SPEC). |
| Stacked sequential softcaps | Incremental Mass Rewritten (softcap^1..^8) | Late stages (TIME/MULTIVERSE) chain 2–3 softcaps to tame runaway. |
| Multiplicative multiplier stack | Cookie Clicker (M=M1·M2·…) | `output = count · baseRate · tierMult · globalMult` (SPEC). |

```python
def cost_n(base, r, n):           return base * r**n
def production(count, baseRate, tierMult, globalMult):
    return count * baseRate * tierMult * globalMult
def soft_cap(x, C):
    return x if x <= C else C * (1 + (x - C)/C) ** 0.5
# C=1e6, x=1e8 -> 1e6*(1+99)^0.5 = 1e6*10 = 1e7 effective (10x raw 100x)
```

### 3.12 Endgame Scaling Techniques

| Pattern | Exemplar Game(s) | What We Adopt in COG & COSMOS |
|---|---|---|
| Log-compressed meta-currency mint | Antimatter Dimensions (IP=10^(log10(AM)/308−0.75)) | **Fortune mint** uses log10 compression: `dStar/dt = Σ log10(1+stageSurplus)·fortuneWeight·engineMult` (SPEC). |
| Tetration/big-number libs | AD (break_infinity / break_eternity) | `break_infinity.js` from launch (numbers routinely >1e308 by SPACE/TIME); `break_eternity.js` reserved for MULTIVERSE + Ω layer. |
| Infinite repeatable challenge as scaling stat | Synergism (C15 exponent), Trimps (Challenge²) | **MULTIVERSE Convergence Challenge**: never completable; the reached "Convergence exponent" is itself a permanent scaling stat. |
| Dimensional/tiered production chain | Antimatter Dimensions (8 dims) | Eight stages mirror AD's 8-tier chain but lateral (interdependent) not vertical (stacked). |
| Hyperbolic challenge difficulty | AD (`base^(completions^exp)`), Exponential Idle (e^e^x) | Stage challenge goals scale `goal = base·(1.5)^(completions^1.1)` for super-exponential late curve. |

```python
def fortune_mint_per_s(stage_surpluses, weights, engine_mult):
    return sum(log10(1 + s) * w for s, w in zip(stage_surpluses, weights)) * engine_mult
# surpluses [1e6,1e7,1e9], weights [0.10,0.14,0.20], engineMult 5
# = (6*0.10 + 7*0.14 + 9*0.20)*5 = (0.6+0.98+1.8)*5 = 16.9 ★/s
```

### 3.13 Player Retention Systems

| Pattern | Exemplar Game(s) | What We Adopt in COG & COSMOS |
|---|---|---|
| Milestone-gated mystery-box unlocks | Antimatter Dimensions (progressive tabs) | Each stage/system revealed by unlocking previously-grayed UI; ~200h reveal pacing. |
| First-prestige as LTV anchor (<60–90 min) | Retention research benchmark | Tune VILLAGE so **first Stage Prestige lands in 30–60 min**; first Transcendence ~ day 2–3. |
| Always-making-progress visual signal | Genre #1 D1-churn fix | Floating "+X" number-pops, animated generators, filling Engine bar at all times. |
| FOMO-free permanent/offline events | Melvor, NGU Idle | TOKEN events count offline; nothing missed by once-daily login. |
| Reset payoff 3–10× faster per layer | AD, Realm Grinder | Each meta layer re-clears prior content 3–10× faster (multiplier-driven catch-up). |
| Daily 5–15 min loop | Mobile retention research | Login → collect "While You Were Away" → 1–2 upgrade decisions → assign Engine slots/Chronon warp → close. |

### 3.14 UI/UX Best Practices

| Pattern | Exemplar Game(s) | What We Adopt in COG & COSMOS |
|---|---|---|
| Number-pop "juice" feedback | Cookie Clicker, genre | Satisfying number-pop on every gain; screen-flash + chiptune SFX on Lucky Cog / boss. |
| Parallax animated backdrops signal "alive" | Genre best practice | Per-stage parallax pixel backdrops (cozy-meets-cosmic palette), animated 16×16/32×32 sprites. |
| Building info / multiplier breakdown panel | Cookie Clicker (encyclopedia) | Each generator shows lore + exact multiplier breakdown (base × tier × global × binding × shard) pre-purchase. |
| Visual node-graph tree with presets | Antimatter Dimensions (study tree) | Global Fortune Tree as zoomable node graph; named presets. |
| HTML overlay for stat HUD over canvas | Phaser idle pattern (engine research) | Phaser 3 canvas (sprites/parallax) + CSS/HTML `<div>` overlay for upgrade/stat panels. |
| Toast/log notifications | Melvor (toasts), NGU (colored log) | Toasts for stage unlocks/level-ups; colored event log for ★ windfalls, boss drops, links formed. |

### 3.15 Quality-of-Life Features

| Pattern | Exemplar Game(s) | What We Adopt in COG & COSMOS |
|---|---|---|
| Toggleable number-format modes | Genre standard | Standard / Scientific / Engineering / named-tier / `eXXX` log modes, player-selectable. |
| Save export/import + schema versioning | Cookie Clicker (Base64), Melvor/AD (JSON) | `{version, data}` root + migration chain; export as **lz-string** Base64 string. |
| Local + structured cloud save | Save-tooling research | `localStorage` + lz-string for small saves; **IndexedDB via idb-keyval** for full saves; optional Firebase Spark cloud sync (no project pause). |
| Stats page tracking lifetime metrics | Cookie Clicker (stats) | Lifetime per-stage primary, ★ minted, prestiges, playtime — feeds prestige & achievement formulas. |
| Buy x1/x10/x100/Max | Genre standard | Standard bulk-buy buttons using closed-form max-affordable. |
| Offline simulate up to cap | Melvor (24h sim) | Simulate up to ~24h on load with the "While You Were Away" summary modal. |

```
SAVE SCHEMA (versioned, lz-string compressed → localStorage / IndexedDB)
 { version: 1,
   data: { stages:[{id, primary, secondary, gens[], localPrestige, ascCount}…×8],
           fortune:★, engineSlots[8], doctrines, aether:Æ, omega:Ω,
           achievements[], collections[], tokens, starlight,
           lastLogin, settings:{numFormat, offlineCap} } }
 migrate chain:  if(save.version<2) v1→v2(save); … always write current version
```

---

## Competitor Comparison Table

This section benchmarks all 13 reference games against the design targets for **COG & COSMOS — The Fortune Engine**. Every "What WE borrow / avoid" entry maps directly onto the canonical 8-stage spec (VILLAGE → MULTIVERSE), the universal currencies (FORTUNE ★, LEGACY POINTS LP, AETHER Æ, OMEGA CORES Ω, TOKENS, STARLIGHT), and the progression stack (Idle → Stage Prestige → Ascension → Transcendence → Reality Reset → Meta).

### Full Comparison Matrix

| Game | Sub-genre | Core loop | Prestige layers | # currencies (approx) | Automation depth | Offline support | Standout mechanic | What WE borrow | What WE avoid |
|---|---|---|---|---|---|---|---|---|---|
| **Fortune Mill** | Room-chain idle / minigame skin | Earn 1M room-currency → boss gate → unlock next room; all prior rooms keep earning | 1 (Darts "Trial Mode" = run-wide mult; no true prestige) | ~5 (Gold, Money, Ribbons, Stuffing + Pachinko balls) | Low (Auto Throw, Auto Drop ≤2 balls/s, Accountant Toad 30s tick) | Yes — cleared + partial rooms generate while closed | Sequential room unlock where every earlier room stays active and **cross-pollinates** the next | The never-abandon, always-producing stage chain (our 8 stages); cross-stage buffs (jackpot-buffs-prior-room → our Mana enchant / Shard duplication); the Fortune **Mill** name homage | Thin single-prestige layer; minigame-skin shallowness with no shared economy; only 4 zones (we run 8 + 6 meta layers) |
| **Cookie Clicker** | Click-idle / building stack | Click → buy 20 buildings → upgrades multiply CpS → ascend for Heavenly Chips → repeat | 2 (Ascension → Heavenly; Sugar-Lump minigames as soft sub-layer) | ~4 (Cookies, Heavenly Chips, Sugar Lumps, seasonal) | Med (per-building autobuyers; addon-driven golden-cookie clicks) | Yes — Angel/Demon tree, 5–75% rate, window 1h→128h | **Wrinklers** — parasites that drain CpS but pay a x1.1 lump on pop (tension) | Building-pair **synergy upgrades** (+5%/unit) → our cross-stage links; milestone tier mults; achievement→milk economic loop → our Meta collections; 24h-target offline window | 700+ achievement grind wall; pure-multiplier ascension with no new mechanic per layer; click-dependence (we are idle-first) |
| **Realm Grinder** | Faction strategy idle | Coins → faction upgrades → spells → gems → Abdicate → Reincarnate → deeper layers | 3 (Abdication → Reincarnation → Ascension @ R39/99/159/219) | ~6 (Coins, Gems, Faction Coins, Research Pts, Mana, Trophies) | Med (spell auto-cast addons; Research auto-effects) | Yes — Undead faction is the offline specialist (asymmetric) | **Faction alignment lock** — run start gates entire upgrade tree + playstyle (active/idle/hybrid); prestige factions double-stack identities | Alignment-style **build identity** via Engine slot assignment + skill-tree paths; spell layer → our Mana "enchant any generator" temp mults; trophy→power loop → Meta | Punitive 12,000-of-each trophy grind; 800+ buildings; faction lock so rigid it forces wiki-driven play |
| **Trimps** | Army / combat idle | Assign workers (Food/Wood/Metal/Gems) → soldiers auto-clear 100-cell zones → boss → next zone | 2 (Portal/Helium → Radon Universe U2) | ~7 (Food, Wood, Metal, Gems, Helium, Radon, Fragments) | High (AutoUpgrade Z59, AutoJobs, AutoMap, AutoFight, AutoPortal) | Yes — passive resource gather; combat continues | **Army formation math**: squad = rows × columns, so structural upgrades compound **multiplicatively** | Multiplicative structural compounding for our milestone tiers; **Challenge²** permanent-bonus model → our Reality Reset NG+ modifiers; Void-Map-style scaled bonus events | Brutal gear-sacrifice tier resets (destroy gear to tier up); spreadsheet-grade optimization barrier; combat micro (we stay economy-pure) |
| **NGU Idle** | Allocation / rebirth idle | Beat boss → unlock feature → split Energy/Magic across sinks → Rebirth for NUMBER mult | 3 (Rebirth → Evil → Sadistic difficulty tiers) | ~5 (Energy, Magic, Gold, EXP, Blood) | High (community NGUInjector; auto-merge @100, auto-allocate, auto-equip) | Yes — uncapped, log-curve keeps it sub-active | **Beards of Power** — passive mults growing with rebirth **duration** (fast=weak, slow=strong tension) | The compounding **NUMBER**-style multiplier kept across resets → our Æ/Ω meta-trees; allocation tension (Energy/Magic) → our Time-warp tick budget across stages; banked-levels QoL | Opaque 9-NGU/7-NGU stat soup needing a spreadsheet; injector-mandatory automation; difficulty-tier wall gating (no hard difficulty walls for us) |
| **Melvor Idle** | Skill-grind idle (RuneScape-like) | Timed skill action → XP + Mastery XP → unlock actions/gear → craft → push dungeons | 3 (Standard → Hardcore/Adventure modes → Ancient Relics) | ~5 (GP, Slayer Coins, Mastery XP, Abyssal track, Prayer) | Med (auto-eat tiers; passive timed actions; no resource autobuyers) | **Best-in-class** — full 24h simulation of last action on load | **Mastery Pool checkpoints** (10/25/50/95%) — a second progression axis layered atop skill XP, pool shared across a skill's items | 24h offline simulation as our gold standard; Mastery-Pool-style **per-stage milestone checkpoints** feeding LP (Ascension); "while you were away" summary | 29-skill breadth (we have 8 stages); permadeath/death-on-offline risk; over-cap XP loss (we never punish overflow) |
| **Idle Wizard** | Class / prestige-tier idle | Class spells generate Mana → Exile for Mysteries (permanent mult) → Realm prestige | 3 (Exile → Realm → Paragon attributes) | ~6 (Mana, Void Mana, Crafting Dust, Runes, Trophies, Catalysts) | Med (pet auto-actions; phase-based pet swaps) | Yes — buildup/burst/snap phase tuning | **Mystery formula** `floor((mana_exp − 12)/2)` + T2 hybrid classes combining two T1 mechanics | Hybrid-class fusion → our cross-stage link combos; phase-aware play (buildup vs burst) → our Time-warp burst windows; scarce gating resource (Dust) → our STARLIGHT rarity | Hard scarce-resource bottleneck (Dust) stalling progress; rune drip (1/24h) as a hard gate; opaque exponent prestige math surfaced to player |
| **Antimatter Dimensions** | Dimensional stack / number-go-up | Dim N+1 makes Dim N → buy-10 mults → Boost/Galaxy → Infinity → Eternity → Reality | 3 + (Infinity → Eternity → Reality; Dilation hard-mode) | ~7 (AM, IP, EP, Time Theorems, RM, Perk Pts, Dilated Time) | **Best-in-class** — full scripting Automator (`tt buy max`, conditional `infinity if…`) | Yes — Eternity Milestones grant offline EP | Each prestige layer **resets all below + adds a brand-new mechanic class** (not just a multiplier) | The 3+ meta-layer stack mapped to Ascension→Transcendence→Reality Reset; **new mechanic per layer** rule; buy-max closed form; eXXX number display; Automator-lite scripting at the Ω layer | Float-ceiling narrative dependence (we plan big-number lib early); raw spreadsheet endgame; zero theme/art (we are pixel-cozy-cosmic) |
| **The Prestige Tree** | Meta-framework / layer toolkit | Every resource = a tree node with its own currency, reset fn, and effect fn; resets cascade up | N (arbitrary stacked layers; ~6 in original) | ~6 (one per layer node) | Low (framework default; varies per mod) | Framework-dependent | **Cascading reset propagation** — `doReset(layer)` fires child `onReset` hooks; tree layout visual, reset depth programmatic | The **layer-node architecture** as our internal data model (each stage + meta layer = a node with `effect()`/`reset()`); cascade semantics for Transcendence/Reality Reset | Zero art/theme/juice (it's a dev toolkit); unbounded layer creep; no onboarding (we milestone-gate reveals) |
| **Farmer Against Potatoes Idle** | Combat / card meta idle | Fight potatoes → Skulls/Potatoes/Equipment → Reincarnate (RP, talents) → Ascend → Transcend | 3 (Reincarnation → Ascension @ 2500 RL → Transcendence, Jan 2026) | ~8 (Skulls, Potatoes, Milk, Residue, Poop, Confection, RP, Tokens) | Med (auto-combat; expedition timers; whack-a-mole every 10 min) | Yes — combat & factories run offline | **Expedition→Charge→Permanent-Card-Power** loop: timed expeditions convert temporary card power to permanent | Temporary-vs-permanent power split → our LP (permanent local) vs in-run buffs; timed **expedition** sends → Probe/Colony (SPACE) & Time-warp dispatch; +25%-per-Ascension scaling | Resource-web sprawl (8+ tangled currencies); 10-min whack-a-mole active chore; deep nesting that buries new players |
| **Synergism** | Cube / exponent-stack idle | Coins → Prestige → Transcension → Reincarnation → Ascension → Singularity; spend cubes/runes | 5 (+ Singularity meta) | ~9 (Coins, Offerings, Obtainium, Quarks, Golden Quarks, 5 cube tiers) | High (autobuyers across all tiers; auto-rune, auto-research) | Yes — offline tick accrual | **Challenge 15 (infinite)** — never completable; the C15 exponent reached is itself a permanent scaling stat re-pushed each run | Infinite-challenge **soft-target** idea for an endless Multiverse Convergence push; **Corruptions** (mult score while harshening play) → our optional Reality Reset modifiers; Singularity→Ω mapping | Currency overload (9+); brutal node costs (300B tributes); UI density that demands external guides |
| **Incremental Mass Rewritten** | Particle-physics number stack | Generate Mass → upgrades → Rank → Prestige → chain 8 named layers | 4+ (Rank → Prestige → Galactic → Ascension) | ~30+ (Mass, Neutron Stars, dozens of particle types) | Med (auto-rank, auto-buy upgrades unlock progressively) | Yes — passive mass accrual | **Collapsed Stars** multiply gain based on **all active rank types simultaneously** → rank diversity = multiplicative cascade | Diversity-rewards-multiplicatively → our Fortune mint summing **all** stage surpluses (`Σ log10(1+surplus)·weight`); 8-named-layer cadence mirrors our 8 stages; softcap-cascade discipline | 30+ currency explosion (unreadable); 8 stacked softcaps that obscure progress; physics jargon with no cozy theme |
| **Orb of Creation** | Spell-conjure / NG+ idle | Cast spells (keys 1–9) → conjure resources → Alchemy/Druidry/Rituals → restore world → NG+ | 1 (NG+ with randomized modifiers per run) | ~7 (Mana + spell-specific + Druidry plants + ritual-exclusive) | Med (post-ritual automation of some conversions) | Limited (active-cast focused) | **Mandatory cross-pillar loop**: Druidry feeds Alchemy feeds Ritual access feeds all three pillars; modifiers additive-within / multiplicative-across | Cross-pillar **forced interdependence** → our binding rules (Village LABOR→Farm/Mine; Ore+Power→Alloy); additive-in/multiplicative-across modifier math; NG+ randomized modifiers → Ω New-Game+ | Active-cast keyboard dependence (we are idle-first); ritual combat minigame; thin offline support |

### Quantified Snapshot (sortable design dials)

```
GAME                         PRESTIGE  CURRENCIES  AUTOMATION  OFFLINE    THEME/ART
                             LAYERS    (approx)    (1-5)       (1-5)      JUICE (1-5)
Fortune Mill                 1         5           2           4          3
Cookie Clicker               2         4           3           4          3
Realm Grinder                3         6           3           4          2
Trimps                       2         7           5           4          1
NGU Idle                     3         5           5           5          1
Melvor Idle                  3         5           3           5          3
Idle Wizard                  3         6           3           3          2
Antimatter Dimensions        3+        7           5           4          1
The Prestige Tree            N         6           1           2          0
Farmer Against Potatoes      3         8           3           4          3
Synergism                    5         9           5           4          2
Incremental Mass Rewritten   4+        30+         4           4          1
Orb of Creation              1         7           3           2          3
--------------------------------------------------------------------------------
COG & COSMOS (TARGET)        5         6 univ.*    4           5          5
                             stack     +2/stage
* FORTUNE, LEGACY, AETHER, OMEGA, TOKENS, STARLIGHT (universal) + 2 per stage (primary/secondary)
```

The target row is the explicit design contract: a **5-layer prestige stack** (Stage Prestige → Ascension → Transcendence → Reality Reset → Meta) matching Synergism's depth, **automation 4/5** (Antimatter-style scripting reserved for the Ω layer so it is a reward, not a baseline), **offline 5/5** (Melvor's 24h simulation), and **theme/juice 5/5** — the dimension every number-stack competitor (Trimps, NGU, AD, IMR all score 0–1) ignores, and our primary differentiator.

### Where COG & COSMOS Sits — Positioning Map

```
                 NUMBER-STACK DEPTH (formula complexity) ───────►
   LOW                            MID                          HIGH
 ┌─────────────────────────────────────────────────────────────────┐
 │ Fortune Mill        Cookie Clicker      Antimatter Dimensions    │ ◄ LOW
 │ Orb of Creation                         The Prestige Tree        │   theme/
 │                                                                   │   art
 │                  ┌───────────────────┐  Synergism                │   juice
 │   Melvor Idle    │   COG & COSMOS    │  Incremental Mass Rew.    │
 │   FAP Idle       │  (target zone)    │  NGU Idle / Trimps        │ ◄ HIGH
 │                  └───────────────────┘  Realm Grinder            │   theme/
 │  pixel-cozy + interdependent stages + meta-depth, readable UI    │   art
 └─────────────────────────────────────────────────────────────────┘
        ▲ COG & COSMOS claims the underserved quadrant:
          MID-to-HIGH number-stack depth WITH HIGH cozy-cosmic presentation.
          No competitor occupies "deep meta-progression + strong pixel theme + readable UI."
```

### Borrowed-Mechanic → Spec Mapping (with concrete formulas)

The five highest-value imports, restated in canonical spec terms so they are build-ready:

```
1) NEVER-ABANDON STAGE CHAIN  (from Fortune Mill)
   All 8 stages keep producing post-unlock and feed forward.
   output_stage = count * baseRate * tierMult * globalMult
   tierMult steps x7..x10 at counts {10,25,50,100,200,500}
   cost_n = base * r^n ,  r = 1.07 (VILLAGE) ... 1.15 (MULTIVERSE)

2) NEW-MECHANIC-PER-LAYER PRESTIGE  (from Antimatter Dimensions)
   Stage Prestige : gain = floor( k * (lifetimePrimary / softcap)^0.5 )   -> local-prestige currency (Renown..Convergence)
   Ascension      : resets one stage's local progress      -> LEGACY POINTS (LP), permanent local boosts
   Transcendence  : resets ALL stages + Fortune (keeps meta) -> AETHER (Æ)
   Reality Reset  : resets everything incl. Æ                -> OMEGA CORES (Ω) + NG+ modifiers
   Meta           : achievements/collections survive Ω
   Each layer MUST add a new mechanic class, never a bare multiplier.

3) FORTUNE MINT = DIVERSITY-REWARDS-MULTIPLICATIVELY  (from Incremental Mass Rewritten)
   dStar/dt = SUM_over_stages( log10(1 + stageSurplus) * fortuneWeight_stage * engineMult )
   -> unlocking MORE stages and balancing surplus beats over-pumping one stage.
   Engine SLOTS assign a stage's surplus to ★ conversion (weight varies by stage).

4) CROSS-PILLAR FORCED INTERDEPENDENCE  (from Orb of Creation + Fortune Mill)
   Village Townsfolk -> LABOR consumed by Farm & Mine
   Farm Grain        -> boosts Mine/Factory worker output
   Mine Ore + Factory Power -> inputs to Space Alloy
   Magic Mana        -> temp generator multiplier on ANY stage (enchant)
   Time Chronons     -> buy time-warp ticks (burst offline-like gains) on a chosen stage
   Multiverse Shards -> duplicate a chosen stage's production by %
   Modifier stacking: additive within a source, multiplicative across sources.

5) BEST-IN-CLASS OFFLINE + WHILE-YOU-WERE-AWAY  (from Melvor Idle)
   gained = prodPerSec * elapsed * efficiency
   efficiency = 1.00  for elapsed <= 2h (base window)
              = 0.25..0.50  beyond, window extends toward ~24h via upgrades
   Show a juicy "while you were away" per-stage summary on load.
```

### Top 7 Lessons Distilled

1. **Never abandon a stage — interdependence is the whole game.** Fortune Mill's room chain and Orb of Creation's forced cross-pillar loop both prove that *parallel, mutually-feeding* economies beat a single fast loop. Our 8 stages must visibly feed each other (LABOR, Grain, Ore+Power→Alloy, Mana, Chronons, Shards), and the Fortune Engine's `Σ log10(1+surplus)·weight` mint rewards breadth over single-stage pumping.

2. **Every prestige layer must add a NEW MECHANIC CLASS, not just a bigger multiplier.** Antimatter Dimensions' D7 retention comes from Infinity→Eternity→Reality each introducing a genuinely new system. Our 5-layer stack (Stage Prestige → Ascension/LP → Transcendence/Æ → Reality Reset/Ω → Meta) must each unlock a distinct mechanic; pure-multiplier stacks (late Cookie Clicker) cause sharp D7 drop-off.

3. **Offline is a first-class feature, not an afterthought — target Melvor's 24h.** 100% efficiency for a 2h base window, then 25–50% decay extending toward ~24h via upgrades, plus a satisfying "while you were away" per-stage summary. This is the single strongest retention lever for working-adult players and the #1 driver of D1→D7 survival.

4. **Theme and juice are the unclaimed competitive quadrant.** Every deep number-stack competitor (Trimps, NGU, Antimatter Dimensions, Incremental Mass, Synergism) scores 0–2 on art/theme. The pixel-art cozy-cosmic palette, number-pop juice, parallax backdrops, and 16×16/32×32 sprites are not decoration — they are the moat. Depth *with* charm is the open lane.

5. **Reward diversity multiplicatively; never let one stage dominate.** Incremental Mass's Collapsed Stars (mult by all active rank types) and Cookie Clicker's bidirectional synergy upgrades (+5% per paired unit) both teach that the richest progression comes from *balancing* systems. The log-sum Fortune mint and cross-stage links enforce this — a player who balances all 8 stages out-earns one who over-invests in a single stage.

6. **Gate complexity behind milestones; reveal systems progressively.** Antimatter Dimensions paces ~200h by graying-out then revealing tiers; Melvor's Mastery-Pool checkpoints (10/25/50/95%) add a second axis without front-loading it. Avoid Synergism's/Incremental Mass's currency overload (9–30+ visible at once) — surface our 6 universal + 2-per-stage currencies only as each stage and meta layer unlocks, using the "mystery box" gray-to-reveal effect.

7. **Make automation a prestige reward, and keep the UI readable.** Antimatter Dimensions ties its Automator to Eternity Milestones; we reserve scripting-lite autobuyers and Engine-slot automation to the Ascension/Transcendence/Ω layers so automation *feels earned*. Use buy-max closed form `floor(log_r(1 + currency·(r−1)/(base·r^n)))`, standard x1/x10/x100/Max buttons, and `eXXX` number formatting — borrowing the math rigor of the hardcore games while rejecting their spreadsheet-grade opacity.

---

## Core Gameplay Loop & Player Journey

### Overview: Four Nested Loops

COG & COSMOS is structured as four concentric feedback loops, each wrapping the one below it. The inner loop (seconds) produces the resources the outer loops (minutes → hours → weeks) consume and convert into permanent power. The binding thread through every loop is the **Fortune Engine**: it siphons surplus from every unlocked stage and mints **FORTUNE (★)**, the one currency that touches all eight stages and survives every soft reset.

| Loop | Cadence | Primary verb | Resource produced | Resource consumed | Player feeling |
|---|---|---|---|---|---|
| Moment-to-moment | 1–30 s | Buy generator / tap | Primary currency (¢, Grain, Ore…) | Primary currency | "number go up" |
| Session | 5–20 min | Spend ★ on upgrades & links | FORTUNE (★) | Stage surplus | "I unlocked a thing" |
| Daily | 1–3 sessions/day | Collect offline batch, set tasks | Stage prestige, LP | Lifetime primary | "I came back stronger" |
| Meta | Days → weeks | Transcend / Reality Reset | Æ, Ω | Everything below | "I rebuilt the universe" |

---

### The Central Engine Diagram (the spine of all four loops)

```
                          ┌─────────────────────────────────────────────┐
                          │            8 STAGE ECONOMIES                 │
                          │  Village  Farm  Mine  Factory                │
                          │  Magic    Space Time  Multiverse             │
                          │                                              │
                          │  each: count*baseRate*tierMult*globalMult    │
                          └───────────────┬─────────────────────────────┘
                                          │ surplus (output above local spend)
                                          ▼
                          ┌─────────────────────────────────────────────┐
       buy more  ◄────┐   │           THE FORTUNE ENGINE (Mill)          │
       generators     │   │   SLOTS: assign stage → slot → ★ weight      │
       (primary $)    │   │                                              │
                      │   │  dStar/dt = Σ_stages                         │
            ┌─────────┴─┐ │     log10(1+stageSurplus)                    │
            │  STAGE    │ │       * fortuneWeight_stage * engineMult     │
            │ PRODUCTION│ │                                              │
            └─────────▲─┘ └───────────────┬─────────────────────────────┘
                      │                   │ mints
        globalMult ▲  │                   ▼
        link buffs ▲  │   ┌─────────────────────────────────────────────┐
                   │  │   │              FORTUNE (★) POOL                 │
                   │  └───┤                                              │
                   │      │  spend on:                                   │
                   └──────┤   • Global skill tree (multiplies all stages)│
            cross-stage   │   • Cross-stage links (Village→Farm labor…)  │
            links &       │   • Engine upgrades (engineMult, more slots) │
            global mult   │   • Offline-window upgrades (2h → 24h)        │
                          └─────────────────────────────────────────────┘
```

The loop is self-reinforcing: more generators → more surplus → more ★/sec → upgrades that raise `globalMult`, `engineMult`, and link buffs → even more surplus. Square-root prestige and soft caps (below) keep it from running away.

---

### Loop 1 — Moment-to-Moment (1–30 seconds)

The atomic loop. The player watches a primary currency tick up and spends it the instant a generator becomes affordable.

```
   ┌───────────────────────────────────────────────────┐
   │                                                   │
   ▼                                                   │
[currency ticks]──►[generator affordable?]──no──►[wait/tap]
   ▲                       │ yes                       │
   │                       ▼                           │
   │              [buy x1 / x10 / xMax]                │
   │                       │                           │
   │                       ▼                           │
   │         [cost_n = base * r^n  rises]              │
   │         [output = count*baseRate*tierMult]        │
   │                       │                           │
   └───────[milestone? x7–x10 tierMult pop]◄───────────┘
                  (count = 10/25/50/100/200/500)
```

| Element | Formula / value | Example (Village, Cottage) |
|---|---|---|
| Cost growth | `cost_n = base * r^n`, r≈1.07 early | base 15¢, n=10 → 15·1.07¹⁰ ≈ 29.5¢ |
| Bulk buy (closed form) | `cost(n→n+k)= base·r^n·(r^k−1)/(r−1)` | buy 10 from 0 ≈ 207¢ |
| Output | `count*baseRate*tierMult*globalMult` | 10 Cottages · 0.1 · x1 · x1 = 1.0 ¢/s |
| Milestone pop | tierMult x7…x10 at 10/25/50/100/200/500 | 25th Cottage → x7 tier → big number-pop juice |

Reward delivery: every purchase fires a floating "+N" number-pop and a 16×16 sprite animation (a new townsfolk walks on). Milestone crossings flash the parallax backdrop. This is the "always-making-progress signal" that prevents D1 churn.

---

### Loop 2 — Session (5–20 minutes)

One sitting. The player accumulates enough surplus that the Fortune Engine mints a meaningful ★ batch, then spends ★ on the global tree, a cross-stage link, or an engine upgrade — each of which visibly raises output everywhere.

```
 [open game]──►[collect offline ★ + stage batches]
                          │
                          ▼
        [push 1–2 stages: buy generators to next milestone]
                          │
                          ▼
        [Fortune Engine mints ★ from rising surplus]
                          │
                          ▼
        ┌─────── spend ★ ───────┬───────────────┬──────────────┐
        ▼                       ▼               ▼              ▼
 [Global skill node]   [Cross-stage link]  [Engine upgrade] [Offline cap+]
 multiplies all stages  Village→Farm labor   engineMult++     2h→…→24h
        │                       │               │              │
        └───────────────────────┴───────┬───────┴──────────────┘
                                         ▼
                              [globalMult / surplus rise]
                                         │
                                         └──►(back to push stages)
```

Cross-stage links are the session-level "unlock a thing" beat and make interdependence visible:

| Link | Source → Target | Effect |
|---|---|---|
| Labor | Village Townsfolk → Farm, Mine | +x% output scaled by Townsfolk count |
| Provision | Farm Grain → Mine, Factory | feeds workers, boosts their baseRate |
| Supply chain | Mine Ore + Factory Power → Space | enables Alloy production |
| Enchant | Magic Mana → any stage | temporary generator multiplier |
| Time-warp | Time Chronons → any stage | burst of offline-like ticks |
| Duplicate | Multiverse Shards → any stage | duplicates % of that stage's output |

---

### Loop 3 — Daily (1–3 sessions per day)

The return loop. Offline progress + per-stage prestige/Ascension give the player a reason to leave and a reward for coming back.

```
[log off]──►[offline accrues]──►[log in next session]
                 │                       │
                 │ 100% rate ≤2h base    ▼
                 │ then 25–50% to ~24h  [WHILE-YOU-WERE-AWAY summary]
                 ▼                       │  (★ minted, per-stage gains)
   gained = rate * elapsed * eff         ▼
                              [stage prestige?  ┌─ soft reset 1 stage]
                              [Ascension?       └─ LP for local boosts]
                                         │
                                         ▼
                        [spend prestige currency / LP on local trees]
                                         │
                                         └──►(stronger restart, faster milestones)
```

| Mechanic | Formula | Concrete example |
|---|---|---|
| Offline gain | `gained = rate * elapsed * eff` | 5 ¢/s · 2h · 1.0 = 36,000¢; next 4h @ 0.5 |
| Offline window | 100% to 2h base, 25–50% after, cap → ~24h via ★ upgrades | upgrade extends 100% band and tail |
| Stage prestige (soft) | `gain = floor(k·(lifetimePrimary/softcap)^0.5)` | k=1, lifetime 1e8, softcap 1e6 → floor(10)=10 Renown |
| Soft cap | `eff(x)=C·(1+(x−C)/C)^0.5` | past C=1e6, 4e6 raw → ~1e6·√4 = 2e6 eff |
| Ascension | reset one stage's local progress → LP (per stage) | Village Ascension → LP for permanent Village boosts |

Square-root prestige (exponent 0.5) is deliberately lenient (AdVenture Capitalist pattern: 4× lifetime = 2× prestige), so the first stage prestige lands inside one day and the "first prestige" LTV anchor fires early.

---

### Loop 4 — Meta (days → weeks)

The outermost loop. Two stacked global resets sit above per-stage prestige, each introducing a genuinely new mechanic class rather than a flat multiplier (the Antimatter Dimensions design law).

```
   per-stage Ascension (LP)
            │
            ▼
   ┌──────────────────┐  resets ALL stages + ★, keeps meta
   │  TRANSCENDENCE   │──► AETHER (Æ) ──► global/ascension meta trees
   └──────────────────┘
            │
            ▼
   ┌──────────────────┐  resets everything incl. Æ
   │  REALITY RESET   │──► OMEGA CORES (Ω) ──► New-Game+ modifiers + permanent QoL
   └──────────────────┘
            │
            ▼
   META (achievements / collections / permanent unlocks survive Ω)
        → feed back as flat global multipliers & QoL automation
```

| Layer | Trigger | Yields | Resets | Persists |
|---|---|---|---|---|
| Stage Prestige | soft, per stage | local prestige currency (Renown…Convergence) | one stage's generators/primary | ★, other stages, meta |
| Ascension | per stage | LEGACY POINTS (LP) | one stage's local progress | ★, meta, other stages |
| Transcendence | global | AETHER (Æ) | all stages + ★ | Æ trees, achievements, Ω, unlocks |
| Reality Reset | top layer | OMEGA CORES (Ω) | everything incl. Æ | Ω modifiers, permanent QoL, collections |
| Meta | continuous | achievements, collections | nothing | survives Ω forever |

**Reset payoff ratios:** first stage prestige ≈ 30–60 min in; first Ascension ≈ day 1–2; first Transcendence ≈ day 5–10; first Reality Reset ≈ week 3+. Each layer should let the player re-reach the prior milestone 3–10× faster (the prestige reward *is* the catch-up — no separate catch-up currency needed).

---

### First-15-Minutes Onboarding Script

Single stage on screen (Village only). No menus, no jargon. Each beat unlocks exactly one previously-grayed UI element ("mystery box" reveal).

| Time | Trigger | Event / teach | UI reveal |
|---|---|---|---|
| 0:00 | Load | Cold open on Village backdrop; one button: **"Build Cottage (15¢)"**. Player starts with 15¢. | Cottage button |
| 0:05 | First buy | Cottage built, sprite townsfolk walks on, "+0.1 ¢/s" number-pop. Coins now tick. | Coins/sec readout |
| 0:30 | 3rd Cottage | Tooltip: "Cottages make Coins even while you wait." Idle income established. | x1 / x10 buy toggle |
| 1:30 | ~10 Cottages | **Milestone x7 tier pop** — screen flash, backdrop parallax shifts. Teaches milestone juice. | Milestone tracker bar |
| 3:00 | Wood appears | Second Village currency (Wood) unlocks; a generator now needs Wood. Teaches secondary-currency gating. | Wood readout + Lumber generator |
| 5:00 | First ★ minted | **THE FORTUNE ENGINE** boots with a cinematic pixel animation; siphons Village surplus, mints first ★. Teaches the spine. | Engine panel + ★ counter |
| 6:30 | Spend first ★ | Prompt: "Spend ★ on **+25% all Village output**." First global-tree node. Output visibly jumps. | Global skill tree (1 node lit) |
| 9:00 | Surplus climbs | **FARM unlocks** (Stage 2). Tutorial: drag Village into an Engine slot; assign Townsfolk **Labor link** to Farm. Teaches interdependence + slots. | Stage 2 tab + Engine slot + first link |
| 12:00 | Farm rolling | Both stages mint ★. "While You Were Away" summary previewed via a forced 30 s fast-forward demo. Teaches offline value. | Offline summary modal |
| 14:00 | First soft reset preview | Renown prestige node appears grayed with "Prestige Village soon for permanent Renown." Plants the prestige hook. | Renown / prestige button (locked preview) |

By 15:00 the player has touched all four loops in miniature: bought generators (L1), spent ★ (L2), seen an offline summary (L3), and previewed prestige (L4) — and has witnessed two stages feeding one Engine.

---

### 8-Stage Unlock Cadence

Each stage unlocks at a surplus/★ threshold (not a timer) but the hour-marks below assume average active+idle pacing. Critically, **every stage teaches one new system layered on the existing economy** — never just "another currency."

| # | Stage | ~Hour mark | Unlock gate | NEW system it teaches | Cross-stage binding introduced |
|---|---|---|---|---|---|
| 1 | VILLAGE | 0:00 | start | Generators, milestones, the Fortune Engine itself | (baseline) Townsfolk = LABOR source |
| 2 | FARM | 0:10 | first ★ surplus | Engine **slots** + first cross-stage **link** (Labor) | Village Townsfolk → Farm labor |
| 3 | MINE | 0:45 | Village+Farm surplus | **Secondary-resource sinks** (Gems) + **Depth** local prestige | Farm Grain feeds Mine workers; Village labor → Mine |
| 4 | FACTORY | 2:30 | Mine Ore threshold | **Stage Prestige** taught fully (Renown→Patents); Power(kW) as a consumed input | Grain feeds Factory workers; Power feeds Space later |
| 5 | MAGIC REALM | 6:00 | Factory Widgets + first Ascension | **Ascension (LP)** + **temporary buff links** (Enchant) | Mana enchants ANY stage's generators |
| 6 | SPACE | 12:00 | Mine Ore + Factory Power combined | **Multi-input recipes** (Ore+Power→Alloy) — true convergence | Space consumes two prior stages' outputs |
| 7 | TIME | 24:00 | Space Stardust + Transcendence unlock | **Transcendence (Æ)** + **time-warp** burst links | Chronons buy warp ticks for any stage |
| 8 | MULTIVERSE | 48:00+ | Time Chronons + meta gate | **Reality Reset (Ω)** + **duplication** links + New-Game+ | Shards duplicate % of any stage's output |

Pacing rationale: stages 1–3 front-load fast dopamine (first three within the first hour — the "first prestige within 60–90 min" LTV target). Stages 4–6 stretch to teach the prestige stack and multi-input convergence. Stages 7–8 are week-scale and gate the meta resets, so the long tail always has a named milestone ahead (the AD ~200-hour reveal cadence).

---

### Retention Hooks by Phase

| Phase | ~Window | Core hook | Specific mechanics |
|---|---|---|---|
| **Early** | 0–2h (Stages 1–3) | Constant unlocks; "mystery box" reveals | One UI element per beat; milestone x7–x10 pops every few min; first ★ + first link; first stage prestige preview by 15 min |
| **Mid** | 2–24h (Stages 4–6) | Prestige & Ascension loops + convergence puzzles | First Renown prestige (sqrt gain feels generous); first Ascension → LP local tree; Space multi-input recipe (Ore+Power→Alloy) makes earlier stages matter; offline window upgrades (2h→24h) reward daily check-ins |
| **Late** | 1–7 days (Stages 7–8) | Global meta resets + build identity | Transcendence (Æ) global tree; time-warp + duplicate links create stacking strategies (Realm Grinder faction-style "different run each time" via which links/slots you prioritize); Engine slot optimization |
| **Endgame** | 1 week+ (post-Stage 8) | Reality Reset NG+ + completion | Omega Cores unlock New-Game+ modifiers; achievement/collection meta that survives Ω grants flat global mults (Cookie Clicker milk pattern); seasonal **TOKENS** events + rare **STARLIGHT** drops; engine-weight min-maxing for ★/sec records |

**Cross-phase retention spine:** every phase always shows (1) a number going up right now, (2) a ★ purchase one session away, (3) a stage prestige/Ascension one day away, and (4) a named meta layer one week away. No matter when the player checks in, all four loops have a visible, reachable next reward — which is the structural defense against the genre's characteristic D7 drop-off.

---

## Stage Design — Part I: Village, Farm, Mine, Factory

This part details the first four stages of the eight-stage chain. Each is a self-contained idle economy that, once unlocked, **never stops producing** and feeds forward via the SPEC binding rules. All four route surplus into THE FORTUNE ENGINE for ★ minting. Numeric baselines (cost growth `r`, milestone tiers x7–x10 at 10/25/50/100/200/500, sqrt-prestige, soft caps, offline window) are inherited from the canonical spec and reused verbatim.

```
GLOBAL FLOW (Part I scope)
                                  LABOR
  ┌──────────┐  Townsfolk ──────────────────┐
  │ VILLAGE  │  Coins(¢) / Wood             │
  └────┬─────┘                              ▼
       │ surplus ★            ┌──────────┐ Grain  ┌──────────┐
       │                      │   FARM   │──────► │   MINE   │
       │                      │Grain/Watr│ feeds  │ Ore/Gems │
       │                      └────┬─────┘ workers└────┬─────┘
       │ surplus ★                 │ surplus ★         │ Ore
       ▼                           ▼                   ▼
  ╔════════════════════ THE FORTUNE ENGINE (slots → ★) ════════════════════╗
       ▲                                               ┌──────────┐
       │ surplus ★              Grain feeds workers ──►│ FACTORY  │
       └───────────────────────── Power(kW) ──────────►│Widget/kW │
                                  + Mine Ore ──────────►└──────────┘
                                  (Ore+Power → Space Alloy, Stage 6)
```

---

### Stage 1 — VILLAGE

#### Theme & Narrative
A medieval hamlet waking at dawn. The player nudges a sleepy cluster of cottages into a thriving township: cut wood, mint Coins, recruit Townsfolk. The Village is the **labor wellspring** of the entire game — its Townsfolk are exported as LABOR to the Farm and Mine, so Village never becomes vestigial.

#### Main Loop
```
Chop Wood → build Cottages/Townsfolk → Coins(¢) accumulate
        → spend ¢ on more generators & upgrades → surplus ¢ siphoned by Engine → ★
        → Townsfolk exported as LABOR → buffs Farm & Mine
Prestige axis: ASCEND → Renown → permanent local boosts
```

- **Primary currency:** Coins (¢)
- **Secondary currency:** Wood (gates building tiers; consumed by construction-type generators)

#### Generators / Buildings
`output = count * baseRate * tierMult * globalMult`; cost `cost_n = base * r^n`.

| Name | Role | Base cost | Growth r | Base output | Milestone bonuses |
|---|---|---|---|---|---|
| Woodcutter | Produces Wood (secondary) | 15 ¢ | 1.07 | 0.10 Wood/s | x7 @10, x7 @25, x8 @50, x9 @100, x10 @200 |
| Cottage | Produces ¢ (housing income) | 100 ¢ | 1.07 | 1.0 ¢/s | x7 @10, x8 @25, x9 @50, x10 @100, x10 @200 |
| Townsfolk | Produces ¢ **and** emits LABOR | 1,100 ¢ + 20 Wood | 1.08 | 3.0 ¢/s; 0.05 LABOR/s | x7 @10, x8 @25, x9 @50, x10 @100 |
| Market Stall | Converts Wood → ¢ (trade) | 12,000 ¢ | 1.09 | 8 ¢/s per 1 Wood/s consumed | x7 @10, x8 @25, x9 @50, x10 @100 |
| Town Hall | Global ¢ multiplier per level | 130,000 ¢ + 250 Wood | 1.10 | +4% global ¢ mult / level | x8 @10, x9 @25, x10 @50 |

```
Example — Cottage cost to buy 10→20 (bulk closed form):
cost = base * r^n * (r^k - 1)/(r - 1)
     = 100 * 1.07^10 * (1.07^10 - 1)/(1.07 - 1)
     = 100 * 1.9672 * (0.9672/0.07)
     ≈ 100 * 1.9672 * 13.816 ≈ 2,718 ¢
```

#### Local Skill Tree (spends Renown)
```
            ┌─ Sharper Axes  (+25% Woodcutter output)
[ROOT]──────┼─ Town Charter  (+15% all ¢ generators)
            ├─ Guild Labor   (+20% LABOR export rate)        ── synergy node
            └─ Apprenticeship (Townsfolk also +0.02 LABOR/s)
                   └─ Master Guilds (LABOR export +50%, requires Guild Labor)
```
- Tree currency: **Renown**. Nodes cost 1→2→4→8 Renown along a branch (doubling).

#### Prestige Block — ASCENSION (Renown / Renown is also the local-prestige currency name in SPEC)
- **Local prestige currency:** Renown (per-stage, soft prestige). LP generated on Ascension feeds the global Ascension meta tree.
```
gain = floor( k * (lifetimeCoins / softcap)^0.5 )      # square-root prestige
Village: k = 12, softcap = 1e6 ¢
Example: lifetimeCoins = 4e8 ⇒ gain = floor(12 * (400)^0.5) = floor(12*20) = 240 Renown
```
- **Resets:** all ¢, Wood, generator counts, local upgrade purchases.
- **Keeps:** Renown total, skill-tree nodes, achievements, FORTUNE (★ never reset by stage prestige), Engine slot assignment.
- **Rewards:** each Renown = +0.5% global ¢ multiplier (additive stack); skill-tree unlocks; +1% LABOR export ceiling per 50 Renown.

#### Automation Upgrades
| Upgrade | Unlock | Effect |
|---|---|---|
| Auto-Woodcutter | 25 Woodcutters | Auto-buys Woodcutter when affordable |
| Auto-Builder | 50 Cottages | Buy-Max queue for ¢ generators (uses bulk formula) |
| Foreman | 100 Renown | Smart priority: buys best ¢/cost ratio each tick |
| Offline Census | Town Hall lv5 | +1h offline cap; "while you were away" Village summary |

#### Rare Events
- **Traveling Merchant** (every 300–900 s, lasts 13 s): click to trade Wood for a 2–5x ¢ windfall (Golden-Cookie analogue).
- **Harvest Festival** (rare): +100% LABOR export and +50% ¢ for 60 s; awards 1 TOKEN.
- **Lost Caravan** (STARLIGHT event, ~0.5%): grants 1 STARLIGHT + a permanent +2% Townsfolk output.

#### Unlock Requirement
- **Available at game start** (the seed stage; no prerequisite).

#### Synergies — IN / OUT
| Direction | Binding (per SPEC) | Mechanic |
|---|---|---|
| OUT | Village Townsfolk → **LABOR** → Farm & Mine | LABOR pool = Σ Townsfolk LABOR/s; consumed as a production multiplier downstream |
| OUT | Surplus ¢ → Fortune Engine slot | `log10(1+stageSurplus) * fortuneWeight_Village(=1.0) * engineMult` |
| IN | Magic Mana enchant (Stage 5) | temporary x mult on Village generators |
| IN | Time Chronons warp (Stage 7) | burst offline-like ¢ tick |

---

### Stage 2 — FARM

#### Theme & Narrative
Rolling pastoral fields downstream of the Village. Townsfolk arrive as **LABOR** to till Fields and tend Livestock. The Farm's Grain is the food supply that **feeds Mine and Factory workers**, boosting their output — making Farm a permanent logistics hub.

#### Main Loop
```
Receive LABOR (from Village) → work Fields/Livestock → Grain accumulates (gated by Water)
        → spend Grain on generators/upgrades → surplus Grain → Engine → ★
        → export Grain as worker-food → buffs Mine & Factory
Prestige axis: ASCEND → Heritage → permanent local boosts
```

- **Primary currency:** Grain
- **Secondary currency:** Water (gates irrigation tiers; consumed by Fields)

#### Generators / Buildings

| Name | Role | Base cost | Growth r | Base output | Milestone bonuses |
|---|---|---|---|---|---|
| Well | Produces Water (secondary) | 20 Grain | 1.08 | 0.12 Water/s | x7 @10, x7 @25, x8 @50, x9 @100, x10 @200 |
| Field | Produces Grain (consumes Water) | 120 Grain | 1.08 | 1.2 Grain/s per Water-irrigated | x7 @10, x8 @25, x9 @50, x10 @100, x10 @200 |
| Livestock | Produces Grain; scales with LABOR | 1,400 Grain | 1.09 | 3.5 Grain/s | x7 @10, x8 @25, x9 @50, x10 @100 |
| Granary | Stores + multiplies Grain output | 18,000 Grain | 1.10 | +5% global Grain / level | x8 @10, x9 @25, x10 @50 |
| Mill House | Converts Water → Grain (the local "fortune mill" nod) | 150,000 Grain + 300 Water | 1.11 | 10 Grain/s per 1 Water/s | x8 @10, x9 @25, x10 @50 |

```
LABOR multiplier on Livestock & Fields:
laborMult = 1 + 0.15 * log10(1 + LABOR_assigned)
Example: 5,000 LABOR ⇒ 1 + 0.15*log10(5001) = 1 + 0.15*3.699 ≈ 1.555 (×1.55)
```

#### Local Skill Tree (spends Heritage)
```
            ┌─ Crop Rotation   (+25% Field output)
[ROOT]──────┼─ Irrigation      (+30% Water from Wells)
            ├─ Hearty Feed     (+25% Grain→worker-food export)   ── synergy node
            └─ Selective Breeding (Livestock laborMult coeff 0.15→0.22)
                   └─ Granary Network (+40% Grain export ceiling, req. Hearty Feed)
```

#### Prestige Block — ASCENSION (Heritage)
```
gain = floor( k * (lifetimeGrain / softcap)^0.5 )
Farm: k = 10, softcap = 1e6 Grain
Example: lifetimeGrain = 2.5e8 ⇒ floor(10*(250)^0.5)=floor(10*15.81)=158 Heritage
```
- **Resets:** Grain, Water, generator counts, local upgrades.
- **Keeps:** Heritage, skill nodes, achievements, ★, Engine slot, inbound LABOR link.
- **Rewards:** each Heritage = +0.5% global Grain mult; +1% worker-food export per 40 Heritage; unlock irrigation tiers.

#### Automation Upgrades
| Upgrade | Unlock | Effect |
|---|---|---|
| Auto-Well | 25 Wells | Auto-buy Water generators |
| Auto-Sow | 50 Fields | Buy-Max queue for Grain generators |
| Steward | 150 Heritage | Smart priority buyer (best Grain/cost ratio) |
| Silo Logistics | Granary lv5 | +2h offline cap; auto-balances Water→Grain conversion |

#### Rare Events
- **Bumper Crop** (300–900 s, 13 s): click for 3–6x Grain windfall.
- **Drought** (Wrinkler-analogue tension event): −50% Water for 90 s, but **pops** at end for a x1.8 Grain lump on accumulated deficit; rare "shiny" drought pays x3.3.
- **Heirloom Seed** (STARLIGHT ~0.5%): +1 STARLIGHT + permanent +3% Field output.

#### Unlock Requirement
- **Unlocked when Village reaches 5,000 lifetime ¢** *and* exports ≥ 1 LABOR/s (first LABOR link establishes the Farm).

#### Synergies — IN / OUT
| Direction | Binding (per SPEC) | Mechanic |
|---|---|---|
| IN | Village **LABOR** → Farm | `laborMult` boosts Fields & Livestock |
| OUT | Farm **Grain** → feeds Mine/Factory workers | worker-food mult on Mine & Factory generators |
| OUT | Surplus Grain → Engine slot | `fortuneWeight_Farm = 1.1` |
| IN | Magic Mana enchant; Time Chronons warp; Multiverse Shards duplicate | per-SPEC universal hooks |

---

### Stage 3 — MINE

#### Theme & Narrative
Deep caverns beneath the Farm. Shafts and Drills bite into the rock for Ore and rare Gems. Mine workers are **fed by Farm Grain** (output boost) and labor is **drawn from the Village**. Mine Ore is a critical upstream input — combined later with Factory Power to make **Space Alloy** (Stage 6).

#### Main Loop
```
LABOR (Village) + worker-food (Farm Grain) → run Shafts/Drills → Ore + Gems
        → spend Ore on generators/upgrades → surplus Ore → Engine → ★
        → export Ore upstream (→ Factory/Space Alloy chain)
Prestige axis: ASCEND → Depth → permanent local boosts
```

- **Primary currency:** Ore
- **Secondary currency:** Gems (rare; gate deep tiers, multiply Drill output)

#### Generators / Buildings

| Name | Role | Base cost | Growth r | Base output | Milestone bonuses |
|---|---|---|---|---|---|
| Shaft | Produces Ore | 200 Ore | 1.09 | 1.5 Ore/s | x7 @10, x8 @25, x9 @50, x10 @100, x10 @200 |
| Drill | Produces Ore (scales w/ Gems) | 2,500 Ore | 1.10 | 5 Ore/s, +1%/Gem-tier | x7 @10, x8 @25, x9 @50, x10 @100 |
| Gem Vein | Produces Gems (secondary) | 30,000 Ore | 1.11 | 0.02 Gems/s | x7 @10, x8 @25, x9 @50 |
| Smelter | Refines Ore (×output, consumes food) | 250,000 Ore + 5 Gems | 1.12 | +6% global Ore / level | x8 @10, x9 @25, x10 @50 |
| Deep Core | High-tier Ore; needs Depth unlock | 4e6 Ore + 50 Gems | 1.13 | 40 Ore/s | x8 @10, x9 @25, x10 @50 |

```
Worker-food (Farm Grain) boost on Mine generators:
foodMult = 1 + 0.20 * (1 - e^(-GrainExport/G0)),  G0 = 5,000 Grain/s
Example: GrainExport = 5,000 ⇒ 1 + 0.20*(1 - e^-1) = 1 + 0.20*0.632 ≈ 1.126 (×1.13)
Asymptote: max +20% as Grain export → ∞ (soft, non-runaway).
```

#### Local Skill Tree (spends Depth)
```
            ┌─ Reinforced Shafts (+25% Shaft output)
[ROOT]──────┼─ Gem Cutting       (+30% Gem yield; +Drill Gem-scaling)
            ├─ Rationed Mess Hall(+ foodMult coeff 0.20→0.28)   ── synergy node
            └─ Tunnel Network     (unlock Deep Core tier)
                   └─ Ore Conveyor (+40% Ore export to Factory/Space, req. Tunnel)
```

#### Prestige Block — ASCENSION (Depth)
```
gain = floor( k * (lifetimeOre / softcap)^0.5 )
Mine: k = 9, softcap = 2e6 Ore
Example: lifetimeOre = 8e8 ⇒ floor(9*(400)^0.5)=floor(9*20)=180 Depth
```
- **Resets:** Ore, Gems, generator counts, local upgrades.
- **Keeps:** Depth, skill nodes, achievements, ★, Engine slot, inbound LABOR + Grain links.
- **Rewards:** each Depth = +0.5% global Ore mult; +1% Ore export ceiling per 35 Depth; deep-tier unlocks.

#### Automation Upgrades
| Upgrade | Unlock | Effect |
|---|---|---|
| Auto-Shaft | 25 Shafts | Auto-buy Ore generators |
| Auto-Drill | 50 Drills | Buy-Max queue, Gem-aware |
| Pit Boss | 150 Depth | Smart priority (best Ore/cost ratio) |
| Cart Logistics | Smelter lv5 | +2h offline cap; auto-routes Ore export |

#### Rare Events
- **Mother Lode** (300–900 s, 13 s): click for 4–8x Ore windfall.
- **Cave-In** (tension event): production −60% for 120 s, then **collapses** into a x2.0 Ore lump from the buried backlog; "shiny" cave-in pays x3.3 and +1 Gem.
- **Crystal Geode** (STARLIGHT ~0.5%): +1 STARLIGHT, +5 Gems, permanent +3% Drill output.

#### Unlock Requirement
- **Unlocked when Village exports ≥ 2 LABOR/s** *and* Farm reaches 10,000 lifetime Grain (needs both labor + food before digging).

#### Synergies — IN / OUT
| Direction | Binding (per SPEC) | Mechanic |
|---|---|---|
| IN | Village **LABOR** → Mine | base output multiplier (laborMult, coeff 0.12) |
| IN | Farm **Grain** → Mine workers | `foodMult` (asymptotic +20%) |
| OUT | Mine **Ore** → Factory + Space Alloy chain | Ore export feeds Stage 4 & Stage 6 recipe |
| OUT | Surplus Ore → Engine slot | `fortuneWeight_Mine = 1.25` |
| IN | Magic Mana / Time Chronons / Multiverse Shards | universal hooks per SPEC |

---

### Stage 4 — FACTORY

#### Theme & Narrative
Industrial assembly halls fed by Mine Ore and powered by on-site generators. Assembly Lines and Robots stamp out Widgets; the plant's Power (kW) is the other half of the **Ore + Power → Space Alloy** recipe (Stage 6). Factory workers eat **Farm Grain** to stay productive.

#### Main Loop
```
Mine Ore (input) + worker-food (Farm Grain) → Assembly Lines/Robots → Widgets (gated by Power kW)
        → spend Widgets on generators/upgrades → surplus Widgets → Engine → ★
        → export Power(kW) + draw Ore → Space Alloy recipe (Stage 6)
Prestige axis: ASCEND → Patents → permanent local boosts
```

- **Primary currency:** Widgets
- **Secondary currency:** Power (kW) (gates throughput; consumed by Assembly Lines/Robots)

#### Generators / Buildings
Late-stage growth rates skew toward the upper SPEC band (~1.15).

| Name | Role | Base cost | Growth r | Base output | Milestone bonuses |
|---|---|---|---|---|---|
| Generator (kW) | Produces Power (secondary) | 500 Widgets | 1.11 | 0.20 kW/s | x7 @10, x8 @25, x9 @50, x10 @100 |
| Assembly Line | Produces Widgets (consumes kW + Ore) | 6,000 Widgets | 1.12 | 4 Widgets/s per kW | x7 @10, x8 @25, x9 @50, x10 @100, x10 @200 |
| Robot | Produces Widgets; self-scaling | 80,000 Widgets + 20 Ore | 1.13 | 12 Widgets/s | x7 @10, x8 @25, x9 @50, x10 @100 |
| Power Plant | Multiplies global kW | 1.2e6 Widgets | 1.14 | +6% global kW / level | x8 @10, x9 @25, x10 @50 |
| Foundry | ×Widget output (consumes Ore + food) | 2e7 Widgets + 500 Ore | 1.15 | +8% global Widgets / level | x8 @10, x9 @25, x10 @50 |

```
Ore-input throttle (interdependence made visible):
WidgetEff = min(1, OreImport / OreDemand),  OreDemand = 0.5 * (AssemblyLines + 2*Robots)
effectiveWidgets = rawWidgets * WidgetEff
Example: OreImport=400/s, OreDemand=500/s ⇒ WidgetEff=0.8 ⇒ 80% throughput.
→ Upgrading Mine Ore export directly lifts Factory ceiling (no silo).
```

#### Local Skill Tree (spends Patents)
```
            ┌─ Precision Tooling (+25% Assembly Line output)
[ROOT]──────┼─ Overclock         (+30% kW from Generators)
            ├─ Supply Chain      (Ore throttle softened: demand coeff 0.5→0.38) ─ synergy
            └─ Robotics R&D       (Robot output +35%, self-scaling +0.5%/Robot)
                   └─ Grid Export (+40% Power(kW) export to Space, req. Overclock)
```

#### Prestige Block — ASCENSION (Patents)
```
gain = floor( k * (lifetimeWidgets / softcap)^0.5 )
Factory: k = 8, softcap = 5e6 Widgets
Example: lifetimeWidgets = 5e9 ⇒ floor(8*(1000)^0.5)=floor(8*31.62)=252 Patents
```
- **Resets:** Widgets, Power, generator counts, local upgrades.
- **Keeps:** Patents, skill nodes, achievements, ★, Engine slot, inbound Ore + Grain links.
- **Rewards:** each Patent = +0.5% global Widget mult; +1% kW export ceiling per 30 Patents; Foundry tier unlocks.

#### Automation Upgrades
| Upgrade | Unlock | Effect |
|---|---|---|
| Auto-Generator | 25 Generators | Auto-buy kW generators |
| Auto-Assembly | 50 Assembly Lines | Buy-Max queue, Ore-aware |
| Plant Manager | 150 Patents | Smart priority (best Widgets/cost ratio); throttle-aware |
| Grid Logistics | Power Plant lv5 | +3h offline cap; auto-balances kW↔Widget conversion |

#### Rare Events
- **Production Surge** (300–900 s, 13 s): click for 5–10x Widget windfall.
- **Power Surge / Brownout** (tension event): −60% kW for 90 s, then **discharges** a stored x2.2 Widget burst; shiny variant x3.3 + permanent +1% kW.
- **Patent Breakthrough** (STARLIGHT ~0.5%): +1 STARLIGHT, +1 free Patent, permanent +3% Robot output.

#### Unlock Requirement
- **Unlocked when Mine exports ≥ 50 Ore/s** *and* Farm reaches 50,000 lifetime Grain (needs raw Ore feed + sustained food supply).

#### Synergies — IN / OUT
| Direction | Binding (per SPEC) | Mechanic |
|---|---|---|
| IN | Mine **Ore** → Factory | `WidgetEff` throttle (raises Widget ceiling) |
| IN | Farm **Grain** → Factory workers | `foodMult` (asymptotic +20%) |
| OUT | Factory **Power(kW)** + Mine **Ore** → **Space Alloy** (Stage 6) | the two-input alloy recipe |
| OUT | Surplus Widgets → Engine slot | `fortuneWeight_Factory = 1.4` |
| IN | Magic Mana / Time Chronons / Multiverse Shards | universal hooks per SPEC |

---

### Cross-Stage Summary (Part I)

| From → To | Currency / Channel | Formula handle | Effect ceiling |
|---|---|---|---|
| Village → Farm, Mine | LABOR | `laborMult = 1 + c·log10(1+LABOR)` (c=0.15 Farm, 0.12 Mine) | log-soft, no runaway |
| Farm → Mine, Factory | Grain (worker-food) | `foodMult = 1 + 0.20·(1−e^(−G/G0))` | asymptotic +20% |
| Mine → Factory, Space(6) | Ore | `WidgetEff = min(1, OreImport/OreDemand)` | hard 100% throttle |
| Factory → Space(6) | Power(kW) + Ore | Space Alloy two-input recipe | gates Stage 6 |
| All four → Engine | surplus → ★ | `dStar/dt = Σ log10(1+surplus)·weight·engineMult` | weights 1.0 / 1.1 / 1.25 / 1.4 |

```
FORTUNE WEIGHTS (Part I stages, ascending with stage depth):
  Village = 1.00   Farm = 1.10   Mine = 1.25   Factory = 1.40
Rationale: deeper stages mint more ★ per unit log-surplus, rewarding the full chain.
```

All four stages share the SPEC offline model: **100% rate up to a 2h base window, then 25–50% efficiency**, with per-stage automation upgrades pushing the cap toward ~24h. Soft caps beyond threshold `C` use `eff(x) = C·(1 + (x−C)/C)^0.5` on every primary currency. Stage prestige (Renown/Heritage/Depth/Patents) is the soft local layer; Ascension converts these into LP for the global meta tree per the progression stack, while ★ minted here is **never** reset by any stage-level prestige.

---

## Stage Design — Part II: Magic Realm, Space, Time, Multiverse

> Stages 5–8 form the **mid-to-late spine** of COG & COSMOS. Each one *twists* the baseline idle loop established in Part I (Village→Factory) rather than re-skinning it: **Magic** spends to gain (consumable enchant multipliers), **Space** consumes other stages' output (input-chain manufacturing), **Time** compresses the time axis itself (warp ticks), and **Multiverse** duplicates the whole game (production cloning + the endgame Convergence). All four feed the **Fortune Engine** (★) and obey the canonical baselines: `cost_n = base * r^n`, milestone tiers `x7..x10` at `10/25/50/100/200/500`, square-root prestige, and the soft cap `eff(x) = C * (1 + (x-C)/C)^0.5`.

```
                 ┌──────────────────────── FORTUNE ENGINE (★) ───────────────────────┐
                 │  slots siphon surplus → dStar/dt = Σ log10(1+surplus)·w·engineMult │
                 └───▲──────────▲───────────▲───────────▲───────────▲────────────────┘
   LABOR/Grain/Ore/Power from Part I        │           │           │
        │          │          │             │           │           │
     [5 MAGIC] enchants ALL ──┼──► [6 SPACE] ──► consumes Ore+Power ──► Alloy
        │ Mana/Essence        │      Stardust/Alloy        │
        └── time-warp targets─┼──► [7 TIME] Chronons ──► warp ticks → ANY stage
                              └──► [8 MULTIVERSE] Shards duplicate ANY stage → Convergence
```

---

### 5. MAGIC REALM — Arcane Sanctum

**Twist: Temporary Enchant Multipliers.** Mana is not just stockpiled — it is *burned* to cast **Enchantments**, finite-duration global multipliers applied to any stage's generators. This converts Magic from a passive producer into an active "spend-to-spike" layer (cf. Realm Grinder spells, Cookie Clicker Grimoire). The strategic tension: hoard Mana for prestige (Insight) vs. spend it on enchants that accelerate every other stage.

- **Primary:** Mana · **Secondary:** Essence · **Signature generator:** Sigil / Familiar · **Local-prestige:** Insight

#### 5.1 Generators

| # | Generator | Base Cost (Mana) | r | Base Rate | Produces | Notes |
|---|-----------|------------------|------|-----------|----------|-------|
| 1 | Sigil | 50 | 1.09 | 0.5 Mana/s | Mana | Core producer; scales with active Enchants |
| 2 | Familiar | 600 | 1.10 | 4 Mana/s | Mana | Consumes 0.1 Essence/s each |
| 3 | Ley Node | 9.0e3 | 1.11 | 0.8 Essence/s | Essence | Secondary; feeds Familiars + Enchant cost |
| 4 | Runesmith | 1.4e5 | 1.12 | 22 Mana/s | Mana | +2% Enchant duration per 25 owned |
| 5 | Archmage | 3.1e6 | 1.13 | 180 Mana/s | Mana | Unlocks 3rd Enchant slot at 50 owned |
| 6 | Astral Conduit | 8.0e7 | 1.135 | 6 Essence/s | Essence | Conduit count raises Enchant *potency* cap |

```
Mana production (with enchant):
  output = count · baseRate · tierMult · globalMult · enchantMult
  enchantMult = Π(active enchants)   // multiplicative, default 1.0
  Essence is NEVER multiplied by enchants (sink-side resource, stays linear)
```

#### 5.2 Enchantment System (the twist)

Cast an Enchant: pay `manaCost`, gain a multiplier `m` to a chosen stage for `duration` seconds. Potency scales with **Essence reserve** (spend Essence to amplify).

| Enchant | Mana Cost | Base m | Duration | Target | Essence Amp |
|---------|-----------|--------|----------|--------|-------------|
| Quicken | 5% of Mana bank | x3 | 60 s | 1 stage | +0.5×m per 1k Essence spent |
| Greater Quicken | 20% of Mana bank | x7 | 90 s | 1 stage | +1.0×m per 1k Essence |
| Mass Enchant | 40% of Mana bank | x2.5 | 45 s | ALL stages | no amp |
| Overcharge | 75% of Mana bank | x12 | 30 s | 1 stage | risk: 15% backfire → x0.5 for 30s |

```
Effective potency with amplification & potency cap (Astral Conduit count = K):
  m_eff = min( m_base + amp·floor(essenceSpent/1000),  m_base · (1 + 0.25·K) )
Active enchant decay:  multiplier holds flat, then snaps to 1.0 at t_end (no ramp).
Stacking rule: same target → highest m wins (no double-dip); different targets stack.
```

#### 5.3 Skill Tree (Insight-gated)

| Node | Cost (Insight) | Effect |
|------|----------------|--------|
| Mana Wellspring I–V | 2 / 5 / 12 / 30 / 80 | +25% Mana/s per rank |
| Essence Flow | 8 | Ley/Conduit output ×2 |
| Enduring Glyphs | 15 | +50% all Enchant durations |
| Backfire Ward | 20 | Overcharge backfire 15%→3% |
| Twin Casting | 40 | +1 simultaneous Enchant slot (base 2 → up to 4 with Archmage) |
| Resonant Surplus | 60 | Mana surplus → ★ weight +30% |
| Mana Battery | 90 | Offline Mana banks at 60% (vs 25–50% default) for re-cast |

#### 5.4 Prestige — Ascension (Insight)

```
Insight gain (square-root prestige, k=12, softcap C=1e6 lifetime Mana):
  gain = floor( 12 · (lifetimeMana / 1e6)^0.5 )
Example: lifetimeMana = 2.5e8  →  floor(12·√250) = floor(12·15.81) = 189 Insight
Reset: Mana, Essence, all Magic generators, active Enchants.
Keep:  Insight, Magic skill-tree, ★, all other stages.
Soft re-entry: post-Ascension first 5 Sigils are free (catch-up).
```

#### 5.5 Automation, Rare Events, Unlock & Synergies

- **Automation (Insight/★ gated):** *Auto-Sigil* (buy-max each tick), *Auto-Recast* (re-cast a saved Enchant loadout when it expires), *Smart Essence* (auto-amp Overcharge only when backfire-warded).
- **Rare events:** **Mana Storm** (rare; ~1/6 h active) — next Enchant is free + duration ×2. **Convergence Echo** (STARLIGHT-tier boss "The Unwoven"): defeat by sustaining 3 stacked Enchants for 120 s → drops STARLIGHT + permanent +5% potency cap.
- **Unlock requirement:** Reach **Factory: 1e6 lifetime Widgets** AND link a Fortune Engine slot (Magic is the first "spend-to-gain" stage, intentionally gated behind a mature producer economy).
- **Cross-stage synergies:**
  - **Mana enchants ANY generator** (canonical) — the realm's whole point; Greater Quicken on Mine/Space is the standard accelerant.
  - Consumes **Grain** (Farm) at 0.05/s per Familiar as "reagent upkeep" (gentle Farm sink).
  - Feeds **Time:** Insight count raises Chronon cap (see 7.5).

---

### 6. SPACE — Orbital Expansion

**Twist: Resource-Input Chains.** Space does not mint its primary from nothing — **Alloy requires Mine Ore + Factory Power as inputs** (canonical), and Stardust requires Alloy. This is the genre's "manufacturing" archetype (cf. Incremental Mass particle chains, Cell factory queues): throughput is gated by the *slowest upstream feed*, making Space the stage that punishes neglected earlier economies.

- **Primary:** Stardust · **Secondary:** Alloy · **Signature generator:** Probe / Colony · **Local-prestige:** Telemetry

#### 6.1 Generators & the Input Chain

| # | Generator | Base Cost | r | Consumes (per unit/s) | Produces | Notes |
|---|-----------|-----------|------|-----------------------|----------|-------|
| 1 | Smelter | 1.0e4 Stardust | 1.10 | 5 Ore + 2 kW Power | 1 Alloy/s | The input-chain core |
| 2 | Probe | 4.0e4 Stardust | 1.11 | 3 Alloy/s | 6 Stardust/s | Stardust depends on Alloy supply |
| 3 | Refinery | 7.0e5 Stardust | 1.12 | 12 Ore + 5 kW | 4 Alloy/s | Higher Alloy throughput |
| 4 | Colony | 1.2e7 Stardust | 1.13 | 10 Alloy/s | 55 Stardust/s | +pop multiplier on Probes |
| 5 | Dyson Frame | 3.0e8 Stardust | 1.14 | 40 Ore + 30 kW | 25 Alloy/s | Late Alloy macro-feed |
| 6 | Star Forge | 9.0e9 Stardust | 1.15 | 90 Alloy/s | 900 Stardust/s | Endgame Stardust engine |

```
Throughput is min-gated by upstream supply (Liebig's law of the minimum):
  alloyMade/s   = Σ(smelterRate) · min(1, OreSupply/OreDemand, PowerSupply/PowerDemand)
  stardustMade/s= Σ(probeRate)   · min(1, AlloySupply/AlloyDemand) · tierMult · globalMult
If supply < demand → "STARVED" UI flag; production throttles proportionally (no crash).
Buffer tanks (upgrade) store 600s of Ore/Power so transient Mine/Factory dips don't starve.
```

```
       MINE Ore ─┐                        ┌─► Probe ─► Stardust ─► Star Forge
                 ├─► Smelter/Refinery ─► Alloy
   FACTORY Power ┘    (min-gated)          └─► Colony / Dyson consume Alloy too
```

#### 6.2 Skill Tree (Telemetry-gated)

| Node | Cost (Telemetry) | Effect |
|------|------------------|--------|
| Ore Throughput I–III | 3 / 9 / 24 | Smelter Ore demand −10% per rank |
| Power Recapture | 10 | Power demand −25% (waste-heat reuse) |
| Buffer Tanks | 14 | Store 600 s Ore/Power against starvation |
| Probe Swarm | 22 | Probe Stardust ×2 |
| Logistics AI | 35 | Auto-balances Smelter vs Refinery for max Alloy |
| Stellar Compression | 55 | Stardust surplus → ★ weight +40% (Space = high ★ stage) |
| Self-Mining Drones | 85 | Space generates 8% of its own Ore need internally |

#### 6.3 Prestige — Ascension (Telemetry)

```
Telemetry gain (k=8, softcap C=5e7 lifetime Stardust):
  gain = floor( 8 · (lifetimeStardust / 5e7)^0.5 )
Example: lifetimeStardust = 3.2e11 → floor(8·√6400)= floor(8·80)= 640 Telemetry
Reset: Stardust, Alloy, all Space generators (Ore/Power buffers drain).
Keep:  Telemetry, Space tree, ★, upstream stages untouched.
Catch-up: post-Ascension Buffer Tanks start pre-filled (no cold-start starvation).
```

#### 6.4 Automation, Rare Events, Unlock & Synergies

- **Automation:** *Logistics AI* (skill node) auto-allocates Alloy between Probes/Colonies; *Auto-Throttle* pauses Smelters when Ore reserve < 10% to avoid Mine drain death-spiral; *Buy-Balanced* keeps Smelter:Probe ratio at the throughput optimum.
- **Rare events:** **Supernova Window** (rare) — 5 min where Alloy needs 0 Power input. **Rogue Asteroid** (STARLIGHT boss "The Devourer"): consumes Ore each tick; kill within 90 s by over-supplying Alloy → STARLIGHT + permanent +10% Self-Mining.
- **Unlock requirement:** **Mine: 5e5 lifetime Ore** AND **Factory producing ≥ 1e3 kW/s sustained** (must prove both upstream feeds exist before the input chain is buildable).
- **Cross-stage synergies:**
  - **Ore + Power → Alloy** (canonical hard dependency) — Space is the integration test for your whole Part-I economy.
  - **Magic** Greater Quicken on Smelters is the meta-move to burst through Alloy bottlenecks.
  - **Alloy** is later consumed by **Multiverse** Rifts (8.1) → Space becomes a mid-chain supplier, not a terminus.

---

### 7. TIME — Temporal Dimension

**Twist: Time-Warp Burst Ticks.** Chronons buy **warp ticks** — discrete bundles of simulated game-time applied to *any chosen stage*, i.e. burst offline-like gains on demand (canonical). Paradox is the risk-resource: over-warping accrues Paradox that throttles output until vented. This is the "compress the time axis" archetype (cf. AD Time Machine / Black Hole pulses).

- **Primary:** Chronons · **Secondary:** Paradox · **Signature generator:** Clocktower / Loop · **Local-prestige:** Epoch

#### 7.1 Generators

| # | Generator | Base Cost (Chronons) | r | Base Rate | Produces | Notes |
|---|-----------|----------------------|------|-----------|----------|-------|
| 1 | Sundial | 200 | 1.10 | 0.4 Chronons/s | Chronons | Bootstrap producer |
| 2 | Clocktower | 2.5e3 | 1.11 | 3 Chronons/s | Chronons | +warp efficiency per 25 |
| 3 | Loop | 4.0e4 | 1.12 | 18 Chronons/s | Chronons | Generates 0.02 Paradox/s |
| 4 | Hourglass Array | 7.0e5 | 1.13 | 0.5 Paradox-vent/s | (vents Paradox) | Negative-Paradox infra |
| 5 | Chrono-Engine | 1.5e7 | 1.14 | 140 Chronons/s | Chronons | +1 warp charge cap |
| 6 | Eternity Spindle | 5.0e8 | 1.15 | 1500 Chronons/s | Chronons | Endgame; warp ticks ×1.5 |

#### 7.2 Warp-Tick System (the twist)

```
Buy a warp: spend Chronons → apply T seconds of simulated time to target stage.
  warpCost(T) = 500 · T · (1 + Paradox/100)        // Paradox makes warps pricier
  warpGain    = targetStage.productionPerSec · T · warpEff
  warpEff     = 1.0 baseline, +1.5% per Clocktower milestone, ×1.5 (Eternity Spindle)
  Paradox accrued = 0.5 · T   (vented by Hourglass Array at 0.5/s + Epoch upgrades)

Paradox throttle (soft cap on ALL Time output when Paradox high):
  timeMult = 1 / (1 + (Paradox / 200)^0.5)
  → at Paradox=200, timeMult=0.5; at Paradox=800, timeMult≈0.33.

Warp charges: hold up to (2 + Chrono-Engine count) charges; recharge 1 / 5 min.
Example: T=300s warp on Space producing 1e6 Stardust/s, warpEff=1.2
  → warpGain = 1e6 · 300 · 1.2 = 3.6e8 Stardust instantly; Paradox += 150.
```

#### 7.3 Skill Tree (Epoch-gated)

| Node | Cost (Epoch) | Effect |
|------|--------------|--------|
| Chronon Flow I–IV | 3 / 8 / 20 / 50 | +30% Chronon/s per rank |
| Paradox Vent | 12 | Hourglass vent rate ×2 |
| Stable Loop | 18 | Loop Paradox generation −50% |
| Deep Warp | 30 | Max warp T per cast 300 s → 900 s |
| Echo Charges | 45 | +2 warp charge cap |
| Temporal Surplus | 60 | Chronon surplus → ★ weight +35% |
| Warp Mastery | 90 | warpEff +25% globally |

#### 7.4 Prestige — Ascension (Epoch)

```
Epoch gain (k=6, softcap C=1e7 lifetime Chronons):
  gain = floor( 6 · (lifetimeChronons / 1e7)^0.5 )
Example: lifetimeChronons = 9e9 → floor(6·√900)= floor(6·30)= 180 Epoch
Reset: Chronons, Paradox (→0), Time generators, warp charges.
Keep:  Epoch, Time tree, ★, other stages.
Bonus: each Epoch permanently −0.5% Paradox accrual per warp (Paradox tolerance grows).
```

#### 7.5 Automation, Rare Events, Unlock & Synergies

- **Automation:** *Auto-Warp* (fire saved warp loadout at the chosen stage whenever a charge is full AND Paradox < threshold), *Auto-Vent* (pause warps when Paradox > 200, resume < 50), *Charge Manager* (never let charges overflow uncapped).
- **Rare events:** **Time Dilation Rift** (rare) — warps cost 0 Paradox for 3 min. **Grandfather Paradox** (STARLIGHT boss "The Recursion"): Paradox spikes +400; survive 60 s of throttle while still venting → STARLIGHT + permanent +1 charge cap.
- **Unlock requirement:** **Any two stages at their Ascension at least once** (Time is meta-aware: it can only manipulate stages you've already "looped"). Plus link a Fortune Engine slot.
- **Cross-stage synergies:**
  - **Time-warp burst applies to ANY stage** (canonical) — the universal accelerant; best paired with Space's Star Forge or a Mass-Enchanted target.
  - **Magic Insight** raises Chronon cap (7-5 ↔ 5-5): `chrononCap = base · (1 + 0.01·Insight)`.
  - **Multiverse Shards** can duplicate a *warped* stage's spiked output (8.2) → Time+Multiverse is the premier late-game combo.

---

### 8. MULTIVERSE — Branching Realities

**Twist: Production Duplication + Convergence.** Shards **duplicate a chosen stage's production by a %** (canonical) — literally copying another stage's output into bonus yield. The endgame **Convergence** collapses all branches into a single multiplied reality, the document's terminal pre-Transcendence mechanic. This is the "everything compounds everything" capstone (cf. Synergism cube stack, Multiverse-branching prestige).

- **Primary:** Shards · **Secondary:** Echoes · **Signature generator:** Rift / Mirror-Self · **Local-prestige:** Convergence

#### 8.1 Generators

| # | Generator | Base Cost | r | Consumes | Produces | Notes |
|---|-----------|-----------|------|----------|----------|-------|
| 1 | Rift | 5.0e5 Shards | 1.11 | 2 Alloy/s | 1 Shard/s | Pulls matter from Space |
| 2 | Mirror-Self | 6.0e6 Shards | 1.12 | — | 0.3 Echoes/s | Echoes power duplication |
| 3 | Branch Node | 9.0e7 Shards | 1.13 | 5 Shards/s upkeep | +1 duplication slot | Each = 1 stage you can clone |
| 4 | Paradox Mirror | 1.5e9 Shards | 1.14 | 1 Paradox/s | 8 Shards/s | Turns Time's waste into Shards |
| 5 | Reality Loom | 4.0e10 Shards | 1.145 | — | 6 Echoes/s | Weaves higher duplication % |
| 6 | Convergence Core | 1.0e12 Shards | 1.15 | — | enables Convergence | Capstone structure |

#### 8.2 Duplication System (the twist)

```
Assign a Branch slot to a stage S → add a % of S's output as bonus to S:
  dupBonus(S) = baseStageOutput(S) · dupPct
  dupPct = 5% + 0.5%·MirrorSelfCount + 1%·RealityLoomCount   (cap 100% = full clone)
Echoes fuel it:  each active duplication drains  echoUpkeep = 0.2·dupPct·|baseOutput in log10|
  → if Echoes run dry, dupPct decays toward 0 (must sustain Echo income).

Stacking with Time:  if S was just warp-spiked, the spike IS counted in baseStageOutput
  → duplicating a warped Star Forge can momentarily double an already-bursted yield.
Stacking with Magic: Mass-Enchant ×2.5 on S → dupBonus also reflects the enchanted output.
```

#### 8.3 Convergence (endgame collapse)

```
Convergence Core unlocks the COLLAPSE action once Shards ≥ 1e12 AND all 8 stages unlocked:
  convergenceMult = 1 + 0.10 · log10( Σ_over_stages lifetimePrimary_stage )
  Applying Collapse: ALL stages gain ×convergenceMult permanent global multiplier,
                     Multiverse resets Shards/Echoes/Rifts, grants Convergence (prestige).
Convergence (prestige currency) gain:
  gain = floor( 4 · (lifetimeShards / 1e11)^0.5 )      // k=4, softcap C=1e11
Example: lifetimeShards=2.5e14 → floor(4·√2500)= floor(4·50)= 200 Convergence.
Convergence is the LAST per-stage layer before global TRANSCENDENCE (Æ) — see meta section.
```

```
        BRANCH SLOTS (1 per Branch Node)
   ┌───────────┬───────────┬───────────┐
   │  clone    │  clone    │  clone    │
   │  Space    │  Time     │  Factory  │   ← +dupPct of each stage's live output
   └─────┬─────┴─────┬─────┴─────┬─────┘
         └───────────┴───────────┘
                     ▼
            CONVERGENCE CORE ──► COLLAPSE ──► ×convergenceMult to ALL stages
                                            └► +Convergence (prestige) ► toward Æ
```

#### 8.4 Skill Tree (Convergence-gated)

| Node | Cost (Convergence) | Effect |
|------|--------------------|--------|
| Shard Flow I–III | 4 / 12 / 30 | +40% Shard/s per rank |
| Echo Reservoir | 10 | Echo upkeep −40% (sustain more duplications) |
| Wider Branches | 16 | Base dupPct 5% → 12% |
| Extra Slot | 25 | +1 duplication slot (beyond Branch Nodes) |
| Paradox Harvest | 35 | Paradox Mirror Shard output ×2.5 (Time synergy) |
| Multiversal Surplus | 55 | Shard surplus → ★ weight +50% (highest ★ weight in game) |
| Stable Convergence | 90 | convergenceMult coefficient 0.10 → 0.14 |

#### 8.5 Prestige — Ascension vs Convergence

```
Multiverse has TWO local resets:
  • Ascension (LP, soft): gain = floor( 10 · (lifetimeShards / 1e9)^0.5 )  → tunes Shard economy
  • Convergence (capstone, see 8.3): the headline collapse → global ×mult + Convergence points
Keep across both: ★, the Convergence permanent multiplier, all skill trees.
Reset on Convergence: Shards, Echoes, Rifts, Branch assignments (re-assign after collapse).
```

#### 8.6 Automation, Rare Events, Unlock & Synergies

- **Automation:** *Auto-Branch* (assign duplication slots to the current highest-output stages each tick), *Echo Governor* (throttle dupPct to keep Echo income ≥ upkeep), *Auto-Collapse* (fire Convergence when convergenceMult gain ≥ a set threshold, e.g., +5%).
- **Rare events:** **Branch Bloom** (rare) — +1 temporary duplication slot for 10 min. **The Mirror King** (STARLIGHT boss): spawns a hostile duplicate that *steals* dupPct; out-produce it for 120 s → STARLIGHT + permanent +3% base dupPct.
- **Unlock requirement:** **All of stages 1–7 unlocked** AND **Space supplying Alloy** (Rifts need Alloy) AND **at least one stage Ascended** (Multiverse duplicates *proven* economies). Final Fortune Engine slot links here.
- **Cross-stage synergies:**
  - **Shards duplicate ANY chosen stage's production** (canonical) — the universal multiplier-of-multipliers.
  - **Consumes Space Alloy** (Rifts) and **Time Paradox** (Paradox Mirror) — turns two upstream by-products into Shards, closing the interdependence loop.
  - **Convergence** feeds the global meta: its permanent multiplier persists through **Transcendence (Æ)** and seeds New-Game+ scaling under **Reality Reset (Ω)**.

---

### Cross-Stage & Fortune Engine Summary (Stages 5–8)

| Stage | ★ Fortune Weight | Consumes (cross-stage) | Supplies / Buffs | Signature Twist |
|-------|-----------------|------------------------|------------------|-----------------|
| 5 Magic | 1.3 (mid) | Grain (reagents), Essence | **Enchant ×m to ANY stage**, raises Chronon cap | Temporary spend-to-spike multipliers |
| 6 Space | 2.2 (high) | **Ore + Power** (hard input chain) | Alloy → Multiverse Rifts | Min-gated input manufacturing |
| 7 Time | 1.8 (high) | Chronons (self), Paradox risk | **Warp burst to ANY stage** | On-demand simulated-time ticks |
| 8 Multiverse | 3.0 (highest) | **Alloy + Paradox** | **Duplicates ANY stage**, Convergence ×mult to ALL | Production cloning + endgame collapse |

```
Fortune mint contribution (canonical):
  dStar/dt = Σ_stage [ log10(1 + stageSurplus) · fortuneWeight_stage · engineMult ]
  Stages 5–8 carry the heaviest weights (1.3 → 3.0): late stages dominate ★ income,
  but ONLY if upstream feeds (Labor, Grain, Ore, Power, Alloy) stay healthy — interdependence
  is enforced economically, not just narratively. Neglect Part-I → Part-II starves → ★ stalls.
```

---

## Cross-Stage Synergy & Interdependence Web

The economic spine of COG & COSMOS. Every stage is permanently online and feeds at least one downstream stage; the Fortune Engine taxes the surplus of all of them. This section is the authoritative reference for what flows where, the exact conversion math, and the slot system that mints FORTUNE (★).

### Design Pillars (non-negotiable)

| # | Pillar | Consequence |
|---|--------|-------------|
| 1 | No silos | Every stage 1–7 exports at least one resource consumed by a later stage; Multiverse (8) re-injects into all. |
| 2 | Bindings are visible | Each consumer UI shows a live "imports" panel: source stage, flow rate, and the multiplier it grants. |
| 3 | Surplus, not theft | A binding consumes only the *surplus* (production above the producer's own reinvestment), so feeding downstream never starves a stage. |
| 4 | Soft, never hard, gates | Missing an input applies a penalty multiplier (floor 0.25x), never a full stop — an idle returning player is never bricked. |
| 5 | Snowball is bounded | Every multiplicative loop passes through a `log10` or soft-cap node so no closed cycle can diverge. |

---

### A. The Dependency Matrix

Rows = PRODUCER stage. Columns = CONSUMER stage. Cell = the resource/effect that flows and the binding ID. `★` column = surplus routed to the Fortune Engine. Empty = no direct flow.

```
PRODUCER \ CONSUMER  VILL  FARM  MINE  FACT  MAGI  SPACE TIME  MVRS | ★ ENGINE
-------------------- ----- ----- ----- ----- ----- ----- ----- -----|----------
VILLAGE   (Coins/Wd)  --   LAB   LAB    .     .     .     .     .   |  ★ w=1.00
FARM      (Grain/Wtr)  .    --   GRN   GRN    .     .     .     .   |  ★ w=1.15
MINE      (Ore/Gems)   .    .     --    .     .    ORE    .     .   |  ★ w=1.30
FACTORY   (Widg/kW)    .    .     .     --    .    PWR    .     .   |  ★ w=1.50
MAGIC     (Mana/Ess)  ENC  ENC   ENC   ENC    --   ENC   ENC   ENC  |  ★ w=1.75
SPACE     (Star/Aly)   .    .     .     .     .     --   ALY    .   |  ★ w=2.00
TIME      (Chr/Para)  WRP  WRP   WRP   WRP   WRP   WRP    --   WRP  |  ★ w=2.40
MVRS      (Shrd/Ech)  DUP  DUP   DUP   DUP   DUP   DUP   DUP    --  |  ★ w=3.00

Binding legend:
  LAB = Labor (Townsfolk)         GRN = Grain (fed workers)
  ORE = Ore feed                  PWR = Power feed
  ALY = Alloy feed                ENC = Enchant (Mana, any generator)
  WRP = Time-warp ticks (Chronons) DUP = Shard duplication (% of output)
```

Two binding *classes*:

- **Hard-line bindings** (LAB, GRN, ORE, PWR, ALY): a specific producer feeds a specific consumer along the "production chain." Directional, always-on, surplus-metered.
- **Broadcast bindings** (ENC, WRP, DUP): Magic, Time, and Multiverse can target *any* unlocked stage via a player-assigned slot. These are the strategic "wildcards" — the reason late stages compound earlier ones (Realm Grinder faction-flexibility, applied to a fixed roster).

---

### B. Resource-Flow Diagram

```
                                  ┌─────────────────────────────────────────┐
                                  │            THE FORTUNE ENGINE            │
                                  │   8 slots → log10(surplus)·w·engineMult  │
                                  │            mints FORTUNE ★               │
                                  └───▲────▲────▲────▲────▲────▲────▲────▲───┘
       surplus tax (all stages) ─────┘    │    │    │    │    │    │    │
                                          │    │    │    │    │    │    │
  ┌─────────┐  LAB   ┌─────────┐  GRN  ┌──┴──────┐ ORE ┌─────────┐ PWR┌────┴────┐
  │ VILLAGE │──────► │  FARM   │─────► │  MINE   │────►│  SPACE  │◄───│ FACTORY │
  │ Coins¢  │──┐     │ Grain   │──┐    │  Ore    │  ┌─►│ Stardust│    │ Widgets │
  │ Wood    │  │LAB  │ Water   │  │GRN │  Gems   │  │  │ Alloy   │    │ Power kW│
  └─────────┘  └────►└─────────┘  └───►└─────────┘  │  └────┬────┘    └─────────┘
                     (Village Townsfolk = LABOR; Farm Grain = worker buff)  │ALY
                                                                            ▼
  ┌─────────┐  ENC (broadcast: Mana enchants ANY generator, temp ×)   ┌─────────┐
  │  MAGIC  │═══════════════════════════════════════════════════════► │  TIME   │
  │ Mana    │   targets a chosen stage's generators                   │ Chronons│
  │ Essence │                                                         │ Paradox │
  └─────────┘                                                         └────┬────┘
       ▲                                                              WRP  │
       │ DUP (Shards duplicate a chosen stage's output by %)              ▼
  ┌────┴────┐  WRP (broadcast: Chronons buy time-warp burst ticks on ANY stage)
  │  MVRS   │═══════════════════════════════════════════════════════►  (all 8)
  │ Shards  │  DUP broadcast: copies a chosen stage's production
  │ Echoes  │═══════════════════════════════════════════════════════►  (all 8)
  └─────────┘
  ═══ = broadcast binding (player-targeted slot)   ─── = hard-line chain binding
```

---

### C. Surplus: the universal meter every binding reads

Before any binding fires, a stage computes its **surplus** — production not consumed by its own generator reinvestment. All hard-line feeds, broadcast effects, and Fortune mint read this same number.

```
reinvestRate_s   = fraction of gross the stage spends auto-buying its own gens (default 0.60, player-tunable 0.20–0.90)
grossPerSec_s    = current primary-currency production/sec of stage s
surplus_s        = max(0, grossPerSec_s * (1 - reinvestRate_s))
```

Worked example (Farm): gross = 4.0e6 Grain/s, reinvest 0.60 → `surplus = 4.0e6 * 0.40 = 1.6e6 Grain/s` available to feed Mine/Factory and to be taxed by the Engine.

---

### D. Hard-line bindings — concrete rules with numbers

Each hard-line binding converts producer surplus into a **multiplier** on the consumer's output. All use the same diminishing-returns shape so no feed can run away:

```
feedMult(import, need) = 1 + gain * ( min(import, need) / need )^0.5      [satisfied portion, sqrt]
                            + gain * 0.15 * log10(1 + max(0, import-need)/need)   [overflow, log10 tail]
penalty (import < need): mult = max(0.25, (import / need)^0.5)            [soft gate, floor 0.25x]
```

`need` scales with the consumer's own size so feeds never trivialize lategame:
`need_c = needBase_c * (consumerGenCount_c / 10)`.

#### D.1 — Binding table (canonical numbers)

| ID | Producer→Consumer | Import resource | needBase (per 10 gens) | gain | Effect on consumer |
|----|-------------------|-----------------|------------------------|------|--------------------|
| LAB | Village → Farm | Townsfolk (labor units) | 50 | 0.80 | ×output of Field/Livestock |
| LAB | Village → Mine | Townsfolk (labor units) | 50 | 0.80 | ×output of Shaft/Drill |
| GRN | Farm → Mine | Grain (fed-worker) | 2.0e5 | 0.60 | ×Ore output (workers fed) |
| GRN | Farm → Factory | Grain (fed-worker) | 2.0e5 | 0.60 | ×Widget output |
| ORE | Mine → Space | Ore | 1.0e7 | 0.70 | input to Alloy synthesis |
| PWR | Factory → Space | Power (kW) | 5.0e6 | 0.70 | input to Alloy synthesis |
| ALY | Space → Time | Alloy | 1.0e8 | 0.50 | ×Clocktower/Loop output |

> Townsfolk are shared, not duplicated: Village allocates its labor surplus across Farm and Mine via a slider (default 50/50). Each consumer reads only its allotted share as `import`.

#### D.2 — Worked example: Village → Farm (LAB)

```
Village Townsfolk surplus      = 600 labor units/s,  slider 50% to Farm → import = 300
Farm has 40 Field generators   → need = 50 * (40/10) = 200
import (300) > need (200): satisfied portion uses min=200.
  satisfied = 0.80 * (200/200)^0.5            = 0.80
  overflow  = 0.80 * 0.15 * log10(1+100/200)  = 0.80*0.15*log10(1.5) = 0.0211
  feedMult  = 1 + 0.80 + 0.0211               = 1.821×  on Field/Livestock output
```
If Village labor later drops to import = 120 (< need 200): `mult = max(0.25, (120/200)^0.5) = 0.775×` — Farm slows but never stops (Pillar 4).

#### D.3 — Two-input synthesis: Space Alloy (ORE + PWR)

Space's signature secondary (Alloy) is gated by **both** Mine Ore and Factory Power — a Liebig's-law minimum so you can't over-invest one side:

```
oreMult = feedMult(oreImport,  need=1.0e7 * spaceGen/10)   // ORE binding, gain 0.70
pwrMult = feedMult(pwrImport,  need=5.0e6 * spaceGen/10)   // PWR binding, gain 0.70
alloyRate = baseAlloy * spaceGen * min(oreMult, pwrMult) * 0.5 + baseAlloy*spaceGen*sqrt(oreMult*pwrMult)*0.5
```
The `min(...)` term punishes neglecting either feed; the `sqrt(product)` term rewards balancing both. With oreMult=1.7, pwrMult=1.7 → alloy factor = `1.7*0.5 + 1.7*0.5 = 1.70`. Unbalanced (2.4 / 1.0) → `min=1.0*0.5 + sqrt(2.4)*0.5 = 0.5 + 0.775 = 1.275` — strictly worse despite a higher peak input.

---

### E. Broadcast bindings — concrete rules with numbers

Broadcast bindings are assigned through dedicated slots (Magic/Time/Multiverse each unlock more slots via prestige). They target any unlocked stage.

#### E.1 — ENC (Magic enchant): temporary multiplier on a target stage's generators

```
encMult(target) = 1 + encStrength * log10(1 + manaSpent / manaBase)
   manaBase = 1.0e4,  encStrength = 0.45 per Magic Insight tier (default 0.45)
   duration = 120s base, +30s per Sigil milestone; refresh resets timer
```
Example: spend 1.0e7 Mana on enchanting the Mine → `1 + 0.45*log10(1+1e7/1e4) = 1 + 0.45*log10(1001) = 1 + 0.45*3.0004 = 2.350×` on Shaft/Drill for 120 s. Cost is real Mana surplus, so over-enchanting one stage starves Magic's own Fortune tax.

#### E.2 — WRP (Time-warp): burst "offline-like" ticks applied to a chosen stage

```
warpTicks    = floor( chrononsSpent / warpCost )          warpCost = 5.0e3 Chronons / tick
ticksApplied = warpTicks * tickValue                       tickValue = 1 simulated second at current rate
appliedGain  = targetProdPerSec * ticksApplied * warpEff   warpEff = 0.60 (vs 1.0 live) → anti-abuse
hardcap/activation: max 7200 ticks (=2h-equivalent) per activation; cooldown 300s
```
Example: spend 3.6e7 Chronons → `warpTicks = 7200` (hits cap). Target = Factory making 8.0e5 Widgets/s → `appliedGain = 8.0e5 * 7200 * 0.60 = 3.456e9` Widgets, dumped instantly. Mirrors offline catch-up (Spec offline model) but *directed* and skimmed at 0.60.

#### E.3 — DUP (Multiverse Shard duplication): copies a % of a target stage's output

```
dupPct(target) = min(dupCap, dupBase * log10(1 + shardsAllocated / shardBase))
   shardBase = 1.0e6,  dupBase = 0.12,  dupCap = 0.75 (per single target; raised by Convergence)
addedProd = targetProdPerSec * dupPct        // pure additive copy, does NOT feed back into Shards
```
Example: allocate 1.0e9 Shards to duplicate Space → `dupPct = min(0.75, 0.12*log10(1+1000)) = min(0.75, 0.12*3.0004) = 0.360` → +36% Stardust/s, added directly (not recursively, see anti-snowball G).

---

### F. Three example synergy chains a player builds

#### Chain 1 — "The Foundry Line" (early/mid, hard-line only)
```
Village Townsfolk ─LAB─► Mine (×1.8 Ore)
Farm Grain ───────GRN─► Mine (×1.5 Ore, fed workers)        Mine Ore ─┐
Farm Grain ───────GRN─► Factory (×1.5 Widgets)                        ├─ORE+PWR─► Space Alloy
Factory Power ────────────────────────────────────────────PWR────────┘
NET: balancing Village labor + Farm grain lifts BOTH Mine and Factory,
     which jointly gate Space Alloy → Space surplus → highest-weight ★ so far.
```
Player lesson: feeding the *base* (Village, Farm) is what unlocks the *top* (Space) — true interdependence.

#### Chain 2 — "Enchanted Overclock" (mid, broadcast + hard-line combo)
```
Magic ─ENC─► Factory generators (×2.35, 120s)
   ↑ raises Factory gross → more Power surplus
   └─► Power surplus ─PWR─► Space Alloy ↑ (oreMult balanced by Mine)
Time ─WRP─► Magic (burst Mana) → refund the Mana spent enchanting → sustain ENC uptime
NET: a self-sustaining pulse — Time warps Magic, Magic enchants Factory, Factory feeds Space.
     Bounded because WRP warpEff=0.60 and ENC reads log10(Mana): no infinite ramp.
```

#### Chain 3 — "Convergence Cascade" (late, full broadcast stack)
```
Multiverse ─DUP 36%─► Space   (more Stardust → more ★ at w=2.00)
Multiverse ─DUP 36%─► Time    (more Chronons → more WRP fuel)
Time ───────WRP─────► Mine + Factory (burst Ore & Power → Space Alloy spikes)
Magic ──────ENC─────► whichever stage the Engine slot currently weights highest
Fortune Engine: assign Space + Time + Mvrs to the 3 highest-weight slots
NET: every broadcast points at the production chain's chokepoints; ★/s maximized.
     Anti-snowball: DUP copies are non-recursive; ★ mint is log10 — cascade converges.
```

---

### G. Feedback loops & anti-snowball guards

#### G.1 — Loop inventory

| Loop | Type | Path | Divergence risk | Guard |
|------|------|------|-----------------|-------|
| L1 Base-up | Positive | Village→Farm→Mine→Space→★→global mult→Village | High | ★ spend is player-gated; global mult applies via `1+log10` (G.2) |
| L2 Enchant pulse | Positive | Time→Magic→Factory→Space→★→Engine→Time warp cap | Med | WRP warpEff 0.60 + 7200-tick cap + 300s cooldown |
| L3 Dup cascade | Positive | Mvrs DUP→Space→★→Mvrs upgrades→more DUP | High | DUP non-recursive + `dupCap 0.75` + log10 allocation curve |
| L4 Reinvest drain | Negative | high reinvestRate→low surplus→less ★ & less feed | (stabilizing) | Player slider; intentional throttle |
| L5 Need-scaling | Negative | consumer grows→`need` grows→feedMult decays | (stabilizing) | `need_c ∝ genCount` keeps feeds relevant, never trivial |

#### G.2 — The four structural guards (every cycle crosses ≥1)

```
1. log10 compression  — Fortune mint & ENC/DUP allocations use log10(): 10× input → +1 additive unit.
2. sqrt soft-cap      — feedMult satisfied term is (import/need)^0.5; doubling import ≠ doubling mult.
3. Hard caps          — WRP ≤7200 ticks/activation; DUP ≤0.75/target; ENC duration-limited.
4. Non-recursion flag — DUP-added and WRP-added production are tagged `synthetic=true` and EXCLUDED
                         from being a producer's surplus, so copies can't be re-copied or re-taxed.
```

#### G.3 — Convergence proof sketch (DUP cascade, L3)

Let real Space production = `P`. DUP adds `0.36P` (synthetic, untaxed, non-recursive). Engine sees only real `P` for ★. ★ → Mvrs upgrades raise `dupCap`/`dupBase`, but `dupPct = dupBase·log10(1+shards/1e6)` is bounded by `dupCap ≤ 0.75`. So total output ≤ `1.75P`, and `P` itself grows only as fast as the *hard-line* chain (sqrt-capped). The cycle is contractive → converges. No term multiplies `P` by itself.

---

### H. THE FORTUNE ENGINE — slot system spec

The Mill. It siphons surplus from stages assigned to its slots and mints FORTUNE (★). ★ never resets on stage prestige/ascension.

#### H.1 — Slots

| Property | Value |
|----------|-------|
| Starting slots | 3 (unlocked when Factory comes online) |
| Max slots | 8 (one per stage) |
| Unlock cost (slot n) | `★ cost = 1.0e3 * 6^(n-3)` for n = 4..8 |
| Assignment | Drag a stage into a slot; one stage per slot, no duplicates |
| Re-slot cooldown | 60 s (prevents micro-optimization thrash) |

#### H.2 — Per-stage Fortune weights (canonical)

Higher stages mint more ★ per unit surplus (they're rarer/later). These are the `fortuneWeight_stage` from the Spec mint formula:

| Stage | VILLAGE | FARM | MINE | FACTORY | MAGIC | SPACE | TIME | MVRS |
|-------|---------|------|------|---------|-------|-------|------|------|
| weight w | 1.00 | 1.15 | 1.30 | 1.50 | 1.75 | 2.00 | 2.40 | 3.00 |

#### H.3 — Mint formula (instantiates the Spec)

```
dStar/dt = SUM_over_assigned_slots( log10(1 + surplus_s) * fortuneWeight_s * engineMult )

engineMult = baseEngine * prod(engineUpgrades)        baseEngine = 1.00
surplus_s  = max(0, grossPerSec_s * (1 - reinvestRate_s))   // synthetic prod excluded (G.2 guard 4)
```

Worked total (3 slots: Mine, Factory, Space; engineMult = 2.5):

| Slot | surplus_s | log10(1+surplus) | × weight | × engineMult | ★/s |
|------|-----------|------------------|----------|--------------|-----|
| Mine | 8.0e6 | 6.903 | ×1.30 = 8.974 | ×2.5 | 22.43 |
| Factory | 5.0e6 | 6.699 | ×1.50 = 10.049 | ×2.5 | 25.12 |
| Space | 2.0e6 | 6.301 | ×2.00 = 12.602 | ×2.5 | 31.51 |
| | | | | **Σ dStar/dt** | **79.06 ★/s** |

Note the `log10` compression: Space mints most despite the *lowest* raw surplus, because weight dominates — steering players to slot late, high-weight stages (the intended progression pressure).

#### H.4 — Engine upgrades (spend ★)

| Upgrade | Effect | Cost curve (★) | Cap |
|---------|--------|----------------|-----|
| Flywheel I–X | engineMult ×1.25 per level | `5.0e2 * 8^level` | 10 levels (≈ ×9.31) |
| Wide Hopper | +1 slot beyond 8? No — instead: +1 stage may occupy 2 slots (double-weight) | 5.0e6 | 1 |
| Surplus Skimmer | reduces effective reinvest floor: lets surplus read `(1-reinvest*0.85)` | 2.0e5 | 1 |
| Log Cracker I–V | mint uses `log10(1+surplus)` → `log10(1+surplus)^1.05^lvl` (gentle de-compression) | `1.0e4 * 12^lvl` | 5 |
| Resonance | each *additional* assigned stage adds +4% engineMult (synergy for filling slots) | 8.0e5 | 1 |
| Cold Start | offline ★ mint efficiency 25%→60% | 3.0e5 | 1 |

#### H.5 — Slot assignment strategy (emergent, by phase)

| Phase | Slots | Optimal assignment | Why |
|-------|-------|--------------------|-----|
| Early (3 slots) | 3 | Mine, Factory, + best of Village/Farm | only stages with real surplus yet |
| Mid (5 slots) | 5 | drop Village → add Magic, Space | weight climbs; broadcast stages now have surplus |
| Late (8 slots) | 8 | all stages; Resonance + Log Cracker active | filling all slots triggers Resonance synergy |
| Post-Transcendence | 8 | high-weight stages get Wide-Hopper double-slot | ★/s maximized via weight stacking |

---

### I. Integration checklist (for the rest of the document)

- **Surplus** (Section C) is the single source of truth read by hard-line feeds (D), broadcast effects (E), and the Engine mint (H.3) — implement once.
- All multipliers funnel through **`feedMult` / `log10` / `sqrt`** primitives (D, G.2) — four reusable functions cover the whole web.
- `synthetic=true` tagging (G.2 guard 4) must be honored by the surplus calculator or anti-snowball guards fail.
- Fortune weights (H.2) are reused verbatim in the Engine matrix column (A) and mint table (H.3) — keep them in one constants file.
- Broadcast slot counts scale with the local-prestige currencies **Insight (Magic), Epoch (Time), Convergence (Multiverse)** — cross-reference the Prestige section.

---

## Currency Systems & Economy Design

### 0. Design Intent & Faucet/Sink Philosophy

COG & COSMOS runs **27 distinct currencies** across 8 stages plus 6 meta-layer currencies. The economy is governed by one rule borrowed from the genre's best (Antimatter Dimensions, Synergism, Realm Grinder): **every currency must have at least one faucet, at least one mandatory sink, and a defined reset layer.** No currency is allowed to be a pure score-counter with nowhere to spend it (the #1 cause of dead late-game economies).

```
FAUCET / SINK BALANCE PHILOSOPHY (target steady-state)
─────────────────────────────────────────────────────
  PRIMARY currencies   : faucet >> sink   (always net-positive; growth is the dopamine)
  SECONDARY currencies : faucet ≈ sink    (gated; deliberately scarce, throttles primary)
  STAGE-PRESTIGE (local): faucet <  sink   (bursty income, permanent expensive sinks)
  FORTUNE (★)          : faucet <  sink    (slow mint, deep global tree — never trivial)
  META (LP/Æ/Ω)        : faucet <<< sink   (very rare income, lifetime-long sinks)
  EVENT (Tokens/Star)  : time-boxed faucet (seasonal; sink expires with the event)
─────────────────────────────────────────────────────
Rule of thumb (per genre research): PRIMARY net-positive keeps the
"+X floating number" alive every tick (anti-churn). SECONDARY scarcity
is the *real* difficulty knob — it throttles how fast PRIMARY can be
spent. Meta currencies use exponent-compressed faucets so income
shrinks per unit of progress, guaranteeing the loop never ends.
```

The four conversion gates between stages (LABOR, GRAIN-feed, ORE+POWER→ALLOY, etc.) are the **secondary-currency sinks** that make stages interdependent rather than siloed — directly modeled on Fortune Mill's cross-room buffs and Realm Grinder's faction-coin economy.

---

### 1. Master Currency Table

Symbols, faucets, sinks, role, reset layer, and cap behavior for all 27 currencies.

#### 1a. Stage PRIMARY currencies (8) — the growth engines

| # | Currency | Symbol | Source / Faucet | Primary Sink | Role | Reset Layer | Cap Behavior |
|---|----------|--------|-----------------|--------------|------|-------------|--------------|
| 1 | Coins | ¢ | Cottage/Townsfolk production (Village) | Buy generators, local upgrades | Village growth currency | Stage Prestige (Renown) | Soft cap at `C=1e12`, then `eff()` |
| 2 | Grain | Grain | Field/Livestock production (Farm) | Buy generators; feed Mine/Factory workers | Farm growth + cross-feed | Stage Prestige (Heritage) | Soft cap at `C=1e13` |
| 3 | Ore | Ore | Shaft/Drill production (Mine) | Buy generators; input to Space Alloy | Mine growth + Alloy input | Stage Prestige (Depth) | Soft cap at `C=1e13` |
| 4 | Widgets | Widgets | Assembly Line/Robot (Factory) | Buy generators; Power→Alloy chain | Factory growth | Stage Prestige (Patents) | Soft cap at `C=1e15` |
| 5 | Mana | Mana | Sigil/Familiar production (Magic) | Buy generators; **enchant** any stage | Magic growth + global buff fuel | Stage Prestige (Insight) | Soft cap at `C=1e15` |
| 6 | Stardust | Stardust | Probe/Colony production (Space) | Buy generators; orbital expansion | Space growth | Stage Prestige (Telemetry) | Soft cap at `C=1e18` |
| 7 | Chronons | Chronons | Clocktower/Loop production (Time) | Buy generators; **time-warp ticks** | Time growth + warp fuel | Stage Prestige (Epoch) | Soft cap at `C=1e20` |
| 8 | Shards | Shards | Rift/Mirror-Self (Multiverse) | Buy generators; **duplicate** a stage's output | Multiverse growth + dup fuel | Stage Prestige (Convergence) | Soft cap at `C=1e22` |

#### 1b. Stage SECONDARY currencies (8) — the scarcity throttles

| # | Currency | Symbol | Source / Faucet | Primary Sink | Role | Reset Layer | Cap Behavior |
|---|----------|--------|-----------------|--------------|------|-------------|--------------|
| 1 | Wood | Wood | Village foresters (rate-limited) | Cottage tiers, structures, Engine-slot unlocks | Village build material | Stage Prestige | **Hard cap** = warehouse level |
| 2 | Water | Water | Farm wells/rain tick (gated) | Irrigation upgrades, Grain multipliers | Farm growth gate | Stage Prestige | Hard cap = reservoir level |
| 3 | Gems | Gems | Mine rare-drop (% per Ore action) | Drill speed, prestige-cost discounts | Mine premium build mat | Stage Prestige | Hard cap = vault level |
| 4 | Power (kW) | kW | Factory generators (consumed live) | Robot tiers; **input to Space Alloy** | Factory throughput + Alloy input | Stage Prestige | **Flow cap** (kW/s, not stock) |
| 5 | Essence | Essence | Magic distill (slow, from spent Mana) | Familiar tiers, enchant duration/power | Magic premium fuel | Stage Prestige | Hard cap = phylactery level |
| 6 | Alloy | Alloy | **Crafted** from Ore+Power (cross-stage) | Probe/Colony tiers, hull upgrades | Space build gate (interdependence node) | Stage Prestige | Hard cap = foundry level |
| 7 | Paradox | Paradox | Time anomalies (risk-tick) | Loop stabilizers, warp-cap raises | Time risk/reward resource | Stage Prestige | **Soft cap + overflow penalty** |
| 8 | Echoes | Echoes | Multiverse collapse events (rare) | Mirror tiers, Shard-dup amplifiers | Multiverse premium fuel | Stage Prestige | Hard cap = nexus level |

#### 1c. Stage-PRESTIGE (local-prestige / ASCENSION) currencies (8)

| # | Currency | Symbol | Source / Faucet | Primary Sink | Role | Reset Layer | Cap Behavior |
|---|----------|--------|-----------------|--------------|------|-------------|--------------|
| 1 | Renown | Ren | Village stage prestige (√ formula) | Village local boost tree | Permanent Village multipliers | Transcendence (Æ) | Uncapped (√-compressed) |
| 2 | Heritage | Her | Farm stage prestige | Farm local boost tree | Permanent Farm multipliers | Transcendence | Uncapped |
| 3 | Depth | Dep | Mine stage prestige | Mine local boost tree | Permanent Mine multipliers | Transcendence | Uncapped |
| 4 | Patents | Pat | Factory stage prestige | Factory local boost tree | Permanent Factory multipliers | Transcendence | Uncapped |
| 5 | Insight | Ins | Magic stage prestige | Magic local boost tree | Permanent Magic multipliers | Transcendence | Uncapped |
| 6 | Telemetry | Tel | Space stage prestige | Space local boost tree | Permanent Space multipliers | Transcendence | Uncapped |
| 7 | Epoch | Epo | Time stage prestige | Time local boost tree | Permanent Time multipliers | Transcendence | Uncapped |
| 8 | Convergence | Cnv | Multiverse stage prestige | Multiverse local boost tree | Permanent Multiverse multipliers | Transcendence | Uncapped |

> **Layering note:** Stage prestige is *soft* (repeatable, square-root `gain = floor(k·(lifetimePrimary/softcap)^0.5)`). **Ascension** spends a stage's accumulated prestige currency at a deeper reset for **LEGACY POINTS (LP)** — see §1d. Renown→…→Convergence are the per-stage prestige currencies; ascending converts them into LP via the formula in §4.

#### 1d. META / UNIVERSAL currencies (6)

| Currency | Symbol | Source / Faucet | Primary Sink | Role | Reset Layer | Cap Behavior |
|----------|--------|-----------------|--------------|------|-------------|--------------|
| **Fortune** | ★ | Fortune Engine mint from all slotted stages (`dStar/dt` formula) | Global skill tree, cross-stage links, Engine upgrades | Universal binding currency | **Never** reset by stage prestige; reset by Transcendence | Uncapped (log-faucet self-limits) |
| **Legacy Points** | LP | ASCENSION of one stage (resets that stage's local progress) | Permanent **local** boost trees (per stage) | Per-stage permanent meta | Transcendence (Æ) | Uncapped (√-compressed) |
| **Aether** | Æ | TRANSCENDENCE (resets ALL stages + Fortune, keeps meta) | Global + ascension meta trees | Global permanent meta | Reality Reset (Ω) | Uncapped (cbrt-compressed) |
| **Omega Cores** | Ω | REALITY RESET (resets everything incl. Aether) | New-Game+ modifiers, permanent QoL | Top-layer meta | **Never** (survives all) | Uncapped (log-log faucet) |
| **Tokens** | TKN | Seasonal EVENT objectives | Event shop (cosmetics, temp boosts, catch-up) | Seasonal event currency | Expires at event end | Hard cap per event |
| **Starlight** | ✶ | RARE events / boss kills (Starlight) | Rare permanent unlocks, Engine-slot expansions | Rare prestige-adjacent currency | **Never** | Soft cap (anti-farm) |

---

### 2. Currency Web & Reset-Layer Stack

```
                         ┌──────────────────────────────────────┐
                         │      THE FORTUNE ENGINE (Mill)        │
                         │   slots[8] → mint ★ via log-faucet    │
                         └───────▲───────────────────────▲──────┘
   surplus siphon  ───────────────┘   (per-stage ★ weight) └───── surplus siphon
        │                                                              │
  ┌─────┴─────┐  LABOR  ┌──────────┐ GRAIN  ┌────────┐ ORE+POWER ┌────┴─────┐
  │  VILLAGE  │────────▶│   FARM   │───────▶│  MINE  │──────────▶│  SPACE   │
  │  ¢ / Wood │         │Grain/Watr│        │Ore/Gems│   ALLOY   │Stardst/Aly│
  └─────┬─────┘         └────┬─────┘        └───┬────┘           └────┬─────┘
        │ LABOR              │ GRAIN-feed       │  Ore input          │
        ▼                    ▼                  ▼                     │
  ┌───────────┐        ┌──────────┐       (Factory Power ────────────┘
  │  FACTORY  │◀───────│  MAGIC   │  MANA-enchant → ANY stage (temp ×)
  │ Widget/kW │ enchant│Mana/Essnc│
  └───────────┘        └──────────┘
        ▲ Power→Alloy        │ Mana enchant
        │                    ▼
  ┌───────────┐        ┌──────────┐  CHRONON time-warp → ANY stage (burst)
  │   TIME    │───────▶│MULTIVERSE│  SHARD duplicate → ANY stage (% copy)
  │ Chron/Para│  warp  │Shard/Echo│
  └───────────┘        └──────────┘

RESET-LAYER STACK (low → high; arrow = "resets everything below")
─────────────────────────────────────────────────────────────────
 Idle play
   └▶ STAGE PRESTIGE   resets 1 stage's primary/secondary/gens  → gains Renown…Convergence
        └▶ ASCENSION   resets 1 stage's local progress + prestige cur → gains LP
             └▶ TRANSCENDENCE  resets ALL stages + Fortune + LP   → gains Æ   (keeps meta)
                  └▶ REALITY RESET  resets EVERYTHING incl. Æ      → gains Ω   (keeps Ω, achievements, collections)
                       └▶ META       achievements/collections/permanent unlocks survive Ω
```

---

### 3. Exchange & Conversion System

Conversions fall into three classes. **All cross-stage conversions are taxed and rate-limited** (see §6 anti-exploit).

```
CLASS A — CROSS-STAGE RESOURCE FEEDS (interdependence; secondary sinks)
CLASS B — META REFINEMENT (prestige currency → next meta tier)
CLASS C — FORTUNE ENGINE MINT (any slotted stage surplus → ★)
```

#### 3a. Class A — Cross-Stage Conversion-Rate Table

Rates are **base** (pre-upgrade). `effRate = baseRate · linkLevelMult · (1 − tax)`. All Class-A conversions consume the **secondary** side as the scarce throttle.

| Conversion (from → to) | Binding | Base Rate | Throttle / Input | Tax | Rate Limit | Notes |
|------------------------|---------|-----------|------------------|-----|-----------|-------|
| Townsfolk → **LABOR** units | Village→Farm/Mine | 1 Townsfolk = 1 LABOR/s | LABOR pool split across consumers | 5% | LABOR/s flow cap | Boosts Farm & Mine output `×(1+0.5·labor%)` |
| Grain → **worker feed** | Farm→Mine/Factory | 100 Grain = +1% worker output | Grain stock | 5% | 1 feed-tick / 10 s | Caps at +200% per consumer |
| Ore + Power → **Alloy** | Mine+Factory→Space | 50 Ore + 20 kW = 1 Alloy | both inputs (AND-gate) | 8% | Foundry throughput cap | Hard interdependence node |
| Mana → **enchant** (temp ×) | Magic→any stage | 1e6 Mana = +25% for 60 s | Essence (duration mult) | 10% | 1 enchant / stage / 90 s | Stacks diminishingly (§6) |
| Chronons → **time-warp ticks** | Time→any stage | 1e4 Chronons = 60 s of warp | Paradox (risk) | 12% | warpCap (raised by upgrades) | Burst offline-like gain |
| Shards → **duplicate %** | Multiverse→any stage | 1 Shard = +0.1% dup (cap +50%) | Echoes (amplifier) | 15% | 1 retarget / 120 s | Highest tax (most powerful) |

#### 3b. Class B — Meta Refinement Conversion Table

| Conversion | Formula | Compression | Example |
|------------|---------|-------------|---------|
| lifetimePrimary → **stage prestige** | `gain = floor(k·(lifetimePrimary / softcap)^0.5)` | √ (4× → 2×) | k=10, softcap=1e9, life=1e13 → `floor(10·100)=1000` |
| stage-prestige cur → **LP** (Ascension) | `LP = floor(0.5·(prestigeCur / 100)^0.5)` | √ | 40,000 Renown → `floor(0.5·20)=10` LP |
| all-stage state → **Æ** (Transcendence) | `Æ = floor((Σ★_lifetime / 1e6)^(1/3))` | cbrt (8× → 2×) | Σ★=1e15 → `floor(1e3)=1000` Æ |
| all-state → **Ω** (Reality) | `Ω = floor(5·log10(1 + Σ Æ_lifetime))` | log (harsh) | ΣÆ=1e12 → `floor(5·12)=60` Ω |

#### 3c. Class C — Fortune Engine Mint

```
dStar/dt = Σ_over_slotted_stages [ log10(1 + stageSurplus_s) · fortuneWeight_s · engineMult ]

stageSurplus_s = production_s − localConsumption_s   (only the SURPLUS is siphoned)
engineMult     = Π(engine upgrades) · (1 + 0.02·slotsUnlocked)

fortuneWeight per stage (later stages weigh more, encouraging full-map play):
```

| Stage | Village | Farm | Mine | Factory | Magic | Space | Time | Multiverse |
|-------|---------|------|------|---------|-------|-------|------|-----------|
| `fortuneWeight` | 1.0 | 1.3 | 1.6 | 2.0 | 2.5 | 3.2 | 4.0 | 5.0 |

**Worked example:** Village surplus = 1e9 ¢/s, slotted, base engineMult=1.0:
`log10(1+1e9)·1.0·1.0 ≈ 9.0 ★/s`. Add Mine surplus 1e12 Ore/s:
`log10(1+1e12)·1.6 ≈ 12·1.6 = 19.2 ★/s`. Engine total ≈ **28.2 ★/s**. The `log10` faucet means a **1000× surplus increase yields only +3/unit** to the mint — Fortune stays slow and valuable (Idle-Wizard / Clicker-Heroes log-scaling pattern).

---

### 4. Inflation Control

Idle economies inflate by design (exponential production). Control is layered so PRIMARY numbers still feel huge while the things that *matter* (Fortune, meta) stay tight.

```
INFLATION CONTROL STACK
───────────────────────
 [1] log10 faucet on Fortune mint   → 10× surplus = +1 ★/unit only
 [2] √ / cbrt / log on all prestige  → see §3b compressions
 [3] Soft caps on every PRIMARY      → §5 formula, knee scales per stage
 [4] Secondary scarcity throttle     → can't spend PRIMARY faster than
                                        SECONDARY refills (the real brake)
 [5] Conversion tax + rate limits     → §6, drains cross-stage spam
 [6] Cost growth r: 1.07 → 1.15       → later stages wall faster
 [7] Surplus-only siphon              → consumed resources don't mint ★
```

**Cost-growth schedule** (`cost_n = base · r^n`), tuned so each stage walls progressively harder per the genre baseline:

| Stage | 1 Vil | 2 Farm | 3 Mine | 4 Fac | 5 Mag | 6 Spc | 7 Time | 8 Mult |
|-------|-------|--------|--------|-------|-------|-------|--------|--------|
| `r` | 1.07 | 1.08 | 1.09 | 1.10 | 1.11 | 1.12 | 1.13 | 1.15 |

**Bulk-buy closed form** (avoids O(k) loops; standard genre math):
```
cost(buy k from n) = base · r^n · (r^k − 1)/(r − 1)
maxAffordable(c)   = floor( log_r( c·(r−1)/(base·r^n) + 1 ) )
```

---

### 5. Soft Caps vs Hard Caps

```
CAP TAXONOMY (which currencies use which)
─────────────────────────────────────────
 SOFT CAP  (diminish, never stop) : all 8 PRIMARY; Paradox; Starlight
 HARD CAP  (absolute ceiling)     : Wood, Water, Gems, Essence, Alloy,
                                     Echoes (storage-building gated); Tokens
 FLOW CAP  (rate, not stock)      : Power(kW), LABOR/s, warp ticks/s
 NONE      (formula self-limits)  : Fortune, LP, Æ; Ω (log-log faucet)
```

#### 5a. Soft cap (canonical spec formula)

```
Beyond threshold C:   eff(x) = C · (1 + (x − C)/C)^0.5

x ≤ C  → eff(x) = x            (linear, no penalty)
x > C  → square-root taper above the knee
```

**Worked (Village, C = 1e12):**

| Raw x | eff(x) | Effective ratio |
|-------|--------|-----------------|
| 1e12 | 1.00e12 | 1.000 (at knee) |
| 4e12 | 2.00e12 | 0.500 |
| 1e13 | 4.00e12 | 0.400 |
| 1e15 | 3.16e13 | 0.032 |

So a **1000× raw gain past the knee → ~31.6× effective** — the classic "numbers still grow, power crawls" curve (AdVenture Capitalist / Egg Inc pattern). Per-stage knees `C` are listed in §1a (1e12 Village → 1e22 Multiverse).

#### 5b. Hard cap

```
stock = min(stock + income·dt, hardCap)
hardCap = baseStorage · storageTier        (raise by spending PRIMARY)
```
Secondary overflow is **lost** (Melvor Mastery-Pool-overflow pattern) — creating the "upgrade storage or waste it" decision that turns secondary currencies into deliberate sinks.

#### 5c. Flow cap (Power / LABOR / warp)

```
usableFlow = min(generatedFlow, flowCap)     // measured per second
// Power: if Factory generates 500 kW/s but flowCap=300 kW/s,
// only 300 kW/s is available to Robots + Alloy crafting combined.
```

#### 5d. Paradox — soft cap + overflow penalty (unique risk currency)

```
if Paradox > C_para:
    instabilityChance = min(0.25, (Paradox − C_para)/C_para · 0.05)
    // on trigger: a random Time-warp in progress is voided (Cookie-Clicker
    // wrinkler-style risk/reward — high Paradox = high warp power, high risk)
```

---

### 6. Anti-Exploit Mechanisms

The cross-stage economy is the main exploit surface (rate-cheating, conversion ping-pong, offline-clock abuse). Four defense layers:

#### 6a. Conversion tax (drain on every cross-stage hop)

Already shown per-conversion in §3a (5%→15%). Rationale: prevents **A→B→A round-tripping** for free multiplier stacking. Tax scales **up** with link power so late links aren't tax-free:

```
tax_effective = baseTax + 0.01 · floor(linkLevel / 10)   // +1% per 10 link levels
```

#### 6b. Diminishing exchange (stacking the same buff)

Enchant, duplicate, and feed buffs **do not stack linearly**. The n-th simultaneous application of the same buff type on one stage:

```
totalBonus = Σ_{i=1..n} baseBonus · 0.8^(i−1)
// e.g. three +25% enchants → 25% + 20% + 16% = 61% (not 75%)
```
This kills "spam the strongest conversion" degenerate strategies (Orb-of-Creation additive-within-type pattern).

#### 6c. Rate limits / time-gates (anti-spam, anti-clock-cheat)

| Mechanism | Limit | Defends against |
|-----------|-------|-----------------|
| Enchant cooldown | 1 / stage / 90 s | Buff spam |
| Shard retarget | 1 / 120 s | Dup ping-pong |
| Grain feed-tick | 1 / 10 s | Feed micro-spam |
| Warp cap | `warpCap` s/day (upgrade-raised) | Chronon dumping |
| Token earn | Hard cap per event | Event grinding |
| Starlight | Soft cap + `0.9^owned` drop-rate | Boss farming |

#### 6d. Offline anti-cheat & efficiency decay (clock-tamper defense)

```
elapsed = clamp(now − lastSave, 0, offlineCapSeconds)   // negative Δ (clock rollback) → 0
offlineCap: 2 h base, raised toward ~24 h by upgrades

efficiency(t):
    t ≤ 2h        → 1.00   (100%)
    2h < t ≤ 8h   → 0.50   (linear genre standard)
    t > 8h        → 0.25   (down to cap)

gained = productionPerSec · elapsed · efficiency       // applied ONCE on load
```
Negative or absurd Δt (forward clock-set beyond cap) is clamped, neutralizing the universal offline delta-time exploit. The **"while you were away" summary** shows raw vs. efficiency-adjusted gain so the decay is transparent (anti-frustration, per retention research).

---

### 7. Currency Lifecycle Summary (one-glance reference)

```
PRIMARY  ──spend──▶ generators/upgrades ──produce──▶ MORE primary  (net +, soft-capped)
   │                                                      │
   └──surplus──▶ FORTUNE ENGINE ──log10 mint──▶ ★ ──▶ global tree / links / engine
SECONDARY ──gate──▶ primary scaling & cross-stage feeds  (net ≈ 0, hard-capped)
PRIMARY (lifetime) ──√──▶ STAGE PRESTIGE cur ──√──▶ LP (Ascension)
                                  │
              Σ★ ──cbrt──▶ Æ (Transcendence) ──log──▶ Ω (Reality) ──▶ survives forever
EVENT: Tokens (seasonal, expires) · Starlight (rare, permanent, soft-farm-capped)
```

**Net economic guarantee:** at every moment the player has (a) a PRIMARY number visibly climbing (retention), (b) a SECONDARY scarcity decision (depth), (c) a slow ★ trickle toward the next global unlock (long-arc goal), and (d) a distant meta reset dangling (lifetime goal) — the four-layer "always-progressing" signal the genre research identifies as the core anti-churn mechanic.

---

## Skill Tree System

The Skill Tree System is the spend-side counterpart to every progression layer in COG & COSMOS. It converts each layer's currency (FORTUNE ★, LEGACY POINTS, AETHER Æ, OMEGA CORES Ω, plus local Renown/Heritage/Depth/etc.) into permanent, structured power. Five distinct trees map 1:1 onto the PROGRESSION LAYER STACK, so the player always knows which currency feeds which board and what a reset will or will not touch.

```
LAYER STACK            ->  SKILL TREE          ->  POINT SOURCE        ->  RESET-SAFE FROM
Idle / Stage Prestige  ->  LOCAL (x8 boards)   ->  local-prestige cur. ->  survives idle; reset by Ascension
Global meta            ->  GLOBAL              ->  FORTUNE (★)          ->  survives stage prestige & Ascension
Cross-stage links      ->  CROSS-STAGE         ->  FORTUNE (★)          ->  survives stage prestige & Ascension
Achievements/hidden    ->  BONUS / HIDDEN      ->  STARLIGHT + TOKENS   ->  survives everything except Reality Reset
Ascension/Transcend.   ->  ASCENSION           ->  LEGACY / AETHER / Ω  ->  AETHER/Ω nodes survive Transcendence
```

### Point Economy Summary

| Tree | Currency | Earn formula | Respec cost | Loadout slots |
|---|---|---|---|---|
| Local (per stage) | local-prestige (Renown, Heritage, Depth, Patents, Insight, Telemetry, Epoch, Convergence) | `pts = floor(k * (lifetimePrimary / softcap)^0.5)` on Stage Prestige | Free once/prestige, then 1 LP | 2 saved layouts/stage |
| Global | FORTUNE (★) | minted live: `dStar/dt = Σ log10(1+stageSurplus)*fortuneWeight*engineMult` | 5% of ★ spent (refunded 95%) | 3 saved layouts |
| Cross-Stage | FORTUNE (★) | same ★ pool; nodes also gated by link unlocks | 5% of ★ spent | shares Global loadout |
| Bonus / Hidden | STARLIGHT (rare events/bosses) + TOKENS (seasonal) | drop-based; no formula | not respeccable (permanent) | always-on |
| Ascension | LEGACY POINTS / AETHER (Æ) / OMEGA CORES (Ω) | `LP = floor(k*(lifetimePrimary/softcap)^0.5)`; Æ on Transcendence; Ω on Reality Reset | LP nodes: 1 Æ; Æ/Ω nodes: locked (permanent) | 1 layout/layer |

---

### 1. LOCAL Skill Tree (per stage, x8 boards)

**Point source.** Earned on **Stage Prestige** using the square-root prestige rule from the SPEC: `pts = floor(k * (lifetimePrimary / softcap)^0.5)`. Each of the 8 stages spends its own local-prestige currency (Village=Renown, Farm=Heritage, Mine=Depth, Factory=Patents, Magic=Insight, Space=Telemetry, Time=Epoch, Multiverse=Convergence). Points and spent nodes are wiped only by **Ascension** of that same stage (which returns them as LP).

**Respec rules.** First respec each prestige is **free**; subsequent respecs cost **1 local-prestige point** (the point is burned, not the spend). Two saved **layouts per stage** allow hot-swapping a "buildup" board vs a "prestige-farm" board.

```
                 [Foundation]  T1
                  /        \
           [Output+]      [CostCut]    T1/T2
            /    \            |
     [TierBoost][Synergy]  [Secondary+]  T2/T3
          |         \         /
     [Milestone++]  [PrestigeGain]      T3/T4
                        |
                   [Automation]          T5 (capstone)
```

#### LOCAL skill table (example: VILLAGE board; identical shape reused per stage with its own currency)

| Name | Tier | Cost (currency) | Scaling formula | Dependencies | Effect |
|---|---|---|---|---|---|
| Stout Foundations | T1 | 1 Renown | flat | — | +25% Coins (¢) base production |
| Lumberjack Drills | T1 | 2 Renown | flat | Stout Foundations | +20% Wood (secondary) output |
| Frugal Builders | T2 | 4 Renown | `r_eff = r - 0.004*lvl`, max −0.02 | Stout Foundations | Cottage cost growth `r` 1.07 → 1.066 per level (5 lvls) |
| Townsfolk Tiers | T2 | 6 Renown | `mult = 1 + 0.10*lvl` (×7..×10 milestones unaffected) | Lumberjack Drills | +10%/lvl Townsfolk tier multiplier (5 lvls) |
| Market Synergy | T3 | 10 Renown | `+0.5% ¢ per Cottage owned` | Townsfolk Tiers | Cottages buff each other (Cookie-Clicker-style synergy) |
| Milestone Mastery | T3 | 12 Renown | shifts milestone counts 10/25/50→8/20/40 | Frugal Builders | Tier-mult milestones trigger ~20% earlier |
| Renown Tithe | T4 | 18 Renown | `gain_mult = 1 + 0.15*lvl` (3 lvls) | Market Synergy, Milestone Mastery | +15%/lvl Stage-Prestige Renown gain |
| Auto-Cottage | T5 | 30 Renown | toggle, buys best ¢/cost each tick | Renown Tithe | Capstone: unlocks generator autobuyer for this stage |

*Per-stage flavor swaps:* Mine "Frugal Builders" → **Reinforced Shafts** (Shaft `r` cut); Factory adds **Overclock** (+Power kW cap); Magic adds **Sigil Resonance** (Mana crit on cast); Time adds **Loop Compression** (Chronon tick density); identical tiers/costs, currency renamed.

---

### 2. GLOBAL Skill Tree (Engine meta)

**Point source.** Spends **FORTUNE (★)**, minted live by the Fortune Engine: `dStar/dt = Σ_stages( log10(1+stageSurplus) * fortuneWeight_stage * engineMult )`. ★ is **never reset by stage prestige or Ascension** — only Transcendence/Reality wipe it (and Reality refunds via Ω QoL). Node costs scale exponentially so the board paces with the whole game.

**Respec rules.** Respec refunds **95% of ★ spent** (5% sink discourages thrash). **3 saved global layouts.**

```
            [Engine Core] ★
           /      |       \
   [MintRate] [OfflineCap] [GlobalMult]
        |          |            |
   [SlotUnlock] [AwaySurge] [CompoundEngine]
        \          |           /
          [Overdrive] -- [MetaAutomation]
                    |
              [Singularity Tap]  (capstone)
```

#### GLOBAL skill table

| Name | Tier | Cost (★) | Scaling formula | Dependencies | Effect |
|---|---|---|---|---|---|
| Engine Core | T1 | 5 ★ | flat | — | +10% global production multiplier (`globalMult`) all stages |
| Mint Rate | T1 | 12 ★ | `engineMult = 1 + 0.08*lvl` (10 lvls) | Engine Core | +8%/lvl ★ mint speed |
| Offline Reservoir | T2 | 40 ★ | `cap_h = 2 + 2*lvl` hrs (cap 24h at lvl 11) | Engine Core | Raises 2h offline window per SPEC toward ~24h |
| Away Surge | T2 | 60 ★ | `eff = min(1.0, 0.5 + 0.05*lvl)` | Offline Reservoir | Offline efficiency 50%→100% past base window |
| Global Multiplier | T2 | 80 ★ | `mult = 1 + 0.05*lvl`, soft-capped | Mint Rate | +5%/lvl all-stage `globalMult` (10 lvls) |
| Engine Slot Unlock | T3 | 150 ★ | cost `150 * 2^slot` | Mint Rate | Unlocks one Fortune Engine SLOT (assign stage→★ conversion) |
| Compound Engine | T3 | 250 ★ | `engineMult *= (1 + 0.02*ownedStages)` | Global Multiplier, Slot Unlock | Mint scales with number of unlocked stages |
| Overdrive | T4 | 500 ★ | `boost = 2x for 30s`, cd `300 - 10*lvl` s | Compound Engine | Active: 2× all production, cooldown shrinks per level |
| Meta Automation | T4 | 800 ★ | toggle | Overdrive | Auto-fires Overdrive + auto-assigns idle Engine slots |
| Singularity Tap | T5 | 2000 ★ | `+1% globalMult per log10(lifetime★)` | Meta Automation | Capstone: permanent compounding tap on lifetime ★ |

**Numeric example.** With Mint Rate lvl 10 (`engineMult=1.8`), 4 stages each at `stageSurplus=10^6`, `log10(1+1e6)=6`, equal `fortuneWeight=0.25`: `dStar/dt = 4 * 6 * 0.25 * 1.8 = 10.8 ★/s`.

---

### 3. CROSS-STAGE Skill Tree (interdependence board)

**Point source.** Spends **FORTUNE (★)** from the same pool as Global, but every node is additionally **gated by a CROSS-STAGE LINK unlock** (the binding edges from the SPEC). This board makes interdependence visible: each node names a **source stage → target stage** flow. Respec = **95% ★ refund**; shares the Global loadout slots.

```
 VILLAGE --Labor--> FARM/MINE
   |                   |
 (Townsfolk)        (Grain)---> MINE/FACTORY workers
                        |
 MINE Ore + FACTORY Power ===> SPACE Alloy
                        |
 MAGIC Mana --enchant--> [any stage]
                        |
 TIME Chronons --warp--> [any stage]
                        |
 MULTIVERSE Shards --duplicate--> [any stage]
```

#### CROSS-STAGE skill table (every row = one SPEC binding edge)

| Name | Tier | Cost (★) | Scaling formula | Dependencies | Effect |
|---|---|---|---|---|---|
| Labor Pipeline | T1 | 20 ★ | `boost = 0.5% * Townsfolk` (cap +200%) | Village + Farm unlocked | **Village Townsfolk → Farm**: each Townsfolk +0.5% Grain output |
| Mining Crews | T1 | 20 ★ | `boost = 0.5% * Townsfolk` (cap +200%) | Village + Mine unlocked | **Village Townsfolk → Mine**: Townsfolk supply LABOR to Ore output |
| Grain Rations | T2 | 45 ★ | `mult = 1 + 0.02*log10(1+Grain)` | Farm + Mine unlocked | **Farm Grain → Mine/Factory workers**: feeds workers, +output |
| Foundry Supply | T2 | 70 ★ | `Alloy/s = 0.001*min(Ore,Power)` | Mine + Factory + Space unlocked | **Mine Ore + Factory Power → Space Alloy** (dual-input recipe) |
| Arcane Enchant | T3 | 120 ★ | `mult = 1 + 0.25*lvl` for 60s on cast | Magic unlocked | **Magic Mana → any stage**: temporary generator multiplier |
| Chrono-Warp Tap | T3 | 180 ★ | `ticks = floor(Chronons/100)` applied to target | Time unlocked | **Time Chronons → any stage**: buy time-warp burst (offline-like) |
| Shard Duplication | T4 | 300 ★ | `dup% = 5 + 2*lvl` of target production | Multiverse unlocked | **Multiverse Shards → any stage**: +dup% duplicated output |
| Convergence Web | T5 | 750 ★ | `mult = 1 + 0.01 * activeLinks^1.5` | ≥5 cross-links active | Capstone: all links compound by count of simultaneously active links |

**Numeric example.** Labor Pipeline with 300 Townsfolk → `0.5% * 300 = +150% Grain` (under the +200% cap). Convergence Web with 6 active links → `1 + 0.01*6^1.5 = 1 + 0.147 = ×1.147` to every linked flow.

---

### 4. BONUS / HIDDEN Skill Tree (achievements, secrets, events)

**Point source.** **STARLIGHT** (rare currency from rare events / bosses) and **TOKENS** (seasonal event currency) — drop-based, no formula. Hidden nodes start **masked** (locked icon, no hint, per the achievement research) and reveal on trigger conditions (e.g., bake `1e12` of a currency, pop a "wrinkler"-style parasite, clear an event boss). These nodes are **permanent and NOT respeccable** — they survive every reset except a full **Reality Reset (Ω)**.

```
   [???]   [???]   [Event Crown]      (masked until triggered)
     |       |          |
 [Lucky Find][Boss Bane][Seasonal Cache]
       \      |        /
        [Collector's Set]
              |
        [Hidden: OMEGA WHISPER]   (1-time secret capstone)
```

#### BONUS / HIDDEN skill table

| Name | Tier | Cost (currency) | Scaling formula | Dependencies | Effect |
|---|---|---|---|---|---|
| Lucky Find | T1 | 3 STARLIGHT | flat | reveal: first rare event | +5% chance golden-event spawn (Cookie-Clicker golden-cookie analogue) |
| Boss Bane | T1 | 5 STARLIGHT | `dmg = 1 + 0.10*kills` | reveal: defeat first boss | +10% per boss kill vs event bosses (Demon-faction-style trophy scaling) |
| Seasonal Cache | T2 | 10 TOKENS | flat | active season | +1 daily TOKEN; unlocks seasonal upgrade slot |
| Parasite Pact | T2 | 8 STARLIGHT | `payout = ×1.1` on pop (×3.3 if shiny 0.01%) | reveal: spawn a parasite | Wrinkler-style: drains output, returns lump-sum on pop |
| Collector's Set | T3 | 20 STARLIGHT | `mult = 1 + 0.02*setsOwned` | Lucky Find + Boss Bane | +2% global per completed collection set |
| Event Crown | T3 | 25 TOKENS | flat | clear a full event | Permanent +5% `globalMult` per cleared season (stacks) |
| Starlight Forge | T4 | 40 STARLIGHT | `+0.5% ★ mint per STARLIGHT banked` | Collector's Set | Converts banked STARLIGHT into permanent ★ mint bonus |
| Omega Whisper | T5 | 1 STARLIGHT (secret) | one-time | hidden combo trigger | Secret capstone: +1 starting OMEGA CORE on next Reality Reset |

---

### 5. ASCENSION Skill Tree (meta-prestige stack)

**Point source.** Three nested layers feed one board with three zones:

- **LEGACY POINTS (LP)** — from **Ascension** (resets one stage's local progress): `LP = floor(k * (lifetimePrimary / softcap)^0.5)`. Per-stage.
- **AETHER (Æ)** — from **Transcendence** (resets ALL stages + Fortune, keeps meta).
- **OMEGA CORES (Ω)** — from **Reality Reset** (resets everything incl. Aether; unlocks NG+ modifiers + permanent QoL).

**Respec rules.** **LP nodes** respec for **1 Æ**. **Æ and Ω nodes are permanent (locked)** — they survive Transcendence (Æ-built) and Reality Reset (Ω-built) respectively, matching the "what persists" rule. **1 layout per layer.**

```
  --- LP ZONE (per stage) ---        --- Æ ZONE (global) ---     --- Ω ZONE (top) ---
   [Local Legacy]                      [Aether Wellspring]          [Omega Keystone]
        |                                    |                           |
   [Keep%]---[FasterAscend]            [TransMult]---[StartBoost]   [NG+ Modifier]
        |                                    |                           |
   [LP Compounder]                     [Meta Automation+]           [Permanent QoL]
                                              \                       /
                                               [REALITY ENGINE] (Ω capstone)
```

#### ASCENSION skill table

| Name | Tier | Cost (currency) | Scaling formula | Dependencies | Effect |
|---|---|---|---|---|---|
| Local Legacy | T1 | 2 LP | `mult = 1 + 0.20*lvl` | — | +20%/lvl that stage's primary production (permanent local boost) |
| Keep Percentage | T1 | 4 LP | `keep% = 5*lvl` (cap 50%) | Local Legacy | Retain keep% of generators through next Ascension |
| Faster Ascend | T2 | 6 LP | `softcap_eff = softcap*(1 − 0.05*lvl)` | Local Legacy | Lowers Ascension softcap → LP sooner (5 lvls, −25% max) |
| LP Compounder | T3 | 10 LP | `LP_gain = 1 + 0.10*lvl` | Faster Ascend, Keep Percentage | +10%/lvl future LP gain on this stage |
| Aether Wellspring | T2 | 3 Æ | `mult = 1 + 0.50*lvl` | Transcendence unlocked | +50%/lvl global `globalMult` (survives Transcendence) |
| Transcend Multiplier | T3 | 6 Æ | `Æ_gain = 1 + 0.15*lvl` | Aether Wellspring | +15%/lvl future Æ gain on Transcendence |
| Start Boost | T3 | 8 Æ | grants `10^(2*lvl)` of each primary post-reset | Aether Wellspring | Skip early grind: start each run with seed resources |
| Meta Automation+ | T4 | 12 Æ | toggle | Transcend Multiplier | All autobuyers + Engine slots persist through Transcendence |
| Omega Keystone | T4 | 1 Ω | flat | Reality Reset unlocked | Unlocks Ω zone + permanent NG+ modifier slot |
| NG+ Modifier | T5 | 2 Ω | pick 1: ×10 speed / ×5 ★ / −20% costs | Omega Keystone | New-Game+ modifier (permanent, stacks per Ω) |
| Permanent QoL | T5 | 3 Ω | flat | Omega Keystone | Unlock-everything QoL (number format, presets, fast offline calc) survive all resets |
| Reality Engine | T6 | 10 Ω | `globalMult *= (1 + 0.05*Ω_spent)` | NG+ Modifier + Permanent QoL | Ω capstone: every Ω ever spent permanently compounds global output |

---

### Respec & Loadout System (cross-tree)

```
LOADOUT MANAGER
+-----------------------------------------------------------+
| Tree         | Slots | Swap cost      | Persists through  |
|--------------|-------|----------------|-------------------|
| Local x8     |   2   | free 1st/prest | Stage Prestige    |
| Global       |   3   | free swap*     | Prestige+Ascension|
| Cross-Stage  | (shares Global slots) | free swap* | Prestige+Ascension|
| Bonus/Hidden |  n/a  | not respeccable| ALL except Ω      |
| Ascension    |   1/layer | LP:1Æ; Æ/Ω locked | Trans / Reality |
+-----------------------------------------------------------+
*Swapping a SAVED loadout is free; re-allocating raw points triggers the
 respec sink (Local: 1 pt after first; Global/Cross: 5% ★; LP: 1 Æ).
```

**Earning recap by layer.**

```
Idle play          -> (no points; fuels surplus that mints ★)
Stage Prestige     -> local-prestige pts  -> LOCAL tree
Live ★ minting     -> FORTUNE (★)          -> GLOBAL + CROSS-STAGE trees
Rare events/bosses -> STARLIGHT / TOKENS   -> BONUS/HIDDEN tree
Ascension          -> LEGACY POINTS (LP)   -> ASCENSION (LP zone)
Transcendence      -> AETHER (Æ)           -> ASCENSION (Æ zone)
Reality Reset      -> OMEGA CORES (Ω)      -> ASCENSION (Ω zone)
```

**Design guardrails (from genre research).** (1) Every node states an exact % or formula before purchase — no hidden math (Cookie Clicker / AD encyclopedia pattern). (2) Capstones (T5/T6) are **automation or compounding**, never raw flat numbers, so they re-pace the loop rather than inflate it. (3) Each higher tree introduces a **new mechanic class** (links, slots, NG+ modifiers) so reset layers teach, not just multiply (Antimatter Dimensions milestone-restore pattern). (4) Soft caps (`eff(x)=C*(1+(x−C)/C)^0.5`) apply to all `+%` global multiplier stacks to prevent runaway compounding.

---

## Progression Layers

The Fortune Engine's progression is a six-tier stack: continuous idle play feeds five discrete reset layers, each strictly enclosing the one below. Lower layers reset frequently and shallowly; higher layers reset rarely and deeply. Every layer (a) introduces a genuinely new mechanic class — never a bare multiplier — and (b) returns more catch-up power than it costs, so re-grinding is always faster than the prior run. This follows the Antimatter Dimensions gold-standard rule: *Resources/buildings/upgrades RESET; achievements, records, meta-currencies, completions, and unlocked automation PERSIST.*

### The Layer Pyramid

```
                          ┌───────────────────────────────┐
                          │   LAYER 5 — META (survives Ω)  │   never resets
                          │  Achievements · Collections ·  │   passive % + perma-QoL
                          │  Codex · Permanent Unlocks     │   ~150 h → ∞
                          └───────────────────────────────┘
                      ┌───────────────────────────────────────┐
                      │   LAYER 4 — REALITY RESET  →  OMEGA Ω  │   resets EVERYTHING
                      │  New-Game+ modifiers · perma-QoL ·     │   incl. Aether
                      │  Engine Core slots · Ω skill matrix    │   first ~80–120 h
                      └───────────────────────────────────────┘
                  ┌───────────────────────────────────────────────┐
                  │   LAYER 3 — TRANSCENDENCE  →  AETHER Æ         │   resets ALL 8 stages
                  │  Global Aether tree · Engine multiplier ·     │   + Fortune + LP
                  │  cross-stage link tiers · permanent autobuy   │   first ~25–40 h
                  └───────────────────────────────────────────────┘
              ┌───────────────────────────────────────────────────────┐
              │   LAYER 2 — ASCENSION (per stage)  →  LEGACY PTS (LP)  │   resets ONE stage
              │  Per-stage Legacy tree · milestone tier boosts ·      │   local only
              │  signature-generator unlocks · stage autobuyers       │   first ~6–10 h
              └───────────────────────────────────────────────────────┘
          ┌───────────────────────────────────────────────────────────────┐
          │   LAYER 1 — STAGE PRESTIGE (per stage, soft)  →  local prestige │   resets ONE
          │  Renown/Heritage/Depth/Patents/Insight/Telemetry/Epoch/        │   stage's
          │  Convergence · cheap perma-mult on that stage's economy        │   gens+currency
          └───────────────────────────────────────────────────────────────┘
      ╔═══════════════════════════════════════════════════════════════════════════╗
      ║   LAYER 0 — IDLE PLAY: buy generators · cross-stage links · mint FORTUNE ★ ║
      ║   8 parallel stage economies feed THE FORTUNE ENGINE continuously         ║
      ╚═══════════════════════════════════════════════════════════════════════════╝
```

### Layer 0 — Idle Play (the substrate, never an explicit reset)

The always-on base loop. Each unlocked stage runs its own economy (`output = count * baseRate * tierMult * globalMult`), surplus is siphoned by the Fortune Engine to mint ★ (`dStar/dt = SUM log10(1 + stageSurplus) * fortuneWeight_stage * engineMult`), and ★ buys the Global skill tree, cross-stage links, and Engine upgrades. Stages are never abandoned — Layer 0 is the thing every higher layer resets *into*.

---

### Layer 1 — Stage Prestige (per stage, soft)

| Field | Value |
|---|---|
| **Scope** | A single stage, independently. Each of the 8 stages prestiges on its own clock. |
| **Unlock condition** | Stage's lifetime PRIMARY currency ≥ its soft-cap threshold `C` (Village `C`=1e6 Coins; later stages scale up). Mirrors Fortune Mill's $1M-per-room gate. |
| **Currency earned** | The stage's local-prestige currency (Renown, Heritage, Depth, Patents, Insight, Telemetry, Epoch, Convergence). |
| **Gain formula** | `gain = floor( k * (lifetimePrimary / C)^0.5 )` — square-root prestige (lenient; 4× earnings → 2× currency). Village: `k`=10, `C`=1e6. |
| **First reach** | ~30–60 min into a stage's first serious push (Village by ~0.5 h; later stages staggered as they unlock). |

```
# Stage-prestige gain (canonical sqrt prestige)
gain = floor( k * (lifetimePrimary / C)^0.5 )
# Village example: k=10, C=1e6
#   lifetime 1e6 Coins → floor(10 * 1.00) =  10 Renown
#   lifetime 4e6 Coins → floor(10 * 2.00) =  20 Renown   (4x earn → 2x gain)
#   lifetime 1e8 Coins → floor(10 * 10.0) = 100 Renown
# Spend curve: each +1% stage mult costs Renown_n = 5 * 1.07^n  (gentle)
```

| Resets vs Persists (Layer 1) | |
|---|---|
| **RESETS** | That stage's generator counts, its primary + secondary currency, that stage's non-permanent local multipliers. |
| **PERSISTS** | All 7 other stages (untouched), the local-prestige currency itself, every permanently-bought Renown/etc. upgrade, FORTUNE ★, all higher-layer assets, cross-stage links. |

**Rewards / tree unlocked:** a cheap per-stage *Prestige shop* — flat permanent multipliers to that stage's primary/secondary production, generator-cost reducers, a +1 starting-generator perk, and the local "milestone retainer" (keep one milestone tier on reset). This is the soft, frequent loop players run many times per stage.

**Synergies:** more Renown → bigger Village Townsfolk output → more LABOR exported to Farm & Mine → those stages prestige faster in turn. Local prestige currency is also a *gate token* for that stage's Ascension (Layer 2).

**Payoff ratio:** ~2–3× faster to re-reach `C` after spending one prestige batch. Designed to be repeated ~5–15× per stage before Ascension becomes the better marginal move.

---

### Layer 2 — Ascension (per stage) → LEGACY POINTS (LP)

| Field | Value |
|---|---|
| **Scope** | One stage, harder/deeper than prestige. Encloses that stage's Layer-1 progress. |
| **Unlock condition** | Accumulate ≥ a threshold of that stage's local-prestige currency (e.g. Village: 500 Renown) **and** reach milestone count 100 on its signature generator. |
| **Currency earned** | **LEGACY POINTS (LP)** — per-stage, spent in that stage's Legacy tree. |
| **Gain formula** | `LP = floor( 3 * (localPrestigeCurr / 100)^0.6 )` — exponent 0.6 (harsher than sqrt, gentler than cbrt) to slow the loop deliberately. |
| **First reach** | Village ~6–10 h; each later stage staggered (Farm ~12 h, Mine ~18 h …) as they mature. |

```
# Ascension LP gain (harsher exponent → slower, more meaningful loop)
LP = floor( 3 * (localPrestigeCurr / 100)^0.6 )
#   500 Renown  → floor(3 * 5^0.6 )   = floor(3 * 2.63) =  7 LP
#  2000 Renown  → floor(3 * 20^0.6)   = floor(3 * 6.03) = 18 LP
# 10000 Renown  → floor(3 * 100^0.6)  = floor(3 * 15.8) = 47 LP
# ~5x local currency → ~2.4x LP  (need 4x prior peak to roughly double — Realm-Grinder-style pressure)
```

| Resets vs Persists (Layer 2) | |
|---|---|
| **RESETS** | That stage's generators, primary+secondary currency, **and** its local-prestige currency (Renown etc.). One stage only — others untouched. |
| **PERSISTS** | LP and all Legacy-tree nodes, every other stage, FORTUNE ★, cross-stage links, all higher layers, that stage's unlocked **autobuyers** and signature-generator unlocks. |

**Rewards / tree unlocked:** the per-stage **Legacy Tree** — permanent local boosts that survive all future prestiges: stronger milestone tier multipliers (push the canonical x7..x10 toward x10 sooner), production exponents, offline-cap extensions for that stage, and **stage autobuyers** (generator auto-purchase + auto-prestige), gating automation behind ascension count exactly as AD gates auto-Dimensions behind Eternities.

**Synergies:** Legacy nodes amplify the stage's surplus → larger `log10(1+surplus)` term → faster ★ minting from that stage's Engine slot. Ascending the Village hardens its LABOR floor so Farm/Mine never starve post-reset.

**Payoff ratio:** first post-Ascension re-climb to the old prestige peak is ~3–5× faster (stronger milestones + autobuyers). Run ~3–8 Ascensions per stage before Transcendence dominates.

---

### Layer 3 — Transcendence (global) → AETHER (Æ)

| Field | Value |
|---|---|
| **Scope** | **Global.** Resets all 8 stages at once + Fortune + all LP. The first truly cross-cutting reset. |
| **Unlock condition** | Total ★ ever minted ≥ 1e12 **and** ≥ 4 stages have Ascended at least once (forces breadth, not single-stage rushing). |
| **Currency earned** | **AETHER (Æ)** — fuels the global/ascension meta trees. |
| **Gain formula** | `Æ = floor( 2 * (totalStarMinted / 1e12)^0.5 )`, scaled by an Engine multiplier from prior transcends. |
| **First reach** | ~25–40 h of total play. |

```
# Transcendence AETHER gain (global sqrt on lifetime FORTUNE minted)
Æ = floor( 2 * (totalStarMinted / 1e12)^0.5 * (1 + 0.05 * priorTranscends) )
#   1e12 ★ , 0 prior → floor(2 * 1.0  * 1.00) =  2 Æ
#   1e14 ★ , 0 prior → floor(2 * 10.0 * 1.00) = 20 Æ
#   1e14 ★ , 5 prior → floor(2 * 10.0 * 1.25) = 25 Æ
```

| Resets vs Persists (Layer 3) | |
|---|---|
| **RESETS** | ALL 8 stages (generators, all currencies, local-prestige currencies), **FORTUNE ★**, **all LP**, all cross-stage link levels, Engine slot assignments. |
| **PERSISTS** | Æ and the Aether tree, every Legacy *milestone* permanently unlocked (Bank-of-Memories style retainers), all autobuyers, achievements, Codex, and everything in Layers 4–5. |

**Rewards / tree unlocked:** the **Aether Tree** (global) — permanent **Engine multiplier** (`engineMult` in the mint formula), higher fortuneWeight per stage, cross-stage **link tier unlocks** (Mana-enchant strength, Chronon time-warp potency, Shard duplication %), permanent **global autobuy of prestige/ascension**, and starting-resource grants so each fresh run skips the slow opening. Each transcend should restore one chunk of QoL (AD Eternity-Milestone pattern), removing the re-grind sting.

**Synergies:** higher `engineMult` and `fortuneWeight` multiply *every* stage's ★ output simultaneously → next ★=1e12 gate is hit far sooner. Æ-bought link tiers make the *next* run's cross-stage feeding (Labor→Grain→Ore/Power→Alloy) start strong instead of cold.

**Payoff ratio:** post-Transcendence, re-reaching 1e12 ★ is ~5–10× faster (the catch-up *is* the reward — first run hours, later runs minutes). Run several transcends per Reality Reset.

---

### Layer 4 — Reality Reset → OMEGA CORES (Ω)

| Field | Value |
|---|---|
| **Scope** | **Top operational layer.** Resets everything in Layers 0–3 **including Aether**. |
| **Unlock condition** | Total Æ ever earned ≥ 1e3 **and** all 8 stages Ascended ≥ once **and** ≥ 5 Transcends completed. |
| **Currency earned** | **OMEGA CORES (Ω)** — the rarest meta-currency; unlocks New-Game+ modifiers + permanent QoL. |
| **Gain formula** | `Ω = floor( (totalAetherEarned / 1e3)^(1/3) )` — cube-root (harsh; 8× Æ → 2× Ω), so Ω stays scarce. |
| **First reach** | ~80–120 h. |

```
# Reality Reset OMEGA gain (cube-root → deliberately scarce)
Ω = floor( (totalAetherEarned / 1e3)^(1/3) )
#   1e3 Æ → floor(1)    = 1 Ω
#   1e6 Æ → floor(10)   = 10 Ω
#   8e3 Æ → floor(2.0)  = 2 Ω   (8x Aether → 2x Omega)
```

| Resets vs Persists (Layer 4) | |
|---|---|
| **RESETS** | Everything in Layers 0–3 **including all Aether and the Aether tree**, all stages, ★, LP. |
| **PERSISTS** | Ω and the **Ω skill matrix**, all chosen **New-Game+ modifiers**, all permanent QoL toggles, achievements, Codex, collections, permanent unlocks (Layer 5). |

**Rewards / tree unlocked:** the **Ω Skill Matrix** + **New-Game+ modifiers** (Realm-Grinder / Synergism corruption style: opt-in run-shaping mutators such as "stages start at milestone 25," "Engine mints 2× but link costs 3×," "offline cap permanently 24 h"). Plus permanent QoL that never reverts: global bulk-buy, study presets, faster tick, all autobuyers pre-unlocked. Ω is also the **gate currency** for the deepest Meta collections.

**Synergies:** NG+ modifiers reshape the *next* full playthrough strategically (not just numerically) — the core Realm-Grinder lesson that every reset should feel like a different configuration. Ω perma-QoL compounds with every Transcend/Ascension run beneath it.

**Payoff ratio:** a full fresh playthrough after one Reality Reset is ~5–10× faster overall (pre-unlocked automation + starting milestones collapse the early game). Expected ~handful of Reality Resets across the game's lifetime.

---

### Layer 5 — Meta (survives Ω; never resets)

| Field | Value |
|---|---|
| **Scope** | Outside the reset stack entirely. Nothing — not even Reality Reset — clears it. |
| **Unlock condition** | Always active; individual nodes unlock via achievement/collection milestones (Cookie-Clicker-style, continuous). |
| **Currency earned** | None minted directly — Meta *is* the permanent ledger. Feeds on TOKENS (seasonal events) & STARLIGHT (rare events/bosses) for cosmetic + small permanent bonuses. |
| **Gain formula** | Achievement bonus: `metaMult = 1 + 0.01 * achievementsUnlocked` (each achievement = +1% global, Cookie-Clicker milk pattern). Collections add discrete perma-unlocks. |
| **First reach** | First achievements within minutes; the layer accrues forever (~150 h → ∞). |

| Resets vs Persists (Layer 5) | |
|---|---|
| **RESETS** | Nothing, ever. |
| **PERSISTS** | Achievements, Codex/encyclopedia, collections, STARLIGHT-bought permanent unlocks, completion %, all-time stat records. |

**Rewards / tree unlocked:** achievements (each +1% global, multiplicative with everything), the **Codex** (per-stage lore + live multiplier breakdowns), seasonal **event collections** (TOKEN shop), and rare **STARLIGHT** unlocks (permanent boss-reward perks). FOMO-free: event progress accrues offline so daily-only players miss nothing.

**Synergies:** `metaMult` multiplies the base of *every* stage in *every* run at *every* layer — it is the one bonus that is always live, making completionism economically meaningful rather than cosmetic. Drives retention between deep resets (the "always making progress" signal even when no reset is imminent).

---

### What Carries Through Each Reset — Master Matrix

`K` = kept · `L` = lost/reset · `K*` = kept only if a retainer node/milestone was purchased · `—` = not applicable / out of scope.

| Asset \ Reset Layer | L1 Stage Prestige | L2 Ascension | L3 Transcendence | L4 Reality Reset | L5 Meta |
|---|---|---|---|---|---|
| Generator counts (the stage) | L | L | L | L | K |
| Generator counts (other stages) | K | K | L | L | K |
| Primary/secondary currency (the stage) | L | L | L | L | K |
| Local-prestige currency (Renown … Convergence) | K | L | L | L | K |
| Local **milestone tiers** | K* | K* | K* | L | K |
| Stage **autobuyers** | K | K | K | K | K |
| **Legacy Points (LP)** + Legacy tree | K | K | L | L | K |
| **FORTUNE ★** + Global skill tree | K | K | L | L | K |
| Cross-stage **link levels** | K | K | L | L | K |
| Engine slot assignments | K | K | L | L | K |
| Engine *multiplier / fortuneWeight* upgrades | K | K | K (Aether-bought) | L | K |
| **AETHER (Æ)** + Aether tree | K | K | K | L | K |
| **OMEGA CORES (Ω)** + Ω matrix | K | K | K | K | K |
| New-Game+ modifiers | K | K | K | K | K |
| Permanent QoL (bulk-buy, presets, tick) | K | K | K | K | K |
| Achievements / Codex / collections | K | K | K | K | K |
| STARLIGHT / TOKEN unlocks | K | K | K | K | K |
| All-time stat records | K | K | K | K | K |

---

### Reset Payoff Ratio Targets (summary)

| Layer | Reset cadence | Currency (formula exponent) | Re-climb speedup | New mechanic class introduced |
|---|---|---|---|---|
| L1 Stage Prestige | minutes–1 h | local (sqrt, 0.5) | **2–3×** | per-stage perma-mult shop |
| L2 Ascension | hours | LP (0.6) | **3–5×** | Legacy tree + stage autobuyers |
| L3 Transcendence | ~1 day | Æ (sqrt, 0.5) | **5–10×** | global Engine/link tree + global autobuy |
| L4 Reality Reset | tens of hours | Ω (cbrt, 0.33) | **5–10×** (whole-run) | NG+ modifiers + perma-QoL |
| L5 Meta | never resets | none (achv +1% each) | always-on `metaMult` | completion ledger / always-live bonus |

**Design invariants enforced across the stack:**
1. **Every layer adds a new mechanic class**, never a bare multiplier — players keep *learning*, avoiding the D7 drop-off of pure-multiplier stacks.
2. **Exponents harden with depth** (0.5 → 0.6 → 0.5 → 0.33): each deeper currency is scarcer, so lower layers stay relevant and never trivialize.
3. **Catch-up is the reward** — no explicit catch-up currency; post-reset multipliers collapse the early game (first run hours → later runs minutes), guaranteeing the 2–10× speedup band at every tier.
4. **QoL is restored progressively** (autobuyers at L2, global autobuy at L3, full automation at L4) on the AD Eternity-Milestone cadence, so re-grinding never feels punitive.

---

## Systems I — Automation, Achievements & Events

This section specifies the three retention-critical meta-systems of COG & COSMOS — The Fortune Engine: the **Automation** stack (auto-buyers, smart-priority engine, queues, presets), the **Achievement** system (categories, reward-bearing multipliers), and the **Event** system (seasonal events, random encounters, rare bosses, mini-games) plus the unified **Notification** layer. All systems obey the canonical SPEC: eight stages (Village, Farm, Mine, Factory, Magic Realm, Space, Time, Multiverse), the meta-currency stack (Fortune ★ → Legacy Points LP → Aether Æ → Omega Cores Ω), and event currencies **Tokens** and **Starlight**.

---

### A. Automation

Automation is **earned, not given**. Every automator is gated behind a specific progression layer so that manual play teaches the loop before it is delegated — mirroring Antimatter Dimensions' Eternity-Milestone gating and Cookie Clicker's per-building auto-buy upgrades. Automation never changes the *math* of a purchase; it only removes the click.

#### A.1 Automator Unlock Ladder

Each automator unlocks at a named milestone in the progression stack (Idle → Stage Prestige → Ascension → Transcendence → Reality Reset). The currency cost is paid in the layer's native currency.

| Automator | Scope | Unlock Layer | Trigger Condition | Cost |
|---|---|---|---|---|
| **Auto-Buy (single generator)** | per generator | Stage Prestige #1 (that stage) | First prestige of the stage | 5★ each |
| **Auto-Buy-Max (stage)** | all gens in 1 stage | Stage Prestige #3 | 3 prestiges of that stage | 25★ |
| **Smart-Priority Engine** | per stage | Ascension #1 (that stage) | First Ascension (≥1 LP) | 1 LP |
| **Auto-Prestige (stage)** | per stage | Ascension #2 | 2 Ascensions of that stage | 3 LP |
| **Cross-Stage Link Auto-Refill** | binding system | Transcendence #1 | First Transcendence (≥1 Æ) | 2 Æ |
| **Auto-Ascend** | all stages | Transcendence #1 | First Transcendence | 5 Æ |
| **Fortune Slot Auto-Assign** | Engine | Transcendence #2 | 2 Transcendences | 8 Æ |
| **Auto-Transcend** | global | Reality Reset #1 | First Reality Reset (≥1 Ω) | 1 Ω |
| **Master Automation Scripting** | global | Reality Reset #2 | 2 Reality Resets | 3 Ω |

```
PROGRESSION-GATED AUTOMATION UNLOCK FLOW
 Idle ──► StagePrestige ──► Ascension ──► Transcendence ──► RealityReset
  │            │                │              │                  │
  │       Auto-Buy(gen)    SmartPriority   LinkAutoRefill     Auto-Transcend
  │       Auto-Buy-Max     Auto-Prestige   Auto-Ascend        MasterScripting
  │                                        SlotAutoAssign
  └─ (no automation: player must hand-click to learn the loop)
```

#### A.2 Buy Quantity Modes & Closed-Form Cost

Every generator panel exposes four buttons: **×1 / ×10 / ×100 / MAX**. Costs follow the SPEC growth law `cost_n = base * r^n` (r ≈ 1.07 early → 1.15 late). Bulk purchases use the geometric closed form to avoid O(k) per-tick loops — essential once the Multiverse stage ticks at high frequency.

```text
# Cost to buy k generators when n are already owned:
cost_to_buy_k(n, k) = base * r^n * (r^k - 1) / (r - 1)

# Max affordable from currency C (the MAX button):
k_max = floor( log_r( 1 + C*(r-1) / (base * r^n) ) )

# Worked example — Mine "Shaft", base=50 Ore, r=1.10, n=20 owned, C=500,000 Ore:
#   base*r^n      = 50 * 1.10^20      = 50 * 6.7275  = 336.37
#   inner         = 1 + 500000*0.10/336.37 = 1 + 148.65 = 149.65
#   k_max         = floor( log_1.10(149.65) ) = floor( ln149.65/ln1.10 )
#                 = floor( 5.0085 / 0.09531 ) = floor(52.55) = 52 Shafts
#   total spent   = 50*1.10^20*(1.10^52 - 1)/0.10 = 336.37 * (142.04-1)/0.10 ≈ 474,360 Ore
```

#### A.3 Smart-Priority Engine

Unlocked at first Ascension per stage. Each tick the engine evaluates every unlocked-and-affordable purchase and picks the one with the best **value-per-cost ratio**, recomputing after each buy so it stays optimal (the AD/NGUInjector pattern). It respects "vaulted" (player-locked) items and a spend reserve.

```text
# Efficiency score for a candidate purchase p (higher = bought first):
score(p) = ΔPrimaryOutput(p) / cost(p)          # marginal production per unit currency

# For generators, ΔPrimaryOutput uses the SPEC production formula incl. milestone tiers:
#   output = count * baseRate * tierMult * globalMult
#   tierMult steps x7..x10 at counts 10/25/50/100/200/500
#   => buying the generator that crosses a milestone (e.g., 9→10) gets a score spike

ENGINE LOOP (per stage, per tick):
  reserve = stagePrimary * reserveFraction      # default reserveFraction = 0.0 (spend all)
  candidates = [unlocked gens + upgrades not vaulted, cost <= (stagePrimary - reserve)]
  while candidates nonempty:
      best = argmax_p score(p)
      if cost(best) > (stagePrimary - reserve): break
      buy(best); stagePrimary -= cost(best)
      recompute affordability of candidates
```

| Engine Setting | Values | Default | Notes |
|---|---|---|---|
| Mode | `Cheapest` / `MaxScore` / `QueueOnly` | `MaxScore` | MaxScore = efficiency ratio above |
| Reserve Fraction | 0.0 – 0.9 | 0.0 | keep a % of primary for links/manual buys |
| Milestone Snipe | on/off | on | bias score ×1.5 if purchase crosses a tier breakpoint |
| Vault list | set of gen IDs | ∅ | engine never auto-buys vaulted items |

#### A.4 Purchase Queue System

A drag-reorderable ordered queue (the *Cell: Idle Factory* "Automation Hub" pattern) lets the player script an exact install order — overriding the Smart-Priority Engine when Mode = `QueueOnly`, or running *before* it when Mode = `MaxScore` (queue first, then efficiency fills the rest).

```text
QUEUE ENTRY SCHEMA
 { stage, targetType: GEN|UPGRADE|LINK|PRESTIGE,
   targetId, qty: int | "untilTier"<tierCount> | "max",
   condition?: "primary>=X" | "owned>=Y" | "always",
   repeat: bool }

EXAMPLE QUEUE (Factory stage):
 1. Assembly Line  qty=untilTier<10>   cond=always
 2. Robot          qty=25              cond=primary>=1e6
 3. UPGRADE  "Overclock"  qty=1        cond=owned(Robot)>=25
 4. LINK  Mine→Factory(Ore feed) refill cond=always  repeat=true
```

#### A.5 Automation Presets

Named snapshots of {queue, engine settings, vault list, link assignments, slot assignments} — the AD "study preset" idea applied to the whole automation config. Stored per-save, swappable in one click; ideal for switching between a **farming** layout and a **challenge/prestige-rush** layout.

```text
PRESET = { name, perStage{ queue, engineSettings, vault },
           engineSlots[8], linkRefills[], offlineProfile }
Slots: 3 free preset slots; +1 per Reality Reset (Ω) up to 8.
```

#### A.6 Offline Automation Interaction

Automators run during the offline simulation using the SPEC offline model: 100% rate to a 2 h base window, then 25–50% efficiency, cap extendable toward ~24 h. On load, the offline pass replays the queue/engine deterministically (snapshotted production rate, applied once — not tick-by-tick) and the "while you were away" summary itemizes auto-purchases made.

---

### B. Achievements

Achievements are **economically meaningful**, never purely cosmetic (the Cookie Clicker "milk" principle). Each reward-bearing achievement contributes to a global **Cog-Boost** multiplier that feeds directly into `globalMult` in the SPEC production formula, and select ones grant flat ★/LP or QoL unlocks.

#### B.1 Categories

| Category | Icon State | Trigger Style | Reward Type |
|---|---|---|---|
| **Normal** | visible-locked → unlocked | production / count / purchase milestones | +Cog-Boost %, sometimes flat ★ |
| **Hidden** | locked icon, no hint | secret / quirky / discovery actions | +Cog-Boost %, cosmetic sprite/palette |
| **Challenge** | visible-locked, shows goal | complete a challenge / prestige-restricted run | permanent global multiplier + automation QoL |
| **Milestone** | progress bar (steps) | cumulative meta thresholds (Nth prestige/ascension) | QoL unlock (automator, faster offline cap) |

#### B.2 Cog-Boost Multiplier Formula

Each unlocked reward-bearing achievement adds a small additive percentage to a pool; the pool feeds `globalMult` multiplicatively across **all** stages (so the Fortune Engine mint rises with it too, since surplus grows).

```text
# Per-achievement boost b_i (default 1% each; challenge/milestone larger).
CogBoostPct = Σ b_i                      # additive sum of all unlocked achievement boosts
globalMult_achievements = 1 + CogBoostPct/100

# This factor multiplies into the SPEC stack:
#   output = count * baseRate * tierMult * (globalMult_base * globalMult_achievements * ...)

# Example: 140 normal (1% each) + 8 challenge (5% each) + 5 milestone (3% each)
#   CogBoostPct = 140*1 + 8*5 + 5*3 = 140 + 40 + 15 = 195%
#   globalMult_achievements = 1 + 1.95 = 2.95x  to every stage's output
```

Reward-bearing achievements also feed a secondary meta track: every **25** achievements unlocked grants **+1 permanent Fortune Slot capacity bias** (a small `engineMult` bump), so completionism accelerates the Fortune mint `dStar/dt = Σ log10(1+stageSurplus)*fortuneWeight*engineMult`.

#### B.3 Example Achievement Table

| Name | Category | Trigger | Reward |
|---|---|---|---|
| **First Light** | Normal | Build 1st Cottage (Village) | +1% Cog-Boost |
| **Townie Tycoon** | Normal | Own 100 Townsfolk | +1% Cog-Boost, +50★ |
| **Grain Drain** | Normal | Reach 1e9 lifetime Grain (Farm) | +1% Cog-Boost |
| **Deep Pockets** | Normal | Mine reaches Depth prestige ≥10 | +2% Cog-Boost |
| **Widget Wizard** | Normal | Produce 1e12 Widgets (Factory) | +2% Cog-Boost |
| **Mana Tide** | Normal | Hold 1e6 Mana while 1e3 Essence | +1% Cog-Boost |
| **Slot Machine** | Normal | Fill all 8 Fortune Engine slots | +3% Cog-Boost, +100★ |
| **Idle Hands** | Hidden | Earn from 24 h offline at full cap | +2% Cog-Boost, palette: "Dusk" |
| **Paradox Tinkerer** | Hidden | Let Paradox (Time) overflow then recover | +2% Cog-Boost |
| **Mirror, Mirror** | Hidden | Use a Mirror-Self to duplicate the stage that feeds it | +3% Cog-Boost |
| **Konami Cog** | Hidden | Enter the dev cheat sequence (no cheat granted) | cosmetic golden-cog cursor |
| **Time-Warp Tourist** | Challenge | Clear a stage using only Chronon time-warp ticks | +5% global, unlock Auto-Warp QoL |
| **Silo Breaker** | Challenge | Run "No Links" challenge (stages isolated) to a 5★/s mint | +5% global multiplier |
| **Famine Run** | Challenge | Prestige Farm with Grain links disabled | +5% global, +1 LP |
| **Ascension I** | Milestone | 1st Ascension (any stage) | unlock Smart-Priority Engine slot |
| **Centiprestige** | Milestone | 100 total stage prestiges | +3% Cog-Boost, +offline cap +2 h |
| **The Long Now** | Milestone | 7-day cumulative play (Epoch track) | +3% Cog-Boost, +1 preset slot |
| **Omega Initiate** | Milestone | 1st Reality Reset | +1 Fortune Slot, NG+ modifier slot |

#### B.4 Achievement State Machine

```
        ┌─────────────────────────────────────────────┐
        │                                             ▼
   [HIDDEN]                                     [VISIBLE-LOCKED]
   no hint, locked icon                         goal text + progress bar (steps)
        │  (secret condition met)                     │ (trigger condition met)
        └──────────────► [UNLOCKED] ◄─────────────────┘
                              │
                              ├─ apply b_i to CogBoostPct (permanent, survives all resets incl. Ω)
                              ├─ fire toast notification (see D)
                              └─ if count % 25 == 0 → +engineMult bias
```

Achievements **persist through every reset layer**, including Reality Reset (Ω) — they are part of the permanent Meta layer in the SPEC progression stack. The Stats/Encyclopedia page shows each achievement's exact contribution to `CogBoostPct` for transparency.

---

### C. Events

Events inject variable-reward novelty (the slot-machine schedule shown to drive retention) without FOMO: all events accumulate during offline windows and timed seasonal content counts offline progress, so a once-per-day player misses nothing. Events award **Tokens** (common, seasonal) and **Starlight** (rare, from rare bosses / rare event procs).

#### C.1 Event Taxonomy & Currency Awards

| Type | Cadence | Example | Awards | Spent On |
|---|---|---|---|---|
| **Seasonal Event** | calendar window (offline-counting) | *Harvest Moon*, *Cosmic Aurora*, *Clockwork Carnival* | **Tokens** | seasonal upgrade tree, cosmetic sprites/palettes |
| **Random Encounter** | Poisson proc during play/offline | *Wandering Tinker*, *Mana Surge*, *Ore Vein* | Tokens (small), temp buffs | instant buff or Token trickle |
| **Rare Boss** | very-low-rate proc / gated spawn | *Verminus-class Engine-Eater*, *Paradox Hydra* | **Starlight** + Tokens | Starlight shop: permanent global perks |
| **Mini-Game** | always-available, ★-gated unlock | *Cog Garden*, *Fortune Wheel*, *Sigil Forge* | Tokens, rare Starlight | per-minigame upgrade track |

#### C.2 Seasonal Events (Tokens)

Each seasonal event adds one dedicated **shimmer type** (a clickable on-screen sprite, the golden-cookie analogue) and a small limited-time upgrade tree purchased with Tokens. Tokens persist between seasons; the tree is permanent once bought.

| Season Event | Stage Flavor | Shimmer | Token Source | Signature Reward |
|---|---|---|---|---|
| **Harvest Moon** | Farm/Village | falling Grain sheaf | click shimmer, +Token per Farm prestige | "Moonlit Fields": +25% Grain for 24 h/day login |
| **Deep Frost** | Mine/Factory | glinting Gem | mine Ore during window | "Frostforge": Ore→Alloy link +15% |
| **Cosmic Aurora** | Space/Magic | drifting Stardust mote | hold Stardust milestones | "Auroral Sigil": Mana enchant duration +30% |
| **Clockwork Carnival** | Time/Multiverse | spinning Cog | spend Chronons | "Carnival Loop": one free time-warp tick/hour |

```text
# Token award from a seasonal shimmer click (scales with engagement, not wall-clock):
TokenGain = floor( baseToken * (1 + log10(1 + relevantStageSurplus)) * eventMult )
#   baseToken = 3, eventMult = 1.0 default (×2 on a doubled-weekend sub-event)
```

#### C.3 Random Encounters (Tokens / temp buffs)

Encounters proc via a Poisson process so they feel organic and accumulate offline (expected count over elapsed time, applied in the "while you were away" summary).

```text
# Spawn model: rate λ per real hour (default λ = 1.5/h active, 0.4/h offline).
P(at least one in t hours) = 1 - e^(-λ t)
# Offline: expected encounters = λ_offline * min(elapsedHours, offlineCapHours)
```

| Encounter | Effect | Award | Duration |
|---|---|---|---|
| **Wandering Tinker** | next 10 auto-buys are free | 5 Tokens | instant |
| **Mana Surge** | Magic Realm enchant ×3 | — (temp buff) | 60 s |
| **Ore Vein** | Mine output ×5 | 3 Tokens | 90 s |
| **Lucky Cog** | Fortune mint ×2 | 4 Tokens | 120 s |
| **Paradox Flicker** | random stage gets a free time-warp burst | 2 Tokens | instant |

#### C.4 Rare Bosses (Starlight)

Rare bosses are the Starlight faucet — low-rate, high-reward set-piece fights honoring the Fortune Mill boss lineage (Verminus/Gorgon/etc.). They spawn from a rare proc or are gated by a stage milestone, and grant **Starlight** plus a Token windfall.

| Boss | Spawn Gate | Mechanic | Reward |
|---|---|---|---|
| **Engine-Eater (Verminus-class)** | 0.5% proc once Engine has ≥4 slots | drains ★ mint until "fed" surplus from 3 stages | 2 Starlight + 50 Tokens |
| **Paradox Hydra** | Time stage Epoch ≥5 | spawns Paradox each tick; cap it before overflow | 3 Starlight + 40 Tokens |
| **Convergence Wraith** | Multiverse Convergence ≥3 | mirrors your own output back as damage | 4 Starlight + Echoes windfall |
| **The Hollow Cog** | 0.05% ultra-rare any time | pure DPS check vs. global output | 5 Starlight + permanent +1% engineMult |

```text
# Starlight shop (permanent global perks, the rare-currency sink):
  +5% engineMult ............ 3 Starlight
  +1 Fortune Slot ........... 6 Starlight
  +2 h offline cap .......... 4 Starlight
  Cosmetic "Starforged" set . 8 Starlight
```

#### C.5 Mini-Games (Tokens, rare Starlight)

Always-available once unlocked with ★; each is a self-contained progression track skinned to a stage (the Cookie Clicker minigame-per-building pattern). Each can rarely drop **Starlight** on a "perfect" outcome.

| Mini-Game | Stage Skin | Loop | Reward |
|---|---|---|---|
| **Cog Garden** | Farm | tick-based plant grid; cross-breed cogflowers for aura buffs | Tokens; rare Starlight on a mutation |
| **Fortune Wheel** | Engine | spend ★ to spin; variable Token/buff payout (13 s buff windows) | Tokens, temp ★-mint buff |
| **Sigil Forge** | Magic Realm | match-sequence to forge a Sigil granting a timed global enchant | Tokens; Starlight on a flawless forge |
| **Probe Relay** | Space | send Probes on timed expeditions (hours-long, offline-friendly) | Tokens + Alloy; rare Starlight |

```text
# Fortune Wheel payout (variable reward, bounded EV so it can't break the economy):
spinCost = 50★ * (1.05 ^ spinsToday)         # soft daily ramp
payout   = weightedPick([
             (0.50, "Tokens: 5–15"),
             (0.30, "★-mint ×2 for 60s"),
             (0.15, "Tokens: 20–40"),
             (0.04, "all-stage output ×3 for 30s"),
             (0.01, "Starlight: 1") ])
```

---

### D. Notification System

A single prioritized notification bus serves automation, achievements, and events. It must satisfy the genre's "always-making-progress signal" rule (floating `+X`, animated sprites) while never spamming — critical for D1 retention.

#### D.1 Channels & Priority

| Channel | Use | Visual | Priority | Sound |
|---|---|---|---|---|
| **Number-Pop** | every production tick / purchase | floating `+X` sprite with juice | passive (always on) | none |
| **Toast** | achievement unlock, automator unlock, mini-game drop | top-right slide-in, 4 s, stackable (max 4) | normal | soft chime |
| **Banner** | seasonal event start, rare boss spawn | full-width parallax banner + screen flash | high | event sting |
| **Log** | colored scrolling text (loot, link refills, auto-buys) | collapsible side panel, NGU-style colored lines | low (history) | none |
| **Modal** | "while you were away" offline summary, Reality Reset | center overlay, requires dismiss | blocking | summary chord |

```
NOTIFICATION BUS
  event ──► classify(priority) ──► route:
     CRITICAL/blocking → Modal queue (one at a time, FIFO)
     HIGH    → Banner (deduped; coalesce identical within 2 s)
     NORMAL  → Toast stack (max 4 visible; overflow → Log)
     LOW     → Log only
  rate-limit: ≤ 6 toasts / 10 s; excess collapses to "(+N more)" in Log
```

#### D.2 Offline "While You Were Away" Summary (Modal)

The single most important notification — the SPEC-mandated offline summary. Rendered on load, itemizing the deterministic offline pass.

```text
┌── WHILE YOU WERE AWAY ── 8h 12m (cap 24h, 100% for 2h then 35%) ──┐
│  Fortune minted ............... +1.42e6 ★                         │
│  Top producers:                                                   │
│    Factory  Widgets ........... +4.1e11   (auto-bought 3 tiers)   │
│    Mine     Ore ............... +2.7e10   (link Grain→Mine active)│
│  Auto-purchases ............... 214 (queue + smart-priority)      │
│  Encounters ................... 3  (Ore Vein, Lucky Cog ×2)       │
│  Event ........................ Harvest Moon: +18 Tokens          │
│  [ Collect ]   [ Details ▼ ]                                      │
└───────────────────────────────────────────────────────────────────┘
```

#### D.3 Settings & Anti-Spam

| Setting | Values | Default |
|---|---|---|
| Toast verbosity | All / Achievements only / Off | All |
| Number-pop density | Full juice / Reduced / Off | Full |
| Event banners | On / Critical only / Off | On |
| Log retention | 100 / 500 / 1000 lines | 500 |
| Offline summary | Always / If > 10 min / Off | Always |

Notifications are purely presentational — they never gate progress (an un-clicked toast still applied its reward), satisfying the FOMO-free design rule: a player who ignores every notification loses nothing but flavor.

---

## Systems II — Collections, Challenges & Quality of Life

### 1. Overview & Cross-System Map

Collections, Challenges, and QoL form the **retention spine** that survives every reset layer. None of these systems are wiped by Stage Prestige, Ascension, Transcendence, or Reality Reset — they are *meta-permanent* (see PROGRESSION LAYER STACK). They convert COG & COSMOS from a linear power climb into a multi-axis optimization space.

```
                       META-PERMANENT (survives Ω Reality Reset)
   ┌─────────────────────────────────────────────────────────────────┐
   │  COLLECTIONS          CHALLENGES            QOL / META            │
   │  ──────────           ──────────            ──────────            │
   │  Relics  ──┐          Restriction ──┐       Offline summary       │
   │  Pets    ──┼─► set    Time     ──┼─► reward Save slots (5)        │
   │  Artifacts─┤  bonuses Endless  ──┘   tiers  Cloud sync            │
   │  Cards   ──┘                                Codex / Stats         │
   └───────┬──────────────────┬────────────────────────┬──────────────┘
           │ multiplies        │ unlocks autobuyers,    │ formats &
           ▼ stage output      ▼ ★ weight, perma-mults  ▼ surfaces all
   ┌─────────────────────────────────────────────────────────────────┐
   │            8 STAGES + FORTUNE ENGINE (live economy)              │
   └─────────────────────────────────────────────────────────────────┘
```

Acquisition currencies map to the SPEC: relics drop from idle play & bosses (STARLIGHT-gated rares), pets hatch via TOKENS (seasonal) + LEGACY POINTS, artifacts forge from AETHER (Æ), cards charge via OMEGA CORES (Ω) and event TOKENS.

---

### 2. COLLECTIONS

Four parallel collection tracks, one per "feel": **Relics** (passive global multipliers, grid completionism — cf. Revolution Idle 60-relic grid), **Pets** (active loadout + expeditions — cf. FAP Idle), **Artifacts** (forged, leveled, stage-typed — cf. Synergism talismans), **Cards** (gacha temp×perm power — cf. FAP Idle cards).

#### 2.1 Relics — passive grid, set bonuses

64-relic grid (8×8). Each relic levels 1→300 via **Relic Dust** (RD), then "sacrifices" at 301 for a purple **Resonance** tier (resets to Lv1, +12% compounding to that relic's effect per Resonance — Revolution Idle pattern).

| Relic | Tied Stage | Effect @ Lv1 | Effect @ Lv300 | Scaling | Source |
|---|---|---|---|---|---|
| Cracked Cogwheel | Village | +2% Coins (¢) | +180% Coins | `+0.6%·lvl` linear | Common idle drop |
| Sheaf Talisman | Farm | +2% Grain | +180% Grain | `+0.6%·lvl` | Common idle drop |
| Geode Heart | Mine | +1% Ore, +0.5% Gems | +150% Ore | `+0.5%·lvl` | Boss: Verminus-class |
| Overclock Chip | Factory | +3% Widgets | +240% | `+0.8%·lvl` | Patents milestone |
| Runed Monocle | Magic | +2% Mana | +0.4% Essence/lvl | mixed | Insight prestige |
| Void Sextant | Space | +2% Stardust | +180% | `+0.6%·lvl` | Telemetry boss |
| Frozen Pendulum | Time | +1.5% Chronons | +0.5% time-warp pot. | `+0.45%·lvl` | STARLIGHT rare event |
| Mirror Sliver | Multiverse | +2% Shards | +0.3% dup% | mixed | Convergence boss |

**Set bonuses** (own ≥X relics in a "constellation"; relics belong to constellations by row/theme):

| Set | Members | 3-pc | 6-pc | 8-pc (full row) |
|---|---|---|---|---|
| Foundry Line | Village+Farm+Mine relics | +5% all primary | +10% LABOR output | +20% to Fortune mint weight of those stages |
| Cosmic Drift | Factory+Magic+Space | +5% secondary | enchant duration +25% | Space Alloy recipe −15% input |
| Eternity Weave | Time+Multiverse | +8% prestige gain | +1 time-warp charge | ★ mint `engineMult ×1.15` |

Set-bonus stacking: **additive within a set, multiplicative across sets** (Orb of Creation rule). Full-grid (all 64 at Resonance ≥1) grants permanent **+1 Fortune Engine slot**.

```
Relic effect (single):  eff = base · (1 + perLvl·level) · 1.12^resonance · globalRelicMult
RD cost to raise to L:  cost(L) = 50 · 1.06^L      (gentle, per SPEC r~1.07 early)
RD bulk to next 50:     Σ = 50·1.06^n·(1.06^50 − 1)/0.06
```

#### 2.2 Pets — active loadout + expeditions

2 ground + 2 air slots active. Pets hatch from **Eggs** (TOKENS, seasonal events) and gain XP. **Level persists through Stage Prestige & Ascension; resets on Transcendence; Rank always persists** (FAP Idle rule). Synergy fires when 2+ pets share a *species*.

| Pet | Species | Slot | Owned (passive) | Active (in loadout) | Synergy (2+ species) |
|---|---|---|---|---|---|
| Cobble Pup | Beast | Ground | +1% all ¢/Grain/Ore | +0.5% offline cap/lvl | +5% LABOR |
| Spark Drake | Drake | Air | +2% Power(kW) | +1% Widgets/lvl | +8% Factory tier mult |
| Astral Moth | Moth | Air | +1% Stardust | +0.7% Telemetry/lvl | enchant +10% dur. |
| Chrono Ferret | Beast | Ground | +1 time-warp tick/day | warp gain +1%/lvl | +6% Chronons |
| Rift Cat | Feline | Air | +0.5% Shards dup | +0.3% dup%/lvl | +1 expedition slot |
| Mana Slug | Drake | Ground | +1% Mana | +0.6% Essence/lvl | +8% Factory tier mult |

**Acquisition / progression**
```
Hatch:    Egg(TOKENS) → random pet, weighted rarity {Common 60 / Rare 30 / Epic 9 / Legendary 1}
XP:       lvl_n cost = 25 · n^1.5  (pet XP from idle ticks + expeditions)
Rank up:  fuse 3 same-pet → Rank+1 (Rank multiplies Owned+Active by 1.5^rank, persists ALL resets)
```
**Expeditions** (timed, hours-long; FAP Idle): send a pet 1h/4h/12h → returns **Card Charges** + Relic Dust + (rare) STARLIGHT. Loop: expeditions → Charges → convert temp Card power to permanent (see 2.4).

#### 2.3 Artifacts — forged, stage-typed

Forged at the **Fortune Engine Workshop** with AETHER (Æ). Each artifact boosts 3 runes-equivalent stats and has a cap of 30 levels, raised +30 per rarity tier (Uncommon→Mythic = 5 tiers = max 180; Synergism talisman model).

| Artifact | Boosts | Base Cap | Max Cap (Mythic) | Forge Cost | Per-Lvl Effect |
|---|---|---|---|---|---|
| Loom of Fates | Village ¢, Renown, prestige gain | 30 | 180 | 5 Æ | +1.5%/lvl |
| Deepcore Lens | Mine Ore, Gems, Depth | 30 | 180 | 8 Æ | +1.4%/lvl |
| Aether Capacitor | all Mana, Essence, Insight | 30 | 180 | 12 Æ | +1.6%/lvl |
| Singularity Gyro | Time, Multiverse, ★ mint | 30 | 180 | 20 Æ | +2.0%/lvl |
| Engine Governor | Fortune Engine `engineMult` | 30 | 180 | 25 Æ | +1.0%/lvl (rare) |

```
Level cost:   lvl_n = baseForge · n   (linear Æ — Synergism augment-style)
Rarity up:    consume 2 duplicate artifacts → +1 tier → +30 cap
Artifact mult: Π over equipped (1 + perLvl·level)   [multiplicative across artifacts]
```

#### 2.4 Cards — gacha temp × perm power

Unlocked at first **Transcendence**. Card total power drives a global multiplier; pulled from packs (event TOKENS / Ω).

```
TotalCardPower = TempPower × PermPower × (1 + cardLevel·0.02)
   TempPower  : resets on Transcendence; raised by pulling/leveling
   PermPower  : charged by Card Charges (from expeditions); survives ALL resets
   Convert    : 1 Charge moves min(Temp, Charge) → Perm at 1:1, capped 50/day
```

| Card | Rarity | Effect | Priority Use |
|---|---|---|---|
| Engine Surge ★ | Legendary | +0.5% ★ mint / card level | Always slot |
| Labor Guild | Epic | +1% Village Townsfolk LABOR | Early Foundry |
| Alloy Schema | Epic | −1% Space Alloy input / lvl | Space rush |
| Dup Engine | Rare | +0.2% Multiverse dup% / lvl | Late stages |
| Warp Battery | Rare | +1 time-warp charge cap / 10 lvl | Time stage |
| Gem Vein | Common | +1% Mine Gems / lvl | Filler |

Set bonus: **5 cards of same stage = "Stage Mastery"** → that stage's `tierMult` step bumped one milestone earlier (e.g., x7 at count 10 → at count 8).

---

### 3. CHALLENGES

Three families. All challenge completions are **meta-permanent**. Entry resets the *challenged scope* only (one stage, or all stages for global challenges) — never Fortune/meta.

#### 3.1 Restriction Runs (per-stage & global)

Each completable 5× (Antimatter Dimensions EC pattern); goal & reward scale per completion `n` (0-indexed).

| # | Name | Scope | Restriction | Goal (compl. n) | Reward / compl. |
|---|---|---|---|---|---|
| R1 | Hand-Cranked | Village | No autobuyers | Coins ≥ 1e6·10ⁿ | Auto-buy Cottages |
| R2 | Drought | Farm | Water locked to 0 | Grain ≥ 1e7·10ⁿ | +5% Grain perma, n |
| R3 | Cave-In | Mine | Drills disabled, Shafts only | Ore ≥ 1e8·10ⁿ | Depth gain ×(1+0.1n) |
| R4 | Blackout | Factory | Power(kW)=0 (no tier mult) | Widgets ≥ 1e9·10ⁿ | Unlock Robot autobuyer |
| R5 | Silence | Magic | No enchant (cross-stage off) | Mana ≥ 1e10·10ⁿ | Essence ×(1+0.15n) |
| R6 | Solitary | **Global** | All cross-stage links OFF | ★ ≥ 1e4·5ⁿ | `engineMult ×(1+0.08n)` |
| R7 | Single Slot | **Global** | Fortune Engine: 1 slot only | ★ ≥ 1e5·5ⁿ | +1 perma Engine slot at n=5 |

```
Restriction reward (perma multiplier family):  M = 1 + rewardStep · completions
Goal scaling:  goal(n) = goalBase · gScale^n   (gScale 5–10, harsher for global)
Diminishing reward variant (asymptotic, used for R6/R7 weight):
   reward = maxReward · (1 − e^(−0.45·completions))
```

#### 3.2 Time Challenges (speedrun gates)

Reach a target **before** a soft clock; faster tier = better reward. Timer is *wall-clock since challenge start* (offline counts at offline efficiency to stay FOMO-free).

| Name | Scope | Target | Bronze | Silver | Gold | Reward by tier |
|---|---|---|---|---|---|---|
| Sprint to Slot | Village | Fill 1 Engine slot | 30 min | 12 min | 4 min | +2/4/8% ★ weight |
| Grain Rush | Farm | Heritage prestige ×1 | 20 min | 8 min | 3 min | offline cap +1/2/4 h |
| Lightspeed | Space | First Colony | 45 min | 20 min | 8 min | Alloy input −3/6/10% |
| Loop Zero | Time | 1 time-warp self-loop | 25 min | 10 min | 3 min | +1/2/3 warp charges |

```
Tier check:  t_run ≤ t_tier  →  grant that tier's reward (highest cleared only)
Catch-up:    post-Transcendence multipliers make Gold trivially re-cleared → reward is one-time, no farm
```

#### 3.3 Endless Mode (infinite scaling stat)

One never-completable challenge per meta-layer (Synergism C15 model). The **depth reached IS a permanent scaling stat** — re-enter each Reality cycle to push it.

| Endless | Unlock | Per-Depth Restriction Ramp | Permanent Stat Earned |
|---|---|---|---|
| The Long Mill | Transcendence | each depth: all costs `×1.05^depth`, output `×0.97^depth` | `engineMult ·= 1 + (depth)²/2500` |
| Fractured Infinity | Reality Reset | each depth: −1 random Engine slot effect | Ω gain `×(1 + 0.02·depth)` |

```
Depth gate:    advance when stageSurplus ≥ surplusBase · 1.18^depth   (late-stage r=1.15–1.18)
Endless bonus: bonus(depth) = 1 + depth² / 2500
               depth 50 → ×2.0   depth 100 → ×5.0   depth 158 → ×10.99
Re-entry:      depth persists; Reality Reset does NOT wipe Endless depth (meta-permanent)
```

---

### 4. QUALITY OF LIFE

#### 4.1 Offline Progression

Per SPEC: **100% rate up to a 2 h base window, then 25–50% efficiency; cap raised by upgrades toward ~24 h.**

```
Efficiency curve (piecewise, t = offline hours):
   t ≤ 2h          → 100%
   2h < t ≤ 8h     → 50%
   8h < t ≤ capH   → 25%
   t > capH        → 0% (clamped at cap)

gained_stage = prodPerSec_atLogout · Σ(segment_seconds · segment_eff)
capH = 2 + Σ(offlineCapUpgrades)        # toward 24h; Pet "Cobble Pup" & relics add
```
Offline gain is applied **once on load** (delta-time, snapshot of `prodPerSec` at logout — not tick-by-tick), per genre standard. Cross-stage links freeze at their last on-line multiplier during offline. **Time-warp "ticks" (Chronons) can be spent post-load to convert a chosen stage's offline window to 100%** (burst, per SPEC cross-binding).

**While-You-Were-Away summary** (modal on load):
```
┌──────────── WHILE YOU WERE AWAY ────────────┐
│  Away: 6h 14m   (cap 8h · 100%/50%/25%)      │
│  ───────────────────────────────────────    │
│  Village   +1.24e8 ¢      (●●●●● 100%→50%)   │
│  Farm      +9.30e7 Grain                     │
│  Mine      +4.10e7 Ore  +2.1e5 Gems          │
│  ★ FORTUNE +3.42e4  (Engine slots: V,F,M)    │
│  ───────────────────────────────────────    │
│  [Collect]  [Spend Time-Warp ▸ +25%]  [x]    │
└──────────────────────────────────────────────┘
```

#### 4.2 Saves: slots, cloud, export/import

| Feature | Spec |
|---|---|
| Save slots | 5 local slots + 1 auto-slot; named, timestamped, shows ★ + highest stage |
| Storage tier | <1 MB → localStorage + lz-string; structured/large → IndexedDB via idb-keyval + lz-string |
| Compression | `lz-string.compressToEncodedURIComponent(JSON.stringify(save))` (60–80% reduction) |
| Cloud sync | Firebase Spark (no inactivity pause, 50K reads/day fits idle read-heavy pattern); optimistic local-first, last-write-wins by `savedAt` ts |
| Export | Copies compressed Base64 blob to clipboard + `.cogsave` file download |
| Import | Paste blob or drop file → validate → migrate → load |
| Autosave | Every 30 s + on tab `visibilitychange:hidden` + on `beforeunload` |

```
Save schema versioning (migration chain):
   save = { version: 7, savedAt: 1.71e12, data: {...} }
   on load:  while (save.version < CURRENT) migrate[save.version++](save)
   each migrate[] is pure; never mutate older fn; always write CURRENT on save
Anti-cheat (soft): clamp offline elapsed to (now − savedAt); reject negative/future deltas
```

#### 4.3 Statistics Page

```
GENERAL        ★ total · ★/sec · highest stage · playtime · saves loaded
PER STAGE (×8) lifetime primary/secondary · current/sec · generators owned
               · prestige count · best prestige gain · LP/Æ contributed
PRESTIGE/META  Ascension count · Transcendence count · Reality (Ω) count
               · Æ total · Ω total · Endless depths (per layer)
ENGINE         ★/sec breakdown per slot · engineMult · slot assignments
COLLECTIONS    relics owned/64 · resonance total · pets/rank · artifacts/cap
               · cards (temp/perm power)
EVENTS         TOKENS · STARLIGHT earned · bosses defeated · expeditions run
RATES          best ★/sec · best offline batch · fastest first-prestige time
```

#### 4.4 Encyclopedia / Codex

- **Per-generator entry**: sprite, lore paragraph, live cost/output breakdown, current `tierMult`, next milestone (10/25/50/100/200/500), exact % each owned upgrade contributes (Cookie Clicker info-panel pattern).
- **Cross-binding map**: interactive node graph showing live LABOR/Grain/Ore→Alloy/Mana/Chronon/Shard flows between stages + which Engine slots are active.
- **Currency ledger**: every currency (¢, Wood, Grain … ★, LP, Æ, Ω, TOKENS, STARLIGHT) with definition, sources, sinks.
- **Bestiary**: bosses (Verminus-class gates, Telemetry/Convergence bosses) with drop tables (relics, STARLIGHT).
- Codex unlock state mirrors discovery: **hidden / discovered-locked / unlocked** (PGS three-state); newly unlocked entries glow.

#### 4.5 Number Formatting

| Mode | Example (1 234 567) | Use |
|---|---|---|
| Standard (named) | 1.23M | default; Million…Centillion then `e`-notation |
| Scientific | 1.23e6 | toggle |
| Engineering | 1.23E6 (exp ÷3) | toggle |
| Logarithmic | e6.09 | for post-Reality astronomical ★/Shards |

```
Library ladder (per SPEC big-number guidance):
   value < 1e15        → native JS Number
   1e15 ≤ value < 1e308→ break_infinity.js  (Decimal)
   value ≥ 1e308       → break_eternity.js   (tetration; needed post-Transcendence Shards/★)
Display:  <1e6 plain · <1e33 named tiers · else eXXX · log-log "ee{x}" beyond e1e6
```

#### 4.6 Tooltips, Accessibility, Hotkeys, Mobile

**Tooltips**: hover/long-press → live breakdown `base × tierMult × globalMult × (relics·pets·artifacts·cards)` with each factor itemized; shows ΔROI ("+X ★/sec per cost") and payback time before purchase.

**Accessibility**
| Concern | Provision |
|---|---|
| Colorblind | 3 palettes (deut/prot/trit); currency icons differ by shape, never color alone |
| Motion | "Reduce juice" toggle dims number-pops/parallax; respects `prefers-reduced-motion` |
| Text | UI scale 80–150%; dyslexia-friendly font option; min 14px |
| Screenreader | ARIA-live on ★/sec + while-away summary; all buttons labeled |
| Photosensitive | golden/boss flash capped, optional disable |

**Hotkeys** (rebindable)
```
1–8  focus Stage 1–8        B  Buy-max focused generator
F    Fortune Engine panel   M  Buy-x10 toggle
P    Prestige menu          A  toggle Autobuyers
E    Codex/Encyclopedia     Space  collect offline / dismiss summary
S    Stats                  Esc  close modal
Tab  cycle buy-amount (x1/x10/x100/Max)
```

**Mobile / Touch UX**
- Bottom tab bar (Stages · Engine · Collections · Codex · Settings); thumb-reachable.
- Long-press = tooltip; double-tap = buy-max; swipe L/R = cycle stages; pinch = zoom cross-binding map.
- Buy-amount segmented control (x1/x10/x100/Max) pinned above generator list.
- 44×44px min touch targets; HUD `★/sec` always visible; responsive canvas (Phaser scale) with HTML overlay for stat panels.
- Haptic tick on milestone tier-up & boss kill; offline summary auto-opens on resume.

---

## Technical Architecture

### Layer Stack Overview

COG & COSMOS runs as a single-page web app (Phaser 3 canvas for sprites/juice + DOM/CSS overlay for the heavy stat/upgrade/skill-tree UI). All game logic is engine-agnostic TypeScript so it can be unit-tested headless. Big numbers use `break_infinity.js` (mantissa × 10^exp, max ~1e9e15) — sufficient through TIME; the codebase aliases the number type as `Big` so a swap to `break_eternity.js` (tetration) at the MULTIVERSE/Reality-Reset ceiling is a one-line change.

```
+=========================================================================+
|                         PRESENTATION LAYER                              |
|  Phaser3 Scenes (sprites, parallax, number-pop juice)  +  DOM/CSS HUD   |
|  StageView | EngineView | SkillTreeView | OfflineSummaryModal | Toasts  |
+-------------------------------- ^ renders / v dispatchUI ---------------+
|                          VIEW-MODEL / BINDING                           |
|        Reactive selectors (read-only snapshots) <- EventBus topics      |
+-------------------------------- ^ events / v commands ------------------+
|                            DOMAIN / MANAGERS                            |
|  StageManager  ResourceManager  UpgradeManager  SkillTreeManager        |
|  FortuneEngine EventManager  AchievementManager  AutomationSystem       |
|             all read/write through -> FormulaEngine                     |
+-------------------------------- ^ tick / v mutate ----------------------+
|                       CORE RUNTIME (engine-agnostic)                    |
|   GameLoop (fixed dt + accumulator)  |  EventBus  |  RNG(seeded)         |
|   FormulaEngine (cost/prod/prestige/softcap/mint)  |  Big (break_inf)    |
+-------------------------------- ^ load / v persist ---------------------+
|                          PERSISTENCE LAYER                              |
|  SaveManager -> lz-string -> IndexedDB(idb-keyval) -> optional Firebase  |
|  Content/*.json (data-driven stage & upgrade defs, schema-versioned)    |
+=========================================================================+
```

### Core Runtime Principles

| Principle | Decision | Rationale |
|---|---|---|
| Determinism | All state mutation flows through managers on the fixed tick; rendering reads snapshots only | Headless testability; offline catch-up = same code as live tick |
| Big-number | `break_infinity.js`, type-aliased `Big`; `Decimal.fromComponents` factory wrapper | 50–600× faster than decimal.js; handles through ~1e308·∞ surplus |
| Content | Pure-data JSON per stage (generators, upgrades, links); zero logic in data | Add/rebalance a stage without code changes; schema-versioned |
| Communication | Central `EventBus` (typed topics); managers never call each other directly | Decoupling; AchievementManager & AutomationSystem are pure subscribers |
| Time model | One canonical `tick(dt)` at 20 Hz fixed; render at rAF | Stable economy math independent of frame rate / tab throttling |

---

### GameLoop — Fixed Timestep with Delta Accumulation

**Responsibility:** Advance the simulation deterministically at a fixed rate regardless of render FPS or tab throttling; drive offline catch-up using the identical step function.

```ts
const TICK_HZ = 20;
const DT = 1 / TICK_HZ;          // 0.05 s canonical step
const MAX_FRAME = 0.25;          // clamp spiral-of-death (max 5 steps/frame)
let acc = 0, last = performance.now();

function frame(now: number) {
  let elapsed = (now - last) / 1000;
  last = now;
  if (elapsed > MAX_FRAME) elapsed = MAX_FRAME;   // throttled tab guard
  acc += elapsed;
  while (acc >= DT) { tick(DT); acc -= DT; }       // 0..5 fixed steps
  render(acc / DT);                                // interpolation alpha
  requestAnimationFrame(frame);
}
```

| Owned Data | Key Methods |
|---|---|
| `acc`, `last`, `DT`, `TICK_HZ`, `bigTickBudget` | `tick(dt)`, `render(alpha)`, `simulateOffline(elapsedSec)` |

**Offline catch-up:** never loop millions of 0.05 s steps. Coarse-grain into `N` macro-steps (default 600) sized `step = clamp(elapsed/600, DT, 3600)`; apply `offlineEfficiency` per the spec window (100% ≤ 2 h, then 25–50%, cap raised toward 24 h by Engine upgrades).

```
gained_per_step = production(stateₖ) * step * eff(t)
eff(t) = 1.0                       for t ≤ 7200 s
eff(t) = 0.50 (→0.25 deep)         for t > 7200 s   (raised by upgrades)
```

---

### FormulaEngine — Pure Math Core

**Responsibility:** Single source of truth for every economy formula. Stateless, pure, fully unit-tested; all managers call it. Uses `Big` throughout.

| Method | Formula | Concrete Example |
|---|---|---|
| `cost(base, r, owned)` | `base · r^owned` | MINE Shaft base 50 Ore, r=1.09, owned 12 → `50·1.09^12 ≈ 140.6` |
| `bulkCost(base, r, n, k)` | `base·r^n·(r^k−1)/(r−1)` | Buy 10 from 12 → `50·1.09^12·(1.09^10−1)/0.09 ≈ 2,137 Ore` |
| `maxAffordable(base,r,n,cash)` | `⌊log_r(cash·(r−1)/(base·r^n)+1)⌋` | Closed-form Buy-Max, no O(k) loop |
| `production(count,baseRate,tierMult,globalMult)` | `count·baseRate·tierMult·globalMult` | 50 Cottages · 0.5 ¢/s · x7 · x3.2 = 560 ¢/s |
| `tierMult(count)` | step x7..x10 at 10/25/50/100/200/500 | 60 owned → past 50 breakpoint → x8 |
| `prestigeGain(lifetime,softcap,k)` | `⌊k·(lifetime/softcap)^0.5⌋` | VILLAGE k=1, softcap 1e6, lifetime 4e6 → `⌊1·2⌋ = 2 Renown` |
| `softcap(x,C)` | `x ≤ C ? x : C·(1+(x−C)/C)^0.5` | C=1e9, x=9e9 → `1e9·3 = 3e9` effective |
| `fortuneMint(stages)` | `Σ log10(1+surplus)·weight·engineMult` | see FortuneEngine |
| `offlineEff(t)` | piecewise (above) | — |

```
Generator cost growth:  cost_n = base · r^n     (r: 1.07 VILLAGE … 1.15 MULTIVERSE)
Production:             out = count · baseRate · tierMult · globalMult
Square-root prestige:   gain = floor( k · (lifetimePrimary / softcap)^0.5 )
Soft cap (x > C):       eff(x) = C · (1 + (x − C)/C)^0.5
Fortune mint rate:      dStar/dt = Σ_stages log10(1 + surplusₛ) · weightₛ · engineMult
```

**Owned data:** none (stateless). Constants table injected from `Content/balance.json`.

---

### ResourceManager

**Responsibility:** Holds every currency balance and lifetime total; applies per-tick production deltas; enforces soft/hard caps; emits change events for the view-model.

| Owned Data | Description |
|---|---|
| `balances: Map<CurrencyId, Big>` | Coins, Wood, Grain, … Shards, Echoes, ★, LP, Æ, Ω, Tokens, Starlight |
| `lifetime: Map<CurrencyId, Big>` | drives prestige gain (never reset by stage prestige) |
| `rates: Map<CurrencyId, Big>` | cached per-second production for HUD + offline |

| Key Method | Behavior |
|---|---|
| `add(id, amt)` / `spend(id, amt): bool` | mutate + emit `resource:changed`; `spend` returns false if insufficient |
| `applyProduction(dt)` | for each currency: `add(id, rates[id]·dt)`, accumulate lifetime |
| `canAfford(costMap): bool` | multi-currency check (e.g. SPACE Alloy needs Ore + Power) |
| `recomputeRates()` | recalculated by StageManager after any buy/upgrade/link change |

---

### StageManager

**Responsibility:** Owns the eight stage models, their generators, local-prestige (Ascension) state, and the cross-stage binding graph. Computes each stage's production then routes surplus to the FortuneEngine.

| Owned Data | Description |
|---|---|
| `stages: Stage[8]` | each: `id`, `unlocked`, `generators[]`, `localPrestige{currency,count,mult}`, `surplus` |
| `bindings: Link[]` | the interdependence edges (table below) |
| `Stage.generators[]` | `{defId, owned, baseRate, costBase, costR}` |

```
Cross-stage binding graph (consumed → produced, applied in recomputeRates order):
 VILLAGE.Townsfolk ──LABOR──► FARM.output, MINE.output         (+x per labor unit)
 FARM.Grain ────────FEED───► MINE.workers, FACTORY.workers     (output mult)
 MINE.Ore + FACTORY.Power ──► SPACE.Alloy                      (input recipe)
 MAGIC.Mana ────ENCHANT────► any stage generator (temp xMult, decays)
 TIME.Chronons ─WARP TICK──► any stage (burst offline-like gain)
 MULTIVERSE.Shards ─DUPE───► any stage production (+%)
 every unlocked stage ─SURPLUS─► FortuneEngine slot → ★
```

| Key Method | Behavior |
|---|---|
| `tickStages(dt)` | resolve bindings → compute production → `ResourceManager.add` → set `surplus` |
| `buyGenerator(stageId, defId, qty)` | uses `FormulaEngine.bulkCost`; spend; `recomputeRates`; emit `generator:bought` |
| `ascend(stageId)` | `prestigeGain` → award LP/local currency → reset stage's generators, keep ★/meta |
| `applyEnchant / applyWarp / applyDupe` | activate MAGIC/TIME/MULTIVERSE bindings on a target stage |
| `recomputeRates()` | topological pass over `bindings`, then writes `ResourceManager.rates` |

---

### UpgradeManager

**Responsibility:** Owns purchasable upgrades (per-stage and global), evaluates their multiplier/unlock effects, and re-applies the multiplier stack on change.

| Owned Data | Description |
|---|---|
| `defs: UpgradeDef[]` | loaded from `Content/<stage>.json` + `Content/global.json` |
| `purchased: Set<UpgradeId>` | persisted |
| `multiplierCache: Map<Target, Big>` | composed multiplicative stack per target |

| Key Method | Behavior |
|---|---|
| `buy(id)` | check `requires` + `canAfford`; spend; add to set; `rebuildMultipliers()`; emit `upgrade:bought` |
| `effectFor(target): Big` | returns composed `Π Mᵢ` for a generator/stage/global target |
| `rebuildMultipliers()` | recompute cache from purchased set; triggers `StageManager.recomputeRates` |
| `available(): UpgradeDef[]` | unlocked + affordable + unmet-requires filtering for UI |

**Effect model (data-driven):** each upgrade is `{ op: "mul"|"add"|"unlock", target, value, requires }`. Multipliers compose multiplicatively; synergy upgrades (Cookie-Clicker style: +5% to A per unit of B owned) are expressed as `{ op:"mul", target:A, value: 1 + 0.05·count(B) }`, recomputed in `rebuildMultipliers`.

---

### SkillTreeManager

**Responsibility:** Manages the global FORTUNE (★) skill tree plus the meta trees fueled by AETHER (Æ) and OMEGA CORES (Ω). Validates node prerequisites; applies persistent global effects that survive stage prestige.

| Owned Data | Description |
|---|---|
| `nodes: SkillNode[]` | `{id, cost{currency,amt}, requires[], effect, ring}` |
| `allocated: Set<NodeId>` | persisted across stage prestige; Æ/Ω nodes survive Transcendence/Reality per spec |
| `respecTokens: number` | optional refund support |

| Key Method | Behavior |
|---|---|
| `allocate(id)` | verify `requires` allocated + currency available; spend ★/Æ/Ω; emit `skill:allocated` |
| `isUnlockable(id): bool` | prereq + currency gate for UI greying |
| `globalEffect(target): Big` | feeds into UpgradeManager's stack via EventBus |
| `respec(tree)` | refund tree's currency, clear that tree's allocations |

---

### FortuneEngine — The Mill

**Responsibility:** The central machine. Holds slot assignments, converts each unlocked stage's surplus into FORTUNE (★) per the mint formula, and applies Engine-wide upgrades (`engineMult`, offline-cap, mint-weight boosts).

| Owned Data | Description |
|---|---|
| `slots: (StageId\|null)[]` | assignable slots; a stage must occupy a slot to mint |
| `weights: Map<StageId, number>` | per-stage ★ weight (varies by stage; later stages weigh more) |
| `engineMult: Big` | global mint multiplier from Engine upgrades |
| `offlineCapHours: number` | base 2 → up to ~24 via upgrades |

```
dStar/dt = Σ_{s ∈ slottedAndUnlocked} log10(1 + surplusₛ) · weightₛ · engineMult

Example (engineMult = 1.5):
  VILLAGE surplus 9,999  weight 0.5 → log10(1e4)=4.0   · 0.5 · 1.5 = 3.00 ★/s
  MINE    surplus 1e6    weight 1.2 → log10(1e6+1)≈6.0 · 1.2 · 1.5 = 10.8 ★/s
  SPACE   surplus 1e9    weight 2.5 → log10≈9.0         · 2.5 · 1.5 = 33.75 ★/s
  ───────────────────────────────────────────────────── total = 47.55 ★/s
```

| Key Method | Behavior |
|---|---|
| `assignSlot(slotIdx, stageId)` | set slot; emit `engine:slotChanged`; `recompute` |
| `mint(dt)` | read each slotted stage `surplus`, apply formula, `ResourceManager.add('★', …)` |
| `applyEngineUpgrade(id)` | bump `engineMult` / `offlineCapHours` / weight |

---

### EventManager

**Responsibility:** Drives seasonal/random events and rare boss encounters; awards TOKENS (seasonal) and STARLIGHT (rare). FOMO-free per research: offline time accrues toward event progress; nothing is missed by infrequent logins.

| Owned Data | Description |
|---|---|
| `active: EventInstance[]` | `{defId, endsAt, progress}` |
| `defs: EventDef[]` | from `Content/events.json` |
| `golden: {nextSpawn, ttl}` | Golden-Cookie-style buff spawns (300–900 s, 13 s ttl) |

| Key Method | Behavior |
|---|---|
| `tickEvents(dt)` | advance timers; roll spawns via seeded RNG; expire instances |
| `triggerBoss(id)` | spawn rare encounter; on defeat → `ResourceManager.add('Starlight', …)` |
| `claim(eventId)` | award Tokens/Starlight; emit `event:claimed` |

---

### AchievementManager

**Responsibility:** Pure EventBus subscriber. Watches thresholds, awards achievements, and applies their permanent global bonuses (Cookie-Clicker milk-style: each achievement contributes to a compounding global multiplier surviving all resets incl. Ω).

| Owned Data | Description |
|---|---|
| `defs: AchievementDef[]` | `{id, predicate, reward, hidden}` |
| `unlocked: Set<AchId>` | survives Reality Reset (meta layer) |
| `globalBonus: Big` | composed multiplier fed to UpgradeManager stack |

| Key Method | Behavior |
|---|---|
| `onEvent(topic, payload)` | evaluate matching predicates; unlock + apply reward |
| `check(predicate): bool` | threshold/collection test |
| `bonusMultiplier(): Big` | `1 + Σ rewardᵢ` exposed to formula stack |

---

### AutomationSystem

**Responsibility:** Pure EventBus subscriber that performs buys/prestiges on the player's behalf once unlocked (milestone-gated per research). Smart "best rate-per-cost" priority each tick; respects locked/vaulted items.

| Owned Data | Description |
|---|---|
| `autobuyers: Autobuyer[]` | `{target, enabled, threshold, priority, cooldown}` |
| `queue: PurchaseOrder[]` | reorderable ordered-purchase queue (Cell-style) |

| Key Method | Behavior |
|---|---|
| `tickAuto(dt)` | for each enabled buyer past cooldown: pick best ratio, call `StageManager.buyGenerator` |
| `bestRatio(stageId): defId` | `argmax(Δproduction / cost)` skipping locked |
| `setAutoPrestige(stageId, cond)` | auto-`ascend` when condition met |

---

### SaveManager

**Responsibility:** Serialize/deserialize the full game state; compress; persist to IndexedDB with optional Firebase mirror; run schema migrations; compute offline elapsed on load.

| Owned Data | Description |
|---|---|
| `SCHEMA_VERSION` | integer; bumped on shape change |
| `lastSavedAt` | epoch ms for offline delta |
| `autosaveInterval` | default 30 s |

| Key Method | Behavior |
|---|---|
| `save()` | snapshot → `JSON.stringify` → `lz-string.compressToUTF16` → `idb-keyval.set` |
| `load()` | read → decompress → `migrate()` → hydrate managers → `simulateOffline(now−lastSavedAt)` |
| `migrate(save)` | run ordered chain `v1→v2→…→current` |
| `export()/import(str)` | Base64 string for manual backup / cloud |

```
Save root:  { version: N, savedAt: <ms>, rng: <seed+counter>,
              resources, stages, upgrades, skills, engine, achievements,
              automation, events }
Pipeline:   state → JSON → lz-string.compressToUTF16 → idb-keyval → (Firebase mirror)
Migration:  if (s.version < 2) s = v1_to_v2(s);  …  s.version = CURRENT
```

---

### EventBus

**Responsibility:** Typed publish/subscribe backbone. Managers emit; AchievementManager, AutomationSystem, and the view-model subscribe. No manager imports another.

```ts
type Topics = {
  'resource:changed':  { id: CurrencyId; value: Big };
  'generator:bought':  { stage: StageId; def: string; qty: number };
  'upgrade:bought':    { id: UpgradeId };
  'skill:allocated':   { id: NodeId };
  'engine:slotChanged':{ slot: number; stage: StageId | null };
  'stage:ascended':    { stage: StageId; gained: Big };
  'event:claimed':     { id: string; currency: CurrencyId; amt: Big };
  'achievement:unlocked': { id: string };
};
emit<K>(t: K, p: Topics[K]): void;   on<K>(t: K, fn:(p:Topics[K])=>void): Unsub;
```

---

### Data-Driven Content (JSON per Stage)

All balance/content lives in schema-versioned JSON; managers contain only logic. Example MINE generator + upgrade definition:

```json
{
  "stage": "MINE",
  "primary": "Ore", "secondary": "Gems", "localPrestige": "Depth",
  "costRate": 1.09,
  "generators": [
    { "id": "shaft", "name": "Shaft", "baseRate": 0.5, "costBase": 50,  "costCurrency": "Ore" },
    { "id": "drill", "name": "Drill", "baseRate": 6.0, "costBase": 600, "costCurrency": "Ore" }
  ],
  "upgrades": [
    { "id": "mine_pick2", "op": "mul", "target": "shaft", "value": 2,
      "cost": { "Ore": 5000 }, "requires": [] },
    { "id": "mine_grain_feed", "op": "mul", "target": "stage.MINE",
      "value": "1 + 0.02 * count(FARM.Grain)", "cost": { "Gems": 50 },
      "requires": ["mine_pick2"] }
  ],
  "fortuneWeight": 1.2,
  "milestones": [10, 25, 50, 100, 200, 500]
}
```

---

### Class Diagram (ASCII UML)

```
                         +---------------------+
                         |      GameLoop       |
                         |---------------------|
                         | -acc, -DT, -TICK_HZ |
                         | +tick(dt)           |
                         | +simulateOffline()  |
                         +----------+----------+
                                    | drives tick(dt)
        +---------------------------+----------------------------+
        v               v               v            v           v
+---------------+ +-------------+ +-----------+ +-----------+ +-----------+
| StageManager  | |ResourceMgr  | |FortuneEng | |EventMgr   | |Automation |
|---------------| |-------------| |-----------| |-----------| |-----------|
| stages[8]     | | balances    | | slots[]   | | active[]  | | autobuyers|
| bindings[]    | | lifetime    | | weights   | | golden    | | queue[]   |
| tickStages()  | | rates       | | mint(dt)  | |tickEvents | |tickAuto() |
| buyGenerator()| | add/spend() | | assignSlot| |triggerBoss| |bestRatio()|
| ascend()      | |applyProd()  | +-----+-----+ +-----------+ +-----------+
| recomputeR()  | +------+------+       |
+------+--------+        |              |
       |  uses          | mutates      | adds ★
       v                v              v
+--------------------------------------------------+
|                 FormulaEngine (pure)             |
| cost() bulkCost() maxAffordable() production()   |
| prestigeGain() softcap() fortuneMint() tierMult()|
+--------------------------------------------------+
       ^ subscribe                ^ subscribe
+--------------+  +----------------+  +--------------+  +-------------+
|UpgradeManager|  |SkillTreeManager|  |AchievementMgr|  | SaveManager |
| defs purchased| | nodes allocated|  | defs unlocked|  | migrate()   |
| effectFor()  |  | allocate()     |  | onEvent()    |  | save/load() |
+------+-------+  +-------+--------+  +------+-------+  +------+------+
       |                  |                  |                 |
       +------------------+------------------+-----------------+
                          v  publish / subscribe
                  +--------------------+
                  |      EventBus      |
                  | emit() on()        |
                  +--------------------+
```

---

### Sequence Diagram — Single Tick

```
GameLoop  StageManager  FormulaEngine ResourceMgr FortuneEngine EventMgr Automation EventBus
   |           |             |            |             |          |         |         |
   |-tick(dt)->|             |            |             |          |         |         |
   |           |-resolve bindings (LABOR/FEED/recipe)-->|          |         |         |
   |           |-production(count,rate,tierMult,gMult)->|          |         |         |
   |           |<------------out----------|             |          |         |         |
   |           |--------applyProduction(dt): add+lifetime--------->|          |         |
   |           |-set surplus per stage--->|             |          |         |         |
   |           |---------------------------------------emit resource:changed---------->|
   |-mint(dt)----------------------------------------->|          |         |          |
   |           |             |  fortuneMint(Σ log10(1+surplus)·w·engineMult)|         |
   |           |             |            |<--add('★')-|          |         |          |
   |-tickEvents(dt)------------------------------------------------>| roll RNG|         |
   |           |             |            |             |          |--spawn/expire----->|
   |-tickAuto(dt)----------------------------------------------------------->|         |
   |           |<----buyGenerator() if bestRatio affordable--------|---------|         |
   |           |             |            |             |          |         |--emit-->|
   |-render(alpha): VM reads snapshots from EventBus topics----------------------------|
```

### Sequence Diagram — Generator Purchase

```
UI/View   EventBus   StageManager   FormulaEngine   ResourceMgr   UpgradeMgr   Achv/Auto
   |          |            |               |              |             |           |
   |-buyGenerator(MINE,shaft,10)---------->|              |             |           |
   |          |            |-bulkCost(50,1.09,owned=12,k=10)->|         |           |
   |          |            |<----------2,137 Ore-----------|             |           |
   |          |            |-canAfford(2137 Ore)?--------->|             |           |
   |          |            |<-------------true-------------|             |           |
   |          |            |-spend('Ore',2137)----------->|  (balance-=) |           |
   |          |            |  owned += 10 ; tierMult re-eval (past 25→x7)|           |
   |          |            |-recomputeRates() -> production() -> rates[] |           |
   |          |            |-effectFor(shaft) <------------------------- |           |
   |          |            |---------------------emit generator:bought---|---------->|
   |          |            |               |              |             |  Achv.check|
   |          |            |               |              |             |  Auto reprioritize
   |<---resource:changed + rates update (HUD re-render, number-pop juice)|           |
```

---

## Technology & Tooling (Free-Only)

This section locks the build stack for **COG & COSMOS — The Fortune Engine**. Every entry is FREE (FOSS, free tier, or self-compilable). Selections are justified against the engineering demands of an 8-stage interconnected idle game where every stage (VILLAGE → MULTIVERSE) keeps ticking, cross-stage bindings (Townsfolk LABOR, Grain, Ore+Power→Alloy, Mana enchant, Chronon time-warp, Shard duplication) recompute continuously, and the Fortune Engine mints FORTUNE (★) from all stage surpluses every frame.

### Engineering Profile (what the stack must serve)

```text
WORKLOAD PROFILE — COG & COSMOS
  UI weight ............ VERY HIGH  (8 stage panels, Global skill tree, Engine slot board,
                                     prestige/ascension/transcendence menus, "while you were away")
  Sprite weight ........ LOW–MEDIUM (16x16 & 32x32 sprites, parallax backdrops, number-pop juice;
                                     <~300 animated sprites on screen, <10 Hz logical updates)
  Tick weight .......... MEDIUM     (8 simultaneous idle economies + cross-stage flows +
                                     Fortune mint integral; fixed-step sim @ 10–20 Hz)
  Number magnitude ..... EXTREME    (Shards/Chronons/★ exceed 1e308 → break_infinity / break_eternity)
  Save complexity ...... HIGH       (8 stage states + 4 meta currencies Æ/Ω/LP/★ + links + events)
```

Conclusion: this is a **UI-dominant, number-heavy** game with light rendering. The engine must excel at reactive HUDs and big-number math; sprite throughput is a secondary concern. This steers selection toward a JS/TS-reactive UI with a thin sprite canvas, not a heavyweight game engine.

---

### 1. Engine / Framework Comparison

| Engine | Cost / License | Language | Web export | Mobile path | Perf: UI \| sprites \| ticking | Save options | Learning curve | Pixel-art fit |
|---|---|---|---|---|---|---|---|---|
| **Godot 4** | MIT, $0, no splash/cap | GDScript / C# | WASM+PCK (3–8 s cold start; needs COOP/COEP) | Free Android/iOS templates | UI: Control nodes (good, non-DOM) \| sprites: excellent \| tick: SceneTree, tab-throttled | `FileAccess`→`user://`→IndexedDB | Moderate (scene/node) | Native: snapping, integer scale, no-filter |
| **Phaser 3** | MIT, $0, ~1.2 MB | JS / TS | IS the web; instant | Capacitor/Cordova | UI: HTML overlay (manual) \| sprites: WebGL, 2× PixiJS for sprite-heavy \| tick: rAF + Web Workers | localStorage / IndexedDB (manual) | Low–moderate; huge idle tutorial base | WebGL nearest-neighbor, atlases built-in |
| **PixiJS v8** | MIT, $0, ~450 KB | JS / TS | Native; WebGPU→WebGL | Capacitor | UI: none (render-only) \| sprites: 3× Phaser raw \| tick: manual `Ticker` | Fully manual | Moderate–high (you build the engine) | Excellent; nearest-neighbor + atlas |
| **React + TS + Vite** | MIT, $0 | TS | Native; <1 s; Vite HMR | PWA / Capacitor | UI: best-in-class \| sprites: reconciler too slow for 60 fps \| tick: hand-rolled hook/Worker | zustand-persist / idb / Dexie | Low (web), high (game loop) | Poor native; needs Pixi/Phaser inside |
| **Svelte 5 + TS** | MIT, $0 | TS | Native; runes → fine-grained DOM; near-zero runtime | PWA / Capacitor | UI: fastest reactive of any JS \| sprites: none native \| tick: `setInterval`/Worker in store/rune | `svelte-persisted-state` (auto), Dexie | Low; smaller ecosystem | CSS `image-rendering: pixelated`; embed Pixi for sprites |
| **Vanilla TS** | $0 | TS | Native; zero bundle | PWA / Capacitor | UI: manual \| sprites: manual \| tick: full control | Fully manual | High to maintain solo | Manual canvas |
| **Electron** | MIT, $0 | JS/TS | NOT web-first; ~150 MB installer; 200–300 MB RAM | Desktop only | Heavy; overkill | Node fs | Moderate | Chromium canvas |
| **Tauri 2.0** | MIT/Apache, $0, <10 MB | Rust + web FE | Wraps a web app (not a host) | Android/iOS (2.0) | Inherits chosen web FE; WebKit lags CSS on mac/Linux | OS fs + web storage | Moderate–high (Rust) | Inherits web FE |
| **Unity Personal** | Free <$200K/yr; splash on Personal | C# | WebGL/IL2CPP (5–30 MB; 10–30 s cold) | Free templates | UI: UI Toolkit (good, non-DOM) \| sprites: good (URP fight) \| tick: `Update`, throttled | PlayerPrefs / JSON→IndexedDB | High (steepest) | URP + pixel-perfect pkg; fights 3D defaults |

#### PRIMARY RECOMMENDATION — Svelte 5 + TypeScript (UI) + PixiJS v8 (sprite canvas)

```text
┌──────────────────────── COG & COSMOS RUNTIME ────────────────────────┐
│  SVELTE 5 RUNES  (reactive UI: 8 stage panels, ★ Engine slot board,    │
│                   Global tree, prestige/ascension/transcend menus)     │
│        ▲ $state/$derived bindings          ▲ "while you were away"      │
│        │                                   │                           │
│  ┌─────┴──────────── GAME CORE (Vanilla TS) ──────────────────┐        │
│  │  fixed-step sim @ 15 Hz  ·  break_eternity.js Decimal math  │        │
│  │  8 StageEconomy modules  ·  CrossStageBus  ·  FortuneEngine │        │
│  └─────┬───────────────────────────────────────────┬─────────┘        │
│        │ snapshot (sprite state, ≤10 Hz)            │ persist          │
│        ▼                                            ▼                   │
│  PIXIJS v8 CANVAS  (16/32px sprites, parallax,   idb-keyval +          │
│   number-pop juice — decorative layer only)       lz-string (IndexedDB)│
└────────────────────────────────────────────────────────────────────────┘
```

**Rationale (digest-backed):**

- The digest's own recommendation: *"If UI complexity dominates over animation: use Svelte 5 + TypeScript for all UI ... with a small PixiJS canvas embedded for sprite display only."* COG & COSMOS is exactly this — 8 stat-dense panels, a Global skill tree, a slot board, and four nested prestige menus dwarf the sprite work.
- **Svelte 5 runes** compile to fine-grained DOM updates with *"near-zero runtime overhead"* — the *"fastest reactive UI of any JS framework."* Critical when 8 economies push new Coins/Grain/Ore/Widgets/Mana/Stardust/Chronons/Shards values + the ★ mint counter every tick. React's reconciler overhead is *"prohibitive"* for this update density.
- **PixiJS v8** is render-only (~450 KB, *"3× faster pure rendering than Phaser"*) — perfect as a decorative sprite/parallax/number-pop layer driven by a ≤10 Hz snapshot, while logic lives in framework-agnostic TS.
- **Clean logic/view split**: keeping the sim in Vanilla TS (digest: *"the game logic layer inside any of the above"*) makes the economy unit-testable and lets the ★ mint integral run independent of frame rate.
- **Save fit**: `svelte-persisted-state` is *"runes-native ... auto-persists,"* with Dexie/idb-keyval for the large structured save (8 stages + meta).

#### NAMED ALTERNATIVE — Phaser 3 + TypeScript (HTML-overlay HUD)

Pick this if sprite/animation ambition grows (animated Townsfolk crowds, lively Factory lines, particle-heavy Space/Multiverse) or to lean on the genre's largest tutorial base. Digest: *"Solo dev, web-first, pixel-art idle game: use Phaser 3 + TypeScript ... zero WASM penalty (instant load) ... For the heavy stat/upgrade UI layer, overlay HTML `<div>`s styled with CSS above the Phaser canvas."* Trade-off: the HTML-overlay HUD is *"manual work"* and lacks Svelte's reactive ergonomics — you hand-wire DOM updates for all 8 panels.

**Explicitly avoided:** Unity & Godot (WASM cold-start 3–30 s + COOP/COEP header friction kills instant web play; Unity splash on Personal), Electron/Tauri (not web-native; no benefit for a web-first game), PixiJS-alone (*"wrong abstraction level ... you spend weeks building systems Phaser gives free"*), React (reconciler overhead at this update density).

---

### 2. Pixel-Art / Sprite Tools

| Tool | Cost | Layers | Timeline / anim | Tilemap + autotile | Export | In-browser | Verdict for COG & COSMOS |
|---|---|---|---|---|---|---|---|
| **Aseprite** | $19.99 Steam **or $0 self-compiled (FOSS license)** | Yes | Best-in-class onion skin | Yes (rect/iso/hex) | PNG/GIF/APNG/spritesheet **JSON** | No | Top quality; free only if you compile |
| **Pixelorama** | **$0, FOSS** (built in Godot) | Yes | Timeline + frame tags + audio sync | Yes (rect/iso/hex + autotile) | PNG/GIF/APNG/video; **Godot TileSet** | **Yes** (also desktop) | **RECOMMENDED** — zero-cost, actively maintained |
| **LibreSprite** | $0, FOSS (pre-license fork) | Yes | Yes | No (feature-frozen) | PNG/GIF/spritesheet | No | Fallback if compile blocked; dated |
| **Piskel** | $0, browser | No | Basic | No | PNG/GIF spritesheet | Yes | Disposable jam sprites only |

**Pick: Pixelorama** (self-compiled Aseprite as optional upgrade). It is fully free, actively maintained, exports the spritesheet PNGs + JSON frame data PixiJS consumes via `Assets.load`, and its tilemap layers serve the eight parallax stage backdrops (medieval hamlet → branching realities). Aseprite's spritesheet-JSON export is identical in shape, so a later self-compile is a drop-in upgrade with no pipeline change. Piskel is reserved for throwaway prototype icons.

---

### 3. Audio Tools

| Tool | Cost | Role | Output | In-browser | Use in COG & COSMOS |
|---|---|---|---|---|---|
| **jsfxr** (sfxr.me) | $0 | Procedural 8-bit SFX | WAV | Yes | Number-pop "juice", coin/click, generator buys |
| **ChipTone** | $0 | Richer SFX (filters, arps) | WAV | Yes | Prestige/Ascension stingers, ★ mint chime, boss/rare-event hits |
| **Bosca Ceoil** | $0 | Chiptune loop sequencer | OGG/WAV/MID | Yes | Per-stage cozy↔cosmic loops (8 themes) |
| **LMMS** | $0, FOSS | Full DAW | MP3/OGG/WAV | No | Optional deeper OST (Time/Multiverse motifs) |
| **Audacity** | $0, FOSS | Edit / trim / loop / normalize | OGG/MP3/WAV | No | Loop-point cleanup, normalize, OGG export |

**Pick: jsfxr + ChipTone (SFX) + Bosca Ceoil (music) + Audacity (editing).** This covers every audio need free: jsfxr for the high-frequency number-pop and buy clicks; ChipTone for weightier prestige/transcendence stingers and the rare-event/STARLIGHT chime; Bosca Ceoil for eight short looping stage themes; Audacity to set seamless loop points and export web-friendly OGG. (`Bfxr` is the legacy Flash predecessor to jsfxr — skip it; jsfxr fully replaces it.) Add **LMMS** only if a richer multi-track OST for the late TIME/MULTIVERSE stages is wanted.

---

### 4. Data / Save Technology

Save payload = 8 stage states (primary+secondary+generators+local-prestige currency) + meta currencies **★ / LP / Æ / Ω** + cross-stage link config + Engine slot assignments + events/collections. This is **HIGH** complexity → IndexedDB, not raw localStorage.

| Tech | Limit / nature | Role here |
|---|---|---|
| **localStorage** | 5–10 MB, synchronous (blocks main thread) | Settings + small flags only (number-format mode, audio toggles) |
| **IndexedDB via idb-keyval** | Async, ~1 GB practical; ~600 B lib | **Primary save store** (full structured game state) |
| **lz-string** | 60–80% reduction on repetitive JSON | Compress save blob before write |

#### Save schema (versioned root + migration chain)

```ts
interface SaveV3 {
  version: 3;
  ts: number;                                  // last-active epoch ms (offline delta)
  meta: { star: string; LP: Record<Stage,string>; aether: string; omega: string;
          tokens: string; starlight: string }; // Decimal serialized as string
  stages: Record<Stage, {                      // Stage = VILLAGE..MULTIVERSE
    primary: string; secondary: string;        // e.g. Coins/Wood, Shards/Echoes
    gens: { count: number; bought: number }[]; // signature + tier generators
    prestigeCur: string;                        // Renown..Convergence
  }>;
  links: { from: Stage; to: Stage; pct: number }[]; // Townsfolk LABOR, Ore+Power→Alloy, ...
  engineSlots: (Stage | null)[];               // ★ mint slot board
  events: { tokens: string; activeSeason?: string };
}
```

```ts
// Migration chain — always write current schema version on save
const MIGRATIONS = [migrate_v1_to_v2, migrate_v2_to_v3];
function loadSave(raw: string): SaveV3 {
  let s = JSON.parse(lzString.decompressFromUTF16(raw));
  while (s.version < 3) s = MIGRATIONS[s.version - 1](s); // v1→v2→v3
  return s as SaveV3;
}
function writeSave(s: SaveV3): void {
  const blob = lzString.compressToUTF16(JSON.stringify(s));
  idbKeyval.set('cogcosmos:save', blob);        // async, non-blocking
}
```

#### Big-number library (mandatory, not optional)

Shards, Chronons, and ★ routinely exceed JS's `1.79e308` float ceiling, and meta layers (Transcendence Æ, Reality Reset Ω) push into tetration range.

```text
NUMBER RANGE → LIBRARY (digest thresholds)
  < 1e15 .............. native JS Number       (early VILLAGE Coins, Wood)
  1e15 – 1e308 ........ break_infinity.js       (mid-game Widgets, Mana, Stardust)
  > 1e308 ............. break_eternity.js       (Shards, Chronons, ★, Æ, Ω — tetration)
PICK: break_eternity.js as the single Decimal type project-wide
      (drop-in for break_infinity; serialize via Decimal→string in save).
```

#### Offline progress (delta-time on load, per SPEC)

```text
elapsed   = clamp(now - save.ts, 0, offlineCapHours * 3600)  // base 2h → upgrades → ~24h
window2h  = min(elapsed, 7200)                               // SPEC: 100% for first 2h
beyond    = max(elapsed - 7200, 0)                           // SPEC: 25–50% efficiency after
gained_s  = ratePerSec_at_logout * (window2h + beyond * eff) // eff ∈ [0.25, 0.50]
```

Computed once on load (never tick-by-tick), then surfaced in the *"while you were away"* summary across all unlocked stages.

---

### 5. Hosting & Cloud Sync (Free)

#### Static hosting

| Platform | Free bandwidth | Build CI | Commercial OK? | Role |
|---|---|---|---|---|
| **itch.io** | Unlimited (CDN+GZIP); 200 MB/file, 500 MB/game | No | Yes (you set cut) | **PRIMARY** — game-native audience, HTML5 iframe embed |
| **Cloudflare Pages** | **Unlimited** bandwidth; 500 builds/mo | Yes | Yes | **MIRROR** — raw perf, global CDN, custom domain |
| **GitHub Pages** | ~100 GB/mo soft | Actions | OSS-favored | **DEV PREVIEW** / backup |
| **Netlify** | 100 GB/mo; 300 credits | Yes | Yes | Optional CI alt |
| **Vercel** | 100 GB/mo | Yes | **Hobby = non-commercial only** | Avoid on free tier for a shipped game |

**Pick:** Ship on **itch.io** (discoverability + zero-friction HTML5 embed for the Svelte+Pixi static bundle), **mirror on Cloudflare Pages** (unlimited bandwidth, custom domain, fastest CDN). **GitHub Pages** hosts dev previews via Actions. Avoid **Vercel** free tier — Hobby is non-commercial only.

#### Cloud sync (optional — local save is the default; cloud is opt-in cross-device backup)

| Provider | Free tier (2026) | Pause risk | Fit for COG & COSMOS |
|---|---|---|---|
| **Firebase (Spark)** | 1 GB Firestore; 50K reads/day; 20K writes/day; 10 GB hosting/mo; **no pausing** | None | **RECOMMENDED** — read-heavy/write-light idle pattern fits read quota; offline persistence built-in |
| **Supabase** | 500 MB Postgres; 50K MAU auth; **pauses after 1 wk inactivity** | Yes | Use only if SQL/auth/RLS or leaderboards are needed |

**Pick: Firebase Spark** for opt-in cloud save. An idle game reads its save on load and writes on autosave/exit — **read-heavy, write-light** — which maps cleanly onto Spark's generous 50K reads/day vs 20K writes/day, and Spark *"has no pausing"* (Supabase pauses after a week idle, fatal for a player who logs in weekly). Firestore's native offline persistence dovetails with the local IndexedDB-first model: write Decimal-as-string save blobs keyed by user, last-write-wins by `ts`. Choose **Supabase** instead only if seasonal-event leaderboards (TOKENS/STARLIGHT) or auth+RLS become first-class features.

#### Recommended free stack (summary)

```text
ENGINE ...... Svelte 5 + TS (UI)  +  PixiJS v8 (sprites)  +  Vanilla TS core
NUMBERS ..... break_eternity.js (single Decimal type)
ART ......... Pixelorama  (→ self-compiled Aseprite optional)
AUDIO ....... jsfxr + ChipTone (SFX) · Bosca Ceoil (music) · Audacity (edit)
SAVE ........ IndexedDB (idb-keyval) + lz-string, versioned schema + migration chain
HOST ........ itch.io (primary) · Cloudflare Pages (mirror) · GitHub Pages (dev)
CLOUD ....... Firebase Spark (opt-in sync; read-heavy fit, no pause)
COST ........ $0 across the entire pipeline
```

---

## Folder Structure & Project Layout

This section specifies the canonical on-disk layout for **COG & COSMOS — The Fortune Engine** on the recommended primary stack (**React 18 + TypeScript + Vite + PixiJS**, with Zustand for global state and `break_eternity.js` for big numbers). The layout enforces a strict **data-driven, content-as-JSON** philosophy: the eight stages (VILLAGE → MULTIVERSE) and the Fortune Engine are *configuration*, not bespoke code. Adding a ninth stage must be additive — new JSON + new sprites + one registry line — never a refactor.

### Design Principles (drive every folder decision)

| Principle | Folder consequence |
|---|---|
| **Content is data, not code** | Every stage's generators, costs, currencies, prestige curve live in `src/data/stages/*.json`, validated by Zod schemas in `src/data/schema/`. |
| **Logic ↔ Render split** | `systems/` (pure, deterministic, testable) never imports from `ui/` or `pixi/`. The economy must run headless under Vitest with zero DOM. |
| **One-directional imports** | `data → systems → managers → store → hooks → ui`. Lower layers never import upward. Enforced by `eslint-plugin-boundaries`. |
| **Stages are NOT silos** | Cross-stage bindings (Labor, Grain-feed, Alloy inputs, Mana enchant, Chronon warp, Shard duplicate) live in `systems/bindings/`, never inside a single stage's folder. |
| **Big numbers everywhere** | All economy values are `Decimal` (break_eternity). Native `number` only for UI counts, frame deltas, and indices. |

### Top-Level Tree

```
cog-and-cosmos/
├── public/                      # served as-is; NOT bundled
│   ├── favicon.ico
│   └── og-image.png
├── src/
│   ├── main.tsx                 # React root; mounts <App/>, boots GameLoop
│   ├── App.tsx                  # top-level layout shell (HUD + stage viewport)
│   ├── vite-env.d.ts
│   │
│   ├── core/                    # engine primitives, framework-agnostic
│   │   ├── Decimal.ts           # re-export + helpers over break_eternity.js
│   │   ├── GameLoop.ts          # fixed-timestep accumulator (see formula below)
│   │   ├── RNG.ts               # seeded mulberry32 for events/golden-drops
│   │   ├── EventBus.ts          # typed pub/sub (decouples systems↔ui)
│   │   ├── format.ts            # number → "1.23M" / "e1234.56" display
│   │   └── time.ts              # timestamp, delta-clamp, offline window calc
│   │
│   ├── systems/                 # PURE economy logic — no React, no Pixi
│   │   ├── economy/
│   │   │   ├── production.ts     # output = count*baseRate*tierMult*globalMult
│   │   │   ├── cost.ts           # cost_n = base*r^n ; bulk-buy closed form
│   │   │   ├── softcap.ts        # eff(x) = C*(1+(x-C)/C)^0.5
│   │   │   └── milestones.ts     # tier mult x7..x10 @ 10/25/50/100/200/500
│   │   ├── prestige/
│   │   │   ├── stagePrestige.ts  # gain = floor(k*(lifetime/softcap)^0.5)
│   │   │   ├── ascension.ts      # LP (per-stage) reset + permanent local boost
│   │   │   ├── transcendence.ts  # Æ (global reset, keeps meta)
│   │   │   └── realityReset.ts   # Ω (top layer; NG+ modifiers)
│   │   ├── fortune/
│   │   │   ├── mint.ts           # dStar/dt = Σ log10(1+surplus)*weight*engineMult
│   │   │   ├── slots.ts          # stage→Engine slot assignment + ★ weights
│   │   │   └── engineUpgrades.ts
│   │   ├── bindings/             # CROSS-STAGE interdependence (never per-stage)
│   │   │   ├── labor.ts          # Village Townsfolk → Farm & Mine
│   │   │   ├── grainFeed.ts      # Farm Grain → Mine/Factory worker output
│   │   │   ├── alloyInputs.ts    # Mine Ore + Factory Power → Space Alloy
│   │   │   ├── enchant.ts        # Magic Mana → temp multiplier any stage
│   │   │   ├── timeWarp.ts       # Time Chronons → burst ticks on a stage
│   │   │   └── shardDuplicate.ts # Multiverse Shards → % production clone
│   │   ├── offline/
│   │   │   └── catchup.ts        # delta-time: 100% ≤2h, 25-50% after, ≤24h cap
│   │   ├── content/
│   │   │   ├── stageEngine.ts     # generic per-stage simulator (reads JSON)
│   │   │   ├── stageRegistry.ts   # ORDERED list of all 8 stages (single source)
│   │   │   └── currencyRegistry.ts
│   │   └── index.ts
│   │
│   ├── managers/                # stateful orchestrators (own Decimal state)
│   │   ├── StageManager.ts       # instantiates a stageEngine per unlocked stage
│   │   ├── FortuneManager.ts     # runs mint loop, holds ★ balance
│   │   ├── PrestigeManager.ts    # routes LP / Æ / Ω resets to right layers
│   │   ├── BindingManager.ts     # applies all systems/bindings each tick
│   │   ├── EventManager.ts       # seasonal TOKENS + rare STARLIGHT events
│   │   ├── AchievementManager.ts
│   │   ├── SaveManager.ts        # serialize → lz-string → IndexedDB
│   │   └── OfflineManager.ts     # "while you were away" summary builder
│   │
│   ├── store/                   # Zustand — the React-facing state mirror
│   │   ├── gameStore.ts          # root store; managers write, UI reads
│   │   ├── slices/
│   │   │   ├── stagesSlice.ts
│   │   │   ├── fortuneSlice.ts
│   │   │   ├── metaSlice.ts       # LP/Æ/Ω, achievements, collections
│   │   │   └── settingsSlice.ts   # number format, offline cap, audio vol
│   │   └── selectors.ts          # memoized derived values for UI
│   │
│   ├── hooks/                   # React ↔ game bridge
│   │   ├── useGameLoop.ts         # rAF driver; pumps GameLoop into store
│   │   ├── useStage.ts           # subscribe to one stage's slice
│   │   ├── useCurrency.ts        # live balance + per-sec rate
│   │   ├── useFortune.ts
│   │   ├── useOfflineSummary.ts
│   │   └── useNumberFormat.ts
│   │
│   ├── pixi/                    # ALL PixiJS lives here (sprite render only)
│   │   ├── PixiCanvas.tsx         # single <canvas>, React-mounted
│   │   ├── StageScene.ts          # parallax backdrop + generator sprites
│   │   ├── NumberPop.ts           # floating "+X" juice
│   │   ├── ParallaxLayer.ts
│   │   └── loaders.ts             # Assets.load atlases per stage
│   │
│   ├── ui/                      # SCREEN-level React (composition of components)
│   │   ├── HUD/                   # ★ Fortune, active-stage tabs, prestige bar
│   │   ├── StagePanel/            # generator buy list for current stage
│   │   ├── FortuneEngine/         # slot assignment UI
│   │   ├── SkillTree/             # global ★ skill tree
│   │   ├── PrestigePanels/        # Ascension / Transcendence / Reality screens
│   │   ├── Achievements/
│   │   ├── OfflineModal/          # "while you were away"
│   │   └── Settings/
│   │
│   ├── components/              # DUMB, reusable, stateless presentational
│   │   ├── BigNumber.tsx          # renders Decimal via useNumberFormat
│   │   ├── BuyButton.tsx          # x1 / x10 / x100 / Max
│   │   ├── ProgressBar.tsx
│   │   ├── ResourceChip.tsx
│   │   ├── Tooltip.tsx
│   │   └── PixelPanel.tsx         # 9-slice pixel frame wrapper
│   │
│   ├── data/                    # ★ ALL CONTENT — pure JSON, no logic ★
│   │   ├── schema/                # Zod validators (compile-time + runtime)
│   │   │   ├── stage.schema.ts
│   │   │   ├── generator.schema.ts
│   │   │   ├── skill.schema.ts
│   │   │   ├── achievement.schema.ts
│   │   │   └── binding.schema.ts
│   │   ├── stages/                # one file per stage (canonical order)
│   │   │   ├── 01-village.json
│   │   │   ├── 02-farm.json
│   │   │   ├── 03-mine.json
│   │   │   ├── 04-factory.json
│   │   │   ├── 05-magic.json
│   │   │   ├── 06-space.json
│   │   │   ├── 07-time.json
│   │   │   └── 08-multiverse.json
│   │   ├── currencies.json        # ¢/Wood, Grain/Water … ★/LP/Æ/Ω/TOKENS/STARLIGHT
│   │   ├── bindings.json           # cross-stage edges + ratios
│   │   ├── fortuneEngine.json      # slot count, per-stage ★ weights, upgrades
│   │   ├── skills.json             # global ★ skill tree nodes
│   │   ├── achievements.json
│   │   ├── events.json             # seasonal TOKEN + rare STARLIGHT tables
│   │   └── balance.json            # global constants (r, k, softcap C, caps)
│   │
│   ├── assets/                  # imported by bundler (hashed at build)
│   │   ├── sprites/
│   │   │   ├── stages/{village,farm,mine,factory,magic,space,time,multiverse}/
│   │   │   │   ├── generators_16.png   # 16×16 generator sprites
│   │   │   │   ├── backdrop_parallax.png
│   │   │   │   └── atlas.json           # PixiJS texture atlas
│   │   │   ├── engine/                  # Fortune Mill sprites
│   │   │   ├── ui/                      # 32×32 icons, 9-slice frames
│   │   │   └── currencies/              # ¢, ★, Æ, Ω icons
│   │   ├── audio/
│   │   │   ├── sfx/                      # jsfxr/ChipTone WAV: buy, prestige, pop
│   │   │   └── music/                    # Bosca Ceoil OGG loops per stage
│   │   └── fonts/
│   │       └── pixel.woff2              # bitmap-style pixel font
│   │
│   ├── save/                    # persistence layer (logic in managers/)
│   │   ├── schemaVersion.ts        # current SAVE_VERSION = 1
│   │   ├── migrations/             # v(n)→v(n+1) pure functions
│   │   │   ├── index.ts            # ordered migration chain
│   │   │   └── 001_initial.ts
│   │   ├── serialize.ts            # Decimal-aware replacer/reviver
│   │   └── codec.ts               # lz-string compressToEncodedURIComponent
│   │
│   └── styles/
│       ├── globals.css
│       └── tokens.css              # cozy-meets-cosmic palette vars
│
├── tests/                       # Vitest; mirrors src/ structure
│   ├── systems/
│   │   ├── cost.test.ts
│   │   ├── production.test.ts
│   │   ├── softcap.test.ts
│   │   ├── stagePrestige.test.ts
│   │   └── fortuneMint.test.ts
│   ├── bindings/
│   │   └── labor.test.ts
│   ├── offline/
│   │   └── catchup.test.ts
│   ├── save/
│   │   └── migration.test.ts
│   └── fixtures/
│       └── sampleSave.json
│
├── scripts/
│   ├── validate-content.ts        # Zod-checks every data/*.json in CI
│   └── new-stage.ts               # scaffolds a stage (see recipe below)
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── vitest.config.ts
├── .eslintrc.cjs                  # includes eslint-plugin-boundaries
├── package.json
└── README.md
```

### Module Boundary Rules

The import graph is **strictly acyclic and one-directional**. Enforce with `eslint-plugin-boundaries`; violation = CI fail.

```
        data/ ──────────────┐  (JSON + Zod; imports nothing but schema)
          │                 │
          ▼                 ▼
      systems/  ◄── core/   (pure logic; may use core primitives)
          │
          ▼
      managers/             (stateful; owns Decimal; calls systems)
          │
          ▼
       store/   (Zustand)   (managers write here)
          │
     ┌────┴────┐
     ▼         ▼
   hooks/    pixi/          (read store; pixi renders only)
     │
     ▼
    ui/  ──▶ components/    (screens compose dumb components)
```

| Rule | Allowed | Forbidden |
|---|---|---|
| `systems/*` imports | `core/`, `data/` (read JSON), other `systems/` | `managers/`, `store/`, `ui/`, `pixi/`, React |
| `data/*.json` | nothing (inert) | — |
| `data/schema/*` | `zod` only | game logic |
| `managers/*` | `systems/`, `core/`, `store/` (write) | `ui/`, `pixi/`, React hooks |
| `ui/*` | `components/`, `hooks/`, `store/` (read) | `systems/`, `managers/` directly |
| `pixi/*` | `core/`, `store/` (read) | `systems/`, `managers/`, `ui/` |
| `bindings/*` | two+ stages' interfaces | hard-coding one stage's internals |

**Critical invariant:** `systems/` must run headless. `import { simulateStage } from 'systems'` works in a Node test with no `window`. This is what makes the economy unit-testable and the offline catch-up deterministic.

### Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| React components / UI screens | `PascalCase.tsx` | `StagePanel.tsx`, `BigNumber.tsx` |
| Systems / managers / hooks | `camelCase.ts` / `useXxx.ts` | `production.ts`, `useFortune.ts` |
| Stage data files | `NN-kebab.json` (ordered) | `05-magic.json` |
| Zod schemas | `xxx.schema.ts` | `stage.schema.ts` |
| Save migrations | `NNN_description.ts` | `002_add_telemetry.ts` |
| Stage IDs (in JSON & code) | lowercase singular | `village`, `magic`, `multiverse` |
| Currency IDs | lowercase, primary/secondary | `coins`, `wood`, `grain`, `chronons` |
| Meta currency IDs | uppercase tickers | `FORTUNE`, `LP`, `AETHER`, `OMEGA` |
| Test files | mirror source `+ .test.ts` | `cost.test.ts` |
| Event constants | `SCREAMING_SNAKE` | `OFFLINE_CAP_HOURS` |

### Canonical Stage JSON Shape

Every `data/stages/NN-*.json` conforms to `stage.schema.ts`. The `stageEngine` reads this generically — there is **no per-stage code**.

```jsonc
{
  "id": "mine",
  "order": 3,
  "theme": "deep caverns",
  "currencies": {
    "primary":   { "id": "ore",  "symbol": "Ore",  "color": "#9a8478" },
    "secondary": { "id": "gems", "symbol": "Gems", "color": "#5ad1ff" }
  },
  "prestige": { "currency": "depth", "k": 1, "softcap": 1e6, "exponent": 0.5 },
  "generators": [
    {
      "id": "shaft",
      "name": "Shaft",
      "sprite": "generators_16#shaft",
      "baseCost": 15, "costCurrency": "ore", "r": 1.08,
      "baseRate": 0.1, "produces": "ore",
      "tierMilestones": [10, 25, 50, 100, 200, 500],
      "tierMults":      [7,   7,  8,  8,   9,   10]
    },
    {
      "id": "drill", "name": "Drill", "sprite": "generators_16#drill",
      "baseCost": 1100, "costCurrency": "ore", "r": 1.09,
      "baseRate": 8, "produces": "ore",
      "tierMilestones": [10, 25, 50, 100, 200, 500],
      "tierMults":      [7,   7,  8,  9,   9,   10]
    }
  ],
  "fortuneWeight": 1.0,                // ★ mint weight when slotted
  "consumes":  ["labor"],              // binding INPUTS (from systems/bindings)
  "provides":  ["ore→alloy"]           // binding OUTPUTS
}
```

### Core Formulas (implemented in `src/systems/formulas.ts` + the per-stage defs)

```text
COST (single):     cost_n   = base * r^n                       r = 1.07 early … 1.15 late
COST (bulk k):     Σ        = base*r^n * (r^k − 1)/(r − 1)
MAX AFFORDABLE k:  floor( log_r( cash*(r−1)/(base*r^n) + 1 ) )
PRODUCTION:        output   = count * baseRate * tierMult * globalMult
TIER MULT:         flat ×2 at owned counts 10 / 25 / 50 / 100 / 250 / 500 / 1000 / 2500  (shipped)
SOFTCAP (x>C):     eff(x)   = C * (1 + (x − C)/C)^0.5
STAGE PRESTIGE:    gain     = floor( k * (lifetimePrimary / softcap)^0.5 )
FORTUNE MINT:      dStar/dt = Σ_stages log10(1 + stageSurplus) * fortuneWeight * engineMult
OFFLINE:           gained   = rate * Δt * eff ;  eff = 1.0 (Δt ≤ 2h) → 0.25–0.50 → cap ≤ 24h
GAME LOOP (fixed): accumulator += clamp(realΔt, 0, MAX_FRAME); while(acc ≥ DT){ step(DT); acc −= DT }  // DT = 1/20 s
```

**Worked example (Mine, Shaft):** owning n=49 Shafts, the 50th costs `15 * 1.08^49 ≈ 15 * 43.4 = ₒ651`. With 50 owned the tier mult hits **x8** (count ≥ 50), so production = `50 * 0.1 * 8 * globalMult = 40 * globalMult` Ore/s. Buying to 100 from 50 costs `15*1.08^50 * (1.08^50 − 1)/0.08 ≈ ₒ703 * 573 ≈ ₒ402,800`.

### "How to Add a New Stage" — Extensibility Recipe

Goal: add a hypothetical **9th stage** (or reorder/insert one) with zero edits to economy logic. Touch files **in this order**:

| # | File | Action |
|---|---|---|
| 1 | `src/data/stages/09-newstage.json` | Author the stage (copy `08-multiverse.json`, fill `id`, `order:9`, currencies, generators, `fortuneWeight`). |
| 2 | `src/data/currencies.json` | Register the new primary/secondary + local-prestige currency IDs + symbols + palette colors. |
| 3 | `src/data/schema/stage.schema.ts` | **Only if** the stage needs a genuinely new field; otherwise unchanged (the point of the schema). |
| 4 | `src/data/bindings.json` | Add cross-stage edges (what it `consumes`/`provides`) so it is NOT a silo. Add matching logic only if a brand-new binding *type* — else reuse `systems/bindings/*`. |
| 5 | `src/systems/content/stageRegistry.ts` | Append the stage import to the **ordered** registry array (single source of unlock order). |
| 6 | `src/data/fortuneEngine.json` | Add the stage's ★ mint weight + (optionally) a new Engine slot. |
| 7 | `src/data/skills.json` | Add any global ★ skill-tree nodes that target the new stage. |
| 8 | `src/data/achievements.json` | Add milestone achievements (unlock, first prestige, count thresholds). |
| 9 | `src/assets/sprites/stages/newstage/` | Drop `generators_16.png`, `backdrop_parallax.png`, `atlas.json` (Pixelorama export). |
| 10 | `src/assets/audio/music/` | Add the stage's Bosca Ceoil OGG loop. |
| 11 | `tests/systems/` (+ run) | Add a balance test (e.g., cost/prestige curve sanity) and `npm run validate-content`. |
| 12 | `src/save/migrations/` | Add `00N_add_newstage.ts` to default the stage's state for existing saves; bump `SAVE_VERSION`. |

**No edits required to:** `systems/economy/*`, `systems/prestige/*`, `managers/*`, `store/*`, `hooks/*`, `ui/StagePanel`, `components/*`. They are stage-agnostic and consume the registry + JSON. Steps 1–2, 5, 9 are the *minimum* for a playable stage; 4, 6–8, 10–12 complete the integration. Run order matters: **content (1–10) → tests (11) → migration (12)**, then `scripts/new-stage.ts` can automate steps 1, 2, 5, 9 scaffolding.

### Config Files (purpose at a glance)

| File | Responsibility |
|---|---|
| `vite.config.ts` | base path for itch.io/GitHub Pages, PixiJS chunking, asset hashing |
| `tsconfig.json` | `strict: true`, path aliases (`@systems`, `@data`, `@ui`) |
| `vitest.config.ts` | headless `node` environment for `systems/`, jsdom only for hook tests |
| `.eslintrc.cjs` | `eslint-plugin-boundaries` rules mirroring the import graph above |
| `data/balance.json` | single home for `r`, `k`, softcap `C`, offline caps, milestone tables |

### Godot 4 Variant (fallback stack)

If targeting **Godot 4** instead, the same data-driven philosophy maps to Godot's `res://` tree. Keep content as JSON (loaded via `FileAccess` + `JSON.parse_string`) rather than `.tres` resources, so the economy stays portable and diff-friendly.

```
res://
├── data/            # SAME JSON files (stages, currencies, bindings, balance)
├── systems/         # GDScript pure logic (no node refs) — mirrors src/systems
├── managers/        # autoload singletons (StageManager, FortuneManager…)
├── scenes/          # *.tscn — replaces ui/ + pixi/ + components/
│   ├── HUD.tscn
│   ├── StagePanel.tscn
│   └── stages/      # one scene per stage backdrop (AnimatedSprite2D)
├── assets/          # sprites/audio/fonts (import flags: filter OFF, mipmaps OFF)
└── save/            # user:// → IndexedDB on web export; JSON + lz-string
```

| Concern | React+PixiJS | Godot 4 |
|---|---|---|
| Pure economy | `src/systems/*.ts` (Vitest) | `systems/*.gd` (GUT tests) |
| State mirror | Zustand store | autoload singleton vars |
| Render | PixiJS `StageScene` | `Node2D` + `AnimatedSprite2D` |
| Save target | IndexedDB via idb-keyval | `user://` (auto IndexedDB on web) |
| Big numbers | `break_eternity.js` | GDScript custom `BigNumber` class or addon |

The `data/` folder is **identical** across both stacks — the JSON content contract is the portability boundary, so a stage authored once is reusable if the engine choice changes.

---

## Save System Design

### Design Goals and Constraints

| Goal | Mechanism | SPEC tie-in |
|---|---|---|
| Never lose meta progress | FORTUNE (★), AETHER (Æ), OMEGA CORES (Ω) live in a tamper-checked `meta` block separate from per-stage data | Meta currencies "NEVER reset by stage prestige" |
| Survive every reset layer | Save partitions mirror the layer stack: `stages[]` (idle/prestige) → `ascension` (LP) → `transcendence` (Æ) → `reality` (Ω) → `meta` | Progression Layer Stack |
| Full offline catch-up | `lastSeen` epoch-ms timestamp + monotonic `playMs` drives the "while you were away" summary | Offline 100% ≤2h, then 25-50%, cap →24h |
| Free, web-first, no backend required | IndexedDB primary + localStorage fallback, lz-string compression, optional Firebase/Supabase free-tier sync | FREE tools mandate |
| Resist casual cheating | FNV-1a checksum + optional server-authoritative meta validation | (anti-tamper section) |

---

### What Is Stored (Domain → Save Region Map)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ROOT SAVE OBJECT                                                      │
│  ├─ version, schemaHash, savedAt, playMs, lastSeen          (header)  │
│  ├─ engine        Fortune Engine: ★ count, slots[8], engineMult       │
│  ├─ stages[8]     per-stage idle economy (Village..Multiverse)        │
│  ├─ ascension     per-stage LP + permanent local boost levels         │
│  ├─ transcendence global Æ + global/ascension meta-tree node levels   │
│  ├─ reality       Ω cores + NG+ modifiers + permanent QoL flags        │
│  ├─ meta          achievements, collections, STARLIGHT, lifetime stats│
│  ├─ links         cross-stage binding assignments (Labor/Grain/…)     │
│  ├─ events        seasonal TOKENS, active event state                 │
│  ├─ settings      number format, offline cap, autosave cadence        │
│  └─ checksum      FNV-1a over canonical-serialized body               │
└─────────────────────────────────────────────────────────────────────┘
```

| Region | Reset by Stage Prestige? | Reset by Ascension? | Reset by Transcendence? | Reset by Reality? |
|---|---|---|---|---|
| `stages[i].generators`, primary/secondary currency | Yes (soft) | Yes | Yes | Yes |
| `stages[i].prestigeCurrency` (Renown…Convergence) | No | Yes | Yes | Yes |
| `ascension[i]` (LP + local boosts) | No | No (accumulates) | Yes | Yes |
| `transcendence` (Æ, global trees) | No | No | No (accumulates) | Yes |
| `reality` (Ω, NG+ mods, QoL) | No | No | No | No (accumulates) |
| `meta`, `engine.star` (★), achievements | No | No | No | No |

---

### Annotated Versioned JSON Schema

All big numbers are stored as `break_infinity.js` serialized strings (`"mantissa,exponent"`) once they exceed 1e15; native numbers below that. The schema is `CURRENT_VERSION = 4`.

```jsonc
{
  // ── HEADER ────────────────────────────────────────────────
  "version": 4,                 // integer schema version; drives migration chain
  "schemaHash": "a3f9c1",       // FNV-1a of the field-name set; detects shape drift
  "savedAt": 1760000000000,     // epoch ms when this blob was written
  "lastSeen": 1760000000000,    // epoch ms of last active tick (offline anchor)
  "playMs": 86400000,           // monotonic active-play milliseconds (cheat sentinel)
  "saveCount": 1287,            // number of successful writes (rotation/debug)

  // ── FORTUNE ENGINE (the Mill) ─────────────────────────────
  "engine": {
    "star": "8.42,21",          // FORTUNE ★ as break_infinity string = 8.42e21
    "engineMult": 3.5,          // global mint multiplier from Engine upgrades
    "slots": [                  // 8 slots; index → assigned stage id or null
      0, 1, 2, 3, 4, 5, null, null
    ],
    "fortuneWeight": [          // ★ weight per stage (mint formula input)
      1.0, 1.1, 1.2, 1.4, 1.6, 2.0, 2.5, 3.0
    ],
    "globalTree": { "g_mint1": 5, "g_offline2": 3 } // node id → level
  },

  // ── STAGES (idle economies, order per SPEC) ───────────────
  "stages": [
    {
      "id": 0, "name": "VILLAGE",
      "unlocked": true,
      "primary": "1.2,9",       // Coins (¢)
      "secondary": 4820.0,      // Wood
      "prestige": 12,           // Renown (local-prestige currency)
      "lifetimePrimary": "9.9,11", // for sqrt prestige gain formula
      "gens": [                 // signature generator = Cottage/Townsfolk
        { "k": "cottage",  "n": 142, "boughtTier": 100 }, // n owned, last milestone
        { "k": "townsfolk","n": 57,  "boughtTier": 50  }
      ],
      "upgrades": [1,2,3,7,11], // purchased upgrade ids (sparse array)
      "milestoneMult": 8        // active x7..x10 tier mult at current counts
    }
    // … indices 1-7: FARM, MINE, FACTORY, MAGIC REALM, SPACE, TIME, MULTIVERSE
    // each: primary=Grain/Ore/Widgets/Mana/Stardust/Chronons/Shards
    //       secondary=Water/Gems/Power/Essence/Alloy/Paradox/Echoes
    //       prestige=Heritage/Depth/Patents/Insight/Telemetry/Epoch/Convergence
  ],

  // ── ASCENSION (per-stage, LP) ─────────────────────────────
  "ascension": [
    { "id": 0, "lp": 340, "boosts": { "coinMult": 4, "woodMult": 2 } }
    // one entry per unlocked stage; lp = Legacy Points, boosts = permanent local
  ],

  // ── TRANSCENDENCE (global, Æ) ─────────────────────────────
  "transcendence": {
    "aether": "2.10,4",         // AETHER Æ = 2.1e4
    "count": 7,                 // number of transcendences performed
    "globalTree": { "t_allmult": 9, "t_ascgain": 4 } // node id → level
  },

  // ── REALITY RESET (Ω, top layer) ──────────────────────────
  "reality": {
    "omega": 3,                 // OMEGA CORES Ω
    "ngPlus": { "hardMode": true, "x2sink": false }, // NG+ modifiers
    "permaQoL": ["autobuy_all","offline_24h","bulk_max"] // survives all resets
  },

  // ── META (survives Ω) ─────────────────────────────────────
  "meta": {
    "starlight": 41,            // RARE currency from rare events/bosses
    "achievements": [1,2,5,8,13,21,34], // unlocked achievement ids
    "collections": { "spriteSet": 0.62 }, // 62% complete
    "lifetime": {               // never-reset stat ledger (achievement source)
      "totalStarMinted": "1.5,23",
      "totalPrestiges": 188,
      "totalTranscends": 7
    }
  },

  // ── CROSS-STAGE LINKS (interdependence) ───────────────────
  "links": {
    "labor":  { "from": 0, "toFarm": 0.6, "toMine": 0.4 }, // Townsfolk → Farm/Mine
    "grain":  { "boostMine": 1.3, "boostFactory": 1.25 },  // Grain → workers
    "alloyIn":{ "ore": 0.5, "power": 0.5 },                // Ore+Power → Space Alloy
    "enchant":{ "target": 3, "mult": 2.0, "expires": 1760003600000 }, // Mana buff
    "timeWarp":{ "target": 5, "ticks": 1200 },             // Chronons → time-warp
    "shardDup":{ "target": 4, "pct": 0.18 }                // Shards duplicate %
  },

  // ── EVENTS (seasonal) ─────────────────────────────────────
  "events": {
    "tokens": 250,              // seasonal TOKENS
    "activeId": "winter2026",
    "progress": { "boss_executor": 0.4 }
  },

  // ── SETTINGS ──────────────────────────────────────────────
  "settings": {
    "numberFormat": "scientific", // standard|scientific|engineering|logarithmic
    "offlineCapHours": 12,        // current cap (upgradable toward 24)
    "autosaveSec": 30,
    "cloudSync": true
  },

  // ── INTEGRITY ─────────────────────────────────────────────
  "checksum": "1a2b3c4d"        // FNV-1a hash; recomputed & compared on load
}
```

---

### Storage Strategy

```
WRITE PATH
 state ──serialize()──> canonical JSON string
        ──computeChecksum()──> attach .checksum
        ──JSON.stringify()──> raw (≈40-120 KB mid-game)
        ──lz-string.compressToUTF16()──> blob (≈8-25 KB, 60-80% smaller)
        ──┬─> IndexedDB  key="cogcosmos:slot:auto"   (primary, async)
          └─> localStorage key="cogcosmos:slot:auto" (fallback, sync mirror)

READ PATH
 IndexedDB.get() ──hit?──> decompress ──> JSON.parse ──> verifyChecksum
        │ miss/err
        └─> localStorage.get() ──> same pipeline
                │ both empty
                └─> NEW GAME (fresh root v4)
```

| Layer | Tool | Why | Limit |
|---|---|---|---|
| Primary store | IndexedDB via `idb-keyval` | Async (no main-thread block), ~1 GB practical, multi-slot | ~60% of disk |
| Fallback | `localStorage` | Synchronous mirror; survives IndexedDB eviction/private mode | 5-10 MB |
| Compression | `lz-string` `compressToUTF16` (local) / `compressToEncodedURIComponent` (export) | 60-80% size cut on repetitive JSON | — |
| Export string | `compressToBase64(JSON)` | Portable, paste-able backup/share | — |
| Cloud | Firebase Spark or Supabase free | Cross-device; optional | see cloud section |

**Compression choice:** use `compressToUTF16()` for IndexedDB/localStorage (most byte-efficient for in-browser key-value), and `compressToBase64()` for the export/import textbox so the string is copy-paste safe. A 90 KB raw save typically compresses to ~14 KB (≈84% reduction) given the repetitive `{"k":…,"n":…}` generator rows.

**Export / Import format:**

```
EXPORT:  base64( lzstring.compressToBase64( JSON.stringify(rootWithChecksum) ) )
         prefixed with magic tag "CGC4:" → e.g. "CGC4:N4Igdghg..."
IMPORT:  strip "CGC4:" → decompress → parse → verifyChecksum
         → if checksum fail: prompt "Save may be corrupt/edited. Import anyway?"
         → run migration chain to CURRENT_VERSION
```

---

### Migration / Versioning Strategy

Migrations are an ordered chain of pure functions `vN → vN+1`. On load, run every step whose source version ≤ the save's version, then stamp `CURRENT_VERSION`. Each function is idempotent on already-correct shapes and only touches fields it owns.

```js
const MIGRATIONS = {
  1: (s) => { // v1→v2: split monolithic "currencies" into per-stage primary/secondary
    s.stages = s.stages.map(st => ({ ...st, secondary: st.secondary ?? 0 }));
    return s;
  },
  2: (s) => { // v2→v3: introduce Fortune Engine slots + fortuneWeight
    s.engine = s.engine ?? { star: "0,0", engineMult: 1, slots: Array(8).fill(null),
      fortuneWeight: [1,1.1,1.2,1.4,1.6,2,2.5,3], globalTree: {} };
    return s;
  },
  3: (s) => { // v3→v4: add reality.permaQoL + links.shardDup; rename "soul"→"aether"
    s.transcendence.aether = s.transcendence.aether ?? s.transcendence.soul ?? "0,0";
    delete s.transcendence.soul;
    s.reality = s.reality ?? { omega: 0, ngPlus:{}, permaQoL: [] };
    s.links   = { ...defaultLinks(), ...(s.links ?? {}) };
    return s;
  }
};

function migrate(save) {
  let s = structuredClone(save);
  while (s.version < CURRENT_VERSION) {
    s = MIGRATIONS[s.version](s);
    s.version += 1;
  }
  s.schemaHash = computeSchemaHash(s); // refresh after shape change
  return s;
}
```

| Rule | Detail |
|---|---|
| Forward-only | Never auto-downgrade. A save with `version > CURRENT_VERSION` (user on newer build) loads read-only and warns. |
| Additive default | New fields get defaults via `?? default`; never assume presence. |
| Rename via copy-then-delete | `aether = aether ?? soul; delete soul` keeps old saves loadable. |
| Schema-hash guard | `schemaHash` mismatch with no version bump → log a non-fatal "unexpected shape" warning (detects hand-edits/partial corruption). |
| Backup before migrate | Pre-migration blob copied to `slot:premigrate` so a failed migration is recoverable. |

---

### Autosave Cadence & Backup Rotation

```
AUTOSAVE TRIGGERS
  • every settings.autosaveSec (default 30 s)            → slot:auto
  • on prestige / ascension / transcendence / reality   → slot:auto + event backup
  • on visibilitychange=hidden / beforeunload            → synchronous localStorage flush
  • manual "Save" button                                 → slot:auto

ROTATION (ring buffer of 3 timed backups + named slots)
  slot:auto          ← live, overwritten each autosave
  slot:backup:0..2   ← rotated every 5 min: i = floor(now/300000) % 3
  slot:premigrate    ← snapshot taken once, just before any migration
  slot:manual:1..3   ← user-named export-to-slot saves
```

| Slot | Cadence | Purpose |
|---|---|---|
| `slot:auto` | 30 s + key events | Live save loaded on boot |
| `slot:backup:0/1/2` | 5 min ring | Recover from a corrupt `auto` write |
| `slot:premigrate` | once per migration | Rollback a bad schema upgrade |
| `slot:manual:n` | user action | Intentional checkpoints |

The 30 s cadence + `beforeunload` flush bounds worst-case loss to one autosave interval. The synchronous `localStorage` write on `visibilitychange=hidden` covers mobile tab-kill where async IndexedDB writes may not finish.

---

### Free Cloud-Sync Flow & Conflict Handling

Cloud sync is **optional and additive** — the game is fully playable offline. Recommended: **Firebase Spark** (no project pausing, 50K reads/day, generous for read-heavy idle play) or **Supabase free** (better SQL/auth, but pauses after 1 week idle).

```
┌──────────┐    push (debounced 60 s, or on major reset)    ┌───────────────┐
│  CLIENT  │ ─────────────────────────────────────────────> │  CLOUD ROW    │
│ slot:auto│                                                 │ {uid, blob,   │
│          │ <───────────── pull (on login / device switch)─ │  ver, playMs, │
└──────────┘                                                 │  savedAt}     │
```

Cloud row schema (Supabase Postgres / Firestore doc):

```sql
saves( uid TEXT PRIMARY KEY,
       blob TEXT,          -- lz-string compressToBase64 payload
       version INT,
       play_ms BIGINT,     -- authoritative progress proxy for conflict resolution
       saved_at BIGINT,    -- epoch ms
       checksum TEXT,
       updated_at TIMESTAMPTZ DEFAULT now() );
```

**Conflict resolution — `playMs`-dominant, then `savedAt`:** wall-clock `savedAt` can be wrong (clock skew, timezone). Monotonic `playMs` (active-play time) is the true "more progress" signal.

```
on pull, compare LOCAL vs CLOUD:
  Δplay = |local.playMs - cloud.playMs|
  if Δplay <= 60_000 (within one push window):
        winner = max(savedAt)              // effectively same session, take newest
  else:
        winner = max(playMs)               // more real play wins
  if winner == loser within 5%:            // ambiguous / true divergence
        SHOW MERGE DIALOG:
          "Cloud: 24h12m played, ★8.4e21  |  Local: 23h50m, ★8.1e21"
          [Keep Cloud] [Keep Local] [Keep Both → export loser to slot:manual]
```

Conflict policy table:

| Condition | Resolution |
|---|---|
| Local `playMs` > Cloud by >60 s | Keep Local, push up |
| Cloud `playMs` > Local by >60 s | Keep Cloud, overwrite local |
| Within 60 s, differing `savedAt` | Newest `savedAt` wins (same session resume) |
| Within 5% but both advanced (true fork) | Prompt user; never silently discard — losing side archived to `slot:manual` |
| Cloud checksum invalid | Reject cloud, keep local, re-push |

---

### Anti-Cheat / Anti-Tamper

This is a single-player idle game with no PvP — defense is **layered deterrence**, not unbreakable DRM. The goal: stop casual save-editing and protect leaderboard/meta integrity without a mandatory backend.

**FNV-1a checksum (fast, 32-bit, no deps):**

```js
function fnv1a(str) {                 // canonical: stringify body WITHOUT .checksum
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24))) >>> 0; // *16777619 mod 2^32
  }
  return h.toString(16);
}
// Salt with a build-time secret so the formula isn't trivially reproducible:
checksum = fnv1a(SALT + canonicalSerialize(bodyWithoutChecksum));
```

On load: recompute and compare. Mismatch → flag `save.tampered = true`, still load (don't brick the player), but **gate online leaderboards/cloud-meta** for that save and show a soft "integrity warning."

**Tamper-detection layers (cheap → strong):**

| Layer | What it catches | Cost |
|---|---|---|
| FNV-1a checksum + salt | Naïve JSON edits in the export string | trivial |
| `schemaHash` guard | Added/removed fields, structural injection | trivial |
| Sanity invariants | Impossible states (see below) | trivial |
| `playMs` vs `savedAt` plausibility | Time-travel / offline farming | low |
| lz-string + base64 wrapper | Raises the "I can just open the JSON" bar | trivial |
| Optional server-authoritative meta | ★/Æ/Ω leaderboard integrity | medium (free tier) |

**Sanity invariants checked on load (reject or clamp):**

```
star (★)        derivable only from log10(surplus)*weight*engineMult — cap to
                a ceiling implied by playMs (max mint rate × playMs).
ascension.lp    floor(k*(lifetimePrimary/softcap)^0.5) must dominate sum(lp gained).
transcendence.count <= number of times aether-threshold was reachable.
gens[].n        >= 0, integer; cost growth cost_n = base*r^n must be affordable
                given lifetimePrimary (no free generators).
offlineCapHours <= 24 (SPEC hard ceiling).
```

A value failing an invariant clamps to its provable maximum and sets `tampered=true` rather than crashing.

**Server-authoritative meta (optional, for leaderboards only):** the client may edit local play freely, but ★/Æ/Ω submitted to a leaderboard are re-validated server-side against `playMs` and a max-theoretical-rate model. Firebase Cloud Function / Supabase Edge Function recomputes the ceiling:

```
maxStar(playMs) = MAX_MINT_RATE * (playMs/1000)   // MAX_MINT_RATE from engine caps
if submitted.star > maxStar * 1.05:  reject submission (flag, don't ban)
```

**Obfuscation trade-off (explicit):** minified + lz-string + base64 + salted checksum stops ~95% of casual editors at near-zero cost. Full client-side encryption (e.g., AES via Web Crypto) is **not recommended** — the key must ship in the bundle, so a determined user extracts it anyway; it only adds load-time cost and makes legitimate bug-recovery/import harder. Accept that a single-player save is ultimately client-owned; protect only the *shared* surface (leaderboards/meta) server-side.

---

### Offline-Timestamp Handling

```
ON LOAD:
  now      = Date.now()
  elapsed  = now - save.lastSeen            // ms since last active tick
  if elapsed < 0:                           // clock moved backwards
        elapsed = 0; flag clockAnomaly      // do NOT grant negative/huge gains
  capMs    = settings.offlineCapHours * 3600_000   // ≤ 24h per SPEC
  eff_ms   = min(elapsed, capMs)

OFFLINE EFFICIENCY CURVE (per SPEC: 100% ≤2h, then 25-50%):
  window1 = min(eff_ms, 2h)                 // 100% rate
  window2 = max(0, eff_ms - 2h)             // decayed rate
  decay   = 0.50 - 0.25 * (window2 / (capMs - 2h))   // 50% → 25% linearly to cap
  effectiveSeconds = (window1 + window2 * clamp(decay,0.25,0.50)) / 1000

PER-STAGE OFFLINE GAIN:
  gained_i = production_i_per_sec * effectiveSeconds   // snapshot rate at logout
  // applied ONCE, not tick-by-tick; feeds "while you were away" summary
```

| Anti-abuse rule | Behavior |
|---|---|
| Negative `elapsed` (clock rollback) | Treat as 0; set `clockAnomaly`; no offline grant |
| `elapsed` absurdly large (> 1 year) | Clamp to `capMs`; flag for soft review |
| Cloud `playMs` < local `playMs` after pull | Trust higher `playMs`; suspicious decrease flagged |
| `lastSeen` in the future | Reset to `now`; flag |

**Worked example:** logout rate = 5.0e6 ★-surplus/s on a stage; player away 9h, cap = 12h.
`eff_ms = 9h`. `window1 = 2h (100%)`. `window2 = 7h`; `decay = 0.50 − 0.25·(7h/10h) = 0.325`.
`effectiveSeconds = 7200 + 25200·0.325 = 7200 + 8190 = 15,390 s` (vs 32,400 s real → 47.5% overall). Summary shows the stage's gain over 15,390 effective seconds.

---

### Corruption Recovery

```
LOAD STATE MACHINE
   ┌────────────┐  ok   ┌──────────┐  ok   ┌──────────────┐
   │ slot:auto  ├──────>│ decompress├──────>│ checksum +   ├──► PLAY
   └─────┬──────┘       └────┬─────┘        │ migrate ok?  │
         │ throw/empty       │ throw        └──────┬───────┘
         ▼                   ▼                     │ fail
   ┌────────────┐      ┌────────────┐              ▼
   │ localStorage│─────>│ same pipe  │      ┌──────────────┐
   │  mirror     │ fail └────────────┘      │ try backup:0 │
   └─────┬──────┘                           │ →1 →2 (newest│
         │ all fail                         │ valid wins)  │
         ▼                                  └──────┬───────┘
   ┌──────────────────────────────────┐           │ all fail
   │ slot:backup ring → premigrate     │<──────────┘
   └─────┬─────────────────────────────┘
         │ all fail
         ▼
   ┌──────────────────────────────────┐
   │ FRESH NEW GAME (v4) + notify user │
   │ "Save unreadable; backups tried." │
   └──────────────────────────────────┘
```

| Failure | Recovery |
|---|---|
| Decompress throws | Fall through to localStorage mirror, then backup ring |
| JSON parse throws | Same fall-through; never partial-load a malformed blob |
| Checksum mismatch | Load with `tampered=true`, gate online meta, keep playing |
| Migration throws | Restore `slot:premigrate`, retry once, else fall to backups |
| All slots invalid | Fresh new game; preserve broken blobs under `slot:corrupt:<ts>` for manual export/support |
| Quota exceeded on write | Drop oldest `backup:n`, retry; if still failing, downgrade to localStorage-only and warn |

Recovery always prefers the **newest blob that passes checksum + migrates cleanly**, across all slots, before ever starting a fresh game — and never silently destroys an unreadable save (archived under `slot:corrupt:<ts>` for support import).

---

## Balancing & Formula Reference

> ⚠️ **SUPERSEDED — original design target, not the shipped numbers.** The live balance was reworked in the
> **v5 rebalance** (see `RESET_BELOW_VERSION` in `SaveManager.ts`) and is now defined by code, not this section.
> **Source of truth: [`src/systems/formulas.ts`](./src/systems/formulas.ts) (the `BALANCE` block + the pure
> formulas) and each stage's def in [`src/data/stages/`](./src/data/stages/).** This section is kept for design
> rationale; where it disagrees with the code, **the code wins.** Key deltas the rebalance introduced:
>
> - **Milestone multiplier:** flat **×2** for every stage at counts {10, 25, 50, 100, 250, 500, 1000, 2500} —
>   *not* the ×7 (stages 1–4) / ×10 (5–8) scheme below. There is no per-stage `stepMult`.
> - **Cost growth:** authored per-generator `r` **plus a global `costGrowthBump = +0.04`** applied at runtime
>   (`effGrowth`); the r-table and worked examples below omit that bump.
> - **Prestige:** **sqrt for all stages** (`floor(k·√(life/Csoft))`). The "log variant for late stages" (#7) was
>   never implemented.
> - **Ascension (LP):** exponent **0.33**, k = 5 (`ascensionGain`) — not the 0.40 quoted in sheet #11.
> - **Cross-stage bindings:** Farm ← Village Labor `1 + √(laborOutput)`; Mine/Factory ← Grain `1 + 0.5·log10(1+Grain)`
>   — not the `0.10·log10` / `0.08·log10` forms in #8.
> - **Per-stage k / Csoft / fortuneWeight:** see the corrected tables below (every cell changed).

This section captures the *original* numerical design for COG & COSMOS — The Fortune Engine. The shipped game draws its math from `src/systems/formulas.ts` and the per-stage defs (see the banner above); the formulas here document the design intent and the shape of each curve. Numbers use **`break_eternity.js`** (`Decimal`) throughout — chosen over `break_infinity.js` so values can exceed `~1e308` into the deep late game.

### Notation & Symbols

| Symbol | Meaning | Symbol | Meaning |
|---|---|---|---|
| `n` | count owned of a generator | `★` | FORTUNE (universal mint currency) |
| `base` | first-unit cost of a generator | `LP` | LEGACY POINTS (per-stage Ascension) |
| `r` | cost growth ratio (1.07–1.15) | `Æ` | AETHER (Transcendence) |
| `baseRate` | per-unit base output | `Ω` | OMEGA CORES (Reality Reset) |
| `tierMult` | milestone multiplier (shipped: flat ×2) | `C` | soft-cap threshold |
| `globalMult` | product of all active multipliers | `k` | prestige coefficient |
| `surplus` | stage output siphoned by the Mill | `Δt` | elapsed seconds (offline) |

---

### Master Formula Sheet

```text
================================================================
 COG & COSMOS — MASTER FORMULA SHEET  (all stages, all layers)
================================================================

----[ 1. GENERATOR COST GROWTH ]--------------------------------
  cost(n)      = base * r^n
  r            = 1.07 + 0.0114 * (stageIndex - 1)      // 1.07 (Village) -> 1.15 (Multiverse)
                 stageIndex in [1..8]; r table below.

  Bulk buy (closed form, buy k starting from n owned):
  costBulk(n,k)= base * r^n * (r^k - 1) / (r - 1)

  Max affordable k for currency c:
  kMax(n,c)    = floor( log( c*(r-1)/(base*r^n) + 1 ) / log(r) )

----[ 2. PRODUCTION ]-------------------------------------------
  unitOut      = baseRate * tierMult(n) * globalMult
  genOutput    = n * unitOut
  stageOutput  = SUM_over_generators( genOutput )

  globalMult   = renownMult * fortuneTreeMult * manaEnchant
                 * shardDup * timeWarp * eventMult * Ω_QoLmult
                 (all multiplicative; defaults = 1.0)

----[ 3. MILESTONE / TIER MULTIPLIERS ]-------------------------
  Milestone counts: M = {10, 25, 50, 100, 200, 500, 1000, ...}
  Each crossed milestone multiplies that generator's output.
  Early stages use x7 steps; late stages x10.

  tierMult(n)  = PRODUCT over m in M where n >= m of stepMult(stage)
  stepMult     = 7  (stages 1-4)   |   10  (stages 5-8)

  // Equivalent closed form:
  tierMult(n)  = stepMult ^ ( count of milestones <= n )

----[ 4. SOFT CAP (post-threshold compression) ]---------------
  eff(x, C)    = x                              if x <= C
               = C * (1 + (x - C)/C)^0.5        if x >  C   // SPEC sqrt cap

  Multi-stage cascade (Synergism / IMR pattern), applied in order:
  eff1 = sqrtCap(x,  C1)         // knee 1
  eff2 = sqrtCap(eff1, C2)       // knee 2 (C2 > C1)
  eff3 = C3 + log10(eff2 - C3 + 1)   // log knee for extreme tails

----[ 5. DIMINISHING RETURNS (generic) ]-----------------------
  // Asymptotic reward (challenge rewards, link bonuses):
  dr(x, max, k)= max * (1 - e^(-k * x))
  // Power compression (stat stacking):
  pc(x, p)     = x^p              with p in (0,1], default 0.75

----[ 6. STAGE PRESTIGE GAIN (square-root) ]-------------------
  // SPEC: gain = floor( k * (lifetimePrimary / softcap)^0.5 )
  prestigeGain = floor( kStage * sqrt( lifetimePrimary / Csoft ) )
  // 4x lifetime  -> 2x gain (lenient sqrt loop)
  kStage table & Csoft table below.

----[ 7. PRESTIGE GAIN (log variant, late stages) ]------------
  // Used where lifetimePrimary routinely exceeds 1e15:
  prestigeGainLog = floor( kStage * 5 * log10(1 + lifetimePrimary/Csoft) )
  // logarithmic compression keeps late-stage runs bounded.

----[ 8. CURRENCY EXCHANGE / CROSS-STAGE BINDING ]-------------
  // Each cross-link converts donor output into a recipient multiplier.
  labor      (Village->Farm,Mine):  mult = 1 + 0.10 * log10(1+Townsfolk)
  grainFeed  (Farm->Mine,Factory):  mult = 1 + 0.08 * log10(1+Grain)
  alloyInput (Mine+Factory->Space): AlloyRate = 0.5*sqrt(Ore * Power_kW)
  manaEnchant(Magic->any gen):      mult = 1 + 0.15 * log10(1+Mana)   // temp, decays
  timeWarp   (Time->any stage):     ticks = floor(Chronons / costPerTick)
                                     burst = ticks * stageOutput * 0.5
  shardDup   (Multiverse->any):     mult = 1 + 0.01 * Shards_assigned   // % duplication

----[ 9. FORTUNE MINT (the Mill) ]----------------------------
  // SPEC: dStar/dt = SUM_stages( log10(1+surplus) * fortuneWeight * engineMult )
  surplus_s    = max(0, stageOutput_s - stageConsumption_s)
  dStarPerSec  = SUM_over_slotted_stages(
                   log10(1 + surplus_s) * fortuneWeight_s * engineMult )
  engineMult   = engineLevel_bonus * Ω_QoLmult * aetherMillBonus
  fortuneWeight table below (Village low -> Multiverse high).

----[ 10. OFFLINE GAINS ]--------------------------------------
  // Piecewise efficiency; window cap raised by Engine/Æ upgrades.
  W            = 2h base window (7200s), -> up to 24h via upgrades
  eff(Δt)      = 1.00 * min(Δt, W)                       // full rate
               + 0.50 * clamp(Δt - W, 0, W)              // 50% next window
               + 0.25 * max(0, Δt - 2W)                  // 25% tail
  offlineGain  = rateAtLogout * eff(Δt)
  // Time-warp tickets (Chronons) can convert tail-time to full rate.

----[ 11. ASCENSION (per-stage, LP) ]-------------------------
  LP_gain      = floor( kAsc * (lifetimePrimary / C_asc)^0.40 )
  // exponent 0.40 < 0.5: harsher than prestige, slower loop (Egg-Inc style)
  LP_boost     = 1 + 0.02 * totalLP_stage      // +2% local output per LP

----[ 12. TRANSCENDENCE (global, Æ) ]-------------------------
  // resets ALL stages + Fortune; keeps meta. Log-compressed (Clicker Heroes AS).
  Aether_gain  = floor( 5 * log10( 1 + totalFortuneEverMinted / 1e6 ) )
  aetherMillBonus = 1 + 0.05 * totalAether     // +5% Fortune mint per Æ

----[ 13. REALITY RESET (Ω, top layer) ]----------------------
  // resets everything incl. Æ. Cube-root for brutal, deliberate pacing.
  Omega_gain   = floor( ( totalAetherEverEarned / 1e3 )^(1/3) )
  Ω_QoLmult    = 1 + 0.10 * totalOmega         // +10% global & mint per Ω
  // Ω also unlocks New-Game+ modifiers (permanent, survive all resets).
================================================================
```

---

### Per-Stage Constant Tables

These tables instantiate the symbolic constants above for each of the eight SPEC stages.

#### Cost growth `r`, milestone step, and prestige coefficients

> **Shipped values (post-v5-rebalance).** `stepMult` is now a flat **×2** for all stages (no per-stage step);
> `r` shown is the *design-intent* anchor — the live game adds `+0.04` (`costGrowthBump`) to each generator's
> authored `r`. `kStage` and `Csoft` below are the **actual** values from `src/data/stages/`.

| # | Stage | Primary | `r` (intent) | `stepMult` | `kStage` (shipped) | `Csoft` (shipped) | Prestige currency |
|---|---|---|---|---|---|---|---|
| 1 | VILLAGE | Coins (¢) | 1.070 | ×2 | 1 | 1e6 | Renown |
| 2 | FARM | Grain | 1.081 | ×2 | 1 | 1e7 | Heritage |
| 3 | MINE | Ore | 1.093 | ×2 | 1 | 1e8 | Depth |
| 4 | FACTORY | Widgets | 1.104 | ×2 | 1 | 1e9 | Patents |
| 5 | MAGIC REALM | Mana | 1.115 | ×2 | 12 | 1e6 | Insight |
| 6 | SPACE | Stardust | 1.127 | ×2 | 8 | 5e7 | Telemetry |
| 7 | TIME | Chronons | 1.138 | ×2 | 6 | 1e7 | Epoch |
| 8 | MULTIVERSE | Shards | 1.150 | ×2 | 4 | 1e11 | Convergence |

> The design intent was `r = 1.07 + 0.0114*(stageIndex-1)` with a sqrt→log prestige split; **the shipped game uses sqrt prestige for every stage** (`prestigeGain`, `floor(k·√(life/Csoft))`) — the log variant (#7) was never built. `kStage`/`Csoft` were hand-tuned in the rebalance and no longer follow a smooth curve.

#### Fortune mint weights (the Mill's slot economy)

| # | Stage | `fortuneWeight_s` (shipped) | Rationale |
|---|---|---|---|
| 1 | VILLAGE | 1.0 | earliest, abundant surplus -> lowest ★/unit |
| 2 | FARM | 1.2 | feeds workers; moderate |
| 3 | MINE | 1.4 | raw materials, scarcer |
| 4 | FACTORY | 1.6 | refined widgets |
| 5 | MAGIC REALM | 1.75 | arcane surplus is rarer |
| 6 | SPACE | 2.00 | requires Alloy chain input |
| 7 | TIME | 2.25 | Chronon surplus is precious |
| 8 | MULTIVERSE | 3.0 | apex weight; Shards mint the most ★ |

> Because the mint takes `log10(1+surplus)`, doubling a stage's surplus adds only a fixed `log10(2)≈0.301` to its term — weights, not raw surplus, are the dominant lever. This is the **anti-inflation core**: no single stage can flood ★ by brute-forcing one currency.

---

### Growth-Pacing Table (time-to-reach targets)

Targets assume desktop play with a check-in every 30 min–2 h, offline filling between sessions. "First reach" = first-time unlock for an engaged new player; pacing compresses 3–10x on subsequent prestige/ascension loops via multipliers (natural catch-up).

| Milestone | Layer | Target time-to-first-reach | Loop compression after |
|---|---|---|---|
| Unlock FARM | Stage 2 | 20–30 min | — |
| Unlock MINE | Stage 3 | 60–90 min | — |
| First Stage Prestige (Village) | Prestige | 45–60 min | 4–8x faster |
| Unlock FACTORY | Stage 4 | 3–4 h | — |
| First Fortune (★) minted | Mill online | 2–3 h | — |
| Unlock MAGIC REALM | Stage 5 | 8–12 h | — |
| First Ascension (any stage, LP) | Ascension | 1–2 days | 3–6x faster |
| Unlock SPACE | Stage 6 | 2–3 days | — |
| Unlock TIME | Stage 7 | 5–7 days | — |
| First Transcendence (Æ) | Transcendence | 10–14 days | 3–5x faster |
| Unlock MULTIVERSE | Stage 8 | 3–4 weeks | — |
| First Reality Reset (Ω) | Reality | 6–10 weeks | 2–4x faster |

> Anchor rule (from retention research): **first Stage Prestige inside 60 min** — it is a stronger LTV predictor than D7 retention. Each higher layer's first-clear is gated to land when a *new mechanic class* (links, slots, glyph-like Insight, Ω New-Game+) is ready to be revealed, never on a pure time gate.

---

### Exponential vs. Polynomial Regime Guidance

```text
          REGIME MAP  (which scaling law to use where)
 ┌──────────────────────────────────────────────────────────┐
 │ GENERATOR COSTS ........ exponential  base*r^n  (r=1.07-1.15)
 │ GENERATOR COUNT EFFECT . linear/milestone  n * stepMult^tiers
 │ CROSS-STAGE LINKS ...... logarithmic  1 + a*log10(1+x)   (anti-snowball)
 │ PRESTIGE (all stages) .. sqrt   k*sqrt(life/Csoft)   (shipped: sqrt everywhere; #7 log unused)
 │ ASCENSION (LP) ......... power  k*(life/C)^0.33   (harsher; shipped k=5, exponent 0.33)
 │ TRANSCENDENCE (Æ) ...... log    5*log10(1+F/1e6)
 │ REALITY (Ω) ............ cbrt   (A/1e3)^(1/3)   (brutal)
 │ SOFT CAPS .............. sqrt -> log cascade
 │ ENDGAME DISPLAY ........ log-log  ee{x} compression
 └──────────────────────────────────────────────────────────┘
```

| Use exponential when… | Use polynomial/log when… |
|---|---|
| You want a **wall** that forces a buy decision or prestige (costs). | You want a **reward** that must never outrun costs (prestige, links, mint). |
| The quantity is *spent* and re-earned each loop. | The quantity is a *permanent multiplier* (LP, Æ, Ω). |
| Growth rate 1.07–1.15 keeps walls smooth, not brutal. | Exponents 0.33 (cbrt) → 0.5 (sqrt) tune loop tightness. |

**Rule:** costs grow faster than rewards by construction. If reward formula ever has a higher asymptotic order than the matching cost formula, the economy inflates — see guardrails below.

---

### Layer Reset Payoff Ratios

```text
   PROGRESSION STACK & RESET PROPAGATION (Prestige-Tree style)
   low ───────────────────────────────────────────► high

   [Idle] ─prestige─► [Stage Prestige] ─ascend─► [Ascension/LP]
                                                      │
                                                      ▼
   [Reality/Ω] ◄─reset─ [Transcendence/Æ] ◄──────────┘

   doReset(layer) cascades DOWNWARD: a higher reset wipes all lower layers.
   Æ reset wipes Stages + Fortune + LP.   Ω reset wipes Æ too.
```

| Layer | Resets | Keeps | Reward formula | Payoff ratio (to double reward) | 1st clear target |
|---|---|---|---|---|---|
| Stage Prestige | one stage's generators/currency | Fortune, LP, Æ, Ω, achievements | `k*sqrt(life/Csoft)` | **4x** lifetime | 45–60 min |
| Ascension (LP) | one stage's local progress | Fortune, other stages, Æ, Ω | `k*(life/C)^0.40` | **~5.6x** lifetime | 1–2 days |
| Transcendence (Æ) | ALL stages + Fortune | Æ, Ω, achievements, collections | `5*log10(1+F/1e6)` | **10x** total ★ | 10–14 days |
| Reality (Ω) | everything incl. Æ | Ω, NG+ mods, permanent QoL, meta | `(A/1e3)^(1/3)` | **8x** total Æ | 6–10 weeks |

> **Catch-up is the reward, not a separate currency** (AD pattern): post-Transcendence, re-reaching Magic Realm takes minutes, not hours, because `aetherMillBonus` and `LP_boost` carry over via the Mill and meta trees. Each layer also restores QoL/automation milestones so re-grinding never feels punitive (Eternity-Milestone pattern).

---

### Endgame Scaling Techniques

| Technique | Formula / Rule | Where used in COG & COSMOS |
|---|---|---|
| **Log compression (display)** | below 1e6 standard; 1e6–1e308 `eXXX`; above use `ee{x}` (log-log) | Time/Multiverse currencies, total ★ minted |
| **Infinite dimensional tiers** | Dim N+1 produces Dim N; each x2 per 10 bought (AD pattern) | Multiverse "Mirror-Self" recursion; Time "Loop" stacking |
| **Hyperbolic challenge scaling** | goal `= G0 * base^(completions^p)`, p>1 super-exponential | Convergence challenges (Multiverse); Insight trials (Magic) |
| **Asymptotic challenge reward** | `reward = max*(1 - e^(-k*completions))` | repeatable cross-stage link mastery |
| **Infinite C15-style stat** | never-completable challenge; reached exponent IS a permanent stat | "Convergence Depth" — re-entered each Ω run to push the exponent |
| **Tetration ceiling** | swap to `break_eternity.js` (10^^1e308) when currencies pass e308 routinely | post-Reality Multiverse/Time endgame |
| **Big-number lib tiering** | <1e15 native; 1e15–1e308 `break_infinity.js`; >1e308 `break_eternity.js` | global engine policy |

---

### Anti-Inflation Guardrails

```text
  GUARDRAIL CHECKLIST  (run before shipping any tuning change)
  -----------------------------------------------------------------
  [G1] cost order > reward order.  For every loop:
         d/dn cost(n)  must outgrow  d/dn reward(n)  asymptotically.
  [G2] All cross-stage links are LOG-damped: 1 + a*log10(1+x).
         => doubling donor adds only a*0.301 to the multiplier.
  [G3] Fortune mint is log10(surplus). No raw-surplus term anywhere
         in dStar/dt. Weights are the only linear lever, and are
         hard-capped per stage (table above).
  [G4] Multiplier stack is bounded: any single source caps its own
         contribution via a soft cap before entering globalMult.
  [G5] Prestige softcap Csoft scales with stage so a fresh prestige
         always costs ~10-15 min of progress (never trivial, never a wall).
  [G6] Offline can NEVER exceed active: tail efficiency 25%, hard
         window cap 24h. Time-warp tickets are SPENT (finite), not passive.
  [G7] Milestone stepMult is fixed (x7 / x10). Never let a milestone
         multiply a milestone (no compounding tier-of-tiers).
  [G8] Meta multipliers (LP/Æ/Ω) are ADDITIVE in their own term
         (1 + c*count), multiplicative only across distinct layers.
  -----------------------------------------------------------------
```

**Inflation smell-test (quick sim):** plot `log10(stageOutput)` vs. time. A healthy curve is roughly linear in log-space (steady exponential real-growth). A curve that bends *upward* in log-space signals a compounding multiplier leak — almost always a violated G2 or G7.

---

### Tuning Methodology (spreadsheet-driven)

```text
  TUNING PIPELINE
  ┌────────────┐   ┌─────────────┐   ┌──────────────┐   ┌──────────┐
  │ 1. SHEET   │──►│ 2. SOLVE for │──►│ 3. SIM ticks │──►│ 4. TUNE  │
  │ constants  │   │ time-to-goal │   │ (JS/Sheets)  │   │ & repeat │
  └────────────┘   └─────────────┘   └──────────────┘   └──────────┘
```

1. **One row per generator** in Google Sheets: columns `base, r, baseRate, stepMult`, then computed `cost(n)`, `unitOut`, `genOutput` for `n = 0,10,25,50,100,200,500`.
2. **Solve time-to-goal analytically** where possible. With constant income `I`, time to afford the next unit at count `n`:
   `t(n) ≈ cost(n) / I = base*r^n / I`. Sum across the buy path to estimate minutes-to-milestone; match against the Growth-Pacing Table.
3. **Tick simulation** for cross-stage coupling (links break the closed form). Run a fixed-`dt` loop (e.g. `dt=0.25s`) over simulated hours; log `★/min`, time-to-each-unlock, and the log-space output curve.
4. **Tune two knobs only at a time** (`r` and `kStage`, or `fortuneWeight` and `Csoft`) to keep cause/effect legible. Re-run guardrails G1–G8 after every change. Export the sheet to JSON as the game's `balance.json` config so design data never lives in code.

**Closed-form helpers for the sheet:**

```text
  cost(n)            = base * r^n
  costBulk(n,k)      = base * r^n * (r^k - 1)/(r - 1)
  kMax(n,c)          = floor( log(c*(r-1)/(base*r^n) + 1) / log r )
  minutes_to_next(n) = (base * r^n / income) / 60
  tierMult(n)        = stepMult ^ (#milestones <= n)
```

---

### Worked Example — Village Cottages (0 / 10 / 25 / 50 / 100 / 200 buys)

Canonical Stage 1 generator (**Cottage / Townsfolk**). SPEC constants:
`base = 15 ¢`, `r = 1.070`, `baseRate = 0.10 Coins/s` per Cottage, `stepMult = x7`, `globalMult = 1.0` (fresh save, no links/Renown yet). Milestones at `{10,25,50,100,200}`.

| `n` (owned) | `tierMult` = 7^(milestones≤n) | cost of **next** unit `15·1.07ⁿ` | cumulative cost `costBulk(0,n)` | `unitOut` = `0.10·tierMult` (¢/s) | `genOutput` = `n·unitOut` (¢/s) |
|---:|---:|---:|---:|---:|---:|
| 0 | 7⁰ = 1 | 15.0 ¢ | 0 ¢ | 0.10 | 0.00 |
| 10 | 7¹ = 7 | 29.5 ¢ | 207 ¢ | 0.70 | 7.00 |
| 25 | 7² = 49 | 81.4 ¢ | 949 ¢ | 4.90 | 122.5 |
| 50 | 7³ = 343 | 442 ¢ | 6,033 ¢ | 34.3 | 1,715 |
| 100 | 7⁴ = 2,401 | 13,150 ¢ | 187,800 ¢ | 240.1 | 24,010 |
| 200 | 7⁵ = 16,807 | 1.15e7 ¢ | 1.64e8 ¢ | 1,680.7 | 336,140 |

**Reading the table.** Crossing each milestone multiplies `unitOut` by x7, so output leaps at exactly the counts where cost growth (`1.07ⁿ`) starts to bite — the classic incremental "buy toward the next milestone" pull. Between milestones, output grows only linearly with `n` while cost grows exponentially, which is what *creates* the prestige decision (G1 holds: cost order > reward order between milestones, with milestones as the punctuating reward).

**Cross-check vs. prestige.** At `n=200`, lifetime Coins are on the order of 1e8+. Renown gain (`kStage=10`, `Csoft=1e3`):
`prestigeGain = floor(10·sqrt(1e8 / 1e3)) = floor(10·sqrt(1e5)) = floor(10·316.2) = 3,162 Renown`.
With Renown granting a modest local multiplier, the post-prestige Village re-reaches `n=200` in a fraction of the time — confirming the 4x-lifetime-to-double-reward payoff ratio and the 45–60 min first-prestige anchor.

---

## Development Roadmap — Prototype to Release

### Guiding Constraints

| Constraint | Decision | Rationale |
|---|---|---|
| Team size | 1 dev (you) + occasional unpaid help | All durations are solo, part-time (~12–18 h/week) calendar estimates |
| Engine | **Svelte 5 + TypeScript + PixiJS** (UI-dominant hybrid) | 8 stages = heavy reactive HUD; runes auto-persist via `svelte-persisted-state`; PixiJS canvas only for sprites + parallax |
| Number lib | `break_infinity.js` (Phase 0–2) → `break_eternity.js` (Phase 3, when Transcendence pushes past 1e308) | Stage surplus + Fortune mint stay <1e308 until late prestige stacking |
| Art | Pixelorama (16×16 / 32×32 sprites) | Free, maintained, exports spritesheet JSON Pixi can consume |
| Audio | jsfxr + ChipTone (SFX), Bosca Ceoil (loops), Audacity (edit) | All browser/free |
| Save | localStorage + `lz-string` → IndexedDB (`idb-keyval`) when blob >1 MB; versioned root | Migration chain mandatory from Phase 1 onward |
| Cloud | Firebase Spark (no inactivity pause, generous read quota) | Optional, Phase 3 only |
| Host | itch.io (audience) + Cloudflare Pages (perf mirror) | Free, static HTML5 |

---

### Milestone Timeline (solo, part-time)

```
WEEK   0    2    4    6    8   10   12   14   16   18   20   22   24   26   28   30   32
       |----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
P0  ▓▓▓▓▓▓▓▓                                                       Prototype (loop+VILLAGE)
PROTO     └─◆ M0: tick+save+1 stage idle  (wk3)
P1        ▓▓▓▓▓▓▓▓▓▓▓                                              Vertical Slice
SLICE          └─◆ M1: VILLAGE+FARM+MINE, Stage Prestige, save v2  (wk8)
P2                  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                Alpha
ALPHA                        └─◆ M2: 8 stages + Fortune Engine     (wk14)
                                  └─◆ M3: Ascension(LP)+automation  (wk18)
P3                                   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓                 Beta
BETA                                       └─◆ M4: Transcendence(Æ)+Reality(Ω) (wk23)
                                              └─◆ M5: events+collections+cloud (wk26)
P4                                                  ▓▓▓▓▓▓▓▓▓▓     Polish & Launch
LAUNCH                                                   └─◆ M6: balance+juice (wk30)
                                                            └─◆ ★ LAUNCH (wk32)
POST                                                              ▓▓▓▶ seasonal + mobile wrapper
       |----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
LEGEND  ▓ active phase   ◆ milestone   ★ public release   ▶ ongoing
```

Total to launch: **~32 weeks** (~8 months) part-time. Full-time (35 h/week) compresses to **~13–15 weeks**.

---

### Phase 0 — Prototype  (Weeks 0–3)

**Goal:** Prove the core idle loop is *fun for 10 minutes* with ONE stage (VILLAGE). Throwaway-quality allowed; logic must be reusable.

#### Systems built
- Fixed-timestep tick engine (accumulator pattern, 10 Hz logic / 60 Hz render).
- One generator chain: VILLAGE → **Cottage / Townsfolk** producing **Coins (¢)** + **Wood**.
- Buy-1 / Buy-10 / Buy-Max with closed-form bulk cost.
- Number-pop juice (floating `+¢`), basic offline catch-up.

```ts
// Fixed timestep core (engine-agnostic; lives in vanilla TS logic layer)
const DT = 0.1;                 // 100 ms logic step
let acc = 0;
function frame(nowMs: number) {
  acc += (nowMs - last) / 1000; last = nowMs;
  while (acc >= DT) { tick(DT); acc -= DT; }   // deterministic, decoupled from FPS
  render();
}
```

```
// Canonical cost + bulk buy (used in EVERY stage, all phases)
cost(n)        = base * r^n                         // r = 1.07 (VILLAGE, early)
bulk(n,k)      = base * r^n * (r^k - 1) / (r - 1)   // cost to buy k starting at owned n
maxAffordable  = floor( log_r( cash*(r-1)/(base*r^n) + 1 ) )

// Production (canonical)
output = count * baseRate * tierMult * globalMult
// tierMult milestones: ×7..×10 at counts 10/25/50/100/200/500

// Offline (canonical): 100% to 2 h, then 25–50%
gained = rate * min(elapsed, 7200) + rate * 0.35 * max(0, elapsed - 7200)   // capped at base 2 h window
```

**Worked example (VILLAGE, r=1.07, base=15¢, baseRate=0.1¢/s):**
| Townsfolk owned | Next-unit cost | Output/s (no milestone) | Output/s (≥10 → ×7) |
|---|---|---|---|
| 0 | 15.00 | 0.0 | — |
| 9 | 27.57 | 0.9 | — |
| 10 | 29.50 | 1.0 | **7.0** |
| 25 | 81.39 | 2.5 | 17.5 (×7) |

| | |
|---|---|
| **Deliverables** | Playable single-page build; VILLAGE only; offline summary toast |
| **Duration** | 3 weeks |
| **Risks** | Tick/render coupling causing FPS-dependent economy → mitigate with fixed timestep above. Scope creep into stage 2 → forbid. |
| **Success metrics** | Loop runs 10 min unattended without stall; first 10 Townsfolk bought in <90 s; offline gain correct to ±1% vs live |

---

### Phase 1 — Vertical Slice  (Weeks 3–8)

**Goal:** Prove **interdependence + first prestige + durable save**. Three stages with a real cross-stage binding and the soft Stage-Prestige layer.

#### Systems built
- Stages **VILLAGE → FARM → MINE** (currencies: Coins/Wood, Grain/Water, Ore/Gems).
- First cross-stage binding made *visible*: **Village Townsfolk supply LABOR consumed by Farm & Mine** (labor shortage throttles their output).
- **Stage Prestige** (per-stage soft reset → local prestige currency: Renown / Heritage / Depth).
- Save system with schema versioning + migration chain + `lz-string` compression.
- Generic data-driven stage definition (so stages 4–8 are config, not new code).

```
// Stage Prestige gain (canonical sqrt prestige)
gain = floor( k * (lifetimePrimary / softcap)^0.5 )
// VILLAGE example: k=1, softcap=1e6 Coins → lifetime 4e6 ¢ ⇒ floor(1*2) = 2 Renown
//                  lifetime 1.6e7 ¢ ⇒ floor(4) = 4 Renown  (4× earnings ⇒ 2× gain)

// Soft cap beyond threshold C (canonical)
eff(x) = C * (1 + (x - C)/C)^0.5
// LABOR binding: Farm/Mine effective workers softcapped by Townsfolk supply
laborEff = min(demand, Townsfolk) , surplusBeyond = eff(demand) past C=Townsfolk
```

```
// Save root — versioned, migration chain mandatory from here on
{ "version": 2,
  "stages": { "village": {...}, "farm": {...}, "mine": {...} },
  "meta":   { "fortune": "0", "lastSeen": 1739000000 } }
// migrate(): if v<2 → addFarmMine(save); always stamp current version on write
```

| | |
|---|---|
| **Deliverables** | 3 interlinked stages; Stage Prestige UI; persistent save survives reload + browser restart; "while you were away" summary |
| **Systems** | Data-driven stage engine, LABOR binding, sqrt prestige, save v2 + migration, lz-string |
| **Duration** | 5 weeks |
| **Risks** | Save corruption (no migration) → versioned root + try/catch restore. Binding feels invisible → add explicit "Labor: 42/60" HUD bar + throttle indicator. break_infinity edge at prestige math. |
| **Success metrics** | First Stage Prestige reachable in 30–60 min (genre benchmark); 3 stages tick simultaneously; zero data loss across 20 reload cycles; cutting Townsfolk visibly drops Farm/Mine output within 1 tick |

---

### Phase 2 — Alpha  (Weeks 8–18)

**Goal:** Feature-complete *core*: all 8 stages, the **Fortune Engine**, **Ascension (LP)**, and **automation**. This is the largest phase.

#### Sub-milestone M2 (wk 8–14): all stages + Fortune Engine
- Stages 4–8 as config: **FACTORY** (Widgets/Power), **MAGIC REALM** (Mana/Essence), **SPACE** (Stardust/Alloy), **TIME** (Chronons/Paradox), **MULTIVERSE** (Shards/Echoes).
- Remaining canonical bindings wired: Grain→Mine/Factory workers; Ore+Power→Space Alloy; Mana enchant (temp ×); Chronons time-warp ticks; Shards duplicate %.
- **The Fortune Engine** with assignable **slots**: assign a stage → convert surplus → mint **FORTUNE (★)**.

```
// Fortune mint (canonical) — per second, summed over slotted stages
dStar/dt = Σ_stages [ log10(1 + stageSurplus) * fortuneWeight_stage * engineMult ]
// Example weights (early): VILLAGE .8  FARM 1.0  MINE 1.2  FACTORY 1.5
//                          MAGIC 2.0  SPACE 2.5  TIME 3.0  MULTIVERSE 4.0
// e.g. MINE surplus 1e6 Ore/s, weight 1.2, engineMult 1
//   → log10(1e6+1)*1.2*1 = 6*1.2 = 7.2 ★/s
```

#### Sub-milestone M3 (wk 14–18): Ascension + automation
- **Ascension** (per-stage hard reset of local progress → **LP**; permanent local boosts), sitting above Stage Prestige.
- Automation unlocked progressively (genre rule: gate behind prestige counts).

```
// Ascension LP (per stage) — harsher cbrt loop, gated above Stage Prestige
LP = floor( a * (lifetimePrestigeCurrency / Csc)^(1/3) )
// FARM: a=5, Csc=1e3 Heritage → 8e3 lifetime ⇒ floor(5*2)=10 LP (8× ⇒ 2×)

// Automation gating (Antimatter-Dimensions pattern)
ascensionsInStage >= 1  → auto-buy generators (best ¢/cost ratio per tick)
ascensionsInStage >= 3  → auto Stage-Prestige at configurable threshold
fortuneSpent  >= T1     → auto-assign Fortune Engine slots
```

| | |
|---|---|
| **Deliverables** | All 8 stages live + cross-bound; Fortune Engine minting ★; Ascension(LP) per stage; auto-buyers + auto-prestige; Stats page; save v3 |
| **Systems** | Generic stage config ×8, 7 bindings, Fortune slots/weights, LP ascension, smart-priority autobuyer, milestone-gated unlocks |
| **Duration** | 10 weeks |
| **Risks** | Balance explosion across 8 economies → build a spreadsheet/Decimal sim harness early. Big-number overflow in mint → keep surplus in Decimal. Cross-binding feedback loops causing runaway/NaN → clamp + soft caps. Autobuyer O(n) cost loop → use closed-form maxAffordable. |
| **Success metrics** | All 8 stages reachable in a single uninterrupted progression; first ★ minted <2 h in; first Ascension <90 min into a stage; autobuyer keeps economy within 5% of optimal manual play; no NaN/Infinity in 24 h soak test |

---

### Phase 3 — Beta  (Weeks 18–26)

**Goal:** Complete the **upper prestige stack** (Transcendence/Reality Reset), plus events, collections, QoL, and optional cloud sync. Feature-freeze at end.

#### M4 (wk 18–23): Transcendence + Reality Reset
- **Transcendence** (global reset of ALL stages + Fortune, keeps meta → **AETHER (Æ)**; fuels global/ascension meta trees).
- **Reality Reset** (top layer: resets everything incl. Æ → **OMEGA CORES (Ω)**; unlocks NG+ modifiers + permanent QoL).
- Switch to **`break_eternity.js`** here (stacked prestige multipliers routinely exceed 1e308).

```
// Transcendence (global, Æ) — log-compressed so re-transcending stays meaningful
Æ = floor( 5^( floor(log10(totalFortuneEver)) / 308 - 0.7 ) )    // AD-Eternity-style
// Reality Reset (Ω) — brutal, logarithmic (Clicker-Heroes-style compression)
Ω = floor( 5 * log10( totalAetherEver ) )
// e.g. 1e9 Æ lifetime → floor(5*9) = 45 Ω
```

#### M5 (wk 23–26): events, collections, QoL, cloud
- **TOKENS** (seasonal events) + **STARLIGHT** (rare events/bosses) currencies wired.
- Collections / achievements (each grants a small global ★ or production %, à la Cookie Clicker milk).
- QoL: number-format toggle (Standard/Scientific/Engineering/`eXXX`), save export/import (Base64), settings, offline-window upgrades toward ~24 h.
- Optional Firebase cloud save (authenticated, conflict = newest `lastSeen` wins).

| | |
|---|---|
| **Deliverables** | 5-layer prestige stack complete (Idle→StagePrestige→Ascension→Transcendence→Reality); event currencies; collection grid; QoL settings; cloud sync; save v4; break_eternity migration |
| **Systems** | Æ/Ω formulas + cascading resets, meta trees, TOKENS/STARLIGHT, achievements→multiplier, number formatting, export/import, Firebase sync |
| **Risks** | break_infinity→break_eternity migration breaks saves → write explicit v3→v4 number migration + soak test. Cloud conflict data loss → last-write-wins + local backup slot. Offline exploit (clock cheat) → soft-cap + sanity-check elapsed. Cascading reset bug nuking meta → unit-test doReset depth. |
| **Duration** | 8 weeks |
| **Success metrics** | Full ladder climbable end-to-end; first Transcendence ~6–10 h in; Ω reachable; ≥30 achievements live; cloud save round-trips across two browsers; D7-style retention loop (login→collect→1–2 decisions→close) under 10 min |

---

### Phase 4 — Polish & Launch  (Weeks 26–32)

**Goal:** Balance pass, "juice", and public release on itch.io + Cloudflare Pages.

#### Systems / work
- **Balance pass** against the sim harness: tune `r` (1.07→1.15 across stages), prestige `k/a`, fortuneWeights, softcaps so each layer's "need to prestige now" fires at the target cadence (first prestige 30–60 min; each higher layer 3–10× faster per loop).
- **Juice:** number-pop scaling, screen-shake on big mints, parallax stage backdrops, golden-cookie-style **STARLIGHT** spawn flash + SFX, "while you were away" summary art.
- Audio pass (Bosca Ceoil loop per stage, jsfxr SFX, Audacity master).
- Onboarding: milestone-gated reveals (gray→unlock) so all 8 stages aren't dumped at once.
- Perf: PixiJS sprite batching, throttle UI redraw to ≤10 Hz, WebWorker for heavy mint loop if needed.
- Ship: itch.io HTML5 (≤200 MB/file), Cloudflare Pages mirror, save backup nag.

```
// Balance acceptance band (per progression layer)
target_first_prestige      = 30–60 min
target_per_layer_speedup   = 3–10×   (each higher layer reached faster per loop)
cost_growth_ramp           = r: 1.07 (VILLAGE) → 1.15 (MULTIVERSE)
offline_window             = 2 h base → ~24 h via upgrades, 25–50% past 2 h
```

| | |
|---|---|
| **Deliverables** | Balanced, juicy, audio-complete public build on itch.io + Cloudflare Pages; tutorial; trailer GIF |
| **Duration** | 6 weeks |
| **Risks** | Balance whack-a-mole → freeze formulas, only tune constants. WASM/bundle load time → Svelte+Pixi is light (<1 MB). itch.io 200 MB/file cap → compress spritesheets. Last-minute scope → cut-line below is law. |
| **Success metrics** | Median session 5–15 min; first-prestige completion within 60–90 min of first launch (LTV predictor); cold load <3 s; 60 fps render / stable 10 Hz logic; zero save-wipe bugs in 100-reload soak; ≥20 itch.io wishlists/ratings week 1 |

---

### Post-Launch  (Week 32+)

| Workstream | Content | Cadence |
|---|---|---|
| Seasonal events | TOKENS shops, themed STARLIGHT bosses, limited collection rows; **offline accrues during event** (FOMO-free, per genre best practice) | Quarterly |
| Balance/QoL patches | Tune from telemetry; more automation tiers; offline cap toward 24 h | Monthly |
| Mobile wrapper | **Capacitor** (web→Android/iOS, reuses Svelte/Pixi build) primary; **Tauri 2.0** if desktop-native build wanted | One-time, then maintained |
| New stage / NG+ modifiers | Reality Reset (Ω) NG+ modifiers expanded; optional 9th stage as DLC-style content | As capacity allows |

---

### MVP Feature Cut-Line  (what ships at Launch vs. what waits)

```
┌──────────────────────── ABOVE THE LINE — MUST SHIP AT LAUNCH ────────────────────────┐
│ • All 8 stages (VILLAGE…MULTIVERSE) idling + the 7 canonical cross-stage bindings     │
│ • The Fortune Engine: slots, fortuneWeights, ★ mint                                   │
│ • Progression ladder: Idle → Stage Prestige → Ascension(LP) → Transcendence(Æ)        │
│ • Offline progress (2 h base, 25–50% past) + "while you were away" summary             │
│ • Save: versioned + migration + lz-string + export/import                             │
│ • Automation: auto-buy + auto-Stage-Prestige (prestige-gated)                         │
│ • Core juice: number-pop, parallax backdrops, STARLIGHT spawn, per-stage music loop   │
│ • ≥30 achievements/collections (each a small global multiplier)                       │
│ • Number-format toggle + settings + onboarding reveals                                │
└───────────────────────────────────────────────────────────────────────────────────────┘
┌──────────────────── BELOW THE LINE — POST-LAUNCH / CUTTABLE ──────────────────────────┐
│ ○ Reality Reset (Ω) NG+ modifiers          → ship core Ω, expand modifiers post-launch │
│ ○ Cloud sync (Firebase)                    → local save is launch-sufficient           │
│ ○ Seasonal TOKENS event shops              → quarterly post-launch                     │
│ ○ Mobile (Capacitor) / desktop (Tauri)     → after web validates                       │
│ ○ Full deep meta trees (Æ/Ω skill webs)    → ship minimal trees, deepen later          │
│ ○ Advanced autobuyer scripting / presets   → AD-style automator is a luxury            │
│ ○ 9th stage / extra minigames              → DLC-style                                 │
└───────────────────────────────────────────────────────────────────────────────────────┘
ABSOLUTE MINIMUM PLAYABLE (if time collapses): Phase-1 slice (3 stages + Stage Prestige
+ save) is a shippable demo; everything above the Fortune Engine line is the true "1.0".
```
