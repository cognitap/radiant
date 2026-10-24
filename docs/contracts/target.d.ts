/**
 * Future contract projection for DEV-104. Declaration-only; no runtime module.
 * This names the normative token paths and representative APIs used by the
 * examples. It is not a complete replacement for the package declarations.
 */
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import type { ButtonProps, ButtonVariant, ControlSize, ThemeStyle } from '../../src/index.js'

// DEV-44 now owns the executable theme contract. Keep these sketches tied to it.
export { defineTheme, ThemeScope } from '../../src/index.js'
export type {
  SharedTokens,
  Theme,
  ThemeComponentOverrides as ComponentOverrides,
  ThemeDefinition,
  ThemeLayer,
  ThemeMode as Mode,
  ThemeStyle
} from '../../src/index.js'

// DEV-117 now owns the executable action vocabulary; examples check real exports.
export { Button, Link } from '../../src/index.js'
export type { ButtonProps, LinkProps, ControlSize, Tone } from '../../src/index.js'
export type Variant = ButtonVariant
type Styled<P> = Omit<P, 'style'> & { style?: ThemeStyle }

export interface FieldControlProps {
  id: string
  required?: boolean
  disabled?: boolean
  'aria-invalid'?: boolean
  'aria-required'?: boolean
  'aria-describedby'?: string
}
type PartStyle = { className?: string; style?: ThemeStyle }
type ControlParts = { wrapper?: PartStyle; label?: PartStyle; indicator?: PartStyle }
type FieldOwn = {
  label: ReactNode
  description?: ReactNode
  error?: ReactNode
  required?: boolean
  disabled?: boolean
  requiredIndicator?: ReactNode
  parts?: { label?: PartStyle; description?: PartStyle; error?: PartStyle; required?: PartStyle }
}
type FieldControl = FieldOwn &
  Omit<Styled<ComponentProps<'div'>>, 'children'> & {
    layout?: 'control'
    form?: never
    name?: never
    controlId?: string
    children?: ReactNode | ((props: FieldControlProps) => ReactNode)
  }
type FieldGroup = FieldOwn &
  Omit<Styled<ComponentProps<'fieldset'>>, 'children'> & {
    layout: 'group'
    controlId?: never
    children?: ReactNode
  }
export type FieldProps = FieldControl | FieldGroup
export declare function Field(props: FieldProps): ReactElement

type ValueOwner<T> = { value: T; defaultValue?: never } | { value?: undefined; defaultValue?: T }
type CheckOwner =
  | { checked: boolean; defaultChecked?: never }
  | { checked?: undefined; defaultChecked?: boolean }
type NativeInput = Styled<ComponentProps<'input'>>
export type InputProps = Omit<NativeInput, 'value' | 'defaultValue'> &
  ValueOwner<Exclude<NativeInput['value'], undefined>> & { controlSize?: ControlSize }
export declare function Input(props: InputProps): ReactElement
export type CheckboxProps = Omit<NativeInput, 'type' | 'checked' | 'defaultChecked'> &
  CheckOwner & {
    label?: ReactNode
    indeterminate?: boolean
    controlSize?: ControlSize
    parts?: ControlParts
  }
export declare function Checkbox(props: CheckboxProps): ReactElement
export type RadioProps = Omit<NativeInput, 'type' | 'value' | 'checked' | 'defaultChecked'> &
  CheckOwner & {
    value: string
    label?: ReactNode
    controlSize?: ControlSize
    parts?: ControlParts
  }
/** Inside RadioGroup the group owns name/selection; standalone props cannot override it. */
export declare function Radio(props: RadioProps): ReactElement
export type RadioGroupProps = Omit<FieldOwn, 'parts'> &
  Omit<Styled<ComponentProps<'fieldset'>>, 'name' | 'onChange' | 'defaultValue'> &
  ValueOwner<string | null> & {
    name: string
    controlSize?: ControlSize
    onValueChange?: (value: string) => void
    onChange?: NativeInput['onChange']
    parts?: NonNullable<FieldOwn['parts']> & { options?: PartStyle }
  }
export declare function RadioGroup(props: RadioGroupProps): ReactElement

type OpenOwner =
  | { open: boolean; defaultOpen?: never }
  | { open?: undefined; defaultOpen?: boolean }
export type DialogProps = OpenOwner & {
  onOpenChange?: (open: boolean) => void
  modal?: boolean
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  children?: ReactNode
}
export declare function Dialog(props: DialogProps): ReactElement
export type DialogActionProps = ButtonProps & {
  /** Resolved native button props; return exactly one compatible element and forward them. */
  render?: (props: ComponentProps<'button'> & { 'data-slot'?: string }) => ReactElement
}
export declare function DialogTrigger(props: DialogActionProps): ReactElement
export declare function DialogClose(props: DialogActionProps): ReactElement
export declare function DialogContent(
  props: Omit<Styled<ComponentProps<'dialog'>>, 'open'>
): ReactElement
export declare function DialogTitle(props: ComponentProps<'h2'>): ReactElement
export declare function DialogDescription(props: ComponentProps<'p'>): ReactElement

export type CollapsibleProps = Omit<ComponentProps<'details'>, 'open'> &
  OpenOwner & {
    onOpenChange?: (open: boolean) => void
  }
export declare function Collapsible(props: CollapsibleProps): ReactElement
export declare function CollapsibleTrigger(props: ComponentProps<'summary'>): ReactElement
export declare function CollapsibleContent(props: ComponentProps<'div'>): ReactElement
type AccordionOwn = Omit<ComponentProps<'div'>, 'defaultValue'> & { disabled?: boolean }
export type AccordionProps = AccordionOwn &
  (
    | ({ type?: 'single'; onValueChange?: (value: string | null) => void } & ValueOwner<
        string | null
      >)
    | ({ type: 'multiple'; onValueChange?: (value: string[]) => void } & ValueOwner<string[]>)
  )
export declare function Accordion(props: AccordionProps): ReactElement
