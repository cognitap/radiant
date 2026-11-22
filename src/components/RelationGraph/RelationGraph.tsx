'use client'

import { useId, useMemo, useRef, useState, type ComponentProps } from 'react'
import { cn } from 'cn'
import { requireAccessibleName, type AccessibleName } from '../../internal/accessibleName.js'
import { joinIds } from '../../internal/ids.js'
import {
  defaultConnectionText,
  describeNodes,
  layoutRelationGraph,
  relationGraphStep,
  RELATION_GRAPH_UNIT,
  validateRelationGraph,
  type RelationGraphKey,
  type RelationGraphConnectionText,
  type RelationGraphEdge,
  type RelationGraphLayout,
  type RelationGraphNode,
  type RelationGraphSeries
} from '../../internal/relationGraph.js'
import {
  isItemOpen,
  nextSelection,
  sameSelection,
  type Selection
} from '../../internal/selection.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useControllableState } from '../../react/useControllableState.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import { focusRingClass } from '../shared/focusStyles.js'
import { scrollbarClass } from '../shared/scrollbarStyles.js'

export type {
  RelationGraphConnection,
  RelationGraphConnectionText,
  RelationGraphEdge,
  RelationGraphEmphasis,
  RelationGraphLayout,
  RelationGraphNode,
  RelationGraphSeries
} from '../../internal/relationGraph.js'

type Base = Omit<
  ComponentProps<'div'>,
  | 'style'
  | 'children'
  | 'role'
  | 'aria-label'
  | 'aria-labelledby'
  | 'defaultValue'
  | 'tabIndex'
  | 'contentEditable'
  | 'dangerouslySetInnerHTML'
> &
  AccessibleName & {
    /** `tree` (each node under its first parent), `layered` (by edge direction) or `circular` (data order). */
    layout: RelationGraphLayout
    nodes: readonly RelationGraphNode[]
    /** Directed edges between node ids. Cycles and loops are drawn in every layout. */
    edges?: readonly RelationGraphEdge[]
    /**
     * Text each node announces for one of its connections, given the edge and the node at its
     * other end. Defaults to a `→` or `←` symbol, the other node's label, then `: ` and the edge
     * label, such as `→ Build: triggers`. A node joins its connections, each followed by its
     * edge's `description`, and then its own `description` with `. `. Keep the function's
     * identity stable.
     */
    connectionText?: RelationGraphConnectionText
    style?: ThemeStyle
    'data-slot'?: string
  }

/**
 * Div host around an SVG layer of edges and a list of nodes placed by `layout`, sized in em so
 * it scales with the font size. One node is in the tab order. Left and Right move to the previous
 * and next node in the row (in `circular`, around the ring); Up and Down move to the nearest node
 * in the row above or below, preferring one joined by an edge; Home and End move to the first and
 * last node in data order. Each node is named by its label and described by its connections.
 * Without `type` the host is a group of list items; with it, a listbox of options in data order
 * that Enter, Space and clicks select, so the position announced follows data order while arrow
 * keys move spatially. The graph keeps its laid-out size: it fits the container by scrolling
 * inside a viewport as wide as the container, which can also be dragged to pan. Separate trees
 * wrap onto new rows. In right-to-left text the layout and arrow keys mirror horizontally.
 */
export type RelationGraphProps = Base &
  (
    | { type?: undefined; value?: never; defaultValue?: never; onValueChange?: never }
    | (ValueOwner<string | null> & {
        type: 'single'
        onValueChange?: (value: string | null) => void
      })
    | (ValueOwner<string[]> & {
        type: 'multiple'
        onValueChange?: (value: string[]) => void
      })
  )

