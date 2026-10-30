import { createRef } from 'react'
import { ButtonGroup, Button, type ButtonGroupProps, defineTheme } from '@cognitap/radiant'
const props: ButtonGroupProps = {
  orientation: 'vertical',
  ref: createRef<HTMLDivElement>(),
  style: { '--rad-button-group-radius': '1rem' },
  'aria-label': 'Actions'
}
export const group = (
  <ButtonGroup {...props}>
    <Button>Save</Button>
  </ButtonGroup>
)
defineTheme({ id: 'group', name: 'Group', components: { buttonGroup: { radius: '1rem' } } })
// @ts-expect-error Purely visual grouping never becomes a toolbar.
export const role = <ButtonGroup role="toolbar" />
// @ts-expect-error Direction uses native dir; orientation selects only the layout axis.
export const orientation = <ButtonGroup orientation="rtl" />
// @ts-expect-error The group owns no selection or roving focus.
export const selection = <ButtonGroup value="save" />
// @ts-expect-error Root ref reaches a div.
export const ref = <ButtonGroup ref={createRef<HTMLButtonElement>()} />
