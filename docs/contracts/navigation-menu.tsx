import { createRef } from 'react'
import {
  NavigationMenu,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuViewport,
  NavigationMenuContent,
  type NavigationMenuProps,
  type NavigationMenuRenderProps,
  type NavigationMenuLinkRenderProps
} from '../../src/index.js'
const items = [{ value: 'learn' }]
export const native = (
  <NavigationMenu
    aria-label="Project"
    items={items}
    defaultValue={null}
    ref={createRef<HTMLElement>()}
  >
    <NavigationMenuTrigger
      value="learn"
      ref={createRef<HTMLButtonElement>()}
      render={(props: NavigationMenuRenderProps) => <button {...props} />}
    >
      Learn
    </NavigationMenuTrigger>
    <NavigationMenuViewport ref={createRef<HTMLDivElement>()}>
      <NavigationMenuContent
        value="learn"
        ref={createRef<HTMLDivElement>()}
      >
        <NavigationMenuLink
          href="/guide"
          render={(props: NavigationMenuLinkRenderProps) => <a {...props}>{props.children}</a>}
        >
          Guide
        </NavigationMenuLink>
      </NavigationMenuContent>
    </NavigationMenuViewport>
  </NavigationMenu>
)
// @ts-expect-error Navigation has one value owner.
export const mixed: NavigationMenuProps = {
  'aria-label': 'Project',
  items,
  value: 'learn',
  defaultValue: 'learn'
}
// @ts-expect-error A navigation landmark must be named.
export const unnamed = <NavigationMenu items={items} />
// @ts-expect-error Navigation triggers disclose rather than toggle a pressed state.
export const pressed = (
  <NavigationMenuTrigger
    value="learn"
    pressed
  >
    Learn
  </NavigationMenuTrigger>
)
// @ts-expect-error Navigation links require actual destinations.
export const noDestination = <NavigationMenuLink>Guide</NavigationMenuLink>
