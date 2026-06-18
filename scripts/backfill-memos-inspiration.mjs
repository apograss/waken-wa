#!/usr/bin/env node
import { createHmac, randomUUID } from 'node:crypto'

const DEFAULT_MEMOS_BASE_URL = 'https://memos.apograss.cn'
const DEFAULT_WAKEN_WEBHOOK_URL = 'https://test.apograss.cn/api/inspiration/memos-webhook'
const PAGE_SIZE = 100

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')

const memosBaseUrl = normalizeBaseUrl(process.env.MEMOS_BASE_URL || DEFAULT_MEMOS_BASE_URL)
const wakenWebhookUrl = process.env.WAKEN_MEMOS_WEBHOOK_URL || DEFAULT_WAKEN_WEBHOOK_URL
const signingSecret = String(process.env.MEMOS_WEBHOOK_SECRET || '').trim()

let fetched = 0
let synced = 0
let ignored = 0
let failed = 0

try {
  for await (const memo of listPublicMemos()) {
    fetched += 1
    if (!shouldSyncMemo(memo)) {
      ignored += 1
      continue
    }

    if (dryRun) {
      synced += 1
      console.log(`[dry-run] would sync ${memo.name}`)
      continue
    }

    const payload = {
      activityType: 'memos.memo.created',
      creator: memo.creator,
      memo,
    }

    try {
      await postWebhook(payload)
      synced += 1
      console.log(`[sync] ${memo.name}`)
    } catch (error) {
      failed += 1
      console.error(`[sync failed] ${memo.name}: ${error.message || error}`)
    }
  }

  console.log(
    `[backfill] fetched=${fetched} synced=${synced} ignored=${ignored} failed=${failed} dryRun=${dryRun}`,
  )

  if (failed > 0) process.exit(1)
} catch (error) {
  console.error(`[backfill] ${error.message || error}`)
  process.exit(1)
}

async function* listPublicMemos() {
  let pageToken = ''

  do {
    const url = new URL('/api/v1/memos', memosBaseUrl)
    url.searchParams.set('pageSize', String(PAGE_SIZE))
    url.searchParams.set('filter', 'visibility == "PUBLIC"')
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Memos API returned ${res.status} ${res.statusText}`)
    }

    const data = await res.json()
    const memos = Array.isArray(data?.memos) ? data.memos : []
    for (const memo of memos) {
      yield memo
    }

    pageToken = String(data?.nextPageToken ?? data?.next_page_token ?? '').trim()
  } while (pageToken)
}

function shouldSyncMemo(memo) {
  if (!memo || typeof memo !== 'object') return false
  if (String(memo.name || '').trim() === '') return false
  if (String(memo.visibility || '').toUpperCase() !== 'PUBLIC') return false
  if (String(memo.state || '').toUpperCase() !== 'NORMAL') return false
  return true
}

async function postWebhook(payload) {
  const body = JSON.stringify(payload)
  const headers = {
    'Content-Type': 'application/json',
  }

  if (signingSecret) {
    Object.assign(headers, signWebhookBody(body, signingSecret))
  }

  const res = await fetch(wakenWebhookUrl, {
    method: 'POST',
    headers,
    body,
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    // Keep raw text in the error below.
  }

  if (!res.ok || data?.code !== 0) {
    throw new Error(`Waken webhook returned ${res.status}: ${text.slice(0, 300)}`)
  }
}

function signWebhookBody(body, secret) {
  const key = resolveSigningKey(secret)
  const msgId = `msg_${randomUUID()}`
  const timestamp = String(Math.floor(Date.now() / 1000))
  const signature = createHmac('sha256', key)
    .update(`${msgId}.${timestamp}.`)
    .update(body)
    .digest('base64')

  return {
    'webhook-id': msgId,
    'webhook-timestamp': timestamp,
    'webhook-signature': `v1,${signature}`,
  }
}

function resolveSigningKey(secret) {
  if (!secret.startsWith('whsec_')) return secret
  return Buffer.from(secret.slice('whsec_'.length), 'base64')
}

function normalizeBaseUrl(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value
}
