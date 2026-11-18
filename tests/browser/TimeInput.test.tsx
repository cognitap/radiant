import { act, createRef } from 'react'
import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { DatePicker, Field, LocaleProvider, TimeInput } from '../../src/index.js'
import { click, key, mount, pause } from './familyHarness.js'

const segment = (host: ParentNode, part: string) =>
  host.querySelector<HTMLInputElement>('[data-slot~="time-input"] [data-segment="' + part + '"]')!
const data = (host: ParentNode) => new FormData(host.querySelector('form')!).get('time')
const fill = (input: HTMLInputElement, text: string) => act(async () => userEvent.fill(input, text))

test('localized digits and AM/PM submit an ISO wall-clock time alongside an independent DatePicker', async () => {
  const input = createRef<HTMLInputElement>()
  const { host } = await mount(
    <form>
      <LocaleProvider locale="ar-EG">
        <Field label="التاريخ">
          <DatePicker
            name="date"
            defaultValue="2028-03-01"
          />
        </Field>
        <Field
          label="الوقت"
          required
          description="موعد"
        >
          <TimeInput
            name="time"
            ref={input}
            style={{
              '--rad-time-input-period-color': '#123456',
              '--rad-time-input-period-indicator-color': '#654321'
            }}
          />
        </Field>
      </LocaleProvider>
    </form>,
    true
  )
  const hour = segment(host, 'hour')
  expect(hour).toBe(input.current)
  expect(hour.labels?.[0].textContent).toContain('الوقت')
  expect(hour.getAttribute('aria-describedby')).toBeTruthy()
  await fill(hour, '١٢')
  await fill(segment(host, 'minute'), '٠٥')
  expect(data(host)).toBe('00:05')
  const periodButtons = host.querySelectorAll<HTMLButtonElement>('[data-slot~="time-input"] button')
  expect(periodButtons).toHaveLength(1)
  const period = periodButtons[0]
  expect(getComputedStyle(period).color).toBe('rgb(18, 52, 86)')
  expect(getComputedStyle(period).textDecorationColor).toBe('rgb(101, 67, 33)')
  expect(document.activeElement).toBe(period)
  expect(period.textContent).toBe('ص')
  await click(period)
  expect(period.textContent).toBe('م')
  expect(data(host)).toBe('12:05')
  await key('{ArrowUp}')
  expect(period.textContent).toBe('ص')
  expect(data(host)).toBe('00:05')
  await key(' ')
  expect(document.activeElement).toBe(period)
  expect(Object.fromEntries(new FormData(host.querySelector('form')!))).toEqual({
    date: '2028-03-01',
    time: '12:05'
  })
  expect(hour.value).toBe('١٢')
  await fill(hour, '٩٩')
  expect(host.querySelector('form')!.checkValidity()).toBe(false)
  expect(data(host)).toBe('')
})

test('arrows on each segment carry across hours and midnight, respect overnight bounds and align seconds to min', async () => {
  const { host } = await mount(
    <form>
      <TimeInput
        aria-label="Shift"
        name="time"
        hourCycle="h23"
        min="23:55:05"
        max="00:10:05"
        step={15}
        defaultValue="23:59:50"
      />
    </form>
  )
  await click(segment(host, 'second'))
  await key('{ArrowUp}')
  expect(data(host)).toBe('00:00:05')
  await click(segment(host, 'minute'))
  await key('{ArrowUp}')
  expect(data(host)).toBe('00:01:05')
  await click(segment(host, 'hour'))
  await key('{ArrowUp}{ArrowUp}')
  expect(data(host)).toBe('00:10:05')
  await key('{ArrowDown}{ArrowDown}')
  expect(data(host)).toBe('23:55:05')
  await fill(segment(host, 'second'), '06')
  expect(host.querySelector('form')!.checkValidity()).toBe(false)
  await key('{ArrowUp}')
  expect(data(host)).toBe('23:55:20')
})

test('native external form reset and required, read-only and disabled state keep form ownership', async () => {
  const tree = (mode: 'edit' | 'read' | 'disabled') => (
    <>
      <form id="shift-form" />
      <Field
        label="Shift start"
        required
        disabled={mode === 'disabled'}
      >
        <TimeInput
          form="shift-form"
          name="time"
          hourCycle="h23"
          defaultValue="08:00"
          readOnly={mode === 'read'}
        />
      </Field>
    </>
  )
  const { host, render } = await mount(tree('edit'))
  await fill(segment(host, 'hour'), '09')
  expect(data(host)).toBe('09:00')
  const form = host.querySelector('form')!
  form.addEventListener('reset', event => event.preventDefault(), { once: true })
  await act(async () => form.reset())
  await pause(10)
  expect(data(host)).toBe('09:00')
  await fill(segment(host, 'minute'), '')
  expect(form.checkValidity()).toBe(false)
  await act(async () => form.reset())
  await pause(10)
  expect(data(host)).toBe('08:00')
  await render(tree('read'))
  await click(segment(host, 'hour'))
  await key('{ArrowUp}')
  expect(data(host)).toBe('08:00')
  await render(tree('disabled'))
  expect(data(host)).toBeNull()
})

test('controlled owners can decline changes and locale or cycle overrides reformat an existing time', async () => {
  const change = vi.fn()
  const tree = (cycle: 'h12' | 'h24') => (
    <form>
      <LocaleProvider locale="fr-FR">
        <TimeInput
          aria-label="Time"
          name="time"
          hourCycle={cycle}
          value="00:30"
          onValueChange={change}
        />
      </LocaleProvider>
    </form>
  )
  const { host, render } = await mount(tree('h12'), true)
  expect(segment(host, 'hour').value).toBe('12')
  await click(segment(host, 'minute'))
  await key('{ArrowUp}')
  expect(change).toHaveBeenCalledWith('00:31')
  expect(data(host)).toBe('00:30')
  await render(tree('h24'))
  expect(segment(host, 'hour').value).toBe('24')
  expect(host.querySelector('[data-slot~="time-input-period"]')).toBeNull()
})
