'use client'

import { useContext, useEffect, useId, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  isComponentNode,
  isWritable,
  ResolvedBinding,
  type ComponentNode
} from '@a2ui/web_core/resolution'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '../components/Accordion/Accordion.js'
import { Alert, AlertDescription, AlertTitle } from '../components/Alert/Alert.js'
import { Badge } from '../components/Badge/Badge.js'
import { Progress } from '../components/Progress/Progress.js'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow
} from '../components/Table/Table.js'
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastTitle
} from '../components/Toast/Toast.js'
import type { Spacing, Tone } from '../presentation.js'
import { radiantCatalog } from '../catalog/index.js'
import { isPlainRecord, type CatalogDiagnostic } from '../catalog/coerce.js'
import { generateA2uiCatalogs, type A2uiJsonSchema } from './catalogGenerator.js'
import { createA2uiRegistryEntry, type A2uiAdapterContext } from './registry.js'
import { mediaNameRule, type A2uiAccessibilityRule } from './accessibilityRules.js'
import { readA2uiValue, writeA2uiBinding } from './adapterValues.js'
import { A2uiToastHostContext, useA2uiLabels } from './surfaceContext.js'
import { useSignalValue } from './useSignalValue.js'

const components = generateA2uiCatalogs(radiantCatalog).extension.components

function schemaOf(name: string): A2uiJsonSchema & { readonly description: string } {
  const schema = components[name]
  if (!schema || typeof schema.description !== 'string') {
    throw new TypeError(`A2UI extension catalog generator did not emit "${name}".`)
  }
  return schema as A2uiJsonSchema & { readonly description: string }
}

type Props = Readonly<Record<string, unknown>>

const text = (value: unknown): string => {
  const raw = readA2uiValue(value)
  if (typeof raw === 'string') return raw.trim()
  return typeof raw === 'number' && Number.isFinite(raw) ? String(raw) : ''
}

/** Reads a curated enum prop; coercion already replaced invalid literals with diagnostics. */
function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}

const TONES: readonly Tone[] = ['accent', 'neutral', 'warning', 'danger']
const ANNOUNCE = ['off', 'polite', 'assertive'] as const
const DENSITIES: readonly Spacing[] = ['tight', 'normal', 'airy']

const childNodes = (value: unknown): ComponentNode[] =>
  Array.isArray(value) ? value.filter(child => isComponentNode(child)) : []

