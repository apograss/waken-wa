import { APP_DISPLAY_ALIASES, LEADING_TITLE_DECOR_RE } from '@/constants/app-display'

const APP_EXT_RE = /\.(exe|app|lnk|bin|sh|bat|cmd|com)$/i
const CJK_RE = /[一-鿿]/

/**
 * Turn a raw reported process name into a friendly display label: strip the
 * executable extension, look up the alias table, otherwise split camelCase /
 * separators into spaced Title Case. Returns '' for empty input.
 */
export function prettifyAppName(raw: string | null | undefined): string {
  const name = (raw ?? '').trim()
  if (!name) return ''
  const base = name.replace(APP_EXT_RE, '')
  const alias = APP_DISPLAY_ALIASES[base.toLowerCase()]
  if (alias) return alias
  const spaced = base
    .replace(/[_.\-]+/g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
  if (!spaced) return base
  if (CJK_RE.test(spaced)) return spaced
  return spaced.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Strip leading decorative glyphs (e.g. `✳`) from a reported window title. */
export function cleanActivityTitle(raw: string | null | undefined): string {
  const title = (raw ?? '').trim()
  if (!title) return ''
  return title.replace(LEADING_TITLE_DECOR_RE, '').trim()
}
