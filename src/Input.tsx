import type { ComponentProps, CSSProperties } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn.js'
import { flattenComponents, type ThemeComponentOverrides } from './themes/components.js'
import { useField } from './Field.js'

const inputVariants = cva([
  'box-border w-full min-w-0',
  'h-[var(--rad-input-height,var(--rad-control-medium-height,2.5rem))]',
  'px-[var(--rad-input-padding,var(--rad-control-medium-padding-inline,1rem))]',
  '[font-family:var(--rad-input-font-family,var(--rad-typography-family,system-ui,sans-serif))] [letter-spacing:var(--rad-typography-letter-spacing,-0.011em)]',
  '[font-size:var(--rad-input-font-size,var(--rad-control-medium-font-size,0.875rem))]',
  '[font-weight:var(--rad-input-font-weight,var(--rad-typography-body-weight,400))]',
  '[color:var(--rad-input-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))]',
  'bg-[var(--rad-input-background,var(--rad-color-surface,oklch(1_0_0)))]',
  '[border-width:var(--rad-input-border-width,var(--rad-control-border-width,1px))]',
  '[border-style:var(--rad-input-border-style,var(--rad-control-border-style,solid))]',
  '[border-color:var(--rad-input-border-color,var(--rad-color-border,oklch(0.885_0.005_286)))]',
  'rounded-[var(--rad-input-radius,var(--rad-control-radius,0.5rem))]',
  '[corner-shape:var(--rad-input-corner-shape,var(--rad-control-corner-shape,round))]',
  '[box-shadow:var(--rad-input-shadow,none)]',
  'placeholder:[color:var(--rad-input-placeholder,var(--rad-color-placeholder,oklch(0.5_0.01_286)))]',
  'focus-visible:outline-solid',
  'focus-visible:[outline-color:var(--rad-input-focus-color,var(--rad-color-focus,oklch(0.55_0.13_255)))]',
  'focus-visible:[outline-width:var(--rad-input-focus-width,var(--rad-focus-width,2px))]',
  'focus-visible:[outline-offset:var(--rad-input-focus-offset,var(--rad-focus-offset,2px))]',
  'focus-visible:[outline-style:var(--rad-input-focus-style,var(--rad-focus-style,solid))]',
  'aria-invalid:[border-color:var(--rad-input-invalid-border,var(--rad-color-invalid,oklch(0.56_0.19_25)))]',
  'disabled:cursor-not-allowed',
  'disabled:[background:var(--rad-input-disabled-background,var(--rad-color-disabled-background,oklch(0.96_0.005_286)))]',
  'forced-colors:border-[CanvasText] forced-colors:text-[CanvasText]',
  'forced-colors:disabled:bg-[Canvas] forced-colors:disabled:text-[GrayText]'
])

export type InputProps = ComponentProps<'input'>

export type InputTheme = NonNullable<ThemeComponentOverrides['input']>

function joinIds(...parts: Array<string | undefined>) {
  const ids = [...new Set(parts.flatMap(part => (part ? part.split(/\s+/) : [])).filter(Boolean))]
  return ids.length > 0 ? ids.join(' ') : undefined
}

export function inputTheme(theme: InputTheme): CSSProperties {
  return flattenComponents({ input: theme }) as CSSProperties
}

export function Input({
  className,
  type = 'text',
  id,
  disabled,
  required,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  ...props
}: InputProps) {
  const field = useField()
  const control = field?.layout === 'control' ? field.controlProps : null
  const invalid = ariaInvalid ?? control?.['aria-invalid']

  return (
    <input
      {...control}
      {...props}
      aria-describedby={joinIds(control?.['aria-describedby'], ariaDescribedBy)}
      aria-invalid={invalid}
      aria-required={ariaRequired ?? control?.['aria-required']}
      className={cn(inputVariants(), className)}
      data-invalid={invalid === true || invalid === 'true' ? '' : undefined}
      data-slot="input"
      disabled={disabled ?? control?.disabled}
      id={control?.id ?? id}
      required={required ?? control?.required}
      type={type}
    />
  )
}
