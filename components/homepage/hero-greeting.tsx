'use client'

import { useState } from 'react'

import { getTimePeriod } from './constants'

const GREETINGS: Record<string, string> = {
  morning: '早上好',
  afternoon: '下午好',
  evening: '晚上好',
}

function ResolveGreeting(): string {
  const hour = new Date().getHours()
  return GREETINGS[getTimePeriod(hour)]
}

export function HeroGreeting() {
  const [greeting] = useState(ResolveGreeting)

  return <h1 className="hero-greeting">{greeting || '\u00A0'}</h1>
}
