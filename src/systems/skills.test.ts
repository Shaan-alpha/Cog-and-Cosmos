import { describe, it, expect } from 'vitest'
import { recomputeUpgrades } from './skills'
import { D } from './Decimal'
import type { GameState } from '../data/types'

// Minimal GameState slice: recomputeUpgrades only reads skills/aether/omega/
// unlockedAchievements and writes globalMult + engine.engineMult.
function makeState(over: Partial<GameState> = {}): GameState {
  return {
    skills: {},
    aether: 0,
    omega: 0,
    unlockedAchievements: [],
    globalMult: D(1),
    engine: { engineMult: D(1) },
    ...over,
  } as unknown as GameState
}

describe('recomputeUpgrades — Omega fold', () => {
  it('with no Omega, leaves both multipliers at 1', () => {
    const gs = makeState()
    recomputeUpgrades(gs)
    expect(gs.globalMult.toNumber()).toBeCloseTo(1, 9)
    expect(gs.engine.engineMult.toNumber()).toBeCloseTo(1, 9)
  })
  it('applies +10% per Omega to BOTH global and engine', () => {
    const gs = makeState({ omega: 5 })
    recomputeUpgrades(gs)
    // omegaBonus = 1 + 0.10*5 = 1.5
    expect(gs.globalMult.toNumber()).toBeCloseTo(1.5, 9)
    expect(gs.engine.engineMult.toNumber()).toBeCloseTo(1.5, 9)
  })
  it('stacks Omega bonus multiplicatively with the Aether mint bonus', () => {
    const gs = makeState({ omega: 5, aether: 4 })
    recomputeUpgrades(gs)
    // global: 1.5 ; engine: (1 + 0.05*4) * 1.5 = 1.2 * 1.5 = 1.8
    expect(gs.globalMult.toNumber()).toBeCloseTo(1.5, 9)
    expect(gs.engine.engineMult.toNumber()).toBeCloseTo(1.8, 9)
  })
  it('folds the Challenge tree (ch:*) into globalMult and engineMult', () => {
    const gs = makeState({ skills: { 'ch:proven': 2, 'ch:tempered': 1 } })
    recomputeUpgrades(gs)
    // ch:proven +0.25*2 = global ×1.5 ; ch:tempered +0.25*1 = engine ×1.25
    expect(gs.globalMult.toNumber()).toBeCloseTo(1.5, 9)
    expect(gs.engine.engineMult.toNumber()).toBeCloseTo(1.25, 9)
  })
})
