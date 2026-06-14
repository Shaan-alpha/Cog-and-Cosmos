import type { Action } from 'svelte/action'
import { juiceAllows } from '../../systems/juice'

const FRAMES: Keyframe[] = [
  { transform: 'scale(1)' },
  { transform: 'scale(1.28)', offset: 0.35 },
  { transform: 'scale(1)' },
]
const OPTS: KeyframeAnimationOptions = { duration: 320, easing: 'ease-out' }

/**
 * use:bump={value} — replays a brief scale pulse whenever `value` increases.
 * Render-only feedback; gated by juiceAllows('bump'). WAAPI is optional-chained
 * so it no-ops where unavailable (e.g. jsdom without a stub).
 */
export const bump: Action<HTMLElement, number> = (node, value) => {
  let prev = value ?? 0
  return {
    update(next: number) {
      const n = next ?? 0
      if (n > prev && juiceAllows('bump')) node.animate?.(FRAMES, OPTS)
      prev = n
    },
  }
}
