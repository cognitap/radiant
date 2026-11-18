'use client'

import { Fragment, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from 'cn'
import { requireAccessibleName } from '../../internal/accessibleName.js'
import type { PartStyle } from '../../presentation.js'
import { useControllableState } from '../../react/useControllableState.js'
import type { StateOwner, ValueOwner } from '../../react/useNativeOwner.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { Button } from '../Button/Button.js'
import { Checkbox } from '../Checkbox/Checkbox.js'
import { WithoutField } from '../Field/Field.js'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  type TableContainerProps
} from '../Table/Table.js'

export type DataTableColumn<Row> = {
  id: string
  header: string
  cell: (row: Row) => ReactNode
  compare?: (left: Row, right: Row) => number
  width?: number | string
  /** Exposes cells in this column as native row headers. */
  rowHeader?: boolean
}
export type DataTableSort = { column: string; direction: 'ascending' | 'descending' }
export type DataTableSelection<Row> = ValueOwner<readonly string[]> & {
  onValueChange?: (keys: readonly string[]) => void
  allLabel: string
  labelForRow: (row: Row) => string
  isRowDisabled?: (row: Row) => boolean
}
export type DataTableVirtual = { height: number; rowHeight: number }
export type DataTableProps<Row> = Omit<
  TableContainerProps,
  'aria-label' | 'aria-labelledby' | 'children'
> &
  StateOwner<'sort', DataTableSort | null> & {
    caption: string
    rows: readonly Row[]
    columns: readonly DataTableColumn<Row>[]
    getRowId: (row: Row) => string
    onSortChange?: (next: DataTableSort | null) => void
    selection?: DataTableSelection<Row>
    stickyHeader?: boolean
    virtual?: DataTableVirtual
    emptyText?: string
    parts?: {
      table?: PartStyle
      caption?: PartStyle
      header?: PartStyle
      row?: PartStyle
      cell?: PartStyle
    }
  }

