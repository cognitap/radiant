import {
  assertValidCatalog,
  describeCatalogEntry,
  renderCatalogInstructions,
  type Catalog,
  type CatalogBindingValueType,
  type CatalogEntry,
  type CatalogJsonPrimitive,
  type CatalogJsonSchema,
  type CatalogSlotConstraint
} from '../catalog/index.js'

export const A2UI_PROTOCOL_VERSION = '1.0'
export const A2UI_BASIC_CATALOG_ID =
  'https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json'
export const RADIANT_A2UI_EXTENSION_CATALOG_ID =
  'https://radiant-docs.pages.dev/a2ui/v1_0/extension_catalog.json'

const COMMON = 'common_types.json#/$defs/'

export type A2uiJsonSchema = { readonly [keyword: string]: unknown }

export type A2uiCatalogDocument = {
  readonly $schema: 'https://json-schema.org/draft/2020-12/schema'
  readonly $id: string
  readonly catalogId: string
  readonly protocolVersion: typeof A2UI_PROTOCOL_VERSION
  readonly title: string
  readonly description: string
  /** Catalog-wide design rules for agents. */
  readonly instructions?: string
  readonly components: Readonly<Record<string, A2uiJsonSchema>>
  readonly functions: Readonly<Record<string, A2uiJsonSchema>>
  readonly $defs: Readonly<Record<string, A2uiJsonSchema>>
}

export type GeneratedA2uiCatalogs = {
  readonly basic: A2uiCatalogDocument
  readonly extension: A2uiCatalogDocument
}

/**
 * How one A2UI wire property maps onto the canonical entry it renders.
 * `values` maps each A2UI enum value to the canonical value it renders as.
 * `spec` carries a wire shape the A2UI specification fixes, still tied to its canonical sources.
 */
type PropMapping =
  | {
      readonly from: 'prop'
      readonly source: string
      readonly values?: Readonly<Record<string, string>>
      readonly default?: CatalogJsonPrimitive
      readonly dynamic?: boolean
    }
  | { readonly from: 'binding'; readonly source: string }
  | { readonly from: 'slot'; readonly source: string }
  | { readonly from: 'action'; readonly source: string }
  | { readonly from: 'spec'; readonly sources: readonly string[]; readonly schema: A2uiJsonSchema }

type BasicProjection = {
  readonly a2uiName: string
  readonly sourceEntry: string
  readonly checkable?: boolean
  readonly required: readonly string[]
  readonly props: Readonly<Record<string, PropMapping>>
}

type ExtensionProjection = {
  readonly a2uiName: string
  readonly sourceEntry: string
  readonly description?: string
  readonly omit?: readonly string[]
  readonly bindingValueTypes?: Readonly<Record<string, CatalogBindingValueType>>
}

const prop = (
  source: string,
  options: Omit<Extract<PropMapping, { from: 'prop' }>, 'from' | 'source'> = {}
): PropMapping => ({ from: 'prop', source, ...options })
const dynamicProp = (source: string): PropMapping => ({ from: 'prop', source, dynamic: true })
const binding = (source: string): PropMapping => ({ from: 'binding', source })
const slot = (source: string): PropMapping => ({ from: 'slot', source })
const action = (source: string): PropMapping => ({ from: 'action', source })
const spec = (sources: readonly string[], schema: A2uiJsonSchema): PropMapping => ({
  from: 'spec',
  sources,
  schema
})

