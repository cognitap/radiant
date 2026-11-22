import { act, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  Compare,
  CompareItem,
  CompareItemBody,
  CompareItemFooter,
  CompareItemHeader,
  Grid,
  Reveal,
  Split,
  SplitMain,
  SplitSecondary,
  type GridColumns,
  type RevealProps,
  type SplitProps
} from '../../src/index.js'
import {
  A2UI_PROTOCOL_VERSION,
  A2uiSurface,
  RADIANT_A2UI_EXTENSION_CATALOG_ID,
  radiantA2uiExtensionRegistry,
  type A2uiMessage,
  type CatalogDiagnostic
} from '../../src/a2ui/index.js'
import {
  COMPARE_SURFACE_ID,
  compareFixtureMessages,
  GRID_SURFACE_ID,
  gridFixtureMessages,
  REVEAL_SURFACE_ID,
  revealFixtureMessages,
  SPLIT_SURFACE_ID,
  splitFixtureMessages
} from '../../src/a2ui/layoutIntentFixtures.js'
import { key, mount } from './familyHarness.js'

// The surface clamps an out-of-range cap before the adapter sees it.
const GRID_COERCED_COLUMNS = 6
const box = (node: Element) => node.getBoundingClientRect()
const part = (host: ParentNode, slot: string) =>
  host.querySelector<HTMLElement>(`[data-slot~="${slot}"]`)!
const parts = (host: ParentNode, slot: string) =>
  Array.from(host.querySelectorAll<HTMLElement>(`[data-slot~="${slot}"]`))
const sized = (width: string, children: ReactNode) => <div style={{ width }}>{children}</div>
const columnsOf = (grid: HTMLElement) =>
  getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length

const plans = (count: number) => (
  <Compare>
    {['Basic', 'Plus', 'Team', 'School', 'Campus'].slice(0, count).map((name, index) => (
      <CompareItem key={name}>
        <CompareItemHeader>{name}</CompareItemHeader>
        <CompareItemBody>
          {'A longer description of what this plan includes. '.repeat(index + 1)}
        </CompareItemBody>
        <CompareItemFooter>
          <button type="button">Choose {name}</button>
        </CompareItemFooter>
      </CompareItem>
    ))}
  </Compare>
)

const split = (props: SplitProps = {}, secondaryFirst = false) => {
  const main = <SplitMain key="main">Itinerary for three days by the lake.</SplitMain>
  const secondary = <SplitSecondary key="secondary">Summary</SplitSecondary>
  return <Split {...props}>{secondaryFirst ? [secondary, main] : [main, secondary]}</Split>
}

test('Split stacks in a narrow container and shares a row in a wide one', async () => {
  const { host, render } = await mount(sized('360px', split({}, true)))
  let main = part(host, 'split-main'),
    secondary = part(host, 'split-secondary')
  expect(box(main).width).toBeCloseTo(360, 0)
  // Stacked and side by side, the visual order is the source order.
  expect(box(main).top).toBeGreaterThanOrEqual(box(secondary).bottom)

  await render(sized('720px', split({}, true)))
  main = part(host, 'split-main')
  secondary = part(host, 'split-secondary')
  expect(box(secondary).top).toBeCloseTo(box(main).top, 0)
  expect(box(secondary).right).toBeLessThanOrEqual(box(main).left)
  // `main` gives the main area two thirds of the width left after the gap.
  expect(box(main).width / box(secondary).width).toBeCloseTo(2, 1)

  await render(sized('720px', split({ ratio: 'balanced', gap: 'airy' })))
  main = part(host, 'split-main')
  secondary = part(host, 'split-secondary')
  expect(box(secondary).left).toBeGreaterThanOrEqual(box(main).right)
  expect(box(main).width).toBeCloseTo(box(secondary).width, 0)
  expect(box(secondary).left - box(main).right).toBeCloseTo(24, 0)
})

