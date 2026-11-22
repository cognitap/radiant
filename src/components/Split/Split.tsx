import type { ComponentProps } from 'react'
import { cn } from 'cn'
import { joinIds } from '../../internal/ids.js'
import type { Spacing } from '../../presentation.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import { pickLayoutClass, spacingGapClasses } from '../shared/layoutStyles.js'

/** Inline side the secondary area takes once the Split is wide enough. */
export type SplitSide = 'start' | 'end'
/** Share of the width: `main` gives the main area two thirds, `balanced` halves it. */
export type SplitRatio = 'balanced' | 'main'

type SplitPartProps = Omit<ComponentProps<'div'>, 'style'> & {
  style?: ThemeStyle
  'data-slot'?: string
}

/**
 * Div host and inline-size container. Its parts stack in source order until the Split is
 * 40rem wide, then sit side by side; in a box that sizes to its content, Split takes 20rem.
 */
export type SplitProps = SplitPartProps & {
  /** Side of the secondary area when side by side; `end` is the default. */
  side?: SplitSide
  /** `main` (the default) or `balanced`. */
  ratio?: SplitRatio
  /** Space between the areas from the theme spacing scale. */
  gap?: Spacing
}

/** Div host for the main content. */
export type SplitMainProps = SplitPartProps
/** Div host for supporting content, such as filters or a summary. */
export type SplitSecondaryProps = SplitPartProps

const sides: Record<SplitSide, string> = {
  start: '[--_split-order:-1]',
  end: '[--_split-order:1]'
}
const ratios: Record<SplitRatio, string> = {
  balanced: '[--_split-grow:1]',
  main: '[--_split-grow:2]'
}

const partClass = 'box-border min-w-0 basis-full @min-[40rem]/split:basis-0'

/** Main and secondary areas that stack in a narrow container and share a row in a wide one. */
export function Split({
  side = 'end',
  ratio = 'main',
  gap = 'normal',
  className,
  ...props
}: SplitProps) {
  return (
    <div
      {...props}
      data-slot={joinIds('split', props['data-slot'])}
      className={cn(
        '@container/split [contain-intrinsic-inline-size:20rem] box-border flex w-full min-w-0 flex-wrap',
        pickLayoutClass('Split', sides, 'side', side),
        pickLayoutClass('Split', ratios, 'ratio', ratio),
        pickLayoutClass('Split', spacingGapClasses, 'gap', gap),
        className
      )}
    />
  )
}

export function SplitMain({ className, ...props }: SplitMainProps) {
  return (
    <div
      {...props}
      data-slot={joinIds('split-main', props['data-slot'])}
      className={cn(partClass, '@min-[40rem]/split:grow-[var(--_split-grow)]', className)}
    />
  )
}

export function SplitSecondary({ className, ...props }: SplitSecondaryProps) {
  return (
    <div
      {...props}
      data-slot={joinIds('split-secondary', props['data-slot'])}
      className={cn(
        partClass,
        '@min-[40rem]/split:grow @min-[40rem]/split:order-[var(--_split-order)]',
        className
      )}
    />
  )
}
