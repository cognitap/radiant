'use client'

import type { ComponentProps, CSSProperties } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn.js'
import { controlBorderClass, controlMetrics } from './controlStyles.js'
import { useNativeOwner, type ValueOwner } from './react/useNativeOwner.js'
import { flattenComponents, type ThemeComponentOverrides } from './themes/components.js'
import type { ThemeStyle } from './themes/defineTheme.js'
import type { ControlSize } from './presentation.js'
import { useFieldControl } from './Field.js'

const inputVariants = cva([
  controlBorderClass,
  'box-border w-full min-w-0',
  'h-[var(--rad-input-height,var(--_rad-control-height))]',
  'px-[var(--rad-input-padding,var(--_rad-control-padding))]',
  '[font-family:var(--rad-input-font-family,var(--rad-typography-family,system-ui,sans-serif))] [letter-spacing:var(--rad-typography-letter-spacing,-0.011em)]',
  '[font-size:var(--rad-input-font-size,var(--_rad-control-font-size))]',
  '[font-weight:var(--rad-input-font-weight,var(--rad-typography-body-weight,400))]',
  '[color:var(--rad-input-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))]',
  'bg-[var(--rad-input-background,var(--rad-color-surface,oklch(1_0_0)))]',
  '[border-width:var(--rad-input-border-width,var(--rad-control-border-width,1px))]',
  '[border-style:var(--rad-input-border-style,var(--rad-control-border-style,solid))]',
  '[border-color:var(--rad-input-border-color,var(--_rad-control-border))]',
  'rounded-[var(--rad-input-radius,var(--rad-control-radius,0.5rem))]',
  '[corner-shape:var(--rad-input-corner-shape,var(--rad-control-corner-shape,round))]',
  '[box-shadow:var(--rad-input-shadow,none)]',
  'placeholder:[color:var(--rad-input-placeholder,var(--rad-color-placeholder,oklch(0.5_0.01_286)))]',
  'focus-visible:outline-solid',
  'focus-visible:[outline-color:var(--rad-input-focus-color,var(--rad-color-focus,oklch(0.55_0.13_255)))]',
  'focus-visible:[outline-width:var(--rad-input-focus-width,var(--rad-focus-width,2px))]',
  'focus-visible:[outline-offset:var(--rad-input-focus-offset,var(--rad-focus-offset,2px))]',
  'focus-visible:[outline-style:var(--rad-input-focus-style,var(--rad-focus-style,solid))]',
  'data-invalid:[border-color:var(--rad-input-invalid-border,var(--rad-color-invalid,oklch(0.56_0.19_25)))]',
  'disabled:cursor-not-allowed',
  'disabled:[background:var(--rad-input-disabled-background,var(--rad-color-disabled-background,oklch(0.96_0.005_286)))]',
  'forced-colors:border-[CanvasText] forced-colors:text-[CanvasText]',
  'forced-colors:disabled:bg-[Canvas] forced-colors:disabled:text-[GrayText]'
])

export type InputProps = Omit<ComponentProps<'input'>, 'value' | 'defaultValue' | 'style'> &
  ValueOwner<Exclude<ComponentProps<'input'>['value'], undefined>> & {
    controlSize?: ControlSize
    style?: ThemeStyle
  }

export type InputTheme = NonNullable<ThemeComponentOverrides['input']>

export function inputTheme(theme: InputTheme): CSSProperties {
  return flattenComponents({ input: theme }) as CSSProperties
}

export function Input({
  className,
  controlSize = 'medium',
  type = 'text',
  id,
  disabled,
  required,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  ...props
}: InputProps) {
  const ownsValue = !['checkbox', 'radio', 'file'].includes(type)
  useNativeOwner('Input', props.value, props.defaultValue, ownsValue)
  if (ownsValue && props.value === null)
    throw new TypeError('Input value cannot be null. Use an empty string.')
  const control = useFieldControl({
    id,
    disabled,
    required,
    'aria-invalid': ariaInvalid,
    'aria-required': ariaRequired,
    'aria-describedby': ariaDescribedBy
  })

  return (
    <input
      {...props}
      {...control}
      className={cn(inputVariants(), controlMetrics({ controlSize }), className)}
      data-control-size={controlSize}
      data-slot="input"
      type={type}
    />
  )
}
