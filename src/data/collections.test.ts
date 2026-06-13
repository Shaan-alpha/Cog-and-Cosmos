import { describe, it, expect } from 'vitest'
import { RELICS, RELIC_SETS, RELIC_BY_ID, type RelicRarity } from './collections'

const RARITIES: RelicRarity[] = ['common', 'uncommon', 'rare', 'legendary']

describe('relic data integrity', () => {
  it('has unique ids and a by-id map', () => {
    const ids = RELICS.map(r => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(Object.keys(RELIC_BY_ID).length).toBe(ids.length)
  })
  it('every rarity is non-empty with exactly one guaranteed centrepiece', () => {
    for (const rar of RARITIES) {
      const pool = RELICS.filter(r => r.rarity === rar)
      expect(pool.length).toBeGreaterThan(0)
      expect(pool.filter(r => r.guaranteed).length).toBe(1)
    }
  })
  it('every relic has a positive bonus and a valid effect', () => {
    for (const r of RELICS) {
      expect(r.bonusPct).toBeGreaterThan(0)
      expect(['global', 'engine']).toContain(r.effect)
    }
  })
  it('has one set per rarity with a positive completion bonus', () => {
    for (const rar of RARITIES) {
      const set = RELIC_SETS.find(s => s.rarity === rar)
      expect(set).toBeDefined()
      expect(set!.completionPct).toBeGreaterThan(0)
    }
  })
})
