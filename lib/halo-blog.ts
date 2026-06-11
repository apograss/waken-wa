import 'server-only'

/**
 * Halo 博客（同机部署，对外地址 https://apograss.cn）公开内容 API 的最小封装。
 * 仅拉取已发布且 PUBLIC 可见的文章，失败时静默返回空数组，不影响首页渲染。
 */

const HALO_BASE_URL = (process.env.HALO_BASE_URL || 'https://apograss.cn').replace(/\/+$/, '')

export interface HaloBlogPost {
  title: string
  /** 绝对链接，指向博客文章页 */
  url: string
  /** ISO 时间 */
  publishTime: string | null
  excerpt: string
  /** 浏览量；缺失时为 null */
  visits: number | null
}

export function haloBlogHomeUrl(): string {
  return HALO_BASE_URL
}

export async function fetchRecentHaloBlogPosts(limit = 3): Promise<HaloBlogPost[]> {
  try {
    const url = `${HALO_BASE_URL}/apis/api.content.halo.run/v1alpha1/posts?page=1&size=${limit}`
    const response = await fetch(url, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return []

    const data = await response.json()
    const items: unknown[] = Array.isArray(data?.items) ? data.items : []

    const posts: HaloBlogPost[] = []
    for (const raw of items) {
      const item = raw as Record<string, any>
      const spec = item?.spec ?? {}
      const status = item?.status ?? {}
      const labels = item?.metadata?.labels ?? {}
      if (spec.deleted === true) continue
      if (labels['content.halo.run/published'] !== 'true') continue
      if (spec.visible && spec.visible !== 'PUBLIC') continue

      const title = String(spec.title ?? '').trim()
      const permalink = String(status.permalink ?? '').trim()
      if (!title || !permalink) continue

      let visits: number | null = null
      try {
        const stats = JSON.parse(item?.metadata?.annotations?.['content.halo.run/stats'] ?? '')
        if (typeof stats?.visit === 'number') visits = stats.visit
      } catch {
        // stats 注解缺失或格式变化时忽略
      }

      posts.push({
        title,
        url: permalink.startsWith('http') ? permalink : `${HALO_BASE_URL}${permalink}`,
        publishTime: spec.publishTime ? String(spec.publishTime) : null,
        excerpt: String(status.excerpt ?? '').trim(),
        visits,
      })
    }
    return posts
  } catch {
    return []
  }
}
