'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

import type { HomepageReusedSectionProps } from './homepage-reused-section'

// 首屏外区块按需加载：只有当用户滚动接近时才下载并挂载这部分 JS，
// 避免首屏一次性拉取全部 chunk（含「此刻/live」SSE、灵感、博客）。
const HomepageReusedSection = dynamic(
  () => import('./homepage-reused-section').then((m) => m.HomepageReusedSection),
  { ssr: false },
)

export function HomeBelowTheFold(props: HomepageReusedSectionProps) {
  const [show, setShow] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (show) return
    const el = sentinelRef.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      const timer = setTimeout(() => setShow(true), 0)
      return () => clearTimeout(timer)
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShow(true)
          observer.disconnect()
        }
      },
      // 提前 800px 预加载，滚到之前就挂载好，减少可见的布局跳动。
      { rootMargin: '800px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [show])

  if (show) {
    return <HomepageReusedSection {...props} />
  }

  // 占位：撑出可滚动高度以触发懒加载，并避免内容挂载时页面高度突变。
  return <div ref={sentinelRef} aria-hidden style={{ minHeight: '60vh' }} />
}
