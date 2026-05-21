import '@/styles/homepage.css'
import '@/styles/noto-serif-sc.css'

import { count, desc } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { HomeScrollbarHider } from '@/components/home-scrollbar-hider'
import { PersonalHomePage } from '@/components/homepage/personal-home-page'
import { LayoutFooterPortal } from '@/components/layout-footer-portal'
import { LenisSmoothScroll } from '@/components/lenis-smooth-scroll'
import { PublicPageTransitionShell } from '@/components/public-page-transition-shell'
import { SiteLockForm } from '@/components/site-lock-form'
import { SiteThemeRuntime } from '@/components/site-theme-runtime'
import {
  SITE_CONFIG_SCHEDULE_HOME_AFTER_CLASSES_LABEL_DEFAULT,
  SITE_CONFIG_SCHEDULE_HOME_AFTER_CLASSES_LABEL_MAX_LEN,
} from '@/constants/site-config'
import { getActivityFeedData } from '@/lib/activity-feed'
import { normalizeActivityUpdateMode } from '@/lib/activity-update-mode'
import { verifySiteLockSession } from '@/lib/auth'
import { isRemoteAvatarUrl, resolveAvatarUrl } from '@/lib/avatar-url'
import { db } from '@/lib/db'
import { inspirationEntries } from '@/lib/drizzle-schema'
import { getHCaptchaPublicConfig } from '@/lib/hcaptcha'
import {
  normalizeHitokotoCategories,
  normalizeHitokotoEncode,
} from '@/lib/hitokoto'
import { NormalizeHomepageSettings } from '@/lib/homepage-settings'
import { inspirationEntryImageUrl } from '@/lib/inspiration-inline-images'
import { resolvePublicPageControlFontOptions } from '@/lib/public-page-font'
import {
  parseScheduleCoursesJson,
  resolveSchedulePeriodTemplate,
  type ScheduleCourse,
} from '@/lib/schedule-courses'
import { getSiteConfigMemoryFirst } from '@/lib/site-config-cache'
import { getThemePresetCss } from '@/lib/theme-css'
import { coerceDbTimestampToIsoUtc, normalizeTimezone } from '@/lib/timezone'
import {
  normalizeTodayStatusBusy,
  normalizeTodayStatusEmoji,
  normalizeTodayStatusExpiresAt,
  normalizeTodayStatusText,
} from '@/lib/today-status'
import packageJson from '@/package.json'

// Force dynamic rendering so each request gets fresh data.
export const dynamic = 'force-dynamic'

