import { NextRequest, NextResponse } from 'next/server'

import { requireAdminSession, unauthorizedJson } from '@/lib/admin-api-auth'
import { isInlineImageDataUrl, upsertImageSourceFromDataUrl } from '@/lib/image-source-store'
import { readJsonObject } from '@/lib/request-json'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function normalizeUsageKey(value: unknown): string {
  const normalized = String(value ?? '').trim()
  return /^[a-z0-9][a-z0-9._:-]{0,159}$/i.test(normalized) ? normalized : ''
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession()
  if (!session) {
    return unauthorizedJson()
  }

  try {
    const body = await readJsonObject(request)
    const imageDataUrl = body.imageDataUrl
    const usageKey = normalizeUsageKey(body.usageKey)
    if (!isInlineImageDataUrl(imageDataUrl)) {
      return NextResponse.json({ success: false, error: 'Invalid image data URL' }, { status: 400 })
    }
    if (!usageKey) {
      return NextResponse.json({ success: false, error: 'Invalid image usage key' }, { status: 400 })
    }

    const url = await upsertImageSourceFromDataUrl(imageDataUrl, { usageKey })
    return NextResponse.json({ success: true, data: { url } })
  } catch (error) {
    console.error('image source upload failed:', error)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}

