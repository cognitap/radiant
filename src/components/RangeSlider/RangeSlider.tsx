'use client'

import { useId, useRef, type ComponentProps, type PointerEvent } from 'react'
import { cn } from 'cn'
import { requireAccessibleName } from '../../internal/accessibleName.js'
import { addDecimal, multiplyDecimal } from '../../internal/decimal.js'
import { joinIds } from '../../internal/ids.js'
import type { ControlSize, PartStyle } from '../../presentation.js'
import { useControllableState } from '../../react/useControllableState.js'
import { useFormReset } from '../../react/useFormReset.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import { useField, useFieldControl, WithoutField } from '../Field/Field.js'
import { SliderControl } from '../Slider/Slider.js'
import { controlMetrics } from '../shared/controlStyles.js'

export type RangeSliderValue = readonly [lower: number, upper: number]

export type RangeSliderProps = Omit<
  ComponentProps<'fieldset'>,
  | 'children'
  | 'style'
  | 'role'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'onPointerDown'
  | 'dangerouslySetInnerHTML'
> &
  ValueOwner<RangeSliderValue> & {
    min?: number
    max?: number
    step?: number
    lowerLabel: string
    upperLabel: string
    name?: string
    form?: string
    disabled?: boolean
    controlSize?: ControlSize
    onValueChange?: (value: RangeSliderValue) => void
    style?: PartStyle['style']
    parts?: { track?: PartStyle; range?: PartStyle }
    'data-slot'?: string
  }

const thumbClass = [
  'pointer-events-none absolute inset-0 w-full',
  '[&::-webkit-slider-runnable-track]:border-0 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-runnable-track]:shadow-none',
  '[&::-moz-range-track]:border-0 [&::-moz-range-track]:bg-transparent [&::-moz-range-track]:shadow-none',
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto',
  'focus-visible:z-10 focus-visible:outline-none',
  'focus-visible:[&::-webkit-slider-thumb]:outline-2 focus-visible:[&::-webkit-slider-thumb]:outline-offset-2 focus-visible:[&::-webkit-slider-thumb]:outline-[var(--rad-color-focus)]',
  'focus-visible:[&::-moz-range-thumb]:outline-2 focus-visible:[&::-moz-range-thumb]:outline-offset-2 focus-visible:[&::-moz-range-thumb]:outline-[var(--rad-color-focus)]',
  'forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-[Highlight]'
].join(' ')

function equalRange(left: RangeSliderValue, right: RangeSliderValue) {
  return left[0] === right[0] && left[1] === right[1]
}

