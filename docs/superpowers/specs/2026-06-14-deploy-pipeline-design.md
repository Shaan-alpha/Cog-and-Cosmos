# Deploy Pipeline — Design Spec

**Date:** 2026-06-14
**Status:** Approved (brainstorm) — pending implementation plan
**Feature:** Phase 4 launch — free CI/CD that publishes the PWA to **GitHub Pages** (always-live) and **itch.io** (via butler) on every push to `main`.

---

## 1. Goal & context

Give the game a public, always-current playable link with zero paid infrastructure. The app is already a Vite-built, installable PWA; what's missing is (a) correct base-path handling for non-root hosting and (b) an automated build→deploy workflow.

**Current state (verified):**
- Repo `Shaan-alpha/Cog-and-Cosmos` is **public** (free GitHub Pages works), default branch `main`, Pages **not yet configured**.
- No `.github/` directory, no CI.
- `vite.config.ts` sets no `base` (defaults to `/`) and no `outDir` (defaults to `dist`).
- `vite-plugin-pwa` is configured; the manifest link href is built from Vite's resolved `base` (`buildBase`), and the SW scope follows `base` — so a per-build `--base` override relocates both correctly (confirmed against current plugin docs).

**Hosting constraints:**
- **GitHub Pages** serves a project site at `https://shaan-alpha.github.io/Cog-and-Cosmos/` → needs absolute base `/Cog-and-Cosmos/`.
- **itch.io** runs the build inside an iframe at an arbitrary CDN path → needs **relative** base `./`. (PWA install is N/A inside the itch iframe; the manifest/SW are harmless there.)
- **Dev** must stay at base `/`.

---

## 2. Decisions locked in brainstorm

- **Scope (Q):** GitHub Pages **and** itch.io, both automated in CI (butler for itch).
- **Trigger (Q):** push to `main` **+** manual `workflow_dispatch`. Always-live latest build.
- **Base strategy (approach A):** `vite build --base=…` per npm script — zero new deps, cross-platform, dev untouched. (Rejected: env-var-in-config needs `cross-env` for Windows parity; dual configs duplicate.)
- **itch config is user-supplied, not hardcoded:** the itch target is a repo **Variable** `ITCH_TARGET` (e.g. `shaansatsangi/cog-and-cosmos`) and the **Secret** `BUTLER_API_KEY`. The itch job is gated `if: vars.ITCH_TARGET != ''`, so the workflow never fails when itch isn't configured yet.
- **Verify gate:** `check` + `test` must pass before anything deploys.

---

## 3. Dependency: the test-suite fix must be on this branch

The CI `verify` job runs `npm test`. The Vitest project-split fix (commit `4db4ccd` on `feat/juice-game-feel`) is **not on `main`**, so a branch off `main` still has the parallel-suite failure. The implementation will **cherry-pick `4db4ccd`** onto the deploy branch as its first step so its own CI is green. The patch is identical to the one on the juice branch, so it merges cleanly (idempotent) whichever PR lands first.

---

## 4. Base-path handling (`package.json`, `vite.config.ts`)

`vite.config.ts` — make `start_url`/`scope` **relative** so the manifest resolves correctly under both `/Cog-and-Cosmos/` and itch's `./` without per-target config branching:

```ts
manifest: {
  // …existing fields…
  start_url: './',
  scope: './',
  // …icons unchanged (already base-relative, no leading slash)…
}
```

`package.json` scripts — `build` unchanged (base `/`, for local/preview); add:

```json
"build:pages": "vite build --base=/Cog-and-Cosmos/",
"build:itch": "vite build --base=./"
```

`vite build --base=X` flows into `config.base`; `vite-plugin-pwa` reads it for the manifest href + SW scope. No `vite.config.ts` base logic needed.

---

## 5. CI/CD workflow (`.github/workflows/deploy.yml`)

```yaml
name: Deploy
on:
  push: { branches: [main] }
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
        with: { node-version: 20, cache: npm }
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
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build:pages
      - uses: actions/configure-pages@v5
        with: { enablement: true }      # auto-enables Pages (source = GitHub Actions)
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
      - id: deployment
        uses: actions/deploy-pages@v4

  deploy-itch:
    needs: verify
    if: ${{ vars.ITCH_TARGET != '' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build:itch
      - name: Install butler
        run: |
          curl -L -o butler.zip https://broth.itch.ovh/butler/linux-amd64/LATEST/archive/default
          unzip butler.zip && chmod +x butler && ./butler -V
      - name: Push to itch.io
        env:
          BUTLER_API_KEY: ${{ secrets.BUTLER_API_KEY }}
        run: ./butler push dist "${{ vars.ITCH_TARGET }}:html5"
```

Notes:
- `configure-pages@v5 { enablement: true }` turns Pages on automatically — no manual repo setting needed.
- `deploy-pages` and `deploy-itch` both depend only on `verify`, so they run in parallel after the gate.
- The itch job no-ops (is skipped) until `ITCH_TARGET` is set; if it's set but `BUTLER_API_KEY` is missing, butler fails loudly (correct signal to add the key).

---

## 6. What the user must do (cannot be automated)

For itch publishing only (Pages needs nothing):
1. Create the itch.io project (kind: **HTML**), note its `user/game` slug.
2. Repo **Settings → Secrets and variables → Actions**: add Variable `ITCH_TARGET = <user>/<game>` and Secret `BUTLER_API_KEY = <itch API key>`.

Documented in the README deploy section.

---

## 7. Verification

**Local (in the plan, before merge):**
- `npm run build:pages` → assert `dist/index.html` references `/Cog-and-Cosmos/assets/…` and the manifest link is `/Cog-and-Cosmos/manifest.webmanifest`.
- `npm run build:itch` → assert `dist/index.html` references `./assets/…` (relative).
- `npm run build` (default) still references `/assets/…` (dev/preview unaffected).
- YAML lint the workflow (parse / `actionlint` if available).

**Post-merge (manual, noted as the final confirmation):** the live deploy only runs once `deploy.yml` is on `main` (the trigger). After merge, confirm the Actions run is green and `https://shaan-alpha.github.io/Cog-and-Cosmos/` loads and plays. This cannot be verified pre-merge.

---

## 8. Docs

- **README** — a "Deploy" section: the live URL, the push-to-main/manual triggers, and the itch `ITCH_TARGET`/`BUTLER_API_KEY` setup steps.
- **CHANGELOG** `[Unreleased]` — the deploy pipeline + base-path/PWA changes.
- **ROADMAP** — mark the "Deploy to itch.io + GitHub Pages" Phase 4 item.

---

## 9. Risks & mitigations

- **Broken tests on `main`** → cherry-pick the Vitest fix (§3); the verify gate then passes.
- **PWA start_url at subpath** → set `start_url`/`scope` to `./` (relative), correct under both bases (§4); verified by the build-output asset-path checks (§7).
- **Pages not enabled** → `configure-pages@v5 { enablement: true }` enables it on first run; no manual step.
- **itch misconfig** → job gated on `ITCH_TARGET`; absent ⇒ skipped, never red.
- **No live verification pre-merge** → explicitly called out; the local asset-path assertions are the pre-merge proxy.

---

## 10. Out of scope (YAGNI)

Custom domain/CNAME, SPA 404 fallback (the app uses in-app view switching, no URL routes), release-tag gating, preview deploys per-PR, and Lighthouse/perf budgets in CI. Each is a clean future add.
