'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function parseIntegerInRange(raw: unknown, min: number, max: number): number | null {
  const normalized = String(raw ?? '').trim()
  if (!/^-?\d+$/.test(normalized)) return null
  const value = Number(normalized)
  if (!Number.isSafeInteger(value)) return null
  if (value < min || value > max) return null
  return value
}

export function formatNumberRange(min: number, max: number): string {
  return `${min} - ${max}`
}

export function getNumberRangeError(
  raw: unknown,
  min: number,
  max: number,
  message: string,
): string {
  return parseIntegerInRange(raw, min, max) === null ? message : ''
}

type NumberSettingInputProps = Omit<
  React.ComponentProps<typeof Input>,
  'type' | 'value' | 'onChange' | 'min' | 'max' | 'inputMode' | 'pattern'
> & {
  value: string | number
  min: number
  max: number
  onValueChange: (value: string) => void
  rangeMessage: string
  messageClassName?: string
  commitDelayMs?: number
}

const DEFAULT_COMMIT_DELAY_MS = 300

function normalizeNumberValue(value: string | number): string {
  return String(value ?? '')
}

export function NumberSettingInput({
  value,
  min,
  max,
  onValueChange,
  rangeMessage,
  className,
  messageClassName,
  commitDelayMs = DEFAULT_COMMIT_DELAY_MS,
  ...props
}: NumberSettingInputProps) {
  const [draftValue, setDraftValue] = useState(() => normalizeNumberValue(value))
  const draftValueRef = useRef(draftValue)
  const commitTimerRef = useRef<number | null>(null)
  const committedValueRef = useRef(normalizeNumberValue(value))

  useEffect(() => {
    draftValueRef.current = draftValue
  }, [draftValue])

  useEffect(() => {
    const nextValue = normalizeNumberValue(value)
    committedValueRef.current = nextValue
    if (commitTimerRef.current !== null) {
      window.clearTimeout(commitTimerRef.current)
      commitTimerRef.current = null
    }
    if (nextValue === draftValueRef.current) return
    const timer = window.setTimeout(() => {
      setDraftValue(nextValue)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [value])

  useEffect(
    () => () => {
      if (commitTimerRef.current !== null) {
        window.clearTimeout(commitTimerRef.current)
      }
    },
    [],
  )

  const commitValue = (nextValue: string) => {
    if (nextValue === committedValueRef.current) return
    committedValueRef.current = nextValue
    onValueChange(nextValue)
  }

  const scheduleCommit = (nextValue: string) => {
    if (commitTimerRef.current !== null) {
      window.clearTimeout(commitTimerRef.current)
    }
    commitTimerRef.current = window.setTimeout(() => {
      commitTimerRef.current = null
      commitValue(nextValue)
    }, commitDelayMs)
  }

  const error = useMemo(
    () => getNumberRangeError(draftValue, min, max, rangeMessage),
    [draftValue, max, min, rangeMessage],
  )

  return (
    <>
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        min={min}
        max={max}
        value={draftValue}
        aria-invalid={error ? true : undefined}
        className={className}
        onWheel={(event) => event.currentTarget.blur()}
        onBlur={() => {
          if (commitTimerRef.current !== null) {
            window.clearTimeout(commitTimerRef.current)
            commitTimerRef.current = null
          }
          commitValue(draftValue)
        }}
        onChange={(event) => {
          const nextValue = event.target.value
          setDraftValue(nextValue)
          scheduleCommit(nextValue)
        }}
      />
      {error ? (
        <p className={cn('text-xs leading-5 text-destructive', messageClassName)}>
          {error}
        </p>
      ) : null}
    </>
  )
}
