'use client'

import { Fragment, useEffect, useId, useRef, type ReactNode } from 'react'
import { ResolvedBinding, type NodeAction } from '@a2ui/web_core/resolution'
import type { ControlSize, Spacing } from '../presentation.js'
import {
  Combobox,
  ComboboxContent,
  ComboboxControl,
  ComboboxInput,
  ComboboxPortal,
  ComboboxTags,
  ComboboxTrigger
} from '../components/Combobox/Combobox.js'
import { Field } from '../components/Field/Field.js'
import { Radio, RadioGroup } from '../components/RadioGroup/RadioGroup.js'
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectPortal,
  SelectTrigger,
  SelectValue
} from '../components/Select/Select.js'
import {
  Stage,
  StageActions,
  StageBody,
  StageDescription,
  StageFooter,
  StageHeader,
  StageTitle
} from '../components/Stage/Stage.js'
import { Switch } from '../components/Switch/Switch.js'
import { Textarea } from '../components/Textarea/Textarea.js'
import { radiantCatalog } from '../catalog/index.js'
import {
  A2UI_EXTENSION_OVERRIDE_NAMES,
  a2uiExtensionInstructions,
  generateA2uiCatalogs,
  RADIANT_A2UI_EXTENSION_CATALOG_ID,
  type A2uiJsonSchema
} from './catalogGenerator.js'
import { createA2uiRegistryEntry, createOverridingA2uiRegistry } from './registry.js'
import { isA2uiChildNode } from './adapterValues.js'
import type { A2uiAccessibilityRule } from './accessibilityRules.js'
import { controlLabelRule } from './accessibilityRules.js'
import {
  flexEntry,
  radiantA2uiRegistry,
  readValidationError,
  resolveControlLabel,
  SR_ONLY_LABEL_PARTS,
  unwrapBoolean,
  unwrapDisplayText,
  unwrapString,
  writeBinding
} from './entries.js'
import { feedbackEntries } from './feedbackEntries.js'
import { layoutIntentEntries } from './layoutIntentEntries.js'
import { annotatedTextEntries } from './annotatedTextEntries.js'
import { matrixEntry } from './matrixEntry.js'

const extensionCatalog = generateA2uiCatalogs(radiantCatalog).extension

function extensionSchema(name: string): A2uiJsonSchema {
  const schema = extensionCatalog.components[name]
  if (!schema || typeof schema.description !== 'string') {
    throw new TypeError(`A2UI extension catalog generator did not emit "${name}".`)
  }
  return schema
}

type Props = Readonly<Record<string, unknown>>

const CONTROL_SIZES: readonly string[] = ['small', 'medium', 'large']
const readControlSize = (props: Props): ControlSize =>
  typeof props.controlSize === 'string' && CONTROL_SIZES.includes(props.controlSize)
    ? (props.controlSize as ControlSize)
    : 'medium'

type ExtensionOption = {
  readonly value: string
  readonly label: string
  readonly description?: string
  readonly disabled?: boolean
}

/** Options from a literal list or a bound data-model list; malformed or repeated values drop. */
function readOptions(value: unknown): ExtensionOption[] {
  const raw = value instanceof ResolvedBinding ? value.value : value
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const options: ExtensionOption[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    const optionValue = unwrapDisplayText(record.value)
    if (!optionValue || seen.has(optionValue)) continue
    seen.add(optionValue)
    const description = unwrapString(record.description)?.trim()
    options.push({
      value: optionValue,
      label: unwrapDisplayText(record.label).trim() || optionValue,
      ...(description ? { description } : {}),
      ...(record.disabled === true ? { disabled: true } : {})
    })
  }
  return options
}

/** Shared Field props: label, helper text, first failing check, required and disabled. */
function fieldProps(props: Props, componentId: string) {
  const label = resolveControlLabel(props, componentId)
  return {
    label: label.text,
    description: unwrapString(props.description)?.trim() || undefined,
    error: readValidationError(props),
    required: unwrapBoolean(props.required) === true,
    disabled: unwrapBoolean(props.disabled) === true,
    parts: label.srOnly ? SR_ONLY_LABEL_PARTS : undefined
  }
}

