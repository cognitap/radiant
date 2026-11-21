import { act, StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  A2UI_BASIC_CATALOG_ID,
  A2UI_PROTOCOL_VERSION,
  A2uiSurface,
  radiantA2uiRegistry,
  type A2uiMessage,
  type CatalogDiagnostic
} from '../../src/a2ui/index.js'
import {
  PROFILE_SURFACE_ID,
  profileFixtureMessages,
  propStreamFixtureMessages,
  STREAMED_SURFACE_ID,
  streamedFixtureMessages
} from '../../src/a2ui/fixtures.js'
import { mount } from './familyHarness.js'
import type {} from './mediaCommands.js'

afterEach(async () => {
  await commands.emulatePreferences({ reducedMotion: 'no-preference' })
})

const surfaceOf = (host: HTMLElement) =>
  host.querySelector<HTMLElement>('[data-slot="a2ui-surface"]')!
const placeholderIds = (host: HTMLElement) =>
  [...host.querySelectorAll<HTMLElement>('[data-slot~="a2ui-placeholder"]')].map(
    el => el.dataset.nodeId ?? '(root)'
  )
const errorsOf = (diagnostics: readonly CatalogDiagnostic[]) =>
  diagnostics.filter(d => d.kind === 'error')

const message = (body: Record<string, unknown>): A2uiMessage => ({
  version: A2UI_PROTOCOL_VERSION,
  ...body
})

test('replays a streamed fixture through placeholders to its final output', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const surface = (count: number) => (
    <A2uiSurface
      surfaceId={STREAMED_SURFACE_ID}
      messages={streamedFixtureMessages.slice(0, count)}
      onDiagnostic={d => diagnostics.push(d)}
    />
  )
  const view = await mount(surface(1))
  const { host } = view

  // No root yet: one root placeholder, even after a child arrives first
  expect(placeholderIds(host)).toEqual(['(root)'])
  expect(surfaceOf(host).getAttribute('aria-busy')).toBe('true')
  await view.render(surface(2))
  expect(placeholderIds(host)).toEqual(['(root)'])

  // Root arrives: missing children become placeholders, the early child renders
  await view.render(surface(3))
  expect(placeholderIds(host)).toEqual(['heading_text', 'name_field', 'submit_button'])
  expect(host.querySelectorAll('[data-slot="a2ui-text"]')).toHaveLength(1)
  for (const placeholder of host.querySelectorAll('[data-slot~="a2ui-placeholder"]')) {
    expect(placeholder.getAttribute('aria-hidden')).toBe('true')
  }
  expect(surfaceOf(host).getAttribute('aria-busy')).toBe('true')

  // The button arrives before its label, which stays an inline placeholder
  await view.render(surface(4))
  expect(placeholderIds(host)).toEqual(['heading_text', 'name_field', 'submit_label'])
  expect(host.querySelector('button [data-slot~="a2ui-placeholder"]')).not.toBeNull()

  for (let count = 5; count <= streamedFixtureMessages.length; count++) {
    await view.render(surface(count))
  }
  expect(placeholderIds(host)).toEqual([])
  expect(surfaceOf(host).hasAttribute('aria-busy')).toBe(false)
  expect(host.textContent).toContain('Weekly check-in')
  expect(host.textContent).toContain('Welcome back, Ada.')
  expect(host.querySelector('button')!.textContent).toBe('Send check-in')
  expect(host.querySelector<HTMLInputElement>('input')!.value).toBe('Ada')
  expect(errorsOf(diagnostics)).toEqual([])
})

