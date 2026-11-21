import {
  act,
  StrictMode,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  type Ref
} from 'react'
import { createPortal } from 'react-dom'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
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
import { A2UI_NODE_ENTRY_ANIMATION_ID } from '../../src/a2ui/surfaceRuntime.js'
import { summarizeCatalogDiagnostics } from '../../src/catalog/index.js'
import {
  interactivePreferencesFixtureMessages,
  malformedProfileFixtureMessages,
  PREFERENCES_SURFACE_ID,
  PROFILE_SURFACE_ID,
  profileFixtureMessages,
  profileFixtureWithThemeHintMessages
} from '../../src/a2ui/fixtures.js'
import { Button, Input, ThemeScope, defaultTheme, defineTheme } from '../../src/index.js'
import { useSpringDrag } from '../../src/motion/react.js'
import { themes } from '../../src/examples/index.js'
import { mount } from './familyHarness.js'
import type {} from './mediaCommands.js'

afterEach(async () => {
  await commands.emulatePreferences({ reducedMotion: 'no-preference' })
})

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
    accessibility: [],
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
        accessibility: [],
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

test('patches a surface while an input has focus, typed text, selection, and scroll position without losing them', async () => {
  const initialMessages: A2uiMessage[] = [
    surfaceMessage(
      's_patch_input',
      [
        { id: 'root', component: 'Column', children: ['status_text', 'note_field', 'notes_area'] },
        { id: 'status_text', component: 'Text', text: { '@path': '/status' } },
        {
          id: 'note_field',
          component: 'TextField',
          label: 'Summary note',
          placeholder: 'Write a note',
          value: { '@path': '/note' },
          variant: 'shortText'
        },
        {
          id: 'notes_area',
          component: 'TextField',
          label: 'Long notes',
          value: { '@path': '/longNote' },
          variant: 'longText'
        }
      ],
      {
        status: 'Waiting for agent',
        note: '',
        longNote: Array.from({ length: 24 }, (_, i) => `Line ${i + 1}`).join('\n')
      }
    )
  ]

  const view = await mount(
    <A2uiSurface
      surfaceId="s_patch_input"
      messages={initialMessages}
    />
  )

  const input = view.host.querySelector<HTMLInputElement>('input[data-slot~="input"]')!
  const textarea = view.host.querySelector<HTMLTextAreaElement>('textarea[data-slot~="textarea"]')!

  // Establish scroll position on the textarea and focus + typed text + caret on the input
  textarea.style.height = '64px'
  textarea.scrollTop = 90
  const scrollBefore = textarea.scrollTop
  expect(scrollBefore).toBeGreaterThan(0)

  await act(async () => {
    input.focus()
    await userEvent.type(input, 'Keep focus alive')
    input.setSelectionRange(4, 10)
  })
  expect(document.activeElement).toBe(input)
  expect(input.value).toBe('Keep focus alive')

  // Pass a freshly cloned prefix plus incremental patches updating siblings, the input's own label,
  // an unrelated data path, and inserting new siblings before and after the focused input.
  const patchedMessages: A2uiMessage[] = [
    structuredClone(initialMessages[0]!),
    {
      version: A2UI_PROTOCOL_VERSION,
      updateComponents: {
        surfaceId: 's_patch_input',
        components: [
          {
            id: 'root',
            component: 'Column',
            children: ['top_banner', 'status_text', 'note_field', 'notes_area', 'bottom_note']
          },
          { id: 'top_banner', component: 'Text', text: 'Agent suggestion ready' },
          {
            id: 'note_field',
            component: 'TextField',
            label: 'Summary note (synced)',
            placeholder: 'Updated placeholder',
            value: { '@path': '/note' },
            variant: 'shortText'
          },
          { id: 'bottom_note', component: 'Text', text: 'Draft saved locally', variant: 'caption' }
        ]
      }
    },
    {
      version: A2UI_PROTOCOL_VERSION,
      updateDataModel: {
        surfaceId: 's_patch_input',
        path: '/status',
        value: 'Agent updated sibling'
      }
    }
  ]

  await view.render(
    <A2uiSurface
      surfaceId="s_patch_input"
      messages={patchedMessages}
    />
  )

  expect(view.host.textContent).toContain('Agent suggestion ready')
  expect(view.host.textContent).toContain('Agent updated sibling')
  expect(view.host.textContent).toContain('Summary note (synced)')
  expect(view.host.textContent).toContain('Draft saved locally')

  const inputAfter = view.host.querySelector<HTMLInputElement>('input[data-slot~="input"]')!
  const textareaAfter = view.host.querySelector<HTMLTextAreaElement>(
    'textarea[data-slot~="textarea"]'
  )!

  expect(inputAfter).toBe(input)
  expect(document.activeElement).toBe(input)
  expect(inputAfter.value).toBe('Keep focus alive')
  expect(inputAfter.selectionStart).toBe(4)
  expect(inputAfter.selectionEnd).toBe(10)
  expect(textareaAfter).toBe(textarea)
  expect(textareaAfter.scrollTop).toBe(scrollBefore)

  // Continued typing works immediately without refocusing
  await act(async () => {
    inputAfter.setSelectionRange(inputAfter.value.length, inputAfter.value.length)
    await userEvent.type(inputAfter, '!')
  })
  expect(inputAfter.value).toBe('Keep focus alive!')
  expect(document.activeElement).toBe(input)
})

test('patches a sibling while a drag is in progress without interrupting the drag', async () => {
  let latestDrag: ReturnType<typeof useSpringDrag> | undefined

  function DragHandle({ label }: { readonly label: string }) {
    const ref = useRef<HTMLButtonElement>(null)
    const drag = useSpringDrag(ref, 0, { min: 0, max: 160, snapPoints: [0, 80, 160] })
    useEffect(() => {
      latestDrag = drag
    }, [drag])
    return (
      <Button
        ref={ref}
        data-testid="a2ui-drag-handle"
      >
        {label}
      </Button>
    )
  }

  const dragRegistry = createA2uiRegistry({
    catalogId: A2UI_BASIC_CATALOG_ID,
    title: 'Drag patch test catalog',
    description: 'Registry with a draggable handle entry for mid-drag patch verification.',
    entries: [
      ...Object.values(radiantA2uiRegistry.entries),
      createA2uiRegistryEntry({
        name: 'DragHandle',
        accessibility: [],
        component: DragHandle,
        description: 'One-axis spring drag handle.',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            component: { const: 'DragHandle' },
            label: { type: 'string' }
          },
          required: ['component', 'label']
        },
        adapter: props => <DragHandle label={String(props.label ?? 'Drag')} />
      })
    ]
  })

  const initialMessages: A2uiMessage[] = [
    surfaceMessage('s_patch_drag', [
      { id: 'root', component: 'Column', children: ['status_text', 'drag_node'] },
      { id: 'status_text', component: 'Text', text: 'Before sibling patch' },
      { id: 'drag_node', component: 'DragHandle', label: 'Slide handle' }
    ])
  ]

  const view = await mount(
    <A2uiSurface
      surfaceId="s_patch_drag"
      registry={dragRegistry}
      messages={initialMessages}
    />
  )

  const handleBefore = view.host.querySelector<HTMLButtonElement>(
    '[data-testid="a2ui-drag-handle"]'
  )!
  const rect = handleBefore.getBoundingClientRect()
  const startX = rect.left + rect.width / 2
  const startY = rect.top + rect.height / 2

  // Begin a real pointer drag and move past the drag threshold
  handleBefore.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      button: 0,
      isPrimary: true,
      pointerId: 1,
      clientX: startX,
      clientY: startY
    })
  )
  document.dispatchEvent(
    new PointerEvent('pointermove', {
      bubbles: true,
      isPrimary: true,
      pointerId: 1,
      clientX: startX + 40,
      clientY: startY
    })
  )
  expect(latestDrag!.get()).toBeCloseTo(40, 1)

  // Patch the surface mid-drag: update an existing sibling and append a new sibling
  await view.render(
    <A2uiSurface
      surfaceId="s_patch_drag"
      registry={dragRegistry}
      messages={[
        ...initialMessages,
        {
          version: A2UI_PROTOCOL_VERSION,
          updateComponents: {
            surfaceId: 's_patch_drag',
            components: [
              {
                id: 'root',
                component: 'Column',
                children: ['status_text', 'drag_node', 'live_hint']
              },
              { id: 'status_text', component: 'Text', text: 'Updated while dragging' },
              { id: 'live_hint', component: 'Text', text: 'New sibling appeared mid-drag' }
            ]
          }
        }
      ]}
    />
  )

  const handleAfter = view.host.querySelector<HTMLButtonElement>(
    '[data-testid="a2ui-drag-handle"]'
  )!
  expect(handleAfter).toBe(handleBefore)
  expect(view.host.textContent).toContain('Updated while dragging')
  expect(view.host.textContent).toContain('New sibling appeared mid-drag')

  // Continue dragging after the patch and release; the drag completes seamlessly
  document.dispatchEvent(
    new PointerEvent('pointermove', {
      bubbles: true,
      isPrimary: true,
      pointerId: 1,
      clientX: startX + 135,
      clientY: startY
    })
  )
  expect(latestDrag!.get()).toBeCloseTo(135, 1)

  document.dispatchEvent(
    new PointerEvent('pointerup', {
      bubbles: true,
      isPrimary: true,
      pointerId: 1,
      clientX: startX + 135,
      clientY: startY
    })
  )
  await expect.poll(() => Math.abs(latestDrag!.get() - 160) < 0.5, { timeout: 4_000 }).toBe(true)
})

