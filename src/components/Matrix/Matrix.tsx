'use client'
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Rows share the grid's subgrid tracks, which table elements cannot. */

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode
} from 'react'
import { cn } from 'cn'
import { requireAccessibleName, type AccessibleName } from '../../internal/accessibleName.js'
import { joinIds } from '../../internal/ids.js'
import {
  isItemOpen,
  nextSelection,
  sameSelection,
  type Selection
} from '../../internal/selection.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useControllableState } from '../../react/useControllableState.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import type { PartStyle } from '../../presentation.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import type { SeriesIndex } from '../../themes/tokens.js'
import { focusRingClass, focusRingInsetClass } from '../shared/focusStyles.js'
import { scrollbarClass } from '../shared/scrollbarStyles.js'

/** Documented `data-state` values of a cell; leave it unset for a plain cell. */
export type MatrixCellState = 'active' | 'muted' | 'highlighted'
export type MatrixValue = Selection

type PartProps<Extra extends string = never> = Omit<
  ComponentProps<'div'>,
  'style' | 'role' | Extra
> & {
  style?: ThemeStyle
  'data-slot'?: string
}

type MatrixBase = Omit<
  PartProps<'defaultValue' | 'tabIndex' | 'contentEditable' | 'dangerouslySetInnerHTML'>,
  'aria-multiselectable'
> &
  AccessibleName & {
    /** Number of cell columns, not counting the row header column. */
    columns: number
    /** Keeps every cell navigable but stops selection. */
    disabled?: boolean
  }

/**
 * Div host with `role="grid"`. Rows share the Matrix's column tracks: a row header column sized
 * to its content, then `columns` equal tracks of at least `components.matrix.cellSize`. When the
 * tracks do not fit, the Matrix scrolls inline and never block-wise. Cells with a `value` are
 * selectable; `type` picks one (`string | null`) or many (`string[]`).
 */
export type MatrixProps = MatrixBase &
  (
    | (ValueOwner<string | null> & {
        type?: 'single'
        onValueChange?: (value: string | null) => void
      })
    | (ValueOwner<string[]> & {
        type: 'multiple'
        onValueChange?: (value: string[]) => void
      })
  )

/** Div host with `role="row"`; a row of `MatrixColumnHeader`s is the header row. */
export type MatrixRowProps = PartProps
/** Div host with `role="columnheader"`. */
export type MatrixColumnHeaderProps = PartProps
/** Div host with `role="rowheader"`, first in its row. */
export type MatrixRowHeaderProps = PartProps
/**
 * Div host at the start of the header row, above the row headers. It is a column header when it
 * has children and an empty cell otherwise.
 */
export type MatrixCornerProps = PartProps

/** Focusable div host with `role="gridcell"`. */
export type MatrixCellProps = PartProps<'tabIndex' | 'aria-selected' | 'aria-disabled'> & {
  /** Makes the cell selectable; distinct within a Matrix. */
  value?: string
  state?: MatrixCellState
  /** Categorical color from the theme's series tokens. */
  series?: SeriesIndex
  /** Navigable but not selectable. */
  disabled?: boolean
  /** Replaces the announced contents, for cells that only hold markers. */
  altText?: string
}

/** Span that marks a cell, such as a round dot holding a short label. */
export type MatrixMarkerProps = Omit<ComponentProps<'span'>, 'style'> & {
  style?: ThemeStyle
  'data-slot'?: string
  /** `solid` fills the marker; `outline` draws a ring for an open or empty mark. */
  variant?: 'solid' | 'outline'
  series?: SeriesIndex
}

/**
 * Div host drawn over a block of cells; a direct child of `Matrix`. Rows and columns count cell
 * rows and cell columns from 1, not headers. Cells inside it are described by `label`. Spans stop
 * at the last row and column; a region that starts past them is hidden.
 */
export type MatrixRegionProps = Omit<PartProps<'children'>, 'aria-hidden'> & {
  row: number
  column: number
  rowSpan?: number
  columnSpan?: number
  label: ReactNode
  series?: SeriesIndex
  parts?: { label?: PartStyle }
}

