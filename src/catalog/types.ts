export const CATALOG_SPACING = ['tight', 'normal', 'airy'] as const
export type CatalogSpacing = (typeof CATALOG_SPACING)[number]

export const CATALOG_TONES = ['accent', 'neutral', 'warning', 'danger'] as const
export type CatalogTone = (typeof CATALOG_TONES)[number]

export const CATALOG_VARIANTS = ['solid', 'soft', 'outline', 'ghost'] as const
export type CatalogVariant = (typeof CATALOG_VARIANTS)[number]

export const CATALOG_CONTROL_SIZES = ['small', 'medium', 'large'] as const
export type CatalogControlSize = (typeof CATALOG_CONTROL_SIZES)[number]

export const CATALOG_ORIENTATIONS = ['horizontal', 'vertical'] as const
export type CatalogOrientation = (typeof CATALOG_ORIENTATIONS)[number]

export const CATALOG_ALIGNMENTS = ['start', 'center', 'end', 'stretch'] as const
export type CatalogAlignment = (typeof CATALOG_ALIGNMENTS)[number]

export const CATALOG_JUSTIFY = [
  'start',
  'center',
  'end',
  'between',
  'around',
  'evenly',
  'stretch'
] as const
export type CatalogJustify = (typeof CATALOG_JUSTIFY)[number]

export const CHOICE_PRESENTATIONS = ['list', 'segmented', 'chips', 'cards', 'dropdown'] as const
export type ChoicePresentation = (typeof CHOICE_PRESENTATIONS)[number]

export const CATALOG_ANNOUNCEMENTS = ['off', 'polite', 'assertive'] as const
export type CatalogAnnouncement = (typeof CATALOG_ANNOUNCEMENTS)[number]

export const CATALOG_CATEGORIES = [
  'content',
  'media',
  'layout',
  'action',
  'input',
  'feedback',
  'data'
] as const
export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number]

export type CatalogJsonPrimitive = string | number | boolean | null
export type CatalogJsonSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null'

export type CatalogJsonSchema = {
  readonly type?: CatalogJsonSchemaType | readonly CatalogJsonSchemaType[]
  readonly description?: string
  readonly enum?: readonly CatalogJsonPrimitive[]
  readonly const?: CatalogJsonPrimitive
  readonly default?: unknown
  readonly properties?: Readonly<Record<string, CatalogJsonSchema>>
  readonly required?: readonly string[]
  readonly additionalProperties?: boolean | CatalogJsonSchema
  readonly items?: CatalogJsonSchema
  readonly minItems?: number
  readonly maxItems?: number
  readonly minimum?: number
  readonly maximum?: number
  readonly exclusiveMinimum?: number
  readonly minLength?: number
  readonly maxLength?: number
  readonly format?: string
  readonly oneOf?: readonly CatalogJsonSchema[]
  readonly anyOf?: readonly CatalogJsonSchema[]
  readonly $ref?: string
  readonly $defs?: Readonly<Record<string, CatalogJsonSchema>>
}

export type CatalogObjectSchema = CatalogJsonSchema & {
  readonly type: 'object'
  readonly properties: Readonly<Record<string, CatalogJsonSchema>>
  readonly required?: readonly string[]
  readonly additionalProperties: false
}

export type CatalogSlotCardinality = 'single' | 'many'

export type CatalogSlotConstraint = {
  readonly description: string
  readonly cardinality: CatalogSlotCardinality
  readonly required?: boolean
  readonly templated?: boolean
  readonly allowedCategories?: readonly CatalogCategory[]
  readonly allowedEntries?: readonly string[]
  readonly childProps?: Readonly<Record<string, CatalogJsonSchema>>
}

export type CatalogBindingValueType = 'string' | 'number' | 'boolean' | 'string[]' | 'object[]'
export type CatalogBindingDirection = 'read' | 'two-way'

export type CatalogStateBinding = {
  readonly description: string
  readonly valueType: CatalogBindingValueType
  readonly direction: CatalogBindingDirection
  readonly validatable?: boolean
}

export type CatalogActionScope = 'outbound' | 'client'

export type CatalogActionShape = {
  readonly description: string
  readonly scope: CatalogActionScope
  readonly payloadSchema?: CatalogJsonSchema
}

/** When an agent should pick an entry, when it should not, and two short examples. */
export type CatalogEntryGuidance = {
  readonly whenToUse: string
  readonly whenNotToUse: string
  readonly examples: readonly [string, string]
}

export type CatalogEntryInvocation = 'render' | 'action'

export type CatalogEntry = {
  readonly name: string
  readonly category: CatalogCategory
  readonly description: string
  readonly propsSchema: CatalogObjectSchema
  readonly slots: Readonly<Record<string, CatalogSlotConstraint>>
  readonly bindings: Readonly<Record<string, CatalogStateBinding>>
  readonly actions: Readonly<Record<string, CatalogActionShape>>
  readonly invocation?: CatalogEntryInvocation
  readonly guidance: CatalogEntryGuidance
}

export type Catalog = {
  readonly id: string
  readonly version: string
  readonly description: string
  readonly extends?: string
  readonly entries: Readonly<Record<string, CatalogEntry>>
}

export type CatalogInput = {
  readonly id: string
  readonly version: string
  readonly description: string
  readonly extends?: string
  readonly entries: Readonly<Record<string, CatalogEntry>>
}

export type CatalogExtension = {
  readonly id: string
  readonly version: string
  readonly description?: string
  readonly entries: Readonly<Record<string, CatalogEntry>>
}
