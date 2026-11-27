'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { cn } from 'cn'
import { ICON_NAMES, type IconName, type IconSet } from './iconNames.js'

const IconContext = createContext<IconSet>({})

export type IconProviderProps = {
  /** Replaces Radiant's built-in icons below this provider. Omitted or undefined names inherit from an outer provider, then the built-in icon. */
  icons: IconSet
  children?: ReactNode
}

export function IconProvider({ icons, children }: IconProviderProps) {
  const parent = useContext(IconContext)
  for (const name of Object.keys(icons))
    if (!(ICON_NAMES as readonly string[]).includes(name))
      throw new TypeError(`IconProvider has no icon named "${name}".`)
  const resolved = ICON_NAMES.map(name => icons[name] ?? parent[name])
  // Keyed on each resolved icon, so an inline `icons` object does not re-render every consumer.
  const value = useMemo(
    () =>
      Object.fromEntries(
        ICON_NAMES.flatMap((name, index) => (resolved[index] ? [[name, resolved[index]]] : []))
      ) as IconSet,
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- ICON_NAMES is fixed, so the list keeps its length.
    resolved
  )
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
