import type { ScheduleOccurrence } from '@/lib/schedule-courses'
import type { ActivityFeedItem } from '@/types/activity'

export type StatusCardVariant = 'classic' | 'aurora' | 'cover' | 'signature'

export type StatusCardPreviewDeviceMode = 'auto' | 'deviceId' | 'deviceKey'

export type StatusCardSettings = {
  statusCardEnabled: boolean
  statusCardVariant: StatusCardVariant
  statusCardTag: string
  statusCardBackgroundKey: string
  statusCardBackgroundRev: string
  statusCardCoverKey: string
  statusCardCoverRev: string
  statusCardShowHeader: boolean
  statusCardShowAvatar: boolean
  statusCardShowName: boolean
  statusCardShowBio: boolean
  statusCardShowNote: boolean
  statusCardPreferGame: boolean
  statusCardShowInClassStatus: boolean
  statusCardWidth: number | 'auto'
  statusCardHeight: number | 'auto'
  statusCardRadius: number
  statusCardBg: string
  statusCardSignatureBg: string
  statusCardFg: string
  statusCardMuted: string
  statusCardAccent: string
  statusCardBorder: string
}

export type StatusCardDimensionParser = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
  key: string,
) => number | 'auto'

export type StatusCardState = 'active' | 'empty' | 'locked' | 'disabled'

export type StatusCardIcon =
  | 'app'
  | 'bookOpen'
  | 'desktop'
  | 'gamepad'
  | 'hourglass'
  | 'lock'
  | 'mobile'
  | 'moon'
  | 'music'
  | 'tablet'

export type StatusCardDetailRow = {
  label: string
  value: string
  icon: StatusCardIcon
}

export type StatusCardOptions = {
  variant: StatusCardVariant
  width: number
  widthAuto: boolean
  height: number
  heightAuto: boolean
  radius: number
  bg: string
  signatureBg: string
  fg: string
  muted: string
  accent: string
  border: string
  showHeader: boolean
  showAvatar: boolean
  showName: boolean
  showBio: boolean
  showNote: boolean
  preferGame: boolean
  showInClassStatus: boolean
  tag: string
  coverKey: string | null
  backgroundKey: string | null
  deviceId: number | null
  deviceKey: string | null
}

export type StatusCardProfile = {
  name: string
  bio: string
  note: string
  avatarUrl: string
  currentlyText: string
}

export type StatusCardRenderLines = {
  steamLine: string
  statusLine: string
  deviceLine: string
  mediaLine: string
  shouldPrioritizeGame: boolean
  shouldUseInClassStatus: boolean
}

export type StatusCardRenderBaseParams = {
  options: StatusCardOptions
  profile: StatusCardProfile
  activity: ActivityFeedItem | null
  avatarDataUri?: string | null
  inClassStatusActive?: boolean
  inClassOccurrence?: ScheduleOccurrence | null
  statusPageUrl: string
  state: StatusCardState
}

export type StatusCardCoverRenderParams = StatusCardRenderBaseParams & {
  coverDataUri?: string | null
}

export type StatusCardSignatureRenderParams = StatusCardRenderBaseParams & {
  backgroundDataUri?: string | null
}

export type StatusCardRenderParams = StatusCardRenderBaseParams & {
  coverDataUri?: string | null
  backgroundDataUri?: string | null
}

export type StatusCardPreviewDraft = {
  deviceMode: StatusCardPreviewDeviceMode
  deviceValue: string
}

export type StatusCardPreviewSource = {
  statusCardVariant: StatusCardVariant
  statusCardTag: string
  statusCardBackgroundKey: string
  statusCardBackgroundRev: string
  statusCardCoverKey: string
  statusCardCoverRev: string
  statusCardShowHeader: boolean
  statusCardShowAvatar: boolean
  statusCardShowName: boolean
  statusCardShowBio: boolean
  statusCardShowNote: boolean
  statusCardPreferGame: boolean
  statusCardShowInClassStatus: boolean
  statusCardWidth: number | string
  statusCardHeight: number | string
  statusCardRadius: number | string
  statusCardBg: string
  statusCardSignatureBg: string
  statusCardFg: string
  statusCardMuted: string
  statusCardAccent: string
  statusCardBorder: string
}

export type StatusCardPreviewTypes = {
  deviceMode: StatusCardPreviewDeviceMode
  draft: StatusCardPreviewDraft
  source: StatusCardPreviewSource
}
