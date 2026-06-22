/**
 * StageEconomy — one instance per unlocked stage.
 * Handles: generator production, milestone mults, prestige.
 *
 * Production is computed through a single shared path so the three callers can
 * never drift:
 *   • _baseMults()       — production/enchant multipliers (all callers)
 *   • _computeFactors()  — read-only per-stage starvation/throttle factors
 *   • _produceGen()      — per-generator output given those factors
 * tick() layers the *mutations* (buffer siphon, upkeep consumption, Paradox
 * accrual, Branch-Node upkeep) on top; rates() and autoBuyTick() reuse the same
 * read-only math. This is why rates(dt=1) is guaranteed to equal what tick()
 * accrues — they execute the same code, not two hand-synced copies.
 */
import { D, ZERO, ONE, Decimal } from './Decimal'
import {
  generatorCost,
  bulkGeneratorCost,
  maxAffordable,
  production,
  milestoneMult,
  prestigeGain,
  ascensionGain,
  paradoxThrottle,
} from './formulas'
import type { StageDefinition, StageState, GeneratorDef, EnchantState } from '../data/types'

/** Read-only multiplier factors that feed the per-generator production switch. */
interface ProdFactors {
  cmPrimary: Decimal       // combined multiplier for primary output
  cmSecondary: Decimal     // combined multiplier for secondary output (Magic excludes enchants)
  familiarStarve: Decimal  // Magic: 0–1 if Familiars lack Grain/Essence upkeep
  alloyStarve: Decimal     // Space: 0–1 if Smelters/Refineries lack Ore/Power
  stardustStarve: Decimal  // Space: 0–1 if Probes/Colonies lack Alloy
  timeThrottle: Decimal    // Time: Paradox softcap throttle
  timeProdMult: Decimal    // Time: Chronon Flow boost
  mvAlloyStarve: Decimal   // Multiverse: 0–1 if Rifts lack Space Alloy
  mvParadoxStarve: Decimal // Multiverse: 0–1 if Paradox Mirrors lack Time Paradox
  mvProdMult: Decimal      // Multiverse: Shard Flow boost
  paradoxNet: number       // Time: net Paradox/s (gen − vent), reported + accrued
  // Per-second demands, surfaced so tick() can deduct upkeep without recomputing.
  grainDemand: number
  essenceDemand: number
  oreDemand: number
  powerDemand: number
  alloyDemand: number      // Space Alloy burned for Stardust
  mvAlloyDemand: number    // Multiverse Alloy pulled from Space
  mvParadoxDemand: number  // Multiverse Paradox pulled from Time
}

const NEUTRAL_FACTORS: Omit<ProdFactors, 'cmPrimary' | 'cmSecondary'> = {
  familiarStarve: ONE, alloyStarve: ONE, stardustStarve: ONE,
  timeThrottle: ONE, timeProdMult: ONE,
  mvAlloyStarve: ONE, mvParadoxStarve: ONE, mvProdMult: ONE,
  paradoxNet: 0,
  grainDemand: 0, essenceDemand: 0, oreDemand: 0, powerDemand: 0,
  alloyDemand: 0, mvAlloyDemand: 0, mvParadoxDemand: 0,
}

export class StageEconomy {
  readonly def: StageDefinition

  constructor(def: StageDefinition) {
    this.def = def
  }

  /** Create a fresh StageState for this stage */
  freshState(): StageState {
    const gens: StageState['generators'] = {}
    for (const g of this.def.generators) {
      gens[g.id] = { id: g.id, count: 0, totalProduced: ZERO }
    }
    return {
      id: this.def.id,
      primaryAmount: ZERO,
      primaryLifetime: ZERO,
      secondaryAmount: ZERO,
      prestigeCount: 0,
      prestigeCurrency: 0,
      generators: gens,
      laborOutput: ZERO,
      productionMult: ONE,
      lastTickMs: Date.now(),
      unlocked: this.def.id === 'village',
      autoBuy: false,
      ascensionCount: 0,
      autoBuyMode: 'cheapest',
      autoBuyReserve: 0,
      autoBuyMilestoneSnipe: true,
      autoBuyVault: [],
    }
  }

  // ── Shared production core ────────────────────────────────────────────────

