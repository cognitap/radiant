import { act, type ReactNode } from 'react'
import { expect, test } from 'vitest'
import {
  A2UI_PROTOCOL_VERSION,
  A2uiSurface,
  RADIANT_A2UI_EXTENSION_CATALOG_ID,
  radiantA2uiExtensionRegistry,
  type A2uiMessage
} from '../../src/a2ui/index.js'
import { radiantCatalog } from '../../src/catalog/index.js'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Compare,
  CompareItem,
  CompareItemBody,
  CompareItemFooter,
  CompareItemHeader,
  Grid,
  Split,
  SplitMain,
  SplitSecondary,
  Stack,
  Stage,
  StageActions,
  StageBody,
  StageDescription,
  StageFooter,
  StageHeader,
  StageTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ToggleGroup,
  ToggleGroupItem
} from '../../src/index.js'
import {
  comboboxFixtureMessages,
  radioGroupFixtureMessages,
  selectFixtureMessages,
  switchFixtureMessages,
  textareaFixtureMessages
} from '../../src/a2ui/extensionFixtures.js'
import {
  accordionFixtureMessages,
  alertFixtureMessages,
  badgeFixtureMessages,
  progressFixtureMessages,
  tableFixtureMessages,
  toastFixtureMessages,
  toastRaisedFixtureMessages
} from '../../src/a2ui/feedbackFixtures.js'
import { tripRequestFixtureMessages } from '../../src/a2ui/inputFixtures.js'
import {
  cardFixtureMessages,
  columnFixtureMessages,
  listFixtureMessages,
  modalFixtureMessages,
  rowFixtureMessages,
  tabsFixtureMessages
} from '../../src/a2ui/layoutFixtures.js'
import {
  compareFixtureMessages,
  gridFixtureMessages,
  revealFixtureMessages,
  splitFixtureMessages
} from '../../src/a2ui/layoutIntentFixtures.js'
import {
  audioPlayerFixtureMessages,
  iconFixtureMessages,
  imageFixtureMessages,
  videoFixtureMessages
} from '../../src/a2ui/mediaFixtures.js'
import { stageFixtureMessages } from '../../src/a2ui/stageFixtures.js'
import { mount } from './familyHarness.js'

const WIDTHS = [360, 560, 960] as const

/** The A2UI components that render each canonical catalog entry. */
const PROJECTIONS: Readonly<Record<string, readonly string[]>> = {
  Text: ['Text'],
  Icon: ['Icon'],
  Image: ['Image'],
  Video: ['Video'],
  AudioPlayer: ['AudioPlayer'],
  Row: ['Row'],
  Column: ['Column'],
  List: ['List'],
  Card: ['Card'],
  Divider: ['Divider'],
  Tabs: ['Tabs'],
  Modal: ['Modal'],
  Button: ['Button'],
  TextField: ['TextField', 'Textarea'],
  Checkbox: ['CheckBox'],
  Choice: ['ChoicePicker', 'Select', 'Combobox', 'RadioGroup'],
  Slider: ['Slider'],
  DateTimeInput: ['DateTimeInput'],
  Switch: ['Switch'],
  Alert: ['Alert'],
  Badge: ['Badge'],
  Progress: ['Progress'],
  Accordion: ['Accordion'],
  Table: ['Table'],
  Toast: ['Toast'],
  Stage: ['Stage'],
  Split: ['Split'],
  Grid: ['Grid'],
  Compare: ['Compare'],
  CompareItem: ['CompareItem'],
  Reveal: ['Reveal']
}

const STRESS_SURFACE_ID = 'container_width'
const LONG_WORD =
  'https://example.com/trips/2026/ridge-loop/day-one/photos/summit-panorama-full.jpg'

const surface = (
  components: readonly Record<string, unknown>[],
  dataModel: Record<string, unknown> = {}
): readonly A2uiMessage[] => [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: STRESS_SURFACE_ID,
      catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
      dataModel,
      components
    }
  }
]
const text = (id: string, value: string) => ({ id, component: 'Text', text: value })
const button = (id: string, label: string) => [
  { id, component: 'Button', child: `${id}_label`, action: { event: { name: id } } },
  text(`${id}_label`, label)
]
const words = [
  'Itinerary',
  'Accommodation',
  'Transportation',
  'Packing list',
  'Weather',
  'Contacts'
]

