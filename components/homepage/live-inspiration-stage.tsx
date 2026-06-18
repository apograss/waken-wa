/**
 * LiveInspirationStage — 把数据库 inspiration 条目映射到 InspirationStageView。
 *
 * 服务器组件，运行在 page.tsx 的 server-side 渲染流程中，无需 'use client'。
 */

import {
  extractInspirationLeadImage,
  inspirationPlainPreview,
  inspirationPlainPreviewAny,
} from '@/lib/inspiration-preview'
import { DEFAULT_TIMEZONE, getDateParts, normalizeTimezone } from '@/lib/timezone'
import type { InspirationHomeItem } from '@/types/components'

import {
  type InspirationPaperItem,
  InspirationStageView,
} from './inspiration-stage-view'

interface LiveInspirationStageProps {
  entries: InspirationHomeItem[]
  total: number
}

export function LiveInspirationStage({ entries, total }: LiveInspirationStageProps) {
  const items: InspirationPaperItem[] = entries.slice(0, 3).map((entry, idx) => {
    const inlineLead = !(entry.imageUrl ?? entry.imageDataUrl)
      ? extractInspirationLeadImage(entry.content)
      : null
    const previewText = inlineLead?.imageSrc
      ? inspirationPlainPreview(inlineLead.contentWithoutImage, 86).text
      : inspirationPlainPreviewAny(entry.content, entry.contentLexical, 86).text

    const status = String(entry.statusSnapshot ?? '').trim()
    const moodMatch = status.match(/^(\p{Extended_Pictographic})\s*(.*)$/u)
    const emoji = moodMatch ? moodMatch[1] : null
    const mood = moodMatch ? moodMatch[2].trim() : status || null

    return {
      key: `entry-${entry.id}`,
      num: String(idx + 1).padStart(2, '0'),
      date: formatPaperDate(entry.createdAt, entry.displayTimezone),
      title: entry.title?.trim() || '(未命名)',
      preview: previewText || '点击查看完整内容 →',
      emoji,
      mood,
      href: `/inspiration/${entry.id}`,
    }
  })

  return <InspirationStageView items={items} total={total} />
}

export function formatPaperDate(iso: string, timezone?: string | null): string {
  const tz = normalizeTimezone(timezone ?? DEFAULT_TIMEZONE)
  const parts = getDateParts(iso, tz)
  if (!parts.year) return iso
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(parts.month)}·${pad(parts.day)} · ${pad(parts.hour)}:${pad(parts.minute)}`
}
