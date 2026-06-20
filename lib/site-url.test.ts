import { afterEach, describe, expect, it, vi } from 'vitest'

import { absoluteUrl, getSiteBaseUrl } from './site-url'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getSiteBaseUrl', () => {
  it('优先使用 SITE_URL', () => {
    vi.stubEnv('SITE_URL', 'https://apograss.cn')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://other.example.com')
    expect(getSiteBaseUrl()).toBe('https://apograss.cn')
  })

  it('SITE_URL 缺失时回落到 NEXT_PUBLIC_SITE_URL', () => {
    vi.stubEnv('SITE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://public.example.com')
    expect(getSiteBaseUrl()).toBe('https://public.example.com')
  })

  it('两者皆缺时返回默认 https://apograss.cn', () => {
    vi.stubEnv('SITE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    expect(getSiteBaseUrl()).toBe('https://apograss.cn')
  })

  it('去除首尾空白', () => {
    vi.stubEnv('SITE_URL', '  https://apograss.cn  ')
    expect(getSiteBaseUrl()).toBe('https://apograss.cn')
  })

  it('去除所有尾斜杠', () => {
    vi.stubEnv('SITE_URL', 'https://apograss.cn/')
    expect(getSiteBaseUrl()).toBe('https://apograss.cn')
    vi.stubEnv('SITE_URL', 'https://apograss.cn///')
    expect(getSiteBaseUrl()).toBe('https://apograss.cn')
  })
})

describe('absoluteUrl', () => {
  it('"/x" 与 "x" 等价，单斜杠拼接', () => {
    vi.stubEnv('SITE_URL', 'https://apograss.cn')
    expect(absoluteUrl('/sitemap.xml')).toBe('https://apograss.cn/sitemap.xml')
    expect(absoluteUrl('sitemap.xml')).toBe('https://apograss.cn/sitemap.xml')
  })

  it('去除 path 前导多斜杠', () => {
    vi.stubEnv('SITE_URL', 'https://apograss.cn')
    expect(absoluteUrl('///inspiration')).toBe('https://apograss.cn/inspiration')
  })

  it('空 path 返回 base', () => {
    vi.stubEnv('SITE_URL', 'https://apograss.cn')
    expect(absoluteUrl('')).toBe('https://apograss.cn')
  })

  it('结果始终以 base 为前缀且不含重复斜杠', () => {
    vi.stubEnv('SITE_URL', 'https://apograss.cn/')
    const url = absoluteUrl('/inspiration/12')
    expect(url.startsWith('https://apograss.cn')).toBe(true)
    expect(url.replace('https://', '')).not.toContain('//')
  })
})
