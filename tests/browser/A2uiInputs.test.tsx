import { act } from 'react'
import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  A2UI_BASIC_CATALOG_ID,
  A2UI_PROTOCOL_VERSION,
  A2uiSurface,
  validateA2uiAccessibility,
  type A2uiActionPayload,
  type A2uiMessage,
  type CatalogDiagnostic
} from '../../src/a2ui/index.js'
import {
  TRIP_SURFACE_ID,
  tripRequestFixtureMessages,
  tripRequestRejectionMessages
} from '../../src/a2ui/inputFixtures.js'
import { mount } from './familyHarness.js'

const labelled = (host: HTMLElement, label: string) => {
  const labelEl = Array.from(host.querySelectorAll('label')).find(
    el => el.textContent?.trim() === label
  )
  if (!labelEl?.htmlFor) throw new Error(`No control labelled "${label}".`)
  return host.ownerDocument.getElementById(labelEl.htmlFor) as HTMLInputElement
}

test('DateTimeInput renders a native date, time, or datetime-local Radiant Input with bounds', async () => {
  const { host } = await mount(
    <A2uiSurface
      surfaceId={TRIP_SURFACE_ID}
      messages={tripRequestFixtureMessages}
    />,
    true
  )

  const date = labelled(host, 'Departure date')
  const time = labelled(host, 'Earliest departure time')
  const both = labelled(host, 'Return flight')
  for (const input of [date, time, both]) expect(input.matches('[data-slot~="input"]')).toBe(true)
  expect(date.type).toBe('date')
  expect(date.min).toBe('2026-01-01')
  expect(date.max).toBe('2027-12-31')
  expect(time.type).toBe('time')
  expect(both.type).toBe('datetime-local')
})

test('DateTimeInput trims ISO values for the native input and defaults to a date', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const { host } = await mount(
    <A2uiSurface
      surfaceId="s_dt"
      onDiagnostic={d => diagnostics.push(d)}
      messages={[
        {
          version: A2UI_PROTOCOL_VERSION,
          createSurface: {
            surfaceId: 's_dt',
            catalogId: A2UI_BASIC_CATALOG_ID,
            dataModel: { at: '2026-03-14T09:30:15' },
            components: [
              { id: 'root', component: 'Column', children: ['d', 't', 'dt', 'plain'] },
              {
                id: 'd',
                component: 'DateTimeInput',
                label: 'D',
                enableDate: true,
                value: { '@path': '/at' }
              },
              {
                id: 't',
                component: 'DateTimeInput',
                label: 'T',
                enableTime: true,
                value: { '@path': '/at' }
              },
              {
                id: 'dt',
                component: 'DateTimeInput',
                label: 'DT',
                enableDate: true,
                enableTime: true,
                min: '2026-01-01T00:00:00',
                value: { '@path': '/at' }
              },
              { id: 'plain', component: 'DateTimeInput', label: 'Plain', value: '' }
            ]
          }
        }
      ]}
    />
  )
  expect(labelled(host, 'D').value).toBe('2026-03-14')
  expect(labelled(host, 'T').value).toBe('09:30')
  expect(labelled(host, 'DT').value).toBe('2026-03-14T09:30')
  expect(labelled(host, 'DT').min).toBe('2026-01-01T00:00')
  expect(labelled(host, 'Plain').type).toBe('date')
  expect(diagnostics.filter(d => d.kind === 'error')).toEqual([])
})

