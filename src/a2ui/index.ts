export { A2uiSurface } from './A2uiSurface.js'
export type { A2uiActionPayload, A2uiSurfaceProps } from './A2uiSurface.js'
export type { A2uiSurfaceLabels } from './surfaceContext.js'
export { radiantA2uiRegistry } from './entries.js'
export { createA2uiRegistry, createA2uiRegistryEntry } from './registry.js'
export type {
  A2uiAdapterContext,
  A2uiComponentAdapter,
  A2uiComponentReference,
  A2uiRegistry,
  A2uiRegistryEntry,
  A2uiRegistryEntryInput,
  A2uiRegistryInput,
  A2uiRenderOptions
} from './registry.js'
export {
  A2UI_BASIC_CATALOG_ID,
  A2UI_PROTOCOL_VERSION,
  RADIANT_A2UI_EXTENSION_CATALOG_ID,
  generateA2uiCatalogs
} from './catalogGenerator.js'
export type {
  A2uiCatalogDocument,
  A2uiJsonSchema,
  GeneratedA2uiCatalogs
} from './catalogGenerator.js'
export { validateA2uiAccessibility } from './accessibility.js'
export type {
  A2uiAccessibilityError,
  ValidateA2uiAccessibilityOptions,
  ValidateA2uiAccessibilityResult
} from './accessibility.js'
export {
  buttonNameRule,
  controlLabelRule,
  imageAltRule,
  mediaNameRule
} from './accessibilityRules.js'
export type {
  A2uiAccessibilityFinding,
  A2uiAccessibilityRule,
  A2uiAccessibilityRuleContext,
  A2uiComponentRecord,
  ControlLabelRuleOptions,
  MediaNameRuleOptions
} from './accessibilityRules.js'
export { sanitizeA2uiMessages } from './sanitize.js'
export type { A2uiMessage } from './sanitize.js'
export { COERCED_NOOP_ACTION_NAME, coerceA2uiMessages } from './coerce.js'
export type { CoerceA2uiMessagesResult } from './coerce.js'
export type {
  CatalogActionEvent,
  CatalogActionHandler,
  CatalogDiagnostic,
  CatalogDiagnosticKind,
  CatalogSurfaceState
} from '../catalog/index.js'
export { A2uiMediaProvider } from './media.js'
export type {
  A2uiIconComponent,
  A2uiIconMap,
  A2uiMediaProviderProps,
  A2uiUrlPolicy
} from './media.js'
export { A2UI_BASIC_CATALOG_REVISION } from './specRevision.js'
