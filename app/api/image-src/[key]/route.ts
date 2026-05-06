import { NextRequest, NextResponse } from 'next/server'

import { requireAdminSession } from '@/lib/admin-api-auth'
import { isSiteLockSatisfied } from '@/lib/auth'
import { readImageSourceDataUrl } from '@/lib/image-source-store'
import { decodeInlineImageDataUrl, inlineImageBody } from '@/lib/inline-image-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ key: string }> },
) {
  const unlocked = await isSiteLockSatisfied()
  const session = unlocked ? null : await requireAdminSession()
  if (!unlocked && !session) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { key } = await context.params
  const dataUrl = await readImageSourceDataUrl(key)
  const decoded = dataUrl ? decodeInlineImageDataUrl(dataUrl) : null
  if (!decoded) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return new NextResponse(inlineImageBody(decoded.buffer), {
    status: 200,
    headers: {
      'Content-Type': decoded.contentType,
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
