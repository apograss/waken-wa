/**
 * InspirationStageView — 03 灵感 区块的纯展示组件
 * 立绘做舞台，最多 3 张漂浮便签贴在上面，下方是 N / Total 行 + 查看全部链接。
 */

import Link from 'next/link'

export interface InspirationPaperItem {
  /** 唯一 key（条目 id 或 demo 序号） */
  key: string
  /** 「N°01」中的 01；不传则按顺序 01/02/03 */
  num: string
  /** 「05·19 · 23:14」 */
  date: string
  title: string
  /** 摘要正文 */
  preview: string
  /** 心情 emoji */
  emoji?: string | null
  /** 心情或状态文字「在写论文」 */
  mood?: string | null
  /** 跳转链接 */
  href: string
}

export interface InspirationStageViewProps {
  items: InspirationPaperItem[]
  /** 「3 / 15 — 最近三篇」中的 total */
  total: number
  /** 是否展示「查看全部」链接 */
  showArchiveLink?: boolean
  /** 链接目标路径，默认 /inspiration */
  archiveHref?: string
}

export function InspirationStageView({
  items,
  total,
  showArchiveLink = true,
  archiveHref = '/inspiration',
}: InspirationStageViewProps) {
  // 最多展示前 3 张
  const visible = items.slice(0, 3)

  return (
    <>
      <div className="ins-stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/homepage/section-inspiration-companion.png"
          alt=""
          loading="lazy"
        />
        <div className="papers">
          {visible.map((item, i) => (
            <Link
              key={item.key}
              className={`paper paper-${i + 1}`}
              href={item.href}
            >
              <span className="paper-pin"></span>
              <div className="paper-head">
                <span className="paper-date">{item.date}</span>
                <span className="paper-num">N°{item.num}</span>
              </div>
              <h4 className="paper-title">{item.title}</h4>
              <p className="paper-preview">{item.preview}</p>
              {(item.emoji || item.mood) && (
                <div className="paper-foot">
                  <span className="paper-mood">
                    {item.emoji && <span className="paper-emoji">{item.emoji}</span>}
                    {item.mood}
                  </span>
                  <span className="paper-more">read →</span>
                </div>
              )}
              {!item.emoji && !item.mood && (
                <div className="paper-foot">
                  <span className="paper-mood"></span>
                  <span className="paper-more">read →</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      <div className="ins-more-row">
        <div className="ins-more-left">
          <span className="ins-more-bar"></span>
          <span>
            {visible.length} / {total} — 最近{visible.length >= 3 ? '三' : visible.length}篇
          </span>
        </div>
        {showArchiveLink && total > visible.length && (
          <Link className="ins-more-link" href={archiveHref}>
            查看全部 {total} 篇 →
          </Link>
        )}
      </div>
    </>
  )
}
