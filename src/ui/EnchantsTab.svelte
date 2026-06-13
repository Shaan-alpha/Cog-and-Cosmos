<script lang="ts">
  import {
    stageState as getStage,
    STAGE_DEFS,
    activeEnchants,
    castEnchant,
    getState,
    fmt,
  } from '../stores/game.svelte'
  import { playMilestone } from '../systems/audio'

  interface Props { stageId: string }
  let { stageId }: Props = $props()

  const stageState = $derived(getStage(stageId))
  const activeEnch = $derived(activeEnchants())
  const maxEnchantSlots = $derived.by(() => {
    let slots = 2
    if (stageState.generators.archmage && stageState.generators.archmage.count >= 50) slots += 1
    const twinCasting = getStage('magic') ? ((getState().skills['magic:twin_casting'] ?? 0) >= 1) : false
    if (twinCasting) slots += 1
    return slots
  })

  const unlockedStages = $derived.by(() => {
    const list = []
    for (const [sid, sdef] of Object.entries(STAGE_DEFS)) {
      if (getStage(sid)?.unlocked) list.push({ id: sid, name: sdef.name, emoji: sdef.emoji })
    }
    return list
  })

  let castTargets = $state<Record<string, string>>({ quicken: 'village', greater_quicken: 'village', overcharge: 'village' })
  let castEssence = $state<Record<string, number>>({ quicken: 0, greater_quicken: 0, overcharge: 0 })

  const ENCHANT_DEFS = [
    { id: 'quicken', name: 'Quicken', pctCost: 0.05, baseMult: 3, ampPer1k: 0.5, description: 'Boosts a stage by 3x. Scales with Essence spent.' },
    { id: 'greater_quicken', name: 'Greater Quicken', pctCost: 0.20, baseMult: 7, ampPer1k: 1.0, description: 'Forces a stage by 7x. High multiplier, scales with Essence.' },
    { id: 'mass_enchant', name: 'Mass Enchant', pctCost: 0.40, baseMult: 2.5, ampPer1k: 0, description: 'Boosts ALL stages by 2.5x simultaneously. Cannot be Essence amplified.' },
    { id: 'overcharge', name: 'Overcharge', pctCost: 0.75, baseMult: 12, ampPer1k: 0.5, description: 'Speeds up a stage by 12x, but carries a 15% backfire risk (x0.5 mult).' },
  ]

  function getEnchantName(id: string) {
    if (id === 'quicken') return 'Quicken'
    if (id === 'greater_quicken') return 'Greater Quicken'
    if (id === 'mass_enchant') return 'Mass Enchant'
    if (id === 'overcharge') return 'Overcharge'
    return id
  }
  function getStageName(id: string) {
    return STAGE_DEFS[id as keyof typeof STAGE_DEFS]?.name ?? id
  }
  function estimateCap(id: string): number {
    const baseMult = id === 'quicken' ? 3 : id === 'greater_quicken' ? 7 : id === 'overcharge' ? 12 : 2.5
    const K = stageState.generators.astralconduit?.count ?? 0
    return baseMult * (1 + 0.25 * K)
  }
  function estimateMult(id: string, essence: number): number {
    const baseMult = id === 'quicken' ? 3 : id === 'greater_quicken' ? 7 : id === 'overcharge' ? 12 : 2.5
    const ampPer1k = id === 'quicken' ? 0.5 : id === 'greater_quicken' ? 1.0 : id === 'overcharge' ? 0.5 : 0
    const amp = (essence / 1000) * ampPer1k
    return Math.min(baseMult + amp, estimateCap(id))
  }
  function handleCast(id: string) {
    const target = id === 'mass_enchant' ? 'all' : castTargets[id]
    const essence = id === 'mass_enchant' ? 0 : castEssence[id]
    if (castEnchant(id, target, essence)) {
      playMilestone()
      if (id !== 'mass_enchant') castEssence[id] = 0
    }
  }
</script>