const A2UI_ICON_NAMES = [
  'accountCircle',
  'add',
  'arrowBack',
  'arrowForward',
  'attachFile',
  'calendarToday',
  'call',
  'camera',
  'check',
  'close',
  'delete',
  'download',
  'edit',
  'event',
  'error',
  'fastForward',
  'favorite',
  'favoriteOff',
  'folder',
  'help',
  'home',
  'info',
  'locationOn',
  'lock',
  'lockOpen',
  'mail',
  'menu',
  'moreVert',
  'moreHoriz',
  'notificationsOff',
  'notifications',
  'pause',
  'payment',
  'person',
  'phone',
  'photo',
  'play',
  'print',
  'refresh',
  'rewind',
  'search',
  'send',
  'settings',
  'share',
  'shoppingCart',
  'skipNext',
  'skipPrevious',
  'star',
  'starHalf',
  'starOff',
  'stop',
  'upload',
  'visibility',
  'visibilityOff',
  'volumeDown',
  'volumeMute',
  'volumeOff',
  'volumeUp',
  'warning'
] as const

const isoBound = (description: string): A2uiJsonSchema => ({
  description,
  allOf: [
    { $ref: `${COMMON}DynamicString` },
    {
      if: { type: 'string' },
      // oxlint-disable-next-line unicorn/no-thenable -- JSON Schema conditional keyword, never awaited.
      then: { oneOf: [{ format: 'date' }, { format: 'time' }, { format: 'date-time' }] }
    }
  ]
})

const JUSTIFY_VALUES = {
  start: 'start',
  center: 'center',
  end: 'end',
  spaceBetween: 'between',
  spaceAround: 'around',
  spaceEvenly: 'evenly',
  stretch: 'stretch'
}

