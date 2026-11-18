import { act } from 'react'
import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { DateRangePicker, Field, LocaleProvider } from '../../src/index.js'
import { mount, click, key, pause } from './familyHarness.js'

const labels = { startLabel: 'Start date', endLabel: 'End date', startName: 'from', endName: 'to' }
function segment(host: ParentNode, endpoint: string, part: string) {
  return host.querySelector<HTMLInputElement>(
    '[data-slot~="date-range-' + endpoint + '"] [data-segment="' + part + '"]'
  )!
}
function submitted(host: ParentNode) {
  return Object.fromEntries(new FormData(host.querySelector('form')!))
}
const fill = (input: HTMLInputElement, text: string) => act(async () => userEvent.fill(input, text))

test('date fields can be entered end first, reject a reversed range, and submit both ISO dates', async () => {
  const changes = vi.fn()
  const { host } = await mount(
    <form>
      <LocaleProvider locale="fr-FR">
        <Field
          layout="group"
          label="Booking"
          description="Enter the itinerary dates."
          error="Review the dates."
        >
          <p id="booking-policy">Check-out is at noon.</p>
          <DateRangePicker
            {...labels}
            onValueChange={changes}
            aria-describedby="booking-policy"
          />
        </Field>
      </LocaleProvider>
    </form>,
    true
  )
  const description = host.querySelector('[data-slot~="field-description"]')!
  const error = host.querySelector('[data-slot~="field-error"]')!
  for (const endpoint of ['start', 'end']) {
    const day = segment(host, endpoint, 'day')
    expect(day.getAttribute('aria-describedby')).toBe(
      `${description.id} ${error.id} booking-policy`
    )
    expect(day.getAttribute('aria-invalid')).toBe('true')
  }
  const form = host.querySelector('form')!
  expect(form.checkValidity()).toBe(true)
  await click(segment(host, 'end', 'day'))
  await key('02032028')
  expect(submitted(host)).toEqual({ from: '', to: '2028-03-02' })
  expect(form.checkValidity()).toBe(false)
  await click(segment(host, 'start', 'day'))
  await key('03032028')
  expect(changes).toHaveBeenCalledTimes(1)
  expect(form.checkValidity()).toBe(false)
  await fill(segment(host, 'start', 'day'), '02')
  expect(form.checkValidity()).toBe(true)
  expect(submitted(host)).toEqual({ from: '2028-03-02', to: '2028-03-02' })
  await fill(segment(host, 'end', 'day'), '01')
  expect(form.checkValidity()).toBe(false)
  expect(submitted(host).to).toBe('')
  await fill(segment(host, 'start', 'day'), '01')
  expect(form.checkValidity()).toBe(true)
  expect(segment(host, 'end', 'day').value).toBe('02')
  expect(submitted(host)).toEqual({ from: '2028-03-01', to: '2028-03-02' })
})

test('one calendar handles both endpoints, stays open between picks, and restores focus', async () => {
  const { host } = await mount(
    <form>
      <DateRangePicker
        {...labels}
        today="2028-02-29"
      />
    </form>
  )
  const trigger = host.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')!
  await click(trigger)
  await key('{Enter}')
  expect(host.querySelector(':popover-open')).toBeTruthy()
  expect(submitted(host)).toEqual({ from: '2028-02-29', to: '' })
  await key('{ArrowRight}{Enter}')
  expect(host.querySelector(':popover-open')).toBeNull()
  expect(submitted(host)).toEqual({ from: '2028-02-29', to: '2028-03-01' })
  expect(document.activeElement).toBe(segment(host, 'start', 'month'))
  await click(trigger)
  await key('{Escape}')
  expect(submitted(host)).toEqual({ from: '2028-02-29', to: '2028-03-01' })
})

test('opens on the suggested date for an empty range and completes a typed end in the calendar', async () => {
  const { host } = await mount(
    <form>
      <DateRangePicker
        {...labels}
        locale="en-US"
        today="2028-02-29"
        defaultFocusedDate="2028-03-10"
      />
    </form>
  )
  const trigger = host.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')!
  await click(trigger)
  expect(document.activeElement?.getAttribute('data-date')).toBe('2028-03-10')
  expect(submitted(host)).toEqual({ from: '', to: '' })
  await key('{Escape}')

  await click(segment(host, 'end', 'month'))
  await key('04052028')
  expect(submitted(host)).toEqual({ from: '', to: '2028-04-05' })
  await click(trigger)
  expect(document.activeElement?.getAttribute('data-date')).toBe('2028-04-05')
  expect(document.activeElement?.closest('td')?.getAttribute('aria-selected')).toBe('true')
  await key('{ArrowLeft}{Enter}')
  expect(submitted(host)).toEqual({ from: '2028-04-04', to: '2028-04-05' })
  expect(host.querySelector(':popover-open')).toBeNull()
})

test('presets and typing honor unavailable interior dates, bounds and native reset', async () => {
  const initial = { start: '2028-03-01', end: '2028-03-03' }
  const { host } = await mount(
    <>
      <form id="range-booking" />
      <DateRangePicker
        {...labels}
        form="range-booking"
        defaultValue={initial}
        min="2028-03-01"
        isDateDisabled={iso => iso === '2028-03-06'}
        presets={[
          { label: 'Blocked', start: '2028-03-02', end: '2028-03-09' },
          { label: 'Too early', start: '2028-02-29', end: '2028-03-01' },
          { label: 'Weekend', start: '2028-03-04', end: '2028-03-05' }
        ]}
      />
    </>,
    true
  )
  const button = (label: string) =>
    [...host.querySelectorAll('button')].find(el => el.textContent === label)!
  expect(button('Blocked').disabled).toBe(true)
  expect(button('Too early').disabled).toBe(true)
  await fill(segment(host, 'end', 'day'), '08')
  expect(host.querySelector('form')!.checkValidity()).toBe(false)
  await click(button('Weekend'))
  expect(submitted(host)).toEqual({ from: '2028-03-04', to: '2028-03-05' })
  expect(host.querySelector('form')!.checkValidity()).toBe(true)
  await act(async () => host.querySelector('form')!.reset())
  await pause(20)
  expect(submitted(host)).toEqual({ from: '2028-03-01', to: '2028-03-03' })
})

test('controlled owners can decline presets and a disabled group omits both values', async () => {
  const change = vi.fn()
  const tree = (disabled: boolean) => (
    <form>
      <Field
        layout="group"
        label="Dates"
        disabled={disabled}
      >
        <DateRangePicker
          {...labels}
          value={{ start: null, end: null }}
          onValueChange={change}
          presets={[{ label: 'One day', start: '2028-03-01', end: '2028-03-01' }]}
        />
      </Field>
    </form>
  )
  const { host, render } = await mount(tree(false))
  await click([...host.querySelectorAll('button')].find(el => el.textContent === 'One day')!)
  expect(change).toHaveBeenCalledWith({ start: '2028-03-01', end: '2028-03-01' })
  expect(submitted(host)).toEqual({ from: '', to: '' })
  await render(tree(true))
  expect(submitted(host)).toEqual({})
  expect([...host.querySelectorAll('button')].every(button => button.disabled)).toBe(true)
})