test('runs entry motion only for newly mounted nodes and respects reduced motion and off mode', async () => {
  const animatedElements: HTMLElement[] = []
  const originalAnimate = Element.prototype.animate
  const animateSpy = vi.spyOn(Element.prototype, 'animate').mockImplementation(function (
    this: Element,
    keyframes,
    options
  ) {
    if (
      typeof options === 'object' &&
      options !== null &&
      'id' in options &&
      options.id === A2UI_NODE_ENTRY_ANIMATION_ID &&
      this instanceof HTMLElement
    ) {
      animatedElements.push(this)
    }
    return originalAnimate.call(this, keyframes, options)
  })

  try {
    const initialMessages: A2uiMessage[] = [
      surfaceMessage(
        's_entry_motion',
        [
          { id: 'root', component: 'Column', children: ['intro', 'name_field', 'save_btn'] },
          { id: 'intro', component: 'Text', text: 'Initial intro' },
          {
            id: 'name_field',
            component: 'TextField',
            label: 'Name',
            value: { '@path': '/name' },
            checks: [{ condition: { '@path': '/ok' }, message: 'Name required' }]
          },
          {
            id: 'save_btn',
            component: 'Button',
            child: 'save_label',
            action: { event: { name: 'save' } }
          },
          { id: 'save_label', component: 'Text', text: 'Save' }
        ],
        { name: 'Ada', ok: true }
      )
    ]

    const view = await mount(
      <A2uiSurface
        surfaceId="s_entry_motion"
        messages={initialMessages}
      />
    )

    const introEl = view.host.querySelector<HTMLElement>('p[data-slot="a2ui-text"]')!
    const fieldEl = view.host.querySelector<HTMLElement>('[data-slot~="field"]')!
    const buttonEl = view.host.querySelector<HTMLElement>('button[data-slot~="button"]')!

    expect(animatedElements).toEqual([introEl, fieldEl, buttonEl])
    animatedElements.length = 0

    // Patch existing nodes (text, label, validation error) and add one new sibling
    const patchWithNewNode: A2uiMessage[] = [
      ...initialMessages,
      {
        version: A2UI_PROTOCOL_VERSION,
        updateComponents: {
          surfaceId: 's_entry_motion',
          components: [
            {
              id: 'root',
              component: 'Column',
              children: ['intro', 'name_field', 'new_hint', 'save_btn']
            },
            { id: 'intro', component: 'Text', text: 'Updated intro' },
            {
              id: 'name_field',
              component: 'TextField',
              label: 'Full name',
              value: { '@path': '/name' },
              checks: [{ condition: { '@path': '/ok' }, message: 'Name required' }]
            },
            { id: 'new_hint', component: 'Text', text: 'Brand new sibling', variant: 'caption' }
          ]
        }
      },
      {
        version: A2UI_PROTOCOL_VERSION,
        updateDataModel: { surfaceId: 's_entry_motion', path: '/ok', value: false }
      }
    ]

    await view.render(
      <A2uiSurface
        surfaceId="s_entry_motion"
        messages={patchWithNewNode}
      />
    )

    const newHintEl = view.host.querySelector<HTMLElement>(
      'span[data-slot="a2ui-text"][data-variant="caption"]'
    )!
    expect(animatedElements).toEqual([newHintEl])
    expect(animatedElements).not.toContain(introEl)
    expect(animatedElements).not.toContain(fieldEl)
    expect(animatedElements).not.toContain(buttonEl)
    animatedElements.length = 0

    // Patching without adding any new node triggers zero entry animations
    await view.render(
      <A2uiSurface
        surfaceId="s_entry_motion"
        messages={[
          ...patchWithNewNode,
          {
            version: A2UI_PROTOCOL_VERSION,
            updateComponents: {
              surfaceId: 's_entry_motion',
              components: [
                {
                  id: 'root',
                  component: 'Column',
                  children: ['name_field', 'new_hint', 'save_btn']
                },
                { id: 'new_hint', component: 'Text', text: 'Edited hint', variant: 'caption' }
              ]
            }
          }
        ]}
      />
    )
    expect(animatedElements).toEqual([])

    // Reduced motion disables entry motion
    await commands.emulatePreferences({ reducedMotion: 'reduce' })
    await mount(
      <A2uiSurface
        surfaceId="s_entry_reduced"
        messages={[
          surfaceMessage('s_entry_reduced', [
            { id: 'root', component: 'Column', children: ['t1'] },
            { id: 't1', component: 'Text', text: 'Reduced motion' }
          ])
        ]}
      />
    )
    expect(animatedElements).toEqual([])

    // Theme motion mode="off" disables entry motion
    await commands.emulatePreferences({ reducedMotion: 'no-preference' })
    const stillTheme = defineTheme({
      id: 'still',
      name: 'Still',
      motion: { mode: 'off' }
    })
    await mount(
      <ThemeScope
        theme={stillTheme}
        mode="light"
      >
        <A2uiSurface
          surfaceId="s_entry_off"
          messages={[
            surfaceMessage('s_entry_off', [
              { id: 'root', component: 'Column', children: ['t1'] },
              { id: 't1', component: 'Text', text: 'Motion off' }
            ])
          ]}
        />
      </ThemeScope>
    )
    expect(animatedElements).toEqual([])
  } finally {
    animateSpy.mockRestore()
  }
})

