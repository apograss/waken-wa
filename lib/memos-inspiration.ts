import { createHmac, timingSafeEqual } from 'node:crypto'

export const MEMOS_INSPIRATION_EXTERNAL_SOURCE = 'memos'

const IMAGE_PLACEHOLDER = '[图片]'
const WEBHOOK_TOLERANCE_MS = 5 * 60 * 1000

type MemosMemoProperty = {
  hasLink?: boolean
  hasTaskList?: boolean
  hasCode?: boolean
  hasIncompleteTasks?: boolean
  title?: string | null
  has_link?: boolean
  has_task_list?: boolean
  has_code?: boolean
  has_incomplete_tasks?: boolean
}

type MemosAttachment = {
  name?: string | null
  type?: string | null
  filename?: string | null
  filenamePrefix?: string | null
  externalLink?: string | null
  mimeType?: string | null
  mime_type?: string | null
}

export type MemosMemo = {
  name?: string | null
  state?: string | null
  creator?: string | null
  createTime?: string | null
  create_time?: string | null
  updateTime?: string | null
  update_time?: string | null
  content?: string | null
  visibility?: string | null
  tags?: string[]
  pinned?: boolean
  attachments?: MemosAttachment[]
  property?: MemosMemoProperty | null
  snippet?: string | null
}

export type NormalizedMemosInspiration = {
  externalId: string
  title: string | null
  content: string
  createdAt: Date
  updatedAt: Date
}

export type MemosWebhookPayload = {
  activityType?: string | null
  creator?: string | null
  memo?: MemosMemo | null
}

export type MemosWebhookAction =
  | { type: 'upsert'; entry: NormalizedMemosInspiration }
  | { type: 'delete'; externalId: string }
  | { type: 'ignore'; reason: string }

export function normalizeMemosMemoForInspiration(memo: MemosMemo | null | undefined): NormalizedMemosInspiration | null {
  if (!memo) return null
  const externalId = text(memo.name)
  const content = text(memo.content)
  if (!externalId || !content) return null
  if (text(memo.state).toUpperCase() !== 'NORMAL') return null
  if (text(memo.visibility).toUpperCase() !== 'PUBLIC') return null

  const createdAt = parseMemoDate(memo.createTime ?? memo.create_time) ?? new Date()
  const updatedAt = parseMemoDate(memo.updateTime ?? memo.update_time) ?? createdAt
  const normalizedContent = normalizeMemosContent(content, memo)

  return {
    externalId,
    title: resolveMemosTitle(memo, normalizedContent),
    content: normalizedContent,
    createdAt,
    updatedAt,
  }
}

export function handleMemosWebhookPayload(payload: MemosWebhookPayload | null | undefined): MemosWebhookAction {
  const activityType = text(payload?.activityType)
  const memo = payload?.memo ?? null

  if (activityType === 'memos.memo.comment.created') {
    return { type: 'ignore', reason: 'unsupported event' }
  }

  if (!memo) {
    return { type: 'ignore', reason: 'missing memo' }
  }

  const externalId = text(memo.name)
  if (!externalId) {
    return { type: 'ignore', reason: 'missing memo name' }
  }

  if (activityType === 'memos.memo.deleted') {
    return { type: 'delete', externalId }
  }

  if (activityType !== 'memos.memo.created' && activityType !== 'memos.memo.updated') {
    return { type: 'ignore', reason: 'unsupported event' }
  }

  const normalized = normalizeMemosMemoForInspiration(memo)
  if (normalized) {
    return { type: 'upsert', entry: normalized }
  }

  if (activityType === 'memos.memo.updated') {
    return { type: 'delete', externalId }
  }

  return { type: 'ignore', reason: 'memo is not public normal' }
}

