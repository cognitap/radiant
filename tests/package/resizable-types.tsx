import { createRef } from 'react'
import {
  Resizable,
  ResizablePanel,
  ResizableHandle,
  useResizable,
  type ResizableProps,
  type ResizableHandleProps,
  defineTheme
} from '@cognitap/radiant'
const items = [
  { value: 'files', min: 20, max: 50, collapsible: true },
  { value: 'preview', min: 40, max: 100 }
]
export const group = (
  <Resizable
    items={items}
    defaultValue={[30, 70]}
    orientation="horizontal"
    ref={createRef<HTMLDivElement>()}
  >
    <ResizablePanel
      value="files"
      ref={createRef<HTMLDivElement>()}
    />
    <ResizableHandle
      value="files"
      aria-label="Files"
      ref={createRef<HTMLHRElement>()}
      step={1}
      largeStep={10}
    />
    <ResizablePanel value="preview" />
  </Resizable>
)
export const controlled = (
  <Resizable
    items={items}
    value={[30, 70]}
    onValueChange={value => {
      const sizes: number[] = value
      void sizes
    }}
  />
)
export function Controls() {
  const state = useResizable()
  state?.resizeBy('files', 5)
  state?.resize('files', 25)
  state?.toggle('files')
  state?.setValue([30, 70])
  const id: string | undefined = state?.getPanel('files').id
  void id
  return null
}
export const theme = defineTheme({
  id: 'split',
  name: 'Split',
  components: {
    resizable: { handleSize: '10px', focusOffset: '-3px', handleBackground: 'transparent' }
  }
})
// @ts-expect-error An initial owner is required.
export const missing: ResizableProps = { items }
// @ts-expect-error Layout has one owner.
export const both: ResizableProps = { items, value: [30, 70], defaultValue: [30, 70] }
// @ts-expect-error Sizes are numeric percentages.
export const pixels: ResizableProps = { items, defaultValue: ['30px', '70px'] }
// @ts-expect-error Interactive separators need a name.
export const unnamed: ResizableHandleProps = { value: 'files' }
export const range: ResizableHandleProps = {
  value: 'files',
  'aria-label': 'Files',
  // @ts-expect-error Handle owns its value semantics.
  'aria-valuenow': 30
}
// @ts-expect-error Handle owns its keyboard entry.
export const tab: ResizableHandleProps = { value: 'files', 'aria-label': 'Files', tabIndex: 5 }
export const button: ResizableHandleProps = {
  value: 'files',
  'aria-label': 'Files',
  // @ts-expect-error The handle is a native hr.
  ref: createRef<HTMLButtonElement>()
}
