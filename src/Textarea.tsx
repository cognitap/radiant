'use client'

import type { ComponentProps } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn.js'
import { controlBorderClass, controlMetrics } from './controlStyles.js'
import { useNativeOwner, type ValueOwner } from './react/useNativeOwner.js'
import type { ThemeStyle } from './themes/defineTheme.js'
import type { ControlSize } from './presentation.js'
import { useFieldControl } from './Field.js'

const textareaVariants = cva([
  controlBorderClass,
  'box-border w-full min-w-0',
  'min-h-[var(--rad-textarea-min-height,var(--_rad-control-height))]',
  'resize-y overflow-auto',
  'py-[var(--rad-textarea-padding-block,calc((var(--_rad-control-height)_-_1lh)/2_-_var(--rad-textarea-border-width,var(--rad-control-border-width,1px))))]',
  'px-[var(--rad-textarea-padding,var(--_rad-control-padding))]',
  'font-[family-name:var(--rad-textarea-font-family,var(--rad-typography-roles-ui-body-family,system-ui,sans-serif))] tracking-[var(--rad-typography-roles-ui-body-letter-spacing,-0.011em)]',
  'text-[length:var(--rad-textarea-font-size,var(--_rad-control-font-size))]',
  'leading-[var(--rad-typography-roles-ui-body-line-height,1.5)]',
  'font-[number:var(--rad-textarea-font-weight,var(--rad-typography-roles-ui-body-weight,400))]',
  '[color:var(--rad-textarea-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))]',
  'bg-[var(--rad-textarea-background,var(--rad-color-surface,oklch(1_0_0)))]',
  '[border-width:var(--rad-textarea-border-width,var(--rad-control-border-width,1px))]',
  '[border-style:var(--rad-textarea-border-style,var(--rad-control-border-style,solid))]',
  '[border-color:var(--rad-textarea-border-color,var(--_rad-control-border))]',
  'rounded-[var(--rad-textarea-radius,var(--rad-control-radius,0.5rem))]',
  '[corner-shape:var(--rad-textarea-corner-shape,var(--rad-control-corner-shape,round))]',
  '[box-shadow:var(--rad-textarea-shadow,none)]',
  'placeholder:[color:var(--rad-textarea-placeholder,var(--rad-color-placeholder,oklch(0.5_0.01_286)))]',
  'focus-visible:outline-solid',
  'focus-visible:[outline-color:var(--rad-textarea-focus-color,var(--rad-color-focus,oklch(0.55_0.13_255)))]',
  'focus-visible:[outline-width:var(--rad-textarea-focus-width,var(--rad-focus-width,2px))]',
  'focus-visible:[outline-offset:var(--rad-textarea-focus-offset,var(--rad-focus-offset,2px))]',
  'focus-visible:[outline-style:var(--rad-textarea-focus-style,var(--rad-focus-style,solid))]',
  'data-invalid:[border-color:var(--rad-textarea-invalid-border,var(--rad-color-invalid,oklch(0.56_0.19_25)))]',
  'disabled:cursor-not-allowed',
  'disabled:[background:var(--rad-textarea-disabled-background,var(--rad-color-disabled-background,oklch(0.96_0.005_286)))]',
  'forced-colors:border-[CanvasText] forced-colors:text-[CanvasText]',
  'forced-colors:disabled:bg-[Canvas] forced-colors:disabled:text-[GrayText]'
])

export type TextareaProps = Omit<
  ComponentProps<'textarea'>,
  'value' | 'defaultValue' | 'style' | 'children'
> &
  ValueOwner<Exclude<ComponentProps<'textarea'>['value'], undefined>> & {
    /** Set initial text with defaultValue. */
    children?: never
    /** Shared visual metrics. Native rows and cols keep their browser meanings. */
    controlSize?: ControlSize
    /** Applied to the native textarea, including caller-owned motion styles. */
    style?: ThemeStyle
  }

/** Native editing, selection, events and ref; Field supplies owned form relationships. */
export function Textarea(props: TextareaProps) {
  return (
    <TextareaRoot
      {...props}
      family={undefined}
    />
  )
}

/** Private composition seam; the native control retains its Field and value owners. */
export function TextareaRoot({
  family,
  className,
  controlSize = 'medium',
  rows = 3,
  id,
  disabled,
  required,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  ...props
}: TextareaProps & { family?: 'input-group-textarea' }) {
  useNativeOwner('Textarea', props.value, props.defaultValue)
  if (props.value === null)
    throw new TypeError('Textarea value cannot be null. Use an empty string.')
  const control = useFieldControl({
    id,
    disabled,
    required,
    'aria-invalid': ariaInvalid,
    'aria-required': ariaRequired,
    'aria-describedby': ariaDescribedBy
  })

  return (
    <textarea
      {...props}
      {...control}
      className={cn(textareaVariants(), controlMetrics({ controlSize }), className)}
      data-control-size={controlSize}
      data-slot={family ? `textarea ${family}` : 'textarea'}
      rows={rows}
    />
  )
}
