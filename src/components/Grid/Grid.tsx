import type { ComponentProps } from 'react'
import { cn } from 'cn'
import { joinIds } from '../../internal/ids.js'
import type { Spacing } from '../../presentation.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import { pickLayoutClass } from '../shared/layoutStyles.js'

/** Most columns a Grid may show. */
export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6

/**
 * Div host and inline-size container. Each child is one equal item; the Grid fits as many
 * columns as its own width holds at `components.grid.minItemWidth` (12rem) per item, up to
 * `maxColumns`. In a box that sizes to its content, Grid takes 20rem. Set spacing with `gap`:
 * the column count reads it, so a gap class would let tracks overflow.
 */
export type GridProps = Omit<ComponentProps<'div'>, 'style'> & {
  /** Column cap from 1 to 6; 3 is the default. */
  maxColumns?: GridColumns
  /** Space between items from the theme spacing scale. */
  gap?: Spacing
  style?: ThemeStyle
  'data-slot'?: string
}

const columns: Record<GridColumns, string> = {
  1: '[--_grid-max:1]',
  2: '[--_grid-max:2]',
  3: '[--_grid-max:3]',
  4: '[--_grid-max:4]',
  5: '[--_grid-max:5]',
  6: '[--_grid-max:6]'
}
const gaps: Record<Spacing, string> = {
  tight: '[--_grid-gap:var(--rad-spacing-tight,0.5rem)]',
  normal: '[--_grid-gap:var(--rad-spacing-normal,1rem)]',
  airy: '[--_grid-gap:var(--rad-spacing-airy,1.5rem)]'
}

// Each track is at least the token width and at least the share that caps the count at the
// maximum, but never wider than the Grid itself. The share is a tenth of a pixel short, so
// rounding never drops the last column.
const trackClass =
  '[grid-template-columns:repeat(auto-fill,minmax(min(100%,max(var(--rad-grid-min-item-width,12rem),calc((100%_-_(var(--_grid-max)_-_1)_*_var(--_grid-gap))/var(--_grid-max)_-_0.1px))),1fr))]'

/** Equal items in as many columns as the Grid's width fits, up to a caller-set maximum. */
export function Grid({ maxColumns = 3, gap = 'normal', className, ...props }: GridProps) {
  return (
    <div
      {...props}
      data-slot={joinIds('grid', props['data-slot'])}
      className={cn(
        '@container/grid [contain-intrinsic-inline-size:20rem] box-border grid w-full min-w-0 gap-[var(--_grid-gap)] [&>*]:min-w-0',
        trackClass,
        pickLayoutClass('Grid', columns, 'maxColumns', maxColumns),
        pickLayoutClass('Grid', gaps, 'gap', gap),
        className
      )}
    />
  )
}
