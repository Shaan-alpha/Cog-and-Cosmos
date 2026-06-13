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
    activeEnchants,
    spaceBuffers,
    castEnchant,
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
    warpMaxDuration,
    warpEfficiency,
    warpCost,
    castWarp,
    WARP_RECHARGE,
    dupPct,
    branchSlotCap,
    branchSlots,
    echoSustain,
    assignBranchSlot,
    convergencePreview,
    castConvergence,
    convergenceMult,
  } from '../stores/game.svelte'
  import { playBuy, playMilestone, playPrestige } from '../systems/audio'
  import OnboardingTooltip from './OnboardingTooltip.svelte'
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

  // ── Magic active enchants and casting state ──
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
      if (getStage(sid)?.unlocked) {
        list.push({ id: sid, name: sdef.name, emoji: sdef.emoji })
      }
    }
    return list
  })

  let castTargets = $state<Record<string, string>>({
    quicken: 'village',
    greater_quicken: 'village',
    overcharge: 'village',
  })
  let castEssence = $state<Record<string, number>>({
    quicken: 0,
    greater_quicken: 0,
    overcharge: 0,
  })

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
    const cap = estimateCap(id)
    return Math.min(baseMult + amp, cap)
  }

  function handleCast(id: string) {
    const target = id === 'mass_enchant' ? 'all' : castTargets[id]
    const essence = id === 'mass_enchant' ? 0 : castEssence[id]
    const ok = castEnchant(id, target, essence)
    if (ok) {
      playMilestone()
      if (id !== 'mass_enchant') castEssence[id] = 0
    }
  }

  // ── Time warp dashboard state ──
  const warp = $derived(warpState())
  const chargeCap = $derived(warpChargeCap())
  const maxT = $derived(warpMaxDuration())
  const warpEff = $derived(warpEfficiency())
  const paradox = $derived(stageState.secondaryAmount)
  // Throttle preview: 1 / (1 + sqrt(paradox/200)).
  const throttle = $derived(1 / (1 + Math.sqrt(Math.max(0, paradox.toNumber()) / 200)))
  let warpTarget = $state('village')
  let warpSeconds = $state(60)
  // Keep the duration slider within the (skill-dependent) cap.
  $effect(() => { if (warpSeconds > maxT) warpSeconds = maxT })

  const warpCostPreview = $derived(warpCost(warpSeconds))
  const warpGainPreview = $derived.by(() => {
    const tr = stageRates(warpTarget)
    return tr.primary.mul(warpSeconds).mul(warpEff)
  })
  const warpParadoxPreview = $derived.by(() => {
    const epochs = getStage('time')?.prestigeCurrency ?? 0
    return 0.5 * warpSeconds * Math.max(0.1, 1 - 0.005 * epochs)
  })
  const canWarp = $derived(
    warp.charges >= 1 && stageState.primaryAmount.gte(warpCostPreview) && (getStage(warpTarget)?.unlocked ?? false)
  )

  function handleWarp() {
    const gained = castWarp(warpTarget, warpSeconds)
    if (gained !== null) playPrestige()
  }

  // ── Multiverse duplication + convergence state ──
  const slotCap = $derived(branchSlotCap())
  const slots = $derived(branchSlots())
  const dupPercent = $derived(dupPct())
  const sustain = $derived(echoSustain())
  const convPreview = $derived(convergencePreview())
  const convMult = $derived(convergenceMult())
  // Build the slot view: cap entries, each its assigned stage ('' = empty).
  const slotView = $derived.by(() => {
    const out: { index: number; target: string }[] = []
    for (let i = 0; i < slotCap; i++) out.push({ index: i, target: slots[i] ?? '' })
    return out
  })
  function handleAssignSlot(index: number, e: Event) {
    assignBranchSlot(index, (e.target as HTMLSelectElement).value)
  }
  function handleConvergence() {
    if (!convPreview.ready) return
    if (confirm(`Collapse all branches?\n\nBakes a permanent ×${convPreview.mult.toFixed(2)} multiplier into ALL stages and grants +${convPreview.points} Convergence, but resets the Multiverse (Shards, Echoes, generators, branch slots).`)) {
      if (castConvergence()) playPrestige()
    }
  }

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
                      <input
                        type="number"
                        min="0"
                        bind:value={castEssence[edef.id]}
                        class="amp-num frame"
                      />
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
    {/if}

    {#if activeTab === 'warp' && stageId === 'time'}
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
            <input
              type="range"
              id="warp-seconds"
              min="30"
              max={maxT}
              step="30"
              bind:value={warpSeconds}
              class="amp-slider"
            />
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

          <button
            class="cast-btn frame"
            class:go={canWarp}
            disabled={!canWarp}
            onclick={handleWarp}
          >
            {warp.charges < 1 ? 'No Warp Charges' : 'Warp Time ⏩'}
          </button>
        </div>
      </div>
    {/if}

    {#if activeTab === 'duplication' && stageId === 'multiverse'}
      <div class="warp-tab animate-fade">
        <div class="warp-dashboard frame bracketed" style="border-color: var(--multiverse)">
          <h3 class="panel-section-title" style="color: var(--multiverse)">🪞 Branch Slots — Clone a Stage</h3>
          <p class="cast-desc">
            Each Branch Node opens a slot. A slot adds <strong>{(dupPercent * 100).toFixed(1)}%</strong> of the
            chosen stage’s live output as bonus production. Echoes sustain the copies — let them run dry and the
            clone fades (current sustain <strong>×{sustain.toFixed(2)}</strong>).
          </p>

          {#if slotCap === 0}
            <p class="empty-hint">Build a Branch Node to open your first duplication slot.</p>
          {:else}
            <div class="slot-list">
              {#each slotView as slot}
                <div class="slot-row">
                  <span class="slot-idx">Slot {slot.index + 1}</span>
                  <select class="cast-select" value={slot.target} onchange={(e) => handleAssignSlot(slot.index, e)}>
                    <option value="">— none —</option>
                    {#each unlockedStages as us}
                      <option value={us.id}>{us.emoji} {us.name}</option>
                    {/each}
                  </select>
                  {#if slot.target}
                    <span class="slot-bonus tnum">+{((dupPercent * sustain) * 100).toFixed(1)}%</span>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Convergence collapse -->
        <div class="warp-dashboard frame bracketed" style="border-color: var(--multiverse)">
          <h3 class="panel-section-title" style="color: var(--multiverse)">💠 Convergence Collapse</h3>
          <p class="cast-desc">
            The capstone. Collapse all branches into one reality: bake a <strong>permanent global multiplier</strong>
            into every stage and earn Convergence. Requires a Convergence Core, all 8 stages unlocked, and ≥ 1e12 Shards.
          </p>
          <div class="warp-preview-grid">
            <div class="wp-cell">
              <span class="wp-label">Current permanent ×mult</span>
              <span class="wp-val tnum">×{fmt(convMult)}</span>
            </div>
            <div class="wp-cell">
              <span class="wp-label">Next collapse grants</span>
              <span class="wp-val tnum gain">×{convPreview.mult.toFixed(2)} · +{convPreview.points} Ω</span>
            </div>
          </div>
          <button
            class="cast-btn frame"
            class:go={convPreview.ready}
            disabled={!convPreview.ready}
            onclick={handleConvergence}
          >
            {convPreview.ready ? 'Collapse the Branches 💠' : 'Convergence locked (need Core · all stages · 1e12 Shards)'}
          </button>
        </div>
      </div>
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

  /* ── Enchantments Tab ─────────────────────────────────────────────────── */
  .enchants-tab {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .panel-section-title {
    font-family: var(--font-display);
    font-size: 0.82rem;
    letter-spacing: 1px;
    color: var(--sc);
    margin-bottom: 8px;
  }
  .empty-hint {
    font-family: var(--font-flavor);
    font-style: italic;
    color: var(--parchment-faint);
    text-align: center;
    padding: 16px 0;
  }
  .active-list {
    padding: 12px 14px;
    background: var(--ink-850);
  }
  .active-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .active-enc-card {
    padding: 8px 11px;
    background: var(--ink-900);
    border-color: var(--sc);
    display: flex;
    flex-direction: column;
    gap: 4px;
    position: relative;
    overflow: hidden;
  }
  .active-enc-card .card-head {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    font-weight: 700;
  }
  .active-enc-card .card-head .enc-name {
    color: var(--sc);
  }
  .active-enc-card .card-head .enc-target {
    font-size: 0.74rem;
  }
  .active-enc-card .card-body {
    display: flex;
    justify-content: space-between;
    font-size: 0.74rem;
  }
  .active-enc-card .card-body .enc-mult {
    color: var(--positive);
  }
  .active-enc-card .card-body .enc-mult.backfire {
    color: var(--danger);
  }
  .active-enc-card .card-body .enc-time {
    color: var(--parchment-dim);
  }
  .duration-bar {
    width: 100%;
    height: 2px;
    background: var(--ink-800);
    margin-top: 4px;
  }
  .duration-fill {
    height: 100%;
    background: var(--sc);
    transition: width 0.1s linear;
  }

  .cast-dashboard .cast-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .cast-card {
    padding: 12px 14px;
    background: var(--ink-850);
    border-color: var(--line-bright);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .cast-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .cast-title {
    font-family: var(--font-display);
    font-size: 0.86rem;
    color: var(--sc);
    letter-spacing: 0.5px;
  }
  .cast-cost-mana {
    font-size: 0.74rem;
    color: var(--parchment-dim);
  }
  .cast-desc {
    font-family: var(--font-flavor);
    font-style: italic;
    font-size: 0.8rem;
    color: var(--parchment-dim);
    line-height: 1.35;
  }
  .cast-opt {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.76rem;
  }
  .cast-opt label {
    color: var(--parchment-dim);
  }
  .cast-select {
    width: 100%;
    background: var(--ink-900);
    border: 1px solid var(--line);
    border-radius: 4px;
    color: var(--parchment);
    padding: 6px;
    font-family: var(--font-mono);
  }
  .amp-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .amp-slider {
    flex: 1;
    accent-color: var(--sc);
  }
  .amp-num {
    width: 70px;
    background: var(--ink-900);
    border: 1px solid var(--line);
    border-radius: 4px;
    color: var(--parchment);
    padding: 4px 8px;
    text-align: center;
    font-family: var(--font-mono);
  }
  .amp-preview {
    font-size: 0.72rem;
    color: var(--sc);
    margin-top: 2px;
  }
  .cast-btn {
    width: 100%;
    padding: 8px;
    background: var(--ink-700);
    border: 1px solid var(--line-bright);
    color: var(--parchment-faint);
    cursor: pointer;
    font-family: var(--font-display);
    font-size: 0.76rem;
    letter-spacing: 0.5px;
    transition: all 0.16s;
  }
  .cast-btn.go {
    border-color: var(--sc);
    color: var(--sc);
    background: color-mix(in srgb, var(--sc) 10%, var(--ink-700));
  }
  .cast-btn.go:hover {
    background: var(--sc);
    color: var(--ink-900);
    box-shadow: 0 0 12px color-mix(in srgb, var(--sc) 50%, transparent);
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

  /* ── Warp Tab ─────────────────────────────────────────────────────────── */
  .warp-tab { display: flex; flex-direction: column; gap: 16px; }
  .warp-dashboard {
    padding: 14px 16px;
    background: var(--ink-850);
    border-color: var(--time);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .warp-preview-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 4px;
  }
  .wp-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 11px;
    background: var(--ink-900);
    border: 1px solid var(--line);
    border-radius: 4px;
  }
  .wp-label {
    font-family: var(--font-flavor); font-style: italic;
    font-size: 0.72rem; color: var(--parchment-faint);
  }
  .wp-val { font-size: 0.95rem; font-weight: 700; color: var(--parchment); }
  .wp-val.gain { color: var(--positive); }
  .wp-val.warn { color: var(--time); }
  .wp-val.no { color: var(--danger); }

  /* ── Multiverse Duplication slots ─────────────────────────────────────── */
  .slot-list { display: flex; flex-direction: column; gap: 8px; }
  .slot-row { display: flex; align-items: center; gap: 10px; }
  .slot-idx {
    font-family: var(--font-display); font-size: 0.64rem; letter-spacing: 1px;
    color: var(--multiverse); min-width: 56px;
  }
  .slot-row .cast-select { flex: 1; }
  .slot-bonus {
    font-size: 0.82rem; font-weight: 700; color: var(--positive);
    min-width: 56px; text-align: right;
  }

  /* ── Micro-animations ─────────────────────────────────────────────────── */
  .animate-fade {
    animation: fade-in 0.2s var(--ease-out) forwards;
  }

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
</style>
