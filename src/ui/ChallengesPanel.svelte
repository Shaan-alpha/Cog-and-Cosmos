<script lang="ts">
  import {
    medals, completedChallenges, activeChallenge,
    CHALLENGES, CHALLENGE_BY_ID,
    enterChallenge, abandonChallenge,
    CHALLENGE_SKILLS, challengeSkillStatus, challengeSkillCostFor, skillLevel, buyChallengeSkill,
  } from '../stores/game.svelte'
  import { playBuy } from '../systems/audio'

  const med = $derived(medals())
  const done = $derived(completedChallenges())
  const active = $derived(activeChallenge())
  const activeDef = $derived(active ? CHALLENGE_BY_ID[active] : null)

  function reqUnmet(reqs: string[] | undefined): boolean {
    return !!reqs?.some(r => !done.includes(r))
  }
  function onEnter(id: string) {
    const def = CHALLENGE_BY_ID[id]
    if (confirm(`Enter "${def.name}"?\n\nYour current game is saved and set aside. You'll start a fresh, restricted run:\n${def.description}\n\nGoal: ${def.goalLabel}\n\nReach the goal to earn ${def.medalReward} Medal(s); abandon any time to return to your saved game.`)) {
      enterChallenge(id)
    }
  }
  function onAbandon() {
    if (confirm('Abandon this challenge and restore your saved game? You will earn no Medals.')) abandonChallenge()
  }

  const tiers = [...new Set(CHALLENGE_SKILLS.map(n => n.tier))].sort((a, b) => a - b)
  function reqNames(reqs: string[]): string {
    return reqs.map(r => CHALLENGE_SKILLS.find(n => n.id === r)?.name ?? r).join(' + ')
  }
  function buy(id: string) { if (buyChallengeSkill(id)) playBuy() }
</script>

