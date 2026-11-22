'use client'

import { useEffect } from 'react'
import { isWritable, ResolvedBinding } from '@a2ui/web_core/resolution'
import {
  Matrix,
  MatrixCell,
  MatrixColumnHeader,
  MatrixCorner,
  MatrixMarker,
  MatrixRegion,
  MatrixRow,
  MatrixRowHeader,
  type MatrixCellState
} from '../components/Matrix/Matrix.js'
import { isSeriesNumber, type SeriesNumber } from '../internal/series.js'
import { radiantCatalog } from '../catalog/index.js'
import { isPlainRecord } from '../catalog/coerce.js'
import { generateA2uiCatalogs, type A2uiJsonSchema } from './catalogGenerator.js'
import { createA2uiRegistryEntry, type A2uiAdapterContext } from './registry.js'
import { describe, type A2uiAccessibilityRule } from './accessibilityRules.js'
import { readA2uiValue, writeA2uiBinding } from './adapterValues.js'

const schema = generateA2uiCatalogs(radiantCatalog).extension.components.Matrix as
  | (A2uiJsonSchema & { readonly description: string })
  | undefined
if (!schema || typeof schema.description !== 'string')
  throw new TypeError('A2UI extension catalog generator did not emit "Matrix".')

type Props = Readonly<Record<string, unknown>>
type Cell = {
  text: string
  value: string | undefined
  state: MatrixCellState | undefined
  series: SeriesNumber | undefined
  marker: { text: string; variant: 'solid' | 'outline' } | undefined
  description: string | undefined
  disabled: boolean
}
type Region = {
  row: number
  column: number
  rowSpan: number
  columnSpan: number
  label: string
  series: SeriesNumber | undefined
}

const STATES: readonly string[] = ['active', 'muted', 'highlighted']

const text = (value: unknown): string => {
  const raw = readA2uiValue(value)
  if (typeof raw === 'string') return raw.trim()
  return typeof raw === 'number' && Number.isFinite(raw) ? String(raw) : ''
}
const records = (value: unknown) => {
  const raw = readA2uiValue(value)
  return Array.isArray(raw) ? raw.filter(isPlainRecord) : []
}
const series = (value: unknown): SeriesNumber | undefined =>
  isSeriesNumber(value) ? value : undefined
const count = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 ? value : fallback

/** Cells in column order; a repeated value is dropped so selection stays unambiguous. */
function readCell(raw: Record<string, unknown> | undefined, seen: Set<string>): Cell {
  const value = text(raw?.value) || undefined
  const unique = value !== undefined && !seen.has(value) ? value : undefined
  if (unique) seen.add(unique)
  const marker = isPlainRecord(raw?.marker) ? raw.marker : undefined
  return {
    text: text(raw?.text),
    value: unique,
    state: STATES.includes(raw?.state as string) ? (raw!.state as MatrixCellState) : undefined,
    series: series(raw?.series),
    marker: marker
      ? { text: text(marker.text), variant: marker.ring === true ? 'outline' : 'solid' }
      : undefined,
    description: text(raw?.description) || undefined,
    disabled: raw?.disabled === true
  }
}

/** Requires a Matrix label and a header for every row and column. */
const matrixLabelRule: A2uiAccessibilityRule = {
  id: 'matrix-labels',
  check(component) {
    const name = describe(component)
    if (typeof component.label !== 'string' || !component.label.trim())
      return { prop: 'label', message: `${name} has no label to name the grid.` }
    for (const prop of ['columns', 'rows'] as const) {
      const list = component[prop]
      if (!Array.isArray(list)) continue
      const index = list.findIndex(item => !isPlainRecord(item) || !text(item.label))
      if (index >= 0)
        return { prop, message: `${name} ${prop.slice(0, -1)} ${index + 1} has no label.` }
    }
    return undefined
  }
}

type Coercion = { prop: string; received: number; used: number; reason: string }

