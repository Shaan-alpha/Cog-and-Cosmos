<script lang="ts">
  import { collectedRelics, relicStats } from '../stores/game.svelte'
  import { RELICS, RELIC_SETS, type RelicRarity } from '../data/collections'

  const owned = $derived(new Set(collectedRelics()))
  const stats = $derived(relicStats())
  const tiers: RelicRarity[] = ['common', 'uncommon', 'rare', 'legendary']
  const TIER_LABEL: Record<RelicRarity, string> = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', legendary: 'Legendary' }
  const DROP_SRC: Record<RelicRarity, string> = {
    common: 'drops on stage prestige', uncommon: 'drops on ascension / challenge clear',
    rare: 'drops on transcendence', legendary: 'drops on reality reset',
  }
  function tierRelics(r: RelicRarity) { return RELICS.filter(x => x.rarity === r) }
  function setFor(r: RelicRarity) { return RELIC_SETS.find(s => s.rarity === r) }
  function setComplete(r: RelicRarity) { return tierRelics(r).every(x => owned.has(x.id)) }
  function ownedCount(r: RelicRarity) { return tierRelics(r).filter(x => owned.has(x.id)).length }
</script>

<div class="col-wrap">
  <header class="col-head frame bracketed">
    <div>
      <h2 class="col-title">⬡ COLLECTIONS</h2>
      <p class="col-sub">Relics drop as you reset the cosmos. Each grants a permanent passive bonus; complete a rarity set for more.</p>
    </div>
    <div class="col-stats">
      <span class="stat-val rel tnum">{stats.collected} / {stats.total}</span>
      <span class="stat-name">relics</span>
    </div>
  </header>

  {#each tiers as tier}
    {@const relics = tierRelics(tier)}
    {@const set = setFor(tier)}
    {@const complete = setComplete(tier)}
    <section class="tier frame">
      <div class="tier-head">
        <h3 class="tier-title r-{tier}">{TIER_LABEL[tier]}</h3>
        <span class="tier-count tnum">{ownedCount(tier)} / {relics.length}</span>
        {#if set}
          <span class="tier-set {complete ? 'done' : ''}">Set: +{set.completionPct}% {set.effect === 'engine' ? 'mint' : 'production'} {complete ? '✓' : ''}</span>
        {/if}
      </div>
      <div class="relic-grid">
        {#each relics as r}
          {@const have = owned.has(r.id)}
          <div class="relic {have ? 'have' : 'locked'} r-{tier}" title={have ? r.description : DROP_SRC[tier]}>
            <span class="relic-icon">{have ? r.icon : '❔'}</span>
            <span class="relic-name">{have ? r.name : '???'}</span>
            <span class="relic-bonus">{have ? `+${r.bonusPct}% ${r.effect === 'engine' ? 'mint' : 'prod'}` : DROP_SRC[tier]}</span>
          </div>
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
  .col-wrap { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
  .col-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 18px; border-color: var(--relic, #6fae8f); flex-wrap: wrap; }
  .col-title { font-family: var(--font-display); font-size: 1rem; color: var(--relic, #6fae8f); letter-spacing: 1px; }
  .col-sub { font-family: var(--font-flavor); font-style: italic; font-size: 0.9rem; color: var(--parchment-dim); margin-top: 4px; max-width: 64ch; }
  .col-stats { display: flex; flex-direction: column; align-items: flex-end; }
  .stat-val { font-size: 1.1rem; font-weight: 700; color: var(--brass-bright); }
  .stat-val.rel { color: var(--relic, #6fae8f); }
  .stat-name { font-family: var(--font-flavor); font-style: italic; font-size: 0.74rem; color: var(--parchment-faint); }

  .tier { padding: 14px 16px; border-color: var(--line); display: flex; flex-direction: column; gap: 10px; }
  .tier-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .tier-title { font-family: var(--font-display); font-size: 0.8rem; letter-spacing: 1px; }
  .tier-title.r-common { color: var(--parchment-dim); }
  .tier-title.r-uncommon { color: var(--positive); }
  .tier-title.r-rare { color: var(--aether, #9d5fe3); }
  .tier-title.r-legendary { color: var(--omega, #ffd76b); }
  .tier-count { font-size: 0.78rem; color: var(--parchment-faint); }
  .tier-set { margin-left: auto; font-size: 0.74rem; color: var(--parchment-faint); }
  .tier-set.done { color: var(--brass-bright); }

  .relic-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
  .relic { display: flex; flex-direction: column; gap: 4px; padding: 10px; background: var(--ink-800); border: 1px solid var(--line); border-radius: 5px; }
  .relic.locked { opacity: 0.5; filter: saturate(0.3); }
  .relic.have.r-rare { border-color: color-mix(in srgb, var(--aether, #9d5fe3) 50%, var(--line)); }
  .relic.have.r-legendary { border-color: color-mix(in srgb, var(--omega, #ffd76b) 50%, var(--line)); }
  .relic-icon { font-size: 1.4rem; }
  .relic-name { font-size: 0.8rem; font-weight: 700; color: var(--parchment); }
  .relic-bonus { font-family: var(--font-flavor); font-style: italic; font-size: 0.72rem; color: var(--parchment-dim); }
  @media (max-width: 720px) { .relic-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); } }
</style>
