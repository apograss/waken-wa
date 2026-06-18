import { createHmac } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import {
  handleMemosWebhookPayload,
  type MemosMemo,
  normalizeMemosMemoForInspiration,
  verifyMemosWebhookSignature,
} from './memos-inspiration'

const baseMemo: MemosMemo = {
  name: 'memos/SxKSW8HgTNU9HttNDsBAxR',
  state: 'NORMAL',
  creator: 'users/apograss',
  createTime: '2026-06-18T07:13:45Z',
  updateTime: '2026-06-18T07:14:45Z',
  content: '# Tiny thought\n\nBody line',
  visibility: 'PUBLIC',
  tags: [],
  pinned: false,
  attachments: [],
  property: {
    hasLink: false,
    hasTaskList: false,
    hasCode: false,
    hasIncompleteTasks: false,
    title: 'Tiny thought',
  },
  snippet: 'Tiny thought Body line',
}

describe('normalizeMemosMemoForInspiration', () => {
  it('maps a public normal memo into an inspiration entry payload', () => {
    const normalized = normalizeMemosMemoForInspiration(baseMemo)

    expect(normalized).toEqual({
      externalId: 'memos/SxKSW8HgTNU9HttNDsBAxR',
      title: 'Tiny thought',
      content: '# Tiny thought\n\nBody line',
      createdAt: new Date('2026-06-18T07:13:45Z'),
      updatedAt: new Date('2026-06-18T07:14:45Z'),
    })
  })

  it('uses a short first line as title when Memos has no extracted heading', () => {
    const normalized = normalizeMemosMemoForInspiration({
      ...baseMemo,
      content: 'A note without heading\n\nSecond line',
      property: { ...baseMemo.property, title: '' },
      snippet: 'A note without heading Second line',
    })

    expect(normalized?.title).toBe('A note without heading')
  })

  it('replaces markdown/html images and attachments with a text placeholder', () => {
    const normalized = normalizeMemosMemoForInspiration({
      ...baseMemo,
      content: 'before\n\n![alt](https://example.com/a.png)\n<img src="https://example.com/b.png" />\nafter',
      attachments: [{ name: 'attachments/1', type: 'image/png' }],
      property: { ...baseMemo.property, title: '' },
    })

    expect(normalized?.content).toBe('before\n\n[图片]\n[图片]\nafter')
    expect(normalized?.title).toBe('before')
  })

  it('ignores non-public or non-normal memos', () => {
    expect(normalizeMemosMemoForInspiration({ ...baseMemo, visibility: 'PRIVATE' })).toBeNull()
    expect(normalizeMemosMemoForInspiration({ ...baseMemo, visibility: 'PROTECTED' })).toBeNull()
    expect(normalizeMemosMemoForInspiration({ ...baseMemo, state: 'ARCHIVED' })).toBeNull()
  })
})

describe('handleMemosWebhookPayload', () => {
  it('turns created and updated public memo events into upsert actions', () => {
    expect(handleMemosWebhookPayload({ activityType: 'memos.memo.created', memo: baseMemo })).toEqual({
      type: 'upsert',
      entry: normalizeMemosMemoForInspiration(baseMemo),
    })
    expect(handleMemosWebhookPayload({ activityType: 'memos.memo.updated', memo: baseMemo })).toEqual({
      type: 'upsert',
      entry: normalizeMemosMemoForInspiration(baseMemo),
    })
  })

  it('turns deleted memo events and private updates into delete actions', () => {
    expect(handleMemosWebhookPayload({ activityType: 'memos.memo.deleted', memo: baseMemo })).toEqual({
      type: 'delete',
      externalId: baseMemo.name,
    })
    expect(
      handleMemosWebhookPayload({
        activityType: 'memos.memo.updated',
        memo: { ...baseMemo, visibility: 'PRIVATE' },
      }),
    ).toEqual({
      type: 'delete',
      externalId: baseMemo.name,
    })
  })

  it('ignores memo comment events and invalid payloads', () => {
    expect(handleMemosWebhookPayload({ activityType: 'memos.memo.comment.created', memo: baseMemo })).toEqual({
      type: 'ignore',
      reason: 'unsupported event',
    })
    expect(handleMemosWebhookPayload({ activityType: 'memos.memo.created' })).toEqual({
      type: 'ignore',
      reason: 'missing memo',
    })
  })
})

describe('verifyMemosWebhookSignature', () => {
  it('allows unsigned webhooks when no secret is configured', () => {
    expect(
      verifyMemosWebhookSignature({
        body: '{}',
        headers: new Headers(),
        secret: '',
      }),
    ).toBe(true)
  })

  it('verifies Memos webhook signatures', () => {
    const body = JSON.stringify({ activityType: 'memos.memo.created', memo: baseMemo })
    const secret = 'plain-secret'
    const msgId = 'msg_test'
    const timestamp = '1781768000'
    const signature = createHmac('sha256', secret)
      .update(`${msgId}.${timestamp}.`)
      .update(body)
      .digest('base64')
    const headers = new Headers({
      'webhook-id': msgId,
      'webhook-timestamp': timestamp,
      'webhook-signature': `v1,${signature}`,
    })

    expect(
      verifyMemosWebhookSignature({
        body,
        headers,
        secret,
        nowMs: Number(timestamp) * 1000,
      }),
    ).toBe(true)
    expect(
      verifyMemosWebhookSignature({
        body,
        headers,
        secret: 'wrong-secret',
        nowMs: Number(timestamp) * 1000,
      }),
    ).toBe(false)
  })

  it('supports whsec-prefixed base64 secrets', () => {
    const body = '{"ok":true}'
    const rawSecret = 'raw-secret'
    const secret = `whsec_${Buffer.from(rawSecret).toString('base64')}`
    const msgId = 'msg_whsec'
    const timestamp = '1781768000'
    const signature = createHmac('sha256', rawSecret)
      .update(`${msgId}.${timestamp}.`)
      .update(body)
      .digest('base64')

    expect(
      verifyMemosWebhookSignature({
        body,
        headers: new Headers({
          'webhook-id': msgId,
          'webhook-timestamp': timestamp,
          'webhook-signature': `v1,${signature}`,
        }),
        secret,
        nowMs: Number(timestamp) * 1000,
      }),
    ).toBe(true)
  })
})
