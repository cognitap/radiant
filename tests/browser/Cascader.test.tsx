import { act } from 'react'
import { expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import { Cascader, Field, LocaleProvider, type TreeItem } from '../../src/index.js'
import { click, key, mount, shown } from './familyHarness.js'

const destinations: readonly TreeItem[] = [
  { value: 'disabled', label: 'Unavailable', disabled: true },
  {
    value: 'ca',
    label: 'Canada',
    children: [
      {
        value: 'bc',
        label: 'British Columbia',
        children: [{ value: 'victoria', label: 'Victoria' }]
      },
      { value: 'blocked', label: 'Unavailable region', disabled: true },
      {
        value: 'on',
        label: 'Ontario',
        children: [
          { value: 'toronto', label: 'Toronto' },
          { value: 'ottawa', label: 'Ottawa' }
        ]
      }
    ]
  },
  {
    value: 'jp',
    label: 'Japan',
    children: [{ value: 'kyoto', label: 'Kyoto' }]
  }
]

function picker(host: HTMLElement) {
  const trigger = host.querySelector<HTMLButtonElement>('[data-slot~="cascader-trigger"]')!
  const popup = host.querySelector<HTMLElement>('[data-slot~="cascader-content"]')!
  const columns = () => Array.from(popup.querySelectorAll<HTMLElement>('[role="listbox"]'))
  const option = (value: string) => popup.querySelector<HTMLElement>(`[data-value="${value}"]`)!
  const active = (column: HTMLElement) =>
    column.ownerDocument.getElementById(column.getAttribute('aria-activedescendant')!)?.dataset
      .value
  return { trigger, popup, columns, option, active }
}

test('linked listboxes keep keyboard focus and commit a leaf through a native form', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <form>
      <Field
        label="Shipping destination"
        required
      >
        <Cascader
          name="destination"
          items={destinations}
          columnLabels={['Country', 'Region', 'City']}
          onValueChange={change}
          className="w-60"
        />
      </Field>
      <button type="reset">Reset</button>
    </form>,
    true
  )
  const form = host.querySelector('form')!
  const { trigger, popup, columns, option, active } = picker(host)
  await act(async () => expect(form.reportValidity()).toBe(false))
  expect(trigger).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-invalid', 'true')
  await key('{ArrowDown}')
  expect(trigger).toHaveAttribute('aria-controls', popup.id)
  expect(popup).toHaveAccessibleName('Shipping destination')
  expect(columns()).toHaveLength(1)
  expect(columns()[0]).toHaveAccessibleName('Country')
  expect(columns()[0]).toHaveFocus()
  expect(active(columns()[0])).toBe('ca')
  expect(option('disabled')).toHaveAttribute('aria-disabled', 'true')

  await key('{ArrowRight}{ArrowDown}{ArrowRight}')
  expect(columns()).toHaveLength(3)
  expect(columns()[1]).toHaveAccessibleName('Region')
  expect(columns()[2]).toHaveAccessibleName('City')
  expect(columns()[2]).toHaveFocus()
  expect(option('on')).toHaveAttribute('aria-selected', 'true')
  expect(active(columns()[2])).toBe('toronto')
  expect(change).not.toHaveBeenCalled()
  await expect
    .poll(() => popup.getBoundingClientRect().width)
    .toBeGreaterThan(trigger.getBoundingClientRect().width)

  await key('o{Enter}')
  expect(trigger).toHaveFocus()
  expect(shown(popup)).toBe(false)
  expect(trigger).toHaveAccessibleName('Shipping destination Canada / Ontario / Ottawa')
  expect(trigger).not.toHaveAttribute('aria-invalid')
  expect(change).toHaveBeenCalledExactlyOnceWith('ottawa')
  expect(new FormData(form).get('destination')).toBe('ottawa')
  await key('{Enter}')
  expect(columns()[2]).toHaveFocus()
  expect(active(columns()[2])).toBe('ottawa')
  await act(async () => form.reset())
  await expect.poll(() => trigger.textContent).toBe('Select an item')
  expect(shown(popup)).toBe(false)
})

test('RTL reverses horizontal movement and Tab dismisses without skipping the next control', async () => {
  const { host } = await mount(
    <LocaleProvider locale="he-IL">
      <button type="button">Previous</button>
      <Cascader
        aria-label="Destination"
        items={destinations}
        defaultValue="ottawa"
        className="w-60"
      />
      <button type="button">Next</button>
    </LocaleProvider>
  )
  const { trigger, popup, columns, active, option } = picker(host)
  await click(trigger)
  expect(popup).toHaveAttribute('dir', 'rtl')
  expect(columns()[2]).toHaveFocus()
  expect(columns()[0].getBoundingClientRect().left).toBeGreaterThan(
    columns()[2].getBoundingClientRect().left
  )
  await key('{ArrowRight}{ArrowRight}{End}{ArrowLeft}')
  expect(columns()).toHaveLength(2)
  expect(columns()[1]).toHaveFocus()
  expect(active(columns()[1])).toBe('kyoto')
  expect(option('on')).toBeNull()
  await key('{Escape}')
  expect(shown(popup)).toBe(false)
  expect(trigger).toHaveFocus()

  await key('{ArrowDown}{Tab}')
  expect(shown(popup)).toBe(false)
  expect(host.querySelector('button:last-child')).toHaveFocus()
  await click(trigger)
  await click(host.querySelector<HTMLButtonElement>('button:first-child')!)
  expect(shown(popup)).toBe(false)
})

