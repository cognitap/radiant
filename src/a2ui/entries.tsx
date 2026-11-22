'use client'

import {
  useContext,
  useId,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
  type Ref
} from 'react'
import {
  isComponentNode,
  isWritable,
  ResolvedBinding,
  type ComponentNode,
  type NodeAction
} from '@a2ui/web_core/resolution'
import { Button, type ButtonVariant } from '../components/Button/Button.js'
import { Card } from '../components/Card/Card.js'
import { Checkbox } from '../components/Checkbox/Checkbox.js'
import { CheckboxGroup } from '../components/CheckboxGroup/CheckboxGroup.js'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '../components/Dialog/Dialog.js'
import { Field } from '../components/Field/Field.js'
import { Input } from '../components/Input/Input.js'
import { Radio, RadioGroup } from '../components/RadioGroup/RadioGroup.js'
import { Separator } from '../components/Separator/Separator.js'
import { Slider } from '../components/Slider/Slider.js'
import { Stack, type StackAlign, type StackJustify } from '../components/Stack/Stack.js'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/Tabs/Tabs.js'
import { Textarea } from '../components/Textarea/Textarea.js'
import { ToggleGroup, ToggleGroupItem } from '../components/ToggleGroup/ToggleGroup.js'
import { radiantCatalog } from '../catalog/index.js'
import { humanizeNodeId } from '../catalog/coerce.js'
import { useLocale } from '../react/useLocale.js'
import type { Orientation } from '../presentation.js'
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
  mediaNameRule,
  modalTriggerRule,
  tabTitlesRule
} from './accessibilityRules.js'
import { unknownIconDiagnostic } from './coerce.js'
import { useSignalValue } from './useSignalValue.js'
import { A2uiModalTriggerContext, useA2uiLabels } from './surfaceContext.js'
import { A2UI_BASIC_CATALOG_REVISION } from './specRevision.js'
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
import { readA2uiValue, writeA2uiBinding } from './adapterValues.js'

export function unwrapDisplayText(value: unknown): string {
  const raw = readA2uiValue(value)
  if (typeof raw === 'string') return raw
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  if (typeof raw === 'boolean') return String(raw)
  return ''
}

export function unwrapString(value: unknown): string | undefined {
  const raw = readA2uiValue(value)
  return typeof raw === 'string' ? raw : undefined
}

export function unwrapBoolean(value: unknown): boolean | undefined {
  const raw = readA2uiValue(value)
  return typeof raw === 'boolean' ? raw : undefined
}

function unwrapNumber(value: unknown): number | undefined {
  const raw = readA2uiValue(value)
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined
}

export function unwrapStringList(value: unknown): string[] {
  const raw = readA2uiValue(value)
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string') : []
}

export function writeBinding(raw: unknown, nextValue: unknown) {
  writeA2uiBinding(raw, nextValue)
}