const labelRule = controlLabelRule({ fixFrom: ['accessibility.label', 'placeholder'] })

function A2uiSelect({
  items,
  current,
  placeholder,
  controlSize,
  onSelect,
  onStale
}: {
  items: readonly ExtensionOption[]
  current: string | undefined
  placeholder?: string
  controlSize: ControlSize
  onSelect: (next: string) => void
  onStale: (value: string) => void
}) {
  const known = items.some(item => item.value === current)
  const stale = Boolean(current) && items.length > 0 && !known
  useEffect(() => {
    if (stale) onStale(current!)
    // Report once per stored value, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stale, current])
  return (
    <Select
      items={items}
      value={known ? current! : null}
      controlSize={controlSize}
      onValueChange={next => onSelect(next ?? '')}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
        <SelectIcon />
      </SelectTrigger>
      <SelectPortal>
        <SelectContent />
      </SelectPortal>
    </Select>
  )
}

const selectEntry = createA2uiRegistryEntry({
  name: 'Select',
  accessibility: [labelRule],
  component: [Field, Select],
  schema: extensionSchema('Select'),
  description: extensionSchema('Select').description as string,
  adapter(props, context) {
    const nodeId = context.node.componentId
    return (
      <Field {...fieldProps(props, nodeId)}>
        <A2uiSelect
          items={readOptions(props.items)}
          current={unwrapString(props.value)}
          placeholder={unwrapString(props.placeholder)}
          controlSize={readControlSize(props)}
          onSelect={next => writeBinding(props.value, next)}
          onStale={value =>
            context.reportDiagnostic?.({
              kind: 'fallback',
              code: 'UNKNOWN_VALUE',
              nodeId,
              component: 'Select',
              prop: 'value',
              received: value,
              used: null,
              reason: 'The bound value is not among the items; nothing is shown as selected.'
            })
          }
        />
      </Field>
    )
  }
})

const SEARCH_DELAY_MS = 250

function A2uiCombobox({
  items,
  selected,
  multiple,
  placeholder,
  controlSize,
  query,
  loading,
  hostFiltered,
  search,
  onQuery,
  onSelect
}: {
  items: readonly ExtensionOption[]
  selected: readonly string[]
  multiple: boolean
  placeholder?: string
  controlSize: ControlSize
  /** The bound query, or undefined when the query is not bound. */
  query: string | undefined
  loading: boolean
  hostFiltered: boolean
  search: (() => void) | undefined
  onQuery: (next: string) => void
  onSelect: (next: readonly string[]) => void
}) {
  const latestSearch = useRef(search)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    latestSearch.current = search
  })
  useEffect(() => () => clearTimeout(timer.current), [])
  const handleQuery = (next: string) => {
    onQuery(next)
    clearTimeout(timer.current)
    if (latestSearch.current) {
      timer.current = setTimeout(() => latestSearch.current?.(), SEARCH_DELAY_MS)
    }
  }
  // Hosts keep selected items in their results; a missing one shows its value.
  const selectedItems = selected.map(
    v => items.find(item => item.value === v) ?? { value: v, label: v }
  )
  // Host results arrive filtered; a bound query makes the input controlled.
  const queryOwner: object = query === undefined ? {} : { query }
  const shared = {
    items,
    controlSize,
    loading,
    onQueryChange: handleQuery,
    ...(hostFiltered ? { filter: null } : {}),
    ...queryOwner
  }
  const input = <ComboboxInput placeholder={placeholder} />
  const popup = (
    <ComboboxPortal>
      <ComboboxContent />
    </ComboboxPortal>
  )
  if (multiple) {
    return (
      <Combobox
        type="multiple"
        {...shared}
        value={[...selected]}
        selectedItems={selectedItems}
        onValueChange={onSelect}
      >
        <ComboboxControl>
          <ComboboxTags />
          {input}
          <ComboboxTrigger />
        </ComboboxControl>
        {popup}
      </Combobox>
    )
  }
  return (
    <Combobox
      {...shared}
      value={selected[0] ?? null}
      selectedItem={selectedItems[0]}
      onValueChange={next => onSelect(next === null ? [] : [next])}
    >
      <div className="relative w-full min-w-0">
        {input}
        <ComboboxTrigger className="absolute inset-y-0 end-0 w-12" />
      </div>
      {popup}
    </Combobox>
  )
}

