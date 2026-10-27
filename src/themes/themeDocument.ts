import { defineTheme, type Theme, type ThemeDefinition, type ThemeLayer } from './defineTheme.js'
import { freezeTree, tokenDefaults } from './tokens.js'
import { generateTypography } from '../typography/index.js'
import type {
  ThemeColorSection,
  ThemeDocument,
  ThemeSectionExport,
  ThemeSectionName,
  ThemeSections
} from './themeDocumentTypes.js'

export type * from './themeDocumentTypes.js'

const sectionNames: readonly ThemeSectionName[] = [
  ...Object.keys(tokenDefaults.light),
  'components'
] as ThemeSectionName[]
const stops = new Set([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950])
type RecordValue = Record<string, unknown>

function record(value: unknown, path: string): asserts value is RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${path} must be an object.`)
  }
}

function keys(value: RecordValue, allowed: readonly string[], path: string) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw new TypeError(`Unknown key: ${path}.${key}.`)
  }
}

function textValue(value: unknown, path: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${path} must be a nonempty string.`)
  }
}

function choice(value: unknown, allowed: readonly unknown[], path: string) {
  if (!allowed.includes(value)) {
    throw new TypeError(`${path} must be one of: ${allowed.join(', ')}.`)
  }
}

function list(value: unknown, path: string): asserts value is unknown[] {
  if (!Array.isArray(value)) throw new TypeError(`${path} must be an array.`)
}

function unique(value: unknown, seen: Set<unknown>, path: string) {
  if (seen.has(value)) throw new TypeError(`Duplicate value at ${path}: ${String(value)}.`)
  seen.add(value)
}

/** Copy data without running getters/toJSON or silently losing functions and binaries. */
function jsonCopy(value: unknown, path: string, ancestors = new Set<object>()): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value === 0 ? 0 : value
  if (!value || typeof value !== 'object')
    throw new TypeError(`${path} must contain JSON data only.`)
  if (ancestors.has(value)) throw new TypeError(`Circular reference at ${path}.`)
  const array = Array.isArray(value)
  const prototype = Object.getPrototypeOf(value)
  if (
    array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null
  ) {
    throw new TypeError(`${path} must contain plain JSON objects, not class instances or binaries.`)
  }
  ancestors.add(value)
  const result: RecordValue | unknown[] = array ? [] : {}
  if (Object.getOwnPropertySymbols(value).length)
    throw new TypeError(`${path} cannot contain symbol keys.`)
  const descriptors = Object.getOwnPropertyDescriptors(value)
  for (const key of Object.keys(descriptors).sort()) {
    if (array && key === 'length') continue
    if (['__proto__', 'constructor', 'prototype'].includes(key))
      throw new TypeError(`Forbidden key: ${path}.${key}.`)
    const descriptor = descriptors[key]
    if (!('value' in descriptor) || !descriptor.enumerable) {
      throw new TypeError(`${path}.${key} must be an enumerable data property.`)
    }
    if (array && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length)) {
      throw new TypeError(`${path}.${key} is not an array index.`)
    }
    // Optional object properties follow JSON omission rules; array holes/undefined are invalid.
    if (descriptor.value === undefined && !array) continue
    const copy = jsonCopy(descriptor.value, `${path}.${key}`, ancestors)
    Object.defineProperty(result, key, {
      value: copy,
      enumerable: true,
      writable: true,
      configurable: true
    })
  }
  if (array && Object.keys(result).length !== value.length)
    throw new TypeError(`${path} cannot contain array holes.`)
  ancestors.delete(value)
  return result
}

function validateColor(value: RecordValue, path: string) {
  if (value.brand !== undefined) {
    record(value.brand, `${path}.brand`)
    keys(value.brand, ['value', 'gamut', 'srgbFallback'], `${path}.brand`)
    textValue(value.brand.value, `${path}.brand.value`)
    choice(value.brand.gamut, ['srgb', 'display-p3'], `${path}.brand.gamut`)
    if (value.brand.srgbFallback !== undefined)
      textValue(value.brand.srgbFallback, `${path}.brand.srgbFallback`)
    if (value.fidelity === undefined) value.fidelity = 'anchored'
  }
  if (value.fidelity !== undefined)
    choice(value.fidelity, ['anchored', 'unanchored'], `${path}.fidelity`)
  if (value.palettes !== undefined) {
    list(value.palettes, `${path}.palettes`)
    const ids = new Set<unknown>()
    for (const [i, palette] of value.palettes.entries()) {
      const p = `${path}.palettes.${i}`
      record(palette, p)
      keys(palette, ['id', 'name', 'swatches'], p)
      textValue(palette.id, `${p}.id`)
      textValue(palette.name, `${p}.name`)
      unique(palette.id, ids, `${p}.id`)
      list(palette.swatches, `${p}.swatches`)
      if (!palette.swatches.length) throw new TypeError(`${p}.swatches must not be empty.`)
      const seen = new Set<unknown>()
      for (const [j, swatch] of palette.swatches.entries()) {
        const s = `${p}.swatches.${j}`
        record(swatch, s)
        keys(swatch, ['stop', 'value', 'srgbFallback'], s)
        if (!stops.has(swatch.stop as number))
          throw new TypeError(`${s}.stop must be a numbered color stop (50–950).`)
        unique(swatch.stop, seen, `${s}.stop`)
        textValue(swatch.value, `${s}.value`)
        if (swatch.srgbFallback !== undefined) textValue(swatch.srgbFallback, `${s}.srgbFallback`)
      }
    }
  }
  if (value.anchor !== undefined) {
    record(value.anchor, `${path}.anchor`)
    keys(value.anchor, ['paletteId', 'stop'], `${path}.anchor`)
    textValue(value.anchor.paletteId, `${path}.anchor.paletteId`)
    if (!stops.has(value.anchor.stop as number))
      throw new TypeError(`${path}.anchor.stop must be a numbered color stop (50–950).`)
    const color = value as ThemeColorSection
    const swatch = color.palettes
      ?.find(p => p.id === color.anchor!.paletteId)
      ?.swatches.find(s => s.stop === color.anchor!.stop)
    if (!color.brand || color.fidelity !== 'anchored' || swatch?.value !== color.brand.value) {
      throw new TypeError(
        `${path}.anchor must reference a swatch containing the exact brand.value with anchored fidelity. Regenerate or replace the color section.`
      )
    }
  }
}

