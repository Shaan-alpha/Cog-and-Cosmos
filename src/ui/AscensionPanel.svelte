<script lang="ts">
  import {
    STAGE_DEFS, stageState as getStage, isStageUnlocked,
    legacyPoints, ascensionCount, ascensionPreview, canAscend, ascendStage,
    ASCENSION_SKILLS, ascSkillStatus, ascSkillCostFor, skillLevel, buyAscensionSkill,
    globalMult, fmt,
  } from '../stores/game.svelte'
  import OnboardingTooltip from './OnboardingTooltip.svelte'
  import { playBuy, playPrestige } from '../systems/audio'

  const lp = $derived(legacyPoints())
  const gmult = $derived(globalMult())

  // Stage roster, in canonical order, that the player has reached.
  const stages = $derived(
    Object.values(STAGE_DEFS).filter(d => isStageUnlocked(d.id))
  )
  const totalAscensions = $derived(stages.reduce((n, d) => n + ascensionCount(d.id), 0))

  function handleAscend(id: string, name: string) {
    const gain = ascensionPreview(id)
    if (gain <= 0) return
    if (confirm(`Ascend the ${name}?\n\nThis is a DEEP reset — it wipes the stage's generators, currency, AND its prestige currency/count back to zero. In return you mint +${gain} Legacy Points (LP) toward the permanent Ascension tree.`)) {
      if (ascendStage(id) > 0) playPrestige()
    }
  }

  const tiers = [...new Set(ASCENSION_SKILLS.map(n => n.tier))].sort((a, b) => a - b)
  function reqNames(reqs: string[]): string {
    return reqs.map(r => ASCENSION_SKILLS.find(n => n.id === r)?.name ?? r).join(' + ')
  }
  function buy(id: string) { if (buyAscensionSkill(id)) playBuy() }
  const pct = (v: number) => `${Math.round(v * 100)}%`
</script>