test('Split, Compare and Reveal keep a usable width in a box that sizes to its content', async () => {
  const { host } = await mount(
    <div style={{ display: 'inline-block' }}>
      {split()}
      {plans(2)}
      <Grid>
        <div>One</div>
      </Grid>
    </div>
  )
  expect(box(part(host, 'split')).width).toBeCloseTo(320, 0)
  expect(box(part(host, 'compare')).width).toBeCloseTo(320, 0)
  expect(box(part(host, 'grid')).width).toBeCloseTo(320, 0)
})

test('Grid derives its columns from its own width up to maxColumns', async () => {
  const grid = (width: string, maxColumns?: GridColumns) =>
    sized(
      width,
      <Grid maxColumns={maxColumns}>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index}>Item {index + 1}</div>
        ))}
      </Grid>
    )
  const { host, render } = await mount(grid('360px'))
  expect(columnsOf(part(host, 'grid'))).toBe(1)
  await render(grid('720px'))
  expect(columnsOf(part(host, 'grid'))).toBe(3)
  await render(grid('720px', 2))
  expect(columnsOf(part(host, 'grid'))).toBe(2)
  // Six 12rem tracks do not fit in 720px, so the token width wins over the cap.
  await render(grid('720px', 6))
  expect(columnsOf(part(host, 'grid'))).toBe(3)
  await render(grid('1400px', 6))
  expect(columnsOf(part(host, 'grid'))).toBe(6)
  const items = parts(host, 'grid')[0]!.children
  expect(box(items[0]!).width).toBeCloseTo(box(items[5]!).width, 0)
  // At every width the count is what fits, never one short at a boundary.
  for (const width of [399, 400, 415, 416, 600, 623, 624, 832, 1247, 1248]) {
    for (const max of [2, 3, 4, 6] as const) {
      await render(grid(`${width}px`, max))
      const fit = Math.max(1, Math.floor((width + 16) / (192 + 16)))
      expect(columnsOf(part(host, 'grid')), `${width}px, max ${max}`).toBe(Math.min(max, fit))
    }
  }
})

test('layout families reject pixel widths and column counts above their maximum', () => {
  const render = (node: ReactNode) => () => renderToStaticMarkup(node)
  expect(render(<Grid maxColumns={7 as GridColumns} />)).toThrow(
    /Grid maxColumns must be one of 1, 2, 3, 4, 5, 6/
  )
  expect(render(<Grid maxColumns={2.5 as GridColumns} />)).toThrow(TypeError)
  expect(render(<Split ratio={'240px' as never} />)).toThrow(/Split ratio must be one of/)
  expect(render(<Compare gap={'12px' as never}>{plans(2).props.children}</Compare>)).toThrow(
    /Compare gap must be one of/
  )
  expect(render(plans(1))).toThrow(/Compare needs two to four CompareItem children; received 1/)
  expect(render(plans(5))).toThrow(/received 5/)
})

test('Compare aligns headers, bodies and footers on shared rows when wide', async () => {
  const { host, render } = await mount(sized('720px', plans(3)))
  for (const slot of ['compare-item-header', 'compare-item-body', 'compare-item-footer']) {
    const tops = parts(host, slot).map(node => box(node).top)
    expect(new Set(tops.map(Math.round)).size, slot).toBe(1)
  }
  const items = parts(host, 'compare-item').map(box)
  expect(items[1]!.left).toBeGreaterThan(items[0]!.right)
  expect(items[0]!.height).toBeCloseTo(items[2]!.height, 0)

  await render(sized('360px', plans(3)))
  const stacked = parts(host, 'compare-item').map(box)
  expect(stacked[1]!.top).toBeGreaterThan(stacked[0]!.bottom)
  expect(stacked[0]!.width).toBeCloseTo(360, 0)
  // The header, body and footer of one item still stack in that order.
  const [header, body, footer] = ['header', 'body', 'footer'].map(name =>
    box(part(host, `compare-item-${name}`))
  )
  expect(body!.top).toBeGreaterThanOrEqual(header!.bottom)
  expect(footer!.top).toBeGreaterThanOrEqual(body!.bottom)
})

