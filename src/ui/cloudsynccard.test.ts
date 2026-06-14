// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import CloudSyncCard from './CloudSyncCard.svelte'

// No VITE_ env stubbed → isCloudConfigured() is false → the card renders its
// "not configured" state and never touches supabase or the network.

let cleanup: (() => void) | null = null
afterEach(() => { cleanup?.(); cleanup = null })

describe('CloudSyncCard', () => {
  it('mounts in the unconfigured state without throwing', () => {
    const target = document.createElement('div'); document.body.appendChild(target)
    const inst = mount(CloudSyncCard, { target })
    cleanup = () => { unmount(inst); target.remove() }
    flushSync()
    expect(target.textContent ?? '').toContain('Cloud Sync')
    expect((target.textContent ?? '').toLowerCase()).toContain('not configured')
  })
})
