import { act, useState } from 'react'
import { expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  defineTheme,
  DragAndDrop,
  DragAndDropContainer,
  DragAndDropItem,
  ThemeScope,
  type DragAndDropMove,
  type DragAndDropProps,
  type DragAndDropValue
} from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'
import { key, mount, pause } from './familyHarness.js'
import type {} from './touchCommands.js'

const text = {
  instructionsText:
    'Space picks up. Left and Right change list, Up and Down move, Space drops, Escape cancels.',
  pickUpText: (m: DragAndDropMove) => `Picked up ${m.item} in ${m.from}.`,
  moveText: (m: DragAndDropMove) => `${m.item}, ${m.to}, ${m.index + 1} of ${m.count}.`,
  dropText: (m: DragAndDropMove) =>
    `Moved ${m.item} from ${m.from} to ${m.to}, ${m.index + 1} of ${m.count}.`,
  cancelText: (m: DragAndDropMove) => `Cancelled. ${m.item} is back in ${m.to}.`,
  fullText: (m: DragAndDropMove) => `${m.to} holds one task.`
}
const tasks = [
  { value: 'write', label: 'Write docs' },
  { value: 'test', label: 'Run tests' },
  { value: 'ship', label: 'Ship release' }
]
const start: DragAndDropValue = { todo: ['write', 'test'], doing: ['ship'], done: [] }

function Board(props: Partial<DragAndDropProps> & { only?: string[] }) {
  const { only, ...rest } = props
  return (
    <DragAndDrop
      aria-label="Board"
      name="board"
      {...text}
      {...(rest.value === undefined && rest.defaultValue === undefined
        ? { defaultValue: start }
        : {})}
      {...(rest as object)}
    >
      <DragAndDropContainer
        value="todo"
        label="To do"
      />
      <DragAndDropContainer
        value="doing"
        label="Doing"
        capacity={1}
      />
      <DragAndDropContainer
        value="done"
        label="Done"
      />
      {tasks
        .filter(task => !only || only.includes(task.value))
        .map(task => (
          <DragAndDropItem
            key={task.value}
            value={task.value}
          >
            {task.label}
          </DragAndDropItem>
        ))}
    </DragAndDrop>
  )
}

const container = (host: HTMLElement, label: string) =>
  Array.from(host.querySelectorAll<HTMLElement>('[data-slot~="drag-and-drop-container"]')).find(
    node => node.querySelector('[data-slot="drag-and-drop-container-label"]')!.textContent === label
  )!
const contents = (host: HTMLElement) =>
  Object.fromEntries(
    Array.from(host.querySelectorAll('[data-slot~="drag-and-drop-container"]'), node => [
      node.querySelector('[data-slot="drag-and-drop-container-label"]')!.textContent,
      Array.from(
        node.querySelectorAll('[data-slot~="drag-and-drop-item-content"]'),
        item => item.textContent
      )
    ])
  )
const handle = (host: HTMLElement, label: string) =>
  Array.from(host.querySelectorAll<HTMLButtonElement>('[data-slot~="drag-and-drop-handle"]')).find(
    node =>
      node.ownerDocument.getElementById(node.getAttribute('aria-labelledby')!)?.textContent ===
      label
  )!
const status = (host: HTMLElement) =>
  host.querySelector('[data-slot="drag-and-drop-status"]')!.textContent
const settle = (check: () => void) =>
  act(async () => {
    await vi.waitFor(check, { timeout: 2_000 })
  })
const announced = (host: HTMLElement, message: string) =>
  settle(() => expect(status(host)).toBe(message))
const submitted = (form: HTMLFormElement) =>
  JSON.parse(String(new FormData(form).get('board'))) as DragAndDropValue
const center = (node: Element) => {
  const rect = node.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}
/** Drags a handle by mouse or touch onto the middle of a container's list. */
async function dragTo(
  host: HTMLElement,
  item: string,
  label: string,
  { touch = false, cancel = false } = {}
) {
  const from = handle(host, item)
  from.id = `handle-${item.replace(/\W/g, '')}`
  const list = container(host, label).querySelector('[data-slot="drag-and-drop-list"]')!
  const a = center(from),
    b = center(list)
  await act(async () => commands.dragHandle(`#${from.id}`, b.x - a.x, cancel, touch, b.y - a.y))
}

