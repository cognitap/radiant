'use client'

import { useCallback, useLayoutEffect, useRef, type ComponentProps, type ReactNode } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import { useNativeOwner, type CheckedOwner } from './react/useNativeOwner.js'
import { controlBorderClass, controlMetrics, indicatorPressClass } from './controlStyles.js'
import type { ThemeStyle } from './themes/defineTheme.js'
import type { ControlSize, ControlParts } from './presentation.js'
import { useFieldControl } from './Field.js'

const checkboxVariants = cva([
  controlBorderClass,
  'peer col-start-1 row-start-1 m-0 box-border appearance-none',
  'size-[var(--rad-checkbox-size,var(--_rad-control-indicator-size))]',
  'rounded-[var(--rad-checkbox-radius,min(var(--rad-control-radius,0.5rem),calc(var(--rad-checkbox-size,var(--_rad-control-indicator-size))*0.25)))]',
  '[corner-shape:var(--rad-checkbox-corner-shape,var(--rad-control-corner-shape,round))]',
  '[border-width:var(--rad-checkbox-border-width,var(--rad-control-border-width,1px))]',
  '[border-style:var(--rad-checkbox-border-style,var(--rad-control-border-style,solid))]',
  '[border-color:var(--rad-checkbox-border-color,var(--_rad-control-border))]',
  'bg-[var(--rad-checkbox-background,var(--rad-color-surface,oklch(1_0_0)))]',
  'checked:bg-[var(--rad-checkbox-checked-background,var(--rad-color-accent,oklch(0.21_0.006_286)))]',
  'checked:[border-color:var(--rad-checkbox-checked-border,var(--rad-checkbox-checked-background,var(--rad-color-accent,oklch(0.21_0.006_286))))]',
  'indeterminate:bg-[var(--rad-checkbox-checked-background,var(--rad-color-accent,oklch(0.21_0.006_286)))]',
  'indeterminate:[border-color:var(--rad-checkbox-checked-border,var(--rad-checkbox-checked-background,var(--rad-color-accent,oklch(0.21_0.006_286))))]',
  '[box-shadow:var(--rad-control-indicator-shadow,none)]',
  'checked:[box-shadow:var(--rad-control-indicator-checked-shadow,none)] indeterminate:[box-shadow:var(--rad-control-indicator-checked-shadow,none)]',
  'data-invalid:[border-color:var(--rad-checkbox-invalid-border,var(--rad-color-invalid,oklch(0.56_0.19_25)))]',
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
  'pointer-events-none absolute inset-0 size-full scale-65 [color:var(--rad-checkbox-mark,var(--rad-color-accent-foreground,oklch(0.985_0_0)))] peer-disabled:[color:var(--rad-checkbox-mark,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))] forced-colors:text-[HighlightText] forced-colors:peer-disabled:text-[GrayText]'

const rowClass =
  'inline-flex min-h-6 min-w-0 max-w-full cursor-pointer items-center gap-[var(--rad-checkbox-gap,var(--rad-spacing-label-gap,0.5rem))] select-none has-disabled:cursor-not-allowed'

const labelClass =
  'min-w-0 break-words font-[family-name:var(--rad-typography-roles-ui-label-family,system-ui,sans-serif)] tracking-[var(--rad-typography-roles-ui-label-letter-spacing,-0.011em)] font-[number:var(--rad-typography-roles-ui-label-weight,400)] [color:var(--rad-checkbox-label-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))] text-[length:var(--rad-checkbox-label-size,var(--_rad-control-font-size))] leading-[var(--rad-typography-roles-ui-label-line-height,1.4)]'

export type CheckboxProps = Omit<
  ComponentProps<'input'>,
  'type' | 'checked' | 'defaultChecked' | 'readOnly' | 'style'
> &
  CheckedOwner & {
    /** Convenience label; omit it when Field supplies the single control's label. */
    label?: ReactNode
    /** Native mixed presentation, independent of checked and the submitted value. */
    indeterminate?: boolean
    /** Shared visual metrics, matching Input and RadioGroup. */
    controlSize?: ControlSize
    /** Input styles. Parts style the wrapper, label and decorative indicators. */
    style?: ThemeStyle
    parts?: ControlParts
  }

function hasContent(value: ReactNode) {
  return value != null && value !== false && value !== ''
}

/** Native selection and form behavior. Read event.target.checked for state, value for data. */
export function Checkbox({
  className,
  controlSize = 'medium',
  parts,
  label,
  indeterminate = false,
  id,
  disabled,
  required,
  checked,
  defaultChecked,
  ref,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  ...props
}: CheckboxProps) {
  const controlled = useNativeOwner('Checkbox', checked, defaultChecked)
  const labelled = hasContent(label)
  const control = useFieldControl({
    id,
    disabled,
    required,
    'aria-invalid': ariaInvalid,
    'aria-required': ariaRequired,
    'aria-describedby': ariaDescribedBy
  })
  const nodeRef = useRef<HTMLInputElement>(null)
  const initialise = useCallback(
    (node: HTMLInputElement | null) => {
      nodeRef.current = node
      if (node) {
        node.indeterminate = indeterminate
        if (controlled) node.defaultChecked = node.checked
      }
    },
    [indeterminate, controlled]
  )
  const hostRef = useComposedRefs(initialise, ref)
  useLayoutEffect(() => {
    if (nodeRef.current) {
      nodeRef.current.indeterminate = indeterminate
      if (controlled) nodeRef.current.defaultChecked = !!checked
    }
  })
  const controlNode = (
    <span
      className={cn(
        'relative inline-grid w-fit shrink-0',
        indicatorPressClass,
        !labelled && parts?.wrapper?.className
      )}
      style={!labelled ? parts?.wrapper?.style : undefined}
      data-slot={!labelled ? 'checkbox-wrapper' : undefined}
    >
      <input
        {...props}
        {...control}
        checked={checked}
        defaultChecked={defaultChecked}
        ref={hostRef}
        className={cn(checkboxVariants(), controlMetrics({ controlSize }), className)}
        data-control-size={controlSize}
        data-slot="checkbox"
        type="checkbox"
      />
      <svg
        aria-hidden="true"
        className={cn(
          markClass,
          'opacity-0 peer-checked:opacity-100 peer-indeterminate:opacity-0',
          parts?.indicator?.className
        )}
        style={parts?.indicator?.style}
        data-slot="checkbox-indicator"
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
        className={cn(
          markClass,
          'opacity-0 peer-indeterminate:opacity-100',
          parts?.indicator?.className
        )}
        style={parts?.indicator?.style}
        data-slot="checkbox-indicator"
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

  if (!labelled) return controlNode

  return (
    <label
      className={cn(rowClass, parts?.wrapper?.className)}
      style={parts?.wrapper?.style}
      data-slot="checkbox-wrapper"
    >
      {controlNode}
      <span
        className={cn(labelClass, controlMetrics({ controlSize }), parts?.label?.className)}
        style={parts?.label?.style}
        data-slot="checkbox-label"
      >
        {label}
      </span>
    </label>
  )
}
