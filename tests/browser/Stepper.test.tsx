import { act } from 'react'
import { commands } from 'vitest/browser'
import { expect, test, vi } from 'vitest'
import { LocaleProvider, Stepper, type StepperStep } from '../../src/index.js'
import { click, key, mount } from './familyHarness.js'

const steps: readonly StepperStep[] = [
  { value: 'address', label: 'Address' },
  { value: 'pickup', label: 'Pickup', disabled: true },
  { value: 'delivery', label: 'Delivery' },
  { value: 'review', label: 'Review' }
]

function workflow(host: HTMLElement) {
  const list = host.querySelector('ol')!
  const item = (value: string) => list.querySelector<HTMLElement>(`[data-value="${value}"]`)!
  const button = (value: string) => item(value).querySelector('button')!
  const status = (value: string) =>
    item(value).querySelector<HTMLElement>('[data-slot="stepper-status"]')!
  const current = () => list.querySelector('[aria-current="step"]')
  return { list, item, button, status, current }
}

test('linear navigation skips disabled steps, permits one forward step and never submits a form', async () => {
  const change = vi.fn()
  const submit = vi.fn()
  const { host } = await mount(
    <form
      onSubmit={event => {
        event.preventDefault()
        submit()
      }}
    >
      <Stepper
        aria-label="Shipping setup"
        steps={steps}
        onValueChange={change}
      />
      <button type="submit">Submit order</button>
    </form>,
    true
  )
  const { list, button, status, current } = workflow(host)
  expect(host.querySelector('nav')).toHaveAccessibleName('Shipping setup')
  expect(list.querySelectorAll('li')).toHaveLength(4)
  expect(current()).toBe(button('address'))
  expect(status('address')).toHaveTextContent('Current')
  expect(button('pickup')).toBeDisabled()
  expect(button('delivery')).toBeEnabled()
  expect(button('review')).toBeDisabled()
  expect(status('review')).toHaveTextContent('Upcoming')

  await act(async () => button('address').focus())
  await key('{Tab}')
  expect(button('delivery')).toHaveFocus()
  await key('{Enter}')
  expect(current()).toBe(button('delivery'))
  expect(button('delivery')).toHaveFocus()
  expect(change).toHaveBeenCalledExactlyOnceWith('delivery')
  expect(status('address')).toHaveTextContent('Completed')
  expect(button('address')).toHaveAccessibleDescription('Completed')
  expect(status('pickup')).toHaveTextContent('Upcoming')
  expect(button('review')).toBeEnabled()
  await key('{Tab}{Space}')
  expect(current()).toBe(button('review'))
  expect(change).toHaveBeenLastCalledWith('review')
  await click(button('address'))
  expect(current()).toBe(button('address'))
  expect(button('review')).toBeDisabled()
  expect(submit).not.toHaveBeenCalled()
  expect(list.querySelectorAll('[aria-current]')).toHaveLength(1)
})

test('free navigation honors a controlled owner and retains visible completion and error text in forced colors', async () => {
  const choose = vi.fn()
  const review: readonly StepperStep[] = [
    { value: 'profile', label: 'Profile', completed: true },
    { value: 'references', label: 'References', error: 'Add a second reference.' },
    { value: 'documents', label: 'Documents' },
    { value: 'submit', label: 'Submit', completed: true }
  ]
  const renderSteps = (value: string) => (
    <Stepper
      aria-label="Application review"
      steps={review}
      value={value}
      navigation="free"
      onValueChange={choose}
      statusLabels={{ error: 'Action required', completed: 'Done' }}
    />
  )
  const { host, render } = await mount(renderSteps('references'))
  const { button, status, current } = workflow(host)
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'no-preference' })
  expect(current()).toBe(button('references'))
  expect(status('references')).toBeVisible()
  expect(status('references')).toHaveTextContent('Current · Action required')
  expect(button('references')).toHaveAccessibleName('References')
  expect(button('references')).toHaveAccessibleDescription(
    'Action required Add a second reference.'
  )
  expect(status('profile')).toHaveTextContent('Done')

  await click(button('submit'))
  expect(choose).toHaveBeenCalledExactlyOnceWith('submit')
  expect(current()).toBe(button('references'))
  await render(renderSteps('submit'))
  expect(current()).toBe(button('submit'))
  expect(button('submit')).toHaveAccessibleDescription('Done')
  expect(status('submit')).toHaveTextContent('Current · Done')
  expect(status('documents')).toHaveTextContent('Upcoming')
  expect(status('references')).toHaveTextContent('Action required')
})

test('RTL follows logical inline order and vertical connectors align with the indicators', async () => {
  const renderSteps = (orientation: 'horizontal' | 'vertical') => (
    <LocaleProvider locale="he-IL">
      <Stepper
        aria-label="Steps"
        steps={steps}
        defaultValue="delivery"
        orientation={orientation}
        className="w-[30rem]"
      />
    </LocaleProvider>
  )
  const { host, render } = await mount(renderSteps('horizontal'))
  const { item, current, button } = workflow(host)
  const marker = (value: string) =>
    item(value).querySelector('[data-slot="stepper-indicator"]')!.getBoundingClientRect()
  const connector = () =>
    item('address').querySelector('[data-slot="stepper-connector"]')!.getBoundingClientRect()
  expect(host.querySelector('nav')).toHaveStyle({ direction: 'rtl' })
  expect(marker('address').left).toBeGreaterThan(marker('pickup').right)
  expect(connector().left).toBeGreaterThanOrEqual(marker('pickup').right)
  expect(connector().right).toBeLessThanOrEqual(marker('address').left)
  expect(connector().width).toBeGreaterThan(10)

  await render(renderSteps('vertical'))
  expect(marker('address').bottom).toBeLessThan(marker('pickup').top)
  expect(marker('address').left).toBe(marker('pickup').left)
  const center = marker('address').x + marker('address').width / 2
  expect(Math.abs(connector().x + connector().width / 2 - center)).toBeLessThanOrEqual(1)
  expect(connector().height).toBeGreaterThan(0)
  expect(current()).toBe(button('delivery'))
})