test('a fixture streamed one prop at a time does not shift a node once its size is known', async () => {
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  const surface = (count: number) => (
    <div style={{ width: '320px' }}>
      <A2uiSurface
        surfaceId={STREAMED_SURFACE_ID}
        messages={propStreamFixtureMessages.slice(0, count)}
      />
    </div>
  )
  const view = await mount(surface(1))
  const { host } = view
  const rect = (el: Element | null) => {
    const box = el!.getBoundingClientRect()
    return { top: box.top, width: box.width, height: box.height }
  }
  const second = () => surfaceOf(host).querySelector('[data-slot="a2ui-column"]')!.children[1]!

  const nextTop = rect(second()).top
  const sizes: { title?: ReturnType<typeof rect>; button?: ReturnType<typeof rect> }[] = []
  for (let count = 2; count <= propStreamFixtureMessages.length; count++) {
    await view.render(surface(count))
    const title = host.querySelector('[data-slot="a2ui-text"]')
    const button = host.querySelector('button')
    sizes.push({
      title: title ? rect(title) : undefined,
      button: button ? rect(button) : undefined
    })
    // Placeholders reserve the title's line, so the next node never moves
    expect(rect(second()).top).toBe(nextTop)
  }
  // Text without its text yet reserves its line from the first message
  expect(sizes[0]!.title!.height).toBeGreaterThan(0)
  for (const key of ['title', 'button'] as const) {
    const known = sizes.flatMap(size => (size[key] ? [size[key]] : []))
    expect(known.length, key).toBeGreaterThan(1)
    for (const box of known) expect(box, key).toEqual(known[0])
  }
})

test('a snapshot createSurface with components and dataModel renders in one pass', async () => {
  const markup = renderToString(
    <A2uiSurface
      surfaceId={PROFILE_SURFACE_ID}
      messages={profileFixtureMessages}
    />
  )
  expect(markup).toContain('Update how your name appears across shared workspaces.')
  expect(markup).toContain('value="Ada Lovelace"')
  expect(markup).not.toContain('a2ui-placeholder')
  expect(markup).not.toContain('aria-busy="')

  const { host } = await mount(
    <A2uiSurface
      surfaceId={PROFILE_SURFACE_ID}
      messages={profileFixtureMessages}
    />,
    true
  )
  expect(placeholderIds(host)).toEqual([])
  expect(surfaceOf(host).hasAttribute('aria-busy')).toBe(false)
})

test('buffers updates that arrive before their createSurface', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const { host } = await mount(
    <A2uiSurface
      surfaceId="early"
      messages={[
        message({
          updateComponents: {
            surfaceId: 'early',
            components: [{ id: 'root', component: 'Text', text: { '@path': '/note' } }]
          }
        }),
        message({ updateDataModel: { surfaceId: 'early', path: '/note', value: 'Buffered' } }),
        message({ createSurface: { surfaceId: 'early', catalogId: A2UI_BASIC_CATALOG_ID } })
      ]}
      onDiagnostic={d => diagnostics.push(d)}
    />
  )
  expect(host.textContent).toBe('Buffered')
  expect(errorsOf(diagnostics)).toEqual([])
})

test('reports unknown components, bad references, and protocol errors to onDiagnostic without crashing', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const { host } = await mount(
    <A2uiSurface
      surfaceId="broken"
      messages={[
        message({
          createSurface: {
            surfaceId: 'broken',
            catalogId: A2UI_BASIC_CATALOG_ID,
            components: [
              { id: 'root', component: 'Column', children: ['intro', 'banner', 'loop'] },
              { id: 'intro', component: 'Text', text: 'Still here' },
              { id: 'banner', component: 'PromoBanner', text: 'Promo' },
              { id: 'loop', component: 'Column', children: ['root'] }
            ]
          }
        }),
        message({ createSurface: { surfaceId: 'broken', catalogId: A2UI_BASIC_CATALOG_ID } }),
        message({ updateComponents: { surfaceId: 'broken', components: 'nope' } })
      ]}
      onDiagnostic={d => diagnostics.push(d)}
    />
  )
  expect(host.textContent).toContain('Still here')
  expect(host.textContent).toContain('Promo')
  const errors = errorsOf(diagnostics)
  expect(errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'UNKNOWN_COMPONENT_TYPE',
        nodeId: 'banner',
        component: 'PromoBanner'
      }),
      expect.objectContaining({ code: 'CYCLIC_REFERENCE', nodeId: 'root' })
    ])
  )
  // The duplicate createSurface and the malformed update each report one protocol error
  expect(errors.length).toBe(4)
  for (const error of errors) {
    expect(error).toEqual(
      expect.objectContaining({
        kind: 'error',
        code: expect.any(String),
        reason: expect.any(String)
      })
    )
  }
})

