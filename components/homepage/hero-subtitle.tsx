'use client'

import { useEffect, useState } from 'react'

import type { HomepageGreetingSource } from '@/types/homepage-settings'

type HeroSubtitleProps = {
  customText: string
  source: HomepageGreetingSource
}

export function HeroSubtitle({ customText, source }: HeroSubtitleProps) {
  const [hitokotoText, setHitokotoText] = useState('')

  useEffect(() => {
    if (source !== 'hitokoto') return

    async function load() {
      try {
        const res = await fetch('https://v1.hitokoto.cn/?c=d&c=i&c=k&encode=json')
        if (res.ok) {
          const data = await res.json()
          setHitokotoText(String(data.hitokoto || '').trim())
        }
      } catch {
        // Hitokoto is optional; keep the hero stable when it is unavailable.
      }
    }

    void load()
  }, [source])

  const text = source === 'custom' ? customText.trim() : hitokotoText

  if (!text) return <p className="hero-subtitle">&nbsp;</p>

  return <p className="hero-subtitle">{text}</p>
}
