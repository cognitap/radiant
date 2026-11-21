'use client'

import { Fragment, useState, type ChangeEvent, type Ref } from 'react'
import {
  isComponentNode,
  isWritable,
  ResolvedBinding,
  type ComponentNode,
  type NodeAction
} from '@a2ui/web_core/resolution'
import { Button, type ButtonVariant } from '../components/Button/Button.js'
import { Checkbox } from '../components/Checkbox/Checkbox.js'
import { CheckboxGroup } from '../components/CheckboxGroup/CheckboxGroup.js'
import { Field } from '../components/Field/Field.js'
import { Input } from '../components/Input/Input.js'
import { Radio, RadioGroup } from '../components/RadioGroup/RadioGroup.js'
import { Slider } from '../components/Slider/Slider.js'
import { Textarea } from '../components/Textarea/Textarea.js'
import { ToggleGroup, ToggleGroupItem } from '../components/ToggleGroup/ToggleGroup.js'
import { radiantCatalog } from '../catalog/index.js'
import { humanizeNodeId } from '../catalog/coerce.js'
import {
  A2UI_BASIC_CATALOG_ID,
  generateA2uiCatalogs,
  type A2uiJsonSchema
} from './catalogGenerator.js'
import { createA2uiRegistry, createA2uiRegistryEntry, type A2uiAdapterContext } from './registry.js'
import {
  buttonNameRule,
  controlLabelRule,
  imageAltRule,
  mediaNameRule
} from './accessibilityRules.js'
import { unknownIconDiagnostic } from './coerce.js'
import {
  A2uiAudioPlayer,
  A2uiIcon,
  A2uiImage,
  A2uiVideo,
  type A2uiBoundValue,
  type A2uiRejectedUrl
} from './media.js'
import {
  fromNativeDateTime,
  toNativeBound,
  toNativeDateTime,
  type DateTimeInputType
} from './dateTimeValue.js'

function unwrapDisplayText(value: unknown): string {
  const raw = value instanceof ResolvedBinding ? value.value : value
  if (typeof raw === 'string') return raw
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  if (typeof raw === 'boolean') return String(raw)
  return ''
}

function unwrapString(value: unknown): string | undefined {
  if (value instanceof ResolvedBinding) {
    return typeof value.value === 'string' ? value.value : undefined
  }
  return typeof value === 'string' ? value : undefined
}

function unwrapBoolean(value: unknown): boolean | undefined {
  const raw = value instanceof ResolvedBinding ? value.value : value
  return typeof raw === 'boolean' ? raw : undefined
}

function unwrapNumber(value: unknown): number | undefined {
  const raw = value instanceof ResolvedBinding ? value.value : value
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined
}

function unwrapStringList(value: unknown): string[] {
  const raw = value instanceof ResolvedBinding ? value.value : value
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string') : []
}

function writeBinding(raw: unknown, nextValue: unknown) {
  if (raw instanceof ResolvedBinding && isWritable(raw)) {
    raw.set(nextValue)
  }
}

function readValidationError(props: Readonly<Record<string, unknown>>): string | undefined {
  const errors = props.validationErrors
  if (!Array.isArray(errors) || errors.length === 0) return undefined
  const first = errors[0]
  return typeof first === 'string' && first.length > 0 ? first : undefined
}

const basicCatalog = generateA2uiCatalogs(radiantCatalog).basic

function basicSchema(name: string): A2uiJsonSchema {
  const schema = basicCatalog.components[name]
  if (!schema) {
    throw new TypeError(`A2UI basic catalog generator did not emit schema for "${name}".`)
  }
  return schema
}

function basicDescription(name: string): string {
  const description = basicSchema(name).description
  if (typeof description !== 'string') {
    throw new TypeError(`A2UI basic catalog generator did not describe "${name}".`)
  }
  return description
}

const COLUMN_JUSTIFY: Record<string, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  spaceBetween: 'justify-between',
  spaceAround: 'justify-around',
  spaceEvenly: 'justify-evenly',
  stretch: 'justify-stretch'
}

const COLUMN_ALIGN: Record<string, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch'
}

