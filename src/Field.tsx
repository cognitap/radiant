'use client'

import { createContext, useContext, useId } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import type { ThemeStyle } from './themes/defineTheme.js'
import type { PartStyle } from './presentation.js'

const fieldVariants = cva(
  [
    'font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] tracking-[var(--rad-typography-roles-ui-body-letter-spacing,-0.011em)] text-[length:var(--rad-typography-roles-ui-body-size,0.875rem)] font-[number:var(--rad-typography-roles-ui-body-weight,400)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)]',
    'grid min-w-0 [gap:var(--rad-field-gap,var(--rad-spacing-field-gap,0.375rem))]',
    // Dim controls/labels once; help and error text must stay readable.
    'in-[[data-slot~=field][data-disabled]]:[--_rad-disabled-opacity:1]',
    '[&[data-disabled]>:not([data-slot=field-description],[data-slot=field-error])]:opacity-[var(--_rad-disabled-opacity,var(--rad-field-disabled-opacity,var(--rad-state-disabled-opacity,0.5)))]',
    'forced-colors:[&[data-disabled]>:not([data-slot=field-description],[data-slot=field-error])]:opacity-100',
    'forced-colors:data-[disabled]:text-[GrayText] forced-colors:data-[disabled]:opacity-100'
  ],
  {
    variants: {
      layout: {
        control: '',
        group: 'm-0 border-0 p-0'
      }
    },
    defaultVariants: { layout: 'control' }
  }
)

const labelClass =
  'min-w-0 break-words p-0 [color:var(--rad-field-label-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))] text-[length:var(--rad-field-label-size,var(--rad-typography-roles-ui-label-size,0.875rem))] font-[number:var(--rad-field-label-weight,var(--rad-typography-roles-ui-label-weight,550))] forced-colors:text-[CanvasText] font-[family-name:var(--rad-typography-roles-ui-label-family,system-ui,sans-serif)] leading-[var(--rad-typography-roles-ui-label-line-height,1.4)] tracking-[var(--rad-typography-roles-ui-label-letter-spacing,0em)]'

const descriptionClass =
  'min-w-0 break-words [color:var(--rad-field-description-color,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))] text-[length:var(--rad-field-description-size,var(--rad-typography-roles-ui-supporting-size,0.8125rem))] forced-colors:text-[CanvasText] font-[family-name:var(--rad-typography-roles-ui-supporting-family,system-ui,sans-serif)] leading-[var(--rad-typography-roles-ui-supporting-line-height,1.5)] tracking-[var(--rad-typography-roles-ui-supporting-letter-spacing,0em)] font-[number:var(--rad-typography-roles-ui-supporting-weight,400)]'

const errorClass =
  'min-w-0 break-words [color:var(--rad-field-error-color,var(--rad-color-invalid,oklch(0.56_0.19_25)))] text-[length:var(--rad-field-error-size,var(--rad-typography-roles-ui-supporting-size,0.8125rem))] forced-colors:text-[CanvasText] font-[family-name:var(--rad-typography-roles-ui-supporting-family,system-ui,sans-serif)] leading-[var(--rad-typography-roles-ui-supporting-line-height,1.5)] tracking-[var(--rad-typography-roles-ui-supporting-letter-spacing,0em)] font-[number:var(--rad-typography-roles-ui-supporting-weight,400)]'

const requiredClass =
  'ms-[0.25em] [color:var(--rad-field-required-color,var(--rad-color-invalid,oklch(0.56_0.19_25)))] forced-colors:text-[CanvasText]'

export type FieldLayout = 'control' | 'group'

/** Forward every prop to one native control; merge any external description IDs. */
export type FieldControlProps = {
  id: string
  required?: boolean
  disabled?: boolean
  'aria-invalid'?: boolean
  'aria-required'?: boolean
  'aria-describedby'?: string
}

export type FieldState = {
  layout: FieldLayout
  controlId: string
  labelId: string
  descriptionId?: string
  errorId?: string
  invalid: boolean
  required: boolean
  disabled: boolean
  describedBy?: string
  controlProps: FieldControlProps | null
}

type FieldOwn = {
  /** Additional identities; Field always retains its base identity. */
  'data-slot'?: string
  /** The control label, or the group's native legend. */
  label: ReactNode
  description?: ReactNode
  /** Consumer-owned validation content. Present errors immediately mark the owner invalid. */
  error?: ReactNode
  required?: boolean
  disabled?: boolean
  requiredIndicator?: ReactNode
  style?: ThemeStyle
  /** Presentation only; Field keeps each part's IDs, ARIA and native semantics. */
  parts?: {
    label?: PartStyle
    description?: PartStyle
    error?: PartStyle
    required?: PartStyle
  }
}

type FieldControl = FieldOwn &
  Omit<ComponentProps<'div'>, 'children' | 'style'> & {
    layout?: 'control'
    form?: never
    name?: never
    /** The input's ID. Root id/ref still target Field's div. */
    controlId?: string
    /** Radiant controls connect automatically; native adapters forward the callback props. */
    children?: ReactNode | ((control: FieldControlProps) => ReactNode)
  }

