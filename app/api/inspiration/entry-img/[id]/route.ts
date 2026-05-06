import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { isSiteLockSatisfied } from '@/lib/auth'
import { db } from '@/lib/db'
import { inspirationEntries } from '@/lib/drizzle-schema'
import { parseDataImagePayload } from '@/lib/inspiration-inline-images'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isSiteLockSatisfied())) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { id: rawId } = await context.params
    const id = Number.parseInt(String(rawId ?? '').trim(), 10)
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const [row] = await db
      .select({ imageDataUrl: inspirationEntries.imageDataUrl })
      .from(inspirationEntries)
      .where(eq(inspirationEntries.id, id))
      .limit(1)

    if (!row?.imageDataUrl) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const parsed = parseDataImagePayload(row.imageDataUrl)
    if (!parsed) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return new NextResponse(new Uint8Array(parsed.buffer), {
      status: 200,
      headers: {
        'Content-Type': parsed.mime,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('inspiration entry image GET failed:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