/** Instances with more, longer content than the fixtures: the shapes that overflow first. */
const stressCases: Record<string, readonly A2uiMessage[]> = {
  'Tabs with six tabs': surface([
    {
      id: 'root',
      component: 'Tabs',
      tabs: words.map((title, index) => ({ title, child: `panel_${index}` }))
    },
    ...words.map((title, index) => text(`panel_${index}`, title))
  ]),
  'Row of six buttons': surface([
    { id: 'root', component: 'Row', children: words.map((_, index) => `action_${index}`) },
    ...words.flatMap((title, index) => button(`action_${index}`, title))
  ]),
  'Text, Badge and Alert with an unbroken URL': surface([
    { id: 'root', component: 'Column', children: ['url', 'badge', 'alert'] },
    text('url', LONG_WORD),
    { id: 'badge', component: 'Badge', text: LONG_WORD },
    { id: 'alert', component: 'Alert', title: LONG_WORD, description: LONG_WORD }
  ]),
  'ChoicePicker chips with eight options': surface(
    [
      {
        id: 'root',
        component: 'ChoicePicker',
        label: 'Interests',
        variant: 'multipleSelection',
        displayStyle: 'chips',
        options: [...words, 'Photography', 'Birdwatching'].map(label => ({
          label,
          value: label.toLowerCase()
        })),
        value: { '@path': '/interests' }
      }
    ],
    { interests: [] }
  ),
  'Filterable ChoicePicker': surface(
    [
      {
        id: 'root',
        component: 'ChoicePicker',
        label: 'Country',
        variant: 'mutuallyExclusive',
        filterable: true,
        options: words.map(label => ({ label, value: label.toLowerCase() })),
        value: { '@path': '/country' }
      }
    ],
    { country: [] }
  ),
  'Table with seven columns': surface(
    [
      {
        id: 'root',
        component: 'Table',
        caption: 'Trips',
        columns: [...words, 'Total'].map(label => ({ label })),
        rows: { componentId: 'trip_row', path: '/trips' }
      },
      {
        id: 'trip_row',
        component: 'Row',
        children: [...words, 'Total'].map((_, index) => `cell_${index}`)
      },
      ...[...words, 'Total'].map((_, index) => ({
        id: `cell_${index}`,
        component: 'Text',
        text: { '@path': 'value' }
      }))
    ],
    { trips: [{ value: 'Ridge loop, three days' }, { value: LONG_WORD }] }
  ),
  'Horizontal List of six buttons': surface([
    {
      id: 'root',
      component: 'List',
      direction: 'horizontal',
      children: words.map((_, index) => `item_${index}`)
    },
    ...words.flatMap((title, index) => button(`item_${index}`, title))
  ]),
  'Stage with four header actions': surface([
    {
      id: 'root',
      component: 'Stage',
      title: 'Ridge loop photo gallery',
      actions: words.slice(0, 4).map((_, index) => `stage_${index}`),
      child: 'stage_body'
    },
    text('stage_body', LONG_WORD),
    ...words.slice(0, 4).flatMap((title, index) => button(`stage_${index}`, title))
  ]),
  'Compare of four plans': surface([
    { id: 'root', component: 'Compare', children: words.slice(0, 4) },
    ...words
      .slice(0, 4)
      .flatMap(title => [
        { id: title, component: 'CompareItem', header: `${title}_header` },
        text(`${title}_header`, `${title} plan`)
      ])
  ]),
  'Accordion with a long title': surface([
    {
      id: 'root',
      component: 'Accordion',
      items: [{ value: 'link', title: LONG_WORD, panel: 'link_text' }]
    },
    text('link_text', LONG_WORD)
  ]),
  'Controls with long labels': surface(
    [
      {
        id: 'root',
        component: 'Column',
        children: ['long_button', 'long_choice', 'long_select', 'long_switch', 'long_check']
      },
      ...button('long_button', `Download ${LONG_WORD}`),
      {
        id: 'long_choice',
        component: 'ChoicePicker',
        label: LONG_WORD,
        variant: 'mutuallyExclusive',
        options: [{ label: LONG_WORD, value: 'long' }],
        value: { '@path': '/choice' }
      },
      {
        id: 'long_select',
        component: 'Select',
        label: LONG_WORD,
        items: [{ label: LONG_WORD, value: 'long' }],
        value: { '@path': '/select' }
      },
      { id: 'long_switch', component: 'Switch', label: LONG_WORD, checked: { '@path': '/on' } },
      { id: 'long_check', component: 'CheckBox', label: LONG_WORD, value: { '@path': '/on' } }
    ],
    { choice: [], select: 'long', on: false }
  ),
  'Card holding a Row of buttons': surface([
    { id: 'root', component: 'Card', child: 'actions' },
    { id: 'actions', component: 'Row', children: ['save', 'share', 'archive'] },
    ...button('save', 'Save itinerary'),
    ...button('share', 'Share with group'),
    ...button('archive', 'Archive trip')
  ]),
  'Grid of four columns with long titles': surface([
    { id: 'root', component: 'Grid', maxColumns: 4, children: words.slice(0, 4) },
    ...words
      .slice(0, 4)
      .flatMap(title => [
        { id: title, component: 'Card', child: `${title}_text` },
        text(`${title}_text`, `${title} ${LONG_WORD}`)
      ])
  ])
}