  /** Whole-stage production + enchant multipliers (identical for every caller). */
  private _baseMults(
    state: StageState,
    globalMult: Decimal,
    extraMult: Decimal,
    activeEnchants?: EnchantState[],
  ): { cmPrimary: Decimal; cmSecondary: Decimal } {
    let stageSpecificMult = ONE
    for (const gdef of this.def.generators) {
      if (gdef.globalStageMult && (state.generators[gdef.id]?.count ?? 0) >= 1) {
        stageSpecificMult = stageSpecificMult.mul(gdef.globalStageMult)
      }
    }
    const combinedMult = state.productionMult.mul(stageSpecificMult).mul(globalMult).mul(extraMult)

    let maxEnchant = ONE
    if (activeEnchants) {
      for (const enc of activeEnchants) {
        if (enc.targetStageId === this.def.id || enc.targetStageId === 'all') {
          if (enc.multiplier.gt(maxEnchant)) maxEnchant = enc.multiplier
        }
      }
    }
    // Magic's own secondary (Essence) is never self-boosted by its enchants.
    const cmSecondary = this.def.id === 'magic' ? combinedMult : combinedMult.mul(maxEnchant)
    const cmPrimary = combinedMult.mul(maxEnchant)
    return { cmPrimary, cmSecondary }
  }

  /** Space input-chain demands (per second), with the relevant skills applied. */
  private _spaceDemands(state: StageState, skills?: Record<string, number>): {
    ore: number; power: number; alloy: number
  } {
    const smelter = state.generators.smelter?.count ?? 0
    const refinery = state.generators.refinery?.count ?? 0
    const dyson = state.generators.dysonframe?.count ?? 0
    let ore = 5 * smelter + 12 * refinery + 40 * dyson
    let power = 2 * smelter + 5 * refinery + 30 * dyson
    if (skills?.['space:self_mining_drones'] && skills['space:self_mining_drones'] >= 1) ore *= 0.92
    if (skills?.['space:power_recapture'] && skills['space:power_recapture'] >= 1) power *= 0.75
    const oreLvl = skills?.['space:ore_throughput'] ?? 0
    if (oreLvl > 0) ore *= (1 - 0.10 * oreLvl)

    const probe = state.generators.probe?.count ?? 0
    const colony = state.generators.colony?.count ?? 0
    const forge = state.generators.starforge?.count ?? 0
    const gate = state.generators.warpgate?.count ?? 0
    const alloy = 3 * probe + 10 * colony + 90 * forge + 200 * gate
    return { ore, power, alloy }
  }

