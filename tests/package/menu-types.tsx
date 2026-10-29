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
  type MenuRenderProps
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
// @ts-expect-error Menu owns content semantics.
const role: MenuContentProps = { role: 'listbox' }
// @ts-expect-error Menu owns item roles.
const item: MenuItemProps = { role: 'link' }
void [mixed, role, item]
