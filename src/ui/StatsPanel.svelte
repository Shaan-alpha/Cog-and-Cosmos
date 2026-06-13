<script lang="ts">
  import {
    getState,
    stageRates,
    fortuneRate,
    globalMult,
    isStageUnlocked,
    isAutoBuyOn,
    STAGE_DEFS,
    fmt,
    fmtRate,
    unlockedAchievements,
  } from '../stores/game.svelte'
  import { ACHIEVEMENTS } from '../data/achievements'
  import { playBuy } from '../systems/audio'

  const gameState = $derived(getState())
  const engine = $derived(gameState.engine)
  const star = $derived(fortuneRate())

  let activeSubTab: 'stats' | 'achievements' = $state('stats')

  const unlockedList = $derived(unlockedAchievements())
  const unlockedSet = $derived(new Set(unlockedList))
  const unlockedAchCount = $derived(unlockedList.length)

  const totalAchBoost = $derived.by(() => {
    let sum = 0
    for (const ach of ACHIEVEMENTS) {
      if (unlockedSet.has(ach.id)) {
        sum += ach.bonusPct
      }
    }
    return sum
  })

  const achColors: Record<string, string> = {
    unlock_farm: 'var(--farm)',
    unlock_mine: 'var(--mine)',
    unlock_factory: 'var(--factory)',
    unlock_magic: 'var(--magic)',
    unlock_space: 'var(--space)',
    unlock_time: 'var(--time)',
    clocktower_5: 'var(--time)',
    paradox_200: 'var(--time)',
    unlock_multiverse: 'var(--multiverse)',
    convergence_1: 'var(--multiverse)',
    duplication_active: 'var(--multiverse)',
    first_prestige: 'var(--village)',
    first_ascension: 'var(--brass-deep)',
    first_transcend: 'var(--brass-bright)',
    buy_aether_skill: 'var(--brass-bright)',
    fortune_1k: 'var(--brass-bright)',
    fortune_100k: 'var(--brass-bright)',
    fortune_1e9: 'var(--brass-bright)',
    full_engine: 'var(--brass)',
  }

  function selectTab(tab: 'stats' | 'achievements') {
    activeSubTab = tab
    playBuy()
  }

  function fmtDuration(ms: number): string {
    const sec = Math.floor(ms / 1000)
    const d = Math.floor(sec / 86400)
    const h = Math.floor((sec % 86400) / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  // One row of live data per unlocked stage.
  const stageRows = $derived.by(() => {
    const rows = []
    for (const [sid, def] of Object.entries(STAGE_DEFS)) {
      if (!isStageUnlocked(sid)) continue
      const st = gameState.stages[sid]
      const r = stageRates(sid)
      let owned = 0
      for (const g of Object.values(st.generators)) owned += g.count
      rows.push({
        id: sid,
        name: def.name,
        emoji: def.emoji,
        color: def.color,
        primarySym: def.primaryCurrency.symbol,
        secondarySym: def.secondaryCurrency.symbol,
        prestigeName: def.prestigeCurrency.name,
        amount: st.primaryAmount,
        lifetime: st.primaryLifetime,
        secondary: st.secondaryAmount,
        primaryRate: r.primary,
        secondaryRate: r.secondary,
        prestigeCount: st.prestigeCount,
        prestigeCurrency: st.prestigeCurrency,
        owned,
        autoBuy: isAutoBuyOn(sid),
      })
    }
    return rows
  })

  const unlockedCount = $derived(stageRows.length)
  const totalStages = $derived(Object.keys(STAGE_DEFS).length)
</script>

<div class="stats">
  <header class="stats-head frame bracketed">
    <div class="stats-head-left">
      <h2 class="stats-title">
        {#if activeSubTab === 'stats'}
          📊 Statistics
        {:else}
          🏆 Achievements
        {/if}
      </h2>
      <p class="stats-sub">
        {#if activeSubTab === 'stats'}
          A ledger of everything the Engine has wrought.
        {:else}
          Milestones conquered across time and space.
        {/if}
      </p>
    </div>
    <div class="sub-tabs">
      <button 
        class="sub-tab-btn" 
        class:active={activeSubTab === 'stats'} 
        onclick={() => selectTab('stats')}
      >
        📊 Stats
      </button>
      <button 
        class="sub-tab-btn" 
        class:active={activeSubTab === 'achievements'} 
        onclick={() => selectTab('achievements')}
      >
        🏆 Achievements
      </button>
    </div>
  </header>

  {#if activeSubTab === 'stats'}
    <!-- Top-line summary cards -->
    <div class="summary">
      <div class="stat-card">
        <span class="sc-label">Playtime</span>
        <span class="sc-val tnum">{fmtDuration(gameState.totalPlaytimeMs)}</span>
      </div>
      <div class="stat-card star">
        <span class="sc-label">★ Fortune</span>
        <span class="sc-val tnum">{fmt(engine.fortune)}</span>
        <span class="sc-sub tnum">+{fmtRate(star)}</span>
      </div>
      <div class="stat-card star">
        <span class="sc-label">★ Lifetime</span>
        <span class="sc-val tnum">{fmt(engine.fortuneLifetime)}</span>
      </div>
      <div class="stat-card">
        <span class="sc-label">Global Mult</span>
        <span class="sc-val tnum">×{fmt(globalMult())}</span>
      </div>
      <div class="stat-card">
        <span class="sc-label">Stages Unlocked</span>
        <span class="sc-val tnum">{unlockedCount} / {totalStages}</span>
      </div>
      <div class="stat-card">
        <span class="sc-label">Engine Slots</span>
        <span class="sc-val tnum">{engine.slots.length} / 8</span>
      </div>
    </div>

    <!-- Per-stage breakdown -->
    <div class="stage-table frame bracketed">
      <div class="row head">
        <span class="c-stage">Stage</span>
        <span class="c-num">Held</span>
        <span class="c-num">Rate</span>
        <span class="c-num">Lifetime</span>
        <span class="c-num">Gens</span>
        <span class="c-num">Prestige</span>
        <span class="c-auto">Auto</span>
      </div>
      {#each stageRows as row}
        <div class="row" style="--sc: {row.color}">
          <span class="c-stage"><span class="r-emoji">{row.emoji}</span>{row.name}</span>
          <span class="c-num tnum">{fmt(row.amount)} {row.primarySym}</span>
          <span class="c-num tnum live">+{fmtRate(row.primaryRate)}</span>
          <span class="c-num tnum">{fmt(row.lifetime)}</span>
          <span class="c-num tnum">{row.owned}</span>
          <span class="c-num tnum">{row.prestigeCurrency} <small>×{row.prestigeCount}</small></span>
          <span class="c-auto">{row.autoBuy ? '🟢' : '—'}</span>
        </div>
      {/each}
    </div>
  {:else}
    <!-- Achievements view -->
    <div class="ach-summary">
      <div class="ach-summary-card frame">
        <span class="sc-label">Conquered Milestones</span>
        <span class="sc-val tnum">{unlockedAchCount} / {ACHIEVEMENTS.length}</span>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: {(unlockedAchCount / ACHIEVEMENTS.length) * 100}%"></div>
        </div>
      </div>
      <div class="ach-summary-card frame glow">
        <span class="sc-label">Total Production Boost</span>
        <span class="sc-val tnum">+{totalAchBoost}%</span>
        <span class="sc-sub">Additive global output multiplier</span>
      </div>
    </div>

    <div class="achievements-grid">
      {#each ACHIEVEMENTS as ach}
        {@const isUnlocked = unlockedSet.has(ach.id)}
        {@const isHidden = ach.hidden && !isUnlocked}
        {@const color = achColors[ach.id] || 'var(--brass-deep)'}
        <div 
          class="ach-card frame" 
          class:locked={!isUnlocked} 
          class:secret={isHidden}
          style="--ach-color: {color}"
        >
          <div class="ach-icon">{isHidden ? '❓' : ach.icon}</div>
          <div class="ach-details">
            <div class="ach-name-row">
              <span class="ach-name">{isHidden ? '???' : ach.name}</span>
              <span class="ach-bonus tnum">+{isHidden ? '?' : ach.bonusPct}%</span>
            </div>
            <p class="ach-desc">{isHidden ? 'Secret Achievement' : ach.description}</p>
          </div>
          {#if isUnlocked}
            <span class="ach-badge">✓</span>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .stats { display: flex; flex-direction: column; gap: 14px; max-width: 980px; margin: 0 auto; }

  .stats-head {
    padding: 12px 16px;
    background: linear-gradient(135deg, rgba(212, 168, 67, 0.06), transparent), var(--ink-850);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }
  .stats-title { font-family: var(--font-display); font-size: 1.05rem; color: var(--brass-bright); letter-spacing: 1px; }
  .stats-sub {
    font-family: var(--font-flavor); font-style: italic;
    font-size: 0.86rem; color: var(--parchment-dim); margin-top: 3px;
  }

  /* Sub-tabs selector */
  .sub-tabs {
    display: flex;
    border: 1px solid var(--line);
    border-radius: 4px;
    overflow: hidden;
    background: var(--ink-900);
  }
  .sub-tab-btn {
    background: transparent;
    border: none;
    border-right: 1px solid var(--line);
    color: var(--parchment-dim);
    padding: 6px 14px;
    cursor: pointer;
    font-family: var(--font-display);
    font-size: 0.76rem;
    letter-spacing: 0.5px;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .sub-tab-btn:last-child {
    border-right: none;
  }
  .sub-tab-btn:hover {
    background: var(--ink-700);
    color: var(--parchment);
  }
  .sub-tab-btn.active {
    background: var(--brass);
    color: var(--ink-900);
    font-weight: 700;
  }

  /* Summary cards */
  .summary {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }
  .stat-card {
    display: flex; flex-direction: column; gap: 3px;
    padding: 10px 14px;
    background: var(--ink-800);
    border: 1px solid var(--line);
    border-radius: 5px;
  }
  .stat-card.star { border-color: var(--brass-deep); }
  .sc-label {
    font-family: var(--font-flavor); font-style: italic;
    font-size: 0.76rem; color: var(--parchment-faint);
  }
  .sc-val { font-size: 1.15rem; font-weight: 700; color: var(--brass-bright); }
  .sc-sub { font-size: 0.74rem; color: var(--positive); }

  /* Stage table */
  .stage-table {
    display: flex; flex-direction: column;
    padding: 6px;
    background: var(--ink-850);
  }
  .row {
    display: grid;
    grid-template-columns: 1.4fr 1fr 1fr 1fr 0.6fr 1fr 0.5fr;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--ink-700);
    font-size: 0.82rem;
  }
  .row:last-child { border-bottom: none; }
  .row.head {
    font-family: var(--font-display);
    font-size: 0.6rem; letter-spacing: 1px; text-transform: uppercase;
    color: var(--brass-deep);
  }
  .row:not(.head) { border-left: 3px solid var(--sc); }
  .c-stage { display: flex; align-items: center; gap: 7px; color: var(--parchment); font-weight: 600; }
  .r-emoji { font-size: 1.1rem; }
  .c-num { text-align: right; color: var(--parchment-dim); }
  .c-num.live { color: var(--positive); }
  .c-num small { color: var(--parchment-faint); }
  .c-auto { text-align: center; }

  /* Achievements sub-tab styling */
  .ach-summary {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .ach-summary-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px 18px;
    background: var(--ink-800);
    border: 1px solid var(--line);
    position: relative;
    overflow: hidden;
  }
  .ach-summary-card.glow {
    border-color: var(--brass-deep);
    background: linear-gradient(135deg, rgba(212, 168, 67, 0.04), transparent), var(--ink-800);
  }
  .progress-bar-container {
    width: 100%;
    height: 6px;
    background: var(--ink-900);
    border: 1px solid var(--line);
    border-radius: 3px;
    overflow: hidden;
    margin-top: 4px;
  }
  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--brass-deep), var(--brass-bright));
    border-radius: 3px;
    transition: width 0.4s ease-out;
  }

  .achievements-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
    padding-bottom: 20px;
  }
  .ach-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 14px;
    background: linear-gradient(135deg, color-mix(in srgb, var(--ach-color) 4%, transparent), var(--ink-800));
    border: 1px solid var(--line);
    border-left: 4px solid var(--ach-color);
    border-radius: 4px;
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    position: relative;
  }
  .ach-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 6px color-mix(in srgb, var(--ach-color) 40%, transparent);
    border-color: color-mix(in srgb, var(--ach-color) 60%, var(--line));
  }
  .ach-card.locked {
    opacity: 0.55;
    background: var(--ink-850);
    border-left-color: var(--line);
    --ach-color: var(--line);
  }
  .ach-card.locked:hover {
    opacity: 0.8;
    box-shadow: none;
    transform: none;
    border-color: var(--line-bright);
  }
  .ach-card.secret {
    background: repeating-linear-gradient(
      45deg,
      var(--ink-850),
      var(--ink-850) 10px,
      var(--ink-800) 10px,
      var(--ink-800) 20px
    );
    border-left-style: dashed;
    opacity: 0.45;
  }
  .ach-card.secret:hover {
    opacity: 0.6;
  }
  .ach-icon {
    font-size: 1.6rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background: var(--ink-900);
    border: 1px solid var(--line);
    border-radius: 4px;
    flex-shrink: 0;
  }
  .ach-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }
  .ach-name-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .ach-name {
    font-family: var(--font-display);
    font-size: 0.86rem;
    font-weight: 700;
    color: var(--parchment);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ach-bonus {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--positive);
    flex-shrink: 0;
  }
  .ach-card.locked .ach-bonus {
    color: var(--parchment-faint);
  }
  .ach-desc {
    font-family: var(--font-flavor);
    font-style: italic;
    font-size: 0.76rem;
    color: var(--parchment-dim);
    line-height: 1.3;
    margin: 0;
    white-space: normal;
  }
  .ach-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: var(--brass);
    color: var(--ink-900);
    font-size: 0.65rem;
    font-weight: 900;
    width: 13px;
    height: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0,0,0,0.5);
  }
</style>