type Region = { id: string; row: number; column: number; rowSpan: number; columnSpan: number }
type MatrixState = {
  type: 'single' | 'multiple'
  value: Selection
  disabled: boolean
  toggle: (value: string) => void
  columns: number
  /** Cell rows measured after mount; 0 before. */
  rows: number
  regionsFor: (cellId: string) => string | undefined
  setRegions: (update: (regions: readonly Region[]) => readonly Region[]) => void
}

const Context = createContext<MatrixState | null>(null)
function useMatrix(part: string) {
  const state = useContext(Context)
  if (!state) throw new Error(`${part} must render inside Matrix.`)
  return state
}

const MATRIX = '[data-slot~="matrix"]'
const ROW = '[data-slot~="matrix-row"]'
const CELL = '[data-slot~="matrix-cell"]'

// Complete class names per series, so the stylesheet keeps each one.
const seriesClasses: Record<SeriesIndex, string> = {
  '1': '[--_matrix-solid:var(--rad-series-1-solid)] [--_matrix-soft:var(--rad-series-1-soft)] [--_matrix-border:var(--rad-series-1-border)] [--_matrix-text:var(--rad-series-1-text)]',
  '2': '[--_matrix-solid:var(--rad-series-2-solid)] [--_matrix-soft:var(--rad-series-2-soft)] [--_matrix-border:var(--rad-series-2-border)] [--_matrix-text:var(--rad-series-2-text)]',
  '3': '[--_matrix-solid:var(--rad-series-3-solid)] [--_matrix-soft:var(--rad-series-3-soft)] [--_matrix-border:var(--rad-series-3-border)] [--_matrix-text:var(--rad-series-3-text)]',
  '4': '[--_matrix-solid:var(--rad-series-4-solid)] [--_matrix-soft:var(--rad-series-4-soft)] [--_matrix-border:var(--rad-series-4-border)] [--_matrix-text:var(--rad-series-4-text)]',
  '5': '[--_matrix-solid:var(--rad-series-5-solid)] [--_matrix-soft:var(--rad-series-5-soft)] [--_matrix-border:var(--rad-series-5-border)] [--_matrix-text:var(--rad-series-5-text)]',
  '6': '[--_matrix-solid:var(--rad-series-6-solid)] [--_matrix-soft:var(--rad-series-6-soft)] [--_matrix-border:var(--rad-series-6-border)] [--_matrix-text:var(--rad-series-6-text)]',
  '7': '[--_matrix-solid:var(--rad-series-7-solid)] [--_matrix-soft:var(--rad-series-7-soft)] [--_matrix-border:var(--rad-series-7-border)] [--_matrix-text:var(--rad-series-7-text)]',
  '8': '[--_matrix-solid:var(--rad-series-8-solid)] [--_matrix-soft:var(--rad-series-8-soft)] [--_matrix-border:var(--rad-series-8-border)] [--_matrix-text:var(--rad-series-8-text)]'
}
function seriesClass(family: string, series: SeriesIndex | undefined) {
  if (series === undefined) return undefined
  if (!Object.hasOwn(seriesClasses, series))
    throw new TypeError(`${family} series must be one of 1 to 8.`)
  return seriesClasses[series]
}
const STATES: readonly MatrixCellState[] = ['active', 'muted', 'highlighted']

const rootClass = cn(
  'relative isolate box-border grid w-full max-w-full min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain gap-[var(--rad-matrix-gap,0.25rem)] text-[color:var(--rad-color-foreground)] font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] [--_matrix-row-offset:0] [--_matrix-column-offset:0]',
  '[grid-template-columns:repeat(var(--_matrix-columns),minmax(var(--rad-matrix-cell-size,2.75rem),1fr))]',
  // A row header column, sized to its widest header, comes first when any row has one.
  'has-[>[role=row]>[role=rowheader]]:[--_matrix-column-offset:1] has-[>[role=row]>[role=rowheader]]:[grid-template-columns:max-content_repeat(var(--_matrix-columns),minmax(var(--rad-matrix-cell-size,2.75rem),1fr))]',
  'has-[>[role=row]>[role=columnheader]]:[--_matrix-row-offset:1]',
  // Region labels sit across a region's lower edge, so the last row leaves room below.
  'has-[>[data-slot~=matrix-region]]:pb-3',
  scrollbarClass
)

