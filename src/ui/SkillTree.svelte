<script lang="ts">
  import {
    GLOBAL_SKILLS, skillLevel, skillStatus, skillCostFor, buySkill,
    fortune, engine, globalMult, fmt,
  } from '../stores/game.svelte'
  import OnboardingTooltip from './OnboardingTooltip.svelte'
  import { playBuy } from '../systems/audio'

  const fort = $derived(fortune())
  const eng  = $derived(engine())
  const globalTotal = () => globalMult()
  const tiers = [...new Set(GLOBAL_SKILLS.map(n => n.tier))].sort((a, b) => a - b)

  function reqNames(reqs: string[]): string {
    return reqs.map(r => GLOBAL_SKILLS.find(n => n.id === r)?.name ?? r).join(' + ')
  }
  function buy(id: string) {
    if (buySkill(id)) playBuy()
  }
  const pct = (v: number) => `${Math.round(v * 100)}%`
</script>

<div class="tree-wrap">
  <header class="tree-head frame bracketed">
    <div class="tree-title-block">
      <h2 class="tree-title">✦ GLOBAL SKILL TREE</h2>
      <p class="tree-sub">Spend Fortune (★) on permanent bonuses that touch every stage.</p>
    </div>
    <div class="tree-stats">
      <div class="stat">
        <span class="stat-val tnum">★ {fmt(fort)}</span>
        <span class="stat-name">Fortune</span>
      </div>
      <div class="stat">
        <span class="stat-val global tnum">×{fmt(globalTotal())}</span>
        <span class="stat-name">global output</span>
      </div>
      <div class="stat">
        <span class="stat-val engine tnum">×{fmt(eng.engineMult)}</span>
        <span class="stat-name">mint rate</span>
      </div>
    </div>
  </header>

  <OnboardingTooltip
    id="skills"
    title="The Global Skill Tree"
    content="Spend your minted Fortune (★) here to unlock permanent bonuses. These skills increase production speed across all stages and accelerate the Fortune Engine's minting speed. Best of all, skill tree progress is never reset by prestiging!"
  />

  <div class="tiers">
    {#each tiers as tier}
      <div class="tier">
        <span class="tier-label">tier {tier}</span>
        <div class="tier-nodes">
          {#each GLOBAL_SKILLS.filter(n => n.tier === tier) as node}
            {@const lvl = skillLevel(node.id)}
            {@const st = skillStatus(node.id)}
            {@const cost = skillCostFor(node.id)}
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
                  <span class="foot maxed">★ MAXED</span>
                {:else if st.locked}
                  <span class="foot locked">🔒 needs {reqNames(node.requires)}</span>
                {:else}
                  <span class="foot cost {st.affordable ? 'ok' : 'no'}">★ {fmt(cost)}</span>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .tree-wrap {
    max-width: 1100px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .tree-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 18px;
    border-color: var(--brass-deep);
    flex-wrap: wrap;
  }
  .tree-title { font-family: var(--font-display); font-size: 1rem; color: var(--brass-bright); letter-spacing: 1px; }
  .tree-sub { font-family: var(--font-flavor); font-style: italic; font-size: 0.9rem; color: var(--parchment-dim); margin-top: 4px; }

  .tree-stats { display: flex; gap: 18px; }
  .stat { display: flex; flex-direction: column; align-items: flex-end; }
  .stat-val { font-size: 1.1rem; font-weight: 700; color: var(--brass-bright); }
  .stat-val.global { color: var(--village); }
  .stat-val.engine { color: var(--brass); }
  .stat-name { font-family: var(--font-flavor); font-style: italic; font-size: 0.74rem; color: var(--parchment-faint); }

  .tiers { display: flex; flex-direction: column; gap: 10px; }
  .tier { display: flex; flex-direction: column; gap: 6px; }
  .tier-label {
    font-family: var(--font-display); font-size: 0.58rem; letter-spacing: 2px;
    color: var(--brass-deep); text-transform: uppercase;
  }
  .tier-nodes { display: flex; flex-wrap: wrap; gap: 10px; }

  .node {
    width: 240px;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 11px 13px;
    background: var(--ink-800);
    border: 1px solid var(--line);
    border-radius: 5px;
    cursor: pointer;
    font-family: var(--font-mono);
    color: var(--parchment);
    transition: transform 0.14s var(--ease-out), border-color 0.14s, box-shadow 0.14s;
  }
  .node.global { --accent: var(--village); }
  .node.engine { --accent: var(--brass); }

  .node.buyable { border-color: var(--accent); box-shadow: inset 0 0 18px color-mix(in srgb, var(--accent) 8%, transparent); }
  .node.buyable:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.4), 0 0 14px color-mix(in srgb, var(--accent) 40%, transparent); }
  .node.buyable:active { transform: translateY(0) scale(0.98); }
  .node.locked { opacity: 0.45; cursor: not-allowed; filter: saturate(0.4); }
  .node.maxed { border-color: var(--brass); opacity: 0.92; cursor: default; }
  .node:disabled:not(.maxed):not(.locked) { cursor: not-allowed; }

  .node-top { display: flex; align-items: center; gap: 8px; }
  .node-icon { font-size: 1.2rem; }
  .node-name { flex: 1; font-size: 0.88rem; font-weight: 700; color: var(--accent); letter-spacing: 0.3px; }
  .node-lvl { font-size: 0.78rem; color: var(--parchment-faint); }

  .node-desc {
    font-family: var(--font-flavor); font-style: italic;
    font-size: 0.78rem; line-height: 1.35; color: var(--parchment-dim);
  }
  .node-effect { font-size: 0.72rem; color: var(--accent); letter-spacing: 0.3px; }
  .node-cur { color: var(--parchment-faint); }

  .node-foot { margin-top: 2px; }
  .foot { font-size: 0.78rem; font-weight: 600; }
  .foot.maxed { color: var(--brass-bright); }
  .foot.locked { color: var(--parchment-faint); font-weight: 400; font-style: italic; }
  .foot.cost.ok { color: var(--brass-bright); }
  .foot.cost.no { color: var(--parchment-faint); }
</style>
