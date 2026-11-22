'use client'

import { useEffect, useState } from 'react'
import {
  RegionStage,
  RegionStageControls,
  RegionStagePin,
  RegionStageRegion,
  RegionStageViewport
} from '../components/RegionStage/RegionStage.js'
import { parseViewBox } from '../internal/regionStage.js'
import { radiantCatalog } from '../catalog/index.js'
import { isSeriesNumber, type SeriesNumber } from '../internal/series.js'
import { isPlainRecord } from '../catalog/coerce.js'
import { generateA2uiCatalogs, type A2uiJsonSchema } from './catalogGenerator.js'
import { createA2uiRegistryEntry, type A2uiAdapterContext } from './registry.js'
import { hasText, type A2uiAccessibilityRule } from './accessibilityRules.js'
import { readA2uiValue, writeA2uiBinding } from './adapterValues.js'
import { useA2uiLabels } from './surfaceContext.js'

const schema = generateA2uiCatalogs(radiantCatalog).extension.components.RegionStage as
  | (A2uiJsonSchema & { readonly description: string })
  | undefined
if (!schema || typeof schema.description !== 'string')
  throw new TypeError('A2UI extension catalog generator did not emit "RegionStage".')

type Props = Readonly<Record<string, unknown>>
type Region = { value: string; label: string; path: string; series?: SeriesNumber }
type Pin = { x: number; y: number; label: string; text?: string }

const text = (value: unknown) => {
  const raw = readA2uiValue(value)
  return typeof raw === 'string' ? raw.trim() : ''
}
const list = (value: unknown): unknown[] => {
  const raw = readA2uiValue(value)
  return Array.isArray(raw) ? raw : []
}
const viewBoxOf = (value: unknown) => {
  try {
    parseViewBox(text(value))
    return text(value)
  } catch {
    return null
  }
}

/** Keeps regions with a unique value, a label and a path, and pins with a label and a position. */
export function readRegionStage(props: Props) {
  const regions: Region[] = []
  const seen = new Set<string>()
  for (const raw of list(props.regions)) {
    if (!isPlainRecord(raw)) continue
    const value = text(raw.value),
      label = text(raw.label),
      path = text(raw.path)
    if (!value || !label || !path || seen.has(value)) continue
    seen.add(value)
    const series = isSeriesNumber(raw.series) ? raw.series : undefined
    regions.push({ value, label, path, ...(series ? { series } : {}) })
  }
  const pins: Pin[] = []
  for (const raw of list(props.pins)) {
    if (!isPlainRecord(raw)) continue
    const label = text(raw.label),
      callout = text(raw.text)
    if (!label || !Number.isFinite(raw.x) || !Number.isFinite(raw.y)) continue
    pins.push({
      x: raw.x as number,
      y: raw.y as number,
      label,
      ...(callout ? { text: callout } : {})
    })
  }
  const dropped = {
    regions: list(props.regions).length - regions.length,
    pins: list(props.pins).length - pins.length
  }
  return { regions, pins, dropped }
}

const REASONS: Record<string, string> = {
  regions: 'Regions without a value, label or path, or repeating a value, are dropped.',
  pins: 'Pins without a label or a finite x and y are dropped.'
}

/** Requires a RegionStage to have a `label` that names the drawing. */
const regionStageLabelRule: A2uiAccessibilityRule = {
  id: 'region-stage-label',
  check(component) {
    if (hasText(component.label)) return
    return {
      prop: 'label',
      message: `RegionStage "${String(component.id)}" has no label to name its drawing.`
    }
  }
}

