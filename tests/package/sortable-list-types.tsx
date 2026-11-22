import { createRef } from 'react'
import {
  SortableList,
  SortableListItem,
  type SortableListProps,
  type SortableListText
} from '@cognitap/radiant'
import type { A2uiSortableText, A2uiSurfaceLabels } from '@cognitap/radiant/a2ui'
const position: SortableListText = (item, index, count) => `${item}: ${index + 1}/${count}`
const text = {
  instructionsText: 'Space picks up.',
  pickUpText: position,
  moveText: position,
  dropText: position,
  cancelText: position
}
const props: SortableListProps = { 'aria-label': 'Order', name: 'order', ...text }
;<SortableList
  {...props}
  ref={createRef<HTMLOListElement>()}
  defaultValue={['b', 'a']}
  onValueChange={(next: string[]) => next}
  gap="airy"
  controlSize="small"
  motion="off"
  handleLabel={item => `Move ${item}`}
  parts={{ handle: { className: 'x' }, content: { style: {} } }}
>
  <SortableListItem
    value="a"
    textValue="Alpha"
    ref={createRef<HTMLDivElement>()}
  >
    Alpha
  </SortableListItem>
</SortableList>
// @ts-expect-error The value and its default have one owner.
;<SortableList
  {...props}
  value={['a']}
  defaultValue={['a']}
/>
const bad: SortableListProps = {
  ...props,
  // @ts-expect-error Announcements are functions of the item, index and count.
  moveText: 'Moved'
}
void bad
const template: A2uiSortableText = '{item}, {position} of {count}'
const labels: A2uiSurfaceLabels = {
  sortableInstructions: 'Space',
  sortableMove: template,
  sortableHandle: item => `Move ${item}`
}
void labels
