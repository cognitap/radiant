'use client'

import type { ComponentProps } from 'react'
import { cn } from './cn.js'
import { useFieldControl } from './Field.js'
import { controlBorderClass, controlMetrics } from './controlStyles.js'
import { useNativeOwner, type ValueOwner } from './react/useNativeOwner.js'
import type { ThemeStyle } from './themes/defineTheme.js'
import type { ControlSize } from './presentation.js'

const sliderClass = [
  controlBorderClass,
  '[--_rad-slider-thumb-size:var(--rad-slider-thumb-size,var(--_rad-control-indicator-size))]',
  '[--_rad-slider-track-size:var(--rad-slider-track-size,0.375rem)]',
  '[--_rad-slider-track:var(--rad-slider-track-color,var(--_rad-control-border))]',
  '[--_rad-slider-thumb:var(--rad-slider-thumb-color,var(--rad-color-accent,oklch(0.21_0.006_286)))]',
  'm-0 block min-w-0 appearance-none cursor-default bg-transparent p-0',
  'focus-visible:outline-solid',
  'focus-visible:[outline-color:var(--rad-slider-focus-color,var(--rad-color-focus,oklch(0.55_0.13_255)))]',
  'focus-visible:[outline-width:var(--rad-slider-focus-width,var(--rad-focus-width,2px))]',
  'focus-visible:[outline-offset:var(--rad-slider-focus-offset,var(--rad-focus-offset,2px))]',
  'focus-visible:[outline-style:var(--rad-slider-focus-style,var(--rad-focus-style,solid))]',
  'data-invalid:[--_rad-slider-track:var(--rad-slider-invalid-track,var(--rad-color-invalid,oklch(0.56_0.19_25)))]',
  'disabled:cursor-not-allowed',
  'disabled:[--_rad-slider-track:var(--rad-slider-disabled-track,var(--rad-color-disabled-border,oklch(0.88_0.005_286)))]',
  'disabled:[--_rad-slider-thumb:var(--rad-slider-disabled-thumb,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))]',
  '[&::-webkit-slider-runnable-track]:[block-size:var(--_rad-slider-track-size)]',
  '[&::-webkit-slider-runnable-track]:[inline-size:100%]',
  '[&::-webkit-slider-runnable-track]:rounded-[var(--rad-slider-track-radius,var(--rad-control-radius,0.5rem))]',
  '[&::-webkit-slider-runnable-track]:bg-[var(--_rad-slider-track)]',
  '[&::-webkit-slider-thumb]:appearance-none',
  '[&::-webkit-slider-thumb]:box-border',
  '[&::-webkit-slider-thumb]:size-[var(--_rad-slider-thumb-size)]',
  '[&::-webkit-slider-thumb]:[margin-block-start:calc((var(--_rad-slider-track-size)_-_var(--_rad-slider-thumb-size))/2)]',
  '[&::-webkit-slider-thumb]:rounded-[var(--rad-slider-thumb-radius,var(--rad-control-radius,0.5rem))]',
  '[&::-webkit-slider-thumb]:[corner-shape:var(--rad-slider-corner-shape,var(--rad-control-corner-shape,round))]',
  '[&::-webkit-slider-thumb]:[border-width:var(--rad-slider-thumb-border-width,0px)]',
  '[&::-webkit-slider-thumb]:border-solid',
  '[&::-webkit-slider-thumb]:[border-color:var(--rad-slider-thumb-border-color,var(--_rad-slider-thumb))]',
  '[&::-webkit-slider-thumb]:bg-[var(--_rad-slider-thumb)]',
  '[&::-webkit-slider-thumb]:[box-shadow:var(--rad-slider-thumb-shadow,none)]',
  '[&::-moz-range-track]:[block-size:var(--_rad-slider-track-size)]',
  '[&::-moz-range-track]:[inline-size:100%]',
  '[&::-moz-range-track]:rounded-[var(--rad-slider-track-radius,var(--rad-control-radius,0.5rem))]',
  '[&::-moz-range-track]:bg-[var(--_rad-slider-track)]',
  '[&::-moz-range-thumb]:box-border',
  '[&::-moz-range-thumb]:size-[var(--_rad-slider-thumb-size)]',
  '[&::-moz-range-thumb]:rounded-[var(--rad-slider-thumb-radius,var(--rad-control-radius,0.5rem))]',
  '[&::-moz-range-thumb]:[corner-shape:var(--rad-slider-corner-shape,var(--rad-control-corner-shape,round))]',
  '[&::-moz-range-thumb]:[border-width:var(--rad-slider-thumb-border-width,0px)]',
  '[&::-moz-range-thumb]:border-solid',
  '[&::-moz-range-thumb]:[border-color:var(--rad-slider-thumb-border-color,var(--_rad-slider-thumb))]',
  '[&::-moz-range-thumb]:bg-[var(--_rad-slider-thumb)]',
  '[&::-moz-range-thumb]:[box-shadow:var(--rad-slider-thumb-shadow,none)]',
  'forced-colors:appearance-auto',
  'forced-colors:focus-visible:outline-[Highlight]',
  'forced-colors:[&::-webkit-slider-runnable-track]:[all:revert]',
  'forced-colors:[&::-webkit-slider-thumb]:[all:revert]',
  'forced-colors:[&::-moz-range-track]:[all:revert]',
  'forced-colors:[&::-moz-range-thumb]:[all:revert]'
].join(' ')

export type SliderProps = Omit<
  ComponentProps<'input'>,
  | 'type'
  | 'role'
  | 'value'
  | 'defaultValue'
  | 'checked'
  | 'defaultChecked'
  | 'required'
  | 'readOnly'
  | 'aria-required'
  | 'aria-orientation'
  | 'aria-valuenow'
  | 'aria-valuemin'
  | 'aria-valuemax'
  | 'size'
  | 'children'
  | 'style'
> &
  ValueOwner<number> & {
    orientation?: 'horizontal' | 'vertical'
    controlSize?: ControlSize
    /** Native input styles, including slider track/thumb theme variables. */
    style?: ThemeStyle
  }

/** One native range input owns numeric selection, keyboard, pointer and forms. */
export function Slider({
  className,
  controlSize = 'medium',
  orientation = 'horizontal',
  id,
  disabled,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: SliderProps) {
  useNativeOwner('Slider', props.value, props.defaultValue)
  for (const value of [props.value, props.defaultValue]) {
    if (value !== undefined && !Number.isFinite(value))
      throw new TypeError('Slider values must be finite numbers.')
  }
  const { role: _role, ...nativeProps }: ComponentProps<'input'> = props
  // Range always has a numeric value; required/readOnly do not apply to it.
  const {
    required: _required,
    'aria-required': _ariaRequired,
    ...control
  } = useFieldControl({
    id,
    disabled,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid
  })
  return (
    <input
      {...nativeProps}
      {...control}
      className={cn(
        sliderClass,
        controlMetrics({ controlSize }),
        orientation === 'vertical'
          ? 'h-[var(--rad-slider-length,12rem)] w-[var(--rad-slider-height,var(--_rad-control-height))] [writing-mode:vertical-lr] [direction:rtl]'
          : 'h-[var(--rad-slider-height,var(--_rad-control-height))] w-[var(--rad-slider-length,100%)]',
        className
      )}
      data-slot="slider"
      data-control-size={controlSize}
      data-orientation={orientation}
      type="range"
      required={undefined}
      readOnly={undefined}
      aria-required={undefined}
      aria-orientation={orientation}
      aria-valuenow={undefined}
      aria-valuemin={undefined}
      aria-valuemax={undefined}
    />
  )
}
