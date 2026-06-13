import { describe, it, expect } from 'vitest'
import { D, ZERO, ONE } from './Decimal'
import { StageEconomy } from './StageEconomy'
import { milestoneMult, paradoxThrottle } from './formulas'
import villageDef from '../data/stages/village'
import farmDef from '../data/stages/farm'
import spaceDef from '../data/stages/space'
import mineDef from '../data/stages/mine'
import factoryDef from '../data/stages/factory'
import magicDef from '../data/stages/magic'
import timeDef from '../data/stages/time'
import multiverseDef from '../data/stages/multiverse'
import type { StageState } from '../data/types'

// Characterization tests for the per-stage economy. The headline guard is the
// tick()/rates() parity check: rates(dt=1) must equal what a tick of dt=1
// accrues. Any refactor that unifies the two code paths must keep this true.

const village = new StageEconomy(villageDef)
const farm = new StageEconomy(farmDef)
const space = new StageEconomy(spaceDef)
const mine = new StageEconomy(mineDef)
const factory = new StageEconomy(factoryDef)
const magic = new StageEconomy(magicDef)
const time = new StageEconomy(timeDef)
const multiverse = new StageEconomy(multiverseDef)

describe('freshState', () => {
  it('starts every generator at count 0 and currencies at 0', () => {
    const s = village.freshState()
    expect(s.id).toBe('village')
    expect(s.primaryAmount.toNumber()).toBe(0)
    expect(s.prestigeCount).toBe(0)
    for (const g of villageDef.generators) {
      expect(s.generators[g.id].count).toBe(0)
      expect(s.generators[g.id].totalProduced.toNumber()).toBe(0)
    }
  })
  it('marks only Village unlocked by default', () => {
    expect(village.freshState().unlocked).toBe(true)
    expect(space.freshState().unlocked).toBe(false)
  })
})

describe('buy', () => {
  it('deducts the single cost and increments the count', () => {
    const s = village.freshState()
    s.primaryAmount = D(1000)
    const cost = village.currentCost(s, 'cottage', 1)
    const ok = village.buy(s, 'cottage', 1)
    expect(ok).toBe(true)
    expect(s.generators.cottage.count).toBe(1)
    expect(s.primaryAmount.toNumber()).toBeCloseTo(1000 - cost.toNumber(), 6)
  })
  it('refuses when unaffordable', () => {
    const s = village.freshState()
    s.primaryAmount = D(1)
    expect(village.buy(s, 'guildhall', 1)).toBe(false)
    expect(s.generators.guildhall.count).toBe(0)
  })
  it('respects the prestige unlock gate', () => {
    const s = village.freshState()
    s.primaryAmount = D(1e9)
    // market requires prestigeCount >= 1
    expect(village.buy(s, 'market', 1)).toBe(false)
    s.prestigeCount = 1
    expect(village.buy(s, 'market', 1)).toBe(true)
  })
  it('buy max purchases the largest affordable batch', () => {
    const s = village.freshState()
    s.primaryAmount = village.currentCost(s, 'cottage', 5) // exactly 5 worth
    const before = s.generators.cottage.count
    village.buy(s, 'cottage', -1)
    expect(s.generators.cottage.count).toBe(before + 5)
  })
})

describe('tick production', () => {
  it('produces baseRate*count*milestoneMult for a simple stage', () => {
    const s = village.freshState()
    s.generators.cottage.count = 10 // crosses the first milestone tier (x2)
    const gained = village.tick(s, 1, ONE)
    const expected = 0.5 * 10 * milestoneMult(10).toNumber() // 0.5 c/s * 10 * 2
    expect(gained.toNumber()).toBeCloseTo(expected, 6)
    expect(s.primaryAmount.toNumber()).toBeCloseTo(expected, 6)
    expect(s.primaryLifetime.toNumber()).toBeCloseTo(expected, 6)
  })
  it('applies globalStageMult (x1.5 Guild Hall) to the whole stage', () => {
    const s = village.freshState()
    s.generators.cottage.count = 10
    s.generators.guildhall.count = 1
    const gained = village.tick(s, 1, ONE).toNumber()
    const cottageBase = 0.5 * 10 * milestoneMult(10).toNumber() // 0.5 c/s * 10 * x2
    const guildBase = 25 * milestoneMult(1).toNumber()          // guildhall's own 25 c/s
    expect(gained).toBeCloseTo((cottageBase + guildBase) * 1.5, 6)
  })
  it('scales linearly with dt', () => {
    const a = village.freshState(); a.generators.cottage.count = 3
    const b = village.freshState(); b.generators.cottage.count = 3
    const full = village.tick(a, 1, ONE).toNumber()
    const half = village.tick(b, 0.5, ONE).toNumber()
    expect(half).toBeCloseTo(full * 0.5, 6)
  })
})

