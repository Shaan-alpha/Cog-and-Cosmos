<script lang="ts">
  interface Props { summary: string; onClose: () => void }
  let { summary, onClose }: Props = $props()
</script>

<div class="overlay" role="dialog" aria-modal="true">
  <div class="modal frame bracketed">
    <div class="modal-head">
      <span class="moon">🌙</span>
      <div>
        <h2 class="modal-title">WHILE YOU WERE AWAY</h2>
        <p class="modal-sub">the cogs kept turning</p>
      </div>
    </div>
    <hr class="brass-rule" />
    <pre class="summary">{summary}</pre>
    <button class="close-btn" onclick={onClose}>collect &amp; continue →</button>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(5, 4, 10, 0.78);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fade-in 0.3s ease;
  }

  .modal {
    max-width: 460px;
    width: 90%;
    padding: 22px 26px;
    border-color: var(--brass-deep);
    display: flex;
    flex-direction: column;
    gap: 14px;
    animation: rise-in 0.4s var(--ease-spring) both;
  }

  .modal-head { display: flex; align-items: center; gap: 12px; }
  .moon { font-size: 2rem; filter: drop-shadow(0 0 10px rgba(255, 215, 107, 0.4)); }
  .modal-title {
    font-family: var(--font-display);
    font-size: 0.95rem;
    letter-spacing: 1px;
    color: var(--brass-bright);
  }
  .modal-sub {
    font-family: var(--font-flavor); font-style: italic;
    font-size: 0.82rem; color: var(--parchment-dim);
    margin-top: 2px;
  }

  .summary {
    font-family: var(--font-mono);
    font-size: 0.86rem;
    line-height: 1.6;
    color: var(--parchment);
    white-space: pre-wrap;
    background: var(--ink-900);
    padding: 12px 14px;
    border-radius: 4px;
    border: 1px solid var(--line);
  }

  .close-btn {
    align-self: flex-end;
    background: var(--brass);
    border: none;
    color: var(--ink-900);
    padding: 9px 22px;
    cursor: pointer;
    font-family: var(--font-display);
    font-size: 0.72rem;
    letter-spacing: 0.5px;
    border-radius: 3px;
    transition: all 0.16s;
  }
  .close-btn:hover {
    background: var(--brass-bright);
    box-shadow: 0 0 18px var(--brass-glow);
    transform: translateY(-1px);
  }
</style>
