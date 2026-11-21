export type CatalogSurfaceState = Readonly<Record<string, unknown>>

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cloneJsonSafe(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneJsonSafe)
  if (!isRecord(value)) return value
  const copy: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== 'function' && typeof entry !== 'symbol' && entry !== undefined) {
      copy[key] = cloneJsonSafe(entry)
    }
  }
  return copy
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value
  if (Array.isArray(value)) {
    for (const item of value) deepFreeze(item)
  } else {
    for (const entry of Object.values(value)) deepFreeze(entry)
  }
  return Object.freeze(value)
}

/** Captures an isolated, immutable snapshot of a surface's client-side state. */
export function snapshotSurfaceState(rawState: unknown): CatalogSurfaceState {
  if (!isRecord(rawState)) return Object.freeze({})
  try {
    return deepFreeze(structuredClone(rawState))
  } catch {
    return deepFreeze(cloneJsonSafe(rawState) as Record<string, unknown>)
  }
}

function requireIdentifier(value: string, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`CatalogActionEvent "${field}" must be a non-empty string.`)
  }
  return value
}

/** Builds a frozen protocol-independent action event with an isolated state snapshot. */
export function createCatalogActionEvent(input: CatalogActionEventInput): CatalogActionEvent {
  return Object.freeze({
    action: requireIdentifier(input.action, 'action'),
    surfaceId: requireIdentifier(input.surfaceId, 'surfaceId'),
    nodeId: requireIdentifier(input.nodeId, 'nodeId'),
    state: snapshotSurfaceState(input.state)
  })
}
