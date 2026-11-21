import { act, StrictMode, type ComponentProps } from 'react'
import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  A2UI_BASIC_CATALOG_ID,
  A2UI_PROTOCOL_VERSION,
  A2uiSurface,
  createA2uiRegistry,
  createA2uiRegistryEntry,
  radiantA2uiRegistry,
  type A2uiActionPayload,
  type A2uiMessage,
  type CatalogDiagnostic
} from '../../src/a2ui/index.js'
import { summarizeCatalogDiagnostics } from '../../src/catalog/index.js'
import {
  interactivePreferencesFixtureMessages,
  malformedProfileFixtureMessages,
  PREFERENCES_SURFACE_ID,
  PROFILE_SURFACE_ID,
  profileFixtureMessages,
  profileFixtureWithThemeHintMessages
} from '../../src/a2ui/fixtures.js'
import { Input, ThemeScope, defaultTheme } from '../../src/index.js'
import { themes } from '../../src/examples/index.js'
import { mount } from './familyHarness.js'

test('renders the A2UI 1.0 tracer-bullet fixture with Radiant Field, Input, Button and Text, and hydrates cleanly', async () => {
  const onAction = vi.fn<(action: A2uiActionPayload) => void>()
  const { host } = await mount(
    <StrictMode>
      <A2uiSurface
        surfaceId={PROFILE_SURFACE_ID}
        messages={profileFixtureMessages}
        onAction={onAction}
      />
    </StrictMode>,
    true
  )

  expect(host.querySelector('[data-slot="a2ui-surface"]')).not.toBeNull()
  expect(host.textContent).toContain('Update how your name appears across shared workspaces.')
  expect(host.textContent).toContain('Changes apply immediately after saving.')

  const field = host.querySelector('[data-slot~="field"]')
  const input = host.querySelector<HTMLInputElement>('input[data-slot~="input"]')
  const label = host.querySelector<HTMLLabelElement>('label[data-slot~="field-label"]')
  const button = host.querySelector<HTMLButtonElement>('button[data-slot~="button"]')

  expect(field).not.toBeNull()
  expect(input).not.toBeNull()
  expect(label).not.toBeNull()
  expect(button).not.toBeNull()
  expect(label!.htmlFor).toBe(input!.id)
  expect(input!.value).toBe('Ada Lovelace')
  expect(button!.textContent).toBe('Save profile')

  // Typing updates the A2UI data model and the Button's action context carries the new value
  await act(async () => {
    input!.focus()
    await userEvent.clear(input!)
    await userEvent.type(input!, 'Grace Hopper')
  })
  expect(input!.value).toBe('Grace Hopper')

  await act(async () => {
    await userEvent.click(button!)
  })
  expect(onAction).toHaveBeenCalledTimes(1)
  const payload = onAction.mock.calls[0]![0]
  expect(payload.action).toBe('save_profile')
  expect(payload.name).toBe('save_profile')
  expect(payload.surfaceId).toBe(PROFILE_SURFACE_ID)
  expect(payload.nodeId).toBe('save_button')
  expect(payload.sourceComponentId).toBe('save_button')
  expect(payload.state).toEqual({ profile: { displayName: 'Grace Hopper' } })
  expect(payload.context).toEqual({ displayName: 'Grace Hopper' })
})

test('follows the surrounding ThemeScope and ignores agent-supplied theme hints', async () => {
  const ticketTheme = themes.find(theme => theme.id === 'ticket')!
  const { host } = await mount(
    <div style={{ display: 'grid', gap: '1rem' }}>
      <ThemeScope
        theme={defaultTheme}
        mode="light"
      >
        <div data-testid="default-scope">
          <A2uiSurface
            surfaceId={PROFILE_SURFACE_ID}
            messages={profileFixtureWithThemeHintMessages}
          />
        </div>
      </ThemeScope>
      <ThemeScope
        theme={ticketTheme}
        mode="light"
      >
        <div data-testid="ticket-scope">
          <A2uiSurface
            surfaceId={PROFILE_SURFACE_ID}
            messages={profileFixtureWithThemeHintMessages}
          />
        </div>
      </ThemeScope>
    </div>
  )

  const defaultButton = host.querySelector<HTMLButtonElement>(
    '[data-testid="default-scope"] button[data-slot~="button"]'
  )!
  const ticketButton = host.querySelector<HTMLButtonElement>(
    '[data-testid="ticket-scope"] button[data-slot~="button"]'
  )!

  const defaultStyle = getComputedStyle(defaultButton)
  const ticketStyle = getComputedStyle(ticketButton)

  // Surrounding ThemeScope controls the rendered Button accent fill
  expect(defaultStyle.backgroundColor).not.toBe(ticketStyle.backgroundColor)
  // Agent theme hints (#ff00ff -> rgb(255, 0, 255) and Comic Sans MS) must never be applied
  expect(defaultStyle.backgroundColor).not.toBe('rgb(255, 0, 255)')
  expect(ticketStyle.backgroundColor).not.toBe('rgb(255, 0, 255)')
  expect(defaultStyle.fontFamily).not.toContain('Comic Sans')
  expect(ticketStyle.fontFamily).not.toContain('Comic Sans')
})

