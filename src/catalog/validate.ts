import {
  CATALOG_CATEGORIES,
  type Catalog,
  type CatalogActionShape,
  type CatalogCategory,
  type CatalogEntry,
  type CatalogExtension,
  type CatalogInput,
  type CatalogJsonSchema,
  type CatalogSlotConstraint,
  type CatalogStateBinding
} from './types.js'

const ENTRY_NAME_PATTERN = /^[A-Z][A-Za-z0-9]*$/
const VALID_CATEGORIES = new Set<string>(CATALOG_CATEGORIES)
const VALID_BINDING_TYPES = new Set(['string', 'number', 'boolean', 'string[]', 'object[]'])
const VALID_BINDING_DIRECTIONS = new Set(['read', 'two-way'])
const VALID_ACTION_SCOPES = new Set(['outbound', 'client'])
const VALID_SLOT_CARDINALITIES = new Set(['single', 'many'])
const VALID_INVOCATIONS = new Set(['render', 'action'])

const EXACT_FORBIDDEN_PROPS = new Set([
  'classname',
  'class',
  'style',
  'render',
  'as',
  'aschild',
  'ref',
  'parts',
  'key',
  'role',
  'tabindex',
  'dangerouslysetinnerhtml',
  'innerhtml'
])

/**
 * Returns true when a prop name leaks host styling, React rendering escape hatches,
 * DOM event handlers, or raw ARIA attributes into the model-facing contract.
 */
export function isForbiddenCatalogProp(name: string): boolean {
  const lower = name.toLowerCase()
  if (EXACT_FORBIDDEN_PROPS.has(lower)) return true
  if (lower.startsWith('aria-') || /^aria[A-Z]/.test(name)) return true
  if (lower.startsWith('data-')) return true
  if (/^on[A-Z]/.test(name)) return true
  return false
}

/**
 * Recursively scans a JSON Schema for forbidden model-facing prop names.
 */
export function findForbiddenPropsInSchema(
  schema: CatalogJsonSchema | undefined,
  path = 'props'
): readonly string[] {
  if (!schema || typeof schema !== 'object') return []
  const violations: string[] = []
  if (schema.properties) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const propPath = `${path}.${key}`
      if (isForbiddenCatalogProp(key)) violations.push(propPath)
      violations.push(...findForbiddenPropsInSchema(propSchema, propPath))
    }
  }
  if (schema.items) {
    violations.push(...findForbiddenPropsInSchema(schema.items, `${path}[]`))
  }
  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    violations.push(...findForbiddenPropsInSchema(schema.additionalProperties, `${path}.*`))
  }
  if (schema.oneOf) {
    for (let i = 0; i < schema.oneOf.length; i++) {
      violations.push(...findForbiddenPropsInSchema(schema.oneOf[i], `${path}.oneOf[${i}]`))
    }
  }
  if (schema.anyOf) {
    for (let i = 0; i < schema.anyOf.length; i++) {
      violations.push(...findForbiddenPropsInSchema(schema.anyOf[i], `${path}.anyOf[${i}]`))
    }
  }
  if (schema.$defs) {
    for (const [defName, defSchema] of Object.entries(schema.$defs)) {
      violations.push(...findForbiddenPropsInSchema(defSchema, `${path}.$defs.${defName}`))
    }
  }
  return violations
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function validateSlot(
  entryName: string,
  slotName: string,
  slot: CatalogSlotConstraint,
  violations: string[]
): void {
  const prefix = `${entryName}.slots.${slotName}`
  if (!isPlainObject(slot)) {
    violations.push(`${prefix} must be an object.`)
    return
  }
  if (typeof slot.description !== 'string' || !slot.description.trim()) {
    violations.push(`${prefix}.description must be a non-empty string.`)
  }
  if (!VALID_SLOT_CARDINALITIES.has(slot.cardinality)) {
    violations.push(`${prefix}.cardinality must be "single" or "many".`)
  }
  if (slot.allowedCategories) {
    for (const category of slot.allowedCategories) {
      if (!VALID_CATEGORIES.has(category)) {
        violations.push(`${prefix}.allowedCategories contains unknown category "${category}".`)
      }
    }
  }
  if (slot.childProps) {
    for (const [propName, propSchema] of Object.entries(slot.childProps)) {
      if (isForbiddenCatalogProp(propName)) {
        violations.push(`${prefix}.childProps.${propName} is a forbidden catalog prop.`)
      }
      for (const nested of findForbiddenPropsInSchema(
        propSchema,
        `${prefix}.childProps.${propName}`
      )) {
        violations.push(`${nested} is a forbidden catalog prop.`)
      }
    }
  }
}

