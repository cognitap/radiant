'use client'

import { Fragment, useState } from 'react'
import type { ComponentNode } from '@a2ui/web_core/resolution'
import {
  Compare,
  CompareItem,
  CompareItemBody,
  CompareItemFooter,
  CompareItemHeader
} from '../components/Compare/Compare.js'
import { Grid, type GridColumns } from '../components/Grid/Grid.js'
import { Reveal } from '../components/Reveal/Reveal.js'
import { Split, SplitMain, SplitSecondary } from '../components/Split/Split.js'
import { Stack } from '../components/Stack/Stack.js'
import type { Spacing } from '../presentation.js'
import { radiantCatalog } from '../catalog/index.js'
import { generateA2uiCatalogs, type A2uiJsonSchema } from './catalogGenerator.js'
import { createA2uiRegistryEntry, type A2uiAdapterContext } from './registry.js'
import type { A2uiAccessibilityRule } from './accessibilityRules.js'
import { isA2uiChildNode } from './adapterValues.js'
import { useA2uiLabels } from './surfaceContext.js'

const components = generateA2uiCatalogs(radiantCatalog).extension.components

function schemaOf(name: string): A2uiJsonSchema & { readonly description: string } {
  const schema = components[name]
  if (!schema || typeof schema.description !== 'string') {
    throw new TypeError(`A2UI extension catalog generator did not emit "${name}".`)
  }
  return schema as A2uiJsonSchema & { readonly description: string }
}

type Props = Readonly<Record<string, unknown>>

const SPACING: readonly string[] = ['tight', 'normal', 'airy']
const readGap = (props: Props): Spacing =>
  typeof props.gap === 'string' && SPACING.includes(props.gap) ? (props.gap as Spacing) : 'normal'
const childList = (value: unknown): ComponentNode[] =>
  Array.isArray(value) ? value.filter(isA2uiChildNode) : []
const renderChild = (value: unknown, context: A2uiAdapterContext) =>
  isA2uiChildNode(value) ? context.renderNode(value) : null

const splitEntry = createA2uiRegistryEntry({
  name: 'Split',
  accessibility: [],
  component: [Split, SplitMain, SplitSecondary],
  schema: schemaOf('Split'),
  description: schemaOf('Split').description,
  adapter(props, context) {
    return (
      <Split
        data-slot="a2ui-split"
        side={props.side === 'start' ? 'start' : 'end'}
        ratio={props.ratio === 'balanced' ? 'balanced' : 'main'}
        gap={readGap(props)}
      >
        <SplitMain>{renderChild(props.main, context)}</SplitMain>
        <SplitSecondary>{renderChild(props.secondary, context)}</SplitSecondary>
      </Split>
    )
  }
})

/** Rounds a column cap into 1 to 6, defaulting to 3. */
function readColumns(value: unknown): GridColumns {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 3
  return Math.min(6, Math.max(1, Math.round(value))) as GridColumns
}

const gridEntry = createA2uiRegistryEntry({
  name: 'Grid',
  accessibility: [],
  component: Grid,
  schema: schemaOf('Grid'),
  description: schemaOf('Grid').description,
  adapter(props, context) {
    return (
      <Grid
        data-slot="a2ui-grid"
        maxColumns={readColumns(props.maxColumns)}
        gap={readGap(props)}
      >
        {childList(props.children).map((child, index) => (
          <div key={`${child.componentId}:${child.dataPath ?? index}`}>
            {context.renderNode(child)}
          </div>
        ))}
      </Grid>
    )
  }
})

const COMPARE_MAX_ITEMS = 4

