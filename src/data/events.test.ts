import { describe, it, expect } from 'vitest'
import { EVENTS, EVENT_BY_ID } from './events'

describe('event data integrity', () => {
  it('has unique ids and a by-id map', () => {
    const ids = EVENTS.map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(Object.keys(EVENT_BY_ID).length).toBe(ids.length)
  })
  it('every event is a positive buff with a positive duration', () => {
    for (const e of EVENTS) {
      expect(e.mult).toBeGreaterThan(1)
      expect(e.duration).toBeGreaterThan(0)
    }
  })
})
