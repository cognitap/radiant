'use client'

import { useContext, useEffect, useId, useMemo, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { isWritable, ResolvedBinding, type ComponentNode } from '@a2ui/web_core/resolution'
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
  ToastTitle,
  useToastQueueViewport
} from '../components/Toast/Toast.js'
import type { Spacing, Tone } from '../presentation.js'
import { radiantCatalog } from '../catalog/index.js'
import { isPlainRecord, type CatalogDiagnostic } from '../catalog/coerce.js'
import { generateA2uiCatalogs, type A2uiJsonSchema } from './catalogGenerator.js'
import { createA2uiRegistryEntry, type A2uiAdapterContext } from './registry.js'
import { mediaNameRule, type A2uiAccessibilityRule } from './accessibilityRules.js'
import { isA2uiChildNode, readA2uiValue, writeA2uiBinding } from './adapterValues.js'
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
  Array.isArray(value) ? value.filter(child => isA2uiChildNode(child)) : []

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
    // A missing or null value is indeterminate; anything else that is not in range is reported.
    const invalid = raw !== null && raw !== undefined && (!finite || value !== raw)
    return (
      <A2uiProgress
        label={label}
        value={value}
        max={max}
        invalid={invalid ? { received: raw } : undefined}
        context={context}
      />
    )
  }
})

function A2uiProgress({
  label,
  value,
  max,
  invalid,
  context
}: {
  label: string
  value: number | null
  max: number
  invalid: { readonly received: unknown } | undefined
  context: A2uiAdapterContext
}) {
  const nodeId = context.node.componentId
  const id = useId()
  useDiagnostic(context, invalid ? (JSON.stringify(invalid.received) ?? 'invalid') : null, () => ({
    kind: 'coerced',
    nodeId,
    component: 'Progress',
    prop: 'value',
    received: invalid?.received,
    used: value,
    reason:
      value === null
        ? 'Progress value must be a number; it shows as indeterminate.'
        : 'Progress value must lie between zero and max.'
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

type AccordionItemSpec = {
  value: string
  title: string
  disabled: boolean
  panel: ComponentNode | undefined
}

/** Items from a literal list; malformed or repeated values drop (the validator reports them). */
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
      disabled: readA2uiValue(item.disabled) === true,
      panel: isA2uiChildNode(item.panel) ? item.panel : undefined
    })
  }
  return items
}

const accordionItemsRule: A2uiAccessibilityRule = {
  id: 'accordion-items',
  check(component) {
    // Items bound to the data model are judged when they render.
    if (!Array.isArray(component.items)) return undefined
    const seen = new Set<string>()
    for (const [index, item] of component.items.entries()) {
      const where = `Accordion "${String(component.id)}" item ${index + 1}`
      if (!isPlainRecord(item) || !text(item.title)) {
        return { prop: 'items', message: `${where} has no title.` }
      }
      const value = text(item.value)
      if (seen.has(value)) {
        return { prop: 'items', message: `${where} repeats the value "${value}".` }
      }
      seen.add(value)
    }
    return undefined
  }
}

