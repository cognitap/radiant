import { act, useState } from 'react'
import { expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { SortableList, SortableListItem, type SortableListProps } from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'
import { key, mount, pause } from './familyHarness.js'
import type {} from './touchCommands.js'

const text = {
  instructionsText: 'Press Space to pick up. Use arrows to move, Space to drop, Escape to cancel.',
  pickUpText: (item: string, index: number, count: number) =>
    `Picked up ${item}, position ${index + 1} of ${count}.`,
  moveText: (item: string, index: number, count: number) =>
    `${item} moved to position ${index + 1} of ${count}.`,
  dropText: (item: string, index: number, count: number) =>
    `${item} dropped at position ${index + 1} of ${count}.`,
  cancelText: (item: string, index: number, count: number) =>
    `Move cancelled. ${item} is back at position ${index + 1} of ${count}.`
}
const items = [
  { value: 'rice', label: 'Rice' },
  { value: 'beans', label: 'Beans' },
  { value: 'corn', label: 'Corn' },
  { value: 'squash', label: 'Squash' }
]

function List(props: Partial<SortableListProps> & { only?: string[] }) {
  const { only, ...rest } = props
  return (
    <SortableList
      aria-label="Crops"
      name="crops"
      {...text}
      {...(rest as object)}
    >
      {items
        .filter(item => !only || only.includes(item.value))
        .map(item => (
          <SortableListItem
            key={item.value}
            value={item.value}
          >
            {item.label}
          </SortableListItem>
        ))}
    </SortableList>
  )
}

const order = (host: HTMLElement) =>
  Array.from(host.querySelectorAll('[data-slot~="sortable-list-item-content"]')).map(
    node => node.textContent
  )
const handle = (host: HTMLElement, label: string) =>
  Array.from(host.querySelectorAll<HTMLButtonElement>('[data-slot~="sortable-list-handle"]')).find(
    node =>
      node.ownerDocument.getElementById(node.getAttribute('aria-labelledby')!)?.textContent ===
      label
  )!
const status = (host: HTMLElement) =>
  host.querySelector('[data-slot="sortable-list-status"]')!.textContent
const settle = (check: () => void) =>
  act(async () => {
    await vi.waitFor(check, { timeout: 2_000 })
  })
const announced = (host: HTMLElement, message: string) =>
  settle(() => expect(status(host)).toBe(message))

test('keyboard picks up, moves, drops and announces each step', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <form>
      <List onValueChange={change} />
    </form>
  )
  const beans = handle(host, 'Beans')
  expect(beans.getAttribute('aria-describedby')).toBeTruthy()
  expect(
    host.ownerDocument.getElementById(beans.getAttribute('aria-describedby')!)!.textContent
  ).toBe(text.instructionsText)
  expect(host.querySelector('ol')!.getAttribute('aria-label')).toBe('Crops')
  await act(async () => beans.focus())
  await key(' ')
  expect(beans.getAttribute('aria-pressed')).toBe('true')
  await announced(host, 'Picked up Beans, position 2 of 4.')
  await key('{ArrowDown}')
  expect(order(host)).toEqual(['Rice', 'Corn', 'Beans', 'Squash'])
  expect(host.ownerDocument.activeElement).toBe(beans)
  await announced(host, 'Beans moved to position 3 of 4.')
  await key('{End}')
  expect(order(host)).toEqual(['Rice', 'Corn', 'Squash', 'Beans'])
  await announced(host, 'Beans moved to position 4 of 4.')
  await key('{ArrowUp}')
  await key('{Home}')
  expect(order(host)).toEqual(['Beans', 'Rice', 'Corn', 'Squash'])
  expect(change).not.toHaveBeenCalled()
  await key('{Enter}')
  expect(beans.getAttribute('aria-pressed')).toBe('false')
  expect(change).toHaveBeenCalledExactlyOnceWith(['beans', 'rice', 'corn', 'squash'])
  await announced(host, 'Beans dropped at position 1 of 4.')
  expect(host.ownerDocument.activeElement).toBe(beans)
  const form = host.querySelector('form')!
  expect(new FormData(form).getAll('crops')).toEqual(['beans', 'rice', 'corn', 'squash'])
  // Arrows do nothing until an item is picked up.
  await key('{ArrowDown}')
  expect(order(host)).toEqual(['Beans', 'Rice', 'Corn', 'Squash'])
  await act(async () => form.reset())
  await pause(10)
  expect(order(host)).toEqual(['Rice', 'Beans', 'Corn', 'Squash'])
  expect(new FormData(form).getAll('crops')).toEqual(['rice', 'beans', 'corn', 'squash'])
})

