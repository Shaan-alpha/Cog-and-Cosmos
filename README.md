<div align="center">

# ⚙️ COG & COSMOS — *The Fortune Engine*

**A pixel-art interconnected incremental / idle game.**
Eight worlds. One brass engine. Infinite fortune.

`Svelte 5` · `TypeScript` · `PixiJS v8` · `break_eternity.js` · `Vite` · *100% free tools*

</div>

---

## ✦ What is this?

**Cog & Cosmos** is an idle game inspired by the interconnected-stage structure of *Fortune Mill*. Unlike most incrementals where you abandon old content, here **every stage stays alive and feeds the others**:

- The **Village's** townsfolk become *Labor* that powers the **Farm** and **Mine**.
- The **Farm's** grain feeds **Mine** and **Factory** workers.
- **Ore** + **Power** fuse into **Space** alloy.
- **Magic** mana enchants any stage; **Time** chronons buy time-warp bursts; **Multiverse** shards duplicate production.

Bolted over all of it, the **Fortune Engine** (the "Mill") siphons each stage's surplus and mills it into **Fortune (★)** — the universal currency that funds a global skill tree and the cross-stage links themselves.

> 📖 The complete design — all 8 stages, 5 prestige layers, every currency, skill tree, formula, and the full roadmap — lives in **[MASTER_PLAN.md](./MASTER_PLAN.md)** (~5,400 lines).

---

## ✦ Current status — Phase 3 (in progress)

All eight live, interdependent stages (**Village → Farm → Mine → Factory → Magic → Space → Time → Multiverse**),
a **Global Skill Tree**, per-stage auto-buyers, a Statistics panel, and an installable, offline-capable **PWA**:

| System | State |
|---|---|
| Village stage (7 generators: Cottage → Castle) | ✅ live |
| **Farm stage (7 generators: Field → Estate)** | ✅ live |
| **Mine stage (7 generators: Prospector → Core Crusher)** | ✅ live |
| **Factory stage (Boiler → Megafactory Core)** | ✅ live |
| **Magic Realm (Sigil → Arcane Citadel) + enchant casting** | ✅ live |
| **Space (Alloy Smelter → Warp Gate) + input-chain starvation** | ✅ live |
| **Time (Sundial → Eternity Spindle) + warp-tick bursts & Paradox throttle** | ✅ live |
| **Multiverse (Rift → Convergence Core) + production duplication & Convergence collapse** | ✅ live |
| **Compounding cross-stage binding chain** | ✅ live |
| **Stage unlock flow + unlock toast** | ✅ live |
| `break_eternity.js` big-number math | ✅ |
| Buy ×1 / ×10 / ×100 / Max with bulk-cost formulas | ✅ |
| Milestone tier multipliers (×2 at 10/25/50/100/250/500/1000/2500) | ✅ |
| Prestige-gated per-stage **auto-buyers** | ✅ live |
| **Statistics panel** (playtime · ★ totals/rate · per-stage table) | ✅ live |
| Per-second production readouts | ✅ |
| Stage prestige (Renown / Heritage) with sqrt-gain formula | ✅ |
| Fortune Engine ★ minting + auto-slot on unlock | ✅ |
| Offline progress + "while you were away" summary | ✅ |
| Autosave → IndexedDB (lz-string compressed) | ✅ |
| PixiJS pixel scenes (village night · farm day · mine cavern) + number-pops | ✅ |
| Synthesized Web-Audio SFX + mute | ✅ |
| **Global Skill Tree (spend Fortune ★, 9-node tiered tree)** | ✅ live |
| **Installable PWA + full offline play (service worker)** | ✅ live |
| **SPA multi-view (Stages / Skills / Ascension / Transcendence / Stats / Settings) — one persistent runtime** | ✅ live |
| "Brass & Ink" production UI theme | ✅ |
| **Time / Multiverse Local Upgrades (Epoch / Convergence trees)** | ✅ live |
| **Ascension meta-layer (deep reset → Legacy Points) + LP meta tree** | ✅ live |
| **Transcendence meta-layer (deep reset → Aether Æ) + Æ tree** | ✅ live |
| **Achievements system (20 milestones + global output boost)** | ✅ live |
| **Multi-stack Toast Notification Bus** | ✅ live |
| **Reality Reset (Ω) meta-layer (+10%/Ω global & mint) + Ω tree** | ✅ live |
| **Challenges (restricted runs → Medals 🎖️ + Trial tree)** | ✅ live |
| **Mobile / touch UX (responsive layout, ≥44px targets, safe-area)** | ✅ live |
| **Collections (18 relics, rarity sets, drop on resets)** | ✅ live |
| **Events (claimable random-encounter production buffs)** | ✅ live |