test('Compare waits for a wider container before showing four items in a row', async () => {
  const { host, render } = await mount(sized('720px', plans(4)))
  let items = parts(host, 'compare-item').map(box)
  expect(items[1]!.top).toBeGreaterThan(items[0]!.bottom)
  await render(sized('800px', plans(4)))
  items = parts(host, 'compare-item').map(box)
  expect(new Set(items.map(item => Math.round(item.top))).size).toBe(1)
  expect(items[3]!.left).toBeGreaterThan(items[2]!.right)
})

const reveal = (props: Partial<RevealProps> = {}) => (
  <Reveal
    previousLabel="Back"
    nextLabel="Forward"
    positionLabel={(index, count) => `Step ${index + 1} of ${count}`}
    items={[
      { value: 'name', children: <input aria-label="Name" /> },
      { value: 'city', children: <p>City step</p> },
      { value: 'done', children: <p>Done step</p> }
    ]}
    {...(props as object)}
  />
)

test('Reveal steps through with the keyboard, keeps hidden state and announces position', async () => {
  const changes: string[] = []
  const { host } = await mount(reveal({ onValueChange: value => changes.push(value) }))
  const previous = part(host, 'reveal-previous') as HTMLButtonElement
  const next = part(host, 'reveal-next') as HTMLButtonElement
  const position = part(host, 'reveal-position')
  const steps = parts(host, 'reveal-step')
  expect(position.tagName).toBe('OUTPUT')
  expect(position).toHaveTextContent('Step 1 of 3')
  // Only the steps announce, so the position is not read twice.
  expect(position).not.toHaveAttribute('aria-live')
  expect(part(host, 'reveal-steps')).toHaveAttribute('aria-live', 'polite')
  expect(steps.map(step => [step.getAttribute('role'), step.getAttribute('aria-label')])).toEqual([
    ['group', 'Step 1 of 3'],
    ['group', 'Step 2 of 3'],
    ['group', 'Step 3 of 3']
  ])
  expect(previous.disabled).toBe(true)
  expect(steps.map(step => step.hidden)).toEqual([false, true, true])
  expect(next).toHaveAttribute('aria-controls', part(host, 'reveal-steps').id)

  const input = host.querySelector('input')!
  await act(async () => userEvent.click(input))
  await key('Lagos')
  await key('{Tab}')
  expect(document.activeElement).toBe(next)
  await key('{Enter}')
  expect(position).toHaveTextContent('Step 2 of 3')
  expect(steps.map(step => step.hidden)).toEqual([true, false, true])
  expect(document.activeElement).toBe(next)
  // At the last step Forward disables itself, so focus moves to Back.
  await key(' ')
  expect(position).toHaveTextContent('Step 3 of 3')
  expect(next.disabled).toBe(true)
  expect(document.activeElement).toBe(previous)
  await key('{Enter}')
  await key('{Enter}')
  expect(position).toHaveTextContent('Step 1 of 3')
  expect(document.activeElement).toBe(next)
  expect(host.querySelector('input')).toBe(input)
  expect(input.value).toBe('Lagos')
  expect(changes).toEqual(['city', 'done', 'city', 'name'])
})

test('Reveal requires host labels and known values', () => {
  const render = (node: ReactNode) => () => renderToStaticMarkup(node)
  expect(render(reveal({ nextLabel: ' ' }))).toThrow(/nonempty previousLabel and nextLabel/)
  expect(render(reveal({ value: 'missing' }))).toThrow(/Reveal value must match an item/)
  expect(render(reveal({ items: [] }))).toThrow(/unique nonempty values/)
})