const columnEntry = createA2uiRegistryEntry({
  name: 'Column',
  accessibility: [],
  component: 'div',
  schema: basicSchema('Column'),
  description: basicDescription('Column'),
  adapter(props, context) {
    const children = Array.isArray(props.children)
      ? props.children.filter((child): child is ComponentNode => isComponentNode(child))
      : []
    const justify =
      typeof props.justify === 'string' && props.justify in COLUMN_JUSTIFY
        ? COLUMN_JUSTIFY[props.justify]
        : COLUMN_JUSTIFY.start
    const align =
      typeof props.align === 'string' && props.align in COLUMN_ALIGN
        ? COLUMN_ALIGN[props.align]
        : COLUMN_ALIGN.stretch

    return (
      <div
        data-slot="a2ui-column"
        className={`flex flex-col gap-[var(--rad-surface-gap,1rem)] ${justify} ${align}`}
      >
        {children.map(child => (
          <Fragment key={child.id}>{context.renderNode(child)}</Fragment>
        ))}
      </div>
    )
  }
})

const textEntry = createA2uiRegistryEntry({
  name: 'Text',
  accessibility: [],
  component: 'p',
  schema: basicSchema('Text'),
  description: basicDescription('Text'),
  adapter(props, context) {
    const text = unwrapDisplayText(props.text)
    const variant = props.variant === 'caption' ? 'caption' : 'body'
    // Text bound to a data path with no value yet reserves its line.
    const reserve =
      props.text instanceof ResolvedBinding && props.text.value === undefined
        ? ' block min-h-[1lh]'
        : ''
    if (context.inline) {
      return (
        <span
          data-slot="a2ui-text"
          data-variant={variant}
        >
          {text}
        </span>
      )
    }
    if (variant === 'caption') {
      return (
        <span
          data-slot="a2ui-text"
          data-variant="caption"
          className={`text-[length:var(--rad-typography-roles-ui-supporting-size,0.8125rem)] leading-[var(--rad-typography-roles-ui-supporting-line-height,1.4)] [color:var(--rad-color-muted-foreground,oklch(0.45_0.01_286))]${reserve}`}
        >
          {text}
        </span>
      )
    }
    return (
      <p
        data-slot="a2ui-text"
        data-variant="body"
        className={`m-0 text-[length:var(--rad-typography-roles-ui-body-size,1rem)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)] [color:var(--rad-color-foreground,oklch(0.21_0.006_286))]${reserve}`}
      >
        {text}
      </p>
    )
  }
})

const TEXT_FIELD_INPUT_TYPE: Record<string, string> = {
  shortText: 'text',
  number: 'number',
  obscured: 'password'
}

const textFieldEntry = createA2uiRegistryEntry({
  name: 'TextField',
  accessibility: [controlLabelRule({ fixFrom: ['accessibility.label', 'placeholder'] })],
  component: [Field, Input, Textarea],
  schema: basicSchema('TextField'),
  description: basicDescription('TextField'),
  adapter(props) {
    const label = unwrapString(props.label) ?? ''
    const placeholder = unwrapString(props.placeholder)
    const error = readValidationError(props)
    const rawValue = props.value
    const valueBinding = rawValue instanceof ResolvedBinding ? rawValue : undefined
    const value = unwrapString(rawValue) ?? ''
    const variant = typeof props.variant === 'string' ? props.variant : 'shortText'

    const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (valueBinding && isWritable(valueBinding)) {
        valueBinding.set(event.currentTarget.value)
      }
    }

    return (
      <Field
        label={label}
        error={error}
      >
        {variant === 'longText' ? (
          <Textarea
            value={value}
            placeholder={placeholder}
            onChange={handleChange}
          />
        ) : (
          <Input
            type={TEXT_FIELD_INPUT_TYPE[variant] ?? 'text'}
            value={value}
            placeholder={placeholder}
            onChange={handleChange}
          />
        )}
      </Field>
    )
  }
})

const BUTTON_VARIANT_MAP: Record<string, ButtonVariant> = {
  default: 'soft',
  primary: 'solid',
  borderless: 'ghost'
}

const buttonEntry = createA2uiRegistryEntry({
  name: 'Button',
  accessibility: [buttonNameRule()],
  component: Button,
  schema: basicSchema('Button'),
  description: basicDescription('Button'),
  adapter(props, context) {
    const variant: ButtonVariant =
      typeof props.variant === 'string' && props.variant in BUTTON_VARIANT_MAP
        ? BUTTON_VARIANT_MAP[props.variant]!
        : 'soft'
    const childNode = isComponentNode(props.child) ? props.child : undefined
    const action = typeof props.action === 'function' ? (props.action as NodeAction) : undefined

    return (
      <Button
        variant={variant}
        onClick={() => {
          void action?.()
        }}
      >
        {childNode ? context.renderNode(childNode, { inline: true }) : null}
      </Button>
    )
  }
})

