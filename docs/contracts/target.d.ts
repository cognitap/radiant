/**
 * Future contract projection for DEV-104. Declaration-only; no runtime module.
 * This names the normative token paths and representative APIs used by the
 * examples. It is not a complete replacement for the package declarations.
 */
import type { ComponentProps, CSSProperties, ReactElement, ReactNode } from 'react'

export type ControlSize = 'small' | 'medium' | 'large'
export type Variant = 'solid' | 'soft' | 'outline' | 'ghost'
export type Tone = 'accent' | 'neutral' | 'warning' | 'danger'
export type Mode = 'light' | 'dark' | 'system'
export type ThemeStyle = CSSProperties & { [key: `--${string}`]: string | number | undefined }
type Styled<P> = Omit<P, 'style'> & { style?: ThemeStyle }

type PartialTree<T> = { [K in keyof T]?: T[K] extends object ? PartialTree<T[K]> : T[K] }
type ControlMetrics = {
  height: string
  paddingInline: string
  fontSize: string
  indicatorSize: string
}
export interface SharedTokens {
  color: {
    accent: string
    accentForeground: string
    neutral: string
    neutralForeground: string
    warning: string
    warningForeground: string
    danger: string
    dangerForeground: string
    surface: string
    foreground: string
    mutedForeground: string
    border: string
    placeholder: string
    disabledBackground: string
    disabledBorder: string
    invalid: string
    focus: string
  }
  typography: {
    family: string
    bodySize: string
    smallSize: string
    headingSize: string
    bodyWeight: string | number
    labelWeight: string | number
    headingWeight: string | number
    letterSpacing: string
  }
  control: {
    small: ControlMetrics
    medium: ControlMetrics
    large: ControlMetrics
    radius: string
    cornerShape: string
    borderWidth: string
    borderStyle: string
  }
  surface: {
    radius: string
    cornerShape: string
    borderWidth: string
    borderStyle: string
    padding: string
    gap: string
    shadow: string
    overlayShadow: string
    backdrop: string
    canvas: string
  }
  focus: { width: string; offset: string; style: string }
  motion: {
    pressDuration: string
    pressEase: string
    releaseDuration: string
    releaseEase: string
    colorDuration: string
    disclosureDuration: string
  }
  spacing: {
    labelGap: string
    fieldGap: string
    groupGap: string
    headerGap: string
    footerGap: string
  }
  state: { disabledOpacity: number }
}

/** Representative override keys; the full inventory belongs to DEV-44. */
export interface ComponentOverrides {
  button: { radius?: string; shadow?: string }
  input: { radius?: string; background?: string; borderColor?: string }
  checkbox: { radius?: string; size?: string }
  radio: { size?: string }
  field: { gap?: string }
  dialog: { width?: string; radius?: string; background?: string }
}
type Overrides = { [K in keyof ComponentOverrides]?: ComponentOverrides[K] }
export interface ThemeLayer {
  tokens?: PartialTree<SharedTokens>
  components?: Overrides
}
export interface ThemeDefinition extends ThemeLayer {
  id: string
  name: string
  modes?: { light?: ThemeLayer; dark?: ThemeLayer }
}
/** Opaque resolved identity; consumers create themes through defineTheme. */
declare const themeBrand: unique symbol
export interface Theme {
  readonly id: string
  readonly name: string
  readonly [themeBrand]: true
}
export declare function defineTheme(definition: ThemeDefinition): Theme
export declare function ThemeScope(
  props: Omit<ComponentProps<'div'>, 'style'> & {
    theme?: Theme
    mode?: Mode
    style?: ThemeStyle
  }
): ReactElement

type Presentation = { controlSize?: ControlSize; variant?: Variant; tone?: Tone }
export type ButtonProps = Styled<ComponentProps<'button'>> &
  Presentation & { pending?: boolean; iconOnly?: boolean; fullWidth?: boolean }
export declare function Button(props: ButtonProps): ReactElement
export type LinkProps = Styled<ComponentProps<'a'>> &
  Omit<Presentation, 'variant'> & {
    variant?: Variant | 'inline' | 'subtle'
    external?: boolean
    render?: (props: Styled<ComponentProps<'a'>> & { 'data-slot'?: string }) => ReactElement
  }
export declare function Link(props: LinkProps): ReactElement

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