test('removing a focused node moves focus to the documented fallback instead of document.body', async () => {
  const step0: A2uiMessage[] = [
    surfaceMessage(
      's_focus_fallback',
      [
        {
          id: 'root',
          component: 'Column',
          children: ['intro', 'field_a', 'field_b', 'save_btn']
        },
        { id: 'intro', component: 'Text', text: 'Focus test' },
        { id: 'field_a', component: 'TextField', label: 'First', value: { '@path': '/a' } },
        { id: 'field_b', component: 'TextField', label: 'Second', value: { '@path': '/b' } },
        {
          id: 'save_btn',
          component: 'Button',
          child: 'save_label',
          action: { event: { name: 'save' } }
        },
        { id: 'save_label', component: 'Text', text: 'Save' }
      ],
      { a: 'A', b: 'B' }
    )
  ]

  const view = await mount(
    <div>
      <button
        type="button"
        data-testid="outside-btn"
      >
        Outside
      </button>
      <A2uiSurface
        surfaceId="s_focus_fallback"
        messages={step0}
      />
    </div>
  )

  const inputs = () =>
    Array.from(view.host.querySelectorAll<HTMLInputElement>('input[data-slot~="input"]'))
  const surfaceEl = () => view.host.querySelector<HTMLDivElement>('[data-slot="a2ui-surface"]')!
  const saveBtn = () => view.host.querySelector<HTMLButtonElement>('button[data-slot~="button"]')!

  // 1. Removing a middle focused node moves focus to the next surviving focusable control
  inputs()[1]!.focus()
  expect(document.activeElement).toBe(inputs()[1])
  const step1: A2uiMessage[] = [
    ...step0,
    {
      version: A2UI_PROTOCOL_VERSION,
      updateComponents: {
        surfaceId: 's_focus_fallback',
        components: [
          { id: 'root', component: 'Column', children: ['intro', 'field_a', 'save_btn'] }
        ]
      }
    }
  ]
  await view.render(
    <div>
      <button
        type="button"
        data-testid="outside-btn"
      >
        Outside
      </button>
      <A2uiSurface
        surfaceId="s_focus_fallback"
        messages={step1}
      />
    </div>
  )
  expect(document.activeElement).toBe(saveBtn())
  expect(document.activeElement).not.toBe(document.body)

  // 2. Removing the last focused node moves focus to the previous surviving focusable control
  const step2: A2uiMessage[] = [
    ...step1,
    {
      version: A2UI_PROTOCOL_VERSION,
      updateComponents: {
        surfaceId: 's_focus_fallback',
        components: [{ id: 'root', component: 'Column', children: ['intro', 'field_a'] }]
      }
    }
  ]
  await view.render(
    <div>
      <button
        type="button"
        data-testid="outside-btn"
      >
        Outside
      </button>
      <A2uiSurface
        surfaceId="s_focus_fallback"
        messages={step2}
      />
    </div>
  )
  expect(document.activeElement).toBe(inputs()[0])
  expect(document.activeElement).not.toBe(document.body)

  // 3. Replacing the only focused node with a new focusable node moves focus to the first remaining focusable
  const step3: A2uiMessage[] = [
    ...step2,
    {
      version: A2UI_PROTOCOL_VERSION,
      updateComponents: {
        surfaceId: 's_focus_fallback',
        components: [
          { id: 'root', component: 'Column', children: ['intro', 'field_c'] },
          { id: 'field_c', component: 'TextField', label: 'Replacement', value: { '@path': '/c' } }
        ]
      }
    }
  ]
  await view.render(
    <div>
      <button
        type="button"
        data-testid="outside-btn"
      >
        Outside
      </button>
      <A2uiSurface
        surfaceId="s_focus_fallback"
        messages={step3}
      />
    </div>
  )
  expect(document.activeElement).toBe(inputs()[0])
  expect(view.host.querySelector('label[data-slot~="field-label"]')?.textContent).toBe(
    'Replacement'
  )

  // 4. Removing the last remaining focusable node moves focus to the surface root container
  const step4: A2uiMessage[] = [
    ...step3,
    {
      version: A2UI_PROTOCOL_VERSION,
      updateComponents: {
        surfaceId: 's_focus_fallback',
        components: [{ id: 'root', component: 'Column', children: ['intro'] }]
      }
    }
  ]
  await view.render(
    <div>
      <button
        type="button"
        data-testid="outside-btn"
      >
        Outside
      </button>
      <A2uiSurface
        surfaceId="s_focus_fallback"
        messages={step4}
      />
    </div>
  )
  expect(document.activeElement).toBe(surfaceEl())
  expect(document.activeElement).not.toBe(document.body)

  // 5. Patching the surface when focus is outside never steals external focus
  const outsideBtn = view.host.querySelector<HTMLButtonElement>('[data-testid="outside-btn"]')!
  outsideBtn.focus()
  expect(document.activeElement).toBe(outsideBtn)
  await view.render(
    <div>
      <button
        type="button"
        data-testid="outside-btn"
      >
        Outside
      </button>
      <A2uiSurface
        surfaceId="s_focus_fallback"
        messages={[
          ...step4,
          {
            version: A2UI_PROTOCOL_VERSION,
            updateComponents: {
              surfaceId: 's_focus_fallback',
              components: [{ id: 'root', component: 'Column', children: [] }]
            }
          }
        ]}
      />
    </div>
  )
  expect(document.activeElement).toBe(outsideBtn)
})

const updateComponentsMsg = (
  surfaceId: string,
  components: readonly Record<string, unknown>[]
): A2uiMessage => ({
  version: A2UI_PROTOCOL_VERSION,
  updateComponents: { surfaceId, components }
})

const updateDataMsg = (surfaceId: string, path: string, value: unknown): A2uiMessage => ({
  version: A2UI_PROTOCOL_VERSION,
  updateDataModel: { surfaceId, path, value }
})

function buildDeepNested(depth: number, leaf: string): Record<string, unknown> {
  let current: Record<string, unknown> = { leaf }
  for (let i = 0; i < depth; i++) current = { nested: current }
  return current
}

function spyEntryAnimations() {
  const animated: HTMLElement[] = []
  const durations: (number | undefined)[] = []
  const originalAnimate = Element.prototype.animate
  const spy = vi.spyOn(Element.prototype, 'animate').mockImplementation(function (
    this: Element,
    keyframes,
    options
  ) {
    if (
      typeof options === 'object' &&
      options !== null &&
      'id' in options &&
      options.id === A2UI_NODE_ENTRY_ANIMATION_ID &&
      this instanceof HTMLElement
    ) {
      animated.push(this)
      durations.push(typeof options.duration === 'number' ? options.duration : undefined)
    }
    return originalAnimate.call(this, keyframes, options)
  })
  return { animated, durations, restore: () => spy.mockRestore() }
}

