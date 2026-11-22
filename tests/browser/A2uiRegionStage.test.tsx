import { act } from 'react'
import { expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  A2UI_PROTOCOL_VERSION,
  A2uiSurface,
  RADIANT_A2UI_EXTENSION_CATALOG_ID,
  validateA2uiAccessibility,
  type A2uiMessage,
  type A2uiSurfaceLabels,
  type CatalogDiagnostic
} from '../../src/a2ui/index.js'
import {
  REGION_STAGE_SURFACE_ID,
  regionStageFixtureMessages
} from '../../src/a2ui/regionStageFixtures.js'
import { mount } from './familyHarness.js'

const labels = { zoomIn: 'Zoom in', zoomOut: 'Zoom out', zoomReset: 'Reset view' }

async function render(messages: readonly A2uiMessage[], surfaceLabels?: A2uiSurfaceLabels) {
  const diagnostics: CatalogDiagnostic[] = []
  const view = await mount(
    <A2uiSurface
      surfaceId={REGION_STAGE_SURFACE_ID}
      messages={messages}
      labels={surfaceLabels}
      onDiagnostic={d => diagnostics.push(d)}
    />
  )
  return { ...view, diagnostics }
}

const stage = (props: Record<string, unknown>): A2uiMessage[] => [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: REGION_STAGE_SURFACE_ID,
      catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
      components: [{ id: 'root', component: 'RegionStage', ...props }]
    }
  }
]

const button = (host: HTMLElement, name: string) =>
  Array.from(host.querySelectorAll<Element>('[role="button"], button')).find(
    node => node.getAttribute('aria-label') === name
  )

test('RegionStage binds its selection and names its zoom buttons from host labels', async () => {
  const { host, diagnostics } = await render(regionStageFixtureMessages, labels)
  expect(host.querySelector('[role="group"][aria-label="Rooms to book"]')).not.toBeNull()
  expect(button(host, 'Studio')).toHaveAttribute('aria-pressed', 'true')
  expect(button(host, 'Zoom in')).toBeDefined()
  await act(async () => {
    await userEvent.click(button(host, 'Lobby')!)
  })
  expect(button(host, 'Lobby')).toHaveAttribute('aria-pressed', 'true')
  expect(button(host, 'Studio')).toHaveAttribute('aria-pressed', 'true')
  expect(button(host, 'Fire exit')).toHaveAttribute('aria-expanded', 'false')
  expect(diagnostics.filter(d => d.component === 'RegionStage')).toEqual([])
})

test('without host labels RegionStage shows no zoom buttons and reports a defaulted diagnostic', async () => {
  const { host, diagnostics } = await render(regionStageFixtureMessages)
  expect(button(host, 'Zoom in')).toBeUndefined()
  expect(host.querySelector('[data-slot~="region-stage-viewport"]')).not.toBeNull()
  expect(
    diagnostics.some(
      d => d.component === 'RegionStage' && d.kind === 'defaulted' && d.prop === 'controls'
    )
  ).toBe(true)
})

test('RegionStage drops invalid regions and pins, keeps local selection, and falls back', async () => {
  const { host, diagnostics } = await render(
    stage({
      label: 'Plan',
      viewBox: '0 0 100 100',
      regions: [
        { value: 'a', label: 'A', path: 'M0 0h50v50H0z', series: 9 },
        { value: 'a', label: 'Again', path: 'M50 0h50v50H50z' },
        { value: 'b', label: ' ', path: 'M0 50h50v50H0z' }
      ],
      pins: [
        { x: 10, y: 10, label: 'Pin' },
        { x: 20, y: 10, label: ' ' }
      ]
    }),
    labels
  )
  expect(button(host, 'A')).toHaveAttribute('aria-pressed', 'false')
  await act(async () => {
    await userEvent.click(button(host, 'A')!)
  })
  expect(button(host, 'A')).toHaveAttribute('aria-pressed', 'true')
  const coerced = diagnostics
    .filter(
      d =>
        d.component === 'RegionStage' &&
        d.kind === 'coerced' &&
        (d.prop === 'regions' || d.prop === 'pins')
    )
    .map(({ prop, received, used }) => ({ prop, received, used }))
  expect(coerced).toEqual([
    { prop: 'regions', received: 3, used: 1 },
    { prop: 'pins', received: 2, used: 1 }
  ])

  const broken = await render(
    stage({
      label: 'Plan',
      viewBox: '0 0 0 0',
      regions: [{ value: 'a', label: 'A', path: 'M0 0' }]
    })
  )
  expect(broken.host.querySelector('[data-slot~="region-stage"]')).toBeNull()
  expect(
    broken.diagnostics.some(
      d => d.component === 'RegionStage' && d.kind === 'fallback' && d.prop === 'viewBox'
    )
  ).toBe(true)
})

test('the RegionStage label rule flags a missing label', () => {
  const rules = (label: unknown) =>
    validateA2uiAccessibility(
      stage({ label, viewBox: '0 0 1 1', regions: [{ value: 'a', label: 'A', path: 'M0 0' }] })
    ).errors.map(error => error.rule)
  expect(rules('Plan')).not.toContain('region-stage-label')
  expect(rules(' ')).toContain('region-stage-label')
})
