import { createElement as h, createRef } from 'react'
import { Separator, type SeparatorProps } from '@cognitap/radiant'
h(Separator, {
  ref: createRef<HTMLHRElement>(),
  orientation: 'vertical',
  decorative: true,
  style: { height: '3rem', '--rad-separator-thickness': '2px' }
})
// @ts-expect-error Separator is static, not a focusable splitter.
const focus: SeparatorProps = { tabIndex: 0 }
// @ts-expect-error Use orientation for both appearance and semantics.
const orientation: SeparatorProps = { 'aria-orientation': 'vertical' }
void [focus, orientation]
