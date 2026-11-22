import extensionCatalog from '../../src/a2ui/extension-catalog.json'
import { allPairs, type Axis } from './pairwise.js'

export const VISUAL_SURFACE_ID = 'visual_matrix'
const CATALOG_ID = extensionCatalog.catalogId
const PROTOCOL_VERSION = extensionCatalog.protocolVersion

type Node = Record<string, unknown> & { readonly id: string }
type Schema = {
  readonly enum?: readonly unknown[]
  readonly type?: unknown
  readonly properties?: Record<string, Schema>
  readonly allOf?: readonly Schema[]
}

/** A minimal valid instance: the root's required content, the nodes it references, and data. */
type Seed = {
  readonly root: Record<string, unknown>
  readonly nodes?: readonly Node[]
  readonly dataModel?: Record<string, unknown>
  /** Nodes around the component, for one that only shows inside a parent; its id is `subject`. */
  readonly context?: readonly Node[]
}

export type VisualCase = {
  readonly name: string
  readonly messages: readonly Record<string, unknown>[]
}

/** Props that change what assistive technology hears, not what the page shows. */
const NON_VISUAL = new Set(['announce', 'decorative'])

/** Components drawn in a fixed viewport outside the surface, which an element screenshot misses. */
const OUT_OF_FRAME = new Set(['Toast'])