/** An interactive two-dimensional grid of cells with row and column headers. */
export function Matrix(allProps: MatrixProps) {
  const {
    ref,
    type = 'single',
    value,
    defaultValue,
    onValueChange: _onValueChange,
    columns,
    disabled = false,
    className,
    style,
    children,
    onFocus,
    onBlur,
    onKeyDown,
    ...props
  } = allProps
  requireAccessibleName('Matrix', props)
  if (!Number.isInteger(columns) || columns < 1)
    throw new TypeError('Matrix columns must be a positive integer.')
  const [initialType] = useState(type)
  if (type !== initialType)
    throw new TypeError('Matrix cannot change type during a mount. Remount with a new key.')
  const { value: current, request } = useControllableState<Selection>({
    name: 'Matrix',
    value,
    defaultValue,
    initialValue: type === 'multiple' ? [] : null,
    equal: sameSelection,
    onChange: next => {
      if (allProps.type === 'multiple' && Array.isArray(next)) allProps.onValueChange?.(next)
      else if (allProps.type !== 'multiple' && !Array.isArray(next)) allProps.onValueChange?.(next)
    }
  })
  if (
    type === 'multiple'
      ? !Array.isArray(current) || current.some(item => typeof item !== 'string')
      : current !== null && typeof current !== 'string'
  )
    throw new TypeError('Matrix values must match its single or multiple type.')
  const host = useRef<HTMLDivElement>(null),
    hostRef = useComposedRefs(host, ref)
  const [regions, setRegions] = useState<readonly Region[]>([])
  const [layout, setLayout] = useState<Layout>(emptyLayout)
  // The tab stop stays on the last focused cell, as in the ARIA grid pattern; before any focus
  // it starts on the first selected cell, or the first cell.
  const focus = useRef<{ id: string | null; at: readonly [number, number]; inside: boolean }>({
    id: null,
    at: [0, 0],
    inside: false
  })
  const syncRef = useRef<(node: HTMLDivElement) => void>(() => {})
  syncRef.current = (node: HTMLDivElement) => {
    const rows = cellRows(node, true)
    const cells = rows.flat()
    const remembered = cells.find(cell => cell.id === focus.current.id)
    let entry = remembered
    if (!remembered && focus.current.id !== null) {
      // The focused cell left: move to the nearest cell in its row, else in its column.
      const [row, column] = focus.current.at
      const line = rows[Math.min(row, rows.length - 1)]
      entry = line?.[Math.min(column, line.length - 1)]
      const active = node.ownerDocument.activeElement
      const lost = !active || active === node.ownerDocument.body || !node.contains(active)
      focus.current.id = entry?.id ?? null
      if (entry && focus.current.inside && lost) entry.focus()
    }
    entry ??= cells.find(cell => cell.getAttribute('aria-selected') === 'true') ?? cells[0]
    for (const cell of cellRows(node, false).flat()) {
      const index = cell === entry ? 0 : -1
      if (cell.tabIndex !== index) cell.tabIndex = index
    }
    const positions = new Map<string, readonly [number, number]>()
    rows.forEach((row, rowIndex) =>
      row.forEach((cell, columnIndex) => {
        if (cell.id) positions.set(cell.id, [rowIndex + 1, columnIndex + 1])
      })
    )
    setLayout(previous =>
      sameLayout(previous, positions, rows.length) ? previous : { positions, rows: rows.length }
    )
  }
  useLayoutEffect(() => {
    if (host.current) syncRef.current(host.current)
  })
  // Rows and cells a child adds or removes by its own state never re-render the Matrix.
  useLayoutEffect(() => {
    const node = host.current
    if (!node) return
    const view = node.ownerDocument.defaultView!
    const observer = new view.MutationObserver(() => syncRef.current(node))
    observer.observe(node, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['hidden', 'inert', 'aria-selected']
    })
    return () => observer.disconnect()
  }, [])
  const regionsFor = useCallback(
    (cellId: string) => {
      const position = layout.positions.get(cellId)
      if (!position) return undefined
      const [row, column] = position
      return joinIds(
        ...regions
          .filter(
            region =>
              row >= region.row &&
              row < region.row + region.rowSpan &&
              column >= region.column &&
              column < region.column + region.columnSpan
          )
          .map(region => `${region.id}-label`)
      )
    },
    [layout, regions]
  )
  const state = useMemo<MatrixState>(
    () => ({
      type,
      value: current,
      disabled,
      columns,
      rows: layout.rows,
      toggle(item) {
        if (!disabled)
          request(selection => nextSelection(selection, item, !isItemOpen(selection, item)))
      },
      regionsFor,
      setRegions
    }),
    // `request` reads its latest owner state, so a stale closure is safe.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [type, current, disabled, columns, layout.rows, regionsFor]
  )
  return (
    <Context.Provider value={state}>
      {/* oxlint-disable-next-line jsx-a11y/interactive-supports-focus -- Its cells hold the roving tab stop. */}
      <div
        {...props}
        ref={hostRef}
        role="grid"
        aria-multiselectable={type === 'multiple' || undefined}
        aria-disabled={disabled || undefined}
        data-slot={joinIds('matrix', props['data-slot'])}
        data-type={type}
        data-disabled={disabled ? '' : undefined}
        className={cn(rootClass, className)}
        style={{ ...style, '--_matrix-columns': columns } as ThemeStyle}
        onFocus={event => {
          onFocus?.(event)
          const node = event.currentTarget
          const cell = event.target.closest<HTMLElement>(CELL)
          if (!cell || cell.closest(MATRIX) !== node) return
          const rows = cellRows(node, true)
          const row = rows.findIndex(line => line.includes(cell))
          focus.current = {
            id: cell.id,
            at: [Math.max(0, row), Math.max(0, rows[row]?.indexOf(cell) ?? 0)],
            inside: true
          }
          for (const other of cellRows(node, false).flat()) other.tabIndex = other === cell ? 0 : -1
        }}
        onBlur={event => {
          onBlur?.(event)
          if (!event.currentTarget.contains(event.relatedTarget)) focus.current.inside = false
        }}
        onKeyDown={event => {
          onKeyDown?.(event)
          navigate(event)
        }}
      >
        {children}
      </div>
    </Context.Provider>
  )
}

