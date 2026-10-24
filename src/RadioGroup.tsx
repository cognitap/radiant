import { createContext, useContext } from 'react'
import type { ChangeEvent, ComponentProps, CSSProperties, ReactNode, Ref } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn.js'
import { flattenComponents, type ThemeComponentOverrides } from './themes/components.js'
import { Field, useField } from './Field.js'
import type { FieldProps } from './Field.js'

const radioVariants = cva([
  'peer col-start-1 row-start-1 m-0 box-border appearance-none',
  'size-[var(--rad-radio-size,var(--rad-control-medium-indicator-size,1.125rem))]',
  'rounded-[var(--rad-radio-radius,999px)]',
  '[corner-shape:var(--rad-radio-corner-shape,unset)]',
  '[border-width:var(--rad-radio-border-width,var(--rad-control-border-width,1px))]',
  '[border-style:var(--rad-radio-border-style,var(--rad-control-border-style,solid))]',
  '[border-color:var(--rad-radio-border-color,var(--rad-color-border,oklch(0.885_0.005_286)))]',
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
  'pointer-events-none col-start-1 row-start-1 size-[calc(var(--rad-radio-size,var(--rad-control-medium-indicator-size,1.125rem))*0.4)] self-center justify-self-center rounded-[var(--rad-radio-radius,999px)] bg-[var(--rad-radio-mark,var(--rad-color-accent-foreground,oklch(0.985_0_0)))] opacity-0 peer-checked:opacity-100 forced-colors:bg-[HighlightText]'

const rowClass =
  '[font-family:var(--rad-typography-family,system-ui,sans-serif)] [letter-spacing:var(--rad-typography-letter-spacing,-0.011em)] [font-weight:var(--rad-typography-body-weight,400)] inline-flex min-h-6 cursor-pointer items-center gap-[var(--rad-radio-label-gap,var(--rad-spacing-label-gap,0.5rem))] select-none has-disabled:cursor-not-allowed'

const labelClass =
  'leading-snug [color:var(--rad-radio-label-color,var(--rad-color-foreground,oklch(0.21_0.006_286)))] [font-size:var(--rad-radio-label-size,var(--rad-typography-body-size,0.875rem))]'

const optionsClass =
  'grid justify-items-start gap-[var(--rad-radio-group-gap,var(--rad-spacing-group-gap,0.75rem))]'

export type RadioTheme = NonNullable<ThemeComponentOverrides['radio']> & { gap?: string }

type RadioGroupContextValue = {
  name: string
  value?: string
  defaultValue?: string
  required?: boolean
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
  onValueChange?: (value: string) => void
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null)

export type RadioGroupProps = Omit<FieldProps, 'layout' | 'children' | 'onChange'> & {
  name: string
  value?: string
  defaultValue?: string
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
  onValueChange?: (value: string) => void
  children?: ReactNode
}

export type RadioProps = Omit<ComponentProps<'input'>, 'type' | 'value'> & {
  label?: ReactNode
  value: string
}

function joinIds(...parts: Array<string | undefined>) {
  const ids = [...new Set(parts.flatMap(part => (part ? part.split(/\s+/) : [])).filter(Boolean))]
  return ids.length > 0 ? ids.join(' ') : undefined
}

function hasContent(value: ReactNode) {
  return value != null && value !== false && value !== ''
}

function assignRefs<T>(node: T | null, ...refs: Array<Ref<T> | undefined>) {
  for (const ref of refs) {
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }
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
  ...fieldProps
}: RadioGroupProps) {
  return (
    <Field
      {...fieldProps}
      layout="group"
      required={required}
    >
      <RadioGroupContext.Provider
        value={{ name, value, defaultValue, required, onChange, onValueChange }}
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
  const field = useField()
  const control = field?.layout === 'control' ? field.controlProps : null
  const controlled = group?.value !== undefined || checked !== undefined
  const selected = group?.value !== undefined ? group.value === value : checked
  const invalid = ariaInvalid ?? control?.['aria-invalid']
  const requiredFromAria = ariaRequired === true || ariaRequired === 'true' ? true : undefined
  const controlNode = (
    <span className="inline-grid shrink-0">
      <input
        {...props}
        aria-describedby={joinIds(control?.['aria-describedby'], ariaDescribedBy)}
        onChange={event => {
          onChange?.(event)
          group?.onChange?.(event)
          group?.onValueChange?.(event.target.value)
        }}
        ref={node => {
          // React leaves defaultChecked at the first controlled value, so a
          // later form reset would restore that instead of the current selection.
          if (node && controlled) node.defaultChecked = !!selected
          assignRefs(node, ref)
        }}
        checked={controlled ? selected : undefined}
        className={cn(radioVariants(), className)}
        data-invalid={invalid === true || invalid === 'true' ? '' : undefined}
        data-slot="radio"
        defaultChecked={
          controlled ? undefined : group ? group.defaultValue === value : defaultChecked
        }
        disabled={disabled ?? control?.disabled}
        id={control?.id ?? id}
        name={group?.name ?? name}
        required={required ?? requiredFromAria ?? group?.required ?? control?.required}
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
        className={labelClass}
        data-slot="radio-label"
      >
        {label}
      </span>
    </label>
  )
}