export function readValidationError(props: Readonly<Record<string, unknown>>): string | undefined {
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

const STACK_JUSTIFY: Readonly<Record<string, StackJustify>> = {
  start: 'start',
  center: 'center',
  end: 'end',
  spaceBetween: 'between',
  spaceAround: 'around',
  spaceEvenly: 'evenly',
  stretch: 'stretch'
}

const STACK_ALIGN: Readonly<Record<string, StackAlign>> = {
  start: 'start',
  center: 'center',
  end: 'end',
  stretch: 'stretch'
}

const ORIENTATION: Readonly<Record<string, Orientation>> = {
  horizontal: 'horizontal',
  vertical: 'vertical'
}

/** Looks a wire value up in a translation table; unknown values fall back instead of throwing. */
function translate<T>(table: Readonly<Record<string, T>>, value: unknown, fallback: T): T {
  return typeof value === 'string' && Object.hasOwn(table, value) ? table[value]! : fallback
}

function readChildNodes(value: unknown): ComponentNode[] {
  return Array.isArray(value)
    ? value.filter((child): child is ComponentNode => isComponentNode(child))
    : []
}

/** Wraps a Row or Column child in a box that grows by the child's positive `weight`. */
function A2uiFlexChild({
  node,
  flow,
  children
}: {
  readonly node: ComponentNode
  readonly flow: boolean
  readonly children: ReactNode
}) {
  const weight = useSignalValue(node.props)?.weight
  const grows = typeof weight === 'number' && Number.isFinite(weight) && weight > 0
  return (
    <div
      data-slot="a2ui-flex-item"
      // In a prose flow, Text items space as text and everything else as a component.
      data-rad-flow={flow && node.type === 'Text' ? 'text' : undefined}
      className="grid min-w-0"
      style={grows ? { flexGrow: weight, flexBasis: 0 } : undefined}
    >
      {children}
    </div>
  )
}

function flexEntry(name: 'Row' | 'Column', orientation: Orientation) {
  return createA2uiRegistryEntry({
    name,
    accessibility: [],
    component: Stack,
    schema: basicSchema(name),
    description: basicDescription(name),
    adapter(props, context) {
      // A prose surface's root Column is the reading flow; prose rhythm replaces the gap.
      const flow = name === 'Column' && context.flow === 'root'
      return (
        <Stack
          data-slot={`a2ui-${name.toLowerCase()}`}
          data-rad-prose={flow ? '' : undefined}
          className={flow ? 'gap-0' : undefined}
          orientation={orientation}
          justify={translate(STACK_JUSTIFY, props.justify, 'start')}
          align={translate(STACK_ALIGN, props.align, 'stretch')}
        >
          {readChildNodes(props.children).map(child => (
            <A2uiFlexChild
              key={child.id}
              node={child}
              flow={flow}
            >
              {context.renderNode(child, flow ? { flow: 'block' } : undefined)}
            </A2uiFlexChild>
          ))}
        </Stack>
      )
    }
  })
}

const rowEntry = flexEntry('Row', 'horizontal')
const columnEntry = flexEntry('Column', 'vertical')

const listEntry = createA2uiRegistryEntry({
  name: 'List',
  accessibility: [],
  component: Stack,
  schema: basicSchema('List'),
  description: basicDescription('List'),
  adapter(props, context) {
    // Stack renders a div host, so list semantics come from roles.
    return (
      <Stack
        data-slot="a2ui-list"
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
        role="list"
        orientation={translate(ORIENTATION, props.direction, 'vertical')}
        align={translate(STACK_ALIGN, props.align, 'stretch')}
      >
        {readChildNodes(props.children).map(child => (
          <div
            key={child.id}
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
            role="listitem"
            data-slot="a2ui-list-item"
            className="grid min-w-0"
          >
            {context.renderNode(child)}
          </div>
        ))}
      </Stack>
    )
  }
})

const cardEntry = createA2uiRegistryEntry({
  name: 'Card',
  accessibility: [],
  component: Card,
  schema: basicSchema('Card'),
  description: basicDescription('Card'),
  adapter(props, context) {
    return (
      <Card data-slot="a2ui-card">
        {isComponentNode(props.child) ? context.renderNode(props.child) : null}
      </Card>
    )
  }
})

const dividerEntry = createA2uiRegistryEntry({
  name: 'Divider',
  accessibility: [],
  component: Separator,
  schema: basicSchema('Divider'),
  description: basicDescription('Divider'),
  adapter(props) {
    return (
      <Separator
        data-slot="a2ui-divider"
        orientation={translate(ORIENTATION, props.axis, 'horizontal')}
      />
    )
  }
})

type A2uiTab = { readonly key: string; readonly title: string; readonly panel: ReactNode }

function readTabs(value: unknown, context: A2uiAdapterContext): readonly A2uiTab[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const tabs: A2uiTab[] = []
  value.forEach((tab: unknown, index) => {
    if (!tab || typeof tab !== 'object') return
    const record = tab as Record<string, unknown>
    const child = isComponentNode(record.child) ? record.child : undefined
    // Tabs are keyed by their panel component so reordering keeps selection and panel state.
    let key = child ? child.componentId : `#${index}`
    while (seen.has(key)) key = `${key}#${index}`
    seen.add(key)
    tabs.push({
      key,
      title: unwrapDisplayText(record.title),
      panel: child ? context.renderNode(child) : null
    })
  })
  return tabs
}

function A2uiTabs({ tabs }: { readonly tabs: readonly A2uiTab[] }) {
  const locale = useLocale()
  const [selected, setSelected] = useState<string | undefined>(undefined)
  const first = tabs[0]?.key
  const value = tabs.some(tab => tab.key === selected) ? selected : first
  if (value !== selected) setSelected(value)
  if (value === undefined) return null
  const format = new Intl.NumberFormat(locale)
  return (
    <Tabs
      data-slot="a2ui-tabs"
      value={value}
      onValueChange={setSelected}
    >
      <TabsList>
        {tabs.map((tab, index) => (
          <TabsTrigger
            key={tab.key}
            value={tab.key}
          >
            {tab.title || format.format(index + 1)}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map(tab => (
        <TabsContent
          key={tab.key}
          value={tab.key}
          keepMounted
        >
          {tab.panel}
        </TabsContent>
      ))}
    </Tabs>
  )
}

const tabsEntry = createA2uiRegistryEntry({
  name: 'Tabs',
  accessibility: [tabTitlesRule()],
  component: [Tabs, TabsList, TabsTrigger, TabsContent],
  schema: basicSchema('Tabs'),
  description: basicDescription('Tabs'),
  adapter(props, context) {
    return <A2uiTabs tabs={readTabs(props.tabs, context)} />
  }
})

function A2uiModal({
  trigger,
  triggerNodeId,
  content,
  fallbackName
}: {
  readonly trigger: ReactNode
  readonly triggerNodeId: string | undefined
  readonly content: ReactNode
  readonly fallbackName: string
}) {
  const triggerId = useId()
  const closeText = useA2uiLabels().modalClose?.trim()
  const triggerContext = useMemo(
    () => (triggerNodeId ? { nodeId: triggerNodeId, id: triggerId } : null),
    [triggerNodeId, triggerId]
  )
  return (
    <div
      data-slot="a2ui-modal-root"
      className="grid min-w-0"
    >
      <Dialog>
        <A2uiModalTriggerContext.Provider value={triggerContext}>
          {trigger}
        </A2uiModalTriggerContext.Provider>
        <DialogContent
          data-slot="a2ui-modal"
          aria-label={fallbackName}
          aria-labelledby={triggerId}
        >
          <Stack>
            {content}
            {closeText ? (
              <Stack
                orientation="horizontal"
                justify="end"
              >
                <DialogClose>{closeText}</DialogClose>
              </Stack>
            ) : null}
          </Stack>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const modalEntry = createA2uiRegistryEntry({
  name: 'Modal',
  accessibility: [modalTriggerRule()],
  component: [Dialog, DialogContent, DialogTrigger, DialogClose],
  schema: basicSchema('Modal'),
  description: basicDescription('Modal'),
  adapter(props, context) {
    return (
      <A2uiModal
        trigger={isComponentNode(props.trigger) ? context.renderNode(props.trigger) : null}
        triggerNodeId={isComponentNode(props.trigger) ? props.trigger.id : undefined}
        content={isComponentNode(props.content) ? context.renderNode(props.content) : null}
        fallbackName={humanizeNodeId(context.node.componentId)}
      />
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
    if (context.flow === 'block') {
      return (
        <p
          data-slot="a2ui-text"
          data-variant={variant}
          data-rad-text={variant === 'caption' ? 'prose-small' : 'prose-body'}
          className={`m-0 ${variant === 'caption' ? '[color:var(--rad-color-muted-foreground,oklch(0.45_0.01_286))]' : '[color:var(--rad-color-foreground,oklch(0.21_0.006_286))]'}${reserve}`}
        >
          {text}
        </p>
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

/** A Button that becomes its Modal's dialog trigger when it fills that Modal's `trigger` slot. */
function A2uiButton({
  ref,
  nodeId,
  variant,
  disabled,
  onClick,
  children
}: {
  ref?: Ref<HTMLButtonElement>
  nodeId: string
  variant: ButtonVariant
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  const trigger = useContext(A2uiModalTriggerContext)
  if (trigger?.nodeId === nodeId) {
    return (
      <DialogTrigger
        ref={ref}
        id={trigger.id}
        variant={variant}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </DialogTrigger>
    )
  }
  return (
    <Button
      ref={ref}
      variant={variant}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  )
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
      <A2uiButton
        nodeId={context.node.id}
        variant={variant}
        // A Button with failing `checks` stays disabled until they pass.
        disabled={props.isValid === false}
        onClick={() => {
          void action?.()
        }}
      >
        {childNode ? context.renderNode(childNode, { inline: true }) : null}
      </A2uiButton>
    )
  }
})

export function resolveControlLabel(
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

export const SR_ONLY_LABEL_PARTS = { label: { className: 'sr-only' } } as const

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
  description: `A2UI 1.0 catalog generated from Radiant registry entries backed by @cognitap/radiant/catalog, tested against @a2ui/web_core ${A2UI_BASIC_CATALOG_REVISION.webCore}.`,
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
    dateTimeInputEntry,
    rowEntry,
    listEntry,
    cardEntry,
    dividerEntry,
    tabsEntry,
    modalEntry
  ]
})
