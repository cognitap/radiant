import type { ComponentProps, ReactElement } from 'react'
import { cn } from 'cn'
import { joinIds } from '../../internal/ids.js'
import type { PartStyle, Tone } from '../../presentation.js'
import { Badge } from '../Badge/Badge.js'

export type IndicatorPosition = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'
export type IndicatorTargetProps = { 'aria-label': string }
export type IndicatorProps = Omit<
  ComponentProps<'span'>,
  'children' | 'style' | 'dangerouslySetInnerHTML' | 'aria-label' | 'aria-labelledby'
> & {
  /** Base accessible name of the decorated target. */
  label: string
  /** Full status, including the uncapped count when rendering a number. */
  statusText: string
  children: (target: IndicatorTargetProps) => ReactElement
  /** Omit to render a dot. */
  count?: number
  maxCount?: number
  position?: IndicatorPosition
  /** CSS pixels outward from the corner. Negative values move inward. */
  offset?: number
  tone?: Tone
  style?: PartStyle['style']
  parts?: { marker?: PartStyle }
  'data-slot'?: string
}

export function Indicator({
  label,
  statusText,
  children,
  count,
  maxCount = 99,
  position = 'top-end',
  offset = 0,
  tone = 'accent',
  parts,
  className,
  ...props
}: IndicatorProps) {
  if (!label.trim() || !statusText.trim())
    throw new TypeError('Indicator requires a label and status text.')
  if (count !== undefined && (!Number.isSafeInteger(count) || count < 0))
    throw new RangeError('Indicator count must be a nonnegative safe integer.')
  if (!Number.isSafeInteger(maxCount) || maxCount < 0)
    throw new RangeError('Indicator maxCount must be a nonnegative safe integer.')
  if (!Number.isFinite(offset)) throw new RangeError('Indicator offset must be finite.')

  const dot = count === undefined
  const end = position.endsWith('end')
  const top = position.startsWith('top')
  return (
    <span
      {...props}
      data-slot={joinIds('indicator', props['data-slot'])}
      data-position={position}
      className={cn('relative inline-flex w-fit min-w-0 max-w-full align-middle', className)}
    >
      {children({ 'aria-label': `${label}, ${statusText}` })}
      <Badge
        decorative
        data-slot="indicator-marker"
        data-kind={dot ? 'dot' : 'count'}
        tone={tone}
        className={cn(
          'pointer-events-none absolute z-10 max-w-none justify-center',
          top
            ? '[inset-block-start:var(--_rad-indicator-inset)] -translate-y-1/2'
            : '[inset-block-end:var(--_rad-indicator-inset)] translate-y-1/2',
          end
            ? '[inset-inline-end:var(--_rad-indicator-inset)] translate-x-1/2 [&:dir(rtl)]:-translate-x-1/2'
            : '[inset-inline-start:var(--_rad-indicator-inset)] -translate-x-1/2 [&:dir(rtl)]:translate-x-1/2',
          dot
            ? 'size-2.5 p-0 bg-[var(--_action-color)] forced-colors:bg-[Highlight]'
            : 'min-w-5 px-1 py-0 whitespace-nowrap text-xs tabular-nums',
          parts?.marker?.className
        )}
        style={{ '--_rad-indicator-inset': `${-offset}px`, ...parts?.marker?.style }}
      >
        {count === undefined ? null : (
          <bdi dir="ltr">{count > maxCount ? `${maxCount}+` : count}</bdi>
        )}
      </Badge>
    </span>
  )
}
