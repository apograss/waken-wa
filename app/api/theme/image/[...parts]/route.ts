import { NextRequest, NextResponse } from 'next/server'

import { requireAdminSession } from '@/lib/admin-api-auth'
import { isSiteLockSatisfied } from '@/lib/auth'
import { decodeInlineImageDataUrl, inlineImageBody } from '@/lib/inline-image-data'
import { getSiteConfigMemoryFirst } from '@/lib/site-config-cache'
import {
  readThemeImageSourceByKind,
  type ThemeImageKind,
} from '@/lib/site-image-urls'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALLOWED_KINDS = new Set<ThemeImageKind>(['background', 'pool', 'palette-seed'])

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ parts?: string[] }> },
) {
  try {
    const unlocked = await isSiteLockSatisfied()
    const session = unlocked ? null : await requireAdminSession()
    if (!unlocked && !session) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { parts } = await context.params
    const kind = String(parts?.[0] ?? '') as ThemeImageKind
    const indexPart = parts?.[1]
    if (!ALLOWED_KINDS.has(kind)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const index =
      kind === 'pool' && indexPart !== undefined ? Number.parseInt(indexPart, 10) : undefined

    const config = await getSiteConfigMemoryFirst()
    const source = readThemeImageSourceByKind(config?.themeCustomSurface, kind, index)
    if (!source || !/^data:image\//i.test(source)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const decoded = decodeInlineImageDataUrl(source)
    if (!decoded) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return new NextResponse(inlineImageBody(decoded.buffer), {
      status: 200,
      headers: {
        'Content-Type': decoded.contentType,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('theme image GET failed:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