export function RangeSlider({
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  lowerLabel,
  upperLabel,
  name,
  form,
  disabled,
  controlSize = 'medium',
  id,
  className,
  parts,
  'aria-label': label,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  'data-slot': slot,
  ...root
}: RangeSliderProps) {
  const field = useField()
  const control = useFieldControl({
    disabled,
    'aria-describedby': describedBy,
    'aria-invalid': invalid
  })
  const groupLabel = labelledBy ?? field?.labelId
  requireAccessibleName('RangeSlider', { 'aria-label': label, 'aria-labelledby': groupLabel })
  requireAccessibleName('RangeSlider lower thumb', { 'aria-label': lowerLabel })
  requireAccessibleName('RangeSlider upper thumb', { 'aria-label': upperLabel })

  if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(step) || step <= 0)
    throw new RangeError('RangeSlider needs finite ordered bounds and a step within their range.')
  const span = addDecimal(max, -min)
  const intervals = span / step
  if (!Number.isFinite(span) || intervals < 1 || intervals > Number.MAX_SAFE_INTEGER)
    throw new RangeError('RangeSlider needs finite ordered bounds and a step within their range.')

  // Use decimal coefficients for the value, while indices keep both thumbs on the same lattice.
  const count = Math.floor(intervals + Math.min(0.25, intervals * Number.EPSILON))
  const snap = (point: number) =>
    addDecimal(
      min,
      multiplyDecimal(
        step,
        Math.max(0, Math.min(count, Math.round(addDecimal(point, -min) / step)))
      )
    )
  function normalize(selection: RangeSliderValue | undefined): RangeSliderValue | undefined {
    if (selection === undefined) return undefined
    const [lower, upper] = selection
    if (!Number.isFinite(lower) || !Number.isFinite(upper) || lower > upper)
      throw new RangeError('RangeSlider needs finite lower and upper values in order.')
    return [snap(lower), snap(upper)]
  }

  const owner = useControllableState({
    name: 'RangeSlider value',
    value: normalize(value),
    defaultValue: normalize(defaultValue),
    initialValue: [min, snap(max)] as RangeSliderValue,
    onChange: onValueChange,
    equal: equalRange
  })
  const lower = snap(owner.value[0])
  const upper = snap(owner.value[1])
  const lowerRef = useRef<HTMLInputElement>(null)
  const upperRef = useRef<HTMLInputElement>(null)
  const generatedId = useId()
  useFormReset(lowerRef, owner.reset)

  function request(index: 0 | 1, point: number) {
    const next = snap(point)
    owner.request(index === 0 ? [Math.min(next, upper), upper] : [lower, Math.max(next, lower)])
  }

  function seek(event: PointerEvent<HTMLFieldSetElement>) {
    if (
      control.disabled ||
      event.target !== event.currentTarget ||
      event.button !== 0 ||
      !event.isPrimary
    )
      return
    const track = event.currentTarget.firstElementChild!
    const { left, width } = track.getBoundingClientRect()
    if (!width) return
    const view = track.ownerDocument.defaultView!
    const rtl = view.getComputedStyle(track).direction === 'rtl'
    const offset = Math.max(0, Math.min(1, (event.clientX - left) / width))
    const point = min + (rtl ? 1 - offset : offset) * span
    const useLower = point <= lower || (point < upper && point - lower < upper - point)
    event.preventDefault()
    const target = useLower ? lowerRef : upperRef
    target.current?.focus({ preventScroll: true })
    request(useLower ? 0 : 1, point)
  }

  const native = {
    name,
    form,
    min,
    max,
    step,
    disabled: control.disabled,
    controlSize,
    'aria-describedby': control['aria-describedby'],
    'aria-invalid': control['aria-invalid']
  }
  return (
    <fieldset
      {...root}
      id={id}
      aria-label={label}
      aria-labelledby={groupLabel}
      aria-describedby={control['aria-describedby']}
      data-slot={joinIds('range-slider', slot)}
      className={cn(
        'relative m-0 border-0 p-0 h-[var(--rad-slider-height,var(--_rad-control-height))] w-[var(--rad-slider-length,100%)] min-w-0',
        controlMetrics({ controlSize }),
        className
      )}
      onPointerDown={seek}
    >
      <span
        aria-hidden="true"
        data-slot="range-slider-track"
        className={cn(
          'pointer-events-none absolute inset-y-0 my-auto h-[var(--rad-slider-track-size,0.375rem)] [inset-inline:calc(var(--rad-slider-thumb-width,var(--rad-slider-thumb-size,var(--_rad-control-indicator-size)))/2)] rounded-full bg-[var(--rad-slider-track-color,var(--rad-control-track-background,var(--rad-color-border)))] forced-colors:bg-[CanvasText]',
          parts?.track?.className
        )}
        style={parts?.track?.style}
      >
        <span
          data-slot="range-slider-range"
          className={cn(
            'absolute inset-y-0 rounded-[inherit] bg-[var(--rad-slider-thumb-color,var(--rad-color-accent))] forced-colors:bg-[Highlight]',
            parts?.range?.className
          )}
          style={{
            ...parts?.range?.style,
            insetInlineStart: `${((lower - min) / span) * 100}%`,
            insetInlineEnd: `${((max - upper) / span) * 100}%`
          }}
        />
      </span>
      <WithoutField>
        <SliderControl
          {...native}
          ref={lowerRef}
          id={control.id ?? generatedId}
          aria-label={lowerLabel}
          value={lower}
          effectiveBounds={[min, upper]}
          onValueChange={next => request(0, next)}
          data-slot="range-slider-thumb range-slider-lower"
          className={thumbClass}
        />
        <SliderControl
          {...native}
          ref={upperRef}
          aria-label={upperLabel}
          value={upper}
          effectiveBounds={[lower, snap(max)]}
          onValueChange={next => request(1, next)}
          data-slot="range-slider-thumb range-slider-upper"
          className={thumbClass}
        />
      </WithoutField>
    </fieldset>
  )
}
