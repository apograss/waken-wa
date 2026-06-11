/**
 * Friendly display names for reported process names, used across the homepage
 * "now" section so visitors see readable app names instead of raw executables.
 *
 * Keys are the process name lowercased with any executable extension stripped
 * (see `prettifyAppName` in `lib/activity-display.ts`). Add entries as new apps
 * show up; unknown names fall back to de-camelCased Title Case automatically.
 */
export const APP_DISPLAY_ALIASES: Record<string, string> = {
  // Terminals / editors
  windowsterminal: 'Windows Terminal',
  conhost: 'Windows 控制台',
  powershell: 'PowerShell',
  pwsh: 'PowerShell',
  code: 'VS Code',
  cursor: 'Cursor',
  devenv: 'Visual Studio',
  idea64: 'IntelliJ IDEA',
  // Browsers
  chrome: 'Chrome',
  msedge: 'Edge',
  firefox: 'Firefox',
  // Media
  cloudmusic: '网易云音乐',
  qqmusic: 'QQ 音乐',
  spotify: 'Spotify',
  // Chat
  wechat: '微信',
  telegram: 'Telegram',
  // System
  explorer: '文件资源管理器',
}

/** Leading decorative glyphs to strip from reported window titles (e.g. Claude Code's `✳`，盲文转轮 `⠂⠴⠦`). */
export const LEADING_TITLE_DECOR_RE = /^[\s✳✶✷✸✦✧❋⁕∗＊◆◇●○•‣▪▫◦★☆⭐⠀-⣿]+/
