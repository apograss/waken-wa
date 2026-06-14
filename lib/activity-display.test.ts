import { describe, expect, it } from 'vitest'

import { cleanActivityTitle, prettifyAppName } from './activity-display'
import { getMediaDisplay } from './activity-media'

describe('prettifyAppName', () => {
  it('maps raw process names to visitor-friendly app labels', () => {
    expect(prettifyAppName('msedge.exe')).toBe('Edge')
    expect(prettifyAppName('WindowsTerminal.exe')).toBe('Windows Terminal')
    expect(prettifyAppName('ApplicationFrameHost.exe')).toBe('Application Frame Host')
    expect(prettifyAppName('ShellHost')).toBe('Shell Host')
  })

  it('keeps known CJK app aliases readable', () => {
    expect(prettifyAppName('cloudmusic.exe')).toBe('网易云音乐')
    expect(prettifyAppName('explorer.exe')).toBe('文件资源管理器')
  })
})

describe('cleanActivityTitle', () => {
  it('strips leading reporter decoration without touching the real title', () => {
    expect(cleanActivityTitle('✳ Claude Code')).toBe('Claude Code')
    expect(cleanActivityTitle(' ⣿⣿ 正在写论文')).toBe('正在写论文')
  })
})

describe('getMediaDisplay title cleanup', () => {
  it('removes trailing browser/player suffixes from media titles', () => {
    expect(
      getMediaDisplay({
        media: {
          title: '当一群UP再次穿越回二战【超长抢先看】_哔哩哔哩_bilibili',
        },
      })?.title,
    ).toBe('当一群UP再次穿越回二战【超长抢先看】')

    expect(
      getMediaDisplay({
        media: {
          title: 'Some Video - YouTube',
        },
      })?.title,
    ).toBe('Some Video')
  })
})
