import { atom } from 'jotai'

import {
  emptyPublicPageFontOptionsForm,
  emptyThemeCustomSurfaceForm,
} from '@/components/admin/web-settings-utils'
import {
  REDIS_ACTIVITY_FEED_CACHE_TTL_DEFAULT_SECONDS,
} from '@/constants/activity-api'
import { HOMEPAGE_SETTINGS_DEFAULTS } from '@/constants/homepage-settings'
import {
  SITE_CONFIG_HISTORY_WINDOW_DEFAULT_MINUTES,
  SITE_CONFIG_PROCESS_STALE_DEFAULT_SECONDS,
  SITE_CONFIG_SCHEDULE_HOME_AFTER_CLASSES_LABEL_DEFAULT,
  SITE_CONFIG_SCHEDULE_SLOT_DEFAULT_MINUTES,
} from '@/constants/site-config'
import { ABOUT_PROFILE_DEFAULTS } from '@/lib/about-profile'
import {
  DEFAULT_ACTIVITY_UPDATE_MODE,
} from '@/lib/activity-update-mode'
import { DEFAULT_PAGE_TITLE } from '@/lib/default-page-title'
import { FOOTER_BEIAN_DEFAULTS } from '@/lib/footer-beian'
import { resolveSchedulePeriodTemplate } from '@/lib/schedule-courses'
import { resolveScheduleGridByWeekday } from '@/lib/schedule-grid-by-weekday'
import { DEFAULT_TIMEZONE } from '@/lib/timezone'
import type {
  SiteConfig,
  SiteSettingsMigrationInfo,
  SkillsAiAuthorizationItem,
  SkillsEditableConfig,
} from '@/types/web-settings'

export const WEB_SETTINGS_INITIAL_FORM: SiteConfig = {
  adminThemeColor: '',
  adminBackgroundColor: '',
  pageTitle: DEFAULT_PAGE_TITLE,
  siteIconUrl: '',
  userName: '',
  userBio: '',
  avatarUrl: '',
  avatarFetchByServerEnabled: false,
  profileOnlineAccentColor: '',
  profileOnlinePulseEnabled: true,
  todayStatusEmoji: '',
  todayStatusText: '',
  todayStatusExpiresAt: '',
  todayStatusBusy: false,
  userNote: '',
  homepageVisibleEngines: [...HOMEPAGE_SETTINGS_DEFAULTS.visibleEngines],
  homepageDefaultEngine: HOMEPAGE_SETTINGS_DEFAULTS.defaultEngine,
  homepageGreetingSource: HOMEPAGE_SETTINGS_DEFAULTS.greetingSource,
  homepageGreetingCustomText: HOMEPAGE_SETTINGS_DEFAULTS.greetingCustomText,
  homepageWeatherEnabled: HOMEPAGE_SETTINGS_DEFAULTS.weatherEnabled,
  homepageDemoEnabled: HOMEPAGE_SETTINGS_DEFAULTS.demoEnabled,
  homepageCoverImage: HOMEPAGE_SETTINGS_DEFAULTS.coverImage,
  userNoteHitokotoEnabled: false,
  userNoteTypewriterEnabled: false,
  userNoteSignatureFontEnabled: false,
  userNoteSignatureFontFamily: '',
  pageLoadingEnabled: true,
  searchEngineIndexingEnabled: true,
  userNoteHitokotoCategories: [],
  userNoteHitokotoEncode: 'json',
  userNoteHitokotoFallbackToNote: false,
  themePreset: 'basic',
  themeCustomSurface: emptyThemeCustomSurfaceForm(),
  aboutProfile: { ...ABOUT_PROFILE_DEFAULTS },
  footerBeian: { ...FOOTER_BEIAN_DEFAULTS },
  publicFontOptionsEnabled: false,
  publicFontOptions: emptyPublicPageFontOptionsForm(),
  customCss: '',
  mcpThemeToolsEnabled: false,
  openApiDocsEnabled: true,
  aiToolMode: 'skills',
  historyWindowMinutes: SITE_CONFIG_HISTORY_WINDOW_DEFAULT_MINUTES,
  processStaleSeconds: SITE_CONFIG_PROCESS_STALE_DEFAULT_SECONDS,
  pageLockEnabled: false,
  pageLockPassword: '',
  hcaptchaEnabled: false,
  hcaptchaSiteKey: '',
  hcaptchaSecretKey: '',
  currentlyText: '',
  earlierText: '',
  adminText: 'admin',
  autoAcceptNewDevices: false,
  inspirationDeviceRestrictionEnabled: false,
  inspirationAllowedDeviceHashes: [],
  scheduleSlotMinutes: SITE_CONFIG_SCHEDULE_SLOT_DEFAULT_MINUTES,
  schedulePeriodTemplate: resolveSchedulePeriodTemplate(null),
  scheduleGridByWeekday: resolveScheduleGridByWeekday(
    null,
    SITE_CONFIG_SCHEDULE_SLOT_DEFAULT_MINUTES,
  ),
  scheduleCourses: [],
  scheduleIcs: '',
  scheduleInClassOnHome: false,
  scheduleHomeShowLocation: false,
  scheduleHomeShowTeacher: false,
  scheduleHomeShowNextUpcoming: false,
  scheduleHomeAfterClassesLabel: SITE_CONFIG_SCHEDULE_HOME_AFTER_CLASSES_LABEL_DEFAULT,
  globalMouseTiltEnabled: false,
  globalMouseTiltGyroEnabled: false,
  smoothScrollEnabled: false,
  hideActivityMedia: false,
  mediaDisplayShowSource: false,
  mediaDisplayShowCover: false,
  mediaDisplayShowAppIcon: false,
  mediaDisplayShowNcmLink: false,
  mediaCoverMaxCount: 50,
  hideInspirationOnHome: false,
  activityRejectLockappSleep: false,
  displayTimezone: DEFAULT_TIMEZONE,
  forceDisplayTimezone: false,
  activityUpdateMode: DEFAULT_ACTIVITY_UPDATE_MODE,
  useNoSqlAsCacheRedis: true,
  redisCacheTtlSeconds: REDIS_ACTIVITY_FEED_CACHE_TTL_DEFAULT_SECONDS,
  steamEnabled: false,
  steamId: '',
  steamApiKey: '',
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
  statusCardWidth: 520,
  statusCardHeight: 310,
  statusCardRadius: 20,
  statusCardBg: '#FFFFFF',
  statusCardSignatureBg: '#F4F0FF',
  statusCardFg: '#111827',
  statusCardMuted: '#6B7280',
  statusCardAccent: '#22C55E',
  statusCardBorder: '#E5E7EB',
}

