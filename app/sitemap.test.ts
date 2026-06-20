import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock, getSiteConfigMemoryFirstMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  getSiteConfigMemoryFirstMock: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    select: () => ({ from: fromMock }),
  },
}))

vi.mock('@/lib/drizzle-schema', () => ({
  inspirationEntries: {},
}))

vi.mock('@/lib/site-config-cache', () => ({
  getSiteConfigMemoryFirst: getSiteConfigMemoryFirstMock,
}))

import sitemap from './sitemap'

beforeEach(() => {
  vi.stubEnv('SITE_URL', 'https://apograss.cn')
  fromMock.mockReset()
  getSiteConfigMemoryFirstMock.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('sitemap', () => {
  it('索引开启且有条目时，包含静态路由与全部灵感详情页', async () => {
    getSiteConfigMemoryFirstMock.mockResolvedValue({ searchEngineIndexingEnabled: true })
    fromMock.mockResolvedValue([
      { id: 1, createdAt: new Date('2025-01-01T00:00:00Z'), updatedAt: new Date('2025-02-01T00:00:00Z') },
      { id: 7, createdAt: new Date('2025-03-01T00:00:00Z'), updatedAt: null },
    ])

    const result = await sitemap()
    const urls = result.map((e) => e.url)

    expect(urls).toContain('https://apograss.cn')
    expect(urls).toContain('https://apograss.cn/inspiration')
    expect(urls).toContain('https://apograss.cn/inspiration/1')
    expect(urls).toContain('https://apograss.cn/inspiration/7')
    // 全部 url 以规范 base 为前缀
    for (const url of urls) {
      expect(url.startsWith('https://apograss.cn')).toBe(true)
    }
    // lastModified = updatedAt ?? createdAt
    const entry7 = result.find((e) => e.url === 'https://apograss.cn/inspiration/7')
    expect(entry7?.lastModified).toEqual(new Date('2025-03-01T00:00:00Z'))
  })

  it('索引关闭时返回空数组', async () => {
    getSiteConfigMemoryFirstMock.mockResolvedValue({ searchEngineIndexingEnabled: false })
    fromMock.mockResolvedValue([{ id: 1, createdAt: new Date(), updatedAt: null }])

    const result = await sitemap()
    expect(result).toEqual([])
  })

  it('DB 抛错时仅返回静态路由且不抛错', async () => {
    getSiteConfigMemoryFirstMock.mockResolvedValue({ searchEngineIndexingEnabled: true })
    fromMock.mockRejectedValue(new Error('db down'))

    const result = await sitemap()
    const urls = result.map((e) => e.url)

    expect(urls).toEqual(['https://apograss.cn', 'https://apograss.cn/inspiration'])
  })

  it('配置读取异常时按开启处理', async () => {
    getSiteConfigMemoryFirstMock.mockRejectedValue(new Error('config unavailable'))
    fromMock.mockResolvedValue([{ id: 3, createdAt: new Date(), updatedAt: null }])

    const result = await sitemap()
    const urls = result.map((e) => e.url)
    expect(urls).toContain('https://apograss.cn/inspiration/3')
  })

  it('动态条目数与行数一一对应（无遗漏无重复）', async () => {
    getSiteConfigMemoryFirstMock.mockResolvedValue({ searchEngineIndexingEnabled: true })
    const ids = [11, 22, 33, 44]
    fromMock.mockResolvedValue(
      ids.map((id) => ({ id, createdAt: new Date(), updatedAt: null })),
    )

    const result = await sitemap()
    const dynamicIds = result
      .map((e) => e.url)
      .filter((u) => /\/inspiration\/\d+$/.test(u))
      .map((u) => Number(u.split('/').pop()))

    expect(new Set(dynamicIds)).toEqual(new Set(ids))
    expect(dynamicIds.length).toBe(ids.length)
  })
})