type Layout = { positions: ReadonlyMap<string, readonly [number, number]>; rows: number }
const emptyLayout: Layout = { positions: new Map(), rows: 0 }
function sameLayout(
  previous: Layout,
  positions: ReadonlyMap<string, readonly [number, number]>,
  rows: number
) {
  return (
    previous.rows === rows &&
    previous.positions.size === positions.size &&
    [...positions].every(([id, [row, column]]) => {
      const old = previous.positions.get(id)
      return old?.[0] === row && old[1] === column
    })
  )
}

/**
 * Rows that hold cells, each as its cells in order; header-only rows are skipped, and so are
 * hidden or inert cells when `available` is set.
 */
function cellRows(node: HTMLElement, available: boolean) {
  return Array.from(node.querySelectorAll<HTMLElement>(ROW))
    .filter(row => row.closest(MATRIX) === node)
    .map(row =>
      Array.from(row.querySelectorAll<HTMLElement>(CELL)).filter(
        cell => cell.closest(ROW) === row && (!available || !cell.closest('[hidden], [inert]'))
      )
    )
    .filter(row => row.length > 0)
}

/** Arrow keys, Home and End move within the grid, following the ARIA grid pattern. */
function navigate(event: KeyboardEvent<HTMLDivElement>) {
  if (event.defaultPrevented || event.altKey || event.metaKey || event.nativeEvent.isComposing)
    return
  const node = event.currentTarget
  const cell = (event.target as Element).closest<HTMLElement>(CELL)
  if (!cell || cell !== event.target || cell.closest(MATRIX) !== node) return
  const rows = cellRows(node, true)
  const rowIndex = rows.findIndex(row => row.includes(cell))
  if (rowIndex < 0) return
  const row = rows[rowIndex]!
  const columnIndex = row.indexOf(cell)
  const rtl = node.ownerDocument.defaultView!.getComputedStyle(node).direction === 'rtl'
  const ctrl = event.ctrlKey
  let target: HTMLElement | undefined
  if (event.key === 'Home') target = ctrl ? rows[0]?.[0] : row[0]
  else if (event.key === 'End') target = ctrl ? rows.at(-1)?.at(-1) : row.at(-1)
  else if (ctrl) return
  else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    const next = rows[rowIndex + (event.key === 'ArrowUp' ? -1 : 1)]
    target = next?.[Math.min(columnIndex, next.length - 1)]
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    const forward = event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')
    target = row[columnIndex + (forward ? 1 : -1)]
  } else return
  // Edges keep focus where it is, as the grid pattern does without wrapping.
  event.preventDefault()
  target?.focus()
}

