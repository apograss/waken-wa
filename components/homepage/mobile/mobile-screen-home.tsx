'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { navigateTopLevel } from '@/lib/embed'
import type { HomepageSearchEngineId } from '@/types/homepage-settings'

import {
  buildSearchUrl,
  DEFAULT_SEARCH_ENGINES,
  getTimePeriod,
  LOCALSTORAGE_KEYS,
  type SearchEngine,
} from '../constants'

const ENGINE_LABELS: Record<HomepageSearchEngineId, string> = {
  baidu: '百度',
  bing: '必应',
  google: '谷歌',
  yandex: 'Yandex',
  sogou: '搜狗',
  '360': '360',
}

const GREETINGS: Record<'morning' | 'afternoon' | 'evening', { cn: string; en: string }> = {
  morning: { cn: '早上好', en: 'GOOD MORNING' },
  afternoon: { cn: '下午好', en: 'GOOD AFTERNOON' },
  evening: { cn: '晚上好', en: 'GOOD EVENING' },
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

interface WeatherState {
  temp: number
  description: string
  city: string
  feelsLike?: number
  lat: number
  lon: number
}
interface HourlyEntry {
  utcIso: string
  temp: number
}

function resolveEngines(visible: readonly HomepageSearchEngineId[]): SearchEngine[] {
  const set = new Set(visible)
  const list = DEFAULT_SEARCH_ENGINES.filter((e) => set.has(e.id))
  return list.length > 0 ? [...list] : [...DEFAULT_SEARCH_ENGINES]
}

export interface MobileScreenHomeProps {
  userName: string
  userNote: string | null | undefined
  weatherEnabled: boolean
  backgroundImage: string
  defaultEngine: HomepageSearchEngineId
  visibleEngines: HomepageSearchEngineId[]
}

export function MobileScreenHome({
  userName,
  userNote,
  weatherEnabled,
  backgroundImage,
  defaultEngine,
  visibleEngines,
}: MobileScreenHomeProps) {
  const [now, setNow] = useState(() => new Date())
  const [weather, setWeather] = useState<WeatherState | null>(null)
  const [hourly, setHourly] = useState<HourlyEntry[] | null>(null)
  const [weatherOpen, setWeatherOpen] = useState(false)
  const [engineOpen, setEngineOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [engineId, setEngineId] = useState<HomepageSearchEngineId>(defaultEngine)
  const weatherRef = useRef<HTMLDivElement>(null)

  const engines = resolveEngines(visibleEngines)
  const currentEngine = engines.find((e) => e.id === engineId) ?? engines[0] ?? DEFAULT_SEARCH_ENGINES[1]

  // 时钟
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  // 引擎偏好
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCALSTORAGE_KEYS.preferredEngine)
      if (saved && engines.some((e) => e.id === saved)) {
        setEngineId(saved as HomepageSearchEngineId)
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 天气
  useEffect(() => {
    if (!weatherEnabled) return
    let cancelled = false
    ;(async () => {
      try {
        const geoRes = await fetch('/api/homepage/geolocation')
        if (!geoRes.ok) return
        const geo = await geoRes.json()
        if (geo.error) return
        const wRes = await fetch(`/api/homepage/weather?lat=${geo.lat}&lon=${geo.lon}`)
        if (!wRes.ok) return
        const data = await wRes.json()
        if (data.error || cancelled) return
        setWeather({
          temp: data.temp,
          description: data.description,
          city: geo.city,
          feelsLike: data.feelsLike,
          lat: geo.lat,
          lon: geo.lon,
        })
      } catch {
        /* silent */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [weatherEnabled])

  // 打开天气浮层时拉小时预报
  useEffect(() => {
    if (!weatherOpen || !weather || hourly) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/homepage/weather/hourly?lat=${weather.lat}&lon=${weather.lon}`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data?.hourly) setHourly(data.hourly.slice(0, 6))
      } catch {
        /* silent */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [weatherOpen, weather, hourly])

  // 点外部关闭天气浮层
  useEffect(() => {
    if (!weatherOpen) return
    const handler = (e: MouseEvent) => {
      if (weatherRef.current && !weatherRef.current.contains(e.target as Node)) setWeatherOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [weatherOpen])

  const selectEngine = useCallback((e: SearchEngine) => {
    setEngineId(e.id)
    setEngineOpen(false)
    try {
      localStorage.setItem(LOCALSTORAGE_KEYS.preferredEngine, e.id)
    } catch {
      /* ignore */
    }
  }, [])

  const submit = useCallback(() => {
    const trimmed = query.trim()
    if (!trimmed) return
    navigateTopLevel(buildSearchUrl(currentEngine, trimmed))
  }, [query, currentEngine])

  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const dateLine = `${now.getMonth() + 1}/${now.getDate()} ${WEEKDAYS[now.getDay()]}`
  const greet = GREETINGS[getTimePeriod(now.getHours())]
  const quote = (userNote ?? '').trim()

  return (
    <section className="m-screen m-home" data-screen="home">
      <div className="m-home-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={backgroundImage} alt="" />
        <div className="g1" />
        <div className="g2" />
        <div className="g3" />
      </div>

      {/* 顶栏：时钟 + 天气 */}
      <div className="m-topbar">
        <div className="m-clock">
          <span className="m-clock-bar" />
          <span className="m-mono m-clock-hm">{hh}:{mm}</span>
          <span className="m-mono m-clock-date">{dateLine}</span>
        </div>
        {weatherEnabled && weather ? (
          <div ref={weatherRef} style={{ position: 'relative' }}>
            <button type="button" className="m-weather-btn" onClick={() => setWeatherOpen((v) => !v)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.7" strokeLinecap="round"><path d="M17 17a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.5 1.5A3.5 3.5 0 0 0 7 17z" /></svg>
              <span className="m-mono m-weather-temp">{weather.temp}°</span>
              <span className="m-weather-city">{weather.city}</span>
            </button>
            {weatherOpen ? (
              <div className="m-weather-pop">
                <div className="m-weather-pop-head">
                  <div>
                    <div className="m-weather-pop-city">{weather.city}</div>
                    <div className="m-weather-pop-desc">
                      {weather.description}
                      {weather.feelsLike !== undefined ? ` · 体感 ${weather.feelsLike}°` : ''}
                    </div>
                  </div>
                  <div className="m-weather-pop-temp">{weather.temp}°</div>
                </div>
                {hourly && hourly.length > 0 ? (
                  <div className="m-weather-hourly">
                    {hourly.map((h) => {
                      const d = new Date(h.utcIso)
                      return (
                        <div key={h.utcIso} className="m-weather-h">
                          <span className="m-mono m-weather-h-t">{String(d.getHours()).padStart(2, '0')}:00</span>
                          <span className="m-mono m-weather-h-deg">{h.temp}°</span>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* 问候 + 搜索 + 金句 */}
      <div className="m-home-center">
        <div className="m-mono m-greet-en">{greet.en}</div>
        <h1 className="m-greet-cn">{greet.cn}</h1>

        <div className="m-search-wrap">
          <div className="m-search">
            <button type="button" className="m-search-engine" onClick={() => setEngineOpen((v) => !v)} aria-label="切换搜索引擎">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="m-search-engine-ic" src={currentEngine.icon} alt={currentEngine.id} />
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--soft)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            <span className="m-search-sep" />
            <input
              className="m-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
              placeholder="今天搜什么？"
              autoComplete="off"
            />
            <button type="button" className="m-search-submit" onClick={submit} aria-label="搜索">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </div>
          {engineOpen ? (
            <>
              <div className="m-engine-backdrop" onClick={() => setEngineOpen(false)} />
              <div className="m-engine-menu">
                {engines.map((e) => (
                  <button key={e.id} type="button" className={`m-engine-row${e.id === currentEngine.id ? ' is-sel' : ''}`} onClick={() => selectEngine(e)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="m-engine-row-ic" src={e.icon} alt={e.id} />
                    <span className="m-engine-row-name">{ENGINE_LABELS[e.id]}</span>
                    {e.id === currentEngine.id ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}><path d="M5 12l5 5L20 7" /></svg>
                    ) : null}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {quote ? <p className="m-quote">「 {quote} 」</p> : null}
      </div>
    </section>
  )
}
