import { createRef, StrictMode, type ReactNode } from 'react'
import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { extendCatalog, radiantCatalog } from '../../src/catalog/index.js'
import {
  Button,
  Skeleton,
  Stage,
  StageActions,
  StageBody,
  StageDescription,
  StageFooter,
  StageHeader,
  StageTitle,
  ThemeScope,
  defineTheme,
  type StageProps
} from '../../src/index.js'
import {
  A2UI_PROTOCOL_VERSION,
  RADIANT_A2UI_EXTENSION_CATALOG_ID,
  A2uiSurface,
  createA2uiExtensionEntry,
  createA2uiExtensionRegistry,
  runA2uiAction,
  validateA2uiAccessibility,
  type A2uiRegistry,
  type A2uiActionPayload,
  type A2uiMessage,
  type CatalogDiagnostic
} from '../../src/a2ui/index.js'
import {
  STAGE_SURFACE_ID,
  stageFixtureMessages,
  stageStreamingFixtureMessages
} from '../../src/a2ui/stageFixtures.js'
import { mount } from './familyHarness.js'

const modes = ['light', 'dark'] as const
const box = (node: Element) => node.getBoundingClientRect()
// The ratio body's content box, inside the padding that leaves room for focus rings.
const content = (node: Element) => {
  const rect = box(node),
    style = getComputedStyle(node)
  const [top, right, bottom, left] = ['Top', 'Right', 'Bottom', 'Left'].map(side =>
    parseFloat(style.getPropertyValue(`padding-${side.toLowerCase()}`))
  )
  return {
    left: rect.left + left!,
    width: rect.width - left! - right!,
    height: rect.height - top! - bottom!
  }
}
const ratio = (node: Element) => content(node).width / content(node).height
const part = (host: ParentNode, slot: string) =>
  host.querySelector<HTMLElement>(`[data-slot~="${slot}"]`)!

const widget = (props: StageProps = {}, body: ReactNode = <div>Widget</div>) => (
  <Stage {...props}>
    <StageHeader>
      <StageTitle>Route map</StageTitle>
      <StageDescription>Station to lake.</StageDescription>
      <StageActions>
        <button type="button">Zoom in</button>
      </StageActions>
    </StageHeader>
    <StageBody aspectRatio={2}>{body}</StageBody>
    <StageFooter>
      <button type="button">Reset</button>
      <button type="button">Share</button>
    </StageFooter>
  </Stage>
)

test.each(modes)('Stage hydrates its parts with caller props in %s mode', async mode => {
  const ref = createRef<HTMLDivElement>()
  const { host } = await mount(
    <StrictMode>
      <ThemeScope mode={mode}>
        {widget({ ref, id: 'stage', className: 'p-[3px]', 'data-slot': 'map' })}
      </ThemeScope>
    </StrictMode>,
    true
  )
  const root = host.querySelector<HTMLDivElement>('#stage')!
  expect(ref.current).toBe(root)
  expect(root.dataset.slot).toBe('stage map')
  expect(root.getAttribute('role')).toBeNull()
  expect(root.getAttribute('aria-labelledby')).toBeNull()
  const style = getComputedStyle(root)
  expect([style.display, style.containerType, style.containerName, style.padding]).toEqual([
    'grid',
    'inline-size',
    'stage',
    '3px'
  ])
  expect(part(root, 'stage-title').tagName).toBe('H2')
  expect(part(root, 'stage-body').dataset.slot).toBe('aspect-ratio stage-body')
})

test.each(modes)('Stage lays out by its own width at 360px and 720px in %s mode', async mode => {
  const { host, render } = await mount(<div />)
  const layout = async (width: number) => {
    await render(
      <ThemeScope mode={mode}>
        <div style={{ width }}>{widget()}</div>
      </ThemeScope>
    )
    const [title, actions, body, footer] = [
      'stage-title',
      'stage-actions',
      'stage-body',
      'stage-footer'
    ].map(slot => part(host, slot))
    const [reset, share] = [...footer!.children]
    return {
      actionsBeside:
        box(actions!).top === box(title!).top && box(actions!).left > box(title!).right,
      footerRow: box(reset!).top === box(share!).top,
      bodyRatio: ratio(body!)
    }
  }
  expect(await layout(360)).toEqual({ actionsBeside: false, footerRow: false, bodyRatio: 2 })
  expect(await layout(720)).toEqual({ actionsBeside: true, footerRow: true, bodyRatio: 2 })
})

test('StageBody keeps its size while content swaps from a Skeleton to taller content', async () => {
  const { host, render } = await mount(<div />)
  const size = async (body: ReactNode) => {
    await render(<div style={{ width: 400 }}>{widget({}, body)}</div>)
    const rect = content(part(host, 'stage-body'))
    return [rect.width, rect.height]
  }
  const skeleton = await size(<Skeleton />)
  const tall = await size(<div style={{ height: 900 }}>Long content</div>)
  const empty = await size(null)
  expect(skeleton[0]! / skeleton[1]!).toBe(2)
  expect(tall).toEqual(skeleton)
  expect(empty).toEqual(skeleton)
})

