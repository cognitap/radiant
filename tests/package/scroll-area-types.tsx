import { createRef } from 'react'
import {
  ScrollArea,
  type ScrollAreaProps,
  type ScrollAreaOrientation,
  type ScrollAreaVisibility
} from '@cognitap/radiant'
const orientation: ScrollAreaOrientation = 'both',
  visibility: ScrollAreaVisibility = 'scroll'
const props: ScrollAreaProps = {
  'aria-label': 'Recent messages',
  orientation,
  visibility,
  ref: createRef<HTMLDivElement>(),
  onScroll: event => event.currentTarget.scrollTop,
  style: { height: 200, '--rad-scroll-area-size': '8px' },
  parts: { content: { style: { padding: '1rem' } }, thumb: { className: 'bg-blue-600' } }
}
;<ScrollArea {...props}>Messages</ScrollArea>
;<ScrollArea
  aria-labelledby="messages-title"
  tabIndex={-1}
>
  Messages
</ScrollArea>
// @ts-expect-error Every viewport needs a name.
;<ScrollArea>Messages</ScrollArea>
const invalidVisibility: ScrollAreaProps = {
  'aria-label': 'Messages',
  // @ts-expect-error Visibility has three supported policies.
  visibility: 'auto'
}
void invalidVisibility
const invalidRole: ScrollAreaProps = {
  'aria-label': 'Messages',
  // @ts-expect-error Native group semantics belong to the viewport.
  role: 'button'
}
void invalidRole
const invalidRef: ScrollAreaProps = {
  'aria-label': 'Messages',
  // @ts-expect-error The real scroll viewport is a div.
  ref: createRef<SVGSVGElement>()
}
void invalidRef