test('keyboard moves between containers, reorders, drops and announces each step', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <form>
      <Board onValueChange={change} />
    </form>
  )
  const form = host.querySelector('form')!
  expect(host.querySelector('[role="group"]')!.getAttribute('aria-label')).toBe('Board')
  expect(container(host, 'Done').getAttribute('role')).toBe('group')
  expect(submitted(form)).toEqual(start)
  const write = handle(host, 'Write docs')
  expect(
    host.ownerDocument.getElementById(write.getAttribute('aria-describedby')!)!.textContent
  ).toBe(text.instructionsText)
  await act(async () => write.focus())
  await key(' ')
  expect(write.getAttribute('aria-pressed')).toBe('true')
  await announced(host, 'Picked up Write docs in To do.')
  await key('{ArrowDown}')
  expect(contents(host)['To do']).toEqual(['Run tests', 'Write docs'])
  await announced(host, 'Write docs, To do, 2 of 2.')
  // The full container takes the draft but says why it refuses a drop.
  await key('{ArrowRight}')
  expect(contents(host).Doing).toEqual(['Ship release', 'Write docs'])
  expect(container(host, 'Doing').hasAttribute('data-full')).toBe(true)
  expect(
    container(host, 'Doing').querySelector('[data-slot="drag-and-drop-full"]')!.textContent
  ).toBe('Doing holds one task.')
  await announced(host, 'Doing holds one task.')
  await key('{ArrowRight}')
  expect(container(host, 'Doing').hasAttribute('data-full')).toBe(false)
  expect(container(host, 'Done').hasAttribute('data-target')).toBe(true)
  await announced(host, 'Write docs, Done, 1 of 1.')
  // There is no container past the last one.
  await key('{ArrowRight}')
  expect(contents(host).Done).toEqual(['Write docs'])
  expect(change).not.toHaveBeenCalled()
  await key('{Enter}')
  expect(change).toHaveBeenCalledExactlyOnceWith({
    todo: ['test'],
    doing: ['ship'],
    done: ['write']
  })
  await announced(host, 'Moved Write docs from To do to Done, 1 of 1.')
  expect(host.ownerDocument.activeElement).toBe(handle(host, 'Write docs'))
  expect(handle(host, 'Write docs').getAttribute('aria-pressed')).toBe('false')
  expect(submitted(form)).toEqual({ todo: ['test'], doing: ['ship'], done: ['write'] })

  // Reordering inside one container.
  await act(async () => handle(host, 'Run tests').focus())
  await key(' {End}{Home} ')
  expect(change).toHaveBeenCalledTimes(1)
  await act(async () => form.reset())
  await pause(10)
  expect(contents(host)).toEqual({
    'To do': ['Write docs', 'Run tests'],
    Doing: ['Ship release'],
    Done: []
  })
  expect(submitted(form)).toEqual(start)
})

test('a full container refuses a keyboard drop, keeps the item held and Escape cancels', async () => {
  const change = vi.fn()
  const { host } = await mount(<Board onValueChange={change} />)
  await act(async () => handle(host, 'Run tests').focus())
  await key(' {ArrowRight}{Enter}')
  expect(change).not.toHaveBeenCalled()
  expect(handle(host, 'Run tests').getAttribute('aria-pressed')).toBe('true')
  await announced(host, 'Doing holds one task.')
  await key('{Escape}')
  expect(contents(host)['To do']).toEqual(['Write docs', 'Run tests'])
  expect(host.ownerDocument.activeElement).toBe(handle(host, 'Run tests'))
  await announced(host, 'Cancelled. Run tests is back in To do.')
})

test('Left and Right follow the reading direction in right-to-left text', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <div dir="rtl">
      <Board
        onValueChange={change}
        defaultValue={{ todo: ['write', 'test'], doing: [], done: ['ship'] }}
      />
    </div>
  )
  await act(async () => handle(host, 'Ship release').focus())
  await key(' {ArrowRight}')
  await announced(host, 'Ship release, Doing, 1 of 1.')
  await key('{ArrowLeft}{ArrowLeft}{ArrowRight} ')
  expect(change).toHaveBeenCalledExactlyOnceWith({
    todo: ['write', 'test'],
    doing: ['ship'],
    done: []
  })
})

