<script lang="ts">
  import {
    aether, aetherLifetime, transcendCount, fortuneAllTime,
    transcendPreview, transcend,
    TRANSCENDENCE_SKILLS, transcSkillStatus, transcSkillCostFor, skillLevel, buyTranscendenceSkill,
    fmt,
  } from '../stores/game.svelte'
  import OnboardingTooltip from './OnboardingTooltip.svelte'
  import { playBuy } from '../systems/audio'

  const aeth = $derived(aether())
  const aethLife = $derived(aetherLifetime())
  const transCount = $derived(transcendCount())
  const fortAllTime = $derived(fortuneAllTime())

  const preview = $derived(transcendPreview())
  const nextFortNeed = $derived(Math.max(0, (Math.pow(10, (preview.totalAether + 1) / 5) - 1) * 1e6))

  function handleTranscend() {
    if (!preview.ready) return
    if (confirm(`Transcend the Cosmos?\n\nThis will reset ALL stages, stage prestige currencies, Legacy Points (LP), the LP Ascension tree, and Fortune (★) global upgrades back to zero.\n\nYou will keep stage autobuyers, achievements, statistics, your Aether pool, and Aether upgrades.\n\nIn return, you will gain +${preview.aetherGained} Aether (Æ) to spend on the permanent Aether tree.`)) {
      transcend()
    }
  }

  const tiers = [...new Set(TRANSCENDENCE_SKILLS.map(n => n.tier))].sort((a, b) => a - b)
  function reqNames(reqs: string[]): string {
    return reqs.map(r => TRANSCENDENCE_SKILLS.find(n => n.id === r)?.name ?? r).join(' + ')
  }
  function buy(id: string) { if (buyTranscendenceSkill(id)) playBuy() }
  const pct = (v: number) => `${Math.round(v * 100)}%`
</script>

