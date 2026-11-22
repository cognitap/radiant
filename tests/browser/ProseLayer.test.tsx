import { expect, test } from 'vitest'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  HeadingLevelProvider,
  useHeadingLevel
} from '../../src/index.js'
import {
  A2UI_PROTOCOL_VERSION,
  A2uiSurface,
  RADIANT_A2UI_EXTENSION_CATALOG_ID,
  type A2uiMessage
} from '../../src/a2ui/index.js'
import { mount } from './familyHarness.js'

const px = (element: Element, property: string) =>
  parseFloat(getComputedStyle(element).getPropertyValue(property))
const tag = (host: HTMLElement, text: string) =>
  Array.from(host.querySelectorAll('h1, h2, h3, h4, h5, h6')).find(h => h.textContent === text)
    ?.tagName

function ClientCard({ title, depth = 0 }: { title: string; depth?: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle level={useHeadingLevel(depth)}>{title}</CardTitle>
      </CardHeader>
    </Card>
  )
}

test('HeadingLevelProvider sets where client titles start and clamps deeper levels to 6', async () => {
  const { host } = await mount(
    <>
      <ClientCard title="Outside" />
      <Accordion>
        <AccordionItem value="a">
          <AccordionTrigger>Default trigger</AccordionTrigger>
          <AccordionContent>Body</AccordionContent>
        </AccordionItem>
      </Accordion>
      <HeadingLevelProvider level={4}>
        <ClientCard title="Inside" />
        <ClientCard
          title="Nested"
          depth={1}
        />
        <ClientCard
          title="Clamped"
          depth={5}
        />
        <Accordion>
          <AccordionItem value="a">
            <AccordionTrigger>Inherited trigger</AccordionTrigger>
            <AccordionContent>Body</AccordionContent>
          </AccordionItem>
        </Accordion>
      </HeadingLevelProvider>
    </>
  )
  expect(tag(host, 'Outside')).toBe('H2')
  expect(tag(host, 'Default trigger')).toBe('H3')
  expect(tag(host, 'Inside')).toBe('H4')
  expect(tag(host, 'Nested')).toBe('H5')
  expect(tag(host, 'Clamped')).toBe('H6')
  expect(tag(host, 'Inherited trigger')).toBe('H4')
})

const text = (id: string, value: string) => ({ id, component: 'Text', text: value })
const flowMessages: readonly A2uiMessage[] = [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: 'flow',
      catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
      components: [
        { id: 'root', component: 'Column', children: ['intro', 'more', 'stage', 'faq', 'outro'] },
        text('intro', 'Your ride starts at the station.'),
        text('more', 'It follows the river to the lake.'),
        { id: 'stage', component: 'Stage', title: 'Route map', child: 'notice' },
        {
          id: 'notice',
          component: 'Alert',
          title: 'Bridge closed',
          description: 'Use the ferry.'
        },
        {
          id: 'faq',
          component: 'Accordion',
          items: [{ value: 'bikes', title: 'Bikes', panel: 'bikes_text' }]
        },
        text('bikes_text', 'Bikes ride free.'),
        text('outro', 'Enjoy the lake.')
      ]
    }
  }
]

test('A2UI headingLevel offsets agent headings, nests Stage content, and clamps to h6', async () => {
  const { host, render } = await mount(
    <A2uiSurface
      surfaceId="flow"
      messages={flowMessages}
    />
  )
  expect(tag(host, 'Route map')).toBe('H2')
  expect(tag(host, 'Bridge closed')).toBe('H3')
  expect(tag(host, 'Bikes')).toBe('H3')

  await render(
    <A2uiSurface
      surfaceId="flow"
      messages={flowMessages}
      headingLevel={3}
    />
  )
  expect(tag(host, 'Route map')).toBe('H3')
  expect(tag(host, 'Bridge closed')).toBe('H4')
  expect(tag(host, 'Bikes')).toBe('H3')

  await render(
    <HeadingLevelProvider level={6}>
      <A2uiSurface
        surfaceId="flow"
        messages={flowMessages}
      />
    </HeadingLevelProvider>
  )
  expect(tag(host, 'Route map')).toBe('H6')
  expect(tag(host, 'Bridge closed')).toBe('H6')
})

async function proseHost(width: number) {
  const { host } = await mount(
    <div
      data-rad-type-container=""
      style={{ width: `${width}px` }}
    >
      <article data-rad-prose="">
        <h2 id="heading">A heading</h2>
        <p id="first">First paragraph with enough words to wrap at a reading width.</p>
        <p id="second">Second paragraph.</p>
        <Card id="card">
          <CardContent>Component</CardContent>
        </Card>
        <Card id="next-card">
          <CardContent>Component</CardContent>
        </Card>
        <p id="after">After the components.</p>
      </article>
    </div>
  )
  const node = (id: string) => host.querySelector(`#${id}`)!
  return { host, node }
}