test('a controlled value follows the app and a declined drop reads as cancelled', async () => {
  const requests: DragAndDropValue[] = []
  function Controlled({ accept }: { accept: boolean }) {
    const [value, setValue] = useState(start)
    return (
      <Board
        value={value}
        onValueChange={next => {
          requests.push(next)
          if (accept) setValue(next)
        }}
      />
    )
  }
  const declined = await mount(<Controlled accept={false} />)
  await act(async () => handle(declined.host, 'Run tests').focus())
  await key(' {ArrowRight}{ArrowRight} ')
  expect(requests).toEqual([{ todo: ['write'], doing: ['ship'], done: ['test'] }])
  expect(contents(declined.host).Done).toEqual([])
  expect(declined.host.ownerDocument.activeElement).toBe(handle(declined.host, 'Run tests'))
  await announced(declined.host, 'Cancelled. Run tests is back in To do.')

  const accepted = await mount(<Controlled accept />)
  await act(async () => handle(accepted.host, 'Run tests').focus())
  await key(' {ArrowRight}{ArrowRight} ')
  expect(contents(accepted.host).Done).toEqual(['Run tests'])
  await announced(accepted.host, 'Moved Run tests from To do to Done, 1 of 1.')
})

test('pointer and touch drags move between containers, and a full one refuses', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <MotionProvider>
      <div style={{ width: '720px' }}>
        <Board onValueChange={change} />
      </div>
    </MotionProvider>
  )
  await dragTo(host, 'Write docs', 'Done')
  await expect.poll(() => change.mock.calls.length).toBe(1)
  expect(change).toHaveBeenLastCalledWith({ todo: ['test'], doing: ['ship'], done: ['write'] })
  await announced(host, 'Moved Write docs from To do to Done, 1 of 1.')
  // The handle mounted again in its new container keeps focus.
  expect(host.ownerDocument.activeElement).toBe(handle(host, 'Write docs'))
  await settle(() => expect(host.querySelector('[data-dragging]')).toBeNull())
  expect(host.querySelector('[data-drop],[data-target]')).toBeNull()

  await dragTo(host, 'Run tests', 'Done', { touch: true })
  await expect.poll(() => change.mock.calls.length).toBe(2)
  expect(change).toHaveBeenLastCalledWith({ todo: [], doing: ['ship'], done: ['write', 'test'] })

  await dragTo(host, 'Write docs', 'Doing')
  await announced(host, 'Doing holds one task.')
  expect(change).toHaveBeenCalledTimes(2)
  expect(contents(host).Doing).toEqual(['Ship release'])

  await dragTo(host, 'Ship release', 'To do', { cancel: true })
  await announced(host, 'Cancelled. Ship release is back in Doing.')
  expect(change).toHaveBeenCalledTimes(2)
  await settle(() => expect(host.querySelector('[data-dragging]')).toBeNull())
  // Every slot rejoins the layout springs once the glide ends.
  expect(host.querySelectorAll('li[data-rad-layout-slot]')).toHaveLength(3)
})

test('a drop under a short container lands in it', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <div style={{ width: '720px' }}>
      <Board
        onValueChange={change}
        defaultValue={{ todo: ['write', 'test', 'ship'], doing: [], done: [] }}
      />
    </div>
  )
  const ship = handle(host, 'Ship release')
  ship.id = 'ship-short'
  const a = center(ship),
    b = center(container(host, 'Doing'))
  await act(async () => commands.dragHandle('#ship-short', b.x - a.x, false, false, 0))
  await expect.poll(() => change.mock.calls.length).toBe(1)
  expect(change).toHaveBeenLastCalledWith({ todo: ['write', 'test'], doing: ['ship'], done: [] })
})

test('a move keeps containers and items the board does not render yet', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <Board
      onValueChange={change}
      defaultValue={{ todo: ['write', 'test', 'later'], doing: ['ship'], done: [], old: ['x'] }}
      only={['write', 'test', 'ship']}
    />
  )
  await act(async () => handle(host, 'Write docs').focus())
  await key(' {ArrowRight}{ArrowRight} ')
  expect(change).toHaveBeenCalledExactlyOnceWith({
    todo: ['test', 'later'],
    doing: ['ship'],
    done: ['write'],
    old: ['x']
  })
})

test('capacity refuses new items but allows reordering a container already over it', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <Board
      onValueChange={change}
      defaultValue={{ todo: ['test'], doing: ['ship', 'write'], done: [] }}
    />
  )
  await act(async () => handle(host, 'Ship release').focus())
  await key(' {ArrowDown} ')
  expect(change).toHaveBeenCalledExactlyOnceWith({
    todo: ['test'],
    doing: ['write', 'ship'],
    done: []
  })
  await act(async () => handle(host, 'Run tests').focus())
  await key(' {ArrowRight}')
  await announced(host, 'Doing holds one task.')
  await key(' ')
  expect(change).toHaveBeenCalledTimes(1)
  await key('{Escape}')
})

