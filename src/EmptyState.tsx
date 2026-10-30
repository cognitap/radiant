import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import { headings, type HeadingLevel } from './internal/headings.js'
import { actionTone } from './actionStyles.js'
import type { Tone } from './presentation.js'
import type { ThemeStyle } from './themes/defineTheme.js'
const variants = cva(
  [
    'box-border grid w-full min-w-0 justify-items-center break-words text-center antialiased',
    'gap-[var(--rad-empty-state-gap,0.75rem)] p-[var(--rad-empty-state-padding,var(--rad-surface-padding,1.5rem))]',
    'rounded-[var(--rad-empty-state-radius,var(--rad-surface-radius,0.75rem))] [border-width:var(--rad-empty-state-border-width,var(--rad-surface-border-width,1px))] [border-color:var(--rad-empty-state-border-color,var(--_action-edge))]',
    'bg-[var(--rad-empty-state-background,var(--rad-color-surface))] [color:var(--rad-empty-state-color,var(--rad-color-foreground))]',
    'font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] text-[length:var(--rad-typography-roles-ui-body-size,0.875rem)] font-[number:var(--rad-typography-roles-ui-body-weight,400)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)] tracking-[var(--rad-typography-roles-ui-body-letter-spacing,-0.011em)]',
    'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]'
  ],
  {
    variants: {
      variant: {
        'first-use': '[border-style:dashed]',
        'no-results':
          '[border-width:0px] [border-style:solid] bg-[var(--rad-empty-state-background,transparent)] p-[var(--rad-empty-state-padding,1rem)]',
        error: '[border-style:solid]'
      }
    },
    defaultVariants: { variant: 'first-use' }
  }
)
export type EmptyStateVariant = NonNullable<VariantProps<typeof variants>['variant']>
export type EmptyStateTone = Tone
type Part<Host extends 'div' | 'span' | 'h2' | 'p'> = Omit<ComponentProps<Host>, 'style'> & {
  style?: ThemeStyle
  'data-slot'?: string
}
export type EmptyStateProps = Part<'div'> & { variant?: EmptyStateVariant; tone?: EmptyStateTone }
export type EmptyStateIconProps = Omit<
  Part<'span'>,
  'aria-hidden' | 'aria-label' | 'aria-labelledby' | 'role' | 'tabIndex' | 'contentEditable'
>
export type EmptyStateHeadingLevel = HeadingLevel
export type EmptyStateTitleProps = Part<'h2'> & { level?: EmptyStateHeadingLevel }
export type EmptyStateDescriptionProps = Part<'p'>
export type EmptyStateActionsProps = Part<'div'>
/** Content presentation only; applications own data, recovery and announcements. */
export function EmptyState({
  variant = 'first-use',
  tone = 'neutral',
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      {...props}
      data-slot={joinIds('empty-state', props['data-slot'])}
      data-variant={variant}
      data-tone={tone}
      className={cn(actionTone({ tone }), variants({ variant }), className)}
    />
  )
}
export function EmptyStateIcon({ className, ...props }: EmptyStateIconProps) {
  const native = { ...props, role: undefined, tabIndex: undefined, contentEditable: undefined }
  return (
    <span
      {...native}
      aria-hidden="true"
      data-slot={joinIds('empty-state-icon', props['data-slot'])}
      className={cn(
        'inline-flex shrink-0 items-center justify-center size-[var(--rad-empty-state-icon-size,2.5rem)] [&>svg]:size-full [color:var(--rad-empty-state-icon-color,var(--_action-ink,var(--rad-color-muted-foreground)))] forced-colors:text-[CanvasText]',
        className
      )}
    />
  )
}
export function EmptyStateTitle({ level = 2, className, ...props }: EmptyStateTitleProps) {
  const Heading = headings[level]
  return (
    <Heading
      {...props}
      data-slot={joinIds('empty-state-title', props['data-slot'])}
      className={cn(
        'm-0 min-w-0 break-words font-[family-name:var(--rad-typography-roles-ui-title-family,system-ui,sans-serif)] text-[length:var(--rad-empty-state-title-size,var(--rad-typography-roles-ui-title-size,1.125rem))] font-[number:var(--rad-empty-state-title-weight,var(--rad-typography-roles-ui-title-weight,600))] leading-[var(--rad-typography-roles-ui-title-line-height,1.3)] tracking-[var(--rad-typography-roles-ui-title-letter-spacing,-0.015em)]',
        className
      )}
    />
  )
}
export function EmptyStateDescription({ className, ...props }: EmptyStateDescriptionProps) {
  return (
    <p
      {...props}
      data-slot={joinIds('empty-state-description', props['data-slot'])}
      className={cn(
        'm-0 min-w-0 max-w-prose break-words [color:var(--rad-empty-state-description-color,var(--rad-color-muted-foreground))] text-[length:var(--rad-empty-state-description-size,var(--rad-typography-roles-ui-supporting-size,0.8125rem))] leading-[var(--rad-typography-roles-ui-supporting-line-height,1.5)] forced-colors:text-[CanvasText]',
        className
      )}
    />
  )
}
export function EmptyStateActions({ className, ...props }: EmptyStateActionsProps) {
  return (
    <div
      {...props}
      data-slot={joinIds('empty-state-actions', props['data-slot'])}
      className={cn(
        'flex min-w-0 flex-wrap items-center justify-center gap-[var(--rad-empty-state-actions-gap,0.5rem)]',
        className
      )}
    />
  )
}
