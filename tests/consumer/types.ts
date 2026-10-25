import './theme-types.js'
import { createElement, createRef, type Ref } from 'react'
import {
  Button,
  buttonTheme,
  Checkbox,
  checkboxTheme,
  Field,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  accordionTheme,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardTheme,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  collapsibleTheme,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  dialogTheme,
  Radio,
  RadioGroup,
  radioTheme,
  fieldTheme,
  Input,
  inputTheme,
  Link,
  linkTheme,
  themes,
  useField,
  type ButtonProps,
  type ButtonRenderProps,
  type ButtonVariant,
  type LinkVariant,
  type Tone,
  type ControlSize,
  type ButtonTheme,
  type CheckboxProps,
  type FieldProps,
  type InputProps,
  type AccordionProps,
  type CardProps,
  type CardTitleProps,
  type CollapsibleProps,
  type DialogContentProps,
  type DialogTriggerProps,
  type DialogCloseProps,
  type DialogProps,
  type RadioGroupProps,
  type RadioProps,
  type LinkProps,
  type LinkRenderProps,
  type Theme
} from '@cognitap/radiant'

const shared: Theme | undefined = themes[0]
createElement('div', { style: shared?.style })

const theme: ButtonTheme = { cornerShape: 'squircle', radiusPressed: '0.25rem', pressScale: 0.96 }
createElement('div', { style: buttonTheme(theme) })

// @ts-expect-error Theme keys are a closed set.
buttonTheme({ radiusOnPress: '0.25rem' })

const props: ButtonProps = {
  type: 'submit',
  disabled: true,
  pending: true,
  variant: 'solid',
  tone: 'danger',
  controlSize: 'large',
  iconOnly: true,
  fullWidth: true,
  'aria-label': 'Save',
  ref: createRef<HTMLButtonElement>()
}
createElement(Button, props)

const renderButton = (resolved: ButtonRenderProps) => {
  const ref: Ref<HTMLButtonElement> | undefined = resolved.ref
  const variant: ButtonVariant = resolved['data-variant']
  const tone: Tone = resolved['data-tone']
  const size: ControlSize = resolved['data-control-size']
  void [ref, variant, tone, size]
  // @ts-expect-error Button consumes presentation props before host replacement.
  void resolved.pending
  // @ts-expect-error Button owns the render callback; it never reaches the host.
  void resolved.render
  return createElement('button', resolved)
}
createElement(Button, { render: renderButton })
createElement(DialogTrigger, { render: renderButton })
createElement(DialogClose, { render: renderButton })
// @ts-expect-error Button replacement returns one compatible element.
createElement(Button, { render: () => 'text' })
// @ts-expect-error A replacement must retain a host.
createElement(Button, { render: () => null })
// @ts-expect-error A replacement cannot return an array of hosts.
createElement(Button, { render: () => [createElement('button')] })

// @ts-expect-error Variants are a closed set.
const invalidVariant: ButtonProps = { variant: 'link' }
createElement(Button, invalidVariant)

// @ts-expect-error Native button types must survive the public declaration export.
const invalidProps: ButtonProps = { type: 'invalid' }
createElement(Button, invalidProps)

createElement('div', { style: linkTheme({ color: 'oklch(0.5 0.1 250)', focusWidth: '3px' }) })

// @ts-expect-error Link theme keys are a closed set.
linkTheme({ background: 'red' })

const linkProps: LinkProps = {
  href: '/next',
  target: '_blank',
  download: true,
  variant: 'solid',
  tone: 'danger',
  controlSize: 'small',
  external: true,
  ref: createRef<HTMLAnchorElement>()
}
createElement(Link, linkProps)

createElement(Link, {
  ref: createRef<HTMLAnchorElement>(),
  render: resolved => {
    const native: LinkRenderProps = resolved
    const ref: LinkProps['ref'] = native.ref
    void ref
    // @ts-expect-error Presentation props have been resolved into native props.
    void native.tone
    return createElement('a', native)
  }
})
// @ts-expect-error A replacement must return one element.
createElement(Link, { render: () => 'text' })
// @ts-expect-error A replacement cannot disappear.
createElement(Link, { render: () => null })
// @ts-expect-error A replacement is not a list of elements.
createElement(Link, { render: () => [createElement('a')] })
// @ts-expect-error Link has native anchor semantics, without disabled state.
const disabledLink: LinkProps = { disabled: true }
// @ts-expect-error Pending actions belong to Button.
const pendingLink: LinkProps = { pending: true }
void [disabledLink, pendingLink]

// @ts-expect-error Link variants are a closed set.
const invalidLinkVariant: LinkProps = { variant: 'button' }
createElement(Link, invalidLinkVariant)

