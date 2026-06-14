// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { bump } from './actions/bump'
import { setJuice } from '../systems/juice'

beforeEach(() => setJuice('full'))

describe('use:bump', () => {
  it('animates on increase only (not equal or decrease)', () => {
    const node = document.createElement('span')
    const calls: unknown[][] = []
    ;(node as unknown as { animate: (...a: unknown[]) => Animation }).animate =
      (...a: unknown[]) => { calls.push(a); return {} as Animation }

    const handle = bump(node, 0)!
    handle.update!(5)   // increase → animate
    handle.update!(5)   // equal    → no
    handle.update!(2)   // decrease → no
    handle.update!(9)   // increase → animate

    expect(calls.length).toBe(2)
  })

  it('does not animate when juice is off', () => {
    setJuice('off')
    const node = document.createElement('span')
    let n = 0
    ;(node as unknown as { animate: () => Animation }).animate = () => { n++; return {} as Animation }
    const handle = bump(node, 0)!
    handle.update!(100)
    expect(n).toBe(0)
  })
})
