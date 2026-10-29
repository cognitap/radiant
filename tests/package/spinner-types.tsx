import { createElement as h, createRef } from 'react'
import { Spinner, type SpinnerProps } from '@cognitap/radiant'
h(Spinner, {
  label: 'Loading account',
  ref: createRef<SVGSVGElement>(),
  controlSize: 'small',
  motion: 'off',
  style: { '--rad-spinner-size': '2rem' },
  parts: { track: { className: 'opacity-50' } }
})
h(Spinner, {})
// @ts-expect-error Spinner owns its decorative or named semantics.
const role: SpinnerProps = { role: 'status' }
// @ts-expect-error Supply the standalone name through label.
const name: SpinnerProps = { 'aria-label': 'Loading' }
// @ts-expect-error The indicator cannot contain interactive content.
const children: SpinnerProps = { children: 'Loading' }
void [role, name, children]
