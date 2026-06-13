/**
 * StageEconomy — one instance per unlocked stage.
 * Handles: generator production, milestone mults, prestige.
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

    if (!isPriority) {
      // Cheapest mode (default basic auto-buyer)
      let bestId: string | null = null
      let bestCost: Decimal | null = null
      for (const gdef of this.def.generators) {
        if (state.prestigeCount < gdef.unlockAt) continue
        if (state.autoBuyVault?.includes(gdef.id)) continue
        
        const cost = generatorCost(gdef.baseCost, gdef.costGrowth, state.generators[gdef.id].count)
        
        // Respect reserve fraction
        const reserveFraction = state.autoBuyReserve ?? 0
        const reserve = state.primaryAmount.mul(reserveFraction)
        const spendable = state.primaryAmount.sub(reserve).max(ZERO)
        
        if (cost.gt(spendable)) continue
        if (bestCost === null || cost.lt(bestCost)) {
          bestCost = cost
          bestId = gdef.id
        }
      }
      if (bestId === null) return false
      return this.buy(state, bestId, 1)
    } else {
      // Smart Priority (MaxScore) mode
      // Calculate spendable budget
      const reserveFraction = state.autoBuyReserve ?? 0
      const reserve = state.primaryAmount.mul(reserveFraction)
      const spendable = state.primaryAmount.sub(reserve).max(ZERO)

      let bestId: string | null = null
      let bestScore: Decimal = ZERO

      // Combined production multipliers
      let stageSpecificMult = ONE
      for (const gdef of this.def.generators) {
        if (gdef.globalStageMult && state.generators[gdef.id].count >= 1) {
          stageSpecificMult = stageSpecificMult.mul(gdef.globalStageMult)
        }
      }
      const combinedMult = state.productionMult.mul(stageSpecificMult).mul(globalMult).mul(extraMult)

      let maxEnchant = ONE
      if (activeEnchants) {
        for (const enc of activeEnchants) {
          if (enc.targetStageId === this.def.id || enc.targetStageId === 'all') {
            if (enc.multiplier.gt(maxEnchant)) {
              maxEnchant = enc.multiplier
            }
          }
        }
      }
      const combinedMultSecondary = this.def.id === 'magic' ? combinedMult : combinedMult.mul(maxEnchant)
      const combinedMultPrimary = combinedMult.mul(maxEnchant)

      // Starvation/Throttle factors
      let familiarStarve = ONE
      if (this.def.id === 'magic' && stages) {
        const familiarCount = state.generators.familiar?.count ?? 0
        if (familiarCount > 0) {
          const farmState = stages['farm']
          if (farmState) {
            const grainDemand = familiarCount * 0.05
            const essenceDemand = familiarCount * 0.10
            const grainRatio = grainDemand > 0 ? farmState.primaryAmount.div(grainDemand).min(ONE) : ONE
            const essenceRatio = essenceDemand > 0 ? state.secondaryAmount.div(essenceDemand).min(ONE) : ONE
            familiarStarve = grainRatio.min(essenceRatio).max(ZERO)
          }
        }
      }

      let alloyStarve = ONE
      let stardustStarve = ONE
      if (this.def.id === 'space' && stages) {
        const smelter = state.generators.smelter?.count ?? 0
        const refinery = state.generators.refinery?.count ?? 0
        const dyson = state.generators.dysonframe?.count ?? 0
        let demandOre = 5 * smelter + 12 * refinery + 40 * dyson
        let demandPower = 2 * smelter + 5 * refinery + 30 * dyson
        if (skills?.['space:self_mining_drones'] && skills['space:self_mining_drones'] >= 1) demandOre *= 0.92
        if (skills?.['space:power_recapture'] && skills['space:power_recapture'] >= 1) demandPower *= 0.75
        const oreLvl = skills?.['space:ore_throughput'] ?? 0
        if (oreLvl > 0) demandOre *= (1 - 0.10 * oreLvl)

        const hasBuffer = !!skills?.['space:buffer_tanks']
        const availableOre = hasBuffer && spaceBuffers ? spaceBuffers.ore : (stages['mine']?.primaryAmount ?? ZERO)
        const availablePower = hasBuffer && spaceBuffers ? spaceBuffers.power : (stages['factory']?.secondaryAmount ?? ZERO)
        const oreRatio = demandOre > 0 ? availableOre.div(demandOre).min(ONE) : ONE
        const powerRatio = demandPower > 0 ? availablePower.div(demandPower).min(ONE) : ONE
        alloyStarve = oreRatio.min(powerRatio).max(ZERO)

        const probe = state.generators.probe?.count ?? 0
        const colony = state.generators.colony?.count ?? 0
        const forge = state.generators.starforge?.count ?? 0
        const gate = state.generators.warpgate?.count ?? 0
        const demandAlloy = 3 * probe + 10 * colony + 90 * forge + 200 * gate
        stardustStarve = demandAlloy > 0 ? state.secondaryAmount.div(demandAlloy).min(ONE) : ONE
      }

      let timeThrottle = ONE
      let timeProdMult = ONE
      if (this.def.id === 'time') {
        timeThrottle = paradoxThrottle(state.secondaryAmount)
        const flow = skills?.['time:chronon_flow'] ?? 0
        if (flow > 0) timeProdMult = D(1 + 0.30 * flow)
      }

      let mvAlloyStarve = ONE
      let mvParadoxStarve = ONE
      let mvProdMult = ONE
      if (this.def.id === 'multiverse') {
        const flow = skills?.['multiverse:shard_flow'] ?? 0
        if (flow > 0) mvProdMult = D(1 + 0.40 * flow)
        if (stages) {
          const rift = state.generators.rift?.count ?? 0
          const pmirror = state.generators.paradoxmirror?.count ?? 0
          const demandAlloy = 2 * rift
          const availAlloy = stages['space']?.secondaryAmount ?? ZERO
          mvAlloyStarve = demandAlloy > 0 ? availAlloy.div(demandAlloy).min(ONE) : ONE
          const demandParadox = 1 * pmirror
          const availParadox = stages['time']?.secondaryAmount ?? ZERO
          mvParadoxStarve = demandParadox > 0 ? availParadox.div(demandParadox).min(ONE) : ONE
        }
      }

      for (const gdef of this.def.generators) {
        if (state.prestigeCount < gdef.unlockAt) continue
        if (state.autoBuyVault?.includes(gdef.id)) continue

        const count = state.generators[gdef.id].count
        const cost = generatorCost(gdef.baseCost, gdef.costGrowth, count)
        if (cost.gt(spendable)) continue

        const tierMultOld = milestoneMult(count)
        const tierMultNew = milestoneMult(count + 1)
        
        let oldOutput = ZERO
        let newOutput = ZERO
        
        const isSecondary = !!gdef.secondaryRate
        const baseRate = isSecondary ? (gdef.secondaryRate ?? ZERO) : gdef.baseRate
        const mult = isSecondary ? combinedMultSecondary : combinedMultPrimary

        if (this.def.id === 'space') {
          if (isSecondary) {
            let alloyMult = alloyStarve
            if (skills?.['space:logistics_ai'] && skills['space:logistics_ai'] >= 1) alloyMult = alloyMult.mul(2)
            oldOutput = production(count, baseRate, tierMultOld, mult, 1).mul(alloyMult)
            newOutput = production(count + 1, baseRate, tierMultNew, mult, 1).mul(alloyMult)
          } else {
            let stardustMult = stardustStarve
            if (gdef.id === 'probe' && skills?.['space:probe_swarm'] && skills['space:probe_swarm'] >= 1) {
              stardustMult = stardustMult.mul(2)
            }
            oldOutput = production(count, baseRate, tierMultOld, mult, 1).mul(stardustMult)
            newOutput = production(count + 1, baseRate, tierMultNew, mult, 1).mul(stardustMult)
          }
        } else if (this.def.id === 'magic' && gdef.id === 'familiar') {
          oldOutput = production(count, baseRate, tierMultOld, mult, 1).mul(familiarStarve)
          newOutput = production(count + 1, baseRate, tierMultNew, mult, 1).mul(familiarStarve)
        } else if (this.def.id === 'time') {
          oldOutput = production(count, baseRate, tierMultOld, mult, 1).mul(timeThrottle).mul(timeProdMult)
          newOutput = production(count + 1, baseRate, tierMultNew, mult, 1).mul(timeThrottle).mul(timeProdMult)
        } else if (this.def.id === 'multiverse') {
          let starve = ONE
          if (gdef.id === 'rift') starve = mvAlloyStarve
          else if (gdef.id === 'paradoxmirror') {
            starve = mvParadoxStarve
            if (skills?.['multiverse:paradox_harvest']) starve = starve.mul(2.5)
          }
          oldOutput = production(count, baseRate, tierMultOld, mult, 1).mul(starve).mul(mvProdMult)
          newOutput = production(count + 1, baseRate, tierMultNew, mult, 1).mul(starve).mul(mvProdMult)
        } else {
          oldOutput = production(count, baseRate, tierMultOld, mult, 1)
          newOutput = production(count + 1, baseRate, tierMultNew, mult, 1)
        }

        const delta = newOutput.sub(oldOutput)
        let score = delta.div(cost)

        // Milestone Snipe bias
        const crossedMilestone = tierMultNew.gt(tierMultOld)
        if (crossedMilestone && (state.autoBuyMilestoneSnipe !== false)) {
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
    let primaryGained  = ZERO
    let secondaryGained = ZERO
    let totalLabor = ZERO

    // Collect one-time globalStageMult from owned generators (e.g. Guild Hall, Castle)
    let stageSpecificMult = ONE
    for (const gdef of this.def.generators) {
      if (gdef.globalStageMult && state.generators[gdef.id].count >= 1) {
        stageSpecificMult = stageSpecificMult.mul(gdef.globalStageMult)
      }
    }

    const combinedMult = state.productionMult.mul(stageSpecificMult).mul(globalMult).mul(extraMult)

    // Calculate active enchants
    let maxEnchant = ONE
    if (activeEnchants) {
      for (const enc of activeEnchants) {
        if (enc.targetStageId === this.def.id || enc.targetStageId === 'all') {
          if (enc.multiplier.gt(maxEnchant)) {
            maxEnchant = enc.multiplier
          }
        }
      }
    }
    const combinedMultSecondary = this.def.id === 'magic' ? combinedMult : combinedMult.mul(maxEnchant)
    const combinedMultPrimary = combinedMult.mul(maxEnchant)

    // Magic familiar upkeep
    let familiarStarve = ONE
    if (this.def.id === 'magic' && stages) {
      const familiarCount = state.generators.familiar?.count ?? 0
      if (familiarCount > 0) {
        const farmState = stages['farm']
        if (farmState) {
          const grainDemand = familiarCount * 0.05
          const essenceDemand = familiarCount * 0.10
          const grainRatio = grainDemand > 0 ? farmState.primaryAmount.div(grainDemand * dt).min(ONE) : ONE
          const essenceRatio = essenceDemand > 0 ? state.secondaryAmount.div(essenceDemand * dt).min(ONE) : ONE
          familiarStarve = grainRatio.min(essenceRatio).max(ZERO)

          // Deduct upkeep
          const consumedGrain = familiarStarve.mul(grainDemand * dt)
          const consumedEssence = familiarStarve.mul(essenceDemand * dt)
          farmState.primaryAmount = farmState.primaryAmount.sub(consumedGrain).max(ZERO)
          state.secondaryAmount = state.secondaryAmount.sub(consumedEssence).max(ZERO)
        }
      }
    }

    // Space starvation logic
    let alloyStarve = ONE
    let stardustStarve = ONE
    if (this.def.id === 'space' && stages) {
      const smelter = state.generators.smelter?.count ?? 0
      const probe = state.generators.probe?.count ?? 0
      const refinery = state.generators.refinery?.count ?? 0
      const colony = state.generators.colony?.count ?? 0
      const dyson = state.generators.dysonframe?.count ?? 0
      const forge = state.generators.starforge?.count ?? 0
      const gate = state.generators.warpgate?.count ?? 0

      let demandOre = 5 * smelter + 12 * refinery + 40 * dyson
      let demandPower = 2 * smelter + 5 * refinery + 30 * dyson

      // Apply upgrades
      if (skills?.['space:self_mining_drones'] && skills['space:self_mining_drones'] >= 1) {
        demandOre *= 0.92
      }
      if (skills?.['space:power_recapture'] && skills['space:power_recapture'] >= 1) {
        demandPower *= 0.75
      }
      const oreLvl = skills?.['space:ore_throughput'] ?? 0
      if (oreLvl > 0) {
        demandOre *= (1 - 0.10 * oreLvl)
      }

      const hasBuffer = !!skills?.['space:buffer_tanks']
      const oreCap = D(demandOre * 600)
      const powerCap = D(demandPower * 600)

      if (hasBuffer && spaceBuffers) {
        // Siphon Ore from Mine
        const mine = stages['mine']
        if (mine) {
          const mineSurplus = mine.primaryAmount.sub(250).max(ZERO) // threshold: firstGenCost * 10
          const oreToSiphon = mineSurplus.min(oreCap.sub(spaceBuffers.ore)).max(ZERO)
          spaceBuffers.ore = spaceBuffers.ore.add(oreToSiphon)
          mine.primaryAmount = mine.primaryAmount.sub(oreToSiphon).max(ZERO)
        }

        // Siphon Power from Factory
        const factory = stages['factory']
        if (factory) {
          const factoryPower = factory.secondaryAmount
          const powerToSiphon = factoryPower.min(powerCap.sub(spaceBuffers.power)).max(ZERO)
          spaceBuffers.power = spaceBuffers.power.add(powerToSiphon)
          factory.secondaryAmount = factory.secondaryAmount.sub(powerToSiphon).max(ZERO)
        }
      }

      // Compute available
      const availableOre = hasBuffer && spaceBuffers ? spaceBuffers.ore : (stages['mine']?.primaryAmount ?? ZERO)
      const availablePower = hasBuffer && spaceBuffers ? spaceBuffers.power : (stages['factory']?.secondaryAmount ?? ZERO)

      const oreRatio = demandOre > 0 ? availableOre.div(demandOre * dt).min(ONE) : ONE
      const powerRatio = demandPower > 0 ? availablePower.div(demandPower * dt).min(ONE) : ONE
      alloyStarve = oreRatio.min(powerRatio).max(ZERO)

      // Deduct Ore and Power
      const consumedOre = alloyStarve.mul(demandOre * dt)
      const consumedPower = alloyStarve.mul(demandPower * dt)

      if (hasBuffer && spaceBuffers) {
        spaceBuffers.ore = spaceBuffers.ore.sub(consumedOre).max(ZERO)
        spaceBuffers.power = spaceBuffers.power.sub(consumedPower).max(ZERO)
      } else {
        const mine = stages['mine']
        if (mine) mine.primaryAmount = mine.primaryAmount.sub(consumedOre).max(ZERO)
        const factory = stages['factory']
        if (factory) factory.secondaryAmount = factory.secondaryAmount.sub(consumedPower).max(ZERO)
      }

      // Alloy demand for Stardust production
      const demandAlloy = 3 * probe + 10 * colony + 90 * forge + 200 * gate
      stardustStarve = demandAlloy > 0 ? state.secondaryAmount.div(demandAlloy * dt).min(ONE) : ONE

      // Deduct Alloy
      const consumedAlloy = stardustStarve.mul(demandAlloy * dt)
      state.secondaryAmount = state.secondaryAmount.sub(consumedAlloy).max(ZERO)
    }

    // Time: Paradox throttle + accrual. Paradox (the secondary currency) softly caps all
    // Chronon output; Loops leak it, Hourglass Arrays vent it. Chronon Flow boosts output.
    let timeThrottle = ONE
    let timeProdMult = ONE
    if (this.def.id === 'time') {
      timeThrottle = paradoxThrottle(state.secondaryAmount)
      const flow = skills?.['time:chronon_flow'] ?? 0
      if (flow > 0) timeProdMult = D(1 + 0.30 * flow)

      const loops = state.generators.loop?.count ?? 0
      const hourglasses = state.generators.hourglassarray?.count ?? 0
      let paradoxGen = loops * 0.02
      if (skills?.['time:stable_loop']) paradoxGen *= 0.5
      let ventRate = hourglasses * 0.5
      if (skills?.['time:paradox_vent']) ventRate *= 2
      const paradoxDelta = D((paradoxGen - ventRate) * dt)
      state.secondaryAmount = state.secondaryAmount.add(paradoxDelta).max(ZERO)
    }

    // Multiverse: Rifts consume Space Alloy; Paradox Mirrors consume Time Paradox.
    // Shortage throttles the respective Shard producers (mirrors the Space input chain).
    let mvAlloyStarve = ONE
    let mvParadoxStarve = ONE
    let mvProdMult = ONE
    if (this.def.id === 'multiverse') {
      const flow = skills?.['multiverse:shard_flow'] ?? 0
      if (flow > 0) mvProdMult = D(1 + 0.40 * flow)

      if (stages) {
        const rift = state.generators.rift?.count ?? 0
        const pmirror = state.generators.paradoxmirror?.count ?? 0

        const space = stages['space']
        const demandAlloy = 2 * rift
        const availAlloy = space?.secondaryAmount ?? ZERO
        mvAlloyStarve = demandAlloy > 0 ? availAlloy.div(demandAlloy * dt).min(ONE) : ONE
        if (space) space.secondaryAmount = space.secondaryAmount.sub(mvAlloyStarve.mul(demandAlloy * dt)).max(ZERO)

        const time = stages['time']
        const demandParadox = 1 * pmirror
        const availParadox = time?.secondaryAmount ?? ZERO
        mvParadoxStarve = demandParadox > 0 ? availParadox.div(demandParadox * dt).min(ONE) : ONE
        if (time) time.secondaryAmount = time.secondaryAmount.sub(mvParadoxStarve.mul(demandParadox * dt)).max(ZERO)
      }
    }

    for (const gdef of this.def.generators) {
      const gs = state.generators[gdef.id]
      if (gs.count === 0) continue

      const tierMult = milestoneMult(gs.count)
      let primaryProd = ZERO
      let secondaryProd = ZERO

      if (this.def.id === 'space') {
        if (gdef.secondaryRate) {
          let alloyMult = alloyStarve
          if (skills?.['space:logistics_ai'] && skills['space:logistics_ai'] >= 1) {
            alloyMult = alloyMult.mul(2)
          }
          secondaryProd = production(gs.count, gdef.secondaryRate, tierMult, combinedMultSecondary, dt).mul(alloyMult)
        } else {
          let stardustMult = stardustStarve
          if (gdef.id === 'probe' && skills?.['space:probe_swarm'] && skills['space:probe_swarm'] >= 1) {
            stardustMult = stardustMult.mul(2)
          }
          primaryProd = production(gs.count, gdef.baseRate, tierMult, combinedMultPrimary, dt).mul(stardustMult)
        }
      } else if (this.def.id === 'magic' && gdef.id === 'familiar') {
        primaryProd = production(gs.count, gdef.baseRate, tierMult, combinedMultPrimary, dt).mul(familiarStarve)
      } else if (this.def.id === 'time') {
        primaryProd = production(gs.count, gdef.baseRate, tierMult, combinedMultPrimary, dt).mul(timeThrottle).mul(timeProdMult)
      } else if (this.def.id === 'multiverse') {
        let starve = ONE
        if (gdef.id === 'rift') starve = mvAlloyStarve
        else if (gdef.id === 'paradoxmirror') {
          starve = mvParadoxStarve
          if (skills?.['multiverse:paradox_harvest']) starve = starve.mul(2.5)
        }
        primaryProd = production(gs.count, gdef.baseRate, tierMult, combinedMultPrimary, dt).mul(starve).mul(mvProdMult)
        if (gdef.secondaryRate) {
          secondaryProd = production(gs.count, gdef.secondaryRate, tierMult, combinedMultSecondary, dt)
        }
      } else {
        primaryProd = production(gs.count, gdef.baseRate, tierMult, combinedMultPrimary, dt)
        if (gdef.secondaryRate) {
          secondaryProd = production(gs.count, gdef.secondaryRate, tierMult, combinedMultSecondary, dt)
        }
      }

      primaryGained = primaryGained.add(primaryProd)
      gs.totalProduced = gs.totalProduced.add(primaryProd)
      secondaryGained = secondaryGained.add(secondaryProd)

      // Labor cross-stage output
      if (gdef.laborOutput) {
        totalLabor = totalLabor.add(gs.count * gdef.laborOutput * dt)
      }
    }

    state.primaryAmount  = state.primaryAmount.add(primaryGained)
    state.primaryLifetime = state.primaryLifetime.add(primaryGained)
    state.secondaryAmount = state.secondaryAmount.add(secondaryGained)
    state.laborOutput = totalLabor.div(Math.max(dt, 0.001)) // labor/s rate

    // Branch Node upkeep: 5 Shards/s each, drained from the Multiverse's own Shards.
    if (this.def.id === 'multiverse') {
      const branch = state.generators.branchnode?.count ?? 0
      if (branch > 0) state.primaryAmount = state.primaryAmount.sub(5 * branch * dt).max(ZERO)
    }

    return primaryGained
  }

  /**
   * Non-mutating per-second production rates (dt = 1). Mirrors tick() math exactly
   * so the UI readout matches what actually accrues. Read-only — safe to call per frame.
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
    let primary = ZERO
    let secondary = ZERO
    let labor = ZERO

    let stageSpecificMult = ONE
    for (const gdef of this.def.generators) {
      if (gdef.globalStageMult && state.generators[gdef.id].count >= 1) {
        stageSpecificMult = stageSpecificMult.mul(gdef.globalStageMult)
      }
    }
    const combinedMult = state.productionMult.mul(stageSpecificMult).mul(globalMult).mul(extraMult)

    // Calculate active enchants
    let maxEnchant = ONE
    if (activeEnchants) {
      for (const enc of activeEnchants) {
        if (enc.targetStageId === this.def.id || enc.targetStageId === 'all') {
          if (enc.multiplier.gt(maxEnchant)) {
            maxEnchant = enc.multiplier
          }
        }
      }
    }
    const combinedMultSecondary = this.def.id === 'magic' ? combinedMult : combinedMult.mul(maxEnchant)
    const combinedMultPrimary = combinedMult.mul(maxEnchant)

    // Magic familiar upkeep
    let familiarStarve = ONE
    if (this.def.id === 'magic' && stages) {
      const familiarCount = state.generators.familiar?.count ?? 0
      if (familiarCount > 0) {
        const farmState = stages['farm']
        if (farmState) {
          const grainDemand = familiarCount * 0.05
          const essenceDemand = familiarCount * 0.10
          const grainRatio = grainDemand > 0 ? farmState.primaryAmount.div(grainDemand).min(ONE) : ONE
          const essenceRatio = essenceDemand > 0 ? state.secondaryAmount.div(essenceDemand).min(ONE) : ONE
          familiarStarve = grainRatio.min(essenceRatio).max(ZERO)
        }
      }
    }

    // Space starvation logic
    let alloyStarve = ONE
    let stardustStarve = ONE
    if (this.def.id === 'space' && stages) {
      const smelter = state.generators.smelter?.count ?? 0
      const probe = state.generators.probe?.count ?? 0
      const refinery = state.generators.refinery?.count ?? 0
      const colony = state.generators.colony?.count ?? 0
      const dyson = state.generators.dysonframe?.count ?? 0
      const forge = state.generators.starforge?.count ?? 0
      const gate = state.generators.warpgate?.count ?? 0

      let demandOre = 5 * smelter + 12 * refinery + 40 * dyson
      let demandPower = 2 * smelter + 5 * refinery + 30 * dyson

      // Apply upgrades
      if (skills?.['space:self_mining_drones'] && skills['space:self_mining_drones'] >= 1) {
        demandOre *= 0.92
      }
      if (skills?.['space:power_recapture'] && skills['space:power_recapture'] >= 1) {
        demandPower *= 0.75
      }
      const oreLvl = skills?.['space:ore_throughput'] ?? 0
      if (oreLvl > 0) {
        demandOre *= (1 - 0.10 * oreLvl)
      }

      const hasBuffer = !!skills?.['space:buffer_tanks']
      const availableOre = hasBuffer && spaceBuffers ? spaceBuffers.ore : (stages['mine']?.primaryAmount ?? ZERO)
      const availablePower = hasBuffer && spaceBuffers ? spaceBuffers.power : (stages['factory']?.secondaryAmount ?? ZERO)

      const oreRatio = demandOre > 0 ? availableOre.div(demandOre).min(ONE) : ONE
      const powerRatio = demandPower > 0 ? availablePower.div(demandPower).min(ONE) : ONE
      alloyStarve = oreRatio.min(powerRatio).max(ZERO)

      // Alloy demand for Stardust production
      const demandAlloy = 3 * probe + 10 * colony + 90 * forge + 200 * gate
      stardustStarve = demandAlloy > 0 ? state.secondaryAmount.div(demandAlloy).min(ONE) : ONE
    }

    // Time: Paradox throttle + Chronon Flow boost (read-only mirror of tick()).
    let timeThrottle = ONE
    let timeProdMult = ONE
    let paradoxNet = ZERO   // net Paradox/s reported as the secondary rate
    if (this.def.id === 'time') {
      timeThrottle = paradoxThrottle(state.secondaryAmount)
      const flow = skills?.['time:chronon_flow'] ?? 0
      if (flow > 0) timeProdMult = D(1 + 0.30 * flow)

      const loops = state.generators.loop?.count ?? 0
      const hourglasses = state.generators.hourglassarray?.count ?? 0
      let paradoxGen = loops * 0.02
      if (skills?.['time:stable_loop']) paradoxGen *= 0.5
      let ventRate = hourglasses * 0.5
      if (skills?.['time:paradox_vent']) ventRate *= 2
      paradoxNet = D(paradoxGen - ventRate)
    }

    // Multiverse: Alloy/Paradox supply ratios + Shard Flow (read-only mirror of tick()).
    let mvAlloyStarve = ONE
    let mvParadoxStarve = ONE
    let mvProdMult = ONE
    if (this.def.id === 'multiverse') {
      const flow = skills?.['multiverse:shard_flow'] ?? 0
      if (flow > 0) mvProdMult = D(1 + 0.40 * flow)
      if (stages) {
        const rift = state.generators.rift?.count ?? 0
        const pmirror = state.generators.paradoxmirror?.count ?? 0
        const demandAlloy = 2 * rift
        const availAlloy = stages['space']?.secondaryAmount ?? ZERO
        mvAlloyStarve = demandAlloy > 0 ? availAlloy.div(demandAlloy).min(ONE) : ONE
        const demandParadox = 1 * pmirror
        const availParadox = stages['time']?.secondaryAmount ?? ZERO
        mvParadoxStarve = demandParadox > 0 ? availParadox.div(demandParadox).min(ONE) : ONE
      }
    }

    for (const gdef of this.def.generators) {
      const gs = state.generators[gdef.id]
      if (gs.count === 0) continue
      const tierMult = milestoneMult(gs.count)

      let primaryProd = ZERO
      let secondaryProd = ZERO

      if (this.def.id === 'space') {
        if (gdef.secondaryRate) {
          let alloyMult = alloyStarve
          if (skills?.['space:logistics_ai'] && skills['space:logistics_ai'] >= 1) {
            alloyMult = alloyMult.mul(2)
          }
          secondaryProd = production(gs.count, gdef.secondaryRate, tierMult, combinedMultSecondary, 1).mul(alloyMult)
        } else {
          let stardustMult = stardustStarve
          if (gdef.id === 'probe' && skills?.['space:probe_swarm'] && skills['space:probe_swarm'] >= 1) {
            stardustMult = stardustMult.mul(2)
          }
          primaryProd = production(gs.count, gdef.baseRate, tierMult, combinedMultPrimary, 1).mul(stardustMult)
        }
      } else if (this.def.id === 'magic' && gdef.id === 'familiar') {
        primaryProd = production(gs.count, gdef.baseRate, tierMult, combinedMultPrimary, 1).mul(familiarStarve)
      } else if (this.def.id === 'time') {
        primaryProd = production(gs.count, gdef.baseRate, tierMult, combinedMultPrimary, 1).mul(timeThrottle).mul(timeProdMult)
      } else if (this.def.id === 'multiverse') {
        let starve = ONE
        if (gdef.id === 'rift') starve = mvAlloyStarve
        else if (gdef.id === 'paradoxmirror') {
          starve = mvParadoxStarve
          if (skills?.['multiverse:paradox_harvest']) starve = starve.mul(2.5)
        }
        primaryProd = production(gs.count, gdef.baseRate, tierMult, combinedMultPrimary, 1).mul(starve).mul(mvProdMult)
        if (gdef.secondaryRate) {
          secondaryProd = production(gs.count, gdef.secondaryRate, tierMult, combinedMultSecondary, 1)
        }
      } else {
        primaryProd = production(gs.count, gdef.baseRate, tierMult, combinedMultPrimary, 1)
        if (gdef.secondaryRate) {
          secondaryProd = production(gs.count, gdef.secondaryRate, tierMult, combinedMultSecondary, 1)
        }
      }

      primary = primary.add(primaryProd)
      secondary = secondary.add(secondaryProd)
      if (gdef.laborOutput) {
        labor = labor.add(gs.count * gdef.laborOutput)
      }
    }
    // Time reports net Paradox/s (gen − vent) as its secondary rate, regardless of generators owned.
    if (this.def.id === 'time') secondary = paradoxNet
    return { primary, secondary, labor }
  }


  // ── Purchasing ──────────────────────────────────────────────────────────

  currentCost(state: StageState, genId: string, amount = 1): Decimal {
    const gdef = this._gdef(genId)
    const count = state.generators[genId].count
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
    const cost = amount === 1
      ? generatorCost(gdef.baseCost, gdef.costGrowth, state.generators[genId].count)
      : bulkGeneratorCost(gdef.baseCost, gdef.costGrowth, state.generators[genId].count, amount)
    return state.primaryAmount.gte(cost)
  }

  buy(state: StageState, genId: string, amount = 1): boolean {
    const gdef = this._gdef(genId)
    if (state.prestigeCount < gdef.unlockAt) return false

    const gs = state.generators[genId]
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
