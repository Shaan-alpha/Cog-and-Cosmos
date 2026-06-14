// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { D } from '../systems/Decimal'
import { setMuted } from '../systems/audio'

// Mock the whole cloud wrapper so the bridges are tested in isolation (no network).
vi.mock('../systems/cloud', () => ({
  isCloudConfigured: vi.fn(() => true),
  currentUser: vi.fn(async () => ({ email: 'a@b.c' })),
  fetchCloudMeta: vi.fn(async () => null),
  pushSave: vi.fn(async () => ({ ok: true })),
  pullSave: vi.fn(async () => null),
}))

import * as cloud from '../systems/cloud'
import {
  __resetStoreForTest, getState, exportActiveSave, cloudPush, cloudPull,
} from './game.svelte'

const HUGE = 9_000_000_000_000_000   // far-future ms timestamp

beforeEach(() => {
  setMuted(true)
  __resetStoreForTest()
  vi.clearAllMocks()   // clear call history between tests (clearAllMocks keeps impls, so re-set defaults below)
  vi.mocked(cloud.isCloudConfigured).mockReturnValue(true)
  vi.mocked(cloud.currentUser).mockResolvedValue({ email: 'a@b.c' })
  vi.mocked(cloud.fetchCloudMeta).mockResolvedValue(null)
  vi.mocked(cloud.pushSave).mockResolvedValue({ ok: true })
  vi.mocked(cloud.pullSave).mockResolvedValue(null)
})

describe('cloudPush', () => {
  it('unconfigured short-circuits without writing', async () => {
    vi.mocked(cloud.isCloudConfigured).mockReturnValue(false)
    expect((await cloudPush()).status).toBe('unconfigured')
    expect(cloud.pushSave).not.toHaveBeenCalled()
  })
  it('unauthenticated short-circuits without writing', async () => {
    vi.mocked(cloud.currentUser).mockResolvedValue(null)
    expect((await cloudPush()).status).toBe('unauthenticated')
    expect(cloud.pushSave).not.toHaveBeenCalled()
  })
  it('writes and returns ok when there is no conflict', async () => {
    expect((await cloudPush()).status).toBe('ok')
    expect(cloud.pushSave).toHaveBeenCalledOnce()
  })
  it('returns conflict (no write) when cloud is newer', async () => {
    vi.mocked(cloud.fetchCloudMeta).mockResolvedValue({ saveVersion: 14, saveTimestamp: HUGE })
    const r = await cloudPush()
    expect(r.status).toBe('conflict')
    expect(cloud.pushSave).not.toHaveBeenCalled()
  })
  it('force overrides a conflict and writes', async () => {
    vi.mocked(cloud.fetchCloudMeta).mockResolvedValue({ saveVersion: 14, saveTimestamp: HUGE })
    expect((await cloudPush({ force: true })).status).toBe('ok')
    expect(cloud.pushSave).toHaveBeenCalledOnce()
  })
  it('surfaces a push error', async () => {
    vi.mocked(cloud.pushSave).mockResolvedValue({ ok: false, error: 'boom' })
    const r = await cloudPush()
    expect(r).toEqual({ status: 'error', error: 'boom' })
  })
})

describe('cloudPull', () => {
  it('empty when there is no cloud row', async () => {
    expect((await cloudPull()).status).toBe('empty')
  })
  it('swaps in the cloud save on ok', async () => {
    getState().stages.village.primaryAmount = D(999)
    const blob = exportActiveSave()           // valid blob carrying 999 coins
    __resetStoreForTest()                      // back to a fresh 15-coin game
    vi.mocked(cloud.pullSave).mockResolvedValue({ blob, saveVersion: 14, saveTimestamp: HUGE })
    expect((await cloudPull()).status).toBe('ok')
    expect(getState().stages.village.primaryAmount.toNumber()).toBe(999)
  })
  it('returns conflict (no swap) when local is newer', async () => {
    getState().saveTimestamp = HUGE                       // local is far newer
    vi.mocked(cloud.pullSave).mockResolvedValue({ blob: 'whatever', saveVersion: 14, saveTimestamp: 1 })
    const before = getState().stages.village.primaryAmount.toNumber()
    expect((await cloudPull()).status).toBe('conflict')
    expect(getState().stages.village.primaryAmount.toNumber()).toBe(before)   // unchanged
  })
  it('reports corrupt when the blob cannot be decoded', async () => {
    vi.mocked(cloud.pullSave).mockResolvedValue({ blob: '!!!not-base64!!!', saveVersion: 14, saveTimestamp: HUGE })
    expect((await cloudPull()).status).toBe('corrupt')
  })
  it('force swaps even when local is newer', async () => {
    getState().stages.village.primaryAmount = D(777)
    const blob = exportActiveSave()
    __resetStoreForTest()
    getState().saveTimestamp = HUGE
    vi.mocked(cloud.pullSave).mockResolvedValue({ blob, saveVersion: 14, saveTimestamp: 1 })
    expect((await cloudPull({ force: true })).status).toBe('ok')
    expect(getState().stages.village.primaryAmount.toNumber()).toBe(777)
  })
})