// Each component matches the A2UI 1.0 basic catalog; tests/catalog.test.mjs checks it against the spec copy.
const BASIC_PROJECTIONS: readonly BasicProjection[] = [
  {
    a2uiName: 'Text',
    sourceEntry: 'Text',
    required: ['text'],
    props: {
      text: binding('text'),
      variant: prop('variant', { values: { caption: 'caption', body: 'body' } })
    }
  },
  {
    a2uiName: 'Image',
    sourceEntry: 'Image',
    required: ['url'],
    props: {
      url: binding('url'),
      description: dynamicProp('alt'),
      fit: prop('fit', {
        values: {
          contain: 'contain',
          cover: 'cover',
          fill: 'fill',
          none: 'none',
          scaleDown: 'scale-down'
        },
        default: 'fill'
      }),
      variant: prop('usage')
    }
  },
  {
    a2uiName: 'Icon',
    sourceEntry: 'Icon',
    required: ['name'],
    props: {
      name: spec(['name'], {
        description: 'A2UI icon name, custom SVG path, or bound icon name.',
        oneOf: [
          { type: 'string', enum: A2UI_ICON_NAMES },
          {
            type: 'object',
            properties: { svgPath: { $ref: `${COMMON}DynamicString` } },
            required: ['svgPath'],
            additionalProperties: false
          },
          { $ref: `${COMMON}DataBinding` }
        ]
      })
    }
  },
  {
    a2uiName: 'Video',
    sourceEntry: 'Video',
    required: ['url'],
    props: { url: binding('url'), posterUrl: dynamicProp('poster') }
  },
  {
    a2uiName: 'AudioPlayer',
    sourceEntry: 'AudioPlayer',
    required: ['url'],
    props: { url: binding('url'), description: dynamicProp('description') }
  },
  {
    a2uiName: 'Row',
    sourceEntry: 'Row',
    required: ['children'],
    props: {
      children: slot('children'),
      justify: prop('justify', { values: JUSTIFY_VALUES }),
      align: prop('align')
    }
  },
  {
    a2uiName: 'Column',
    sourceEntry: 'Column',
    required: ['children'],
    props: {
      children: slot('children'),
      justify: prop('justify', { values: JUSTIFY_VALUES }),
      align: prop('align')
    }
  },
  {
    a2uiName: 'List',
    sourceEntry: 'List',
    required: ['children'],
    props: { children: slot('children'), direction: prop('direction'), align: prop('align') }
  },
  { a2uiName: 'Card', sourceEntry: 'Card', required: ['child'], props: { child: slot('child') } },
  {
    a2uiName: 'Tabs',
    sourceEntry: 'Tabs',
    required: ['tabs'],
    props: {
      tabs: spec(['tabs', 'panels'], {
        type: 'array',
        description: 'Tabs, each pairing a title with the panel component it shows.',
        minItems: 1,
        items: {
          type: 'object',
          properties: {
            title: { $ref: `${COMMON}DynamicString` },
            child: { $ref: `${COMMON}Child` }
          },
          required: ['title', 'child'],
          additionalProperties: false
        }
      })
    }
  },
  {
    a2uiName: 'Modal',
    sourceEntry: 'Modal',
    required: ['trigger', 'content'],
    props: { trigger: slot('trigger'), content: slot('content') }
  },
  {
    a2uiName: 'Divider',
    sourceEntry: 'Divider',
    required: [],
    props: { axis: prop('orientation') }
  },
  {
    a2uiName: 'Button',
    sourceEntry: 'Button',
    checkable: true,
    required: ['child', 'action'],
    props: {
      child: slot('child'),
      variant: prop('variant', {
        values: { default: 'soft', primary: 'solid', borderless: 'ghost' },
        default: 'default'
      }),
      action: action('action')
    }
  },
  {
    a2uiName: 'TextField',
    sourceEntry: 'TextField',
    checkable: true,
    required: ['label', 'value'],
    props: {
      label: dynamicProp('label'),
      value: binding('value'),
      placeholder: dynamicProp('placeholder'),
      variant: prop('kind', {
        values: { longText: 'long', number: 'number', shortText: 'short', obscured: 'password' }
      })
    }
  },
  {
    a2uiName: 'CheckBox',
    sourceEntry: 'Checkbox',
    checkable: true,
    required: ['label', 'value'],
    props: { label: dynamicProp('label'), value: binding('checked') }
  },
  {
    a2uiName: 'ChoicePicker',
    sourceEntry: 'Choice',
    checkable: true,
    required: ['options', 'value'],
    props: {
      label: dynamicProp('label'),
      variant: prop('selection', {
        values: { multipleSelection: 'multiple', mutuallyExclusive: 'single' }
      }),
      options: spec(['options'], {
        type: 'array',
        description: 'Selectable choices presented to the user.',
        items: {
          type: 'object',
          properties: {
            label: { $ref: `${COMMON}DynamicString` },
            value: { type: 'string' }
          },
          required: ['label', 'value'],
          additionalProperties: false
        }
      }),
      value: binding('value'),
      displayStyle: prop('presentation', {
        values: { checkbox: 'list', chips: 'chips' },
        default: 'checkbox'
      }),
      filterable: prop('searchable')
    }
  },
  {
    a2uiName: 'Slider',
    sourceEntry: 'Slider',
    checkable: true,
    required: ['value', 'max'],
    props: {
      label: dynamicProp('label'),
      min: prop('min', { default: 0 }),
      max: prop('max'),
      value: binding('value'),
      steps: spec(['step'], {
        type: 'integer',
        minimum: 1,
        description: 'Number of discrete divisions; the renderer derives the canonical step size.'
      })
    }
  },
  {
    a2uiName: 'DateTimeInput',
    sourceEntry: 'DateTimeInput',
    checkable: true,
    required: ['value'],
    props: {
      value: binding('value'),
      enableDate: prop('enableDate', { default: false }),
      enableTime: prop('enableTime'),
      min: spec(['min'], isoBound('Minimum allowed ISO 8601 date or time.')),
      max: spec(['max'], isoBound('Maximum allowed ISO 8601 date or time.')),
      label: dynamicProp('label')
    }
  }
]

