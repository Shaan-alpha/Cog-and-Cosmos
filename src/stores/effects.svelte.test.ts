import { describe, it, expect, beforeEach } from 'vitest'
import { emitFloater, emitBurst, getEffects, removeEffect, shake, getShakeStamp, MAX_FLOATERS } from './effects.svelte'
import { setJuice } from '../systems/juice'

beforeEach(() => {
  setJuice('full')
  getEffects().slice().forEach(e => removeEffect(e.id))
})

describe('effects bus', () => {
  it('emitFloater queues a floater and returns its id', () => {
    const id = emitFloater({ x: 5, y: 9, text: '+42' })
    const fl = getEffects().filter(e => e.kind === 'floater')
    expect(fl.length).toBe(1)
    expect(fl[0].id).toBe(id)
    expect(fl[0].text).toBe('+42')
  })

  it('caps floaters at MAX_FLOATERS, dropping the oldest', () => {
    for (let i = 0; i < MAX_FLOATERS + 6; i++) emitFloater({ x: 0, y: 0, text: `+${i}` })
    const fl = getEffects().filter(e => e.kind === 'floater')
    expect(fl.length).toBe(MAX_FLOATERS)
    expect(fl[0].text).toBe('+6')          // first 6 dropped
  })

  it('removeEffect drops by id', () => {
    const id = emitBurst({ x: 1, y: 1, count: 4 })
    expect(getEffects().some(e => e.id === id)).toBe(true)
    removeEffect(id)
    expect(getEffects().some(e => e.id === id)).toBe(false)
  })

  it('emits nothing when juice is off', () => {
    setJuice('off')
    emitFloater({ x: 0, y: 0, text: '+1' })
    emitBurst({ x: 0, y: 0, count: 4 })
    expect(getEffects().length).toBe(0)
  })

  it('shake increments the stamp at full, no-ops at subtle/off', () => {
    setJuice('full'); const a = getShakeStamp(); shake(); expect(getShakeStamp()).toBe(a + 1)
    setJuice('subtle'); const b = getShakeStamp(); shake(); expect(getShakeStamp()).toBe(b)
    setJuice('off');    const c = getShakeStamp(); shake(); expect(getShakeStamp()).toBe(c)
  })
})