describe('tick/rates parity at dt=1', () => {
  it('village: rate.primary equals the primary accrued by a 1s tick', () => {
    const s = village.freshState()
    s.generators.cottage.count = 12
    s.generators.blacksmith.count = 4 // also exercises secondaryRate (Wood)
    const rate = village.rates(s, ONE)
    const gainedPrimary = village.tick(s, 1, ONE)
    expect(gainedPrimary.toNumber()).toBeCloseTo(rate.primary.toNumber(), 6)
  })

  it('village: rate.secondary equals secondary accrued by a 1s tick', () => {
    const s = village.freshState()
    s.generators.blacksmith.count = 7
    const secBefore = s.secondaryAmount
    const rate = village.rates(s, ONE)
    village.tick(s, 1, ONE)
    const secGained = s.secondaryAmount.sub(secBefore)
    expect(secGained.toNumber()).toBeCloseTo(rate.secondary.toNumber(), 6)
  })

  it('space: alloy rate equals alloy accrued under identical supply (with buffers off)', () => {
    const stages = makeSpaceStages({ ore: 1e9, power: 1e9 })
    const s = stages.space
    s.generators.smelter.count = 6
    const rate = space.rates(s, ONE, ONE, stages)
    const secBefore = s.secondaryAmount
    space.tick(s, 1, ONE, ONE, stages)
    const secGained = s.secondaryAmount.sub(secBefore)
    expect(secGained.toNumber()).toBeCloseTo(rate.secondary.toNumber(), 4)
  })
})

describe('space input-chain starvation', () => {
  it('throttles alloy toward zero with no upstream ore/power', () => {
    const stages = makeSpaceStages({ ore: 0, power: 0 })
    const s = stages.space
    s.generators.smelter.count = 10
    const rate = space.rates(s, ONE, ONE, stages)
    expect(rate.secondary.toNumber()).toBeCloseTo(0, 6)
  })
  it('runs alloy at full rate with abundant ore/power', () => {
    const stages = makeSpaceStages({ ore: 1e9, power: 1e9 })
    const s = stages.space
    s.generators.smelter.count = 10
    const rate = space.rates(s, ONE, ONE, stages)
    // 10 smelters * 1 alloy/s * milestoneMult(10)=2 = 20
    expect(rate.secondary.toNumber()).toBeCloseTo(1 * 10 * milestoneMult(10).toNumber(), 4)
  })
})

describe('prestige', () => {
  it('grants gain, bumps count, resets state and sets productionMult', () => {
    const s = village.freshState()
    s.generators.cottage.count = 50
    s.primaryAmount = D(5e5)
    s.primaryLifetime = D(1e6) // == softcap -> gain 1 at k=1
    const gain = village.prestige(s)
    expect(gain).toBe(1)
    expect(s.prestigeCount).toBe(1)
    expect(s.prestigeCurrency).toBe(1)
    expect(s.primaryAmount.toNumber()).toBe(0)
    expect(s.primaryLifetime.toNumber()).toBe(0)
    expect(s.generators.cottage.count).toBe(0)
    expect(s.productionMult.toNumber()).toBeCloseTo(1.25, 10) // 1 + 1*0.25
  })
  it('returns 0 and is a no-op below the softcap floor', () => {
    const s = village.freshState()
    s.primaryLifetime = D(1) // far below softcap
    expect(village.prestige(s)).toBe(0)
    expect(s.prestigeCount).toBe(0)
  })
})

