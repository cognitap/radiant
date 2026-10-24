/** Compile-only rejections: broadening these contracts makes @ts-expect-error fail. */
import type { ComponentProps, RefObject } from 'react'
import type {
  AccordionProps,
  ButtonProps,
  CheckboxProps,
  DialogActionProps,
  DialogProps,
  FieldProps,
  InputProps,
  LinkProps,
  RadioGroupProps,
  ThemeDefinition,
  ThemeScope
} from './target.js'

type Accepts<Contract, Example extends Contract> = Example

// Positive boundaries ensure native capabilities remain available.
export type ReadOnlyInput = Accepts<InputProps, { value: 'fixed'; readOnly: true; size: 24 }>
export type NativeInputRef = Accepts<InputProps, { ref: RefObject<HTMLInputElement | null> }>
type NativeGroup = {
  layout: 'group'
  label: 'P'
  form: 'profile'
  ref: RefObject<HTMLFieldSetElement | null>
}
export type NativeFieldset = Accepts<FieldProps, NativeGroup>
export type EmptyGroup = Accepts<RadioGroupProps, { name: 'p'; label: 'P'; value: null }>

// @ts-expect-error Native Input size is character width, not visual controlSize.
export type NativeSize = Accepts<InputProps, { size: 'large' }>
// @ts-expect-error Old controlSize vocabulary is retired.
export type OldSize = Accepts<ButtonProps, { controlSize: 'default' }>
// @ts-expect-error Tone is semantic intent; outline is a variant.
export type VariantAsTone = Accepts<LinkProps, { tone: 'outline' }>
// @ts-expect-error A native input has one value owner.
export type MixedInput = Accepts<InputProps, { value: string; defaultValue: string }>
// @ts-expect-error A checkbox has one checked owner.
export type MixedCheck = Accepts<CheckboxProps, { checked: true; defaultChecked: true }>
type GroupOwners = { name: 'p'; label: 'P'; value: 'a'; defaultValue: 'b' }
// @ts-expect-error A RadioGroup has one selection owner.
export type MixedGroup = Accepts<RadioGroupProps, GroupOwners>
// @ts-expect-error Radio values are strings; null represents controlled no selection.
export type NumericGroup = Accepts<RadioGroupProps, { name: 'p'; label: 'P'; value: 1 }>
// @ts-expect-error Dialog has one open-state owner.
export type MixedDialog = Accepts<DialogProps, { open: true; defaultOpen: true }>
// @ts-expect-error Replacement must return one React element.
export type RenderText = Accepts<DialogActionProps, { render: () => string }>
type WrongGroupRef = { layout: 'group'; label: 'P'; ref: RefObject<HTMLInputElement | null> }
// @ts-expect-error The group ref points at a fieldset, not an input.
export type GroupRef = Accepts<FieldProps, WrongGroupRef>
// @ts-expect-error Default control layout is a div, which has no form attribute.
export type ControlForm = Accepts<FieldProps, { label: 'P'; form: 'profile' }>
// @ts-expect-error Only control layout accepts a controlId.
export type GroupId = Accepts<FieldProps, { label: 'P'; layout: 'group'; controlId: 'one' }>
// @ts-expect-error Multiple accordion selection uses an array.
export type MultiScalar = Accepts<AccordionProps, { type: 'multiple'; value: 'one' }>
// @ts-expect-error Single accordion selection uses a scalar or null.
export type SingleArray = Accepts<AccordionProps, { type: 'single'; value: string[] }>
// @ts-expect-error Modes have a separate supported vocabulary.
export type InvalidMode = Accepts<ComponentProps<typeof ThemeScope>, { mode: 'automatic' }>

// Excess property checks for removed/unknown names require object literals.
const presentation: ButtonProps = {
  // @ts-expect-error Radius is a theme/style override, not a Button prop.
  radius: 'full'
}
const dialog: DialogProps = {
  // @ts-expect-error The Dialog state root has no DOM className.
  className: 'p-4'
}
const tokens: ThemeDefinition = {
  id: 'bad',
  name: 'Bad',
  tokens: {
    // @ts-expect-error Shared token roles are not owned by Button.
    button: { radius: '1rem' }
  }
}
const overrides: ThemeDefinition = {
  id: 'bad',
  name: 'Bad',
  components: {
    button: {
      // @ts-expect-error Component override keys are typed.
      roundness: '1rem'
    }
  }
}
void [presentation, dialog, tokens, overrides]
