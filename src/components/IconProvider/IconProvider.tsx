'use client'

import { createContext, useContext, useMemo, type ComponentType, type ReactNode } from 'react'
import { cn } from 'cn'

/** Names of the icons Radiant components draw. */
export const ICON_NAMES = [
  'check',
  'indeterminate',
  'chevronDown',
  'chevronUp',
  'chevronLeft',
  'chevronRight',
  'close',
  'calendar',
  'grip',
  'spinner'
] as const

export type IconName = (typeof ICON_NAMES)[number]

/** An icon from the app's icon set, drawn in `currentColor`. Radiant sizes it through `className` and passes `aria-hidden`. */
export type IconComponent = ComponentType<{
  readonly className?: string
  readonly 'aria-hidden'?: true
}>

export type IconSet = Readonly<Partial<Record<IconName, IconComponent>>>

const IconContext = createContext<IconSet>({})

export type IconProviderProps = {
  /** Replaces Radiant's built-in icons below this provider. Omitted names inherit from an outer provider, then the built-in icon. */
  icons: IconSet
  children?: ReactNode
}

export function IconProvider({ icons, children }: IconProviderProps) {
  const parent = useContext(IconContext)
  for (const name of Object.keys(icons))
    if (!(ICON_NAMES as readonly string[]).includes(name))
      throw new TypeError(`IconProvider has no icon named "${name}".`)
  const value = useMemo(() => ({ ...parent, ...icons }), [parent, icons])
  return <IconContext value={value}>{children}</IconContext>
}

/** Whether a provider supplies `name`. */
export function useHasIcon(name: IconName): boolean {
  return useContext(IconContext)[name] !== undefined
}

/** Draws the app's icon for `name` in a one-em square, or `fallback` when no provider supplies one. */
export function StandardIcon({
  name,
  className,
  fallback
}: {
  name: IconName
  className?: string
  fallback: ReactNode
}) {
  const Supplied = useContext(IconContext)[name]
  if (!Supplied) return fallback
  return (
    <Supplied
      aria-hidden
      className={cn('inline-block size-[1em] shrink-0', className)}
    />
  )
}