export function MatrixRow({ className, ...props }: MatrixRowProps) {
  return (
    <div
      {...props}
      role="row"
      data-slot={joinIds('matrix-row', props['data-slot'])}
      className={cn('col-span-full grid grid-cols-subgrid items-stretch', className)}
    />
  )
}

const headerClass =
  'box-border flex min-w-0 p-1 text-[length:var(--rad-matrix-header-size,0.75rem)] leading-tight font-medium text-[color:var(--rad-color-muted-foreground)] forced-colors:text-[CanvasText]'

export function MatrixColumnHeader({ className, ...props }: MatrixColumnHeaderProps) {
  return (
    <div
      {...props}
      role="columnheader"
      data-slot={joinIds('matrix-column-header', props['data-slot'])}
      className={cn(headerClass, 'items-end justify-center text-center break-words', className)}
    />
  )
}

export function MatrixRowHeader({ className, ...props }: MatrixRowHeaderProps) {
  return (
    <div
      {...props}
      role="rowheader"
      data-slot={joinIds('matrix-row-header', props['data-slot'])}
      className={cn(
        headerClass,
        'items-center justify-end pe-2 text-end whitespace-nowrap',
        className
      )}
    />
  )
}

export function MatrixCorner({ className, children, ...props }: MatrixCornerProps) {
  const empty = children === undefined || children === null || children === false || children === ''
  return (
    <div
      {...props}
      role={empty ? 'gridcell' : 'columnheader'}
      data-slot={joinIds('matrix-corner', props['data-slot'])}
      className={cn(headerClass, 'items-end justify-end pe-2 text-end', className)}
    >
      {children}
    </div>
  )
}

