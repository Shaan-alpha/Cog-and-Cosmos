// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import TranscendencePanel from './TranscendencePanel.svelte'
import OmegaPanel from './OmegaPanel.svelte'
import ChallengesPanel from './ChallengesPanel.svelte'
import CollectionsPanel from './CollectionsPanel.svelte'

// Render smoke tests for the meta-prestige + Challenges view panels. The
// type-check covers bindings; this covers runtime mount against the real store
// (a fresh game), guarding against template/accessor errors that only surface
// when the component actually renders.

let cleanup: (() => void) | null = null
afterEach(() => { cleanup?.(); cleanup = null })

function render(Comp: any): HTMLElement {
  const target = document.createElement('div')
  document.body.appendChild(target)
  const inst = mount(Comp, { target, props: {} })
  flushSync()
  cleanup = () => { unmount(inst); target.remove() }
  return target
}

describe('view panels mount without crashing', () => {
  it('TranscendencePanel renders the Aether altar + tree', () => {
    const el = render(TranscendencePanel)
    expect(el.textContent).toContain('TRANSCENDENCE')
    expect(el.textContent).toContain('Aether Upgrade Tree')
  })

  it('OmegaPanel renders the Reality collapse + tree', () => {
    const el = render(OmegaPanel)
    expect(el.textContent).toContain('REALITY RESET')
    expect(el.textContent).toContain('Reality Upgrade Tree')
  })

  it('ChallengesPanel renders the roster + Trial tree', () => {
    const el = render(ChallengesPanel)
    expect(el.textContent).toContain('CHALLENGES')
    expect(el.textContent).toContain('Trial Tree')
  })

  it('CollectionsPanel renders the relic tiers', () => {
    const el = render(CollectionsPanel)
    expect(el.textContent).toContain('COLLECTIONS')
    expect(el.textContent).toContain('Legendary')
  })
})