describe('surplus', () => {
  it('is primary above 10x the first generator cost, floored at 0', () => {
    const s = village.freshState()
    const firstCost = villageDef.generators[0].baseCost.toNumber() // 10
    const threshold = firstCost * 10 // 100
    s.primaryAmount = D(threshold + 250)
    expect(village.surplus(s).toNumber()).toBeCloseTo(250, 6)
    s.primaryAmount = D(threshold - 1)
    expect(village.surplus(s).toNumber()).toBe(0)
  })
})

describe('magic familiar upkeep', () => {
  function magicStages(grain: number, essence: number) {
    const farmState = farm.freshState(); farmState.unlocked = true; farmState.primaryAmount = D(grain)
    const magicState = magic.freshState(); magicState.unlocked = true; magicState.secondaryAmount = D(essence)
    return { stages: { farm: farmState, magic: magicState }, magicState, farmState }
  }
  it('produces full Mana when grain + essence cover upkeep', () => {
    const { stages, magicState } = magicStages(1e6, 1e6)
    magicState.generators.familiar.count = 10
    const rate = magic.rates(magicState, ONE, ONE, stages)
    expect(rate.primary.toNumber()).toBeCloseTo(4 * 10 * milestoneMult(10).toNumber(), 4) // 80
  })
  it('starves Mana toward zero with no grain', () => {
    const { stages, magicState } = magicStages(0, 1e6)
    magicState.generators.familiar.count = 10
    expect(magic.rates(magicState, ONE, ONE, stages).primary.toNumber()).toBeCloseTo(0, 6)
  })
  it('tick deducts 0.05 grain/s and 0.10 essence/s per familiar', () => {
    const { stages, magicState, farmState } = magicStages(1000, 1000)
    magicState.generators.familiar.count = 10 // grain 0.5/s, essence 1.0/s
    magic.tick(magicState, 1, ONE, ONE, stages)
    expect(farmState.primaryAmount.toNumber()).toBeCloseTo(1000 - 0.5, 4)
    expect(magicState.secondaryAmount.toNumber()).toBeCloseTo(1000 - 1.0, 4)
  })
  it('tick/rates primary parity at dt=1 (upkeep covered)', () => {
    const { stages, magicState } = magicStages(1e6, 1e6)
    magicState.generators.familiar.count = 8
    magicState.generators.sigil.count = 30
    const rate = magic.rates(magicState, ONE, ONE, stages)
    const gained = magic.tick(magicState, 1, ONE, ONE, stages)
    expect(gained.toNumber()).toBeCloseTo(rate.primary.toNumber(), 4)
  })
})

describe('time paradox throttle + accrual', () => {
  function timeState(paradox = 0) {
    const s = time.freshState(); s.unlocked = true; s.secondaryAmount = D(paradox)
    s.generators.sundial.count = 10 // 0.4/s
    s.generators.loop.count = 5     // 18/s + 0.02 paradox/s leak each
    return s
  }
  it('throttles all Chronon output by the paradox curve', () => {
    const raw = 0.4 * 10 * milestoneMult(10).toNumber() + 18 * 5 * milestoneMult(5).toNumber() // 8 + 90
    expect(time.rates(timeState(0), ONE).primary.toNumber()).toBeCloseTo(raw, 4)
    expect(time.rates(timeState(200), ONE).primary.toNumber())
      .toBeCloseTo(raw * paradoxThrottle(D(200)).toNumber(), 4) // half
  })
  it('reports net Paradox/s (gen - vent) as the secondary rate', () => {
    expect(time.rates(timeState(0), ONE).secondary.toNumber()).toBeCloseTo(5 * 0.02, 6) // 0.1
  })
  it('tick accrues Paradox from Causal Loops', () => {
    const s = timeState(0)
    time.tick(s, 1, ONE)
    expect(s.secondaryAmount.toNumber()).toBeCloseTo(5 * 0.02, 6)
  })
  it('Hourglass Arrays vent Paradox (net can go to zero)', () => {
    const s = timeState(0)
    s.generators.hourglassarray.count = 1 // vents 0.5/s, well over the 0.1/s leak
    time.tick(s, 1, ONE)
    expect(s.secondaryAmount.toNumber()).toBe(0) // floored at 0
  })
  it('tick/rates parity at dt=1 (primary + secondary)', () => {
    const s = timeState(0)
    const rate = time.rates(s, ONE)
    const secBefore = s.secondaryAmount
    const gained = time.tick(s, 1, ONE)
    expect(gained.toNumber()).toBeCloseTo(rate.primary.toNumber(), 4)
    expect(s.secondaryAmount.sub(secBefore).toNumber()).toBeCloseTo(rate.secondary.toNumber(), 6)
  })
})

