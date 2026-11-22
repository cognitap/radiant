'use client'

import { useId, useLayoutEffect, useRef, useState, type ComponentProps } from 'react'
import { cn } from 'cn'
import { requireAccessibleName, type AccessibleName } from '../../internal/accessibleName.js'
import {
  arcLevels,
  defaultArcText,
  describeToken,
  layoutArcs,
  spanLanes,
  validateAnnotatedText,
  type AnnotatedTextArc,
  type AnnotatedTextArcText,
  type AnnotatedTextSeries,
  type AnnotatedTextSpan,
  type AnnotatedTextToken,
  type ArcGeometry
} from '../../internal/annotatedText.js'
import { joinIds } from '../../internal/ids.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useRovingFocus } from '../../react/useRovingFocus.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import { focusRingClass } from '../shared/focusStyles.js'

export type {
  AnnotatedTextArc,
  AnnotatedTextArcText,
  AnnotatedTextSeries,
  AnnotatedTextSpan,
  AnnotatedTextToken
} from '../../internal/annotatedText.js'

/**
 * Div host, a group named by `aria-label` or `aria-labelledby`, around a list of tokens. One
 * token is in the tab order; arrow keys, Home and End move between tokens. Each token is named
 * by its text and described by visually hidden text inside it that lists its labels, spans and
 * arcs, so browse mode reads them too. A span shows its label on its first token only.
 */
export type AnnotatedTextProps = Omit<
  ComponentProps<'div'>,
  'style' | 'children' | 'role' | 'aria-label' | 'aria-labelledby'
> &
  AccessibleName & {
    tokens: readonly AnnotatedTextToken[]
    /** Tagged runs of tokens. Spans may overlap and nest; each takes its own lane. */
    spans?: readonly AnnotatedTextSpan[]
    /**
     * Links between two tokens, drawn above the text and redrawn as the text wraps. An arc
     * whose ends are three or more lines apart draws only the piece at each end.
     */
    arcs?: readonly AnnotatedTextArc[]
    /**
     * Text each arc announces on its two tokens. Defaults to the token texts joined by a `→`
     * symbol, then the label, such as `delay → retry: assigned from`.
     */
    arcText?: AnnotatedTextArcText
    style?: ThemeStyle
    'data-slot'?: string
  }

// Each series sets private color slots that the span and arc classes read.
const seriesClass: Record<AnnotatedTextSeries, string> = {
  1: '[--_at-solid:var(--rad-series-1-solid)] [--_at-soft:var(--rad-series-1-soft)] [--_at-border:var(--rad-series-1-border)] [--_at-text:var(--rad-series-1-text)]',
  2: '[--_at-solid:var(--rad-series-2-solid)] [--_at-soft:var(--rad-series-2-soft)] [--_at-border:var(--rad-series-2-border)] [--_at-text:var(--rad-series-2-text)]',
  3: '[--_at-solid:var(--rad-series-3-solid)] [--_at-soft:var(--rad-series-3-soft)] [--_at-border:var(--rad-series-3-border)] [--_at-text:var(--rad-series-3-text)]',
  4: '[--_at-solid:var(--rad-series-4-solid)] [--_at-soft:var(--rad-series-4-soft)] [--_at-border:var(--rad-series-4-border)] [--_at-text:var(--rad-series-4-text)]',
  5: '[--_at-solid:var(--rad-series-5-solid)] [--_at-soft:var(--rad-series-5-soft)] [--_at-border:var(--rad-series-5-border)] [--_at-text:var(--rad-series-5-text)]',
  6: '[--_at-solid:var(--rad-series-6-solid)] [--_at-soft:var(--rad-series-6-soft)] [--_at-border:var(--rad-series-6-border)] [--_at-text:var(--rad-series-6-text)]',
  7: '[--_at-solid:var(--rad-series-7-solid)] [--_at-soft:var(--rad-series-7-soft)] [--_at-border:var(--rad-series-7-border)] [--_at-text:var(--rad-series-7-text)]',
  8: '[--_at-solid:var(--rad-series-8-solid)] [--_at-soft:var(--rad-series-8-soft)] [--_at-border:var(--rad-series-8-border)] [--_at-text:var(--rad-series-8-text)]'
}

