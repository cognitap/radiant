import { createContext, useContext } from 'react'
import type { ChangeEvent, ComponentProps, CSSProperties, ReactNode, Ref } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './cn.js'
import { Field, useField } from './Field.js'
import type { FieldProps } from './Field.js'

const radioVariants = cva([
  'peer col-start-1 row-start-1 m-0 box-border appearance-none',
  'size-[var(--radio-size,1.5rem)]',
  'rounded-[var(--radio-radius,999px)]',
  '[corner-shape:var(--radio-corner-shape,unset)]',
  '[border-width:var(--radio-border-width,var(--button-border-width,1px))]',
  '[border-style:var(--radio-border-style,var(--button-border-style,solid))]',
  '[border-color:var(--radio-border-color,var(--button-border-color,var(--color-border)))]',
  'bg-[var(--radio-background,var(--color-background))]',
  'checked:bg-[var(--radio-checked-background,var(--color-primary))]',
  'checked:[border-color:var(--radio-checked-border,var(--radio-checked-background,var(--color-primary)))]',
  'data-invalid:[border-color:var(--radio-invalid-border,var(--color-destructive))]',
  'in-data-invalid:[border-color:var(--radio-invalid-border,var(--color-destructive))]',
  'focus-visible:outline-solid',
  'focus-visible:[outline-color:var(--radio-focus-color,var(--input-focus-color,var(--button-focus-color,var(--color-focus))))]',
  'focus-visible:[outline-width:var(--radio-focus-width,var(--input-focus-width,var(--button-focus-width,2px)))]',
  'focus-visible:[outline-offset:var(--radio-focus-offset,var(--input-focus-offset,var(--button-focus-offset,2px)))]',
  'focus-visible:[outline-style:var(--radio-focus-style,var(--input-focus-style,var(--button-focus-style,solid)))]',
  'disabled:cursor-not-allowed',
  'disabled:[border-color:var(--radio-disabled-border,color-mix(in_oklch,var(--color-foreground),transparent_70%))]',
  'disabled:checked:bg-[var(--radio-disabled-background,color-mix(in_oklch,var(--color-foreground),transparent_70%))]',
  'forced-colors:border-[CanvasText]',
  'forced-colors:checked:bg-[Highlight]',
  'forced-colors:disabled:border-[GrayText] forced-colors:disabled:bg-[Canvas]'
])

const dotClass =
  'pointer-events-none col-start-1 row-start-1 size-[calc(var(--radio-size,1.5rem)*0.4)] self-center justify-self-center rounded-[var(--radio-radius,999px)] bg-[var(--radio-mark,var(--color-primary-foreground))] opacity-0 peer-checked:opacity-100 forced-colors:bg-[HighlightText]'

const rowClass =
  'inline-flex min-h-6 cursor-pointer items-center gap-[var(--radio-label-gap,0.5rem)] select-none has-disabled:cursor-not-allowed'

const labelClass =
  'leading-snug [color:var(--radio-label-color,var(--color-foreground))] [font-size:var(--radio-label-size,0.875rem)]'

const optionsClass = 'grid justify-items-start gap-[var(--radio-gap,0.5rem)]'

export type RadioTheme = {
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
  labelGap?: string
  labelColor?: string
  labelSize?: string
  disabledBorder?: string
  disabledBackground?: string
  focusColor?: string
  focusWidth?: string
  focusOffset?: string
  focusStyle?: string
}

const radioThemeVariables: Record<keyof RadioTheme, string> = {
  size: '--radio-size',
  radius: '--radio-radius',
  cornerShape: '--radio-corner-shape',
  borderWidth: '--radio-border-width',
  borderStyle: '--radio-border-style',
  borderColor: '--radio-border-color',
  background: '--radio-background',
  checkedBackground: '--radio-checked-background',
  checkedBorder: '--radio-checked-border',
  mark: '--radio-mark',
  invalidBorder: '--radio-invalid-border',
  gap: '--radio-gap',
  labelGap: '--radio-label-gap',
  labelColor: '--radio-label-color',
  labelSize: '--radio-label-size',
  disabledBorder: '--radio-disabled-border',
  disabledBackground: '--radio-disabled-background',
  focusColor: '--radio-focus-color',
  focusWidth: '--radio-focus-width',
  focusOffset: '--radio-focus-offset',
  focusStyle: '--radio-focus-style'
}

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
  const style: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(theme)) {
    if (value !== undefined) style[radioThemeVariables[key as keyof RadioTheme]] = value
  }
  return style as CSSProperties
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
