import { act, StrictMode, useEffect, useState } from 'react'
import { expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  Stage,
  StageActions,
  StageBody,
  StageExpand,
  StageHeader,
  StageTitle,
  type StageProps
} from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'
import { click, key, mount } from './familyHarness.js'

const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

function Widget({ onMount }: { onMount: () => void }) {
  const [count, setCount] = useState(0)
  useEffect(onMount, [onMount])
  return (
    <div>
      <button
        type="button"
        onClick={() => setCount(count + 1)}
      >
        Count {count}
      </button>
      <input aria-label="Note" />
      <select
        aria-label="Route"
        defaultValue="a"
      >
        <option value="a">Station</option>
        <option value="b">Lake</option>
      </select>
      <div
        data-testid="scroller"
        style={{ height: '4rem', overflow: 'auto' }}
      >
        <div style={{ height: '40rem' }}>Long content</div>
      </div>
    </div>
  )
}

function expandable(props: Partial<StageProps> = {}, onMount = () => {}) {
  return (
    <div style={{ width: '18rem' }}>
      <button type="button">Outside</button>
      <Stage
        expandTo="dialog"
        {...(props as object)}
      >
        <StageHeader>
          <StageTitle>Route map</StageTitle>
          <StageActions>
            <StageExpand
              expandLabel="Expand route map"
              collapseLabel="Collapse route map"
            />
          </StageActions>
        </StageHeader>
        <StageBody>
          <Widget onMount={onMount} />
        </StageBody>
      </Stage>
    </div>
  )
}

const parts = (host: HTMLElement) => ({
  stage: host.querySelector<HTMLElement>('[data-slot~="stage"]')!,
  view: host.querySelector<HTMLDialogElement>('dialog[data-slot~="stage-expanded"]')!,
  toggle: host.querySelector<HTMLButtonElement>('[data-slot~="stage-expand"]')!,
  input: host.querySelector<HTMLInputElement>('input')!,
  select: host.querySelector<HTMLSelectElement>('select')!,
  scroller: host.querySelector<HTMLElement>('[data-testid="scroller"]')!
})

test('expanding and collapsing keeps the widget mounted with its state, selection, scroll and focus', async () => {
  const onMount = vi.fn()
  const { host } = await mount(expandable({}, onMount))
  const { stage, view, toggle, input, select, scroller } = parts(host)
  const count = host.querySelector<HTMLButtonElement>('[data-slot~="stage-body"] button')!
  const collapsedHeight = stage.getBoundingClientRect().height
  expect(view.open).toBe(false)
  expect(toggle.getAttribute('aria-label')).toBe('Expand route map')

  await click(count)
  await click(input)
  await act(async () => userEvent.keyboard('hello world'))
  input.setSelectionRange(2, 7)
  await act(async () => userEvent.selectOptions(select, 'b'))
  scroller.scrollTop = 120
  input.focus()
  input.setSelectionRange(2, 7)

  await act(async () => {
    toggle.click()
  })
  expect(view.open).toBe(true)
  expect(view.matches(':modal')).toBe(true)
  expect(stage.getAttribute('data-state')).toBe('open')
  expect(toggle.getAttribute('aria-label')).toBe('Collapse route map')
  // The page keeps the collapsed Stage's place.
  expect(stage.getBoundingClientRect().height).toBeCloseTo(collapsedHeight, 0)
  expect(view.getBoundingClientRect().width).toBeGreaterThan(stage.getBoundingClientRect().width)
  expect(document.activeElement).toBe(input)
  expect(input.value).toBe('hello world')
  expect([input.selectionStart, input.selectionEnd]).toEqual([2, 7])
  expect(select.value).toBe('b')
  expect(scroller.scrollTop).toBe(120)
  expect(count.textContent).toBe('Count 1')

  scroller.scrollTop = 200
  await click(toggle)
  expect(view.open).toBe(false)
  expect(document.activeElement).toBe(toggle)
  expect(scroller.scrollTop).toBe(200)
  expect(stage.style.getPropertyValue('--_stage-collapsed-size')).toBe('')

  await click(toggle)
  expect(view.open).toBe(true)
  expect(document.activeElement).toBe(toggle)
  input.focus()
  input.setSelectionRange(1, 3)
  await key('{Escape}')
  expect(view.open).toBe(false)
  expect(document.activeElement).toBe(input)
  expect([input.selectionStart, input.selectionEnd]).toEqual([1, 3])
  expect(input.value).toBe('hello world')
  expect(select.value).toBe('b')
  expect(scroller.scrollTop).toBe(200)
  expect(count.textContent).toBe('Count 1')
  expect(host.querySelector('input')).toBe(input)
  expect(onMount).toHaveBeenCalledTimes(1)
})

