import { act } from 'react'
import { expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  Autocomplete,
  Combobox,
  getLocaleAttributes,
  LocaleProvider,
  NumberField,
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
  Select
} from '../../src/index.js'
import { click, key, mount } from './familyHarness.js'

test('omission preserves native direction while a changing scope keeps its host and values', async () => {
  const tree = (locale?: string) => (
    <section {...getLocaleAttributes('he-IL')}>
      <LocaleProvider scope="document">
        <form>
          <LocaleProvider locale={locale}>
            <NumberField
              aria-label="Amount"
              name="amount"
              defaultValue={1.5}
            />
            <NumberField
              aria-label="Override"
              defaultValue={1.5}
              locale="de-DE"
            />
          </LocaleProvider>
        </form>
      </LocaleProvider>
    </section>
  )
  const { host, render } = await mount(tree(), true)
  const form = host.querySelector('form')!
  const scope = form.firstElementChild!
  const amount = host.querySelector<HTMLInputElement>('input[aria-label="Amount"]')!
  const override = host.querySelector<HTMLInputElement>('input[aria-label="Override"]')!
  expect(host.querySelector('section > form')).toBe(form)
  expect(scope.getAttribute('lang')).toBeNull()
  expect(getComputedStyle(amount).direction).toBe('rtl')
  expect(amount.value).toBe('1.5')
  expect(override.value).toBe('1,5')
  expect(getComputedStyle(override).direction).toBe('rtl')

  await render(tree('fr-FR'))
  expect(form.firstElementChild).toBe(scope)
  expect(scope.getAttribute('lang')).toBe('fr-FR')
  expect(getComputedStyle(amount).direction).toBe('ltr')
  expect(amount.value).toBe('1,5')
  expect(new FormData(form).get('amount')).toBe('1.5')

  await render(tree('qaa'))
  expect(scope.getAttribute('lang')).toBe('qaa')
  expect(amount.value).toBe('1.5')
  await render(tree())
  expect(scope.getAttribute('lang')).toBeNull()
  expect(getComputedStyle(amount).direction).toBe('rtl')
})

test('a local portal follows the anchor language and direction across a native ancestor', async () => {
  const tree = (lang: string, dir: 'ltr' | 'rtl') => (
    <LocaleProvider locale="he-IL">
      <Popover>
        <span
          lang={lang}
          dir={dir}
        >
          <PopoverTrigger>Details</PopoverTrigger>
        </span>
        <PopoverPortal>
          <PopoverContent motion="off">Popup content</PopoverContent>
        </PopoverPortal>
      </Popover>
    </LocaleProvider>
  )
  const { host, render } = await mount(tree('fr-FR', 'ltr'))
  await click(host.querySelector('button')!)
  const popup = host.querySelector<HTMLElement>('[popover]')!
  expect(popup.matches(':popover-open')).toBe(true)
  expect(popup.parentElement?.getAttribute('lang')).toBe('he-IL')
  expect(popup.lang).toBe('fr-FR')
  expect(getComputedStyle(popup).direction).toBe('ltr')

  await render(tree('ar-EG', 'rtl'))
  await expect.poll(() => popup.lang).toBe('ar-EG')
  expect(getComputedStyle(popup).direction).toBe('rtl')
})

const cities = [
  { value: 'disabled', label: 'Isparta', disabled: true },
  { value: 'izmir', label: 'İzmir' },
  { value: 'igdir', label: 'Iğdır' }
]

test('Select uses the scoped locale for case matching and skips disabled entries', async () => {
  const { host } = await mount(
    <LocaleProvider locale="tr-TR">
      <Select items={cities} />
    </LocaleProvider>
  )
  await click(host.querySelector('button')!)
  await key('I')
  expect(host.ownerDocument.activeElement?.textContent).toContain('Iğdır')
})

test('editable searches use scoped matching and keep custom filters', async () => {
  const { host } = await mount(
    <LocaleProvider locale="tr-TR">
      <Combobox items={cities} />
      <Autocomplete
        items={cities}
        filter={item => item.value === 'izmir'}
      />
    </LocaleProvider>
  )
  const [combobox, autocomplete] = host.querySelectorAll<HTMLInputElement>('input[role="combobox"]')
  const options = () =>
    Array.from(host.querySelectorAll(':popover-open [role="option"]'), item =>
      item.getAttribute('data-value')
    )
  await act(async () => userEvent.fill(combobox, 'ız'))
  expect(options()).toEqual([])
  await act(async () => userEvent.fill(combobox, 'iz'))
  expect(options()).toEqual(['izmir'])
  await act(async () => userEvent.fill(autocomplete, 'anything'))
  expect(options()).toEqual(['izmir'])
})