<div class="tr-wrap">
  <header class="tr-head frame bracketed">
    <div class="tr-title-block">
      <h2 class="tr-title">🜔 TRANSCENDENCE</h2>
      <p class="tr-sub">Transcend the physical universe to enter the Aether realm. Convert your lifetime achievements into cosmic <strong>Aether (Æ)</strong>, unlocking ultimate control over space, time, and automation.</p>
    </div>
    <div class="tr-stats">
      <div class="stat">
        <span class="stat-val ae tnum">Æ {aeth}</span>
        <span class="stat-name">Aether</span>
      </div>
      <div class="stat">
        <span class="stat-val tnum">{transCount}</span>
        <span class="stat-name">transcended</span>
      </div>
      <div class="stat">
        <span class="stat-val stars tnum">★ {fmt(fortAllTime)}</span>
        <span class="stat-name">all-time Fortune</span>
      </div>
    </div>
  </header>

  <OnboardingTooltip
    id="transcendence"
    title="The Transcendence Layer"
    content="Transcending resets all stages, prestige levels, ascension levels, LP, and global upgrades. In exchange, you earn Aether (Æ) based on all-time Fortune. Aether is spent on the permanent Transcendence tree and grants a passive +5% Fortune mint rate multiplier per Æ. Autobuyers remain unlocked."
  />

  <div class="tr-row">
    <!-- Reset Altar -->
    <section class="tr-altar frame">
      <h3 class="section-title">The Altar of Aether</h3>
      <p class="altar-intro">By offering all physical accomplishments to the void, you condense their essence into pure Aether.</p>
      
      <div class="altar-grid">
        <div class="altar-group lost">
          <h4>What is Lost</h4>
          <ul>
            <li>Village, Farm, Mine, Factory stages</li>
            <li>Magic, Space, Time, Multiverse stages</li>
            <li>Stage prestige currencies (Renown, etc.)</li>
            <li>Legacy Points (LP) & LP Ascension Tree</li>
            <li>Current ★ Fortune & Global Upgrade Tree</li>
            <li>Active enchants & space buffers</li>
            <li>Warp charges & Multiverse branch slots</li>
          </ul>
        </div>
        
        <div class="altar-group kept">
          <h4>What is Kept</h4>
          <ul>
            <li>Aether (Æ) & Aether Skill Tree</li>
            <li>Achievements & Game Statistics</li>
            <li>Autobuyer Unlocks (keep their automation)</li>
            <li>Autobuyer toggles & Engine slots <span class="spec-highlight">(requires Meta Automation+)</span></li>
          </ul>
        </div>
      </div>
      
      <div class="altar-preview">
        <div class="preview-item">
          <span class="lbl">Pending Aether:</span>
          <span class="val positive tnum">+{preview.aetherGained} Æ</span>
        </div>
        <div class="preview-item">
          <span class="lbl">Next Aether at:</span>
          <span class="val tnum">★ {fmt(nextFortNeed)}</span>
        </div>
      </div>
      
      <button class="transcend-btn" disabled={!preview.ready} onclick={handleTranscend}>
        {preview.ready ? 'Transcend the Cosmos' : 'Void Offering Not Ready'}
      </button>
      {#if !preview.ready}
        <p class="ready-hint">Mint more ★ Fortune to qualify for Aether (+1 Æ at ★ 1.58M, log-scaled).</p>
      {/if}
    </section>

    <!-- Aether Upgrades Tree -->
    <section class="tr-tree frame">
      <h3 class="section-title">Aether Upgrade Tree <span class="muted">— spend Aether</span></h3>
      <div class="tiers">
        {#each tiers as tier}
          <div class="tier">
            <span class="tier-label">tier {tier}</span>
            <div class="tier-nodes">
              {#each TRANSCENDENCE_SKILLS.filter(n => n.tier === tier) as node}
                {@const lvl = skillLevel(node.id)}
                {@const st = transcSkillStatus(node.id)}
                {@const cost = transcSkillCostFor(node.id)}
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
                      <span class="foot maxed">Æ MAXED</span>
                    {:else if st.locked}
                      <span class="foot locked">🔒 needs {reqNames(node.requires)}</span>
                    {:else}
                      <span class="foot cost {st.affordable ? 'ok' : 'no'}">Æ {cost}</span>
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
  .tr-wrap { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

  .tr-head {
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; padding: 14px 18px; border-color: var(--aether, #9d5fe3); flex-wrap: wrap;
  }
  .tr-title { font-family: var(--font-display); font-size: 1rem; color: var(--aether, #9d5fe3); letter-spacing: 1px; }
  .tr-sub { font-family: var(--font-flavor); font-style: italic; font-size: 0.9rem; color: var(--parchment-dim); margin-top: 4px; max-width: 64ch; }
  .tr-stats { display: flex; gap: 18px; }
  .stat { display: flex; flex-direction: column; align-items: flex-end; }
  .stat-val { font-size: 1.1rem; font-weight: 700; color: var(--brass-bright); }
  .stat-val.ae { color: var(--aether, #9d5fe3); text-shadow: 0 0 8px rgba(157, 95, 227, 0.4); }
  .stat-val.stars { color: var(--brass); }
  .stat-name { font-family: var(--font-flavor); font-style: italic; font-size: 0.74rem; color: var(--parchment-faint); }

  .tr-row { display: grid; grid-template-columns: 1fr 1.3fr; gap: 16px; }
  @media (max-width: 900px) {
    .tr-row { grid-template-columns: 1fr; }
    .altar-grid { grid-template-columns: 1fr; }
  }

  .tr-altar { padding: 16px; display: flex; flex-direction: column; gap: 14px; border-color: var(--line); }
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
  .spec-highlight { color: var(--aether, #9d5fe3); font-style: italic; font-size: 0.68rem; }

  .altar-preview { background: var(--ink-900); border: 1px solid var(--line-bright); padding: 12px; border-radius: 4px; display: flex; flex-direction: column; gap: 6px; }
  .preview-item { display: flex; justify-content: space-between; font-size: 0.82rem; }
  .preview-item .lbl { color: var(--parchment-dim); }
  .preview-item .val { font-weight: 700; }
  .preview-item .val.positive { color: var(--aether, #9d5fe3); text-shadow: 0 0 6px rgba(157, 95, 227, 0.3); }

  .transcend-btn {
    padding: 10px; background: linear-gradient(135deg, var(--ink-700), var(--ink-600)); border: 1px solid var(--line-bright);
    color: var(--parchment-dim); font-family: var(--font-display); font-size: 0.8rem; letter-spacing: 1.5px;
    border-radius: 4px; cursor: pointer; transition: all 0.22s var(--ease-out); text-transform: uppercase;
  }
  .transcend-btn:not(:disabled) {
    background: linear-gradient(135deg, var(--ink-700), #522b92); border-color: var(--aether, #9d5fe3);
    color: var(--parchment);
    box-shadow: 0 0 12px rgba(157, 95, 227, 0.15);
  }
  .transcend-btn:not(:disabled):hover {
    background: linear-gradient(135deg, #522b92, #763cb6);
    box-shadow: 0 0 20px rgba(157, 95, 227, 0.4), inset 0 0 8px rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }
  .transcend-btn:not(:disabled):active { transform: translateY(0); }
  .transcend-btn:disabled { cursor: not-allowed; opacity: 0.5; }
  
  .ready-hint { font-size: 0.68rem; font-family: var(--font-flavor); font-style: italic; color: var(--parchment-faint); text-align: center; margin-top: -4px; }

  /* Tree styles */
  .tr-tree { padding: 16px; border-color: var(--line); display: flex; flex-direction: column; gap: 14px; }
  .tiers { display: flex; flex-direction: column; gap: 12px; }
  .tier { display: flex; flex-direction: column; gap: 6px; }
  .tier-label { font-family: var(--font-display); font-size: 0.58rem; letter-spacing: 2px; color: var(--brass-deep); text-transform: uppercase; }
  .tier-nodes { display: flex; flex-wrap: wrap; gap: 10px; }

  .node {
    width: 100%; max-width: 250px; text-align: left; display: flex; flex-direction: column; gap: 6px;
    padding: 11px 13px; background: var(--ink-800); border: 1px solid var(--line); border-radius: 5px;
    cursor: pointer; font-family: var(--font-mono); color: var(--parchment);
    transition: transform 0.14s var(--ease-out), border-color 0.14s, box-shadow 0.14s;
    --accent: var(--aether, #9d5fe3);
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
  .foot.cost.ok { color: var(--aether, #9d5fe3); text-shadow: 0 0 6px rgba(157, 95, 227, 0.3); }
  .foot.cost.no { color: var(--parchment-faint); }
</style>
