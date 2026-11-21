import { Fragment, type ChangeEvent } from 'react'
import {
  isComponentNode,
  isWritable,
  ResolvedBinding,
  type ComponentNode,
  type NodeAction
} from '@a2ui/web_core/resolution'
import { Button, type ButtonVariant } from '../components/Button/Button.js'
import { Field } from '../components/Field/Field.js'
import { Input } from '../components/Input/Input.js'
import { Textarea } from '../components/Textarea/Textarea.js'
import { radiantCatalog } from '../catalog/index.js'
import {
  A2UI_BASIC_CATALOG_ID,
  generateA2uiCatalogs,
  type A2uiJsonSchema
} from './catalogGenerator.js'
import { createA2uiRegistry, createA2uiRegistryEntry } from './registry.js'

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
  component: 'div',
  schema: basicSchema('Column'),
  description: radiantCatalog.entries.Column.description,
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
  component: 'p',
  schema: basicSchema('Text'),
  description: radiantCatalog.entries.Text.description,
  adapter(props, context) {
    const text = unwrapDisplayText(props.text)
    const variant = props.variant === 'caption' ? 'caption' : 'body'
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
          className="text-[length:var(--rad-typography-roles-ui-supporting-size,0.8125rem)] leading-[var(--rad-typography-roles-ui-supporting-line-height,1.4)] [color:var(--rad-color-muted-foreground,oklch(0.45_0.01_286))]"
        >
          {text}
        </span>
      )
    }
    return (
      <p
        data-slot="a2ui-text"
        data-variant="body"
        className="m-0 text-[length:var(--rad-typography-roles-ui-body-size,1rem)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)] [color:var(--rad-color-foreground,oklch(0.21_0.006_286))]"
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
  component: [Field, Input, Textarea],
  schema: basicSchema('TextField'),
  description: radiantCatalog.entries.TextField.description,
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
  component: Button,
  schema: basicSchema('Button'),
  description: radiantCatalog.entries.Button.description,
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

/**
 * Radiant's built-in A2UI 1.0 component registry.
 * Generated catalog JSON (`src/a2ui/catalog.json`) is derived directly from this registry.
 */
export const radiantA2uiRegistry = createA2uiRegistry({
  catalogId: A2UI_BASIC_CATALOG_ID,
  title: 'Radiant A2UI 1.0 Catalog',
  description:
    'A2UI 1.0 catalog generated from Radiant registry entries backed by @cognitap/radiant/catalog.',
  entries: [columnEntry, textEntry, textFieldEntry, buttonEntry]
})