const comboboxEntry = createA2uiRegistryEntry({
  name: 'Combobox',
  accessibility: [labelRule],
  component: [Field, Combobox],
  schema: extensionSchema('Combobox'),
  description: extensionSchema('Combobox').description as string,
  adapter(props, context) {
    const raw = props.value instanceof ResolvedBinding ? props.value.value : props.value
    // A single selection bound to a string path keeps writing a string.
    const writesString = typeof raw === 'string'
    const selected = writesString
      ? raw
        ? [raw]
        : []
      : Array.isArray(raw)
        ? raw.filter((v): v is string => typeof v === 'string')
        : []
    const multiple = props.selection === 'multiple'
    const queryBound = props.query instanceof ResolvedBinding
    const search =
      typeof props.search === 'function' ? () => void (props.search as NodeAction)() : undefined
    return (
      <Field {...fieldProps(props, context.node.componentId)}>
        <A2uiCombobox
          items={readOptions(props.items)}
          selected={multiple ? selected : selected.slice(0, 1)}
          multiple={multiple}
          placeholder={unwrapString(props.placeholder)}
          controlSize={readControlSize(props)}
          query={queryBound ? (unwrapString(props.query) ?? '') : undefined}
          loading={unwrapBoolean(props.loading) === true}
          hostFiltered={queryBound || search !== undefined}
          search={search}
          onQuery={next => writeBinding(props.query, next)}
          onSelect={next =>
            writeBinding(props.value, writesString && !multiple ? (next[0] ?? '') : [...next])
          }
        />
      </Field>
    )
  }
})

const radioGroupEntry = createA2uiRegistryEntry({
  name: 'RadioGroup',
  accessibility: [labelRule],
  component: [RadioGroup, Radio],
  schema: extensionSchema('RadioGroup'),
  description: extensionSchema('RadioGroup').description as string,
  adapter(props, context) {
    const options = readOptions(props.options)
    const current = unwrapString(props.value)
    return (
      <RadioGroup
        {...fieldProps(props, context.node.componentId)}
        controlSize={readControlSize(props)}
        value={options.some(o => o.value === current) ? current! : null}
        onValueChange={next => writeBinding(props.value, next)}
      >
        {options.map(option => (
          <Radio
            key={option.value}
            value={option.value}
            label={option.label}
            description={option.description}
            disabled={option.disabled}
          />
        ))}
      </RadioGroup>
    )
  }
})

const switchEntry = createA2uiRegistryEntry({
  name: 'Switch',
  accessibility: [controlLabelRule({ fixFrom: ['accessibility.label'] })],
  component: [Field, Switch],
  schema: extensionSchema('Switch'),
  description: extensionSchema('Switch').description as string,
  adapter(props, context) {
    return (
      <Field {...fieldProps(props, context.node.componentId)}>
        <Switch
          checked={unwrapBoolean(props.checked) ?? false}
          controlSize={readControlSize(props)}
          onChange={event => writeBinding(props.checked, event.currentTarget.checked)}
        />
      </Field>
    )
  }
})

const textareaEntry = createA2uiRegistryEntry({
  name: 'Textarea',
  accessibility: [labelRule],
  component: [Field, Textarea],
  schema: extensionSchema('Textarea'),
  description: extensionSchema('Textarea').description as string,
  adapter(props, context) {
    const rows = typeof props.rows === 'number' && Number.isFinite(props.rows) ? props.rows : 4
    return (
      <Field {...fieldProps(props, context.node.componentId)}>
        <Textarea
          value={unwrapString(props.value) ?? ''}
          rows={Math.min(20, Math.max(2, Math.round(rows)))}
          placeholder={unwrapString(props.placeholder)}
          controlSize={readControlSize(props)}
          onChange={event => writeBinding(props.value, event.currentTarget.value)}
        />
      </Field>
    )
  }
})

