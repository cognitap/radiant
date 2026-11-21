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
  malformedProfileFixtureMessages,
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
  expect(payload.name).toBe('save_profile')
  expect(payload.surfaceId).toBe(PROFILE_SURFACE_ID)
  expect(payload.sourceComponentId).toBe('save_button')
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