function resolveControlLabel(
  props: Readonly<Record<string, unknown>>,
  componentId: string
): { readonly text: string; readonly srOnly: boolean } {
  const visible = unwrapDisplayText(props.label).trim()
  if (visible) return { text: visible, srOnly: false }
  const accessibility =
    props.accessibility && typeof props.accessibility === 'object'
      ? (props.accessibility as Record<string, unknown>)
      : undefined
  const accessible = unwrapDisplayText(accessibility?.label).trim()
  if (accessible) return { text: accessible, srOnly: true }
  return { text: humanizeNodeId(componentId), srOnly: false }
}

const SR_ONLY_LABEL_PARTS = { label: { className: 'sr-only' } } as const

const checkBoxEntry = createA2uiRegistryEntry({
  name: 'CheckBox',
  accessibility: [controlLabelRule({ fixFrom: ['accessibility.label'] })],
  component: [Checkbox, Field],
  schema: basicSchema('CheckBox'),
  description: basicDescription('CheckBox'),
  adapter(props) {
    const label = unwrapDisplayText(props.label)
    const error = readValidationError(props)
    const checked = unwrapBoolean(props.value) ?? false

    return (
      <Field
        label={label}
        error={error}
      >
        <Checkbox
          checked={checked}
          onChange={event => writeBinding(props.value, event.currentTarget.checked)}
        />
      </Field>
    )
  }
})

type ChoiceOptionItem = { readonly value: string; readonly label: string }

function readChoiceOptions(raw: unknown): readonly ChoiceOptionItem[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const items: ChoiceOptionItem[] = []
  for (const option of raw) {
    if (!option || typeof option !== 'object') continue
    const record = option as Record<string, unknown>
    if (typeof record.value !== 'string' || seen.has(record.value)) continue
    seen.add(record.value)
    items.push({ value: record.value, label: unwrapDisplayText(record.label) || record.value })
  }
  return items
}

function A2uiChoicePicker({
  ref,
  label,
  srOnly,
  error,
  options,
  selected,
  multiple,
  chips,
  filterable,
  onSelect
}: {
  ref?: Ref<HTMLElement>
  label: string
  srOnly: boolean
  error?: string
  options: readonly ChoiceOptionItem[]
  selected: readonly string[]
  multiple: boolean
  chips: boolean
  filterable: boolean
  onSelect: (next: string[]) => void
}) {
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const visible =
    filterable && needle ? options.filter(o => o.label.toLowerCase().includes(needle)) : options
  const parts = srOnly ? SR_ONLY_LABEL_PARTS : undefined
  const filterInput = filterable ? (
    <Input
      type="search"
      aria-label={`Filter ${label}`}
      placeholder={`Filter ${label}`}
      value={query}
      onChange={e => setQuery(e.currentTarget.value)}
    />
  ) : null

  if (chips) {
    const items = visible.map(o => (
      <ToggleGroupItem
        key={o.value}
        value={o.value}
      >
        {o.label}
      </ToggleGroupItem>
    ))
    return (
      <Field
        ref={ref as Ref<HTMLFieldSetElement>}
        layout="group"
        label={label}
        error={error}
        parts={parts}
      >
        {filterInput}
        {multiple ? (
          <ToggleGroup
            type="multiple"
            aria-label={label}
            value={[...selected]}
            onValueChange={onSelect}
          >
            {items}
          </ToggleGroup>
        ) : (
          <ToggleGroup
            type="single"
            aria-label={label}
            value={selected[0] ?? null}
            onValueChange={next => onSelect(next ? [next] : [])}
          >
            {items}
          </ToggleGroup>
        )}
      </Field>
    )
  }

  const group = multiple ? (
    <CheckboxGroup
      label={label}
      error={error}
      parts={parts}
      items={visible}
      value={[...selected]}
      onValueChange={onSelect}
    />
  ) : (
    <RadioGroup
      label={label}
      error={error}
      parts={parts}
      value={selected[0] ?? null}
      onValueChange={next => onSelect([next])}
    >
      {visible.map(o => (
        <Radio
          key={o.value}
          value={o.value}
          label={o.label}
        />
      ))}
    </RadioGroup>
  )

  return (
    <div
      ref={ref as Ref<HTMLDivElement>}
      data-slot="a2ui-choice-picker"
      className="grid gap-2"
    >
      {filterInput}
      {group}
    </div>
  )
}

