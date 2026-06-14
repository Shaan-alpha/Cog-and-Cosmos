<script lang="ts">
  import { getEffects, removeEffect } from '../stores/effects.svelte'
  const effects = $derived(getEffects())
</script>

<div class="fx-layer" aria-hidden="true">
  {#each effects as fx (fx.id)}
    {#if fx.kind === 'floater'}
      <span
        class="fx-floater"
        style="left:{fx.x}px; top:{fx.y}px; color:{fx.color}"
        onanimationend={() => removeEffect(fx.id)}
      >{fx.text}</span>
    {:else}
      <span
        class="fx-burst"
        style="left:{fx.x}px; top:{fx.y}px"
        onanimationend={(e) => { if (e.target === e.currentTarget) removeEffect(fx.id) }}
      >
        {#each Array.from({ length: fx.count }) as _, i}
          <span
            class="fx-particle {fx.particle}"
            style="--a:{Math.round((360 / fx.count) * i)}deg; --d:{18 + (i % 5) * 7}px"
          ></span>
        {/each}
      </span>
    {/if}
  {/each}
</div>
