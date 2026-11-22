import { A2UI_PROTOCOL_VERSION, RADIANT_A2UI_EXTENSION_CATALOG_ID } from './catalogGenerator.js'
import type { A2uiMessage } from './sanitize.js'

export const EXTENSION_SURFACE_ID = 'account_settings'

/**
 * One extension-catalog surface: a basic heading, the control, a basic Text echoing the bound
 * value, and a basic Button whose action context carries it.
 */
const surface = (
  dataModel: Record<string, unknown>,
  control: Record<string, unknown>,
  echo: string
): readonly A2uiMessage[] => [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: EXTENSION_SURFACE_ID,
      catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
      dataModel,
      components: [
        { id: 'root', component: 'Column', children: ['heading', 'control', 'echo', 'save'] },
        { id: 'heading', component: 'Text', text: 'Account settings' },
        { id: 'control', ...control },
        { id: 'echo', component: 'Text', variant: 'caption', text: { '@path': echo } },
        {
          id: 'save',
          component: 'Button',
          variant: 'primary',
          child: 'save_label',
          action: { event: { name: 'save_settings', context: { value: { '@path': echo } } } }
        },
        { id: 'save_label', component: 'Text', text: 'Save' }
      ]
    }
  }
]

const required = (path: string, message: string) => [
  { condition: { '@call': 'required', args: { value: { '@path': path } } }, message }
]

/** Select whose `items` come from the data model. */
export const selectFixtureMessages = surface(
  {
    countries: [
      { value: 'de', label: 'Germany' },
      { value: 'hu', label: 'Hungary' },
      { value: 'jp', label: 'Japan' }
    ],
    country: 'hu'
  },
  {
    component: 'Select',
    label: 'Country',
    description: 'Used for tax forms.',
    placeholder: 'Choose a country',
    items: { '@path': '/countries' },
    value: { '@path': '/country' },
    controlSize: 'large',
    checks: required('/country', 'Choose a country.')
  },
  '/country'
)

/** Combobox whose `items` the host replaces with search results. */
export const comboboxFixtureMessages = surface(
  {
    cityResults: [
      { value: 'bud', label: 'Budapest' },
      { value: 'ber', label: 'Berlin' }
    ],
    cities: []
  },
  {
    component: 'Combobox',
    label: 'Cities',
    selection: 'multiple',
    placeholder: 'Search cities',
    items: { '@path': '/cityResults' },
    value: { '@path': '/cities' }
  },
  '/cities'
)

/** RadioGroup with literal options and a description on one of them. */
export const radioGroupFixtureMessages = surface(
  { plan: 'team' },
  {
    component: 'RadioGroup',
    label: 'Plan',
    options: [
      { value: 'solo', label: 'Solo' },
      { value: 'team', label: 'Team', description: 'Up to ten seats.' },
      { value: 'org', label: 'Organization', disabled: true }
    ],
    value: { '@path': '/plan' },
    checks: required('/plan', 'Choose a plan.')
  },
  '/plan'
)

/** Switch bound to a boolean setting. */
export const switchFixtureMessages = surface(
  { notify: false },
  {
    component: 'Switch',
    label: 'Notify me about replies',
    description: 'Sends one email per thread.',
    checked: { '@path': '/notify' },
    controlSize: 'small'
  },
  '/notify'
)

/** Textarea with a required check. */
export const textareaFixtureMessages = surface(
  { bio: '' },
  {
    component: 'Textarea',
    label: 'Bio',
    placeholder: 'A few sentences about you',
    rows: 3,
    value: { '@path': '/bio' },
    checks: required('/bio', 'Write a short bio.')
  },
  '/bio'
)

/** SortableList whose `items` and order come from the data model. */
export const sortableListFixtureMessages = surface(
  {
    stops: [
      { value: 'museum', label: 'Museum' },
      { value: 'market', label: 'Market' },
      { value: 'park', label: 'Park' }
    ],
    route: ['market', 'museum', 'park']
  },
  {
    component: 'SortableList',
    label: 'Order of stops',
    description: 'Drag a stop or use its handle with the keyboard.',
    items: { '@path': '/stops' },
    value: { '@path': '/route' }
  },
  '/route'
)

/** DragAndDrop sorting files into folders, one of which holds two, bound to the data model. */
export const dragAndDropFixtureMessages = surface(
  {
    files: [
      { value: 'invoice', label: 'Invoice.pdf' },
      { value: 'photo', label: 'Beach.jpg' },
      { value: 'notes', label: 'Notes.txt' }
    ],
    folders: { inbox: ['invoice', 'photo', 'notes'], work: [], personal: [] }
  },
  {
    component: 'DragAndDrop',
    label: 'Sort files',
    description: 'Drag a file or use its handle with the keyboard.',
    containers: [
      { value: 'inbox', label: 'Inbox' },
      { value: 'work', label: 'Work', capacity: 2 },
      { value: 'personal', label: 'Personal' }
    ],
    items: { '@path': '/files' },
    value: { '@path': '/folders' }
  },
  '/folders'
)
