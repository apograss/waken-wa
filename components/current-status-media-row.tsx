'use client'

import { ExternalLink, Gamepad2, Music } from 'lucide-react'
import Image from 'next/image'
import { useT } from 'next-i18next/client'
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useIsMobile } from '@/hooks/use-mobile'
import type { MediaDisplay } from '@/lib/activity-media'
import { cn } from '@/lib/utils'
import type { SteamNowPlayingInfo } from '@/types'

import {
  formatPlaybackTime,
  getMediaSourceLabel,
  getPlaybackPercent,
  getPlaybackPosition,
  hasPlaybackDetails,
  mediaPrimaryLine,
} from './current-status-utils'

/** When text is wider than its slot (~half row when paired), run horizontal marquee instead of clipping. */
function MarqueeIfNeeded({
  text,
  textClassName,
  outerClassName,
  /** When false (Steam cluster): width follows text up to max-w-full so the block can sit flush right with `justify-end`. */
  grow = true,
}: {
  text: string
  textClassName?: string
  outerClassName?: string
  grow?: boolean
}) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLSpanElement>(null)
  const [overflowPx, setOverflowPx] = useState(0)

  const measure = useCallback(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return
    const ow = outer.getBoundingClientRect().width
    const sw = inner.scrollWidth
    setOverflowPx(Math.max(0, Math.ceil(sw - ow)))
  }, [])

  useLayoutEffect(() => {
    measure()
    const id = requestAnimationFrame(() => measure())
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) {
      return () => cancelAnimationFrame(id)
    }
    const ro = new ResizeObserver(() => measure())
    ro.observe(outer)
    ro.observe(inner)
    return () => {
      cancelAnimationFrame(id)
      ro.disconnect()
    }
  }, [text, measure])

  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts?.ready) return
    void document.fonts.ready.then(() => measure())
  }, [text, measure, grow])

  const durationSec = overflowPx > 0 ? Math.min(14, Math.max(5, overflowPx / 38)) : 0

  return (
    <div
      ref={outerRef}
      className={cn(
        'min-w-0 max-w-full overflow-hidden',
        grow
          ? // Left-align with sibling icons; UA <button> defaults to text-center and would center short titles.
            'flex w-0 flex-1 basis-0 justify-start text-left'
          : 'w-max max-w-full shrink text-right',
        outerClassName,
      )}
    >
      <span
        ref={innerRef}
        className={cn(
          'inline-block max-w-none whitespace-nowrap text-sm font-medium text-foreground/90',
          overflowPx > 0 && 'status-marquee-animate',
          textClassName,
        )}
        style={
          overflowPx > 0
            ? ({
                ['--status-marquee-shift' as string]: `-${overflowPx}px`,
                animation: `status-marquee ${durationSec}s ease-in-out infinite`,
              } as CSSProperties)
            : undefined
        }
      >
        {text}
      </span>
    </div>
  )
}

