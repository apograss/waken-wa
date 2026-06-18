import { NextRequest, NextResponse } from 'next/server'

import {
  handleMemosWebhookPayload,
  verifyMemosWebhookSignature,
  type MemosWebhookPayload,
} from '@/lib/memos-inspiration'
import {
  deleteMemosInspirationEntry,
  upsertMemosInspirationEntry,
} from '@/lib/memos-inspiration-store'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function memosWebhookResponse(message = 'ok', init?: ResponseInit) {
  return NextResponse.json({ code: 0, message }, init)
}

function memosWebhookError(code: number, message: string, init: ResponseInit) {
  return NextResponse.json({ code, message }, init)
}

function isPayloadRecord(value: unknown): value is MemosWebhookPayload {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export async function POST(request: NextRequest) {
  const body = await request.text()

  if (
    !verifyMemosWebhookSignature({
      body,
      headers: request.headers,
      secret: process.env.MEMOS_WEBHOOK_SECRET,
    })
  ) {
    return memosWebhookError(401, 'invalid webhook signature', { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    return memosWebhookError(400, 'invalid JSON payload', { status: 400 })
  }

  if (!isPayloadRecord(payload) || typeof payload.activityType !== 'string') {
    return memosWebhookError(400, 'invalid webhook payload', { status: 400 })
  }

  const action = handleMemosWebhookPayload(payload)
  if (action.type === 'upsert') {
    await upsertMemosInspirationEntry(action.entry)
    return memosWebhookResponse('synced')
  }

  if (action.type === 'delete') {
    await deleteMemosInspirationEntry(action.externalId)
    return memosWebhookResponse('deleted')
  }

  if (action.reason === 'missing memo' || action.reason === 'missing memo name') {
    return memosWebhookError(400, action.reason, { status: 400 })
  }

  return memosWebhookResponse(action.reason)
}
