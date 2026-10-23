import { createElement, createRef } from 'react'
import { Button, type ButtonProps } from '@cognitap/radiant'

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
