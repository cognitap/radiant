import { A2UI_PROTOCOL_VERSION, RADIANT_A2UI_EXTENSION_CATALOG_ID } from './catalogGenerator.js'
import type { A2uiMessage } from './sanitize.js'

export const REGION_STAGE_SURFACE_ID = 'floor_plan'

/** An office floor plan with colored rooms to book and a pin with a callout. */
export const regionStageFixtureMessages: readonly A2uiMessage[] = [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: REGION_STAGE_SURFACE_ID,
      catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
      dataModel: { rooms: ['studio'] },
      components: [
        {
          id: 'root',
          component: 'RegionStage',
          label: 'Rooms to book',
          viewBox: '0 0 400 240',
          selection: 'multiple',
          value: { '@path': '/rooms' },
          regions: [
            { value: 'lobby', label: 'Lobby', path: 'M10 10h140v100H10z', series: 1 },
            { value: 'kitchen', label: 'Kitchen', path: 'M160 10h110v100H160z', series: 2 },
            { value: 'studio', label: 'Studio', path: 'M280 10h110v220H280z', series: 3 },
            { value: 'meeting', label: 'Meeting room', path: 'M10 120h140v110H10z' },
            { value: 'storage', label: 'Storage', path: 'M160 120h110v110H160z', series: 6 }
          ],
          pins: [{ x: 150, y: 60, label: 'Fire exit', text: 'Leads to the north stairwell.' }]
        }
      ]
    }
  }
]
