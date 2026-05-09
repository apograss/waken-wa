export type MediaPlaySourceRuleAction = 'block' | 'rename'

export type MediaPlaySourceRule = {
  source: string
  action: MediaPlaySourceRuleAction
  displayName?: string
  default?: boolean
}

export type MediaPlaySourceRuleMatch =
  | { action: 'block'; rule: MediaPlaySourceRule }
  | { action: 'rename'; displayName: string; rule: MediaPlaySourceRule }

function parseMaybeJsonRecord(value: string): unknown {
  const trimmed = value.trim()
  if (!trimmed.startsWith('{')) return value
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

export function normalizeMediaPlaySource(value: unknown): string {
  return String(value ?? '').trim().toLowerCase()
}

function normalizeAction(value: unknown): MediaPlaySourceRuleAction {
  const raw = String(value ?? '').trim().toLowerCase()
  return raw === 'rename' || raw === 'override' || raw === 'rewrite' ? 'rename' : 'block'
}

function readRuleSource(record: Record<string, unknown>): string {
  return normalizeMediaPlaySource(record.source ?? record.match ?? record.play_source ?? record.value)
}

function normalizeRule(raw: unknown): MediaPlaySourceRule | null {
  if (typeof raw === 'string') {
    const parsed = parseMaybeJsonRecord(raw)
    if (parsed !== raw) return normalizeRule(parsed)
    const source = normalizeMediaPlaySource(raw)
    return source ? { source, action: 'block', default: true } : null
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const record = raw as Record<string, unknown>
  const source = readRuleSource(record)
  if (!source) return null

  const action = normalizeAction(record.action ?? record.mode)
  const displayNameRaw = record.displayName ?? record.name ?? record.overrideName ?? record.rewrite
  const displayName = typeof displayNameRaw === 'string' ? displayNameRaw.trim() : ''

  return {
    source,
    action,
    ...(action === 'rename' && displayName ? { displayName } : {}),
    ...(record.default === true ? { default: true } : {}),
  }
}

export function normalizeMediaPlaySourceRules(
  rules: unknown,
  legacyBlocklist?: unknown,
): MediaPlaySourceRule[] {
  const out: MediaPlaySourceRule[] = []
  const seen = new Set<string>()

  const push = (rule: MediaPlaySourceRule | null) => {
    if (!rule) return
    const key = rule.source
    if (seen.has(key)) return
    seen.add(key)
    out.push(rule)
  }

  if (Array.isArray(rules)) {
    for (const item of rules) {
      push(normalizeRule(item))
    }
  }

  if (Array.isArray(legacyBlocklist)) {
    for (const item of legacyBlocklist) {
      push(normalizeRule(item))
    }
  }

  return out
}

export function mediaPlaySourceBlocklistFromRules(rules: unknown): string[] {
  return normalizeMediaPlaySourceRules(rules)
    .filter((rule) => rule.action === 'block')
    .map((rule) => rule.source)
}

export function findMediaPlaySourceRuleMatch(
  metadata: Record<string, unknown> | null | undefined,
  rules: unknown,
  legacyBlocklist?: unknown,
): MediaPlaySourceRuleMatch | null {
  const source = normalizeMediaPlaySource(metadata?.play_source)
  if (!source) return null

  const rule = normalizeMediaPlaySourceRules(rules, legacyBlocklist).find(
    (item) => item.source === source,
  )
  if (!rule) return null

  if (rule.action === 'rename') {
    const displayName = String(rule.displayName ?? '').trim()
    if (!displayName) return null
    return { action: 'rename', displayName, rule }
  }
  return { action: 'block', rule }
}

export function applyMediaPlaySourceRulesToMetadata(
  metadata: Record<string, unknown> | null,
  rules: unknown,
  legacyBlocklist?: unknown,
): Record<string, unknown> | null {
  if (!metadata) return metadata
  const match = findMediaPlaySourceRuleMatch(metadata, rules, legacyBlocklist)
  if (!match) return metadata

  if (match.action === 'rename') {
    return {
      ...metadata,
      play_source_name: match.displayName,
    }
  }

  if (!Object.prototype.hasOwnProperty.call(metadata, 'media')) return metadata
  const { media: _omit, ...rest } = metadata
  return rest
}
