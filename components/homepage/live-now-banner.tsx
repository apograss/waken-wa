'use client'

/**
 * LiveNowBanner — 02 此刻区块顶部的立绘横幅
 * 真实数据模式：从 activeStatuses 提取 quote（process_title）和当前播放
 */

import { useSharedActivityFeed } from '@/components/activity-feed-provider'
import { cleanActivityTitle, prettifyAppName } from '@/lib/activity-display'
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

  // quote 文本：当前活动标题（清洗装饰符）；标题缺失或就是应用名本身时，
  // 改写成「正在用 ××」让横幅读起来更像一句话而不是裸进程名。
  const quoteText = (() => {
    if (!primary) return null
    const title = cleanActivityTitle(primary.processTitle)
    const app = prettifyAppName(primary.processName)
    if (title && title.toLowerCase() !== app.toLowerCase()) return title
    if (app) return `正在用 ${app}`
    return title || null
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
    <div className="now-banner">
      <span className="now-banner-live">
        <span className="now-banner-pulse"></span>
        {hasAnyDevice ? 'live · 在线' : 'idle · 暂无活动'}
      </span>

      {quoteText && (
        <div className="now-banner-quote">
          <span className="now-banner-quote-eyebrow">现在</span>
          <p className="now-banner-quote-text">{quoteText}</p>
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
    </div>
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
