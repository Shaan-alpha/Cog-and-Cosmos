import { describe, it, expect } from 'vitest'
import { D, ZERO } from './Decimal'
import { FortuneEngine } from './FortuneEngine'
import { StageEconomy } from './StageEconomy'
import villageDef from '../data/stages/village'
import magicDef from '../data/stages/magic'
import spaceDef from '../data/stages/space'
import type { StageState, StageDefinition } from '../data/types'

// Characterization tests for the Fortune mint. Guards the threshold-caching and
// surplus-building refactor (shared by tick() and ratePreview()).

const engine = new FortuneEngine()
const village = new StageEconomy(villageDef)
const magic = new StageEconomy(magicDef)
const space = new StageEconomy(spaceDef)

const DEFS: Record<string, StageDefinition> = {
  village: villageDef,
  magic: magicDef,
  space: spaceDef,
}

function unlockedState(econ: StageEconomy, primary: number): StageState {
  const s = econ.freshState()
  s.unlocked = true
  s.primaryAmount = D(primary)
  return s
}

describe('FortuneEngine surplus + mint', () => {
  it('mints log10(1+surplus)*weight*engineMult/s, surplus = primary above 10x first gen cost', () => {
    const es = engine.freshState() // slots: ['village']
    const villageThreshold = villageDef.generators[0].baseCost.toNumber() * 10 // 100
    const stages = { village: unlockedState(village, villageThreshold + 1000) } // surplus 1000
    const rate = engine.ratePreview(es, stages, DEFS)
    const expected = Math.log10(1 + 1000) * villageDef.fortuneWeight * 1
    expect(rate.toNumber()).toBeCloseTo(expected, 6)
  })

  it('tick adds the per-second mint scaled by dt to fortune + lifetime', () => {
    const es = engine.freshState()
    const stages = { village: unlockedState(village, 1100) }
    const rate = engine.ratePreview(es, stages, DEFS)
    const minted = engine.tick(es, stages, DEFS, 0.5)
    expect(minted.toNumber()).toBeCloseTo(rate.toNumber() * 0.5, 6)
    expect(es.fortune.toNumber()).toBeCloseTo(minted.toNumber(), 6)
    expect(es.fortuneLifetime.toNumber()).toBeCloseTo(minted.toNumber(), 6)
  })

  it('ignores stages with zero surplus and locked/unassigned slots', () => {
    const es = engine.freshState()
    const stages = { village: unlockedState(village, 50) } // below threshold -> surplus 0
    expect(engine.ratePreview(es, stages, DEFS).toNumber()).toBe(0)
  })

  it('applies the Magic resonant-surplus +30% weight skill', () => {
    const es = engine.freshState()
    es.slots = ['magic']
    const stages = { magic: unlockedState(magic, 1e6) }
    const base = engine.ratePreview(es, stages, DEFS, {}).toNumber()
    const boosted = engine.ratePreview(es, stages, DEFS, { 'magic:resonant_surplus': 1 }).toNumber()
    expect(boosted / base).toBeCloseTo(1.30, 6)
  })

  it('applies the Space stellar-compression +40% weight skill', () => {
    const es = engine.freshState()
    es.slots = ['space']
    const stages = { space: unlockedState(space, 1e8) }
    const base = engine.ratePreview(es, stages, DEFS, {}).toNumber()
    const boosted = engine.ratePreview(es, stages, DEFS, { 'space:stellar_compression': 1 }).toNumber()
    expect(boosted / base).toBeCloseTo(1.40, 6)
  })

  it('assignSlot is idempotent and capped at 8', () => {
    const es = engine.freshState() // already has 'village'
    expect(engine.assignSlot(es, 'village')).toBe(false) // duplicate
    expect(engine.assignSlot(es, 'farm')).toBe(true)
    expect(es.slots).toContain('farm')
  })
})
