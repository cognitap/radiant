import {
  CATALOG_CONTROL_SIZES,
  CATALOG_SPACING,
  CATALOG_TONES,
  CATALOG_VARIANTS,
  type Catalog,
  type CatalogEntry,
  type CatalogEntryGuidance,
  type CatalogJsonSchema,
  type CatalogTone,
  type CatalogVariant
} from './types.js'

/** Approximate token ceiling for one entry's rendered description and guidance. */
export const CATALOG_GUIDANCE_TOKEN_BUDGET = 120

/** Approximates model tokens as one per four characters. */
export function estimateCatalogTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// Copied from the Tone and Variant terms in GLOSSARY.md; tests/catalog.test.mjs checks each phrase there.
export const CATALOG_TONE_MEANINGS: Readonly<Record<CatalogTone, string>> = {
  accent: 'primary intent, success or confirmation',
  neutral: 'information and secondary actions',
  warning: 'a problem the user can still avoid',
  danger: 'a failure or a destructive action'
}

export const CATALOG_VARIANT_MEANINGS: Readonly<Record<CatalogVariant, string>> = {
  solid: 'the primary action',
  outline: 'the usual secondary action',
  ghost: 'low emphasis, such as Cancel or toolbar actions',
  soft: 'tinted, rarely used emphasis'
}

const list = (meanings: Readonly<Record<string, string>>): string =>
  Object.entries(meanings)
    .map(([name, meaning]) => `${name} for ${meaning}`)
    .join(', ')

export type CatalogInstructionTopic =
  | 'intent'
  | 'navigation'
  | 'variant'
  | 'tone'
  | 'controlSize'
  | 'spacing'
  | 'state'

const INSTRUCTION_RULES: Readonly<Record<CatalogInstructionTopic, string>> = {
  intent: 'Pick each component by intent; the host theme owns appearance.',
  navigation: '- Button runs actions and never navigates. Leave navigation to the host.',
  variant: `- Variant is the visual treatment of an action (${CATALOG_VARIANTS.join(', ')}): ${list(CATALOG_VARIANT_MEANINGS)}. Button defaults to solid, so set outline or ghost on secondary actions.`,
  tone: `- Tone is the semantic color role (${CATALOG_TONES.join(', ')}): ${list(CATALOG_TONE_MEANINGS)}. Tone only sets color; state the meaning in text.`,
  controlSize: `- Control size (${CATALOG_CONTROL_SIZES.join(', ')}) scales controls; keep one size within a group.`,
  spacing: `- Spacing (${CATALOG_SPACING.join(', ')}) is semantic; never request pixel values.`,
  state: '- Bind input values to surface state; named actions receive a snapshot of that state.'
}

export type RenderCatalogInstructionsOptions = {
  /** Rules to include, in canonical order; defaults to all. */
  readonly topics?: readonly CatalogInstructionTopic[]
  /** Protocol-specific rules appended after the selected topics. */
  readonly extra?: readonly string[]
}

/**
 * Renders catalog-wide design rules, for protocol `instructions` fields.
 */
export function renderCatalogInstructions(options: RenderCatalogInstructionsOptions = {}): string {
  const topics = new Set(options.topics ?? Object.keys(INSTRUCTION_RULES))
  return [
    ...Object.entries(INSTRUCTION_RULES)
      .filter(([topic]) => topics.has(topic))
      .map(([, rule]) => rule),
    ...(options.extra ?? []).map(rule => `- ${rule}`)
  ].join('\n')
}

/**
 * Rewrites references to catalog entries. Parenthesized pointers such as `(Alert, Badge)` are
 * renamed, and dropped when `names` maps them to `null`; bare mentions are only renamed.
 */
export function renameEntryReferences(
  text: string,
  names: Readonly<Record<string, string | null>>
): string {
  const known = (part: string) => Object.hasOwn(names, part)
  return text
    .replace(/ ?\(([^()]*)\)/g, (match, inner: string) => {
      const parts = inner.split(', ')
      if (!parts.every(known)) return match
      const kept = parts.map(part => names[part]).filter((name): name is string => !!name)
      if (kept.length === 0) return ''
      return `${match.startsWith(' ') ? ' ' : ''}(${kept.join(', ')})`
    })
    .replace(/\b[A-Z][A-Za-z0-9]*\b/g, word => (known(word) && names[word]) || word)
}

export type DescribeCatalogEntryOptions = {
  /** Replaces the entry's description, such as for a protocol projection. */
  readonly description?: string
  /** Replaces the entry's guidance with one written in the target protocol's prop names. */
  readonly guidance?: CatalogEntryGuidance
  /** Maps referenced entry names to the target catalog's names, or `null` to drop a pointer. */
  readonly names?: Readonly<Record<string, string | null>>
}

/**
 * Renders one entry's description with its guidance, as used in generated protocol schemas.
 */