/** Reports a diagnostic from an effect, once per distinct `key`. */
function useDiagnostic(
  context: A2uiAdapterContext,
  key: string | null,
  diagnostic: () => CatalogDiagnostic
) {
  useEffect(() => {
    if (key !== null) context.reportDiagnostic?.(diagnostic())
    // Report once per distinct problem, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}

const textRule = (id: string, prop: string): A2uiAccessibilityRule => ({
  ...mediaNameRule({ names: [prop] }),
  id
})

const alertEntry = createA2uiRegistryEntry({
  name: 'Alert',
  accessibility: [textRule('alert-title', 'title')],
  component: [Alert, AlertTitle, AlertDescription],
  schema: schemaOf('Alert'),
  description: schemaOf('Alert').description,
  adapter(props, context) {
    const description = text(props.description)
    const actions = childNodes(props.actions)
    return (
      <Alert
        tone={pick(props.tone, TONES, 'neutral')}
        announce={pick(props.announce, ANNOUNCE, 'off')}
      >
        <AlertTitle>{text(props.title)}</AlertTitle>
        {description ? <AlertDescription>{description}</AlertDescription> : null}
        {actions.length > 0 ? (
          <div
            data-slot="a2ui-alert-actions"
            className="flex flex-wrap gap-2"
          >
            {actions.map(child => context.renderNode(child))}
          </div>
        ) : null}
      </Alert>
    )
  }
})

const badgeEntry = createA2uiRegistryEntry({
  name: 'Badge',
  accessibility: [textRule('badge-text', 'text')],
  component: Badge,
  schema: schemaOf('Badge'),
  description: schemaOf('Badge').description,
  adapter(props) {
    return (
      <Badge
        tone={pick(props.tone, TONES, 'neutral')}
        decorative={readA2uiValue(props.decorative) === true}
      >
        {text(props.text)}
      </Badge>
    )
  }
})

const progressEntry = createA2uiRegistryEntry({
  name: 'Progress',
  accessibility: [textRule('progress-label', 'label')],
  component: Progress,
  schema: schemaOf('Progress'),
  description: schemaOf('Progress').description,
  adapter(props, context) {
    const rawMax = readA2uiValue(props.max)
    const max = typeof rawMax === 'number' && Number.isFinite(rawMax) && rawMax > 0 ? rawMax : 100
    const raw = readA2uiValue(props.value)
    const finite = typeof raw === 'number' && Number.isFinite(raw)
    const value = finite ? Math.min(max, Math.max(0, raw)) : null
    const label = text(props.label)
    return (
      <A2uiProgress
        label={label}
        value={value}
        max={max}
        clamped={finite && value !== raw ? raw : undefined}
        context={context}
      />
    )
  }
})

function A2uiProgress({
  label,
  value,
  max,
  clamped,
  context
}: {
  label: string
  value: number | null
  max: number
  clamped: number | undefined
  context: A2uiAdapterContext
}) {
  const nodeId = context.node.componentId
  const id = useId()
  useDiagnostic(context, clamped === undefined ? null : String(clamped), () => ({
    kind: 'coerced',
    nodeId,
    component: 'Progress',
    prop: 'value',
    received: clamped,
    used: value,
    reason: 'Progress value must lie between zero and max.'
  }))
  return (
    <div
      data-slot="a2ui-progress"
      className="grid gap-1"
    >
      <label htmlFor={id}>{label}</label>
      <Progress
        id={id}
        value={value}
        max={max}
      />
    </div>
  )
}

type AccordionItemSpec = { value: string; title: string; disabled: boolean }

function readAccordionItems(value: unknown): AccordionItemSpec[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const items: AccordionItemSpec[] = []
  for (const item of value) {
    if (!isPlainRecord(item)) continue
    const itemValue = text(item.value)
    if (!itemValue || seen.has(itemValue)) continue
    seen.add(itemValue)
    items.push({
      value: itemValue,
      title: text(item.title) || itemValue,
      disabled: item.disabled === true
    })
  }
  return items
}

const accordionPanelsRule: A2uiAccessibilityRule = {
  id: 'accordion-panels',
  check(component) {
    const items = Array.isArray(component.items) ? component.items : []
    const untitled = items.findIndex(item => !isPlainRecord(item) || !text(item.title))
    if (untitled >= 0) {
      return {
        prop: 'items',
        message: `Accordion "${String(component.id)}" item ${untitled + 1} has no title.`
      }
    }
    const panels = component.panels
    if (Array.isArray(panels) && panels.length !== items.length) {
      return {
        prop: 'panels',
        message: `Accordion "${String(component.id)}" has ${items.length} items but ${panels.length} panels.`
      }
    }
    return undefined
  }
}

const accordionEntry = createA2uiRegistryEntry({
  name: 'Accordion',
  accessibility: [accordionPanelsRule],
  component: [Accordion, AccordionItem, AccordionTrigger, AccordionContent],
  schema: schemaOf('Accordion'),
  description: schemaOf('Accordion').description,
  adapter(props, context) {
    const items = readAccordionItems(props.items)
    const panels = childNodes(props.panels)
    const multiple = props.selection === 'multiple'
    const bound = props.value instanceof ResolvedBinding && isWritable(props.value)
    const raw = readA2uiValue(props.value)
    const open = (Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : []).filter(
      (v): v is string => typeof v === 'string' && items.some(item => item.value === v)
    )
    const sections = items.map((item, index) => (
      <AccordionItem
        key={item.value}
        value={item.value}
        disabled={item.disabled}
      >
        <AccordionTrigger>{item.title}</AccordionTrigger>
        <AccordionContent>
          {panels[index] ? context.renderNode(panels[index]) : null}
        </AccordionContent>
      </AccordionItem>
    ))
    // Multiple and single selection keep separate owners; a change remounts.
    if (multiple) {
      return (
        <Accordion
          key="multiple"
          type="multiple"
          {...(bound ? { value: open } : { defaultValue: open })}
          onValueChange={next => writeA2uiBinding(props.value, next)}
        >
          {sections}
        </Accordion>
      )
    }
    const single = open[0] ?? null
    return (
      <Accordion
        key="single"
        {...(bound ? { value: single } : { defaultValue: single })}
        onValueChange={next => writeA2uiBinding(props.value, next === null ? [] : [next])}
      >
        {sections}
      </Accordion>
    )
  }
})

type Column = { label: string; align: 'start' | 'center' | 'end' }

const ALIGN_CLASS = { start: 'text-start', center: 'text-center', end: 'text-end' } as const

function readColumns(value: unknown): Column[] {
  if (!Array.isArray(value)) return []
  return value.filter(isPlainRecord).map(column => ({
    label: text(column.label),
    align: pick(column.align, ['start', 'center', 'end'] as const, 'start')
  }))
}

/** Row definitions a Table's `rows` names: explicit ids, or the template's component. */
function rowDefinitions(rows: unknown): unknown[] {
  if (Array.isArray(rows)) return rows
  if (isPlainRecord(rows) && typeof rows.componentId === 'string') return [rows.componentId]
  return []
}

const tableCellsRule: A2uiAccessibilityRule = {
  id: 'table-cells',
  check(component, context) {
    const columns = Array.isArray(component.columns) ? component.columns : []
    for (const id of rowDefinitions(component.rows)) {
      if (typeof id !== 'string') continue
      const row = context.getComponent(id)
      // A row that has not arrived yet cannot be judged.
      if (!row) continue
      const cells = Array.isArray(row.children) ? row.children.length : -1
      if (row.component !== 'Row' || cells !== columns.length) {
        return {
          prop: 'rows',
          message: `Table "${String(component.id)}" row "${id}" must be a Row with one child per column (${columns.length}).`
        }
      }
    }
    return undefined
  }
}

function A2uiTableRow({
  node,
  columns,
  context
}: {
  node: ComponentNode
  columns: readonly Column[]
  context: A2uiAdapterContext
}) {
  const props = useSignalValue(node.props)
  const cells =
    node.state === 'resolved' && node.type === 'Row' ? childNodes(props?.children) : null
  const mismatch = cells !== null && cells.length !== columns.length
  useDiagnostic(
    context,
    node.state === 'resolved' && (cells === null || mismatch)
      ? `${node.id}:${cells?.length}`
      : null,
    () => ({
      kind: 'fallback',
      nodeId: node.componentId,
      component: 'Table',
      prop: 'rows',
      received: cells === null ? node.type : cells.length,
      used: columns.length,
      reason:
        cells === null
          ? 'A Table row must be a Row; it spans every column instead.'
          : 'A Table row needs one child per column; missing cells stay empty and extra ones drop.'
    })
  )
  if (cells === null) {
    return (
      <TableRow>
        <TableCell colSpan={columns.length}>{context.renderNode(node)}</TableCell>
      </TableRow>
    )
  }
  return (
    <TableRow data-a2ui-row={node.componentId}>
      {columns.map((column, index) => (
        <TableCell
          // Cells are positional; a column has no other stable identity.
          // oxlint-disable-next-line react/no-array-index-key
          key={index}
          className={ALIGN_CLASS[column.align]}
        >
          {cells[index] ? context.renderNode(cells[index]) : null}
        </TableCell>
      ))}
    </TableRow>
  )
}

const tableEntry = createA2uiRegistryEntry({
  name: 'Table',
  accessibility: [textRule('table-caption', 'caption'), tableCellsRule],
  component: [TableContainer, Table, TableRow, TableCell],
  schema: schemaOf('Table'),
  description: schemaOf('Table').description,
  adapter(props, context) {
    const caption = text(props.caption)
    const columns = readColumns(props.columns)
    const rows = childNodes(props.rows)
    const table = (
      <Table density={pick(props.density, DENSITIES, 'normal')}>
        <TableCaption>{caption}</TableCaption>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableHeader
                // oxlint-disable-next-line react/no-array-index-key
                key={index}
                className={ALIGN_CLASS[column.align]}
              >
                {column.label}
              </TableHeader>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <A2uiTableRow
              key={row.id}
              node={row}
              columns={columns}
              context={context}
            />
          ))}
        </TableBody>
      </Table>
    )
    return caption ? <TableContainer aria-label={caption}>{table}</TableContainer> : table
  }
})