createElement('div', { style: fieldTheme({ gap: '0.5rem', labelWeight: 650 }) })
useField()

const fieldProps: FieldProps = {
  label: 'Email',
  description: 'Work address',
  error: 'Missing',
  required: true,
  disabled: false,
  requiredIndicator: '(required)',
  controlId: 'email',
  ref: createRef<HTMLDivElement>(),
  parts: {
    label: { className: 'italic' },
    description: { style: { '--rad-field-description-color': 'rebeccapurple' } },
    error: { className: 'font-bold' },
    required: { style: { marginInlineStart: '0.5em' } }
  },
  children: control => createElement('input', control)
}
createElement(Field, fieldProps)
createElement(Field, {
  layout: 'group',
  label: 'Plan',
  form: 'profile',
  name: 'plan',
  ref: createRef<HTMLFieldSetElement>()
})

// @ts-expect-error A control Field renders a div, with no native form association.
const controlForm: FieldProps = { label: 'Email', form: 'profile' }
// @ts-expect-error A group ref targets its fieldset.
const groupRef: FieldProps = { layout: 'group', label: 'Plan', ref: createRef<HTMLDivElement>() }
// @ts-expect-error A control ref targets its div.
const controlRef: FieldProps = { label: 'Email', ref: createRef<HTMLFieldSetElement>() }
// @ts-expect-error Groups have multiple controls, with no single controlId.
const groupControlId: FieldProps = { layout: 'group', label: 'Plan', controlId: 'one' }
// @ts-expect-error Groups take normal children, not a single-control adapter.
const groupAdapter: FieldProps = { layout: 'group', label: 'Plan', children: () => null }
// @ts-expect-error Part hooks style the owned label; they cannot replace its relationship.
const fieldPartId: FieldProps = { label: 'Email', parts: { label: { htmlFor: 'other' } } }
void [controlForm, groupRef, controlRef, groupControlId, groupAdapter, fieldPartId]

// @ts-expect-error Field theme keys are a closed set.
fieldTheme({ gapSize: '1rem' })

// @ts-expect-error Field layouts are a closed set.
const invalidFieldLayout: FieldProps = { layout: 'inline', label: 'Email' }
createElement(Field, invalidFieldLayout)

createElement('div', { style: inputTheme({ height: '3rem', radius: '999px' }) })

const inputProps: InputProps = {
  name: 'email',
  type: 'email',
  autoComplete: 'email',
  defaultValue: 'ada@example.com',
  size: 24,
  controlSize: 'large',
  style: { '--rad-input-radius': '1rem' },
  required: true,
  ref: createRef<HTMLInputElement>()
}
createElement(Input, inputProps)

// @ts-expect-error Input theme keys are a closed set.
inputTheme({ heightPx: '3rem' })

createElement('div', { style: checkboxTheme({ size: '1.25rem', mark: 'white' }) })

const checkboxProps: CheckboxProps = {
  name: 'channels',
  value: 'email',
  defaultChecked: true,
  indeterminate: true,
  controlSize: 'small',
  label: 'Email',
  parts: {
    wrapper: { className: 'gap-4' },
    label: { style: { fontStyle: 'italic' } },
    indicator: { className: 'scale-75' }
  },
  disabled: false,
  ref: createRef<HTMLInputElement>()
}
createElement(Checkbox, checkboxProps)

// @ts-expect-error Checkbox theme keys are a closed set.
checkboxTheme({ boxSize: '1rem' })

// @ts-expect-error Checkbox type is fixed.
const invalidCheckbox: CheckboxProps = { type: 'radio' }
createElement(Checkbox, invalidCheckbox)

createElement('div', { style: radioTheme({ size: '1.25rem', radius: '999px' }) })

const radioGroupProps: RadioGroupProps = {
  label: 'Plan',
  name: 'plan',
  value: null,
  controlSize: 'large',
  required: true,
  form: 'profile',
  className: 'p-4',
  style: { margin: 0 },
  'data-slot': 'plan',
  ref: createRef<HTMLFieldSetElement>(),
  parts: {
    label: { className: 'italic' },
    options: { className: 'flex', style: { gap: '1rem' } }
  },
  onValueChange(value: string) {
    void value
  }
}
createElement(RadioGroup, radioGroupProps, createElement(Radio, { label: 'Pro', value: 'pro' }))

const radioProps: RadioProps = {
  name: 'plan',
  value: 'pro',
  defaultChecked: true,
  controlSize: 'medium',
  label: 'Pro',
  parts: {
    wrapper: { className: 'gap-4' },
    label: { className: 'italic' },
    indicator: { style: { inset: '25%' } }
  },
  ref: createRef<HTMLInputElement>()
}
createElement(Radio, radioProps)

