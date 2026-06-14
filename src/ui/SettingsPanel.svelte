<script lang="ts">
  import {
    getSettings,
    resetTutorials,
    exportActiveSave,
    importActiveSave,
    hardReset,
    getState,
    saveGame
  } from '../stores/game.svelte'
  import { playBuy, playMilestone } from '../systems/audio'
  import CloudSyncCard from './CloudSyncCard.svelte'

  const gameState = $derived(getState())
  const settings = $derived(getSettings())

  // Derive primitive properties to ensure Svelte 5 triggers reactive UI highlights instantly
  const numberFormat = $derived(settings?.numberFormat ?? 'short')
  const offlineProgress = $derived(settings?.offlineProgress ?? true)
  const autoSaveInterval = $derived(settings?.autoSaveInterval ?? 30000)

  let exportStr = $state('')
  let importStr = $state('')
  let importError = $state<string | null>(null)
  let importSuccess = $state(false)
  let copied = $state(false)
  let confirmReset = $state(false)

  // Generate export string when settings page is loaded/rendered
  $effect(() => {
    if (gameState) {
      exportStr = exportActiveSave()
    }
  })

  function handleCopy() {
    navigator.clipboard.writeText(exportStr)
      .then(() => {
        copied = true
        playBuy()
        setTimeout(() => copied = false, 2000)
      })
      .catch(console.error)
  }

  function handleImport() {
    importError = null
    importSuccess = false
    if (!importStr.trim()) {
      importError = 'Please paste a valid save string.'
      return
    }
    const ok = importActiveSave(importStr.trim())
    if (ok) {
      importSuccess = true
      importStr = ''
      playMilestone()
      // Regenerate export string
      exportStr = exportActiveSave()
    } else {
      importError = 'Failed to decode save. Please verify the code.'
    }
  }

  function handleHardReset() {
    if (!confirmReset) {
      confirmReset = true
      return
    }
    hardReset()
    confirmReset = false
    playMilestone()
    exportStr = exportActiveSave()
  }

  function handleResetTutorials() {
    resetTutorials()
    playMilestone()
    alert('Onboarding tooltips have been reset. Navigate back to Stages or Skills to see them.')
  }

  function toggleOffline() {
    if (settings && gameState) {
      settings.offlineProgress = !settings.offlineProgress
      saveGame(gameState).catch(console.error)
      playBuy()
    }
  }

  function selectFormat(fmt: 'short' | 'scientific' | 'engineering') {
    if (settings && gameState) {
      settings.numberFormat = fmt
      saveGame(gameState).catch(console.error)
      playBuy()
    }
  }

  function changeAutoSave(event: Event) {
    if (settings && gameState) {
      const select = event.target as HTMLSelectElement
      settings.autoSaveInterval = parseInt(select.value, 10)
      saveGame(gameState).catch(console.error)
      playBuy()
    }
  }
</script>

