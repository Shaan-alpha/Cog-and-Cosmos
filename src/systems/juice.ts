/**
 * Juice gate — the intensity preference for the render-side effects layer.
 * Mirrors audio.ts: a module-level flag synced from settings (setJuice) so the
 * hot emit sites never touch the store. Pure & node-safe (guards window/matchMedia).
 */
export type JuiceLevel = 'off' | 'subtle' | 'full'
export type JuiceFeature = 'floater' | 'burst' | 'bump' | 'shake'

let level: JuiceLevel = 'full'

export function getJuice(): JuiceLevel { return level }
export function setJuice(l: JuiceLevel): void { level = l }

const ORDER: JuiceLevel[] = ['off', 'subtle', 'full']
export function cycleJuice(): JuiceLevel {
  level = ORDER[(ORDER.indexOf(level) + 1) % ORDER.length]
  return level
}

/** True when the OS asks for reduced motion. Node/SSR-safe (jsdom lacks matchMedia). */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Gate predicate used by every emit site.
 * - off                → nothing
 * - shake              → only at 'full' AND not reduced-motion (it's the most motion-heavy)
 * - bump               → not at 'off', and never under reduced-motion (WAAPI scale = motion the CSS backstop can't neutralise)
 * - floater / burst    → not at 'off'; under reduced-motion the CSS backstop (app.css) renders them instantly instead of moving
 */
export function juiceAllows(feature: JuiceFeature): boolean {
  if (level === 'off') return false
  if (feature === 'shake') return level === 'full' && !prefersReducedMotion()
  if (feature === 'bump') return !prefersReducedMotion()
  return true
}

/** Default for a fresh save: calm-by-default for reduced-motion users. */
export function defaultJuiceLevel(): JuiceLevel {
  return prefersReducedMotion() ? 'subtle' : 'full'
}