test('coerces invalid props, missing required props, and mixed state without throwing and reports structured diagnostics', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const onAction = vi.fn<(action: A2uiActionPayload) => void>()

  const { host } = await mount(
    <StrictMode>
      <A2uiSurface
        surfaceId={PROFILE_SURFACE_ID}
        messages={malformedProfileFixtureMessages}
        onAction={onAction}
        onDiagnostic={d => diagnostics.push(d)}
      />
    </StrictMode>
  )

  expect(host.textContent).toContain('42')
  expect(host.textContent).toContain('Workspace settings remain available.')

  const input = host.querySelector<HTMLInputElement>('input[data-slot~="input"]')!
  const label = host.querySelector<HTMLLabelElement>('label[data-slot~="field-label"]')!
  const button = host.querySelector<HTMLButtonElement>('button[data-slot~="button"]')!

  expect(label.textContent).toContain('Name field')
  expect(input.value).toBe('Ada Lovelace')

  // Coerced surface stays fully interactive
  await act(async () => {
    input.focus()
    await userEvent.clear(input)
    await userEvent.type(input, 'Katherine Johnson')
    await userEvent.click(button)
  })
  expect(onAction).toHaveBeenCalledTimes(1)
  expect(onAction.mock.calls[0]![0].context).toEqual({ displayName: 'Katherine Johnson' })

  // Every diagnostic names nodeId, prop, received, and used
  expect(diagnostics.length).toBeGreaterThanOrEqual(9)
  expect(diagnostics).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: 'coerced',
        nodeId: 'intro_text',
        component: 'Text',
        prop: 'variant',
        received: 'giant',
        used: 'body'
      }),
      expect.objectContaining({
        kind: 'defaulted',
        nodeId: 'name_field',
        component: 'TextField',
        prop: 'label',
        received: undefined,
        used: 'Name field'
      }),
      expect.objectContaining({
        kind: 'coerced',
        nodeId: 'name_field',
        component: 'TextField',
        prop: 'defaultValue',
        received: 'Grace Hopper',
        used: undefined
      }),
      expect.objectContaining({
        kind: 'stripped',
        nodeId: 'intro_text',
        component: 'Text',
        prop: 'className',
        received: 'bg-red-500',
        used: undefined
      }),
      expect.objectContaining({
        kind: 'fallback',
        nodeId: 'unknown_banner',
        component: 'PromoBanner',
        prop: 'component',
        received: 'PromoBanner',
        used: 'Text'
      })
    ])
  )

  const summary = summarizeCatalogDiagnostics(diagnostics)
  expect(summary.total).toBe(diagnostics.length)
  expect(summary.defaults).toBe(1)
  expect(summary.stripped).toBe(2)
  expect(summary.fallbacks).toBe(1)
  expect(summary.coercions).toBeGreaterThanOrEqual(5)
})