const EXTENSION_PROJECTIONS: readonly ExtensionProjection[] = [
  {
    a2uiName: 'Select',
    sourceEntry: 'Choice',
    description: 'Single-value dropdown selection backed by Radiant Select.',
    omit: ['selection', 'presentation', 'searchable'],
    bindingValueTypes: { value: 'string' }
  },
  {
    a2uiName: 'Combobox',
    sourceEntry: 'Choice',
    description: 'Filterable dropdown selection backed by Radiant Combobox.',
    omit: ['presentation', 'searchable']
  },
  {
    a2uiName: 'RadioGroup',
    sourceEntry: 'Choice',
    description: 'Mutually exclusive radio options backed by Radiant RadioGroup.',
    omit: ['selection', 'presentation', 'searchable', 'placeholder'],
    bindingValueTypes: { value: 'string' }
  },
  { a2uiName: 'Switch', sourceEntry: 'Switch' },
  {
    a2uiName: 'Textarea',
    sourceEntry: 'TextField',
    description: 'Multi-line text input backed by Radiant Textarea.',
    omit: ['kind']
  },
  { a2uiName: 'Alert', sourceEntry: 'Alert' },
  { a2uiName: 'Badge', sourceEntry: 'Badge' },
  { a2uiName: 'Progress', sourceEntry: 'Progress' },
  { a2uiName: 'Accordion', sourceEntry: 'Accordion' },
  { a2uiName: 'Table', sourceEntry: 'Table' },
  { a2uiName: 'Toast', sourceEntry: 'Toast' }
]

const DYNAMIC_REF_BY_BINDING_TYPE: Record<CatalogBindingValueType, string> = {
  string: `${COMMON}DynamicString`,
  number: `${COMMON}DynamicNumber`,
  boolean: `${COMMON}DynamicBoolean`,
  'string[]': `${COMMON}DynamicStringList`,
  'object[]': `${COMMON}DynamicValue`
}

function fail(component: string, message: string): never {
  throw new TypeError(`Cannot generate A2UI component "${component}": ${message}`)
}

function withDescription(schema: A2uiJsonSchema, description: string | undefined): A2uiJsonSchema {
  return description === undefined ? schema : { ...schema, description }
}

function dynamicRefForSchema(component: string, schema: CatalogJsonSchema): string {
  switch (schema.type) {
    case 'string':
      return `${COMMON}DynamicString`
    case 'number':
    case 'integer':
      return `${COMMON}DynamicNumber`
    case 'boolean':
      return `${COMMON}DynamicBoolean`
    case 'array':
      if (schema.items?.type === 'string') return `${COMMON}DynamicStringList`
  }
  return fail(component, `prop type ${JSON.stringify(schema.type)} has no A2UI dynamic type.`)
}

function slotSchema(slotConstraint: CatalogSlotConstraint): A2uiJsonSchema {
  const ref = slotConstraint.cardinality === 'single' ? 'Child' : 'ChildList'
  return { $ref: `${COMMON}${ref}`, description: slotConstraint.description }
}

function hasSource(entry: CatalogEntry, source: string): boolean {
  return [entry.propsSchema.properties, entry.slots, entry.bindings, entry.actions].some(names =>
    Object.hasOwn(names, source)
  )
}

function lookup<T>(
  component: string,
  kind: string,
  names: Readonly<Record<string, T>>,
  source: string
): T {
  if (!Object.hasOwn(names, source)) fail(component, `canonical ${kind} "${source}" is missing.`)
  return names[source] as T
}

