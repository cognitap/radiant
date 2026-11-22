import { A2UI_PROTOCOL_VERSION, RADIANT_A2UI_EXTENSION_CATALOG_ID } from './catalogGenerator.js'
import type { A2uiMessage } from './sanitize.js'

export const RELATION_GRAPH_SURFACE_ID = 'release_pipeline'

/** A release pipeline in layers, with a retry loop back to the build and a muted manual step. */
export const relationGraphFixtureMessages: readonly A2uiMessage[] = [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: RELATION_GRAPH_SURFACE_ID,
      catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
      components: [
        {
          id: 'root',
          component: 'RelationGraph',
          label: 'Release pipeline',
          layout: 'layered',
          nodes: [
            { id: 'build', label: 'Build', series: 1 },
            { id: 'test', label: 'Test', series: 1 },
            { id: 'review', label: 'Review', emphasis: 'muted', description: 'Optional' },
            { id: 'deploy', label: 'Deploy', series: 3, emphasis: 'highlighted' }
          ],
          edges: [
            { from: 'build', to: 'test', label: 'artifacts' },
            { from: 'test', to: 'deploy', label: 'passed' },
            { from: 'build', to: 'review' },
            { from: 'review', to: 'deploy' },
            { from: 'test', to: 'build', label: 'retry', series: 8 }
          ]
        }
      ]
    }
  }
]
