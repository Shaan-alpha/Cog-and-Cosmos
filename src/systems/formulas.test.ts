import { describe, it, expect } from 'vitest'
import { D } from './Decimal'
import {
  BALANCE,
  effGrowth,
  generatorCost,
  bulkGeneratorCost,
  maxAffordable,
  production,
  milestoneMult,
  nextMilestoneInfo,
  paradoxThrottle,
  softCap,
  prestigeGain,
  ascensionGain,
  fortuneMintRate,
  offlineGain,
  exchange,
  omegaGain,
} from './formulas'

// Characterization tests: these pin the CURRENT behaviour of the balance math
// so that refactors elsewhere (esp. StageEconomy) cannot silently change the game.

describe('effGrowth', () => {
  it('adds the global cost-growth bump to authored r', () => {
    expect(effGrowth(1.07)).toBeCloseTo(1.07 + BALANCE.costGrowthBump, 10)
    expect(effGrowth(1.15)).toBeCloseTo(1.15 + BALANCE.costGrowthBump, 10)
  })
})

describe('generatorCost', () => {
  it('cost at count 0 equals base', () => {
    expect(generatorCost(D(10), 1.07, 0).toNumber()).toBeCloseTo(10, 6)
  })
  it('grows by effGrowth(r) each count', () => {
    const r = effGrowth(1.07)
    expect(generatorCost(D(10), 1.07, 1).toNumber()).toBeCloseTo(10 * r, 6)
    expect(generatorCost(D(10), 1.07, 3).toNumber()).toBeCloseTo(10 * r ** 3, 6)
  })
})

describe('bulkGeneratorCost', () => {
  it('buying amount=1 equals the single-unit cost', () => {
    const single = generatorCost(D(10), 1.07, 5)
    const bulk = bulkGeneratorCost(D(10), 1.07, 5, 1)
    expect(bulk.toNumber()).toBeCloseTo(single.toNumber(), 6)
  })
  it('buying N equals the sum of N consecutive single costs', () => {
    let sum = 0
    for (let i = 0; i < 4; i++) sum += generatorCost(D(10), 1.07, 5 + i).toNumber()
    const bulk = bulkGeneratorCost(D(10), 1.07, 5, 4)
    expect(bulk.toNumber()).toBeCloseTo(sum, 4)
  })
})

describe('maxAffordable', () => {
  it('returns 0 when budget is non-positive', () => {
    expect(maxAffordable(D(10), 1.07, 0, D(0))) .toBe(0)
    expect(maxAffordable(D(10), 1.07, 0, D(-5))).toBe(0)
  })
  it('affords exactly one unit at exact single cost', () => {
    const cost = generatorCost(D(10), 1.07, 0)
    expect(maxAffordable(D(10), 1.07, 0, cost)).toBe(1)
  })
  it('affords zero just below the single cost', () => {
    const cost = generatorCost(D(10), 1.07, 0).toNumber()
    expect(maxAffordable(D(10), 1.07, 0, D(cost - 0.01))).toBe(0)
  })
  it('matches the largest N whose bulk cost fits the budget', () => {
    const budget = bulkGeneratorCost(D(10), 1.07, 0, 7)
    expect(maxAffordable(D(10), 1.07, 0, budget)).toBe(7)
  })
  it('is exact at every exact bulk-cost boundary (no platform-dependent off-by-one)', () => {
    // maxAffordable floors a float logarithm that sits within ~1 ULP of integer
    // boundaries, so a budget == bulkGeneratorCost(k) must still afford exactly k —
    // never k-1 (under-buy) nor k+1 (over-buy). Which k were fragile differed by
    // platform (Node 20 CI vs 24 local), so sweep a representative range.
    for (const r of [1.07, 1.08, 1.1, 1.13]) {
      for (let count = 0; count <= 6; count++) {
        for (let k = 1; k <= 30; k++) {
          const budget = bulkGeneratorCost(D(10), r, count, k)
          expect(maxAffordable(D(10), r, count, budget)).toBe(k)
        }
      }
    }
  })
})

describe('production', () => {
  it('= baseRate * count * tierMult * globalMult * dt', () => {
    const out = production(4, D(2), D(3), D(5), 0.5)
    expect(out.toNumber()).toBeCloseTo(2 * 4 * 3 * 5 * 0.5, 6)
  })
  it('is zero when count is zero', () => {
    expect(production(0, D(2), D(3), D(5), 1).toNumber()).toBe(0)
  })
})

describe('milestoneMult', () => {
  const m = BALANCE.milestoneMult
  it('is x1 below the first tier', () => {
    expect(milestoneMult(0).toNumber()).toBe(1)
    expect(milestoneMult(BALANCE.milestoneTiers[0] - 1).toNumber()).toBe(1)
  })
  it('multiplies once per crossed tier (cumulative)', () => {
    expect(milestoneMult(BALANCE.milestoneTiers[0]).toNumber()).toBeCloseTo(m, 10)
    expect(milestoneMult(BALANCE.milestoneTiers[1]).toNumber()).toBeCloseTo(m ** 2, 10)
  })
  it('caps at milestoneMult^tiers.length at/above the top tier', () => {
    const top = BALANCE.milestoneTiers[BALANCE.milestoneTiers.length - 1]
    const maxed = m ** BALANCE.milestoneTiers.length
    expect(milestoneMult(top).toNumber()).toBeCloseTo(maxed, 6)
    expect(milestoneMult(top * 10).toNumber()).toBeCloseTo(maxed, 6)
  })
})

