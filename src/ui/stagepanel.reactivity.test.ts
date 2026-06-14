// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import StagePanel from './StagePanel.svelte'
import { __resetStoreForTest, getState } from '../stores/game.svelte'
import { setMuted } from '../systems/audio'

// Regression: the production-rate readout — and the gather/tap that derives from it — must refresh
// immediately when a generator is bought. A per-step `ratesStamp` memo once broke this by making the
// StagePanel rate $derived depend only on the sim-loop stamp instead of the stage's generator counts,
// so buying a Cottage left the rate stuck at +0.00/s and the tap pinned to +1.

let cleanup: (() => void) | null = null
afterEach(() => { cleanup?.(); cleanup = null })

describe('StagePanel rate reactivity', () => {
  it('refreshes the coin rate immediately when a generator count changes', () => {
    setMuted(true)
    __resetStoreForTest()
    const target = document.createElement('div'); document.body.appendChild(target)
    const inst = mount(StagePanel, { target, props: { stageId: 'village' } })
    cleanup = () => { unmount(inst); target.remove() }
    flushSync()

    // Fresh village: 0 cottages → no Coin production.
    expect((target.querySelector('.coin-rate')?.textContent ?? '').trim()).toBe('+0.00/s')

    getState().stages.village.generators.cottage.count = 10
    flushSync()

    // 10 cottages → a real positive rate, reflected without any sim-loop step.
    expect((target.querySelector('.coin-rate')?.textContent ?? '').trim()).not.toBe('+0.00/s')
  })
})
