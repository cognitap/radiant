import {
  A2UI_BASIC_CATALOG_ID,
  A2UI_PROTOCOL_VERSION,
  A2uiSurface,
  coerceA2uiMessages,
  createA2uiRegistry,
  createA2uiRegistryEntry,
  radiantA2uiRegistry,
  sanitizeA2uiMessages,
  type A2uiActionPayload,
  type A2uiCatalogDocument,
  type A2uiMessage,
  type A2uiRegistry,
  type A2uiRegistryEntry,
  type A2uiSurfaceProps,
  type CatalogDiagnostic
} from '@cognitap/radiant/a2ui'

const messages: readonly A2uiMessage[] = sanitizeA2uiMessages([
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: 'demo',
      catalogId: A2UI_BASIC_CATALOG_ID,
      components: [{ id: 'root', component: 'Text', text: 'Hello' }]
    }
  }
])

const onAction = (action: A2uiActionPayload) => {
  void action.name
  void action.context
}

const customEntry: A2uiRegistryEntry = createA2uiRegistryEntry({
  name: 'Notice',
  component: 'div',
  description: 'Simple notice block.',
  schema: {
    type: 'object',
    properties: {
      component: { const: 'Notice' },
      text: { type: 'string' }
    },
    required: ['component', 'text']
  },
  adapter: props => <div>{String(props.text ?? '')}</div>
})

export const customRegistry: A2uiRegistry = createA2uiRegistry({
  catalogId: 'https://example.com/a2ui/v1_0/custom.json',
  title: 'Custom',
  description: 'Custom A2UI registry.',
  entries: [customEntry]
})

export const catalogDoc: A2uiCatalogDocument = radiantA2uiRegistry.toCatalogJson()
export const coercedDiagnostics: readonly CatalogDiagnostic[] = coerceA2uiMessages(
  messages,
  radiantA2uiRegistry
).diagnostics

const onDiagnostic = (diagnostic: CatalogDiagnostic) => {
  void diagnostic.nodeId
  void diagnostic.prop
}

const props: A2uiSurfaceProps = {
  surfaceId: 'demo',
  messages,
  registry: radiantA2uiRegistry,
  onAction,
  onDiagnostic
}

export const element = <A2uiSurface {...props} />
