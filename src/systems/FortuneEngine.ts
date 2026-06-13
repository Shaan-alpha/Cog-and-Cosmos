/**
 * FortuneEngine — mints Fortune (★) from stage surpluses.
 * dStar/dt = SUM_stages( log10(1 + surplus) * weight * engineMult )
 */
import { D, ZERO, Decimal } from './Decimal'
import { fortuneMintRate } from './formulas'
import type { StageState, FortuneEngineState } from '../data/types'
import type { StageDefinition } from '../data/types'

// Per-def Fortune surplus threshold (×10 the first generator's base cost),
// cached without mutating the shared static StageDefinition objects.
const thresholdCache = new WeakMap<StageDefinition, Decimal>()
function fortuneThreshold(def: StageDefinition): Decimal {
  let t = thresholdCache.get(def)
  if (!t) {
    t = def.generators[0]?.baseCost.mul(10) ?? D(100)
    thresholdCache.set(def, t)
  }
  return t
}

export class FortuneEngine {
  /** Build the {surplus, weight} list for every assigned, unlocked stage slot.
   *  Shared by tick() and ratePreview() so the mint math can never drift. */
  private buildSurpluses(
    engineState: FortuneEngineState,
    stageStates: Record<string, StageState>,
    stageDefs: Record<string, StageDefinition>,
    skills?: Record<string, number>,
  ): { surplus: Decimal; weight: number }[] {
    return engineState.slots
      .filter(sid => sid && stageStates[sid]?.unlocked)
      .map(sid => {
        const def = stageDefs[sid]
        if (!def) return null
        const surplus = stageStates[sid].primaryAmount.sub(fortuneThreshold(def)).max(ZERO)
        let weight = def.fortuneWeight
        if (sid === 'magic' && (skills?.['magic:resonant_surplus'] ?? 0) >= 1) weight *= 1.30
        if (sid === 'space' && (skills?.['space:stellar_compression'] ?? 0) >= 1) weight *= 1.40
        return { surplus, weight }
      })
      .filter((x): x is { surplus: Decimal; weight: number } => x !== null)
  }

  /** Tick: read surpluses from assigned stages and mint ★ */
  tick(
    engineState: FortuneEngineState,
    stageStates: Record<string, StageState>,
    stageDefs: Record<string, StageDefinition>,
    dt: number,
    skills?: Record<string, number>,
  ): Decimal {
    const surpluses = this.buildSurpluses(engineState, stageStates, stageDefs, skills)
    const minted = fortuneMintRate(surpluses, engineState.engineMult, dt)
    engineState.fortune = engineState.fortune.add(minted)
    engineState.fortuneLifetime = engineState.fortuneLifetime.add(minted)
    return minted
  }

  /** Assign a stage to the next open slot (max 8) */
  assignSlot(engineState: FortuneEngineState, stageId: string): boolean {
    if (engineState.slots.includes(stageId)) return false
    if (engineState.slots.length >= 8) return false
    engineState.slots.push(stageId)
    return true
  }

  removeSlot(engineState: FortuneEngineState, stageId: string): void {
    engineState.slots = engineState.slots.filter(s => s !== stageId)
  }

  /** Current ★/s mint rate preview (does not mutate) */
  ratePreview(
    engineState: FortuneEngineState,
    stageStates: Record<string, StageState>,
    stageDefs: Record<string, StageDefinition>,
    skills?: Record<string, number>,
  ): Decimal {
    const surpluses = this.buildSurpluses(engineState, stageStates, stageDefs, skills)
    return fortuneMintRate(surpluses, engineState.engineMult, 1)
  }

  freshState(): FortuneEngineState {
    return {
      fortune: ZERO,
      fortuneLifetime: ZERO,
      slots: ['village'],   // Village assigned to slot 1 by default
      engineMult: D(1),
    }
  }
}
