import { headings, type HeadingLevel } from './internal/headings.js'
import type { ComponentProps } from 'react'
import { cn } from './cn.js'
import { actionTone } from './actionStyles.js'
import { joinIds } from './internal/ids.js'
import type { Tone } from './presentation.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type AlertAnnouncement = 'off' | 'polite' | 'assertive'
export type AlertTone = Tone
export type AlertProps = Omit<
  ComponentProps<'div'>,
  'style' | 'role' | 'aria-live' | 'aria-atomic'
> & {
  style?: ThemeStyle
  'data-slot'?: string
  /** Visual palette only; urgency is chosen independently through announce. */
  tone?: AlertTone
  /** Static information is silent by default. Live roles carry their native ARIA defaults. */
  announce?: AlertAnnouncement
}
export type AlertHeadingLevel = HeadingLevel
export type AlertTitleProps = Omit<ComponentProps<'h2'>, 'style'> & {
  style?: ThemeStyle
  'data-slot'?: string
  level?: AlertHeadingLevel
}
export type AlertDescriptionProps = Omit<ComponentProps<'p'>, 'style'> & {
  style?: ThemeStyle
  'data-slot'?: string
}
const colorMotion =
  'transition-colors duration-[var(--rad-motion-color-duration,150ms)] motion-reduce:transition-none'

/** Inline content, never a focus manager, timer, dismissal owner or announcement queue. */
export function Alert({ announce = 'off', tone = 'neutral', className, ...props }: AlertProps) {
  if (!['off', 'polite', 'assertive'].includes(announce))
    throw new TypeError('Alert announce must be off, polite or assertive.')
  const named = Boolean(props['aria-label'] || props['aria-labelledby'])
  const role =
    announce === 'assertive'
      ? 'alert'
      : announce === 'polite'
        ? 'status'
        : named
          ? 'group'
          : undefined
  return (
    <div
      {...props}
      role={role}
      aria-live={undefined}
      aria-atomic={undefined}
      data-slot={joinIds('alert', props['data-slot'])}
      data-tone={tone}
      data-announce={announce}
      className={cn(
        actionTone({ tone }),
        colorMotion,
        'box-border grid w-full min-w-0 break-words text-start antialiased gap-[var(--rad-alert-gap,var(--rad-spacing-header-gap,0.375rem))] p-[var(--rad-alert-padding,var(--rad-surface-padding,1.5rem))] rounded-[var(--rad-alert-radius,var(--rad-surface-radius,0.75rem))] [corner-shape:var(--rad-surface-corner-shape,round)]',
        'bg-[var(--rad-alert-background,var(--_action-soft))] [color:var(--rad-alert-color,var(--_action-ink))] [border-color:var(--rad-alert-border-color,var(--_action-edge))] [border-width:var(--rad-alert-border-width,var(--rad-surface-border-width,1px))] [border-style:var(--rad-alert-border-style,var(--rad-surface-border-style,solid))] [box-shadow:var(--rad-alert-shadow,none)] [backdrop-filter:var(--rad-surface-backdrop-filter,none)]',
        'font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] text-[length:var(--rad-typography-roles-ui-body-size,0.875rem)] font-[number:var(--rad-typography-roles-ui-body-weight,400)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)] tracking-[var(--rad-typography-roles-ui-body-letter-spacing,-0.011em)]',
        'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:shadow-none',
        className
      )}
    />
  )
}
export function AlertTitle({ level = 2, className, ...props }: AlertTitleProps) {
  const Tag = headings[level]
  return (
    <Tag
      {...props}
      data-slot={joinIds('alert-title', props['data-slot'])}
      className={cn(
        colorMotion,
        'm-0 min-w-0 break-words font-[family-name:var(--rad-typography-roles-ui-title-family,system-ui,sans-serif)] text-[length:var(--rad-alert-title-size,var(--rad-typography-roles-ui-title-size,1.125rem))] font-[number:var(--rad-alert-title-weight,var(--rad-typography-roles-ui-title-weight,600))] leading-[var(--rad-typography-roles-ui-title-line-height,1.3)] tracking-[var(--rad-typography-roles-ui-title-letter-spacing,-0.015em)]',
        className
      )}
    />
  )
}
export function AlertDescription({ className, ...props }: AlertDescriptionProps) {
  return (
    <p
      {...props}
      data-slot={joinIds('alert-description', props['data-slot'])}
      className={cn(
        colorMotion,
        'm-0 min-w-0 break-words text-[length:var(--rad-alert-description-size,var(--rad-typography-roles-ui-body-size,0.875rem))] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)]',
        className
      )}
    />
  )
}
