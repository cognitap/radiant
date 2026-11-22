import { A2UI_PROTOCOL_VERSION, RADIANT_A2UI_EXTENSION_CATALOG_ID } from './catalogGenerator.js'
import type { A2uiMessage } from './sanitize.js'

export const STAGE_SURFACE_ID = 'route_map'

const label = (id: string, text: string) => ({ id, component: 'Text', text })
const button = (id: string, name: string, variant?: string) => ({
  id,
  component: 'Button',
  ...(variant ? { variant } : {}),
  child: `${id}_label`,
  action: { event: { name } }
})

/** Stage framing a widget with header actions, a 3:2 body and footer buttons. */
export const stageFixtureMessages: readonly A2uiMessage[] = [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: STAGE_SURFACE_ID,
      catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
      components: [
        {
          id: 'root',
          component: 'Stage',
          title: 'Route map',
          description: 'Ride from the station to the lake.',
          aspectRatio: 1.5,
          actions: ['zoom'],
          child: 'map',
          footer: ['reset', 'share']
        },
        { id: 'map', component: 'Text', text: 'Map tiles load here.' },
        button('zoom', 'zoom_in'),
        label('zoom_label', 'Zoom in'),
        button('reset', 'reset_view', 'borderless'),
        label('reset_label', 'Reset view'),
        button('share', 'share_route', 'primary'),
        label('share_label', 'Share route')
      ]
    }
  }
]

/** The same Stage before its body arrives: the body holds its ratio around a placeholder. */
export const stageStreamingFixtureMessages: readonly A2uiMessage[] = [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: STAGE_SURFACE_ID,
      catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
      components: [
        {
          id: 'root',
          component: 'Stage',
          title: 'Route map',
          aspectRatio: 1.5,
          child: 'map'
        }
      ]
    }
  }
]