test('keeps wire history independent of local nested edits across identical deep replays, appended suffixes, and earlier edits', async () => {
  const serverHistory: A2uiMessage[] = [
    surfaceMessage(
      's_wire_history',
      [
        { id: 'root', component: 'Column', children: ['status_text', 'draft_field'] },
        { id: 'status_text', component: 'Text', text: { '@path': '/status' } },
        {
          id: 'draft_field',
          component: 'TextField',
          label: 'Nested note',
          value: { '@path': '/draft/note' },
          variant: 'shortText'
        }
      ],
      { status: 'Initial', draft: { note: 'Seed', tags: ['v1'] }, deep: buildDeepNested(70, 'ok') }
    ),
    updateDataMsg('s_wire_history', '/draft', { note: 'Server value', tags: ['a', 'b'] })
  ]
  const pristineHistory = structuredClone(serverHistory)

  const view = await mount(
    <A2uiSurface
      surfaceId="s_wire_history"
      messages={serverHistory}
    />
  )

  const input = view.host.querySelector<HTMLInputElement>('input[data-slot~="input"]')!
  expect(input.value).toBe('Server value')

  await act(async () => {
    input.focus()
    input.setSelectionRange(0, input.value.length)
    await userEvent.type(input, 'Local edited draft')
    input.setSelectionRange(6, 12)
  })
  expect(input.value).toBe('Local edited draft')
  expect(document.activeElement).toBe(input)
  expect(serverHistory).toEqual(pristineHistory)

  // Resending a structurally identical deep recreated copy is a no-op that preserves the live draft
  await view.render(
    <A2uiSurface
      surfaceId="s_wire_history"
      messages={structuredClone(pristineHistory)}
    />
  )
  const inputAfterReplay = view.host.querySelector<HTMLInputElement>('input[data-slot~="input"]')!
  expect(inputAfterReplay).toBe(input)
  expect(inputAfterReplay.value).toBe('Local edited draft')
  expect(document.activeElement).toBe(input)
  expect(inputAfterReplay.selectionStart).toBe(6)
  expect(inputAfterReplay.selectionEnd).toBe(12)

  // Appending a mixed suffix to the pristine deep history applies only the suffix without losing user state
  const withAppendedPatch: A2uiMessage[] = [
    ...structuredClone(pristineHistory),
    updateDataMsg('s_wire_history', '/status', 'Sibling status updated'),
    updateComponentsMsg('s_wire_history', [
      { id: 'root', component: 'Column', children: ['status_text', 'draft_field', 'sibling_note'] },
      { id: 'sibling_note', component: 'Text', text: 'Appended sibling' }
    ])
  ]
  const appendedSnapshot = structuredClone(withAppendedPatch)
  await view.render(
    <A2uiSurface
      surfaceId="s_wire_history"
      messages={withAppendedPatch}
    />
  )
  expect(serverHistory).toEqual(pristineHistory)
  expect(withAppendedPatch).toEqual(appendedSnapshot)
  expect(view.host.textContent).toContain('Sibling status updated')
  expect(view.host.textContent).toContain('Appended sibling')
  expect(view.host.querySelector<HTMLInputElement>('input[data-slot~="input"]')).toBe(input)
  expect(input.value).toBe('Local edited draft')
  expect(document.activeElement).toBe(input)
  expect(input.selectionStart).toBe(6)
  expect(input.selectionEnd).toBe(12)

  // Editing an already-applied earlier message triggers a rebuild with the revised wire value
  const editedEarlier = structuredClone(pristineHistory)
  ;(editedEarlier[1]!.updateDataModel as { value: { note: string; tags: string[] } }).value.note =
    'Rebuilt from edited history'
  await view.render(
    <A2uiSurface
      surfaceId="s_wire_history"
      messages={editedEarlier}
    />
  )
  expect(view.host.querySelector<HTMLInputElement>('input[data-slot~="input"]')!.value).toBe(
    'Rebuilt from edited history'
  )
})

test('keeps focus on the same ChoicePicker radio when filtering is enabled', async () => {
  const step0: A2uiMessage[] = [
    surfaceMessage(
      's_choice_filter_focus',
      [
        { id: 'root', component: 'Column', children: ['mode_picker'] },
        {
          id: 'mode_picker',
          component: 'ChoicePicker',
          label: 'Mode',
          filterable: false,
          options: [
            { label: 'Fast', value: 'fast' },
            { label: 'Accurate', value: 'accurate' }
          ],
          value: { '@path': '/mode' }
        }
      ],
      { mode: ['accurate'] }
    )
  ]

  const view = await mount(
    <A2uiSurface
      surfaceId="s_choice_filter_focus"
      messages={step0}
    />
  )

  const radioBefore = view.host.querySelector<HTMLInputElement>(
    'input[type="radio"][value="accurate"]'
  )!
  radioBefore.focus()
  expect(document.activeElement).toBe(radioBefore)
  expect(view.host.querySelector('input[type="search"]')).toBeNull()

  await view.render(
    <A2uiSurface
      surfaceId="s_choice_filter_focus"
      messages={[
        ...step0,
        updateComponentsMsg('s_choice_filter_focus', [
          {
            id: 'mode_picker',
            component: 'ChoicePicker',
            label: 'Mode',
            filterable: true,
            options: [
              { label: 'Fast', value: 'fast' },
              { label: 'Accurate', value: 'accurate' }
            ],
            value: { '@path': '/mode' }
          }
        ])
      ]}
    />
  )

  expect(view.host.querySelector('input[type="search"]')).not.toBeNull()
  const radioAfter = view.host.querySelector<HTMLInputElement>(
    'input[type="radio"][value="accurate"]'
  )!
  expect(radioAfter).toBe(radioBefore)
  expect(document.activeElement).toBe(radioBefore)
})

test('restores focus, draft, selection, and scroll when a surviving TextField moves between Columns', async () => {
  const initialMessages: A2uiMessage[] = [
    surfaceMessage(
      's_move_field',
      [
        { id: 'root', component: 'Column', children: ['col_a', 'col_b', 'other_btn'] },
        { id: 'col_a', component: 'Column', children: ['note_field'] },
        { id: 'col_b', component: 'Column', children: [] },
        {
          id: 'note_field',
          component: 'TextField',
          label: 'Movable note',
          value: { '@path': '/note' },
          variant: 'longText'
        },
        {
          id: 'other_btn',
          component: 'Button',
          child: 'other_label',
          action: { event: { name: 'noop' } }
        },
        { id: 'other_label', component: 'Text', text: 'Surviving control' }
      ],
      { note: Array.from({ length: 18 }, (_, i) => `Line ${i + 1}`).join('\n') }
    )
  ]

  const view = await mount(
    <A2uiSurface
      surfaceId="s_move_field"
      messages={initialMessages}
    />
  )

  const textareaBefore = view.host.querySelector<HTMLTextAreaElement>(
    'textarea[data-slot~="textarea"]'
  )!
  textareaBefore.style.height = '64px'
  await act(async () => {
    textareaBefore.focus()
    textareaBefore.setSelectionRange(0, 0)
    await userEvent.type(textareaBefore, 'Draft ')
    textareaBefore.setSelectionRange(1, 5)
    textareaBefore.scrollTop = 48
  })
  const expectedDraft = textareaBefore.value
  const scrollBefore = textareaBefore.scrollTop
  expect(scrollBefore).toBeGreaterThan(0)

  await view.render(
    <A2uiSurface
      surfaceId="s_move_field"
      messages={[
        ...initialMessages,
        updateComponentsMsg('s_move_field', [
          { id: 'col_a', component: 'Column', children: [] },
          { id: 'col_b', component: 'Column', children: ['note_field'] }
        ])
      ]}
    />
  )

  const columns = Array.from(view.host.querySelectorAll<HTMLElement>('[data-slot="a2ui-column"]'))
  const colB = columns[2]!
  const textareaAfter = colB.querySelector<HTMLTextAreaElement>('textarea[data-slot~="textarea"]')!
  expect(textareaAfter).not.toBeNull()
  expect(textareaAfter.value).toBe(expectedDraft)
  expect(document.activeElement).toBe(textareaAfter)
  expect(textareaAfter.selectionStart).toBe(1)
  expect(textareaAfter.selectionEnd).toBe(5)
  expect(textareaAfter.scrollTop).toBe(scrollBefore)
})