test('prose rhythm tokens space text and components and themes can override them', async () => {
  const { node } = await proseHost(720)
  const root = getComputedStyle(document.documentElement)
  const rem = (name: string) => parseFloat(root.getPropertyValue(name)) * 16
  const airy = rem('--rad-spacing-airy')
  const normal = rem('--rad-spacing-normal')
  expect(airy).toBeGreaterThan(normal)
  expect(px(node('second'), 'margin-block-start')).toBeCloseTo(
    1.25 * px(node('second'), 'font-size')
  )
  expect(px(node('card'), 'margin-block-start')).toBeCloseTo(airy)
  expect(px(node('next-card'), 'margin-block-start')).toBeCloseTo(normal)
  expect(px(node('after'), 'margin-block-start')).toBeCloseTo(airy)
  expect(px(node('first'), 'margin-block-start')).toBeCloseTo(
    0.625 * px(node('first'), 'font-size')
  )

  const article = node('card').parentElement as HTMLElement
  article.style.setProperty('--rad-typography-flow-component', '40px')
  article.style.setProperty('--rad-typography-flow-component-gap', '12px')
  expect(px(node('card'), 'margin-block-start')).toBe(40)
  expect(px(node('next-card'), 'margin-block-start')).toBe(12)
})

test('text keeps a reading measure while components span the container, at 360px and 720px', async () => {
  const sizes: number[] = []
  for (const width of [360, 720]) {
    const { node } = await proseHost(width)
    const first = node('first') as HTMLElement
    const measure = px(first, 'max-inline-size')
    expect(measure).toBeCloseTo(readingWidth(first), 0)
    expect(first.getBoundingClientRect().width).toBeLessThanOrEqual(Math.min(width, measure) + 0.5)
    expect((node('card') as HTMLElement).getBoundingClientRect().width).toBeCloseTo(width)
    sizes.push(px(node('heading'), 'font-size'))
  }
  expect(sizes[1]).toBeGreaterThan(sizes[0]!)
})

/** Width of the default 64ch body measure in this element's font. */
function readingWidth(element: HTMLElement) {
  const probe = document.createElement('span')
  probe.style.cssText = 'position:absolute;visibility:hidden;inline-size:64ch'
  element.append(probe)
  const width = probe.getBoundingClientRect().width
  probe.remove()
  return width
}

test('a prose A2UI surface turns its root Column into a prose flow at both widths', async () => {
  for (const width of [360, 720]) {
    const { host } = await mount(
      <div style={{ width: `${width}px` }}>
        <A2uiSurface
          surfaceId="flow"
          messages={flowMessages}
          prose
        />
      </div>
    )
    const surface = host.querySelector('[data-slot="a2ui-surface"]')!
    expect(surface.hasAttribute('data-rad-type-container')).toBe(true)
    const column = host.querySelector('[data-slot~="a2ui-column"]')!
    expect(column.hasAttribute('data-rad-prose')).toBe(true)
    expect(getComputedStyle(column).rowGap).toBe('0px')
    const [intro, more, stage, faq, outro] = Array.from(column.children) as HTMLElement[]
    const paragraph = intro!.querySelector('p')!
    expect(paragraph.getAttribute('data-rad-text')).toBe('prose-body')
    expect(more!.querySelector('[data-rad-text="prose-body"]')).not.toBeNull()
    // Text nested in a component keeps its interface style.
    expect(host.querySelector('[data-slot="a2ui-text"]:not([data-rad-text])')).not.toBeNull()
    const root = getComputedStyle(document.documentElement)
    const airy = parseFloat(root.getPropertyValue('--rad-spacing-airy')) * 16
    const normal = parseFloat(root.getPropertyValue('--rad-spacing-normal')) * 16
    expect(px(more!, 'margin-block-start')).toBeCloseTo(1.25 * px(paragraph, 'font-size'))
    expect(px(stage!, 'margin-block-start')).toBeCloseTo(airy)
    expect(px(faq!, 'margin-block-start')).toBeCloseTo(normal)
    expect(px(outro!, 'margin-block-start')).toBeCloseTo(airy)
    expect(stage!.getBoundingClientRect().width).toBeCloseTo(width)
    expect(paragraph.getBoundingClientRect().width).toBeLessThanOrEqual(
      Math.min(width, readingWidth(paragraph)) + 0.5
    )
  }
})