export const webSettingsLoadingAtom = atom(true)
export const webSettingsSavingAtom = atom(false)
export const webSettingsFormAtom = atom<SiteConfig>(WEB_SETTINGS_INITIAL_FORM)
export const webSettingsBaselineFormAtom = atom<SiteConfig | null>(null)
export const webSettingsPublicOriginAtom = atom('')
export const webSettingsImportConfigDialogOpenAtom = atom(false)
export const webSettingsImportConfigInputAtom = atom('')
export const webSettingsCropSourceUrlAtom = atom<string | null>(null)
export const webSettingsCropDialogOpenAtom = atom(false)
export const webSettingsCropTargetAtom = atom<'avatar' | 'siteIcon'>('avatar')
export const webSettingsInspirationDevicesAtom = atom<
  Array<{ id: number; displayName: string; generatedHashKey: string; status: string }>
>([])
export const webSettingsRedisCacheServerlessForcedAtom = atom(false)
export const webSettingsMigrationAtom = atom<SiteSettingsMigrationInfo | null>(null)

export const webSettingsSkillsSavingAtom = atom(false)
export const webSettingsSkillsEnabledAtom = atom(false)
export const webSettingsSkillsAuthModeAtom = atom<'oauth' | 'apikey' | ''>('')
export const webSettingsSkillsApiKeyConfiguredAtom = atom(false)
export const webSettingsSkillsOauthConfiguredAtom = atom(false)
export const webSettingsSkillsOauthTokenTtlMinutesAtom = atom<number | string>(60)
export const webSettingsSkillsAiAuthorizationsAtom = atom<SkillsAiAuthorizationItem[]>([])
export const webSettingsSkillsRevokingAiClientIdAtom = atom('')
export const webSettingsSkillsGeneratedApiKeyAtom = atom('')
export const webSettingsLegacyMcpConfiguredAtom = atom(false)
export const webSettingsLegacyMcpGeneratedApiKeyAtom = atom('')
export const webSettingsBaselineSkillsConfigAtom = atom<SkillsEditableConfig | null>(null)
