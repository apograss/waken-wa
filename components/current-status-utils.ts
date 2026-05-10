import type { MediaDisplay } from '@/lib/activity-media'

export function getBatteryLabel(metadata: Record<string, unknown> | null | undefined): string | null {
  const value = metadata?.deviceBatteryPercent
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const clamped = Math.min(Math.max(Math.round(value), 0), 100)
  return `${clamped}%`
}

export function getDeviceType(
  deviceName: string,
  metadata: Record<string, unknown> | null | undefined
): 'mobile' | 'tablet' | 'desktop' {
  const explicit = String(metadata?.deviceType ?? '').trim().toLowerCase()
  if (explicit === 'mobile' || explicit === 'tablet' || explicit === 'desktop') return explicit

  const source = deviceName.toLowerCase()
  if (/ipad|tablet|tab|平板/.test(source)) return 'tablet'
  if (/iphone|android|mobile|phone|手机/.test(source)) return 'mobile'
  return 'desktop'
}

export function mediaPrimaryLine(media: MediaDisplay): string {
  return media.singer ? `${media.title} · ${media.singer}` : media.title
}

export function formatPlaybackTime(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms < 0) return '--:--'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function getPlaybackPosition(media: MediaDisplay, nowMs: number): number | null {
  let positionMs = media.positionMs
  if (media.state === 'playing') {
    if (media.startedAtMs !== null) {
      positionMs = nowMs - media.startedAtMs
    } else if (media.positionMs !== null && media.reportedAtMs !== null) {
      positionMs = media.positionMs + Math.max(0, nowMs - media.reportedAtMs)
    }
  }

  if (positionMs === null || !Number.isFinite(positionMs)) return null
  const clamped = Math.max(0, positionMs)
  return media.durationMs !== null ? Math.min(clamped, media.durationMs) : clamped
}

export function getPlaybackPercent(positionMs: number | null, durationMs: number | null): number | null {
  if (positionMs === null || durationMs === null || durationMs <= 0) return null
  return Math.min(100, Math.max(0, (positionMs / durationMs) * 100))
}

export function hasPlaybackDetails(media: MediaDisplay): boolean {
  return Boolean(
    media.state ||
      media.positionMs !== null ||
      media.durationMs !== null ||
      media.startedAtMs !== null ||
      media.endsAtMs !== null ||
      media.reportedAtMs !== null,
  )
}

export function getMediaSourceLabel(media: MediaDisplay): string | null {
  return media.source || null
}