const compareEntry = createA2uiRegistryEntry({
  name: 'Compare',
  accessibility: [],
  component: Compare,
  schema: schemaOf('Compare'),
  description: schemaOf('Compare').description,
  adapter(props, context) {
    // Extra items are dropped; a child that is not a CompareItem becomes one item's body.
    return (
      <Compare
        data-slot="a2ui-compare"
        gap={readGap(props)}
      >
        {childList(props.children)
          .slice(0, COMPARE_MAX_ITEMS)
          .map(child => (
            <Fragment key={child.componentId}>
              {child.type === 'CompareItem' ? (
                context.renderNode(child)
              ) : (
                <CompareItem>
                  <CompareItemBody>{context.renderNode(child)}</CompareItemBody>
                </CompareItem>
              )}
            </Fragment>
          ))}
      </Compare>
    )
  }
})

/** Requires each CompareItem to have a `header` that names its option. */
const compareItemHeaderRule: A2uiAccessibilityRule = {
  id: 'compare-item-header',
  check(component) {
    if (typeof component.header === 'string' && component.header.trim()) return
    return {
      prop: 'header',
      message: `CompareItem "${String(component.id)}" has no header to name its option.`
    }
  }
}

const compareItemEntry = createA2uiRegistryEntry({
  name: 'CompareItem',
  accessibility: [compareItemHeaderRule],
  component: [CompareItem, CompareItemHeader, CompareItemBody, CompareItemFooter],
  schema: schemaOf('CompareItem'),
  description: schemaOf('CompareItem').description,
  adapter(props, context) {
    return (
      <CompareItem data-slot="a2ui-compare-item">
        {isA2uiChildNode(props.header) ? (
          <CompareItemHeader>{context.renderNode(props.header)}</CompareItemHeader>
        ) : null}
        {isA2uiChildNode(props.body) ? (
          <CompareItemBody>{context.renderNode(props.body)}</CompareItemBody>
        ) : null}
        {isA2uiChildNode(props.footer) ? (
          <CompareItemFooter>{context.renderNode(props.footer)}</CompareItemFooter>
        ) : null}
      </CompareItem>
    )
  }
})

/** Reveal with the host's control labels; without them every step shows in order. */
function A2uiReveal({
  steps,
  gap,
  context
}: {
  steps: readonly ComponentNode[]
  gap: Spacing
  context: A2uiAdapterContext
}) {
  const labels = useA2uiLabels()
  const [chosen, setChosen] = useState<string | null>(null)
  const previousLabel = labels.revealPrevious?.trim()
  const nextLabel = labels.revealNext?.trim()
  const positionLabel = labels.revealPosition
  const values = steps.map(step => step.componentId)
  if (
    steps.length < 2 ||
    new Set(values).size !== values.length ||
    !previousLabel ||
    !nextLabel ||
    typeof positionLabel !== 'function'
  ) {
    return (
      <Stack
        data-slot="a2ui-reveal"
        gap={gap}
      >
        {steps.map(step => (
          <Fragment key={step.componentId}>{context.renderNode(step)}</Fragment>
        ))}
      </Stack>
    )
  }
  return (
    <Reveal
      data-slot="a2ui-reveal"
      gap={gap}
      previousLabel={previousLabel}
      nextLabel={nextLabel}
      positionLabel={positionLabel}
      // A patch that removes the shown step falls back to the first one.
      value={chosen !== null && values.includes(chosen) ? chosen : values[0]!}
      onValueChange={setChosen}
      items={steps.map(step => ({
        value: step.componentId,
        children: context.renderNode(step)
      }))}
    />
  )
}

const revealEntry = createA2uiRegistryEntry({
  name: 'Reveal',
  accessibility: [],
  component: Reveal,
  schema: schemaOf('Reveal'),
  description: schemaOf('Reveal').description,
  adapter(props, context) {
    return (
      <A2uiReveal
        steps={childList(props.steps)}
        gap={readGap(props)}
        context={context}
      />
    )
  }
})

/** Split, Grid, Compare and Reveal for the Radiant A2UI extension registry. */
export const layoutIntentEntries = [
  splitEntry,
  gridEntry,
  compareEntry,
  compareItemEntry,
  revealEntry
]