test('falls back to the following control instead of a duplicate reference when removing one of two shared fields', async () => {
  const step0: A2uiMessage[] = [
    surfaceMessage(
      's_dup_ref_focus',
      [
        { id: 'root', component: 'Column', children: ['col_a', 'col_b', 'after_btn'] },
        { id: 'col_a', component: 'Column', children: ['shared_field'] },
        { id: 'col_b', component: 'Column', children: ['shared_field'] },
        {
          id: 'shared_field',
          component: 'TextField',
          label: 'Shared note',
          value: { '@path': '/note' }
        },
        {
          id: 'after_btn',
          component: 'Button',
          child: 'after_label',
          action: { event: { name: 'after' } }
        },
        { id: 'after_label', component: 'Text', text: 'Following action' }
      ],
      { note: 'Shared value' }
    )
  ]

  const view = await mount(
    <A2uiSurface
      surfaceId="s_dup_ref_focus"
      messages={step0}
    />
  )

  const inputs = Array.from(
    view.host.querySelectorAll<HTMLInputElement>('input[data-slot~="input"]')
  )
  const afterBtn = view.host.querySelector<HTMLButtonElement>('button[data-slot~="button"]')!
  expect(inputs).toHaveLength(2)
  inputs[1]!.focus()
  expect(document.activeElement).toBe(inputs[1])

  await view.render(
    <A2uiSurface
      surfaceId="s_dup_ref_focus"
      messages={[
        ...step0,
        updateComponentsMsg('s_dup_ref_focus', [{ id: 'col_b', component: 'Column', children: [] }])
      ]}
    />
  )

  expect(document.activeElement).toBe(afterBtn)
  expect(document.activeElement).not.toBe(inputs[0])
})

test('preserves DOM fallback order when removing a programmatically focused tabindex=-1 control', async () => {
  const focusRegistry = createA2uiRegistry({
    catalogId: A2UI_BASIC_CATALOG_ID,
    title: 'Programmatic focus test catalog',
    description: 'Registry with a programmatically focusable control.',
    entries: [
      ...Object.values(radiantA2uiRegistry.entries),
      createA2uiRegistryEntry({
        name: 'ProgrammaticTarget',
        accessibility: [],
        component: 'div',
        description: 'Control with tabindex=-1.',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            component: { const: 'ProgrammaticTarget' },
            label: { type: 'string' }
          },
          required: ['component', 'label']
        },
        adapter: props => (
          <div
            tabIndex={-1}
            data-testid="programmatic-target"
          >
            {String(props.label ?? '')}
          </div>
        )
      })
    ]
  })

  const initialMessages: A2uiMessage[] = [
    surfaceMessage('s_programmatic_focus', [
      { id: 'root', component: 'Column', children: ['first_btn', 'mid_target', 'last_btn'] },
      {
        id: 'first_btn',
        component: 'Button',
        child: 'first_label',
        action: { event: { name: 'first' } }
      },
      { id: 'first_label', component: 'Text', text: 'First' },
      { id: 'mid_target', component: 'ProgrammaticTarget', label: 'Programmatic middle' },
      {
        id: 'last_btn',
        component: 'Button',
        child: 'last_label',
        action: { event: { name: 'last' } }
      },
      { id: 'last_label', component: 'Text', text: 'Last' }
    ])
  ]

  const view = await mount(
    <A2uiSurface
      surfaceId="s_programmatic_focus"
      registry={focusRegistry}
      messages={initialMessages}
    />
  )

  const midTarget = view.host.querySelector<HTMLDivElement>('[data-testid="programmatic-target"]')!
  const lastBtn = Array.from(view.host.querySelectorAll<HTMLButtonElement>('button')).find(
    button => button.textContent === 'Last'
  )!
  midTarget.focus()
  expect(document.activeElement).toBe(midTarget)

  await view.render(
    <A2uiSurface
      surfaceId="s_programmatic_focus"
      registry={focusRegistry}
      messages={[
        ...initialMessages,
        updateComponentsMsg('s_programmatic_focus', [
          { id: 'root', component: 'Column', children: ['first_btn', 'last_btn'] }
        ])
      ]}
    />
  )

  expect(document.activeElement).toBe(lastBtn)
})

test('skips focus restoration when document.hasFocus() is false and restores normally when active', async () => {
  const step0: A2uiMessage[] = [
    surfaceMessage('s_inactive_doc', [
      { id: 'root', component: 'Column', children: ['btn_a', 'btn_b', 'btn_c'] },
      { id: 'btn_a', component: 'Button', child: 'lbl_a', action: { event: { name: 'a' } } },
      { id: 'lbl_a', component: 'Text', text: 'Alpha' },
      { id: 'btn_b', component: 'Button', child: 'lbl_b', action: { event: { name: 'b' } } },
      { id: 'lbl_b', component: 'Text', text: 'Beta' },
      { id: 'btn_c', component: 'Button', child: 'lbl_c', action: { event: { name: 'c' } } },
      { id: 'lbl_c', component: 'Text', text: 'Gamma' }
    ])
  ]

  const view = await mount(
    <A2uiSurface
      surfaceId="s_inactive_doc"
      messages={step0}
    />
  )

  const buttonByText = (text: string) =>
    Array.from(view.host.querySelectorAll<HTMLButtonElement>('button')).find(
      button => button.textContent === text
    )!

  buttonByText('Alpha').focus()
  const hasFocusSpy = vi.spyOn(document, 'hasFocus').mockReturnValue(false)
  const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus')
  try {
    const step1 = [
      ...step0,
      updateComponentsMsg('s_inactive_doc', [
        { id: 'root', component: 'Column', children: ['btn_b', 'btn_c'] }
      ])
    ]
    await view.render(
      <A2uiSurface
        surfaceId="s_inactive_doc"
        messages={step1}
      />
    )
    expect(focusSpy).not.toHaveBeenCalled()
    expect(document.activeElement).not.toBe(buttonByText('Beta'))

    hasFocusSpy.mockRestore()
    focusSpy.mockClear()
    buttonByText('Beta').focus()

    await view.render(
      <A2uiSurface
        surfaceId="s_inactive_doc"
        messages={[
          ...step1,
          updateComponentsMsg('s_inactive_doc', [
            { id: 'root', component: 'Column', children: ['btn_c'] }
          ])
        ]}
      />
    )
    expect(document.activeElement).toBe(buttonByText('Gamma'))
  } finally {
    hasFocusSpy.mockRestore()
    focusSpy.mockRestore()
  }
})