<div class="asc-wrap">
  <header class="asc-head frame bracketed">
    <div class="asc-title-block">
      <h2 class="asc-title">🜲 ASCENSION</h2>
      <p class="asc-sub">Ascend a stage for a deep reset → permanent <strong>Legacy Points</strong>, spent on a tree that lifts every stage forever.</p>
    </div>
    <div class="asc-stats">
      <div class="stat">
        <span class="stat-val lp tnum">🜲 {fmt(lp)}</span>
        <span class="stat-name">Legacy Points</span>
      </div>
      <div class="stat">
        <span class="stat-val tnum">{totalAscensions}</span>
        <span class="stat-name">total ascensions</span>
      </div>
      <div class="stat">
        <span class="stat-val global tnum">×{fmt(gmult)}</span>
        <span class="stat-name">global output</span>
      </div>
    </div>
  </header>

  <OnboardingTooltip
    id="ascension"
    title="The Ascension Layer"
    content="Ascension is the meta-prestige beyond stage prestige. It fully resets a stage — including its prestige currency — but mints rare Legacy Points (LP). LP buys permanent global bonuses that survive every reset. The exponent is harsher (^0.33), so each Ascension is a deliberate, deeper commitment."
  />

  <!-- Per-stage Ascension cards -->
  <section class="asc-stages">
    <h3 class="section-title">Ascend a Stage</h3>
    <div class="stage-cards">
      {#each stages as d}
        {@const gain = ascensionPreview(d.id)}
        {@const able = canAscend(d.id)}
        {@const count = ascensionCount(d.id)}
        {@const prestiged = (getStage(d.id)?.prestigeCount ?? 0) >= 1}
        <div class="asc-card frame" style="--sc: {d.color}" class:ready={able}>
          <div class="card-head">
            <span class="card-emoji">{d.emoji}</span>
            <span class="card-name">{d.name}</span>
            {#if count > 0}<span class="card-count" title="Times ascended">🜲×{count}</span>{/if}
          </div>
          <div class="card-body">
            {#if able}
              <span class="card-gain tnum">+{gain} LP</span>
            {:else if !prestiged}
              <span class="card-hint">prestige this stage at least once first</span>
            {:else}
              <span class="card-hint">accrue more lifetime {d.primaryCurrency.name} to mint LP</span>
            {/if}
          </div>
          <button class="ascend-btn" disabled={!able} onclick={() => handleAscend(d.id, d.name)}>
            ascend
          </button>
        </div>
      {/each}
    </div>
  </section>

  <!-- LP meta tree -->
  <section class="asc-tree">
    <h3 class="section-title">Ascension Tree <span class="muted">— spend Legacy Points</span></h3>
    <div class="tiers">
      {#each tiers as tier}
        <div class="tier">
          <span class="tier-label">tier {tier}</span>
          <div class="tier-nodes">
            {#each ASCENSION_SKILLS.filter(n => n.tier === tier) as node}
              {@const lvl = skillLevel(node.id)}
              {@const st = ascSkillStatus(node.id)}
              {@const cost = ascSkillCostFor(node.id)}
              <button
                class="node {node.effect} {st.locked ? 'locked' : ''} {st.maxed ? 'maxed' : ''} {st.buyable ? 'buyable' : ''}"
                onclick={() => buy(node.id)}
                disabled={!st.buyable}
                title={node.description}
              >
                <div class="node-top">
                  <span class="node-icon">{node.icon}</span>
                  <span class="node-name">{node.name}</span>
                  <span class="node-lvl tnum">{lvl}/{node.maxLevel}</span>
                </div>
                <p class="node-desc">{node.description}</p>
                <div class="node-effect">
                  {node.effect === 'global' ? '⚙ production' : '★ mint'}
                  +{pct(node.effectPerLevel)}/lvl
                  {#if lvl > 0}<span class="node-cur">(now +{pct(node.effectPerLevel * lvl)})</span>{/if}
                </div>
                <div class="node-foot">
                  {#if st.maxed}
                    <span class="foot maxed">🜲 MAXED</span>
                  {:else if st.locked}
                    <span class="foot locked">🔒 needs {reqNames(node.requires)}</span>
                  {:else}
                    <span class="foot cost {st.affordable ? 'ok' : 'no'}">🜲 {fmt(cost)}</span>
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </section>
</div>

<style>
  .asc-wrap { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

  .asc-head {
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; padding: 14px 18px; border-color: var(--multiverse); flex-wrap: wrap;
  }
  .asc-title { font-family: var(--font-display); font-size: 1rem; color: var(--multiverse); letter-spacing: 1px; }
  .asc-sub { font-family: var(--font-flavor); font-style: italic; font-size: 0.9rem; color: var(--parchment-dim); margin-top: 4px; max-width: 64ch; }
  .asc-stats { display: flex; gap: 18px; }
  .stat { display: flex; flex-direction: column; align-items: flex-end; }
  .stat-val { font-size: 1.1rem; font-weight: 700; color: var(--brass-bright); }
  .stat-val.lp { color: var(--multiverse); }
  .stat-val.global { color: var(--village); }
  .stat-name { font-family: var(--font-flavor); font-style: italic; font-size: 0.74rem; color: var(--parchment-faint); }

  .section-title { font-family: var(--font-display); font-size: 0.82rem; letter-spacing: 1px; color: var(--brass); margin-bottom: 10px; }
  .section-title .muted { color: var(--parchment-faint); font-size: 0.72rem; }

  /* Stage cards */
  .stage-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
  .asc-card {
    padding: 11px 13px; background: var(--ink-850); border-color: var(--line);
    display: flex; flex-direction: column; gap: 8px;
  }
  .asc-card.ready { border-color: var(--sc); box-shadow: inset 0 0 16px color-mix(in srgb, var(--sc) 8%, transparent); }
  .card-head { display: flex; align-items: center; gap: 8px; }
  .card-emoji { font-size: 1.3rem; }
  .card-name { flex: 1; font-size: 0.86rem; font-weight: 700; color: var(--sc); }
  .card-count { font-size: 0.72rem; color: var(--multiverse); }
  .card-body { min-height: 1.5em; display: flex; align-items: center; }
  .card-gain { font-size: 0.95rem; font-weight: 700; color: var(--multiverse); }
  .card-hint { font-family: var(--font-flavor); font-style: italic; font-size: 0.74rem; color: var(--parchment-faint); }
  .ascend-btn {
    padding: 6px 14px; background: transparent; border: 1px solid var(--line-bright); border-radius: 3px;
    color: var(--parchment-dim); cursor: pointer; font-family: var(--font-display);
    font-size: 0.68rem; letter-spacing: 1px; text-transform: lowercase; transition: all 0.16s;
  }
  .asc-card.ready .ascend-btn { border-color: var(--sc); color: var(--sc); }
  .asc-card.ready .ascend-btn:hover { background: var(--sc); color: var(--ink-900); box-shadow: 0 0 14px color-mix(in srgb, var(--sc) 50%, transparent); }
  .ascend-btn:disabled { cursor: not-allowed; opacity: 0.4; }

  /* Tree (mirrors SkillTree) */
  .tiers { display: flex; flex-direction: column; gap: 10px; }
  .tier { display: flex; flex-direction: column; gap: 6px; }
  .tier-label { font-family: var(--font-display); font-size: 0.58rem; letter-spacing: 2px; color: var(--brass-deep); text-transform: uppercase; }
  .tier-nodes { display: flex; flex-wrap: wrap; gap: 10px; }

  .node {
    width: 240px; text-align: left; display: flex; flex-direction: column; gap: 6px;
    padding: 11px 13px; background: var(--ink-800); border: 1px solid var(--line); border-radius: 5px;
    cursor: pointer; font-family: var(--font-mono); color: var(--parchment);
    transition: transform 0.14s var(--ease-out), border-color 0.14s, box-shadow 0.14s;
  }
  .node.global { --accent: var(--village); }
  .node.engine { --accent: var(--brass); }
  .node.buyable { border-color: var(--accent); box-shadow: inset 0 0 18px color-mix(in srgb, var(--accent) 8%, transparent); }
  .node.buyable:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.4), 0 0 14px color-mix(in srgb, var(--accent) 40%, transparent); }
  .node.buyable:active { transform: translateY(0) scale(0.98); }
  .node.locked { opacity: 0.45; cursor: not-allowed; filter: saturate(0.4); }
  .node.maxed { border-color: var(--multiverse); opacity: 0.92; cursor: default; }
  .node:disabled:not(.maxed):not(.locked) { cursor: not-allowed; }

  .node-top { display: flex; align-items: center; gap: 8px; }
  .node-icon { font-size: 1.2rem; }
  .node-name { flex: 1; font-size: 0.88rem; font-weight: 700; color: var(--accent); letter-spacing: 0.3px; }
  .node-lvl { font-size: 0.78rem; color: var(--parchment-faint); }
  .node-desc { font-family: var(--font-flavor); font-style: italic; font-size: 0.78rem; line-height: 1.35; color: var(--parchment-dim); }
  .node-effect { font-size: 0.72rem; color: var(--accent); letter-spacing: 0.3px; }
  .node-cur { color: var(--parchment-faint); }
  .node-foot { margin-top: 2px; }
  .foot { font-size: 0.78rem; font-weight: 600; }
  .foot.maxed { color: var(--multiverse); }
  .foot.locked { color: var(--parchment-faint); font-weight: 400; font-style: italic; }
  .foot.cost.ok { color: var(--brass-bright); }
  .foot.cost.no { color: var(--parchment-faint); }
</style>
