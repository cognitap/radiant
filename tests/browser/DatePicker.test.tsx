import { act, createRef } from 'react'
import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { DatePicker, Field, LocaleProvider } from '../../src/index.js'
import { click, key, mount, pause } from './familyHarness.js'

function segment(host: ParentNode, part: string) {
  return host.querySelector<HTMLInputElement>('[data-segment="' + part + '"]')!
}
const fill = (input: HTMLInputElement, value: string) =>
  act(async () => userEvent.fill(input, value))

test('Field labels the localized segments, keyboard entry submits a single ISO value and reset clears it', async () => {
  const input = createRef<HTMLInputElement>()
  const { host } = await mount(
    <form>
      <LocaleProvider locale="fr-FR">
        <Field
          label="Arrivée"
          required
          description="Date de visite"
        >
          <DatePicker
            name="date"
            ref={input}
          />
        </Field>
      </LocaleProvider>
    </form>,
    true
  )
  const form = host.querySelector('form')!
  const day = segment(host, 'day')
  expect(input.current).toBe(day)
  expect(host.querySelector('label')?.control).toBe(day)
  expect(day.getAttribute('aria-describedby')).toBeTruthy()
  expect(form.checkValidity()).toBe(false)
  await click(day)
  await key('29022028')
  expect(new FormData(form).getAll('date')).toEqual(['2028-02-29'])
  expect(form.checkValidity()).toBe(true)
  expect(host.querySelector(':popover-open')).toBeNull()
  await fill(segment(host, 'year'), '2027')
  expect(form.checkValidity()).toBe(false)
  expect(new FormData(form).get('date')).toBe('')
  form.addEventListener('reset', event => event.preventDefault(), { once: true })
  await act(async () => form.reset())
  await pause(10)
  expect(day.value).toBe('29')
  await act(async () => form.reset())
  await pause(10)
  expect(day.value).toBe('')
})

test('Calendar opens on the current day, Escape and selecting a day both restore editor focus', async () => {
  const { host } = await mount(
    <DatePicker
      aria-label="Departure"
      defaultValue="2028-02-29"
    />
  )
  const trigger = host.querySelector<HTMLButtonElement>('[data-slot~="date-picker-trigger"]')!
  await click(trigger)
  expect(document.activeElement?.getAttribute('data-date')).toBe('2028-02-29')
  await key('{ArrowRight}{Escape}')
  expect(host.querySelector(':popover-open')).toBeNull()
  expect(document.activeElement).toBe(segment(host, 'month'))
  await click(trigger)
  await key('{Enter}')
  expect(host.querySelector(':popover-open')).toBeNull()
  expect(document.activeElement).toBe(segment(host, 'month'))
  await click(trigger)
  await key('{ArrowRight}{Enter}')
  expect(segment(host, 'month').value).toBe('03')
  expect(segment(host, 'day').value).toBe('01')
})

test('Buddhist years and Thai digits edit an ISO value, with bounds and date restrictions enforced', async () => {
  const { host } = await mount(
    <form>
      <LocaleProvider locale="th-TH-u-nu-thai">
        <DatePicker
          name="date"
          aria-label="วันที่"
          defaultValue="2028-02-29"
          max="2028-03-31"
          isDateDisabled={date => date === '2028-03-29'}
        />
      </LocaleProvider>
    </form>,
    true
  )
  const form = host.querySelector('form')!
  expect(segment(host, 'year').value).toBe('๒๕๗๑')
  await fill(segment(host, 'month'), '๐๔')
  expect(form.checkValidity()).toBe(false)
  await fill(segment(host, 'month'), '๐๓')
  expect(form.checkValidity()).toBe(false)
  await fill(segment(host, 'day'), '๐๒')
  expect(form.checkValidity()).toBe(true)
  expect(new FormData(form).get('date')).toBe('2028-03-02')
})

test('controlled refusal, external form ownership, read-only and disabled controls', async () => {
  const request = vi.fn()
  const tree = (mode: 'edit' | 'read' | 'disabled') => (
    <>
      <form id="date-owner" />
      <Field
        label="Start"
        disabled={mode === 'disabled'}
      >
        <DatePicker
          form="date-owner"
          name="date"
          value="2028-03-15"
          onValueChange={request}
          readOnly={mode === 'read'}
        />
      </Field>
    </>
  )
  const { host, render } = await mount(tree('edit'))
  await fill(segment(host, 'day'), '22')
  expect(request).toHaveBeenCalledWith('2028-03-22')
  expect(segment(host, 'day').value).toBe('15')
  await render(tree('read'))
  expect(segment(host, 'day').readOnly).toBe(true)
  expect(host.querySelector('button')?.disabled).toBe(true)
  expect(new FormData(host.querySelector('form')!).get('date')).toBe('2028-03-15')
  await render(tree('disabled'))
  expect(new FormData(host.querySelector('form')!).has('date')).toBe(false)
})
