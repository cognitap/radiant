import {
  assertValidCatalog,
  type Catalog,
  type CatalogActionShape,
  type CatalogBindingValueType,
  type CatalogEntry,
  type CatalogJsonSchema,
  type CatalogSlotConstraint
} from '../catalog/index.js'

export const A2UI_BASIC_CATALOG_ID = 'https://a2ui.org/specification/v1_0/basic_catalog.json'
export const RADIANT_A2UI_EXTENSION_CATALOG_ID =
  'https://radiant-docs.pages.dev/a2ui/v1_0/extension_catalog.json'

export type A2uiCatalogDocument = {
  readonly $schema: 'https://json-schema.org/draft/2020-12/schema'
  readonly catalogId: string
  readonly title: string
  readonly description: string
  readonly extends?: string
  readonly components: Readonly<Record<string, CatalogJsonSchema>>
  readonly $defs: Readonly<Record<string, CatalogJsonSchema>>
}

export type GeneratedA2uiCatalogs = {
  readonly basic: A2uiCatalogDocument
  readonly extension: A2uiCatalogDocument
}

type ProjectionSpec = {
  readonly a2uiName: string
  readonly sourceEntry: string
  readonly description?: string
  readonly omitProps?: readonly string[]
}

const BASIC_PROJECTIONS: readonly ProjectionSpec[] = [
  { a2uiName: 'Text', sourceEntry: 'Text' },
  { a2uiName: 'Image', sourceEntry: 'Image' },
  { a2uiName: 'Icon', sourceEntry: 'Icon' },
  { a2uiName: 'Video', sourceEntry: 'Video' },
  { a2uiName: 'AudioPlayer', sourceEntry: 'AudioPlayer' },
  { a2uiName: 'Row', sourceEntry: 'Row' },
  { a2uiName: 'Column', sourceEntry: 'Column' },
  { a2uiName: 'List', sourceEntry: 'List' },
  { a2uiName: 'Card', sourceEntry: 'Card' },
  { a2uiName: 'Tabs', sourceEntry: 'Tabs' },
  { a2uiName: 'Divider', sourceEntry: 'Divider' },
  { a2uiName: 'Modal', sourceEntry: 'Modal' },
  { a2uiName: 'Button', sourceEntry: 'Button' },
  { a2uiName: 'TextField', sourceEntry: 'TextField' },
  { a2uiName: 'CheckBox', sourceEntry: 'Checkbox' },
  { a2uiName: 'ChoicePicker', sourceEntry: 'Choice' },
  { a2uiName: 'Slider', sourceEntry: 'Slider' },
  { a2uiName: 'DateTimeInput', sourceEntry: 'DateTimeInput' }
]

const EXTENSION_PROJECTIONS: readonly ProjectionSpec[] = [
  {
    a2uiName: 'Select',
    sourceEntry: 'Choice',
    description: 'Single-value dropdown selection backed by Radiant Select.',
    omitProps: ['selection', 'presentation', 'searchable']
  },
  {
    a2uiName: 'Combobox',
    sourceEntry: 'Choice',
    description: 'Filterable dropdown selection backed by Radiant Combobox.',
    omitProps: ['presentation', 'searchable']
  },
  {
    a2uiName: 'RadioGroup',
    sourceEntry: 'Choice',
    description: 'Mutually exclusive radio options backed by Radiant RadioGroup.',
    omitProps: ['selection', 'presentation', 'searchable', 'placeholder']
  },
  { a2uiName: 'Switch', sourceEntry: 'Switch' },
  {
    a2uiName: 'Textarea',
    sourceEntry: 'TextField',
    description: 'Multi-line text input backed by Radiant Textarea.',
    omitProps: ['kind']
  },
  { a2uiName: 'Alert', sourceEntry: 'Alert' },
  { a2uiName: 'Badge', sourceEntry: 'Badge' },
  { a2uiName: 'Progress', sourceEntry: 'Progress' },
  { a2uiName: 'Accordion', sourceEntry: 'Accordion' },
  { a2uiName: 'Table', sourceEntry: 'Table' },
  { a2uiName: 'Toast', sourceEntry: 'Toast' }
]

