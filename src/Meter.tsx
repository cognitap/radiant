import type { ComponentProps } from 'react'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type MeterProps = Omit<
  ComponentProps<'meter'>,
  | 'value'
  | 'min'
  | 'max'
  | 'low'
  | 'high'
  | 'optimum'
  | 'defaultValue'
  | 'children'
  | 'style'
  | 'role'
  | 'aria-valuenow'
  | 'aria-valuemin'
  | 'aria-valuemax'
> & {
  value: number
  min?: number
  max?: number
  low?: number
  high?: number
  optimum?: number
  style?: ThemeStyle
  'data-slot'?: string
}

function quality(value: number, low: number, high: number, optimum: number) {
  if (optimum < low) {
    if (value <= low) return 'accent'
    return value <= high ? 'warning' : 'danger'
  }
  if (optimum > high) {
    if (value >= high) return 'accent'
    return value >= low ? 'warning' : 'danger'
  }
  return value >= low && value <= high ? 'accent' : 'warning'
}

/** Native measured level within a known range; the browser owns gauge semantics. */
export function Meter({
  value,
  min = 0,
  max = 1,
  low,
  high,
  optimum,
  className,
  ...props
}: MeterProps) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min)
    throw new RangeError('Meter min and max must be finite, with max greater than min.')
  if (!Number.isFinite(value) || value < min || value > max)
    throw new RangeError('Meter value must be finite and within min and max.')
  const lower = low ?? min,
    upper = high ?? max,
    target = optimum ?? min / 2 + max / 2
  if (
    !Number.isFinite(lower) ||
    !Number.isFinite(upper) ||
    lower < min ||
    upper > max ||
    lower > upper
  )
    throw new RangeError('Meter thresholds must satisfy min <= low <= high <= max.')
  if (!Number.isFinite(target) || target < min || target > max)
    throw new RangeError('Meter optimum must be finite and within min and max.')
  const tone = quality(value, lower, upper, target),
    text = props['aria-valuetext'] ?? `${value} of ${max}`
  const native = {
    ...props,
    role: undefined,
    'aria-valuenow': undefined,
    'aria-valuemin': undefined,
    'aria-valuemax': undefined,
    defaultValue: undefined
  }
  return (
    <meter
      {...native}
      value={value}
      min={min}
      max={max}
      low={low}
      high={high}
      optimum={optimum}
      aria-valuetext={text}
      data-slot={joinIds('meter', props['data-slot'])}
      data-tone={tone}
      className={cn(
        '[--_rad-meter-height:var(--rad-meter-height,0.5rem)]',
        'block box-border w-full min-w-0 appearance-none overflow-hidden h-[var(--_rad-meter-height)] rounded-[min(var(--rad-meter-radius,var(--rad-control-radius,0.5rem)),calc(var(--_rad-meter-height)/2))] [corner-shape:var(--rad-control-corner-shape,round)]',
        '[border-width:var(--rad-meter-border-width,var(--rad-control-track-border-width,var(--rad-control-border-width,1px)))] [border-style:var(--rad-meter-border-style,var(--rad-control-border-style,solid))] [border-color:var(--rad-meter-border-color,var(--rad-color-border))] [box-shadow:var(--rad-control-track-shadow,none)]',
        'bg-[var(--rad-meter-track-color,var(--rad-control-track-background,var(--rad-color-neutral)))] [color:var(--_rad-meter-fill)] [accent-color:var(--_rad-meter-fill)]',
        tone === 'danger'
          ? '[--_rad-meter-fill:var(--rad-meter-danger-color,color-mix(in_oklch,var(--rad-color-danger)_60%,var(--rad-color-foreground)))]'
          : tone === 'warning'
            ? '[--_rad-meter-fill:var(--rad-meter-warning-color,color-mix(in_oklch,var(--rad-color-warning)_60%,var(--rad-color-foreground)))]'
            : '[--_rad-meter-fill:var(--rad-meter-indicator-color,color-mix(in_oklch,var(--rad-color-accent)_60%,var(--rad-color-foreground)))]',
        '[&::-webkit-meter-inner-element]:block [&::-webkit-meter-inner-element]:h-full [&::-webkit-meter-inner-element]:w-full',
        '[&::-webkit-meter-bar]:h-full [&::-webkit-meter-bar]:rounded-[inherit] [&::-webkit-meter-bar]:[corner-shape:inherit] [&::-webkit-meter-bar]:border-0 [&::-webkit-meter-bar]:bg-none [&::-webkit-meter-bar]:bg-transparent [&::-webkit-meter-bar]:shadow-none',
        '[&::-webkit-meter-optimum-value]:rounded-[inherit] [&::-webkit-meter-optimum-value]:[corner-shape:inherit] [&::-webkit-meter-optimum-value]:bg-none [&::-webkit-meter-optimum-value]:bg-[var(--_rad-meter-fill)] [&::-webkit-meter-optimum-value]:transition-none',
        '[&::-webkit-meter-suboptimum-value]:rounded-[inherit] [&::-webkit-meter-suboptimum-value]:[corner-shape:inherit] [&::-webkit-meter-suboptimum-value]:bg-none [&::-webkit-meter-suboptimum-value]:bg-[var(--_rad-meter-fill)] [&::-webkit-meter-suboptimum-value]:transition-none',
        '[&::-webkit-meter-even-less-good-value]:rounded-[inherit] [&::-webkit-meter-even-less-good-value]:[corner-shape:inherit] [&::-webkit-meter-even-less-good-value]:bg-none [&::-webkit-meter-even-less-good-value]:bg-[var(--_rad-meter-fill)] [&::-webkit-meter-even-less-good-value]:transition-none',
        '[&::-moz-meter-bar]:rounded-[inherit] [&::-moz-meter-bar]:[corner-shape:inherit] [&::-moz-meter-bar]:border-0 [&::-moz-meter-bar]:bg-none [&::-moz-meter-bar]:bg-[var(--_rad-meter-fill)] [&::-moz-meter-bar]:transition-none',
        'forced-colors:[border-color:CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[Highlight] forced-colors:[&::-webkit-meter-bar]:bg-[Canvas] forced-colors:[&::-webkit-meter-optimum-value]:bg-[Highlight] forced-colors:[&::-webkit-meter-suboptimum-value]:bg-[Highlight] forced-colors:[&::-webkit-meter-even-less-good-value]:bg-[Highlight] forced-colors:[&::-moz-meter-bar]:bg-[Highlight]',
        className
      )}
    >
      {text}
    </meter>
  )
}
