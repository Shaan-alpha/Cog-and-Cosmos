<script lang="ts">
  import {
    stageState as getStage,
    STAGE_DEFS,
    branchSlotCap,
    branchSlots,
    dupPct,
    echoSustain,
    convergencePreview,
    convergenceMult,
    assignBranchSlot,
    castConvergence,
    fmt,
  } from '../stores/game.svelte'
  import { playPrestige } from '../systems/audio'

  interface Props { stageId: string }
  let { stageId }: Props = $props()

  const slotCap = $derived(branchSlotCap())
  const slots = $derived(branchSlots())
  const dupPercent = $derived(dupPct())
  const sustain = $derived(echoSustain())
  const convPreview = $derived(convergencePreview())
  const convMult = $derived(convergenceMult())

  const unlockedStages = $derived.by(() => {
    const list = []
    for (const [sid, sdef] of Object.entries(STAGE_DEFS)) {
      if (getStage(sid)?.unlocked) list.push({ id: sid, name: sdef.name, emoji: sdef.emoji })
    }
    return list
  })

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
</script>

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
    <button class="cast-btn frame" class:go={convPreview.ready} disabled={!convPreview.ready} onclick={handleConvergence}>
      {convPreview.ready ? 'Collapse the Branches 💠' : 'Convergence locked (need Core · all stages · 1e12 Shards)'}
    </button>
  </div>
</div>