// Each series sets private color slots that node and edge classes read.
const seriesClass: Record<RelationGraphSeries, string> = {
  1: '[--_rg-solid:var(--rad-series-1-solid)] [--_rg-soft:var(--rad-series-1-soft)] [--_rg-border:var(--rad-series-1-border)] [--_rg-text:var(--rad-series-1-text)]',
  2: '[--_rg-solid:var(--rad-series-2-solid)] [--_rg-soft:var(--rad-series-2-soft)] [--_rg-border:var(--rad-series-2-border)] [--_rg-text:var(--rad-series-2-text)]',
  3: '[--_rg-solid:var(--rad-series-3-solid)] [--_rg-soft:var(--rad-series-3-soft)] [--_rg-border:var(--rad-series-3-border)] [--_rg-text:var(--rad-series-3-text)]',
  4: '[--_rg-solid:var(--rad-series-4-solid)] [--_rg-soft:var(--rad-series-4-soft)] [--_rg-border:var(--rad-series-4-border)] [--_rg-text:var(--rad-series-4-text)]',
  5: '[--_rg-solid:var(--rad-series-5-solid)] [--_rg-soft:var(--rad-series-5-soft)] [--_rg-border:var(--rad-series-5-border)] [--_rg-text:var(--rad-series-5-text)]',
  6: '[--_rg-solid:var(--rad-series-6-solid)] [--_rg-soft:var(--rad-series-6-soft)] [--_rg-border:var(--rad-series-6-border)] [--_rg-text:var(--rad-series-6-text)]',
  7: '[--_rg-solid:var(--rad-series-7-solid)] [--_rg-soft:var(--rad-series-7-soft)] [--_rg-border:var(--rad-series-7-border)] [--_rg-text:var(--rad-series-7-text)]',
  8: '[--_rg-solid:var(--rad-series-8-solid)] [--_rg-soft:var(--rad-series-8-soft)] [--_rg-border:var(--rad-series-8-border)] [--_rg-text:var(--rad-series-8-text)]'
}

const rootClass = [
  'relative box-border min-w-0 max-w-full text-start antialiased',
  'font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] tracking-[var(--rad-typography-roles-ui-body-letter-spacing,-0.011em)] text-[length:var(--rad-typography-roles-ui-body-size,0.875rem)] font-[number:var(--rad-typography-roles-ui-body-weight,400)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)]',
  '[color:var(--rad-color-foreground,oklch(0.21_0.006_286))]',
  'forced-colors:text-[CanvasText]'
].join(' ')

const viewportClass =
  'box-border max-h-[var(--rad-relation-graph-max-height,32rem)] max-w-full overflow-auto overscroll-contain data-panning:cursor-grabbing data-panning:select-none'

const canvasClass = 'relative mx-auto'

// The edge layer is drawn left to right and flipped in right-to-left text, like the nodes.
const edgeLayerClass = 'pointer-events-none absolute inset-0 overflow-visible rtl:-scale-x-100'

const edgeClass = [
  '[--_rg-edge:var(--_rg-solid,var(--rad-relation-graph-edge-color,var(--rad-color-muted-foreground,oklch(0.45_0.01_286))))]',
  'data-[emphasis=muted]:opacity-[var(--rad-relation-graph-muted-opacity,0.5)]'
].join(' ')

const edgeLineClass = [
  'fill-none [stroke:var(--_rg-edge)] [stroke-width:1.5] in-data-[emphasis=muted]:[stroke-dasharray:4_3]',
  'in-data-active:[stroke-width:2.5] in-data-[emphasis=highlighted]:[stroke-width:2.5]',
  'forced-colors:[stroke:CanvasText]'
].join(' ')

const arrowClass = '[fill:var(--_rg-edge)] forced-colors:[fill:CanvasText]'

const edgeLabelClass = [
  'pointer-events-none absolute start-0 top-0 -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2 whitespace-nowrap rounded-[0.25rem] px-[0.25rem]',
  'text-[length:var(--rad-relation-graph-label-size,var(--rad-typography-roles-ui-supporting-size,0.75rem))] leading-[1.4] font-[number:500]',
  'bg-[var(--rad-relation-graph-background,var(--rad-color-surface,oklch(1_0_0)))] [color:var(--rad-color-muted-foreground,oklch(0.45_0.01_286))]',
  'forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]'
].join(' ')

const listClass = 'm-0 list-none p-0'

