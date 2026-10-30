import { createElement as h, createRef } from 'react'
import { Avatar, type AvatarProps } from '@cognitap/radiant'
h(Avatar, {
  alt: 'Jordan Rivera',
  src: '/person.png',
  fallback: 'JR',
  ref: createRef<HTMLSpanElement>(),
  controlSize: 'large',
  loading: 'lazy',
  crossOrigin: 'anonymous',
  parts: { image: { style: { objectFit: 'contain' } } },
  style: { '--rad-avatar-radius': '.5rem' }
})
h(Avatar, { alt: '', fallback: 'JR' })
// @ts-expect-error Alternative text is an explicit consumer decision.
h(Avatar, { src: '/person.png' })
// @ts-expect-error Plain fallback text cannot contain interactive controls.
const interactive: AvatarProps = { alt: 'Jordan', fallback: h('button', {}, 'Edit') }
// @ts-expect-error The alt prop supplies the single graphic's name.
const name: AvatarProps = { alt: 'Jordan', 'aria-label': 'Other' }
void [interactive, name]