test('edits write to bound paths at once and reach the agent only through the action context', async () => {
  const onAction = vi.fn<(event: A2uiActionPayload) => void>()
  const messages: A2uiMessage[] = [
    ...tripRequestFixtureMessages,
    {
      version: A2UI_PROTOCOL_VERSION,
      updateComponents: {
        surfaceId: TRIP_SURFACE_ID,
        components: [
          {
            id: 'root',
            component: 'Column',
            children: [
              'traveler_field',
              'departure_date',
              'departure_time',
              'return_at',
              'echo',
              'submit_button'
            ]
          },
          { id: 'echo', component: 'Text', text: { '@path': '/trip/departureDate' } }
        ]
      }
    }
  ]
  const { host } = await mount(
    <A2uiSurface
      surfaceId={TRIP_SURFACE_ID}
      messages={messages}
      onAction={onAction}
    />
  )
  // The echo is the only body Text; the button label renders inline.
  const echo = () => host.querySelector('p[data-slot="a2ui-text"]')!.textContent

  await act(async () => {
    await userEvent.fill(labelled(host, 'Traveler name'), 'Ada Lovelace')
    await userEvent.fill(labelled(host, 'Departure date'), '2026-03-14')
  })
  // Another component bound to the same path sees the edit with no round trip
  expect(echo()).toBe('2026-03-14')
  await act(async () => {
    await userEvent.fill(labelled(host, 'Earliest departure time'), '07:15')
    await userEvent.fill(labelled(host, 'Return flight'), '2026-03-20T18:45')
  })
  expect(onAction).not.toHaveBeenCalled()

  await act(async () => {
    await userEvent.click(host.querySelector<HTMLButtonElement>('button[data-slot~="button"]')!)
  })
  expect(onAction).toHaveBeenCalledTimes(1)
  expect(onAction.mock.calls[0]![0].context).toMatchObject({
    traveler: 'Ada Lovelace',
    email: 'ada@example.com',
    departureDate: '2026-03-14',
    departureTime: '07:15',
    returnAt: '2026-03-20T18:45',
    cabin: ['economy'],
    extras: [],
    bags: 1,
    acceptRules: false
  })
})

test('failed checks show their message as a Field error referenced by the invalid control', async () => {
  const view = await mount(
    <A2uiSurface
      surfaceId={TRIP_SURFACE_ID}
      messages={tripRequestFixtureMessages}
    />
  )
  expect(view.host.querySelector('[data-slot="field-error"]')).toBeNull()
  expect(view.host.querySelector('[aria-invalid="true"]')).toBeNull()

  await view.render(
    <A2uiSurface
      surfaceId={TRIP_SURFACE_ID}
      messages={[...tripRequestFixtureMessages, ...tripRequestRejectionMessages]}
    />
  )

  const errors = Array.from(view.host.querySelectorAll<HTMLElement>('[data-slot="field-error"]'))
  expect(errors.map(e => e.textContent)).toEqual([
    'Enter the name shown on the passport.',
    'Only March 20 has seats left.',
    'No flights leave that early.',
    'Return after the departure.',
    'Business is sold out on this date.',
    'Wi-Fi is not offered on this route.',
    'This fare allows two bags.',
    'Accept the fare rules to book.'
  ])
  for (const error of errors) {
    expect(error.id).not.toBe('')
    const described = Array.from(view.host.querySelectorAll('[aria-describedby]')).filter(el =>
      el.getAttribute('aria-describedby')!.split(' ').includes(error.id)
    )
    expect(described.length, error.textContent!).toBeGreaterThan(0)
    for (const el of described) expect(el.getAttribute('aria-invalid')).toBe('true')
  }
  // Single-control fields put the relationship on the input itself
  for (const label of [
    'Traveler name',
    'Departure date',
    'Earliest departure time',
    'Return flight'
  ]) {
    const input = labelled(view.host, label)
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toMatch(/-error\b/)
  }
})

