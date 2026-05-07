import { NextRequest, NextResponse } from 'next/server'

import { getCoverPayloadByHash } from '@/lib/media-cover-storage'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const COVER_HASH_RE = /^[0-9a-f]{16}$/i

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ key: string }> },
) {
  try {
    const { key: rawCoverHash } = await context.params
    const coverHash = decodeURIComponent(rawCoverHash || '').trim().toLowerCase()

    if (!COVER_HASH_RE.test(coverHash)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const payload = await getCoverPayloadByHash(coverHash)
    if (!payload) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return new NextResponse(new Uint8Array(payload.buffer), {
      status: 200,
      headers: {
        'Content-Type': payload.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('media cover GET failed:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
