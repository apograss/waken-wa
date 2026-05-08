export type SkillsMode = 'oauth' | 'apikey'

export interface LlmEndpoints {
  llmBase: string
  direct: string
  markdown: string
  settingsCore: string
  settingsTheme: string
  settingsSchedule: string
  settingsRules: string
  appsExport: string
  oauthExchange: string
  legacyMcp: string
  legacyMcpApiKeyVerify: string
}
