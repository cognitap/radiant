import { act, createRef, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { ButtonGroup, Button, type ButtonGroupProps } from '../../src/index.js'
import {
  EditProjectActions,
  PublishReportActions
} from '../../.storybook/examples/ButtonGroupExamples.js'
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
const click = (node: Element) =>
  act(async () => {
    await userEvent.click(node)
  })
const keys = (text: string) =>
  act(async () => {
    await userEvent.keyboard(text)
  })
const actions = (props: ButtonGroupProps = {}) => (
  <ButtonGroup
    aria-label="Actions"
    style={{ '--rad-spacing-normal': '20px', '--rad-button-radius': '9px' }}
    {...props}
  >
    <Button variant="outline">Save</Button>
    <Button variant="outline">Preview</Button>
    <Button variant="outline">Share</Button>
  </ButtonGroup>
)
const group = (host: HTMLElement) =>
  host.querySelector<HTMLDivElement>('[data-slot="button-group"]')!
const buttons = (host: HTMLElement) => [
  ...group(host).querySelectorAll<HTMLButtonElement>(':scope > button')
]
test('hydrates a named passive div while root props and ref keep the native host', async () => {
  const ref = createRef<HTMLDivElement>()
  const { host } = await mount(
    <StrictMode>{actions({ ref, className: 'custom', style: { color: 'red' } })}</StrictMode>,
    true
  )
  expect(ref.current).toBe(group(host))
  expect(group(host).getAttribute('role')).toBe('group')
  expect(group(host).getAttribute('aria-label')).toBe('Actions')
  expect(group(host).style.color).toBe('red')
  expect(group(host).classList.contains('custom')).toBe(true)
  expect(group(host).hasAttribute('tabindex')).toBe(false)
  expect(group(host).hasAttribute('aria-orientation')).toBe(false)
  expect(buttons(host).every(button => button.tabIndex === 0)).toBe(true)
})
test('each enabled or pending Button retains its own Tab stop and arrows do not create roving focus', async () => {
  const invoked = vi.fn()
  const { host } = await mount(
    <>
      <Button>Before</Button>
      <ButtonGroup>
        <Button onClick={invoked}>First</Button>
        <Button pending>Pending</Button>
        <Button disabled>Disabled</Button>
        <Button>Last</Button>
      </ButtonGroup>
      <Button>After</Button>
    </>
  )
  await click(host.querySelector('button')!)
  const children = buttons(host)
  await keys('{Tab}')
  expect(document.activeElement).toBe(children[0])
  await keys('{ArrowRight}')
  expect(document.activeElement).toBe(children[0])
  await keys('{Enter}')
  expect(invoked).toHaveBeenCalledTimes(1)
  await keys('{Tab}')
  expect(document.activeElement).toBe(children[1])
  await keys('{Enter}')
  expect(invoked).toHaveBeenCalledTimes(1)
  await keys('{Tab}')
  expect(document.activeElement).toBe(children[3])
  await keys('{Tab}')
  expect(document.activeElement?.textContent).toBe('After')
})
test('separate corners and half spacing follow horizontal LTR, RTL and vertical layout', async () => {
  const { host, render } = await mount(actions())
  const [first, middle, last] = buttons(host)
  for (const button of [first, middle, last]) {
    expect(getComputedStyle(button!).borderRadius).toBe('9px')
  }
  function currentGap(axis: 'ltr' | 'rtl' | 'vertical') {
    const a = first!.getBoundingClientRect()
    const b = middle!.getBoundingClientRect()
    if (axis === 'vertical') return b.top - a.bottom
    return axis === 'rtl' ? a.left - b.right : b.left - a.right
  }
  expect(currentGap('ltr')).toBeCloseTo(10)
  await render(actions({ dir: 'rtl' }))
  expect(currentGap('rtl')).toBeCloseTo(10)
  await render(actions({ orientation: 'vertical', dir: 'rtl' }))
  expect(currentGap('vertical')).toBeCloseTo(10)
  await render(actions({ style: { '--rad-button-group-gap': '6px' } }))
  expect(currentGap('ltr')).toBeCloseTo(6)
})
test('grouped submit and reset actions retain native form submission and reset', async () => {
  const { host } = await mount(<EditProjectActions />)
  await act(async () => {
    await userEvent.fill(host.querySelector('input')!, 'North star')
  })
  const nodes = buttons(host)
  await click(nodes[0]!)
  expect(host.querySelector('output')?.textContent).toBe('Saved North star.')
  await click(nodes[1]!)
  expect(host.querySelector('input')?.value).toBe('Reader study')
  expect(host.querySelector('output')?.textContent).toBe('Project title restored.')
})
test('a grouped MenuTrigger keeps its corners, native menu keyboard behavior and return focus', async () => {
  const { host } = await mount(<PublishReportActions style={{ '--rad-button-radius': '9px' }} />)
  const nodes = buttons(host)
  expect(nodes).toHaveLength(2)
  expect(nodes[1]?.getAttribute('data-slot')).toContain('menu-trigger')
  expect(nodes[1]?.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
  expect(getComputedStyle(nodes[1]!).borderRadius).toBe('9px')
  await click(nodes[1]!)
  await keys('{Escape}')
  expect(document.activeElement).toBe(nodes[1])
  expect(getComputedStyle(nodes[1]!).borderRadius).toBe('9px')
  await click(nodes[1]!)
  const item = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
    node => node.textContent === 'Schedule for tomorrow'
  )!
  await click(item)
  expect(host.querySelector('output')?.textContent).toBe('Report scheduled for tomorrow.')
})
test('a caller data-slot composes with the button-group identity', async () => {
  const { host } = await mount(actions({ 'data-slot': 'record-actions' }))
  const root = host.querySelector<HTMLDivElement>('[data-slot~="record-actions"]')
  expect(root?.dataset.slot).toBe('button-group record-actions')
  expect(root?.getAttribute('role')).toBe('group')
})
