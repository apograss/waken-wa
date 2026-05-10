import type {
  StatusCardPreviewDraft,
  StatusCardSettings,
} from '@/types/status-card'

export const STATUS_CARD_DEFAULT_WIDTH = 520
export const STATUS_CARD_DEFAULT_STATUS_HEIGHT = 180
export const STATUS_CARD_DEFAULT_HEADER_HEIGHT = 310
export const STATUS_CARD_SIGNATURE_WIDTH = 700
export const STATUS_CARD_SIGNATURE_HEIGHT = 220
export const STATUS_CARD_DEFAULT_RADIUS = 20
export const STATUS_CARD_DEFAULT_FOOTER_TEXT = 'Powered By Waken-Wa✨'

export const STATUS_CARD_AVATAR_MAX_BYTES = 512 * 1024
export const STATUS_CARD_AVATAR_FETCH_TIMEOUT_MS = 2500
export const STATUS_CARD_HITOKOTO_FETCH_TIMEOUT_MS = 2200

export const STATUS_CARD_COVER_CROP_ASPECT_RATIO = 520 / 100
export const STATUS_CARD_COVER_CROP_OUTPUT_EDGE = 1400
export const STATUS_CARD_BACKGROUND_CROP_ASPECT_RATIO = 700 / 220

export const STATUS_CARD_PREVIEW_DEFAULT_DRAFT: StatusCardPreviewDraft = {
  deviceMode: 'auto',
  deviceValue: '',
}

export const STATUS_CARD_DEFAULTS: StatusCardSettings = {
  statusCardEnabled: false,
  statusCardVariant: 'aurora',
  statusCardTag: '',
  statusCardBackgroundKey: '',
  statusCardBackgroundRev: '',
  statusCardCoverKey: '',
  statusCardCoverRev: '',
  statusCardShowHeader: true,
  statusCardShowAvatar: true,
  statusCardShowName: true,
  statusCardShowBio: true,
  statusCardShowNote: false,
  statusCardPreferGame: false,
  statusCardShowInClassStatus: false,
  statusCardWidth: STATUS_CARD_DEFAULT_WIDTH,
  statusCardHeight: STATUS_CARD_DEFAULT_HEADER_HEIGHT,
  statusCardRadius: STATUS_CARD_DEFAULT_RADIUS,
  statusCardBg: '#FFFFFF',
  statusCardSignatureBg: '#F4F0FF',
  statusCardFg: '#111827',
  statusCardMuted: '#6B7280',
  statusCardAccent: '#22C55E',
  statusCardBorder: '#E5E7EB',
}