test('uncontrolled Reveal falls back to the first step when the shown one is removed', async () => {
  const items = [
    { value: 'a', children: <p>A</p> },
    { value: 'b', children: <p>B</p> },
    { value: 'c', children: <p>C</p> }
  ]
  const { host, render } = await mount(reveal({ items, defaultValue: 'b' }))
  expect(part(host, 'reveal-position')).toHaveTextContent('Step 2 of 3')
  await render(reveal({ items: [items[0]!, items[2]!], defaultValue: 'b' }))
  expect(part(host, 'reveal-position')).toHaveTextContent('Step 1 of 2')
  expect(parts(host, 'reveal-step').map(step => step.hidden)).toEqual([false, true])
})

test('a declined Reveal change leaves no focus move behind', async () => {
  const { host, render } = await mount(reveal({ value: 'city', onValueChange: () => {} }))
  const next = part(host, 'reveal-next') as HTMLButtonElement
  await act(async () => next.focus())
  // The app declines the move to the last step, so focus stays on Forward.
  await key('{Enter}')
  expect(part(host, 'reveal-position')).toHaveTextContent('Step 2 of 3')
  expect(document.activeElement).toBe(next)
  // A later change to the last step made by the app does not use the stale request.
  await render(reveal({ value: 'done', onValueChange: () => {} }))
  expect(document.activeElement).not.toBe(part(host, 'reveal-previous'))
})

test('A2UI renders the layout fixtures and coerces out-of-range props', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const labels = {
    revealPrevious: 'Back',
    revealNext: 'Forward',
    revealPosition: (index: number, count: number) => `${index + 1} of ${count}`
  }
  const surface = (surfaceId: string, messages: Parameters<typeof A2uiSurface>[0]['messages']) =>
    sized(
      '720px',
      <A2uiSurface
        surfaceId={surfaceId}
        messages={messages}
        registry={radiantA2uiExtensionRegistry}
        labels={labels}
      />
    )
  const { host, render } = await mount(surface(SPLIT_SURFACE_ID, splitFixtureMessages))
  expect(box(part(host, 'split-secondary')).right).toBeLessThanOrEqual(
    box(part(host, 'split-main')).left
  )

  const wide = structuredClone(gridFixtureMessages) as unknown as {
    createSurface: { components: Record<string, unknown>[] }
  }[]
  wide[0]!.createSurface.components[0]!.maxColumns = 9
  await render(
    <div style={{ width: '1400px' }}>
      <A2uiSurface
        surfaceId={GRID_SURFACE_ID}
        messages={wide as never}
        registry={radiantA2uiExtensionRegistry}
        onDiagnostic={diagnostic => diagnostics.push(diagnostic)}
      />
    </div>
  )
  expect(columnsOf(part(host, 'grid'))).toBe(GRID_COERCED_COLUMNS)
  expect(diagnostics).toContainEqual(
    expect.objectContaining({ component: 'Grid', prop: 'maxColumns', received: 9 })
  )

  await render(surface(COMPARE_SURFACE_ID, compareFixtureMessages))
  const footers = parts(host, 'compare-item-footer').map(node => Math.round(box(node).top))
  expect(footers).toHaveLength(3)
  expect(new Set(footers).size).toBe(1)

  await render(surface(REVEAL_SURFACE_ID, revealFixtureMessages))
  expect(part(host, 'reveal-position')).toHaveTextContent('1 of 3')
  await act(async () => userEvent.click(part(host, 'reveal-next')))
  expect(part(host, 'reveal-position')).toHaveTextContent('2 of 3')
})

test('A2UI Reveal without host labels shows every step in order', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const { host } = await mount(
    <A2uiSurface
      surfaceId={REVEAL_SURFACE_ID}
      messages={revealFixtureMessages}
      registry={radiantA2uiExtensionRegistry}
      onDiagnostic={diagnostic => diagnostics.push(diagnostic)}
    />
  )
  expect(host.querySelector('[data-slot~="reveal-controls"]')).toBeNull()
  expect(host.textContent).toMatch(/Mix flour.*Rest the dough.*Bake for 40 minutes/)
  expect(diagnostics).toContainEqual(
    expect.objectContaining({ kind: 'defaulted', component: 'Reveal' })
  )
})

