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

/** True for component and data updates that need the surface to exist first. */
export const updatesSurface = (message: A2uiMessage, surfaceId: string) =>
  surfaceOf(message, 'updateComponents') === surfaceId ||
  surfaceOf(message, 'updateDataModel') === surfaceId
