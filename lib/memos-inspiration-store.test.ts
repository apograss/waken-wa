import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  deleteMemosInspirationEntry,
  upsertMemosInspirationEntry,
} from './memos-inspiration-store'

function createTestDb() {
  const sqlite = new Database(':memory:')
  sqlite.exec(`
    create table inspiration_entries (
      id integer primary key autoincrement,
      title text,
      content text not null,
      content_lexical text,
      image_data_url text,
      status_snapshot text,
      external_source text,
      external_id text,
      created_at text not null default (datetime('now')),
      updated_at text not null default (datetime('now'))
    );
    create unique index inspiration_entries_external_source_id_idx
      on inspiration_entries (external_source, external_id);
  `)
  return {
    sqlite,
    db: drizzle(sqlite),
  }
}

describe('memos inspiration store', () => {
  let testDb: ReturnType<typeof createTestDb>

  beforeEach(() => {
    testDb = createTestDb()
  })

  it('upserts the same Memos memo without creating duplicates', async () => {
    const inserted = await upsertMemosInspirationEntry(
      {
        externalId: 'memos/one',
        title: 'First',
        content: 'First content',
        createdAt: new Date('2026-06-18T07:13:45Z'),
        updatedAt: new Date('2026-06-18T07:13:45Z'),
      },
      testDb.db,
    )
    const updated = await upsertMemosInspirationEntry(
      {
        externalId: 'memos/one',
        title: 'Second',
        content: 'Second content',
        createdAt: new Date('2026-06-18T07:13:45Z'),
        updatedAt: new Date('2026-06-18T08:00:00Z'),
      },
      testDb.db,
    )

    const rows = testDb.sqlite
      .prepare('select id, title, content, external_source, external_id from inspiration_entries')
      .all() as Array<Record<string, unknown>>

    expect(updated.id).toBe(inserted.id)
    expect(rows).toEqual([
      {
        id: inserted.id,
        title: 'Second',
        content: 'Second content',
        external_source: 'memos',
        external_id: 'memos/one',
      },
    ])
  })

  it('deletes only the matching Memos-backed inspiration entry', async () => {
    await upsertMemosInspirationEntry(
      {
        externalId: 'memos/delete-me',
        title: 'Delete me',
        content: 'Delete me',
        createdAt: new Date('2026-06-18T07:13:45Z'),
        updatedAt: new Date('2026-06-18T07:13:45Z'),
      },
      testDb.db,
    )
    await upsertMemosInspirationEntry(
      {
        externalId: 'memos/keep-me',
        title: 'Keep me',
        content: 'Keep me',
        createdAt: new Date('2026-06-18T07:13:45Z'),
        updatedAt: new Date('2026-06-18T07:13:45Z'),
      },
      testDb.db,
    )

    const deleted = await deleteMemosInspirationEntry('memos/delete-me', testDb.db)
    const rows = testDb.sqlite
      .prepare('select title, external_id from inspiration_entries order by id')
      .all()

    expect(deleted).toBe(1)
    expect(rows).toEqual([{ title: 'Keep me', external_id: 'memos/keep-me' }])
  })
})
