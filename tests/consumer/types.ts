import { createElement, createRef } from 'react'
import { Button, type ButtonProps } from '@cognitap/radiant'

const props: ButtonProps = {
  type: 'submit',
  disabled: true,
  pending: true,
  'aria-label': 'Save',
  ref: createRef<HTMLButtonElement>()
}
createElement(Button, props)

// @ts-expect-error Native button types must survive the public declaration export.
const invalidProps: ButtonProps = { type: 'invalid' }
createElement(Button, invalidProps)