const rootClass = [
  'relative box-border min-w-0 text-start antialiased',
  'font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] tracking-[var(--rad-typography-roles-ui-body-letter-spacing,-0.011em)] text-[length:var(--rad-typography-roles-ui-body-size,0.875rem)] font-[number:var(--rad-typography-roles-ui-body-weight,400)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)]',
  '[color:var(--rad-color-foreground,oklch(0.21_0.006_286))]',
  '[--_at-gap:var(--rad-annotated-text-gap,0.5rem)] [--_at-lane:1.375rem]',
  'forced-colors:text-[CanvasText]'
].join(' ')

const listClass =
  'm-0 flex list-none flex-wrap items-start gap-y-[var(--rad-annotated-text-row-gap,0.75rem)] p-0'

// Tokens reserve room above their text for the highest arc, so every wrapped line has it too.
const tokenClass = [
  'relative flex min-w-0 max-w-full flex-col items-stretch pe-[var(--_at-gap)] rounded-[var(--rad-annotated-text-token-radius,0.25rem)] pt-[calc(var(--_at-levels,0)*var(--rad-annotated-text-arc-step,1.25rem))]',
  focusRingClass
].join(' ')

const tokenTextClass =
  'max-w-full self-start [overflow-wrap:anywhere] font-[number:var(--rad-annotated-text-text-weight,500)]'

const labelClass = [
  'min-h-[1lh] [overflow-wrap:anywhere]',
  'text-[length:var(--rad-annotated-text-label-size,var(--rad-typography-roles-ui-supporting-size,0.8125rem))] leading-[var(--rad-typography-roles-ui-supporting-line-height,1.5)]',
  '[color:var(--rad-annotated-text-label-color,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))]',
  'forced-colors:text-[CanvasText]'
].join(' ')

const laneClass = 'mt-[0.125rem] box-border h-[var(--_at-lane)]'

const spanClass = [
  'block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap px-[0.375rem] leading-[calc(var(--_at-lane,1.375rem)-2px)]',
  'bg-[var(--_at-soft)] [color:var(--_at-text)] [border-block:1px_solid_var(--_at-border,currentColor)]',
  'text-[length:0.6875rem] font-[number:600]',
  'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]'
].join(' ')

const spanStartClass =
  'rounded-s-[var(--rad-annotated-text-span-radius,0.25rem)] [border-inline-start:1px_solid_var(--_at-border,currentColor)] forced-colors:[border-inline-start-color:CanvasText]'
const spanEndClass =
  'rounded-e-[var(--rad-annotated-text-span-radius,0.25rem)] [border-inline-end:1px_solid_var(--_at-border,currentColor)] forced-colors:[border-inline-end-color:CanvasText]'
// Each token holds the gap after it, so a span that continues reaches the next token.
const spanBridgeClass = 'me-[calc(var(--_at-gap,0.5rem)*-1)]'

const arcLayerClass = 'pointer-events-none absolute inset-0 h-full w-full overflow-visible'

const arcClass = [
  'fill-none [stroke-width:1.25] [stroke:var(--_at-solid,var(--rad-annotated-text-arc-color,var(--rad-color-muted-foreground,oklch(0.45_0.01_286))))]',
  'data-active:[stroke-width:2.25]',
  'forced-colors:[stroke:CanvasText]'
].join(' ')

const arrowClass =
  '[fill:var(--_at-solid,var(--rad-annotated-text-arc-color,var(--rad-color-muted-foreground,oklch(0.45_0.01_286))))] forced-colors:[fill:CanvasText]'

const arcLabelClass = [
  'text-[length:0.6875rem] font-[number:600] [paint-order:stroke] [stroke-width:4px] [stroke-linejoin:round]',
  '[stroke:var(--rad-annotated-text-background,var(--rad-color-surface,oklch(1_0_0)))] [fill:var(--rad-color-foreground,oklch(0.21_0.006_286))]',
  'forced-colors:[fill:CanvasText] forced-colors:[stroke:Canvas]'
].join(' ')

type Geometry = { width: number; height: number; arcs: ArcGeometry[] }