export function DataTable<Row>({
  caption,
  rows,
  columns,
  getRowId,
  sort,
  defaultSort,
  onSortChange,
  selection,
  virtual,
  stickyHeader = !!virtual,
  emptyText = 'No rows',
  ref,
  style,
  parts,
  'data-slot': slot,
  onScroll,
  onFocusCapture,
  onBlurCapture,
  ...props
}: DataTableProps<Row>) {
  requireAccessibleName('DataTable', { 'aria-label': caption })
  const count = columns.length + Number(!!selection)
  if (!columns.length || new Set(columns.map(column => column.id)).size !== columns.length) {
    throw new TypeError('DataTable requires columns with unique IDs.')
  }
  if (
    virtual &&
    [virtual.height, virtual.rowHeight].some(size => !Number.isFinite(size) || size <= 0)
  ) {
    throw new RangeError('DataTable virtual height and rowHeight must be positive finite numbers.')
  }

  const ordering = useControllableState<DataTableSort | null>({
    name: 'DataTable sort',
    value: sort,
    defaultValue: defaultSort,
    initialValue: null,
    onChange: onSortChange
  })
  const picking = useControllableState<readonly string[]>({
    name: 'DataTable selection',
    value: selection?.value,
    defaultValue: selection?.defaultValue,
    initialValue: [],
    onChange: selection?.onValueChange
  })
  const sorted = columns.find(column => column.compare && column.id === ordering.value?.column)
  const direction = ordering.value?.direction
  const indexed = useMemo(() => {
    const seen = new Set<string>()
    return rows.map(row => {
      const key = getRowId(row)
      if (!key || seen.has(key))
        throw new TypeError('DataTable requires unique, nonempty row keys.')
      seen.add(key)
      return { key, row }
    })
  }, [getRowId, rows])
  const ordered = useMemo(() => {
    const compare = sorted?.compare
    return compare
      ? [...indexed].sort((a, b) => compare(a.row, b.row) * (direction === 'descending' ? -1 : 1))
      : indexed
  }, [direction, indexed, sorted])

  const selected = new Set(picking.value)
  const enabled = selection
    ? indexed.filter(({ row }) => !selection.isRowDisabled?.(row)).map(({ key }) => key)
    : []
  const pickedCount = enabled.filter(key => selected.has(key)).length
  const all = enabled.length > 0 && pickedCount === enabled.length
  const viewport = useRef<HTMLElement>(null)
  const viewportRef = useComposedRefs(ref, viewport)
  const head = useRef<HTMLTableSectionElement>(null)
  const [top, setTop] = useState(0)
  const [focusedKey, setFocusedKey] = useState<string | undefined>()
  const [size, setSize] = useState({ head: 0, viewport: 0 })
  const rowHeight = virtual?.rowHeight ?? 0

  useLayoutEffect(() => {
    const node = viewport.current
    const header = head.current
    const view = node?.ownerDocument.defaultView
    if (!rowHeight || !node || !header || !view) return
    const observer = new view.ResizeObserver(() => {
      setSize({ head: header.offsetHeight, viewport: node.clientHeight })
    })
    observer.observe(node)
    observer.observe(header)
    return () => observer.disconnect()
  }, [rowHeight])

  useLayoutEffect(() => {
    if (viewport.current && rowHeight) viewport.current.scrollTop = 0
  }, [direction, sorted?.id, rowHeight])

  let first = 0
  let end = ordered.length
  if (virtual) {
    const visibleTop = Math.max(0, top - (stickyHeader ? 0 : size.head))
    first = Math.max(0, Math.min(ordered.length - 1, Math.floor(visibleTop / rowHeight)) - 3)
    end = Math.min(
      ordered.length,
      Math.ceil((visibleTop + (size.viewport || virtual.height)) / rowHeight) + 3
    )
  }
  const windowed = ordered
    .slice(first, end)
    .map((entry, offset) => ({ ...entry, index: first + offset }))
  if (virtual && focusedKey) {
    const index = ordered.findIndex(entry => entry.key === focusedKey)
    if (index >= 0 && index < first) windowed.unshift({ ...ordered[index], index })
    if (index >= end) windowed.push({ ...ordered[index], index })
  }

  function gap(length: number) {
    return (
      length > 0 && (
        <TableRow
          aria-hidden="true"
          className="border-0"
          data-slot="data-table-spacer"
        >
          <TableCell
            colSpan={count}
            className="p-0"
            style={{ height: length * rowHeight }}
          />
        </TableRow>
      )
    )
  }

  const headerClass = cn(
    stickyHeader &&
      'sticky top-0 z-10 shadow-[inset_0_-1px_var(--rad-table-border-color,var(--rad-color-border))]',
    parts?.header?.className
  )
  const cellClass = cn(virtual && 'px-0 py-0 align-middle', parts?.cell?.className)
  const contentClass =
    'box-border flex min-w-0 items-center overflow-hidden border-b border-[var(--rad-table-border-color,var(--rad-color-border))] forced-colors:border-[CanvasText] px-[var(--rad-table-padding-inline,var(--rad-control-small-padding-inline,0.75rem))]'

  return (
    <TableContainer
      {...props}
      ref={viewportRef}
      aria-label={caption}
      data-slot={slot ? 'data-table ' + slot : 'data-table'}
      style={{ ...(virtual && { height: virtual.height }), ...style }}
      onScroll={event => {
        onScroll?.(event)
        if (virtual) setTop(event.currentTarget.scrollTop)
      }}
      onFocusCapture={event => {
        onFocusCapture?.(event)
        if (virtual)
          setFocusedKey(
            (event.target as Element).closest<HTMLElement>('[data-row-key]')?.dataset.rowKey
          )
      }}
      onBlurCapture={event => {
        onBlurCapture?.(event)
        if (virtual && !event.currentTarget.contains(event.relatedTarget)) setFocusedKey(undefined)
      }}
    >
      <Table
        aria-rowcount={virtual && rows.length ? rows.length + 1 : undefined}
        data-slot="data-table-table"
        className={cn(
          virtual && 'table-fixed border-separate border-spacing-0',
          parts?.table?.className
        )}
        style={parts?.table?.style}
      >
        <TableCaption
          className={cn('sr-only', parts?.caption?.className)}
          style={parts?.caption?.style}
        >
          {caption}
        </TableCaption>
        <TableHead ref={head}>
          <TableRow aria-rowindex={virtual && rows.length ? 1 : undefined}>
            {selection && (
              <TableHeader
                className={cn('w-12', headerClass)}
                style={parts?.header?.style}
              >
                <WithoutField>
                  <Checkbox
                    aria-label={selection.allLabel}
                    checked={all}
                    indeterminate={pickedCount > 0 && !all}
                    disabled={!enabled.length}
                    onChange={event => {
                      const checked = event.currentTarget.checked
                      picking.request(previous => {
                        const next = new Set(previous)
                        for (const key of enabled) {
                          if (checked) next.add(key)
                          else next.delete(key)
                        }
                        return [...next]
                      })
                    }}
                  />
                </WithoutField>
              </TableHeader>
            )}
            {columns.map(column => {
              const active = sorted?.id === column.id
              return (
                <TableHeader
                  key={column.id}
                  aria-sort={active ? direction : undefined}
                  className={headerClass}
                  style={{ width: column.width, ...parts?.header?.style }}
                >
                  {column.compare ? (
                    <Button
                      variant="ghost"
                      tone="neutral"
                      controlSize="small"
                      className="max-w-full px-1 text-start"
                      onClick={() =>
                        ordering.request({
                          column: column.id,
                          direction:
                            active && direction === 'ascending' ? 'descending' : 'ascending'
                        })
                      }
                    >
                      {column.header}
                      <span
                        aria-hidden="true"
                        className="text-xs"
                      >
                        {active ? (direction === 'ascending' ? '↑' : '↓') : '↕'}
                      </span>
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHeader>
              )
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {!ordered.length && (
            <TableRow>
              <TableCell colSpan={count}>{emptyText}</TableCell>
            </TableRow>
          )}
          {windowed.map(({ key, row, index }, offset) => (
            <Fragment key={key}>
              {virtual && gap(index - (offset ? windowed[offset - 1].index + 1 : 0))}
              <TableRow
                aria-rowindex={virtual ? index + 2 : undefined}
                data-row-key={key}
                data-selected={selected.has(key) ? '' : undefined}
                className={parts?.row?.className}
                style={parts?.row?.style}
              >
                {selection && (
                  <TableCell
                    className={cellClass}
                    style={parts?.cell?.style}
                  >
                    <div
                      className={(virtual && contentClass) || undefined}
                      style={virtual ? { height: rowHeight } : undefined}
                    >
                      <WithoutField>
                        <Checkbox
                          aria-label={selection.labelForRow(row)}
                          checked={selected.has(key)}
                          disabled={selection.isRowDisabled?.(row)}
                          onChange={event => {
                            const checked = event.currentTarget.checked
                            picking.request(previous =>
                              checked ? [...previous, key] : previous.filter(value => value !== key)
                            )
                          }}
                        />
                      </WithoutField>
                    </div>
                  </TableCell>
                )}
                {columns.map(column => {
                  const Cell = column.rowHeader ? TableHeader : TableCell
                  return (
                    <Cell
                      key={column.id}
                      scope={column.rowHeader ? 'row' : undefined}
                      className={cellClass}
                      style={parts?.cell?.style}
                    >
                      {virtual ? (
                        <div
                          className={contentClass}
                          style={{ height: rowHeight }}
                        >
                          <div className="min-w-0 truncate">{column.cell(row)}</div>
                        </div>
                      ) : (
                        column.cell(row)
                      )}
                    </Cell>
                  )
                })}
              </TableRow>
            </Fragment>
          ))}
          {virtual && gap(ordered.length - (windowed.at(-1)?.index ?? -1) - 1)}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
