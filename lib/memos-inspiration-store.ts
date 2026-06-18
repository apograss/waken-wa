import { and, eq } from 'drizzle-orm'

import * as pg from '@/drizzle/schema.pg'
import * as sqlite from '@/drizzle/schema.sqlite'
import { isPostgresConnectionUrl } from '@/lib/db-env'

import {
  MEMOS_INSPIRATION_EXTERNAL_SOURCE,
  type NormalizedMemosInspiration,
} from './memos-inspiration'

type DbExecutor = any

const usePostgres = isPostgresConnectionUrl(process.env.DATABASE_URL?.trim())
const inspirationEntries = usePostgres
  ? pg.inspirationEntries
  : sqlite.inspirationEntries

async function getDefaultDb(): Promise<DbExecutor> {
  const mod = await import('@/lib/db')
  return mod.db
}

async function resolveDb(executor?: DbExecutor): Promise<DbExecutor> {
  return executor ?? getDefaultDb()
}

export async function upsertMemosInspirationEntry(
  entry: NormalizedMemosInspiration,
  executor?: DbExecutor,
) {
  const database = await resolveDb(executor)
  const whereExternalEntry = and(
    eq(inspirationEntries.externalSource, MEMOS_INSPIRATION_EXTERNAL_SOURCE),
    eq(inspirationEntries.externalId, entry.externalId),
  )
  const [existing] = await database
    .select({ id: inspirationEntries.id })
    .from(inspirationEntries)
    .where(whereExternalEntry)
    .limit(1)

  const values = {
    title: entry.title,
    content: entry.content,
    contentLexical: null,
    imageDataUrl: null,
    statusSnapshot: null,
    externalSource: MEMOS_INSPIRATION_EXTERNAL_SOURCE,
    externalId: entry.externalId,
    createdAt: dbDate(entry.createdAt),
    updatedAt: dbDate(entry.updatedAt),
  }

  if (existing?.id) {
    const [updated] = await database
      .update(inspirationEntries)
      .set(values)
      .where(eq(inspirationEntries.id, existing.id))
      .returning()
    return updated
  }

  const [inserted] = await database
    .insert(inspirationEntries)
    .values(values)
    .returning()
  return inserted
}

export async function deleteMemosInspirationEntry(
  externalId: string,
  executor?: DbExecutor,
): Promise<number> {
  const id = externalId.trim()
  if (!id) return 0

  const database = await resolveDb(executor)
  const deleted = await database
    .delete(inspirationEntries)
    .where(
      and(
        eq(inspirationEntries.externalSource, MEMOS_INSPIRATION_EXTERNAL_SOURCE),
        eq(inspirationEntries.externalId, id),
      ),
    )
    .returning({ id: inspirationEntries.id })

  return deleted.length
}

function dbDate(value: Date): Date | string {
  return usePostgres ? value : value.toISOString()
}