test('isolates a throwing node inside its error boundary, falls back to its text content, and keeps siblings mounted', async () => {
  function ThrowingWidget(): never {
    throw new Error('Simulated widget failure')
  }

  const failingEntry = createA2uiRegistryEntry({
    name: 'ExplodingNote',
    component: ThrowingWidget,
    description: 'Test component that throws during React render.',
    schema: {
      type: 'object',
      properties: {
        component: { const: 'ExplodingNote' },
        text: { type: 'string' }
      },
      required: ['component', 'text']
    },
    adapter: () => <ThrowingWidget />
  })

  const customRegistry = createA2uiRegistry({
    catalogId: radiantA2uiRegistry.catalogId,
    title: 'Test registry with failing entry',
    description: 'Registry used to test per-node error boundaries.',
    entries: [...Object.values(radiantA2uiRegistry.entries), failingEntry]
  })

  const diagnostics: CatalogDiagnostic[] = []
  const onAction = vi.fn<(action: A2uiActionPayload) => void>()
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  try {
    const { host } = await mount(
      <A2uiSurface
        surfaceId="isolated_failure"
        registry={customRegistry}
        onAction={onAction}
        onDiagnostic={d => diagnostics.push(d)}
        messages={[
          {
            version: A2UI_PROTOCOL_VERSION,
            createSurface: {
              surfaceId: 'isolated_failure',
              catalogId: customRegistry.catalogId,
              dataModel: { profile: { displayName: 'Ada Lovelace' } },
              components: [
                {
                  id: 'root',
                  component: 'Column',
                  children: ['before_text', 'broken_node', 'name_field', 'save_button']
                },
                { id: 'before_text', component: 'Text', text: 'Sibling before failure' },
                {
                  id: 'broken_node',
                  component: 'ExplodingNote',
                  text: 'Recovered fallback content'
                },
                {
                  id: 'name_field',
                  component: 'TextField',
                  label: 'Display name',
                  value: { '@path': '/profile/displayName' }
                },
                {
                  id: 'save_button',
                  component: 'Button',
                  child: 'save_label',
                  action: {
                    event: {
                      name: 'save_profile',
                      context: { displayName: { '@path': '/profile/displayName' } }
                    }
                  }
                },
                { id: 'save_label', component: 'Text', text: 'Save' }
              ]
            }
          }
        ]}
      />
    )

    // Failing node fell back to its text content
    const fallback = host.querySelector('[data-slot="a2ui-fallback"][data-node-id="broken_node"]')
    expect(fallback).not.toBeNull()
    expect(fallback!.textContent).toBe('Recovered fallback content')

    // Siblings stayed mounted and interactive
    expect(host.textContent).toContain('Sibling before failure')
    const button = host.querySelector<HTMLButtonElement>('button[data-slot~="button"]')!
    expect(button).not.toBeNull()
    await act(async () => {
      await userEvent.click(button)
    })
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onAction.mock.calls[0]![0].context).toEqual({ displayName: 'Ada Lovelace' })

    // Diagnostic emitted for the fallback
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'fallback',
          nodeId: 'broken_node',
          component: 'ExplodingNote',
          prop: 'render',
          received: 'Simulated widget failure',
          used: 'Recovered fallback content'
        })
      ])
    )
  } finally {
    consoleErrorSpy.mockRestore()
  }
})

test('Radiant React core still throws on mixed controlled and uncontrolled state directly', async () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const mixedProps = {
    'aria-label': 'Direct input',
    value: 'Ada',
    defaultValue: 'Grace',
    onChange: () => {}
  } as unknown as ComponentProps<typeof Input>
  try {
    await expect(mount(<Input {...mixedProps} />)).rejects.toThrow()
  } finally {
    consoleErrorSpy.mockRestore()
  }
})

test('A2uiSurface renders repeated template items and surfaces with component-level catalogId', async () => {
  const messages: A2uiMessage[] = [
    {
      version: A2UI_PROTOCOL_VERSION,
      createSurface: {
        surfaceId: 's_list_catalog',
        components: [
          {
            id: 'root',
            component: 'Column',
            catalogId: A2UI_BASIC_CATALOG_ID,
            children: { componentId: 'row_tpl', path: '/items' }
          },
          {
            id: 'row_tpl',
            component: 'Column',
            catalogId: A2UI_BASIC_CATALOG_ID,
            children: ['idx_cell', 'name_cell']
          },
          {
            id: 'idx_cell',
            component: 'Text',
            catalogId: A2UI_BASIC_CATALOG_ID,
            text: { '@call': '@index' }
          },
          {
            id: 'name_cell',
            component: 'Text',
            catalogId: A2UI_BASIC_CATALOG_ID,
            text: { '@path': '' }
          }
        ]
      }
    },
    {
      version: A2UI_PROTOCOL_VERSION,
      updateDataModel: {
        surfaceId: 's_list_catalog',
        path: '/items',
        value: ['Alpha', 'Beta', 'Gamma']
      }
    }
  ]

  const { host } = await mount(
    <A2uiSurface
      surfaceId="s_list_catalog"
      messages={messages}
    />
  )

  expect(host.textContent).toContain('0')
  expect(host.textContent).toContain('Alpha')
  expect(host.textContent).toContain('1')
  expect(host.textContent).toContain('Beta')
  expect(host.textContent).toContain('2')
  expect(host.textContent).toContain('Gamma')
})

