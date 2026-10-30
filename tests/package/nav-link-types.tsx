import { createRef } from 'react'
import {
  NavLink,
  NavLinkGroup,
  NavLinkGroupTrigger,
  NavLinkGroupContent,
  type NavLinkProps,
  type NavLinkGroupProps,
  type NavLinkGroupTriggerProps
} from '@cognitap/radiant'
export const navigation = (
  <nav aria-label="Projects">
    <NavLink
      href="/project"
      active
      ref={createRef<HTMLAnchorElement>()}
      description="Project health"
      render={props => <a {...props}>{props.children}</a>}
    >
      Overview
    </NavLink>
    <NavLinkGroup
      defaultOpen
      ref={createRef<HTMLDetailsElement>()}
    >
      <NavLinkGroupTrigger ref={createRef<HTMLElement>()}>Projects</NavLinkGroupTrigger>
      <NavLinkGroupContent ref={createRef<HTMLDivElement>()}>
        <NavLink href="/nested">Nested</NavLink>
      </NavLinkGroupContent>
    </NavLinkGroup>
  </nav>
)
// @ts-expect-error A destination is required.
export const noHref: NavLinkProps = { children: 'Overview' }
// @ts-expect-error Active owns aria-current.
export const aria: NavLinkProps = { href: '/x', children: 'X', 'aria-current': 'page' }
// @ts-expect-error Navigation links are anchors.
export const role: NavLinkProps = { href: '/x', children: 'X', role: 'menuitem' }
// @ts-expect-error A disclosure has one state owner.
export const both: NavLinkGroupProps = { open: true, defaultOpen: true }
// @ts-expect-error Native summary owns expansion semantics.
export const expanded: NavLinkGroupTriggerProps = { children: 'Projects', 'aria-expanded': true }