test('animates only newly added model instances across variant swaps and coalesces multi-insert discovery', async () => {
  const { animated, restore } = spyEntryAnimations()
  try {
    const step0: A2uiMessage[] = [
      surfaceMessage('s_variant_motion', [
        { id: 'root', component: 'Column', children: ['intro'] },
        { id: 'intro', component: 'Text', text: 'Existing body copy', variant: 'body' }
      ])
    ]

    const view = await mount(
      <A2uiSurface
        surfaceId="s_variant_motion"
        messages={step0}
      />
    )
    expect(animated).toHaveLength(1)
    animated.length = 0

    // Swap existing Text from body (<p>) to caption (<span>) and insert one new sibling in one patch
    const step1 = [
      ...step0,
      updateComponentsMsg('s_variant_motion', [
        { id: 'root', component: 'Column', children: ['intro', 'new_sibling'] },
        { id: 'intro', component: 'Text', text: 'Existing caption copy', variant: 'caption' },
        { id: 'new_sibling', component: 'Text', text: 'Brand new sibling', variant: 'body' }
      ])
    ]
    await view.render(
      <A2uiSurface
        surfaceId="s_variant_motion"
        messages={step1}
      />
    )

    const introSpan = view.host.querySelector<HTMLElement>(
      'span[data-slot="a2ui-text"][data-variant="caption"]'
    )!
    const newSiblingEl = view.host.querySelector<HTMLElement>(
      'p[data-slot="a2ui-text"][data-variant="body"]'
    )!
    expect(introSpan).not.toBeNull()
    expect(animated).toEqual([newSiblingEl])
    expect(animated).not.toContain(introSpan)
    animated.length = 0

    // Multi-insert uses direct host ownership without walking the surface DOM and animates each new node once
    const surfaceEl = view.host.querySelector<HTMLDivElement>('[data-slot="a2ui-surface"]')!
    const qsaSpy = vi.spyOn(surfaceEl, 'querySelectorAll')
    try {
      await view.render(
        <A2uiSurface
          surfaceId="s_variant_motion"
          messages={[
            ...step1,
            updateComponentsMsg('s_variant_motion', [
              {
                id: 'root',
                component: 'Column',
                children: ['intro', 'new_sibling', 'batch_a', 'batch_b', 'batch_c']
              },
              { id: 'batch_a', component: 'Text', text: 'Batch A' },
              { id: 'batch_b', component: 'Text', text: 'Batch B' },
              { id: 'batch_c', component: 'Text', text: 'Batch C' }
            ])
          ]}
        />
      )
      expect(qsaSpy).not.toHaveBeenCalled()
    } finally {
      qsaSpy.mockRestore()
    }

    expect(animated.map(el => el.textContent)).toEqual(['Batch A', 'Batch B', 'Batch C'])
  } finally {
    restore()
  }
})

test('animates newly inserted direct and non-ref-forwarding custom leaves inside an existing custom container without reanimating surviving nodes or earlier local insertions', async () => {
  function CustomPanel({
    ref,
    title,
    children
  }: {
    readonly ref?: Ref<HTMLElement>
    readonly title: string
    readonly children: ReactNode
  }) {
    const [showLocalNote, setShowLocalNote] = useState(false)
    return (
      <section
        ref={ref}
        data-testid="custom-panel"
      >
        <header>
          {title}
          <button
            type="button"
            data-testid="toggle-local-note"
            onClick={() => setShowLocalNote(true)}
          >
            Add local note
          </button>
        </header>
        <div data-testid="custom-panel-body">
          {showLocalNote ? <aside data-testid="local-panel-note">Local note</aside> : null}
          {children}
        </div>
      </section>
    )
  }

  function WrappedBadge({ label }: { readonly label: string }) {
    return <article data-testid="wrapped-badge">{label}</article>
  }

  const customRegistry = createA2uiRegistry({
    catalogId: A2UI_BASIC_CATALOG_ID,
    title: 'Custom container motion catalog',
    description: 'Registry with custom nested container and leaf adapters.',
    entries: [
      ...Object.values(radiantA2uiRegistry.entries),
      createA2uiRegistryEntry({
        name: 'CustomPanel',
        accessibility: [],
        component: CustomPanel,
        description: 'Custom container wrapping children in nested markup.',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            component: { const: 'CustomPanel' },
            title: { type: 'string' },
            children: { $ref: 'common_types.json#/$defs/ChildList' }
          },
          required: ['component', 'title', 'children']
        },
        adapter: (props, ctx) => (
          <CustomPanel title={String(props.title ?? '')}>
            {Array.isArray(props.children)
              ? props.children.map(child =>
                  child && typeof child === 'object' && 'id' in child
                    ? ctx.renderNode(child as Parameters<typeof ctx.renderNode>[0])
                    : null
                )
              : null}
          </CustomPanel>
        )
      }),
      createA2uiRegistryEntry({
        name: 'CustomBadge',
        accessibility: [],
        component: 'article',
        description: 'Direct DOM custom leaf rendered inside a custom container.',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            component: { const: 'CustomBadge' },
            label: { type: 'string' }
          },
          required: ['component', 'label']
        },
        adapter: props => <article data-testid="custom-badge">{String(props.label ?? '')}</article>
      }),
      createA2uiRegistryEntry({
        name: 'WrappedBadge',
        accessibility: [],
        component: WrappedBadge,
        description: 'Non-ref-forwarding custom leaf component rendered inside a custom container.',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            component: { const: 'WrappedBadge' },
            label: { type: 'string' }
          },
          required: ['component', 'label']
        },
        adapter: props => <WrappedBadge label={String(props.label ?? '')} />
      })
    ]
  })

  const { animated, restore } = spyEntryAnimations()
  try {
    const step0: A2uiMessage[] = [
      surfaceMessage('s_custom_container', [
        { id: 'root', component: 'CustomPanel', title: 'Status', children: ['badge_1'] },
        { id: 'badge_1', component: 'CustomBadge', label: 'Existing leaf' }
      ])
    ]

    const view = await mount(
      <A2uiSurface
        surfaceId="s_custom_container"
        registry={customRegistry}
        messages={step0}
      />
    )
    const firstBadge = view.host.querySelector<HTMLElement>('[data-testid="custom-badge"]')!
    expect(animated).toEqual([firstBadge])
    animated.length = 0

    // Direct DOM custom leaf inserted into existing custom container
    const step1 = [
      ...step0,
      updateComponentsMsg('s_custom_container', [
        { id: 'root', component: 'CustomPanel', title: 'Status', children: ['badge_1', 'badge_2'] },
        { id: 'badge_2', component: 'CustomBadge', label: 'Inserted direct leaf' }
      ])
    ]
    await view.render(
      <A2uiSurface
        surfaceId="s_custom_container"
        registry={customRegistry}
        messages={step1}
      />
    )

    const badges = Array.from(
      view.host.querySelectorAll<HTMLElement>('[data-testid="custom-badge"]')
    )
    const panel = view.host.querySelector<HTMLElement>('[data-testid="custom-panel"]')!
    expect(badges).toHaveLength(2)
    expect(animated).toEqual([badges[1]])
    expect(animated).not.toContain(badges[0])
    expect(animated).not.toContain(panel)
    animated.length = 0

    // Trigger an unrelated local DOM insertion inside the same container before the next model patch
    await act(async () => {
      await userEvent.click(
        view.host.querySelector<HTMLButtonElement>('[data-testid="toggle-local-note"]')!
      )
    })
    const localNote = view.host.querySelector<HTMLElement>('[data-testid="local-panel-note"]')!
    expect(localNote).not.toBeNull()
    expect(animated).toEqual([])

    // Non-ref-forwarding custom leaf inserted into the same existing custom container
    await view.render(
      <A2uiSurface
        surfaceId="s_custom_container"
        registry={customRegistry}
        messages={[
          ...step1,
          updateComponentsMsg('s_custom_container', [
            {
              id: 'root',
              component: 'CustomPanel',
              title: 'Status',
              children: ['badge_1', 'badge_2', 'wrapped_leaf']
            },
            { id: 'wrapped_leaf', component: 'WrappedBadge', label: 'Inserted wrapped leaf' }
          ])
        ]}
      />
    )

    const wrappedLeaf = view.host.querySelector<HTMLElement>('[data-testid="wrapped-badge"]')!
    expect(wrappedLeaf).not.toBeNull()
    expect(animated).toEqual([wrappedLeaf])
    expect(animated).not.toContain(localNote)
    expect(animated).not.toContain(badges[0])
    expect(animated).not.toContain(badges[1])
    expect(animated).not.toContain(panel)
    expect(view.host.querySelectorAll('template')).toHaveLength(0)
  } finally {
    restore()
  }
})

