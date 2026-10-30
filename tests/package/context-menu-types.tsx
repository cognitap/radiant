import { createRef } from 'react'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  useContextMenu,
  type ContextMenuProps,
  type ContextMenuTriggerProps
} from '@cognitap/radiant'
const div = createRef<HTMLDivElement>(),
  button = createRef<HTMLButtonElement>()
export const contextTypes = (
  <ContextMenu
    defaultOpen
    onOpenChange={Boolean}
  >
    <ContextMenuTrigger
      ref={div}
      aria-label="File"
      title="File"
      style={{ '--rad-context-menu-width': '18rem' }}
    />
    <ContextMenuContent
      ref={div}
      motion="off"
    >
      <ContextMenuItem
        ref={button}
        closeOnSelect={false}
      >
        Rename
      </ContextMenuItem>
      <ContextMenuCheckboxItem
        checked={false}
        onCheckedChange={Boolean}
        indeterminate
      />
      <ContextMenuRadioGroup defaultValue="list">
        <ContextMenuRadioItem value="list" />
      </ContextMenuRadioGroup>
      <ContextMenuSub>
        <ContextMenuSubTrigger ref={button}>Move</ContextMenuSubTrigger>
        <ContextMenuSubContent ref={div} />
      </ContextMenuSub>
    </ContextMenuContent>
  </ContextMenu>
)
// @ts-expect-error Root state has one owner.
const twoOwners: ContextMenuProps = { open: false, defaultOpen: true }
// @ts-expect-error A named context target is required.
const noName: ContextMenuTriggerProps = {}
// @ts-expect-error Context target is a native div.
const wrongRef: ContextMenuTriggerProps = { 'aria-label': 'File', ref: createRef<SVGSVGElement>() }
// @ts-expect-error The context target owns its role.
const wrongRole: ContextMenuTriggerProps = { 'aria-label': 'File', role: 'button' }
export function ContextState() {
  const state = useContextMenu()
  state?.setOpen(false)
  return state?.contentId
}
void [twoOwners, noName, wrongRef, wrongRole]