export function describeCatalogEntry(
  entry: CatalogEntry,
  options: DescribeCatalogEntryOptions = {}
): string {
  const guidance = options.guidance ?? entry.guidance
  if (!guidance || typeof guidance !== 'object') {
    throw new TypeError(`Catalog entry "${entry.name}" has no guidance to describe.`)
  }
  const { whenToUse, whenNotToUse, examples } = guidance
  const text = [
    options.description ?? entry.description,
    `Use: ${whenToUse}`,
    `Avoid: ${whenNotToUse}`,
    `Examples: ${examples.join('; ')}.`
  ].join('\n')
  return options.names ? renameEntryReferences(text, options.names) : text
}

type SchemaLike = { readonly [keyword: string]: unknown }

/** Collects every property name in a JSON Schema, nested ones included, with each schema it has. */
export function collectSchemaProps(
  schema: unknown,
  into: Map<string, SchemaLike[]> = new Map()
): Map<string, SchemaLike[]> {
  if (Array.isArray(schema)) {
    for (const item of schema) collectSchemaProps(item, into)
  } else if (schema && typeof schema === 'object') {
    for (const [key, value] of Object.entries(schema as SchemaLike)) {
      if (key === 'properties' && value && typeof value === 'object') {
        for (const [name, propSchema] of Object.entries(value as SchemaLike)) {
          into.set(name, [...(into.get(name) ?? []), propSchema as SchemaLike])
        }
      }
      collectSchemaProps(value, into)
    }
  }
  return into
}

function acceptedValues(schema: SchemaLike): readonly unknown[] | undefined {
  if (Array.isArray(schema.enum)) return schema.enum
  for (const key of ['oneOf', 'anyOf', 'allOf']) {
    const branches = schema[key]
    if (!Array.isArray(branches)) continue
    const values = branches.flatMap(branch => acceptedValues(branch as SchemaLike) ?? [])
    if (values.length) return values
  }
  return undefined
}

function acceptsValue(schemas: readonly SchemaLike[], value: string): boolean {
  return schemas.some(schema => {
    const values = acceptedValues(schema)
    if (values) return values.some(item => String(item) === value)
    const types = [schema.type].flat()
    if (types.includes('boolean') && (value === 'true' || value === 'false')) return true
    if (types.includes('null') && value === 'null') return true
    if (types.includes('number') || types.includes('integer')) {
      if (Number.isFinite(Number(value))) return true
    }
    return !types.some(type => ['boolean', 'number', 'integer', 'null'].includes(String(type)))
  })
}

/**
 * Checks the `` `prop` `` and `` `prop: value` `` code spans in guidance text against the
 * props a schema accepts, and returns one message per span that does not fit.
 */
export function findGuidancePropViolations(
  text: string,
  props: ReadonlyMap<string, readonly SchemaLike[]>
): readonly string[] {
  const violations: string[] = []
  for (const [, span] of text.matchAll(/`([^`]+)`/g)) {
    const [name, value] = span.split(/:\s*/, 2)
    const schemas = props.get(name)
    if (!schemas) violations.push(`\`${span}\` names no prop`)
    else if (value !== undefined && !acceptsValue(schemas, value)) {
      violations.push(`\`${span}\` is not an accepted value`)
    }
  }
  return violations
}

/** Props, slots, bindings and actions a guidance code span may name for an entry. */
export function catalogEntryProps(entry: CatalogEntry): Map<string, SchemaLike[]> {
  const props = collectSchemaProps(entry.propsSchema as CatalogJsonSchema)
  for (const group of [entry.slots, entry.bindings, entry.actions]) {
    for (const name of Object.keys(group ?? {})) {
      if (!props.has(name)) props.set(name, [{}])
    }
  }
  return props
}

export type RenderCatalogGuidanceOptions = {
  /** Top-level heading; defaults to the catalog id. */
  readonly title?: string
  /** Summary quoted under the heading; defaults to the catalog description. */
  readonly summary?: string
}

/**
 * Renders the catalog's design rules and per-entry guidance as Markdown, suitable for `llms.txt`.
 */
export function renderCatalogGuidance(
  catalog: Catalog,
  options: RenderCatalogGuidanceOptions = {}
): string {
  const sections = Object.values(catalog.entries).map(entry => {
    const { whenToUse, whenNotToUse, examples } = entry.guidance
    return [
      `### ${entry.name}`,
      '',
      `${entry.description} Category: ${entry.category}.`,
      '',
      `- Use: ${whenToUse}`,
      `- Avoid: ${whenNotToUse}`,
      ...examples.map(example => `- Example: ${example}`)
    ].join('\n')
  })
  return [
    `# ${options.title ?? catalog.id}`,
    '',
    `> ${options.summary ?? catalog.description} Catalog ${catalog.id} ${catalog.version}.`,
    '',
    '## Design rules',
    '',
    renderCatalogInstructions(),
    '',
    '## Entries',
    '',
    sections.join('\n\n'),
    ''
  ].join('\n')
}
