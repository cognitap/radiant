import {
  assertValidCatalog,
  CATALOG_SPACING,
  describeCatalogEntry,
  renderCatalogInstructions,
  type Catalog,
  type CatalogEntryGuidance,
  type CatalogBindingValueType,
  type CatalogEntry,
  type CatalogJsonPrimitive,
  type CatalogJsonSchema,
  type CatalogSlotConstraint
} from '../catalog/index.js'
import { collectSchemaProps, findGuidancePropViolations } from '../catalog/guidance.js'
import { a2uiBasicFunctionSchemas } from './basicFunctions.js'

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
  /** Guidance in wire prop names; required when the canonical guidance names props this projection renames or drops. */
  readonly guidance?: CatalogEntryGuidance
  readonly required: readonly string[]
  readonly props: Readonly<Record<string, PropMapping>>
}

type ExtensionProjection = {
  readonly a2uiName: string
  readonly sourceEntry: string
  readonly description?: string
  /** Guidance in wire prop names; required with `description` or `omit`. */
  readonly guidance?: CatalogEntryGuidance
  /** Canonical props to drop; `prop.field` drops a field from that prop's array items. */
  readonly omit?: readonly string[]
  /** Canonical prop names renamed on the wire, such as `options` to `items`. */
  readonly rename?: Readonly<Record<string, string>>
  /** Canonical props that also accept a data binding or function call. */
  readonly bindable?: readonly string[]
  readonly bindingValueTypes?: Readonly<Record<string, CatalogBindingValueType>>
  /** Wire props added or replaced after projection, for renderer behavior with no canonical prop. */
  readonly props?: Readonly<Record<string, A2uiJsonSchema>>
  /** Require the bound value, as the basic inputs do; coercion defaults a missing one. */
  readonly requireBindings?: boolean
  /** Wire props from `props` that are also required. */
  readonly required?: readonly string[]
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
    guidance: {
      whenToUse: 'Body copy and captions; `variant` picks between them.',
      whenNotToUse: 'Status messages (Alert) or button labels.',
      examples: ['intro paragraph, `variant: body`', 'note under a form, `variant: caption`']
    },
    required: ['text'],
    props: {
      text: binding('text'),
      variant: prop('variant', { values: { caption: 'caption', body: 'body' } })
    }
  },
  {
    a2uiName: 'Image',
    sourceEntry: 'Image',
    guidance: {
      whenToUse:
        'Photos, illustrations and avatars. Set `variant` for size intent and `description` for meaning.',
      whenNotToUse: 'Standard icons (Icon). Leave `description` empty only for decoration.',
      examples: [
        'product photo, `variant: mediumFeature`, `fit: cover`',
        'profile picture, `variant: avatar`, `description` naming the person'
      ]
    },
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
    guidance: {
      whenToUse: 'A standard icon that adds meaning beside text.',
      whenNotToUse: 'Photos or illustrations (Image), or meaning the icon alone must carry.',
      examples: [
        'warning glyph before a note, `name: warning`',
        'download action, `name: download`, inside a Button'
      ]
    },
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
    guidance: {
      whenToUse: 'A video clip the user starts.',
      whenNotToUse: 'Still images (Image), audio only (AudioPlayer) or decorative motion.',
      examples: ['product walkthrough with a `posterUrl` frame', 'recorded lecture clip']
    },
    required: ['url'],
    props: { url: binding('url'), posterUrl: dynamicProp('poster') }
  },
  {
    a2uiName: 'AudioPlayer',
    sourceEntry: 'AudioPlayer',
    guidance: {
      whenToUse: 'An audio track such as a podcast or voice note; `description` says what it is.',
      whenNotToUse: 'Video (Video) or sounds tied to actions.',
      examples: ['podcast episode with a `description`', 'pronunciation sample of one word']
    },
    required: ['url'],
    props: { url: binding('url'), description: dynamicProp('description') }
  },
  {
    a2uiName: 'Row',
    sourceEntry: 'Row',
    guidance: {
      whenToUse: 'A few peers side by side: actions, a label and value, or cards.',
      whenNotToUse: 'Stacked content (Column) or repeated data (List).',
      examples: [
        'Cancel and Save buttons, `justify: end`',
        'two Card summaries, `justify: spaceBetween`'
      ]
    },
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
    guidance: {
      whenToUse: 'Stacking sections, form fields or a card body top to bottom.',
      whenNotToUse: 'Side-by-side peers (Row) or data-driven repeats (List).',
      examples: ['form fields followed by a submit Button', 'heading and paragraph, `align: start`']
    },
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
    guidance: {
      whenToUse:
        'One template per collection item, or a static run of similar items; templated item state follows index order.',
      whenNotToUse: 'One-off layout (Row, Column).',
      examples: ['one Card per search result', 'image thumbnails, `direction: horizontal`']
    },
    required: ['children'],
    props: { children: slot('children'), direction: prop('direction'), align: prop('align') }
  },
  {
    a2uiName: 'Card',
    sourceEntry: 'Card',
    guidance: {
      whenToUse: 'Several items about one subject side by side, such as projects in a grid.',
      whenNotToUse: 'A single section in the page flow or focused tasks (Modal).',
      examples: ['project summary Column inside a Card', 'plan options as Cards in a Row']
    },
    required: ['child'],
    props: { child: slot('child') }
  },
  {
    a2uiName: 'Tabs',
    sourceEntry: 'Tabs',
    guidance: {
      whenToUse: 'Peer views where exactly one shows at a time; give each of the `tabs` a `title`.',
      whenNotToUse: 'Sections read in sequence, picking a value (ChoicePicker) or navigation.',
      examples: ['Overview, Activity and Settings views', 'one code sample per language']
    },
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
    guidance: {
      whenToUse:
        'A focused task or detail that interrupts the page; a Button `trigger` opens it and names it.',
      whenNotToUse: 'Messages that stay in the page, confirmations or content that fits inline.',
      examples: ['edit-profile form behind an Edit Button', 'full terms behind a Read terms Button']
    },
    required: ['trigger', 'content'],
    props: { trigger: slot('trigger'), content: slot('content') }
  },
  {
    a2uiName: 'Divider',
    sourceEntry: 'Divider',
    guidance: {
      whenToUse: 'Splitting related content into groups, such as form sections.',
      whenNotToUse: 'Adding space, or separating every List item.',
      examples: ['between account and billing sections', 'between action groups, `axis: vertical`']
    },
    required: [],
    props: { axis: prop('orientation') }
  },
  {
    a2uiName: 'Button',
    sourceEntry: 'Button',
    guidance: {
      whenToUse: 'An action: submit, save, start, or emit a named `action`.',
      whenNotToUse: 'Navigation; Button never renders a link. Picking options (Choice).',
      examples: ['Save changes, `variant: primary`', 'Cancel beside it, `variant: borderless`']
    },
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
    guidance: {
      whenToUse: 'Free text: names, numbers or passwords; `variant: longText` for paragraphs.',
      whenNotToUse:
        'Known options (Choice), dates (DateTimeInput) or an approximate number in a range (Slider).',
      examples: ['password, `variant: obscured`', 'feedback, `variant: longText`']
    },
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
    guidance: {
      whenToUse: 'An independent yes/no choice submitted later, such as consent.',
      whenNotToUse: 'One of several options (Choice).',
      examples: ['accept the terms', 'email me product updates']
    },
    checkable: true,
    required: ['label', 'value'],
    props: { label: dynamicProp('label'), value: binding('checked') }
  },
  {
    a2uiName: 'ChoicePicker',
    sourceEntry: 'Choice',
    guidance: {
      whenToUse:
        'Known options. `displayStyle: chips` suits tags; `filterable: true` suits long lists.',
      whenNotToUse: 'Free text (TextField), a single yes/no (Checkbox) or switching views (Tabs).',
      examples: [
        'toppings, `variant: multipleSelection`, `displayStyle: chips`',
        'country, `variant: mutuallyExclusive`, `filterable: true`'
      ]
    },
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
    guidance: {
      whenToUse: 'An approximate number in a bounded range where relative position matters.',
      whenNotToUse: 'Exact values (TextField) or a few discrete options (Choice).',
      examples: [
        'volume, `min: 0`, `max: 100`',
        'budget in steps of 100, `min: 500`, `max: 5000`, `steps: 45`'
      ]
    },
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
    guidance: {
      whenToUse: 'A calendar date, a time, or both; set `enableDate` and `enableTime`.',
      whenNotToUse:
        'Durations or free text (TextField), or relative picks such as this week (Choice).',
      examples: [
        'delivery date, `enableDate: true`, with a `min` bound',
        'meeting start, `enableDate: true`, `enableTime: true`'
      ]
    },
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

const REQUIRED_MARK: A2uiJsonSchema = {
  type: 'boolean',
  default: false,
  description: 'Marks the field required; use checks to enforce it.'
}

const EXTENSION_PROJECTIONS: readonly ExtensionProjection[] = [
  {
    a2uiName: 'Select',
    sourceEntry: 'Choice',
    guidance: {
      whenToUse: 'One value from a long list in a compact dropdown.',
      whenNotToUse:
        'A few options better seen at once (RadioGroup) or filtering by typing (Combobox).',
      examples: ['country, `items` bound to a data path', 'time zone with `description` text']
    },
    description: 'Single-value dropdown selection backed by Radiant Select.',
    omit: ['selection', 'presentation', 'searchable', 'options.description'],
    rename: { options: 'items' },
    bindable: ['options'],
    bindingValueTypes: { value: 'string' },
    props: { required: REQUIRED_MARK },
    requireBindings: true
  },
  {
    a2uiName: 'Combobox',
    sourceEntry: 'Choice',
    guidance: {
      whenToUse:
        'Filtering many options by typing. To search on the host, bind `query`, handle `search`, and update bound `items`, keeping selected ones.',
      whenNotToUse: 'Short lists (RadioGroup) or free text (TextField).',
      examples: ['city search, `selection: single`', 'assignees, `selection: multiple`']
    },
    description: 'Filterable dropdown selection backed by Radiant Combobox.',
    omit: ['presentation', 'searchable', 'options.description'],
    rename: { options: 'items' },
    bindable: ['options'],
    props: {
      required: REQUIRED_MARK,
      query: {
        $ref: `${COMMON}DynamicString`,
        description: 'Typed search text written to surface state.'
      },
      search: {
        $ref: `${COMMON}Action`,
        description:
          'Action sent 250 ms after the typed text changes; with it or query set, items are shown unfiltered.'
      },
      loading: {
        $ref: `${COMMON}DynamicBoolean`,
        description: 'Shows a loading status while the host fetches items.'
      }
    },
    requireBindings: true
  },
  {
    a2uiName: 'RadioGroup',
    sourceEntry: 'Choice',
    guidance: {
      whenToUse: 'One value from a few options, all visible at once.',
      whenNotToUse: 'Many options (Select) or several values (Combobox).',
      examples: ['delivery speed with a `description` per option', 'plan size, enforced by checks']
    },
    description: 'Mutually exclusive radio options backed by Radiant RadioGroup.',
    omit: ['selection', 'presentation', 'searchable', 'placeholder'],
    bindingValueTypes: { value: 'string' },
    props: { required: REQUIRED_MARK },
    requireBindings: true
  },
  { a2uiName: 'Switch', sourceEntry: 'Switch', requireBindings: true },
  {
    a2uiName: 'Textarea',
    sourceEntry: 'TextField',
    guidance: {
      whenToUse: 'Paragraphs of free text; set `rows` for the expected length.',
      whenNotToUse: 'Single-line values (TextField) or known options (Select).',
      examples: ['feedback, `rows: 4`', 'bug report, enforced by checks']
    },
    description: 'Multi-line text input backed by Radiant Textarea.',
    omit: ['kind'],
    props: { required: REQUIRED_MARK },
    requireBindings: true
  },
  { a2uiName: 'Alert', sourceEntry: 'Alert', bindable: ['title', 'description'] },
  { a2uiName: 'Badge', sourceEntry: 'Badge', bindable: ['text'] },
  { a2uiName: 'Progress', sourceEntry: 'Progress', bindable: ['label'] },
  { a2uiName: 'Accordion', sourceEntry: 'Accordion' },
  {
    a2uiName: 'Table',
    sourceEntry: 'Table',
    guidance: {
      whenToUse:
        'Records compared across fields. Each of `rows` is a Row with one child per `columns` entry; a template repeats it per data item, and cells bind item-relative paths.',
      whenNotToUse: 'Layout, or items without shared fields (List).',
      examples: [
        'invoices, `rows` templated over a data path, `align: end` on amount',
        'team members with role and status Badge cells'
      ]
    },
    description: 'Tabular records with agent-defined columns, backed by Radiant Table.',
    omit: ['columns.field', 'data'],
    bindable: ['caption']
  },
  {
    a2uiName: 'Toast',
    sourceEntry: 'Toast',
    guidance: {
      whenToUse:
        'Confirming an action the user just took. Bind `open`; the host sets it true in reply to the action, and dismissal writes false.',
      whenNotToUse: 'Messages that must stay (Alert) or decisions before continuing (Modal).',
      examples: ['Draft saved, `open` bound to a data path', 'Message deleted, `actionLabel: Undo`']
    },
    bindable: ['title', 'description'],
    props: {
      open: {
        $ref: `${COMMON}DynamicBoolean`,
        description: 'Shows the toast while true; dismissal writes false.'
      }
    },
    required: ['open']
  },
  { a2uiName: 'Stage', sourceEntry: 'Stage' }
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

type EntryNames = Readonly<Record<string, string | null>>

function projectBasic(
  entry: CatalogEntry,
  projection: BasicProjection,
  names: EntryNames
): A2uiJsonSchema {
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
    describeCatalogEntry(entry, { guidance: projection.guidance, names }),
    properties,
    projection.required,
    projection.checkable ?? false
  )
}

function omitItemFields(
  schema: CatalogJsonSchema,
  propName: string,
  omit: ReadonlySet<string>
): CatalogJsonSchema {
  const copy = structuredClone(schema)
  const fields = [...omit]
    .filter(path => path.startsWith(`${propName}.`))
    .map(path => path.slice(propName.length + 1))
  const items = copy.items as
    | { properties?: Record<string, unknown>; required?: string[] }
    | undefined
  if (!fields.length || !items?.properties) return copy
  for (const field of fields) delete items.properties[field]
  if (items.required) items.required = items.required.filter(field => !fields.includes(field))
  return copy
}

function projectExtension(
  entry: CatalogEntry,
  projection: ExtensionProjection,
  names: EntryNames
): A2uiJsonSchema {
  if ((projection.description || projection.omit || projection.props) && !projection.guidance) {
    fail(projection.a2uiName, 'a projection that renames or omits props needs its own guidance.')
  }
  const omit = new Set(projection.omit ?? [])
  const properties: Record<string, A2uiJsonSchema> = {}
  const required: string[] = []
  let checkable = false

  const wire = (propName: string) => projection.rename?.[propName] ?? propName
  for (const [propName, propSchema] of Object.entries(entry.propsSchema.properties)) {
    if (omit.has(propName)) continue
    const schema = omitItemFields(propSchema, propName, omit)
    // A binding that shares a prop's name makes that prop bindable without losing its constraints.
    const bound = Object.hasOwn(entry.bindings, propName) || projection.bindable?.includes(propName)
    if (bound) {
      const { description, ...literal } = schema
      properties[wire(propName)] = withDescription(
        {
          anyOf: [literal, { $ref: `${COMMON}DataBinding` }, { $ref: `${COMMON}FunctionCall` }]
        },
        description
      )
    } else {
      properties[wire(propName)] = schema
    }
  }
  for (const requiredProp of entry.propsSchema.required ?? []) {
    if (!omit.has(requiredProp)) required.push(wire(requiredProp))
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
  if (projection.requireBindings) {
    for (const bindingName of Object.keys(entry.bindings)) {
      if (!omit.has(bindingName)) required.push(bindingName)
    }
  }
  for (const [wireName, schema] of Object.entries(projection.props ?? {})) {
    properties[wireName] = structuredClone(schema)
  }
  required.push(...(projection.required ?? []))
  for (const [slotName, slotConstraint] of Object.entries(entry.slots)) {
    properties[slotName] = slotSchema(slotConstraint)
    if (slotConstraint.required) required.push(slotName)
  }
  for (const [actionName, shape] of Object.entries(entry.actions)) {
    properties[actionName] = { $ref: `${COMMON}Action`, description: shape.description }
  }

  return componentSchema(
    projection.a2uiName,
    describeCatalogEntry(entry, {
      description: projection.description,
      guidance: projection.guidance,
      names
    }),
    properties,
    required,
    checkable
  )
}

function catalogDocument(
  catalogId: string,
  title: string,
  description: string,
  instructions: string,
  components: Record<string, A2uiJsonSchema>,
  withFunctions = false
): A2uiCatalogDocument {
  const fns = withFunctions ? a2uiBasicFunctionSchemas() : undefined
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: catalogId,
    catalogId,
    protocolVersion: A2UI_PROTOCOL_VERSION,
    title,
    description,
    instructions,
    components,
    functions: fns?.functions ?? {},
    $defs: {
      anyComponent: {
        oneOf: Object.keys(components).map(name => ({ $ref: `#/components/${name}` })),
        discriminator: { propertyName: 'component' }
      },
      anyFunction: fns?.anyFunction ?? { not: {} },
      Weight: {
        type: 'number',
        description:
          'Relative flex growth of this component inside a Row or Column. Set it only on direct children of a Row or Column.'
      }
    }
  }
}

/** Every component name the generated A2UI catalogs can contain, before custom entries. */
export const A2UI_GENERATED_COMPONENT_NAMES: readonly string[] = [
  ...BASIC_PROJECTIONS,
  ...EXTENSION_PROJECTIONS
].map(projection => projection.a2uiName)

/**
 * Returns one message per description in `components` that names a prop or value its own
 * schema lacks, or a known component outside `available`.
 */
export function findA2uiDescriptionViolations(
  components: Readonly<Record<string, A2uiJsonSchema>>,
  available: ReadonlySet<string>,
  known: ReadonlySet<string>
): readonly string[] {
  const violations: string[] = []
  for (const [name, schema] of Object.entries(components)) {
    const description = typeof schema.description === 'string' ? schema.description : ''
    for (const violation of findGuidancePropViolations(description, collectSchemaProps(schema))) {
      violations.push(`${name}: ${violation}`)
    }
    for (const [word] of description.matchAll(/\b[A-Z][A-Za-z0-9]*\b/g)) {
      if (known.has(word) && !available.has(word)) {
        violations.push(`${name}: names ${word}, which this catalog does not contain`)
      }
    }
  }
  return violations
}

const BASIC_INSTRUCTIONS = renderCatalogInstructions({
  topics: ['intent', 'navigation', 'state'],
  extra: [
    'Button `variant`: primary only for the main action, default for secondary actions, borderless for low emphasis such as Cancel.'
  ]
})

/** Design rules for the Radiant vocabulary (variant, tone, controlSize, spacing) `components` use. */
export function a2uiExtensionInstructions(
  components: Readonly<Record<string, A2uiJsonSchema>>
): string {
  const props = collectSchemaProps(Object.values(components))
  const hasEnum = (prop: string, value: string) =>
    (props.get(prop) ?? []).some(
      schema => Array.isArray(schema.enum) && (schema.enum as unknown[]).includes(value)
    )
  const spacing = [...props.values()]
    .flat()
    .some(
      schema =>
        Array.isArray(schema.enum) &&
        CATALOG_SPACING.every(step => (schema.enum as unknown[]).includes(step))
    )
  return renderCatalogInstructions({
    topics: [
      ...(hasEnum('variant', 'solid') ? (['variant'] as const) : []),
      ...(props.has('tone') ? (['tone'] as const) : []),
      ...(props.has('controlSize') ? (['controlSize'] as const) : []),
      ...(spacing ? (['spacing'] as const) : [])
    ]
  })
}

/**
 * Generates the A2UI 1.0 basic catalog and the Radiant extension catalog from a canonical
 * Radiant catalog. Entries added through `extendCatalog` join the extension catalog.
 * The basic catalog defines the basic functions Radiant runs; see `A2UI_OMITTED_FUNCTIONS`.
 */
export function generateA2uiCatalogs(catalog: Catalog): GeneratedA2uiCatalogs {
  let generated = generatedCatalogs.get(catalog)
  if (!generated) {
    generated = generateUncached(catalog)
    generatedCatalogs.set(catalog, generated)
  }
  return structuredClone(generated)
}

const generatedCatalogs = new WeakMap<Catalog, GeneratedA2uiCatalogs>()

function generateUncached(catalog: Catalog): GeneratedA2uiCatalogs {
  assertValidCatalog(catalog)

  const sourceFor = (a2uiName: string, sourceEntry: string): CatalogEntry =>
    catalog.entries[sourceEntry] ?? fail(a2uiName, `missing canonical entry "${sourceEntry}".`)

  const customNames = Object.keys(catalog.entries).filter(
    name =>
      ![...BASIC_PROJECTIONS, ...EXTENSION_PROJECTIONS].some(
        projection => projection.sourceEntry === name
      )
  )
  for (const name of customNames) {
    if (A2UI_GENERATED_COMPONENT_NAMES.includes(name)) {
      fail(name, 'a custom entry cannot reuse the name of a generated A2UI component.')
    }
  }
  const nameIn = (projections: readonly { a2uiName: string; sourceEntry: string }[]) => {
    const names: Record<string, string | null> = {}
    for (const entryName of Object.keys(catalog.entries)) {
      names[entryName] =
        projections.find(projection => projection.sourceEntry === entryName)?.a2uiName ?? null
    }
    return names
  }
  const basicNames = nameIn(BASIC_PROJECTIONS)
  const extensionNames = nameIn(EXTENSION_PROJECTIONS)
  const alongsideNames: Record<string, string | null> = {}
  for (const entryName of Object.keys(catalog.entries)) {
    alongsideNames[entryName] =
      basicNames[entryName] ??
      extensionNames[entryName] ??
      (customNames.includes(entryName) ? entryName : null)
  }

  const basicComponents: Record<string, A2uiJsonSchema> = {}
  const extensionComponents: Record<string, A2uiJsonSchema> = {}
  for (const projection of BASIC_PROJECTIONS) {
    const entry = sourceFor(projection.a2uiName, projection.sourceEntry)
    basicComponents[projection.a2uiName] = projectBasic(entry, projection, basicNames)
  }
  for (const projection of EXTENSION_PROJECTIONS) {
    const entry = sourceFor(projection.a2uiName, projection.sourceEntry)
    extensionComponents[projection.a2uiName] = projectExtension(entry, projection, alongsideNames)
  }
  for (const entryName of customNames) {
    extensionComponents[entryName] = projectExtension(
      catalog.entries[entryName]!,
      { a2uiName: entryName, sourceEntry: entryName },
      alongsideNames
    )
  }

  const known = new Set([
    ...Object.keys(catalog.entries),
    ...A2UI_GENERATED_COMPONENT_NAMES,
    ...customNames
  ])
  const basicSet = new Set(Object.keys(basicComponents))
  const violations = [
    ...findA2uiDescriptionViolations(basicComponents, basicSet, known),
    ...findA2uiDescriptionViolations(
      extensionComponents,
      new Set([...basicSet, ...Object.keys(extensionComponents)]),
      known
    )
  ]
  if (violations.length > 0) {
    throw new TypeError(
      `Generated A2UI guidance does not fit its schemas:\n- ${violations.join('\n- ')}`
    )
  }

  const generatedFrom = `Generated from canonical catalog "${catalog.id}" (${catalog.version}).`
  return {
    basic: catalogDocument(
      A2UI_BASIC_CATALOG_ID,
      'A2UI Basic Catalog',
      generatedFrom,
      BASIC_INSTRUCTIONS,
      basicComponents,
      true
    ),
    extension: catalogDocument(
      catalog.extends
        ? `${RADIANT_A2UI_EXTENSION_CATALOG_ID}#${encodeURIComponent(catalog.id)}`
        : RADIANT_A2UI_EXTENSION_CATALOG_ID,
      'Radiant A2UI Extension Catalog',
      `${generatedFrom} Use alongside the A2UI basic catalog.`,
      a2uiExtensionInstructions(extensionComponents),
      extensionComponents
    )
  }
}