{#if settings}
  <div class="settings-wrap">
    <header class="settings-head frame bracketed">
      <div class="settings-title-block">
        <h2 class="settings-title">🔧 SYSTEM SETTINGS</h2>
        <p class="settings-sub">Configure the Fortune Engine runtime parameters and manage save state.</p>
      </div>
    </header>

    <div class="settings-grid">
      <!-- Section 1: Display & Performance -->
      <section class="settings-card frame">
        <h3 class="card-title">Performance &amp; Display</h3>
        <div class="setting-row">
          <span class="setting-label">Number Notation</span>
          <div class="format-toggles">
            <button
              class="format-btn {numberFormat === 'short' ? 'active' : ''}"
              onclick={() => selectFormat('short')}
            >
              Standard
            </button>
            <button
              class="format-btn {numberFormat === 'scientific' ? 'active' : ''}"
              onclick={() => selectFormat('scientific')}
            >
              Scientific
            </button>
            <button
              class="format-btn {numberFormat === 'engineering' ? 'active' : ''}"
              onclick={() => selectFormat('engineering')}
            >
              Engineering
            </button>
          </div>
        </div>

        <div class="setting-row">
          <span class="setting-label">Offline Progression</span>
          <button class="toggle-btn {offlineProgress ? 'active' : ''}" onclick={toggleOffline}>
            {offlineProgress ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        <div class="setting-row">
          <span class="setting-label">Auto-Save Frequency</span>
          <div class="select-wrapper">
            <select class="custom-select" value={autoSaveInterval} onchange={changeAutoSave}>
              <option value={10000}>10 Seconds</option>
              <option value={30000}>30 Seconds</option>
              <option value={60000}>1 Minute</option>
              <option value={300000}>5 Minutes</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Section 2: Tutorials & Diagnostics -->
      <section class="settings-card frame">
        <h3 class="card-title">Diagnostics &amp; Help</h3>
        <div class="setting-row vertical">
          <span class="setting-label">Onboarding System</span>
          <p class="setting-hint">If you missed the initial descriptions, you can reset all onboarding tooltips to explain stages, synergies, skills, and prestige.</p>
          <button class="action-btn" onclick={handleResetTutorials}>Reset Onboarding Tooltips</button>
        </div>
        
        <div class="setting-row meta-info">
          <span>Engine Version: <strong class="tnum">v{gameState?.version ?? 3}.0.0</strong></span>
          <span>Target Timestep: <strong class="tnum">20 Hz</strong></span>
        </div>
      </section>

      <!-- Section 3: Save Import / Export -->
      <section class="settings-card frame wide">
        <h3 class="card-title">Data Backup</h3>
        <div class="backup-grid">
          <div class="backup-col">
            <span class="setting-label">Export Save File</span>
            <p class="setting-hint">Copy this Base64 string to keep a manual backup of your progress.</p>
            <textarea class="backup-textarea" readonly onclick={(e) => (e.target as HTMLTextAreaElement).select()}>{exportStr}</textarea>
            <button class="action-btn copy-btn {copied ? 'success' : ''}" onclick={handleCopy}>
              {copied ? '✓ Copied to Clipboard!' : 'Copy Save Code'}
            </button>
          </div>

          <div class="backup-col">
            <span class="setting-label">Import Save File</span>
            <p class="setting-hint">Paste a Base64 save code here to overwrite your current state.</p>
            <textarea class="backup-textarea" placeholder="Paste save code here..." bind:value={importStr}></textarea>
            <button class="action-btn" onclick={handleImport}>Load Save Code</button>
            {#if importError}
              <div class="status-msg error">{importError}</div>
            {/if}
            {#if importSuccess}
              <div class="status-msg success">✓ Save imported successfully!</div>
            {/if}
          </div>
        </div>
      </section>

      <CloudSyncCard />

      <!-- Section 4: Danger Zone -->
      <section class="settings-card frame wide danger-card">
        <h3 class="card-title danger">Danger Zone</h3>
        <div class="setting-row reset-row">
          <div class="reset-desc">
            <span class="setting-label danger">Hard Reset Game</span>
            <p class="setting-hint danger">Delete all stage records, skill upgrades, unlocked slots, and total playtime. This action is irreversible.</p>
          </div>
          <button class="danger-btn {confirmReset ? 'confirming' : ''}" onclick={handleHardReset}>
            {confirmReset ? 'CLICK AGAIN TO CONFIRM!' : 'Wipe All Progress'}
          </button>
          {#if confirmReset}
            <button class="cancel-btn" onclick={() => confirmReset = false}>Cancel</button>
          {/if}
        </div>
      </section>
    </div>
  </div>
{/if}

<style>
  .settings-wrap {
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-bottom: 30px;
  }

  .settings-head {
    padding: 14px 18px;
    border-color: var(--brass-deep);
  }
  .settings-title { font-family: var(--font-display); font-size: 1rem; color: var(--brass-bright); letter-spacing: 1px; }
  .settings-sub { font-family: var(--font-flavor); font-style: italic; font-size: 0.9rem; color: var(--parchment-dim); margin-top: 4px; }

  .settings-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .settings-card {
    padding: 16px;
    background: var(--ink-800);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .settings-card.wide {
    grid-column: span 2;
  }
  .card-title {
    font-family: var(--font-display);
    font-size: 0.72rem;
    letter-spacing: 1.5px;
    color: var(--brass);
    text-transform: uppercase;
    border-bottom: 1px solid var(--line);
    padding-bottom: 8px;
    margin-bottom: 4px;
  }
  .card-title.danger {
    color: var(--danger);
  }

  .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .setting-row.vertical {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  .setting-label {
    font-size: 0.86rem;
    font-weight: 600;
    color: var(--parchment);
    letter-spacing: 0.3px;
  }
  .setting-label.danger {
    color: var(--danger);
  }
  .setting-hint {
    font-family: var(--font-flavor);
    font-style: italic;
    font-size: 0.78rem;
    line-height: 1.35;
    color: var(--parchment-dim);
  }
  .setting-hint.danger {
    color: color-mix(in srgb, var(--danger) 70%, var(--parchment-dim));
  }

  /* format toggles */
  .format-toggles {
    display: flex;
    border: 1px solid var(--line);
    border-radius: 4px;
    overflow: hidden;
  }
  .format-btn {
    background: var(--ink-900);
    border: none;
    border-right: 1px solid var(--line);
    color: var(--parchment-dim);
    padding: 6px 12px;
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    transition: all 0.15s;
  }
  .format-btn:last-child { border-right: none; }
  .format-btn:hover { background: var(--ink-700); color: var(--parchment); }
  .format-btn.active {
    background: var(--brass);
    color: var(--ink-900);
    font-weight: 700;
  }

  /* toggle button */
  .toggle-btn {
    background: var(--ink-900);
    border: 1px solid var(--line);
    border-radius: 4px;
    color: var(--parchment-dim);
    padding: 6px 16px;
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.76rem;
    transition: all 0.15s;
    min-width: 90px;
  }
  .toggle-btn:hover { border-color: var(--brass-deep); background: var(--ink-700); }
  .toggle-btn.active {
    border-color: var(--village);
    color: var(--village);
    background: color-mix(in srgb, var(--village) 10%, var(--ink-900));
  }

  /* select menu */
  .select-wrapper {
    position: relative;
  }
  .custom-select {
    background: var(--ink-900);
    border: 1px solid var(--line);
    border-radius: 4px;
    color: var(--parchment);
    padding: 5px 12px;
    font-family: var(--font-mono);
    font-size: 0.76rem;
    cursor: pointer;
    outline: none;
    transition: all 0.15s;
  }
  .custom-select:hover { border-color: var(--brass-deep); background: var(--ink-700); }

  /* buttons */
  .action-btn {
    background: var(--ink-900);
    border: 1px solid var(--brass-deep);
    border-radius: 4px;
    color: var(--brass);
    font-family: var(--font-mono);
    font-size: 0.76rem;
    padding: 6px 16px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .action-btn:hover {
    background: var(--brass-deep);
    color: var(--parchment);
    box-shadow: 0 0 10px var(--brass-glow);
  }
  .action-btn.copy-btn.success {
    border-color: var(--village);
    color: var(--village);
  }

  .meta-info {
    font-size: 0.74rem;
    color: var(--parchment-faint);
    border-top: 1px solid var(--line);
    padding-top: 10px;
    margin-top: 6px;
  }

  /* Backup grids */
  .backup-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  .backup-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .backup-textarea {
    width: 100%;
    height: 100px;
    background: var(--ink-900);
    border: 1px solid var(--line);
    border-radius: 4px;
    color: var(--parchment-dim);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    padding: 8px;
    resize: none;
    outline: none;
  }
  .backup-textarea:focus {
    border-color: var(--brass-deep);
  }
  .status-msg {
    font-size: 0.78rem;
    font-weight: 600;
    margin-top: 4px;
  }
  .status-msg.success { color: var(--village); }
  .status-msg.error { color: var(--danger); }

  /* Danger Zone */
  .danger-card {
    border-color: var(--danger);
  }
  .reset-row {
    width: 100%;
  }
  .reset-desc {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .danger-btn {
    background: var(--ink-900);
    border: 1px solid var(--danger);
    border-radius: 4px;
    color: var(--danger);
    font-family: var(--font-mono);
    font-size: 0.76rem;
    font-weight: 600;
    padding: 8px 18px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .danger-btn:hover {
    background: var(--danger);
    color: var(--ink-900);
    box-shadow: 0 0 12px rgba(214, 90, 90, 0.4);
  }
  .danger-btn.confirming {
    background: var(--danger);
    color: var(--ink-900);
    animation: pulse 1s infinite alternate;
  }
  .cancel-btn {
    background: transparent;
    border: 1px solid var(--line-bright);
    border-radius: 4px;
    color: var(--parchment-dim);
    font-family: var(--font-mono);
    font-size: 0.76rem;
    padding: 8px 14px;
    cursor: pointer;
  }
  .cancel-btn:hover {
    background: var(--ink-700);
    color: var(--parchment);
  }

  @keyframes pulse {
    from { box-shadow: 0 0 4px var(--danger); }
    to { box-shadow: 0 0 16px var(--danger); }
  }

  /* ── Mobile (≤ 720px): stack the 2-col settings + backup grids ── */
  @media (max-width: 720px) {
    .settings-grid, .backup-grid { grid-template-columns: 1fr; }
  }
</style>