// @ts-expect-error Styling hooks cannot redirect label relationships.
const checkboxPartId: CheckboxProps = { parts: { label: { id: 'other' } } }
// @ts-expect-error Styling hooks cannot attach event handlers.
const radioPartEvent: RadioProps = { value: 'pro', parts: { wrapper: { onClick() {} } } }
const groupPartRef: RadioGroupProps = {
  name: 'plan',
  label: 'Plan',
  // @ts-expect-error Group parts cannot redirect refs away from the fieldset.
  parts: { options: { ref: createRef<HTMLDivElement>() } }
}
void [checkboxPartId, radioPartEvent, groupPartRef]

// @ts-expect-error Native Input size remains numeric character width.
const visualNativeSize: InputProps = { size: 'large' }
// @ts-expect-error Visual control sizes use the shared closed vocabulary.
const unknownControlSize: CheckboxProps = { controlSize: 'default' }
// @ts-expect-error Native values have one owner.
const mixedInput: InputProps = { value: '', defaultValue: '' }
// @ts-expect-error Checked state has one owner, including false.
const mixedCheckbox: CheckboxProps = { checked: false, defaultChecked: true }
// @ts-expect-error Standalone Radio checked state has one owner.
const mixedRadio: RadioProps = { value: 'yes', checked: false, defaultChecked: true }
// @ts-expect-error RadioGroup has one owner; null is a supplied controlled value.
const mixedGroup: RadioGroupProps = {
  label: 'Plan',
  name: 'plan',
  value: null,
  defaultValue: 'pro'
}
// @ts-expect-error Controlled text values use an empty string rather than null.
const nullInput: InputProps = { value: null }
void [
  visualNativeSize,
  unknownControlSize,
  mixedInput,
  mixedCheckbox,
  mixedRadio,
  mixedGroup,
  nullInput
]

// @ts-expect-error Radio theme keys are a closed set.
radioTheme({ diskSize: '1rem' })

// @ts-expect-error Radio type is fixed.
const invalidRadio: RadioProps = { type: 'checkbox', value: 'pro' }
createElement(Radio, invalidRadio)

createElement('div', { style: dialogTheme({ width: '24rem', backdrop: 'transparent' }) })

const dialogProps: DialogProps = {
  open: true,
  modal: true,
  closeOnBackdrop: true,
  closeOnEscape: false,
  onOpenChange(open: boolean) {
    void open
  }
}
createElement(
  Dialog,
  dialogProps,
  createElement(DialogTrigger, null, 'Edit'),
  createElement(
    DialogContent,
    {
      ref: createRef<HTMLDialogElement>(),
      className: 'open:p-0',
      style: { '--rad-dialog-width': '24rem', '--rad-motion-color-duration': '0ms' }
    },
    createElement(
      DialogTitle,
      { ref: createRef<HTMLHeadingElement>(), style: { '--rad-dialog-title-size': '1.25rem' } },
      'Profile'
    ),
    createElement(
      DialogDescription,
      { ref: createRef<HTMLParagraphElement>(), style: { fontStyle: 'italic' } },
      'Your details'
    )
  )
)

// @ts-expect-error Dialog has one open-state owner, including false.
const mixedDialog: DialogProps = { open: false, defaultOpen: true }
// @ts-expect-error Dialog is a non-DOM owner; styles and refs belong to its parts.
const styledDialog: DialogProps = { className: 'p-4' }
// @ts-expect-error DialogContent refs target the native dialog, not a div wrapper.
const wrongDialogRef: DialogContentProps = { ref: createRef<HTMLDivElement>() }
void [mixedDialog, styledDialog, wrongDialogRef]

const dialogTriggerProps: DialogTriggerProps = {
  variant: 'outline',
  controlSize: 'small',
  pending: true,
  iconOnly: true,
  fullWidth: true,
  ref: createRef<HTMLButtonElement>()
}
createElement(DialogTrigger, dialogTriggerProps)
const dialogCloseProps: DialogCloseProps = {
  variant: 'ghost',
  pending: true,
  ref: node => {
    node?.focus()
    return () => {}
  },
  render: renderButton
}
createElement(DialogClose, dialogCloseProps)
// @ts-expect-error Dialog actions use the same closed variant vocabulary as Button.
const invalidDialogAction: DialogTriggerProps = { variant: 'link' }
createElement(DialogTrigger, invalidDialogAction)

// @ts-expect-error Dialog theme keys are a closed set.
dialogTheme({ size: '24rem' })

createElement('div', { style: collapsibleTheme({ radius: '1rem', duration: '0ms' }) })