function validateFonts(value: unknown, path: string) {
  list(value, path)
  const ids = new Set<unknown>()
  for (const [i, font] of value.entries()) {
    const p = `${path}.${i}`
    record(font, p)
    keys(font, ['id', 'family', 'source', 'weights', 'styles', 'axes'], p)
    textValue(font.id, `${p}.id`)
    textValue(font.family, `${p}.family`)
    unique(font.id, ids, `${p}.id`)
    choice(font.source, ['system', 'catalog', 'local'], `${p}.source`)
    if (font.axes !== undefined) {
      list(font.axes, `${p}.axes`)
      if (font.axes.length > 32) throw new TypeError(`${p}.axes supports at most 32 axes.`)
      const tags = new Set<unknown>()
      for (const [j, axis] of font.axes.entries()) {
        const at = `${p}.axes.${j}`
        record(axis, at)
        keys(axis, ['tag', 'min', 'default', 'max'], at)
        if (typeof axis.tag !== 'string' || !/^[A-Za-z][A-Za-z0-9]{3}$/.test(axis.tag))
          throw new TypeError(
            `${at}.tag must contain four ASCII letters/digits, starting with a letter.`
          )
        unique(axis.tag, tags, `${at}.tag`)
        for (const key of ['min', 'default', 'max'])
          if (
            typeof axis[key] !== 'number' ||
            !Number.isFinite(axis[key]) ||
            Math.abs(axis[key]) > 1000000
          )
            throw new TypeError(
              `${at}.${key} must be a finite number between -1000000 and 1000000.`
            )
        if (Number(axis.min) > Number(axis.default) || Number(axis.default) > Number(axis.max))
          throw new TypeError(`${at} must satisfy min <= default <= max.`)
      }
    }
    for (const key of ['weights', 'styles']) {
      if (font[key] === undefined) continue
      list(font[key], `${p}.${key}`)
      const seen = new Set<unknown>()
      for (const [j, item] of font[key].entries()) {
        const at = `${p}.${key}.${j}`
        if (key === 'styles') choice(item, ['normal', 'italic'], at)
        else if (typeof item !== 'number' || !Number.isFinite(item) || item < 1 || item > 1000)
          throw new TypeError(`${at} must be a weight from 1 to 1000.`)
        unique(item, seen, at)
      }
    }
  }
}

function toDefinition(sections: ThemeSections, id: string, name: string): ThemeDefinition {
  const common: {
    tokens: RecordValue
    components?: ThemeLayer['components']
    motion?: ThemeDefinition['motion']
  } = { tokens: {} }
  const modes = { light: { tokens: {} } as typeof common, dark: { tokens: {} } as typeof common }
  for (const sectionName of sectionNames) {
    const section = sections[sectionName]
    if (!section) continue
    if (sectionName === 'motion') common.motion = sections.motion?.profile
    if (sectionName === 'typography' && sections.typography?.typesetting !== undefined) {
      common.tokens.typography = generateTypography(sections.typography.typesetting).tokens
    }
    for (const mode of ['common', 'light', 'dark'] as const) {
      const values = mode === 'common' ? section.values : section.modes?.[mode]
      if (values === undefined) continue
      const layer = mode === 'common' ? common : modes[mode]
      if (sectionName === 'components') layer.components = values as ThemeLayer['components']
      else layer.tokens[sectionName] = merge(layer.tokens[sectionName], values)
    }
  }
  return { id, name, ...common, modes }
}