test('themes and caller tokens style the Stage frame', async () => {
  const theme = defineTheme({
    id: 'stage-frame',
    name: 'Stage frame',
    components: { stage: { padding: '30px', gap: '7px', radius: '3px', borderWidth: '2px' } }
  })
  const { host } = await mount(
    <ThemeScope theme={theme}>
      {widget({ id: 'themed' })}
      {widget({ id: 'tight', padding: 'tight' })}
      {widget({ id: 'local', style: { '--rad-stage-padding': '9px' } })}
    </ThemeScope>
  )
  const style = (id: string) => getComputedStyle(host.querySelector(`#${id}`)!)
  const themed = style('themed')
  expect([themed.padding, themed.rowGap, themed.borderRadius, themed.borderWidth]).toEqual([
    '30px',
    '7px',
    '3px',
    '2px'
  ])
  expect(style('tight').padding).toBe('20px')
  expect(style('local').padding).toBe('9px')
})

// The outline a focused element draws, as a rect, and whether a box contains it.
function ringInside(target: Element, clip: Element) {
  const style = getComputedStyle(target)
  const reach = parseFloat(style.outlineWidth) + Math.max(parseFloat(style.outlineOffset), 0)
  const ring = box(target)
  const edge = box(clip)
  expect(reach).toBeGreaterThan(0)
  return (
    ring.left - reach >= edge.left &&
    ring.top - reach >= edge.top &&
    ring.right + reach <= edge.right &&
    ring.bottom + reach <= edge.bottom
  )
}

test('a focused control filling a ratio body shows its whole ring and lines up with the header', async () => {
  const { host } = await mount(
    <div style={{ width: 400 }}>
      {widget(
        {},
        <Button
          type="button"
          className="h-full w-full"
        >
          Canvas
        </Button>
      )}
    </div>
  )
  const control = host.querySelector<HTMLButtonElement>('[data-slot~="stage-body"] button')!
  control.focus()
  await userEvent.keyboard('{Shift>}{Tab}{/Shift}{Tab}')
  expect(document.activeElement).toBe(control)
  expect(control.matches(':focus-visible')).toBe(true)
  const body = part(host, 'stage-body')
  expect(getComputedStyle(body).overflow).toBe('hidden')
  expect(ringInside(control, body)).toBe(true)
  expect(box(control).left).toBe(box(part(host, 'stage-title')).left)
  expect(box(control).width / box(control).height).toBe(2)
})

const canvasCatalog = extendCatalog(radiantCatalog, {
  id: 'example/canvas',
  version: '1.0.0',
  description: 'Radiant catalog plus an application canvas.',
  entries: {
    RouteCanvas: {
      name: 'RouteCanvas',
      category: 'action',
      description: 'Interactive drawing surface for a route.',
      guidance: {
        whenToUse: 'Drawing a route inside a Stage; handle `draw` on the host.',
        whenNotToUse: 'Static pictures.',
        examples: ['route sketch inside a Stage', 'trail outline, `label: Trail`']
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['label'],
        properties: { label: { type: 'string', minLength: 1, description: 'Canvas name.' } }
      },
      slots: {},
      bindings: {},
      actions: { draw: { description: 'Sent when the canvas is drawn on.', scope: 'outbound' } }
    }
  }
})

const CANVAS_CATALOG_ID = 'https://example.com/a2ui/canvas-catalog.json'
const canvasRegistry: A2uiRegistry = createA2uiExtensionRegistry(canvasCatalog, {
  catalogId: CANVAS_CATALOG_ID,
  title: 'Canvas host catalog',
  description: 'Radiant A2UI entries plus an application canvas.',
  entries: [
    createA2uiExtensionEntry(canvasCatalog, {
      name: 'RouteCanvas',
      component: Button,
      accessibility: [],
      adapter: props => (
        <Button
          type="button"
          className="h-full w-full"
          data-slot="route-canvas"
          onClick={() => void runA2uiAction(props.draw)}
        >
          {String(props.label)}
        </Button>
      )
    })
  ]
})

const surface = (components: Record<string, unknown>[], catalogId = CANVAS_CATALOG_ID) => [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: { surfaceId: STAGE_SURFACE_ID, catalogId, components }
  }
]

