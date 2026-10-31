import {
  defineMotionProfile,
  type MotionProfile,
  type MotionProfileInput
} from '../motion/config.js'
import type { CSSProperties } from 'react'
import {
  flattenTokens,
  freezeTree,
  tokenDefaults,
  type ThemeTokens,
  type ThemeVariableValues
} from './tokens.js'
import {
  componentRegistry,
  componentValueKind,
  flattenComponents,
  type ThemeComponentOverrides
} from './components.js'

export type { SharedTokens, ThemeTokens } from './tokens.js'
export type { ThemeComponentOverrides } from './components.js'
export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemeStyle = CSSProperties & {
  [key: `--${string}`]: string | number | undefined
}
export interface ThemeLayer {
  readonly tokens?: ThemeTokens
  readonly components?: ThemeComponentOverrides
}
export interface ThemeDefinition extends ThemeLayer {
  readonly motion?: MotionProfileInput
  readonly id: string
  readonly name: string
  readonly modes?: { readonly light?: ThemeLayer; readonly dark?: ThemeLayer }
}

/** Resolved, immutable data. Safe to pass through server/client serialization. */
export interface Theme {
  readonly motion: MotionProfile
  readonly id: string
  readonly name: string
  readonly modes: {
    readonly light: Readonly<ThemeVariableValues>
    readonly dark: Readonly<ThemeVariableValues>
  }
}

function assertRecord(value: unknown, path: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${path} must be an object.`)
  }
}

function assertKeys(value: Record<string, unknown>, allowed: object, path: string) {
  for (const key of Object.keys(value)) {
    if (!Object.hasOwn(allowed, key)) throw new TypeError(`Unknown theme key: ${path}.${key}`)
  }
}

function validateScalar(
  value: unknown,
  kind: 'css' | 'weight' | 'number' | 'opacity',
  path: string
) {
  if (value === undefined) return
  if (typeof value === 'string' && (kind === 'css' || kind === 'weight') && value.trim()) return
  if (typeof value === 'number' && kind !== 'css' && Number.isFinite(value)) {
    if (kind !== 'opacity' || (value >= 0 && value <= 1)) return
  }
  throw new TypeError(`Invalid theme value at ${path}.`)
}

function tokenValueKind(key: string) {
  if (key === 'disabledOpacity' || key === 'highlight' || key === 'sheen') return 'opacity'
  if (key === 'pressScale') return 'number'
  return key.endsWith('Weight') || key === 'weight' ? 'weight' : 'css'
}

function validateTokens(value: unknown, baseline: object, path: string) {
  assertRecord(value, path)
  assertKeys(value, baseline, path)
  for (const [key, item] of Object.entries(value)) {
    if (item === undefined) continue
    const defaultValue = (baseline as Record<string, unknown>)[key]
    if (typeof defaultValue === 'object' && defaultValue !== null) {
      validateTokens(item, defaultValue, `${path}.${key}`)
    } else {
      validateScalar(item, tokenValueKind(key), `${path}.${key}`)
    }
  }
}

function validateLayer(value: unknown, path: string) {
  assertRecord(value, path)
  assertKeys(value, { tokens: true, components: true }, path)
  if (value.tokens !== undefined)
    validateTokens(value.tokens, tokenDefaults.light, `${path}.tokens`)
  if (value.components !== undefined) {
    assertRecord(value.components, `${path}.components`)
    assertKeys(value.components, componentRegistry, `${path}.components`)
    for (const [family, overrides] of Object.entries(value.components)) {
      if (overrides === undefined) continue
      assertRecord(overrides, `${path}.components.${family}`)
      for (const [key, item] of Object.entries(overrides)) {
        const kind = componentValueKind(family, key)
        if (!kind) throw new TypeError(`Unknown theme key: ${path}.components.${family}.${key}`)
        validateScalar(item, kind, `${path}.components.${family}.${key}`)
      }
    }
  }
}

/** Resolve defaults → common overrides → mode overrides, independently for each mode. */
export function defineTheme(definition: ThemeDefinition): Theme {
  assertRecord(definition, 'theme')
  assertKeys(
    definition,
    { id: true, name: true, tokens: true, components: true, modes: true, motion: true },
    'theme'
  )
  if (typeof definition.id !== 'string' || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(definition.id)) {
    throw new TypeError('Theme id must be a lowercase slug starting with a letter.')
  }
  if (typeof definition.name !== 'string' || !definition.name.trim()) {
    throw new TypeError('Theme name must be a nonempty string.')
  }
  validateLayer({ tokens: definition.tokens, components: definition.components }, 'theme')
  if (definition.modes !== undefined) {
    assertRecord(definition.modes, 'theme.modes')
    assertKeys(definition.modes, { light: true, dark: true }, 'theme.modes')
    for (const mode of ['light', 'dark'] as const) {
      if (definition.modes[mode] !== undefined)
        validateLayer(definition.modes[mode], `theme.modes.${mode}`)
    }
  }
  function resolve(mode: 'light' | 'dark'): ThemeVariableValues {
    const layer = definition.modes?.[mode]
    return {
      ...flattenTokens(tokenDefaults[mode]),
      ...flattenTokens(definition.tokens ?? {}),
      ...flattenTokens(layer?.tokens ?? {}),
      ...flattenComponents({}, true),
      ...flattenComponents(definition.components),
      ...flattenComponents(layer?.components)
    }
  }
  const modes = { light: resolve('light'), dark: resolve('dark') }
  return freezeTree({
    id: definition.id,
    name: definition.name,
    modes,
    motion: defineMotionProfile(definition.motion)
  })
}