describe('multiverse consumption + duplication upkeep', () => {
  function mvStages(alloy: number, paradox: number) {
    const spaceState = space.freshState(); spaceState.unlocked = true; spaceState.secondaryAmount = D(alloy)
    const timeState = time.freshState(); timeState.unlocked = true; timeState.secondaryAmount = D(paradox)
    const mvState = multiverse.freshState(); mvState.unlocked = true
    return { stages: { space: spaceState, time: timeState, multiverse: mvState }, mvState, spaceState, timeState }
  }
  it('Rifts produce Shards only when Space Alloy is available', () => {
    const { stages, mvState } = mvStages(1e6, 0)
    mvState.generators.rift.count = 10
    expect(multiverse.rates(mvState, ONE, ONE, stages).primary.toNumber())
      .toBeCloseTo(1 * 10 * milestoneMult(10).toNumber(), 4) // 20
    const starved = mvStages(0, 0)
    starved.mvState.generators.rift.count = 10
    expect(multiverse.rates(starved.mvState, ONE, ONE, starved.stages).primary.toNumber()).toBeCloseTo(0, 6)
  })
  it('tick deducts 2 Alloy/s per Rift from Space', () => {
    const { stages, mvState, spaceState } = mvStages(1000, 0)
    mvState.generators.rift.count = 10
    multiverse.tick(mvState, 1, ONE, ONE, stages)
    expect(spaceState.secondaryAmount.toNumber()).toBeCloseTo(1000 - 20, 4) // 2 * 10
  })
  it('Branch Nodes drain 5 Shards/s each as upkeep', () => {
    const { stages, mvState } = mvStages(0, 0)
    mvState.generators.branchnode.count = 4
    mvState.primaryAmount = D(1000)
    multiverse.tick(mvState, 1, ONE, ONE, stages)
    expect(mvState.primaryAmount.toNumber()).toBeCloseTo(1000 - 20, 4) // 5 * 4
  })
  it('tick/rates primary+secondary parity at dt=1', () => {
    const { stages, mvState } = mvStages(1e6, 0)
    mvState.generators.rift.count = 10
    mvState.generators.mirrorself.count = 6 // 0.3 echoes/s each
    const rate = multiverse.rates(mvState, ONE, ONE, stages)
    const secBefore = mvState.secondaryAmount
    const gained = multiverse.tick(mvState, 1, ONE, ONE, stages)
    expect(gained.toNumber()).toBeCloseTo(rate.primary.toNumber(), 4)
    expect(mvState.secondaryAmount.sub(secBefore).toNumber()).toBeCloseTo(rate.secondary.toNumber(), 4)
  })
})

// ── helpers ────────────────────────────────────────────────────────────────

function makeSpaceStages(supply: { ore: number; power: number }): Record<string, StageState> {
  const mineState = mine.freshState()
  mineState.unlocked = true
  mineState.primaryAmount = D(supply.ore)
  const factoryState = factory.freshState()
  factoryState.unlocked = true
  factoryState.secondaryAmount = D(supply.power)
  const spaceState = space.freshState()
  spaceState.unlocked = true
  return { mine: mineState, factory: factoryState, space: spaceState }
}
