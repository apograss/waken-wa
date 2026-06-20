import 'server-only'

/**
 * 站点规范基础 URL（canonical base URL）。
 * 用于 sitemap、robots、metadataBase 等所有需要绝对地址的场景。
 *
 * 优先级：SITE_URL > NEXT_PUBLIC_SITE_URL > https://apograss.cn
 * 结果会去除首尾空白与所有尾斜杠。
 */

const DEFAULT_SITE_URL = 'https://apograss.cn'

export function getSiteBaseUrl(): string {
  const raw =
    (process.env.SITE_URL ?? '').trim() ||
    (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim() ||
    DEFAULT_SITE_URL
  return raw.replace(/\/+$/, '')
}

/**
 * 把站内路径拼成绝对 URL。`'/x'` 与 `'x'` 等价，空字符串返回 base。
 */
export function absoluteUrl(path: string): string {
  const base = getSiteBaseUrl()
  const trimmed = path.replace(/^\/+/, '')
  return trimmed ? `${base}/${trimmed}` : base
}
