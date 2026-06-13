<script lang="ts">
  import FortuneEnginePanel from './FortuneEnginePanel.svelte'
  import StagePanel from './StagePanel.svelte'
  import SkillTree from './SkillTree.svelte'
  import AscensionPanel from './AscensionPanel.svelte'
  import TranscendencePanel from './TranscendencePanel.svelte'
  import OmegaPanel from './OmegaPanel.svelte'
  import SettingsPanel from './SettingsPanel.svelte'
  import StatsPanel from './StatsPanel.svelte'
  import { fortune, fmt, isStageUnlocked, transcendCount, transcendPreview, omegaCount, omegaPreview, getToasts, removeToast } from '../stores/game.svelte'
  import { STAGE_ROSTER } from '../data/roster'
  import { toggleMuted, isMuted } from '../systems/audio'

  // Pixi is purely decorative, so lazy-load it: this keeps pixi.js out of the
  // initial bundle (~loaded as a separate async chunk after first paint) and the
  // sim/UI never wait on it.
  const PixiCanvasModule = import('../pixi/PixiCanvas.svelte')

  type View = 'stages' | 'skills' | 'ascension' | 'stats' | 'settings' | 'transcendence' | 'omega'
  let view = $state<View>('stages')
  let activeStage = $state('village')
  let muted = $state(isMuted())
  const fort = $derived(fortune())
  const activeName = $derived(STAGE_ROSTER.find(d => d.id === activeStage)?.name ?? '')
  const canSeeTrans = $derived(transcendCount() > 0 || transcendPreview().aetherGained > 0)
  const canSeeOmega = $derived(omegaCount() > 0 || omegaPreview().omegaGained > 0)
  const toasts = $derived(getToasts())

  function selectStage(id: string) {
    if (isStageUnlocked(id)) activeStage = id
  }
  function onMute() { muted = toggleMuted() }
</script>