function A2uiToast({ props, context }: { props: Props; context: A2uiAdapterContext }) {
  const host = useContext(A2uiToastHostContext)
  const closeText = useA2uiLabels().toastClose?.trim()
  const bound = props.open instanceof ResolvedBinding && isWritable(props.open)
  const [localOpen, setLocalOpen] = useState(readA2uiValue(props.open) === true)
  const open = bound ? readA2uiValue(props.open) === true : localOpen
  const nodeId = context.node.componentId
  useDiagnostic(context, host.available ? null : 'no-viewport', () => ({
    kind: 'fallback',
    nodeId,
    component: 'Toast',
    prop: 'open',
    received: open,
    used: false,
    reason: 'A2uiSurface needs labels.notifications to name its toast viewport.'
  }))
  if (!host.element) return null
  const description = text(props.description)
  const actionLabel = text(props.actionLabel)
  const action = typeof props.action === 'function' ? (props.action as () => unknown) : undefined
  const rawDuration = readA2uiValue(props.duration)
  const duration =
    typeof rawDuration === 'number' && Number.isFinite(rawDuration) ? rawDuration : undefined
  const toast: ReactNode = (
    <Toast
      data-a2ui-node={nodeId}
      open={open}
      onOpenChange={next => {
        if (!writeA2uiBinding(props.open, next)) setLocalOpen(next)
      }}
      tone={pick(props.tone, TONES, 'neutral')}
      announce={pick(props.announce, ANNOUNCE, 'polite')}
      duration={duration}
    >
      <ToastTitle>{text(props.title)}</ToastTitle>
      {description ? <ToastDescription>{description}</ToastDescription> : null}
      {(actionLabel && action) || closeText ? (
        <div className="flex flex-wrap gap-2">
          {actionLabel && action ? (
            <ToastAction
              altText={actionLabel}
              onClick={() => void action()}
            >
              {actionLabel}
            </ToastAction>
          ) : null}
          {closeText ? <ToastClose variant="ghost">{closeText}</ToastClose> : null}
        </div>
      ) : null}
    </Toast>
  )
  return createPortal(toast, host.element)
}

const toastEntry = createA2uiRegistryEntry({
  name: 'Toast',
  accessibility: [textRule('toast-title', 'title')],
  component: [Toast, ToastTitle, ToastDescription, ToastAction, ToastClose],
  schema: schemaOf('Toast'),
  description: schemaOf('Toast').description,
  adapter(props, context) {
    return (
      <A2uiToast
        props={props}
        context={context}
      />
    )
  }
})

/** Feedback and data display entries of the Radiant extension catalog. */
export const feedbackEntries = [
  alertEntry,
  badgeEntry,
  progressEntry,
  accordionEntry,
  tableEntry,
  toastEntry
]
