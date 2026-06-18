import { describe, expect, it } from 'vitest'

import { formatPaperDate } from './live-inspiration-stage'

describe('formatPaperDate', () => {
  it('renders a UTC instant in the configured timezone (UTC+8), not server-local time', () => {
    // 2026-06-18T07:13:45Z is 15:13 in Asia/Shanghai.
    const result = formatPaperDate('2026-06-18T07:13:45.000Z', 'Asia/Shanghai')
    expect(result).toBe('06·18 · 15:13')
  })

  it('defaults to Asia/Shanghai when no timezone is given', () => {
    const result = formatPaperDate('2026-06-18T07:13:45.000Z')
    expect(result).toBe('06·18 · 15:13')
  })

  it('honors a different timezone', () => {
    // Same instant is 07:13 in UTC.
    const result = formatPaperDate('2026-06-18T07:13:45.000Z', 'UTC')
    expect(result).toBe('06·18 · 07:13')
  })

  it('returns the raw input when the date is invalid', () => {
    expect(formatPaperDate('not-a-date', 'Asia/Shanghai')).toBe('not-a-date')
  })
})
