import type {
  ThemeBackgroundImageMode,
  ThemePaletteLiveScope,
  ThemePaletteMode,
} from '@/types/theme'
import type {
  ThemeCustomSurfaceForm,
  ThemeCustomSurfacePreviewAssetState,
} from '@/types/web-settings'

type ThemeCustomSurfaceBackgroundSource = Pick<
  ThemeCustomSurfaceForm,
  'backgroundImageMode' | 'backgroundImageUrl' | 'backgroundImagePool' | 'backgroundRandomApiUrl'
>

export function CreateEmptyThemePreviewAsset(): ThemeCustomSurfacePreviewAssetState {
  return {
    displayUrl: '',
    seedUrl: '',
    image: null,
  }
}

export function GetThemeCustomSurfacePreviewHint(
  value: ThemeCustomSurfaceBackgroundSource,
): string {
  switch (value.backgroundImageMode) {
    case 'manual':
      return value.backgroundImageUrl.trim()
    case 'randomPool':
      return value.backgroundImagePool[0] ?? ''
    case 'randomApi':
      return value.backgroundRandomApiUrl.trim()
  }
}

export function GetThemeCustomSurfaceBackgroundInputValue(
  value: ThemeCustomSurfaceBackgroundSource,
): string {
  switch (value.backgroundImageMode) {
    case 'manual':
      return value.backgroundImageUrl
    case 'randomApi':
      return value.backgroundRandomApiUrl
    case 'randomPool':
      return ''
  }
}

export function GetThemeCustomSurfaceUploadUsageKey(value: ThemeCustomSurfaceForm): string {
  switch (value.backgroundImageMode) {
    case 'randomPool':
      return `theme.pool.${value.backgroundImagePool.length}`
    case 'manual':
    case 'randomApi':
      return 'theme.background'
  }
}

export function ResolveThemeBackgroundImageMode(value: string): ThemeBackgroundImageMode {
  switch (value) {
    case 'randomPool':
      return 'randomPool'
    case 'randomApi':
      return 'randomApi'
    case 'manual':
    default:
      return 'manual'
  }
}

export function ResolveThemePaletteMode(value: string): ThemePaletteMode {
  switch (value) {
    case 'applyFromCurrent':
      return 'applyFromCurrent'
    case 'liveFromImage':
      return 'liveFromImage'
    case 'manual':
    default:
      return 'manual'
  }
}

export function ResolveThemePaletteLiveScope(value: string): ThemePaletteLiveScope {
  switch (value) {
    case 'randomOnly':
    default:
      return 'randomOnly'
  }
}
