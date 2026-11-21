export type CatalogJsonValue =
  | string
  | number
  | boolean
  | null
  | readonly CatalogJsonValue[]
  | { readonly [key: string]: CatalogJsonValue }

/**
 * Immutable JSON snapshot of a surface's client-side state.
 * Preserves any JSON root value supported by the runtime (object, array, primitive, or `null`).
 * When no state is available (`undefined`) or the root is unsupported, snapshots normalize to a
 * frozen empty object (`{}`).
 */
export type CatalogSurfaceState = CatalogJsonValue

/**
 * Outbound event delivered to the host when a generated surface triggers a named action.
 * Local interactive entries update client state directly without invoking this callback;
 * only named actions deliver the action name and a snapshot of the surface state.
 */
export type CatalogActionEvent = {
  readonly action: string
  readonly surfaceId: string
  readonly nodeId: string
  readonly state: CatalogSurfaceState
}

/** Host callback invoked when a generated surface dispatches a named outbound action. */
export type CatalogActionHandler = (event: CatalogActionEvent) => void

export type CatalogActionEventInput = {
  readonly action: string
  readonly surfaceId: string
  readonly nodeId: string
  readonly state?: unknown
}

const UNSUPPORTED = Symbol('unsupported')

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * Converts arbitrary runtime values to deeply frozen JSON values.
 * Non-JSON objects (such as Map, Set, Date, RegExp, or class instances), non-finite numbers,
 * functions, and symbols are dropped from objects, replaced with `null` in arrays, and
 * normalized to `{}` at the root so no mutable reference can survive `Object.freeze`.
 */
function snapshotJsonValue(
  value: unknown,
  seen: Set<object>
): CatalogJsonValue | typeof UNSUPPORTED {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : UNSUPPORTED
  if (Array.isArray(value)) {
    if (seen.has(value)) return null
    seen.add(value)
    const copy = value.map(item => {
      const next = snapshotJsonValue(item, seen)
      return next === UNSUPPORTED ? null : next
    })
    seen.delete(value)
    return Object.freeze(copy)
  }
  if (!isPlainObject(value)) return UNSUPPORTED
  if (seen.has(value)) return Object.freeze({})
  seen.add(value)
  const copy: Record<string, CatalogJsonValue> = {}
  for (const [key, entry] of Object.entries(value)) {
    const next = snapshotJsonValue(entry, seen)
    if (next !== UNSUPPORTED) copy[key] = next
  }
  seen.delete(value)
  return Object.freeze(copy)
}

/**
 * Captures an isolated, deeply frozen JSON snapshot of a surface's client-side state.
 * When `rawState` is `undefined` or an unsupported non-JSON value, returns a frozen empty object.
 */
export function snapshotSurfaceState(rawState: unknown): CatalogSurfaceState {
  const snapshot = snapshotJsonValue(rawState, new Set())
  return snapshot === UNSUPPORTED ? Object.freeze({}) : snapshot
}

function requireIdentifier(value: string, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`CatalogActionEvent "${field}" must be a non-empty string.`)
  }
  return value
}

/**
 * Builds a frozen protocol-independent action event with an isolated state snapshot.
 * If `state` is omitted (`undefined`), `event.state` defaults to a frozen empty object (`{}`).
 */
export function createCatalogActionEvent(input: CatalogActionEventInput): CatalogActionEvent {
  return Object.freeze({
    action: requireIdentifier(input.action, 'action'),
    surfaceId: requireIdentifier(input.surfaceId, 'surfaceId'),
    nodeId: requireIdentifier(input.nodeId, 'nodeId'),
    state: snapshotSurfaceState(input.state)
  })
}