const surfaceOf = (components: Record<string, unknown>[], dataModel: unknown = {}) =>
  [
    {
      version: A2UI_PROTOCOL_VERSION,
      createSurface: {
        surfaceId: 'layout_probe',
        catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
        dataModel,
        components
      }
    }
  ] as A2uiMessage[]
const text = (id: string, value: unknown) => ({ id, component: 'Text', text: value })

test('A2UI Compare keys templated items apart, drops a fifth and wraps plain children', async () => {
  const diagnostics: CatalogDiagnostic[] = []
  const probe = (components: Record<string, unknown>[], dataModel?: unknown) => (
    <div style={{ width: '800px' }}>
      <A2uiSurface
        surfaceId="layout_probe"
        messages={surfaceOf(components, dataModel)}
        registry={radiantA2uiExtensionRegistry}
        onDiagnostic={diagnostic => diagnostics.push(diagnostic)}
      />
    </div>
  )
  const errors = vi.spyOn(console, 'error')
  const { host, render } = await mount(
    probe(
      [
        { id: 'root', component: 'Compare', children: { componentId: 'plan', path: '/plans' } },
        { id: 'plan', component: 'CompareItem', header: 'plan_name' },
        text('plan_name', { '@path': 'name' })
      ],
      { plans: [{ name: 'Basic' }, { name: 'Plus' }, { name: 'Team' }] }
    )
  )
  expect(parts(host, 'compare-item-header').map(node => node.textContent)).toEqual([
    'Basic',
    'Plus',
    'Team'
  ])
  expect(errors.mock.calls.flat().join(' ')).not.toMatch(/same key/)
  errors.mockRestore()

  await render(
    probe([
      { id: 'root', component: 'Compare', children: ['a', 'b', 'c', 'd', 'e'] },
      ...['a', 'b', 'c', 'd', 'e'].map(id => text(id, id.toUpperCase()))
    ])
  )
  const items = parts(host, 'compare-item')
  expect(items.map(item => item.textContent)).toEqual(['A', 'B', 'C', 'D'])
  expect(items.every(item => item.querySelector('[data-slot~="compare-item-body"]'))).toBe(true)
  expect(diagnostics).toContainEqual(
    expect.objectContaining({ kind: 'coerced', component: 'Compare', received: 5, used: 4 })
  )

  await render(probe([{ id: 'root', component: 'Compare', children: ['a'] }, text('a', 'Alone')]))
  expect(host.querySelector('[data-slot~="compare"]')).toBeNull()
  expect(part(host, 'a2ui-compare')).toHaveTextContent('Alone')
  expect(diagnostics).toContainEqual(
    expect.objectContaining({ kind: 'coerced', component: 'Compare', received: 1 })
  )
})

test('A2UI Reveal steps through templated steps with a position template', async () => {
  const { host } = await mount(
    <A2uiSurface
      surfaceId="layout_probe"
      messages={surfaceOf(
        [
          { id: 'root', component: 'Reveal', steps: { componentId: 'step', path: '/steps' } },
          text('step', { '@path': 'text' })
        ],
        { steps: [{ text: 'Mix' }, { text: 'Rest' }, { text: 'Bake' }] }
      )}
      registry={radiantA2uiExtensionRegistry}
      labels={{
        revealPrevious: 'Back',
        revealNext: 'Forward',
        revealPosition: 'Step {index} of {count}'
      }}
    />
  )
  expect(part(host, 'reveal-position')).toHaveTextContent('Step 1 of 3')
  expect(parts(host, 'reveal-step').map(step => step.hidden)).toEqual([false, true, true])
  await act(async () => userEvent.click(part(host, 'reveal-next')))
  expect(part(host, 'reveal-position')).toHaveTextContent('Step 2 of 3')
  expect(parts(host, 'reveal-step')[1]).toHaveTextContent('Rest')
  expect(parts(host, 'reveal-step')[1]).toHaveAttribute('aria-label', 'Step 2 of 3')
})