test('browse-mode clicks pick up and place before another item', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <Board
      onValueChange={change}
      defaultValue={{ todo: ['write', 'test'], doing: [], done: ['ship'] }}
    />
  )
  const activate = (node: HTMLElement) =>
    act(async () => {
      node.focus()
      node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 0 }))
    })
  await activate(handle(host, 'Write docs'))
  expect(handle(host, 'Write docs').getAttribute('aria-pressed')).toBe('true')
  // Focus moves to the other handle without dropping the held item.
  await activate(handle(host, 'Ship release'))
  expect(change).toHaveBeenCalledExactlyOnceWith({
    todo: ['test'],
    doing: [],
    done: ['write', 'ship']
  })
  await announced(host, 'Moved Write docs from To do to Done, 1 of 2.')
})

test('disabling the board mid-move ends the move', async () => {
  const change = vi.fn()
  const { host, render } = await mount(<Board onValueChange={change} />)
  await act(async () => handle(host, 'Write docs').focus())
  await key(' {ArrowRight}{ArrowRight}')
  await render(
    <Board
      onValueChange={change}
      disabled
    />
  )
  expect(host.querySelector('[aria-pressed="true"]')).toBeNull()
  expect(contents(host)['To do']).toEqual(['Write docs', 'Run tests'])
  expect(change).not.toHaveBeenCalled()
})

test('a pointer drag reorders within a container at the drop marker', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <div style={{ width: '360px' }}>
      <Board onValueChange={change} />
    </div>
  )
  const write = handle(host, 'Write docs')
  write.id = 'write-handle'
  const below = handle(host, 'Run tests').closest('li')!.getBoundingClientRect()
  const a = center(write)
  await act(async () =>
    commands.dragHandle('#write-handle', 0, false, false, below.bottom - 4 - a.y)
  )
  await expect.poll(() => change.mock.calls.length).toBe(1)
  expect(change).toHaveBeenLastCalledWith({ todo: ['test', 'write'], doing: ['ship'], done: [] })
})

test('tapping an item and then a container places it there', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <div style={{ width: '720px' }}>
      <Board onValueChange={change} />
    </div>
  )
  await act(async () => userEvent.click(handle(host, 'Run tests')))
  expect(handle(host, 'Run tests').getAttribute('aria-pressed')).toBe('true')
  expect(container(host, 'Done').hasAttribute('data-droppable')).toBe(true)
  await announced(host, 'Picked up Run tests in To do.')
  // A full container says why and keeps the item held.
  await act(async () =>
    userEvent.click(container(host, 'Doing').querySelector('[data-slot="drag-and-drop-list"]')!)
  )
  await announced(host, 'Doing holds one task.')
  expect(handle(host, 'Run tests').getAttribute('aria-pressed')).toBe('true')
  await act(async () =>
    userEvent.click(
      container(host, 'Done').querySelector('[data-slot="drag-and-drop-container-label"]')!
    )
  )
  expect(change).toHaveBeenCalledExactlyOnceWith({
    todo: ['write'],
    doing: ['ship'],
    done: ['test']
  })
  await announced(host, 'Moved Run tests from To do to Done, 1 of 1.')
  expect(host.ownerDocument.activeElement).toBe(handle(host, 'Run tests'))
  // Tapping another item's handle places the held item before it.
  await act(async () => userEvent.click(handle(host, 'Ship release')))
  await act(async () => userEvent.click(handle(host, 'Run tests')))
  expect(change).toHaveBeenLastCalledWith({ todo: ['write'], doing: [], done: ['ship', 'test'] })
  // Tapping an item's content places the held item before it; its own content does nothing.
  await act(async () => userEvent.click(handle(host, 'Write docs')))
  const content = (label: string) =>
    Array.from(
      host.querySelectorAll<HTMLElement>('[data-slot~="drag-and-drop-item-content"]')
    ).find(node => node.textContent === label)!
  await act(async () => userEvent.click(content('Write docs')))
  expect(handle(host, 'Write docs').getAttribute('aria-pressed')).toBe('true')
  await act(async () => userEvent.click(content('Ship release')))
  expect(change).toHaveBeenLastCalledWith({ todo: [], doing: [], done: ['write', 'ship', 'test'] })
  // Tapping the held item again puts it down where it is.
  await act(async () => userEvent.click(handle(host, 'Run tests')))
  await act(async () => userEvent.click(handle(host, 'Run tests')))
  expect(handle(host, 'Run tests').getAttribute('aria-pressed')).toBe('false')
  expect(change).toHaveBeenCalledTimes(3)
})

