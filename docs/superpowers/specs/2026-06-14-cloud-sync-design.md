# Cloud Sync — Design Spec

> **Status:** Approved design (2026-06-14). Next step: implementation plan (`writing-plans`).
> **Save format:** unchanged. No `GameState` shape change, **no save-version bump** (stays v14).

## Overview

Let a player back up and move their Cog & Cosmos save across devices, on the free
tier, without changing the local save format or weakening the offline-first model.

The game already produces a single self-contained save artifact:

- `exportSave(state: GameState): string` — stamps `state.saveTimestamp = Date.now()`,
  serializes (`JSON` + Decimal `replacer`), and returns an **lz-string base64 blob**.
- `importSave(encoded: string): GameState | null` — decompresses, parses (Decimal
  `reviver`), and runs the **migrate ladder** (currently to v14); returns `null` on
  corrupt input.

Cloud Sync stores that blob in a one-row-per-user Supabase table and adds manual
**Push** / **Pull** controls. Everything is additive and the local IndexedDB +
localStorage path is untouched.

## Goals

- Manual **Push to cloud** / **Pull from cloud** of the existing save blob.
- Passwordless **magic-link** email auth.
- Cross-device: sign in on device B, Pull, continue.
- **Free tier only**, and **safe**: a user can read/write only their own row (RLS).
- **No secrets committed.** The feature is env-gated; an unconfigured build ships
  identically to today and self-disables the UI.

## Non-goals (YAGNI)

- No automatic background sync / last-write-wins. Manual, user-driven only.
- No save history / multiple slots / versioned backups — one row per user, overwritten.
- No real-time multiplayer, leaderboards, or server-side game logic.
- No OAuth providers, no passwords.
- No change to the local save format, migrate ladder, or `recomputeUpgrades`.

## Scope & safety (constraints)

- **Deliverable is design + spec + plan + an env-gated client integration.** I do not
  touch the user's Supabase account; the user provisions the project, runs the SQL, sets
  Auth, and does the live cross-device verification (runbook below).
- **No secrets in git.** The client reads only:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY` — the **publishable / anon** key, which is designed to be
    shipped in client bundles; per-user isolation is enforced by RLS, not by key secrecy.
  - Both live in `.env.local` (gitignored). A committed `.env.example` documents them.
- The **service-role** key is never referenced anywhere in the client or repo.
- If either env var is missing, `isCloudConfigured()` is `false`: the Cloud Sync card
  renders a "not configured" state, all cloud calls no-op, and the bundle excludes
  supabase-js (it is dynamically imported only when configured/used).

## Data model + RLS

One table, one row per user. The blob column holds exactly what `exportSave()` emits.

```sql
create table public.saves (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  blob           text        not null,           -- lz-string base64 (exportSave output)
  save_version   integer     not null,           -- GameState.version (e.g. 14)
  save_timestamp bigint      not null,           -- GameState.saveTimestamp (ms epoch)
  updated_at     timestamptz not null default now()
);

alter table public.saves enable row level security;

create policy "own row select" on public.saves
  for select using (auth.uid() = user_id);

create policy "own row insert" on public.saves
  for insert with check (auth.uid() = user_id);

create policy "own row update" on public.saves
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Notes:
- `auth.uid() = user_id` is the only access path — no cross-user reads or writes possible.
- One tiny row per player ⇒ trivially inside the free tier (DB size, MAU, bandwidth).
- `save_version` / `save_timestamp` are stored alongside the blob so the UI can show the
  cloud save's age/version and drive the conflict guard **without** decompressing the blob.

## Auth — magic link

Passwordless OTP via email:

1. User enters their email in the Cloud Sync card → `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: <app origin> } })`.
2. Supabase emails a magic link. Clicking it returns to the app; supabase-js
   (`detectSessionInUrl`) completes sign-in and **persists** the session
   (token storage + auto-refresh handled by the library).
3. On load, `supabase.auth.getSession()` restores the session; `onAuthStateChange`
   keeps the UI in sync. A **Sign out** button calls `supabase.auth.signOut()`.

User-side Auth setup (runbook): add the app origin(s) to **Auth → URL Configuration →
Redirect URLs**, and ensure email sending is enabled (Supabase's built-in email works for
low volume on free tier).

## Sync semantics — manual, timestamp-guarded

Both actions are explicit button presses. The guard prevents a stale device from silently
clobbering newer progress, without any auto-merge complexity.

**Push** (local → cloud):
1. `blob = exportSave(gs)` (this also refreshes `gs.saveTimestamp`).
2. Read the cloud row's `save_timestamp` (cheap; no blob fetch needed — select the metadata columns).
3. If cloud `save_timestamp` **>** local, confirm:
   *"Cloud save is newer (Xt) than this device (Yt). Overwrite the cloud copy?"* — abort on cancel.
4. `upsert` `{ user_id, blob, save_version: gs.version, save_timestamp: gs.saveTimestamp }`.
5. Toast success; update the last-sync status line.

**Pull** (cloud → local):
1. Fetch the row. If none, toast "No cloud save found." and stop.
2. If local `gs.saveTimestamp` **>** cloud, confirm:
   *"This device's save is newer than the cloud copy. Replace it anyway?"*
3. Confirm the destructive swap:
   *"Replace current progress with the cloud save from Xt?"* — abort on cancel.
