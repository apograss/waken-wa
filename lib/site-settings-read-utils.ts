import 'server-only'

import { parseJsonString } from '@/lib/json-parse'
import type { SiteSettingsRecord } from '@/types/site-settings'

export function ToSiteSettingsRecord(value: unknown): SiteSettingsRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as SiteSettingsRecord
}

export function ToSiteSettingsRecords(rows: unknown[]): SiteSettingsRecord[] {
  return rows
    .map((row) => ToSiteSettingsRecord(row))
    .filter((row: SiteSettingsRecord | null): row is SiteSettingsRecord => row !== null)
}

function GetSqliteMissingTable(error: unknown): string | null {
  const message = String((error as { message?: unknown })?.message ?? '')
  const match = message.match(/no such table:\s*(\S+)/i)
  return match?.[1] ?? null
}

function GetPostgresMissingTable(error: unknown): string | null {
  const message = String((error as { message?: unknown })?.message ?? '')
  const match = message.match(/relation\s+"([^"]+)"\s+does not exist/i)
  return match?.[1] ?? null
}

function IsMissingTableError(error: unknown, tableNames: readonly string[]): boolean {
  const tableName = (GetSqliteMissingTable(error) ?? GetPostgresMissingTable(error) ?? '')
    .trim()
    .replace(/^["']|["']$/g, '')
  return tableNames.includes(tableName)
}

export async function RunOrNullWhenMissingTables<T>(
  tableNames: readonly string[],
  run: () => Promise<T>,
): Promise<T | null> {
  try {
    return await run()
  } catch (error) {
    if (IsMissingTableError(error, tableNames)) {
      return null
    }
    throw error
  }
}

export function DecodeSiteSettingsScalarEntryValue(row: SiteSettingsRecord): unknown {
  const valueKind = String(row.valueKind ?? '').trim().toLowerCase()

  switch (valueKind) {
    case 'string':
      return typeof row.stringValue === 'string' ? row.stringValue : ''
    case 'number': {
      const value = Number(row.numberValue)
      return Number.isFinite(value) ? value : null
    }
    case 'boolean':
      return row.booleanValue === true || row.booleanValue === 1
    default:
      return null
  }
}

export function ReadSiteSettingsBooleanLike(value: unknown): boolean | undefined {
  if (value === true || value === 1) return true
  if (value === false || value === 0) return false
  return undefined
}

export function ReadSiteSettingsNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  return value.length > 0 ? value : undefined
}

export function ParseSiteSettingsArrayLike(raw: unknown): unknown[] {
  const parsed = parseJsonString(raw)
  return Array.isArray(parsed) ? parsed : []
}
