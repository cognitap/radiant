import { createRef } from 'react'
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarPortal,
  MenubarItem,
  MenubarGroup,
  MenubarLabel,
  MenubarSeparator,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
  useMenubar,
  type MenubarProps,
  type MenubarMenuProps,
  type MenubarTriggerProps,
  type MenubarRenderProps,
  type MenubarItemProps
} from '@cognitap/radiant'
const div = createRef<HTMLDivElement>(),
  button = createRef<HTMLButtonElement>(),
  hr = createRef<HTMLHRElement>()
function Adapter(props: MenubarRenderProps) {
  return <button {...props}>{props.children}</button>
}
export const menuBarTypes = (
  <Menubar
    ref={div}
    aria-label="Editor"
    defaultValue="file"
    loop={false}
    onValueChange={value => {
      const nullable: string | null = value
      void nullable
    }}
    style={{ '--rad-menubar-gap': '8px' }}
  >
    <MenubarMenu value="file">
      <MenubarTrigger
        ref={button}
        render={props => <Adapter {...props} />}
      >
        File
      </MenubarTrigger>
      <MenubarPortal>
        <MenubarContent
          ref={div}
          motion="off"
        >
          <MenubarGroup
            ref={div}
            aria-labelledby="commands"
          >
            <MenubarLabel
              ref={div}
              id="commands"
            >
              Commands
            </MenubarLabel>
            <MenubarItem
              ref={button}
              type="submit"
              form="editor"
              name="intent"
              value="save"
              closeOnSelect={false}
            >
              Save
            </MenubarItem>
            <MenubarSeparator ref={hr} />
            <MenubarCheckboxItem
              defaultChecked
              indeterminate
              onCheckedChange={Boolean}
              parts={{ indicator: { style: { color: 'red' } } }}
            />
            <MenubarRadioGroup
              defaultValue="list"
              onValueChange={Boolean}
            >
              <MenubarRadioItem value="list" />
            </MenubarRadioGroup>
            <MenubarSub defaultOpen>
              <MenubarSubTrigger ref={button}>Export</MenubarSubTrigger>
              <MenubarSubContent
                ref={div}
                side="left"
              />
            </MenubarSub>
          </MenubarGroup>
        </MenubarContent>
      </MenubarPortal>
    </MenubarMenu>
  </Menubar>
)
// @ts-expect-error The root has one value owner.
const both: MenubarProps = { 'aria-label': 'Editor', value: 'file', defaultValue: 'file' }
// @ts-expect-error A named composite is required.
const unnamed: MenubarProps = {}
// @ts-expect-error Menubar owns the role.
const wrongRole: MenubarProps = { 'aria-label': 'Editor', role: 'toolbar' }
// @ts-expect-error Menu values are strings.
const numeric: MenubarMenuProps = { value: 3 }
// @ts-expect-error The bar owns which menu is open.
const open: MenubarMenuProps = { value: 'file', open: true }
// @ts-expect-error Menu titles expose expanded state, not pressed ownership.
const pressed: MenubarTriggerProps = { pressed: true }
// @ts-expect-error Menubar has a native div host.
const wrongRef: MenubarProps = { 'aria-label': 'Editor', ref: createRef<SVGSVGElement>() }
export function State() {
  const state = useMenubar()
  state?.setValue(null)
  return state?.value
}
// @ts-expect-error A menubar action is not a toggle.
const pressedItem: MenubarItemProps = { 'aria-pressed': true }
void [both, unnamed, wrongRole, numeric, open, pressed, wrongRef, pressedItem]
