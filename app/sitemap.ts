import type { MetadataRoute } from 'next'

import { db } from '@/lib/db'
import { inspirationEntries } from '@/lib/drizzle-schema'
import { getSiteConfigMemoryFirst } from '@/lib/site-config-cache'
import { absoluteUrl } from '@/lib/site-url'

export const dynamic = 'force-dynamic'

type InspirationSitemapRow = {
  id: number
  createdAt: Date | string | null
  updatedAt: Date | string | null
}

function toDate(value: Date | string | null | undefined): Date | undefined {
  if (!value) return undefined
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

async function isIndexingEnabled(): Promise<boolean> {
  try {
    const config = await getSiteConfigMemoryFirst()
    // 仅显式关闭时禁用；读取异常按开启处理。
    return config?.searchEngineIndexingEnabled !== false
  } catch {
    return true
  }
}

async function fetchInspirationRows(): Promise<InspirationSitemapRow[]> {
  try {
    const rows = await db
      .select({
        id: inspirationEntries.id,
        createdAt: inspirationEntries.createdAt,
        updatedAt: inspirationEntries.updatedAt,
      })
      .from(inspirationEntries)
    return rows as InspirationSitemapRow[]
  } catch (error) {
    console.error('生成 sitemap 时查询灵感条目失败，回落为仅静态路由:', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!(await isIndexingEnabled())) {
    return []
  }

  const now = new Date()
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: absoluteUrl('/inspiration'), lastModified: now, changeFrequency: 'daily', priority: 0.8 },
  ]

  const rows = await fetchInspirationRows()
  const dynamicRoutes: MetadataRoute.Sitemap = rows.map((row) => ({
    url: absoluteUrl(`/inspiration/${row.id}`),
    lastModified: toDate(row.updatedAt) ?? toDate(row.createdAt) ?? now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...dynamicRoutes]
}