test('recovers a failed node after updateComponents replaces its failing props', async () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  function ToggleThrow({ shouldFail, text }: { shouldFail: boolean; text: string }) {
    if (shouldFail) throw new Error('transient render crash')
    return <span data-slot="recovered-node">{text}</span>
  }

  const registry = createA2uiRegistry({
    catalogId: A2UI_BASIC_CATALOG_ID,
    title: 'Recovery test catalog',
    description: 'Registry with ToggleThrow for recovery testing.',
    entries: [
      ...Object.values(radiantA2uiRegistry.entries),
      createA2uiRegistryEntry({
        name: 'ToggleThrow',
        component: ToggleThrow,
        description: 'Throws when shouldFail is true.',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            component: { const: 'ToggleThrow' },
            shouldFail: { type: 'boolean' },
            text: { type: 'string' }
          }
        },
        adapter: props => (
          <ToggleThrow
            shouldFail={Boolean(props.shouldFail)}
            text={String(props.text ?? '')}
          />
        )
      })
    ]
  })

  const initialMessages: A2uiMessage[] = [
    {
      version: A2UI_PROTOCOL_VERSION,
      createSurface: {
        surfaceId: 's_recover',
        catalogId: A2UI_BASIC_CATALOG_ID,
        components: [
          { id: 'root', component: 'Column', children: ['flaky', 'sibling_text'] },
          { id: 'flaky', component: 'ToggleThrow', shouldFail: true, text: 'Initial fallback' },
          { id: 'sibling_text', component: 'Text', text: 'Sibling stays rendered' }
        ]
      }
    }
  ]

  try {
    const view = await mount(
      <A2uiSurface
        surfaceId="s_recover"
        messages={initialMessages}
        registry={registry}
      />
    )
    expect(view.host.querySelector('[data-slot="a2ui-fallback"]')?.textContent).toBe(
      'Initial fallback'
    )
    expect(view.host.textContent).toContain('Sibling stays rendered')

    await view.render(
      <A2uiSurface
        surfaceId="s_recover"
        registry={registry}
        messages={[
          ...initialMessages,
          {
            version: A2UI_PROTOCOL_VERSION,
            updateComponents: {
              surfaceId: 's_recover',
              components: [
                {
                  id: 'flaky',
                  component: 'ToggleThrow',
                  shouldFail: false,
                  text: 'Recovered live content'
                }
              ]
            }
          }
        ]}
      />
    )
    expect(view.host.querySelector('[data-slot="recovered-node"]')?.textContent).toBe(
      'Recovered live content'
    )
    expect(view.host.querySelector('[data-slot="a2ui-fallback"]')).toBeNull()
  } finally {
    consoleErrorSpy.mockRestore()
  }
})

