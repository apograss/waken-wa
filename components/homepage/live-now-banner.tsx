'use client'

/**
 * LiveNowBanner — 02 此刻区块顶部的立绘横幅
 * 真实数据模式：从 activeStatuses 提取 quote（process_title）和当前播放
 */

import { useSharedActivityFeed } from '@/components/activity-feed-provider'
import { getMediaDisplay } from '@/lib/activity-media'
import type { ActivityFeedItem } from '@/types/activity'

interface LiveNowBannerProps {
  hideMedia?: boolean
}

export function LiveNowBanner({ hideMedia }: LiveNowBannerProps) {
  const { feed } = useSharedActivityFeed()
  const statuses = feed?.activeStatuses ?? []
  const primary = statuses[0] ?? null

  // 没有任何数据上来时，依然渲染立绘 + LIVE 角标，不显示 quote 和 chip
  const hasAnyDevice = statuses.length > 0

  // quote 文本：取主设备的 processTitle 或 processName
  const quoteText = (() => {
    if (!primary) return null
    const t = primary.processTitle?.trim()
    const p = primary.processName?.trim()
    if (t && p) return splitForBanner(`${t} · ${p}`)
    if (t) return splitForBanner(t)
    if (p) return splitForBanner(p)
    return null
  })()

  // 时间戳
  const timeLabel = (() => {
    const iso = primary?.lastReportAt || primary?.updatedAt || primary?.startedAt
    if (!iso) return null
    try {
      const d = new Date(iso)
      const h = String(d.getHours()).padStart(2, '0')
      const m = String(d.getMinutes()).padStart(2, '0')
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return `${h}:${m} · ${weekdays[d.getDay()]}`
    } catch {
      return null
    }
  })()

  // 现在播放
  const media = !hideMedia ? findMedia(statuses) : null

  return (
    <figure className="now-banner" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/homepage/section-now-companion.png"
        alt=""
        loading="lazy"
        className="now-banner-img"
      />
      <span className="now-banner-live">
        <span className="now-banner-pulse"></span>
        {hasAnyDevice ? 'live · 在线' : 'idle · 暂无活动'}
      </span>

      {quoteText && (
        <div className="now-banner-quote">
          <span className="now-banner-quote-eyebrow">现在</span>
          <p className="now-banner-quote-text">
            {quoteText.line1}
            {quoteText.line2 && (
              <>
                <br />
                {quoteText.line2}
              </>
            )}
          </p>
          {timeLabel && <span className="now-banner-quote-time">{timeLabel}</span>}
        </div>
      )}

      {media && (
        <div className="now-banner-chip">
          <div className="now-banner-cover">
            {media.coverUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={media.coverUrl}
                alt=""
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
              />
            ) : (
              '♪'
            )}
          </div>
          <div className="now-banner-info">
            <div className="now-banner-title">{media.title}</div>
            {media.artist && (
              <div className="now-banner-artist">{media.artist}</div>
            )}
          </div>
          {media.positionLabel && (
            <div className="now-banner-time">{media.positionLabel}</div>
          )}
        </div>
      )}
    </figure>
  )
}

interface MediaSummary {
  title: string
  artist: string | null
  coverUrl: string | null
  positionLabel: string | null
}

function findMedia(statuses: ActivityFeedItem[]): MediaSummary | null {
  for (const s of statuses) {
    const media = getMediaDisplay(s.metadata)
    if (media && media.title) {
      const positionLabel =
        media.positionMs !== null && media.durationMs !== null
          ? `${formatPlaybackTime(media.positionMs)} / ${formatPlaybackTime(media.durationMs)}`
          : null
      return {
        title: media.title,
        artist: media.singer,
        coverUrl: media.coverUrl,
        positionLabel,
      }
    }
  }
  return null
}

function splitForBanner(text: string): { line1: string; line2: string | null } | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  if (trimmed.length <= 14) return { line1: trimmed, line2: null }
  // 优先按已有标点拆
  const punct = trimmed.search(/[ ·—:：]/)
  if (punct > 4 && punct < trimmed.length - 4) {
    return {
      line1: trimmed.slice(0, punct).trim(),
      line2: trimmed.slice(punct + 1).trim(),
    }
  }
  // 按一半拆
  const mid = Math.ceil(trimmed.length / 2)
  return { line1: trimmed.slice(0, mid).trim(), line2: trimmed.slice(mid).trim() }
}

function formatPlaybackTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '--:--'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
