import { createElement, createRef } from 'react'
import {
  Button,
  buttonTheme,
  themes,
  type ButtonProps,
  type ButtonTheme,
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
