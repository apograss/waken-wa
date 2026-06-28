'use client'

import Link from 'next/link'

import { useIsEmbedded } from '@/lib/embed'
import type { HaloBlogPost } from '@/lib/halo-blog'
import { getDateParts } from '@/lib/timezone'

type InspirationEntry = {
  id: number
  title?: string | null
  content?: string | null
  createdAt?: string | null
  displayTimezone?: string
}

export interface MobileScreenInspirationProps {
  entries: InspirationEntry[]
  total: number
  blogPosts: HaloBlogPost[]
  blogHomeUrl: string
  earlierText: string
}

const pad = (n: number) => String(n).padStart(2, '0')

function entryDate(e: InspirationEntry): string {
  if (!e.createdAt) return ''
  const p = getDateParts(e.createdAt, e.displayTimezone || 'Asia/Shanghai')
  if (!p.month) return ''
  return `${pad(p.month)}/${pad(p.day)}`
}

function previewText(e: InspirationEntry): string {
  const raw = (e.content ?? '').replace(/\s+/g, ' ').trim()
  return raw
}

function postDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`
}

export function MobileScreenInspiration({
  entries,
  total,
  blogPosts,
  blogHomeUrl,
  earlierText,
}: MobileScreenInspirationProps) {
  const embedded = useIsEmbedded()
  return (
    <section className="m-screen m-ins" data-screen="inspiration">
      <div className="m-sec-head">
        <span className="m-sec-num">02</span>
        <h2 className="m-sec-title">灵感</h2>
        <span className="m-sec-rule" />
        <span className="m-mono m-sec-meta">NOTES · {total}</span>
      </div>
      <p className="m-ins-sub">{earlierText || '随手记下的、关于活着的小证据。'}</p>

      <div>
        {entries.length === 0 ? (
          <p className="m-now-empty">还没有灵感记录。</p>
        ) : (
          entries.map((e, i) => {
            const title = (e.title ?? '').trim()
            const preview = previewText(e)
            return (
              <Link key={e.id} href="/inspiration" className="m-note" target={embedded ? '_top' : undefined}>
                <div className="m-note-head">
                  <span className="m-note-num">{pad(i + 1)}</span>
                  <span className="m-mono m-note-date">{entryDate(e)}</span>
                </div>
                {title ? <h3 className="m-note-title">{title}</h3> : null}
                {preview ? <p className="m-note-preview">{preview}</p> : null}
              </Link>
            )
          })
        )}
      </div>

      {blogPosts.length > 0 ? (
        <div className="m-blog-sec">
          <div className="m-blog-head">
            <span className="m-mono m-blog-head-lab">长文 · FROM BLOG</span>
            <a className="m-blog-head-link" href={blogHomeUrl} target="_blank" rel="noopener noreferrer">去博客逛逛 →</a>
          </div>
          {blogPosts.map((p) => (
            <a key={p.url} href={p.url} className="m-blog-row" target="_blank" rel="noopener noreferrer">
              <span className="m-mono m-blog-row-date">{postDate(p.publishTime)}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="m-blog-row-title">{p.title}</span>
                {p.excerpt ? <span className="m-blog-row-excerpt">{p.excerpt}</span> : null}
              </span>
              {p.visits != null ? <span className="m-mono m-blog-row-visits">{p.visits}</span> : null}
            </a>
          ))}
        </div>
      ) : null}
    </section>
  )
}
