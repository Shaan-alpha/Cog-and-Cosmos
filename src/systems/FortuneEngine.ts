/**
 * FortuneEngine — mints Fortune (★) from stage surpluses.
 * dStar/dt = SUM_stages( log10(1 + surplus) * weight * engineMult )
 */
import { D, ZERO, Decimal } from './Decimal'
import { fortuneMintRate } from './formulas'
import type { StageState, FortuneEngineState } from '../data/types'
import type { StageDefinition } from '../data/types'

export class FortuneEngine {
  /** Tick: read surpluses from assigned stages and mint ★ */
  tick(
    engineState: FortuneEngineState,
    stageStates: Record<string, StageState>,
    stageDefs: Record<string, StageDefinition>,
    dt: number,
    skills?: Record<string, number>,
  ): Decimal {
    const surpluses = engineState.slots
      .filter(sid => sid && stageStates[sid]?.unlocked)
      .map(sid => {
        const def = stageDefs[sid]
        if (!def) return null
        // compute surplus: primaryAmount above threshold
        let threshold = (def as any)._fortuneThreshold
        if (!threshold) {
          threshold = (def as any)._fortuneThreshold = def.generators[0]?.baseCost.mul(10) ?? D(100)
        }
        const surplus = stageStates[sid].primaryAmount.sub(threshold).max(ZERO)
        let weight = def.fortuneWeight
        if (sid === 'magic' && skills?.['magic:resonant_surplus'] && skills['magic:resonant_surplus'] >= 1) {
          weight *= 1.30
        }
        if (sid === 'space' && skills?.['space:stellar_compression'] && skills['space:stellar_compression'] >= 1) {
          weight *= 1.40
        }
        return { surplus, weight }
      })
      .filter((x): x is { surplus: Decimal; weight: number } => x !== null)

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
    const surpluses = engineState.slots
      .filter(sid => sid && stageStates[sid]?.unlocked)
      .map(sid => {
        const def = stageDefs[sid]
        if (!def) return null
        let threshold = (def as any)._fortuneThreshold
        if (!threshold) {
          threshold = (def as any)._fortuneThreshold = def.generators[0]?.baseCost.mul(10) ?? D(100)
        }
        const surplus = stageStates[sid].primaryAmount.sub(threshold).max(ZERO)
        let weight = def.fortuneWeight
        if (sid === 'magic' && skills?.['magic:resonant_surplus'] && skills['magic:resonant_surplus'] >= 1) {
          weight *= 1.30
        }
        if (sid === 'space' && skills?.['space:stellar_compression'] && skills['space:stellar_compression'] >= 1) {
          weight *= 1.40
        }
        return { surplus, weight }
      })
      .filter((x): x is { surplus: Decimal; weight: number } => x !== null)
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
