import { A2UI_PROTOCOL_VERSION, RADIANT_A2UI_EXTENSION_CATALOG_ID } from './catalogGenerator.js'
import type { A2uiMessage } from './sanitize.js'

export const ANNOTATED_TEXT_SURFACE_ID = 'code_review'

/** A reviewed line of code with nested spans, token labels and labelled arcs. */
export const annotatedTextFixtureMessages: readonly A2uiMessage[] = [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: ANNOTATED_TEXT_SURFACE_ID,
      catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
      components: [
        {
          id: 'root',
          component: 'AnnotatedText',
          label: 'Review of the retry call',
          tokens: [
            { text: 'const', labels: ['keyword'] },
            { text: 'delay', labels: ['binding'] },
            { text: '=' },
            { text: 'retry', labels: ['call'] },
            { text: '(' },
            { text: 'attempts', labels: ['argument'] },
            { text: ')' }
          ],
          spans: [
            { start: 0, end: 6, label: 'Statement', series: 1 },
            { start: 3, end: 6, label: 'Call', series: 2 },
            { start: 5, end: 5, label: 'Unchecked', series: 8 }
          ],
          arcs: [
            { from: 1, to: 3, label: 'assigned from' },
            { from: 5, to: 3, label: 'passed to', series: 2 }
          ]
        }
      ]
    }
  }
]
