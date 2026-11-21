import { isPlainRecord } from '../catalog/coerce.js'
import type { CatalogDiagnostic } from '../catalog/index.js'
import type { A2uiMessage } from './sanitize.js'

const COMPONENT_ID_PATTERN = /Component '([^']+)'/

/** Maps a `@a2ui/web_core` error payload onto the structured `onDiagnostic` channel. */
export function protocolErrorDiagnostic(error: unknown): CatalogDiagnostic {
  const payload = isPlainRecord(error) ? error : {}
  const code = typeof payload.code === 'string' ? payload.code : 'PROTOCOL_ERROR'
  const message = typeof payload.message === 'string' ? payload.message : 'Protocol error.'
  return {
    kind: 'error',
    code,
    nodeId: COMPONENT_ID_PATTERN.exec(message)?.[1] ?? '',
    component: 'surface',
    prop: 'message',
    received: Object.freeze({ ...payload }),
    used: undefined,
    reason: message
  }
}

function surfaceOf(message: A2uiMessage, key: string): string | undefined {
  if (!isPlainRecord(message)) return undefined
  const body = message[key]
  return isPlainRecord(body) && typeof body.surfaceId === 'string' ? body.surfaceId : undefined
}

export const createsSurface = (message: A2uiMessage, surfaceId: string) =>
  surfaceOf(message, 'createSurface') === surfaceId

export const deletesSurface = (message: A2uiMessage, surfaceId: string) =>
  surfaceOf(message, 'deleteSurface') === surfaceId

/** Drops buffered updates a snapshot `createSurface` already supersedes. */
export function supersededBy(create: A2uiMessage, held: A2uiMessage): boolean {
  const body = isPlainRecord(create) ? create.createSurface : undefined
  if (!isPlainRecord(body) || !isPlainRecord(held)) return false
  return (
    (body.components !== undefined && 'updateComponents' in held) ||
    (body.dataModel !== undefined && 'updateDataModel' in held)
  )
}

/** True for component and data updates that need the surface to exist first. */
export const updatesSurface = (message: A2uiMessage, surfaceId: string) =>
  surfaceOf(message, 'updateComponents') === surfaceId ||
  surfaceOf(message, 'updateDataModel') === surfaceId

/** Component definitions a `createSurface` or `updateComponents` message carries for this surface. */
export function streamedComponents(
  message: A2uiMessage,
  surfaceId: string
): readonly Readonly<Record<string, unknown>>[] {
  for (const key of ['createSurface', 'updateComponents']) {
    const body = isPlainRecord(message) ? message[key] : undefined
    if (isPlainRecord(body) && body.surfaceId === surfaceId && Array.isArray(body.components)) {
      return body.components.filter(isPlainRecord)
    }
  }
  return []
}