test('Escape cancels and restores the original order', async () => {
  const change = vi.fn()
  const { host } = await mount(<List onValueChange={change} />)
  const rice = handle(host, 'Rice')
  await act(async () => rice.focus())
  await key('{Enter}')
  await key('{ArrowDown}{ArrowDown}')
  expect(order(host)).toEqual(['Beans', 'Corn', 'Rice', 'Squash'])
  await key('{Escape}')
  expect(order(host)).toEqual(['Rice', 'Beans', 'Corn', 'Squash'])
  expect(rice.getAttribute('aria-pressed')).toBe('false')
  expect(host.ownerDocument.activeElement).toBe(rice)
  await announced(host, 'Move cancelled. Rice is back at position 1 of 4.')
  expect(change).not.toHaveBeenCalled()
})

test('leaving the handle drops the item where it is', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <>
      <List onValueChange={change} />
      <button type="button">After</button>
    </>
  )
  await act(async () => handle(host, 'Corn').focus())
  await key(' ')
  await key('{ArrowUp}')
  await act(async () =>
    userEvent.click(host.querySelector<HTMLButtonElement>('button:not([data-slot])')!)
  )
  await settle(() => expect(handle(host, 'Corn').getAttribute('aria-pressed')).toBe('false'))
  expect(change).toHaveBeenCalledExactlyOnceWith(['rice', 'corn', 'beans', 'squash'])
})

test('controlled order follows the app and a declined drop moves nothing', async () => {
  const requests: string[][] = []
  function Controlled({ accept }: { accept: boolean }) {
    const [value, setValue] = useState(['squash', 'corn', 'beans', 'rice'])
    return (
      <List
        value={value}
        onValueChange={next => {
          requests.push(next)
          if (accept) setValue(next)
        }}
      />
    )
  }
  const declined = await mount(<Controlled accept={false} />)
  expect(order(declined.host)).toEqual(['Squash', 'Corn', 'Beans', 'Rice'])
  await act(async () => handle(declined.host, 'Rice').focus())
  await key(' {Home} ')
  expect(requests).toEqual([['rice', 'squash', 'corn', 'beans']])
  expect(order(declined.host)).toEqual(['Squash', 'Corn', 'Beans', 'Rice'])
  expect(declined.host.ownerDocument.activeElement).toBe(handle(declined.host, 'Rice'))
  await announced(declined.host, 'Move cancelled. Rice is back at position 4 of 4.')

  const accepted = await mount(<Controlled accept />)
  await act(async () => handle(accepted.host, 'Rice').focus())
  await key(' {ArrowUp} ')
  expect(order(accepted.host)).toEqual(['Squash', 'Corn', 'Rice', 'Beans'])
})

test('items that stream in join the end of the order', async () => {
  const { host, render } = await mount(
    <List
      defaultValue={['corn', 'rice']}
      only={['rice', 'corn']}
    />
  )
  expect(order(host)).toEqual(['Corn', 'Rice'])
  await render(
    <List
      defaultValue={['corn', 'rice']}
      only={['rice', 'beans', 'corn']}
    />
  )
  expect(order(host)).toEqual(['Corn', 'Rice', 'Beans'])
  await render(
    <List
      defaultValue={['corn', 'rice']}
      only={['rice', 'beans', 'corn', 'squash']}
    />
  )
  expect(order(host)).toEqual(['Corn', 'Rice', 'Beans', 'Squash'])
  expect(
    Array.from(host.querySelectorAll<HTMLInputElement>('input[type=hidden]'), n => n.value)
  ).toEqual(['corn', 'rice', 'beans', 'squash'])
})

