import { renderToString } from 'react-dom/server'
import { afterEach, expect, test } from 'vitest'
import { commands } from 'vitest/browser'
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
  const sizes: { title: ReturnType<typeof rect>; button?: ReturnType<typeof rect> }[] = []
  for (let count = 2; count <= propStreamFixtureMessages.length; count++) {
    await view.render(surface(count))
    const title = host.querySelector('[data-slot="a2ui-text"]')
    const button = host.querySelector('button')
    sizes.push({ title: rect(title), button: button ? rect(button) : undefined })
    // The title placeholder reserved the title's line, so the next node never moves
    expect(rect(second()).top).toBe(nextTop)
  }
  const [firstTitle] = sizes
  for (const size of sizes) expect(size.title).toEqual(firstTitle!.title)
  const buttons = sizes.flatMap(size => (size.button ? [size.button] : []))
  expect(buttons.length).toBeGreaterThan(1)
  for (const button of buttons) expect(button).toEqual(buttons[0])
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
