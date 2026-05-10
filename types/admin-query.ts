export type SuccessResponse<T> = {
  success?: boolean
  data?: T
  error?: string
}

export type DevicesResponse = SuccessResponse<Array<Record<string, unknown>>>

export type AdminSkillsData = {
  enabled?: boolean
  authMode?: unknown
  apiKeyConfigured?: boolean
  oauthConfigured?: boolean
  oauthTokenTtlMinutes?: unknown
  aiAuthorizations?: unknown
  generatedApiKey?: string | null
  legacyMcpConfigured?: boolean
  generatedLegacyMcpApiKey?: string | null
}

export type PaginationResponse = {
  total?: number
}