test('every ChoicePicker style puts the invalid state and error on each option, not the group', async () => {
  const picker = (id: string, extra: Record<string, unknown>) => ({
    id,
    component: 'ChoicePicker',
    label: id,
    options: [
      { label: 'Economy', value: 'economy' },
      { label: 'Business', value: 'business' }
    ],
    value: [],
    checks: [{ condition: { '@path': '/ok' }, message: `${id} is required.` }],
    ...extra
  })
  const { host } = await mount(
    <A2uiSurface
      surfaceId="s_choice"
      messages={[
        {
          version: A2UI_PROTOCOL_VERSION,
          createSurface: {
            surfaceId: 's_choice',
            catalogId: A2UI_BASIC_CATALOG_ID,
            dataModel: { ok: false },
            components: [
              {
                id: 'root',
                component: 'Column',
                children: ['Single', 'Multiple', 'SingleChips', 'MultipleChips']
              },
              picker('Single', { variant: 'mutuallyExclusive' }),
              picker('Multiple', { variant: 'multipleSelection' }),
              picker('SingleChips', { variant: 'mutuallyExclusive', displayStyle: 'chips' }),
              picker('MultipleChips', {
                variant: 'multipleSelection',
                displayStyle: 'chips',
                filterable: true
              })
            ]
          }
        }
      ]}
    />
  )
  const groups = [...host.querySelectorAll('fieldset')]
  expect(groups).toHaveLength(4)
  for (const group of groups) {
    const name = group.querySelector('legend')!.textContent
    const options = [
      ...group.querySelectorAll('input[type="radio"], input[type="checkbox"], button')
    ]
    expect(options, name!).toHaveLength(2)
    expect(group.hasAttribute('aria-invalid'), name!).toBe(false)
    expect(group.hasAttribute('aria-describedby'), name!).toBe(false)
    for (const option of options) {
      expect(option, name!).toHaveAttribute('aria-invalid', 'true')
      expect(option, name!).toHaveAccessibleDescription(`${name} is required.`)
    }
  }
  const filter = host.querySelector('input[type="search"]')!
  expect(filter.hasAttribute('aria-invalid')).toBe(false)
  expect(filter.hasAttribute('aria-describedby')).toBe(false)
})

test('every input in the trip fixture passes accessibility validation', () => {
  expect(validateA2uiAccessibility(tripRequestFixtureMessages).errors).toEqual([])
  const unlabeled = validateA2uiAccessibility([
    {
      version: A2UI_PROTOCOL_VERSION,
      createSurface: {
        surfaceId: 's',
        catalogId: A2UI_BASIC_CATALOG_ID,
        components: [{ id: 'when', component: 'DateTimeInput', value: '' }]
      }
    }
  ])
  expect(unlabeled.errors.map(e => e.rule)).toEqual(['control-label'])
})

const surface = (
  components: readonly Record<string, unknown>[],
  dataModel: Record<string, unknown>
): A2uiMessage => ({
  version: A2UI_PROTOCOL_VERSION,
  createSurface: {
    surfaceId: 's_inputs',
    catalogId: A2UI_BASIC_CATALOG_ID,
    dataModel,
    components: [
      { id: 'root', component: 'Column', children: components.map(c => c.id) },
      ...components
    ]
  }
})

const fieldError = (host: HTMLElement, label: string) =>
  labelled(host, label).closest('[data-slot~="field"]')?.querySelector('[data-slot="field-error"]')
    ?.textContent ?? null

test('basic-catalog required and email checks fail and pass as the user types', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const { host } = await mount(
    <A2uiSurface
      surfaceId={TRIP_SURFACE_ID}
      messages={tripRequestFixtureMessages}
      onDiagnostic={d => diagnostics.push(d)}
    />
  )
  const email = labelled(host, 'Contact email')
  expect(fieldError(host, 'Contact email')).toBeNull()

  await act(async () => userEvent.clear(email))
  expect(fieldError(host, 'Contact email')).toBe('This field is required.')
  expect(email.getAttribute('aria-invalid')).toBe('true')

  await act(async () => userEvent.type(email, 'ada'))
  expect(fieldError(host, 'Contact email')).toBe('Enter a valid email address.')

  await act(async () => userEvent.type(email, '@example.org'))
  expect(fieldError(host, 'Contact email')).toBeNull()
  expect(email.hasAttribute('aria-invalid')).toBe(false)
  expect(diagnostics.filter(d => d.kind === 'error')).toEqual([])
})

