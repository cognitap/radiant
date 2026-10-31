import type { ComponentProps } from 'react'
import { cn } from './cn.js'
import { actionTone } from './actionStyles.js'
import { joinIds } from './internal/ids.js'
import type { Tone } from './presentation.js'
import type { ThemeStyle } from './themes/defineTheme.js'
export type BadgeTone = Tone
export type BadgeProps = Omit<
  ComponentProps<'span'>,
  | 'style'
  | 'role'
  | 'tabIndex'
  | 'contentEditable'
  | 'aria-hidden'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-live'
> & {
  tone?: BadgeTone
  /** Only when adjacent text already conveys the same information. */
  decorative?: boolean
  style?: ThemeStyle
  'data-slot'?: string
}
/** Compact passive text. Use Button or Link for an action. */
export function Badge({ tone = 'neutral', decorative = false, className, ...props }: BadgeProps) {
  const nativeProps = {
    ...props,
    role: undefined,
    tabIndex: undefined,
    contentEditable: undefined,
    'aria-label': undefined,
    'aria-labelledby': undefined,
    'aria-live': undefined
  }
  return (
    <span
      {...nativeProps}
      aria-hidden={decorative ? true : undefined}
      data-slot={joinIds('badge', props['data-slot'])}
      data-tone={tone}
      data-decorative={decorative ? '' : undefined}
      className={cn(
        actionTone({ tone }),
        'box-border inline-flex max-w-full min-w-0 items-center gap-1 align-middle [overflow-wrap:anywhere] whitespace-normal text-start antialiased',
        'rounded-[var(--rad-badge-radius,var(--rad-control-radius,0.5rem))] [corner-shape:var(--rad-control-corner-shape,round)] px-[var(--rad-badge-padding-inline,0.5rem)] py-[var(--rad-badge-padding-block,0.125rem)]',
        'bg-[var(--rad-badge-background,var(--_action-soft))] [color:var(--rad-badge-color,var(--_action-ink))] [border-color:var(--rad-badge-border-color,var(--_action-edge))] [border-width:var(--rad-badge-border-width,var(--rad-control-border-width,1px))] [border-style:var(--rad-badge-border-style,var(--rad-control-border-style,solid))]',
        'font-[family-name:var(--rad-control-action-font-family,var(--rad-typography-roles-ui-label-family,system-ui,sans-serif))] text-[length:var(--rad-badge-font-size,var(--rad-typography-roles-ui-supporting-size,0.8125rem))] font-[number:var(--rad-control-action-font-weight,var(--rad-typography-roles-ui-label-weight,600))] leading-[var(--rad-typography-roles-ui-label-line-height,1.4)] tracking-[var(--rad-control-action-letter-spacing,var(--rad-typography-roles-ui-label-letter-spacing,0em))] [text-transform:var(--rad-control-action-text-transform,none)]',
        'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]',
        className
      )}
    />
  )
}
