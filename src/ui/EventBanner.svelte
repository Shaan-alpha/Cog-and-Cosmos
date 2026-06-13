<script lang="ts">
  import { claimableEvent, activeEventBuff, claimEvent } from '../stores/game.svelte'
  import { EVENT_BY_ID } from '../data/events'

  const CLAIM_WINDOW = 30   // mirrors EVENT_CLAIM_WINDOW (store) — for the countdown bar scale
  const pending = $derived(claimableEvent())
  const buff = $derived(activeEventBuff())
  const pendingDef = $derived(pending ? EVENT_BY_ID[pending.id] : null)
  const buffDef = $derived(buff ? EVENT_BY_ID[buff.id] : null)
  const claimPct = $derived(pendingDef ? Math.round((pendingDef.mult - 1) * 100) : 0)
</script>

{#if pending && pendingDef}
  <div class="event-banner frame bracketed" role="alert">
    <span class="ev-icon">{pendingDef.icon}</span>
    <div class="ev-text">
      <span class="ev-name">{pendingDef.name}</span>
      <span class="ev-desc">+{claimPct}% production · {pendingDef.duration}s</span>
    </div>
    <button class="ev-claim" onclick={() => claimEvent()}>Claim</button>
    <div class="ev-bar"><div class="ev-bar-fill" style="width: {Math.max(0, (pending.timeLeft / CLAIM_WINDOW) * 100)}%"></div></div>
  </div>
{/if}

{#if buff && buffDef}
  <div class="event-pill" title="{buffDef.name} active">
    <span>⚡ {buffDef.name}</span>
    <span class="pill-rem tnum">{Math.ceil(buff.durationLeft)}s</span>
  </div>
{/if}

<style>
  .event-banner {
    position: fixed; top: 64px; left: 50%; transform: translateX(-50%); z-index: 9998;
    display: flex; align-items: center; gap: 12px; padding: 10px 14px;
    background: linear-gradient(180deg, var(--ink-700), var(--ink-850));
    border-color: var(--brass-bright); box-shadow: 0 8px 24px rgba(0,0,0,0.55), 0 0 16px var(--brass-glow);
    animation: rise-in 0.3s var(--ease-spring) both; max-width: 92vw;
  }
  .ev-icon { font-size: 1.5rem; }
  .ev-text { display: flex; flex-direction: column; line-height: 1.2; }
  .ev-name { font-family: var(--font-display); font-size: 0.8rem; color: var(--brass-bright); letter-spacing: 0.5px; }
  .ev-desc { font-family: var(--font-flavor); font-style: italic; font-size: 0.76rem; color: var(--parchment-dim); }
  .ev-claim {
    padding: 6px 16px; background: linear-gradient(135deg, var(--brass-deep), var(--brass));
    border: 1px solid var(--brass-bright); color: var(--ink-900); font-family: var(--font-display);
    font-size: 0.74rem; letter-spacing: 1px; border-radius: 4px; cursor: pointer;
  }
  .ev-claim:hover { background: var(--brass-bright); box-shadow: 0 0 12px var(--brass-glow); }
  .ev-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: var(--ink-900); border-radius: 0 0 4px 4px; overflow: hidden; }
  .ev-bar-fill { height: 100%; background: var(--brass-bright); transition: width 0.1s linear; }

  .event-pill {
    position: fixed; top: 64px; left: 20px; z-index: 9998;   /* left, so it never overlaps the top-right toast stack */
    display: flex; align-items: center; gap: 8px; padding: 5px 12px;
    background: var(--ink-800); border: 1px solid var(--brass-deep); border-radius: 999px;
    font-family: var(--font-mono); font-size: 0.78rem; color: var(--brass-bright);
    box-shadow: 0 0 10px var(--brass-glow); animation: rise-in 0.3s var(--ease-out) both;
  }
  .pill-rem { color: var(--parchment-dim); }
  @media (max-width: 720px) {
    .event-banner { top: auto; bottom: calc(12px + var(--safe-bottom, 0px)); }
    .event-pill { top: auto; bottom: calc(64px + var(--safe-bottom, 0px)); }
  }
</style>
