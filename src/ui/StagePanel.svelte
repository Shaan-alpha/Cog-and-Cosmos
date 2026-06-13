<script lang="ts">
  import {
    stageState as getStage,
    buyGenerator,
    prestigeStage,
    prestigePreview,
    genCost,
    canAffordGen,
    stageRates,
    bindingInfos,
    manualGather,
    gatherPreview,
    fmt,
    fmtRate,
    STAGE_DEFS,
    spaceBuffers,
    buyLocalSkill,
    getState,
    skillLevel,
    autoBuyUnlocked,
    isAutoBuyOn,
    toggleAutoBuy,
    setAutoBuyMode,
    setAutoBuyReserve,
    setAutoBuyMilestoneSnipe,
    toggleAutoBuyVault,
    warpState,
    warpChargeCap,
    WARP_RECHARGE,
  } from '../stores/game.svelte'
  import { playBuy, playMilestone, playPrestige } from '../systems/audio'
  import OnboardingTooltip from './OnboardingTooltip.svelte'
  import EnchantsTab from './EnchantsTab.svelte'
  import WarpTab from './WarpTab.svelte'
  import DuplicationTab from './DuplicationTab.svelte'
  import { LOCAL_SKILLS_BY_STAGE } from '../data/skills/local'
  import { D, ZERO, ONE } from '../systems/Decimal'
  import { BALANCE, nextMilestoneInfo } from '../systems/formulas'

  interface Props { stageId: string }
  let { stageId }: Props = $props()

  const def = $derived(STAGE_DEFS[stageId as keyof typeof STAGE_DEFS])
  const stageState = $derived(getStage(stageId))
  const rates = $derived(stageRates(stageId))
  const bindings = $derived(bindingInfos(stageId))
  const gather = $derived(gatherPreview(stageId))

  // Stage-flavoured verb for the manual gather button.
  const GATHER_VERB: Record<string, string> = { village: 'Collect', farm: 'Harvest', mine: 'Mine', factory: 'Forge', magic: 'Channel', space: 'Siphon' }
  const gatherVerb = $derived(GATHER_VERB[stageId] ?? 'Gather')

  function handleGather() {
    manualGather(stageId)
    playBuy()
  }

  let buyMode = $state<1 | 10 | 100 | -1>(1)
  const prestigeGainPreview = $derived(prestigePreview(stageId))

  // Auto-buyer (unlocks after the stage's first prestige).
  const autoUnlocked = $derived(autoBuyUnlocked(stageId))
  const autoOn = $derived(isAutoBuyOn(stageId))
  function handleToggleAuto() { toggleAutoBuy(stageId) }

  // Milestone tiers are owned centrally by formulas.ts BALANCE — single source of truth.
  function handleBuy(genId: string) {
    const before = stageState.generators[genId]?.count ?? 0
    const ok = buyGenerator(stageId, genId, buyMode)
    if (!ok) return
    const after = stageState.generators[genId]?.count ?? 0
    const crossedMilestone = BALANCE.milestoneTiers.some(m => before < m && after >= m)
    if (crossedMilestone) playMilestone()
    else playBuy()
  }

  function handlePrestige() {
    const gain = prestigePreview(stageId)
    if (gain === 0) return
    const ok = confirm(
      `Prestige the ${def.name}?\n\nYou will earn +${gain} ${def.prestigeCurrency.name} ` +
      `but reset all generators and ${def.primaryCurrency.name} in this stage.`
    )
    if (ok) { prestigeStage(stageId); playPrestige() }
  }

  // ── Tab navigation ──
  let activeTab = $state<'generators' | 'enchants' | 'warp' | 'duplication' | 'skills'>('generators')
  $effect(() => {
    if (stageId) activeTab = 'generators'
  })

  // ── Space starvation details ──
  const buffers = $derived(spaceBuffers())
  const isBufferTanksOwned = $derived(skillLevel('space:buffer_tanks') >= 1)
  const isSelfMiningDronesOwned = $derived(skillLevel('space:self_mining_drones') >= 1)
  const isPowerRecaptureOwned = $derived(skillLevel('space:power_recapture') >= 1)
  const oreThroughputLvl = $derived(skillLevel('space:ore_throughput'))

  const spaceStarvation = $derived.by(() => {
    if (stageId !== 'space') return null
    const sState = stageState
    const smelter = sState.generators.smelter?.count ?? 0
    const refinery = sState.generators.refinery?.count ?? 0
    const dyson = sState.generators.dysonframe?.count ?? 0
    const probe = sState.generators.probe?.count ?? 0
    const colony = sState.generators.colony?.count ?? 0
    const forge = sState.generators.starforge?.count ?? 0
    const gate = sState.generators.warpgate?.count ?? 0

    let demandOre = 5 * smelter + 12 * refinery + 40 * dyson
    let demandPower = 2 * smelter + 5 * refinery + 30 * dyson

    if (isSelfMiningDronesOwned) demandOre *= 0.92
    if (isPowerRecaptureOwned) demandPower *= 0.75
    if (oreThroughputLvl > 0) demandOre *= (1 - 0.10 * oreThroughputLvl)

    const stateOre = isBufferTanksOwned ? buffers.ore : (getStage('mine')?.primaryAmount ?? ZERO)
    const statePower = isBufferTanksOwned ? buffers.power : (getStage('factory')?.secondaryAmount ?? ZERO)

    const oreRatio = demandOre > 0 ? stateOre.toNumber() / demandOre : 1
    const powerRatio = demandPower > 0 ? statePower.toNumber() / demandPower : 1
    const alloyStarve = Math.min(1, Math.max(0, Math.min(oreRatio, powerRatio)))

    const demandAlloy = 3 * probe + 10 * colony + 90 * forge + 200 * gate
    const stardustStarve = demandAlloy > 0 ? Math.min(1, Math.max(0, sState.secondaryAmount.toNumber() / demandAlloy)) : 1

    return {
      demandOre,
      demandPower,
      demandAlloy,
      oreRatio: Math.min(1, oreRatio),
      powerRatio: Math.min(1, powerRatio),
      alloyStarve,
      stardustStarve
    }
  })

  const familiarStarve = $derived.by(() => {
    if (stageId !== 'magic') return ONE
    const magic = stageState
    const familiarCount = magic.generators.familiar?.count ?? 0
    if (familiarCount === 0) return ONE
    const grainDemand = familiarCount * 0.05
    const essenceDemand = familiarCount * 0.10

    const farmGrain = getStage('farm')?.primaryAmount ?? ZERO
    const magicEssence = magic.secondaryAmount ?? ZERO

    const grainRatio = grainDemand > 0 ? farmGrain.div(D(grainDemand)).min(ONE) : ONE
    const essenceRatio = essenceDemand > 0 ? magicEssence.div(D(essenceDemand)).min(ONE) : ONE
    return grainRatio.min(essenceRatio).max(ZERO)
  })

  // ── Time Paradox banner state (the Warp tab itself lives in WarpTab.svelte) ──
  const warp = $derived(warpState())
  const chargeCap = $derived(warpChargeCap())
  const paradox = $derived(stageState.secondaryAmount)
  // Throttle preview: 1 / (1 + sqrt(paradox/200)).
  const throttle = $derived(1 / (1 + Math.sqrt(Math.max(0, paradox.toNumber()) / 200)))

  // ── Local Skills tree ──
  function handleBuyLocalSkill(nodeId: string) {
    if (buyLocalSkill(nodeId, stageId)) {
      playMilestone()
    }
  }
  function stClass(nodeId: string): string {
    if (nodeId.startsWith('magic')) return 'magic'
    if (nodeId.startsWith('time')) return 'time'
    if (nodeId.startsWith('multiverse')) return 'multiverse'
    return 'space'
  }