const A2UI_SHARED_DEFS: Readonly<Record<string, CatalogJsonSchema>> = {
  ComponentId: {
    type: 'string',
    minLength: 1,
    description: 'Identifier of another component node in the surface.'
  },
  ChildList: {
    description: 'Static list of child component IDs or a data-bound template.',
    oneOf: [
      {
        type: 'array',
        items: { $ref: '#/$defs/ComponentId' }
      },
      {
        type: 'object',
        additionalProperties: false,
        required: ['path', 'componentId'],
        properties: {
          path: { type: 'string', minLength: 1 },
          componentId: { $ref: '#/$defs/ComponentId' }
        }
      }
    ]
  },
  DataBinding: {
    type: 'object',
    additionalProperties: false,
    required: ['path'],
    properties: {
      path: { type: 'string', minLength: 1 }
    }
  },
  FunctionCall: {
    type: 'object',
    additionalProperties: false,
    required: ['call'],
    properties: {
      call: { type: 'string', minLength: 1 },
      args: { type: 'object' },
      returnType: {
        type: 'string',
        enum: ['string', 'number', 'boolean', 'array', 'object', 'any', 'void']
      }
    }
  },
  DynamicString: {
    oneOf: [{ type: 'string' }, { $ref: '#/$defs/DataBinding' }, { $ref: '#/$defs/FunctionCall' }]
  },
  DynamicNumber: {
    oneOf: [{ type: 'number' }, { $ref: '#/$defs/DataBinding' }, { $ref: '#/$defs/FunctionCall' }]
  },
  DynamicBoolean: {
    oneOf: [{ type: 'boolean' }, { $ref: '#/$defs/DataBinding' }, { $ref: '#/$defs/FunctionCall' }]
  },
  DynamicStringList: {
    oneOf: [
      { type: 'array', items: { type: 'string' } },
      { $ref: '#/$defs/DataBinding' },
      { $ref: '#/$defs/FunctionCall' }
    ]
  },
  DynamicObjectList: {
    oneOf: [
      { type: 'array', items: { type: 'object' } },
      { $ref: '#/$defs/DataBinding' },
      { $ref: '#/$defs/FunctionCall' }
    ]
  },
  CheckRule: {
    type: 'object',
    additionalProperties: false,
    required: ['condition', 'message'],
    properties: {
      condition: { $ref: '#/$defs/DynamicBoolean' },
      message: { type: 'string', minLength: 1 }
    }
  },
  Action: {
    oneOf: [
      {
        type: 'object',
        additionalProperties: false,
        required: ['event'],
        properties: {
          event: {
            type: 'object',
            additionalProperties: false,
            required: ['name'],
            properties: {
              name: { type: 'string', minLength: 1 },
              context: { type: 'object' }
            }
          }
        }
      },
      {
        type: 'object',
        additionalProperties: false,
        required: ['functionCall'],
        properties: {
          functionCall: { $ref: '#/$defs/FunctionCall' }
        }
      }
    ]
  }
}

const BINDING_REF_BY_TYPE: Record<CatalogBindingValueType, string> = {
  string: '#/$defs/DynamicString',
  number: '#/$defs/DynamicNumber',
  boolean: '#/$defs/DynamicBoolean',
  'string[]': '#/$defs/DynamicStringList',
  'object[]': '#/$defs/DynamicObjectList'
}

function projectSlot(slot: CatalogSlotConstraint): CatalogJsonSchema {
  if (slot.cardinality === 'single') {
    return {
      $ref: '#/$defs/ComponentId',
      description: slot.description
    }
  }
  return {
    $ref: '#/$defs/ChildList',
    description: slot.description
  }
}

function projectAction(action: CatalogActionShape): CatalogJsonSchema {
  return {
    $ref: '#/$defs/Action',
    description: action.description
  }
}

