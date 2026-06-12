import type {
  AdminActivityHistoryAppRow,
  AdminActivityHistoryPlaySourceRow,
} from '@/types/admin'

type UnknownRecord = Record<string, unknown>

function ToRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null
}

function ToIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString()
  }
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  const parsed = Date.parse(trimmed)
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : trimmed
}

export function NormalizeActivityHistoryAppRows(
  rows: unknown,
): AdminActivityHistoryAppRow[] {
  if (!Array.isArray(rows)) return []

  return rows.flatMap((item) => {
    const row = ToRecord(item)
    const processName = String(row?.processName ?? '').trim()
    if (!processName) return []

    return [
      {
        processName,
        lastSeenAt: ToIsoString(row?.lastSeenAt),
      },
    ]
  })
}

export function NormalizeActivityHistoryPlaySourceRows(
  rows: unknown,
): AdminActivityHistoryPlaySourceRow[] {
  if (!Array.isArray(rows)) return []

  return rows.flatMap((item) => {
    const row = ToRecord(item)
    const playSource = String(row?.playSource ?? '').trim().toLowerCase()
    if (!playSource) return []

    return [
      {
        playSource,
        lastSeenAt: ToIsoString(row?.lastSeenAt),
      },
    ]
  })
}

export function BuildActivityAppsExportFileName(now = new Date()): string {
  const timestamp = now.toISOString().replace(/[:.]/g, '-')
  return `apps-export-${timestamp}.json`
}