test('pointer and touch drags drop at the pointer and cancel restores', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <MotionProvider>
      <div style={{ width: '360px' }}>
        <List onValueChange={change} />
      </div>
    </MotionProvider>
  )
  const [first, second] = Array.from(host.querySelectorAll('li'), node =>
    node.getBoundingClientRect()
  )
  const height = second!.top - first!.top
  handle(host, 'Rice').id = 'rice-handle'
  await act(async () => commands.dragHandle('#rice-handle', 0, false, false, height * 2.3))
  await expect.poll(() => change.mock.calls.length).toBe(1)
  expect(change).toHaveBeenLastCalledWith(['beans', 'corn', 'rice', 'squash'])
  await announced(host, 'Rice dropped at position 3 of 4.')
  await settle(() => expect(host.querySelector('[data-dragging]')).toBeNull())
  expect(host.querySelector('ol')!.hasAttribute('data-drop')).toBe(false)

  handle(host, 'Squash').id = 'squash-handle'
  await act(async () => commands.dragHandle('#squash-handle', 0, false, true, -height * 3.3))
  await expect.poll(() => change.mock.calls.length).toBe(2)
  expect(change).toHaveBeenLastCalledWith(['squash', 'beans', 'corn', 'rice'])

  handle(host, 'Corn').id = 'corn-handle'
  await act(async () => commands.dragHandle('#corn-handle', 0, true, false, -height * 2))
  await announced(host, 'Move cancelled. Corn is back at position 3 of 4.')
  expect(change).toHaveBeenCalledTimes(2)
  expect(order(host)).toEqual(['Squash', 'Beans', 'Corn', 'Rice'])
  await settle(() => expect(host.querySelector('[data-dragging]')).toBeNull())
  // Every slot rejoins the layout springs once the glide ends.
  expect(host.querySelectorAll('li[data-rad-layout-slot]')).toHaveLength(4)
})

test('a short press does not move or announce anything', async () => {
  const change = vi.fn()
  const { host } = await mount(<List onValueChange={change} />)
  await act(async () => userEvent.click(handle(host, 'Beans')))
  await pause(600)
  expect(change).not.toHaveBeenCalled()
  expect(status(host)).toBe('')
  expect(handle(host, 'Beans').getAttribute('aria-pressed')).toBe('false')
})

test('disabled lists keep their order and submit nothing', async () => {
  const { host } = await mount(
    <form>
      <List disabled />
    </form>
  )
  expect(handle(host, 'Rice').disabled).toBe(true)
  expect(new FormData(host.querySelector('form')!).getAll('crops')).toEqual([])
})

test('keyboard moves spring under MotionProvider and settle in place', async () => {
  const { host } = await mount(
    <MotionProvider>
      <List />
    </MotionProvider>
  )
  await act(async () => handle(host, 'Rice').focus())
  await key(' {ArrowDown}')
  const part = handle(host, 'Rice').closest<HTMLElement>('[data-rad-layout-part]')!
  await expect.poll(() => part.style.translate).not.toBe('')
  await expect.poll(() => part.style.translate, { timeout: 4_000 }).toBe('')
  await key('{Escape}')
})

test('reduced motion snaps keyboard moves under MotionProvider', async () => {
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  const { host } = await mount(
    <MotionProvider>
      <List />
    </MotionProvider>
  )
  await act(async () => handle(host, 'Rice').focus())
  await key(' {ArrowDown}')
  const part = handle(host, 'Rice').closest<HTMLElement>('[data-rad-layout-part]')!
  await pause(32)
  expect(part.style.translate).toBe('')
  await key('{Escape}')
})

test('requires names, announcement text and SortableListItem children', async () => {
  const silence = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    await expect(
      mount(
        <SortableList
          {...text}
          aria-label=""
        />
      )
    ).rejects.toThrow(/aria-label or aria-labelledby/)
    await expect(
      mount(
        <SortableList
          {...text}
          aria-label="Crops"
          instructionsText=" "
        />
      )
    ).rejects.toThrow(/instructionsText/)
    await expect(
      mount(
        <SortableList
          {...text}
          aria-label="Crops"
        >
          <li>Loose</li>
        </SortableList>
      )
    ).rejects.toThrow(/SortableListItem/)
    await expect(
      mount(
        <SortableList
          {...text}
          aria-label="Crops"
        >
          <SortableListItem value="a">A</SortableListItem>
          <SortableListItem value="a">B</SortableListItem>
        </SortableList>
      )
    ).rejects.toThrow(/unique/)
  } finally {
    silence.mockRestore()
  }
})

