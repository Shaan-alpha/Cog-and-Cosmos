// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import EffectsLayer from './EffectsLayer.svelte'
import { emitFloater, emitBurst, getEffects, removeEffect } from '../stores/effects.svelte'
import { setJuice } from '../systems/juice'

let cleanup: (() => void) | null = null
afterEach(() => {
  cleanup?.(); cleanup = null
  getEffects().slice().forEach(e => removeEffect(e.id))
})

describe('EffectsLayer', () => {
  it('renders queued floaters and burst particles', () => {
    setJuice('full')
    emitFloater({ x: 10, y: 20, text: '+5', color: 'tomato' })
    emitBurst({ x: 30, y: 40, count: 6, particle: 'star' })

    const target = document.createElement('div')
    document.body.appendChild(target)
    const inst = mount(EffectsLayer, { target, props: {} })
    flushSync()
    cleanup = () => { unmount(inst); target.remove() }

    const floater = target.querySelector('.fx-floater') as HTMLElement
    expect(floater).toBeTruthy()
    expect(floater.textContent).toBe('+5')
    expect(target.querySelectorAll('.fx-particle').length).toBe(6)
  })
})
