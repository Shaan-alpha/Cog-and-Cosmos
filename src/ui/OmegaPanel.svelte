<script lang="ts">
  import {
    omega, omegaLifetime, omegaCount, aetherLifetime,
    omegaPreview, realityReset,
    OMEGA_SKILLS, omegaSkillStatus, omegaSkillCostFor, skillLevel, buyOmegaSkill,
    fmt,
  } from '../stores/game.svelte'
  import OnboardingTooltip from './OnboardingTooltip.svelte'
  import { playBuy } from '../systems/audio'

  const om = $derived(omega())
  const omCount = $derived(omegaCount())
  const aethLife = $derived(aetherLifetime())

  const preview = $derived(omegaPreview())
  const rmLevel = $derived(skillLevel('om:reality_multiplier'))
  // All-time Aether needed for the next Ω: invert the cube-root gain curve.
  const nextAetherNeed = $derived(
    Math.pow((preview.totalOmega + 1) / (1 + 0.15 * rmLevel), 3) * 1e3
  )

  function handleReset() {
    if (!preview.ready) return
    if (confirm(`Collapse this Reality?\n\nThis resets ALL stages, stage prestige currencies, Legacy Points (LP) + the LP tree, Fortune (★) global upgrades, AND your Aether (Æ) pool + transcend count back to zero.\n\nYou will keep your Aether (Æ) tree, Omega (Ω) + the Omega tree, achievements, and statistics.\n\nIn return, you will gain +${preview.omegaGained} Omega (Ω) to spend on the permanent Reality tree.`)) {
      realityReset()
    }
  }

  const tiers = [...new Set(OMEGA_SKILLS.map(n => n.tier))].sort((a, b) => a - b)
  function reqNames(reqs: string[]): string {
    return reqs.map(r => OMEGA_SKILLS.find(n => n.id === r)?.name ?? r).join(' + ')
  }
  function buy(id: string) { if (buyOmegaSkill(id)) playBuy() }
</script>

