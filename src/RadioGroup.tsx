'use client'

import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState } from 'react'
import type { ChangeEvent, ComponentProps, CSSProperties, ReactNode } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import { useNativeOwner, type ValueOwner, type CheckedOwner } from './react/useNativeOwner.js'
import { controlBorderClass, controlMetrics } from './controlStyles.js'
import { flattenComponents, type ThemeComponentOverrides } from './themes/components.js'
import { Field, useFieldControl } from './Field.js'
import type { FieldProps } from './Field.js'
import type { ThemeStyle } from './themes/defineTheme.js'
import type { ControlSize } from './presentation.js'

const radioVariants = cva([
  controlBorderClass,
  'peer col-start-1 row-start-1 m-0 box-border appearance-none',
  'size-[var(--rad-radio-size,var(--_rad-control-indicator-size))]',
  'rounded-[var(--rad-radio-radius,999px)]',
  '[corner-shape:var(--rad-radio-corner-shape,unset)]',
  '[border-width:var(--rad-radio-border-width,var(--rad-control-border-width,1px))]',
  '[border-style:var(--rad-radio-border-style,var(--rad-control-border-style,solid))]',
  '[border-color:var(--rad-radio-border-color,var(--_rad-control-border))]',
  'bg-[var(--rad-radio-background,var(--rad-color-surface,oklch(1_0_0)))]',
  'checked:bg-[var(--rad-radio-checked-background,var(--rad-color-accent,oklch(0.21_0.006_286)))]',
  'checked:[border-color:var(--rad-radio-checked-border,var(--rad-radio-checked-background,var(--rad-color-accent,oklch(0.21_0.006_286))))]',
  'data-invalid:[border-color:var(--rad-radio-invalid-border,var(--rad-color-invalid,oklch(0.56_0.19_25)))]',
  'in-data-invalid:[border-color:var(--rad-radio-invalid-border,var(--rad-color-invalid,oklch(0.56_0.19_25)))]',
  'focus-visible:outline-solid',
  'focus-visible:[outline-color:var(--rad-radio-focus-color,var(--rad-color-focus,oklch(0.55_0.13_255)))]',
  'focus-visible:[outline-width:var(--rad-radio-focus-width,var(--rad-focus-width,2px))]',
  'focus-visible:[outline-offset:var(--rad-radio-focus-offset,var(--rad-focus-offset,2px))]',
  'focus-visible:[outline-style:var(--rad-radio-focus-style,var(--rad-focus-style,solid))]',
  'disabled:cursor-not-allowed',
  'disabled:[border-color:var(--rad-radio-disabled-border,var(--rad-color-disabled-border,oklch(0.88_0.005_286)))]',
  'disabled:checked:bg-[var(--rad-radio-disabled-background,var(--rad-color-disabled-background,oklch(0.96_0.005_286)))]',
  'forced-colors:border-[CanvasText]',
  'forced-colors:checked:bg-[Highlight]',
  'forced-colors:disabled:border-[GrayText] forced-colors:disabled:bg-[Canvas]'
])

const dotClass =
  'pointer-events-none absolute inset-[30%] rounded-[var(--rad-radio-radius,999px)] bg-[var(--rad-radio-mark,var(--rad-color-accent-foreground,oklch(0.985_0_0)))] peer-disabled:bg-[var(--rad-radio-mark,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))] opacity-0 peer-checked:opacity-100 forced-colors:bg-[HighlightText] forced-colors:peer-disabled:bg-[GrayText]'

const rowClass =
  '[font-family:var(--rad-typography-family,system-ui,sans-serif)] [letter-spacing:var(--rad-typography-letter-spacing,-0.011em)] [font-weight:var(--rad-typography-body-weight,400)] inline-flex min-h-6 cursor-pointer items-center gap-[var(--rad-radio-label-gap,var(--rad-spacing-label-gap,0.5rem))] select-none has-disabled:cursor-not-allowed'

const labelClass =
  'leading-snug [color:var(--rad-radio-label-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))] [font-size:var(--rad-radio-label-size,var(--_rad-control-font-size))]'

const optionsClass =
  'grid justify-items-start gap-[var(--rad-radio-group-gap,var(--rad-spacing-group-gap,0.75rem))]'

export type RadioTheme = NonNullable<ThemeComponentOverrides['radio']> & { gap?: string }

type RadioGroupContextValue = {
  name: string
  value?: string | null
  defaultValue?: string | null
  controlled: boolean
  required?: boolean
  controlSize: ControlSize
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
  onValueChange?: (value: string) => void
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null)

