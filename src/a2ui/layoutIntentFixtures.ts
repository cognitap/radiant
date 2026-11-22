import { A2UI_PROTOCOL_VERSION, RADIANT_A2UI_EXTENSION_CATALOG_ID } from './catalogGenerator.js'
import type { A2uiMessage } from './sanitize.js'

export const SPLIT_SURFACE_ID = 'trip_planner'
export const GRID_SURFACE_ID = 'course_list'
export const COMPARE_SURFACE_ID = 'plan_picker'
export const REVEAL_SURFACE_ID = 'bread_recipe'

const surface = (
  surfaceId: string,
  components: readonly Record<string, unknown>[]
): readonly A2uiMessage[] => [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: { surfaceId, catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID, components }
  }
]

const text = (id: string, value: string) => ({ id, component: 'Text', text: value })

/** An itinerary beside a summary on the start side. */
export const splitFixtureMessages = surface(SPLIT_SURFACE_ID, [
  {
    id: 'root',
    component: 'Split',
    side: 'start',
    ratio: 'main',
    main: 'itinerary',
    secondary: 'summary'
  },
  { id: 'itinerary', component: 'Column', children: ['itinerary_title', 'itinerary_body'] },
  text('itinerary_title', 'Itinerary'),
  text('itinerary_body', 'Day one: ride from the station to the lake.'),
  { id: 'summary', component: 'Column', children: ['summary_title', 'summary_body'] },
  text('summary_title', 'Summary'),
  text('summary_body', 'Three days, 140 km.')
])

/** Four course cards in at most three columns. */
export const gridFixtureMessages = surface(GRID_SURFACE_ID, [
  {
    id: 'root',
    component: 'Grid',
    maxColumns: 3,
    children: ['algebra', 'biology', 'chemistry', 'drawing']
  },
  ...['algebra', 'biology', 'chemistry', 'drawing'].flatMap(name => [
    { id: name, component: 'Card', child: `${name}_title` },
    text(`${name}_title`, name[0]!.toUpperCase() + name.slice(1))
  ])
])

/** Three plans whose names, details and buttons line up. */
export const compareFixtureMessages = surface(COMPARE_SURFACE_ID, [
  { id: 'root', component: 'Compare', children: ['basic', 'plus', 'team'] },
  ...(
    [
      ['basic', 'Basic', 'One learner.'],
      ['plus', 'Plus', 'One learner, offline lessons and weekly reports by email.'],
      ['team', 'Team', 'Up to ten learners.']
    ] as const
  ).flatMap(([id, name, detail]) => [
    {
      id,
      component: 'CompareItem',
      header: `${id}_name`,
      body: `${id}_detail`,
      footer: `${id}_choose`
    },
    text(`${id}_name`, name),
    text(`${id}_detail`, detail),
    {
      id: `${id}_choose`,
      component: 'Button',
      child: `${id}_choose_label`,
      action: { event: { name: `choose_${id}` } }
    },
    text(`${id}_choose_label`, `Choose ${name}`)
  ])
])

/** Three recipe steps; the host's labels add the controls. */
export const revealFixtureMessages = surface(REVEAL_SURFACE_ID, [
  { id: 'root', component: 'Reveal', steps: ['mix', 'rest', 'bake'] },
  text('mix', 'Mix flour, water and salt.'),
  text('rest', 'Rest the dough for an hour.'),
  text('bake', 'Bake for 40 minutes.')
])