<div class="om-wrap">
  <header class="om-head frame bracketed">
    <div class="om-title-block">
      <h2 class="om-title">Ω REALITY RESET</h2>
      <p class="om-sub">Collapse the entire Aether realm into a new reality. Condense all-time <strong>Aether (Æ)</strong> into <strong>Omega (Ω)</strong> — a permanent boost to all production and ★ mint that outlasts every other reset.</p>
    </div>
    <div class="om-stats">
      <div class="stat">
        <span class="stat-val om tnum">Ω {om}</span>
        <span class="stat-name">Omega</span>
      </div>
      <div class="stat">
        <span class="stat-val tnum">{omCount}</span>
        <span class="stat-name">reality resets</span>
      </div>
      <div class="stat">
        <span class="stat-val ae tnum">Æ {fmt(aethLife)}</span>
        <span class="stat-name">all-time Aether</span>
      </div>
    </div>
  </header>

  <OnboardingTooltip
    id="omega"
    title="The Reality Reset Layer"
    content="A Reality Reset collapses everything — including your spent Aether pool — into Omega (Ω), earned from all-time Aether. Ω is spent on the permanent Reality tree and grants a passive +10% to BOTH global production and Fortune mint per Ω. Your Aether tree is kept."
  />

  <div class="om-row">
    <section class="om-altar frame">
      <h3 class="section-title">The Reality Collapse</h3>
      <p class="altar-intro">Fold the realized universe — and the Aether you spent shaping it — into a single seed of Omega.</p>

      <div class="altar-grid">
        <div class="altar-group lost">
          <h4>What is Lost</h4>
          <ul>
            <li>All eight stages & their prestige currencies</li>
            <li>Legacy Points (LP) & LP Ascension Tree</li>
            <li>Current ★ Fortune & Global Upgrade Tree</li>
            <li>Aether (Æ) pool & transcend count</li>
            <li>Active enchants & space buffers</li>
            <li>Warp charges & Multiverse branch slots</li>
          </ul>
        </div>

        <div class="altar-group kept">
          <h4>What is Kept</h4>
          <ul>
            <li>Omega (Ω) & the Reality Tree</li>
            <li>Aether (Æ) Skill Tree (levels only)</li>
            <li>Achievements & Game Statistics</li>
            <li>Autobuyer toggles & Engine slots <span class="spec-highlight">(requires Eternal Engine)</span></li>
          </ul>
        </div>
      </div>

      <div class="altar-preview">
        <div class="preview-item">
          <span class="lbl">Pending Omega:</span>
          <span class="val positive tnum">+{preview.omegaGained} Ω</span>
        </div>
        <div class="preview-item">
          <span class="lbl">Next Omega at:</span>
          <span class="val tnum">Æ {fmt(nextAetherNeed)} all-time</span>
        </div>
      </div>

      <button class="reset-btn" disabled={!preview.ready} onclick={handleReset}>
        {preview.ready ? 'Collapse Reality' : 'Reality Not Ready'}
      </button>
      {#if !preview.ready}
        <p class="ready-hint">Earn more all-time Aether (Æ) to qualify for Omega (+1 Ω at Æ 1,000 all-time, cube-root scaled).</p>
      {/if}
    </section>

    <section class="om-tree frame">
      <h3 class="section-title">Reality Upgrade Tree <span class="muted">— spend Omega</span></h3>
      <div class="tiers">
        {#each tiers as tier}
          <div class="tier">
            <span class="tier-label">tier {tier}</span>
            <div class="tier-nodes">
              {#each OMEGA_SKILLS.filter(n => n.tier === tier) as node}
                {@const lvl = skillLevel(node.id)}
                {@const st = omegaSkillStatus(node.id)}
                {@const cost = omegaSkillCostFor(node.id)}
                <button
                  class="node {st.locked ? 'locked' : ''} {st.maxed ? 'maxed' : ''} {st.buyable ? 'buyable' : ''}"
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

                  <div class="node-foot">
                    {#if st.maxed}
                      <span class="foot maxed">Ω MAXED</span>
                    {:else if st.locked}
                      <span class="foot locked">🔒 needs {reqNames(node.requires)}</span>
                    {:else}
                      <span class="foot cost {st.affordable ? 'ok' : 'no'}">Ω {cost}</span>
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
</div>

<style>
  .om-wrap { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

  .om-head {
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; padding: 14px 18px; border-color: var(--omega, #ffd76b); flex-wrap: wrap;
  }
  .om-title { font-family: var(--font-display); font-size: 1rem; color: var(--omega, #ffd76b); letter-spacing: 1px; }
  .om-sub { font-family: var(--font-flavor); font-style: italic; font-size: 0.9rem; color: var(--parchment-dim); margin-top: 4px; max-width: 64ch; }
  .om-stats { display: flex; gap: 18px; }
  .stat { display: flex; flex-direction: column; align-items: flex-end; }
  .stat-val { font-size: 1.1rem; font-weight: 700; color: var(--brass-bright); }
  .stat-val.om { color: var(--omega, #ffd76b); text-shadow: 0 0 8px rgba(255, 215, 107, 0.4); }
  .stat-val.ae { color: var(--aether, #9d5fe3); }
  .stat-name { font-family: var(--font-flavor); font-style: italic; font-size: 0.74rem; color: var(--parchment-faint); }

  .om-row { display: grid; grid-template-columns: 1fr 1.3fr; gap: 16px; }
  @media (max-width: 900px) {
    .om-row { grid-template-columns: 1fr; }
  }

  .om-altar { padding: 16px; display: flex; flex-direction: column; gap: 14px; border-color: var(--line); }
  .section-title { font-family: var(--font-display); font-size: 0.82rem; letter-spacing: 1px; color: var(--brass); margin-bottom: 4px; }
  .section-title .muted { color: var(--parchment-faint); font-size: 0.72rem; }

  .altar-intro { font-family: var(--font-flavor); font-style: italic; font-size: 0.84rem; color: var(--parchment-dim); }

  .altar-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .altar-group { background: var(--ink-850); border: 1px solid var(--line); padding: 10px; border-radius: 4px; }
  .altar-group h4 { font-size: 0.76rem; font-weight: 700; margin-bottom: 6px; letter-spacing: 0.5px; }
  .altar-group.lost h4 { color: var(--danger); }
  .altar-group.kept h4 { color: var(--positive); }
  .altar-group ul { list-style: none; font-size: 0.72rem; display: flex; flex-direction: column; gap: 4px; color: var(--parchment-dim); }
  .altar-group.lost li::before { content: '× '; color: var(--danger); font-weight: 700; }
  .altar-group.kept li::before { content: '✓ '; color: var(--positive); font-weight: 700; }
  .spec-highlight { color: var(--omega, #ffd76b); font-style: italic; font-size: 0.68rem; }

  .altar-preview { background: var(--ink-900); border: 1px solid var(--line-bright); padding: 12px; border-radius: 4px; display: flex; flex-direction: column; gap: 6px; }
  .preview-item { display: flex; justify-content: space-between; font-size: 0.82rem; }
  .preview-item .lbl { color: var(--parchment-dim); }
  .preview-item .val { font-weight: 700; }
  .preview-item .val.positive { color: var(--omega, #ffd76b); text-shadow: 0 0 6px rgba(255, 215, 107, 0.3); }

  .reset-btn {
    padding: 10px; background: linear-gradient(135deg, var(--ink-700), var(--ink-600)); border: 1px solid var(--line-bright);
    color: var(--parchment-dim); font-family: var(--font-display); font-size: 0.8rem; letter-spacing: 1.5px;
    border-radius: 4px; cursor: pointer; transition: all 0.22s var(--ease-out); text-transform: uppercase;
  }
  .reset-btn:not(:disabled) {
    background: linear-gradient(135deg, var(--ink-700), #8a6a14); border-color: var(--omega, #ffd76b);
    color: var(--parchment);
    box-shadow: 0 0 12px rgba(255, 215, 107, 0.15);
  }
  .reset-btn:not(:disabled):hover {
    background: linear-gradient(135deg, #8a6a14, #b8902a);
    box-shadow: 0 0 20px rgba(255, 215, 107, 0.4), inset 0 0 8px rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
  .reset-btn:not(:disabled):active { transform: translateY(0); }
  .reset-btn:disabled { cursor: not-allowed; opacity: 0.5; }

  .ready-hint { font-size: 0.68rem; font-family: var(--font-flavor); font-style: italic; color: var(--parchment-faint); text-align: center; margin-top: -4px; }

  .om-tree { padding: 16px; border-color: var(--line); display: flex; flex-direction: column; gap: 14px; }
  .tiers { display: flex; flex-direction: column; gap: 12px; }
  .tier { display: flex; flex-direction: column; gap: 6px; }
  .tier-label { font-family: var(--font-display); font-size: 0.58rem; letter-spacing: 2px; color: var(--brass-deep); text-transform: uppercase; }
  .tier-nodes { display: flex; flex-wrap: wrap; gap: 10px; }

  .node {
    width: 100%; max-width: 250px; text-align: left; display: flex; flex-direction: column; gap: 6px;
    padding: 11px 13px; background: var(--ink-800); border: 1px solid var(--line); border-radius: 5px;
    cursor: pointer; font-family: var(--font-mono); color: var(--parchment);
    transition: transform 0.14s var(--ease-out), border-color 0.14s, box-shadow 0.14s;
    --accent: var(--omega, #ffd76b);
  }
  .node.buyable { border-color: var(--accent); box-shadow: inset 0 0 18px color-mix(in srgb, var(--accent) 8%, transparent); }
  .node.buyable:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.4), 0 0 14px color-mix(in srgb, var(--accent) 40%, transparent); }
  .node.buyable:active { transform: translateY(0) scale(0.98); }
  .node.locked { opacity: 0.45; cursor: not-allowed; filter: saturate(0.4); }
  .node.maxed { border-color: var(--brass-bright); opacity: 0.92; cursor: default; }
  .node:disabled:not(.maxed):not(.locked) { cursor: not-allowed; }

  .node-top { display: flex; align-items: center; gap: 8px; }
  .node-icon { font-size: 1.2rem; }
  .node-name { flex: 1; font-size: 0.82rem; font-weight: 700; color: var(--accent); letter-spacing: 0.3px; }
  .node-lvl { font-size: 0.78rem; color: var(--parchment-faint); }
  .node-desc { font-family: var(--font-flavor); font-style: italic; font-size: 0.74rem; line-height: 1.35; color: var(--parchment-dim); min-height: 2.7em; }

  .node-foot { margin-top: 2px; }
  .foot { font-size: 0.78rem; font-weight: 600; }
  .foot.maxed { color: var(--brass-bright); }
  .foot.locked { color: var(--parchment-faint); font-weight: 400; font-style: italic; }
  .foot.cost.ok { color: var(--omega, #ffd76b); text-shadow: 0 0 6px rgba(255, 215, 107, 0.3); }
  .foot.cost.no { color: var(--parchment-faint); }
</style>
