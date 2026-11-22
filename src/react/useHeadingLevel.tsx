'use client'

import { createContext, useContext, type ComponentProps, type ReactNode } from 'react'
import { headings, type HeadingLevel } from '../internal/headings.js'

const HeadingLevelContext = createContext<HeadingLevel | undefined>(undefined)

export type HeadingLevelProviderProps = {
  /** Level of the top heading inside; nested sections read deeper levels with `useHeadingLevel(1)`. */
  readonly level: HeadingLevel
  readonly children?: ReactNode
}

/** Sets where the headings of a subtree start in the host page outline. */
export function HeadingLevelProvider({ level, children }: HeadingLevelProviderProps) {
  return <HeadingLevelContext.Provider value={level}>{children}</HeadingLevelContext.Provider>
}

/**
 * Returns the provided level plus `depth`, clamped to 1–6, or `undefined` outside a provider so a
 * title's `level` prop falls back to its own default.
 */
export function useHeadingLevel(depth = 0): HeadingLevel | undefined {
  const level = useContext(HeadingLevelContext)
  return level === undefined ? undefined : clampHeadingLevel(level + depth)
}

export function clampHeadingLevel(level: number): HeadingLevel {
  return Math.min(6, Math.max(1, Math.round(level))) as HeadingLevel
}

/** Heading at `level`, else the nearest provider's level, else `fallback`; static titles render it. */
export function InheritedHeading({
  level,
  fallback,
  ...props
}: ComponentProps<'h2'> & {
  readonly level?: HeadingLevel | undefined
  readonly fallback: HeadingLevel
}) {
  const inherited = useHeadingLevel()
  const Tag = headings[level ?? inherited ?? fallback]
  return <Tag {...props} />
}

/**
 * Places a section's content one level below its heading: below `level` when the heading's level
 * is known, else below the provided level or `fallback`.
 */
export function HeadingLevelNest({
  level,
  fallback,
  children
}: {
  readonly level?: HeadingLevel | undefined
  readonly fallback: HeadingLevel
  readonly children?: ReactNode
}) {
  const inherited = useHeadingLevel()
  return (
    <HeadingLevelContext.Provider value={clampHeadingLevel((level ?? inherited ?? fallback) + 1)}>
      {children}
    </HeadingLevelContext.Provider>
  )
}
