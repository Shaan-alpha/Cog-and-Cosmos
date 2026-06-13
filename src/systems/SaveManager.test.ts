import { describe, it, expect } from 'vitest'
import { migrate, exportSave, importSave } from './SaveManager'
import { D, Decimal } from './Decimal'
import type { GameState } from '../data/types'

// Characterization tests for save persistence: the version-migration ladder and
// the Decimal serialise/deserialise round-trip. These guard against precision
// loss and dropped fields when the save schema or migrate() are touched.

const CURRENT_VERSION = 12

describe('migrate: version ladder', () => {
  it('upgrades a v5 save to the current version, adding all later fields', () => {
    const raw = { version: 5, stages: { village: {} } } as unknown as GameState
    const out = migrate(raw)
    expect(out.version).toBe(CURRENT_VERSION)
    // v6 warp, v7 multiverse + convergence, v8 LP/ascension, v9 autobuy, v10 aether, v11 achievements
    expect(out.warp).toEqual({ charges: 2, recharge: 0 })
    expect(out.multiverse).toEqual({ branchSlots: [] })
    expect(out.convergenceMult).toBeInstanceOf(Decimal)
    expect(out.convergenceMult.toNumber()).toBe(1)
    expect(out.legacyPoints).toBe(0)
    expect(out.aether).toBe(0)
    expect(out.aetherLifetime).toBe(0)
    expect(out.transcendCount).toBe(0)
    expect(out.unlockedAchievements).toEqual([])
    expect(out.omega).toBe(0)
    expect(out.omegaLifetime).toBe(0)
    expect(out.omegaCount).toBe(0)
    const v = out.stages.village as any
    expect(v.ascensionCount).toBe(0)
    expect(v.autoBuyMode).toBe('cheapest')
    expect(v.autoBuyMilestoneSnipe).toBe(true)
    expect(v.autoBuyVault).toEqual([])
  })

  it('preserves existing values when migrating from a later version', () => {
    const raw = {
      version: 8,
      legacyPoints: 42,
      stages: { village: { ascensionCount: 3 } },
    } as unknown as GameState
    const out = migrate(raw)
    expect(out.version).toBe(CURRENT_VERSION)
    expect(out.legacyPoints).toBe(42)
    expect((out.stages.village as any).ascensionCount).toBe(3)
    // newer (v9+) fields still get backfilled
    expect((out.stages.village as any).autoBuyMode).toBe('cheapest')
    expect(out.aether).toBe(0)
  })

  it('v11 → v12 seeds Omega fields and preserves existing ones', () => {
    const raw = {
      version: 11,
      omega: 7, omegaLifetime: 9, omegaCount: 2,
      stages: {},
    } as unknown as GameState
    const out = migrate(raw)
    expect(out.version).toBe(CURRENT_VERSION)
    expect(out.omega).toBe(7)
    expect(out.omegaLifetime).toBe(9)
    expect(out.omegaCount).toBe(2)
  })

  it('never lets convergenceMult sanitise to zero (would null all production)', () => {
    const raw = { version: 7, convergenceMult: undefined, stages: {} } as unknown as GameState
    const out = migrate(raw)
    expect(out.convergenceMult.toNumber()).toBe(1)
  })

  it('coerces persisted Decimal-wrapped fields back into Decimals', () => {
    const raw = {
      version: 11,
      stages: { village: { primaryAmount: { __decimal__: '1234.5' } } },
    } as unknown as GameState
    const out = migrate(raw)
    const amt = (out.stages.village as any).primaryAmount
    expect(amt).toBeInstanceOf(Decimal)
    expect(amt.toNumber()).toBeCloseTo(1234.5, 6)
  })
})

describe('export/import round-trip', () => {
  it('preserves Decimal precision through compress -> decompress', () => {
    const state = {
      version: CURRENT_VERSION,
      saveTimestamp: 0,
      stages: {
        village: {
          id: 'village',
          primaryAmount: D('1.23456789e42'),
          primaryLifetime: D('9.87654321e30'),
          secondaryAmount: D(0),
          laborOutput: D(0),
          productionMult: D(1),
          prestigeCount: 0,
          prestigeCurrency: 0,
          generators: {},
          lastTickMs: 0,
          unlocked: true,
        },
      },
      engine: { fortune: D('5e15'), fortuneLifetime: D('5e15'), slots: ['village'], engineMult: D(1) },
      globalMult: D(1),
      legacyPoints: 0,
      skills: {},
      totalPlaytimeMs: 0,
      activeEnchants: [],
      spaceBuffers: { ore: D(0), power: D(0) },
      warp: { charges: 2, recharge: 0 },
      multiverse: { branchSlots: [] },
      convergenceMult: D(1),
      settings: { numberFormat: 'short', autoSaveInterval: 30000, offlineProgress: true },
    } as unknown as GameState

    const restored = importSave(exportSave(state))
    expect(restored).not.toBeNull()
    const v = restored!.stages.village
    expect(v.primaryAmount.eq(D('1.23456789e42'))).toBe(true)
    expect(v.primaryLifetime.eq(D('9.87654321e30'))).toBe(true)
    expect(restored!.engine.fortune.eq(D('5e15'))).toBe(true)
  })

  it('returns null on malformed input rather than throwing', () => {
    expect(importSave('not-a-real-save')).toBeNull()
  })
})
