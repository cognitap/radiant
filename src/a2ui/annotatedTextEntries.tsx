'use client'

import { useEffect } from 'react'
import {
  AnnotatedText,
  type AnnotatedTextArc,
  type AnnotatedTextSpan,
  type AnnotatedTextToken
} from '../components/AnnotatedText/AnnotatedText.js'
import { radiantCatalog } from '../catalog/index.js'
import { isSeriesNumber, type SeriesNumber } from '../internal/series.js'
import { isPlainRecord } from '../catalog/coerce.js'
import { generateA2uiCatalogs, type A2uiJsonSchema } from './catalogGenerator.js'
import { createA2uiRegistryEntry, type A2uiAdapterContext } from './registry.js'
import { hasText, type A2uiAccessibilityRule } from './accessibilityRules.js'
import { readA2uiValue } from './adapterValues.js'

const schema = generateA2uiCatalogs(radiantCatalog).extension.components.AnnotatedText as
  | (A2uiJsonSchema & { readonly description: string })
  | undefined
if (!schema || typeof schema.description !== 'string')
  throw new TypeError('A2UI extension catalog generator did not emit "AnnotatedText".')

type Props = Readonly<Record<string, unknown>>

const text = (value: unknown) => {
  const raw = readA2uiValue(value)
  return typeof raw === 'string' ? raw.trim() : ''
}
const list = (value: unknown): unknown[] => {
  const raw = readA2uiValue(value)
  return Array.isArray(raw) ? raw : []
}
const series = (value: unknown): SeriesNumber | undefined =>
  isSeriesNumber(value) ? value : undefined

/**
 * Keeps the tokens with text and renumbers spans and arcs to them. A span or arc that names a
 * dropped or missing token, or breaks the component contract, is dropped.
 */
export function readAnnotatedText(props: Props) {
  const remap = new Map<number, number>()
  const tokens: AnnotatedTextToken[] = []
  let droppedLabels = 0
  list(props.tokens).forEach((raw, index) => {
    if (!isPlainRecord(raw)) return
    const value = text(raw.text)
    if (!value) return
    remap.set(index, tokens.length)
    const rawLabels = list(raw.labels)
    const labels = rawLabels.map(text).filter(Boolean)
    droppedLabels += rawLabels.length - labels.length
    tokens.push(labels.length ? { text: value, labels } : { text: value })
  })
  const at = (value: unknown) => (Number.isInteger(value) ? remap.get(value as number) : undefined)
  const spans: AnnotatedTextSpan[] = []
  for (const raw of list(props.spans)) {
    if (!isPlainRecord(raw)) continue
    const start = at(raw.start),
      end = at(raw.end),
      label = text(raw.label),
      color = series(raw.series)
    if (start === undefined || end === undefined || start > end || !label || !color) continue
    spans.push({ start, end, label, series: color })
  }
  const arcs: AnnotatedTextArc[] = []
  for (const raw of list(props.arcs)) {
    if (!isPlainRecord(raw)) continue
    const from = at(raw.from),
      to = at(raw.to)
    if (from === undefined || to === undefined || from === to) continue
    const label = text(raw.label),
      color = series(raw.series)
    arcs.push({ from, to, ...(label ? { label } : {}), ...(color ? { series: color } : {}) })
  }
  const dropped = {
    tokens: list(props.tokens).length - tokens.length,
    'tokens.labels': droppedLabels,
    spans: list(props.spans).length - spans.length,
    arcs: list(props.arcs).length - arcs.length
  }
  return { tokens, spans, arcs, dropped }
}

const REASONS: Record<string, string> = {
  tokens: 'Tokens without text are dropped; spans and arcs are renumbered to the rest.',
  'tokens.labels': 'Labels that are not text, or are blank, are dropped.',
  spans:
    'Spans outside the tokens, ending before they start, unlabelled or outside series 1 to 8 are dropped.',
  arcs: 'Arcs outside the tokens or joining a token to itself are dropped.'
}

/** Requires an AnnotatedText to have a `label` that names it. */
const annotatedTextLabelRule: A2uiAccessibilityRule = {
  id: 'annotated-text-label',
  check(component) {
    if (hasText(component.label)) return
    return {
      prop: 'label',
      message: `AnnotatedText "${String(component.id)}" has no label to name its text.`
    }
  }
}

function A2uiAnnotatedText({ props, context }: { props: Props; context: A2uiAdapterContext }) {
  const { tokens, spans, arcs, dropped } = readAnnotatedText(props)
  const label = text(props.label)
  const nodeId = context.node.componentId
  const report = context.reportDiagnostic
  const kept: Record<string, number> = {
    tokens: tokens.length,
    'tokens.labels': tokens.reduce((sum, token) => sum + (token.labels?.length ?? 0), 0),
    spans: spans.length,
    arcs: arcs.length
  }
  // One coerced report per prop: how many items arrived and how many render.
  const coercedKey = JSON.stringify(
    Object.entries(dropped)
      .filter(([, count]) => count > 0)
      .map(([prop, count]) => [prop, count + kept[prop]!, kept[prop]!])
  )
  useEffect(() => {
    for (const [prop, received, used] of JSON.parse(coercedKey) as [string, number, number][])
      report?.({
        kind: 'coerced',
        nodeId,
        component: 'AnnotatedText',
        prop,
        received,
        used,
        reason: REASONS[prop]!
      })
  }, [coercedKey, nodeId, report])
  useEffect(() => {
    if (tokens.length) return
    report?.({
      kind: 'fallback',
      nodeId,
      component: 'AnnotatedText',
      prop: 'tokens',
      received: props.tokens,
      used: null,
      reason: 'AnnotatedText needs at least one token with text; it renders nothing.'
    })
  }, [tokens.length, nodeId, report, props.tokens])
  useEffect(() => {
    if (label || !tokens.length) return
    report?.({
      kind: 'defaulted',
      nodeId,
      component: 'AnnotatedText',
      prop: 'label',
      received: props.label,
      used: 'token text',
      reason: 'AnnotatedText needs a label; the token text names it instead.'
    })
  }, [label, nodeId, report, props.label, tokens.length])
  if (!tokens.length) return null
  return (
    <AnnotatedText
      data-slot="a2ui-annotated-text"
      aria-label={label || tokens.map(token => token.text).join(' ')}
      tokens={tokens}
      spans={spans}
      arcs={arcs}
    />
  )
}

const annotatedTextEntry = createA2uiRegistryEntry({
  name: 'AnnotatedText',
  accessibility: [annotatedTextLabelRule],
  component: [AnnotatedText],
  schema,
  description: schema.description,
  adapter(props, context) {
    return (
      <A2uiAnnotatedText
        props={props}
        context={context}
      />
    )
  }
})

export const annotatedTextEntries = [annotatedTextEntry]
