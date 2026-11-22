import { createRef, StrictMode, type ReactNode } from 'react'
import { expect, test, vi } from 'vitest'
import {
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
  A2uiSurface,
  validateA2uiAccessibility,
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
      bodyRatio: box(body!).width / box(body!).height
    }
  }
  expect(await layout(360)).toEqual({ actionsBeside: false, footerRow: false, bodyRatio: 2 })
  expect(await layout(720)).toEqual({ actionsBeside: true, footerRow: true, bodyRatio: 2 })
})

test('StageBody keeps its size while content swaps from a Skeleton to taller content', async () => {
  const { host, render } = await mount(<div />)
  const size = async (body: ReactNode) => {
    await render(<div style={{ width: 400 }}>{widget({}, body)}</div>)
    const rect = box(part(host, 'stage-body'))
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
  expect(part(stage, 'stage-title').textContent).toBe('Route map')
  expect(part(stage, 'stage-description').textContent).toBe('Ride from the station to the lake.')
  expect(part(stage, 'stage-actions').textContent).toBe('Zoom in')
  expect(part(stage, 'stage-body').textContent).toBe('Map tiles load here.')
  expect(part(stage, 'stage-footer').textContent).toBe('Reset viewShare route')
  const body = box(part(stage, 'stage-body'))
  expect(body.width / body.height).toBeCloseTo(1.5, 2)
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
  const rect = box(body)
  expect(rect.width / rect.height).toBeCloseTo(1.5, 2)
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
