'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { HomepageSearchEngineId } from '@/types/homepage-settings'

import {
  buildSearchUrl,
  DEFAULT_SEARCH_ENGINES,
  LOCALSTORAGE_KEYS,
  type SearchEngine,
} from './constants'

type HeroSearchProps = {
  defaultEngineId: HomepageSearchEngineId
  visibleEngineIds: HomepageSearchEngineId[]
}

const ENGINE_LABELS: Record<HomepageSearchEngineId, string> = {
  baidu: '百度',
  bing: '必应',
  google: '谷歌',
  yandex: 'Yandex',
  sogou: '搜狗',
  '360': '360',
}

function ResolveEngines(visibleEngineIds: readonly HomepageSearchEngineId[]): SearchEngine[] {
  const visible = new Set(visibleEngineIds)
  const engines = DEFAULT_SEARCH_ENGINES.filter((engine) => visible.has(engine.id))
  return engines.length > 0 ? [...engines] : [...DEFAULT_SEARCH_ENGINES]
}

export function HeroSearch({
  defaultEngineId,
  visibleEngineIds,
}: HeroSearchProps) {
  const [query, setQuery] = useState('')
  const [selectedEngineId, setSelectedEngineId] =
    useState<HomepageSearchEngineId>(defaultEngineId)
  const [altKeyLabel, setAltKeyLabel] = useState('Alt')
  const inputRef = useRef<HTMLInputElement>(null)
  const engines = useMemo(() => ResolveEngines(visibleEngineIds), [visibleEngineIds])
  const fallbackEngine =
    engines.find((engine) => engine.id === defaultEngineId) ?? engines[0] ?? DEFAULT_SEARCH_ENGINES[1]
  const currentEngine =
    engines.find((engine) => engine.id === selectedEngineId) ?? fallbackEngine

  const handleEngineSelect = useCallback((engine: SearchEngine) => {
    setSelectedEngineId(engine.id)
    try {
      localStorage.setItem(LOCALSTORAGE_KEYS.preferredEngine, engine.id)
    } catch {
      // localStorage may be unavailable in hardened browser modes.
    }
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCALSTORAGE_KEYS.preferredEngine)
      if (!saved) return
      const engine = engines.find((item) => item.id === saved)
      if (engine) {
        setSelectedEngineId(engine.id)
      }
    } catch {
      // localStorage may be unavailable in hardened browser modes.
    }
  }, [engines])

  useEffect(() => {
    if (/Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent)) {
      setAltKeyLabel('⌥')
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // event.code 不受键盘布局/输入法影响：Mac 上 Option+数字会让
      // event.key 变成特殊字符（¡™£…），用物理键位才能跨平台生效。
      if (!event.altKey || event.ctrlKey || event.metaKey) return
      const match = /^(?:Digit|Numpad)([1-9])$/.exec(event.code)
      if (!match) return
      const engine = engines[parseInt(match[1], 10) - 1]
      if (!engine) return
      event.preventDefault()
      handleEngineSelect(engine)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [engines, handleEngineSelect])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    window.location.href = buildSearchUrl(currentEngine, trimmed)
  }

  const shortcutHint = engines.length > 1 ? `1-${engines.length}` : '1'

  return (
    <>
      <form className="search" onSubmit={handleSubmit}>
        <button type="button" className="search-engine-btn" aria-label="切换搜索引擎">
          <Image
            src={currentEngine.icon}
            alt={currentEngine.id}
            width={22}
            height={22}
            unoptimized
          />
        </button>
        <input
          ref={inputRef}
          className="search-input"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="今天搜什么？"
          autoComplete="off"
        />
        <span className="search-hint">
          <kbd>{altKeyLabel}</kbd>
          <kbd>{shortcutHint}</kbd> 切引擎
        </span>
      </form>

      <div className="engine-row">
        {engines.map((engine, index) => (
          <button
            key={engine.id}
            type="button"
            className={`e ${engine.id === currentEngine.id ? 'active' : ''}`}
            onClick={() => handleEngineSelect(engine)}
          >
            <span className="k">{altKeyLabel}{index + 1}</span>
            {ENGINE_LABELS[engine.id]}
          </button>
        ))}
      </div>
    </>
  )
}
