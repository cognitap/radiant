import { TreeSelect, type TreeItem, type TreeSelectProps } from '@cognitap/radiant'

const items: readonly TreeItem[] = [{ value: 'draft', label: 'Draft' }]

export const single = (
  <TreeSelect
    aria-label="Destination"
    items={items}
    value="draft"
    onValueChange={value => value?.trim()}
  />
)
export const multiple = (
  <TreeSelect
    aria-label="Recipients"
    items={items}
    name="recipient"
    type="multiple"
    checkboxes
    required
    defaultValue={[]}
    onValueChange={values => values.join(',')}
  />
)

// @ts-expect-error Single selection takes one key.
export const wrongMode: TreeSelectProps = { items, defaultValue: ['draft'] }
// @ts-expect-error A selection has either a controlled value or a default value.
export const wrongOwner: TreeSelectProps = { items, value: 'draft', defaultValue: 'draft' }