<div class="layout">
  <div class="toast-container" aria-live="polite">
    {#each toasts as t (t.id)}
      <div class="toast frame bracketed" role="status">
        <span>{t.text}</span>
        <button class="toast-x" onclick={() => removeToast(t.id)} aria-label="dismiss">✕</button>
      </div>
    {/each}
  </div>

  <!-- Masthead -->
  <header class="masthead">
    <div class="brand">
      <svg class="brand-cog" viewBox="0 0 100 100" aria-hidden="true">
        <path fill="currentColor" d="M50 12l6 4 7-2 4 6 7 1 1 7 6 4-2 7 4 6-4 6 2 7-6 4-1 7-7 1-4 6-7-2-6 4-6-4-7 2-4-6-7-1-1-7-6-4 2-7-4-6 4-6-2-7 6-4 1-7 7-1 4-6 7 2zM50 32a18 18 0 100 36 18 18 0 000-36z"/>
      </svg>
      <div class="brand-text">
        <span class="brand-title">COG &amp; COSMOS</span>
        <span class="brand-sub">the fortune engine</span>
      </div>
    </div>

    <nav class="view-nav">
      <button class="view-btn {view === 'stages' ? 'active' : ''}" onclick={() => view = 'stages'}>🏛 Stages</button>
      <button class="view-btn {view === 'skills' ? 'active' : ''}" onclick={() => view = 'skills'}>✦ Skills</button>
      <button class="view-btn {view === 'ascension' ? 'active' : ''}" onclick={() => view = 'ascension'}>🜲 Ascension</button>
      {#if canSeeTrans}
        <button class="view-btn tr-btn {view === 'transcendence' ? 'active' : ''}" onclick={() => view = 'transcendence'}>Æ Transcendence</button>
      {/if}
      {#if canSeeOmega}
        <button class="view-btn om-btn {view === 'omega' ? 'active' : ''}" onclick={() => view = 'omega'}>Ω Reality</button>
      {/if}
      <button class="view-btn {view === 'stats' ? 'active' : ''}" onclick={() => view = 'stats'}>📊 Stats</button>
      <button class="view-btn {view === 'settings' ? 'active' : ''}" onclick={() => view = 'settings'}>🔧 Settings</button>
    </nav>

    <div class="mast-right">
      <div class="fortune-readout">
        <span class="fr-star">★</span>
        <span class="fr-val tnum">{fmt(fort)}</span>
        <span class="fr-label">Fortune</span>
      </div>
      <button class="mute" class:muted onclick={onMute} title={muted ? 'Unmute' : 'Mute'} aria-label="toggle sound">
        {muted ? '🔇' : '🔊'}
      </button>
    </div>
  </header>

  {#if view === 'stages'}
  <!-- Stage dial bar: all 8 stages; locked ones tease the journey -->
  <nav class="dial-bar">
    {#each STAGE_ROSTER as def, i}
      {@const unlocked = isStageUnlocked(def.id)}
      <button
        class="dial {activeStage === def.id ? 'active' : ''} {unlocked ? '' : 'locked'}"
        onclick={() => selectStage(def.id)}
        disabled={!unlocked}
        title={unlocked ? def.name : `${def.name} — ${def.teaser} (locked)`}
        style="--sc: {def.color}"
      >
        <span class="dial-num">{String(i + 1).padStart(2, '0')}</span>
        <span class="dial-emoji">{def.emoji}</span>
        <span class="dial-name">{def.name}</span>
        {#if !unlocked}<span class="dial-lock">🔒</span>{/if}
      </button>
    {/each}
  </nav>

  <div class="content">
    <!-- Viewport: pixel scene -->
    <aside class="viewport-col bracketed">
      <div class="viewport-label">{activeName}</div>
      {#await PixiCanvasModule then { default: PixiCanvas }}
        {#key activeStage}
          <PixiCanvas stageId={activeStage} />
        {/key}
      {/await}
    </aside>

    <!-- Centre: stage controls -->
    <main class="stage-col">
      <StagePanel stageId={activeStage} />
    </main>

    <!-- Right: Fortune Engine -->
    <aside class="engine-col">
      <FortuneEnginePanel />
    </aside>
  </div>
  {:else if view === 'skills'}
    <div class="skills-view">
      <SkillTree />
    </div>
  {:else if view === 'ascension'}
    <div class="skills-view">
      <AscensionPanel />
    </div>
  {:else if view === 'transcendence'}
    <div class="skills-view">
      <TranscendencePanel />
    </div>
  {:else if view === 'omega'}
    <div class="skills-view">
      <OmegaPanel />
    </div>
  {:else if view === 'stats'}
    <div class="skills-view">
      <StatsPanel />
    </div>
  {:else if view === 'settings'}
    <div class="settings-view">
      <SettingsPanel />
    </div>
  {/if}
</div>

<style>
  .layout { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

  /* ── Stacking Toast Notifications ──────────────────────────────────────── */
  .toast-container {
    position: fixed;
    top: 64px; right: 20px;
    z-index: 9999;
    display: flex; flex-direction: column; gap: 8px;
    pointer-events: none;
  }
  .toast {
    pointer-events: auto;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 10px 16px;
    background: linear-gradient(180deg, var(--ink-700), var(--ink-850));
    border: 1px solid var(--brass);
    border-radius: 5px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55), 0 0 12px var(--brass-glow);
    color: var(--brass-bright);
    font-family: var(--font-mono); font-size: 0.84rem;
    animation: rise-in 0.3s var(--ease-spring) both;
    min-width: 250px;
    max-width: 380px;
  }
  .toast-x {
    background: none; border: none; color: var(--parchment-faint);
    cursor: pointer; font-size: 0.8rem; padding: 2px 4px;
  }
  .toast-x:hover { color: var(--parchment); }

  /* ── Masthead ──────────────────────────────────────────────────────────── */
  .masthead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 18px;
    background: linear-gradient(180deg, var(--ink-700), var(--ink-850));
    border-bottom: 1px solid var(--brass-deep);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
    flex-shrink: 0;
    animation: rise-in 0.5s var(--ease-out) both;
  }

  .brand { display: flex; align-items: center; gap: 10px; }
  .brand-cog {
    width: 32px; height: 32px; color: var(--brass);
    filter: drop-shadow(0 0 6px var(--brass-glow));
    animation: spin-cw 14s linear infinite;
  }
  .brand-text { display: flex; flex-direction: column; line-height: 1.1; }
  .brand-title { font-family: var(--font-display); font-size: 1rem; color: var(--brass-bright); letter-spacing: 1px; }
  .brand-sub { font-family: var(--font-flavor); font-style: italic; font-size: 0.78rem; color: var(--parchment-dim); }

  /* view nav (SPA top-level views) */
  .view-nav {
    display: flex;
    gap: 0;
    border: 1px solid var(--line);
    border-radius: 5px;
    overflow: hidden;
  }
  .view-btn {
    background: var(--ink-900);
    border: none;
    border-right: 1px solid var(--line);
    color: var(--parchment-dim);
    padding: 6px 16px;
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.78rem;
    letter-spacing: 0.5px;
    transition: all 0.15s;
  }
  .view-btn:last-child { border-right: none; }
  .view-btn:hover { background: var(--ink-700); color: var(--parchment); }
  .view-btn.active { background: var(--brass-deep); color: var(--ink-900); font-weight: 700; }
  .view-btn.active.tr-btn { background: #522b92; color: var(--parchment); font-weight: 700; border-color: var(--aether, #9d5fe3); box-shadow: 0 0 10px rgba(157, 95, 227, 0.4); }
  .view-btn.tr-btn:hover:not(.active) { color: var(--aether, #9d5fe3); }
  .view-btn.active.om-btn { background: #8a6a14; color: var(--parchment); font-weight: 700; border-color: var(--omega, #ffd76b); box-shadow: 0 0 10px rgba(255, 215, 107, 0.4); }
  .view-btn.om-btn:hover:not(.active) { color: var(--omega, #ffd76b); }

  .mast-right { display: flex; align-items: center; gap: 12px; }

  .fortune-readout {
    display: flex; align-items: baseline; gap: 8px;
    padding: 4px 16px;
    background: radial-gradient(ellipse at center, rgba(212, 168, 67, 0.12), transparent 75%);
    border: 1px solid var(--brass-deep);
    border-radius: 4px;
  }
  .fr-star { font-size: 1.1rem; color: var(--brass-bright); animation: star-twinkle 3s ease-in-out infinite; }
  .fr-val { font-size: 1.15rem; font-weight: 700; color: var(--brass-bright); }
  .fr-label { font-family: var(--font-flavor); font-style: italic; font-size: 0.8rem; color: var(--parchment-dim); }

  .mute {
    background: var(--ink-800);
    border: 1px solid var(--line);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.95rem;
    padding: 4px 8px;
    transition: all 0.15s;
  }
  .mute:hover { border-color: var(--brass-deep); background: var(--ink-700); }
  .mute.muted { opacity: 0.55; }

  /* ── Dial bar ──────────────────────────────────────────────────────────── */
  .dial-bar {
    display: flex;
    background: var(--ink-900);
    border-bottom: 1px solid var(--line);
    overflow-x: auto;
    flex-shrink: 0;
    animation: rise-in 0.5s var(--ease-out) 0.05s both;
  }

  .dial {
    position: relative;
    display: flex; flex-direction: column; align-items: center; gap: 1px;
    background: transparent;
    border: none;
    border-right: 1px solid var(--ink-700);
    color: var(--parchment-faint);
    padding: 6px 18px 5px;
    cursor: pointer;
    font-family: var(--font-mono);
    white-space: nowrap;
    flex: 1;
    min-width: 92px;
    transition: all 0.18s var(--ease-out);
  }
  .dial-num { font-size: 0.55rem; letter-spacing: 1px; opacity: 0.6; }
  .dial-emoji { font-size: 1.05rem; filter: grayscale(0.6) opacity(0.7); transition: filter 0.18s; }
  .dial-name { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 1px; }

  .dial:hover:not(.locked) { color: var(--parchment-dim); background: var(--ink-800); }
  .dial:hover:not(.locked) .dial-emoji { filter: grayscale(0.2) opacity(0.95); }

  .dial.active {
    color: var(--sc, var(--brass));
    background: linear-gradient(180deg, color-mix(in srgb, var(--sc) 14%, transparent), transparent);
  }
  .dial.active .dial-emoji { filter: none; }
  .dial.active::after {
    content: '';
    position: absolute; left: 12%; right: 12%; bottom: 0; height: 2px;
    background: var(--sc, var(--brass));
    box-shadow: 0 0 8px var(--sc, var(--brass));
  }

  .dial.locked { cursor: not-allowed; opacity: 0.5; }
  .dial.locked .dial-emoji { filter: grayscale(1) opacity(0.4); }
  .dial.locked .dial-name { color: var(--parchment-faint); opacity: 0.6; }
  .dial-lock {
    position: absolute; top: 4px; right: 8px;
    font-size: 0.55rem; opacity: 0.6;
  }

  /* ── Content deck ──────────────────────────────────────────────────────── */
  .content { display: flex; flex: 1; overflow: hidden; min-height: 0; gap: 1px; background: var(--ink-900); }

  .viewport-col {
    position: relative;
    width: 236px;
    flex-shrink: 0;
    background: var(--ink-850);
    overflow: hidden;
    display: flex; flex-direction: column; align-items: center;
    padding-top: 8px;
    animation: rise-in 0.55s var(--ease-out) 0.1s both;
  }
  .viewport-label {
    font-family: var(--font-display);
    font-size: 0.6rem; letter-spacing: 2px;
    color: var(--brass-deep);
    text-transform: uppercase; margin-bottom: 6px;
  }

  .stage-col { flex: 1; overflow-y: auto; padding: 14px 16px; min-width: 0; animation: rise-in 0.55s var(--ease-out) 0.15s both; }

  /* skills/settings views fill the deck area */
  .skills-view, .settings-view {
    flex: 1;
    overflow-y: auto;
    padding: 18px 20px;
    background: var(--ink-900);
    animation: rise-in 0.45s var(--ease-out) both;
  }

  .engine-col {
    width: 256px; flex-shrink: 0; overflow-y: auto;
    background: linear-gradient(180deg, var(--ink-800), var(--ink-850));
    border-left: 1px solid var(--brass-deep);
    animation: rise-in 0.55s var(--ease-out) 0.2s both;
  }
</style>