/** Read JSON.parse output (or data objects); unknown versions/keys fail with a path. */
export function parseThemeDocument(input: unknown): ThemeDocument | ThemeSectionExport {
  const value = jsonCopy(input, 'document')
  record(value, 'document')
  choice(value.kind, ['radiant-theme', 'radiant-theme-sections'], 'document.kind')
  if (value.version !== 1)
    throw new TypeError(
      `Unsupported document.version: ${String(value.version)}. Expected 1; migrate the configuration before importing.`
    )
  const full = value.kind === 'radiant-theme'
  keys(
    value,
    full ? ['kind', 'version', 'id', 'name', 'sections'] : ['kind', 'version', 'sections'],
    'document'
  )
  record(value.sections, 'document.sections')
  keys(value.sections, sectionNames, 'document.sections')
  for (const [name, section] of Object.entries(value.sections)) {
    const path = `document.sections.${name}`
    record(section, path)
    keys(
      section,
      [
        'values',
        'modes',
        ...(name === 'motion'
          ? ['profile']
          : name === 'color'
            ? ['brand', 'fidelity', 'palettes', 'anchor']
            : name === 'typography'
              ? ['fonts', 'typesetting']
              : [])
      ],
      path
    )
    if (section.modes !== undefined) {
      record(section.modes, `${path}.modes`)
      keys(section.modes, ['light', 'dark'], `${path}.modes`)
    }
    if (name === 'color') validateColor(section, path)
    if (name === 'typography' && section.fonts !== undefined)
      validateFonts(section.fonts, `${path}.fonts`)
  }
  // Reuse the canonical token/component validation and resolution; no second token schema.
  defineTheme(
    toDefinition(
      value.sections as ThemeSections,
      full ? (value.id as string) : 'section-export',
      full ? (value.name as string) : 'Section export'
    )
  )
  return freezeTree(jsonCopy(value, 'document') as object) as ThemeDocument | ThemeSectionExport
}

/** Validate and detach an immutable, portable authoring snapshot. */
export function defineThemeDocument(document: ThemeDocument): ThemeDocument {
  const result = parseThemeDocument(document)
  if (result.kind !== 'radiant-theme')
    throw new TypeError('Expected a radiant-theme document with id and name.')
  return result
}

/** Compile only authored semantic values through the existing application theme runtime. */
export function compileThemeDocument(document: ThemeDocument): Theme {
  const validated = defineThemeDocument(document)
  return defineTheme(toDefinition(validated.sections, validated.id, validated.name))
}

function merge(base: unknown, patch: unknown): unknown {
  if (
    !base ||
    !patch ||
    typeof base !== 'object' ||
    typeof patch !== 'object' ||
    Array.isArray(base) ||
    Array.isArray(patch)
  )
    return patch
  const result: RecordValue = { ...base }
  for (const [key, value] of Object.entries(patch)) result[key] = merge(result[key], value)
  return result
}

/** Merge leaves/replace arrays, or replace only supplied sections. Empty replacement resets. */
export function updateThemeDocument(
  document: ThemeDocument,
  sections: ThemeSections,
  mode: 'merge' | 'replace' = 'merge'
): ThemeDocument {
  const base = defineThemeDocument(document)
  choice(mode, ['merge', 'replace'], 'update mode')
  // Check the patch's JSON boundary before merging, including keys a spread would discard.
  const patch = jsonCopy(sections, 'sections')
  record(patch, 'sections')
  keys(patch, sectionNames, 'sections')
  const next = { ...base.sections } as RecordValue
  for (const [name, section] of Object.entries(patch))
    next[name] = mode === 'replace' ? section : merge(next[name], section)
  return defineThemeDocument({ ...base, sections: next })
}

/** Export exactly these sections, with no document identity or implicit component exceptions. */
export function exportThemeSections(
  document: ThemeDocument,
  names: readonly ThemeSectionName[]
): ThemeSectionExport {
  const base = defineThemeDocument(document)
  list(names, 'section names')
  const sections: RecordValue = {}
  for (const name of names) {
    choice(name, sectionNames, 'section name')
    if (base.sections[name] !== undefined) sections[name] = base.sections[name]
  }
  return parseThemeDocument({
    kind: 'radiant-theme-sections',
    version: 1,
    sections
  }) as ThemeSectionExport
}

/** Bring existing authored themes into the workshop without materialising defaults as overrides. */
export function themeDocumentFromDefinition(definition: ThemeDefinition): ThemeDocument {
  const copy = jsonCopy(definition, 'theme') as ThemeDefinition
  defineTheme(copy)
  const sections: RecordValue = {}
  for (const name of sectionNames) {
    const section: RecordValue = {}
    const values = name === 'components' ? copy.components : copy.tokens?.[name]
    if (values !== undefined) section.values = values
    if (name === 'motion' && copy.motion !== undefined) section.profile = copy.motion
    const modes: RecordValue = {}
    for (const mode of ['light', 'dark'] as const) {
      const values =
        name === 'components' ? copy.modes?.[mode]?.components : copy.modes?.[mode]?.tokens?.[name]
      if (values !== undefined) modes[mode] = values
    }
    if (Object.keys(modes).length) section.modes = modes
    if (Object.keys(section).length) sections[name] = section
  }
  return defineThemeDocument({
    kind: 'radiant-theme',
    version: 1,
    id: copy.id,
    name: copy.name,
    sections
  })
}
