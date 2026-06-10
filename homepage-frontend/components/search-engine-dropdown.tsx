'use client';

import { useEffect, useRef } from 'react';

import type { SearchEngine } from './constants';

interface SearchEngineDropdownProps {
  engines: SearchEngine[];
  currentEngine: SearchEngine;
  onSelect: (engine: SearchEngine) => void;
  onClose: () => void;
}

export function SearchEngineDropdown({
  engines,
  currentEngine,
  onSelect,
  onClose,
}: SearchEngineDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Close on Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-2 w-64 rounded-xl bg-background/95 backdrop-blur-lg border border-border/40 shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50"
    >
      <div className="py-2">
        {engines.map((engine, index) => (
          <button
            key={engine.id}
            onClick={() => onSelect(engine)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors ${
              engine.id === currentEngine.id ? 'bg-muted/30' : ''
            }`}
          >
            <img
              src={engine.icon}
              alt={engine.id}
              className="w-5 h-5 flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="text-sm text-foreground flex-1 text-left">
              {engine.id === 'baidu' && '百度'}
              {engine.id === 'bing' && '必应'}
              {engine.id === 'google' && '谷歌'}
              {engine.id === 'yandex' && 'Yandex'}
              {engine.id === 'sogou' && '搜狗搜索'}
              {engine.id === '360' && '360 搜索'}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              ⌥ {index + 1}
            </span>
          </button>
        ))}
      </div>

      {/* Preferences entry */}
      <div className="border-t border-border/30 py-2">
        <button
          onClick={() => {
            // TODO: Open preferences panel
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
        >
          <svg
            className="w-5 h-5 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
          <span className="text-sm text-muted-foreground">搜索引擎偏好</span>
        </button>
      </div>
    </div>
  );
}
