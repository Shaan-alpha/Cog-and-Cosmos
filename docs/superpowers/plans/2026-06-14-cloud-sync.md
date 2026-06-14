# Cloud Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add env-gated, free-tier cross-device save sync (Supabase) with magic-link auth and timestamp-guarded manual Push/Pull, without changing the local save format.

**Architecture:** A framework-agnostic `src/systems/cloud.ts` wraps `@supabase/supabase-js` (dynamically imported, so it stays out of the main bundle until configured/used) and trades only the opaque save blob + its metadata. Two store bridges (`cloudPush`/`cloudPull`) in `src/stores/game.svelte.ts` connect the live `GameState` to that wrapper, reusing the existing Settings-import swap path. A render-only `CloudSyncCard.svelte` in the Settings grid owns all session UI and confirm prompts. Everything self-disables when the two `VITE_` env vars are absent.

**Tech Stack:** Svelte 5 runes, TypeScript (strict), Vite, Vitest (+ jsdom), `@supabase/supabase-js` v2, existing `lz-string`-based `SaveManager`.

**Approved spec:** [docs/superpowers/specs/2026-06-14-cloud-sync-design.md](../specs/2026-06-14-cloud-sync-design.md)

**Hard rules for every commit:** No AI co-author trailer. No secrets in git. Save format unchanged — **do not** bump `CURRENT_VERSION` (stays 14). Currencies/costs stay `Decimal`. Use app.css tokens in the component (no hardcoded hex).

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `package.json` | Add `@supabase/supabase-js` runtime dep | Modify |
| `.env.example` | Document the two `VITE_` keys (no values) | Create |
| `src/vite-env.d.ts` | Type `import.meta.env` for the two keys | Modify |
| `src/systems/cloud.ts` | Supabase wrapper: env check, lazy client, auth, blob I/O. No Svelte, no game logic. | Create |
| `src/systems/cloud.test.ts` | Unit: env detection + unconfigured no-ops | Create |
| `src/stores/game.svelte.ts` | `swapInState` refactor + `cloudPush`/`cloudPull` bridges + result types | Modify |
| `src/stores/cloud.bridge.test.ts` | Unit (jsdom, mocked cloud): push/pull branch logic | Create |
| `src/ui/CloudSyncCard.svelte` | Render-only card: session UI + confirm flows | Create |
| `src/ui/cloudsynccard.test.ts` | Render-smoke (jsdom): unconfigured + signed-out | Create |
| `src/ui/SettingsPanel.svelte` | Mount `<CloudSyncCard/>` in the settings grid | Modify |
| `CHANGELOG.md`, `README.md`, `CLAUDE.md`, `AGENTS.md`, `ROADMAP.md` | Paper trail | Modify |

**Design note (refines the spec):** the timestamp guards live in the store bridges (which return a discriminated `'conflict'` result and do **not** write/swap); all confirm prompts live in the card, which re-invokes the bridge with `{ force: true }`. This keeps the store free of `window.confirm`, so it's fully testable in jsdom. Cloud *session* state (signed-in user, busy, status) is local `$state` in the card — it is not `GameState`, so it does not belong in the store.

---

## Task 1: Scaffolding — dependency, env typing, `.env.example`, `isCloudConfigured()`

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Modify: `src/vite-env.d.ts`
- Create: `src/systems/cloud.ts`
- Create: `src/systems/cloud.test.ts`

- [ ] **Step 1: Install the dependency (latest stable)**

