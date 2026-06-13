<script lang="ts">
  import { getState, saveGame } from '../stores/game.svelte'
  import { playMilestone } from '../systems/audio'

  interface Props {
    id: string
    title: string
    content: string
    style?: string
  }
  let { id, title, content, style = '' }: Props = $props()

  const gs = $derived(getState())
  const visible = $derived(gs && gs.settings && !gs.settings.seenTutorials?.[id])

  function dismiss() {
    if (gs && gs.settings) {
      if (!gs.settings.seenTutorials) {
        gs.settings.seenTutorials = {}
      }
      gs.settings.seenTutorials[id] = true
      playMilestone()
      saveGame(gs).catch(console.error)
    }
  }
</script>

{#if visible}
  <div class="tooltip-box frame bracketed" style={style} role="status">
    <div class="tooltip-header">
      <span class="tooltip-title">{title}</span>
      <button class="tooltip-close" onclick={dismiss} aria-label="dismiss onboarding tooltip">Got it!</button>
    </div>
    <p class="tooltip-body">{content}</p>
  </div>
{/if}

<style>
  .tooltip-box {
    margin: 8px 0;
    padding: 10px 14px;
    background: linear-gradient(180deg, var(--ink-700), var(--ink-850));
    border: 1px solid var(--brass);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 10px var(--brass-glow);
    animation: fade-in 0.4s ease;
    z-index: 10;
  }
  .tooltip-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    gap: 12px;
  }
  .tooltip-title {
    font-family: var(--font-display);
    font-size: 0.72rem;
    letter-spacing: 1px;
    color: var(--brass-bright);
    text-transform: uppercase;
  }
  .tooltip-close {
    background: var(--brass-deep);
    border: 1px solid var(--brass);
    border-radius: 3px;
    color: var(--ink-900);
    font-family: var(--font-mono);
    font-size: 0.65rem;
    font-weight: 700;
    padding: 2px 8px;
    cursor: pointer;
    transition: all 0.12s;
  }
  .tooltip-close:hover {
    background: var(--brass);
    box-shadow: 0 0 8px var(--brass-glow);
  }
  .tooltip-body {
    font-family: var(--font-flavor);
    font-style: italic;
    font-size: 0.84rem;
    line-height: 1.35;
    color: var(--parchment-dim);
  }
</style>
