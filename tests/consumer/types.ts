import { createElement, createRef } from 'react'
import {
  Button,
  buttonTheme,
  Checkbox,
  checkboxTheme,
  Field,
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
