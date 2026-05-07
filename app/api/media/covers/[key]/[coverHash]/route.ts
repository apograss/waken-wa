import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const COVER_HASH_RE = /^[0-9a-f]{16}$/i

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ key: string; coverHash: string }> },
) {
  try {
    const { coverHash: rawCoverHash } = await context.params
    const coverHash = decodeURIComponent(rawCoverHash || '').trim().toLowerCase()

    if (!COVER_HASH_RE.test(coverHash)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.redirect(new URL(`/api/media/covers/${coverHash}`, _request.url), 308)
  } catch (error) {
    console.error('media cover GET failed:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