test('server markup hydrates without mismatches', async () => {
  const { host } = await mount(<List defaultValue={['corn']} />, true)
  expect(order(host)).toEqual(['Corn', 'Rice', 'Beans', 'Squash'])
})

const fire = (target: EventTarget, type: string, y: number) =>
  act(async () => {
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 7,
        isPrimary: true,
        button: 0,
        clientX: 20,
        clientY: y
      })
    )
  })
const middle = (node: Element) => {
  const rect = node.getBoundingClientRect()
  return rect.top + rect.height / 2
}
const values = (host: HTMLElement) =>
  Array.from(host.querySelectorAll<HTMLInputElement>('input[type=hidden]'), node => node.value)

test('repeated values in the order render each item once', async () => {
  const { host } = await mount(
    <form>
      <List defaultValue={['corn', 'corn', 'gone', 'rice', 'corn']} />
    </form>
  )
  expect(order(host)).toEqual(['Corn', 'Rice', 'Beans', 'Squash'])
  expect(new FormData(host.querySelector('form')!).getAll('crops')).toEqual([
    'corn',
    'rice',
    'beans',
    'squash'
  ])
})

test('removing the picked-up item ends the pick', async () => {
  const change = vi.fn()
  const { host, render } = await mount(<List onValueChange={change} />)
  await act(async () => handle(host, 'Beans').focus())
  await key(' {ArrowDown}')
  await render(
    <List
      onValueChange={change}
      only={['rice', 'corn', 'squash']}
    />
  )
  expect(order(host)).toEqual(['Rice', 'Corn', 'Squash'])
  expect(host.querySelector('[aria-pressed="true"]')).toBeNull()
  await act(async () => handle(host, 'Rice').focus())
  await key(' ')
  expect(handle(host, 'Rice').getAttribute('aria-pressed')).toBe('true')
  await key('{Escape}')
  expect(change).not.toHaveBeenCalled()
})

test('removing the dragged item ends the drag without reporting it', async () => {
  const change = vi.fn()
  const { host, render } = await mount(<List onValueChange={change} />)
  const rice = handle(host, 'Rice')
  const start = middle(rice)
  await fire(rice, 'pointerdown', start)
  await fire(document, 'pointermove', start + 30)
  await fire(document, 'pointermove', middle(handle(host, 'Squash')) + 10)
  await render(
    <List
      onValueChange={change}
      only={['beans', 'corn', 'squash']}
    />
  )
  await fire(document, 'pointerup', middle(handle(host, 'Squash')) + 10)
  expect(change).not.toHaveBeenCalled()
  expect(order(host)).toEqual(['Beans', 'Corn', 'Squash'])
  expect(values(host)).toEqual(['beans', 'corn', 'squash'])
  expect(host.querySelector('ol')!.hasAttribute('data-drop')).toBe(false)
})

test('pointercancel and lost capture return the item; reset restores the default order', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <form>
      <List
        defaultValue={['corn']}
        onValueChange={change}
      />
    </form>
  )
  const form = host.querySelector('form')!
  const rice = handle(host, 'Rice')
  await fire(rice, 'pointerdown', middle(rice))
  await fire(document, 'pointermove', middle(handle(host, 'Squash')) + 10)
  await fire(rice, 'pointercancel', middle(handle(host, 'Squash')) + 10)
  await fire(rice, 'pointerdown', middle(rice))
  await fire(document, 'pointermove', middle(handle(host, 'Squash')) + 10)
  await fire(rice, 'lostpointercapture', middle(handle(host, 'Squash')) + 10)
  expect(change).not.toHaveBeenCalled()
  await announced(host, 'Move cancelled. Rice is back at position 2 of 4.')
  await fire(rice, 'pointerdown', middle(rice))
  await fire(document, 'pointermove', middle(handle(host, 'Squash')) + 10)
  await fire(document, 'pointerup', middle(handle(host, 'Squash')) + 10)
  expect(change).toHaveBeenCalledExactlyOnceWith(['corn', 'beans', 'squash', 'rice'])
  expect(new FormData(form).getAll('crops')).toEqual(['corn', 'beans', 'squash', 'rice'])
  await announced(host, 'Rice dropped at position 4 of 4.')
  await act(async () => form.reset())
  await pause(10)
  expect(order(host)).toEqual(['Corn', 'Rice', 'Beans', 'Squash'])
  expect(new FormData(form).getAll('crops')).toEqual(['corn', 'rice', 'beans', 'squash'])
})

