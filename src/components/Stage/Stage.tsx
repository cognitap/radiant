import { Children, isValidElement, type ComponentProps, type ReactNode } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from 'cn'
import type { HeadingLevel } from '../../internal/headings.js'
import type { StateOwner } from '../../react/useNativeOwner.js'
import { ExpandableStage } from './StageExpand.js'
import { joinIds } from '../../internal/ids.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import type { Spacing } from '../../presentation.js'
import { AspectRatio } from '../AspectRatio/AspectRatio.js'
import { HeadingLevelNest, InheritedHeading } from '../../react/useHeadingLevel.js'

const colorMotionClass =
  'transition-colors duration-[var(--rad-motion-color-duration,150ms)] motion-reduce:transition-none'

const stageVariants = cva(
  [
    colorMotionClass,
    '@container/stage [contain-intrinsic-inline-size:20rem]',
    'font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] tracking-[var(--rad-typography-roles-ui-body-letter-spacing,-0.011em)] text-[length:var(--rad-typography-roles-ui-body-size,0.875rem)] font-[number:var(--rad-typography-roles-ui-body-weight,400)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)]',
    'box-border grid w-full min-w-0 gap-[var(--rad-stage-gap,var(--rad-surface-gap,1rem))] text-start antialiased',
    'rounded-[var(--rad-stage-radius,var(--rad-surface-radius,0.75rem))]',
    '[corner-shape:var(--rad-stage-corner-shape,var(--rad-surface-corner-shape,round))]',
    '[border-width:var(--rad-stage-border-width,var(--rad-surface-border-width,1px))]',
    '[border-style:var(--rad-stage-border-style,var(--rad-surface-border-style,solid))]',
    '[border-color:var(--rad-stage-border-color,var(--rad-color-border,oklch(0.885_0.005_286)))]',
    'bg-[var(--rad-stage-background,var(--rad-color-surface,oklch(1_0_0)))]',
    '[color:var(--rad-stage-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))]',
    '[box-shadow:var(--rad-stage-shadow,var(--rad-surface-shadow,0_1px_2px_0_rgb(0_0_0/0.06)))]',
    '[backdrop-filter:var(--rad-surface-backdrop-filter,none)]',
    'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:shadow-none'
  ],
  {
    variants: {
      padding: {
        tight: 'p-[calc(var(--rad-stage-padding,var(--rad-surface-padding,1.5rem))*2/3)]',
        normal: 'p-[var(--rad-stage-padding,var(--rad-surface-padding,1.5rem))]',
        airy: 'p-[calc(var(--rad-stage-padding,var(--rad-surface-padding,1.5rem))*4/3)]'
      }
    },
    defaultVariants: { padding: 'normal' }
  }
)

const stageHeaderVariants = cva([
  'grid min-w-0 items-start gap-x-[var(--rad-stage-gap,var(--rad-surface-gap,1rem))] gap-y-[var(--rad-stage-header-gap,var(--rad-spacing-header-gap,0.375rem))]',
  // From 30rem, actions sit beside a title of at least 12rem and wrap below it when they do not fit.
  '@min-[30rem]/stage:flex @min-[30rem]/stage:flex-wrap'
])

const stageTitleVariants = cva([
  colorMotionClass,
  'm-0 min-w-0 break-words @min-[30rem]/stage:flex-[1_1_12rem]',
  'font-[family-name:var(--rad-typography-roles-ui-title-family,system-ui,sans-serif)] tracking-[var(--rad-typography-roles-ui-title-letter-spacing,-0.015em)]',
  'text-[length:var(--rad-stage-title-size,var(--rad-typography-roles-ui-title-size,1.125rem))] leading-[var(--rad-typography-roles-ui-title-line-height,1.3)]',
  'font-[number:var(--rad-stage-title-weight,var(--rad-typography-roles-ui-title-weight,600))]',
  'forced-colors:text-[CanvasText]'
])

const stageDescriptionVariants = cva([
  colorMotionClass,
  'm-0 min-w-0 break-words @min-[30rem]/stage:order-1 @min-[30rem]/stage:basis-full',
  '[color:var(--rad-stage-description-color,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))]',
  'font-[family-name:var(--rad-typography-roles-ui-supporting-family,system-ui,sans-serif)] font-[number:var(--rad-typography-roles-ui-supporting-weight,400)] tracking-[var(--rad-typography-roles-ui-supporting-letter-spacing,0em)]',
  'text-[length:var(--rad-stage-description-size,var(--rad-typography-roles-ui-supporting-size,0.8125rem))] leading-[var(--rad-typography-roles-ui-supporting-line-height,1.5)]',
  'forced-colors:text-[CanvasText]'
])

const stageActionsVariants = cva([
  'flex min-w-0 flex-wrap items-center gap-[var(--rad-stage-actions-gap,var(--rad-spacing-tight,0.5rem))]',
  '@min-[30rem]/stage:max-w-full @min-[30rem]/stage:justify-end'
])

const stageBodyVariants = cva(['grid min-w-0 break-words'])

// A ratio box clips its content, so it pads by the focus ring's reach and pulls that padding
// back with negative margins: content lines up with the header and a ring drawn around a
// body-filling control stays inside the clip. The ratio applies to the content box.
const stageRatioBodyClass =
  '[--_stage-ring:calc(var(--rad-focus-width,2px)+max(var(--rad-focus-offset,2px),0px))] box-content p-[var(--_stage-ring)] -m-[var(--_stage-ring)]'

