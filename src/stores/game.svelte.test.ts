import { describe, it, expect, beforeEach } from 'vitest'
import { D } from '../systems/Decimal'
import { setMuted } from '../systems/audio'
import {
  __resetStoreForTest, getState,
  enterChallenge, abandonChallenge, maybeCompleteChallenge,
  activeChallenge, medals, completedChallenges,
  realityReset, transcend,
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
