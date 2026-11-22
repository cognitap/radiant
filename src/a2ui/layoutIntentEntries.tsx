'use client'

import { Fragment, useEffect, useState } from 'react'
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
import { useA2uiLabels, type A2uiSurfaceLabels } from './surfaceContext.js'

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
    const main = <SplitMain key="main">{renderChild(props.main, context)}</SplitMain>
    const secondary = (
      <SplitSecondary key="secondary">{renderChild(props.secondary, context)}</SplitSecondary>
    )
    // Source order sets both the stacked and the side-by-side order, so reading order matches.
    return (
      <Split
        data-slot="a2ui-split"
        ratio={props.ratio === 'balanced' ? 'balanced' : 'main'}
        gap={readGap(props)}
      >
        {props.side === 'start' ? [secondary, main] : [main, secondary]}
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
        {childList(props.children).map(child => (
          <div key={child.instanceId}>{context.renderNode(child)}</div>
        ))}
      </Grid>
    )
  }
})

const COMPARE_MAX_ITEMS = 4

/**
 * Compare that coerces its children: items past the fourth are dropped, a child that is not a
 * CompareItem becomes one item's body, and fewer than two items stack without columns.
 */
function A2uiCompare({
  items,
  gap,
  context
}: {
  items: readonly ComponentNode[]
  gap: Spacing
  context: A2uiAdapterContext
}) {
  const count = items.length
  const nodeId = context.node.componentId
  const report = context.reportDiagnostic
  useEffect(() => {
    if (count >= 2 && count <= COMPARE_MAX_ITEMS) return
    report?.({
      kind: 'coerced',
      nodeId,
      component: 'Compare',
      prop: 'children',
      received: count,
      used: Math.min(count, COMPARE_MAX_ITEMS),
      reason:
        count < 2
          ? 'Compare needs two to four items; fewer stack without columns.'
          : 'Compare shows at most four items; the rest are dropped.'
    })
  }, [count, nodeId, report])
  const rendered = items.slice(0, COMPARE_MAX_ITEMS).map(child => (
    <Fragment key={child.instanceId}>
      {child.type === 'CompareItem' ? (
        context.renderNode(child)
      ) : (
        <CompareItem>
          <CompareItemBody>{context.renderNode(child)}</CompareItemBody>
        </CompareItem>
      )}
    </Fragment>
  ))
  if (count < 2)
    return (
      <Stack
        data-slot="a2ui-compare"
        gap={gap}
      >
        {items.map(child => (
          <Fragment key={child.instanceId}>{context.renderNode(child)}</Fragment>
        ))}
      </Stack>
    )
  return (
    <Compare
      data-slot="a2ui-compare"
      gap={gap}
    >
      {rendered}
    </Compare>
  )
}

const compareEntry = createA2uiRegistryEntry({
  name: 'Compare',
  accessibility: [],
  component: Compare,
  schema: schemaOf('Compare'),
  description: schemaOf('Compare').description,
  adapter(props, context) {
    return (
      <A2uiCompare
        items={childList(props.children)}
        gap={readGap(props)}
        context={context}
      />
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

/** Fills `{index}` (from 1) and `{count}` in a host position template. */
function positionFrom(
  label: A2uiSurfaceLabels['revealPosition']
): ((index: number, count: number) => string) | undefined {
  if (typeof label === 'function') return label
  if (typeof label !== 'string' || !label.trim()) return undefined
  return (index, count) =>
    label.replaceAll('{index}', String(index + 1)).replaceAll('{count}', String(count))
}

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
  const positionLabel = positionFrom(labels.revealPosition)
  const labelled = Boolean(previousLabel && nextLabel && positionLabel)
  const nodeId = context.node.componentId
  const report = context.reportDiagnostic
  useEffect(() => {
    if (labelled) return
    report?.({
      kind: 'defaulted',
      nodeId,
      component: 'Reveal',
      prop: 'steps',
      received: null,
      used: 'all steps',
      reason:
        'A2uiSurface labels lack revealPrevious, revealNext or revealPosition; every step is shown.'
    })
  }, [labelled, nodeId, report])
  // Template instances share a component id, so steps are told apart by their instance id.
  const values = steps.map(step => step.instanceId)
  if (steps.length < 2 || !previousLabel || !nextLabel || !positionLabel) {
    return (
      <Stack
        data-slot="a2ui-reveal"
        gap={gap}
      >
        {steps.map(step => (
          <Fragment key={step.instanceId}>{context.renderNode(step)}</Fragment>
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
        value: step.instanceId,
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