  /**
   * Read-only per-stage starvation/throttle factors. The `dt` parameter scales
   * the demand denominator (so a full step measures supply over the whole step);
   * rates()/autoBuyTick() pass dt=1. Space buffer siphoning is NOT done here — it
   * is a tick-only mutation performed before this is called.
   */
  private _computeFactors(
    state: StageState,
    dt: number,
    cmPrimary: Decimal,
    cmSecondary: Decimal,
    stages?: Record<string, StageState>,
    skills?: Record<string, number>,
    spaceBuffers?: { ore: Decimal; power: Decimal },
  ): ProdFactors {
    const f: ProdFactors = { ...NEUTRAL_FACTORS, cmPrimary, cmSecondary }
    const id = this.def.id

    if (id === 'magic' && stages) {
      const familiarCount = state.generators.familiar?.count ?? 0
      if (familiarCount > 0) {
        const farmState = stages['farm']
        if (farmState) {
          f.grainDemand = familiarCount * 0.05
          f.essenceDemand = familiarCount * 0.10
          const grainRatio = f.grainDemand > 0 ? farmState.primaryAmount.div(f.grainDemand * dt).min(ONE) : ONE
          const essenceRatio = f.essenceDemand > 0 ? state.secondaryAmount.div(f.essenceDemand * dt).min(ONE) : ONE
          f.familiarStarve = grainRatio.min(essenceRatio).max(ZERO)
        }
      }
    } else if (id === 'space' && stages) {
      const { ore, power, alloy } = this._spaceDemands(state, skills)
      f.oreDemand = ore; f.powerDemand = power; f.alloyDemand = alloy
      const hasBuffer = !!skills?.['space:buffer_tanks']
      const availableOre = hasBuffer && spaceBuffers ? spaceBuffers.ore : (stages['mine']?.primaryAmount ?? ZERO)
      const availablePower = hasBuffer && spaceBuffers ? spaceBuffers.power : (stages['factory']?.secondaryAmount ?? ZERO)
      const oreRatio = ore > 0 ? availableOre.div(ore * dt).min(ONE) : ONE
      const powerRatio = power > 0 ? availablePower.div(power * dt).min(ONE) : ONE
      f.alloyStarve = oreRatio.min(powerRatio).max(ZERO)
      f.stardustStarve = alloy > 0 ? state.secondaryAmount.div(alloy * dt).min(ONE) : ONE
    } else if (id === 'time') {
      f.timeThrottle = paradoxThrottle(state.secondaryAmount)
      const flow = skills?.['time:chronon_flow'] ?? 0
      if (flow > 0) f.timeProdMult = D(1 + 0.30 * flow)
      const loops = state.generators.loop?.count ?? 0
      const hourglasses = state.generators.hourglassarray?.count ?? 0
      let paradoxGen = loops * 0.02
      if (skills?.['time:stable_loop']) paradoxGen *= 0.5
      let ventRate = hourglasses * 0.5
      if (skills?.['time:paradox_vent']) ventRate *= 2
      f.paradoxNet = paradoxGen - ventRate
    } else if (id === 'multiverse') {
      const flow = skills?.['multiverse:shard_flow'] ?? 0
      if (flow > 0) f.mvProdMult = D(1 + 0.40 * flow)
      if (stages) {
        const rift = state.generators.rift?.count ?? 0
        const pmirror = state.generators.paradoxmirror?.count ?? 0
        f.mvAlloyDemand = 2 * rift
        f.mvParadoxDemand = 1 * pmirror
        const availAlloy = stages['space']?.secondaryAmount ?? ZERO
        const availParadox = stages['time']?.secondaryAmount ?? ZERO
        f.mvAlloyStarve = f.mvAlloyDemand > 0 ? availAlloy.div(f.mvAlloyDemand * dt).min(ONE) : ONE
        f.mvParadoxStarve = f.mvParadoxDemand > 0 ? availParadox.div(f.mvParadoxDemand * dt).min(ONE) : ONE
      }
    }
    return f
  }

  /** Output of a single generator at `count`, applying the shared factors. Pure. */
  private _produceGen(
    gdef: GeneratorDef,
    count: number,
    tierMult: Decimal,
    f: ProdFactors,
    dt: number,
    skills?: Record<string, number>,
  ): { primary: Decimal; secondary: Decimal } {
    const id = this.def.id
    let primary = ZERO
    let secondary = ZERO

    if (id === 'space') {
      if (gdef.secondaryRate) {
        let alloyMult = f.alloyStarve
        if (skills?.['space:logistics_ai'] && skills['space:logistics_ai'] >= 1) alloyMult = alloyMult.mul(2)
        secondary = production(count, gdef.secondaryRate, tierMult, f.cmSecondary, dt).mul(alloyMult)
      } else {
        let stardustMult = f.stardustStarve
        if (gdef.id === 'probe' && skills?.['space:probe_swarm'] && skills['space:probe_swarm'] >= 1) {
          stardustMult = stardustMult.mul(2)
        }
        primary = production(count, gdef.baseRate, tierMult, f.cmPrimary, dt).mul(stardustMult)
      }
    } else if (id === 'magic' && gdef.id === 'familiar') {
      primary = production(count, gdef.baseRate, tierMult, f.cmPrimary, dt).mul(f.familiarStarve)
    } else if (id === 'time') {
      primary = production(count, gdef.baseRate, tierMult, f.cmPrimary, dt).mul(f.timeThrottle).mul(f.timeProdMult)
    } else if (id === 'multiverse') {
      let starve = ONE
      if (gdef.id === 'rift') starve = f.mvAlloyStarve
      else if (gdef.id === 'paradoxmirror') {
        starve = f.mvParadoxStarve
        if (skills?.['multiverse:paradox_harvest']) starve = starve.mul(2.5)
      }
      primary = production(count, gdef.baseRate, tierMult, f.cmPrimary, dt).mul(starve).mul(f.mvProdMult)
      if (gdef.secondaryRate) {
        secondary = production(count, gdef.secondaryRate, tierMult, f.cmSecondary, dt)
      }
    } else {
      primary = production(count, gdef.baseRate, tierMult, f.cmPrimary, dt)
      if (gdef.secondaryRate) {
        secondary = production(count, gdef.secondaryRate, tierMult, f.cmSecondary, dt)
      }
    }
    return { primary, secondary }
  }