test('interactive entries update client-local state without host calls and named actions deliver a state snapshot', async () => {
  const onAction = vi.fn<(event: A2uiActionPayload) => void>()

  const { host } = await mount(
    <StrictMode>
      <A2uiSurface
        surfaceId={PREFERENCES_SURFACE_ID}
        messages={interactivePreferencesFixtureMessages}
        onAction={onAction}
      />
    </StrictMode>,
    true
  )

  const note = host.querySelector<HTMLInputElement>('input[data-slot~="input"]')!
  const weekly = host.querySelector<HTMLInputElement>('input[type="radio"][value="weekly"]')!
  const inApp = host.querySelector<HTMLInputElement>('input[type="checkbox"][value="in_app"]')!
  const slider = host.querySelector<HTMLInputElement>('input[type="range"][data-slot~="slider"]')!
  const quietHours = Array.from(
    host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
  ).find(el => !el.value || el.value === 'on')!
  const applyButton = host.querySelector<HTMLButtonElement>('button[data-slot~="button"]')!

  // Typing, selecting, scrubbing, and toggling all stay local on the client
  await act(async () => {
    note.focus()
    await userEvent.type(note, 'Keep evenings quiet')
    await userEvent.click(weekly)
    await userEvent.click(inApp)
    slider.focus()
    await userEvent.keyboard('{ArrowRight}')
    await userEvent.click(quietHours)
  })

  expect(note.value).toBe('Keep evenings quiet')
  expect(weekly.checked).toBe(true)
  expect(inApp.checked).toBe(true)
  expect(slider.value).toBe('50')
  expect(quietHours.checked).toBe(true)
  expect(onAction).toHaveBeenCalledTimes(0)

  // Clicking the named action button delivers { action, surfaceId, nodeId, state } once
  await act(async () => {
    await userEvent.click(applyButton)
  })

  expect(onAction).toHaveBeenCalledTimes(1)
  const delivered = onAction.mock.calls[0]![0]
  expect(delivered.action).toBe('apply_preferences')
  expect(delivered.surfaceId).toBe(PREFERENCES_SURFACE_ID)
  expect(delivered.nodeId).toBe('apply_button')
  expect(Object.isFrozen(delivered)).toBe(true)
  expect(Object.isFrozen(delivered.state)).toBe(true)
  expect(delivered.state).toEqual({
    note: 'Keep evenings quiet',
    cadence: ['weekly'],
    channels: ['email', 'in_app'],
    volume: 50,
    notify: true
  })

  // Further local edits stay client-side and never mutate the delivered state snapshot
  await act(async () => {
    note.focus()
    await userEvent.type(note, ' (edited)')
  })
  expect(note.value).toBe('Keep evenings quiet (edited)')
  expect(onAction).toHaveBeenCalledTimes(1)
  expect(delivered.state).toEqual({
    note: 'Keep evenings quiet',
    cadence: ['weekly'],
    channels: ['email', 'in_app'],
    volume: 50,
    notify: true
  })
})

const surfaceMessage = (
  surfaceId: string,
  components: readonly Record<string, unknown>[],
  dataModel?: Record<string, unknown>
): A2uiMessage => ({
  version: A2UI_PROTOCOL_VERSION,
  createSurface: {
    surfaceId,
    catalogId: A2UI_BASIC_CATALOG_ID,
    ...(dataModel ? { dataModel } : {}),
    components
  }
})

test('preserves array root state and freezes both state and nested action context snapshots', async () => {
  const onAction = vi.fn<(event: A2uiActionPayload) => void>()
  const messages: A2uiMessage[] = [
    surfaceMessage('s_array_root', [
      { id: 'root', component: 'Column', children: ['flag', 'apply'] },
      {
        id: 'flag',
        component: 'CheckBox',
        label: 'Enable feature',
        value: { '@path': '/0/enabled' }
      },
      {
        id: 'apply',
        component: 'Button',
        child: 'apply_label',
        action: { event: { name: 'apply', context: { item: { '@path': '/0' } } } }
      },
      { id: 'apply_label', component: 'Text', text: 'Apply' }
    ]),
    {
      version: A2UI_PROTOCOL_VERSION,
      updateDataModel: { surfaceId: 's_array_root', path: '/', value: [{ enabled: false }] }
    }
  ]

  const { host } = await mount(
    <A2uiSurface
      surfaceId="s_array_root"
      messages={messages}
      onAction={onAction}
    />
  )
  const checkbox = host.querySelector<HTMLInputElement>('input[type="checkbox"]')!
  const apply = host.querySelector<HTMLButtonElement>('button[data-slot~="button"]')!

  await act(async () => {
    await userEvent.click(checkbox)
  })
  expect(checkbox.checked).toBe(true)
  expect(onAction).toHaveBeenCalledTimes(0)

  await act(async () => {
    await userEvent.click(apply)
  })
  expect(onAction).toHaveBeenCalledTimes(1)
  const payload = onAction.mock.calls[0]![0]
  expect(payload.state).toEqual([{ enabled: true }])
  expect(payload.context).toEqual({ item: { enabled: true } })
  for (const obj of [
    payload,
    payload.state,
    (payload.state as readonly unknown[])[0],
    payload.context,
    payload.context.item
  ]) {
    expect(Object.isFrozen(obj)).toBe(true)
  }

  await act(async () => {
    await userEvent.click(checkbox)
  })
  expect(onAction).toHaveBeenCalledTimes(1)
  expect(payload.state).toEqual([{ enabled: true }])
  expect(payload.context).toEqual({ item: { enabled: true } })
})