function projectMappedProp(
  component: string,
  entry: CatalogEntry,
  mapping: PropMapping
): A2uiJsonSchema {
  switch (mapping.from) {
    case 'binding': {
      const bound = lookup(component, 'binding', entry.bindings, mapping.source)
      return { $ref: DYNAMIC_REF_BY_BINDING_TYPE[bound.valueType], description: bound.description }
    }
    case 'slot':
      return slotSchema(lookup(component, 'slot', entry.slots, mapping.source))
    case 'action': {
      const shape = lookup(component, 'action', entry.actions, mapping.source)
      return { $ref: `${COMMON}Action`, description: shape.description }
    }
    case 'spec':
      for (const source of mapping.sources) {
        if (!hasSource(entry, source)) fail(component, `canonical source "${source}" is missing.`)
      }
      return structuredClone(mapping.schema)
    case 'prop': {
      const schema = lookup(component, 'prop', entry.propsSchema.properties, mapping.source)
      if (mapping.dynamic) {
        return {
          $ref: dynamicRefForSchema(component, schema),
          description: schema.description
        }
      }
      if (!mapping.values) {
        const projected: Record<string, unknown> = structuredClone(schema)
        if (mapping.default !== undefined) projected.default = mapping.default
        return projected
      }
      const canonicalValues = new Set(schema.enum ?? [])
      for (const [wireValue, canonicalValue] of Object.entries(mapping.values)) {
        if (!canonicalValues.has(canonicalValue)) {
          fail(
            component,
            `"${wireValue}" maps to "${canonicalValue}", which canonical prop "${mapping.source}" does not allow.`
          )
        }
      }
      const reverseDefault = Object.entries(mapping.values).find(
        ([, canonicalValue]) => canonicalValue === schema.default
      )?.[0]
      const wireDefault = mapping.default ?? reverseDefault
      return withDescription(
        {
          type: 'string',
          enum: Object.keys(mapping.values),
          ...(wireDefault === undefined ? {} : { default: wireDefault })
        },
        schema.description
      )
    }
  }
}

function componentSchema(
  a2uiName: string,
  description: string,
  properties: Record<string, A2uiJsonSchema>,
  required: readonly string[],
  checkable: boolean
): A2uiJsonSchema {
  const body = {
    type: 'object',
    properties: {
      component: { const: a2uiName },
      ...properties,
      weight: { $ref: '#/$defs/Weight' }
    },
    required: ['component', ...required]
  }
  if (!checkable) return { description, ...body }
  return { type: 'object', description, allOf: [{ $ref: `${COMMON}Checkable` }, body] }
}

function projectBasic(entry: CatalogEntry, projection: BasicProjection): A2uiJsonSchema {
  const properties: Record<string, A2uiJsonSchema> = {}
  for (const [wireName, mapping] of Object.entries(projection.props)) {
    properties[wireName] = projectMappedProp(projection.a2uiName, entry, mapping)
  }
  for (const requiredProp of projection.required) {
    if (!Object.hasOwn(properties, requiredProp)) {
      fail(projection.a2uiName, `required prop "${requiredProp}" is not mapped.`)
    }
  }
  return componentSchema(
    projection.a2uiName,
    describeCatalogEntry(entry),
    properties,
    projection.required,
    projection.checkable ?? false
  )
}

function projectExtension(entry: CatalogEntry, projection: ExtensionProjection): A2uiJsonSchema {
  const omit = new Set(projection.omit ?? [])
  const properties: Record<string, A2uiJsonSchema> = {}
  const required: string[] = []
  let checkable = false

  for (const [propName, propSchema] of Object.entries(entry.propsSchema.properties)) {
    if (omit.has(propName)) continue
    // A binding that shares a prop's name makes that prop bindable without losing its constraints.
    const bound = Object.hasOwn(entry.bindings, propName)
    if (bound) {
      const { description, ...literal } = structuredClone(propSchema)
      properties[propName] = withDescription(
        {
          oneOf: [literal, { $ref: `${COMMON}DataBinding` }, { $ref: `${COMMON}FunctionCall` }]
        },
        description
      )
    } else {
      properties[propName] = structuredClone(propSchema)
    }
  }
  for (const requiredProp of entry.propsSchema.required ?? []) {
    if (!omit.has(requiredProp)) required.push(requiredProp)
  }
  for (const [bindingName, bound] of Object.entries(entry.bindings)) {
    if (omit.has(bindingName)) continue
    if (bound.validatable) checkable = true
    if (Object.hasOwn(properties, bindingName)) continue
    const valueType = projection.bindingValueTypes?.[bindingName] ?? bound.valueType
    properties[bindingName] = {
      $ref: DYNAMIC_REF_BY_BINDING_TYPE[valueType],
      description: bound.description
    }
  }
  for (const [slotName, slotConstraint] of Object.entries(entry.slots)) {
    properties[slotName] = slotSchema(slotConstraint)
    if (slotConstraint.required) required.push(slotName)
  }
  for (const [actionName, shape] of Object.entries(entry.actions)) {
    properties[actionName] = { $ref: `${COMMON}Action`, description: shape.description }
  }

  return componentSchema(
    projection.a2uiName,
    projection.description ?? describeCatalogEntry(entry),
    properties,
    required,
    checkable
  )
}