  /** Auto-buyer step: buy the single cheapest currently-affordable, unlocked generator (Cheapest Mode)
   *  or evaluate Candidate Scores and buy the best value-per-cost generator (Smart Priority Mode).
   *  O(generators); one purchase per call keeps spend smooth and the hot loop cheap.
   *  Returns true if something was bought. */
  autoBuyTick(
    state: StageState,
    globalMult: Decimal = ONE,
    extraMult: Decimal = ONE,
    stages?: Record<string, StageState>,
    activeEnchants?: EnchantState[],
    skills?: Record<string, number>,
    spaceBuffers?: { ore: Decimal; power: Decimal }
  ): boolean {
    const isPriority = state.autoBuyMode === 'priority' && (state.ascensionCount ?? 0) >= 1
    const reserveFraction = state.autoBuyReserve ?? 0
    const reserve = state.primaryAmount.mul(reserveFraction)
    const spendable = state.primaryAmount.sub(reserve).max(ZERO)

    if (!isPriority) {
      // Cheapest mode (default basic auto-buyer)
      let bestId: string | null = null
      let bestCost: Decimal | null = null
      for (const gdef of this.def.generators) {
        if (state.prestigeCount < gdef.unlockAt) continue
        if (state.autoBuyVault?.includes(gdef.id)) continue
        const cost = generatorCost(gdef.baseCost, gdef.costGrowth, state.generators[gdef.id]?.count ?? 0)
        if (cost.gt(spendable)) continue
        if (bestCost === null || cost.lt(bestCost)) {
          bestCost = cost
          bestId = gdef.id
        }
      }
      if (bestId === null) return false
      return this.buy(state, bestId, 1)
    }

    // Smart Priority (MaxScore) mode: score each generator by marginal output / cost.
    const { cmPrimary, cmSecondary } = this._baseMults(state, globalMult, extraMult, activeEnchants)
    const f = this._computeFactors(state, 1, cmPrimary, cmSecondary, stages, skills, spaceBuffers)

    let bestId: string | null = null
    let bestScore: Decimal = ZERO
    for (const gdef of this.def.generators) {
      if (state.prestigeCount < gdef.unlockAt) continue
      if (state.autoBuyVault?.includes(gdef.id)) continue

      const count = state.generators[gdef.id]?.count ?? 0
      const cost = generatorCost(gdef.baseCost, gdef.costGrowth, count)
      if (cost.gt(spendable)) continue

      const tierMultOld = milestoneMult(count)
      const tierMultNew = milestoneMult(count + 1)
      const isSecondary = !!gdef.secondaryRate
      const outOld = this._produceGen(gdef, count, tierMultOld, f, 1, skills)
      const outNew = this._produceGen(gdef, count + 1, tierMultNew, f, 1, skills)
      const oldOutput = isSecondary ? outOld.secondary : outOld.primary
      const newOutput = isSecondary ? outNew.secondary : outNew.primary

      let score = newOutput.sub(oldOutput).div(cost)
      // Milestone Snipe bias
      if (tierMultNew.gt(tierMultOld) && (state.autoBuyMilestoneSnipe !== false)) {
        score = score.mul(1.5)
      }
      if (score.gt(bestScore)) {
        bestScore = score
        bestId = gdef.id
      }
    }

    if (bestId === null) return false
    return this.buy(state, bestId, 1)
  }