/** Reads the grid, listing each change from what the agent sent as given and used counts. */
function readMatrix(props: Props) {
  const coercions: Coercion[] = []
  const note = (prop: string, received: number, used: number, reason: string) => {
    if (received !== used) coercions.push({ prop, received, used, reason })
  }
  const columns = records(props.columns).map(column => text(column.label))
  const seen = new Set<string>()
  let givenCells = 0,
    usedCells = 0,
    givenValues = 0
  const rows = records(props.rows).map(row => {
    const cells = Array.isArray(row.cells) ? row.cells : []
    givenCells += cells.length
    usedCells += Math.min(cells.length, columns.length)
    givenValues += cells.filter(cell => isPlainRecord(cell) && text(cell.value)).length
    return {
      label: text(row.label),
      cells: columns.map((_, index) =>
        readCell(isPlainRecord(cells[index]) ? cells[index] : undefined, seen)
      )
    }
  })
  note('rows', givenCells, usedCells, 'Cells past the last column are dropped.')
  note('rows', givenValues, seen.size, 'A repeated or dropped cell value is not selectable.')
  const given = records(props.regions)
  let requested = 0,
    spanned = 0
  const regions: Region[] = given.flatMap(region => {
    const row = count(region.row, 0),
      column = count(region.column, 0),
      label = text(region.label)
    if (!label || row < 1 || column < 1 || row > rows.length || column > columns.length) return []
    const rowSpan = count(region.rowSpan, 1),
      columnSpan = count(region.columnSpan, 1)
    const used = {
      row,
      column,
      rowSpan: Math.min(rowSpan, rows.length - row + 1),
      columnSpan: Math.min(columnSpan, columns.length - column + 1),
      label,
      series: series(region.series)
    }
    requested += rowSpan * columnSpan
    spanned += used.rowSpan * used.columnSpan
    return [used]
  })
  note(
    'regions',
    given.length,
    regions.length,
    'Regions without a label or starting outside the grid are dropped.'
  )
  note('regions', requested, spanned, 'Region spans stop at the last row and column.')
  return { columns, rows, regions, coercions }
}

function A2uiMatrix({ props, context }: { props: Props; context: A2uiAdapterContext }) {
  const { columns, rows, regions, coercions } = readMatrix(props)
  const nodeId = context.node.componentId
  const report = context.reportDiagnostic
  const key = JSON.stringify(coercions)
  useEffect(() => {
    for (const coercion of JSON.parse(key) as Coercion[])
      report?.({ kind: 'coerced', nodeId, component: 'Matrix', ...coercion })
  }, [key, nodeId, report])

  // No stand-in name: an unlabelled Matrix fails in its node's boundary, and the rule reports it.
  const label = text(props.label)
  if (columns.length === 0) return null
  const selection = props.selection === 'single' || props.selection === 'multiple'
  const values = new Set(rows.flatMap(row => row.cells.flatMap(cell => cell.value ?? [])))
  const raw = readA2uiValue(props.value)
  const chosen = (Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : []).filter(
    (item): item is string => typeof item === 'string' && values.has(item)
  )
  const bound = props.value instanceof ResolvedBinding && isWritable(props.value)
  const body = (
    <>
      <MatrixRow>
        <MatrixCorner />
        {columns.map((column, index) => (
          <MatrixColumnHeader key={index}>{column}</MatrixColumnHeader>
        ))}
      </MatrixRow>
      {rows.map((row, rowIndex) => (
        <MatrixRow key={rowIndex}>
          <MatrixRowHeader>{row.label}</MatrixRowHeader>
          {row.cells.map((cell, index) => (
            <MatrixCell
              key={index}
              value={selection ? cell.value : undefined}
              state={cell.state}
              series={cell.series}
              disabled={cell.disabled}
              altText={cell.description}
            >
              {cell.marker ? (
                <MatrixMarker variant={cell.marker.variant}>{cell.marker.text}</MatrixMarker>
              ) : null}
              {cell.text}
            </MatrixCell>
          ))}
        </MatrixRow>
      ))}
      {regions.map((region, index) => (
        <MatrixRegion
          key={index}
          row={region.row}
          column={region.column}
          rowSpan={region.rowSpan}
          columnSpan={region.columnSpan}
          label={region.label}
          series={region.series}
        />
      ))}
    </>
  )
  // Single and multiple selection keep separate owners; a change remounts.
  if (props.selection === 'multiple')
    return (
      <Matrix
        key="multiple"
        data-slot="a2ui-matrix"
        aria-label={label}
        columns={columns.length}
        type="multiple"
        {...(bound ? { value: chosen } : { defaultValue: chosen })}
        onValueChange={next => writeA2uiBinding(props.value, next)}
      >
        {body}
      </Matrix>
    )
  const single = chosen[0] ?? null
  return (
    <Matrix
      key="single"
      data-slot="a2ui-matrix"
      aria-label={label}
      columns={columns.length}
      {...(bound ? { value: single } : { defaultValue: single })}
      onValueChange={next => writeA2uiBinding(props.value, next === null ? [] : [next])}
    >
      {body}
    </Matrix>
  )
}

/** Matrix for the Radiant A2UI extension registry. */
export const matrixEntry = createA2uiRegistryEntry({
  name: 'Matrix',
  accessibility: [matrixLabelRule],
  component: [
    Matrix,
    MatrixRow,
    MatrixColumnHeader,
    MatrixRowHeader,
    MatrixCorner,
    MatrixCell,
    MatrixMarker,
    MatrixRegion
  ],
  schema,
  description: schema.description,
  adapter(props, context) {
    return (
      <A2uiMatrix
        props={props}
        context={context}
      />
    )
  }
})
