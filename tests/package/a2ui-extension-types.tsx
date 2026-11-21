import {
  PUBLIC_THEME_TOKENS,
  themeTokenVar,
  type PublicThemeToken,
  type ThemeStyle
} from '@cognitap/radiant'
import { extendCatalog, radiantCatalog, type CatalogEntry } from '@cognitap/radiant/catalog'
import {
  createA2uiExtensionEntry,
  createA2uiExtensionRegistry,
  type A2uiRegistry,
  isA2uiChildNode,
  readA2uiValue,
  runA2uiAction,
  writeA2uiBinding,
  type A2uiComponentAdapter,
  type A2uiExtensionEntryInput,
  type A2uiRegistryEntry
} from '@cognitap/radiant/a2ui'

export const accent: PublicThemeToken = '--rad-color-accent'
export const tokens: readonly PublicThemeToken[] = PUBLIC_THEME_TOKENS
export const style: ThemeStyle = { color: themeTokenVar('--rad-color-foreground') }
// @ts-expect-error component overrides are not public tokens
themeTokenVar('--rad-button-radius')
// @ts-expect-error internal properties are not public tokens
export const internal: PublicThemeToken = '--_rad-light'

const meterProps = {
  type: 'object',
  additionalProperties: false,
  required: ['label'],
  properties: { label: { type: 'string' } }
} as const

export const meter: CatalogEntry = {
  name: 'Meter',
  category: 'data',
  description: 'Shows one value.',
  guidance: { whenToUse: 'One value.', whenNotToUse: 'Trends.', examples: ['disk', 'battery'] },
  propsSchema: meterProps,
  slots: {},
  bindings: {},
  actions: {}
}

// @ts-expect-error an entry without guidance is not a CatalogEntry
export const unguided: CatalogEntry = {
  name: 'Meter',
  category: 'data',
  description: 'Shows one value.',
  propsSchema: meterProps,
  slots: {},
  bindings: {},
  actions: {}
}

// @ts-expect-error an entry without a props schema is not a CatalogEntry
export const unschemed: CatalogEntry = {
  name: 'Meter',
  category: 'data',
  description: 'Shows one value.',
  guidance: { whenToUse: 'One value.', whenNotToUse: 'Trends.', examples: ['disk', 'battery'] },
  slots: {},
  bindings: {},
  actions: {}
}

export const guidanceNeedsTwoExamples: CatalogEntry['guidance'] = {
  whenToUse: 'One value.',
  whenNotToUse: 'Trends.',
  // @ts-expect-error guidance takes exactly two examples
  examples: ['disk']
}

const appCatalog = extendCatalog(radiantCatalog, {
  id: 'consumer/meter',
  version: '1.0.0',
  entries: { AppMeter: { ...meter, name: 'AppMeter' } }
})

export const registered: A2uiRegistryEntry = createA2uiExtensionEntry(appCatalog, {
  name: 'AppMeter',
  component: 'svg',
  adapter: () => null,
  accessibility: []
})

// @ts-expect-error accessibility rules are required, even when empty
export const unruled: A2uiExtensionEntryInput = {
  name: 'AppMeter',
  component: 'svg',
  adapter: () => null
}

// @ts-expect-error an adapter is required
export const unadapted: A2uiExtensionEntryInput = {
  name: 'AppMeter',
  component: 'svg',
  accessibility: []
}

export const helperAdapter: A2uiComponentAdapter = (props, context) => {
  const value: unknown = readA2uiValue(props.value)
  const wrote: boolean = writeA2uiBinding(props.value, value)
  const ran: Promise<boolean> = runA2uiAction(props.action)
  void ran
  return isA2uiChildNode(props.child) && wrote ? context.renderNode(props.child) : null
}

export const hostRegistry: A2uiRegistry = createA2uiExtensionRegistry(appCatalog, {
  catalogId: 'https://consumer.example/catalog.json',
  entries: [registered]
})
// @ts-expect-error a host registry needs its own catalog ID
createA2uiExtensionRegistry(appCatalog, { entries: [registered] })