const IMAGE_URL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#4f7cac"/><circle cx="240" cy="60" r="28" fill="#f4d35e"/></svg>'
)}`
const text = (id: string, value: string): Node => ({ id, component: 'Text', text: value })
const noop = { event: { name: 'noop' } }
const button = (id: string, label: string): Node[] => [
  { id, component: 'Button', child: `${id}_label`, action: noop },
  text(`${id}_label`, label)
]
const options = [
  { value: 'tea', label: 'Tea' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'water', label: 'Water' }
]
const three = [text('one', 'Mix flour'), text('two', 'Rest the dough'), text('three', 'Bake')]
const threeIds = ['one', 'two', 'three']

/**
 * Required content for every extension-catalog component. The matrix varies everything else the
 * schema enumerates, so a new enum value is covered as soon as the catalog has it.
 */
const seeds: Record<string, Seed> = {
  Column: { root: { children: threeIds }, nodes: three },
  Row: { root: { children: threeIds }, nodes: three },
  List: { root: { children: threeIds }, nodes: three },
  Grid: { root: { children: threeIds }, nodes: three },
  Reveal: { root: { steps: threeIds }, nodes: three },
  Text: { root: { text: 'Bring water and a warm layer.' } },
  Icon: { root: { name: 'star', accessibility: { label: 'Favorite' } } },
  Image: { root: { url: IMAGE_URL, description: 'A lake under a yellow sun' } },
  Video: { root: { url: 'data:video/mp4;base64,', accessibility: { label: 'Trail walk' } } },
  AudioPlayer: { root: { url: 'data:audio/mpeg;base64,', accessibility: { label: 'Briefing' } } },
  Divider: {
    root: {},
    context: [
      { id: 'root', component: 'Row', children: ['before', 'subject', 'after'] },
      text('before', 'Before'),
      text('after', 'After')
    ]
  },
  Card: { root: { child: 'body' }, nodes: [text('body', 'Ridge loop, 12 km.')] },
  Button: { root: { child: 'label', action: noop }, nodes: [text('label', 'Save')] },
  TextField: {
    root: { label: 'Name', value: { '@path': '/value' }, placeholder: 'Ada' },
    dataModel: { value: '' }
  },
  Textarea: {
    root: { label: 'Notes', value: { '@path': '/value' }, placeholder: 'Anything else' },
    dataModel: { value: '' }
  },
  CheckBox: {
    root: { label: 'Remember me', value: { '@path': '/value' } },
    dataModel: { value: true }
  },
  Switch: {
    root: { label: 'Notifications', checked: { '@path': '/value' } },
    dataModel: { value: true }
  },
  ChoicePicker: {
    root: { label: 'Drink', options, value: { '@path': '/value' } },
    dataModel: { value: ['tea'] }
  },
  RadioGroup: {
    root: { label: 'Drink', options, value: { '@path': '/value' } },
    dataModel: { value: 'tea' }
  },
  Select: {
    root: { label: 'Drink', items: options, value: { '@path': '/value' } },
    dataModel: { value: 'tea' }
  },
  Combobox: {
    root: { label: 'Drinks', items: options, value: { '@path': '/value' }, placeholder: 'Search' },
    dataModel: { value: ['tea'] }
  },
  Slider: {
    root: { label: 'Volume', value: { '@path': '/value' }, max: 10 },
    dataModel: { value: 4 }
  },
  DateTimeInput: {
    root: { label: 'Start', value: { '@path': '/value' }, enableDate: true },
    dataModel: { value: '2025-03-14' }
  },
  Tabs: {
    root: {
      tabs: [
        { title: 'Overview', child: 'overview' },
        { title: 'Gear', child: 'gear' }
      ]
    },
    nodes: [text('overview', 'A loop along the ridge.'), text('gear', 'Boots and water.')]
  },
  Modal: {
    root: { trigger: 'open', content: 'body' },
    nodes: [...button('open', 'Trail details'), text('body', 'Parking opens at dawn.')]
  },
  Stage: {
    root: { title: 'Ridge loop', child: 'body', actions: ['share'], footer: ['note'] },
    nodes: [
      text('body', 'Twelve kilometres.'),
      ...button('share', 'Share'),
      text('note', 'Updated')
    ]
  },
  Alert: {
    root: { title: 'Payment is late', description: 'We retry tomorrow.', actions: ['retry'] },
    nodes: button('retry', 'Retry now')
  },
  Toast: {
    root: { title: 'Draft saved', open: { '@path': '/open' }, actionLabel: 'Undo', action: noop },
    dataModel: { open: true }
  },
  Badge: { root: { text: 'Shipped' } },
  Progress: { root: { label: 'Uploading', value: 40, max: 100 } },
  Accordion: {
    root: {
      items: [
        { value: 'shipping', title: 'Shipping', panel: 'shipping' },
        { value: 'returns', title: 'Returns', panel: 'returns' }
      ],
      value: { '@path': '/value' }
    },
    nodes: [text('shipping', 'Ships within two days.'), text('returns', 'Within 30 days.')],
    dataModel: { value: ['shipping'] }
  },
  Table: {
    root: {
      caption: 'Invoices',
      columns: [{ label: 'Number' }, { label: 'Customer' }, { label: 'Amount', align: 'end' }],
      rows: { componentId: 'row', path: '/rows' }
    },
    nodes: [
      { id: 'row', component: 'Row', children: ['number', 'customer', 'amount'] },
      { id: 'number', component: 'Text', text: { '@path': 'number' } },
      { id: 'customer', component: 'Text', text: { '@path': 'customer' } },
      { id: 'amount', component: 'Text', text: { '@path': 'amount' } }
    ],
    dataModel: {
      rows: [
        { number: '1042', customer: 'Ada Lovelace', amount: '€120.00' },
        { number: '1043', customer: 'Alan Turing', amount: '€80.50' }
      ]
    }
  },
  Split: {
    root: { main: 'main', secondary: 'aside' },
    nodes: [text('main', 'Main column content.'), text('aside', 'Aside')]
  },
  Compare: {
    root: { children: ['basic', 'plus'] },
    nodes: (['basic', 'plus'] as const).flatMap(id => [
      { id, component: 'CompareItem', header: `${id}_name`, body: `${id}_body` },
      text(`${id}_name`, id === 'basic' ? 'Basic' : 'Plus'),
      text(`${id}_body`, id === 'basic' ? 'One learner.' : 'Offline lessons and reports.')
    ])
  },
  CompareItem: {
    root: { header: 'name', body: 'detail', footer: 'choose' },
    nodes: [text('name', 'Plus'), text('detail', 'Offline lessons.'), ...button('choose', 'Choose')]
  }
}

/** Representative content placed inside each container in the nesting cases. */
const cluster = (prefix: string): Node[] => [
  { id: prefix, component: 'Column', children: [`${prefix}_h`, `${prefix}_p`, `${prefix}_row`] },
  { id: `${prefix}_h`, component: 'Text', variant: 'body', text: 'Ridge loop' },
  text(`${prefix}_p`, 'A 12 km loop along the ridge with two steep climbs.'),
  { id: `${prefix}_row`, component: 'Row', children: [`${prefix}_badge`, `${prefix}_go`] },
  { id: `${prefix}_badge`, component: 'Badge', text: 'Open', tone: 'accent' },
  ...button(`${prefix}_go`, 'Start')
]

const nesting: Record<string, readonly Node[]> = {
  'Card>Column': [{ id: 'root', component: 'Card', child: 'a' }, ...cluster('a')],
  'Stage>Column': [{ id: 'root', component: 'Stage', title: 'Trail', child: 'a' }, ...cluster('a')],
  'Stage>Card>Column': [
    { id: 'root', component: 'Stage', title: 'Trail', child: 'card' },
    { id: 'card', component: 'Card', child: 'a' },
    ...cluster('a')
  ],
  'Grid>Card': [
    { id: 'root', component: 'Grid', children: ['card_a', 'card_b', 'card_c'] },
    ...(['a', 'b', 'c'] as const).flatMap(p => [
      { id: `card_${p}`, component: 'Card', child: p },
      ...cluster(p)
    ])
  ],
  'Row>Card': [
    { id: 'root', component: 'Row', children: ['card_a', 'card_b'] },
    ...(['a', 'b'] as const).flatMap(p => [
      { id: `card_${p}`, component: 'Card', child: p },
      ...cluster(p)
    ])
  ],
  'Split>Card': [
    { id: 'root', component: 'Split', main: 'a', secondary: 'card' },
    { id: 'card', component: 'Card', child: 'b' },
    ...cluster('a'),
    ...cluster('b')
  ],
  'Tabs>Card': [
    { id: 'root', component: 'Tabs', tabs: [{ title: 'Trail', child: 'card' }] },
    { id: 'card', component: 'Card', child: 'a' },
    ...cluster('a')
  ]
}

function properties(schema: Schema): Record<string, Schema> {
  return Object.assign(
    {},
    schema.properties,
    ...(schema.allOf ?? []).map(part => part.properties ?? {})
  )
}

/** Every enum and boolean prop a component's schema allows, as matrix axes. */
export function axesFor(schema: Schema): Axis[] {
  return Object.entries(properties(schema))
    .filter(([name]) => name !== 'component' && !NON_VISUAL.has(name))
    .flatMap(([name, prop]): Axis[] => {
      if (prop.enum) return [{ name, values: prop.enum }]
      if (prop.type === 'boolean') return [{ name, values: [false, true] }]
      return []
    })
}

const surface = (nodes: readonly Node[], dataModel: Record<string, unknown> = {}) => [
  {
    version: PROTOCOL_VERSION,
    createSurface: {
      surfaceId: VISUAL_SURFACE_ID,
      catalogId: CATALOG_ID,
      dataModel,
      components: nodes
    }
  }
]

const label = (combination: Record<string, unknown>) =>
  Object.entries(combination)
    .map(([name, value]) => `${name}=${String(value)}`)
    .join(',') || 'default'

/** Components in the catalog that have no seed, so the matrix cannot render them. */
export const unseeded = () =>
  Object.keys(extensionCatalog.components).filter(name => !(name in seeds))

/** Pairwise variant cases for every catalog component, then the nesting cases. */
export function visualCases(): VisualCase[] {
  const components = extensionCatalog.components as Record<string, Schema>
  const variants = Object.entries(components).flatMap(([component, schema]) => {
    const seed = seeds[component]
    if (!seed || OUT_OF_FRAME.has(component)) return []
    const id = seed.context ? 'subject' : 'root'
    return allPairs(axesFor(schema)).map(combination => ({
      name: `${component}/${label(combination)}`,
      messages: surface(
        [
          ...(seed.context ?? []),
          { id, component, ...seed.root, ...combination },
          ...(seed.nodes ?? [])
        ],
        seed.dataModel
      )
    }))
  })
  const nested = Object.entries(nesting).map(([name, nodes]) => ({
    name: `nesting/${name}`,
    messages: surface(nodes)
  }))
  return [...variants, ...nested]
}
