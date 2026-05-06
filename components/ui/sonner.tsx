'use client'

import type { CSSProperties } from 'react'
import { Toaster as Sonner, ToasterProps } from 'sonner'

import { useTheme } from '@/components/theme-provider'

const Toaster = ({ className, style, ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()
  const mergedStyle = {
    fontFamily: 'var(--font-noto-sans-sc), var(--font-ubuntu), sans-serif',
    '--normal-bg': 'var(--popover)',
    '--normal-text': 'var(--popover-foreground)',
    '--normal-border': 'var(--border)',
    ...style,
  } as CSSProperties

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className={['toaster group', className].filter(Boolean).join(' ')}
      style={mergedStyle}
      {...props}
    />
  )
}

export { Toaster }
