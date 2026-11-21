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
  type CatalogActionEvent,
  type CatalogActionHandler,
  type CatalogDiagnostic,
  validateA2uiAccessibility,
  controlLabelRule,
  imageAltRule,
  mediaNameRule,
  A2uiMediaProvider,
  type A2uiIconMap,
  type A2uiAccessibilityError
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
  void action.action
  void action.nodeId
  void action.state
  void action.name
  void action.context
}

export const catalogActionHandler: CatalogActionHandler = (event: CatalogActionEvent) => {
  void event.action
  void event.surfaceId
  void event.nodeId
  void event.state
}

const customEntry: A2uiRegistryEntry = createA2uiRegistryEntry({
  name: 'Notice',
  accessibility: [],
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
export const catalogBoundElement = (
  <A2uiSurface
    surfaceId="demo"
    messages={messages}
    onAction={catalogActionHandler}
  />
)

export const accessibilityErrors: readonly A2uiAccessibilityError[] = validateA2uiAccessibility(
  messages,
  { registry: customRegistry, fix: true }
).errors

export const labeledEntry = createA2uiRegistryEntry({
  name: 'LabeledNotice',
  component: 'div',
  description: 'Notice with a required label.',
  schema: { type: 'object', properties: { component: { const: 'LabeledNotice' } } },
  adapter: () => null,
  accessibility: [controlLabelRule()]
})

// @ts-expect-error entries must declare accessibility rules
createA2uiRegistryEntry({
  name: 'Undeclared',
  component: 'div',
  description: 'Missing rules.',
  schema: { type: 'object' },
  adapter: () => null
})

const StarGlyph = ({ className }: { readonly className?: string }) => <svg className={className} />
export const iconMap: A2uiIconMap = { star: StarGlyph }
export const iconProviderElement = (
  <A2uiMediaProvider icons={iconMap}>
    <A2uiSurface
      surfaceId="demo"
      messages={messages}
    />
  </A2uiMediaProvider>
)
export const mediaEntry = createA2uiRegistryEntry({
  name: 'Clip',
  component: 'video',
  description: 'Named clip.',
  schema: { type: 'object', properties: { component: { const: 'Clip' } } },
  adapter: () => null,
  accessibility: [imageAltRule(), mediaNameRule({ names: ['accessibility.label'] })]
})