test('a keyboard drop in place announces nothing', async () => {
  const { host } = await mount(<List />)
  await act(async () => handle(host, 'Corn').focus())
  await key(' ')
  await announced(host, 'Picked up Corn, position 3 of 4.')
  await key(' ')
  await pause(700)
  expect(status(host)).toBe('Picked up Corn, position 3 of 4.')
})

test('a click without pointer detail picks up and drops, as browse-mode activation does', async () => {
  const change = vi.fn()
  const { host } = await mount(<List onValueChange={change} />)
  const corn = handle(host, 'Corn')
  const activate = () =>
    act(async () => {
      corn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 0 }))
    })
  await activate()
  expect(corn.getAttribute('aria-pressed')).toBe('true')
  await act(async () => corn.focus())
  await key('{ArrowUp}')
  await activate()
  expect(corn.getAttribute('aria-pressed')).toBe('false')
  expect(change).toHaveBeenCalledExactlyOnceWith(['rice', 'corn', 'beans', 'squash'])
})

test('handleLabel names each handle from its item', async () => {
  const { host } = await mount(<List handleLabel={item => `Move ${item}`} />)
  const handles = Array.from(host.querySelectorAll('[data-slot~="sortable-list-handle"]'))
  expect(handles.map(node => node.getAttribute('aria-label'))).toEqual([
    'Move Rice',
    'Move Beans',
    'Move Corn',
    'Move Squash'
  ])
  expect(handles[0]!.hasAttribute('aria-labelledby')).toBe(false)
})

test('grabbing again during the drop glide clears the glide styles', async () => {
  const { host } = await mount(
    <MotionProvider>
      <List />
    </MotionProvider>
  )
  const rice = handle(host, 'Rice')
  await fire(rice, 'pointerdown', middle(rice))
  await fire(document, 'pointermove', middle(handle(host, 'Corn')) + 10)
  await pause(32)
  await fire(document, 'pointerup', middle(handle(host, 'Corn')) + 10)
  const item = rice.closest<HTMLElement>('[data-slot~="sortable-list-item"]')!
  expect(item.style.transition).not.toBe('')
  await fire(rice, 'pointerdown', middle(rice))
  expect(item.style.transition).toBe('')
  expect(item.style.translate).toBe('')
  await fire(document, 'pointerup', middle(rice))
  expect(host.querySelectorAll('li[data-rad-layout-slot]')).toHaveLength(4)
})

test('dragging near a scroll edge scrolls and keeps the item under the pointer', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <div style={{ height: '120px', overflowY: 'auto', width: '320px' }}>
      <List onValueChange={change} />
    </div>
  )
  const box = host.firstElementChild as HTMLElement
  const rice = handle(host, 'Rice')
  const start = middle(rice)
  const bottom = box.getBoundingClientRect().bottom - 4
  await fire(rice, 'pointerdown', start)
  await fire(document, 'pointermove', bottom)
  await expect.poll(() => box.scrollTop, { timeout: 3_000 }).toBeGreaterThan(40)
  const item = rice.closest<HTMLElement>('[data-slot~="sortable-list-item"]')!
  await expect
    .poll(() => Math.abs(item.getBoundingClientRect().top + item.offsetHeight / 2 - bottom))
    .toBeLessThan(6)
  await fire(document, 'pointerup', bottom)
  expect(change).toHaveBeenCalledOnce()
  expect(change.mock.calls[0]![0].indexOf('rice')).toBeGreaterThan(0)
})
