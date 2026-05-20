'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { buildSearchUrl, DEFAULT_SEARCH_ENGINES, LOCALSTORAGE_KEYS, type SearchEngine } from './constants';

export function HeroSearch() {
  const [query, setQuery] = useState('');
  const [currentEngine, setCurrentEngine] = useState<SearchEngine>(DEFAULT_SEARCH_ENGINES[1]); // bing
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCALSTORAGE_KEYS.preferredEngine);
      if (saved) {
        const engine = DEFAULT_SEARCH_ENGINES.find((e) => e.id === saved);
        if (engine) setCurrentEngine(engine);
      }
    } catch { /* */ }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        const index = parseInt(e.key, 10) - 1;
        if (index < DEFAULT_SEARCH_ENGINES.length) {
          handleEngineSelect(DEFAULT_SEARCH_ENGINES[index]);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEngineSelect = useCallback((engine: SearchEngine) => {
    setCurrentEngine(engine);
    try { localStorage.setItem(LOCALSTORAGE_KEYS.preferredEngine, engine.id); } catch { /* */ }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    window.location.href = buildSearchUrl(currentEngine, trimmed);
  };

  return (
    <>
      <form className="search" onSubmit={handleSubmit}>
        <button type="button" className="search-engine-btn" aria-label="切换搜索引擎">
          <img src={currentEngine.icon} alt={currentEngine.id} width={22} height={22} style={{ filter: 'brightness(0.3)' }} />
        </button>
        <input
          ref={inputRef}
          className="search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="今天搜什么？"
          autoComplete="off"
        />
        <span className="search-hint">
          <kbd>⌥</kbd><kbd>1–6</kbd> 切引擎
        </span>
      </form>

      <div className="engine-row">
        {DEFAULT_SEARCH_ENGINES.map((engine, index) => (
          <span
            key={engine.id}
            className={`e ${engine.id === currentEngine.id ? 'active' : ''}`}
            onClick={() => handleEngineSelect(engine)}
          >
            <span className="k">⌥{index + 1}</span>
            {engine.id === 'baidu' && '百度'}
            {engine.id === 'bing' && '必应'}
            {engine.id === 'google' && '谷歌'}
            {engine.id === 'yandex' && 'Yandex'}
            {engine.id === 'sogou' && '搜狗'}
            {engine.id === '360' && '360'}
          </span>
        ))}
      </div>
    </>
  );
}
