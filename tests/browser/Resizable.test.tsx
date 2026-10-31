import { act, createRef, StrictMode, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { expect, test } from 'vitest'
import { commands } from 'vitest/browser'
import {
  Resizable,
  ResizablePanel,
  ResizableHandle,
  useResizable,
  Separator,
  ThemeScope,
  defineTheme,
  type ResizableItem,
  type ResizableProps,
  type ResizableHandleProps
} from '../../src/index.js'
import { mount, click, key } from './familyHarness.js'
import {
  ReviewProjectFiles,
  EditInterviewNotes,
  RestoreWorkspaceLayout
} from '../../.storybook/examples/ResizableExamples.js'
const items: ResizableItem[] = [
  { value: 'files', min: 20, max: 50, collapsible: true },
  { value: 'preview', min: 40, max: 100 }
]
type SampleProps = Omit<Partial<ResizableProps>, 'value' | 'defaultValue' | 'children'> & {
  value?: number[]
  initial?: number[]
  handle?: Partial<ResizableHandleProps>
  start?: ReactNode
  end?: ReactNode
}
function Sample({ value, initial = [30, 70], handle, start, end, ...props }: SampleProps) {
  const owner = value === undefined ? { defaultValue: initial } : { value }
  return (
    <Resizable
      {...props}
      {...owner}
      items={props.items ?? items}
      style={{ width: '500px', height: '200px', ...props.style }}
    >
      <ResizablePanel value="files">
        {start ?? <button type="button">File action</button>}
      </ResizablePanel>
      <ResizableHandle
        {...handle}
        value="files"
        aria-label="Files"
        id={handle?.id ?? 'splitter'}
      />
      <ResizablePanel value="preview">
        {end ?? <button type="button">Preview action</button>}
      </ResizablePanel>
    </Resizable>
  )
}
const handle = (host: ParentNode) =>
  host.querySelector<HTMLHRElement>('[data-slot~="resizable-handle"]')!
const size = (node: HTMLElement) => Number(node.getAttribute('aria-valuenow'))
test('SSR hydration keeps real Separator/div refs, relationship IDs and independent theme/caller styles', async () => {
  const root = createRef<HTMLDivElement>(),
    panel = createRef<HTMLDivElement>(),
    separator = createRef<HTMLHRElement>(),
    calls: number[][] = []
  const { host } = await mount(
    <StrictMode>
      <ThemeScope
        theme={defineTheme({
          id: 'resize-test',
          name: 'Resize test',
          components: {
            resizable: {
              handleSize: '12px',
              handleColor: 'red',
              focusWidth: '3px',
              focusOffset: '-3px'
            }
          }
        })}
      >
        <Resizable
          items={items}
          defaultValue={[30, 70]}
          ref={root}
          onValueChange={value => calls.push(value)}
          style={{ width: '500px', height: '200px' }}
        >
          <ResizablePanel
            value="files"
            ref={panel}
          >
            <button type="button">File action</button>
          </ResizablePanel>
          <ResizableHandle
            value="files"
            aria-label="Files"
            ref={separator}
          />
          <ResizablePanel value="preview">
            <input aria-label="Preview" />
          </ResizablePanel>
        </Resizable>
        <Separator />
      </ThemeScope>
    </StrictMode>,
    true
  )
  const node = handle(host)
  expect(root.current?.dataset.slot).toBe('resizable')
  expect(panel.current?.dataset.slot).toBe('resizable-panel')
  expect(separator.current).toBe(node)
  expect(node.tagName).toBe('HR')
  expect(node.dataset.slot).toBe('separator resizable-handle')
  expect(node.getAttribute('aria-controls')).toBe(panel.current?.id)
  expect(node.getBoundingClientRect().width).toBe(12)
  expect(getComputedStyle(node).borderInlineStartColor).toBe('rgb(255, 0, 0)')
  await click(host.querySelector('button')!)
  await key('{Tab}')
  expect(document.activeElement).toBe(node)
  expect(getComputedStyle(node).outlineWidth).toBe('3px')
  expect(getComputedStyle(node).outlineOffset).toBe('-3px')
  expect(
    host.querySelector('hr:not([data-slot~="resizable-handle"])')!.hasAttribute('tabindex')
  ).toBe(false)
  expect(calls).toEqual([])
})

test('keyboard bounds, collapse history, physical RTL arrows and vertical orientation retain the one layout owner', async () => {
  const calls: number[][] = []
  const tree = (orientation: 'horizontal' | 'vertical', dir: 'ltr' | 'rtl') => (
    <Sample
      orientation={orientation}
      dir={dir}
      onValueChange={value => calls.push(value)}
    />
  )
  const { host, render } = await mount(tree('horizontal', 'ltr')),
    node = handle(host)
  await click(node)
  await key('{ArrowRight}{Shift>}{ArrowRight}{/Shift}')
  expect(size(node)).toBe(41)
  await key('{Home}')
  expect(size(node)).toBe(0)
  await key('{Enter}')
  expect(size(node)).toBe(41)
  await key('{End}')
  expect(size(node)).toBe(50)
  const count = calls.length
  await key('{ArrowRight}')
  expect(calls.length).toBe(count)
  await render(tree('horizontal', 'rtl'))
  expect(calls.length).toBe(count)
  await key('{ArrowRight}')
  expect(size(node)).toBe(49)
  await key('{ArrowLeft}')
  expect(size(node)).toBe(50)
  await render(tree('vertical', 'rtl'))
  expect(node.getAttribute('aria-orientation')).toBe('horizontal')
  await key('{ArrowUp}')
  expect(size(node)).toBe(49)
  await key('{ArrowDown}')
  expect(size(node)).toBe(50)
})

test('real mouse input captures only the handle, conserves percentages, releases cancellation and respects RTL', async () => {
  const calls: number[][] = []
  const { host, render } = await mount(<Sample onValueChange={value => calls.push(value)} />),
    node = handle(host)
  const room = Array.from(
    host.querySelectorAll<HTMLElement>('[data-slot~="resizable-panel"]')
  ).reduce((sum, panel) => sum + panel.getBoundingClientRect().width, 0)
  await act(async () => commands.dragHandle('#splitter', room * 0.1, false, false))
  expect(size(node)).toBeCloseTo(40, 0)
  expect(calls.at(-1)?.reduce((a, b) => a + b, 0)).toBe(100)
  expect(host.querySelector('[data-slot="resizable"]')!.hasAttribute('data-dragging')).toBe(false)
  await act(async () => commands.dragHandle('#splitter', -room * 0.05, true, false))
  const afterCancel = size(node)
  expect(afterCancel).toBeLessThan(40)
  expect(host.querySelector('[data-slot="resizable"]')!.hasAttribute('data-dragging')).toBe(false)
  await render(
    <Sample
      dir="rtl"
      onValueChange={value => calls.push(value)}
    />
  )
  await act(async () => commands.dragHandle('#splitter', -room * 0.05, false, false))
  expect(size(node)).toBeGreaterThan(afterCancel)
})

test('native touch moves vertical separators and cancellation cannot leave a gesture active', async () => {
  const { host } = await mount(<Sample orientation="vertical" />),
    node = handle(host)
  const room = Array.from(
    host.querySelectorAll<HTMLElement>('[data-slot~="resizable-panel"]')
  ).reduce((sum, panel) => sum + panel.getBoundingClientRect().height, 0)
  await act(async () => commands.dragHandle('#splitter', 0, false, true, room * 0.1))
  expect(size(node)).toBeCloseTo(40, 0)
  await act(async () => commands.dragHandle('#splitter', 0, true, true, -room * 0.05))
  expect(size(node)).toBeLessThan(40)
  expect(host.querySelector('[data-slot="resizable"]')!.hasAttribute('data-dragging')).toBe(false)
})

test('controlled refusals and prop synchronization never invent an accepted layout', async () => {
  const calls: number[][] = []
  const tree = (first: number) => (
    <Sample
      value={[first, 100 - first]}
      onValueChange={value => calls.push(value)}
    />
  )
  const { host, render } = await mount(tree(30)),
    node = handle(host)
  await click(node)
  await key('{ArrowRight}')
  expect(size(node)).toBe(30)
  expect(calls.at(-1)).toEqual([31, 69])
  const count = calls.length
  await render(tree(40))
  expect(size(node)).toBe(40)
  expect(calls.length).toBe(count)
  const width = host.querySelector('[data-slot="resizable-panel"]')!.getBoundingClientRect().width
  await act(async () => commands.dragHandle('#splitter', 30, false, false))
  expect(size(node)).toBe(40)
  expect(host.querySelector('[data-slot="resizable-panel"]')!.getBoundingClientRect().width).toBe(
    width
  )
})

function BatchedActions() {
  const state = useResizable()
  if (!state) throw new Error('No Resizable state')
  return (
    <button
      type="button"
      data-resize-steps=""
      onClick={() => {
        state.resizeBy('files', 1)
        state.resizeBy('files', 1)
      }}
    >
      Two steps
    </button>
  )
}
test('public pointer alternatives reuse bounded updates, batch uncontrolled requests and leave blocked collapse unchanged', async () => {
  const { host, render } = await mount(<Sample end={<BatchedActions />} />),
    node = handle(host)
  await click(host.querySelector('[data-resize-steps]')!)
  expect(size(node)).toBe(32)
  const constrained = [
    { value: 'files', min: 20, max: 80, collapsible: true },
    { value: 'preview', min: 20, max: 80 }
  ]
  await render(
    <Sample
      items={constrained}
      end={<BatchedActions />}
    />
  )
  expect(node.getAttribute('aria-valuemin')).toBe('20')
  await click(node)
  await key('{Enter}')
  expect(size(node)).toBe(32)
})

function CollapseInside() {
  const state = useResizable()
  if (!state) throw new Error('No Resizable state')
  return (
    <>
      <input
        aria-label="Draft"
        defaultValue="kept draft"
        style={{ width: '100%', boxSizing: 'border-box' }}
      />
      <button
        type="button"
        onClick={() => state.toggle('files')}
      >
        Hide files
      </button>
    </>
  )
}
test('collapsing a focused panel moves focus to its separator, preserves local controls and makes hidden content inert', async () => {
  const { host } = await mount(<Sample start={<CollapseInside />} />),
    node = handle(host),
    panel = host.querySelector<HTMLElement>('[data-slot="resizable-panel"]')!
  await click(host.querySelector('button')!)
  expect(size(node)).toBe(0)
  expect(panel.hidden).toBe(true)
  expect(panel.inert).toBe(true)
  expect(document.activeElement).toBe(node)
  await key('{Enter}')
  expect(size(node)).toBe(30)
  expect(panel.hidden).toBe(false)
  expect(host.querySelector<HTMLInputElement>('input')!.value).toBe('kept draft')
})

test('disabled and cancelled events block requests, and disabling an active drag releases its capture', async () => {
  const calls: number[][] = []
  const { host, render } = await mount(
      <Sample
        disabled
        onValueChange={value => calls.push(value)}
      />
    ),
    node = handle(host)
  expect(node.getAttribute('aria-disabled')).toBe('true')
  expect(node.tabIndex).toBe(-1)
  await act(async () => commands.dragHandle('#splitter', 50, false, false))
  expect(calls).toEqual([])
  await render(
    <Sample
      handle={{
        onKeyDown: event => event.preventDefault(),
        onPointerDown: event => event.preventDefault()
      }}
      onValueChange={value => calls.push(value)}
    />
  )
  await click(node)
  await key('{ArrowRight}')
  await act(async () => commands.dragHandle('#splitter', 30, false, false))
  expect(calls).toEqual([])
  function LockDuringDrag() {
    const [disabled, setDisabled] = useState(false)
    return (
      <Sample
        disabled={disabled}
        handle={{ onPointerDown: () => setTimeout(() => setDisabled(true), 30) }}
      />
    )
  }
  await render(<LockDuringDrag />)
  await act(async () => commands.dragHandle('#splitter', 20, false, false, 0, 100))
  expect(handle(host).getAttribute('aria-disabled')).toBe('true')
  expect(host.querySelector('[data-slot="resizable"]')!.hasAttribute('data-dragging')).toBe(false)
})

test('nested groups and iframe keyboard events use their own owners and documents', async () => {
  const innerItems = [
    { value: 'top', min: 20 },
    { value: 'bottom', min: 20 }
  ]
  const { host } = await mount(
    <Sample
      end={
        <Resizable
          items={innerItems}
          defaultValue={[40, 60]}
          orientation="vertical"
          style={{ height: '100%' }}
        >
          <ResizablePanel value="top">Top</ResizablePanel>
          <ResizableHandle
            value="top"
            aria-label="Top"
            id="nested-handle"
          />
          <ResizablePanel value="bottom">Bottom</ResizablePanel>
        </Resizable>
      }
    />
  )
  const inner = host.querySelector<HTMLHRElement>('#nested-handle')!
  await click(inner)
  await key('{ArrowDown}')
  expect(size(inner)).toBe(41)
  expect(size(handle(host))).toBe(30)
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  try {
    const doc = iframe.contentDocument!,
      view = doc.defaultView!
    await mount(
      createPortal(
        <Sample
          dir="rtl"
          handle={{ id: 'frame-handle' }}
        />,
        doc.body
      )
    )
    const target = handle(doc)
    await act(async () => {
      target.focus()
      target.dispatchEvent(new view.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    })
    expect(target.ownerDocument).toBe(doc)
    expect(size(target)).toBe(29)
  } finally {
    await act(async () => iframe.remove())
  }
})

test('narrow forced-colors and reduced-motion keep usable native handles and editable panel content', async () => {
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  const { host } = await mount(
      <Sample
        dir="rtl"
        style={{ width: '288px' }}
      />
    ),
    node = handle(host)
  expect(node.getBoundingClientRect().width).toBeGreaterThanOrEqual(8)
  expect(
    host.querySelector('[data-slot="resizable"]')!.getBoundingClientRect().width
  ).toBeLessThanOrEqual(288)
  expect(getComputedStyle(node).forcedColorAdjust).not.toBe('none')
  await click(node)
  await key('{ArrowLeft}')
  expect(size(node)).toBe(31)
})

for (const [name, Task] of [
  ['file workspace', ReviewProjectFiles],
  ['note workspace', EditInterviewNotes],
  ['saved workspace', RestoreWorkspaceLayout]
] as const) {
  test(
    'canonical ' + name + ' hydrates real nested families without invalid native markup',
    async () => {
      const { host } = await mount(<Task />, true)
      expect(host.querySelector('[data-slot~="resizable"]')).toBeTruthy()
      expect(host.querySelector('[data-slot~="resizable-handle"]')).toBeTruthy()
    }
  )
}

function TogglePointerLayout() {
  const group = useResizable()
  if (!group) throw new Error('Missing Resizable')
  const panel = group.getPanel('files')
  return (
    <button
      type="button"
      id="toggle-pointer-layout"
      disabled={!(panel.canCollapse || panel.canExpand)}
      onClick={() => group.toggle('files')}
    >
      Toggle pointer layout
    </button>
  )
}
test('fractional pointer layouts keep collapse and restore enabled at the exact feasible boundary', async () => {
  const initial = [35.73831775700935, 64.26168224299066]
  const { host } = await mount(
    <Sample
      initial={initial}
      end={<TogglePointerLayout />}
    />
  )
  const button = host.querySelector<HTMLButtonElement>('#toggle-pointer-layout')!
  expect(button.disabled).toBe(false)
  await click(button)
  expect(size(handle(host))).toBe(0)
  expect(host.querySelector<HTMLElement>('[data-slot="resizable-panel"]')!.hidden).toBe(true)
  await click(button)
  expect(size(handle(host))).toBe(initial[0])
  expect(button.disabled).toBe(false)
})