const choicePickerEntry = createA2uiRegistryEntry({
  name: 'ChoicePicker',
  accessibility: [controlLabelRule({ alternatives: ['accessibility.label'] })],
  component: [RadioGroup, Radio, CheckboxGroup, ToggleGroup, ToggleGroupItem, Input, Field],
  schema: basicSchema('ChoicePicker'),
  description: basicDescription('ChoicePicker'),
  adapter(props, context) {
    const label = resolveControlLabel(props, context.node.componentId)
    return (
      <A2uiChoicePicker
        label={label.text}
        srOnly={label.srOnly}
        error={readValidationError(props)}
        options={readChoiceOptions(props.options)}
        selected={unwrapStringList(props.value)}
        multiple={props.variant === 'multipleSelection'}
        chips={props.displayStyle === 'chips'}
        filterable={props.filterable === true}
        onSelect={next => writeBinding(props.value, next)}
      />
    )
  }
})

const sliderEntry = createA2uiRegistryEntry({
  name: 'Slider',
  accessibility: [controlLabelRule({ alternatives: ['accessibility.label'] })],
  component: [Field, Slider],
  schema: basicSchema('Slider'),
  description: basicDescription('Slider'),
  adapter(props, context) {
    const label = resolveControlLabel(props, context.node.componentId)
    const error = readValidationError(props)
    const min = typeof props.min === 'number' && Number.isFinite(props.min) ? props.min : 0
    const rawMax = typeof props.max === 'number' && Number.isFinite(props.max) ? props.max : 100
    const max = rawMax >= min ? rawMax : min
    const rawValue = unwrapNumber(props.value) ?? min
    const value = Math.min(max, Math.max(min, rawValue))
    const steps =
      typeof props.steps === 'number' && Number.isFinite(props.steps) && props.steps >= 1
        ? props.steps
        : undefined
    const step = steps && max > min ? (max - min) / steps : undefined

    return (
      <Field
        label={label.text}
        error={error}
        parts={label.srOnly ? SR_ONLY_LABEL_PARTS : undefined}
      >
        <Slider
          min={min}
          max={max}
          step={step}
          value={value}
          onValueChange={next => writeBinding(props.value, next)}
        />
      </Field>
    )
  }
})

function readAccessibility(props: Readonly<Record<string, unknown>>) {
  const value = props.accessibility
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined
}

const accessibleLabel = (props: Readonly<Record<string, unknown>>) =>
  unwrapString(readAccessibility(props)?.label)?.trim() || undefined

const isHiddenFromAssistiveTech = (props: Readonly<Record<string, unknown>>) =>
  unwrapBoolean(readAccessibility(props)?.hidden) === true

function rejectedUrlReporter(component: string, context: A2uiAdapterContext) {
  const nodeId = context.node.componentId
  return ({ url, prop }: A2uiRejectedUrl) =>
    context.reportDiagnostic?.({
      kind: 'stripped',
      code: 'UNSAFE_URL',
      nodeId,
      component,
      prop,
      received: url,
      used: undefined,
      reason: 'URL scheme or host URL policy rejected the URL.'
    })
}

const iconEntry = createA2uiRegistryEntry({
  name: 'Icon',
  accessibility: [],
  component: A2uiIcon,
  schema: basicSchema('Icon'),
  description: basicDescription('Icon'),
  adapter(props, context) {
    const raw = props.name instanceof ResolvedBinding ? props.name.value : props.name
    const record =
      raw && typeof raw === 'object' && !(props.name instanceof ResolvedBinding)
        ? (raw as Record<string, unknown>)
        : undefined
    const nodeId = context.node.componentId
    return (
      <A2uiIcon
        name={record ? undefined : raw}
        boundName={record && !('svgPath' in record) ? bindIconName(record, context) : undefined}
        svgPath={record ? unwrapString(record.svgPath)?.trim() : undefined}
        label={isHiddenFromAssistiveTech(props) ? undefined : accessibleLabel(props)}
        onMissing={name => context.reportDiagnostic?.(unknownIconDiagnostic(nodeId, name))}
      />
    )
  }
})

type IconDataContext = {
  resolveDynamicValue(value: unknown): unknown
  subscribeDynamicValue(
    value: unknown,
    onChange: (value: unknown) => void
  ): { readonly unsubscribe: () => void }
}