test('animates a non-ref-forwarding custom leaf once on initial mount', async () => {
  function WrappedLeaf({ label }: { readonly label: string }) {
    return <article data-testid="initial-wrapped-leaf">{label}</article>
  }

  const registry = createA2uiRegistry({
    catalogId: A2UI_BASIC_CATALOG_ID,
    title: 'Initial wrapped leaf catalog',
    description: 'Registry with a non-ref-forwarding leaf adapter.',
    entries: [
      ...Object.values(radiantA2uiRegistry.entries),
      createA2uiRegistryEntry({
        name: 'WrappedLeaf',
        accessibility: [],
        component: WrappedLeaf,
        description: 'Leaf component that renders its own DOM element without forwarding ref.',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            component: { const: 'WrappedLeaf' },
            label: { type: 'string' }
          },
          required: ['component', 'label']
        },
        adapter: props => <WrappedLeaf label={String(props.label ?? '')} />
      })
    ]
  })

  const { animated, restore } = spyEntryAnimations()
  try {
    const view = await mount(
      <StrictMode>
        <A2uiSurface
          surfaceId="s_initial_wrapped_leaf"
          registry={registry}
          messages={[
            surfaceMessage('s_initial_wrapped_leaf', [
              { id: 'root', component: 'Column', children: ['wrapped_leaf'] },
              { id: 'wrapped_leaf', component: 'WrappedLeaf', label: 'Present on mount' }
            ])
          ]}
        />
      </StrictMode>
    )

    const leaf = view.host.querySelector<HTMLElement>('[data-testid="initial-wrapped-leaf"]')!
    expect(leaf).not.toBeNull()
    expect(animated).toEqual([leaf])
    expect(view.host.querySelectorAll('template')).toHaveLength(0)
  } finally {
    restore()
  }
})

test('animates only a newly inserted non-ref-forwarding leaf when a surviving non-ref-forwarding sibling swaps DOM tags in the same patch', async () => {
  function SwappableNote({
    emphasized,
    text
  }: {
    readonly emphasized: boolean
    readonly text: string
  }) {
    return emphasized ? (
      <strong data-testid="swappable-note">{text}</strong>
    ) : (
      <p data-testid="swappable-note">{text}</p>
    )
  }

  function WrappedLeaf({ label }: { readonly label: string }) {
    return <article data-testid="patched-wrapped-leaf">{label}</article>
  }

  const registry = createA2uiRegistry({
    catalogId: A2UI_BASIC_CATALOG_ID,
    title: 'Sibling swap motion catalog',
    description: 'Registry with two non-ref-forwarding leaf adapters.',
    entries: [
      ...Object.values(radiantA2uiRegistry.entries),
      createA2uiRegistryEntry({
        name: 'SwappableNote',
        accessibility: [],
        component: SwappableNote,
        description: 'Non-ref-forwarding leaf that swaps between p and strong.',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            component: { const: 'SwappableNote' },
            emphasized: { type: 'boolean' },
            text: { type: 'string' }
          },
          required: ['component', 'emphasized', 'text']
        },
        adapter: props => (
          <SwappableNote
            emphasized={props.emphasized === true}
            text={String(props.text ?? '')}
          />
        )
      }),
      createA2uiRegistryEntry({
        name: 'WrappedLeaf',
        accessibility: [],
        component: WrappedLeaf,
        description: 'Non-ref-forwarding leaf component.',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            component: { const: 'WrappedLeaf' },
            label: { type: 'string' }
          },
          required: ['component', 'label']
        },
        adapter: props => <WrappedLeaf label={String(props.label ?? '')} />
      })
    ]
  })

  const { animated, restore } = spyEntryAnimations()
  try {
    const step0: A2uiMessage[] = [
      surfaceMessage('s_swap_wrapped_sibling', [
        { id: 'root', component: 'Column', children: ['surviving_note'] },
        {
          id: 'surviving_note',
          component: 'SwappableNote',
          emphasized: false,
          text: 'Initial paragraph'
        }
      ])
    ]

    const view = await mount(
      <A2uiSurface
        surfaceId="s_swap_wrapped_sibling"
        registry={registry}
        messages={step0}
      />
    )

    const noteBefore = view.host.querySelector<HTMLElement>('[data-testid="swappable-note"]')!
    expect(noteBefore.tagName).toBe('P')
    expect(animated).toEqual([noteBefore])
    animated.length = 0

    await view.render(
      <A2uiSurface
        surfaceId="s_swap_wrapped_sibling"
        registry={registry}
        messages={[
          ...step0,
          updateComponentsMsg('s_swap_wrapped_sibling', [
            { id: 'root', component: 'Column', children: ['surviving_note', 'new_leaf'] },
            {
              id: 'surviving_note',
              component: 'SwappableNote',
              emphasized: true,
              text: 'Promoted strong text'
            },
            { id: 'new_leaf', component: 'WrappedLeaf', label: 'Inserted wrapped leaf' }
          ])
        ]}
      />
    )

    const noteAfter = view.host.querySelector<HTMLElement>('[data-testid="swappable-note"]')!
    const newLeaf = view.host.querySelector<HTMLElement>('[data-testid="patched-wrapped-leaf"]')!
    expect(noteAfter.tagName).toBe('STRONG')
    expect(noteAfter).not.toBe(noteBefore)
    expect(noteBefore.isConnected).toBe(false)
    expect(newLeaf).not.toBeNull()
    expect(animated).toEqual([newLeaf])
    expect(animated).not.toContain(noteAfter)
    expect(view.host.querySelectorAll('template')).toHaveLength(0)
  } finally {
    restore()
  }
})