const stageFooterVariants = cva([
  'flex min-w-0 flex-col items-stretch gap-[var(--rad-stage-footer-gap,var(--rad-spacing-footer-gap,0.5rem))]',
  '@min-[30rem]/stage:flex-row @min-[30rem]/stage:flex-wrap @min-[30rem]/stage:items-center'
])

export type StageHeadingLevel = HeadingLevel

type StagePartProps<Host extends 'div' | 'h2' | 'p'> = Omit<ComponentProps<Host>, 'style'> & {
  style?: ThemeStyle
  'data-slot'?: string
}

/**
 * Passive div host and inline-size container; its parts lay out by the Stage's own width.
 * In a box that sizes to its content, Stage takes 20rem.
 */
export type StageProps = StagePartProps<'div'> &
  StateOwner<'open', boolean> & {
    /** Step of the stage padding scale; `normal` keeps `--rad-stage-padding`. */
    padding?: Spacing
    /**
     * Lets the Stage expand into a modal view without remounting its parts. Keep it set for the
     * life of the mount; `open` has no effect without it.
     */
    expandTo?: 'dialog' | 'panel'
    /** Panel edge, in reading direction. */
    side?: 'start' | 'end'
    /** A change request. The controlled owner may decline it; prop syncs do not notify. */
    onOpenChange?: (open: boolean) => void
  }

/** Div host for the title, description and actions. */
export type StageHeaderProps = StagePartProps<'div'>

export type StageTitleProps = StagePartProps<'h2'> & {
  /**
   * Semantic heading host; choose a level that fits the surrounding page outline. Defaults to
   * `HeadingLevelProvider`'s level or 2.
   */
  level?: StageHeadingLevel
}

export type StageDescriptionProps = StagePartProps<'p'>

/** Div host for app controls; it sits beside the title once the Stage is wide enough. */
export type StageActionsProps = StagePartProps<'div'>

/** Div host for the widget, or an AspectRatio host (`ratio`) when `aspectRatio` is set. */
export type StageBodyProps = StagePartProps<'div'> & {
  /**
   * Width divided by height. Holds the body size while its content changes or streams in;
   * taller content is clipped.
   */
  aspectRatio?: number
}

/** Div host for app content after the body. */
export type StageFooterProps = StagePartProps<'div'>

export function Stage({
  padding,
  expandTo,
  side = 'end',
  open,
  defaultOpen,
  onOpenChange,
  className,
  children,
  ...props
}: StageProps) {
  const title = findTitle(children)
  const parts = title
    ? Children.map(children, child =>
        isValidElement(child) && child.type === StageHeader ? (
          child
        ) : (
          <HeadingLevelNest
            level={title.level}
            fallback={2}
          >
            {child}
          </HeadingLevelNest>
        )
      )
    : children
  const host = {
    ...props,
    className: cn(stageVariants({ padding }), className),
    'data-slot': joinIds('stage', props['data-slot'])
  }
  if (expandTo === undefined) return <div {...host}>{parts}</div>
  return (
    <ExpandableStage
      host={host}
      expandTo={expandTo}
      side={side}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      {parts}
    </ExpandableStage>
  )
}

/** A StageTitle directly inside a direct StageHeader moves the other parts one heading level down. */
function findTitle(children: ReactNode): { level: StageHeadingLevel | undefined } | null {
  for (const child of Children.toArray(children)) {
    if (!isValidElement<StageHeaderProps>(child) || child.type !== StageHeader) continue
    for (const part of Children.toArray(child.props.children)) {
      if (isValidElement<StageTitleProps>(part) && part.type === StageTitle)
        return { level: part.props.level }
    }
  }
  return null
}

export function StageHeader({ className, ...props }: StageHeaderProps) {
  return (
    <div
      {...props}
      className={cn(stageHeaderVariants(), className)}
      data-slot={joinIds('stage-header', props['data-slot'])}
    />
  )
}

export function StageTitle({ level, className, children, ...props }: StageTitleProps) {
  return (
    <InheritedHeading
      {...props}
      level={level}
      fallback={2}
      className={cn(stageTitleVariants(), className)}
      data-slot={joinIds('stage-title', props['data-slot'])}
    >
      {children}
    </InheritedHeading>
  )
}

export function StageDescription({ className, ...props }: StageDescriptionProps) {
  return (
    <p
      {...props}
      className={cn(stageDescriptionVariants(), className)}
      data-slot={joinIds('stage-description', props['data-slot'])}
    />
  )
}

export function StageActions({ className, ...props }: StageActionsProps) {
  return (
    <div
      {...props}
      className={cn(stageActionsVariants(), className)}
      data-slot={joinIds('stage-actions', props['data-slot'])}
    />
  )
}

export function StageBody({ aspectRatio, className, ...props }: StageBodyProps) {
  const slot = joinIds('stage-body', props['data-slot'])
  if (aspectRatio === undefined) {
    return (
      <div
        {...props}
        className={cn(stageBodyVariants(), className)}
        data-slot={slot}
      />
    )
  }
  return (
    <AspectRatio
      {...props}
      ratio={aspectRatio}
      className={cn(stageBodyVariants(), stageRatioBodyClass, className)}
      data-slot={slot}
    />
  )
}

export function StageFooter({ className, ...props }: StageFooterProps) {
  return (
    <div
      {...props}
      className={cn(stageFooterVariants(), className)}
      data-slot={joinIds('stage-footer', props['data-slot'])}
    />
  )
}
