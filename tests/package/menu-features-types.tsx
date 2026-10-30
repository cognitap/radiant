import { createRef } from 'react'
import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuGroup,
  MenuLabel,
  MenuSeparator,
  MenuCheckboxItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSub,
  MenuSubTrigger,
  MenuSubContent,
  type MenuCheckboxItemProps,
  type MenuRadioGroupProps,
  type MenuRadioItemProps,
  type MenuSubProps,
  type MenuGroupProps,
  type MenuLabelProps,
  type MenuSeparatorProps,
  type MenuSubTriggerProps,
  type MenuSubContentProps
} from '@cognitap/radiant'
const button = createRef<HTMLButtonElement>(),
  div = createRef<HTMLDivElement>(),
  hr = createRef<HTMLHRElement>()
export const choices = (
  <Menu>
    <MenuTrigger>View</MenuTrigger>
    <MenuContent>
      <MenuGroup
        ref={div}
        aria-labelledby="display"
      >
        <MenuLabel
          id="display"
          ref={div}
        >
          Display
        </MenuLabel>
        <MenuCheckboxItem
          ref={button}
          defaultChecked
          indeterminate
          onCheckedChange={checked => {
            const value: boolean = checked
            void value
          }}
          closeOnSelect={false}
          parts={{ indicator: { style: { color: 'red' } } }}
        >
          Grid
        </MenuCheckboxItem>
        <MenuSeparator ref={hr} />
      </MenuGroup>
      <MenuRadioGroup
        value="list"
        onValueChange={value => {
          const next: string | null = value
          void next
        }}
      >
        <MenuRadioItem value="list">List</MenuRadioItem>
      </MenuRadioGroup>
      <MenuSub defaultOpen={false}>
        <MenuSubTrigger
          ref={button}
          parts={{ indicator: { className: 'w-7' } }}
        >
          Export
        </MenuSubTrigger>
        <MenuSubContent
          ref={div}
          side="right"
          motion="off"
        />
      </MenuSub>
    </MenuContent>
  </Menu>
)
// @ts-expect-error Checked state has one owner.
export const bothChecked: MenuCheckboxItemProps = { checked: true, defaultChecked: false }
// @ts-expect-error Radio selection has one owner.
export const bothRadio: MenuRadioGroupProps = { value: 'list', defaultValue: 'grid' }
// @ts-expect-error Item keys are strings.
export const radioNumber: MenuRadioItemProps = { value: 5 }
// @ts-expect-error Submenu open state has one owner.
export const bothSub: MenuSubProps = { open: true, defaultOpen: false }
export const checkRole = {
  // @ts-expect-error The checkbox item's semantics are owned.
  role: 'button'
} satisfies MenuCheckboxItemProps
export const checkRef = {
  // @ts-expect-error The checkable action remains a native button.
  ref: createRef<SVGSVGElement>()
} satisfies MenuCheckboxItemProps
export type Parts = [
  MenuGroupProps,
  MenuLabelProps,
  MenuSeparatorProps,
  MenuSubTriggerProps,
  MenuSubContentProps
]
