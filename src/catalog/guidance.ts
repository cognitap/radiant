import {
  CATALOG_CONTROL_SIZES,
  CATALOG_SPACING,
  CATALOG_TONES,
  CATALOG_VARIANTS,
  type Catalog,
  type CatalogEntry,
  type CatalogTone,
  type CatalogVariant
} from './types.js'

/** Approximate token ceiling for one entry's rendered description and guidance. */
export const CATALOG_GUIDANCE_TOKEN_BUDGET = 120

/** Approximates model tokens as one per four characters. */
export function estimateCatalogTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

const TONE_MEANINGS: Readonly<Record<CatalogTone, string>> = {
  accent: 'primary intent, success or confirmation',
  neutral: 'information and secondary actions',
  warning: 'a problem the user can still avoid',
  danger: 'a failure or a destructive action'
}

const VARIANT_MEANINGS: Readonly<Record<CatalogVariant, string>> = {
  solid: 'the one primary action in a group',
  soft: 'secondary actions',
  outline: 'secondary actions that need a visible edge',
  ghost: 'low-emphasis actions in dense areas'
}

const list = (meanings: Readonly<Record<string, string>>): string =>
  Object.entries(meanings)
    .map(([name, meaning]) => `${name} for ${meaning}`)
    .join(', ')

/**
 * Renders catalog-wide design rules shared by every entry, for protocol `instructions` fields.
 */
export function renderCatalogInstructions(): string {
  return [
    'Pick each entry by intent; the host theme owns appearance.',
    `- Variant is the visual treatment of an action (${CATALOG_VARIANTS.join(', ')}): ${list(VARIANT_MEANINGS)}.`,
    `- Tone is the semantic color role (${CATALOG_TONES.join(', ')}): ${list(TONE_MEANINGS)}. Tone only sets color; state the meaning in text.`,
    `- Control size (${CATALOG_CONTROL_SIZES.join(', ')}) scales controls; keep one size within a group.`,
    `- Spacing (${CATALOG_SPACING.join(', ')}) is semantic; never request pixel values.`,
    '- Button runs actions and never navigates. Leave navigation to the host.',
    '- Bind input values to surface state; named actions receive a snapshot of that state.'
  ].join('\n')
}

/**
 * Renders one entry's description with its guidance, as used in generated protocol schemas.
 */
export function describeCatalogEntry(entry: CatalogEntry): string {
  const { whenToUse, whenNotToUse, examples } = entry.guidance
  return [
    entry.description,
    `Use: ${whenToUse}`,
    `Avoid: ${whenNotToUse}`,
    `Examples: ${examples.join('; ')}.`
  ].join('\n')
}

export type RenderCatalogGuidanceOptions = {
  /** Top-level heading; defaults to the catalog id. */
  readonly title?: string
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
    `> ${catalog.description} Catalog ${catalog.id} ${catalog.version}.`,
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