export type RadioGroupProps = Omit<
  Extract<FieldProps, { layout: 'group' }>,
  'layout' | 'children' | 'onChange' | 'defaultValue'
> &
  ValueOwner<string | null> & {
    name: string
    controlSize?: ControlSize
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void
    onValueChange?: (value: string) => void
    children?: ReactNode
  }

export type RadioProps = Omit<
  ComponentProps<'input'>,
  'type' | 'value' | 'checked' | 'defaultChecked' | 'style'
> &
  CheckedOwner & {
    label?: ReactNode
    value: string
    controlSize?: ControlSize
    style?: ThemeStyle
  }

function hasContent(value: ReactNode) {
  return value != null && value !== false && value !== ''
}

export function radioTheme(theme: RadioTheme): CSSProperties {
  const { gap, ...radio } = theme
  return flattenComponents({ radio, radioGroup: { gap } }) as CSSProperties
}

export function RadioGroup({
  name,
  value,
  defaultValue,
  onValueChange,
  onChange,
  children,
  required,
  controlSize = 'medium',
  ...fieldProps
}: RadioGroupProps) {
  const controlled = useNativeOwner('RadioGroup', value, defaultValue)
  const [initialDefault] = useState(defaultValue)
  return (
    <Field
      {...fieldProps}
      data-control-size={controlSize}
      layout="group"
      required={required}
    >
      <RadioGroupContext.Provider
        value={{
          name,
          value,
          defaultValue: initialDefault,
          controlled,
          required,
          controlSize,
          onChange,
          onValueChange
        }}
      >
        <div
          className={optionsClass}
          data-slot="radio-group"
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    </Field>
  )
}

export function Radio({
  className,
  controlSize: controlSizeProp,
  label,
  value,
  name,
  id,
  disabled,
  required,
  checked,
  defaultChecked,
  onChange,
  ref,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  ...props
}: RadioProps) {
  const group = useContext(RadioGroupContext)
  const standaloneControlled = useNativeOwner('Radio', checked, defaultChecked, !group)
  if (
    group &&
    ((name !== undefined && name !== group.name) ||
      checked !== undefined ||
      defaultChecked !== undefined)
  ) {
    throw new TypeError(
      'RadioGroup owns name and selection. Remove conflicting name, checked and defaultChecked from Radio.'
    )
  }
  const controlSize = controlSizeProp ?? group?.controlSize ?? 'medium'
  const { 'aria-required': _ariaRequired, ...control } = useFieldControl({
    id,
    disabled,
    required,
    'aria-invalid': ariaInvalid,
    'aria-required': ariaRequired,
    'aria-describedby': ariaDescribedBy
  })
  const controlled = group ? group.controlled : standaloneControlled
  const selected = group ? group.value === value : checked
  const nodeRef = useRef<HTMLInputElement>(null)
  const initialise = useCallback(
    (node: HTMLInputElement | null) => {
      nodeRef.current = node
      if (node && controlled) node.defaultChecked = node.checked
    },
    [controlled]
  )
  const hostRef = useComposedRefs(initialise, ref)
  useLayoutEffect(() => {
    // Controlled resets preserve the current selection, rather than the first value.
    if (nodeRef.current && controlled) nodeRef.current.defaultChecked = !!selected
  }, [controlled, selected])
  const controlNode = (
    <span className="relative inline-grid shrink-0">
      <input
        {...props}
        {...control}
        onChange={event => {
          onChange?.(event)
          group?.onChange?.(event)
          if (event.currentTarget.checked) group?.onValueChange?.(event.currentTarget.value)
        }}
        ref={hostRef}
        checked={controlled ? selected : undefined}
        className={cn(radioVariants(), controlMetrics({ controlSize }), className)}
        data-control-size={controlSize}
        data-slot="radio"
        defaultChecked={
          controlled ? undefined : group ? group.defaultValue === value : defaultChecked
        }
        name={group?.name ?? name}
        required={group?.required || control.required}
        type="radio"
        value={value}
      />
      <span
        aria-hidden="true"
        className={dotClass}
      />
    </span>
  )

  if (!hasContent(label)) return controlNode

  return (
    <label className={rowClass}>
      {controlNode}
      <span
        className={cn(labelClass, controlMetrics({ controlSize }))}
        data-slot="radio-label"
      >
        {label}
      </span>
    </label>
  )
}