</script>

{#if def}
  <div class="stage-panel" style="--sc: {def.color}; --sbg: {def.bgColor}">

    <!-- Stage header -->
    <header class="stage-head frame bracketed">
      <span class="stage-emoji">{def.emoji}</span>
      <div class="stage-meta">
        <h2 class="stage-name">{def.name}</h2>
        <p class="stage-flavor">{def.description}</p>
      </div>
      {#if bindings.length}
        <div class="bindings">
          {#each bindings as b}
            <div class="binding" style="--bc: {b.color}" title="{b.label}: {b.detail}">
              <span class="binding-icon">{b.icon}</span>
              <div class="binding-text">
                <span class="binding-label">{b.label}</span>
                <span class="binding-mult tnum">×{fmt(b.mult)}</span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </header>

    {#if bindings.length}
      <OnboardingTooltip
        id="bindings"
        title="Stage Synergies"
        content="Notice the synergy badges above. Production in this stage is multiplied by compound boosts from prior stages (e.g. Village Labor and Farm Grain). Upgrading earlier stages cascades efficiency down the entire chain!"
      />
    {/if}

    <!-- Currency ledger -->
    <div class="ledger">
      <div class="coin">
        <span class="coin-emoji">{def.primaryCurrency.emoji}</span>
        <div class="coin-stack">
          <span class="coin-val tnum">{fmt(stageState.primaryAmount)}</span>
          <span class="coin-name">{def.primaryCurrency.name}</span>
        </div>
        <span class="coin-rate tnum" class:live={rates.primary.gt(0)}>+{fmtRate(rates.primary)}</span>
      </div>
      <div class="coin">
        <span class="coin-emoji">{def.secondaryCurrency.emoji}</span>
        <div class="coin-stack">
          <span class="coin-val tnum">{fmt(stageState.secondaryAmount)}</span>
          <span class="coin-name">{def.secondaryCurrency.name}</span>
        </div>
        <span class="coin-rate tnum" class:live={rates.secondary.gt(0)}>+{fmtRate(rates.secondary)}</span>
      </div>
      <div class="coin prestige">
        <span class="coin-emoji">{def.prestigeCurrency.emoji}</span>
        <div class="coin-stack">
          <span class="coin-val tnum">{stageState.prestigeCurrency} <small class="rebirths">×{stageState.prestigeCount}</small></span>
          <span class="coin-name">{def.prestigeCurrency.name}</span>
        </div>
      </div>
    </div>

    <!-- Space Status Starvation Banner -->
    {#if spaceStarvation}
      <div class="space-status frame bracketed">
        <h3 class="space-status-title">🚀 ORBITAL THROUGHPUT STATUS</h3>
        <div class="status-grid">
          <div class="status-col">
            <span class="label">Alloy Feed (Ore & Power):</span>
            <span class="val" class:starved={spaceStarvation.alloyStarve < 0.99}>
              {spaceStarvation.alloyStarve >= 0.99 ? '✅ Full Supply' : `⚠️ Starved (${Math.round(spaceStarvation.alloyStarve * 100)}%)`}
            </span>
            <div class="bar-bg"><div class="bar-fill" style="width: {spaceStarvation.alloyStarve * 100}%; background: var(--space)"></div></div>
            <small class="hint">Throttles Smelters, Refineries, Dyson Frames</small>
          </div>
          <div class="status-col">
            <span class="label">Stardust Feed (Alloy):</span>
            <span class="val" class:starved={spaceStarvation.stardustStarve < 0.99}>
              {spaceStarvation.stardustStarve >= 0.99 ? '✅ Full Supply' : `⚠️ Starved (${Math.round(spaceStarvation.stardustStarve * 100)}%)`}
            </span>
            <div class="bar-bg"><div class="bar-fill" style="width: {spaceStarvation.stardustStarve * 100}%; background: var(--mine)"></div></div>
            <small class="hint">Throttles Probes, Colonies, Star Forges, Warp Gates</small>
          </div>
        </div>
        {#if isBufferTanksOwned}
          <div class="buffers-row">
            <div class="buffer-item">
              <span class="buffer-lbl">🛢️ Ore Buffer:</span>
              <span class="buffer-val tnum">{fmt(buffers.ore)} / {fmt(spaceStarvation.demandOre * 600)}</span>
            </div>
            <div class="buffer-item">
              <span class="buffer-lbl">⚡ Power Buffer:</span>
              <span class="buffer-val tnum">{fmt(buffers.power)} / {fmt(spaceStarvation.demandPower * 600)} kW</span>
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Time Paradox Banner -->
    {#if stageId === 'time'}
      <div class="time-status frame bracketed">
        <div class="status-col">
          <span class="label">🌀 Paradox Throttle:</span>
          <span class="val" class:starved={throttle < 0.99}>
            {throttle >= 0.99 ? '✅ Stable' : `⚠️ ×${throttle.toFixed(2)} output`}
          </span>
          <div class="bar-bg"><div class="bar-fill" style="width: {throttle * 100}%; background: var(--time)"></div></div>
          <small class="hint">Paradox {fmt(paradox)} — vent with Hourglass Arrays to restore output</small>
        </div>
        <div class="status-col">
          <span class="label">⚡ Warp Charges:</span>
          <span class="val">{warp.charges} / {chargeCap}</span>
          <div class="bar-bg">
            <div class="bar-fill" style="width: {warp.charges >= chargeCap ? 100 : (warp.recharge / WARP_RECHARGE) * 100}%; background: var(--time)"></div>
          </div>
          <small class="hint">{warp.charges >= chargeCap ? 'Charges full' : `Next charge in ${Math.ceil(WARP_RECHARGE - warp.recharge)}s`}</small>
        </div>
      </div>
    {/if}

    <!-- Tabs Selection (Magic / Space / Time / Multiverse) -->
    {#if stageId === 'magic' || stageId === 'space' || stageId === 'time' || stageId === 'multiverse'}
      <div class="tabs">
        <button class="tab-btn" class:active={activeTab === 'generators'} onclick={() => activeTab = 'generators'}>
          🛠️ Generators
        </button>
        {#if stageId === 'magic'}
          <button class="tab-btn" class:active={activeTab === 'enchants'} onclick={() => activeTab = 'enchants'}>
            🔮 Enchantments
          </button>
        {/if}
        {#if stageId === 'time'}
          <button class="tab-btn" class:active={activeTab === 'warp'} onclick={() => activeTab = 'warp'}>
            ⏳ Warp
          </button>
        {/if}
        {#if stageId === 'multiverse'}
          <button class="tab-btn" class:active={activeTab === 'duplication'} onclick={() => activeTab = 'duplication'}>
            🪞 Duplication
          </button>
        {/if}
        <button class="tab-btn" class:active={activeTab === 'skills'} onclick={() => activeTab = 'skills'}>
          📜 Local Upgrades
        </button>
      </div>
    {/if}

    {#if activeTab === 'generators'}
      <OnboardingTooltip
        id="gather"
        title="Manual Gathering"
        content="Stuck at zero resources after prestiging? Click the Gather button to manually generate currency. It scales with your current rates, guaranteeing a bootstrap of at least 1 resource (or ~3s of production)."
      />

      <!-- Manual gather: always lets you earn from zero -->
      <button class="gather" onclick={handleGather}>
        <span class="gather-emoji">{def.primaryCurrency.emoji}</span>
        <span class="gather-label">{gatherVerb} {def.primaryCurrency.name}</span>
        <span class="gather-gain tnum">+{fmt(gather)}</span>
      </button>

      <!-- Buy mode -->
      <div class="buy-mode">
        <span class="bm-label">purchase</span>
        <div class="bm-group">
          {#each ([1, 10, 100, -1] as const) as m}
            <button class="bm-btn {buyMode === m ? 'active' : ''}" onclick={() => buyMode = m}>
              {m === -1 ? 'MAX' : '×' + m}
            </button>
          {/each}
        </div>

        {#if autoUnlocked}
          <button
            class="auto-btn {autoOn ? 'on' : ''}"
            onclick={handleToggleAuto}
            title="Auto-buy the cheapest affordable generator each tick"
          >
            <span class="auto-dot" class:live={autoOn}></span>
            Auto {autoOn ? 'ON' : 'OFF'}
          </button>
        {/if}
      </div>

      {#if autoUnlocked && (stageState.ascensionCount ?? 0) >= 1}
        <!-- Smart Auto-Buyer Dashboard -->
        <div class="smart-auto-dashboard frame bracketed">
          <div class="dashboard-header">
            <span class="dash-title">⚙️ Automation Settings</span>
          </div>
          <div class="dash-grid">
            <div class="dash-col">
              <span class="dash-label">mode:</span>
              <div class="dash-btn-group">
                <button
                  class="dash-btn {stageState.autoBuyMode === 'cheapest' || !stageState.autoBuyMode ? 'active' : ''}"
                  onclick={() => setAutoBuyMode(stageId, 'cheapest')}
                >
                  Cheapest
                </button>
                <button
                  class="dash-btn {stageState.autoBuyMode === 'priority' ? 'active' : ''}"
                  onclick={() => setAutoBuyMode(stageId, 'priority')}
                >
                  Priority
                </button>
              </div>
            </div>
            <div class="dash-col">
              <span class="dash-label">reserve:</span>
              <div class="reserve-row">
                <input
                  type="range"
                  min="0"
                  max="0.9"
                  step="0.05"
                  value={stageState.autoBuyReserve ?? 0}
                  oninput={(e) => setAutoBuyReserve(stageId, parseFloat((e.target as HTMLInputElement).value))}
                  class="reserve-slider"
                />
                <span class="tnum" style="min-width: 32px; text-align: right; margin-left: 4px; font-family: var(--font-mono); font-size: 0.72rem;">{Math.round((stageState.autoBuyReserve ?? 0) * 100)}%</span>
              </div>
            </div>
            <div class="dash-col checkbox-col">
              <label class="dash-checkbox-label">
                <input
                  type="checkbox"
                  checked={stageState.autoBuyMilestoneSnipe !== false}
                  onchange={(e) => setAutoBuyMilestoneSnipe(stageId, (e.target as HTMLInputElement).checked)}
                />
                <span>milestone snipe</span>
              </label>
            </div>
          </div>
        </div>
      {/if}

      <!-- Generators -->
      <div class="gens">
        {#each def.generators as gdef}
          {@const gs  = stageState.generators[gdef.id]}
          {@const cost = genCost(stageId, gdef.id, buyMode)}
          {@const locked = stageState.prestigeCount < gdef.unlockAt}
          {@const buyN = buyMode === -1 ? 1 : buyMode}
          {@const affordable = !locked && canAffordGen(stageId, gdef.id, buyN)}
          {@const mi = nextMilestoneInfo(gs.count)}

          <div class="gen {locked ? 'locked' : ''} {affordable ? 'affordable' : ''}">
            <!-- Tier rail -->
            <div class="tier-rail">
              <div class="tier-fill" style="height: {mi.progress * 100}%"></div>
            </div>

            <span class="gen-emoji">{gdef.emoji}</span>

            <div class="gen-body">
              <div class="gen-top">
                <span class="gen-name">{gdef.name}</span>
                {#if !locked && mi.currentMult > 1}
                  <span class="gen-mult tnum" title="Milestone production bonus">×{mi.currentMult}</span>
                {/if}
                {#key gs.count}
                  <span class="gen-count tnum">{gs.count}</span>
                {#key familiarStarve}
                  {#if stageId === 'magic' && gdef.id === 'familiar' && familiarStarve.lt(ONE)}
                    <span class="gen-starve-badge">⚠️ Starved</span>
                  {/if}
                {/key}
                {/key}
              </div>
              <p class="gen-flavor">{locked ? `🔒 unlocks at ${gdef.unlockAt} prestige` : gdef.description}</p>
              {#if !locked && mi.next !== null}
                <span class="gen-next">next ×{BALANCE.milestoneMult} bonus at {mi.next} ({Math.floor(mi.progress * 100)}%)</span>
              {/if}
            </div>

            {#if !locked && (stageState.ascensionCount ?? 0) >= 1}
              {@const vaulted = stageState.autoBuyVault?.includes(gdef.id)}
              <button
                class="vault-btn {vaulted ? 'vaulted' : ''}"
                onclick={() => toggleAutoBuyVault(stageId, gdef.id)}
                title={vaulted ? "Unvault: let the auto-buyer purchase this generator" : "Vault: stop the auto-buyer from purchasing this generator"}
              >
                {vaulted ? '🔒' : '🔓'}
              </button>
            {/if}
            <button
              class="buy-btn {affordable ? 'go' : ''}"
              onclick={() => handleBuy(gdef.id)}
              disabled={locked || !affordable}
            >
              {#if locked}
                <span class="buy-lock">🔒</span>
              {:else}
                <span class="buy-cost tnum">{fmt(cost)}</span>
                <span class="buy-sym">{def.primaryCurrency.symbol}</span>
              {/if}
            </button>
          </div>
        {/each}
      </div>
    {/if}

    {#if activeTab === 'enchants' && stageId === 'magic'}
      <EnchantsTab {stageId} />
    {/if}

    {#if activeTab === 'warp' && stageId === 'time'}
      <WarpTab {stageId} />
    {/if}

    {#if activeTab === 'duplication' && stageId === 'multiverse'}
      <DuplicationTab {stageId} />
    {/if}

    {#if activeTab === 'skills'}
      {@const stageSkills = LOCAL_SKILLS_BY_STAGE[stageId] ?? []}
      {@const skillTiers = [...new Set(stageSkills.map(s => s.tier))].sort((a, b) => a - b)}

      <div class="local-skills-tab animate-fade">
        <header class="local-skills-head frame bracketed">
          <h3 class="panel-section-title">📜 {def.name} Local Upgrades</h3>
          <p class="local-skills-sub">Spend {def.prestigeCurrency.name} ({stageState.prestigeCurrency}) on permanent local stage enhancements.</p>
        </header>

        <div class="local-tiers">
          {#each skillTiers as tier}
            <div class="local-tier">
              <span class="local-tier-label">tier {tier}</span>
              <div class="tier-nodes">
                {#each stageSkills.filter(s => s.tier === tier) as node}
                  {@const lvl = getState().skills[node.id] ?? 0}
                  {@const maxed = lvl >= node.maxLevel}
                  {@const locked = !node.requires.every(r => (getState().skills[r] ?? 0) >= 1)}
                  {@const cost = Math.floor(node.baseCost * Math.pow(node.costGrowth, lvl))}
                  {@const affordable = !maxed && stageState.prestigeCurrency >= cost}
                  {@const buyable = !maxed && !locked && affordable}
                  <button
                    class="node {stClass(node.id)} {locked ? 'locked' : ''} {maxed ? 'maxed' : ''} {buyable ? 'buyable' : ''}"
                    onclick={() => handleBuyLocalSkill(node.id)}
                    disabled={!buyable}
                    title={node.description}
                  >
                    <div class="node-top">
                      <span class="node-icon">{node.icon}</span>
                      <span class="node-name">{node.name}</span>
                      <span class="node-lvl tnum">{lvl}/{node.maxLevel}</span>
                    </div>
                    <p class="node-desc">{node.description}</p>
                    <div class="node-foot">
                      {#if maxed}
                        <span class="foot maxed">MAXED</span>
                      {:else if locked}
                        <span class="foot locked">🔒 locked</span>
                      {:else}
                        <span class="foot cost {affordable ? 'ok' : 'no'}">{cost} {def.prestigeCurrency.symbol}</span>
                      {/if}
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Multiverse prestiges via the Convergence collapse (in the Duplication tab), not the generic altar. -->
    {#if stageId !== 'multiverse'}
      <OnboardingTooltip
        id="prestige"
        title="The Altar of Ascension"
        content="Ready to ascend? Prestige resets this stage's currency and generators, but yields permanent prestige tokens. Each token grants a cumulative +25% stage production bonus and lets you buy advanced generators!"
      />

      <!-- Prestige altar -->
      <div class="altar {prestigeGainPreview > 0 ? 'ready' : ''}">
        <div class="altar-info">
          <span class="altar-label">✦ Prestige</span>
          {#if prestigeGainPreview > 0}
            <span class="altar-gain tnum">+{prestigeGainPreview} {def.prestigeCurrency.name}</span>
          {:else}
            <span class="altar-hint">accumulate more {def.primaryCurrency.name} to prestige</span>
          {/if}
        </div>
        <button class="altar-btn" onclick={handlePrestige} disabled={prestigeGainPreview === 0}>
          ascend
        </button>
      </div>
    {/if}

  </div>
{/if}

<style>
  .stage-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* ── Header ────────────────────────────────────────────────────────────── */
  .stage-head {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 14px;
    border-color: var(--sc);
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--sc) 12%, transparent), transparent 60%),
      var(--ink-800);
  }
  .stage-emoji {
    font-size: 2.6rem;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6));
  }
  .stage-name {
    font-family: var(--font-display);
    font-size: 1.15rem;
    color: var(--sc);
    letter-spacing: 1px;
    margin-bottom: 4px;
  }
  .stage-flavor {
    font-family: var(--font-flavor);
    font-style: italic;
    font-size: 0.92rem;
    line-height: 1.45;
    color: var(--parchment-dim);
    max-width: 52ch;
  }

  .bindings {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-left: auto;
    align-self: center;
    flex-shrink: 0;
  }
  .binding {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 11px;
    background: color-mix(in srgb, var(--bc) 12%, var(--ink-900));
    border: 1px solid color-mix(in srgb, var(--bc) 45%, var(--line));
    border-radius: 4px;
  }
  .binding-icon { font-size: 1rem; }
  .binding-text { display: flex; flex-direction: column; line-height: 1.1; }
  .binding-label {
    font-family: var(--font-flavor); font-style: italic;
    font-size: 0.7rem; color: var(--bc);
  }
  .binding-mult { font-size: 0.95rem; font-weight: 700; color: var(--bc); }

  /* ── Ledger ────────────────────────────────────────────────────────────── */
  .ledger {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .coin {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 14px;
    background: var(--ink-800);
    border: 1px solid var(--line);
    border-radius: 4px;
    flex: 1;
    min-width: 130px;
  }
  .coin-emoji { font-size: 1.3rem; }
  .coin-stack { display: flex; flex-direction: column; line-height: 1.15; flex: 1; }
  .coin-val { font-size: 1.05rem; font-weight: 700; color: var(--brass-bright); }
  .coin-name {
    font-family: var(--font-flavor); font-style: italic;
    font-size: 0.78rem; color: var(--parchment-faint);
  }
  .coin-rate {
    font-size: 0.72rem; font-weight: 600;
    color: var(--parchment-faint);
    padding: 1px 6px;
    border-radius: 3px;
    background: var(--ink-900);
    white-space: nowrap;
    align-self: center;
  }
  .coin-rate.live { color: var(--positive); }
  .coin.prestige { border-color: var(--brass-deep); }
  .coin.prestige .coin-val { color: var(--brass); }
  .rebirths { color: var(--parchment-faint); font-size: 0.7rem; }

  /* ── Manual gather ─────────────────────────────────────────────────────── */
  .gather {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 11px 16px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--sc) 18%, var(--ink-700)), var(--ink-800));
    border: 1px solid var(--sc);
    border-radius: 5px;
    color: var(--parchment);
    cursor: pointer;
    font-family: var(--font-mono);
    transition: transform 0.08s var(--ease-out), box-shadow 0.15s, background 0.15s;
    user-select: none;
  }
  .gather:hover {
    box-shadow: 0 0 16px color-mix(in srgb, var(--sc) 45%, transparent);
    background: linear-gradient(180deg, color-mix(in srgb, var(--sc) 26%, var(--ink-700)), var(--ink-800));
  }
  .gather:active { transform: scale(0.985) translateY(1px); }
  .gather-emoji { font-size: 1.4rem; }
  .gather-label {
    flex: 1; text-align: left;
    font-size: 0.92rem; font-weight: 700; letter-spacing: 0.4px;
    color: var(--sc);
  }
  .gather-gain { font-size: 1rem; font-weight: 700; color: var(--brass-bright); }

  /* ── Buy mode ──────────────────────────────────────────────────────────── */
  .buy-mode {
    display: flex; align-items: center; gap: 12px;
  }
  .bm-label {
    font-family: var(--font-flavor); font-style: italic;
    font-size: 0.82rem; color: var(--parchment-faint);
  }
  .bm-group {
    display: flex; gap: 0;
    border: 1px solid var(--line);
    border-radius: 4px;
    overflow: hidden;
  }
  .bm-btn {
    background: var(--ink-800);
    border: none;
    border-right: 1px solid var(--line);
    color: var(--parchment-dim);
    padding: 5px 13px;
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    transition: all 0.14s;
  }
  .bm-btn:last-child { border-right: none; }
  .bm-btn:hover { background: var(--ink-700); color: var(--parchment); }
  .bm-btn.active {
    background: var(--sc);
    color: var(--ink-900);
    text-shadow: none;
  }

  /* ── Auto-buyer toggle ─────────────────────────────────────────────────── */
  .auto-btn {
    display: flex; align-items: center; gap: 7px;
    margin-left: auto;
    padding: 5px 13px;
    background: var(--ink-800);
    border: 1px solid var(--line);
    border-radius: 4px;
    color: var(--parchment-dim);
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.5px;
    transition: all 0.14s;
  }
  .auto-btn:hover { background: var(--ink-700); color: var(--parchment); border-color: var(--brass-deep); }
  .auto-btn.on { border-color: var(--positive); color: var(--positive); }
  .auto-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--parchment-faint);
  }
  .auto-dot.live {
    background: var(--positive);
    box-shadow: 0 0 6px var(--positive);
    animation: pulse 1.5s infinite ease-in-out;
  }

  /* ── Generators ────────────────────────────────────────────────────────── */
  .gens { display: flex; flex-direction: column; gap: 6px; }

  .gen {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 9px 12px 9px 16px;
    background: var(--ink-800);
    border: 1px solid var(--line);
    border-radius: 4px;
    overflow: hidden;
    transition: transform 0.16s var(--ease-out), border-color 0.16s, background 0.16s;
  }
  .gen:hover:not(.locked) {
    transform: translateX(3px);
    border-color: color-mix(in srgb, var(--sc) 50%, var(--line));
    background: var(--ink-700);
  }
  .gen.locked { opacity: 0.4; filter: saturate(0.3); }
  .gen.affordable { border-color: color-mix(in srgb, var(--sc) 35%, var(--line)); }

  .tier-rail {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 4px;
    background: var(--ink-600);
    display: flex; flex-direction: column-reverse;
  }
  .tier-fill {
    width: 100%;
    background: linear-gradient(0deg, var(--sc), color-mix(in srgb, var(--sc) 40%, white));
    box-shadow: 0 0 6px var(--sc);
    transition: height 0.4s var(--ease-out);
  }

  .gen-emoji { font-size: 1.7rem; flex-shrink: 0; width: 32px; text-align: center; }

  .gen-body { flex: 1; min-width: 0; }
  .gen-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
  .gen-name { font-size: 0.92rem; font-weight: 600; color: var(--parchment); letter-spacing: 0.3px; }
  .gen-count {
    font-size: 1.3rem; font-weight: 700; color: var(--sc);
    display: inline-block;
    animation: count-bump 0.4s var(--ease-spring);
  }
  .gen-flavor {
    font-family: var(--font-flavor); font-style: italic;
    font-size: 0.8rem; color: var(--parchment-faint);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: 30ch;
  }
  .gen-next {
    font-size: 0.62rem; color: var(--parchment-faint);
    text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7;
  }
  .gen-mult {
    font-size: 0.72rem; font-weight: 700;
    color: var(--positive);
    padding: 0 5px; border-radius: 3px;
    background: color-mix(in srgb, var(--positive) 14%, var(--ink-900));
  }

  .buy-btn {
    display: flex; flex-direction: column; align-items: center;
    gap: 1px;
    min-width: 96px;
    padding: 7px 12px;
    background: var(--ink-700);
    border: 1px solid var(--line-bright);
    border-radius: 4px;
    color: var(--parchment-faint);
    cursor: pointer;
    font-family: var(--font-mono);
    transition: all 0.14s;
    flex-shrink: 0;
  }
  .buy-cost { font-size: 0.92rem; font-weight: 700; line-height: 1; }
  .buy-sym { font-size: 0.62rem; opacity: 0.7; }
  .buy-lock { font-size: 1rem; }

  .buy-btn.go {
    border-color: var(--sc);
    color: var(--sc);
    background: color-mix(in srgb, var(--sc) 10%, var(--ink-700));
  }
  .buy-btn.go:hover {
    background: var(--sc);
    color: var(--ink-900);
    box-shadow: 0 0 14px color-mix(in srgb, var(--sc) 60%, transparent);
    transform: translateY(-1px);
  }
  .buy-btn.go:active { transform: translateY(1px) scale(0.97); }
  .buy-btn:disabled { cursor: not-allowed; }

  /* ── Prestige altar ────────────────────────────────────────────────────── */
  .altar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 11px 16px;
    margin-top: 4px;
    background:
      linear-gradient(135deg, rgba(212, 168, 67, 0.05), transparent),
      var(--ink-850);
    border: 1px solid var(--line);
    border-radius: 4px;
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  .altar.ready {
    border-color: var(--brass-deep);
    box-shadow: inset 0 0 24px rgba(212, 168, 67, 0.08);
  }
  .altar-info { display: flex; flex-direction: column; gap: 2px; }
  .altar-label {
    font-family: var(--font-display);
    font-size: 0.72rem; letter-spacing: 1px;
    color: var(--brass);
  }
  .altar-gain { font-size: 0.88rem; font-weight: 600; color: var(--brass-bright); }
  .altar-hint {
    font-family: var(--font-flavor); font-style: italic;
    font-size: 0.8rem; color: var(--parchment-faint);
  }
  .altar-btn {
    padding: 7px 20px;
    background: transparent;
    border: 1px solid var(--brass-deep);
    border-radius: 3px;
    color: var(--brass);
    cursor: pointer;
    font-family: var(--font-display);
    font-size: 0.7rem;
    letter-spacing: 1px;
    text-transform: lowercase;
    transition: all 0.16s;
  }
  .altar.ready .altar-btn { border-color: var(--brass); color: var(--brass-bright); }
  .altar.ready .altar-btn:hover {
    background: var(--brass);
    color: var(--ink-900);
    box-shadow: 0 0 16px var(--brass-glow);
  }
  .altar-btn:disabled { cursor: not-allowed; opacity: 0.4; }

  /* ── Tabs ──────────────────────────────────────────────────────────────── */
  .tabs {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    border-bottom: 1px solid var(--line);
    padding-bottom: 8px;
  }
  .tab-btn {
    flex: 1;
    background: var(--ink-850);
    border: 1px solid var(--line);
    border-radius: 4px;
    color: var(--parchment-dim);
    padding: 8px 12px;
    cursor: pointer;
    font-family: var(--font-display);
    font-size: 0.76rem;
    letter-spacing: 0.5px;
    transition: all 0.16s var(--ease-out);
  }
  .tab-btn:hover {
    background: var(--ink-700);
    color: var(--parchment);
    border-color: color-mix(in srgb, var(--sc) 50%, var(--line));
  }
  .tab-btn.active {
    background: var(--sc);
    color: var(--ink-900);
    border-color: var(--sc);
    box-shadow: 0 0 10px color-mix(in srgb, var(--sc) 35%, transparent);
  }

  /* ── Space Status Banner ───────────────────────────────────────────────── */
  .space-status {
    padding: 12px 16px;
    border-color: var(--space);
    background: linear-gradient(180deg, rgba(78, 192, 212, 0.05), transparent), var(--ink-850);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .space-status-title {
    font-family: var(--font-display);
    font-size: 0.78rem;
    letter-spacing: 1px;
    color: var(--space);
  }
  .status-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .status-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .status-col .label {
    font-size: 0.74rem;
    color: var(--parchment-dim);
  }
  .status-col .val {
    font-size: 0.86rem;
    font-weight: 700;
    color: var(--positive);
  }
  .status-col .val.starved {
    color: var(--danger);
  }
  .status-col .hint {
    font-family: var(--font-flavor);
    font-style: italic;
    font-size: 0.72rem;
    color: var(--parchment-faint);
  }
  .bar-bg {
    width: 100%;
    height: 4px;
    background: var(--ink-900);
    border-radius: 2px;
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    transition: width 0.4s var(--ease-out);
  }
  .buffers-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    border-top: 1px solid var(--line);
    padding-top: 8px;
    margin-top: 4px;
  }
  .buffer-item {
    display: flex;
    gap: 6px;
    font-size: 0.74rem;
  }
  .buffer-lbl { color: var(--parchment-dim); }
  .buffer-val { font-weight: 600; color: var(--parchment); }

  /* ── Familiar starve badge ─────────────────────────────────────────────── */
  .gen-starve-badge {
    background: var(--danger);
    color: #fff;
    font-size: 0.62rem;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 3px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    animation: pulse 1.5s infinite ease-in-out;
  }

  /* ── Local Skills Tab ─────────────────────────────────────────────────── */
  .local-skills-tab {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .local-skills-head {
    padding: 10px 14px;
    background: var(--ink-850);
  }
  .local-skills-sub {
    font-family: var(--font-flavor);
    font-style: italic;
    font-size: 0.8rem;
    color: var(--parchment-dim);
    margin-top: 2px;
  }
  .local-tiers {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .local-tier {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .local-tier-label {
    font-family: var(--font-display);
    font-size: 0.58rem;
    letter-spacing: 2px;
    color: var(--brass-deep);
    text-transform: uppercase;
  }
  .local-tier .tier-nodes {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .local-tier .node {
    width: 100%;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 10px 12px;
    background: var(--ink-800);
    border: 1px solid var(--line);
    border-radius: 4px;
    cursor: pointer;
    font-family: var(--font-mono);
    color: var(--parchment);
    transition: transform 0.12s var(--ease-out), border-color 0.12s, box-shadow 0.12s;
  }
  .local-tier .node.magic { --accent: var(--magic); }
  .local-tier .node.space { --accent: var(--space); }
  .local-tier .node.time { --accent: var(--time); }
  .local-tier .node.multiverse { --accent: var(--multiverse); }
  
  .local-tier .node.buyable {
    border-color: var(--accent);
    box-shadow: inset 0 0 12px color-mix(in srgb, var(--accent) 5%, transparent);
  }
  .local-tier .node.buyable:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 10px color-mix(in srgb, var(--accent) 30%, transparent);
  }
  .local-tier .node.locked { opacity: 0.4; cursor: not-allowed; filter: saturate(0.4); }
  .local-tier .node.maxed { border-color: var(--brass-deep); opacity: 0.85; cursor: default; }

  .local-tier .node-top { display: flex; align-items: center; gap: 8px; }
  .local-tier .node-icon { font-size: 1.1rem; }
  .local-tier .node-name { flex: 1; font-size: 0.84rem; font-weight: 700; color: var(--accent); }
  .local-tier .node-lvl { font-size: 0.74rem; color: var(--parchment-faint); }
  .local-tier .node-desc {
    font-family: var(--font-flavor);
    font-style: italic;
    font-size: 0.76rem;
    color: var(--parchment-dim);
    line-height: 1.3;
  }
  .local-tier .node-foot { margin-top: 2px; }

  /* ── Time Paradox Banner ──────────────────────────────────────────────── */
  .time-status {
    padding: 12px 16px;
    border-color: var(--time);
    background: linear-gradient(180deg, rgba(230, 169, 63, 0.05), transparent), var(--ink-850);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  /* ── Micro-animations ─────────────────────────────────────────────────── */
  @keyframes pulse {
    0%, 100% { opacity: 0.9; }
    50% { opacity: 0.6; }
  }

  /* Smart Auto-Buyer Dashboard */
  .smart-auto-dashboard {
    margin-top: -6px;
    margin-bottom: 12px;
    padding: 8px 12px;
    background: var(--ink-900);
    border: 1px solid var(--brass-deep);
    border-radius: 4px;
    width: 100%;
  }
  .dashboard-header {
    margin-bottom: 6px;
    border-bottom: 1px dashed var(--line);
    padding-bottom: 4px;
  }
  .dash-title {
    font-family: var(--font-display);
    font-size: 0.62rem;
    letter-spacing: 1px;
    color: var(--brass-bright);
    text-transform: uppercase;
  }
  .dash-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
  }
  .dash-col {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.74rem;
    color: var(--parchment-dim);
  }
  .dash-label {
    font-family: var(--font-mono);
  }
  .dash-btn-group {
    display: flex;
    border: 1px solid var(--line);
    border-radius: 3px;
    overflow: hidden;
  }
  .dash-btn {
    background: var(--ink-800);
    border: none;
    color: var(--parchment-faint);
    padding: 3px 8px;
    font-family: var(--font-display);
    font-size: 0.64rem;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
  }
  .dash-btn.active {
    background: var(--brass);
    color: var(--ink-950);
    font-weight: 700;
  }
  .reserve-row {
    display: flex;
    align-items: center;
  }
  .reserve-slider {
    width: 80px;
    height: 4px;
    accent-color: var(--brass);
    cursor: pointer;
  }
  .checkbox-col {
    display: flex;
    align-items: center;
  }
  .dash-checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-family: var(--font-mono);
  }
  .dash-checkbox-label input {
    accent-color: var(--brass);
    cursor: pointer;
  }

  .vault-btn {
    background: transparent;
    border: 1px solid var(--line);
    border-radius: 3px;
    color: var(--parchment-faint);
    cursor: pointer;
    font-size: 0.76rem;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 6px;
    align-self: center;
    transition: all 0.2s ease;
  }
  .vault-btn:hover {
    border-color: var(--brass);
    color: var(--brass-bright);
  }
  .vault-btn.vaulted {
    border-color: rgba(224, 94, 94, 0.6);
    color: rgba(224, 94, 94, 1);
    background: rgba(224, 94, 94, 0.08);
  }

  /* ── Mobile (≤ 720px): stack the 2-col dashboards; wrap the buy-mode row ── */
  @media (max-width: 720px) {
    .status-grid, .time-status { grid-template-columns: 1fr; }
    .buy-mode { flex-wrap: wrap; }
  }
</style>
