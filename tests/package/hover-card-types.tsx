import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  type HoverCardProps,
  type HoverCardRenderProps,
  type HoverCardState
} from '@cognitap/radiant'
import { createRef, type ComponentProps } from 'react'
const anchor = createRef<HTMLAnchorElement>(),
  surface = createRef<HTMLDivElement>()
const options: HoverCardProps = {
  defaultOpen: true,
  openDelay: 20,
  closeDelay: 40,
  onOpenChange: open => {
    const state: boolean = open
    void state
  }
}
export const preview = (
  <HoverCard {...options}>
    <HoverCardTrigger
      href="/profile"
      ref={anchor}
      external
      variant="subtle"
      render={(props: HoverCardRenderProps) => <a {...props}>{props.children}</a>}
    >
      Profile
    </HoverCardTrigger>
    <HoverCardContent
      ref={surface}
      side="top"
      align="end"
      motion="off"
      style={{ '--rad-hover-card-width': '18rem' }}
    />
  </HoverCard>
)
// @ts-expect-error An actual navigation destination is required.
export const noDestination = <HoverCardTrigger>Profile</HoverCardTrigger>
// @ts-expect-error Controlled and initial open owners are exclusive.
export const twoOwners: HoverCardProps = { open: true, defaultOpen: false }
export const foreignFocus = {
  // @ts-expect-error Preview opening never steals focus.
  initialFocusRef: anchor
} satisfies ComponentProps<typeof HoverCardContent>
export const wrongRef = {
  href: '/profile',
  // @ts-expect-error The trigger remains a native anchor.
  ref: createRef<SVGSVGElement>()
} satisfies ComponentProps<typeof HoverCardTrigger>
export function readPreview(state: HoverCardState) {
  state.setOpen(!state.open)
  return state.contentId
}
