/**
 * BlogStrip — 灵感区块底部的「来自博客」条目列表。
 * 服务器组件：数据由 page.tsx 从 Halo 公开 API 拉取后传入；空数组时不渲染。
 */

import type { HaloBlogPost } from '@/lib/halo-blog'

interface BlogStripProps {
  posts: HaloBlogPost[]
  blogHomeUrl: string
}

export function BlogStrip({ posts, blogHomeUrl }: BlogStripProps) {
  if (posts.length === 0) return null

  return (
    <div className="blog-strip">
      <div className="blog-strip-head">
        <span className="blog-strip-eyebrow">长文 · from blog</span>
        <a
          className="blog-strip-home"
          href={blogHomeUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          去博客逛逛 →
        </a>
      </div>
      <div className="blog-strip-list">
        {posts.map((post) => (
          <a
            key={post.url}
            className="blog-strip-item"
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="blog-strip-date">{formatBlogDate(post.publishTime)}</span>
            <span className="blog-strip-body">
              <span className="blog-strip-title">{post.title}</span>
              {post.excerpt && <span className="blog-strip-excerpt">{post.excerpt}</span>}
            </span>
            <span className="blog-strip-meta">
              {post.visits !== null && <span className="blog-strip-visits">{post.visits} 阅读</span>}
              <span className="blog-strip-arrow">↗</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

function formatBlogDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    const y = d.getFullYear()
    const M = String(d.getMonth() + 1).padStart(2, '0')
    const D = String(d.getDate()).padStart(2, '0')
    return `${y}·${M}·${D}`
  } catch {
    return '—'
  }
}