<div class="enchants-tab animate-fade">
  <!-- Active enchants list -->
  <div class="active-list frame bracketed">
    <h3 class="panel-section-title">🔮 Active Enchantment Slots ({activeEnch.length} / {maxEnchantSlots})</h3>
    {#if activeEnch.length === 0}
      <p class="empty-hint">No active enchantments. Cast a spell below to boost production!</p>
    {:else}
      <div class="active-grid">
        {#each activeEnch as enc}
          <div class="active-enc-card frame">
            <div class="card-head">
              <span class="enc-name">{getEnchantName(enc.id)}</span>
              <span class="enc-target" style="color: var(--{enc.targetStageId})">
                → {enc.targetStageId === 'all' ? 'All Stages' : getStageName(enc.targetStageId)}
              </span>
            </div>
            <div class="card-body">
              <span class="enc-mult tnum" class:backfire={enc.multiplier.lt(1)}>
                {enc.multiplier.lt(1) ? `⚠️ Backfire (×${fmt(enc.multiplier)})` : `×${fmt(enc.multiplier)} rate`}
              </span>
              <span class="enc-time tnum">{Math.ceil(enc.durationLeft)}s left</span>
            </div>
            <div class="duration-bar">
              <div class="duration-fill" style="width: {(enc.durationLeft / enc.totalDuration) * 100}%"></div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Casting dashboard -->
  <div class="cast-dashboard">
    <h3 class="panel-section-title">Cast Enchantments</h3>
    <div class="cast-cards">
      {#each ENCHANT_DEFS as edef}
        {@const costMana = stageState.primaryAmount.mul(edef.pctCost)}
        {@const isAffordable = stageState.primaryAmount.gt(0) && stageState.primaryAmount.gte(costMana)}
        <div class="cast-card frame bracketed">
          <div class="cast-top">
            <span class="cast-title">{edef.name}</span>
            <span class="cast-cost-mana tnum">{edef.pctCost * 100}% Mana ({fmt(costMana)})</span>
          </div>
          <p class="cast-desc">{edef.description}</p>

          {#if edef.id !== 'mass_enchant'}
            <!-- Target dropdown -->
            <div class="cast-opt">
              <label for="target-{edef.id}">Target Stage:</label>
              <select id="target-{edef.id}" bind:value={castTargets[edef.id]} class="cast-select">
                {#each unlockedStages as us}
                  <option value={us.id}>{us.emoji} {us.name}</option>
                {/each}
              </select>
            </div>

            <!-- Essence amp input -->
            <div class="cast-opt">
              <label for="essence-{edef.id}" class="amp-label">
                Essence Amp (+{edef.ampPer1k}x / 1k Essence):
              </label>
              <div class="amp-row">
                <input
                  type="range"
                  id="essence-{edef.id}"
                  min="0"
                  max={Math.min(10000, Math.floor(stageState.secondaryAmount.toNumber()))}
                  step="1000"
                  bind:value={castEssence[edef.id]}
                  class="amp-slider"
                />
                <input type="number" min="0" bind:value={castEssence[edef.id]} class="amp-num frame" />
              </div>
              <div class="amp-preview tnum">
                Est. Mult: ×{fmt(estimateMult(edef.id, castEssence[edef.id]))} (potency cap: ×{fmt(estimateCap(edef.id))})
              </div>
            </div>
          {/if}

          <button
            class="cast-btn frame"
            class:go={isAffordable && activeEnch.length < maxEnchantSlots}
            disabled={!isAffordable || activeEnch.length >= maxEnchantSlots}
            onclick={() => handleCast(edef.id)}
          >
            Cast {edef.name}
          </button>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .enchants-tab { display: flex; flex-direction: column; gap: 16px; }
  .active-list { padding: 12px 14px; background: var(--ink-850); }
  .active-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  @media (max-width: 720px) { .active-grid { grid-template-columns: 1fr; } }
  .active-enc-card {
    padding: 8px 11px; background: var(--ink-900); border-color: var(--sc);
    display: flex; flex-direction: column; gap: 4px; position: relative; overflow: hidden;
  }
  .active-enc-card .card-head { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 700; }
  .active-enc-card .card-head .enc-name { color: var(--sc); }
  .active-enc-card .card-head .enc-target { font-size: 0.74rem; }
  .active-enc-card .card-body { display: flex; justify-content: space-between; font-size: 0.74rem; }
  .active-enc-card .card-body .enc-mult { color: var(--positive); }
  .active-enc-card .card-body .enc-mult.backfire { color: var(--danger); }
  .active-enc-card .card-body .enc-time { color: var(--parchment-dim); }
  .duration-bar { width: 100%; height: 2px; background: var(--ink-800); margin-top: 4px; }
  .duration-fill { height: 100%; background: var(--sc); transition: width 0.1s linear; }

  .cast-dashboard .cast-cards { display: flex; flex-direction: column; gap: 10px; }
  .cast-card {
    padding: 12px 14px; background: var(--ink-850); border-color: var(--line-bright);
    display: flex; flex-direction: column; gap: 8px;
  }
  .cast-top { display: flex; justify-content: space-between; align-items: baseline; }
  .cast-title { font-family: var(--font-display); font-size: 0.86rem; color: var(--sc); letter-spacing: 0.5px; }
  .cast-cost-mana { font-size: 0.74rem; color: var(--parchment-dim); }
  .amp-row { display: flex; align-items: center; gap: 12px; }
  .amp-num {
    width: 70px; background: var(--ink-900); border: 1px solid var(--line); border-radius: 4px;
    color: var(--parchment); padding: 4px 8px; text-align: center; font-family: var(--font-mono);
  }
  .amp-preview { font-size: 0.72rem; color: var(--sc); margin-top: 2px; }
</style>
