/**
 * Effects bus — the transient, render-only queue for the juice layer.
 * Mirrors the toast bus: reactive $state here, exposed via accessor functions
 * (you cannot export a raw $state from a .svelte.ts module). Every emit no-ops
 * when the juice gate disallows it, so call sites stay dumb. Hard caps keep the
 * DOM bounded; nodes self-remove on animationend via removeEffect().
 */
import { juiceAllows } from '../systems/juice'

export type BurstKind = 'spark' | 'star'
export interface Floater { id: number; kind: 'floater'; x: number; y: number; text: string; color: string }
export interface Burst { id: number; kind: 'burst'; x: number; y: number; particle: BurstKind; count: number }
export type Effect = Floater | Burst

export const MAX_FLOATERS = 24
export const MAX_BURSTS = 8
const MAX_PARTICLES = 24

let effects = $state<Effect[]>([])
let shakeStamp = $state(0)
let nextId = 0

export function getEffects(): Effect[] { return effects }
export function getShakeStamp(): number { return shakeStamp }
export function removeEffect(id: number): void { effects = effects.filter(e => e.id !== id) }

function pushCapped(e: Effect, kind: Effect['kind'], cap: number): number {
  let next = effects
  const sameKind = next.filter(x => x.kind === kind)
  if (sameKind.length >= cap) next = next.filter(x => x.id !== sameKind[0].id)  // drop oldest of kind
  effects = [...next, e]
  return e.id
}

export function emitFloater(opts: { x: number; y: number; text: string; color?: string }): number {
  if (!juiceAllows('floater')) return -1
  return pushCapped(
    { id: nextId++, kind: 'floater', x: opts.x, y: opts.y, text: opts.text, color: opts.color ?? 'var(--brass-bright)' },
    'floater', MAX_FLOATERS,
  )
}

export function emitBurst(opts: { x: number; y: number; count?: number; particle?: BurstKind }): number {
  if (!juiceAllows('burst')) return -1
  const count = Math.max(1, Math.min(opts.count ?? 12, MAX_PARTICLES))
  return pushCapped(
    { id: nextId++, kind: 'burst', x: opts.x, y: opts.y, particle: opts.particle ?? 'spark', count },
    'burst', MAX_BURSTS,
  )
}

/** Bump the shake stamp; the app root watches it and runs a brief WAAPI shake. */
export function shake(): void {
  if (!juiceAllows('shake')) return
  shakeStamp++
}