test('every registry entry renders cleanly from partial props', async () => {
  for (const name of Object.keys(radiantA2uiRegistry.entries)) {
    const diagnostics: CatalogDiagnostic[] = []
    const { host } = await mount(
      <A2uiSurface
        surfaceId={`partial_${name}`}
        messages={[
          message({
            createSurface: {
              surfaceId: `partial_${name}`,
              catalogId: A2UI_BASIC_CATALOG_ID,
              components: [
                { id: 'root', component: 'Column', children: ['partial_node'] },
                { id: 'partial_node', component: name }
              ]
            }
          })
        ]}
        onDiagnostic={d => diagnostics.push(d)}
      />
    )
    expect(
      diagnostics.filter(d => d.kind === 'error' || d.prop === 'render'),
      name
    ).toEqual([])
    expect(host.querySelector('[data-slot="a2ui-column"]')!.childElementCount, name).toBe(1)
  }
})

const create = (surfaceId: string, extra: Record<string, unknown> = {}) =>
  message({ createSurface: { surfaceId, catalogId: A2UI_BASIC_CATALOG_ID, ...extra } })
const rootText = (text: unknown) => [{ id: 'root', component: 'Text', text }]

test('renders nothing after deleteSurface and renders a recreated surface', async () => {
  const first = create('cycle', { components: rootText('First') })
  const deleted = message({ deleteSurface: { surfaceId: 'cycle' } })
  const second = create('cycle', { components: rootText('Second') })
  const surface = (messages: readonly A2uiMessage[]) => (
    <A2uiSurface
      surfaceId="cycle"
      messages={messages}
    />
  )
  const view = await mount(surface([first]))
  expect(view.host.textContent).toBe('First')

  await view.render(surface([first, deleted]))
  expect(view.host.textContent).toBe('')
  expect(placeholderIds(view.host)).toEqual([])
  expect(surfaceOf(view.host).hasAttribute('aria-busy')).toBe(false)

  await view.render(surface([first, deleted, second]))
  expect(view.host.textContent).toBe('Second')
  expect(surfaceOf(view.host).hasAttribute('aria-busy')).toBe(false)
})

test('reports errors raised after an interaction and protocol errors arriving in a patch', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const onDiagnostic = (d: CatalogDiagnostic) => diagnostics.push(d)
  const initial = [
    create('late_errors', {
      components: [
        {
          id: 'root',
          component: 'Button',
          child: 'label',
          action: { functionCall: { call: 'missingFn' } }
        },
        { id: 'label', component: 'Text', text: 'Run' }
      ]
    })
  ]
  const view = await mount(
    <A2uiSurface
      surfaceId="late_errors"
      messages={initial}
      onDiagnostic={onDiagnostic}
    />
  )
  expect(errorsOf(diagnostics)).toEqual([])

  await act(async () => {
    await userEvent.click(view.host.querySelector('button')!)
  })
  expect(errorsOf(diagnostics)).toEqual([
    expect.objectContaining({ kind: 'error', code: expect.any(String) })
  ])

  await view.render(
    <A2uiSurface
      surfaceId="late_errors"
      messages={[
        ...initial,
        message({ updateComponents: { surfaceId: 'late_errors', components: 'nope' } })
      ]}
      onDiagnostic={onDiagnostic}
    />
  )
  expect(errorsOf(diagnostics)).toHaveLength(2)
  expect(view.host.textContent).toBe('Run')
})

test('reports an unknown component once while its props stream in', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const stream = [
    create('unknown_stream', {
      components: [{ id: 'root', component: 'Column', children: ['promo'] }]
    }),
    ...[{}, { text: 'Promo' }, { text: 'Promo', tone: 'loud' }].map(props =>
      message({
        updateComponents: {
          surfaceId: 'unknown_stream',
          components: [{ id: 'promo', component: 'PromoBanner', ...props }]
        }
      })
    )
  ]
  const surface = (count: number) => (
    <A2uiSurface
      surfaceId="unknown_stream"
      messages={stream.slice(0, count)}
      onDiagnostic={d => diagnostics.push(d)}
    />
  )
  const view = await mount(surface(1))
  for (let count = 2; count <= stream.length; count++) await view.render(surface(count))
  expect(view.host.textContent).toBe('Promo')
  expect(errorsOf(diagnostics)).toEqual([
    expect.objectContaining({ code: 'UNKNOWN_COMPONENT_TYPE', nodeId: 'promo' })
  ])
})