export default async function Home() {
  const config = await getSiteConfigMemoryFirst()
  if (!config) {
    redirect('/admin/setup')
  }

  if (config.pageLockEnabled) {
    const cookieStore = await cookies()
    const token = cookieStore.get('site_lock')?.value
    const unlocked = token ? await verifySiteLockSession(token) : null
    if (!unlocked) {
      const hcaptcha = await getHCaptchaPublicConfig()
      return <SiteLockForm hcaptchaEnabled={hcaptcha.enabled} hcaptchaSiteKey={hcaptcha.siteKey} />
    }
  }

  const userName = config.userName
  const userBio = config.userBio
  const avatarUrl = config.avatarUrl
  const avatarSrc = resolveAvatarUrl(avatarUrl, config.avatarFetchByServerEnabled === true, 'public')
  const shouldPrefetchAvatar = isRemoteAvatarUrl(avatarUrl)
  // Config object for later use
  const cfg = config as Record<string, unknown>
  const todayStatusEmoji = normalizeTodayStatusEmoji(cfg.todayStatusEmoji)
  const todayStatusText = normalizeTodayStatusText(cfg.todayStatusText)
  const todayStatusExpiresAt = normalizeTodayStatusExpiresAt(cfg.todayStatusExpiresAt)
  const todayStatusBusy = normalizeTodayStatusBusy(cfg.todayStatusBusy)
  const userNote = config.userNote
  const currentlyText = config.currentlyText
  const earlierText = config.earlierText
  const adminText = String(config.adminText ?? '').trim() || 'admin'
  const themePresetCss = getThemePresetCss(config.themePreset, config.themeCustomSurface)
  const customCss = String(config.customCss ?? '')
  const themeCss = `${themePresetCss}\n${customCss}`.trim()

  const [activityInitialFeed, inspirationRows, [countRow]] = await Promise.all([
    getActivityFeedData(undefined, { forPublicFeed: true }),
    db
      .select({
        id: inspirationEntries.id,
        title: inspirationEntries.title,
        content: inspirationEntries.content,
        contentLexical: inspirationEntries.contentLexical,
        imageDataUrl: inspirationEntries.imageDataUrl,
        statusSnapshot: inspirationEntries.statusSnapshot,
        createdAt: inspirationEntries.createdAt,
      })
      .from(inspirationEntries)
      .orderBy(desc(inspirationEntries.createdAt))
      .limit(3),
    db.select({ c: count() }).from(inspirationEntries),
  ])
  const inspirationTotal = Number(countRow?.c ?? 0)
  
  // Timezone for inspiration entries
  const displayTimezoneForEntries = normalizeTimezone(cfg.displayTimezone)
  const inspirationHomeEntries = inspirationRows.map((row: (typeof inspirationRows)[number]) => ({
    ...row,
    imageDataUrl: row.imageDataUrl ? inspirationEntryImageUrl(row.id) : null,
    imageUrl: row.imageDataUrl ? inspirationEntryImageUrl(row.id) : null,
    createdAt: coerceDbTimestampToIsoUtc(row.createdAt),
    displayTimezone: displayTimezoneForEntries,
  }))

  const scheduleInClassOnHome = Boolean(config.scheduleInClassOnHome)
  const scheduleHomeShowLocation = Boolean(config.scheduleHomeShowLocation)
  const scheduleHomeShowTeacher = Boolean(config.scheduleHomeShowTeacher)
  const scheduleHomeShowNextUpcoming = Boolean(config.scheduleHomeShowNextUpcoming)
  const scheduleHomeAfterClassesLabelRaw = String(cfg.scheduleHomeAfterClassesLabel ?? '').trim()
  const scheduleHomeAfterClassesLabel =
    scheduleHomeAfterClassesLabelRaw.slice(0, SITE_CONFIG_SCHEDULE_HOME_AFTER_CLASSES_LABEL_MAX_LEN) ||
    SITE_CONFIG_SCHEDULE_HOME_AFTER_CLASSES_LABEL_DEFAULT
  const schedulePeriodTemplate = resolveSchedulePeriodTemplate(cfg.schedulePeriodTemplate ?? null)
  
  let scheduleCoursesForHome: ScheduleCourse[] = []
  if (scheduleInClassOnHome) {
    const parsed = parseScheduleCoursesJson(config.scheduleCourses ?? null)
    if (parsed.ok) {
      scheduleCoursesForHome = parsed.data
    }
  }
  const showScheduleHomeColumn = scheduleInClassOnHome && scheduleCoursesForHome.length > 0

  const hideActivityMedia = Boolean(cfg.hideActivityMedia)
  const mediaDisplayShowSource = cfg.mediaDisplayShowSource === true
  const mediaDisplayShowCover = cfg.mediaDisplayShowCover === true
  const mediaDisplayShowNcmLink = cfg.mediaDisplayShowNcmLink === true
  const hideInspirationOnHome = cfg.hideInspirationOnHome === true
  const smoothScrollEnabled = cfg.smoothScrollEnabled === true
  const noteHitokotoEnabled = Boolean(cfg.userNoteHitokotoEnabled)
  const noteTypewriterEnabled = Boolean(cfg.userNoteTypewriterEnabled)
  const noteSignatureFontEnabled = Boolean(cfg.userNoteSignatureFontEnabled)
  const noteSignatureFontFamily =
    typeof cfg.userNoteSignatureFontFamily === 'string'
      ? cfg.userNoteSignatureFontFamily.trim()
      : ''
  const noteHitokotoCategories = normalizeHitokotoCategories(cfg.userNoteHitokotoCategories)
  const noteHitokotoEncode = normalizeHitokotoEncode(cfg.userNoteHitokotoEncode)
  const noteHitokotoFallbackToNote = Boolean(cfg.userNoteHitokotoFallbackToNote)
  const activityUpdateMode = normalizeActivityUpdateMode(cfg.activityUpdateMode)
  const homepageSettings = NormalizeHomepageSettings(cfg)
  const publicFontOptions = resolvePublicPageControlFontOptions(
    cfg.publicFontOptionsEnabled,
    cfg.publicFontOptions,
  )

  return (
    <>
      {shouldPrefetchAvatar && avatarSrc ? <link rel="prefetch" href={avatarSrc} as="image" /> : null}
      <LenisSmoothScroll enabled={smoothScrollEnabled} />
      <HomeScrollbarHider />
      {themeCss && (
        <style
          id="site-theme-override"
          dangerouslySetInnerHTML={{ __html: themeCss }}
        />
      )}
      <SiteThemeRuntime
        themePreset={config.themePreset}
        themeCustomSurface={config.themeCustomSurface}
      />
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="floating-orb floating-orb-1" />
        <div className="floating-orb floating-orb-2" />
        <div className="floating-orb floating-orb-3" />
      </div>
      <PublicPageTransitionShell
        appVersion={packageJson.version}
        scope="home"
        enabled={false}
        fontOptions={publicFontOptions}
      >
        <PersonalHomePage
          homepageSettings={homepageSettings}
          userName={userName}
          reusedSectionProps={{
            activityInitialFeed,
            activityUpdateMode,
            userName,
            userBio,
            avatarSrc,
            profileOnlineAccentColor: config.profileOnlineAccentColor ?? null,
            profileOnlinePulseEnabled: config.profileOnlinePulseEnabled ?? null,
            todayStatusEmoji,
            todayStatusText,
            todayStatusExpiresAt,
            todayStatusBusy,
            userNote,
            noteHitokotoEnabled,
            noteTypewriterEnabled,
            noteSignatureFontEnabled,
            noteSignatureFontFamily,
            noteHitokotoCategories,
            noteHitokotoEncode,
            noteHitokotoFallbackToNote,
            currentlyText,
            hideActivityMedia,
            mediaDisplayShowSource,
            mediaDisplayShowCover,
            mediaDisplayShowNcmLink,
            showScheduleHomeColumn,
            scheduleCoursesForHome,
            scheduleHomeShowLocation,
            scheduleHomeShowTeacher,
            schedulePeriodTemplate,
            scheduleHomeShowNextUpcoming,
            scheduleHomeAfterClassesLabel,
            hideInspirationOnHome,
            earlierText,
            inspirationHomeEntries,
            inspirationTotal,
            demoEnabled: homepageSettings.demoEnabled,
          }}
        />
        <LayoutFooterPortal adminText={adminText} userName={userName} />
      </PublicPageTransitionShell>
    </>
  )
}