4. `next = importSave(row.blob)`. If `null`, toast "Cloud save is corrupt — Pull aborted." and stop.
5. Swap live state via the **same path the Settings *Import* already uses** (replace `gs`,
   persist to IndexedDB, recompute derived multipliers), then toast success.

**Status line:** last Push/Pull time (this session), plus the cloud save's timestamp and
version when known.

Rationale (the one design call, approved): timestamp-guarded **manual** over silent
last-write-wins — conflict-safe, predictable, no merge engine.

## Code shape (isolation)

Game logic stays framework-agnostic; Svelte only renders; cloud I/O is a thin, testable wrapper.

### `src/systems/cloud.ts` (new) — supabase wrapper, no Svelte, no game logic

Trades only the blob string + metadata. supabase-js is **dynamically imported** inside
`getClient()` so it is absent from the bundle until cloud is configured/used.

```ts
export interface CloudSave { blob: string; saveVersion: number; saveTimestamp: number }
export interface CloudMeta { saveVersion: number; saveTimestamp: number } // metadata-only (for the guard)

export function isCloudConfigured(): boolean        // both VITE_ env vars present
export async function getClient(): Promise<SupabaseClient | null>  // lazy singleton; null if unconfigured
export async function currentUser(): Promise<{ email: string } | null>
export function onAuthChange(cb: (user: { email: string } | null) => void): () => void  // returns unsubscribe
export async function signIn(email: string): Promise<{ ok: boolean; error?: string }>
export async function signOut(): Promise<void>
export async function pushSave(s: CloudSave): Promise<{ ok: boolean; error?: string }>
export async function fetchCloudMeta(): Promise<CloudMeta | null>   // metadata columns only
export async function pullSave(): Promise<CloudSave | null>
```

### `src/stores/game.svelte.ts` (extend) — thin bridges + UI state

- `cloudPush()` / `cloudPull()` — orchestrate the semantics above: call
  `exportSave`/`importSave`, run the guards/confirms (via the existing toast/confirm
  pattern), reuse the Settings-import swap, and surface results as toasts.
- Accessor functions for UI reads (per the project's runes rule — never export raw
  `$state`): cloud-config flag pass-through, signed-in user, last-sync status, and a
  "busy" flag to disable buttons mid-request.

### `src/ui/CloudSyncCard.svelte` (new) — render-only

A `settings-card` placed in the Settings grid next to **Data Backup**. States:
- **Not configured:** explanatory copy + link to the README setup section.
- **Signed out:** email input + "Send magic link" button (+ "check your email" hint).
- **Signed in:** email + Sign-out, **Push** / **Pull** buttons, status line, busy/disabled states.

Mounted from `SettingsPanel.svelte` (the existing `settings-grid`), styled with app.css
design tokens — no hardcoded colors.

### `.env.example` (new) + `.gitignore`

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Confirm `.env.local` (and any `.env*` with secrets) is gitignored.

## Dependencies

- Add **`@supabase/supabase-js`** (free, OSS, MIT). Pin the **current stable** version;
  confirm the v2 auth/`from().upsert()` API via Context7 at plan time (per the project's
  "latest/best-stable" standing preference).
- No other new runtime deps.

## Testing strategy

Network/live auth cannot be verified headlessly, so split it:

- **Unit (vitest, mocked):**
  - `isCloudConfigured()` env logic (present / partial / absent).
  - Push/Pull **payload shaping** and the timestamp **guard** decisions, with a faked
    cloud module (inject or `vi.mock('../systems/cloud')`): e.g. push aborts when cloud is
    newer and the user cancels; pull aborts on `importSave → null`.
  - Store bridges `cloudPush()`/`cloudPull()` against the fake — assert the correct
    confirm/abort/swap branches and that local state swaps only on success.
- **Render smoke (jsdom):** `CloudSyncCard` mounts in each state (unconfigured / signed-out)
  without throwing.
- **Gate:** `npm run check` (0/0), `npm test` (all green), `npm run build` must pass with
  the feature **present but unconfigured** (no env) — proving the public build is unaffected
  and ships no supabase-js in the main chunk.

## Manual verification runbook (user, live)

1. Create a free Supabase project; copy **Project URL** + **anon/publishable key** into `.env.local`.
2. Run the `saves` table SQL + RLS policies (SQL editor).
3. Auth → URL Configuration: add the dev/prod origin(s) to Redirect URLs; confirm email sending.
4. `npm run dev`; open Settings → Cloud Sync shows the signed-out state.
5. Enter email → receive magic link → click → returns signed-in.
6. **Push.** Confirm a row appears in `saves` (one row, your `user_id`).
7. On a second device/browser: sign in with the same email → **Pull** → progress matches.
8. Conflict guard: make the two devices diverge; confirm the newer-timestamp warning fires
   on both Push and Pull.

## Docs to update (same pass as code)

- `CHANGELOG.md` — **Added: Cloud Sync** (env-gated; magic-link; manual push/pull; **no save-format change**).
- `README.md` — setup section: env vars, the SQL, Auth redirect URLs, free-tier note.
- `.env.example` — the two `VITE_` keys.
- `CLAUDE.md` / `AGENTS.md` — one line on the cloud module's place in the architecture and the env-gating rule.
- `ROADMAP.md` — tick Cloud Sync.
- `MASTER_PLAN.md` — note only if scope/design shifts (otherwise unchanged).

## Open questions

None — the conflict model (timestamp-guarded manual) is approved.
