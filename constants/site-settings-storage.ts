export const SITE_SETTINGS_THEME_SCALAR_KEYS = [
  'themePreset',
  'publicFontOptionsEnabled',
  'customCss',
] as const

export const SITE_SETTINGS_SCHEDULE_SCALAR_KEYS = [
  'scheduleSlotMinutes',
  'scheduleIcs',
  'scheduleInClassOnHome',
  'scheduleHomeShowLocation',
  'scheduleHomeShowTeacher',
  'scheduleHomeShowNextUpcoming',
  'scheduleHomeAfterClassesLabel',
] as const

export const SITE_SETTINGS_RULES_SCALAR_KEYS = [
  'appMessageRulesShowProcessName',
  'appFilterMode',
  'captureReportedAppsEnabled',
  'captureReportedAppTitleLimit',
] as const

export const SITE_SETTINGS_RULES_STRING_LIST_KEYS = [
  'appBlacklist',
  'appWhitelist',
  'appNameOnlyList',
  'mediaPlaySourceBlocklist',
  'mediaPlaySourceRules',
] as const

export const SITE_SETTINGS_THEME_CUSTOM_SURFACE_STRING_KEYS = [
  'background',
  'bodyBackground',
  'animatedBg',
  'primary',
  'secondary',
  'accent',
  'online',
  'foreground',
  'card',
  'border',
  'muted',
  'mutedForeground',
  'homeCardOverlay',
  'homeCardOverlayDark',
  'homeCardInsetHighlight',
  'animatedBgTint1',
  'animatedBgTint2',
  'animatedBgTint3',
  'floatingOrbColor1',
  'floatingOrbColor2',
  'floatingOrbColor3',
  'radius',
  'backgroundImageMode',
  'backgroundImageUrl',
  'backgroundRandomApiUrl',
  'paletteMode',
  'paletteLiveScope',
  'paletteSeedImageUrl',
] as const

export const SITE_SETTINGS_THEME_CUSTOM_SURFACE_BOOLEAN_KEYS = [
  'hideFloatingOrbs',
  'transparentAnimatedBg',
  'paletteLiveEnabled',
] as const
