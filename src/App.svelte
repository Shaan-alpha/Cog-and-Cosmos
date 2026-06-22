<script lang="ts">
  import GameLayout from './ui/GameLayout.svelte'
  import OfflineSummary from './ui/OfflineSummary.svelte'
  import { getOfflineSummary, clearOfflineSummary, isInitialized } from './stores/game.svelte'

  let summary = $state<string | null>(null)

  $effect(() => {
    if (isInitialized()) {
      summary = getOfflineSummary()
    }
  })
</script>

<div class="app-root">
  {#if !isInitialized()}
    <div class="loading">
      <div class="cog-stack">
        <svg class="cog big" viewBox="0 0 100 100" aria-hidden="true">
          <path fill="currentColor" d="M50 12l6 4 7-2 4 6 7 1 1 7 6 4-2 7 4 6-4 6 2 7-6 4-1 7-7 1-4 6-7-2-6 4-6-4-7 2-4-6-7-1-1-7-6-4 2-7-4-6 4-6-2-7 6-4 1-7 7-1 4-6 7 2zM50 32a18 18 0 100 36 18 18 0 000-36z"/>
        </svg>
        <svg class="cog small" viewBox="0 0 100 100" aria-hidden="true">
          <path fill="currentColor" d="M50 12l6 4 7-2 4 6 7 1 1 7 6 4-2 7 4 6-4 6 2 7-6 4-1 7-7 1-4 6-7-2-6 4-6-4-7 2-4-6-7-1-1-7-6-4 2-7-4-6 4-6-2-7 6-4 1-7 7-1 4-6 7 2zM50 32a18 18 0 100 36 18 18 0 000-36z"/>
        </svg>
      </div>
      <p class="loading-title">COG &amp; COSMOS</p>
      <p class="loading-sub">winding the Fortune Engine…</p>
    </div>
  {:else}
    {#if summary}
      <OfflineSummary {summary} onClose={() => { clearOfflineSummary(); summary = null }} />
    {/if}
    <!-- A render-time throw in any panel is contained here instead of white-screening the
         whole app (which forced a refresh). The sim loop runs independently and keeps going. -->
    <svelte:boundary onerror={(e) => console.error('[ui] render error (contained):', e)}>
      <GameLayout />
      {#snippet failed(_error, reset)}
        <div class="ui-error">
          <p class="ui-error-title">A panel hit a snag.</p>
          <p class="ui-error-sub">Your game is still running and saving in the background.</p>
          <button class="ui-error-btn" onclick={reset}>Reload the view</button>
        </div>
      {/snippet}
    </svelte:boundary>
  {/if}
</div>

<style>
  .app-root {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 0.5rem;
    animation: fade-in 0.6s ease;
  }

  .cog-stack {
    position: relative;
    width: 120px;
    height: 120px;
    margin-bottom: 1rem;
    color: var(--brass);
    filter: drop-shadow(0 0 12px var(--brass-glow));
  }

  .cog { position: absolute; }
  .cog.big {
    width: 100px; height: 100px;
    top: 0; left: 0;
    animation: spin-cw 8s linear infinite;
  }
  .cog.small {
    width: 56px; height: 56px;
    bottom: -6px; right: -10px;
    color: var(--ember);
    opacity: 0.85;
    animation: spin-ccw 5s linear infinite;
  }

  .loading-title {
    font-family: var(--font-display);
    font-size: 1.6rem;
    color: var(--brass-bright);
    letter-spacing: 2px;
    animation: brass-pulse 2.5s ease-in-out infinite;
  }

  .loading-sub {
    font-family: var(--font-flavor);
    font-style: italic;
    font-size: 1rem;
    color: var(--parchment-dim);
  }

  .ui-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 0.5rem;
    text-align: center;
    padding: 1rem;
  }
  .ui-error-title {
    font-family: var(--font-display);
    font-size: 1.2rem;
    color: var(--brass-bright);
  }
  .ui-error-sub {
    font-family: var(--font-flavor);
    font-style: italic;
    color: var(--parchment-dim);
  }
  .ui-error-btn {
    margin-top: 0.75rem;
    padding: 0.5rem 1rem;
    font-family: var(--font-display);
    color: var(--ink-900);
    background: var(--brass);
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
</style>
