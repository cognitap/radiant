import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, expect, test, vi } from 'vitest'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  ThemeScope
} from '../../src/index.js'
import type { ThemeStyle } from '../../src/themes/defineTheme.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: Array<{ root: Root; host: HTMLDivElement }> = []

async function mount(tree: ReactNode) {
  const host = document.createElement('div')
  document.body.append(host)
  let root!: Root
  await act(async () => {
    root = createRoot(host)
    root.render(<ThemeScope>{tree}</ThemeScope>)
  })
  mounted.push({ root, host })
  return host
}

afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
})

function collapsible(style: ThemeStyle) {
  return (
    <Collapsible
      defaultOpen
      style={style}
    >
      <CollapsibleTrigger>Shipping</CollapsibleTrigger>
      <CollapsibleContent>Ships in two days.</CollapsibleContent>
    </Collapsible>
  )
}

function accordion(style: ThemeStyle) {
  return (
    <Accordion
      type="single"
      defaultValue="shipping"
    >
      <AccordionItem
        value="shipping"
        style={style}
      >
        <AccordionTrigger>Shipping</AccordionTrigger>
        <AccordionContent>Ships in two days.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function padding(host: HTMLElement) {
  const trigger = getComputedStyle(host.querySelector('summary')!)
  const content = getComputedStyle(host.querySelector('[data-slot~=collapsible-content]')!)
  return {
    trigger: trigger.padding,
    contentInline: content.paddingLeft,
    contentBottom: content.paddingBottom
  }
}

const families = [
  { name: 'Collapsible', render: collapsible },
  { name: 'Accordion', render: accordion }
]

for (const { name, render } of families) {
  test(`${name}: the shared padding token sets trigger and content`, async () => {
    const host = await mount(render({ '--rad-collapsible-padding': '18px' }))
    expect(padding(host)).toEqual({
      trigger: '18px',
      contentInline: '18px',
      contentBottom: '18px'
    })
  })

  test(`${name}: the trigger padding token moves only the trigger`, async () => {
    const base = padding(await mount(render({ '--rad-collapsible-padding': '18px' })))
    const host = await mount(
      render({ '--rad-collapsible-padding': '18px', '--rad-collapsible-trigger-padding': '30px' })
    )
    expect(padding(host)).toEqual({ ...base, trigger: '30px' })
  })

  test(`${name}: the content padding token moves only the content`, async () => {
    const base = padding(await mount(render({ '--rad-collapsible-padding': '18px' })))
    const host = await mount(
      render({ '--rad-collapsible-padding': '18px', '--rad-collapsible-content-padding': '6px' })
    )
    expect(padding(host)).toEqual({ ...base, contentInline: '6px', contentBottom: '6px' })
  })

  test(`${name}: without the shared token the surface padding applies to both`, async () => {
    const host = await mount(render({ '--rad-surface-padding': '22px' }))
    expect(padding(host)).toEqual({
      trigger: '22px',
      contentInline: '22px',
      contentBottom: '22px'
    })
  })
}