test('ChoicePicker defaults to single selection, honors chips and filtering with retained hidden picks, and reports duplicate values', async () => {
  const onAction = vi.fn<(event: A2uiActionPayload) => void>()
  const diagnostics: CatalogDiagnostic[] = []
  const messages: A2uiMessage[] = [
    surfaceMessage(
      's_choice_opts',
      [
        { id: 'root', component: 'Column', children: ['mode_picker', 'tag_chips', 'apply'] },
        {
          id: 'mode_picker',
          component: 'ChoicePicker',
          label: 'Mode',
          options: [
            { label: 'Fast', value: 'fast' },
            { label: 'Accurate', value: 'accurate' }
          ],
          value: { '@path': '/mode' }
        },
        {
          id: 'tag_chips',
          component: 'ChoicePicker',
          label: 'Tags',
          variant: 'multipleSelection',
          displayStyle: 'chips',
          filterable: true,
          options: [
            { label: 'Alpha', value: 'alpha' },
            { label: 'Alpha copy', value: 'alpha' },
            { label: 'Beta', value: 'beta' }
          ],
          value: { '@path': '/tags' }
        },
        {
          id: 'apply',
          component: 'Button',
          child: 'apply_text',
          action: { event: { name: 'apply' } }
        },
        { id: 'apply_text', component: 'Text', text: 'Apply' }
      ],
      { mode: [], tags: [] }
    )
  ]

  const { host } = await mount(
    <A2uiSurface
      surfaceId="s_choice_opts"
      messages={messages}
      onAction={onAction}
      onDiagnostic={d => diagnostics.push(d)}
    />
  )
  expect(diagnostics).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: 'coerced',
        nodeId: 'tag_chips',
        component: 'ChoicePicker',
        prop: 'options'
      })
    ])
  )

  const chipGroup = host.querySelector('[role="group"][aria-label="Tags"]')!
  const filter = host.querySelector<HTMLInputElement>(
    'input[type="search"][aria-label="Filter Tags"]'
  )!
  const chip = (name: string) =>
    Array.from(chipGroup.querySelectorAll('button')).find(b => b.textContent === name)!

  await act(async () => {
    await userEvent.click(
      host.querySelector<HTMLInputElement>('input[type="radio"][value="fast"]')!
    )
    await userEvent.click(
      host.querySelector<HTMLInputElement>('input[type="radio"][value="accurate"]')!
    )
    await userEvent.click(chip('Alpha'))
  })
  expect(chip('Alpha').getAttribute('aria-pressed')).toBe('true')

  await act(async () => {
    filter.focus()
    await userEvent.type(filter, 'Bet')
  })
  expect(chipGroup.textContent).not.toContain('Alpha')
  await act(async () => {
    await userEvent.click(chip('Beta'))
  })
  expect(chip('Beta').getAttribute('aria-pressed')).toBe('true')
  expect(onAction).toHaveBeenCalledTimes(0)

  await act(async () => {
    await userEvent.click(
      Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'Apply')!
    )
  })
  expect(onAction).toHaveBeenCalledTimes(1)
  expect(onAction.mock.calls[0]![0].state).toEqual({ mode: ['accurate'], tags: ['alpha', 'beta'] })
})