test('each async level loads independently and an error can be retried from its column', async () => {
  let deliverCountry!: (children: readonly TreeItem[]) => void
  const loadCountry = vi.fn().mockImplementation(
    () =>
      new Promise<readonly TreeItem[]>(resolve => {
        deliverCountry = resolve
      })
  )
  const loadRegion = vi
    .fn()
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce([{ value: 'city', label: 'City' }])
  const items: readonly TreeItem[] = [
    { value: 'country', label: 'Country', loadChildren: loadCountry },
    { value: 'other', label: 'Other', children: [{ value: 'other-city', label: 'Other City' }] }
  ]
  const { host } = await mount(
    <Cascader
      aria-label="Destination"
      items={items}
    />
  )
  const { trigger, columns, active, option } = picker(host)
  await click(trigger)
  await click(option('country'))
  expect(columns()[1]).toHaveAttribute('aria-busy', 'true')
  expect(columns()[1]).toHaveFocus()
  await key('{ArrowLeft}{End}{ArrowRight}')
  expect(active(columns()[1])).toBe('other-city')
  await act(async () =>
    deliverCountry([{ value: 'region', label: 'Region', loadChildren: loadRegion }])
  )
  expect(active(columns()[1])).toBe('other-city')
  expect(option('region')).toBeNull()

  await key('{ArrowLeft}{Home}{ArrowRight}')
  expect(active(columns()[1])).toBe('region')
  await key('{ArrowRight}')
  await expect.poll(() => columns()[2]?.textContent).toContain('Retry')
  expect(columns()[2]).toHaveFocus()
  await key('{Enter}')
  await expect.poll(() => active(columns()[2])).toBe('city')
  await key('{Space}')
  expect(trigger).toHaveFocus()
  expect(trigger).toHaveAccessibleName('Destination Country / Region / City')
  await click(trigger)
  expect(active(columns()[2])).toBe('city')
  expect(loadCountry).toHaveBeenCalledTimes(1)
  expect(loadRegion).toHaveBeenCalledTimes(2)
})

test('empty async branches stay branches and let users return without committing a value', async () => {
  const loadEmpty = vi.fn().mockResolvedValue([])
  const change = vi.fn()
  const items = [{ value: 'empty', label: 'Empty', loadChildren: loadEmpty }]
  const { host } = await mount(
    <Cascader
      aria-label="Destination"
      items={items}
      onValueChange={change}
    />
  )
  const { trigger, popup, columns } = picker(host)
  await click(trigger)
  await key('{ArrowRight}')
  await expect.poll(() => columns()[1]?.textContent).toBe('No options')
  expect(columns()[1]).toHaveFocus()
  await key('{Enter}{ArrowLeft}{Enter}')
  expect(shown(popup)).toBe(true)
  expect(columns()[1]).toHaveFocus()
  expect(change).not.toHaveBeenCalled()
  expect(loadEmpty).toHaveBeenCalledTimes(1)
})

function fitsViewport(popup: HTMLElement) {
  const rect = popup.getBoundingClientRect()
  expect(rect.left).toBeGreaterThanOrEqual(0)
  expect(rect.right).toBeLessThanOrEqual(innerWidth)
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(innerWidth)
}

const optionPadding = (popup: HTMLElement) =>
  getComputedStyle(popup.querySelector<HTMLElement>('[data-value="ottawa"]')!).paddingInlineStart

test('a Cascader in a narrow panel opens wide columns past the panel on a wide viewport', async () => {
  expect(innerWidth).toBeGreaterThanOrEqual(1280)
  const { host } = await mount(
    <section style={{ width: 360 }}>
      <Cascader
        aria-label="Destination"
        items={destinations}
        columnLabels={['Country', 'Region', 'City']}
        defaultValue="ottawa"
      />
    </section>
  )
  const { trigger, popup, columns } = picker(host)
  await click(trigger)
  expect(columns()).toHaveLength(3)
  await expect.poll(() => popup.getBoundingClientRect().width).toBeGreaterThan(360)
  fitsViewport(popup)
  const viewport = popup.querySelector<HTMLElement>('[data-slot~="select-viewport"]')!
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth)
  expect(optionPadding(popup)).not.toBe('8px')
})

test('columns compact when the viewport itself is narrow', async () => {
  const size = [innerWidth, innerHeight]
  await page.viewport(360, 800)
  try {
    const { host } = await mount(
      <Cascader
        aria-label="Destination"
        items={destinations}
        columnLabels={['Country', 'Region', 'City']}
        defaultValue="ottawa"
      />
    )
    const { trigger, popup, columns } = picker(host)
    await click(trigger)
    expect(columns()).toHaveLength(3)
    await expect.poll(() => popup.getBoundingClientRect().width).toBeLessThanOrEqual(360)
    fitsViewport(popup)
    expect(optionPadding(popup)).toBe('8px')
  } finally {
    await page.viewport(size[0], size[1])
  }
})