export function verifyMemosWebhookSignature(options: {
  body: string
  headers: Headers | Record<string, string | string[] | undefined>
  secret?: string | null
  nowMs?: number
}): boolean {
  const secret = text(options.secret)
  if (!secret) return true

  const msgId = getHeader(options.headers, 'webhook-id')
  const timestamp = getHeader(options.headers, 'webhook-timestamp')
  const signatureHeader = getHeader(options.headers, 'webhook-signature')
  if (!msgId || !timestamp || !signatureHeader) return false

  const timestampSeconds = Number(timestamp)
  if (!Number.isFinite(timestampSeconds)) return false
  const nowMs = options.nowMs ?? Date.now()
  if (Math.abs(nowMs - timestampSeconds * 1000) > WEBHOOK_TOLERANCE_MS) return false

  const key = resolveSigningKey(secret)
  if (!key) return false

  const expected = createHmac('sha256', key)
    .update(`${msgId}.${timestamp}.`)
    .update(options.body)
    .digest()

  return readWebhookSignatures(signatureHeader).some((candidate) => timingSafeBase64Equal(candidate, expected))
}

export function memoHasImageLikeAttachment(memo: MemosMemo): boolean {
  return (memo.attachments ?? []).some((attachment) => {
    const source = [
      attachment.type,
      attachment.mimeType,
      attachment.mime_type,
      attachment.filename,
      attachment.filenamePrefix,
      attachment.externalLink,
      attachment.name,
    ]
      .map((item) => text(item).toLowerCase())
      .filter(Boolean)
      .join(' ')

    return /\bimage\//.test(source) || /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/.test(source)
  })
}

export function stripMemosMarkdownImages(content: string): string {
  return content
    .replace(/!\[[^\]]*]\(([^)]+)\)/g, IMAGE_PLACEHOLDER)
    .replace(/<img\b[^>]*>/gi, IMAGE_PLACEHOLDER)
}

function normalizeMemosContent(content: string, memo: MemosMemo): string {
  let result = stripMemosMarkdownImages(content).trim()
  if (memoHasImageLikeAttachment(memo) && !result.includes(IMAGE_PLACEHOLDER)) {
    result = result ? `${result}\n\n${IMAGE_PLACEHOLDER}` : IMAGE_PLACEHOLDER
  }
  return result
}

function resolveMemosTitle(memo: MemosMemo, normalizedContent: string): string | null {
  const propertyTitle = text(memo.property?.title)
  if (propertyTitle) return clampTitle(propertyTitle)

  const firstLine = normalizedContent
    .split(/\r?\n/)
    .map((line) => cleanTitleLine(line))
    .find(Boolean)

  return firstLine ? clampTitle(firstLine) : null
}

function cleanTitleLine(line: string): string {
  return line
    .replace(/^#{1,6}\s+/, '')
    .replace(/^\s*[-*+]\s+/, '')
    .replace(/^\s*\d+\.\s+/, '')
    .replace(/[*_~`]/g, '')
    .trim()
}

function clampTitle(value: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= 80) return normalized
  return `${normalized.slice(0, 77).trim()}...`
}

function parseMemoDate(value: unknown): Date | null {
  const raw = text(value)
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

function getHeader(headers: Headers | Record<string, string | string[] | undefined>, key: string): string {
  if (headers instanceof Headers) {
    return text(headers.get(key))
  }

  const direct = headers[key] ?? headers[key.toLowerCase()] ?? headers[headerCase(key)]
  return Array.isArray(direct) ? text(direct[0]) : text(direct)
}

function headerCase(key: string): string {
  return key
    .split('-')
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join('-')
}

function readWebhookSignatures(value: string): string[] {
  return value
    .split(/\s+/)
    .flatMap((part) => {
      const [version, signature] = part.split(',', 2)
      return version === 'v1' && signature ? [signature] : []
    })
}

function resolveSigningKey(secret: string): Buffer | string | null {
  if (!secret.startsWith('whsec_')) return secret
  try {
    return Buffer.from(secret.slice('whsec_'.length), 'base64')
  } catch {
    return null
  }
}

function timingSafeBase64Equal(candidate: string, expected: Buffer): boolean {
  let actual: Buffer
  try {
    actual = Buffer.from(candidate, 'base64')
  } catch {
    return false
  }
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