---

## ✦ Quick start

```bash
npm install      # install dependencies (Svelte, PixiJS, etc.)
npm run dev      # start the dev server  →  http://localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the production build
npm run check    # svelte-check type pass
npm test         # Vitest: pure-core characterization + UI render-smoke suite
```

Requires **Node 20.19+ or 22.12+** (Vite 8). No paid services, no API keys, no accounts.

---

## ✦ Cloud Sync setup (optional)

Cloud Sync is **off by default** and needs a free Supabase project. Without the two env vars
below, the Settings card shows "not configured" and nothing changes — the game stays a pure,
offline-first PWA.

1. Create a free project at [supabase.com](https://supabase.com). From **Settings → API**, copy
   the **Project URL** and the **anon / publishable** key.
2. Copy `.env.example` to `.env.local` and fill in:
   ```
   VITE_SUPABASE_URL=https://<your-project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```
   (`.env.local` is gitignored — never commit keys. The anon key is safe in a client; row-level
   security enforces per-user isolation.)
3. In the Supabase **SQL Editor**, create the table + row-level security:
   ```sql
   create table public.saves (
     user_id        uuid primary key references auth.users (id) on delete cascade,
     blob           text        not null,
     save_version   integer     not null,
     save_timestamp bigint      not null,
     updated_at     timestamptz not null default now()
   );
   alter table public.saves enable row level security;
   create policy "own row select" on public.saves for select using (auth.uid() = user_id);
   create policy "own row insert" on public.saves for insert with check (auth.uid() = user_id);
   create policy "own row update" on public.saves for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
   ```
4. In **Authentication → URL Configuration**, add your app origin(s) (e.g. `http://localhost:5173`
   and your deployed URL) to **Redirect URLs**, and ensure email sending is enabled.
5. `npm run dev` → **Settings → Cloud Sync** → enter your email → click the magic link → **Push**.
   On another device, sign in with the same email and **Pull**. Push won't overwrite a newer cloud
   save (and Pull won't overwrite a newer local save) without an explicit "overwrite anyway" confirm.

---

## ✦ How it plays

1. **Buy Cottages** — they trickle out Coins (¢).
2. **Reinvest** — taverns, blacksmiths, guild halls and castles stack multipliers.
3. **Hit milestones** — crossing 10 / 25 / 50 / 100 / 250 / 500 / 1000 / 2500 of a generator each grants ×2 (cumulative).
4. **Watch the Engine** — surplus Coins mint Fortune (★); the brass cog spins faster the more you mint.
5. **Prestige** — reset the Village for Renown, which permanently boosts production (+25% per prestige) and unlocks higher-tier buildings.

---

## ✦ Tech stack & why (all free)

| Layer | Choice | Reason |
|---|---|---|
| UI | **Svelte 5 runes** | Fastest reactive DOM for a stat-dense HUD; near-zero runtime |
| Sprites | **PixiJS v8** | Tiny render-only canvas for the pixel scene + number-pops |
| Game core | **Vanilla TS** | Framework-agnostic, unit-testable economy logic |
| Numbers | **break_eternity.js** | Handles values past `1e308` into the late game |
| Save | **idb-keyval + lz-string** | Compressed IndexedDB with localStorage fallback |
| Build | **Vite** | Instant HMR, tiny config |
| Deploy | GitHub Pages / itch.io / Netlify | Free static hosting |

Full engine comparison and rationale: [MASTER_PLAN.md §14](./MASTER_PLAN.md#technology--tooling-free-only).

---

## ✦ Project layout

```
src/
├── main.ts                 # entry: load theme, init game, mount
├── app.css                 # "Brass & Ink" global theme (CSS-variable tokens)
├── App.svelte              # loading screen + offline-summary host
├── data/
│   ├── types.ts            # all interfaces (defs + runtime state + GameState)
│   ├── roster.ts           # display metadata for all 8 stages (dial bar)
│   ├── stages/             # village.ts · farm.ts · mine.ts  (LIVE)
│   └── skills/global.ts    # Global Skill Tree node defs
├── systems/                # framework-agnostic game core (no Svelte)
│   ├── Decimal.ts          # break_eternity wrapper + number formatting
│   ├── formulas.ts         # all balancing math (MASTER_PLAN §17)
│   ├── StageEconomy.ts     # per-stage tick / rates / buy / prestige
│   ├── FortuneEngine.ts    # ★ minting from surpluses + 8 slots
│   ├── skills.ts           # skill costs / prereqs / recompute multipliers
│   ├── audio.ts            # synthesized Web-Audio SFX (no files) + mute
│   └── SaveManager.ts      # IndexedDB + lz-string + versioned migrate()
├── stores/game.svelte.ts   # reactive state + 20 Hz fixed-step loop + bindings/unlocks/skills
├── ui/                      # Svelte components (render-only)
│   ├── GameLayout.svelte   #   shell: masthead, Stages/Skills view switch, dial bar, toast
│   ├── StagePanel.svelte   #   generic per-stage panel (works for any stage)
│   ├── FortuneEnginePanel.svelte · SkillTree.svelte · OfflineSummary.svelte
└── pixi/PixiCanvas.svelte   # village / farm / mine pixel scenes + number-pops
scripts/generate-icons.mjs   # pure-Node PNG generator for the PWA icon set → /public
```

See **[CLAUDE.md](./CLAUDE.md)** for architecture details, the systems map, and the "how to add a stage" recipe.

---

## ✦ Documentation

| File | Purpose |
|---|---|
| [MASTER_PLAN.md](./MASTER_PLAN.md) | The full game-design & technical bible |
| [ROADMAP.md](./ROADMAP.md) | Phase-by-phase build plan |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to add stages / skills / content |
| [CLAUDE.md](./CLAUDE.md) | Guidance for AI agents — architecture, systems map, conventions |
| [AGENTS.md](./AGENTS.md) | Vendor-neutral agent guide (Cursor/Copilot/Codex) |

---

## ✦ Deploy

Pushing to `main` (or running the **Deploy** workflow manually) builds and publishes the game — no paid infrastructure:

- **GitHub Pages** (always-live): <https://shaan-alpha.github.io/Cog-and-Cosmos/>. The workflow enables Pages automatically on first run; nothing to configure.
- **itch.io** (optional): publishing activates once you provide your own credentials.
  1. Create an itch.io project of kind **HTML**; note its `user/game` slug.
  2. In **Settings → Secrets and variables → Actions**, add:
     - Variable `ITCH_TARGET` = `<user>/<game>`
     - Secret `BUTLER_API_KEY` = your itch.io API key (from <https://itch.io/user/settings/api-keys>)

  The itch job is skipped while `ITCH_TARGET` is unset, so the pipeline never fails for lack of itch config.

The CI **verify** gate runs `npm run check` + `npm test` before anything deploys. The app ships under a non-root base, so local production previews use `npm run build && npm run preview` (root base); the Pages/itch bases are applied by `npm run build:pages` / `npm run build:itch`.

---

## ✦ License

[MIT](./LICENSE) — free to play, fork, and build upon.

<div align="center"><sub>Built with free tools and a great many cogs. 🌙</sub></div>
