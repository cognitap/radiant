import { A2UI_BASIC_CATALOG_ID, A2UI_PROTOCOL_VERSION } from './catalogGenerator.js'
import type { A2uiMessage } from './sanitize.js'

export const LAYOUT_SURFACE_ID = 'trail_planner'

const surface = (
  components: readonly Record<string, unknown>[],
  dataModel?: Record<string, unknown>
): readonly A2uiMessage[] => [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: LAYOUT_SURFACE_ID,
      catalogId: A2UI_BASIC_CATALOG_ID,
      ...(dataModel ? { dataModel } : {}),
      components
    }
  }
]

const noop = { event: { name: 'noop' } }

/** A Row whose search field takes the free space beside its button. */
export const rowFixtureMessages = surface(
  [
    {
      id: 'root',
      component: 'Row',
      justify: 'spaceBetween',
      align: 'end',
      children: ['trail_field', 'search_button']
    },
    {
      id: 'trail_field',
      component: 'TextField',
      label: 'Trail',
      value: { '@path': '/trail' },
      weight: 1
    },
    { id: 'search_button', component: 'Button', child: 'search_text', action: noop },
    { id: 'search_text', component: 'Text', text: 'Search' }
  ],
  { trail: '' }
)

/** A centred Column of a heading line and a caption. */
export const columnFixtureMessages = surface([
  {
    id: 'root',
    component: 'Column',
    align: 'center',
    children: ['title_text', 'caption_text']
  },
  { id: 'title_text', component: 'Text', text: 'Ridge loop' },
  { id: 'caption_text', component: 'Text', text: '12 km, 600 m climb', variant: 'caption' }
])

/** A List templated over `/trails`; each item reads `name` relative to its trail. */
export const listFixtureMessages = surface(
  [
    { id: 'root', component: 'List', children: { componentId: 'trail_card', path: '/trails' } },
    { id: 'trail_card', component: 'Card', child: 'trail_name' },
    { id: 'trail_name', component: 'Text', text: { '@path': 'name' } }
  ],
  { trails: [{ name: 'Ridge loop' }, { name: 'Lake shore' }, { name: 'Pine valley' }] }
)

/** A Card grouping a title and caption, split from a note by a Divider. */
export const cardFixtureMessages = surface([
  { id: 'root', component: 'Column', children: ['summary_card', 'section_divider', 'note_text'] },
  { id: 'summary_card', component: 'Card', child: 'summary_column' },
  { id: 'summary_column', component: 'Column', children: ['summary_title', 'summary_caption'] },
  { id: 'summary_title', component: 'Text', text: 'Ridge loop' },
  { id: 'summary_caption', component: 'Text', text: 'Moderate', variant: 'caption' },
  { id: 'section_divider', component: 'Divider' },
  { id: 'note_text', component: 'Text', text: 'Bring water.' }
])

/** Tabs switching between an overview and bound gear notes. */
export const tabsFixtureMessages = surface(
  [
    {
      id: 'root',
      component: 'Tabs',
      tabs: [
        { title: 'Overview', child: 'overview_text' },
        { title: 'Gear', child: 'gear_field' }
      ]
    },
    { id: 'overview_text', component: 'Text', text: 'A loop along the ridge.' },
    { id: 'gear_field', component: 'TextField', label: 'Gear notes', value: { '@path': '/gear' } }
  ],
  { gear: '' }
)

/** A Modal opened by its Button trigger, holding a short form. */
export const modalFixtureMessages = surface(
  [
    { id: 'root', component: 'Column', children: ['details_modal'] },
    {
      id: 'details_modal',
      component: 'Modal',
      trigger: 'details_button',
      content: 'details_column'
    },
    { id: 'details_button', component: 'Button', child: 'details_text', action: noop },
    { id: 'details_text', component: 'Text', text: 'Trail details' },
    { id: 'details_column', component: 'Column', children: ['details_body', 'details_field'] },
    { id: 'details_body', component: 'Text', text: 'Parking opens at dawn.' },
    {
      id: 'details_field',
      component: 'TextField',
      label: 'Group size',
      value: { '@path': '/groupSize' }
    }
  ],
  { groupSize: '' }
)
