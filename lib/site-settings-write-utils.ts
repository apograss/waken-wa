import 'server-only'

import { SITE_SETTINGS_MIGRATION_REQUIRED_MESSAGE } from '@/constants/site-settings'

export function NormalizeSiteSettingsStringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  return value.length > 0 ? value : null
}

function CreateSiteSettingsError(message: string, status: number, code: string): Error {
  const error = new Error(message)
  ;(error as Error & { status?: number; code?: string }).status = status
  ;(error as Error & { status?: number; code?: string }).code = code
  return error
}

export function CreateSiteSettingsMigrationRequiredError(
  message: string = SITE_SETTINGS_MIGRATION_REQUIRED_MESSAGE,
): Error {
  return CreateSiteSettingsError(message, 409, 'SITE_SETTINGS_MIGRATION_REQUIRED')
}

export function CreateSiteSettingsConflictError(message: string): Error {
  return CreateSiteSettingsError(message, 409, 'SITE_SETTINGS_CONFLICT')
}

export function CreateSiteSettingsCategoryApiRequiredError(message: string): Error {
  return CreateSiteSettingsError(message, 409, 'SITE_SETTINGS_CATEGORY_API_REQUIRED')
}

export function CreateSiteSettingsNotFoundError(message: string): Error {
  return CreateSiteSettingsError(message, 400, 'SITE_SETTINGS_NOT_FOUND')
}

function IsBetterSqlite3Client(client: unknown): client is {
  exec: (sql: string) => unknown
  inTransaction?: boolean
} {
  return (
    !!client &&
    typeof client === 'object' &&
    typeof (client as { exec?: unknown }).exec === 'function'
  )
}

export function WithSiteSettingsTransaction<T>(
  executor: any,
  run: (tx: any) => Promise<T>,
): Promise<T> {
  const sqliteClient = executor?.$client
  if (IsBetterSqlite3Client(sqliteClient)) {
    const startedHere = sqliteClient.inTransaction !== true
    if (startedHere) {
      sqliteClient.exec('BEGIN IMMEDIATE')
    }

    return Promise.resolve(run(executor)).then(
      (value) => {
        if (startedHere) {
          sqliteClient.exec('COMMIT')
        }
        return value
      },
      (error) => {
        if (startedHere) {
          try {
            sqliteClient.exec('ROLLBACK')
          } catch {
            // Ignore rollback failures so the original error is preserved.
          }
        }
        throw error
      },
    )
  }

  if (executor && typeof executor.transaction === 'function') {
    return executor.transaction((tx: any) => run(tx))
  }
  return run(executor)
}