<div class="ch-wrap">
  <header class="ch-head frame bracketed">
    <div>
      <h2 class="ch-title">⚔ CHALLENGES</h2>
      <p class="ch-sub">Set your progress aside and climb a fresh, restricted run. Clear the goal to earn <strong>Medals (🎖️)</strong> — spent on a permanent Trial tree.</p>
    </div>
    <div class="ch-stats">
      <div class="stat"><span class="stat-val med tnum">🎖️ {med}</span><span class="stat-name">Medals</span></div>
      <div class="stat"><span class="stat-val tnum">{done.length}/{CHALLENGES.length}</span><span class="stat-name">cleared</span></div>
    </div>
  </header>

  {#if active && activeDef}
    <section class="ch-active frame">
      <h3 class="section-title">Active Trial — {activeDef.name}</h3>
      <p class="active-desc">{activeDef.description}</p>
      <div class="active-goal"><span class="lbl">Goal:</span> <span class="val">{activeDef.goalLabel}</span></div>
      <p class="active-hint">Reach the goal anywhere in this run to claim <strong>+{activeDef.medalReward} 🎖️</strong>. Your saved game is waiting.</p>
      <button class="abandon-btn" onclick={onAbandon}>Abandon Trial</button>
    </section>
  {:else}
    <section class="ch-roster frame">
      <h3 class="section-title">Trials</h3>
      <div class="roster-grid">
        {#each CHALLENGES as c}
          {@const cleared = done.includes(c.id)}
          {@const locked = reqUnmet(c.requires)}
          <div class="ch-card {cleared ? 'cleared' : ''} {locked ? 'locked' : ''}">
            <div class="card-top">
              <span class="card-icon">{c.icon}</span>
              <span class="card-name">{c.name}</span>
              {#if cleared}<span class="card-badge">✓ cleared</span>{/if}
            </div>
            <p class="card-desc">{c.description}</p>
            <div class="card-goal"><span class="lbl">Goal:</span> {c.goalLabel}</div>
            <div class="card-foot">
              <span class="reward">🎖️ {c.medalReward}</span>
              {#if locked}
                <span class="req">🔒 needs {reqNames(c.requires ?? [])}</span>
              {:else}
                <button class="enter-btn" onclick={() => onEnter(c.id)}>{cleared ? 'Replay' : 'Enter'}</button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </section>

    <section class="ch-tree frame">
      <h3 class="section-title">Trial Tree <span class="muted">— spend Medals</span></h3>
      <div class="tiers">
        {#each tiers as tier}
          <div class="tier">
            <span class="tier-label">tier {tier}</span>
            <div class="tier-nodes">
              {#each CHALLENGE_SKILLS.filter(n => n.tier === tier) as node}
                {@const lvl = skillLevel(node.id)}
                {@const st = challengeSkillStatus(node.id)}
                {@const cost = challengeSkillCostFor(node.id)}
                <button
                  class="node {st.locked ? 'locked' : ''} {st.maxed ? 'maxed' : ''} {st.buyable ? 'buyable' : ''}"
                  onclick={() => buy(node.id)} disabled={!st.buyable} title={node.description}
                >
                  <div class="node-top">
                    <span class="node-icon">{node.icon}</span>
                    <span class="node-name">{node.name}</span>
                    <span class="node-lvl tnum">{lvl}/{node.maxLevel}</span>
                  </div>
                  <p class="node-desc">{node.description}</p>
                  <div class="node-foot">
                    {#if st.maxed}<span class="foot maxed">🎖️ MAXED</span>
                    {:else if st.locked}<span class="foot locked">🔒 needs {reqNames(node.requires)}</span>
                    {:else}<span class="foot cost {st.affordable ? 'ok' : 'no'}">🎖️ {cost}</span>{/if}
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .ch-wrap { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
  .ch-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 18px; border-color: var(--challenge, #e06b3b); flex-wrap: wrap; }
  .ch-title { font-family: var(--font-display); font-size: 1rem; color: var(--challenge, #e06b3b); letter-spacing: 1px; }
  .ch-sub { font-family: var(--font-flavor); font-style: italic; font-size: 0.9rem; color: var(--parchment-dim); margin-top: 4px; max-width: 64ch; }
  .ch-stats { display: flex; gap: 18px; }
  .stat { display: flex; flex-direction: column; align-items: flex-end; }
  .stat-val { font-size: 1.1rem; font-weight: 700; color: var(--brass-bright); }
  .stat-val.med { color: var(--challenge, #e06b3b); text-shadow: 0 0 8px rgba(224, 107, 59, 0.4); }
  .stat-name { font-family: var(--font-flavor); font-style: italic; font-size: 0.74rem; color: var(--parchment-faint); }

  .section-title { font-family: var(--font-display); font-size: 0.82rem; letter-spacing: 1px; color: var(--brass); margin-bottom: 8px; }
  .section-title .muted { color: var(--parchment-faint); font-size: 0.72rem; }

  .ch-active { padding: 16px; display: flex; flex-direction: column; gap: 10px; border-color: var(--challenge, #e06b3b); }
  .active-desc { font-family: var(--font-flavor); font-style: italic; color: var(--parchment-dim); font-size: 0.86rem; }
  .active-goal { font-size: 0.9rem; } .active-goal .lbl { color: var(--parchment-dim); } .active-goal .val { font-weight: 700; color: var(--brass-bright); }
  .active-hint { font-size: 0.74rem; color: var(--parchment-faint); font-style: italic; }
  .abandon-btn { align-self: flex-start; padding: 8px 14px; background: var(--ink-700); border: 1px solid var(--danger); color: var(--danger); font-family: var(--font-display); font-size: 0.72rem; letter-spacing: 1px; border-radius: 4px; cursor: pointer; }
  .abandon-btn:hover { background: var(--danger); color: var(--ink-900); }

  .ch-roster { padding: 16px; border-color: var(--line); }
  .roster-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
  .ch-card { background: var(--ink-800); border: 1px solid var(--line); border-radius: 6px; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
  .ch-card.cleared { border-color: var(--brass-bright); }
  .ch-card.locked { opacity: 0.55; }
  .card-top { display: flex; align-items: center; gap: 8px; }
  .card-icon { font-size: 1.2rem; } .card-name { flex: 1; font-weight: 700; color: var(--challenge, #e06b3b); font-size: 0.86rem; }
  .card-badge { font-size: 0.68rem; color: var(--brass-bright); }
  .card-desc { font-family: var(--font-flavor); font-style: italic; font-size: 0.76rem; color: var(--parchment-dim); min-height: 2.4em; }
  .card-goal { font-size: 0.76rem; color: var(--parchment); } .card-goal .lbl { color: var(--parchment-faint); }
  .card-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
  .reward { color: var(--challenge, #e06b3b); font-weight: 700; font-size: 0.82rem; }
  .req { font-size: 0.72rem; color: var(--parchment-faint); font-style: italic; }
  .enter-btn { padding: 6px 14px; background: linear-gradient(135deg, var(--ink-700), #7a3a1f); border: 1px solid var(--challenge, #e06b3b); color: var(--parchment); font-family: var(--font-display); font-size: 0.7rem; letter-spacing: 1px; border-radius: 4px; cursor: pointer; }
  .enter-btn:hover { background: linear-gradient(135deg, #7a3a1f, #b8542a); box-shadow: 0 0 12px rgba(224,107,59,0.4); }

  .ch-tree { padding: 16px; border-color: var(--line); display: flex; flex-direction: column; gap: 14px; }
  .tiers { display: flex; flex-direction: column; gap: 12px; }
  .tier { display: flex; flex-direction: column; gap: 6px; }
  .tier-label { font-family: var(--font-display); font-size: 0.58rem; letter-spacing: 2px; color: var(--brass-deep); text-transform: uppercase; }
  .tier-nodes { display: flex; flex-wrap: wrap; gap: 10px; }
  .node { width: 100%; max-width: 250px; text-align: left; display: flex; flex-direction: column; gap: 6px; padding: 11px 13px; background: var(--ink-800); border: 1px solid var(--line); border-radius: 5px; cursor: pointer; font-family: var(--font-mono); color: var(--parchment); transition: transform 0.14s var(--ease-out), border-color 0.14s, box-shadow 0.14s; --accent: var(--challenge, #e06b3b); }
  .node.buyable { border-color: var(--accent); box-shadow: inset 0 0 18px color-mix(in srgb, var(--accent) 8%, transparent); }
  .node.buyable:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.4), 0 0 14px color-mix(in srgb, var(--accent) 40%, transparent); }
  .node.locked { opacity: 0.45; cursor: not-allowed; filter: saturate(0.4); }
  .node.maxed { border-color: var(--brass-bright); opacity: 0.92; cursor: default; }
  .node-top { display: flex; align-items: center; gap: 8px; }
  .node-icon { font-size: 1.2rem; } .node-name { flex: 1; font-size: 0.82rem; font-weight: 700; color: var(--accent); }
  .node-lvl { font-size: 0.78rem; color: var(--parchment-faint); }
  .node-desc { font-family: var(--font-flavor); font-style: italic; font-size: 0.74rem; line-height: 1.35; color: var(--parchment-dim); min-height: 2.7em; }
  .node-foot { margin-top: 2px; } .foot { font-size: 0.78rem; font-weight: 600; }
  .foot.maxed { color: var(--brass-bright); } .foot.locked { color: var(--parchment-faint); font-weight: 400; font-style: italic; }
  .foot.cost.ok { color: var(--challenge, #e06b3b); } .foot.cost.no { color: var(--parchment-faint); }
</style>
