import { cookies, headers } from 'next/headers'
import { I18nProvider } from 'next-i18next/client'

import { AdminLanguageToggle } from '@/components/admin/admin-language-toggle'
import { AdminThemeRuntime } from '@/components/admin/admin-theme-runtime'
import { AdminToaster } from '@/components/admin/admin-toaster'
import { ThemeModeToggle } from '@/components/theme-mode-toggle'
import i18nConfig, { type AppLanguage } from '@/i18n.config'
import { buildAdminAppearanceVars, normalizeAdminThemeColor } from '@/lib/admin-theme-color'
import {
  ADMIN_LANGUAGE_COOKIE_NAME,
  getAdminLanguageFromCookie,
  getLanguageFromAcceptLanguage,
  getLocaleLanguageFromCookie,
  I18N_LANGUAGE_HEADER_NAME,
  LEGACY_ADMIN_LANGUAGE_COOKIE_NAME,
  NEXT_LOCALE_COOKIE_NAME,
  normalizeRequestLanguage,
} from '@/lib/i18n/request-locale'
import { getLayoutResources } from '@/lib/i18n/server'
import { getSiteConfigMemoryFirst } from '@/lib/site-config-cache'
import { normalizeThemeMode, THEME_COOKIE_NAME } from '@/lib/theme'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headerStore = await headers()
  const cookieStore = await cookies()
  const persistedTheme = normalizeThemeMode(cookieStore.get(THEME_COOKIE_NAME)?.value)
  const resolvedTheme = persistedTheme === 'dark' ? 'dark' : 'light'

  // 后台优先使用后台语言 cookie，回落到公共 locale / Accept-Language。
  const fallbackLng = i18nConfig.fallbackLng as AppLanguage
  const adminLng: AppLanguage =
    normalizeRequestLanguage(headerStore.get(I18N_LANGUAGE_HEADER_NAME)) ??
    getAdminLanguageFromCookie(
      cookieStore.get(ADMIN_LANGUAGE_COOKIE_NAME)?.value,
      cookieStore.get(LEGACY_ADMIN_LANGUAGE_COOKIE_NAME)?.value,
    ) ??
    getLocaleLanguageFromCookie(cookieStore.get(NEXT_LOCALE_COOKIE_NAME)?.value) ??
    getLanguageFromAcceptLanguage(headerStore.get('accept-language')) ??
    fallbackLng
  // 后台需要的命名空间在此处独立打包（不污染公开页 HTML）。
  const adminResources = await getLayoutResources(adminLng, ['common', 'auth', 'admin'])

  let initialThemeColor: string | null = null
  let initialBackgroundColor: string | null = null

  try {
    const config = await getSiteConfigMemoryFirst()
    initialThemeColor = normalizeAdminThemeColor(config?.adminThemeColor ?? '') ?? null
    initialBackgroundColor = normalizeAdminThemeColor(config?.adminBackgroundColor ?? '') ?? null
  } catch {
    // Keep built-in admin colors when config is not ready yet.
  }

  const adminThemeStyle = buildAdminAppearanceVars({
    resolvedTheme,
    themeColor: initialThemeColor,
    backgroundColor: initialBackgroundColor,
  })
  const adminThemeCssText = Object.entries(adminThemeStyle)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')

  return (
    <I18nProvider
      key={adminLng}
      language={adminLng}
      resources={adminResources}
      supportedLngs={i18nConfig.supportedLngs}
      defaultNS={i18nConfig.defaultNS}
      fallbackLng={i18nConfig.fallbackLng}
    >
      {adminThemeCssText ? (
        <style id="admin-theme-vars">{`:root {\n${adminThemeCssText}\n}`}</style>
      ) : null}
      <AdminThemeRuntime
        initialThemeColor={initialThemeColor}
        initialBackgroundColor={initialBackgroundColor}
      />
      <div className="admin-font-scope">{children}</div>
      <div className="bg-background px-4 pb-5 pt-2 sm:px-6 sm:pb-6 lg:hidden">
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-[28px] border border-border/70 bg-background/78 px-2 py-2 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <AdminLanguageToggle className="border-transparent bg-transparent shadow-none backdrop-blur-0" />
            <div className="h-8 w-px bg-border/70" aria-hidden />
            <ThemeModeToggle className="border-transparent bg-transparent shadow-none backdrop-blur-0" />
          </div>
        </div>
      </div>
      <AdminToaster />
    </I18nProvider>
  )
}
