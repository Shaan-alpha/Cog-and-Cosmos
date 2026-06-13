import { describe, it, expect } from 'vitest'
import { D } from '../systems/Decimal'
import { CHALLENGE_BY_ID } from './challenges'
import type { GameState } from './types'

function gsWith(over: Record<string, unknown>): GameState {
  return { stages: {}, engine: {}, ...over } as unknown as GameState
}

describe('challenge check predicates', () => {
  it('spartan_cogs — 1e9 lifetime Coins', () => {
    const c = CHALLENGE_BY_ID['spartan_cogs']
    expect(c.check(gsWith({ stages: { village: { primaryLifetime: D(1e8) } } }))).toBe(false)
    expect(c.check(gsWith({ stages: { village: { primaryLifetime: D(1e9) } } }))).toBe(true)
  })
  it('broken_chain — Mine unlocked', () => {
    const c = CHALLENGE_BY_ID['broken_chain']
    expect(c.check(gsWith({ stages: { mine: { unlocked: false } } }))).toBe(false)
    expect(c.check(gsWith({ stages: { mine: { unlocked: true } } }))).toBe(true)
  })
  it('half_measures — 100 lifetime Fortune', () => {
    const c = CHALLENGE_BY_ID['half_measures']
    expect(c.check(gsWith({ engine: { fortuneLifetime: D(99) } }))).toBe(false)
    expect(c.check(gsWith({ engine: { fortuneLifetime: D(100) } }))).toBe(true)
  })
  it('purist — 1e12 lifetime Coins, requires spartan_cogs', () => {
    const c = CHALLENGE_BY_ID['purist']
    expect(c.requires).toContain('spartan_cogs')
    expect(c.check(gsWith({ stages: { village: { primaryLifetime: D(1e11) } } }))).toBe(false)
    expect(c.check(gsWith({ stages: { village: { primaryLifetime: D(1e12) } } }))).toBe(true)
  })
})
