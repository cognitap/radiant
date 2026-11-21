import type { ComponentProps } from 'react'
import { cn } from 'cn'
import { joinIds } from '../../internal/ids.js'
import type { Orientation, Spacing } from '../../presentation.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'

/** Cross-axis alignment of children. */
export type StackAlign = 'start' | 'center' | 'end' | 'stretch'
/** Main-axis distribution of children; `stretch` grows every child equally. */
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' | 'stretch'

export type StackProps = Omit<ComponentProps<'div'>, 'style'> & {
  /** Main axis: `vertical` (the default) stacks children top to bottom. */
  direction?: Orientation
  /** Space between children from the theme spacing scale. */
  gap?: Spacing
  align?: StackAlign
  justify?: StackJustify
  /** Lets children wrap onto more lines when space runs out. */
  wrap?: boolean
  style?: ThemeStyle
  'data-slot'?: string
}

const directions: Record<Orientation, string> = {
  horizontal: 'flex-row',
  vertical: 'flex-col'
}
const gaps: Record<Spacing, string> = {
  tight: 'gap-[var(--rad-spacing-tight,0.5rem)]',
  normal: 'gap-[var(--rad-spacing-normal,1rem)]',
  airy: 'gap-[var(--rad-spacing-airy,1.5rem)]'
}
const alignments: Record<StackAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch'
}
const justifications: Record<StackJustify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
  stretch: 'justify-start *:flex-1'
}

function pick<T extends string>(map: Record<T, string>, prop: string, value: T) {
  if (!Object.hasOwn(map, value))
    throw new TypeError(`Stack ${prop} must be one of ${Object.keys(map).join(', ')}.`)
  return map[value]
}

/** One-dimensional flex layout spaced by the theme spacing scale. */
export function Stack({
  direction = 'vertical',
  gap = 'normal',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className,
  ...props
}: StackProps) {
  return (
    <div
      {...props}
      data-slot={joinIds('stack', props['data-slot'])}
      className={cn(
        'flex min-w-0',
        pick(directions, 'direction', direction),
        pick(gaps, 'gap', gap),
        pick(alignments, 'align', align),
        pick(justifications, 'justify', justify),
        wrap ? 'flex-wrap' : 'flex-nowrap',
        className
      )}
    />
  )
}