/** Requires a Stage to have a non-empty `title` that names its widget. */
const stageTitleRule: A2uiAccessibilityRule = {
  id: 'stage-title',
  check(component) {
    const title = component.title
    if (typeof title === 'string' && title.trim()) return
    return {
      prop: 'title',
      message: `Stage "${String(component.id)}" has no title to name its widget.`
    }
  }
}

const STAGE_PADDING: readonly string[] = ['tight', 'normal', 'airy']

/** A Stage named by its title as a group, so its actions and footer belong to that widget. */
function A2uiStage({
  title,
  description,
  padding,
  aspectRatio,
  actions,
  body,
  footer
}: {
  title: string
  description: string | undefined
  padding: Spacing | undefined
  aspectRatio: number | undefined
  actions: ReactNode
  body: ReactNode
  footer: ReactNode
}) {
  const titleId = useId()
  return (
    <Stage
      data-slot="a2ui-stage"
      // A fieldset would add form semantics; the group only names the widget.
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="group"
      aria-labelledby={title ? titleId : undefined}
      padding={padding}
    >
      {title || description || actions ? (
        <StageHeader>
          {title ? <StageTitle id={titleId}>{title}</StageTitle> : null}
          {description ? <StageDescription>{description}</StageDescription> : null}
          {actions ? <StageActions>{actions}</StageActions> : null}
        </StageHeader>
      ) : null}
      <StageBody aspectRatio={aspectRatio}>{body}</StageBody>
      {footer ? <StageFooter>{footer}</StageFooter> : null}
    </Stage>
  )
}

const stageEntry = createA2uiRegistryEntry({
  name: 'Stage',
  accessibility: [stageTitleRule],
  component: [Stage, StageBody],
  schema: extensionSchema('Stage'),
  description: extensionSchema('Stage').description as string,
  adapter(props, context) {
    const ratio = props.aspectRatio
    const render = (value: unknown) => {
      const children = Array.isArray(value) ? value.filter(isA2uiChildNode) : []
      return children.length
        ? children.map(child => <Fragment key={child.id}>{context.renderNode(child)}</Fragment>)
        : null
    }
    return (
      <A2uiStage
        title={unwrapDisplayText(props.title).trim()}
        description={unwrapString(props.description)?.trim() || undefined}
        padding={
          typeof props.padding === 'string' && STAGE_PADDING.includes(props.padding)
            ? (props.padding as Spacing)
            : undefined
        }
        aspectRatio={
          typeof ratio === 'number' && Number.isFinite(ratio) && ratio > 0 ? ratio : undefined
        }
        actions={render(props.actions)}
        body={isA2uiChildNode(props.child) ? context.renderNode(props.child) : null}
        footer={render(props.footer)}
      />
    )
  }
})

const extensionEntries = [
  flexEntry('Row', 'horizontal', extensionSchema('Row')),
  selectEntry,
  comboboxEntry,
  radioGroupEntry,
  switchEntry,
  textareaEntry,
  stageEntry,
  ...feedbackEntries,
  ...layoutIntentEntries,
  ...annotatedTextEntries,
  matrixEntry
]

/**
 * Radiant's A2UI extension registry: the basic catalog, with a Row that can wrap, plus Radiant
 * form controls, feedback and data display.
 * Surfaces may name either catalog. Generated catalog JSON (`src/a2ui/extension-catalog.json`).
 */
export const radiantA2uiExtensionRegistry = createOverridingA2uiRegistry(
  {
    catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
    title: 'Radiant A2UI 1.0 Extension Catalog',
    description:
      'The A2UI basic catalog plus Radiant form controls, feedback and data display, generated from @cognitap/radiant/catalog.',
    instructions: [
      radiantA2uiRegistry.instructions,
      a2uiExtensionInstructions(
        Object.fromEntries(extensionEntries.map(entry => [entry.name, entry.schema]))
      )
    ]
      .filter(Boolean)
      .join('\n'),
    extends: radiantA2uiRegistry,
    entries: extensionEntries
  },
  A2UI_EXTENSION_OVERRIDE_NAMES
)