test('CheckBox preserves DOM identity and focus when validation errors appear and clear', async () => {
  const baseMessages: A2uiMessage[] = [
    surfaceMessage(
      's_cb_valid',
      [
        { id: 'root', component: 'Column', children: ['consent_cb'] },
        {
          id: 'consent_cb',
          component: 'CheckBox',
          label: 'Accept terms',
          value: { '@path': '/consent' },
          checks: [{ condition: { '@path': '/ok' }, message: 'Acceptance is required.' }]
        }
      ],
      { consent: false, ok: true }
    )
  ]

  const view = await mount(
    <A2uiSurface
      surfaceId="s_cb_valid"
      messages={baseMessages}
    />
  )
  const cbBefore = view.host.querySelector<HTMLInputElement>('input[type="checkbox"]')!
  cbBefore.focus()
  expect(document.activeElement).toBe(cbBefore)
  expect(view.host.querySelector('[data-slot="field-error"]')).toBeNull()

  const withError: A2uiMessage[] = [
    ...baseMessages,
    {
      version: A2UI_PROTOCOL_VERSION,
      updateDataModel: { surfaceId: 's_cb_valid', path: '/ok', value: false }
    }
  ]
  await view.render(
    <A2uiSurface
      surfaceId="s_cb_valid"
      messages={withError}
    />
  )
  expect(view.host.querySelector('[data-slot="field-error"]')?.textContent).toBe(
    'Acceptance is required.'
  )
  expect(view.host.querySelector<HTMLInputElement>('input[type="checkbox"]')).toBe(cbBefore)
  expect(document.activeElement).toBe(cbBefore)

  await view.render(
    <A2uiSurface
      surfaceId="s_cb_valid"
      messages={[
        ...withError,
        {
          version: A2UI_PROTOCOL_VERSION,
          updateDataModel: { surfaceId: 's_cb_valid', path: '/ok', value: true }
        }
      ]}
    />
  )
  expect(view.host.querySelector('[data-slot="field-error"]')).toBeNull()
  expect(view.host.querySelector<HTMLInputElement>('input[type="checkbox"]')).toBe(cbBefore)
  expect(document.activeElement).toBe(cbBefore)
})

test('ChoicePicker and Slider use authored accessible names and diagnose missing or blank labels without dropping siblings', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const { host } = await mount(
    <A2uiSurface
      surfaceId="s_a11y_names"
      onDiagnostic={d => diagnostics.push(d)}
      messages={[
        surfaceMessage(
          's_a11y_names',
          [
            {
              id: 'root',
              component: 'Column',
              children: [
                'sibling',
                'authored_slider',
                'authored_picker',
                'unnamed_slider',
                'blank_picker'
              ]
            },
            { id: 'sibling', component: 'Text', text: 'Sibling intact' },
            {
              id: 'authored_slider',
              component: 'Slider',
              accessibility: { label: 'Playback speed' },
              min: 0,
              max: 100,
              value: { '@path': '/speed' }
            },
            {
              id: 'authored_picker',
              component: 'ChoicePicker',
              accessibility: { label: 'Sort order' },
              options: [{ label: 'Newest', value: 'a' }],
              value: { '@path': '/pickA' }
            },
            {
              id: 'unnamed_slider',
              component: 'Slider',
              label: '   ',
              min: 0,
              max: 100,
              value: { '@path': '/fallbackNum' }
            },
            {
              id: 'blank_picker',
              component: 'ChoicePicker',
              options: [{ label: 'Item X', value: 'x' }],
              value: { '@path': '/pickB' }
            }
          ],
          { speed: 50, fallbackNum: 20, pickA: ['a'], pickB: ['x'] }
        )
      ]}
    />
  )

  expect(host.textContent).toContain('Sibling intact')
  const sliders = Array.from(host.querySelectorAll<HTMLInputElement>('input[type="range"]'))
  const fieldsets = Array.from(host.querySelectorAll<HTMLFieldSetElement>('fieldset'))
  expect(sliders.map(s => host.querySelector(`label[for="${s.id}"]`)?.textContent)).toEqual([
    'Playback speed',
    'Unnamed slider'
  ])
  expect(fieldsets.map(f => f.querySelector('legend')?.textContent)).toEqual([
    'Sort order',
    'Blank picker'
  ])
  expect(diagnostics).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: 'coerced',
        nodeId: 'unnamed_slider',
        component: 'Slider',
        prop: 'label',
        received: '   ',
        used: 'Unnamed slider'
      }),
      expect.objectContaining({
        kind: 'defaulted',
        nodeId: 'blank_picker',
        component: 'ChoicePicker',
        prop: 'label',
        received: undefined,
        used: 'Blank picker'
      })
    ])
  )
})
