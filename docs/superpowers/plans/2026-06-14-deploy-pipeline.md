# Deploy Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Free CI/CD that publishes the PWA to GitHub Pages (always-live at `https://shaan-alpha.github.io/Cog-and-Cosmos/`) and itch.io (via butler) on every push to `main` + manual dispatch.

**Architecture:** Per-target base path via `vite build --base=…` (no config branching, no new deps); a single GitHub Actions workflow with a `verify` gate feeding parallel `deploy-pages` and `deploy-itch` jobs. itch is gated behind a repo variable so the workflow never fails unconfigured. The branch first cherry-picks the Vitest fix so its own verify gate is green.

**Tech Stack:** Vite 8 + `vite-plugin-pwa`, GitHub Actions (`configure-pages@v5`/`upload-pages-artifact@v3`/`deploy-pages@v4`), butler (itch.io CLI). Node 20 in CI.

**Spec:** `docs/superpowers/specs/2026-06-14-deploy-pipeline-design.md`
**Branch:** `ci/deploy-pipeline` (already created off `main`).

---

### Task 1: Cherry-pick the test-suite fix onto this branch

The CI `verify` job runs `npm test`; the Vitest project-split fix lives on `feat/juice-game-feel` (commit `4db4ccd`), not `main`, so this branch still has the parallel-suite failure. Bring it over. The patch is identical to the one already on the juice branch, so it merges cleanly whichever PR lands first.

**Files:** none authored — a cherry-pick of `vitest.config.ts` + `CHANGELOG.md`.

- [ ] **Step 1: Confirm tests are currently broken (baseline)**

Run: `npm test 2>&1 | grep -E "Test Files|failed to find" | head -3`
Expected: failures like `Test Files  15 failed` / "Vitest failed to find the current suite" (the pre-fix state on `main`).

- [ ] **Step 2: Cherry-pick the fix**

Run:
```bash
git cherry-pick 4db4ccd
```
Expected: applies cleanly (commit "fix(test): isolate browser resolve-condition into a ui Vitest project"). If `CHANGELOG.md` conflicts, keep both the incoming test-fix block and the existing `[Unreleased]` content, then `git cherry-pick --continue`.

- [ ] **Step 3: Verify the suite is green**

Run: `npm test 2>&1 | grep -E "Test Files|Tests "`
Expected: `Test Files  15 passed (15)` / `Tests  138 passed (138)`.

- [ ] **Step 4: No separate commit**

The cherry-pick already created its commit. Continue.

---

### Task 2: Base-path config (Vite manifest + npm scripts)

Relative `start_url`/`scope` so the PWA manifest resolves under both `/Cog-and-Cosmos/` (Pages) and `./` (itch); per-target build scripts.

**Files:**
- Modify: `vite.config.ts` (manifest block, ~line 17)
- Modify: `package.json` (scripts, ~line 7)

- [ ] **Step 1: Add relative start_url/scope to the manifest**

In `vite.config.ts`, change:

```ts
        display: 'standalone',
        orientation: 'any',
        categories: ['games', 'entertainment'],
```
to:
```ts
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        categories: ['games', 'entertainment'],
```

- [ ] **Step 2: Add the per-target build scripts**

In `package.json`, change the scripts block:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-check --tsconfig ./tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```
to:
```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:pages": "vite build --base=/Cog-and-Cosmos/",
    "build:itch": "vite build --base=./",
    "preview": "vite preview",
    "check": "svelte-check --tsconfig ./tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```

- [ ] **Step 3: Verify the Pages build emits absolute base paths**

Run:
```bash
npm run build:pages && grep -o '/Cog-and-Cosmos/assets/[^"]*' dist/index.html | head -1 && grep -o 'href="/Cog-and-Cosmos/[^"]*manifest[^"]*"' dist/index.html
```
Expected: an `/Cog-and-Cosmos/assets/index-*.js` path and a `/Cog-and-Cosmos/…manifest.webmanifest` href.

- [ ] **Step 4: Verify the itch build emits relative base paths**

Run:
```bash
npm run build:itch && grep -o '\./assets/[^"]*' dist/index.html | head -1
```
Expected: a `./assets/index-*.js` path (relative).

- [ ] **Step 5: Verify the default build is unchanged (root base)**

Run:
```bash
npm run build && grep -o '"/assets/[^"]*"' dist/index.html | head -1
```
Expected: an absolute `"/assets/index-*.js"` path (root base — dev/preview unaffected).

- [ ] **Step 6: Commit**

```bash
git add vite.config.ts package.json
git commit -m "build(deploy): per-target base paths (pages/itch) + relative PWA scope"
```

---

