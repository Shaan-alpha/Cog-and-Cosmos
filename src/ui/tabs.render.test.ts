// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import EnchantsTab from './EnchantsTab.svelte'
import WarpTab from './WarpTab.svelte'
import DuplicationTab from './DuplicationTab.svelte'

// Render smoke tests: mount each extracted stage tab against the real store and
// assert it renders its key content without throwing. This guards the StagePanel
// component split — type-check covers bindings, this covers runtime mount.

let cleanup: (() => void) | null = null
afterEach(() => { cleanup?.(); cleanup = null })

function render(Comp: any, props: Record<string, unknown>): HTMLElement {
  const target = document.createElement('div')
  document.body.appendChild(target)
  const inst = mount(Comp, { target, props })
  flushSync()
  cleanup = () => { unmount(inst); target.remove() }
  return target
}

describe('stage tab components mount without crashing', () => {
  it('EnchantsTab renders the casting dashboard', () => {
    const el = render(EnchantsTab, { stageId: 'magic' })
    expect(el.textContent).toContain('Cast Enchantments')
    expect(el.textContent).toContain('Quicken')
  })

  it('WarpTab renders the warp dashboard', () => {
    const el = render(WarpTab, { stageId: 'time' })
    expect(el.textContent).toContain('Cast a Warp Tick')
    expect(el.textContent).toContain('Warp Duration')
  })

  it('DuplicationTab renders the branch-slot + convergence dashboards', () => {
    const el = render(DuplicationTab, { stageId: 'multiverse' })
    expect(el.textContent).toContain('Branch Slots')
    expect(el.textContent).toContain('Convergence Collapse')
  })
})
