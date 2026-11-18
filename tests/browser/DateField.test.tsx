import { act, createRef } from 'react'
import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { DateField, Field, LocaleProvider } from '../../src/index.js'
import { click, key, mount, pause } from './familyHarness.js'

test('localized keyboard entry uses Field relationships, date constraints and native form reset', async () => {
  const first = createRef<HTMLInputElement>()
  const change = vi.fn()
  const { host } = await mount(
    <>
      <form id="invoice-form" />
      <LocaleProvider locale="fr-FR">
        <Field
          label="Facturation"
          description="Jour, mois et année"
          required
        >
          <DateField
            ref={first}
            form="invoice-form"
            name="invoiceDate"
            min="2028-02-01"
            onValueChange={change}
          />
        </Field>
      </LocaleProvider>
    </>,
    true
  )
  const form = host.querySelector('form')!
  const day = first.current!
  expect(day.dataset.segment).toBe('day')
  expect(host.querySelector('label')?.control).toBe(day)
  expect(day).toHaveAccessibleDescription('Jour, mois et année')
  expect(form.checkValidity()).toBe(false)
  await click(day)
  await key('29022028')
  expect(document.activeElement).toHaveAttribute('data-segment', 'year')
  expect(change).toHaveBeenLastCalledWith('2028-02-29')
  expect(new FormData(form).getAll('invoiceDate')).toEqual(['2028-02-29'])
  await act(async () => userEvent.fill(document.activeElement as HTMLElement, '2027'))
  expect(form.checkValidity()).toBe(false)
  expect(new FormData(form).get('invoiceDate')).toBe('')
  await act(async () => form.reset())
  await pause(15)
  expect(day.value).toBe('')
  expect(change).toHaveBeenCalledTimes(1)
})

test('RTL respects the locale and submits a controlled ISO civil date', async () => {
  const { host } = await mount(
    <form dir="rtl">
      <LocaleProvider locale="ar-EG">
        <DateField
          aria-label="تاريخ الفاتورة"
          name="date"
          value="2028-02-29"
          readOnly
        />
      </LocaleProvider>
    </form>
  )
  const group = host.querySelector<HTMLElement>('[data-slot~=date-field]')!
  expect(group).toHaveAccessibleName('تاريخ الفاتورة')
  expect(getComputedStyle(group).direction).toBe('rtl')
  expect(group.querySelector('[data-segment=year]')).toHaveValue('٢٠٢٨')
  expect(new FormData(host.querySelector('form')!).get('date')).toBe('2028-02-29')
})