const fixtures: Record<string, readonly A2uiMessage[]> = {
  'Select fixture': selectFixtureMessages,
  'Combobox fixture': comboboxFixtureMessages,
  'RadioGroup fixture': radioGroupFixtureMessages,
  'Switch fixture': switchFixtureMessages,
  'Textarea fixture': textareaFixtureMessages,
  'Alert fixture': alertFixtureMessages,
  'Badge fixture': badgeFixtureMessages,
  'Progress fixture': progressFixtureMessages,
  'Accordion fixture': accordionFixtureMessages,
  'Table fixture': tableFixtureMessages,
  'Toast fixture': [...toastFixtureMessages, ...toastRaisedFixtureMessages],
  'Trip request fixture': tripRequestFixtureMessages,
  'Row fixture': rowFixtureMessages,
  'Column fixture': columnFixtureMessages,
  'List fixture': listFixtureMessages,
  'Card fixture': cardFixtureMessages,
  'Tabs fixture': tabsFixtureMessages,
  'Modal fixture': modalFixtureMessages,
  'Split fixture': splitFixtureMessages,
  'Grid fixture': gridFixtureMessages,
  'Compare fixture': compareFixtureMessages,
  'Reveal fixture': revealFixtureMessages,
  'Icon fixture': iconFixtureMessages,
  'Image fixture': imageFixtureMessages,
  'Video fixture': videoFixtureMessages,
  'Audio fixture': audioPlayerFixtureMessages,
  'Stage fixture': stageFixtureMessages,
  ...stressCases
}

const createSurfaceOf = (messages: readonly A2uiMessage[]) =>
  messages.find(message => 'createSurface' in message)!.createSurface as {
    surfaceId: string
    components: readonly { component: string }[]
  }

test('every canonical catalog entry renders through some covered A2UI component', () => {
  expect(Object.keys(PROJECTIONS).sort()).toEqual(Object.keys(radiantCatalog.entries).sort())
  const projected = Object.values(PROJECTIONS).flat().sort()
  expect(projected).toEqual(
    Object.keys(radiantA2uiExtensionRegistry.toCatalogJson().components).sort()
  )
  const rendered = new Set(
    Object.values(fixtures).flatMap(messages =>
      createSurfaceOf(messages).components.map(component => component.component)
    )
  )
  expect(projected.filter(name => !rendered.has(name))).toEqual([])
})

/**
 * Why content past an element's inline edge stays inside it, or null when nothing contains it.
 * Intentional scroll regions, such as a Table container or a tab list, name themselves with a
 * slot; clipped text must show an ellipsis; a visually hidden form host is one pixel wide.
 */
function containment(element: HTMLElement): 'scroll' | 'ellipsis' | 'hidden' | 'leak' | null {
  const style = getComputedStyle(element)
  if (style.overflowX === 'visible') return null
  if (element.scrollWidth <= element.clientWidth + 1) return 'hidden'
  if (style.overflowX === 'auto' || style.overflowX === 'scroll')
    return element.hasAttribute('data-slot') ? 'scroll' : 'leak'
  if (style.textOverflow === 'ellipsis' || element.clientWidth <= 1) return 'ellipsis'
  return 'leak'
}

/** Top-layer and fixed elements are placed against the viewport, not the column. */
function outsideFlow(element: Element) {
  const style = getComputedStyle(element)
  return (
    style.position === 'fixed' ||
    element.matches(':popover-open, dialog[open], [data-slot~="sr-only"]') ||
    (style.position === 'absolute' && style.clip === 'rect(0px, 0px, 0px, 0px)')
  )
}