test('animates visible top-level hosts of a newly inserted Fragment adapter even when preceded by a hidden span', async () => {
  const registry = createA2uiRegistry({
    catalogId: A2UI_BASIC_CATALOG_ID,
    title: 'Fragment motion catalog',
    description: 'Registry with Fragment adapters returning hidden and visible top-level hosts.',
    entries: [
      ...Object.values(radiantA2uiRegistry.entries),
      createA2uiRegistryEntry({
        name: 'HiddenPrefixCard',
        accessibility: [],
        component: 'article',
        description: 'Fragment with a hidden span followed by a visible article.',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            component: { const: 'HiddenPrefixCard' },
            label: { type: 'string' }
          },
          required: ['component', 'label']
        },
        adapter: props => (
          <>
            <span
              hidden
              data-testid="fragment-hidden-span"
            >
              hidden metadata
            </span>
            <article data-testid="fragment-visible-article">{String(props.label ?? '')}</article>
          </>
        )
      }),
      createA2uiRegistryEntry({
        name: 'MultiHostFragment',
        accessibility: [],
        component: 'article',
        description: 'Fragment with a hidden span and two visible top-level hosts.',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            component: { const: 'MultiHostFragment' },
            first: { type: 'string' },
            second: { type: 'string' }
          },
          required: ['component', 'first', 'second']
        },
        adapter: props => (
          <>
            <span
              hidden
              data-testid="multi-hidden-span"
            >
              meta
            </span>
            <article data-testid="multi-first-article">{String(props.first ?? '')}</article>
            <aside data-testid="multi-second-aside">{String(props.second ?? '')}</aside>
          </>
        )
      })
    ]
  })

  const { animated, restore } = spyEntryAnimations()
  try {
    const step0: A2uiMessage[] = [
      surfaceMessage('s_fragment_motion', [
        { id: 'root', component: 'Column', children: ['existing_text'] },
        { id: 'existing_text', component: 'Text', text: 'Surviving sibling' }
      ])
    ]

    const view = await mount(
      <A2uiSurface
        surfaceId="s_fragment_motion"
        registry={registry}
        messages={step0}
      />
    )
    const existingText = view.host.querySelector<HTMLElement>('p[data-slot="a2ui-text"]')!
    expect(animated).toEqual([existingText])
    animated.length = 0

    // Insert a Fragment with a hidden <span> followed by a visible <article>
    const step1 = [
      ...step0,
      updateComponentsMsg('s_fragment_motion', [
        { id: 'root', component: 'Column', children: ['existing_text', 'hidden_prefix_card'] },
        {
          id: 'hidden_prefix_card',
          component: 'HiddenPrefixCard',
          label: 'Visible article after hidden span'
        }
      ])
    ]
    await view.render(
      <A2uiSurface
        surfaceId="s_fragment_motion"
        registry={registry}
        messages={step1}
      />
    )

    const hiddenSpan = view.host.querySelector<HTMLElement>('[data-testid="fragment-hidden-span"]')!
    const visibleArticle = view.host.querySelector<HTMLElement>(
      '[data-testid="fragment-visible-article"]'
    )!
    expect(hiddenSpan).not.toBeNull()
    expect(visibleArticle).not.toBeNull()
    expect(animated).toEqual([visibleArticle])
    expect(animated).not.toContain(hiddenSpan)
    expect(animated).not.toContain(existingText)
    animated.length = 0

    // Insert a Fragment with a hidden <span> and two visible top-level hosts
    await view.render(
      <A2uiSurface
        surfaceId="s_fragment_motion"
        registry={registry}
        messages={[
          ...step1,
          updateComponentsMsg('s_fragment_motion', [
            {
              id: 'root',
              component: 'Column',
              children: ['existing_text', 'hidden_prefix_card', 'multi_host_card']
            },
            {
              id: 'multi_host_card',
              component: 'MultiHostFragment',
              first: 'First visible host',
              second: 'Second visible host'
            }
          ])
        ]}
      />
    )

    const multiHidden = view.host.querySelector<HTMLElement>('[data-testid="multi-hidden-span"]')!
    const multiFirst = view.host.querySelector<HTMLElement>('[data-testid="multi-first-article"]')!
    const multiSecond = view.host.querySelector<HTMLElement>('[data-testid="multi-second-aside"]')!
    expect(animated).toEqual([multiFirst, multiSecond])
    expect(animated).not.toContain(multiHidden)
    expect(animated).not.toContain(visibleArticle)
    expect(animated).not.toContain(existingText)
    expect(view.host.querySelectorAll('template')).toHaveLength(0)
  } finally {
    restore()
  }
})

test('restores focus to the next control when rendering inside a same-origin iframe', async () => {
  const step0: A2uiMessage[] = [
    surfaceMessage('s_iframe_focus', [
      { id: 'root', component: 'Column', children: ['btn_1', 'btn_2'] },
      { id: 'btn_1', component: 'Button', child: 'lbl_1', action: { event: { name: 'first' } } },
      { id: 'lbl_1', component: 'Text', text: 'First in iframe' },
      { id: 'btn_2', component: 'Button', child: 'lbl_2', action: { event: { name: 'second' } } },
      { id: 'lbl_2', component: 'Text', text: 'Second in iframe' }
    ])
  ]

  const iframe = document.createElement('iframe')
  document.body.appendChild(iframe)
  try {
    const iframeDoc = iframe.contentDocument!
    const iframeHost = iframeDoc.createElement('div')
    iframeDoc.body.appendChild(iframeHost)

    const view = await mount(
      createPortal(
        <A2uiSurface
          surfaceId="s_iframe_focus"
          messages={step0}
        />,
        iframeHost
      )
    )

    const buttons = () => Array.from(iframeHost.querySelectorAll<HTMLButtonElement>('button'))
    expect(buttons()).toHaveLength(2)
    buttons()[0]!.focus()
    expect(iframeDoc.activeElement).toBe(buttons()[0])

    await view.render(
      createPortal(
        <A2uiSurface
          surfaceId="s_iframe_focus"
          messages={[
            ...step0,
            updateComponentsMsg('s_iframe_focus', [
              { id: 'root', component: 'Column', children: ['btn_2'] }
            ])
          ]}
        />,
        iframeHost
      )
    )

    expect(iframeDoc.activeElement).toBe(buttons()[0])
    expect(buttons()[0]!.textContent).toBe('Second in iframe')
  } finally {
    iframe.remove()
  }
})

test('parses leading-decimal motion durations (.25s -> 250ms, .0s -> off) and falls back for invalid tokens', async () => {
  const { animated, durations, restore } = spyEntryAnimations()
  const singleText = (surfaceId: string) => [
    surfaceMessage(surfaceId, [
      { id: 'root', component: 'Column', children: ['t1'] },
      { id: 't1', component: 'Text', text: surfaceId }
    ])
  ]

  try {
    await mount(
      <div style={{ '--rad-motion-release-duration': '.25s' } as CSSProperties}>
        <A2uiSurface
          surfaceId="s_dur_250"
          messages={singleText('s_dur_250')}
        />
      </div>
    )
    expect(animated).toHaveLength(1)
    expect(durations).toEqual([250])
    animated.length = 0
    durations.length = 0

    await mount(
      <div style={{ '--rad-motion-release-duration': '.0s' } as CSSProperties}>
        <A2uiSurface
          surfaceId="s_dur_zero"
          messages={singleText('s_dur_zero')}
        />
      </div>
    )
    expect(animated).toEqual([])
    expect(durations).toEqual([])

    await mount(
      <div style={{ '--rad-motion-release-duration': 'invalid' } as CSSProperties}>
        <A2uiSurface
          surfaceId="s_dur_invalid"
          messages={singleText('s_dur_invalid')}
        />
      </div>
    )
    expect(animated).toHaveLength(1)
    expect(durations).toEqual([160])
  } finally {
    restore()
  }
})

test('renders and stays interactive when --rad-motion-release-ease uses an invalid CSS easing list', async () => {
  const onAction = vi.fn<(action: A2uiActionPayload) => void>()
  const { host } = await mount(
    <div style={{ '--rad-motion-release-ease': 'ease, linear' } as CSSProperties}>
      <A2uiSurface
        surfaceId="s_invalid_ease"
        onAction={onAction}
        messages={[
          surfaceMessage(
            's_invalid_ease',
            [
              { id: 'root', component: 'Column', children: ['intro', 'name_field', 'go_btn'] },
              { id: 'intro', component: 'Text', text: 'Still renders cleanly' },
              {
                id: 'name_field',
                component: 'TextField',
                label: 'Workspace name',
                value: { '@path': '/name' }
              },
              {
                id: 'go_btn',
                component: 'Button',
                child: 'go_label',
                action: { event: { name: 'submit' } }
              },
              { id: 'go_label', component: 'Text', text: 'Submit' }
            ],
            { name: 'Radiant' }
          )
        ]}
      />
    </div>
  )

  expect(host.textContent).toContain('Still renders cleanly')
  const input = host.querySelector<HTMLInputElement>('input[data-slot~="input"]')!
  const button = host.querySelector<HTMLButtonElement>('button[data-slot~="button"]')!
  expect(input.value).toBe('Radiant')
  await act(async () => {
    await userEvent.click(button)
  })
  expect(onAction).toHaveBeenCalledTimes(1)
  expect(onAction.mock.calls[0]![0].action).toBe('submit')
})
