'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  buildSearchUrl,
  DEFAULT_SEARCH_ENGINES,
  LOCALSTORAGE_KEYS,
  type SearchEngine,
} from './constants';
import { SearchEngineDropdown } from './search-engine-dropdown';

export function SearchBox() {
  const [query, setQuery] = useState('');
  const [currentEngine, setCurrentEngine] = useState<SearchEngine>(DEFAULT_SEARCH_ENGINES[1]); // default: bing
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEngineSelect = useCallback((engine: SearchEngine) => {
    setCurrentEngine(engine);
    setDropdownOpen(false);
    try {
      localStorage.setItem(LOCALSTORAGE_KEYS.preferredEngine, engine.id);
    } catch {
      // localStorage unavailable
    }
    inputRef.current?.focus();
  }, []);

  // Load preference from localStorage
  useEffect(() => {
    let timeoutId: number | undefined
    try {
      const saved = localStorage.getItem(LOCALSTORAGE_KEYS.preferredEngine);
      if (saved) {
        const engine = DEFAULT_SEARCH_ENGINES.find((e) => e.id === saved);
        if (engine) {
          timeoutId = window.setTimeout(() => setCurrentEngine(engine), 0);
        }
      }
    } catch {
      // localStorage unavailable, use default
    }
    return () => {
      if (typeof timeoutId === 'number') {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  // Keyboard shortcuts: Option+1 through Option+6
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
  }, [handleEngineSelect]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    const url = buildSearchUrl(currentEngine, trimmed);
    window.location.href = url;
  };

  return (
    <div className="relative w-full max-w-lg">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        {/* Engine icon button */}
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="absolute left-3 z-10 flex items-center justify-center w-7 h-7 rounded-md hover:bg-muted/50 transition-colors"
          aria-label="Switch search engine"
        >
          <img
            src={currentEngine.icon}
            alt={currentEngine.id}
            className="w-5 h-5"
            onError={(e) => {
              // Fallback if icon fails to load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </button>

        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索..."
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-background/40 backdrop-blur-md border border-border/30 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all text-base"
          autoComplete="off"
        />
      </form>

      {/* Dropdown */}
      {dropdownOpen && (
        <SearchEngineDropdown
          engines={DEFAULT_SEARCH_ENGINES}
          currentEngine={currentEngine}
          onSelect={handleEngineSelect}
          onClose={() => setDropdownOpen(false)}
        />
      )}
    </div>
  );
}