function findLeaks(frame: HTMLElement) {
  const surfaceElement = frame.firstElementChild as HTMLElement
  const bounds = frame.getBoundingClientRect()
  const leaks: string[] = []
  const describe = (element: Element) =>
    `${element.tagName.toLowerCase()}[data-slot="${element.getAttribute('data-slot') ?? ''}"]`
  if (surfaceElement.scrollWidth > surfaceElement.clientWidth)
    leaks.push(`surface scrolls ${surfaceElement.scrollWidth} > ${surfaceElement.clientWidth}`)
  const visit = (element: Element) => {
    if (outsideFlow(element)) return
    const rect = element.getBoundingClientRect()
    if (rect.width > 0 && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1))
      leaks.push(
        `${describe(element)} spans ${Math.round(rect.left - bounds.left)}..${Math.round(rect.right - bounds.left)}`
      )
    if (element instanceof HTMLElement && getComputedStyle(element).display !== 'inline') {
      const contained = containment(element)
      if (contained === 'leak') leaks.push(`${describe(element)} hides overflowing content`)
      if (contained) return
      if (element.scrollWidth > element.clientWidth + 1 && element.clientWidth > 0)
        leaks.push(`${describe(element)} overflows ${element.scrollWidth} > ${element.clientWidth}`)
    }
    for (const child of element.children) visit(child)
  }
  for (const child of surfaceElement.children) visit(child)
  return leaks
}

/** Mounts each tree in a frame, resizes it through every width and collects what leaks. */
async function measure(trees: Record<string, ReactNode>) {
  const failures: Record<string, string[]> = {}
  for (const [name, tree] of Object.entries(trees)) {
    const { host } = await mount(
      <div
        data-testid="frame"
        style={{ width: `${WIDTHS[0]}px` }}
      >
        {tree}
      </div>
    )
    const frame = host.querySelector<HTMLElement>('[data-testid="frame"]')!
    for (const width of WIDTHS) {
      frame.style.width = `${width}px`
      await act(async () => {
        await new Promise(requestAnimationFrame)
      })
      const leaks = findLeaks(frame)
      if (leaks.length) failures[`${name} @ ${width}px`] = leaks
    }
  }
  return failures
}

test('every catalog entry fits 360, 560 and 960 pixel containers without horizontal overflow', async () => {
  const trees = Object.fromEntries(
    Object.entries(fixtures).map(([name, messages]) => [
      name,
      <A2uiSurface
        key={name}
        surfaceId={createSurfaceOf(messages).surfaceId}
        messages={messages}
        registry={radiantA2uiExtensionRegistry}
        labels={{ notifications: 'Notifications' }}
      />
    ])
  )
  expect(await measure(trees)).toEqual({})
})

test('the React families behind catalog entries fit the same containers', async () => {
  const longTitle = `Ridge loop ${LONG_WORD}`
  expect(
    await measure({
      'Stage with four actions': (
        <Stage>
          <StageHeader>
            <StageTitle>{longTitle}</StageTitle>
            <StageDescription>{LONG_WORD}</StageDescription>
            <StageActions>
              {words.slice(0, 4).map(word => (
                <Button key={word}>{word}</Button>
              ))}
            </StageActions>
          </StageHeader>
          <StageBody>{LONG_WORD}</StageBody>
          <StageFooter>
            <Button>{longTitle}</Button>
          </StageFooter>
        </Stage>
      ),
      'Segmented ToggleGroup with eight items': (
        <ToggleGroup
          aria-label="Interests"
          variant="segmented"
          defaultValue={null}
        >
          {[...words, 'Photography', 'Birdwatching'].map(word => (
            <ToggleGroupItem
              key={word}
              value={word}
            >
              {word}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ),
      'Tabs with six triggers': (
        <Tabs defaultValue={words[0]}>
          <TabsList aria-label="Trip">
            {words.map(word => (
              <TabsTrigger
                key={word}
                value={word}
              >
                {word}
              </TabsTrigger>
            ))}
          </TabsList>
          {words.map(word => (
            <TabsContent
              key={word}
              value={word}
            >
              {LONG_WORD}
            </TabsContent>
          ))}
        </Tabs>
      ),
      'Card with a footer of actions': (
        <Card>
          <CardHeader>
            <CardTitle>{longTitle}</CardTitle>
          </CardHeader>
          <CardContent>{LONG_WORD}</CardContent>
          <CardFooter>
            {words.map(word => (
              <Button key={word}>{word}</Button>
            ))}
          </CardFooter>
        </Card>
      ),
      'Split, Grid and Compare': (
        <Stack>
          <Split>
            <SplitMain>{LONG_WORD}</SplitMain>
            <SplitSecondary>{LONG_WORD}</SplitSecondary>
          </Split>
          <Grid maxColumns={4}>
            {words.map(word => (
              <Card key={word}>{word}</Card>
            ))}
          </Grid>
          <Compare>
            {words.slice(0, 4).map(word => (
              <CompareItem key={word}>
                <CompareItemHeader>{word}</CompareItemHeader>
                <CompareItemBody>{LONG_WORD}</CompareItemBody>
                <CompareItemFooter>
                  <Button>Choose</Button>
                </CompareItemFooter>
              </CompareItem>
            ))}
          </Compare>
        </Stack>
      )
    })
  ).toEqual({})
})
