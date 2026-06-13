<script lang="ts">
  import {
    stageState as getStage,
    STAGE_DEFS,
    stageRates,
    warpState,
    warpChargeCap,
    warpMaxDuration,
    warpEfficiency,
    warpCost,
    castWarp,
    fmt,
  } from '../stores/game.svelte'
  import { playPrestige } from '../systems/audio'

  interface Props { stageId: string }
  let { stageId }: Props = $props()

  const def = $derived(STAGE_DEFS[stageId as keyof typeof STAGE_DEFS])
  const stageState = $derived(getStage(stageId))
  const warp = $derived(warpState())
  const maxT = $derived(warpMaxDuration())
  const warpEff = $derived(warpEfficiency())

  const unlockedStages = $derived.by(() => {
    const list = []
    for (const [sid, sdef] of Object.entries(STAGE_DEFS)) {
      if (getStage(sid)?.unlocked) list.push({ id: sid, name: sdef.name, emoji: sdef.emoji })
    }
    return list
  })

  let warpTarget = $state('village')
  let warpSeconds = $state(60)
  $effect(() => { if (warpSeconds > maxT) warpSeconds = maxT }) // keep within the (skill-dependent) cap

  const warpCostPreview = $derived(warpCost(warpSeconds))
  const warpGainPreview = $derived.by(() => stageRates(warpTarget).primary.mul(warpSeconds).mul(warpEff))
  const warpParadoxPreview = $derived.by(() => {
    const epochs = getStage('time')?.prestigeCurrency ?? 0
    return 0.5 * warpSeconds * Math.max(0.1, 1 - 0.005 * epochs)
  })
  const canWarp = $derived(
    warp.charges >= 1 && stageState.primaryAmount.gte(warpCostPreview) && (getStage(warpTarget)?.unlocked ?? false)
  )

  function getStageName(id: string) {
    return STAGE_DEFS[id as keyof typeof STAGE_DEFS]?.name ?? id
  }
  function handleWarp() {
    if (castWarp(warpTarget, warpSeconds) !== null) playPrestige()
  }
</script>

<div class="warp-tab animate-fade">
  <div class="warp-dashboard frame bracketed">
    <h3 class="panel-section-title">⏳ Cast a Warp Tick</h3>
    <p class="cast-desc">
      Spend Chronons + one charge to apply a burst of simulated time to any stage —
      instant offline-like gains. Every fold accrues Paradox, which throttles Time output until vented.
    </p>

    <div class="cast-opt">
      <label for="warp-target">Target Stage:</label>
      <select id="warp-target" bind:value={warpTarget} class="cast-select">
        {#each unlockedStages as us}
          <option value={us.id}>{us.emoji} {us.name}</option>
        {/each}
      </select>
    </div>

    <div class="cast-opt">
      <label for="warp-seconds">Warp Duration: {warpSeconds}s of game-time (max {maxT}s)</label>
      <input type="range" id="warp-seconds" min="30" max={maxT} step="30" bind:value={warpSeconds} class="amp-slider" />
    </div>

    <div class="warp-preview-grid">
      <div class="wp-cell">
        <span class="wp-label">Cost</span>
        <span class="wp-val tnum" class:no={stageState.primaryAmount.lt(warpCostPreview)}>{fmt(warpCostPreview)} {def.primaryCurrency.symbol}</span>
      </div>
      <div class="wp-cell">
        <span class="wp-label">Efficiency</span>
        <span class="wp-val tnum">×{warpEff.toFixed(2)}</span>
      </div>
      <div class="wp-cell">
        <span class="wp-label">Est. Gain ({getStageName(warpTarget)})</span>
        <span class="wp-val tnum gain">+{fmt(warpGainPreview)}</span>
      </div>
      <div class="wp-cell">
        <span class="wp-label">Paradox Added</span>
        <span class="wp-val tnum warn">+{warpParadoxPreview.toFixed(0)}</span>
      </div>
    </div>

    <button class="cast-btn frame" class:go={canWarp} disabled={!canWarp} onclick={handleWarp}>
      {warp.charges < 1 ? 'No Warp Charges' : 'Warp Time ⏩'}
    </button>
  </div>
</div>