const nodeClass = [
  'absolute box-border flex items-center justify-center px-[0.5em] text-center outline-none',
  'rounded-[var(--rad-relation-graph-node-radius,0.5rem)] [corner-shape:var(--rad-control-corner-shape,round)]',
  'bg-[var(--_rg-soft,var(--rad-relation-graph-node-background,var(--rad-color-surface,oklch(1_0_0))))] [color:var(--_rg-text,var(--rad-color-foreground,oklch(0.21_0.006_286)))]',
  '[border:1px_solid_var(--_rg-border,var(--rad-relation-graph-node-border-color,var(--rad-color-border,oklch(0.885_0.005_286))))]',
  'data-[emphasis=highlighted]:[border-width:2px] data-[emphasis=highlighted]:[border-color:var(--_rg-solid,var(--rad-color-foreground,oklch(0.21_0.006_286)))] data-[emphasis=highlighted]:font-[number:600]',
  'data-[emphasis=muted]:[border-style:dashed] data-[emphasis=muted]:bg-[var(--rad-relation-graph-node-background,var(--rad-color-surface,oklch(1_0_0)))] data-[emphasis=muted]:[color:var(--rad-color-muted-foreground,oklch(0.45_0.01_286))]',
  'data-selected:[box-shadow:0_0_0_2px_var(--rad-relation-graph-selected-color,var(--rad-color-accent,oklch(0.55_0.13_255)))] data-selected:font-[number:600]',
  'data-selectable:cursor-pointer',
  'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:data-[emphasis=muted]:text-[GrayText] forced-colors:data-[emphasis=muted]:border-[GrayText] forced-colors:data-selected:bg-[Highlight] forced-colors:data-selected:text-[HighlightText]',
  focusRingClass
].join(' ')

const nodeLabelClass =
  'line-clamp-2 min-w-0 [overflow-wrap:break-word] font-[number:var(--rad-relation-graph-label-weight,500)] leading-[1.25]'

const KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'])

// Layout units to em, so the graph scales with its font size.
const em = (value: number) => `${Math.round((value / RELATION_GRAPH_UNIT) * 10000) / 10000}em`