test('a composed and check uses its own message and formatString reads the data model', async () => {
  const value = { '@path': '/code' }
  const { host } = await mount(
    <A2uiSurface
      surfaceId="s_inputs"
      messages={[
        surface(
          [
            {
              id: 'code_field',
              component: 'TextField',
              label: 'Invite code',
              value,
              checks: [
                {
                  condition: {
                    '@call': 'and',
                    args: {
                      values: [
                        { '@call': 'required', args: { value } },
                        { '@call': 'length', args: { value, min: 6, max: 6 } }
                      ]
                    }
                  },
                  message: 'Codes have six characters.'
                }
              ]
            },
            {
              id: 'code_echo',
              component: 'Text',
              text: { '@call': 'formatString', args: { value: 'Code: ${/code}' } }
            }
          ],
          { code: 'ABC' }
        )
      ]}
    />
  )
  expect(fieldError(host, 'Invite code')).toBe('Codes have six characters.')
  await act(async () => userEvent.type(labelled(host, 'Invite code'), 'DEF'))
  expect(fieldError(host, 'Invite code')).toBeNull()
  expect(host.querySelector('p[data-slot="a2ui-text"]')!.textContent).toBe('Code: ABCDEF')
})

test('omits openUrl and reports an unknown function call once', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  await mount(
    <A2uiSurface
      surfaceId="s_inputs"
      onDiagnostic={d => diagnostics.push(d)}
      messages={[
        surface(
          [
            {
              id: 'link_field',
              component: 'TextField',
              label: 'Link',
              value: { '@path': '/link' },
              checks: [{ condition: { '@call': 'openUrl', args: { url: 'https://example.com' } } }]
            }
          ],
          { link: '' }
        )
      ]}
    />
  )
  expect(diagnostics.filter(d => d.kind === 'error').map(d => d.code)).toEqual(['EXPRESSION_ERROR'])
})

const isoUtc = (d: Date) => `${d.toISOString().slice(0, 19)}Z`
const local = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    time: `${p(d.getHours())}:${p(d.getMinutes())}`
  }
}

test('DateTimeInput shows zoned values in local time and writes edits back in UTC', async () => {
  const onAction = vi.fn<(event: A2uiActionPayload) => void>()
  const at = { '@path': '/at' }
  const { host } = await mount(
    <A2uiSurface
      surfaceId="s_inputs"
      onAction={onAction}
      messages={[
        surface(
          [
            {
              id: 'z_date',
              component: 'DateTimeInput',
              label: 'Z date',
              enableDate: true,
              value: at
            },
            {
              id: 'z_time',
              component: 'DateTimeInput',
              label: 'Z time',
              enableTime: true,
              value: at
            },
            {
              id: 'z_both',
              component: 'DateTimeInput',
              label: 'Z both',
              enableDate: true,
              enableTime: true,
              value: at
            },
            {
              id: 'send',
              component: 'Button',
              child: 'send_label',
              action: { event: { name: 'send', context: { at } } }
            },
            { id: 'send_label', component: 'Text', text: 'Send' }
          ],
          { at: '2026-03-14T09:30:15+02:00' }
        )
      ]}
    />
  )
  const shown = local(new Date('2026-03-14T09:30:15+02:00'))
  expect(labelled(host, 'Z date').value).toBe(shown.date)
  expect(labelled(host, 'Z time').value).toBe(shown.time)
  expect(labelled(host, 'Z both').value).toBe(`${shown.date}T${shown.time}`)

  const send = async () => {
    await act(async () => userEvent.click(host.querySelector('button')!))
    return onAction.mock.calls.at(-1)![0].context.at
  }
  await act(async () => userEvent.fill(labelled(host, 'Z both'), '2026-03-20T18:45'))
  expect(await send()).toBe(isoUtc(new Date(2026, 2, 20, 18, 45, 15)))
  await act(async () => userEvent.fill(labelled(host, 'Z time'), '07:05'))
  expect(await send()).toBe(isoUtc(new Date(2026, 2, 20, 7, 5, 15)))
  await act(async () => userEvent.fill(labelled(host, 'Z date'), '2026-04-01'))
  expect(await send()).toBe(isoUtc(new Date(2026, 3, 1, 7, 5, 15)))
})