test('a snapshot createSurface supersedes buffered updates', async () => {
  const { host } = await mount(
    <A2uiSurface
      surfaceId="snapshot"
      messages={[
        message({ updateComponents: { surfaceId: 'snapshot', components: rootText('Early') } }),
        message({ updateDataModel: { surfaceId: 'snapshot', path: '/note', value: 'Stale' } }),
        create('snapshot', {
          components: rootText({ '@path': '/note' }),
          dataModel: { note: 'Snapshot' }
        })
      ]}
    />
  )
  expect(host.textContent).toBe('Snapshot')
})

test('a failed createSurface clears busy and reports the dropped updates', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const { host } = await mount(
    <A2uiSurface
      surfaceId="bad_catalog"
      messages={[
        message({ updateComponents: { surfaceId: 'bad_catalog', components: rootText('Held') } }),
        message({
          createSurface: { surfaceId: 'bad_catalog', catalogId: 'https://example.com/unknown.json' }
        })
      ]}
      onDiagnostic={d => diagnostics.push(d)}
    />
  )
  expect(host.textContent).toBe('')
  expect(placeholderIds(host)).toEqual([])
  expect(surfaceOf(host).hasAttribute('aria-busy')).toBe(false)
  expect(errorsOf(diagnostics).map(d => d.code)).toEqual([expect.any(String), 'DROPPED_UPDATES'])
})

test('authored empty text does not reserve a line', async () => {
  const { host } = await mount(
    <A2uiSurface
      surfaceId="empty_text"
      messages={[
        create('empty_text', {
          components: [
            { id: 'root', component: 'Column', children: ['empty', 'pending'] },
            { id: 'empty', component: 'Text', text: '' },
            { id: 'pending', component: 'Text', text: { '@path': '/missing' } }
          ]
        })
      ]}
    />
  )
  const [empty, pending] = host.querySelectorAll<HTMLElement>('[data-slot="a2ui-text"]')
  expect(empty!.getBoundingClientRect().height).toBe(0)
  expect(pending!.getBoundingClientRect().height).toBeGreaterThan(0)
})

test('a StrictMode stream settles aria-busy without duplicate diagnostics', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const stream = [
    ...streamedFixtureMessages,
    message({
      updateComponents: {
        surfaceId: STREAMED_SURFACE_ID,
        components: [
          { id: 'root', component: 'Column', children: ['heading_text', 'promo'] },
          { id: 'promo', component: 'PromoBanner', text: 'Promo' }
        ]
      }
    }),
    message({ updateComponents: { surfaceId: STREAMED_SURFACE_ID, components: 'nope' } })
  ]
  const surface = (count: number) => (
    <StrictMode>
      <A2uiSurface
        surfaceId={STREAMED_SURFACE_ID}
        messages={stream.slice(0, count)}
        onDiagnostic={d => diagnostics.push(d)}
      />
    </StrictMode>
  )
  const view = await mount(surface(1))
  expect(surfaceOf(view.host).getAttribute('aria-busy')).toBe('true')
  for (let count = 2; count <= stream.length; count++) await view.render(surface(count))
  expect(surfaceOf(view.host).hasAttribute('aria-busy')).toBe(false)
  expect(view.host.textContent).toBe('Weekly check-inPromo')
  const errors = errorsOf(diagnostics)
  expect(errors.map(d => d.code)).toEqual(['UNKNOWN_COMPONENT_TYPE', expect.any(String)])
  const keys = diagnostics.map(d => JSON.stringify(d))
  expect(new Set(keys).size).toBe(keys.length)
})

test('a finished surface with a text-less Text reserves the line and is not busy', async () => {
  const { host } = await mount(
    <A2uiSurface
      surfaceId="textless"
      messages={[
        create('textless', {
          components: [
            { id: 'root', component: 'Column', children: ['missing'] },
            { id: 'missing', component: 'Text' }
          ]
        })
      ]}
    />
  )
  const text = host.querySelector<HTMLElement>('[data-slot="a2ui-text"]')!
  expect(text.textContent).toBe('')
  expect(text.getBoundingClientRect().height).toBeGreaterThan(0)
  expect(placeholderIds(host)).toEqual([])
  expect(surfaceOf(host).hasAttribute('aria-busy')).toBe(false)
})
