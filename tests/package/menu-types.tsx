import { createElement as h, createRef } from 'react'
import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuPortal,
  useMenu,
  type MenuProps,
  type MenuItemProps,
  type MenuContentProps,
  type MenuState,
  type MenuRenderProps,
  type MenuTriggerProps,
  type MenuSubTriggerProps,
  type MenuCheckboxItemProps
} from '@cognitap/radiant'
h(
  Menu,
  { defaultOpen: true },
  h(
    MenuTrigger,
    {
      ref: createRef<HTMLButtonElement>(),
      render: (props: MenuRenderProps) => <button {...props} />
    },
    'Commands'
  ),
  h(
    MenuPortal,
    null,
    h(
      MenuContent,
      { ref: createRef<HTMLDivElement>(), side: 'right', style: { '--rad-menu-width': '14rem' } },
      h(
        MenuItem,
        { disabled: true, textValue: 'Archive', onSelect: event => event.preventDefault() },
        'Archive'
      )
    )
  )
)
export function Probe() {
  const state: MenuState | null = useMenu()
  return state?.open ? 'open' : null
}
// @ts-expect-error Menu has one state owner.
const mixed: MenuProps = { open: false, defaultOpen: true }
// @ts-expect-error Menus anchor to their trigger.
const anchoredMenu: MenuProps = { anchor: new DOMRect() }
void anchoredMenu
// @ts-expect-error Menu owns content semantics.
const role: MenuContentProps = { role: 'listbox' }
// @ts-expect-error Menu owns item roles.
const item: MenuItemProps = { role: 'link' }
// @ts-expect-error Menus return focus to their trigger.
const returning: MenuContentProps = { returnFocusRef: createRef<HTMLButtonElement>() }
void [mixed, role, item, returning]

// @ts-expect-error A trigger that opens a menu is not a toggle.
export const pressedMenuTrigger: MenuTriggerProps = { defaultPressed: true }
// @ts-expect-error A menu action is not a toggle.
export const pressedMenuItem: MenuItemProps = { pressed: true }
// @ts-expect-error A submenu opener is not a toggle.
export const pressedSubTrigger: MenuSubTriggerProps = { onPressedChange: () => {} }
// @ts-expect-error A checkbox item has one checked owner.
export const twoCheckedOwners: MenuCheckboxItemProps = { checked: true, defaultChecked: false }

// @ts-expect-error Menu rows take none of Button's treatment.
export const solidMenuItem: MenuItemProps = { variant: 'solid' }
// @ts-expect-error Menu rows take none of Button's sizes.
export const sizedMenuItem: MenuItemProps = { controlSize: 'large' }
// @ts-expect-error Menu rows have no accent tone.
export const accentMenuItem: MenuItemProps = { tone: 'accent' }
export const dangerMenuItem: MenuItemProps = { tone: 'danger' }
