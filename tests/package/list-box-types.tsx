import { ListBox, type ListBoxOption, type ListBoxProps } from '@cognitap/radiant'

const items: readonly ListBoxOption[] = [
  { value: 'notes', textValue: 'Notes', label: <b>Notes</b> }
]

export const single = (
  <ListBox
    items={items}
    value={null}
    onValueChange={value => value?.trim()}
  />
)
export const multiple = (
  <ListBox
    type="multiple"
    items={items}
    value={['notes']}
    onValueChange={value => value.join(',')}
  />
)
// @ts-expect-error Multiple mode requires a list of selected values.
export const mixed: ListBoxProps = { type: 'multiple', items, value: 'notes' }
