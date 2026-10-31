import { createRef } from 'react'
import {
  ToggleGroup,
  ToggleGroupItem,
  useToggleGroup,
  type ToggleGroupProps,
  type ToggleGroupItemProps
} from '@cognitap/radiant'
export const examples = (
  <>
    <ToggleGroup
      aria-label="View"
      defaultValue="list"
      variant="segmented"
      ref={createRef<HTMLDivElement>()}
      parts={{ indicator: { style: { '--rad-toggle-group-indicator-color': 'white' } } }}
      onValueChange={value => {
        const choice: string | null = value
        return choice
      }}
    >
      <ToggleGroupItem
        value="list"
        ref={createRef<HTMLButtonElement>()}
        render={props => <button {...props} />}
      >
        List
      </ToggleGroupItem>
    </ToggleGroup>
    <ToggleGroup
      aria-labelledby="formatting"
      type="multiple"
      value={['bold']}
      onValueChange={values => {
        const choices: string[] = values
        return choices
      }}
    >
      <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
    </ToggleGroup>
  </>
)
// @ts-expect-error A group needs an accessible name.
const unnamed: ToggleGroupProps = { defaultValue: null }
// @ts-expect-error A group has one value owner.
const collision: ToggleGroupProps = { 'aria-label': 'View', value: 'a', defaultValue: 'b' }
const multiple: Extract<ToggleGroupProps, { type: 'multiple' }> = {
  'aria-label': 'Formatting',
  type: 'multiple',
  // @ts-expect-error Multiple selection has no singular sliding indicator.
  variant: 'segmented'
}
const item: ToggleGroupItemProps = {
  value: 'a',
  // @ts-expect-error The group owns item selection.
  pressed: true
}
const indicator: ToggleGroupProps = {
  'aria-label': 'View',
  parts: {
    indicator: {
      // @ts-expect-error Visual part hooks cannot replace semantics or refs.
      role: 'button'
    }
  }
}
void [unnamed, collision, multiple, item, indicator, useToggleGroup]