  /**
   * Advance this stage by dt seconds, mutates state, returns primary produced.
   * `extraMult` carries cross-stage binding multipliers (e.g. Village Labor → Farm).
   */
  tick(
    state: StageState,
    dt: number,
    globalMult: Decimal,
    extraMult: Decimal = ONE,
    stages?: Record<string, StageState>,
    activeEnchants?: EnchantState[],
    skills?: Record<string, number>,
    spaceBuffers?: { ore: Decimal; power: Decimal }
  ): Decimal {
    const { cmPrimary, cmSecondary } = this._baseMults(state, globalMult, extraMult, activeEnchants)

    // Space buffer siphon is a tick-only mutation that must run BEFORE factors are
    // read (so availability reflects the freshly-topped-up buffers).
    if (this.def.id === 'space' && stages) {
      this._siphonSpaceBuffers(state, stages, skills, spaceBuffers)
    }

    const f = this._computeFactors(state, dt, cmPrimary, cmSecondary, stages, skills, spaceBuffers)

    // Apply upkeep consumption / Paradox accrual (mutations) using the same factors.
    this._applyConsumption(state, dt, f, stages, skills, spaceBuffers)

    let primaryGained = ZERO
    let secondaryGained = ZERO
    let labor = 0
    for (const gdef of this.def.generators) {
      const gs = state.generators[gdef.id]
      if (!gs || gs.count === 0) continue   // missing entry (old save) → treat as count 0
      const tierMult = milestoneMult(gs.count)
      const out = this._produceGen(gdef, gs.count, tierMult, f, dt, skills)
      primaryGained = primaryGained.add(out.primary)
      gs.totalProduced = gs.totalProduced.add(out.primary)
      secondaryGained = secondaryGained.add(out.secondary)
      if (gdef.laborOutput) labor += gs.count * gdef.laborOutput
    }

    state.primaryAmount = state.primaryAmount.add(primaryGained)
    state.primaryLifetime = state.primaryLifetime.add(primaryGained)
    state.secondaryAmount = state.secondaryAmount.add(secondaryGained)
    state.laborOutput = D(labor) // labor/s rate (dt-independent)

    // Branch Node upkeep: 5 Shards/s each, drained from the Multiverse's own Shards.
    if (this.def.id === 'multiverse') {
      const branch = state.generators.branchnode?.count ?? 0
      if (branch > 0) state.primaryAmount = state.primaryAmount.sub(5 * branch * dt).max(ZERO)
    }

    return primaryGained
  }

  /** Top up Space buffer tanks from Mine Ore / Factory Power (tick-only mutation). */
  private _siphonSpaceBuffers(
    state: StageState,
    stages: Record<string, StageState>,
    skills?: Record<string, number>,
    spaceBuffers?: { ore: Decimal; power: Decimal },
  ): void {
    if (!skills?.['space:buffer_tanks'] || !spaceBuffers) return
    const { ore, power } = this._spaceDemands(state, skills)
    const oreCap = D(ore * 600)
    const powerCap = D(power * 600)

    const mine = stages['mine']
    if (mine) {
      const mineSurplus = mine.primaryAmount.sub(250).max(ZERO) // threshold: firstGenCost * 10
      const oreToSiphon = mineSurplus.min(oreCap.sub(spaceBuffers.ore)).max(ZERO)
      spaceBuffers.ore = spaceBuffers.ore.add(oreToSiphon)
      mine.primaryAmount = mine.primaryAmount.sub(oreToSiphon).max(ZERO)
    }
    const factory = stages['factory']
    if (factory) {
      const powerToSiphon = factory.secondaryAmount.min(powerCap.sub(spaceBuffers.power)).max(ZERO)
      spaceBuffers.power = spaceBuffers.power.add(powerToSiphon)
      factory.secondaryAmount = factory.secondaryAmount.sub(powerToSiphon).max(ZERO)
    }
  }

