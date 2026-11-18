import { Tree, type TreeItem, type TreeProps, type TreeVirtual } from '@cognitap/radiant'

const items: readonly TreeItem[] = [{ value: 'draft', label: 'Draft' }]
const virtual: TreeVirtual = { height: 240, rowHeight: 32 }

export const single = (
  <Tree
    aria-label="File browser"
    items={items}
    value="draft"
    onValueChange={value => value?.trim()}
  />
)
export const multiple = (
  <Tree
    aria-label="File browser"
    items={items}
    type="multiple"
    checkboxes
    virtual={virtual}
    expanded={[]}
    onExpandedChange={values => values.join(',')}
    onValueChange={values => values.join(',')}
  />
)

// @ts-expect-error Checkboxes are available in multiple selection mode.
export const wrongMode: TreeProps = { 'aria-label': 'Files', items, checkboxes: true }