/** Text split into tokens, with tagged spans, stacked labels under tokens, and arcs between them. */
export function AnnotatedText({
  tokens,
  spans = [],
  arcs = [],
  arcText = defaultArcText,
  ref,
  className,
  style,
  onKeyDown,
  onFocus,
  onBlur,
  ...props
}: AnnotatedTextProps) {
  requireAccessibleName('AnnotatedText', props)
  validateAnnotatedText(tokens, spans, arcs)
  const id = useId()
  const host = useRef<HTMLDivElement>(null),
    hostRef = useComposedRefs(host, ref)
  const list = useRef<HTMLOListElement>(null)
  const layer = useRef<SVGSVGElement>(null)
  const [geometry, setGeometry] = useState<Geometry | null>(null)
  const [focused, setFocused] = useState<number | null>(null)
  const roving = useRovingFocus({
    host,
    selector: '[data-slot~="annotated-text-token"]',
    scope: '[data-slot~="annotated-text"]',
    orientation: 'horizontal',
    loop: false
  })

  const lanes = spanLanes(spans)
  const laneCount = lanes.length ? Math.max(...lanes) + 1 : 0
  const levels = arcs.length ? Math.max(...arcLevels(arcs)) : 0
  const labelRows = Math.max(0, ...tokens.map(token => token.labels?.length ?? 0))

  // Arcs follow measured token boxes: redrawn when the host, a token, fonts or direction change.
  const latest = useRef(arcs)
  useLayoutEffect(() => {
    latest.current = arcs
  })
  const arcKey = JSON.stringify(arcs) + tokens.length
  useLayoutEffect(() => {
    const root = host.current,
      ol = list.current,
      svg = layer.current
    if (!root || !ol || !svg) return
    const view = root.ownerDocument.defaultView!
    let frame = 0
    const measure = () => {
      frame = 0
      const current = latest.current
      const origin = svg.getBoundingClientRect()
      const content = ol.getBoundingClientRect()
      const items = Array.from(
        ol.querySelectorAll<HTMLElement>('[data-slot~="annotated-text-token"]')
      )
      const texts = items.map(item =>
        item.querySelector('[data-slot~="annotated-text-token-text"]')!
      )
      const boxes = texts.map(text => {
        const rect = text.getBoundingClientRect()
        return { left: rect.left - origin.left, top: rect.top - origin.top, width: rect.width }
      })
      const first = items[0]
      const gutter = first
        ? texts[0]!.getBoundingClientRect().top - first.getBoundingClientRect().top
        : 0
      const step = gutter / Math.max(1, Math.max(0, ...arcLevels(current)))
      const rtl = view.getComputedStyle(ol).direction === 'rtl'
      const next: Geometry = {
        width: origin.width,
        height: origin.height,
        arcs: current.length
          ? layoutArcs(current, boxes, {
              start: (rtl ? content.right : content.left) - origin.left,
              end: (rtl ? content.left : content.right) - origin.left,
              step
            })
          : []
      }
      setGeometry(previous =>
        previous && JSON.stringify(previous) === JSON.stringify(next) ? previous : next
      )
    }
    const schedule = () => {
      if (!frame) frame = view.requestAnimationFrame(measure)
    }
    measure()
    const resize = new view.ResizeObserver(schedule)
    resize.observe(root)
    resize.observe(ol)
    for (const item of ol.children) resize.observe(item)
    const mutation = new view.MutationObserver(schedule)
    for (let node: Element | null = root; node; node = node.parentElement)
      mutation.observe(node, { attributes: true, attributeFilter: ['dir', 'lang'] })
    const fonts = root.ownerDocument.fonts
    fonts?.addEventListener('loadingdone', schedule)
    return () => {
      if (frame) view.cancelAnimationFrame(frame)
      resize.disconnect()
      mutation.disconnect()
      fonts?.removeEventListener('loadingdone', schedule)
    }
  }, [arcKey, tokens.length])

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- The group delegates roving focus between its tokens.
    <div
      {...props}
      ref={hostRef}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- A fieldset would add form semantics; the group only names the text.
      role="group"
      data-slot={joinIds('annotated-text', props['data-slot'])}
      className={cn(rootClass, className)}
      style={{ '--_at-levels': levels, ...style } as ThemeStyle}
      onFocus={event => {
        onFocus?.(event)
        roving.onFocus(event)
        const token = (event.target as HTMLElement).closest<HTMLElement>(
          '[data-slot~="annotated-text-token"]'
        )
        const index = Number(token?.dataset.index)
        setFocused(Number.isInteger(index) ? index : null)
      }}
      onBlur={event => {
        onBlur?.(event)
        roving.onBlur(event)
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null)
      }}
      onKeyDown={event => {
        onKeyDown?.(event)
        roving.onKeyDown(event)
      }}
    >
      <ol
        ref={list}
        // oxlint-disable-next-line jsx-a11y/no-redundant-roles -- Safari drops list semantics when markers are hidden.
        role="list"
        data-slot="annotated-text-tokens"
        className={listClass}
      >
        {tokens.map((token, index) => {
          const description = describeToken(index, tokens, spans, arcs, arcText)
          const descriptionId = `${id}-d${index}`
          return (
            <li
              key={index}
              data-slot="annotated-text-token"
              data-index={index}
              // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Tokens take focus so keyboard users can read each one's labels and arcs.
              tabIndex={index === 0 ? 0 : -1}
              aria-label={token.text}
              aria-describedby={description ? descriptionId : undefined}
              className={tokenClass}
            >
              <span
                data-slot="annotated-text-token-text"
                className={tokenTextClass}
              >
                {token.text}
              </span>
              {Array.from({ length: labelRows }, (_, row) => {
                const label = token.labels?.[row]
                return (
                  <span
                    key={`l${row}`}
                    data-slot="annotated-text-label"
                    aria-hidden
                    className={labelClass}
                  >
                    {label}
                  </span>
                )
              })}
              {Array.from({ length: laneCount }, (_, lane) => {
                const spanIndex = spans.findIndex(
                  (span, at) => lanes[at] === lane && span.start <= index && index <= span.end
                )
                const span = spans[spanIndex]
                if (!span)
                  return (
                    <span
                      key={`s${lane}`}
                      aria-hidden
                      className={laneClass}
                    />
                  )
                const start = span.start === index,
                  end = span.end === index
                return (
                  <span
                    key={`s${lane}`}
                    aria-hidden
                    data-slot="annotated-text-span"
                    data-span={spanIndex}
                    data-series={span.series}
                    data-start={start ? '' : undefined}
                    data-end={end ? '' : undefined}
                    className={cn(
                      laneClass,
                      spanClass,
                      seriesClass[span.series],
                      start && spanStartClass,
                      end ? spanEndClass : spanBridgeClass
                    )}
                  >
                    {start ? span.label : null}
                  </span>
                )
              })}
              {description ? (
                // The description repeats the visible labels in reading order, so they are hidden.
                <span
                  id={descriptionId}
                  data-slot="annotated-text-description"
                  className="sr-only"
                >
                  {description}
                </span>
              ) : null}
            </li>
          )
        })}
      </ol>
      <svg
        ref={layer}
        aria-hidden
        focusable="false"
        data-slot="annotated-text-arcs"
        className={arcLayerClass}
      >
        {geometry?.arcs.map((shape, index) => {
          const arc = arcs[index]
          if (!arc) return null
          const active = focused !== null && (arc.from === focused || arc.to === focused)
          return (
            <g
              key={index}
              data-slot="annotated-text-arc"
              data-from={arc.from}
              data-to={arc.to}
              data-active={active ? '' : undefined}
              className={arc.series ? seriesClass[arc.series] : undefined}
            >
              {shape.paths.map((path, piece) => (
                <path
                  key={piece}
                  d={path}
                  data-active={active ? '' : undefined}
                  className={arcClass}
                />
              ))}
              <path
                d={shape.arrow}
                className={arrowClass}
              />
              {arc.label?.trim() && shape.label ? (
                <text
                  data-slot="annotated-text-arc-label"
                  x={shape.label.x}
                  y={shape.label.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={arcLabelClass}
                >
                  {arc.label.trim()}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
