import type { ComponentProps } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from 'cn'
import { headings as headingTag, type HeadingLevel } from '../../internal/headings.js'
import { joinIds } from '../../internal/ids.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import type { Spacing } from '../../presentation.js'
import { AspectRatio } from '../AspectRatio/AspectRatio.js'

const colorMotionClass =
  'transition-colors duration-[var(--rad-motion-color-duration,150ms)] motion-reduce:transition-none'

const stageVariants = cva(
  [
    colorMotionClass,
    '@container/stage',
    'font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] tracking-[var(--rad-typography-roles-ui-body-letter-spacing,-0.011em)] text-[length:var(--rad-typography-roles-ui-body-size,0.875rem)] font-[number:var(--rad-typography-roles-ui-body-weight,400)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)]',
    'box-border grid w-full min-w-0 gap-[var(--rad-stage-gap,var(--rad-spacing-normal,1rem))] text-start antialiased',
    'rounded-[var(--rad-stage-radius,var(--rad-surface-radius,0.75rem))]',
    '[corner-shape:var(--rad-surface-corner-shape,round)]',
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
  'grid min-w-0 items-start gap-x-[var(--rad-stage-gap,var(--rad-spacing-normal,1rem))] gap-y-[var(--rad-stage-header-gap,var(--rad-spacing-header-gap,0.375rem))]',
  '@min-[30rem]/stage:has-[>[data-slot~=stage-actions]]:grid-cols-[minmax(0,1fr)_auto]'
])

const stageTitleVariants = cva([
  colorMotionClass,
  'm-0 min-w-0 break-words @min-[30rem]/stage:col-start-1',
  'font-[family-name:var(--rad-typography-roles-ui-title-family,system-ui,sans-serif)] tracking-[var(--rad-typography-roles-ui-title-letter-spacing,-0.015em)]',
  'text-[length:var(--rad-stage-title-size,var(--rad-typography-roles-ui-title-size,1.125rem))] leading-[var(--rad-typography-roles-ui-title-line-height,1.3)]',
  'font-[number:var(--rad-stage-title-weight,var(--rad-typography-roles-ui-title-weight,600))]',
  'forced-colors:text-[CanvasText]'
])

const stageDescriptionVariants = cva([
  colorMotionClass,
  'm-0 min-w-0 break-words @min-[30rem]/stage:col-start-1',
  '[color:var(--rad-stage-description-color,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))]',
  'font-[family-name:var(--rad-typography-roles-ui-supporting-family,system-ui,sans-serif)] font-[number:var(--rad-typography-roles-ui-supporting-weight,400)] tracking-[var(--rad-typography-roles-ui-supporting-letter-spacing,0em)]',
  'text-[length:var(--rad-typography-roles-ui-supporting-size,0.8125rem)] leading-[var(--rad-typography-roles-ui-supporting-line-height,1.5)]',
  'forced-colors:text-[CanvasText]'
])

const stageActionsVariants = cva([
  'flex min-w-0 flex-wrap items-center gap-[var(--rad-stage-actions-gap,var(--rad-spacing-tight,0.5rem))]',
  '@min-[30rem]/stage:col-start-2 @min-[30rem]/stage:row-start-1 @min-[30rem]/stage:justify-end'
])

const stageBodyVariants = cva(['grid min-w-0 break-words'])

const stageFooterVariants = cva([
  'flex min-w-0 flex-col items-stretch gap-[var(--rad-stage-footer-gap,var(--rad-spacing-footer-gap,0.5rem))]',
  '@min-[30rem]/stage:flex-row @min-[30rem]/stage:flex-wrap @min-[30rem]/stage:items-center'
])

export type StageHeadingLevel = HeadingLevel

type StagePartProps<Host extends 'div' | 'h2' | 'p'> = Omit<ComponentProps<Host>, 'style'> & {
  style?: ThemeStyle
  'data-slot'?: string
}

/** Passive div host and size container; its parts lay out by the Stage's own width. */
export type StageProps = StagePartProps<'div'> & {
  /** Step of the stage padding scale; `normal` keeps `--rad-stage-padding`. */
  padding?: Spacing
}

/** Div host for the title, description and actions. */
export type StageHeaderProps = StagePartProps<'div'>

export type StageTitleProps = StagePartProps<'h2'> & {
  /** Semantic heading host; choose a level that fits the surrounding page outline. */
  level?: StageHeadingLevel
}

export type StageDescriptionProps = StagePartProps<'p'>

/** Div host for app controls; it sits beside the title once the Stage is wide enough. */
export type StageActionsProps = StagePartProps<'div'>

/** Div host for the widget, or an AspectRatio host when `aspectRatio` is set. */
export type StageBodyProps = StagePartProps<'div'> & {
  /** Width divided by height. Holds the body size while its content changes or streams in. */
  aspectRatio?: number
}

/** Div host for app content after the body. */
export type StageFooterProps = StagePartProps<'div'>

export function Stage({ padding, className, ...props }: StageProps) {
  return (
    <div
      {...props}
      className={cn(stageVariants({ padding }), className)}
      data-slot={joinIds('stage', props['data-slot'])}
    />
  )
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

export function StageTitle({ level = 2, className, children, ...props }: StageTitleProps) {
  const Tag = headingTag[level]
  return (
    <Tag
      {...props}
      className={cn(stageTitleVariants(), className)}
      data-slot={joinIds('stage-title', props['data-slot'])}
    >
      {children}
    </Tag>
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
      className={cn(stageBodyVariants(), className)}
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