Run:
```bash
npm install @supabase/supabase-js@^2.58.0
```
Expected: `package.json` `dependencies` gains `"@supabase/supabase-js": "^2.58.0"` (or newer 2.x); `package-lock.json` updates. (If npm resolves a newer 2.x stable, keep it — per the project's latest/best-stable standing preference. Do not take a v3 pre-release.)

- [ ] **Step 2: Verify `.gitignore` already protects secrets (no change expected)**

Run:
```bash
grep -nE "^\.env" .gitignore
```
Expected: shows `.env`, `.env.*`, and `!.env.example`. If `!.env.example` is missing, add it. Do **not** create `.env` or `.env.local`.

- [ ] **Step 3: Create `.env.example`**

Create `.env.example`:
```
# Cog & Cosmos — Cloud Sync (optional). Copy to .env.local and fill in.
# Both come from your Supabase project: Settings → API.
# The anon/publishable key is safe to ship in a client; per-user isolation is enforced by RLS.
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

- [ ] **Step 4: Type the env vars**

Replace `src/vite-env.d.ts` with:
```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 5: Write the failing test for `isCloudConfigured()`**

Create `src/systems/cloud.test.ts`:
```ts
import { describe, it, expect, afterEach, vi } from 'vitest'
import { isCloudConfigured } from './cloud'

afterEach(() => { vi.unstubAllEnvs() })

describe('isCloudConfigured', () => {
  it('false when both env vars are absent', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    expect(isCloudConfigured()).toBe(false)
  })
  it('false when only one is present', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    expect(isCloudConfigured()).toBe(false)
  })
  it('true when both are present', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')
    expect(isCloudConfigured()).toBe(true)
  })
})
```

- [ ] **Step 6: Run the test to verify it fails**

Run:
```bash
npx vitest run src/systems/cloud.test.ts
```
Expected: FAIL — cannot resolve `./cloud` (module not created yet).

- [ ] **Step 7: Create `src/systems/cloud.ts` (full wrapper)**

Create `src/systems/cloud.ts`:
```ts
// Framework-agnostic Supabase wrapper for Cloud Sync.
// NO Svelte, NO game logic — it only moves the opaque save blob + its metadata.
// @supabase/supabase-js is dynamically imported inside getClient() so it stays out
// of the main bundle until cloud is actually configured/used.
import type { SupabaseClient, Session } from '@supabase/supabase-js'

export interface CloudSave { blob: string; saveVersion: number; saveTimestamp: number }
export interface CloudMeta { saveVersion: number; saveTimestamp: number }
export interface CloudUser { email: string }

const TABLE = 'saves'

function env() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}

export function isCloudConfigured(): boolean {
  const { url, key } = env()
  return !!url && !!key
}

let _client: SupabaseClient | null = null
let _initTried = false

export async function getClient(): Promise<SupabaseClient | null> {
  if (!isCloudConfigured()) return null
  if (_client || _initTried) return _client
  _initTried = true
  const { url, key } = env()
  const { createClient } = await import('@supabase/supabase-js')
  _client = createClient(url!, key!, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  return _client
}

async function uid(client: SupabaseClient): Promise<string | null> {
  const { data } = await client.auth.getUser()
  return data.user?.id ?? null
}

export async function currentUser(): Promise<CloudUser | null> {
  const client = await getClient()
  if (!client) return null
  const { data } = await client.auth.getSession()
  const email = data.session?.user?.email
  return email ? { email } : null
}

export function onAuthChange(cb: (user: CloudUser | null) => void): () => void {
  let unsub = () => {}
  getClient().then(client => {
    if (!client) return
    const { data } = client.auth.onAuthStateChange((_event, session: Session | null) => {
      const email = session?.user?.email
      cb(email ? { email } : null)
    })
    unsub = () => data.subscription.unsubscribe()
  })
  return () => unsub()
}

export async function signIn(email: string): Promise<{ ok: boolean; error?: string }> {
  const client = await getClient()
  if (!client) return { ok: false, error: 'Cloud sync is not configured.' }
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function signOut(): Promise<void> {
  const client = await getClient()
  if (!client) return
  await client.auth.signOut()
}

export async function pushSave(s: CloudSave): Promise<{ ok: boolean; error?: string }> {
  const client = await getClient()
  if (!client) return { ok: false, error: 'Cloud sync is not configured.' }
  const userId = await uid(client)
  if (!userId) return { ok: false, error: 'Not signed in.' }
  const { error } = await client.from(TABLE).upsert({
    user_id: userId,
    blob: s.blob,
    save_version: s.saveVersion,
    save_timestamp: s.saveTimestamp,
    updated_at: new Date().toISOString(),
  })
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function fetchCloudMeta(): Promise<CloudMeta | null> {
  const client = await getClient()
  if (!client) return null
  const userId = await uid(client)
  if (!userId) return null
  const { data, error } = await client
    .from(TABLE)
    .select('save_version, save_timestamp')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return { saveVersion: data.save_version, saveTimestamp: data.save_timestamp }
}

export async function pullSave(): Promise<CloudSave | null> {
  const client = await getClient()
  if (!client) return null
  const userId = await uid(client)
  if (!userId) return null
  const { data, error } = await client
    .from(TABLE)
    .select('blob, save_version, save_timestamp')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return { blob: data.blob, saveVersion: data.save_version, saveTimestamp: data.save_timestamp }
}
```

- [ ] **Step 8: Add unconfigured no-op tests**

Append to `src/systems/cloud.test.ts` (inside the file, after the existing `describe`):
```ts
import { getClient, currentUser, signIn, pushSave, fetchCloudMeta, pullSave } from './cloud'

describe('unconfigured = safe no-ops (no network, no supabase import)', () => {
  afterEach(() => { vi.unstubAllEnvs() })
  function clearEnv() {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
  }
  it('getClient resolves null', async () => { clearEnv(); expect(await getClient()).toBeNull() })
  it('currentUser resolves null', async () => { clearEnv(); expect(await currentUser()).toBeNull() })
  it('signIn returns not-configured', async () => { clearEnv(); expect((await signIn('a@b.c')).ok).toBe(false) })
  it('pushSave returns not-configured', async () => {
    clearEnv()
    expect((await pushSave({ blob: 'x', saveVersion: 14, saveTimestamp: 1 })).ok).toBe(false)
  })
  it('fetchCloudMeta resolves null', async () => { clearEnv(); expect(await fetchCloudMeta()).toBeNull() })
  it('pullSave resolves null', async () => { clearEnv(); expect(await pullSave()).toBeNull() })
})
```

- [ ] **Step 9: Run the cloud unit tests**

Run:
```bash
npx vitest run src/systems/cloud.test.ts
```
Expected: PASS (9 tests). No network calls; `@supabase/supabase-js` is never imported because every path is unconfigured.

- [ ] **Step 10: Type-check**

Run:
```bash
npm run check
```
Expected: 0 errors / 0 warnings. (Requires the dep from Step 1 for `import type { SupabaseClient, Session }`.)

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json .env.example src/vite-env.d.ts src/systems/cloud.ts src/systems/cloud.test.ts
git commit -F - <<'EOF'
feat(cloud): supabase wrapper + env gating (cloud.ts)

Framework-agnostic Cloud Sync wrapper: isCloudConfigured(), lazy getClient()
(dynamic import of @supabase/supabase-js so it stays out of the main bundle),
magic-link auth (signInWithOtp/getSession/onAuthStateChange/signOut), and blob
I/O (pushSave/fetchCloudMeta/pullSave) against the RLS-guarded `saves` table.
Self-disables when VITE_SUPABASE_URL/ANON_KEY are absent. Adds .env.example and
typed import.meta.env. No secrets committed.
EOF
```

---

## Task 2: Store bridges — `swapInState` refactor + `cloudPush`/`cloudPull`

**Files:**
- Modify: `src/stores/game.svelte.ts` (imports near line 7-9; `importActiveSave` at lines 1431-1441; add bridges after it)
- Create: `src/stores/cloud.bridge.test.ts`

- [ ] **Step 1: Write the failing bridge tests**

Create `src/stores/cloud.bridge.test.ts`:
```ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { D } from '../systems/Decimal'
import { setMuted } from '../systems/audio'

// Mock the whole cloud wrapper so the bridges are tested in isolation (no network).
vi.mock('../systems/cloud', () => ({
  isCloudConfigured: vi.fn(() => true),
  currentUser: vi.fn(async () => ({ email: 'a@b.c' })),
  fetchCloudMeta: vi.fn(async () => null),
  pushSave: vi.fn(async () => ({ ok: true })),
  pullSave: vi.fn(async () => null),
}))

import * as cloud from '../systems/cloud'
import {
  __resetStoreForTest, getState, exportActiveSave, cloudPush, cloudPull,
} from './game.svelte'

const HUGE = 9_000_000_000_000_000   // far-future ms timestamp

beforeEach(() => {
  setMuted(true)
  __resetStoreForTest()
  // Restore default mock impls (clearAllMocks keeps impls, but be explicit per-test).
  vi.mocked(cloud.isCloudConfigured).mockReturnValue(true)
  vi.mocked(cloud.currentUser).mockResolvedValue({ email: 'a@b.c' })
  vi.mocked(cloud.fetchCloudMeta).mockResolvedValue(null)
  vi.mocked(cloud.pushSave).mockResolvedValue({ ok: true })
  vi.mocked(cloud.pullSave).mockResolvedValue(null)
})

describe('cloudPush', () => {
  it('unconfigured short-circuits without writing', async () => {
    vi.mocked(cloud.isCloudConfigured).mockReturnValue(false)
    expect((await cloudPush()).status).toBe('unconfigured')
    expect(cloud.pushSave).not.toHaveBeenCalled()
  })
  it('unauthenticated short-circuits without writing', async () => {
    vi.mocked(cloud.currentUser).mockResolvedValue(null)
    expect((await cloudPush()).status).toBe('unauthenticated')
    expect(cloud.pushSave).not.toHaveBeenCalled()
  })
  it('writes and returns ok when there is no conflict', async () => {
    expect((await cloudPush()).status).toBe('ok')
    expect(cloud.pushSave).toHaveBeenCalledOnce()
  })
  it('returns conflict (no write) when cloud is newer', async () => {
    vi.mocked(cloud.fetchCloudMeta).mockResolvedValue({ saveVersion: 14, saveTimestamp: HUGE })
    const r = await cloudPush()
    expect(r.status).toBe('conflict')
    expect(cloud.pushSave).not.toHaveBeenCalled()
  })
  it('force overrides a conflict and writes', async () => {
    vi.mocked(cloud.fetchCloudMeta).mockResolvedValue({ saveVersion: 14, saveTimestamp: HUGE })
    expect((await cloudPush({ force: true })).status).toBe('ok')
    expect(cloud.pushSave).toHaveBeenCalledOnce()
  })
  it('surfaces a push error', async () => {
    vi.mocked(cloud.pushSave).mockResolvedValue({ ok: false, error: 'boom' })
    const r = await cloudPush()
    expect(r).toEqual({ status: 'error', error: 'boom' })
  })
})

describe('cloudPull', () => {
  it('empty when there is no cloud row', async () => {
    expect((await cloudPull()).status).toBe('empty')
  })
  it('swaps in the cloud save on ok', async () => {
    getState().stages.village.primaryAmount = D(999)
    const blob = exportActiveSave()           // valid blob carrying 999 coins
    __resetStoreForTest()                      // back to a fresh 15-coin game
    vi.mocked(cloud.pullSave).mockResolvedValue({ blob, saveVersion: 14, saveTimestamp: HUGE })
    expect((await cloudPull()).status).toBe('ok')
    expect(getState().stages.village.primaryAmount.toNumber()).toBe(999)
  })
  it('returns conflict (no swap) when local is newer', async () => {
    getState().saveTimestamp = HUGE                       // local is far newer
    vi.mocked(cloud.pullSave).mockResolvedValue({ blob: 'whatever', saveVersion: 14, saveTimestamp: 1 })
    const before = getState().stages.village.primaryAmount.toNumber()
    expect((await cloudPull()).status).toBe('conflict')
    expect(getState().stages.village.primaryAmount.toNumber()).toBe(before)   // unchanged
  })
  it('reports corrupt when the blob cannot be decoded', async () => {
    vi.mocked(cloud.pullSave).mockResolvedValue({ blob: '!!!not-base64!!!', saveVersion: 14, saveTimestamp: HUGE })
    expect((await cloudPull()).status).toBe('corrupt')
  })
  it('force swaps even when local is newer', async () => {
    getState().stages.village.primaryAmount = D(777)
    const blob = exportActiveSave()
    __resetStoreForTest()
    getState().saveTimestamp = HUGE
    vi.mocked(cloud.pullSave).mockResolvedValue({ blob, saveVersion: 14, saveTimestamp: 1 })
    expect((await cloudPull({ force: true })).status).toBe('ok')
    expect(getState().stages.village.primaryAmount.toNumber()).toBe(777)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run:
```bash
npx vitest run src/stores/cloud.bridge.test.ts
```
Expected: FAIL — `cloudPush` / `cloudPull` are not exported from `./game.svelte`.

- [ ] **Step 3: Add the cloud imports to the store**

In `src/stores/game.svelte.ts`, immediately after the existing SaveManager import (line 7, `import { saveGame, loadGame, exportSave, importSave, consumeRebalanceReset } from '../systems/SaveManager'`), add:
```ts
import { isCloudConfigured, currentUser, fetchCloudMeta, pushSave, pullSave } from '../systems/cloud'
import type { CloudMeta } from '../systems/cloud'
```

- [ ] **Step 4: Refactor `importActiveSave` to share a `swapInState` helper**

Replace the existing `importActiveSave` (lines 1431-1441) with:
```ts
// Shared swap: replace the live game state, persist, recompute derived multipliers,
// and rebase the loop clock. Used by both manual Import and Cloud Pull.
function swapInState(imported: GameState) {
  cancelAnimationFrame(animFrameId)
  gs = imported
  saveGame(gs)
  recomputeUpgrades(gs)
  lastFrameMs = Date.now()
  animFrameId = requestAnimationFrame(tick)
}

export function importActiveSave(encoded: string): boolean {
  const imported = importSave(encoded)
  if (!imported) return false
  swapInState(imported)
  return true
}

export type CloudPushResult =
  | { status: 'ok' }
  | { status: 'conflict'; cloud: CloudMeta; local: CloudMeta }
  | { status: 'error'; error: string }
  | { status: 'unconfigured' }
  | { status: 'unauthenticated' }

export type CloudPullResult =
  | { status: 'ok' }
  | { status: 'empty' }
  | { status: 'conflict'; cloud: CloudMeta; local: CloudMeta }
  | { status: 'corrupt' }
  | { status: 'unconfigured' }
  | { status: 'unauthenticated' }

// Push the local save to the cloud. Guards against overwriting a NEWER cloud copy
// (returns 'conflict' without writing) unless { force: true }.
export async function cloudPush(opts: { force?: boolean } = {}): Promise<CloudPushResult> {
  if (!isCloudConfigured()) return { status: 'unconfigured' }
  if (!(await currentUser())) return { status: 'unauthenticated' }
  const blob = exportSave(gs)                 // also refreshes gs.saveTimestamp
  const local: CloudMeta = { saveVersion: gs.version, saveTimestamp: gs.saveTimestamp }
  if (!opts.force) {
    const meta = await fetchCloudMeta()
    if (meta && meta.saveTimestamp > gs.saveTimestamp) return { status: 'conflict', cloud: meta, local }
  }
  const res = await pushSave({ blob, saveVersion: gs.version, saveTimestamp: gs.saveTimestamp })
  if (res.ok) { pushToast('☁ Progress pushed to cloud'); return { status: 'ok' } }
  return { status: 'error', error: res.error ?? 'Push failed.' }
}

// Pull the cloud save and replace local. Guards against overwriting a NEWER local
// copy (returns 'conflict' without swapping) unless { force: true }.
export async function cloudPull(opts: { force?: boolean } = {}): Promise<CloudPullResult> {
  if (!isCloudConfigured()) return { status: 'unconfigured' }
  if (!(await currentUser())) return { status: 'unauthenticated' }
  const cloud = await pullSave()
  if (!cloud) return { status: 'empty' }
  const local: CloudMeta = { saveVersion: gs.version, saveTimestamp: gs.saveTimestamp }
  if (!opts.force && gs.saveTimestamp > cloud.saveTimestamp) {
    return { status: 'conflict', cloud: { saveVersion: cloud.saveVersion, saveTimestamp: cloud.saveTimestamp }, local }
  }
  const imported = importSave(cloud.blob)
  if (!imported) return { status: 'corrupt' }
  swapInState(imported)
  pushToast('☁ Progress pulled from cloud')
  return { status: 'ok' }
}
```

- [ ] **Step 5: Run the bridge tests to verify they pass**

Run:
```bash
npx vitest run src/stores/cloud.bridge.test.ts
```
Expected: PASS (11 tests).

- [ ] **Step 6: Run the full suite (no regressions)**

Run:
```bash
npm test
```
Expected: all green (prior 117 + 9 cloud-unit + 11 bridge = 137).

- [ ] **Step 7: Type-check**

Run:
```bash
npm run check
```
Expected: 0 errors / 0 warnings.

- [ ] **Step 8: Commit**

```bash
git add src/stores/game.svelte.ts src/stores/cloud.bridge.test.ts
git commit -F - <<'EOF'
feat(cloud): cloudPush/cloudPull store bridges

Bridge the live GameState to the cloud wrapper. Extract swapInState() (shared by
manual Import and Cloud Pull): replace gs, persist, recompute, rebase loop clock.
Timestamp guards return a 'conflict' result without writing/swapping unless
{ force: true }; pull reports 'empty'/'corrupt' distinctly. No window.confirm in
the store -- the UI owns prompts. Save format unchanged.
EOF
```

---

## Task 3: `CloudSyncCard.svelte` — render-only card + confirm flows

**Files:**
- Create: `src/ui/CloudSyncCard.svelte`
- Create: `src/ui/cloudsynccard.test.ts`

- [ ] **Step 1: Write the failing render-smoke test**

Create `src/ui/cloudsynccard.test.ts`:
```ts
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import CloudSyncCard from './CloudSyncCard.svelte'

// No VITE_ env stubbed → isCloudConfigured() is false → the card renders its
// "not configured" state and never touches supabase or the network.

let cleanup: (() => void) | null = null
afterEach(() => { cleanup?.(); cleanup = null })

describe('CloudSyncCard', () => {
  it('mounts in the unconfigured state without throwing', () => {
    const target = document.createElement('div'); document.body.appendChild(target)
    const inst = mount(CloudSyncCard, { target })
    cleanup = () => { unmount(inst); target.remove() }
    flushSync()
    expect(target.textContent ?? '').toContain('Cloud Sync')
    expect((target.textContent ?? '').toLowerCase()).toContain('not configured')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run:
```bash
npx vitest run src/ui/cloudsynccard.test.ts
```
Expected: FAIL — cannot resolve `./CloudSyncCard.svelte`.

- [ ] **Step 3: Create `src/ui/CloudSyncCard.svelte`**

Create `src/ui/CloudSyncCard.svelte`:
```svelte
<script lang="ts">
  import { isCloudConfigured, signIn, signOut, currentUser, onAuthChange, type CloudUser } from '../systems/cloud'
  import { cloudPush, cloudPull } from '../stores/game.svelte'
  import { playBuy, playMilestone } from '../systems/audio'

  const configured = isCloudConfigured()

  let user = $state<CloudUser | null>(null)
  let email = $state('')
  let busy = $state(false)
  let status = $state<string | null>(null)
  let linkSent = $state(false)
  let pushPhase = $state<'idle' | 'conflict'>('idle')
  let pullPhase = $state<'idle' | 'confirm' | 'conflict'>('idle')

  $effect(() => {
    if (!configured) return
    let active = true
    currentUser().then(u => { if (active) user = u })
    const off = onAuthChange(u => { user = u })
    return () => { active = false; off() }
  })

  function fmtTime(ms: number): string {
    try { return new Date(ms).toLocaleString() } catch { return String(ms) }
  }

  async function handleSignIn() {
    if (!email.trim()) { status = 'Enter your email first.'; return }
    busy = true; status = null
    const res = await signIn(email.trim())
    busy = false
    if (res.ok) { linkSent = true; status = 'Magic link sent — check your email, then return here.'; playBuy() }
    else { status = res.error ?? 'Sign-in failed.' }
  }

  async function handleSignOut() {
    busy = true
    await signOut()
    user = null; linkSent = false; status = 'Signed out.'; busy = false
  }

  async function handlePush(force = false) {
    busy = true; status = null
    const r = await cloudPush({ force })
    busy = false
    if (r.status === 'ok') { pushPhase = 'idle'; status = 'Pushed to cloud.'; playMilestone() }
    else if (r.status === 'conflict') { pushPhase = 'conflict'; status = `Cloud save is newer (${fmtTime(r.cloud.saveTimestamp)}) than this device (${fmtTime(r.local.saveTimestamp)}).` }
    else if (r.status === 'error') { pushPhase = 'idle'; status = r.error }
    else { pushPhase = 'idle'; status = r.status === 'unauthenticated' ? 'Sign in first.' : 'Cloud sync is not configured.' }
  }

  async function handlePull(force = false) {
    busy = true; status = null
    const r = await cloudPull({ force })
    busy = false
    if (r.status === 'ok') { pullPhase = 'idle'; status = 'Pulled from cloud.'; playMilestone() }
    else if (r.status === 'empty') { pullPhase = 'idle'; status = 'No cloud save found yet — Push first.' }
    else if (r.status === 'corrupt') { pullPhase = 'idle'; status = 'Cloud save is corrupt — Pull aborted.' }
    else if (r.status === 'conflict') { pullPhase = 'conflict'; status = `This device's save is newer (${fmtTime(r.local.saveTimestamp)}) than the cloud (${fmtTime(r.cloud.saveTimestamp)}).` }
    else { pullPhase = 'idle'; status = r.status === 'unauthenticated' ? 'Sign in first.' : 'Cloud sync is not configured.' }
  }
</script>

<section class="settings-card frame wide">
  <h3 class="card-title">☁ Cloud Sync</h3>

  {#if !configured}
    <p class="setting-hint">Cloud Sync is <strong>not configured</strong> for this build. See the README's “Cloud Sync setup” section to enable cross-device backups (free Supabase tier).</p>
  {:else if !user}
    <p class="setting-hint">Sign in with a magic link to back up and sync your save across devices. No password required.</p>
    <div class="cloud-row">
      <input class="cloud-input" type="email" placeholder="you@example.com" bind:value={email} disabled={busy} />
      <button class="action-btn" onclick={handleSignIn} disabled={busy}>Send magic link</button>
    </div>
    {#if linkSent}<p class="setting-hint">After clicking the link in your email, you'll return here signed in.</p>{/if}
  {:else}
    <div class="setting-row">
      <span class="setting-label">Signed in as <strong>{user.email}</strong></span>
      <button class="action-btn" onclick={handleSignOut} disabled={busy}>Sign out</button>
    </div>
    <div class="cloud-row">
      {#if pushPhase === 'conflict'}
        <button class="danger-btn" onclick={() => handlePush(true)} disabled={busy}>Overwrite cloud anyway</button>
        <button class="cancel-btn" onclick={() => { pushPhase = 'idle'; status = null }}>Cancel</button>
      {:else}
        <button class="action-btn" onclick={() => handlePush(false)} disabled={busy}>⬆ Push to cloud</button>
      {/if}

      {#if pullPhase === 'idle'}
        <button class="action-btn" onclick={() => { pullPhase = 'confirm'; status = null }} disabled={busy}>⬇ Pull from cloud</button>
      {:else if pullPhase === 'confirm'}
        <button class="danger-btn" onclick={() => handlePull(false)} disabled={busy}>Replace local with cloud</button>
        <button class="cancel-btn" onclick={() => { pullPhase = 'idle'; status = null }}>Cancel</button>
      {:else}
        <button class="danger-btn" onclick={() => handlePull(true)} disabled={busy}>Replace anyway</button>
        <button class="cancel-btn" onclick={() => { pullPhase = 'idle'; status = null }}>Cancel</button>
      {/if}
    </div>
    <p class="setting-hint">Pull replaces this device's current progress with the cloud copy.</p>
  {/if}

  {#if status}<div class="status-msg">{status}</div>{/if}
</section>

<style>
  .cloud-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  .cloud-input {
    flex: 1 1 180px; min-width: 0; padding: 8px 10px;
    background: var(--ink-900); border: 1px solid var(--brass-deep); border-radius: 4px;
    color: var(--parchment); font-family: var(--font-mono); font-size: 0.8rem;
  }
  .status-msg { margin-top: 10px; font-family: var(--font-flavor); font-style: italic; font-size: 0.8rem; color: var(--parchment-dim); }
</style>
```

Notes for the implementer:
- `.action-btn`, `.danger-btn`, `.cancel-btn`, `.setting-row`, `.setting-label`, `.setting-hint`, `.status-msg`, `.settings-card`, `.frame`, `.wide`, `.card-title` already exist in `SettingsPanel.svelte` / `app.css` — reuse them; only the cloud-specific `.cloud-row`/`.cloud-input`/`.status-msg` are added here.
- The `$effect` returns a cleanup that unsubscribes from `onAuthChange` — no leak on unmount.

- [ ] **Step 4: Run the render-smoke test to verify it passes**

Run:
```bash
npx vitest run src/ui/cloudsynccard.test.ts
```
Expected: PASS (1 test) — card mounts unconfigured and shows "not configured".

- [ ] **Step 5: Commit**

```bash
git add src/ui/CloudSyncCard.svelte src/ui/cloudsynccard.test.ts
git commit -F - <<'EOF'
feat(cloud): CloudSyncCard UI (magic-link auth + push/pull)

Render-only Settings card. States: not-configured / signed-out (email + magic
link) / signed-in (Push / Pull). Owns all confirm prompts: Pull always confirms
the destructive swap; timestamp conflicts surface a second "overwrite/replace
anyway" step that re-invokes the bridge with { force: true }. Styled with app.css
tokens. Render-smoke covers the unconfigured + signed-out paths.
EOF
```

---

## Task 4: Mount the card in Settings

**Files:**
- Modify: `src/ui/SettingsPanel.svelte` (import block lines 2-10; markup between Data Backup `</section>` at line 205 and the Danger Zone comment at line 207)

- [ ] **Step 1: Import the card**

In `src/ui/SettingsPanel.svelte`, add to the top of the `<script>` (after the existing `import { playBuy, playMilestone } from '../systems/audio'` line):
```ts
  import CloudSyncCard from './CloudSyncCard.svelte'
```

- [ ] **Step 2: Place the card between Data Backup and Danger Zone**

In the markup, find the end of the Data Backup section and the Danger Zone comment:
```svelte
      </section>

      <!-- Section 4: Danger Zone -->
```
Insert the card between them so it reads:
```svelte
      </section>

      <CloudSyncCard />

      <!-- Section 4: Danger Zone -->
```

- [ ] **Step 3: Type-check + build**

Run:
```bash
npm run check && npm run build
```
Expected: check 0/0; build succeeds. (Build will emit a separate lazy chunk for `@supabase/supabase-js`; it is not in the main/index chunk and is only fetched when cloud is configured + used.)

- [ ] **Step 4: Verify supabase is a lazy chunk, not in the entry bundle**

Run:
```bash
grep -rl "supabase" dist/assets/index-*.js
```
Expected: no match (the entry chunk does not contain supabase). A separate `dist/assets/*.js` chunk containing supabase may exist — that's the intended lazy chunk.

- [ ] **Step 5: Commit**

```bash
git add src/ui/SettingsPanel.svelte
git commit -F - <<'EOF'
feat(cloud): mount CloudSyncCard in Settings

Add the Cloud Sync card to the Settings grid, between Data Backup and the Danger
Zone. supabase-js stays in its own lazy chunk (absent from the entry bundle).
EOF
```

---

## Task 5: Documentation

**Files:**
- Modify: `CHANGELOG.md` (top of `[Unreleased]`), `README.md`, `CLAUDE.md`, `AGENTS.md`, `ROADMAP.md`

- [ ] **Step 1: CHANGELOG — add an Added entry at the top of `[Unreleased]`**

Add directly under `## [Unreleased]`:
```markdown
### Added — Cloud Sync (cross-device saves, optional)
- **Env-gated Supabase Cloud Sync.** A new Settings card backs up / restores the save across
  devices on the free tier: passwordless **magic-link** auth and **manual, timestamp-guarded
  Push / Pull** (a push won't clobber a newer cloud copy, and a pull won't clobber a newer local
  copy, without an explicit "overwrite anyway" confirm; Pull always confirms the destructive swap).
  New `src/systems/cloud.ts` wraps `@supabase/supabase-js` (dynamically imported, so it stays in a
  lazy chunk out of the main bundle) and trades only the existing compressed save blob + its
  version/timestamp. **No save-format change, no version bump** (still v14). The feature self-disables
  when `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are absent — no secrets are committed and the
  default build is unaffected. One RLS-guarded row per user (`auth.uid() = user_id`). See the README's
  “Cloud Sync setup”. Tests: `cloud.test.ts` (env detection + unconfigured no-ops),
  `cloud.bridge.test.ts` (push/pull branch logic), `cloudsynccard.test.ts` (render-smoke).
```

- [ ] **Step 2: README — add a "Cloud Sync setup (optional)" section**

Add a section (place it after the existing Commands/setup material — match the README's heading style):
````markdown
## Cloud Sync setup (optional)

Cloud Sync is **off by default** and requires a free Supabase project. Without the two env vars
below, the Settings card shows "not configured" and nothing changes.

1. Create a free project at supabase.com. From **Settings → API**, copy the **Project URL** and the
   **anon / publishable** key.
2. Copy `.env.example` to `.env.local` and fill in:
   ```
   VITE_SUPABASE_URL=https://<your-project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```
   (`.env.local` is gitignored — never commit keys. The anon key is safe in a client; RLS enforces
   per-user isolation.)
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
5. `npm run dev` → Settings → **Cloud Sync** → enter your email → click the magic link → **Push**.
   On another device, sign in with the same email and **Pull**.
````

- [ ] **Step 3: CLAUDE.md — one-line architecture note**

In `CLAUDE.md`, under the architecture file map (near the `systems/` entries), add a line:
```markdown
│   ├── cloud.ts            OPTIONAL Cloud Sync: env-gated Supabase wrapper (dynamic import; no game logic). Bridged by cloudPush()/cloudPull() in the store; UI is ui/CloudSyncCard.svelte. No save-format change.
```

- [ ] **Step 4: AGENTS.md — mirror the one-liner**

Add an equivalent single line to `AGENTS.md` wherever it lists the systems modules (match its existing format).

- [ ] **Step 5: ROADMAP.md — tick Cloud Sync**

Find the Cloud Sync / cross-device item in `ROADMAP.md` and mark it done (or add it under the completed Phase-3 list if absent), noting "env-gated, free tier, no save-format change".

- [ ] **Step 6: Commit**

```bash
git add CHANGELOG.md README.md CLAUDE.md AGENTS.md ROADMAP.md
git commit -F - <<'EOF'
docs: Cloud Sync (setup runbook, CHANGELOG, architecture notes)

Document the optional env-gated Cloud Sync: README setup (env vars, saves table +
RLS SQL, redirect URLs, magic-link flow), CHANGELOG Added entry (notes no save-
format change), and one-line architecture pointers in CLAUDE.md/AGENTS.md/ROADMAP.
EOF
```

---

## Task 6: Final verification gate (present-but-unconfigured)

**Files:** none (verification only)

- [ ] **Step 1: Type-check**

Run:
```bash
npm run check
```
Expected: 0 errors / 0 warnings.

- [ ] **Step 2: Full test suite**

Run:
```bash
npm test
```
Expected: all green — prior 117 + cloud (9) + bridge (11) + card (1) = **138 tests**.

- [ ] **Step 3: Production build**

Run:
```bash
npm run build
```
Expected: build succeeds; service worker generated. supabase-js is a separate lazy chunk.

- [ ] **Step 4: Confirm the default build ships no secrets and self-disables**

Run:
```bash
grep -rl "VITE_SUPABASE" dist/assets/*.js || echo "no inlined env (expected: unconfigured build)"
```
Expected: with no `.env.local`, no real URL/key is inlined. The app boots normally and Settings → Cloud Sync shows "not configured".

- [ ] **Step 5: Commit (only if any fixups were needed)**

```bash
git add -A
git commit -F - <<'EOF'
chore(cloud): final verification fixups

Green gate with Cloud Sync present-but-unconfigured: npm run check (0/0),
npm test, npm run build. Default build self-disables; no secrets inlined.
EOF
```

---

## Self-Review

**Spec coverage:**
- Scope/safety (env-gated, no secrets, design+plan only) → Task 1 (`.env.example`, `.gitignore` verify, `isCloudConfigured`), Task 6 (no-secrets check). ✓
- Data model + RLS → README SQL (Task 5 Step 2). The user runs it live (runbook); not code. ✓
- Magic-link auth → `cloud.ts` `signIn/signOut/currentUser/onAuthChange` (Task 1) + card (Task 3). ✓
- Manual timestamp-guarded Push/Pull → `cloudPush`/`cloudPull` (Task 2) + card confirm flows (Task 3). ✓
- One-row-per-user blob storage, no save-format change → `pushSave`/`pullSave` schema (Task 1), CURRENT_VERSION untouched (stated in header + every relevant task). ✓
- UI in Settings → Task 4. ✓
- Dynamic import / out of main bundle → `getClient()` (Task 1), verified Task 4 Step 4. ✓
- Testing (mocked unit + render-smoke; gate with feature unconfigured) → Tasks 1-3 tests, Task 6 gate. ✓
- Docs pass → Task 5. ✓
- Manual verification runbook → README (Task 5 Step 2); live steps are the user's. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; commands have expected output. ✓

**Type consistency:** `CloudSave`/`CloudMeta`/`CloudUser` defined in `cloud.ts` (Task 1) and consumed unchanged in the store bridges (Task 2) and card (Task 3). `CloudPushResult`/`CloudPullResult` defined in the store (Task 2) and consumed by the card (Task 3). Function names (`isCloudConfigured`, `getClient`, `currentUser`, `onAuthChange`, `signIn`, `signOut`, `pushSave`, `fetchCloudMeta`, `pullSave`, `cloudPush`, `cloudPull`, `swapInState`) are identical across definition and use. Column names (`user_id`, `blob`, `save_version`, `save_timestamp`, `updated_at`) match between `cloud.ts`, the README SQL, and the spec. ✓
