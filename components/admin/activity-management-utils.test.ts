import { describe, expect, it } from 'vitest'

import {
  BuildActivityAppsExportFileName,
  NormalizeActivityHistoryAppRows,
  NormalizeActivityHistoryPlaySourceRows,
} from './activity-management-utils'

describe('NormalizeActivityHistoryAppRows', () => {
  it('preserves trimmed process names and ISO timestamps', () => {
    expect(
      NormalizeActivityHistoryAppRows([
        {
          processName: '  Code.exe  ',
          lastSeenAt: '2026-06-12T04:05:06.000Z',
        },
      ]),
    ).toEqual([
      {
        processName: 'Code.exe',
        lastSeenAt: '2026-06-12T04:05:06.000Z',
      },
    ])
  })

  it('filters empty process names', () => {
    expect(
      NormalizeActivityHistoryAppRows([
        { processName: '', lastSeenAt: '2026-06-12T04:05:06.000Z' },
        { processName: '   ', lastSeenAt: '2026-06-12T04:05:06.000Z' },
        { processName: null, lastSeenAt: '2026-06-12T04:05:06.000Z' },
      ]),
    ).toEqual([])
  })
})

describe('NormalizeActivityHistoryPlaySourceRows', () => {
  it('normalizes play source keys to lowercase', () => {
    expect(
      NormalizeActivityHistoryPlaySourceRows([
        {
          playSource: '  CloudMusic.EXE  ',
          lastSeenAt: '2026-06-12T04:05:06.000Z',
        },
      ]),
    ).toEqual([
      {
        playSource: 'cloudmusic.exe',
        lastSeenAt: '2026-06-12T04:05:06.000Z',
      },
    ])
  })
})

describe('BuildActivityAppsExportFileName', () => {
  it('builds a stable filesystem-safe JSON file name', () => {
    expect(BuildActivityAppsExportFileName(new Date('2026-06-12T04:05:06.789Z'))).toBe(
      'apps-export-2026-06-12T04-05-06-789Z.json',
    )
  })
})