function validateBinding(
  entryName: string,
  bindingName: string,
  binding: CatalogStateBinding,
  violations: string[]
): void {
  const prefix = `${entryName}.bindings.${bindingName}`
  if (!isPlainObject(binding)) {
    violations.push(`${prefix} must be an object.`)
    return
  }
  if (isForbiddenCatalogProp(bindingName)) {
    violations.push(`${prefix} uses a forbidden prop name.`)
  }
  if (typeof binding.description !== 'string' || !binding.description.trim()) {
    violations.push(`${prefix}.description must be a non-empty string.`)
  }
  if (!VALID_BINDING_TYPES.has(binding.valueType)) {
    violations.push(`${prefix}.valueType "${String(binding.valueType)}" is unsupported.`)
  }
  if (!VALID_BINDING_DIRECTIONS.has(binding.direction)) {
    violations.push(`${prefix}.direction must be "read" or "two-way".`)
  }
}

function validateAction(
  entryName: string,
  actionName: string,
  action: CatalogActionShape,
  violations: string[]
): void {
  const prefix = `${entryName}.actions.${actionName}`
  if (!isPlainObject(action)) {
    violations.push(`${prefix} must be an object.`)
    return
  }
  if (typeof action.description !== 'string' || !action.description.trim()) {
    violations.push(`${prefix}.description must be a non-empty string.`)
  }
  if (!VALID_ACTION_SCOPES.has(action.scope)) {
    violations.push(`${prefix}.scope must be "outbound" or "client".`)
  }
  if (action.payloadSchema) {
    for (const bad of findForbiddenPropsInSchema(action.payloadSchema, `${prefix}.payloadSchema`)) {
      violations.push(`${bad} is a forbidden catalog prop.`)
    }
  }
}

/**
 * Validates a single canonical catalog entry and returns a list of violations.
 */
export function validateCatalogEntry(entry: CatalogEntry, key?: string): readonly string[] {
  const violations: string[] = []
  if (!isPlainObject(entry)) {
    return [`Entry "${key ?? '(unnamed)'}" must be a plain object.`]
  }
  const label = typeof entry.name === 'string' && entry.name ? entry.name : (key ?? '(unnamed)')
  if (typeof entry.name !== 'string' || !ENTRY_NAME_PATTERN.test(entry.name)) {
    violations.push(`${label}: entry name must be PascalCase.`)
  }
  if (key !== undefined && entry.name !== key) {
    violations.push(`${label}: entry key "${key}" must match entry.name "${entry.name}".`)
  }
  if (!VALID_CATEGORIES.has(entry.category as CatalogCategory)) {
    violations.push(`${label}: unknown category "${String(entry.category)}".`)
  }
  if (typeof entry.description !== 'string' || !entry.description.trim()) {
    violations.push(`${label}: description must be a non-empty string.`)
  }
  if (entry.invocation !== undefined && !VALID_INVOCATIONS.has(entry.invocation)) {
    violations.push(`${label}: invocation must be "render" or "action".`)
  }
  if (!isPlainObject(entry.propsSchema)) {
    violations.push(`${label}: propsSchema must be an object schema.`)
  } else {
    if (entry.propsSchema.type !== 'object') {
      violations.push(`${label}: propsSchema.type must be "object".`)
    }
    if (entry.propsSchema.additionalProperties !== false) {
      violations.push(`${label}: propsSchema.additionalProperties must be false.`)
    }
    if (!isPlainObject(entry.propsSchema.properties)) {
      violations.push(`${label}: propsSchema.properties must be an object.`)
    } else {
      for (const bad of findForbiddenPropsInSchema(entry.propsSchema, `${label}.props`)) {
        violations.push(`${bad} is a forbidden catalog prop.`)
      }
      if (entry.propsSchema.required) {
        for (const requiredProp of entry.propsSchema.required) {
          if (!Object.hasOwn(entry.propsSchema.properties, requiredProp)) {
            violations.push(
              `${label}: required prop "${requiredProp}" is missing from propsSchema.properties.`
            )
          }
        }
      }
    }
  }
  if (!isPlainObject(entry.slots)) {
    violations.push(`${label}: slots must be an object.`)
  } else {
    for (const [slotName, slot] of Object.entries(entry.slots)) {
      validateSlot(label, slotName, slot, violations)
      if (
        isPlainObject(entry.propsSchema?.properties) &&
        Object.hasOwn(entry.propsSchema.properties, slotName)
      ) {
        violations.push(`${label}: slot "${slotName}" collides with a prop of the same name.`)
      }
      if (isPlainObject(entry.bindings) && Object.hasOwn(entry.bindings, slotName)) {
        violations.push(`${label}: slot "${slotName}" collides with a binding of the same name.`)
      }
    }
  }
  if (!isPlainObject(entry.bindings)) {
    violations.push(`${label}: bindings must be an object.`)
  } else {
    for (const [bindingName, binding] of Object.entries(entry.bindings)) {
      validateBinding(label, bindingName, binding, violations)
    }
  }
  if (!isPlainObject(entry.actions)) {
    violations.push(`${label}: actions must be an object.`)
  } else {
    for (const [actionName, action] of Object.entries(entry.actions)) {
      validateAction(label, actionName, action, violations)
    }
  }
  if (entry.guidance !== undefined) {
    if (!isPlainObject(entry.guidance)) {
      violations.push(`${label}: guidance must be an object.`)
    } else {
      if (typeof entry.guidance.whenToUse !== 'string' || !entry.guidance.whenToUse.trim()) {
        violations.push(`${label}: guidance.whenToUse must be a non-empty string.`)
      }
      if (typeof entry.guidance.whenNotToUse !== 'string' || !entry.guidance.whenNotToUse.trim()) {
        violations.push(`${label}: guidance.whenNotToUse must be a non-empty string.`)
      }
    }
  }
  return violations
}