const accordionEntry = createA2uiRegistryEntry({
  name: 'Accordion',
  accessibility: [accordionItemsRule],
  component: [Accordion, AccordionItem, AccordionTrigger, AccordionContent],
  schema: schemaOf('Accordion'),
  description: schemaOf('Accordion').description,
  adapter(props, context) {
    const items = readAccordionItems(readA2uiValue(props.items))
    const multiple = props.selection === 'multiple'
    const bound = props.value instanceof ResolvedBinding && isWritable(props.value)
    const raw = readA2uiValue(props.value)
    const open = (Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : []).filter(
      (v): v is string => typeof v === 'string' && items.some(item => item.value === v)
    )
    // Each section is keyed by its value, so its panel stays with it when items reorder.
    const sections = items.map(item => (
      <AccordionItem
        key={item.value}
        value={item.value}
        disabled={item.disabled}
      >
        <AccordionTrigger>{item.title}</AccordionTrigger>
        <AccordionContent>{item.panel ? context.renderNode(item.panel) : null}</AccordionContent>
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

function A2uiTable({ props, context }: { props: Props; context: A2uiAdapterContext }) {
  const id = useId()
  const caption = text(props.caption)
  const columns = readColumns(props.columns)
  const rows = childNodes(props.rows)
  const headerIds = columns.map((_, index) => `${id}-h${index}`)
  // The container stays mounted either way, so a caption arriving later keeps every row.
  return (
    <TableContainer aria-labelledby={caption ? `${id}-caption` : headerIds.join(' ')}>
      <Table density={pick(props.density, DENSITIES, 'normal')}>
        {caption ? <TableCaption id={`${id}-caption`}>{caption}</TableCaption> : null}
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableHeader
                key={headerIds[index]}
                id={headerIds[index]}
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
    </TableContainer>
  )
}

const tableEntry = createA2uiRegistryEntry({
  name: 'Table',
  accessibility: [textRule('table-caption', 'caption'), tableCellsRule],
  component: [TableContainer, Table, TableRow, TableCell],
  schema: schemaOf('Table'),
  description: schemaOf('Table').description,
  adapter(props, context) {
    return (
      <A2uiTable
        props={props}
        context={context}
      />
    )
  }
})

const TOAST_DURATION_MS = 5000

const isDataBinding = (value: unknown) =>
  isPlainRecord(value) && (typeof value['@path'] === 'string' || typeof value.path === 'string')

const toastOpenRule: A2uiAccessibilityRule = {
  id: 'toast-open-bound',
  check(component) {
    if (isDataBinding(component.open)) return undefined
    return {
      prop: 'open',
      message: `Toast "${String(component.id)}" needs \`open\` bound to a data path, not a literal or function call.`
    }
  }
}

/** Reads and writes the boolean behind a raw `{ '@path' }` binding in the node's data scope. */
function useBoundFlag(node: ComponentNode, raw: unknown) {
  const dataContext = node.context?.dataContext
  const path = isDataBinding(raw)
    ? String((raw as Record<string, unknown>)['@path'] ?? (raw as Record<string, unknown>).path)
    : undefined
  const signal = useMemo(
    () => (dataContext && path !== undefined ? dataContext.resolveSignal<unknown>(raw) : undefined),
    // The signal depends on the path, not on the binding object's identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataContext, path]
  )
  const value = useSignalValue(signal)
  return {
    bound: signal !== undefined,
    value: value === true,
    set: (next: boolean) => {
      if (dataContext && path !== undefined) dataContext.set(path, next)
    }
  }
}

function A2uiToast({ props, context }: { props: Props; context: A2uiAdapterContext }) {
  const host = useContext(A2uiToastHostContext)
  const viewport = useToastQueueViewport()?.viewport ?? null
  const closeText = useA2uiLabels().toastClose?.trim()
  const nodeId = context.node.componentId
  const title = text(props.title)
  // `open` is a plain data binding on the wire; only a path can close again after it opens.
  const open = useBoundFlag(context.node, props.open)
  const bound = open.bound
  const requested = open.value
  const report = (prop: string, received: unknown, reason: string) => () =>
    ({ kind: 'fallback', nodeId, component: 'Toast', prop, received, used: false, reason }) as const
  useDiagnostic(
    context,
    host.available ? null : 'viewport',
    report(
      'open',
      requested,
      'Toast needs a viewport: A2uiSurface labels.notifications or a host ToastProvider.'
    )
  )
  useDiagnostic(
    context,
    bound ? null : 'unbound',
    report(
      'open',
      readA2uiValue(props.open),
      'Toast open must be bound to a data path; it stays closed.'
    )
  )
  useDiagnostic(
    context,
    requested && !title ? 'untitled' : null,
    report('title', props.title, 'Toast title is empty; it stays closed until the title has text.')
  )
  if (!viewport) return null
  const description = text(props.description)
  const actionLabel = text(props.actionLabel)
  const action = typeof props.action === 'function' ? (props.action as () => unknown) : undefined
  const rawDuration = readA2uiValue(props.duration)
  const duration =
    typeof rawDuration === 'number' && Number.isFinite(rawDuration)
      ? rawDuration
      : TOAST_DURATION_MS
  const toast: ReactNode = (
    <Toast
      data-a2ui-node={nodeId}
      open={requested && Boolean(title)}
      onOpenChange={open.set}
      tone={pick(props.tone, TONES, 'neutral')}
      announce={pick(props.announce, ANNOUNCE, 'polite')}
      duration={duration}
    >
      <ToastTitle>{title}</ToastTitle>
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
  return createPortal(toast, viewport)
}

const toastEntry = createA2uiRegistryEntry({
  name: 'Toast',
  accessibility: [textRule('toast-title', 'title'), toastOpenRule],
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