type FieldGroup = FieldOwn &
  Omit<ComponentProps<'fieldset'>, 'children' | 'style'> & {
    layout: 'group'
    controlId?: never
    children?: ReactNode
  }

export type FieldProps = FieldControl | FieldGroup

const FieldContext = createContext<FieldState | null>(null)

/** Nearest Field metadata, or null. Groups have no single target: controlProps is null. */
export function useField(): FieldState | null {
  return useContext(FieldContext)
}

/** Private native-control adapter; Field keeps its owned relationships. */
export function useFieldControl({
  id,
  disabled,
  required,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  'aria-describedby': ariaDescribedBy
}: Pick<
  ComponentProps<'input'>,
  'id' | 'disabled' | 'required' | 'aria-invalid' | 'aria-required' | 'aria-describedby'
>) {
  const field = useField()
  const control = field?.controlProps
  const isRequired = control?.required || required
  const invalid = control?.['aria-invalid'] || ariaInvalid
  return {
    id: control?.id ?? id,
    disabled: field?.disabled || disabled,
    required: isRequired,
    'aria-invalid': invalid,
    'data-invalid': invalid && invalid !== 'false' ? '' : undefined,
    'aria-required': isRequired ? true : ariaRequired,
    'aria-describedby': joinIds(control?.['aria-describedby'], ariaDescribedBy)
  }
}

function hasContent(value: ReactNode) {
  return value != null && value !== false && value !== ''
}

function definedProps(props: FieldControlProps): FieldControlProps {
  return Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined)
  ) as FieldControlProps
}

/** Owns label/help/error relationships; the consumer owns values, validation and focus. */
export function Field(props: FieldProps) {
  const {
    label,
    description,
    error,
    required = false,
    disabled: disabledProp = false,
    requiredIndicator = '*',
    children,
    className,
    parts,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    'data-slot': dataSlot,
    ...rest
  } = props
  const parent = useField()
  const disabled = parent?.disabled || disabledProp
  const layout = rest.layout ?? 'control'
  const generatedId = useId()
  const controlId = rest.controlId ?? generatedId
  const labelId = `${generatedId}-label`
  const invalid = hasContent(error)
  const descriptionId = hasContent(description) ? `${generatedId}-description` : undefined
  const errorId = invalid ? `${generatedId}-error` : undefined
  const describedBy = joinIds(descriptionId, errorId)
  const controlProps = definedProps({
    id: controlId,
    required: required || undefined,
    disabled: disabled || undefined,
    'aria-invalid': invalid || undefined,
    'aria-required': required || undefined,
    'aria-describedby': describedBy
  })
  const state: FieldState = {
    layout,
    controlId,
    labelId,
    descriptionId,
    errorId,
    invalid,
    required,
    disabled,
    describedBy,
    controlProps: layout === 'control' ? controlProps : null
  }
  const control: ReactNode =
    typeof children === 'function'
      ? layout === 'control'
        ? children(controlProps)
        : null
      : children
  const indicator = required && hasContent(requiredIndicator) && (
    <span
      aria-hidden="true"
      className={cn(requiredClass, parts?.required?.className)}
      style={parts?.required?.style}
      data-slot="field-required"
    >
      {requiredIndicator}
    </span>
  )
  const rootProps = {
    'aria-describedby':
      layout === 'group' ? joinIds(describedBy, ariaDescribedBy) : ariaDescribedBy,
    'aria-invalid': layout === 'group' && invalid ? true : ariaInvalid,
    className: cn(fieldVariants({ layout }), className),
    'data-disabled': disabled ? '' : undefined,
    'data-invalid': invalid ? '' : undefined,
    'data-layout': layout,
    'data-required': required ? '' : undefined,
    'data-slot': joinIds('field', dataSlot)
  }
  const body = (
    <>
      {layout === 'group' ? (
        <legend
          className={cn(labelClass, parts?.label?.className)}
          style={parts?.label?.style}
          data-slot="field-label"
          id={labelId}
        >
          {label}
          {indicator}
        </legend>
      ) : (
        <label
          className={cn(labelClass, parts?.label?.className)}
          style={parts?.label?.style}
          data-slot="field-label"
          htmlFor={controlId}
          id={labelId}
        >
          {label}
          {indicator}
        </label>
      )}
      {control}
      {descriptionId ? (
        <div
          className={cn(descriptionClass, parts?.description?.className)}
          style={parts?.description?.style}
          data-slot="field-description"
          id={descriptionId}
        >
          {description}
        </div>
      ) : null}
      {errorId ? (
        <div
          className={cn(errorClass, parts?.error?.className)}
          style={parts?.error?.style}
          data-slot="field-error"
          id={errorId}
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </>
  )

  let root: ReactNode
  if (rest.layout === 'group') {
    const { layout: _layout, controlId: _controlId, ...nativeProps } = rest
    root = (
      <fieldset
        {...nativeProps}
        {...rootProps}
        disabled={disabled || undefined}
      >
        {body}
      </fieldset>
    )
  } else {
    const { layout: _layout, controlId: _controlId, ...nativeProps } = rest
    root = (
      <div
        {...nativeProps}
        {...rootProps}
      >
        {body}
      </div>
    )
  }
  return <FieldContext.Provider value={state}>{root}</FieldContext.Provider>
}