const cellClass = cn(
  'relative box-border flex min-h-[var(--rad-matrix-cell-size,2.75rem)] min-w-0 items-center justify-center gap-1 p-1 text-center text-[length:var(--rad-matrix-cell-text-size,0.875rem)] leading-tight tabular-nums break-words select-none outline-none',
  'rounded-[var(--rad-matrix-radius,var(--rad-control-radius,0.5rem))] [corner-shape:var(--rad-control-corner-shape,round)] border border-solid border-[color:var(--_matrix-border,var(--rad-color-border,oklch(0.885_0.005_286)))] bg-[var(--_matrix-soft,var(--rad-color-surface,white))] text-[color:var(--_matrix-text,var(--rad-color-foreground,oklch(0.21_0.006_286)))]',
  'data-selectable:cursor-pointer data-selectable:hover:border-[color:var(--_matrix-solid,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))]',
  'data-[state=active]:font-semibold data-[state=active]:border-[color:var(--_matrix-solid,var(--rad-color-accent,oklch(0.55_0.13_255)))] data-[state=active]:[box-shadow:inset_0_0_0_2px_var(--_matrix-solid,var(--rad-color-accent,oklch(0.55_0.13_255)))]',
  'data-[state=highlighted]:border-[color:var(--_matrix-solid,var(--rad-color-accent,oklch(0.55_0.13_255)))] data-[state=highlighted]:bg-[color-mix(in_oklab,var(--_matrix-solid,var(--rad-color-accent,oklch(0.55_0.13_255)))_22%,var(--rad-color-surface,white))] data-[state=highlighted]:text-[color:var(--rad-color-foreground,oklch(0.21_0.006_286))]',
  'data-[state=muted]:border-dashed data-[state=muted]:bg-transparent data-[state=muted]:text-[color:var(--rad-color-muted-foreground,oklch(0.45_0.01_286))]',
  // A selected cell repoints its private colors, so markers and the active ring swap colors with it.
  'aria-selected:[--_matrix-soft:var(--rad-color-accent,oklch(0.55_0.13_255))] aria-selected:[--_matrix-text:var(--rad-color-accent-foreground,white)] aria-selected:[--_matrix-border:var(--rad-color-accent,oklch(0.55_0.13_255))] aria-selected:[--_matrix-solid:var(--rad-color-accent-foreground,white)]',
  'aria-selected:border-[color:var(--rad-color-accent,oklch(0.55_0.13_255))] aria-selected:bg-[var(--rad-color-accent,oklch(0.55_0.13_255))] aria-selected:text-[color:var(--rad-color-accent-foreground,white)] aria-selected:data-[state=active]:[box-shadow:inset_0_0_0_2px_var(--rad-color-accent-foreground,white)] aria-selected:data-[state=highlighted]:bg-[var(--rad-color-accent,oklch(0.55_0.13_255))] aria-selected:data-[state=highlighted]:text-[color:var(--rad-color-accent-foreground,white)]',
  'aria-disabled:cursor-not-allowed aria-disabled:line-through aria-disabled:opacity-[var(--rad-state-disabled-opacity,0.5)]',
  'forced-colors:border-[CanvasText] forced-colors:data-[state=active]:[border-width:3px] forced-colors:data-[state=highlighted]:after:pointer-events-none forced-colors:data-[state=highlighted]:after:absolute forced-colors:data-[state=highlighted]:after:inset-[3px] forced-colors:data-[state=highlighted]:after:rounded-[inherit] forced-colors:data-[state=highlighted]:after:border-2 forced-colors:data-[state=highlighted]:after:border-dashed forced-colors:data-[state=highlighted]:after:border-[CanvasText] forced-colors:data-[state=muted]:text-[GrayText] forced-colors:aria-selected:[forced-color-adjust:none] forced-colors:aria-selected:bg-[Highlight] forced-colors:aria-selected:text-[HighlightText] forced-colors:aria-disabled:text-[GrayText] forced-colors:aria-disabled:opacity-100',
  focusRingClass,
  focusRingInsetClass
)

