import { A2UI_PROTOCOL_VERSION, RADIANT_A2UI_EXTENSION_CATALOG_ID } from './catalogGenerator.js'
import type { A2uiMessage } from './sanitize.js'

export const MATRIX_SURFACE_ID = 'seat_map'

const seat = (row: string, column: number, taken: boolean) => ({
  text: `${row}${column}`,
  value: `${row}${column}`,
  ...(taken ? { disabled: true, state: 'muted' } : {})
})

/** A seat map with multiple selection bound to the data model and a labelled block of seats. */
export const matrixFixtureMessages: readonly A2uiMessage[] = [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: MATRIX_SURFACE_ID,
      catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
      dataModel: { seats: ['B2'] },
      components: [
        {
          id: 'root',
          component: 'Matrix',
          label: 'Seats',
          selection: 'multiple',
          value: { '@path': '/seats' },
          columns: [1, 2, 3, 4, 5].map(column => ({ label: `Seat ${column}` })),
          rows: ['A', 'B', 'C'].map(row => ({
            label: `Row ${row}`,
            cells: [1, 2, 3, 4, 5].map(column =>
              seat(row, column, (row === 'A' && column === 3) || (row === 'C' && column === 5))
            )
          })),
          regions: [{ row: 1, column: 1, rowSpan: 2, columnSpan: 2, label: 'Quiet', series: 3 }]
        }
      ]
    }
  }
]

/** A heatmap without selection: series colors, states and a marker. */
export const matrixHeatmapFixtureMessages: readonly A2uiMessage[] = [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: MATRIX_SURFACE_ID,
      catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
      components: [
        {
          id: 'root',
          component: 'Matrix',
          label: 'Busy hours',
          columns: ['Mon', 'Tue', 'Wed'].map(label => ({ label })),
          rows: [
            {
              label: 'Morning',
              cells: [
                { text: 'Low', series: 1 },
                { text: 'High', series: 2, state: 'active' },
                { text: 'Low', series: 1 }
              ]
            },
            {
              label: 'Evening',
              cells: [
                { state: 'muted', text: 'Closed' },
                { marker: { text: '!' }, description: 'Peak', state: 'highlighted' },
                { text: 'Mid', series: 3 }
              ]
            }
          ]
        }
      ]
    }
  }
]
