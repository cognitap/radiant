import { createElement as h, createRef } from 'react'
import { Badge, type BadgeProps } from '@cognitap/radiant'
h(Badge, {
  children: 'Approved',
  tone: 'accent',
  decorative: false,
  ref: createRef<HTMLSpanElement>(),
  style: { '--rad-badge-radius': '9999px' }
})
// @ts-expect-error Badge is passive presentation, not a button.
const role: BadgeProps = { role: 'button' }
// @ts-expect-error Badge is not in keyboard navigation.
const focus: BadgeProps = { tabIndex: 0 }
// @ts-expect-error Visible text supplies the meaning.
const name: BadgeProps = { 'aria-label': 'Approved' }
void [role, focus, name]
