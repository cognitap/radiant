import { act, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { Radio, RadioGroup } from '../../src/index.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: { host: HTMLDivElement; root: Root }[] = []
async function mount(tree: ReactNode, hydrate = false) {
  const host = document.createElement('div')
  document.body.append(host)
  if (hydrate) host.innerHTML = renderToString(tree)
  const errors: unknown[] = []
  let root!: Root
  await act(async () => {
    root = hydrate
      ? hydrateRoot(host, tree, { onRecoverableError: error => errors.push(error) })
      : createRoot(host)
    if (!hydrate) root.render(tree)
  })
  mounted.push({ host, root })
  expect(errors).toEqual([])
  return host
}
afterEach(async () => {
  for (const { host, root } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
})

function Plans({ name }: { name?: string }) {
  return (
    <form>
      <RadioGroup
        label="Plan"
        name={name}
        required
      >
        <Radio
          label="Free"
          value="free"
        />
        <Radio
          label="Pro"
          value="pro"
        />
      </RadioGroup>
      <RadioGroup
        label="Billing"
        defaultValue="monthly"
      >
        <Radio
          label="Monthly"
          value="monthly"
        />
        <Radio
          label="Yearly"
          value="yearly"
        />
      </RadioGroup>
    </form>
  )
}

test('an unnamed group still groups its radios, moves with arrows and submits one value', async () => {
  const host = await mount(
    <StrictMode>
      <Plans />
    </StrictMode>,
    true
  )
  const form = host.querySelector('form')!
  const [free, pro, monthly, yearly] = host.querySelectorAll('input')
  expect(free.name).not.toBe('')
  expect(free.name).toBe(pro.name)
  expect(monthly.name).toBe(yearly.name)
  expect(free.name).not.toBe(monthly.name)
  expect(form.checkValidity()).toBe(false)

  await act(async () => free.focus())
  await act(async () => userEvent.keyboard(' '))
  expect(free.checked).toBe(true)
  await act(async () => userEvent.keyboard('{ArrowDown}'))
  expect(pro.checked).toBe(true)
  expect(free.checked).toBe(false)
  expect(document.activeElement).toBe(pro)
  expect(monthly.checked).toBe(true)
  expect(form.checkValidity()).toBe(true)
  expect([...new FormData(form)]).toEqual([
    [pro.name, 'pro'],
    [monthly.name, 'monthly']
  ])
})

test('a named group submits under that name', async () => {
  const host = await mount(<Plans name="plan" />)
  const form = host.querySelector('form')!
  const [free] = host.querySelectorAll('input')
  await act(async () => free.click())
  expect(new FormData(form).get('plan')).toBe('free')
})
