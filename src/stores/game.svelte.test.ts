import { describe, it, expect, beforeEach } from 'vitest'
import { D } from '../systems/Decimal'
import { setMuted } from '../systems/audio'
import {
  __resetStoreForTest, getState,
  enterChallenge, abandonChallenge, maybeCompleteChallenge,
  activeChallenge, medals, completedChallenges,
  realityReset, transcend,
  prestigeStage, collectedRelics,
  tickEvents, claimEvent, activeEventBuff, claimableEvent, eventBuffMult, __forceSpawnEventForTest,
} from './game.svelte'

// Store-layer integration tests: the snapshot-and-restore + reset paths
// (challenge enter/complete/abandon, realityReset, transcend) reassign the live
// `gs` root and aren't covered by the pure-core suites. These pin that behaviour.
// SFX muted so the audio paths (playTranscend) are inert in jsdom.

beforeEach(() => {
  setMuted(true)
  __resetStoreForTest()
})

describe('Challenges — snapshot enter/abandon', () => {
  it('snapshots the real save on enter and restores it on abandon', () => {
    const g0 = getState()
    g0.medals = 5
    g0.stages.village.primaryAmount = D(777)

    expect(enterChallenge('spartan_cogs')).toBe(true)
    expect(activeChallenge()).toBe('spartan_cogs')
    expect(getState().challengeSnapshot).toBeTruthy()
    // fresh restricted run: no carried-over progress
    expect(getState().stages.village.primaryAmount.toNumber()).toBe(15)
    expect(medals()).toBe(0)

    abandonChallenge()
    expect(activeChallenge()).toBe(null)
    expect(medals()).toBe(5)                                   // restored
    expect(getState().stages.village.primaryAmount.toNumber()).toBe(777)
    expect(getState().challengeSnapshot).toBeUndefined()
  })

  it('refuses a second challenge while one is active', () => {
    enterChallenge('spartan_cogs')
    expect(enterChallenge('broken_chain')).toBe(false)
    expect(activeChallenge()).toBe('spartan_cogs')
  })

  it('blocks entering a challenge whose requires are unmet', () => {
    expect(getState().completedChallenges).toEqual([])
    expect(enterChallenge('purist')).toBe(false)              // requires spartan_cogs
    expect(activeChallenge()).toBe(null)
  })
})

describe('Challenges — completion', () => {
  it('restores the save and credits Medals when the goal is met', () => {
    enterChallenge('spartan_cogs')
    getState().stages.village.primaryLifetime = D(1e9)        // meet the goal on the run

    expect(maybeCompleteChallenge()).toBe(true)
    expect(activeChallenge()).toBe(null)
    expect(medals()).toBe(1)
    expect(completedChallenges()).toContain('spartan_cogs')
  })

  it('does not double-reward re-clearing the same challenge', () => {
    getState().completedChallenges = ['spartan_cogs']
    getState().medals = 9
    enterChallenge('spartan_cogs')
    getState().stages.village.primaryLifetime = D(1e9)
    maybeCompleteChallenge()
    expect(medals()).toBe(9)                                  // unchanged — already cleared
    expect(completedChallenges().filter(c => c === 'spartan_cogs')).toHaveLength(1)
  })
})

describe('realityReset (Omega)', () => {
  it('wipes the live game + Aether pool, keeps aetherLifetime and the meta trees', () => {
    const g0 = getState()
    g0.aetherLifetime = 2000        // omegaGain(2000) = floor(cbrt(2)) = 1
    g0.aether = 50
    g0.transcendCount = 3
    g0.skills = { spark: 2, 'tr:wellspring': 1, 'om:foundation': 1, 'ch:proven': 1 }
    g0.stages.village.primaryAmount = D(1e6)

    expect(realityReset()).toBe(true)
    const g = getState()
    expect(g.omega).toBe(1)
    expect(g.aether).toBe(0)                    // Aether POOL wiped
    expect(g.transcendCount).toBe(0)
    expect(g.aetherLifetime).toBe(2000)         // kept (drives Ω)
    expect(g.skills.spark).toBeUndefined()      // global tree wiped
    expect(g.skills['tr:wellspring']).toBe(1)   // Aether tree kept
    expect(g.skills['om:foundation']).toBe(1)   // Omega tree kept
    expect(g.skills['ch:proven']).toBe(1)       // Challenge tree kept
    expect(g.stages.village.primaryAmount.toNumber()).toBe(15)
  })
})

describe('transcend (Aether)', () => {
  it('keeps Aether + Challenge trees and wipes the global tree', () => {
    const g0 = getState()
    g0.fortuneAllTime = D(1e8)      // → 10 Aether pending
    g0.skills = { spark: 3, 'tr:wellspring': 2, 'ch:proven': 2 }

    expect(transcend()).toBe(true)
    const g = getState()
    expect(g.aether).toBe(10)
    expect(g.skills.spark).toBeUndefined()      // global tree wiped
    expect(g.skills['tr:wellspring']).toBe(2)   // Aether tree kept
    expect(g.skills['ch:proven']).toBe(2)       // Challenge tree kept
  })
})

describe('Events — spawn / claim / decay', () => {
  it('force-spawn makes an event claimable; claiming applies the buff', () => {
    __forceSpawnEventForTest('golden_cog')
    expect(claimableEvent()?.id).toBe('golden_cog')
    expect(claimEvent()).toBe(true)
    expect(activeEventBuff()?.id).toBe('golden_cog')
    expect(claimableEvent()).toBe(null)
    expect(eventBuffMult()).toBeCloseTo(3, 9)   // golden_cog mult
  })
  it('the buff decays to nothing after its duration', () => {
    __forceSpawnEventForTest('golden_cog')      // duration 30
    claimEvent()
    tickEvents(31)
    expect(activeEventBuff()).toBe(null)
    expect(eventBuffMult()).toBe(1)
  })
  it('an unclaimed event expires after the claim window', () => {
    __forceSpawnEventForTest('golden_cog')
    tickEvents(31)                              // > CLAIM_WINDOW (30)
    expect(claimableEvent()).toBe(null)
  })
})

describe('Collections — drops + persistence', () => {
  it('a stage prestige grants the guaranteed common relic first', () => {
    const g = getState()
    g.collectedRelics = []
    g.stages.village.prestigeCount = 0
    g.stages.village.primaryLifetime = D(1e9)   // ensure prestige yields > 0
    prestigeStage('village')
    expect(collectedRelics()).toContain('rl_brass_cog')   // guaranteed common (deterministic, no RNG)
  })
  it('relics survive transcend and realityReset', () => {
    const g = getState()
    g.collectedRelics = ['rl_brass_cog']
    g.fortuneAllTime = D(1e8)                    // transcend ready
    transcend()
    expect(collectedRelics()).toContain('rl_brass_cog')
    const g2 = getState()
    g2.aetherLifetime = 2000                     // realityReset ready
    realityReset()
    expect(collectedRelics()).toContain('rl_brass_cog')
  })
})