export function MatrixCell({
  value,
  state,
  series,
  disabled = false,
  altText,
  className,
  onClick,
  onKeyDown,
  ...props
}: MatrixCellProps) {
  const matrix = useMatrix('MatrixCell')
  if (value !== undefined && typeof value !== 'string')
    throw new TypeError('MatrixCell value must be a string.')
  if (state !== undefined && !STATES.includes(state))
    throw new TypeError(`MatrixCell state must be one of ${STATES.join(', ')}.`)
  const generated = useId()
  const id = props.id ?? generated
  const selectable = value !== undefined
  const selected = selectable && isItemOpen(matrix.value, value)
  const unavailable = disabled || (selectable && matrix.disabled)
  const choose = () => {
    if (selectable && !unavailable) matrix.toggle(value)
  }
  return (
    <div
      {...props}
      id={id}
      role="gridcell"
      tabIndex={selected ? 0 : -1}
      aria-label={altText}
      aria-selected={selectable ? selected : undefined}
      aria-disabled={unavailable || undefined}
      aria-describedby={joinIds(props['aria-describedby'], matrix.regionsFor(id))}
      data-slot={joinIds('matrix-cell', props['data-slot'])}
      data-value={value}
      data-state={state}
      data-series={series}
      data-selectable={selectable && !unavailable ? '' : undefined}
      data-selected={selected ? '' : undefined}
      data-disabled={unavailable ? '' : undefined}
      className={cn(cellClass, seriesClass('MatrixCell', series), className)}
      onClick={event => {
        onClick?.(event)
        if (!event.defaultPrevented) choose()
      }}
      onKeyDown={event => {
        onKeyDown?.(event)
        if (event.defaultPrevented || event.target !== event.currentTarget) return
        if (event.key !== ' ' && event.key !== 'Enter') return
        if (event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return
        event.preventDefault()
        choose()
      }}
    />
  )
}

export function MatrixMarker({
  variant = 'solid',
  series,
  className,
  ...props
}: MatrixMarkerProps) {
  if (variant !== 'solid' && variant !== 'outline')
    throw new TypeError('MatrixMarker variant must be solid or outline.')
  return (
    <span
      {...props}
      data-slot={joinIds('matrix-marker', props['data-slot'])}
      data-variant={variant}
      className={cn(
        'box-border inline-flex aspect-square min-w-[1.75em] shrink-0 items-center justify-center rounded-full px-[0.25em] text-[0.75rem] leading-none font-semibold',
        variant === 'solid'
          ? 'bg-[var(--_matrix-text,var(--rad-color-foreground,oklch(0.21_0.006_286)))] text-[color:var(--_matrix-soft,var(--rad-color-surface,white))] forced-colors:[forced-color-adjust:none] forced-colors:bg-[CanvasText] forced-colors:text-[Canvas]'
          : 'border-2 border-solid border-current bg-transparent text-[color:var(--_matrix-text,currentColor)] forced-colors:border-[CanvasText]',
        seriesClass('MatrixMarker', series),
        className
      )}
    />
  )
}

function positive(name: string, value: number) {
  if (!Number.isInteger(value) || value < 1)
    throw new TypeError(`MatrixRegion ${name} must be a positive integer.`)
  return value
}

export function MatrixRegion({
  row,
  column,
  rowSpan = 1,
  columnSpan = 1,
  label,
  series,
  parts,
  className,
  style,
  ...props
}: MatrixRegionProps) {
  const matrix = useMatrix('MatrixRegion')
  const id = useId()
  positive('row', row)
  positive('column', column)
  positive('rowSpan', rowSpan)
  positive('columnSpan', columnSpan)
  // Rows are counted after mount; until then only columns bound the region.
  const rows = matrix.rows || Infinity
  const outside = row > rows || column > matrix.columns
  const region: Region = {
    id,
    row,
    column,
    rowSpan: Math.min(rowSpan, rows - row + 1),
    columnSpan: Math.min(columnSpan, matrix.columns - column + 1)
  }
  const { setRegions } = matrix
  const usedRowSpan = region.rowSpan,
    usedColumnSpan = region.columnSpan
  useLayoutEffect(() => {
    if (outside) return
    setRegions(list => [
      ...list.filter(item => item.id !== id),
      { id, row, column, rowSpan: usedRowSpan, columnSpan: usedColumnSpan }
    ])
    return () => setRegions(list => list.filter(item => item.id !== id))
  }, [setRegions, outside, id, row, column, usedRowSpan, usedColumnSpan])
  return (
    <div
      {...props}
      hidden={outside || undefined}
      aria-hidden="true"
      data-slot={joinIds('matrix-region', props['data-slot'])}
      data-series={series}
      className={cn(
        'pointer-events-none absolute inset-0 z-10 box-border rounded-[var(--rad-matrix-radius,var(--rad-control-radius,0.5rem))] [corner-shape:var(--rad-control-corner-shape,round)] border-[length:var(--rad-matrix-region-border-width,2px)] border-solid border-[color:var(--_matrix-solid,var(--rad-color-foreground,oklch(0.21_0.006_286)))] forced-colors:border-[CanvasText]',
        seriesClass('MatrixRegion', series),
        className
      )}
      style={{
        ...style,
        gridRow: `calc(var(--_matrix-row-offset) + ${region.row}) / span ${region.rowSpan}`,
        gridColumn: `calc(var(--_matrix-column-offset) + ${region.column}) / span ${region.columnSpan}`
      }}
    >
      <span
        id={`${id}-label`}
        data-slot="matrix-region-label"
        className={cn(
          'absolute end-1 bottom-0 box-border max-w-[calc(100%-0.5rem)] translate-y-1/2 truncate rounded-[0.25rem] border border-solid border-[color:var(--_matrix-border,var(--rad-color-border,oklch(0.885_0.005_286)))] bg-[var(--_matrix-soft,var(--rad-color-surface,white))] px-1 text-[0.6875rem] leading-snug font-medium text-[color:var(--_matrix-text,var(--rad-color-foreground,oklch(0.21_0.006_286)))] forced-colors:border-[CanvasText]',
          parts?.label?.className
        )}
        style={parts?.label?.style}
      >
        {label}
      </span>
    </div>
  )
}
