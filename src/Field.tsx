import { cloneElement, createContext, isValidElement, useContext, useId } from 'react'
import type { ComponentProps, CSSProperties, ReactElement, ReactNode } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn.js'
import { flattenComponents, type ThemeComponentOverrides } from './themes/components.js'

const fieldVariants = cva(
  [
    '[font-family:var(--rad-typography-family,system-ui,sans-serif)] [letter-spacing:var(--rad-typography-letter-spacing,-0.011em)] [font-size:var(--rad-typography-body-size,0.875rem)] [font-weight:var(--rad-typography-body-weight,400)]',
    'grid min-w-0 [gap:var(--rad-field-gap,var(--rad-spacing-field-gap,0.375rem))]',
    // A disabled Field dims its visual unit; descendants must not dim it again.
    'in-[[data-slot~=field][data-disabled]]:[--_rad-disabled-opacity:1]',
    'data-[disabled]:opacity-[var(--_rad-disabled-opacity,var(--rad-field-disabled-opacity,var(--rad-state-disabled-opacity,0.5)))]',
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
  'min-w-0 break-words p-0 [color:var(--rad-field-label-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))] [font-size:var(--rad-field-label-size,var(--rad-typography-body-size,0.875rem))] [font-weight:var(--rad-field-label-weight,var(--rad-typography-label-weight,550))] leading-snug forced-colors:text-[CanvasText]'

const descriptionClass =
  'min-w-0 break-words [color:var(--rad-field-description-color,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))] [font-size:var(--rad-field-description-size,var(--rad-typography-small-size,0.8125rem))] leading-snug forced-colors:text-[CanvasText]'

const errorClass =
  'min-w-0 break-words [color:var(--rad-field-error-color,var(--rad-color-invalid,oklch(0.56_0.19_25)))] [font-size:var(--rad-field-error-size,var(--rad-typography-small-size,0.8125rem))] leading-snug forced-colors:text-[CanvasText]'

const requiredClass =
  'ms-[0.25em] [color:var(--rad-field-required-color,var(--rad-color-invalid,oklch(0.56_0.19_25)))] forced-colors:text-[CanvasText]'

export type FieldLayout = 'control' | 'group'

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

export type FieldTheme = NonNullable<ThemeComponentOverrides['field']>

type FieldOwn = {
  label: ReactNode
  description?: ReactNode
  error?: ReactNode
  required?: boolean
  disabled?: boolean
  requiredIndicator?: ReactNode
}

export type FieldProps = FieldOwn &
  Omit<ComponentProps<'div'>, 'children'> & {
    layout?: FieldLayout
    children?: ReactNode | ((control: FieldControlProps) => ReactNode)
  }

type HostProps = {
  id?: string
  required?: boolean
  disabled?: boolean
  'aria-invalid'?: boolean | 'false' | 'true' | 'grammar' | 'spelling'
  'aria-required'?: boolean | 'false' | 'true'
  'aria-describedby'?: string
}

const FieldContext = createContext<FieldState | null>(null)

export function useField(): FieldState | null {
  return useContext(FieldContext)
}

export function fieldTheme(theme: FieldTheme): CSSProperties {
  return flattenComponents({ field: theme }) as CSSProperties
}

function hasContent(value: ReactNode) {
  return value != null && value !== false && value !== ''
}

function joinIds(...parts: Array<string | undefined>) {
  const ids = [...new Set(parts.flatMap(part => (part ? part.split(/\s+/) : [])).filter(Boolean))]
  return ids.length > 0 ? ids.join(' ') : undefined
}

function isHostElement(
  node: ReactNode | ((control: FieldControlProps) => ReactNode)
): node is ReactElement<HostProps> {
  return isValidElement<HostProps>(node) && typeof node.type === 'string'
}

function definedProps(props: FieldControlProps): FieldControlProps {
  return Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined)
  ) as FieldControlProps
}

export function Field(props: FieldProps) {
  const {
    label,
    description,
    error,
    required = false,
    disabled = false,
    layout = 'control',
    requiredIndicator = '*',
    children,
    className,
    'aria-describedby': ariaDescribedBy,
    ...rest
  } = props
  const generatedId = useId()
  const hostChild = layout === 'control' && isHostElement(children) ? children : null
  const controlId = hostChild?.props.id || generatedId
  const labelId = `${generatedId}-label`
  const invalid = hasContent(error)
  const descriptionId = hasContent(description) ? `${generatedId}-description` : undefined
  const errorId = invalid ? `${generatedId}-error` : undefined
  const describedBy = joinIds(descriptionId, errorId)
  const controlProps: FieldControlProps = {
    id: controlId,
    required: required || undefined,
    disabled: disabled || undefined,
    'aria-invalid': invalid || undefined,
    'aria-required': required || undefined,
    'aria-describedby': describedBy
  }
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
    controlProps: layout === 'control' ? definedProps(controlProps) : null
  }
  const control: ReactNode =
    typeof children === 'function'
      ? layout === 'control'
        ? children(definedProps(controlProps))
        : null
      : hostChild
        ? cloneElement(hostChild, {
            ...definedProps(controlProps),
            id: controlId,
            required: hostChild.props.required ?? controlProps.required,
            disabled: hostChild.props.disabled ?? controlProps.disabled,
            'aria-invalid': hostChild.props['aria-invalid'] ?? controlProps['aria-invalid'],
            'aria-required': hostChild.props['aria-required'] ?? controlProps['aria-required'],
            'aria-describedby': joinIds(
              describedBy,
              typeof hostChild.props['aria-describedby'] === 'string'
                ? hostChild.props['aria-describedby']
                : undefined
            )
          })
        : children
  const indicator = required && hasContent(requiredIndicator) && (
    <span
      aria-hidden="true"
      className={requiredClass}
      data-slot="field-required"
    >
      {requiredIndicator}
    </span>
  )
  const rootProps = {
    'aria-describedby':
      layout === 'group' ? joinIds(describedBy, ariaDescribedBy) : ariaDescribedBy,
    'aria-invalid': layout === 'group' && invalid ? true : undefined,
    'aria-required': layout === 'group' && required ? true : undefined,
    className: cn(fieldVariants({ layout }), className),
    'data-disabled': disabled ? '' : undefined,
    'data-invalid': invalid ? '' : undefined,
    'data-layout': layout,
    'data-required': required ? '' : undefined,
    'data-slot': 'field'
  }
  const body = (
    <>
      {layout === 'group' ? (
        <legend
          className={labelClass}
          data-slot="field-label"
          id={labelId}
        >
          {label}
          {indicator}
        </legend>
      ) : (
        <label
          className={labelClass}
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
          className={descriptionClass}
          data-slot="field-description"
          id={descriptionId}
        >
          {description}
        </div>
      ) : null}
      {errorId ? (
        <div
          className={errorClass}
          data-slot="field-error"
          id={errorId}
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </>
  )

  return (
    <FieldContext.Provider value={state}>
      {layout === 'group' ? (
        <fieldset
          {...(rest as ComponentProps<'fieldset'>)}
          {...rootProps}
          disabled={disabled || undefined}
        >
          {body}
        </fieldset>
      ) : (
        <div
          {...rest}
          {...rootProps}
        >
          {body}
        </div>
      )}
    </FieldContext.Provider>
  )
}