/**
 * Validates an entire canonical catalog and returns all contract violations.
 */
export function validateCatalog(catalog: Catalog): readonly string[] {
  const violations: string[] = []
  if (!isPlainObject(catalog)) {
    return ['Catalog must be a plain object.']
  }
  if (typeof catalog.id !== 'string' || !catalog.id.trim()) {
    violations.push('Catalog id must be a non-empty string.')
  }
  if (typeof catalog.version !== 'string' || !catalog.version.trim()) {
    violations.push('Catalog version must be a non-empty string.')
  }
  if (typeof catalog.description !== 'string' || !catalog.description.trim()) {
    violations.push('Catalog description must be a non-empty string.')
  }
  if (!isPlainObject(catalog.entries)) {
    violations.push('Catalog entries must be an object.')
  } else {
    const names = Object.keys(catalog.entries)
    if (names.length === 0) {
      violations.push('Catalog must define at least one entry.')
    }
    for (const [key, entry] of Object.entries(catalog.entries)) {
      violations.push(...validateCatalogEntry(entry, key))
    }
    for (const [key, entry] of Object.entries(catalog.entries)) {
      if (!isPlainObject(entry) || !isPlainObject(entry.slots)) continue
      for (const [slotName, slot] of Object.entries(entry.slots)) {
        if (!slot.allowedEntries) continue
        for (const allowed of slot.allowedEntries) {
          if (!Object.hasOwn(catalog.entries, allowed)) {
            violations.push(
              `${key}.slots.${slotName}.allowedEntries references unknown entry "${allowed}".`
            )
          }
        }
      }
    }
  }
  return violations
}

/**
 * Throws a TypeError when the catalog violates any canonical contract rule.
 */
export function assertValidCatalog(catalog: Catalog): void {
  const violations = validateCatalog(catalog)
  if (violations.length > 0) {
    throw new TypeError(`Invalid Radiant catalog:\n- ${violations.join('\n- ')}`)
  }
}

function freezeDeep<T>(value: T): T {
  if (!value || typeof value !== 'object') return value
  if (Object.isFrozen(value)) return value
  if (Array.isArray(value)) {
    for (const item of value) freezeDeep(item)
  } else {
    for (const item of Object.values(value as Record<string, unknown>)) freezeDeep(item)
  }
  return Object.freeze(value)
}

function clonePlain<T>(value: T): T {
  return structuredClone(value)
}

/**
 * Validates and freezes a canonical catalog definition.
 */
export function defineCatalog(input: CatalogInput): Catalog {
  const catalog = clonePlain(input) as Catalog
  assertValidCatalog(catalog)
  return freezeDeep(catalog)
}

/**
 * Extends a base catalog with application entries without allowing name shadowing.
 */
export function extendCatalog(base: Catalog, extension: CatalogExtension): Catalog {
  assertValidCatalog(base)
  if (!isPlainObject(extension)) {
    throw new TypeError('Catalog extension must be a plain object.')
  }
  if (!isPlainObject(extension.entries) || Object.keys(extension.entries).length === 0) {
    throw new TypeError('Catalog extension must provide at least one entry.')
  }
  const collisions: string[] = []
  for (const key of Object.keys(extension.entries)) {
    if (Object.hasOwn(base.entries, key)) collisions.push(key)
  }
  if (collisions.length > 0) {
    throw new TypeError(
      `Catalog extension cannot shadow base entries: ${collisions.sort().join(', ')}.`
    )
  }
  const merged: Catalog = {
    id: extension.id,
    version: extension.version,
    description: extension.description ?? base.description,
    extends: base.id,
    entries: {
      ...clonePlain(base.entries),
      ...clonePlain(extension.entries)
    }
  }
  assertValidCatalog(merged)
  return freezeDeep(merged)
}
