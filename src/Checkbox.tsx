'use client'

import type { ComponentProps, CSSProperties, ReactNode, Ref } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn.js'
import { flattenComponents, type ThemeComponentOverrides } from './themes/components.js'
import { useField } from './Field.js'

const checkboxVariants = cva([
  'peer col-start-1 row-start-1 m-0 box-border appearance-none',
  'size-[var(--rad-checkbox-size,var(--rad-control-medium-indicator-size,1.125rem))]',
  'rounded-[var(--rad-checkbox-radius,var(--rad-control-radius,0.5rem))]',
  '[corner-shape:var(--rad-checkbox-corner-shape,var(--rad-control-corner-shape,round))]',
  '[border-width:var(--rad-checkbox-border-width,var(--rad-control-border-width,1px))]',
  '[border-style:var(--rad-checkbox-border-style,var(--rad-control-border-style,solid))]',
  '[border-color:var(--rad-checkbox-border-color,var(--rad-color-border,oklch(0.885_0.005_286)))]',
  'bg-[var(--rad-checkbox-background,var(--rad-color-surface,oklch(1_0_0)))]',
  'checked:bg-[var(--rad-checkbox-checked-background,var(--rad-color-accent,oklch(0.21_0.006_286)))]',
  'checked:[border-color:var(--rad-checkbox-checked-border,var(--rad-checkbox-checked-background,var(--rad-color-accent,oklch(0.21_0.006_286))))]',
  'indeterminate:bg-[var(--rad-checkbox-checked-background,var(--rad-color-accent,oklch(0.21_0.006_286)))]',
  'indeterminate:[border-color:var(--rad-checkbox-checked-border,var(--rad-checkbox-checked-background,var(--rad-color-accent,oklch(0.21_0.006_286))))]',
  'aria-invalid:[border-color:var(--rad-checkbox-invalid-border,var(--rad-color-invalid,oklch(0.56_0.19_25)))]',
  'focus-visible:outline-solid',
  'focus-visible:[outline-color:var(--rad-checkbox-focus-color,var(--rad-color-focus,oklch(0.55_0.13_255)))]',
  'focus-visible:[outline-width:var(--rad-checkbox-focus-width,var(--rad-focus-width,2px))]',
  'focus-visible:[outline-offset:var(--rad-checkbox-focus-offset,var(--rad-focus-offset,2px))]',
  'focus-visible:[outline-style:var(--rad-checkbox-focus-style,var(--rad-focus-style,solid))]',
  'disabled:cursor-not-allowed',
  'disabled:[border-color:var(--rad-checkbox-disabled-border,var(--rad-color-disabled-border,oklch(0.88_0.005_286)))]',
  'disabled:checked:bg-[var(--rad-checkbox-disabled-background,var(--rad-color-disabled-background,oklch(0.96_0.005_286)))]',
  'disabled:indeterminate:bg-[var(--rad-checkbox-disabled-background,var(--rad-color-disabled-background,oklch(0.96_0.005_286)))]',
  'forced-colors:border-[CanvasText]',
  'forced-colors:checked:bg-[Highlight] forced-colors:indeterminate:bg-[Highlight]',
  'forced-colors:disabled:border-[GrayText] forced-colors:disabled:bg-[Canvas]'
])

const markClass =
  'pointer-events-none col-start-1 row-start-1 size-[calc(var(--rad-checkbox-size,var(--rad-control-medium-indicator-size,1.125rem))*0.65)] self-center justify-self-center [color:var(--rad-checkbox-mark,var(--rad-color-accent-foreground,oklch(0.985_0_0)))] forced-colors:text-[HighlightText]'

const rowClass =
  '[font-family:var(--rad-typography-family,system-ui,sans-serif)] [letter-spacing:var(--rad-typography-letter-spacing,-0.011em)] [font-weight:var(--rad-typography-body-weight,400)] inline-flex min-h-6 cursor-pointer items-center gap-[var(--rad-checkbox-gap,var(--rad-spacing-label-gap,0.5rem))] select-none has-disabled:cursor-not-allowed'

const labelClass =
  'leading-snug [color:var(--rad-checkbox-label-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))] [font-size:var(--rad-checkbox-label-size,var(--rad-typography-body-size,0.875rem))]'

export type CheckboxProps = Omit<ComponentProps<'input'>, 'type'> & {
  label?: ReactNode
  indeterminate?: boolean
}

export type CheckboxTheme = NonNullable<ThemeComponentOverrides['checkbox']>

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
  return flattenComponents({ checkbox: theme }) as CSSProperties
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
    <span className="inline-grid w-fit shrink-0">
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
