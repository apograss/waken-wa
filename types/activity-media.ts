export type MediaPlaybackState = 'playing' | 'paused' | 'stopped'

/** Display shape for `metadata.media` (now-playing title / optional singer / source / cover / app icon). */
export interface MediaDisplay {
  title: string
  singer: string | null
  album: string | null
  source: string | null
  coverUrl: string | null
  appIconUrl: string | null
  state: MediaPlaybackState | null
  positionMs: number | null
  durationMs: number | null
  startedAtMs: number | null
  endsAtMs: number | null
  reportedAtMs: number | null
  /** NCM song ID extracted from the genre field (format: NCM-{ID}). */
  ncmId: string | null
}
