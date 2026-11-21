/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The inline SVG drawing is named as one image. */
import { extendCatalog, radiantCatalog, type Catalog } from '../catalog/index.js'
import { themeTokenVar, type PublicThemeToken } from '../themes/publicTokens.js'
import type { A2uiAccessibilityRule } from './accessibilityRules.js'
import { readA2uiValue } from './adapterValues.js'
import { A2UI_PROTOCOL_VERSION } from './catalogGenerator.js'
import { createA2uiExtensionEntry, createA2uiExtensionRegistry } from './extensionEntry.js'
import type { A2uiRegistry } from './registry.js'
import type { A2uiMessage } from './sanitize.js'

/*
 * An application-defined entry built the way an app outside Radiant would: a canonical
 * entry added with extendCatalog, an A2UI entry with an adapter and accessibility rule,
 * and a registry under the host's own catalog id. The SVG reads only public theme tokens.
 */

export const SPARKLINE_TONES = ['accent', 'neutral', 'warning', 'danger'] as const
export type SparklineTone = (typeof SPARKLINE_TONES)[number]

const TONE_TOKENS: Readonly<Record<SparklineTone, PublicThemeToken>> = {
  accent: '--rad-color-accent',
  neutral: '--rad-color-muted-foreground',
  warning: '--rad-color-warning',
  danger: '--rad-color-danger'
}

export type SparklineExampleProps = {
  readonly label: string
  readonly values: readonly number[]
  readonly tone?: SparklineTone
}

const WIDTH = 120
const HEIGHT = 32
const INSET = 2

/** A trend line drawn in SVG with public theme tokens, so it follows every theme and mode. */
export function SparklineExample({ label, values, tone = 'accent' }: SparklineExampleProps) {
  const finite = values.filter(value => Number.isFinite(value))
  const min = Math.min(...finite)
  const range = Math.max(...finite) - min || 1
  const step = finite.length > 1 ? (WIDTH - INSET * 2) / (finite.length - 1) : 0
  const points = finite
    .map((value, index) => {
      const x = INSET + index * step
      const y = HEIGHT - INSET - ((value - min) / range) * (HEIGHT - INSET * 2)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
  return (
    <svg
      data-slot="sparkline-example"
      role="img"
      aria-label={label}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <line
        data-part="baseline"
        x1={0}
        x2={WIDTH}
        y1={HEIGHT - 0.5}
        y2={HEIGHT - 0.5}
        style={{ stroke: themeTokenVar('--rad-color-border'), strokeWidth: 1 }}
      />
      <polyline
        data-part="trend"
        points={points}
        style={{
          fill: 'none',
          stroke: themeTokenVar(TONE_TOKENS[tone]),
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          transition: `stroke ${themeTokenVar('--rad-motion-color-duration')}`
        }}
      />
    </svg>
  )
}

export const sparklineCatalog: Catalog = extendCatalog(radiantCatalog, {
  id: 'example/sparkline',
  version: '1.0.0',
  description: 'Radiant catalog plus one application-drawn trend line.',
  entries: {
    Sparkline: {
      name: 'Sparkline',
      category: 'data',
      description: 'Compact trend line for a short series of numbers.',
      guidance: {
        whenToUse: 'A trend beside a metric. Set `tone` for intent.',
        whenNotToUse: 'Exact values or comparisons between series.',
        examples: ['weekly signups, `tone: accent`', 'error rate, `tone: danger`']
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'values'],
        properties: {
          label: { type: 'string', minLength: 1, description: 'Accessible name of the trend.' },
          values: {
            type: 'array',
            minItems: 2,
            items: { type: 'number' },
            description: 'Series in display order.'
          },
          tone: {
            type: 'string',
            enum: SPARKLINE_TONES,
            default: 'accent',
            description: 'Semantic palette intent.'
          }
        }
      },
      slots: {},
      bindings: {},
      actions: {}
    }
  }
})

export const sparklineLabelRule: A2uiAccessibilityRule = {
  id: 'sparkline-label',
  check(component) {
    if (typeof component.label === 'string' && component.label.trim()) return
    return { prop: 'label', message: `Sparkline "${String(component.id)}" has no label.` }
  }
}

export const sparklineEntry = createA2uiExtensionEntry(sparklineCatalog, {
  name: 'Sparkline',
  component: SparklineExample,
  accessibility: [sparklineLabelRule],
  adapter(props) {
    const label = readA2uiValue(props.label)
    const values = readA2uiValue(props.values)
    return (
      <SparklineExample
        label={typeof label === 'string' ? label : ''}
        values={Array.isArray(values) ? values.filter(v => typeof v === 'number') : []}
        tone={SPARKLINE_TONES.find(tone => tone === readA2uiValue(props.tone))}
      />
    )
  }
})

export const SPARKLINE_CATALOG_ID = 'https://example.com/a2ui/sparkline-catalog.json'

export const sparklineRegistry: A2uiRegistry = createA2uiExtensionRegistry(sparklineCatalog, {
  catalogId: SPARKLINE_CATALOG_ID,
  title: 'Example host catalog',
  description: 'Radiant A2UI entries plus an application Sparkline.',
  entries: [sparklineEntry]
})

export const SPARKLINE_SURFACE_ID = 'trends'

export const sparklineFixtureMessages: readonly A2uiMessage[] = [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: SPARKLINE_SURFACE_ID,
      catalogId: SPARKLINE_CATALOG_ID,
      dataModel: { alerts: false },
      components: [
        {
          id: 'root',
          component: 'Column',
          children: ['heading', 'signups', 'latency', 'errors', 'alerts']
        },
        { id: 'heading', component: 'Text', text: 'This week' },
        {
          id: 'signups',
          component: 'Sparkline',
          label: 'Signups',
          values: [3, 5, 4, 8, 7, 11, 12]
        },
        {
          id: 'latency',
          component: 'Sparkline',
          label: 'Latency',
          values: [40, 38, 52, 47, 61, 58, 55],
          tone: 'warning'
        },
        {
          id: 'errors',
          component: 'Sparkline',
          label: 'Errors',
          values: [1, 0, 2, 1, 4, 6, 9],
          tone: 'danger'
        },
        {
          id: 'alerts',
          component: 'Switch',
          label: 'Alert on errors',
          checked: { '@path': '/alerts' }
        }
      ]
    }
  }
]
