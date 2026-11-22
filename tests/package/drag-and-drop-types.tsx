import { createRef } from 'react'
import {
  DragAndDrop,
  DragAndDropContainer,
  DragAndDropItem,
  type DragAndDropProps,
  type DragAndDropText,
  type DragAndDropValue
} from '@cognitap/radiant'
import type { A2uiDragDropText, A2uiSurfaceLabels } from '@cognitap/radiant/a2ui'
const say: DragAndDropText = ({ item, from, to, index, count }) =>
  `${item} from ${from} to ${to}: ${index + 1}/${count}`
const text = {
  instructionsText: 'Space picks up.',
  pickUpText: say,
  moveText: say,
  dropText: say,
  cancelText: say,
  fullText: say
}
const props: DragAndDropProps = { 'aria-label': 'Board', name: 'board', ...text }
const start: DragAndDropValue = { todo: ['a'], done: [] }
;<DragAndDrop
  {...props}
  ref={createRef<HTMLDivElement>()}
  defaultValue={start}
  onValueChange={(next: DragAndDropValue) => next}
  gap="airy"
  controlSize="small"
  motion="off"
  handleLabel={item => `Move ${item}`}
  parts={{ label: { className: 'x' }, list: {}, handle: {}, content: { style: {} } }}
>
  <DragAndDropContainer
    value="todo"
    label="To do"
    textValue="To do"
    capacity={3}
    ref={createRef<HTMLDivElement>()}
  />
  <DragAndDropItem
    value="a"
    textValue="Alpha"
    ref={createRef<HTMLDivElement>()}
  >
    Alpha
  </DragAndDropItem>
</DragAndDrop>
// @ts-expect-error The value and its default have one owner.
;<DragAndDrop
  {...props}
  value={start}
  defaultValue={start}
/>
const bad: DragAndDropProps = {
  ...props,
  // @ts-expect-error Announcements are functions of the move.
  dropText: 'Moved'
}
void bad
// @ts-expect-error A container needs a visible label.
;<DragAndDropContainer value="x" />
const template: A2uiDragDropText = 'Moved {item} from {from} to {to}'
const labels: A2uiSurfaceLabels = {
  dragDropInstructions: 'Space',
  dragDropDrop: template,
  dragDropFull: move => `${move.to} is full`,
  dragDropHandle: item => `Move ${item}`
}
void labels