test('an app component in an A2UI Stage body keeps the ratio and sends its action', async () => {
  const messages = surface([
    { id: 'root', component: 'Stage', title: 'Sketch', aspectRatio: 2, child: 'canvas' },
    { id: 'canvas', component: 'RouteCanvas', label: 'Route', draw: { event: { name: 'draw' } } }
  ]) as A2uiMessage[]
  const onAction = vi.fn<(event: A2uiActionPayload) => void>()
  const diagnostics: CatalogDiagnostic[] = []
  const { host } = await mount(
    <div style={{ width: 500 }}>
      <A2uiSurface
        surfaceId={STAGE_SURFACE_ID}
        messages={messages}
        registry={canvasRegistry}
        onAction={onAction}
        onDiagnostic={d => diagnostics.push(d)}
      />
    </div>
  )
  const canvas = host.querySelector<HTMLButtonElement>('[data-slot~="route-canvas"]')!
  const body = part(host, 'stage-body')
  expect(body.contains(canvas)).toBe(true)
  expect(box(canvas).left).toBe(content(body).left)
  expect(box(canvas).width).toBe(content(body).width)
  expect(box(canvas).width / box(canvas).height).toBeCloseTo(2, 2)
  canvas.click()
  await vi.waitFor(() => expect(onAction).toHaveBeenCalledTimes(1))
  expect(onAction.mock.calls[0]![0].action).toBe('draw')
  expect(diagnostics.filter(d => d.kind === 'error')).toEqual([])
})

test('an A2UI Stage in a Row without weight keeps a usable width', async () => {
  const { host } = await mount(
    <div style={{ width: 900 }}>
      <A2uiSurface
        surfaceId={STAGE_SURFACE_ID}
        messages={
          surface(
            [
              { id: 'root', component: 'Row', children: ['stage', 'note'] },
              { id: 'stage', component: 'Stage', title: 'Map', aspectRatio: 1.5, child: 'map' },
              { id: 'map', component: 'Text', text: 'Tiles' },
              { id: 'note', component: 'Text', text: 'Beside the map' }
            ],
            RADIANT_A2UI_EXTENSION_CATALOG_ID
          ) as A2uiMessage[]
        }
      />
    </div>
  )
  const stage = part(host, 'a2ui-stage')
  expect(box(stage).width).toBeGreaterThanOrEqual(320)
  expect(box(part(stage, 'stage-body')).height).toBeGreaterThan(150)
})

async function renderSurface(messages: readonly A2uiMessage[]) {
  const diagnostics: CatalogDiagnostic[] = []
  const onAction = vi.fn<(event: A2uiActionPayload) => void>()
  const view = await mount(
    <div style={{ width: 720 }}>
      <A2uiSurface
        surfaceId={STAGE_SURFACE_ID}
        messages={messages}
        onAction={onAction}
        onDiagnostic={d => diagnostics.push(d)}
      />
    </div>
  )
  return { ...view, diagnostics, onAction }
}

test('A2UI Stage fills its header, actions, body and footer slots', async () => {
  const { host, diagnostics, onAction } = await renderSurface(stageFixtureMessages)
  const stage = part(host, 'a2ui-stage')
  expect(stage.dataset.slot).toBe('stage a2ui-stage')
  expect(stage.getAttribute('role')).toBe('group')
  expect(stage.getAttribute('aria-labelledby')).toBe(part(stage, 'stage-title').id)
  expect(part(stage, 'stage-title').id).not.toBe('')
  expect(part(stage, 'stage-title').textContent).toBe('Route map')
  expect(part(stage, 'stage-description').textContent).toBe('Ride from the station to the lake.')
  expect(part(stage, 'stage-actions').textContent).toBe('Zoom in')
  expect(part(stage, 'stage-body').textContent).toBe('Map tiles load here.')
  expect(part(stage, 'stage-footer').textContent).toBe('Reset viewShare route')
  expect(ratio(part(stage, 'stage-body'))).toBeCloseTo(1.5, 2)
  part(stage, 'stage-footer').querySelectorAll('button')[1]!.click()
  await vi.waitFor(() => expect(onAction).toHaveBeenCalledTimes(1))
  expect(onAction.mock.calls[0]![0].action).toBe('share_route')
  expect(diagnostics.filter(d => d.kind === 'error')).toEqual([])
  expect(validateA2uiAccessibility(stageFixtureMessages).errors).toEqual([])
})

test('A2UI Stage holds its body ratio before the body arrives', async () => {
  const { host } = await renderSurface(stageStreamingFixtureMessages)
  const body = part(host, 'stage-body')
  expect(body.querySelector('[aria-hidden="true"]')).not.toBeNull()
  expect(ratio(body)).toBeCloseTo(1.5, 2)
  expect(host.querySelector('[data-slot~="stage-actions"], [data-slot~="stage-footer"]')).toBeNull()
})

test('validateA2uiAccessibility flags a Stage without a title', () => {
  const untitled = structuredClone(stageFixtureMessages) as A2uiMessage[]
  const root = (
    untitled[0] as { createSurface: { components: Record<string, unknown>[] } }
  ).createSurface.components.find(c => c.id === 'root')!
  root.title = ' '
  const { errors } = validateA2uiAccessibility(untitled)
  expect(errors.map(e => [e.component, e.rule])).toEqual([['Stage', 'stage-title']])
})
