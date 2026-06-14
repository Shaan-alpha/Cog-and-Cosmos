import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  isCloudConfigured, getClient, currentUser, signIn, pushSave, fetchCloudMeta, pullSave,
} from './cloud'

afterEach(() => { vi.unstubAllEnvs() })

describe('isCloudConfigured', () => {
  it('false when both env vars are absent', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    expect(isCloudConfigured()).toBe(false)
  })
  it('false when only one is present', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    expect(isCloudConfigured()).toBe(false)
  })
  it('true when both are present', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')
    expect(isCloudConfigured()).toBe(true)
  })
})

describe('unconfigured = safe no-ops (no network, no supabase import)', () => {
  function clearEnv() {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
  }
  it('getClient resolves null', async () => { clearEnv(); expect(await getClient()).toBeNull() })
  it('currentUser resolves null', async () => { clearEnv(); expect(await currentUser()).toBeNull() })
  it('signIn returns not-configured', async () => { clearEnv(); expect((await signIn('a@b.c')).ok).toBe(false) })
  it('pushSave returns not-configured', async () => {
    clearEnv()
    expect((await pushSave({ blob: 'x', saveVersion: 14, saveTimestamp: 1 })).ok).toBe(false)
  })
  it('fetchCloudMeta resolves null', async () => { clearEnv(); expect(await fetchCloudMeta()).toBeNull() })
  it('pullSave resolves null', async () => { clearEnv(); expect(await pullSave()).toBeNull() })
})
