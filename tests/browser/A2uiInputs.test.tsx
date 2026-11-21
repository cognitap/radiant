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
            dataModel: { at: '2026-03-14T09:30:15Z' },
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
                min: '2026-01-01T00:00:00Z',
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
            children: ['traveler_field', 'departure_date', 'return_at', 'echo', 'submit_button']
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
  const echo = () => host.querySelector('[data-slot="a2ui-text"]')!.textContent

  await act(async () => {
    await userEvent.fill(labelled(host, 'Traveler name'), 'Ada Lovelace')
    await userEvent.fill(labelled(host, 'Departure date'), '2026-03-14')
  })
  // Another component bound to the same path sees the edit with no round trip
  expect(echo()).toBe('2026-03-14')
  await act(async () => {
    await userEvent.fill(labelled(host, 'Return flight'), '2026-03-20T18:45')
  })
  expect(onAction).not.toHaveBeenCalled()

  await act(async () => {
    await userEvent.click(host.querySelector<HTMLButtonElement>('button[data-slot~="button"]')!)
  })
  expect(onAction).toHaveBeenCalledTimes(1)
  expect(onAction.mock.calls[0]![0].context).toMatchObject({
    traveler: 'Ada Lovelace',
    departureDate: '2026-03-14',
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
    'Choose a date with seats left.',
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