// web_core leaves a binding inside the Icon `name` union unresolved, so the icon follows it itself.
function bindIconName(
  binding: Record<string, unknown>,
  context: A2uiAdapterContext
): A2uiBoundValue | undefined {
  const data = (context.node.context as { dataContext?: IconDataContext } | undefined)?.dataContext
  if (!data) return undefined
  return {
    key: JSON.stringify(binding),
    read: () => data.resolveDynamicValue(binding),
    subscribe: onChange => data.subscribeDynamicValue(binding, onChange).unsubscribe
  }
}

const imageEntry = createA2uiRegistryEntry({
  name: 'Image',
  accessibility: [imageAltRule()],
  component: A2uiImage,
  schema: basicSchema('Image'),
  description: basicDescription('Image'),
  adapter(props, context) {
    const alt = isHiddenFromAssistiveTech(props)
      ? ''
      : unwrapString(props.description)?.trim() || accessibleLabel(props) || ''
    return (
      <A2uiImage
        url={unwrapString(props.url)?.trim()}
        alt={alt}
        fit={typeof props.fit === 'string' ? props.fit : undefined}
        variant={typeof props.variant === 'string' ? props.variant : undefined}
        onRejectedUrl={rejectedUrlReporter('Image', context)}
      />
    )
  }
})

const videoEntry = createA2uiRegistryEntry({
  name: 'Video',
  accessibility: [mediaNameRule({ names: ['accessibility.label'] })],
  component: A2uiVideo,
  schema: basicSchema('Video'),
  description: basicDescription('Video'),
  adapter(props, context) {
    return (
      <A2uiVideo
        url={unwrapString(props.url)?.trim()}
        posterUrl={unwrapString(props.posterUrl)?.trim()}
        label={accessibleLabel(props)}
        onRejectedUrl={rejectedUrlReporter('Video', context)}
      />
    )
  }
})

const audioPlayerEntry = createA2uiRegistryEntry({
  name: 'AudioPlayer',
  accessibility: [mediaNameRule({ names: ['description', 'accessibility.label'] })],
  component: A2uiAudioPlayer,
  schema: basicSchema('AudioPlayer'),
  description: basicDescription('AudioPlayer'),
  adapter(props, context) {
    return (
      <A2uiAudioPlayer
        url={unwrapString(props.url)?.trim()}
        description={unwrapString(props.description)?.trim() || undefined}
        label={accessibleLabel(props)}
        onRejectedUrl={rejectedUrlReporter('AudioPlayer', context)}
      />
    )
  }
})

const dateTimeInputEntry = createA2uiRegistryEntry({
  name: 'DateTimeInput',
  accessibility: [controlLabelRule({ alternatives: ['accessibility.label'] })],
  component: [Field, Input],
  schema: basicSchema('DateTimeInput'),
  description: basicDescription('DateTimeInput'),
  adapter(props, context) {
    const label = resolveControlLabel(props, context.node.componentId)
    const enableDate = unwrapBoolean(props.enableDate) === true
    const enableTime = unwrapBoolean(props.enableTime) === true
    const type: DateTimeInputType =
      enableDate && enableTime ? 'datetime-local' : enableTime ? 'time' : 'date'
    const current = unwrapString(props.value) ?? ''
    const bound = (raw: unknown, edge: 'min' | 'max') =>
      toNativeBound(unwrapString(raw) ?? '', type, edge)

    return (
      <Field
        label={label.text}
        error={readValidationError(props)}
        parts={label.srOnly ? SR_ONLY_LABEL_PARTS : undefined}
      >
        <Input
          type={type}
          value={toNativeDateTime(current, type)}
          min={bound(props.min, 'min')}
          max={bound(props.max, 'max')}
          onChange={event =>
            writeBinding(props.value, fromNativeDateTime(event.currentTarget.value, type, current))
          }
        />
      </Field>
    )
  }
})

/**
 * Radiant's built-in A2UI 1.0 component registry.
 * Generated catalog JSON (`src/a2ui/catalog.json`) is derived directly from this registry.
 */
export const radiantA2uiRegistry = createA2uiRegistry({
  catalogId: A2UI_BASIC_CATALOG_ID,
  title: 'Radiant A2UI 1.0 Catalog',
  description:
    'A2UI 1.0 catalog generated from Radiant registry entries backed by @cognitap/radiant/catalog.',
  instructions: basicCatalog.instructions,
  entries: [
    columnEntry,
    textEntry,
    textFieldEntry,
    checkBoxEntry,
    choicePickerEntry,
    sliderEntry,
    buttonEntry,
    iconEntry,
    imageEntry,
    videoEntry,
    audioPlayerEntry,
    dateTimeInputEntry
  ]
})
