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
