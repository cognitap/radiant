import type { ComponentProps, CSSProperties } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn.js'
import { useField } from './Field.js'

const inputVariants = cva([
  'box-border w-full min-w-0',
  'h-[var(--input-height,var(--button-height,2.5rem))]',
  'px-[var(--input-padding,var(--button-padding,0.75rem))]',
  '[font-family:var(--input-font-family,var(--button-font-family,inherit))]',
  '[font-size:var(--input-font-size,var(--button-font-size,0.875rem))]',
  '[font-weight:var(--input-font-weight,400)]',
  '[color:var(--input-color,var(--color-foreground))]',
  'bg-[var(--input-background,var(--color-background))]',
  '[border-width:var(--input-border-width,var(--button-border-width,1px))]',
  '[border-style:var(--input-border-style,var(--button-border-style,solid))]',
  '[border-color:var(--input-border-color,var(--button-border-color,var(--color-border)))]',
  'rounded-[var(--input-radius,var(--button-radius,var(--radius-control)))]',
  '[corner-shape:var(--input-corner-shape,var(--button-corner-shape,unset))]',
  '[box-shadow:var(--input-shadow,none)]',
  'placeholder:[color:var(--input-placeholder,color-mix(in_oklch,var(--color-foreground),transparent_55%))]',
  'focus-visible:outline-solid',
  'focus-visible:[outline-color:var(--input-focus-color,var(--button-focus-color,var(--color-focus)))]',
  'focus-visible:[outline-width:var(--input-focus-width,var(--button-focus-width,2px))]',
  'focus-visible:[outline-offset:var(--input-focus-offset,var(--button-focus-offset,2px))]',
  'focus-visible:[outline-style:var(--input-focus-style,var(--button-focus-style,solid))]',
  'aria-invalid:[border-color:var(--input-invalid-border,var(--color-destructive))]',
  'disabled:cursor-not-allowed',
  'disabled:[background:var(--input-disabled-background,color-mix(in_oklch,var(--color-foreground),transparent_94%))]',
  'forced-colors:border-[CanvasText] forced-colors:text-[CanvasText]',
  'forced-colors:disabled:bg-[Canvas] forced-colors:disabled:text-[GrayText]'
])

export type InputProps = ComponentProps<'input'>

export type InputTheme = {
  height?: string
  padding?: string
  fontFamily?: string
  fontSize?: string
  fontWeight?: string | number
  color?: string
  background?: string
  borderWidth?: string
  borderStyle?: string
  borderColor?: string
  radius?: string
  cornerShape?: string
  shadow?: string
  placeholder?: string
  invalidBorder?: string
  disabledBackground?: string
  focusColor?: string
  focusWidth?: string
  focusOffset?: string
  focusStyle?: string
}

const inputThemeVariables: Record<keyof InputTheme, string> = {
  height: '--input-height',
  padding: '--input-padding',
  fontFamily: '--input-font-family',
  fontSize: '--input-font-size',
  fontWeight: '--input-font-weight',
  color: '--input-color',
  background: '--input-background',
  borderWidth: '--input-border-width',
  borderStyle: '--input-border-style',
  borderColor: '--input-border-color',
  radius: '--input-radius',
  cornerShape: '--input-corner-shape',
  shadow: '--input-shadow',
  placeholder: '--input-placeholder',
  invalidBorder: '--input-invalid-border',
  disabledBackground: '--input-disabled-background',
  focusColor: '--input-focus-color',
  focusWidth: '--input-focus-width',
  focusOffset: '--input-focus-offset',
  focusStyle: '--input-focus-style'
}

function joinIds(...parts: Array<string | undefined>) {
  const ids = [...new Set(parts.flatMap(part => (part ? part.split(/\s+/) : [])).filter(Boolean))]
  return ids.length > 0 ? ids.join(' ') : undefined
}

export function inputTheme(theme: InputTheme): CSSProperties {
  const style: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(theme)) {
    if (value !== undefined) style[inputThemeVariables[key as keyof InputTheme]] = value
  }
  return style as CSSProperties
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
