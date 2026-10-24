'use client'

import type { ComponentProps, CSSProperties, ReactNode, Ref } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn.js'
import { useField } from './Field.js'

const checkboxVariants = cva([
  'peer col-start-1 row-start-1 m-0 box-border appearance-none',
  'size-[var(--checkbox-size,1.5rem)]',
  'rounded-[var(--checkbox-radius,var(--button-radius,0.375rem))]',
  '[corner-shape:var(--checkbox-corner-shape,var(--button-corner-shape,unset))]',
  '[border-width:var(--checkbox-border-width,var(--button-border-width,1px))]',
  '[border-style:var(--checkbox-border-style,var(--button-border-style,solid))]',
  '[border-color:var(--checkbox-border-color,var(--button-border-color,var(--color-border)))]',
  'bg-[var(--checkbox-background,var(--color-background))]',
  'checked:bg-[var(--checkbox-checked-background,var(--color-primary))]',
  'checked:[border-color:var(--checkbox-checked-border,var(--checkbox-checked-background,var(--color-primary)))]',
  'indeterminate:bg-[var(--checkbox-checked-background,var(--color-primary))]',
  'indeterminate:[border-color:var(--checkbox-checked-border,var(--checkbox-checked-background,var(--color-primary)))]',
  'aria-invalid:[border-color:var(--checkbox-invalid-border,var(--color-destructive))]',
  'focus-visible:outline-solid',
  'focus-visible:[outline-color:var(--checkbox-focus-color,var(--input-focus-color,var(--button-focus-color,var(--color-focus))))]',
  'focus-visible:[outline-width:var(--checkbox-focus-width,var(--input-focus-width,var(--button-focus-width,2px)))]',
  'focus-visible:[outline-offset:var(--checkbox-focus-offset,var(--input-focus-offset,var(--button-focus-offset,2px)))]',
  'focus-visible:[outline-style:var(--checkbox-focus-style,var(--input-focus-style,var(--button-focus-style,solid)))]',
  'disabled:cursor-not-allowed',
  'disabled:[border-color:var(--checkbox-disabled-border,color-mix(in_oklch,var(--color-foreground),transparent_70%))]',
  'disabled:checked:bg-[var(--checkbox-disabled-background,color-mix(in_oklch,var(--color-foreground),transparent_70%))]',
  'disabled:indeterminate:bg-[var(--checkbox-disabled-background,color-mix(in_oklch,var(--color-foreground),transparent_70%))]',
  'forced-colors:border-[CanvasText]',
  'forced-colors:checked:bg-[Highlight] forced-colors:indeterminate:bg-[Highlight]',
  'forced-colors:disabled:border-[GrayText] forced-colors:disabled:bg-[Canvas]'
])

const markClass =
  'pointer-events-none col-start-1 row-start-1 size-[calc(var(--checkbox-size,1.5rem)*0.65)] self-center justify-self-center [color:var(--checkbox-mark,var(--color-primary-foreground))] forced-colors:text-[HighlightText]'

const rowClass =
  'inline-flex min-h-6 cursor-pointer items-center gap-[var(--checkbox-gap,0.5rem)] select-none has-disabled:cursor-not-allowed'

const labelClass =
  'leading-snug [color:var(--checkbox-label-color,var(--color-foreground))] [font-size:var(--checkbox-label-size,0.875rem)]'

export type CheckboxProps = Omit<ComponentProps<'input'>, 'type'> & {
  label?: ReactNode
  indeterminate?: boolean
}

export type CheckboxTheme = {
  size?: string
  radius?: string
  cornerShape?: string
  borderWidth?: string
  borderStyle?: string
  borderColor?: string
  background?: string
  checkedBackground?: string
  checkedBorder?: string
  mark?: string
  invalidBorder?: string
  gap?: string
  labelColor?: string
  labelSize?: string
  disabledBorder?: string
  disabledBackground?: string
  focusColor?: string
  focusWidth?: string
  focusOffset?: string
  focusStyle?: string
}

const checkboxThemeVariables: Record<keyof CheckboxTheme, string> = {
  size: '--checkbox-size',
  radius: '--checkbox-radius',
  cornerShape: '--checkbox-corner-shape',
  borderWidth: '--checkbox-border-width',
  borderStyle: '--checkbox-border-style',
  borderColor: '--checkbox-border-color',
  background: '--checkbox-background',
  checkedBackground: '--checkbox-checked-background',
  checkedBorder: '--checkbox-checked-border',
  mark: '--checkbox-mark',
  invalidBorder: '--checkbox-invalid-border',
  gap: '--checkbox-gap',
  labelColor: '--checkbox-label-color',
  labelSize: '--checkbox-label-size',
  disabledBorder: '--checkbox-disabled-border',
  disabledBackground: '--checkbox-disabled-background',
  focusColor: '--checkbox-focus-color',
  focusWidth: '--checkbox-focus-width',
  focusOffset: '--checkbox-focus-offset',
  focusStyle: '--checkbox-focus-style'
}

function joinIds(...parts: Array<string | undefined>) {
  const ids = [...new Set(parts.flatMap(part => (part ? part.split(/\s+/) : [])).filter(Boolean))]
  return ids.length > 0 ? ids.join(' ') : undefined
}

function assignRefs<T>(node: T | null, ...refs: Array<Ref<T> | undefined>) {
  for (const ref of refs) {
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }
}

function hasContent(value: ReactNode) {
  return value != null && value !== false && value !== ''
}

export function checkboxTheme(theme: CheckboxTheme): CSSProperties {
  const style: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(theme)) {
    if (value !== undefined) style[checkboxThemeVariables[key as keyof CheckboxTheme]] = value
  }
  return style as CSSProperties
}

export function Checkbox({
  className,
  label,
  indeterminate = false,
  id,
  disabled,
  required,
  ref,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  ...props
}: CheckboxProps) {
  const field = useField()
  const control = field?.layout === 'control' ? field.controlProps : null
  const invalid = ariaInvalid ?? control?.['aria-invalid']
  const controlNode = (
    <span className="inline-grid shrink-0">
      <input
        {...control}
        {...props}
        ref={node => {
          if (node) node.indeterminate = indeterminate
          assignRefs(node, ref)
        }}
        aria-describedby={joinIds(control?.['aria-describedby'], ariaDescribedBy)}
        aria-invalid={invalid}
        aria-required={ariaRequired ?? control?.['aria-required']}
        className={cn(checkboxVariants(), className)}
        data-invalid={invalid === true || invalid === 'true' ? '' : undefined}
        data-slot="checkbox"
        disabled={disabled ?? control?.disabled}
        id={control?.id ?? id}
        required={required ?? control?.required}
        type="checkbox"
      />
      <svg
        aria-hidden="true"
        className={cn(markClass, 'opacity-0 peer-checked:opacity-100 peer-indeterminate:opacity-0')}
        fill="none"
        viewBox="0 0 16 16"
      >
        <path
          d="M3.5 8.5 6.5 11.5 12.5 4.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
      <svg
        aria-hidden="true"
        className={cn(markClass, 'opacity-0 peer-indeterminate:opacity-100')}
        fill="none"
        viewBox="0 0 16 16"
      >
        <path
          d="M3.5 8h9"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
    </span>
  )

  if (!hasContent(label)) return controlNode

  return (
    <label className={rowClass}>
      {controlNode}
      <span
        className={labelClass}
        data-slot="checkbox-label"
      >
        {label}
      </span>
    </label>
  )
}