### Task 3: The CI/CD workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create the workflow**

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: deploy
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run check
      - run: npm test

  deploy-pages:
    needs: verify
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build:pages
      - uses: actions/configure-pages@v5
        with:
          enablement: true
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4

  deploy-itch:
    needs: verify
    if: ${{ vars.ITCH_TARGET != '' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build:itch
      - name: Install butler
        run: |
          curl -L -o butler.zip https://broth.itch.ovh/butler/linux-amd64/LATEST/archive/default
          unzip butler.zip
          chmod +x butler
          ./butler -V
      - name: Push to itch.io
        env:
          BUTLER_API_KEY: ${{ secrets.BUTLER_API_KEY }}
        run: ./butler push dist "${{ vars.ITCH_TARGET }}:html5"
```

- [ ] **Step 2: Validate the YAML parses**

Run:
```bash
node -e "const fs=require('fs');const s=fs.readFileSync('.github/workflows/deploy.yml','utf8');const m=s.match(/^jobs:/m);if(!m)throw new Error('no jobs key');console.log('workflow OK, jobs present')"
```
Expected: `workflow OK, jobs present` (a basic structural check; full schema is validated by GitHub on push).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci(deploy): GitHub Pages + itch.io workflow (verify gate, push-to-main + manual)"
```

---

### Task 4: Docs (README + CHANGELOG + ROADMAP)

**Files:**
- Modify: `README.md` (add a Deploy section)
- Modify: `CHANGELOG.md` (`[Unreleased]`)
- Modify: `ROADMAP.md` (Phase 4 deploy item)

- [ ] **Step 1: README deploy section**

Append this section to `README.md` (before any trailing license/footer; if unsure, append at end):

```markdown
## Deploy

Pushing to `main` (or running the **Deploy** workflow manually) builds and publishes the game — no paid infrastructure:

- **GitHub Pages** (always-live): <https://shaan-alpha.github.io/Cog-and-Cosmos/>. The workflow enables Pages automatically on first run; nothing to configure.
- **itch.io** (optional): publishing activates once you provide your own credentials.
  1. Create an itch.io project of kind **HTML**; note its `user/game` slug.
  2. In **Settings → Secrets and variables → Actions**, add:
     - Variable `ITCH_TARGET` = `<user>/<game>`
     - Secret `BUTLER_API_KEY` = your itch.io API key (from <https://itch.io/user/settings/api-keys>)
  The itch job is skipped while `ITCH_TARGET` is unset, so the pipeline never fails for lack of itch config.

The CI **verify** gate runs `npm run check` + `npm test` before anything deploys. The app ships under a non-root base, so local production previews use `npm run build && npm run preview` (root base); the Pages/itch bases are applied by `npm run build:pages` / `npm run build:itch`.
```

- [ ] **Step 2: CHANGELOG entry**

Add under `## [Unreleased]` (above the existing top entry):

```markdown
### Added — Phase 4: Deploy pipeline (GitHub Pages + itch.io)
- **Free CI/CD.** A `Deploy` GitHub Actions workflow builds and publishes on every push to `main`
  (and on manual dispatch): a `verify` gate (`check` + `test`) feeds parallel **GitHub Pages**
  (always-live at `/Cog-and-Cosmos/`) and **itch.io** (via `butler`) deploys. Pages is auto-enabled;
  the itch job is gated behind a repo `ITCH_TARGET` variable so it's skipped — never failed — until
  configured.
- **Per-target base paths.** `build:pages` (`/Cog-and-Cosmos/`) and `build:itch` (`./`, for itch's
  iframe) via `vite build --base=…`; the PWA manifest `start_url`/`scope` are now relative so it
  resolves correctly under both. Dev/preview (`build`) stay at root base.
```

- [ ] **Step 3: ROADMAP update**

In `ROADMAP.md`, under `## Phase 4 — Polish & Launch`, change the deploy line:

```markdown
- ✅ Deploy to **itch.io** + GitHub Pages (free) — automated CI/CD (Pages live; itch via butler, secret-gated)
```

- [ ] **Step 4: Commit**

```bash
git add README.md CHANGELOG.md ROADMAP.md
git commit -m "docs(deploy): README deploy guide + changelog + roadmap"
```

---

### Task 5: Final verification

- [ ] **Step 1: Full local gate + all three build targets**

Run:
```bash
npm run check 2>&1 | tail -2
npm test 2>&1 | grep -E "Test Files|Tests "
npm run build:pages >/dev/null 2>&1 && echo "pages build OK"
npm run build:itch  >/dev/null 2>&1 && echo "itch build OK"
npm run build        >/dev/null 2>&1 && echo "default build OK"
```
Expected: check `0 ERRORS`; tests `138 passed`; three `… build OK` lines.

- [ ] **Step 2: Confirm the branch is clean and ready to push**

Run: `git status --short && git log --oneline main..HEAD`
Expected: clean tree; commits for the cherry-pick, base-path config, workflow, and docs.

> **Post-merge (manual, cannot run pre-merge):** the live deploy only fires once `deploy.yml` is on `main`. After the deploy PR merges, open the **Actions** tab, confirm the `Deploy` run is green, and load <https://shaan-alpha.github.io/Cog-and-Cosmos/> to confirm the game plays. For itch, set `ITCH_TARGET` + `BUTLER_API_KEY` first.

---

## Build order summary

1. Cherry-pick the Vitest fix (green verify gate) → 2. base-path config + scripts → 3. the workflow → 4. docs → 5. final verification.

## Notes for the executor

- **No app/runtime code changes** — this is infra + config. "Tests" here are build-output assertions + the existing suite (kept green by Task 1).
- **`vite build --base=X`** is the whole base-path mechanism; don't add `base` logic to `vite.config.ts`.
- The workflow **cannot be verified live before it's on `main`** (push-to-main trigger) — the pre-merge proxy is the asset-path assertions in Task 2.
- **No AI co-authorship** in commits (CLAUDE.md rule #1).
- Finish on the `ci/deploy-pipeline` branch (PR to `main`).
