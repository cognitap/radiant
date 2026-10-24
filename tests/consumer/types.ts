import { createElement, createRef } from 'react'
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
  DialogContent,
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
  type ButtonTheme,
  type CheckboxProps,
  type FieldProps,
  type InputProps,
  type AccordionProps,
  type CardProps,
  type CardTitleProps,
  type CollapsibleProps,
  type DialogContentProps,
  type DialogProps,
  type RadioGroupProps,
  type RadioProps,
  type LinkProps,
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
  variant: 'destructive',
  size: 'large',
  radius: 'full',
  iconOnly: true,
  fullWidth: true,
  'aria-label': 'Save',
  ref: createRef<HTMLButtonElement>()
}
createElement(Button, props)

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
  variant: 'button',
  tone: 'destructive',
  size: 'small',
  radius: 'full',
  external: true,
  ref: createRef<HTMLAnchorElement>()
}
createElement(Link, linkProps)

// @ts-expect-error Link variants are a closed set.
const invalidLinkVariant: LinkProps = { variant: 'solid' }
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
  children: control => createElement('input', control)
}
createElement(Field, fieldProps)
createElement(Field, { layout: 'group', label: 'Plan', role: 'radiogroup' })

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
  label: 'Email',
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
  defaultValue: 'pro',
  value: 'pro',
  required: true,
  onValueChange(value: string) {
    void value
  }
}
createElement(RadioGroup, radioGroupProps, createElement(Radio, { label: 'Pro', value: 'pro' }))

const radioProps: RadioProps = {
  name: 'plan',
  value: 'pro',
  defaultChecked: true,
  label: 'Pro',
  ref: createRef<HTMLInputElement>()
}
createElement(Radio, radioProps)

// @ts-expect-error Radio theme keys are a closed set.
radioTheme({ diskSize: '1rem' })

// @ts-expect-error Radio type is fixed.
const invalidRadio: RadioProps = { type: 'checkbox', value: 'pro' }
createElement(Radio, invalidRadio)

createElement('div', { style: dialogTheme({ width: '24rem', backdrop: 'transparent' }) })

const dialogProps: DialogProps = {
  open: true,
  defaultOpen: false,
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
  createElement(DialogContent, { ref: createRef<HTMLDialogElement>() })
)

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
