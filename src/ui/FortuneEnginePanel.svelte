<script lang="ts">
  import {
    engine,
    fortune,
    fortuneRate,
    fmt,
    fmtRate,
    STAGE_DEFS,
    assignEngineSlotAt,
    stageState
  } from '../stores/game.svelte'
  import OnboardingTooltip from './OnboardingTooltip.svelte'

  const eng  = $derived(engine())
  const fort = $derived(fortune())
  const rate = $derived(fortuneRate())

  // Spin faster as mint rate rises (clamped 2s..22s per revolution)
  const spinDur = $derived(Math.max(2, Math.min(22, 22 / (1 + rate.toNumber() * 4))))

  const unlockedStages = $derived.by(() => {
    const list: { id: string; name: string; emoji: string }[] = []
    for (const [sid, sdef] of Object.entries(STAGE_DEFS)) {
      if (stageState(sid)?.unlocked) {
        list.push({ id: sid, name: sdef.name, emoji: sdef.emoji })
      }
    }
    return list
  })

  function handleSlotChange(index: number, stageId: string) {
    assignEngineSlotAt(index, stageId)
  }
</script>

<div class="engine">
  <!-- Machine head -->
  <div class="machine">
    <svg class="cog primary" viewBox="0 0 100 100" style="animation-duration: {spinDur}s" aria-hidden="true">
      <path fill="currentColor" d="M50 8l5 5 7-3 4 6 8 0 1 8 7 4-2 7 5 6-5 6 2 7-7 4-1 8-8 0-4 6-7-3-5 5-5-5-7 3-4-6-8 0-1-8-7-4 2-7-5-6 5-6-2-7 7-4 1-8 8 0 4-6 7 3z"/>
      <circle cx="50" cy="50" r="15" fill="var(--ink-850)"/>
      <circle cx="50" cy="50" r="14" fill="none" stroke="currentColor" stroke-width="1.5"/>
    </svg>
    <svg class="cog secondary" viewBox="0 0 100 100" style="animation-duration: {spinDur * 0.62}s" aria-hidden="true">
      <path fill="currentColor" d="M50 8l5 5 7-3 4 6 8 0 1 8 7 4-2 7 5 6-5 6 2 7-7 4-1 8-8 0-4 6-7-3-5 5-5-5-7 3-4-6-8 0-1-8-7-4 2-7-5-6 5-6-2-7 7-4 1-8 8 0 4-6 7 3z"/>
      <circle cx="50" cy="50" r="13" fill="var(--ink-850)"/>
    </svg>
  </div>

  <div class="title-block">
    <h3 class="title">FORTUNE ENGINE</h3>
    <p class="subtitle">surplus, rendered to gold</p>
  </div>

  <OnboardingTooltip
    id="fortune-engine"
    title="The Fortune Engine"
    content="The Engine automatically extracts surplus from all unlocked stages and mills it into Fortune (★). Tap 'Skills' in the top nav to spend your Fortune on permanent global multipliers!"
  />

  <!-- ★ readout -->
  <div class="readout">
    <div class="star">★</div>
    <div class="nums">
      <span class="val tnum">{fmt(fort)}</span>
      <span class="rate tnum">+{fmtRate(rate)} ★</span>
    </div>
  </div>

  <hr class="brass-rule" />

  <!-- Slots -->
  <div class="slots">
    <div class="slots-head">
      <span class="slots-title">slots</span>
      <span class="slots-count tnum">{eng.slots.filter(Boolean).length} / 8</span>
    </div>
    {#each Array(8) as _, i}
      {@const sid = eng.slots[i]}
      {@const def = sid ? STAGE_DEFS[sid as keyof typeof STAGE_DEFS] : null}
      {#if def}
        <div class="slot filled" style="--sc: {def.color}">
          <span class="slot-emoji">{def.emoji}</span>
          <select
            class="slot-select"
            value={sid}
            onchange={(e) => handleSlotChange(i, (e.target as HTMLSelectElement).value)}
            aria-label="Assign stage to slot {i + 1}"
          >
            {#each unlockedStages as stage}
              <option value={stage.id} disabled={eng.slots.includes(stage.id) && sid !== stage.id}>
                {stage.emoji} {stage.name}
              </option>
            {/each}
            <option value="">🚫 Disconnect</option>
          </select>
          <span class="slot-weight tnum">×{def.fortuneWeight.toFixed(1)}</span>
        </div>
      {:else}
        <div class="slot empty">
          <span class="slot-dot">◌</span>
          <select
            class="slot-select"
            value=""
            onchange={(e) => handleSlotChange(i, (e.target as HTMLSelectElement).value)}
            aria-label="Assign stage to slot {i + 1}"
          >
            <option value="" disabled selected>Empty bay (click to wire)</option>
            {#each unlockedStages as stage}
              {#if !eng.slots.includes(stage.id)}
                <option value={stage.id}>
                  {stage.emoji} {stage.name}
                </option>
              {/if}
            {/each}
          </select>
        </div>
      {/if}
    {/each}
  </div>

  <hr class="brass-rule" />

  <div class="stat-row">
    <span>engine multiplier</span>
    <strong class="tnum">{fmt(eng.engineMult)}×</strong>
  </div>

  <p class="lore">
    The Engine draws idle surplus from each bay and mills it into Fortune (★).
    Wire more worlds into its bays as you unlock them — every stage you feed turns
    the cogs a little faster.
  </p>
</div>

<style>
  .engine {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 14px 14px 18px;
  }

  /* ── Machine head ──────────────────────────────────────────────────────── */
  .machine {
    position: relative;
    width: 96px;
    height: 80px;
    margin-top: 4px;
  }
  .cog { position: absolute; color: var(--brass); }
  .cog.primary {
    width: 74px; height: 74px;
    top: 0; left: 4px;
    filter: drop-shadow(0 0 10px var(--brass-glow));
    animation: spin-cw linear infinite;
  }
  .cog.secondary {
    width: 46px; height: 46px;
    bottom: -4px; right: -2px;
    color: var(--ember);
    opacity: 0.9;
    filter: drop-shadow(0 0 6px rgba(224, 122, 60, 0.4));
    animation: spin-ccw linear infinite;
  }

  .title-block { text-align: center; }
  .title {
    font-family: var(--font-display);
    font-size: 0.82rem;
    letter-spacing: 1px;
    color: var(--brass-bright);
  }
  .subtitle {
    font-family: var(--font-flavor); font-style: italic;
    font-size: 0.8rem; color: var(--parchment-faint);
    margin-top: 2px;
  }

  /* ── Readout ───────────────────────────────────────────────────────────── */
  .readout {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 14px;
    background: radial-gradient(ellipse at 30% 50%, rgba(212, 168, 67, 0.14), transparent 70%), var(--ink-900);
    border: 1px solid var(--brass-deep);
    border-radius: 5px;
  }
  .star {
    font-size: 2rem; color: var(--brass-bright);
    animation: star-twinkle 2.4s ease-in-out infinite;
    filter: drop-shadow(0 0 8px var(--brass-glow));
  }
  .nums { display: flex; flex-direction: column; line-height: 1.15; }
  .val { font-size: 1.5rem; font-weight: 700; color: var(--brass-bright); }
  .rate { font-size: 0.74rem; color: var(--positive); opacity: 0.9; }

  /* ── Slots ─────────────────────────────────────────────────────────────── */
  .slots { width: 100%; display: flex; flex-direction: column; gap: 4px; }
  .slots-head {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-bottom: 2px;
  }
  .slots-title {
    font-family: var(--font-display); font-size: 0.6rem;
    letter-spacing: 1.5px; color: var(--brass-deep); text-transform: uppercase;
  }
  .slots-count { font-size: 0.72rem; color: var(--parchment-faint); }

  .slot {
    display: flex; align-items: center; gap: 8px;
    padding: 5px 10px;
    border-radius: 3px;
    font-size: 0.78rem;
  }
  .slot.filled {
    background: color-mix(in srgb, var(--sc) 9%, var(--ink-800));
    border: 1px solid color-mix(in srgb, var(--sc) 45%, var(--line));
    color: var(--sc);
  }
  .slot-emoji { font-size: 0.95rem; }
  .slot-weight { color: var(--parchment-faint); font-size: 0.7rem; }
  .slot.empty {
    background: var(--ink-850);
    border: 1px dashed var(--line);
    color: var(--parchment-faint);
    opacity: 0.5;
  }
  .slot-dot { font-size: 0.9rem; }
  
  .slot-select {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-family: inherit;
    font-size: 0.78rem;
    color: inherit;
    cursor: pointer;
    padding: 2px 0;
  }
  .slot-select option {
    background-color: var(--ink-900);
    color: var(--parchment);
  }
  .slot-select option:disabled {
    color: var(--parchment-faint);
    opacity: 0.4;
  }

  /* ── Stat + lore ───────────────────────────────────────────────────────── */
  .stat-row {
    width: 100%;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 0.78rem; color: var(--parchment-dim);
    font-family: var(--font-flavor); font-style: italic;
  }
  .stat-row strong { font-family: var(--font-mono); font-style: normal; color: var(--brass); }

  .lore {
    font-family: var(--font-flavor); font-style: italic;
    font-size: 0.78rem; line-height: 1.5;
    color: var(--parchment-faint);
    text-align: center;
    margin-top: 2px;
  }
</style>