function catalogDocument(
  catalogId: string,
  title: string,
  description: string,
  components: Record<string, A2uiJsonSchema>
): A2uiCatalogDocument {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: catalogId,
    catalogId,
    protocolVersion: A2UI_PROTOCOL_VERSION,
    title,
    description,
    instructions: renderCatalogInstructions(),
    components,
    functions: {},
    $defs: {
      anyComponent: {
        oneOf: Object.keys(components).map(name => ({ $ref: `#/components/${name}` })),
        discriminator: { propertyName: 'component' }
      },
      anyFunction: { not: {} },
      Weight: {
        type: 'number',
        description:
          'Relative flex growth of this component inside a Row or Column. Set it only on direct children of a Row or Column.'
      }
    }
  }
}

/**
 * Generates the A2UI 1.0 basic catalog and the Radiant extension catalog from a canonical
 * Radiant catalog. Entries added through `extendCatalog` join the extension catalog.
 * Neither document defines functions yet.
 */
export function generateA2uiCatalogs(catalog: Catalog): GeneratedA2uiCatalogs {
  assertValidCatalog(catalog)

  const sourceFor = (a2uiName: string, sourceEntry: string): CatalogEntry =>
    catalog.entries[sourceEntry] ?? fail(a2uiName, `missing canonical entry "${sourceEntry}".`)

  const basicComponents: Record<string, A2uiJsonSchema> = {}
  const extensionComponents: Record<string, A2uiJsonSchema> = {}
  const mappedSources = new Set<string>()

  for (const projection of BASIC_PROJECTIONS) {
    const entry = sourceFor(projection.a2uiName, projection.sourceEntry)
    basicComponents[projection.a2uiName] = projectBasic(entry, projection)
    mappedSources.add(projection.sourceEntry)
  }
  for (const projection of EXTENSION_PROJECTIONS) {
    const entry = sourceFor(projection.a2uiName, projection.sourceEntry)
    extensionComponents[projection.a2uiName] = projectExtension(entry, projection)
    mappedSources.add(projection.sourceEntry)
  }

  for (const [entryName, entry] of Object.entries(catalog.entries)) {
    if (mappedSources.has(entryName)) continue
    if (
      Object.hasOwn(basicComponents, entryName) ||
      Object.hasOwn(extensionComponents, entryName)
    ) {
      fail(entryName, 'a custom entry cannot reuse the name of a generated A2UI component.')
    }
    extensionComponents[entryName] = projectExtension(entry, {
      a2uiName: entryName,
      sourceEntry: entryName
    })
  }

  const generatedFrom = `Generated from canonical catalog "${catalog.id}" (${catalog.version}).`
  return {
    basic: catalogDocument(
      A2UI_BASIC_CATALOG_ID,
      'A2UI Basic Catalog',
      generatedFrom,
      basicComponents
    ),
    extension: catalogDocument(
      catalog.extends
        ? `${RADIANT_A2UI_EXTENSION_CATALOG_ID}#${encodeURIComponent(catalog.id)}`
        : RADIANT_A2UI_EXTENSION_CATALOG_ID,
      'Radiant A2UI Extension Catalog',
      `${generatedFrom} Use alongside the A2UI basic catalog.`,
      extensionComponents
    )
  }
}