describe('nextMilestoneInfo', () => {
  it('reports next tier, prev anchor and 0-1 progress', () => {
    const tiers = BALANCE.milestoneTiers
    const info = nextMilestoneInfo(tiers[0]) // sitting exactly on first tier
    expect(info.prev).toBe(tiers[0])
    expect(info.next).toBe(tiers[1])
    expect(info.progress).toBeCloseTo(0, 6)
    expect(info.currentMult).toBeCloseTo(BALANCE.milestoneMult, 10)
  })
  it('reports next=null and progress 1 when maxed', () => {
    const top = BALANCE.milestoneTiers[BALANCE.milestoneTiers.length - 1]
    const info = nextMilestoneInfo(top + 5)
    expect(info.next).toBeNull()
    expect(info.progress).toBe(1)
  })
})

describe('paradoxThrottle', () => {
  it('is x1 at zero paradox', () => {
    expect(paradoxThrottle(D(0)).toNumber()).toBeCloseTo(1, 10)
  })
  it('halves at paradox 200', () => {
    expect(paradoxThrottle(D(200)).toNumber()).toBeCloseTo(0.5, 10)
  })
  it('is ~1/3 at paradox 800', () => {
    expect(paradoxThrottle(D(800)).toNumber()).toBeCloseTo(1 / 3, 6)
  })
})

describe('softCap', () => {
  it('is identity at or below the cap', () => {
    expect(softCap(D(50), D(100)).toNumber()).toBe(50)
    expect(softCap(D(100), D(100)).toNumber()).toBe(100)
  })
  it('compresses above the cap by sqrt of the excess ratio', () => {
    expect(softCap(D(200), D(100)).toNumber()).toBeCloseTo(100 * Math.sqrt(2), 6)
    expect(softCap(D(500), D(100)).toNumber()).toBeCloseTo(100 * Math.sqrt(5), 6)
  })
})

describe('prestigeGain', () => {
  it('is 0 for non-positive lifetime', () => {
    expect(prestigeGain(D(0), D(1e6))).toBe(0)
  })
  it('is floor(k * sqrt(lifetime/softcap))', () => {
    expect(prestigeGain(D(1e6), D(1e6), 1)).toBe(1)
    expect(prestigeGain(D(4e6), D(1e6), 1)).toBe(2)
    expect(prestigeGain(D(9e6), D(1e6), 1)).toBe(3)
  })
})

describe('ascensionGain', () => {
  it('is 0 for non-positive lifetime', () => {
    expect(ascensionGain(D(0), D(1e6))).toBe(0)
  })
  it('uses the harsher ^0.33 curve with k=5', () => {
    expect(ascensionGain(D(1e6), D(1e6))).toBe(5) // floor(5 * 1^0.33)
    // ratio=100 -> 100^0.33 ~ 4.467 -> *5 = 22.3 -> floor 22
    expect(ascensionGain(D(1e8), D(1e6))).toBe(Math.floor(5 * Math.pow(100, 0.33)))
  })
})

describe('fortuneMintRate', () => {
  it('sums log10(1+surplus)*weight*engineMult*dt and skips non-positive surplus', () => {
    const rate = fortuneMintRate(
      [
        { surplus: D(9), weight: 1 },   // log10(10) = 1
        { surplus: D(99), weight: 2 },  // log10(100) = 2 -> *2 = 4
        { surplus: D(0), weight: 5 },   // skipped
      ],
      D(1),
      1,
    )
    expect(rate.toNumber()).toBeCloseTo(1 + 4, 6)
  })
  it('scales by engineMult and dt', () => {
    const rate = fortuneMintRate([{ surplus: D(9), weight: 1 }], D(3), 0.5)
    expect(rate.toNumber()).toBeCloseTo(1 * 3 * 0.5, 6)
  })
})

describe('offlineGain', () => {
  it('grants full rate inside the base window', () => {
    expect(offlineGain(D(1), 3600).toNumber()).toBeCloseTo(3600, 6) // < 7200s base
  })
  it('applies the reduced rate beyond the base window', () => {
    // 3h = 10800s: 7200 full + 3600 * 0.35
    expect(offlineGain(D(1), 10800).toNumber()).toBeCloseTo(7200 + 3600 * 0.35, 6)
  })
  it('caps at the max window', () => {
    const capped = offlineGain(D(1), 1e9).toNumber()
    const atMax = offlineGain(D(1), 86400).toNumber()
    expect(capped).toBeCloseTo(atMax, 6)
  })
})

describe('exchange', () => {
  it('applies no tax on the first conversion', () => {
    expect(exchange(D(100), D(2), 0.1, 0).toNumber()).toBeCloseTo(200, 6)
  })
  it('compounds the tax with conversions', () => {
    expect(exchange(D(100), D(2), 0.1, 1).toNumber()).toBeCloseTo(180, 6) // rate*0.9
  })
})

describe('omegaGain', () => {
  it('is 0 at or below zero lifetime Aether', () => {
    expect(omegaGain(0)).toBe(0)
    expect(omegaGain(-5)).toBe(0)
  })
  it('is the floored cube-root of (aetherLifetime / 1e3)', () => {
    // (1e3 / 1e3)^(1/3) = 1
    expect(omegaGain(1e3)).toBe(1)
    // (8e6 / 1e3)^(1/3) = 8000^(1/3) = 20
    expect(omegaGain(8e6)).toBe(20)
    // (7e3 / 1e3)^(1/3) = 7^(1/3) ≈ 1.91 → floor 1
    expect(omegaGain(7e3)).toBe(1)
  })
  it('scales gain by the reality-multiplier level (+15%/level)', () => {
    // base at 8e6 = 20; level 2 → floor(20 * 1.30) = 26
    expect(omegaGain(8e6, 2)).toBe(26)
  })
})
