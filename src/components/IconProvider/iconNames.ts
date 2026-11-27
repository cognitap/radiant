import type { ComponentType } from 'react'

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
