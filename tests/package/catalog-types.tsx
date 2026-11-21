import {
  CATALOG_SPACING,
  CHOICE_PRESENTATIONS,
  assertValidCatalog,
  coerceSchemaProps,
  createCatalogActionEvent,
  defineCatalog,
  extendCatalog,
  isForbiddenCatalogProp,
  radiantCatalog,
  snapshotSurfaceState,
  summarizeCatalogDiagnostics,
  validateCatalog,
  type Catalog,
  type CatalogActionEvent,
  type CatalogActionHandler,
  type CatalogDiagnostic,
  type CatalogDiagnosticSummary,
  type CatalogEntry,
  type CatalogSpacing,
  type CatalogSurfaceState,
  type ChoicePresentation
} from '@cognitap/radiant/catalog'

export const spacing: CatalogSpacing = CATALOG_SPACING[1]
export const presentation: ChoicePresentation = CHOICE_PRESENTATIONS[0]
export const canonical: Catalog = radiantCatalog
export const choiceEntry: CatalogEntry | undefined = canonical.entries.Choice

export const customCatalog: Catalog = extendCatalog(canonical, {
  id: 'consumer/extensions',
  version: '1.0.0',
  entries: {
    MetricSummary: {
      name: 'MetricSummary',
      category: 'data',
      description: 'Summarizes a single metric.',
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'value'],
        properties: {
          label: { type: 'string' },
          value: { type: 'string' }
        }
      },
      slots: {},
      bindings: {},
      actions: {}
    }
  }
})

export const standaloneCatalog: Catalog = defineCatalog({
  id: 'consumer/standalone',
  version: '1.0.0',
  description: 'Standalone catalog.',
  entries: {
    Note: {
      name: 'Note',
      category: 'content',
      description: 'Short note block.',
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['text'],
        properties: { text: { type: 'string' } }
      },
      slots: {},
      bindings: {},
      actions: {}
    }
  }
})

assertValidCatalog(customCatalog)
export const violations: readonly string[] = validateCatalog(standaloneCatalog)
export const forbidden: boolean = isForbiddenCatalogProp('className')
export const coercedDiagnostics: readonly CatalogDiagnostic[] = coerceSchemaProps(
  canonical.entries.Button.propsSchema,
  { label: 'Go', tone: 'bad' },
  { nodeId: 'go', component: 'Button' }
).diagnostics
export const summary: CatalogDiagnosticSummary = summarizeCatalogDiagnostics(coercedDiagnostics)
export const stateSnapshot: CatalogSurfaceState = snapshotSurfaceState({ answer: '42' })
export const actionEvent: CatalogActionEvent = createCatalogActionEvent({
  action: 'submit',
  surfaceId: 'demo',
  nodeId: 'submit_btn',
  state: stateSnapshot
})
export const actionHandler: CatalogActionHandler = event => {
  void event.action
  void event.surfaceId
  void event.nodeId
  void event.state
}