function projectEntry(entry: CatalogEntry, spec: ProjectionSpec): CatalogJsonSchema {
  const omit = new Set(spec.omitProps ?? [])
  const properties: Record<string, CatalogJsonSchema> = {
    id: { type: 'string', minLength: 1, description: 'Unique component ID within the surface.' },
    component: { const: spec.a2uiName, description: 'A2UI component discriminator.' },
    weight: {
      type: 'number',
      exclusiveMinimum: 0,
      description: 'Optional flex weight inside a Row or Column.'
    }
  }

  for (const [propName, propSchema] of Object.entries(entry.propsSchema.properties)) {
    if (omit.has(propName)) continue
    properties[propName] = structuredClone(propSchema)
  }

  let hasValidatableBinding = false
  for (const [bindingName, binding] of Object.entries(entry.bindings)) {
    if (omit.has(bindingName)) continue
    properties[bindingName] = {
      $ref: BINDING_REF_BY_TYPE[binding.valueType],
      description: binding.description
    }
    if (binding.validatable) hasValidatableBinding = true
  }
  if (hasValidatableBinding) {
    properties.checks = {
      type: 'array',
      items: { $ref: '#/$defs/CheckRule' },
      description: 'Client-side validation rules rendered as field errors.'
    }
  }

  const required = new Set<string>(['id', 'component'])
  for (const req of entry.propsSchema.required ?? []) {
    if (!omit.has(req) && Object.hasOwn(properties, req)) required.add(req)
  }

  for (const [slotName, slot] of Object.entries(entry.slots)) {
    properties[slotName] = projectSlot(slot)
    if (slot.required) required.add(slotName)
  }

  for (const [actionName, action] of Object.entries(entry.actions)) {
    properties[actionName] = projectAction(action)
  }

  return {
    type: 'object',
    description: spec.description ?? entry.description,
    additionalProperties: false,
    required: [...required],
    properties
  }
}

/**
 * Generates the A2UI 1.0 basic and Radiant extension catalog JSON Schema documents
 * directly from a canonical Radiant catalog. Any custom entries added via `extendCatalog`
 * are automatically included in the extension catalog.
 */
export function generateA2uiCatalogs(catalog: Catalog): GeneratedA2uiCatalogs {
  assertValidCatalog(catalog)

  const basicComponents: Record<string, CatalogJsonSchema> = {}
  const mappedSources = new Set<string>()

  for (const spec of BASIC_PROJECTIONS) {
    const entry = catalog.entries[spec.sourceEntry]
    if (!entry) {
      throw new TypeError(
        `Cannot generate A2UI basic component "${spec.a2uiName}": missing canonical entry "${spec.sourceEntry}".`
      )
    }
    basicComponents[spec.a2uiName] = projectEntry(entry, spec)
    mappedSources.add(spec.sourceEntry)
  }

  const extensionComponents: Record<string, CatalogJsonSchema> = {}
  for (const spec of EXTENSION_PROJECTIONS) {
    const entry = catalog.entries[spec.sourceEntry]
    if (!entry) {
      throw new TypeError(
        `Cannot generate A2UI extension component "${spec.a2uiName}": missing canonical entry "${spec.sourceEntry}".`
      )
    }
    extensionComponents[spec.a2uiName] = projectEntry(entry, spec)
    mappedSources.add(spec.sourceEntry)
  }

  for (const [entryName, entry] of Object.entries(catalog.entries)) {
    if (mappedSources.has(entryName)) continue
    extensionComponents[entryName] = projectEntry(entry, {
      a2uiName: entryName,
      sourceEntry: entryName
    })
  }

  return {
    basic: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      catalogId: A2UI_BASIC_CATALOG_ID,
      title: 'A2UI 1.0 Basic Catalog (Radiant)',
      description: `Generated from canonical catalog "${catalog.id}" (${catalog.version}).`,
      components: basicComponents,
      $defs: structuredClone(A2UI_SHARED_DEFS)
    },
    extension: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      catalogId: catalog.extends
        ? `${RADIANT_A2UI_EXTENSION_CATALOG_ID}#${encodeURIComponent(catalog.id)}`
        : RADIANT_A2UI_EXTENSION_CATALOG_ID,
      title: 'Radiant A2UI 1.0 Extension Catalog',
      description: `Generated from canonical catalog "${catalog.id}" (${catalog.version}).`,
      extends: A2UI_BASIC_CATALOG_ID,
      components: extensionComponents,
      $defs: structuredClone(A2UI_SHARED_DEFS)
    }
  }
}