/** Nodes and directed, labelled edges, laid out from the data as a tree, layers or a circle. */
export function RelationGraph(allProps: RelationGraphProps) {
  const {
    ref,
    layout,
    nodes,
    edges = [],
    connectionText = defaultConnectionText,
    type,
    value,
    defaultValue,
    onValueChange: _onValueChange,
    className,
    style,
    onKeyDown,
    onFocus,
    onBlur,
    ...props
  } = allProps
  requireAccessibleName('RelationGraph', props)
  validateRelationGraph(layout, nodes, edges)
  const [initialType] = useState(type)
  if (type !== initialType)
    throw new TypeError('RelationGraph cannot change type during a mount. Remount with a new key.')
  const selectable = type !== undefined
  const { value: selection, request } = useControllableState<Selection>({
    name: 'RelationGraph',
    value: value as Selection | undefined,
    defaultValue: defaultValue as Selection | undefined,
    initialValue: type === 'multiple' ? [] : null,
    equal: sameSelection,
    onChange: next => {
      if (allProps.type === 'multiple' && Array.isArray(next)) allProps.onValueChange?.(next)
      else if (allProps.type === 'single' && !Array.isArray(next)) allProps.onValueChange?.(next)
    }
  })
  if (
    selectable &&
    (type === 'multiple'
      ? !Array.isArray(selection) || selection.some(item => typeof item !== 'string')
      : selection !== null && typeof selection !== 'string')
  )
    throw new TypeError('RelationGraph values must match its single or multiple type.')

  const id = useId()
  const host = useRef<HTMLDivElement>(null),
    hostRef = useComposedRefs(host, ref)
  const viewport = useRef<HTMLDivElement>(null)
  const dataKey = JSON.stringify([layout, nodes, edges])
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- The key holds every input.
  const geometry = useMemo(() => layoutRelationGraph(layout, nodes, edges), [dataKey])
  const linked = useMemo(() => {
    const index = new Map(nodes.map((node, at) => [node.id, at]))
    const near: number[][] = nodes.map(() => [])
    for (const edge of edges) {
      const a = index.get(edge.from)!,
        b = index.get(edge.to)!
      if (a === b) continue
      if (!near[a]!.includes(b)) near[a]!.push(b)
      if (!near[b]!.includes(a)) near[b]!.push(a)
    }
    return near
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- The key holds every input.
  }, [dataKey])
  const descriptions = useMemo(
    () => describeNodes(nodes, edges, connectionText),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- The key holds every input.
    [dataKey, connectionText]
  )

  const selectedIndex = nodes.findIndex(node =>
    selection === null ? false : isItemOpen(selection, node.id)
  )
  const [stop, setStop] = useState<number | null>(null)
  const tabStop = stop !== null && stop < nodes.length ? stop : Math.max(0, selectedIndex)
  const [focused, setFocused] = useState<number | null>(null)
  const focusedId = focused !== null ? nodes[focused]?.id : undefined

  const nodeAt = (target: EventTarget | null) => {
    const element = (target as HTMLElement | null)?.closest?.<HTMLElement>(
      '[data-slot~="relation-graph-node"]'
    )
    if (!element || !host.current?.contains(element)) return null
    const index = Number(element.dataset.index)
    return Number.isInteger(index) ? index : null
  }
  const focusNode = (index: number) => {
    setStop(index)
    host.current
      ?.querySelector<HTMLElement>(`[data-slot~="relation-graph-node"][data-index="${index}"]`)
      ?.focus()
  }
  const toggle = (index: number) => {
    if (!selectable) return
    const node = nodes[index]!.id
    request(current =>
      nextSelection(
        current,
        node,
        type === 'single' ? current !== node : !isItemOpen(current, node)
      )
    )
  }

  // Dragging the empty canvas pans it; touch and wheel scrolling pan natively.
  const pan = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const [panning, setPanning] = useState(false)

  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- The host delegates focus and keys to its nodes.
    <div
      {...props}
      ref={hostRef}
      role={selectable ? 'listbox' : 'group'}
      aria-multiselectable={type === 'multiple' ? true : undefined}
      data-slot={joinIds('relation-graph', props['data-slot'])}
      data-layout={layout}
      className={cn(rootClass, className)}
      style={style}
      onFocus={event => {
        onFocus?.(event)
        const index = nodeAt(event.target)
        if (index !== null) setStop(index)
        setFocused(index)
      }}
      onBlur={event => {
        onBlur?.(event)
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null)
      }}
      onKeyDown={event => {
        onKeyDown?.(event)
        if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
        const current = nodeAt(event.target)
        if (current === null) return
        if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault()
          focusNode(event.key === 'Home' ? 0 : nodes.length - 1)
          return
        }
        if (selectable && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          toggle(current)
          return
        }
        if (!KEYS.has(event.key)) return
        event.preventDefault()
        // The layout is drawn mirrored in right-to-left text, so Left and Right swap.
        const rtl =
          host.current?.ownerDocument.defaultView?.getComputedStyle(host.current).direction ===
          'rtl'
        const next = relationGraphStep(
          geometry,
          current,
          event.key as RelationGraphKey,
          rtl,
          linked[current]!
        )
        if (next >= 0) focusNode(next)
      }}
    >
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- Dragging pans the canvas; keyboard users scroll it by moving focus. */}
      <div
        ref={viewport}
        data-slot="relation-graph-viewport"
        data-panning={panning ? '' : undefined}
        className={cn(viewportClass, scrollbarClass)}
        onMouseDown={event => {
          // Keeps a drag on the empty canvas from selecting text; the scrollbar is the viewport itself.
          if (event.target !== event.currentTarget && nodeAt(event.target) === null)
            event.preventDefault()
        }}
        onPointerDown={event => {
          if (event.button !== 0 || event.pointerType !== 'mouse') return
          if (event.target === event.currentTarget || nodeAt(event.target) !== null) return
          const view = viewport.current!
          if (view.scrollWidth <= view.clientWidth && view.scrollHeight <= view.clientHeight) return
          pan.current = {
            x: event.clientX,
            y: event.clientY,
            left: view.scrollLeft,
            top: view.scrollTop
          }
          view.setPointerCapture?.(event.pointerId)
          setPanning(true)
        }}
        onPointerMove={event => {
          const start = pan.current
          if (!start) return
          const view = viewport.current!
          // Scroll offsets are negative toward the inline end in right-to-left text, as is the drag.
          view.scrollLeft = start.left - (event.clientX - start.x)
          view.scrollTop = start.top - (event.clientY - start.y)
        }}
        onPointerUp={() => {
          pan.current = null
          setPanning(false)
        }}
        onPointerCancel={() => {
          pan.current = null
          setPanning(false)
        }}
      >
        <div
          data-slot="relation-graph-canvas"
          className={canvasClass}
          style={{ width: em(geometry.width), height: em(geometry.height) }}
        >
          <svg
            aria-hidden
            focusable="false"
            data-slot="relation-graph-edges"
            width={em(geometry.width)}
            height={em(geometry.height)}
            viewBox={`0 0 ${geometry.width} ${geometry.height}`}
            className={edgeLayerClass}
          >
            {edges.map((edge, index) => {
              const shape = geometry.edges[index]!
              const active =
                focusedId !== undefined && (edge.from === focusedId || edge.to === focusedId)
              return (
                <g
                  key={index}
                  data-slot="relation-graph-edge"
                  data-from={edge.from}
                  data-to={edge.to}
                  data-series={edge.series}
                  data-emphasis={edge.emphasis}
                  data-active={active ? '' : undefined}
                  className={cn(edgeClass, edge.series && seriesClass[edge.series])}
                >
                  <path
                    d={shape.path}
                    className={edgeLineClass}
                  />
                  <path
                    d={shape.arrow}
                    className={arrowClass}
                  />
                </g>
              )
            })}
          </svg>
          <div aria-hidden>
            {edges.map((edge, index) => {
              const label = edge.label?.trim()
              if (!label) return null
              const at = geometry.edges[index]!.label
              return (
                // A zero-size anchor in the canvas font keeps the em position; the label centers on it.
                <span
                  key={index}
                  className="absolute size-0"
                  style={{ insetInlineStart: em(at.x), top: em(at.y) }}
                >
                  <span
                    data-slot="relation-graph-edge-label"
                    data-emphasis={edge.emphasis}
                    className={edgeLabelClass}
                  >
                    {label}
                  </span>
                </span>
              )
            })}
          </div>
          <ul
            role={selectable ? 'none' : 'list'}
            data-slot="relation-graph-nodes"
            className={listClass}
          >
            {nodes.map((node, index) => {
              const box = geometry.nodes[index]!
              const description = descriptions[index]
              const descriptionId = `${id}-d${index}`
              const selected = selectable && selection !== null && isItemOpen(selection, node.id)
              return (
                // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events -- Nodes take focus to announce their connections; the host handles keys.
                <li
                  key={node.id}
                  role={selectable ? 'option' : undefined}
                  aria-selected={selectable ? selected : undefined}
                  data-slot="relation-graph-node"
                  data-id={node.id}
                  data-index={index}
                  data-series={node.series}
                  data-emphasis={node.emphasis}
                  data-selected={selected ? '' : undefined}
                  data-selectable={selectable ? '' : undefined}
                  // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Nodes take focus so keyboard users can read each one's connections.
                  tabIndex={index === tabStop ? 0 : -1}
                  aria-label={node.label}
                  aria-describedby={description ? descriptionId : undefined}
                  className={cn(nodeClass, node.series && seriesClass[node.series])}
                  style={{
                    insetInlineStart: em(box.x),
                    top: em(box.y),
                    width: em(box.width),
                    height: em(box.height)
                  }}
                  onClick={selectable ? () => toggle(index) : undefined}
                >
                  <span
                    data-slot="relation-graph-node-label"
                    className={nodeLabelClass}
                  >
                    {node.label}
                  </span>
                  {description ? (
                    <span
                      id={descriptionId}
                      data-slot="relation-graph-description"
                      className="sr-only"
                    >
                      {description}
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