test('the expanded view is a modal dialog named by the Stage title that traps focus', async () => {
  const { host } = await mount(expandable({ defaultOpen: true }))
  const { view, toggle } = parts(host)
  const outside = host.querySelector<HTMLButtonElement>('button')!
  expect(view.open).toBe(true)
  const title = host.querySelector('[data-slot~="stage-title"]')!
  expect(view.getAttribute('aria-labelledby')).toBe(title.id)
  expect(document.querySelector(':modal')).toBe(view)
  toggle.focus()
  // The rest of the page is inert: past the last control, focus leaves the page, then returns.
  const reached = new Set<Element | null>()
  for (let index = 0; index < 12; index++) {
    await key('{Tab}')
    reached.add(document.activeElement)
    expect(document.activeElement === document.body || view.contains(document.activeElement)).toBe(
      true
    )
  }
  expect(reached.has(toggle)).toBe(true)
  expect(reached.has(outside)).toBe(false)
  // A click outside the view's border box collapses it.
  const box = view.getBoundingClientRect()
  await act(async () => {
    view.dispatchEvent(
      new MouseEvent('click', { bubbles: true, clientX: box.left - 4, clientY: box.top + 4 })
    )
  })
  expect(view.open).toBe(false)
})

test('the parts lay out by the expanded width', async () => {
  const { host } = await mount(expandable())
  const { toggle } = parts(host)
  const title = host.querySelector<HTMLElement>('[data-slot~="stage-title"]')!
  const actions = host.querySelector<HTMLElement>('[data-slot~="stage-actions"]')!
  expect(actions.getBoundingClientRect().top).toBeGreaterThan(title.getBoundingClientRect().bottom)
  await click(toggle)
  expect(actions.getBoundingClientRect().top).toBeLessThan(title.getBoundingClientRect().bottom)
})

test.each(['start', 'end'] as const)('a panel docks to the %s edge at full height', async side => {
  const { host } = await mount(expandable({ expandTo: 'panel', side, defaultOpen: true }))
  const { view } = parts(host)
  const box = view.getBoundingClientRect()
  const width = document.documentElement.clientWidth
  expect(box.height).toBeCloseTo(window.innerHeight, 0)
  if (side === 'start') expect(box.left).toBeCloseTo(0, 0)
  else expect(box.right).toBeCloseTo(width, 0)
  expect(box.width).toBeLessThan(width)
})

test('a controlled owner receives requests and can decline Escape', async () => {
  const changes = vi.fn()
  const { host, render } = await mount(expandable({ open: false, onOpenChange: changes }))
  const { view, toggle } = parts(host)
  await click(toggle)
  expect(changes).toHaveBeenLastCalledWith(true)
  expect(view.open).toBe(false)
  await render(expandable({ open: true, onOpenChange: changes }))
  expect(view.open).toBe(true)
  await key('{Escape}')
  expect(changes).toHaveBeenLastCalledWith(false)
  expect(view.open).toBe(true)
  await render(expandable({ open: false, onOpenChange: changes }))
  expect(view.open).toBe(false)
})

test('the expanded view springs open and reduced motion skips the spring', async () => {
  const { host } = await mount(<MotionProvider>{expandable()}</MotionProvider>)
  const { view, toggle } = parts(host)
  await click(toggle)
  await frame()
  expect(Number(view.style.scale)).toBeLessThan(1)
  await expect.poll(() => Number(view.style.scale) > 0.99).toBe(true)
  await click(toggle)
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  await frame()
  await click(toggle)
  expect(view.style.scale).toBe('1')
  expect(view.open).toBe(true)
})

test('server markup hydrates in StrictMode and StageExpand requires its labels and an expandable Stage', async () => {
  const { host } = await mount(<StrictMode>{expandable({ defaultOpen: true })}</StrictMode>, true)
  expect(parts(host).view.open).toBe(true)
  expect(parts(host).view.matches(':modal')).toBe(true)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  await expect(
    mount(
      <Stage>
        <StageExpand
          expandLabel="Expand"
          collapseLabel="Collapse"
        />
      </Stage>
    )
  ).rejects.toThrow('StageExpand must render inside a Stage with expandTo.')
  await expect(
    mount(
      <Stage expandTo="dialog">
        <StageExpand
          expandLabel=" "
          collapseLabel="Collapse"
        />
      </Stage>
    )
  ).rejects.toThrow('StageExpand requires aria-label or aria-labelledby.')
})