test('touch taps pick up and place', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <div style={{ width: '720px' }}>
      <Board onValueChange={change} />
    </div>
  )
  handle(host, 'Write docs').id = 'tap-write'
  container(host, 'Done').querySelector('[data-slot="drag-and-drop-list"]')!.id = 'tap-done'
  await act(async () => {
    await commands.touchButton('#tap-write', false)
  })
  await settle(() => expect(handle(host, 'Write docs').getAttribute('aria-pressed')).toBe('true'))
  await act(async () => {
    await commands.touchButton('#tap-done', false)
  })
  await settle(() =>
    expect(change).toHaveBeenCalledExactlyOnceWith({
      todo: ['test'],
      doing: ['ship'],
      done: ['write']
    })
  )
})

const fire = (target: EventTarget, type: string, x: number, y: number) =>
  act(async () => {
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 7,
        isPrimary: true,
        button: 0,
        clientX: x,
        clientY: y
      })
    )
  })

test('a drag over a full container shows why it refuses', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <div style={{ width: '720px' }}>
      <Board onValueChange={change} />
    </div>
  )
  const write = handle(host, 'Write docs')
  const a = center(write),
    b = center(container(host, 'Doing'))
  await fire(write, 'pointerdown', a.x, a.y)
  await fire(document, 'pointermove', b.x, b.y)
  await act(() => pause(50))
  expect(container(host, 'Doing').hasAttribute('data-full')).toBe(true)
  expect(
    container(host, 'Doing').querySelector('[data-slot="drag-and-drop-full"]')!.textContent
  ).toBe('Doing holds one task.')
  await fire(document, 'pointerup', b.x, b.y)
  expect(container(host, 'Doing').hasAttribute('data-full')).toBe(false)
  expect(change).not.toHaveBeenCalled()
  await announced(host, 'Doing holds one task.')
})

test('pointercancel returns the item and a removed item ends its drag', async () => {
  const change = vi.fn()
  const { host, render } = await mount(<Board onValueChange={change} />)
  const write = handle(host, 'Write docs')
  const a = center(write),
    b = center(container(host, 'Done'))
  await fire(write, 'pointerdown', a.x, a.y)
  await fire(document, 'pointermove', b.x, b.y)
  await act(() => pause(50))
  expect(container(host, 'Done').hasAttribute('data-target')).toBe(true)
  await fire(write, 'pointercancel', b.x, b.y)
  await announced(host, 'Cancelled. Write docs is back in To do.')
  await fire(write, 'pointerdown', a.x, a.y)
  await fire(document, 'pointermove', b.x, b.y)
  await render(
    <Board
      onValueChange={change}
      only={['test', 'ship']}
    />
  )
  await fire(document, 'pointerup', b.x, b.y)
  expect(change).not.toHaveBeenCalled()
  expect(contents(host)).toEqual({ 'To do': ['Run tests'], Doing: ['Ship release'], Done: [] })
})

test('items that stream in join their container, or the first one', async () => {
  const value = { todo: ['test'], done: ['ship'] }
  const { host, render } = await mount(
    <form>
      <Board
        defaultValue={value}
        only={['test']}
      />
    </form>
  )
  expect(contents(host)).toEqual({ 'To do': ['Run tests'], Doing: [], Done: [] })
  await render(
    <form>
      <Board
        defaultValue={value}
        only={['test', 'ship', 'write']}
      />
    </form>
  )
  expect(contents(host)).toEqual({
    'To do': ['Run tests', 'Write docs'],
    Doing: [],
    Done: ['Ship release']
  })
  expect(submitted(host.querySelector('form')!)).toEqual({
    todo: ['test', 'write'],
    doing: [],
    done: ['ship']
  })
})

test('repeated and unknown values render each item once', async () => {
  const { host } = await mount(
    <Board defaultValue={{ todo: ['ship', 'gone'], doing: ['ship', 'write'], other: ['test'] }} />
  )
  expect(contents(host)).toEqual({
    'To do': ['Ship release', 'Run tests'],
    Doing: ['Write docs'],
    Done: []
  })
})

test('disabled boards keep their items and submit nothing', async () => {
  const { host } = await mount(
    <form>
      <Board disabled />
    </form>
  )
  expect(handle(host, 'Write docs').disabled).toBe(true)
  expect(new FormData(host.querySelector('form')!).get('board')).toBeNull()
})