export function MediaAndSteamRow({
  media,
  steam,
  showMediaSource,
  showMediaCover,
  showMediaNcmLink,
}: {
  media: MediaDisplay | null
  steam: SteamNowPlayingInfo | null
  showMediaSource: boolean
  showMediaCover: boolean
  showMediaNcmLink: boolean
}) {
  const { t } = useT('common')
  const isMobile = useIsMobile()
  const [steamImgFailed, setSteamImgFailed] = useState(false)
  const [mediaCoverImgFailed, setMediaCoverImgFailed] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    if (media?.state !== 'playing' || (media.startedAtMs === null && media.reportedAtMs === null)) {
      return
    }
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [media?.reportedAtMs, media?.startedAtMs, media?.state])

  if (!media && !steam) return null

  const playbackPositionMs = media ? getPlaybackPosition(media, nowMs) : null
  const playbackPercent = media ? getPlaybackPercent(playbackPositionMs, media.durationMs) : null
  const pair = Boolean(media && steam)
  const hasMediaDetails = Boolean(
    media &&
      ((showMediaSource && media.source) ||
        (showMediaCover && media.coverUrl) ||
        hasPlaybackDetails(media)),
  )

  const MediaContent = () => (
    <>
      {showMediaCover && media?.coverUrl && !mediaCoverImgFailed ? (
        <Image
          src={media.coverUrl}
          alt=""
          width={460}
          height={460}
          loading="eager"
          className="w-full max-h-48 rounded-md object-cover bg-muted"
          onError={() => setMediaCoverImgFailed(true)}
        />
      ) : null}
      {media ? (
        <div className="space-y-2">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold leading-snug break-words">{media.title}</p>
            {media.singer || media.album ? (
              <p className="text-xs leading-snug text-muted-foreground break-words">
                {[media.singer, media.album].filter(Boolean).join(' · ')}
              </p>
            ) : null}
          </div>
          {hasPlaybackDetails(media) ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      media.state === 'playing'
                        ? 'bg-emerald-500'
                        : media.state === 'paused'
                          ? 'bg-amber-500'
                          : 'bg-muted-foreground/70',
                    )}
                    aria-hidden
                  />
                  {media.state === 'playing'
                    ? t('site.currentStatus.mediaPlaying')
                    : media.state === 'paused'
                      ? t('site.currentStatus.mediaPaused')
                      : media.state === 'stopped'
                        ? t('site.currentStatus.mediaStopped')
                        : t('site.currentStatus.mediaPlayback')}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {formatPlaybackTime(playbackPositionMs)}
                  {media.durationMs !== null ? ` / ${formatPlaybackTime(media.durationMs)}` : null}
                </span>
              </div>
              {playbackPercent !== null ? (
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground transition-[width] duration-500 ease-linear"
                    style={{ width: `${playbackPercent}%` }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {showMediaSource && media?.source ? (
        <div className="rounded-md border border-border/60 bg-muted/20 px-2.5 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              {media.appIconUrl ? (
                <Image
                  src={media.appIconUrl}
                  alt=""
                  width={32}
                  height={32}
                  loading="eager"
                  className="h-4 w-4 shrink-0 rounded object-cover bg-muted"
                />
              ) : (
                <Music className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <div className="min-w-0">
                <p className="text-[11px] leading-none text-muted-foreground">
                  {t('site.currentStatus.mediaSource')}
                </p>
                <p className="truncate text-sm leading-snug">{getMediaSourceLabel(media)}</p>
              </div>
            </div>
            {showMediaNcmLink && media.ncmId ? (
              <a
                href={`https://music.163.com/#/song?id=${media.ncmId.replace(/^NCM-/i, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-background/80"
              >
                <ExternalLink className="h-3 w-3" aria-hidden />
                {t('site.currentStatus.viewMusic')}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )

  const mediaContent = media ? (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2',
        pair ? 'min-w-0 flex-1 basis-0' : 'w-full min-w-0',
      )}
      role="presentation"
    >
      <Music className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      {hasMediaDetails ? (
        isMobile ? (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'min-w-0 flex-1 basis-0 items-center text-left',
                  pair ? 'inline-flex max-w-full' : 'flex w-full justify-start',
                  'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md transition-colors',
                )}
              >
                <MarqueeIfNeeded text={mediaPrimaryLine(media)} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[min(18rem,calc(100vw-2rem))] space-y-3 p-3" align="start">
              {MediaContent()}
            </PopoverContent>
          </Popover>
        ) : (
          <HoverCard openDelay={120}>
            <HoverCardTrigger asChild>
              <button
                type="button"
                className={cn(
                  'min-w-0 flex-1 basis-0 items-center text-left',
                  pair ? 'inline-flex max-w-full' : 'flex w-full justify-start',
                  'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md transition-colors',
                )}
              >
                <MarqueeIfNeeded text={mediaPrimaryLine(media)} />
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-72 space-y-3" align="start">
              {MediaContent()}
            </HoverCardContent>
          </HoverCard>
        )
      ) : (
        <MarqueeIfNeeded text={mediaPrimaryLine(media)} />
      )}
    </div>
  ) : null

  return (
    <div
      className={cn(
        'flex w-full min-w-0 items-center',
        pair ? 'gap-2' : 'gap-1.5',
      )}
    >
      {mediaContent}

      {steam ? (
        <div
          className={cn(
            'flex min-w-0 overflow-hidden',
            pair
              ? 'max-w-[50%] min-w-0 flex-1 basis-0 items-center justify-end'
              : 'w-full min-w-0 items-center justify-start',
          )}
        >
          {isMobile ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={t('site.currentStatus.viewSteamDetails')}
                  className={cn(
                    'min-w-0 items-center gap-2 rounded-md transition-colors text-left',
                    pair ? 'inline-flex max-w-full' : 'flex w-full justify-start',
                    'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  <Gamepad2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  {!steamImgFailed ? (
                    <Image
                      src={steam.imageUrl}
                      alt=""
                      width={40}
                      height={15}
                      loading="eager"
                      className="h-4 w-10 shrink-0 rounded object-cover bg-muted"
                      onError={() => setSteamImgFailed(true)}
                    />
                  ) : null}
                  <MarqueeIfNeeded text={steam.name} grow={!pair} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(18rem,calc(100vw-2rem))] space-y-3 p-3" align="start">
                {!steamImgFailed ? (
                  <Image
                    src={steam.imageUrl}
                    alt=""
                    width={460}
                    height={215}
                    loading="eager"
                    className="w-full max-h-32 rounded-md object-cover bg-muted"
                    onError={() => setSteamImgFailed(true)}
                  />
                ) : null}
                <div className="space-y-1">
                  <p className="text-sm font-semibold leading-snug break-words">{steam.name}</p>
                  <p className="text-xs text-muted-foreground">{t('site.currentStatus.steamNowPlaying')}</p>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <HoverCard openDelay={120}>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  aria-label={t('site.currentStatus.viewSteamDetails')}
                  className={cn(
                    'min-w-0 items-center gap-2 rounded-md transition-colors text-left',
                    pair ? 'inline-flex max-w-full' : 'flex w-full justify-start',
                    'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  <Gamepad2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  {!steamImgFailed ? (
                    <Image
                      src={steam.imageUrl}
                      alt=""
                      width={40}
                      height={15}
                      loading="eager"
                      className="h-4 w-10 shrink-0 rounded object-cover bg-muted"
                      onError={() => setSteamImgFailed(true)}
                    />
                  ) : null}
                  <MarqueeIfNeeded text={steam.name} grow={!pair} />
                </button>
              </HoverCardTrigger>
              <HoverCardContent className="w-72 space-y-3" align="start">
                {!steamImgFailed ? (
                  <Image
                    src={steam.imageUrl}
                    alt=""
                    width={460}
                    height={215}
                    loading="eager"
                    className="w-full max-h-32 rounded-md object-cover bg-muted"
                    onError={() => setSteamImgFailed(true)}
                  />
                ) : null}
                <div className="space-y-1">
                  <p className="text-sm font-semibold leading-snug break-words">{steam.name}</p>
                  <p className="text-xs text-muted-foreground">{t('site.currentStatus.steamNowPlaying')}</p>
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
        </div>
      ) : null}
    </div>
  )
}
