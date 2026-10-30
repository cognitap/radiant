import { act, createRef, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { Kbd, KbdGroup, Button } from '../../src/index.js'
import {
  FindProjectWithShortcut,
  DuplicateNoteWithShortcut,
  SaveNoteWithShortcut
} from '../../.storybook/examples/KbdExamples.js'
import '../../.storybook/styles.css'
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: { root: Root; host: HTMLDivElement }[] = []
async function mount(tree: ReactNode, hydrate = false) {
  const host = document.createElement('div')
  document.body.append(host)
  if (hydrate) host.innerHTML = renderToString(tree)
  let root!: Root
  const errors: unknown[] = []
  await act(async () => {
    root = hydrate
      ? hydrateRoot(host, tree, { onRecoverableError: error => errors.push(error) })
      : createRoot(host)
    if (!hydrate) root.render(tree)
  })
  mounted.push({ root, host })
  expect(errors).toEqual([])
  return { host, render: (tree: ReactNode) => act(async () => root.render(tree)) }
}
afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
})
const keys = (text: string) =>
  act(async () => {
    await userEvent.keyboard(text)
  })
const fill = (node: Element, text: string) =>
  act(async () => {
    await userEvent.fill(node, text)
  })
const click = (node: Element) =>
  act(async () => {
    await userEvent.click(node)
  })

test('native nested keyboard notation hydrates without adding focus or behavior', async () => {
  const ref = createRef<HTMLElement>()
  const { host } = await mount(
    <StrictMode>
      <KbdGroup ref={ref}>
        <Kbd>Control</Kbd>
        <span>+</span>
        <Kbd>K</Kbd>
      </KbdGroup>
    </StrictMode>,
    true
  )
  expect(ref.current?.tagName).toBe('KBD')
  expect(host.querySelectorAll('kbd')).toHaveLength(3)
  expect(host.querySelectorAll('button,input,[tabindex]')).toHaveLength(0)
  expect(ref.current?.getAttribute('data-slot')).toBe('kbd kbd-group')
  expect(ref.current?.dir).toBe('ltr')
})
test('combinations stay unboxed while keys retain keycaps and native style overrides', async () => {
  const { host } = await mount(
    <KbdGroup>
      <Kbd
        className="rounded-none"
        style={{ color: 'red' }}
      >
        Ctrl
      </Kbd>
      +<Kbd>K</Kbd>
    </KbdGroup>
  )
  const root = host.querySelector('kbd')!,
    key = root.querySelector('kbd')!,
    style = getComputedStyle(root)
  expect(style.borderWidth).toBe('0px')
  expect(style.padding).toBe('0px')
  expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)')
  expect(style.boxShadow).not.toContain('inset')
  expect(getComputedStyle(key).boxShadow).toContain('inset')
  expect(getComputedStyle(key).borderRadius).toBe('0px')
  expect(key.style.color).toBe('red')
})
test('key hints never intercept Tab or native Button activation', async () => {
  const run = vi.fn()
  const { host } = await mount(
    <>
      <Button>Before</Button>
      <Button
        onClick={run}
        aria-keyshortcuts="Control+K"
      >
        Search<Kbd aria-hidden>Ctrl K</Kbd>
      </Button>
      <Button>After</Button>
    </>
  )
  const buttons = host.querySelectorAll('button')
  await click(buttons[0]!)
  await keys('{Tab}')
  expect(document.activeElement).toBe(buttons[1])
  await keys('{Enter}')
  expect(run).toHaveBeenCalledTimes(1)
  await keys('{Tab}')
  expect(document.activeElement).toBe(buttons[2])
})
test('the consumer-owned search shortcut focuses its real Input and filters projects', async () => {
  const { host } = await mount(<FindProjectWithShortcut />)
  await click(host.querySelector('button')!)
  await keys('{Control>}k{/Control}')
  expect(document.activeElement).toBe(host.querySelector('input'))
  await fill(host.querySelector('input')!, 'Reader')
  expect(host.querySelector('ul')?.textContent).toBe('Reader study')
  expect(host.querySelector('button')?.getAttribute('aria-keyshortcuts')).toBe('Control+K')
})
test('native Menu items contain actual keycaps and share their action with a scoped shortcut', async () => {
  const { host } = await mount(<DuplicateNoteWithShortcut />)
  const trigger = host.querySelector('button')!
  await click(trigger)
  const item = document.querySelector<HTMLElement>('[role="menuitem"]')!
  expect(item.querySelectorAll('kbd')).toHaveLength(3)
  await click(item)
  expect(host.querySelectorAll('li')).toHaveLength(2)
  await keys('{Control>}d{/Control}')
  expect(host.querySelectorAll('li')).toHaveLength(3)
  expect(document.querySelector('[role="menu"]')?.getAttribute('data-state')).not.toBe('open')
})
test('Tooltip instructions retain keyboard notation and scoped save submits the native form value', async () => {
  const { host } = await mount(<SaveNoteWithShortcut />)
  const note = host.querySelector('textarea')!
  await fill(note, 'Review complete')
  await keys('{Control>}s{/Control}')
  expect(host.querySelector('output')?.textContent).toBe('Saved note: Review complete')
  const help = host.querySelector<HTMLButtonElement>('button[aria-label="Saving shortcut"]')!
  await act(async () => help.focus())
  await expect
    .poll(() => document.querySelector('[role="tooltip"]')?.getAttribute('data-state'))
    .toBe('open')
  const tooltip = document.querySelector('[role="tooltip"]')!
  expect(tooltip.querySelectorAll('kbd')).toHaveLength(3)
  expect(tooltip.textContent).toContain('Control')
  await keys('{Escape}')
})