test('reduced motion and theme motion off snap moves under MotionProvider', async () => {
  const { host } = await mount(
    <MotionProvider>
      <Board />
    </MotionProvider>
  )
  await act(async () => handle(host, 'Write docs').focus())
  await key(' {ArrowDown}')
  const part = handle(host, 'Write docs').closest<HTMLElement>('[data-rad-layout-part]')!
  await expect.poll(() => part.style.translate).not.toBe('')
  // A move into another container glides from the old place.
  await key('{ArrowRight}{ArrowRight}')
  const moved = handle(host, 'Write docs').closest<HTMLElement>(
    '[data-slot~="drag-and-drop-item"]'
  )!
  expect(moved.style.transition).not.toBe('')
  await key('{Escape}')

  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  const reduced = await mount(
    <MotionProvider>
      <Board />
    </MotionProvider>
  )
  await act(async () => handle(reduced.host, 'Write docs').focus())
  await key(' {ArrowRight}{ArrowRight}')
  expect(
    handle(reduced.host, 'Write docs').closest<HTMLElement>('[data-slot~="drag-and-drop-item"]')!
      .style.translate
  ).toBe('')
  await key('{ArrowLeft}{ArrowLeft}{ArrowDown}')
  await pause(32)
  expect(
    handle(reduced.host, 'Write docs').closest<HTMLElement>('[data-rad-layout-part]')!.style
      .translate
  ).toBe('')
  await key('{Escape}')
  await commands.emulatePreferences({ reducedMotion: 'no-preference' })

  const theme = defineTheme({ id: 'board-off', name: 'Board off', motion: { mode: 'off' } })
  const off = await mount(
    <ThemeScope theme={theme}>
      <MotionProvider>
        <Board />
      </MotionProvider>
    </ThemeScope>
  )
  await act(async () => handle(off.host, 'Write docs').focus())
  await key(' {ArrowDown}')
  await pause(32)
  expect(
    handle(off.host, 'Write docs').closest<HTMLElement>('[data-rad-layout-part]')!.style.translate
  ).toBe('')
  await key('{Escape}')
})

test('requires names, text, capacity text and known children', async () => {
  const silence = vi.spyOn(console, 'error').mockImplementation(() => {})
  const one = (
    <DragAndDropContainer
      value="a"
      label="A"
    />
  )
  try {
    await expect(
      mount(
        <DragAndDrop
          {...text}
          aria-label=""
        >
          {one}
        </DragAndDrop>
      )
    ).rejects.toThrow(/aria-label or aria-labelledby/)
    await expect(
      mount(
        <DragAndDrop
          {...text}
          aria-label="Board"
          instructionsText=" "
        >
          {one}
        </DragAndDrop>
      )
    ).rejects.toThrow(/instructionsText/)
    await expect(
      mount(
        <DragAndDrop
          {...text}
          aria-label="Board"
          fullText={undefined}
        >
          <DragAndDropContainer
            value="a"
            label="A"
            capacity={2}
          />
        </DragAndDrop>
      )
    ).rejects.toThrow(/fullText/)
    await expect(
      mount(
        <DragAndDrop
          {...text}
          aria-label="Board"
        >
          <DragAndDropContainer
            value="a"
            label="A"
            capacity={1.5}
          />
        </DragAndDrop>
      )
    ).rejects.toThrow(/capacity/)
    await expect(
      mount(
        <DragAndDrop
          {...text}
          aria-label="Board"
        >
          <li>Loose</li>
        </DragAndDrop>
      )
    ).rejects.toThrow(/DragAndDropContainer and DragAndDropItem/)
    await expect(
      mount(
        <DragAndDrop
          {...text}
          aria-label="Board"
        >
          <DragAndDropItem value="x">X</DragAndDropItem>
        </DragAndDrop>
      )
    ).rejects.toThrow(/at least one/)
    await expect(
      mount(
        <DragAndDrop
          {...text}
          aria-label="Board"
        >
          {one}
          <DragAndDropItem value="x">X</DragAndDropItem>
          <DragAndDropItem value="x">Y</DragAndDropItem>
        </DragAndDrop>
      )
    ).rejects.toThrow(/unique/)
  } finally {
    silence.mockRestore()
  }
})

test('server markup hydrates without mismatches', async () => {
  const { host } = await mount(<Board defaultValue={{ done: ['ship'] }} />, true)
  expect(contents(host)).toEqual({
    'To do': ['Write docs', 'Run tests'],
    Doing: [],
    Done: ['Ship release']
  })
})