function A2uiRegionStage({ props, context }: { props: Props; context: A2uiAdapterContext }) {
  const { regions, pins, dropped } = readRegionStage(props)
  const labels = useA2uiLabels()
  const zoomIn = labels.zoomIn?.trim(),
    zoomOut = labels.zoomOut?.trim(),
    zoomReset = labels.zoomReset?.trim()
  const labelled = Boolean(zoomIn && zoomOut && zoomReset)
  const label = text(props.label)
  const viewBox = viewBoxOf(props.viewBox)
  const multiple = readA2uiValue(props.selection) === 'multiple'
  const bound = list(props.value).filter(
    (item): item is string => typeof item === 'string' && regions.some(r => r.value === item)
  )
  // A literal or missing value seeds local state; a writable binding owns it.
  const [local, setLocal] = useState<string[] | null>(null)
  const selected = local ?? bound
  const select = (next: string[]) => {
    if (!writeA2uiBinding(props.value, next)) setLocal(next)
  }
  const nodeId = context.node.componentId
  const report = context.reportDiagnostic
  const coercedKey = JSON.stringify(
    Object.entries(dropped)
      .filter(([, count]) => count > 0)
      .map(([prop, count]) => [prop, count + (prop === 'regions' ? regions : pins).length])
  )
  useEffect(() => {
    for (const [prop, received] of JSON.parse(coercedKey) as [string, number][])
      report?.({
        kind: 'coerced',
        nodeId,
        component: 'RegionStage',
        prop,
        received,
        used: received - dropped[prop as keyof typeof dropped],
        reason: REASONS[prop]!
      })
    // `dropped` is read through `coercedKey`.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [coercedKey, nodeId, report])
  const renders = Boolean(viewBox && regions.length)
  useEffect(() => {
    if (renders) return
    report?.({
      kind: 'fallback',
      nodeId,
      component: 'RegionStage',
      prop: viewBox ? 'regions' : 'viewBox',
      received: viewBox ? props.regions : props.viewBox,
      used: null,
      reason: viewBox
        ? 'RegionStage needs at least one region with a value, label and path; it renders nothing.'
        : 'RegionStage needs a viewBox of four numbers with a positive size; it renders nothing.'
    })
  }, [renders, viewBox, nodeId, report, props.regions, props.viewBox])
  useEffect(() => {
    if (labelled || !renders) return
    report?.({
      kind: 'defaulted',
      nodeId,
      component: 'RegionStage',
      prop: 'controls',
      received: null,
      used: 'no zoom buttons',
      reason:
        'A2uiSurface labels lack zoomIn, zoomOut or zoomReset; the drawing still pans and zooms by pointer, wheel and keys.'
    })
  }, [labelled, renders, nodeId, report])
  useEffect(() => {
    if (label || !renders) return
    report?.({
      kind: 'defaulted',
      nodeId,
      component: 'RegionStage',
      prop: 'label',
      received: props.label,
      used: 'region names',
      reason: 'RegionStage needs a label; its region names name it instead.'
    })
  }, [label, renders, nodeId, report, props.label])
  if (!viewBox || !regions.length) return null
  const name =
    label ||
    regions
      .slice(0, 3)
      .map(region => region.label)
      .join(', ')
  const body = (
    <>
      {labelled ? (
        <RegionStageControls
          zoomInLabel={zoomIn!}
          zoomOutLabel={zoomOut!}
          zoomResetLabel={zoomReset!}
        />
      ) : null}
      <RegionStageViewport viewBox={viewBox}>
        {regions.map(region => (
          <RegionStageRegion
            key={region.value}
            value={region.value}
            aria-label={region.label}
            series={region.series}
            d={region.path}
          />
        ))}
        {pins.map((pin, index) => (
          <RegionStagePin
            key={index}
            x={pin.x}
            y={pin.y}
            aria-label={pin.label}
          >
            {pin.text ? <p className="m-0">{pin.text}</p> : null}
          </RegionStagePin>
        ))}
      </RegionStageViewport>
    </>
  )
  return multiple ? (
    <RegionStage
      key="multiple"
      data-slot="a2ui-region-stage"
      aria-label={name}
      type="multiple"
      value={selected}
      onValueChange={select}
    >
      {body}
    </RegionStage>
  ) : (
    <RegionStage
      key="single"
      data-slot="a2ui-region-stage"
      aria-label={name}
      value={selected[0] ?? null}
      onValueChange={next => select(next ? [next] : [])}
    >
      {body}
    </RegionStage>
  )
}

const regionStageEntry = createA2uiRegistryEntry({
  name: 'RegionStage',
  accessibility: [regionStageLabelRule],
  component: [
    RegionStage,
    RegionStageControls,
    RegionStageViewport,
    RegionStageRegion,
    RegionStagePin
  ],
  schema,
  description: schema.description,
  adapter(props, context) {
    return (
      <A2uiRegionStage
        props={props}
        context={context}
      />
    )
  }
})

export const regionStageEntries = [regionStageEntry]
