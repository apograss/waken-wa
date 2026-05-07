import { normalizeAdminThemeColor } from '@/lib/admin-theme-color'
import { normalizeAppMessageRules } from '@/lib/app-message-rules'
import { parseJsonString } from '@/lib/json-parse'
import { normalizeMediaPlaySourceRules } from '@/lib/media-play-source-rules'
import { normalizePublicPageFontOptions } from '@/lib/public-page-font'
import { normalizeReportedAppTitleLimit } from '@/lib/reported-app-title-limit'
import { normalizeSiteIconUrl } from '@/lib/site-icon'
import {
  normalizeStatusCardCoverKey,
  normalizeStatusCardCoverRev,
  normalizeStatusCardDimension,
  normalizeStatusCardHexColor,
  normalizeStatusCardVariant,
} from '@/lib/status-card-options'
import { parseThemeCustomSurface } from '@/lib/theme-custom-surface'

function normalizeStringArrayField(raw: unknown): string[] {
  const parsed = parseJsonString(raw)
  if (!Array.isArray(parsed)) return []
  return parsed.map((item: unknown) => String(item ?? '').trim()).filter((item) => item.length > 0)
}

export function normalizeSiteConfigShape(config: Record<string, any>): Record<string, any> {
  const mediaCoverMaxCount = Number(config.mediaCoverMaxCount)

  return {
    ...config,
    adminThemeColor: normalizeAdminThemeColor(config.adminThemeColor ?? '') ?? null,
    adminBackgroundColor: normalizeAdminThemeColor(config.adminBackgroundColor ?? '') ?? null,
    siteIconUrl: normalizeSiteIconUrl(config.siteIconUrl ?? '') ?? null,
    hideInspirationOnHome: config.hideInspirationOnHome === true,
    smoothScrollEnabled: config.smoothScrollEnabled === true,
    mediaDisplayShowSource: config.mediaDisplayShowSource === true,
    mediaDisplayShowCover: config.mediaDisplayShowCover === true,
    mediaDisplayShowAppIcon: config.mediaDisplayShowAppIcon === true,
    mediaDisplayShowNcmLink: config.mediaDisplayShowNcmLink === true,
    statusCardEnabled: config.statusCardEnabled === true,
    statusCardVariant: normalizeStatusCardVariant(config.statusCardVariant),
    statusCardCoverKey: normalizeStatusCardCoverKey(config.statusCardCoverKey) ?? '',
    statusCardCoverRev: normalizeStatusCardCoverRev(config.statusCardCoverRev),
    statusCardShowHeader: config.statusCardShowHeader !== false,
    statusCardShowAvatar: config.statusCardShowAvatar !== false,
    statusCardShowName: config.statusCardShowName !== false,
    statusCardShowBio: config.statusCardShowBio !== false,
    statusCardShowNote: config.statusCardShowNote === true,
    statusCardPreferGame: config.statusCardPreferGame === true,
    statusCardShowInClassStatus: config.statusCardShowInClassStatus === true,
    statusCardWidth: normalizeStatusCardDimension(config.statusCardWidth, 520, 280, 1200),
    statusCardHeight: normalizeStatusCardDimension(config.statusCardHeight, 310, 1, 720),
    statusCardRadius: normalizeStatusCardDimension(config.statusCardRadius, 20, 0, 80),
    statusCardBg: normalizeStatusCardHexColor(config.statusCardBg, '#FFFFFF'),
    statusCardFg: normalizeStatusCardHexColor(config.statusCardFg, '#111827'),
    statusCardMuted: normalizeStatusCardHexColor(config.statusCardMuted, '#6B7280'),
    statusCardAccent: normalizeStatusCardHexColor(config.statusCardAccent, '#22C55E'),
    statusCardBorder: normalizeStatusCardHexColor(config.statusCardBorder, '#E5E7EB'),
    mediaCoverMaxCount: Number.isFinite(mediaCoverMaxCount)
      ? Math.min(Math.max(Math.round(mediaCoverMaxCount), 0), 500)
      : 50,
    forceDisplayTimezone: config.forceDisplayTimezone === true,
    themeCustomSurface: parseThemeCustomSurface(config.themeCustomSurface),
    publicFontOptionsEnabled: config.publicFontOptionsEnabled === true,
    publicFontOptions: normalizePublicPageFontOptions(config.publicFontOptions),
    userNoteHitokotoCategories: normalizeStringArrayField(config.userNoteHitokotoCategories),
    inspirationAllowedDeviceHashes:
      config.inspirationAllowedDeviceHashes === null
        ? null
        : normalizeStringArrayField(config.inspirationAllowedDeviceHashes),
    schedulePeriodTemplate: parseJsonString(config.schedulePeriodTemplate),
    scheduleGridByWeekday: parseJsonString(config.scheduleGridByWeekday),
    scheduleCourses: parseJsonString(config.scheduleCourses),
    appMessageRules: normalizeAppMessageRules(config.appMessageRules),
    appBlacklist: normalizeStringArrayField(config.appBlacklist),
    appWhitelist: normalizeStringArrayField(config.appWhitelist),
    appNameOnlyList: normalizeStringArrayField(config.appNameOnlyList),
    captureReportedAppTitleLimit: normalizeReportedAppTitleLimit(
      config.captureReportedAppTitleLimit,
    ),
    mediaPlaySourceBlocklist: normalizeStringArrayField(config.mediaPlaySourceBlocklist),
    mediaPlaySourceRules: normalizeMediaPlaySourceRules(
      parseJsonString(config.mediaPlaySourceRules),
      config.mediaPlaySourceBlocklist,
    ),
  }
}
