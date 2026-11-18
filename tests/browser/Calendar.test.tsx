import { expect, test, vi } from 'vitest'
import { Calendar, LocaleProvider } from '../../src/index.js'
import { mount, click, key } from './familyHarness.js'

const day = (host: ParentNode, date: string) =>
  host.querySelector<HTMLButtonElement>('[data-date="' + date + '"]')!
const focused = () => document.activeElement?.getAttribute('data-date')

test('keyboard focus follows weeks, leap months and year boundaries without changing selection', async () => {
  const { host } = await mount(
    <Calendar
      aria-label="Day"
      locale="en-GB"
      defaultValue="2024-01-31"
    />,
    true
  )
  day(host, '2024-01-31').focus()
  await key('{PageDown}')
  expect(focused()).toBe('2024-02-29')
  await key('{Home}')
  expect(focused()).toBe('2024-02-26')
  await key('{End}')
  expect(focused()).toBe('2024-03-03')
  await key('{ArrowDown}{ArrowLeft}{ArrowUp}{ArrowRight}')
  expect(focused()).toBe('2024-03-03')
  await key('{PageUp}{Enter}')
  expect(focused()).toBe('2024-02-03')
  expect(day(host, '2024-02-03').parentElement?.getAttribute('aria-selected')).toBe('true')
  expect(host.querySelectorAll('tbody [tabindex="0"]')).toHaveLength(1)
})

test('range selection can run backwards and starts again beyond a disabled day', async () => {
  const { host } = await mount(
    <Calendar
      aria-label="Stay"
      type="range"
      today="2026-11-10"
      min="2026-11-03"
      max="2026-11-28"
      isDateDisabled={date => date === '2026-11-15'}
    />
  )
  const selected = () =>
    [...host.querySelectorAll('[aria-selected="true"] button')].map(el =>
      el.getAttribute('data-date')
    )
  await click(day(host, '2026-11-12'))
  await click(day(host, '2026-11-10'))
  expect(selected()).toEqual(['2026-11-10', '2026-11-11', '2026-11-12'])
  await click(day(host, '2026-11-13'))
  await click(day(host, '2026-11-17'))
  expect(selected()).toEqual(['2026-11-17'])
  await key('{ArrowLeft}{ArrowLeft}{Enter}')
  expect(focused()).toBe('2026-11-15')
  expect(day(host, '2026-11-29').disabled).toBe(true)
  expect(selected()).toEqual(['2026-11-17'])
  expect(
    host.querySelectorAll(
      '[data-slot~="calendar-previous"]:disabled, [data-slot~="calendar-next"]:disabled'
    )
  ).toHaveLength(2)
})

test('controlled selections remain owned by the caller and RTL arrows use the host direction', async () => {
  const request = vi.fn()
  const { host } = await mount(
    <LocaleProvider locale="ar-EG">
      <Calendar
        aria-label="Day"
        locale="en-GB"
        value="2026-11-18"
        onValueChange={request}
      />
    </LocaleProvider>,
    true
  )
  expect(host.querySelector('th')?.abbr).toBe('Monday')
  day(host, '2026-11-18').focus()
  await key('{ArrowLeft}{Enter}')
  expect(focused()).toBe('2026-11-19')
  expect(request).toHaveBeenCalledWith('2026-11-19')
  expect(day(host, '2026-11-18').parentElement?.getAttribute('aria-selected')).toBe('true')
})