  /** Deduct cross-stage upkeep and accrue Time Paradox (tick-only mutations). */
  private _applyConsumption(
    state: StageState,
    dt: number,
    f: ProdFactors,
    stages?: Record<string, StageState>,
    skills?: Record<string, number>,
    spaceBuffers?: { ore: Decimal; power: Decimal },
  ): void {
    const id = this.def.id

    if (id === 'magic' && stages) {
      const farmState = stages['farm']
      if (farmState && f.grainDemand > 0) {
        farmState.primaryAmount = farmState.primaryAmount.sub(f.familiarStarve.mul(f.grainDemand * dt)).max(ZERO)
        state.secondaryAmount = state.secondaryAmount.sub(f.familiarStarve.mul(f.essenceDemand * dt)).max(ZERO)
      }
    } else if (id === 'space' && stages) {
      const consumedOre = f.alloyStarve.mul(f.oreDemand * dt)
      const consumedPower = f.alloyStarve.mul(f.powerDemand * dt)
      const hasBuffer = !!skills?.['space:buffer_tanks']
      if (hasBuffer && spaceBuffers) {
        spaceBuffers.ore = spaceBuffers.ore.sub(consumedOre).max(ZERO)
        spaceBuffers.power = spaceBuffers.power.sub(consumedPower).max(ZERO)
      } else {
        const mine = stages['mine']
        if (mine) mine.primaryAmount = mine.primaryAmount.sub(consumedOre).max(ZERO)
        const factory = stages['factory']
        if (factory) factory.secondaryAmount = factory.secondaryAmount.sub(consumedPower).max(ZERO)
      }
      state.secondaryAmount = state.secondaryAmount.sub(f.stardustStarve.mul(f.alloyDemand * dt)).max(ZERO)
    } else if (id === 'time') {
      state.secondaryAmount = state.secondaryAmount.add(D(f.paradoxNet * dt)).max(ZERO)
    } else if (id === 'multiverse' && stages) {
      const space = stages['space']
      if (space && f.mvAlloyDemand > 0) {
        space.secondaryAmount = space.secondaryAmount.sub(f.mvAlloyStarve.mul(f.mvAlloyDemand * dt)).max(ZERO)
      }
      const time = stages['time']
      if (time && f.mvParadoxDemand > 0) {
        time.secondaryAmount = time.secondaryAmount.sub(f.mvParadoxStarve.mul(f.mvParadoxDemand * dt)).max(ZERO)
      }
    }
  }

  /**
   * Non-mutating per-second production rates (dt = 1). Reuses the exact same
   * factor + production helpers as tick(), so the UI readout matches what
   * actually accrues. Read-only — safe to call per frame.
   */
  rates(
    state: StageState,
    globalMult: Decimal,
    extraMult: Decimal = ONE,
    stages?: Record<string, StageState>,
    activeEnchants?: EnchantState[],
    skills?: Record<string, number>,
    spaceBuffers?: { ore: Decimal; power: Decimal }
  ): { primary: Decimal; secondary: Decimal; labor: Decimal } {
    const { cmPrimary, cmSecondary } = this._baseMults(state, globalMult, extraMult, activeEnchants)
    const f = this._computeFactors(state, 1, cmPrimary, cmSecondary, stages, skills, spaceBuffers)

    let primary = ZERO
    let secondary = ZERO
    let labor = ZERO
    for (const gdef of this.def.generators) {
      const gs = state.generators[gdef.id]
      if (!gs || gs.count === 0) continue   // missing entry (old save) → treat as count 0
      const out = this._produceGen(gdef, gs.count, milestoneMult(gs.count), f, 1, skills)
      primary = primary.add(out.primary)
      secondary = secondary.add(out.secondary)
      if (gdef.laborOutput) labor = labor.add(gs.count * gdef.laborOutput)
    }
    // Time reports net Paradox/s (gen − vent) as its secondary rate, regardless of generators owned.
    if (this.def.id === 'time') secondary = D(f.paradoxNet)
    return { primary, secondary, labor }
  }


  // ── Purchasing ──────────────────────────────────────────────────────────

  currentCost(state: StageState, genId: string, amount = 1): Decimal {
    const gdef = this._gdef(genId)
    const count = state.generators[genId]?.count ?? 0
    if (amount === -1) {
      const actualAmount = maxAffordable(gdef.baseCost, gdef.costGrowth, count, state.primaryAmount)
      if (actualAmount === 0) return generatorCost(gdef.baseCost, gdef.costGrowth, count)
      return bulkGeneratorCost(gdef.baseCost, gdef.costGrowth, count, actualAmount)
    }
    return amount <= 1
      ? generatorCost(gdef.baseCost, gdef.costGrowth, count)
      : bulkGeneratorCost(gdef.baseCost, gdef.costGrowth, count, amount)
  }

