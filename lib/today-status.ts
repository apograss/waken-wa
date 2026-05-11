const TODAY_STATUS_TEXT_MAX_LENGTH = 20

function toTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function getFirstGrapheme(value: string): string {
  if (!value) return ''

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    const iterator = segmenter.segment(value)[Symbol.iterator]()
    const first = iterator.next()
    return first.done ? '' : first.value.segment
  }

  return Array.from(value)[0] ?? ''
}

export function normalizeTodayStatusEmoji(value: unknown): string {
  return getFirstGrapheme(toTrimmedString(value))
}

export function normalizeTodayStatusText(value: unknown): string {
  return toTrimmedString(value).slice(0, TODAY_STATUS_TEXT_MAX_LENGTH)
}

export function normalizeTodayStatusBusy(value: unknown): boolean {
  return value === true
}

export function normalizeTodayStatusExpiresAt(value: unknown): string {
  const raw = toTrimmedString(value)
  if (!raw) return ''

  const timestamp = Date.parse(raw)
  if (!Number.isFinite(timestamp)) return ''
  return new Date(timestamp).toISOString()
}

export function isTodayStatusActive(value: {
  todayStatusEmoji?: unknown
  todayStatusExpiresAt?: unknown
}): boolean {
  const emoji = normalizeTodayStatusEmoji(value.todayStatusEmoji)
  if (!emoji) return false

  const expiresAt = normalizeTodayStatusExpiresAt(value.todayStatusExpiresAt)
  if (!expiresAt) return true
  return Date.parse(expiresAt) > Date.now()
}

export function parseTodayStatusDateTimeLocal(value: string): string {
  const raw = toTrimmedString(value)
  if (!raw) return ''

  const timestamp = Date.parse(raw)
  if (!Number.isFinite(timestamp)) return ''
  return new Date(timestamp).toISOString()
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatTodayStatusDateTimeLocal(value: unknown): string {
  const iso = normalizeTodayStatusExpiresAt(value)
  if (!iso) return ''

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join('-') + `T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`
}

export { TODAY_STATUS_TEXT_MAX_LENGTH }
