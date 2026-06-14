import { describe, it, expect, beforeEach } from 'vitest'
import { getJuice, setJuice, cycleJuice, juiceAllows, defaultJuiceLevel } from './juice'

beforeEach(() => setJuice('full'))

describe('juice gate', () => {
  it('get/set round-trips', () => {
    setJuice('subtle')
    expect(getJuice()).toBe('subtle')
  })

  it('cycles off -> subtle -> full -> off', () => {
    setJuice('off')
    expect(cycleJuice()).toBe('subtle')
    expect(cycleJuice()).toBe('full')
    expect(cycleJuice()).toBe('off')
  })

  it('gate matrix by level (no reduced-motion in node)', () => {
    setJuice('off')
    expect(juiceAllows('floater')).toBe(false)
    expect(juiceAllows('burst')).toBe(false)
    expect(juiceAllows('bump')).toBe(false)
    expect(juiceAllows('shake')).toBe(false)

    setJuice('subtle')
    expect(juiceAllows('floater')).toBe(true)
    expect(juiceAllows('burst')).toBe(true)
    expect(juiceAllows('bump')).toBe(true)
    expect(juiceAllows('shake')).toBe(false)   // shake is full-only

    setJuice('full')
    expect(juiceAllows('shake')).toBe(true)
  })

  it('defaultJuiceLevel is full without reduced-motion (node has no matchMedia)', () => {
    expect(defaultJuiceLevel()).toBe('full')
  })
})
