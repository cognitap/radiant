import type { ComponentProps } from 'react'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type ProgressProps = Omit<
  ComponentProps<'progress'>,
  | 'value'
  | 'max'
  | 'defaultValue'
  | 'children'
  | 'style'
  | 'role'
  | 'aria-valuenow'
  | 'aria-valuemin'
  | 'aria-valuemax'
> & {
  /** Omit, or pass null, while the amount of remaining work is unknown. */
  value?: number | null
  max?: number
  style?: ThemeStyle
  'data-slot'?: string
}

/** Read-only native task progress. Its minimum is always zero. */
export function Progress({ value, max = 100, className, ...props }: ProgressProps) {
  if (!Number.isFinite(max) || max <= 0)
    throw new RangeError('Progress max must be positive and finite.')
  if (value != null && (!Number.isFinite(value) || value < 0 || value > max))
    throw new RangeError('Progress value must be finite and between zero and max.')
  const nativeProps = {
    ...props,
    role: undefined,
    'aria-valuenow': undefined,
    'aria-valuemin': undefined,
    'aria-valuemax': undefined,
    defaultValue: undefined
  }
  const state = value == null ? 'indeterminate' : value === max ? 'complete' : 'loading'
  return (
    <progress
      {...nativeProps}
      value={value ?? undefined}
      max={max}
      data-slot={joinIds('progress', props['data-slot'])}
      data-state={state}
      className={cn(
        'block box-border w-full min-w-0 appearance-none overflow-hidden h-[var(--rad-progress-height,0.5rem)] rounded-[var(--rad-progress-radius,9999px)]',
        '[border-width:var(--rad-progress-border-width,var(--rad-surface-border-width,1px))] [border-style:var(--rad-progress-border-style,solid)] [border-color:var(--rad-progress-border-color,var(--rad-color-border))]',
        'bg-[var(--rad-progress-track-color,var(--rad-color-neutral))] [color:var(--rad-progress-indicator-color,var(--rad-color-accent))] [accent-color:var(--rad-progress-indicator-color,var(--rad-color-accent))]',
        '[&::-webkit-progress-bar]:bg-[var(--rad-progress-track-color,var(--rad-color-neutral))] [&::-webkit-progress-bar]:rounded-[inherit]',
        '[&::-webkit-progress-value]:bg-[var(--rad-progress-indicator-color,var(--rad-color-accent))] [&::-webkit-progress-value]:rounded-[inherit]',
        '[&::-moz-progress-bar]:bg-[var(--rad-progress-indicator-color,var(--rad-color-accent))] [&::-moz-progress-bar]:rounded-[inherit]',
        'indeterminate:[border-style:dashed] indeterminate:[&::-webkit-progress-value]:bg-transparent',
        'indeterminate:[&::-webkit-progress-bar]:bg-[repeating-linear-gradient(135deg,var(--rad-progress-track-color,var(--rad-color-neutral))_0_0.5rem,var(--rad-progress-indicator-color,var(--rad-color-accent))_0.5rem_1rem)]',
        'indeterminate:[&::-moz-progress-bar]:bg-[repeating-linear-gradient(135deg,var(--rad-progress-track-color,var(--rad-color-neutral))_0_0.5rem,var(--rad-progress-indicator-color,var(--rad-color-accent))_0.5rem_1rem)]',
        'forced-colors:[border-color:CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[Highlight] forced-colors:[&::-webkit-progress-bar]:bg-[Canvas] forced-colors:[&::-webkit-progress-value]:bg-[Highlight] forced-colors:[&::-moz-progress-bar]:bg-[Highlight] forced-colors:indeterminate:[&::-webkit-progress-value]:bg-transparent',
        className
      )}
    >
      {props['aria-valuetext'] ?? (value == null ? null : `${value} of ${max}`)}
    </progress>
  )
}
