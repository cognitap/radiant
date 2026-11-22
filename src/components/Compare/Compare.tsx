import type { ComponentProps } from 'react'
import { cn } from 'cn'
import { joinIds } from '../../internal/ids.js'
import type { Spacing } from '../../presentation.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import { pickLayoutClass, spacingGapClasses } from '../shared/layoutStyles.js'

type ComparePartProps<Host extends 'ul' | 'li' | 'div'> = Omit<ComponentProps<Host>, 'style'> & {
  style?: ThemeStyle
  'data-slot'?: string
}

/**
 * List host and inline-size container for two to four `CompareItem`s. Items stack until the
 * Compare is 32rem wide (48rem for four), then sit side by side with their headers, bodies and
 * footers on shared rows. In a box that sizes to its content, Compare takes 20rem.
 */
export type CompareProps = ComparePartProps<'ul'> & {
  /** Space between items from the theme spacing scale. */
  gap?: Spacing
}

/** List item host whose header, body and footer line up with the other items'. */
export type CompareItemProps = ComparePartProps<'li'>
/** Div host on an item's first row, such as its name and price. */
export type CompareItemHeaderProps = ComparePartProps<'div'>
/** Div host on an item's second row. */
export type CompareItemBodyProps = ComparePartProps<'div'>
/** Div host on an item's last row, such as its action. */
export type CompareItemFooterProps = ComparePartProps<'div'>

// The first of exactly four items and its siblings wait for the wider threshold.
const sideBySide =
  '@min-[32rem]/compare:[&:not(:first-child:nth-last-child(4),:first-child:nth-last-child(4)~*)]:[grid-row:1/span_3] @min-[48rem]/compare:[grid-row:1/span_3]'

/** Two to four options side by side with aligned rows, stacking when the container is narrow. */
export function Compare({ gap = 'normal', className, ...props }: CompareProps) {
  return (
    <ul
      {...props}
      data-slot={joinIds('compare', props['data-slot'])}
      className={cn(
        '@container/compare [contain-intrinsic-inline-size:20rem] m-0 box-border grid w-full min-w-0 list-none auto-cols-[minmax(0,1fr)] p-0',
        pickLayoutClass('Compare', spacingGapClasses, 'gap', gap),
        className
      )}
    />
  )
}

export function CompareItem({ className, ...props }: CompareItemProps) {
  return (
    <li
      {...props}
      data-slot={joinIds('compare-item', props['data-slot'])}
      className={cn(
        'box-border grid min-w-0 [grid-row:span_3] [grid-template-rows:subgrid] gap-[var(--rad-spacing-tight,0.5rem)]',
        sideBySide,
        className
      )}
    />
  )
}

export function CompareItemHeader({ className, ...props }: CompareItemHeaderProps) {
  return (
    <div
      {...props}
      data-slot={joinIds('compare-item-header', props['data-slot'])}
      className={cn('row-start-1 min-w-0', className)}
    />
  )
}

export function CompareItemBody({ className, ...props }: CompareItemBodyProps) {
  return (
    <div
      {...props}
      data-slot={joinIds('compare-item-body', props['data-slot'])}
      className={cn('row-start-2 min-w-0', className)}
    />
  )
}

export function CompareItemFooter({ className, ...props }: CompareItemFooterProps) {
  return (
    <div
      {...props}
      data-slot={joinIds('compare-item-footer', props['data-slot'])}
      className={cn('row-start-3 min-w-0', className)}
    />
  )
}
