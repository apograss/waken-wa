import type { MetadataRoute } from 'next'

import { getSiteConfigMemoryFirst } from '@/lib/site-config-cache'
import { absoluteUrl } from '@/lib/site-url'

export const dynamic = 'force-dynamic'

async function isIndexingEnabled(): Promise<boolean> {
  try {
    const config = await getSiteConfigMemoryFirst()
    // 仅显式关闭时禁用；读取异常按开启处理。
    return config?.searchEngineIndexingEnabled !== false
  } catch {
    return true
  }
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (!(await isIndexingEnabled())) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    }
  }

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  }
}
