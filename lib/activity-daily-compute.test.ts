import { describe, expect, it } from 'vitest'

import {
  computeActiveDelta,
  localDateKey,
  slotIndex,
  summarizeTopApps,
} from './activity-daily-compute'

const T = 1_700_000_000_000 // arbitrary fixed epoch ms

describe('computeActiveDelta', () => {
  it('returns 0 on the first report (no previous timestamp)', () => {
    expect(computeActiveDelta(null, T, 300)).toBe(0)
    expect(computeActiveDelta(undefined, T, 300)).toBe(0)
  })

  it('returns elapsed whole seconds for a normal interval', () => {
    expect(computeActiveDelta(T, T + 60_000, 300)).toBe(60)
  })

  it('caps long gaps at capSeconds (sleep / offline guard)', () => {
    expect(computeActiveDelta(T, T + 3_600_000, 300)).toBe(300)
  })

  it('returns 0 when the clock goes backwards', () => {
    expect(computeActiveDelta(T + 60_000, T, 300)).toBe(0)
  })
})

describe('localDateKey', () => {
  it('formats the date in the given timezone', () => {
    // 2026-06-11T15:30:00Z = 23:30 in Asia/Shanghai (UTC+8)
    expect(localDateKey('2026-06-11T15:30:00Z', 'Asia/Shanghai')).toBe('2026-06-11')
  })

  it('rolls into the next local day when UTC is still the previous day', () => {
    // 2026-06-11T16:00:00Z = 00:00 next day in Asia/Shanghai
    expect(localDateKey('2026-06-11T16:00:00Z', 'Asia/Shanghai')).toBe('2026-06-12')
  })
})

describe('slotIndex', () => {
  it('maps 23:30 local to slot 47', () => {
    // 2026-06-11T15:30:00Z = 23:30 Shanghai -> 23*2 + 1
    expect(slotIndex('2026-06-11T15:30:00Z', 'Asia/Shanghai')).toBe(47)
  })

  it('maps local midnight to slot 0', () => {
    // 2026-06-11T16:00:00Z = 00:00 Shanghai
    expect(slotIndex('2026-06-11T16:00:00Z', 'Asia/Shanghai')).toBe(0)
  })

  it('maps the first half of an hour to the even slot', () => {
    // 2026-06-11T01:15:00Z = 09:15 Shanghai -> 9*2 + 0
    expect(slotIndex('2026-06-11T01:15:00Z', 'Asia/Shanghai')).toBe(18)
  })
})

describe('summarizeTopApps', () => {
  it('sorts by activeSeconds desc and computes percent of the day total', () => {
    const rows = [
      { processName: 'chrome', activeSeconds: 1200 },
      { processName: 'code', activeSeconds: 3600 },
      { processName: 'spotify', activeSeconds: 1200 },
    ]
    const out = summarizeTopApps(rows, 2)
    expect(out).toHaveLength(2)
    expect(out[0]).toMatchObject({ processName: 'code', activeSeconds: 3600, percent: 60 })
    expect(out[1].activeSeconds).toBe(1200)
  })

  it('returns an empty array when there are no rows', () => {
    expect(summarizeTopApps([], 5)).toEqual([])
  })
})
