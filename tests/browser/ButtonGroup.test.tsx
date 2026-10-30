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
    style={{ '--rad-button-group-radius': '9px' }}
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
test('logical corners and one shared border follow live horizontal LTR/RTL and vertical layout', async () => {
  const { host, render } = await mount(actions())
  let nodes = buttons(host),
    a = nodes[0]!.getBoundingClientRect(),
    b = nodes[1]!.getBoundingClientRect()
  expect(getComputedStyle(nodes[0]!).borderTopLeftRadius).toBe('9px')
  expect(getComputedStyle(nodes[0]!).borderTopRightRadius).toBe('0px')
  expect(getComputedStyle(nodes[2]!).borderTopRightRadius).toBe('9px')
  expect(Math.abs(a.right - b.left - 1)).toBeLessThan(0.2)
  await render(actions({ dir: 'rtl' }))
  nodes = buttons(host)
  a = nodes[0]!.getBoundingClientRect()
  b = nodes[1]!.getBoundingClientRect()
  await expect.poll(() => getComputedStyle(nodes[0]!).borderTopRightRadius).toBe('9px')
  expect(getComputedStyle(nodes[0]!).borderTopLeftRadius).toBe('0px')
  expect(getComputedStyle(nodes[2]!).borderTopLeftRadius).toBe('9px')
  expect(Math.abs(b.right - a.left - 1)).toBeLessThan(0.2)
  await render(actions({ orientation: 'vertical', dir: 'rtl' }))
  nodes = buttons(host)
  a = nodes[0]!.getBoundingClientRect()
  b = nodes[1]!.getBoundingClientRect()
  await expect.poll(() => getComputedStyle(nodes[0]!).borderTopLeftRadius).toBe('9px')
  expect(getComputedStyle(nodes[0]!).borderBottomLeftRadius).toBe('0px')
  expect(getComputedStyle(nodes[2]!).borderBottomLeftRadius).toBe('9px')
  expect(Math.abs(a.bottom - b.top - 1)).toBeLessThan(0.2)
})
test('a single Button and dynamic membership receive complete outer corners', async () => {
  const { host, render } = await mount(actions())
  await render(
    <ButtonGroup style={{ '--rad-button-group-radius': '9px' }}>
      <Button>Only</Button>
    </ButtonGroup>
  )
  const style = getComputedStyle(buttons(host)[0]!)
  expect([
    style.borderTopLeftRadius,
    style.borderTopRightRadius,
    style.borderBottomLeftRadius,
    style.borderBottomRightRadius
  ]).toEqual(['9px', '9px', '9px', '9px'])
})
test('joined submit and reset actions retain native form submission and reset', async () => {
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
test('a real MenuTrigger keeps the final corners, native menu keyboard behavior and return focus', async () => {
  const { host } = await mount(
    <PublishReportActions style={{ '--rad-button-group-radius': '9px' }} />
  )
  const nodes = buttons(host)
  expect(nodes).toHaveLength(2)
  expect(nodes[1]?.getAttribute('data-slot')).toContain('menu-trigger')
  expect(getComputedStyle(nodes[1]!).borderTopRightRadius).toBe('9px')
  await click(nodes[1]!)
  await keys('{Escape}')
  expect(document.activeElement).toBe(nodes[1])
  expect(getComputedStyle(nodes[1]!).borderTopRightRadius).toBe('9px')
  await click(nodes[1]!)
  const item = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
    node => node.textContent === 'Schedule for tomorrow'
  )!
  await click(item)
  expect(host.querySelector('output')?.textContent).toBe('Report scheduled for tomorrow.')
})