const collapsibleProps: CollapsibleProps = {
  open: true,
  defaultOpen: false,
  name: 'faq',
  onOpenChange(open: boolean) {
    void open
  }
}
createElement(
  Collapsible,
  collapsibleProps,
  createElement(CollapsibleTrigger, null, 'Shipping'),
  createElement(CollapsibleContent, null, 'Ships in two days.')
)

// @ts-expect-error Collapsible theme keys are a closed set.
collapsibleTheme({ panel: '1rem' })

createElement('div', { style: accordionTheme({ gap: '0.5rem' }) })

const accordionProps: AccordionProps = {
  type: 'single',
  value: 'shipping',
  defaultValue: null,
  disabled: false,
  onValueChange(value: string | null) {
    void value
  }
}
createElement(
  Accordion,
  accordionProps,
  createElement(
    AccordionItem,
    { value: 'shipping', disabled: true },
    createElement(AccordionTrigger, { level: 3 }, 'Shipping'),
    createElement(AccordionContent, null, 'Ships in two days.')
  )
)
createElement(
  Accordion,
  {
    type: 'multiple',
    value: ['shipping'],
    onValueChange(value: string[]) {
      void value
    }
  },
  createElement(
    AccordionItem,
    { value: 'shipping' },
    createElement(AccordionTrigger, { level: null }, 'Shipping')
  )
)

// @ts-expect-error A single accordion value is one section, not a list.
const invalidAccordion: AccordionProps = { type: 'single', value: ['shipping'] }
createElement(Accordion, invalidAccordion)

// @ts-expect-error Accordion theme keys are a closed set.
accordionTheme({ radius: '1rem' })

createElement('div', { style: cardTheme({ radius: '1rem', padding: '0', titleWeight: 550 }) })

const cardProps: CardProps = { role: 'region', 'aria-labelledby': 'ship' }
const cardTitleProps: CardTitleProps = { id: 'ship', level: 3 }
createElement(
  Card,
  cardProps,
  createElement(CardHeader, null, createElement(CardTitle, cardTitleProps, 'Shipping')),
  createElement(CardDescription, null, 'Leaves the studio tomorrow.'),
  createElement(CardContent, null, 'Ships in two days.'),
  createElement(CardFooter, null, 'Track')
)

// @ts-expect-error Card theme keys are a closed set.
cardTheme({ panel: '1rem' })

// @ts-expect-error The dialog open attribute is owned by showModal.
const invalidDialog: DialogContentProps = { open: true }
createElement(DialogContent, invalidDialog)

// All action axes compose across both native hosts and Dialog actions.
const actionVariants: ButtonVariant[] = ['solid', 'soft', 'outline', 'ghost']
const actionTones: Tone[] = ['accent', 'neutral', 'warning', 'danger']
const controlSizes: ControlSize[] = ['small', 'medium', 'large']
for (const variant of actionVariants) {
  for (const tone of actionTones) {
    for (const controlSize of controlSizes) {
      createElement(Button, { variant, tone, controlSize, type: 'reset', form: 'profile' })
      createElement(Link, { variant, tone, controlSize, href: '/guide', download: 'guide.pdf' })
      createElement(DialogTrigger, { variant, tone, controlSize })
      createElement(DialogClose, { variant, tone, controlSize })
    }
  }
}
const linkVariants: LinkVariant[] = [...actionVariants, 'inline', 'subtle']
for (const variant of linkVariants) createElement(Link, { variant, tone: 'warning' })

// @ts-expect-error Colour names no longer stand for treatment.
const oldButtonVariant: ButtonProps = { variant: 'primary' }
// @ts-expect-error Tone is a palette role, not an appearance.
const appearanceAsTone: LinkProps = { tone: 'outline' }
// @ts-expect-error Visual sizing has one canonical vocabulary.
const oldControlSize: ButtonProps = { controlSize: 'default' }
// @ts-expect-error The old size prop is removed from actions.
const oldButtonSize: ButtonProps = { size: 'small' }
// @ts-expect-error The old size prop is removed from anchors too.
const oldLinkSize: LinkProps = { size: 'small' }
// @ts-expect-error Radius belongs to theme or local CSS.
const oldButtonRadius: ButtonProps = { radius: 'full' }
// @ts-expect-error Radius belongs to theme or local CSS on Link too.
const oldLinkRadius: LinkProps = { radius: 'full' }
// @ts-expect-error Replaced with ControlSize.
import type { ButtonSize } from '@cognitap/radiant'
// @ts-expect-error Removed in favour of theme or CSS.
import type { ButtonRadius } from '@cognitap/radiant'
export type RetiredActionExports = [ButtonSize, ButtonRadius]
void [
  oldButtonVariant,
  appearanceAsTone,
  oldControlSize,
  oldButtonSize,
  oldLinkSize,
  oldButtonRadius,
  oldLinkRadius
]
