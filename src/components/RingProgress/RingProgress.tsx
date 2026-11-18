'use client'

import type { ComponentProps } from 'react'
import { cn } from 'cn'
import { requireAccessibleName, type AccessibleName } from '../../internal/accessibleName.js'
import { joinIds } from '../../internal/ids.js'
import { useTransitionHost } from '../../motion/host.js'
import type { PartStyle, Tone } from '../../presentation.js'
import { Meter } from '../Meter/Meter.js'
import { Progress } from '../Progress/Progress.js'
import { actionTone } from '../shared/actionStyles.js'

export type RingProgressSegment = {
  /** Contribution to the total above the minimum. */
  value: number
  tone?: Tone
}

type Segments = { segments: readonly RingProgressSegment[]; value?: never }
type Reading<Value> = { value: Value; segments?: never }

export type RingProgressProps = AccessibleName &
  Omit<
    ComponentProps<'span'>,
    | 'children'
    | 'dangerouslySetInnerHTML'
    | 'role'
    | 'style'
    | 'aria-valuemin'
    | 'aria-valuemax'
    | 'aria-valuenow'
  > & {
    max?: number
    /** Visual text inside the ring. Name the indicator separately. */
    label?: string
    tone?: Tone
    motion?: 'inherit' | 'off'
    style?: PartStyle['style']
    parts?: { track?: PartStyle; segment?: PartStyle; label?: PartStyle }
    'data-slot'?: string
  } & (
    | ({ kind?: 'progress'; min?: never } & (
        | { value?: number | null; segments?: never }
        | Segments
      ))
    | ({ kind: 'meter'; min?: number } & (Reading<number> | Segments))
  )

function ringLayout(
  value: number | null | undefined,
  segments: readonly RingProgressSegment[] | undefined,
  min: number,
  max: number,
  tone: Tone
) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max)
    throw new RangeError('RingProgress needs a finite range with max greater than min.')
  if (segments !== undefined && value !== undefined)
    throw new TypeError('RingProgress accepts a value or segments.')
  const range = max - min
  const percent = (point: number) =>
    100 *
    (Number.isFinite(range) ? (point - min) / range : (point / 2 - min / 2) / (max / 2 - min / 2))
  function withinRange(point: number) {
    if (!Number.isFinite(point) || point < min || point > max)
      throw new RangeError('RingProgress value must be within its range.')
    return point
  }
  if (!segments) {
    const reading = value == null ? null : withinRange(value)
    return { reading, arcs: reading === null ? [] : [{ from: 0, to: percent(reading), tone }] }
  }

  let reading = min
  const rounding = Number.EPSILON * Math.max(Math.abs(max), Math.abs(min)) * segments.length
  const arcs = segments.map((segment, index) => {
    if (!Number.isFinite(segment.value) || segment.value < 0)
      throw new RangeError('RingProgress segment values must be finite and nonnegative.')
    const from = percent(reading)
    const next = reading + segment.value
    reading = withinRange(next > max && next - max <= rounding ? max : next)
    const to = percent(reading)
    const gap = Math.min(0.75, (to - from) / 4)
    return {
      from: index ? from + gap : from,
      to: index < segments.length - 1 ? to - gap : to,
      tone: segment.tone ?? tone
    }
  })
  return { reading, arcs }
}

export function RingProgress({
  kind = 'progress',
  value,
  segments,
  min,
  max = 100,
  label,
  tone = 'accent',
  motion = 'inherit',
  parts,
  ref,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
  'aria-valuetext': valueText,
  ...props
}: RingProgressProps) {
  const name = { 'aria-label': ariaLabel, 'aria-labelledby': labelledBy }
  requireAccessibleName('RingProgress', name)
  const minimum = kind === 'meter' ? (min ?? 0) : 0
  const { reading, arcs } = ringLayout(value, segments, minimum, max, tone)
  if (kind === 'meter' && reading === null)
    throw new TypeError('RingProgress in meter mode needs a value or segments.')
  const { ref: ringRef } = useTransitionHost('ring', ref, motion === 'off')
  const native = {
    ...name,
    'aria-describedby': describedBy,
    'aria-valuetext': valueText,
    'data-slot': 'ring-progress-value',
    className: 'sr-only',
    max
  }

  return (
    <span
      {...props}
      ref={ringRef}
      data-slot={joinIds('ring-progress', props['data-slot'])}
      data-kind={kind}
      data-state={reading === null ? 'indeterminate' : reading === max ? 'complete' : 'determinate'}
      className={cn(
        'relative inline-grid box-border aspect-square w-[var(--rad-ring-progress-size,6rem)] max-w-full shrink-0 place-items-center align-middle',
        className
      )}
    >
      {kind === 'meter' && reading !== null ? (
        <Meter
          {...native}
          value={reading}
          min={minimum}
        />
      ) : (
        <Progress
          {...native}
          value={reading}
        />
      )}
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 100 100"
        fill="none"
        className="block size-full [grid-area:1/1]"
        data-slot="ring-progress-graphic"
      >
        <circle
          cx="50"
          cy="50"
          r="43"
          strokeWidth="10"
          data-slot="ring-progress-track"
          className={cn(
            '[stroke:var(--rad-ring-progress-track,var(--rad-color-border))] forced-colors:[stroke:GrayText]',
            parts?.track?.className
          )}
          style={parts?.track?.style}
        />
        {reading === null && (
          <circle
            cx="50"
            cy="50"
            r="43"
            strokeWidth="10"
            pathLength="100"
            strokeDasharray="4 4"
            data-slot="ring-progress-unknown"
            className={cn(
              actionTone({ tone }),
              '[stroke:var(--rad-ring-progress-color,var(--_action-color))] forced-colors:[stroke:Highlight]',
              parts?.segment?.className
            )}
            style={parts?.segment?.style}
          />
        )}
        {arcs.map((arc, index) => (
          <circle
            key={index}
            cx="50"
            cy="50"
            r="43"
            strokeWidth="10"
            pathLength="100"
            transform="rotate(-90 50 50)"
            strokeDasharray={`${arc.to - arc.from} 100`}
            strokeDashoffset={-arc.from}
            data-slot="ring-progress-segment"
            data-tone={arc.tone}
            data-rad-ring-arc={`${arc.from} ${arc.to}`}
            className={cn(
              actionTone({ tone: arc.tone }),
              '[stroke:var(--rad-ring-progress-color,var(--_action-color))] forced-colors:[stroke:Highlight]',
              parts?.segment?.className
            )}
            style={parts?.segment?.style}
          />
        ))}
      </svg>
      {label && (
        <span
          aria-hidden="true"
          data-slot="ring-progress-label"
          className={cn(
            'max-w-[65%] text-center text-xs leading-tight [grid-area:1/1] [overflow-wrap:anywhere]',
            parts?.label?.className
          )}
          style={parts?.label?.style}
        >
          {label}
        </span>
      )}
    </span>
  )
}
