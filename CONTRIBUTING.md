# Contributing to Cog & Cosmos

Thanks for helping build the Fortune Engine. This guide covers how the project is organized and
how to add content cleanly. For architecture and the non-negotiable rules, read
**[CLAUDE.md](./CLAUDE.md)**; for the full game design, read **[MASTER_PLAN.md](./MASTER_PLAN.md)**.

## Principles

1. **Free tools only.** No paid dependencies, engines, or services — ever.
2. **Logic in `systems/`, rendering in `ui/` + `pixi/`.** Keep them separate.
3. **Data-driven.** New stages/skills/achievements are *data files*, not bespoke code.
4. **Consistency with the bible.** Names, currencies, and formulas must match MASTER_PLAN.

## Getting set up

```bash
git clone <repo>
cd Game
npm install
npm run dev
```

## Project layout

See [README.md](./README.md#-project-layout) and [CLAUDE.md](./CLAUDE.md#architecture).

## Common tasks

### Add a generator to an existing stage
Edit that stage's file in `src/data/stages/`. Append a `GeneratorDef` with `baseCost` (a `Decimal`
via `D(...)`), `costGrowth` (`r`, ~1.07 early → ~1.15 late), `baseRate`, and an `unlockAt` prestige
gate. Milestone multipliers apply automatically.

### Add a new stage
Follow the recipe in [CLAUDE.md → "How to add a new stage"](./CLAUDE.md#how-to-add-a-new-stage-extensibility-recipe).
Wire its cross-stage binding (Labor / Grain / Alloy / Mana / Chronons / Shards) per MASTER_PLAN.

### Tune balancing
All math is in `src/systems/formulas.ts`. Change constants there, not in components. Keep the
pacing targets from MASTER_PLAN §17 in mind (a prestige should feel like a 2–10× speedup).

## Code style

- **TypeScript strict.** No `any` unless genuinely unavoidable (and commented).
- **Decimal for all game values.** Never persist a currency as `number`.
- **CSS variables** from `app.css` for all colors/fonts — no hardcoded hex in components.
- Keep functions in `systems/` **pure and side-effect-free** where possible (the store owns mutation).

## Before you open a PR

1. `npm run build` passes (this is the full type + Svelte check).
2. `npm run check` is clean.
3. If you changed `GameState`, you bumped `CURRENT_VERSION` and added a `migrate()` step.
4. You updated [CHANGELOG.md](./CHANGELOG.md) under `[Unreleased]`.
5. New player-facing systems are reflected in [MASTER_PLAN.md](./MASTER_PLAN.md) if they change the design.

## Commit messages

Use clear, imperative summaries: `Add Farm stage with Grain economy`, `Fix offline cap formula`.
Conventional-commits prefixes (`feat:`, `fix:`, `docs:`, `refactor:`) are welcome but not required.
