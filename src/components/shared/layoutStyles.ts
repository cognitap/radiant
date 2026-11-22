import type { Spacing } from '../../presentation.js'

/** Gaps between laid-out children, from the theme spacing scale. */
export const spacingGapClasses: Record<Spacing, string> = {
  tight: 'gap-[var(--rad-spacing-tight,0.5rem)]',
  normal: 'gap-[var(--rad-spacing-normal,1rem)]',
  airy: 'gap-[var(--rad-spacing-airy,1.5rem)]'
}

/** Looks up a layout prop's classes, throwing on values outside the documented set. */
export function pickLayoutClass<T extends string | number>(
  family: string,
  map: Record<T, string>,
  prop: string,
  value: T
): string {
  if (!Object.hasOwn(map, value))
    throw new TypeError(`${family} ${prop} must be one of ${Object.keys(map).join(', ')}.`)
  return map[value]
}