  canAfford(state: StageState, genId: string, amount = 1): boolean {
    const gdef = this._gdef(genId)
    if (state.prestigeCount < gdef.unlockAt) return false
    const count = state.generators[genId]?.count ?? 0
    const cost = amount === 1
      ? generatorCost(gdef.baseCost, gdef.costGrowth, count)
      : bulkGeneratorCost(gdef.baseCost, gdef.costGrowth, count, amount)
    return state.primaryAmount.gte(cost)
  }

  buy(state: StageState, genId: string, amount = 1): boolean {
    const gdef = this._gdef(genId)
    if (state.prestigeCount < gdef.unlockAt) return false

    // Self-heal a missing entry (old save predating this generator).
    let gs = state.generators[genId]
    if (!gs) gs = state.generators[genId] = { id: genId, count: 0, totalProduced: ZERO }
    let cost: Decimal
    let actualAmount = amount

    if (amount === -1) {
      // buy max
      actualAmount = maxAffordable(gdef.baseCost, gdef.costGrowth, gs.count, state.primaryAmount)
      if (actualAmount === 0) return false
      cost = bulkGeneratorCost(gdef.baseCost, gdef.costGrowth, gs.count, actualAmount)
    } else if (amount === 1) {
      cost = generatorCost(gdef.baseCost, gdef.costGrowth, gs.count)
    } else {
      cost = bulkGeneratorCost(gdef.baseCost, gdef.costGrowth, gs.count, amount)
    }

    if (state.primaryAmount.lt(cost)) return false

    state.primaryAmount = state.primaryAmount.sub(cost)
    gs.count += actualAmount
    return true
  }

  // ── Prestige ────────────────────────────────────────────────────────────

  prestigePreview(state: StageState): number {
    return prestigeGain(state.primaryLifetime, this.def.prestigeSoftcap, this.def.prestigeK)
  }

  prestige(state: StageState): number {
    const gain = this.prestigePreview(state)
    if (gain === 0) return 0

    state.prestigeCurrency += gain
    state.prestigeCount++

    // Reset primary/secondary amounts and generator counts
    state.primaryAmount = ZERO
    state.primaryLifetime = ZERO
    state.secondaryAmount = ZERO
    for (const gs of Object.values(state.generators)) {
      gs.count = 0
      gs.totalProduced = ZERO
    }

    // Prestige multiplier: each prestige level adds +25% production
    state.productionMult = D(1 + state.prestigeCount * 0.25)

    return gain
  }

  // ── Ascension (deep meta reset → Legacy Points) ─────────────────────────
  ascensionPreview(state: StageState): number {
    return ascensionGain(state.primaryLifetime, this.def.prestigeSoftcap)
  }

  /**
   * Ascend: a deeper reset than prestige. Wipes the stage's generators, currencies,
   * AND its local-prestige currency/count back to zero, in exchange for Legacy Points
   * (returned to the caller, which credits the global LP pool). Keeps `unlocked`.
   */
  ascend(state: StageState): number {
    const gain = this.ascensionPreview(state)
    if (gain === 0) return 0

    state.primaryAmount = ZERO
    state.primaryLifetime = ZERO
    state.secondaryAmount = ZERO
    state.prestigeCurrency = 0
    state.prestigeCount = 0
    state.productionMult = ONE
    state.autoBuy = false
    for (const gs of Object.values(state.generators)) {
      gs.count = 0
      gs.totalProduced = ZERO
    }
    state.ascensionCount = (state.ascensionCount ?? 0) + 1
    return gain
  }

  // ── Surplus for Fortune Engine ─────────────────────────────────────────

  surplus(state: StageState): Decimal {
    // Surplus = primary amount above a "comfortable" level (×10 the cost of gen[1])
    const firstGenCost = generatorCost(this.def.generators[0].baseCost, this.def.generators[0].costGrowth, 0)
    const threshold = firstGenCost.mul(10)
    return state.primaryAmount.sub(threshold).max(ZERO)
  }

  private _gdef(id: string): GeneratorDef {
    const g = this.def.generators.find(g => g.id === id)
    if (!g) throw new Error(`Generator ${id} not found in stage ${this.def.id}`)
    return g
  }
}
