import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getSiteConfigMemoryFirstMock } = vi.hoisted(() => ({
  getSiteConfigMemoryFirstMock: vi.fn(),
}))

vi.mock('@/lib/site-config-cache', () => ({
  getSiteConfigMemoryFirst: getSiteConfigMemoryFirstMock,
}))

import robots from './robots'

beforeEach(() => {
  vi.stubEnv('SITE_URL', 'https://apograss.cn')
  getSiteConfigMemoryFirstMock.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('robots', () => {
  it('索引开启时 allow 全站并引用 sitemap', async () => {
    getSiteConfigMemoryFirstMock.mockResolvedValue({ searchEngineIndexingEnabled: true })
    const result = await robots()
    expect(result.rules).toEqual({ userAgent: '*', allow: '/' })
    expect(result.sitemap).toBe('https://apograss.cn/sitemap.xml')
  })

  it('索引关闭时 disallow 全站', async () => {
    getSiteConfigMemoryFirstMock.mockResolvedValue({ searchEngineIndexingEnabled: false })
    const result = await robots()
    expect(result.rules).toEqual({ userAgent: '*', disallow: '/' })
  })

  it('配置不可读时按开启处理', async () => {
    getSiteConfigMemoryFirstMock.mockRejectedValue(new Error('unavailable'))
    const result = await robots()
    expect(result.rules).toEqual({ userAgent: '*', allow: '/' })
    expect(result.sitemap).toBe('https://apograss.cn/sitemap.xml')
  })
})