test('DateTimeInput keeps floating values floating and accepts space-separated values', async () => {
  const onAction = vi.fn<(event: A2uiActionPayload) => void>()
  const at = { '@path': '/at' }
  const { host } = await mount(
    <A2uiSurface
      surfaceId="s_inputs"
      onAction={onAction}
      messages={[
        surface(
          [
            {
              id: 'f_both',
              component: 'DateTimeInput',
              label: 'F both',
              enableDate: true,
              enableTime: true,
              value: at
            },
            {
              id: 'send',
              component: 'Button',
              child: 'send_label',
              action: { event: { name: 'send', context: { at } } }
            },
            { id: 'send_label', component: 'Text', text: 'Send' }
          ],
          { at: '2026-03-14 09:30:15' }
        )
      ]}
    />
  )
  expect(labelled(host, 'F both').value).toBe('2026-03-14T09:30')
  await act(async () => userEvent.fill(labelled(host, 'F both'), '2026-03-20T18:45'))
  await act(async () => userEvent.click(host.querySelector('button')!))
  expect(onAction.mock.calls[0]![0].context.at).toBe('2026-03-20T18:45')
})

test('DateTimeInput maps date bounds onto date-time inputs and drops dated bounds on times', async () => {
  const { host } = await mount(
    <A2uiSurface
      surfaceId="s_inputs"
      messages={[
        surface(
          [
            {
              id: 'b_both',
              component: 'DateTimeInput',
              label: 'B both',
              enableDate: true,
              enableTime: true,
              min: '2026-03-01',
              max: '2026-03-31',
              value: ''
            },
            {
              id: 'b_time',
              component: 'DateTimeInput',
              label: 'B time',
              enableTime: true,
              min: '2026-03-01T08:00',
              max: '18:30',
              value: ''
            },
            {
              id: 'b_space',
              component: 'DateTimeInput',
              label: 'B space',
              enableDate: true,
              enableTime: true,
              min: '2026-03-01 08:00',
              value: ''
            }
          ],
          {}
        )
      ]}
    />
  )
  expect(labelled(host, 'B both').min).toBe('2026-03-01T00:00')
  expect(labelled(host, 'B both').max).toBe('2026-03-31T23:59')
  expect(labelled(host, 'B time').hasAttribute('min')).toBe(false)
  expect(labelled(host, 'B time').max).toBe('18:30')
  expect(labelled(host, 'B space').min).toBe('2026-03-01T08:00')
})

test('an agent updateDataModel on a bound path updates date and date-time inputs', async () => {
  const view = await mount(
    <A2uiSurface
      surfaceId={TRIP_SURFACE_ID}
      messages={tripRequestFixtureMessages}
    />
  )
  const patch = (path: string, value: string): A2uiMessage => ({
    version: A2UI_PROTOCOL_VERSION,
    updateDataModel: { surfaceId: TRIP_SURFACE_ID, path, value }
  })
  await view.render(
    <A2uiSurface
      surfaceId={TRIP_SURFACE_ID}
      messages={[
        ...tripRequestFixtureMessages,
        patch('/trip/departureDate', '2026-05-02'),
        patch('/trip/returnAt', '2026-05-09T20:10')
      ]}
    />
  )
  expect(labelled(view.host, 'Departure date').value).toBe('2026-05-02')
  expect(labelled(view.host, 'Return flight').value).toBe('2026-05-09T20:10')
})
