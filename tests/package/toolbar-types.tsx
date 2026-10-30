import { createRef } from 'react'
import {
  Toolbar,
  Button,
  Link,
  ToggleGroup,
  ToggleGroupItem,
  type ToolbarProps
} from '@cognitap/radiant'
export const toolbar = (
  <Toolbar
    aria-label="Editor"
    ref={createRef<HTMLDivElement>()}
    orientation="vertical"
    loop={false}
    dir="rtl"
    style={{ '--rad-toolbar-gap': '7px' }}
    onKeyDown={event => {
      const host: HTMLDivElement = event.currentTarget
      return host.id
    }}
  >
    <Button>Save</Button>
    <ToggleGroup
      aria-label="Formatting"
      type="multiple"
    >
      <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
    </ToggleGroup>
    <Link href="/guide">Guide</Link>
  </Toolbar>
)
// @ts-expect-error Composite toolbars need a name.
const unnamed: ToolbarProps = { orientation: 'horizontal' }
const role: ToolbarProps = {
  'aria-label': 'Editor',
  // @ts-expect-error Toolbar owns its native role.
  role: 'grid'
}
const tab: ToolbarProps = {
  'aria-label': 'Editor',
  // @ts-expect-error Child actions own the tab entry.
  tabIndex: 0
}
const orientation: ToolbarProps = {
  'aria-label': 'Editor',
  // @ts-expect-error Orientation is a closed set.
  orientation: 'diagonal'
}
void [unnamed, role, tab, orientation]
