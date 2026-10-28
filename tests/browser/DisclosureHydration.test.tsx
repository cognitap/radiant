import { act, createRef, StrictMode, type ReactNode } from 'react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  useCollapsible,
  useAccordion
} from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const roots: Array<{ host: HTMLDivElement; root?: Root }> = []
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
afterEach(async () => {
  for (const { host, root } of roots.splice(0)) {
    if (root) await act(async () => root.unmount())
    host.remove()
  }
  vi.restoreAllMocks()
})
function Snapshot() {
  return <output data-owned={String(useCollapsible()?.open)} />
}
function Selection() {
  return <output data-selection={JSON.stringify(useAccordion()?.value)} />
}
async function server(tree: ReactNode) {
  const host = document.createElement('div')
  host.innerHTML = renderToString(tree)
  document.body.append(host)
  // Initial open attributes can themselves queue a native toggle.
  await frame()
  await frame()
  const entry: { host: HTMLDivElement; root?: Root } = { host }
  roots.push(entry)
  const recoverable: unknown[] = []
  const consoleError = vi.spyOn(console, 'error')
  return {
    host,
    async hydrate() {
      await act(async () => {
        entry.root = hydrateRoot(host, tree, {
          onRecoverableError: error => recoverable.push(error)
        })
      })
      await act(async () => {
        await frame()
        await frame()
      })
      expect(recoverable).toEqual([])
      expect(consoleError).not.toHaveBeenCalled()
    }
  }
}
async function nativeToggle(node: HTMLDetailsElement) {
  const toggled = new Promise<void>(resolve =>
    node.addEventListener('toggle', () => resolve(), { once: true })
  )
  node.querySelector('summary')!.focus()
  await userEvent.keyboard('{Enter}')
  await toggled
}

for (const initial of [false, true])
  for (const controlled of [false, true]) {
    test(`${controlled ? 'controlled' : 'uncontrolled'} ${initial ? 'open' : 'closed'} disclosure reconciles a completed pre-hydration toggle`, async () => {
      const changed = vi.fn(),
        observed = vi.fn(),
        ref = createRef<HTMLDetailsElement>()
      const tree = (
        <StrictMode>
          <MotionProvider>
            <Collapsible
              ref={ref}
              {...(controlled ? { open: initial } : { defaultOpen: initial })}
              onOpenChange={changed}
              onToggle={observed}
            >
              <CollapsibleTrigger>Details</CollapsibleTrigger>
              <CollapsibleContent>
                <input
                  name="draft"
                  defaultValue="Kept"
                  style={{ height: '32px' }}
                />
                <Snapshot />
              </CollapsibleContent>
            </Collapsible>
          </MotionProvider>
        </StrictMode>
      )
      const { host, hydrate } = await server(tree)
      const node = host.querySelector('details')!,
        input = node.querySelector('input')!,
        summary = node.querySelector('summary')!
      const contentId = node.querySelector('[data-slot=collapsible-content]')!.id
      if (initial) input.value = 'Edited before hydration'
      await nativeToggle(node)
      expect(node.open).toBe(!initial)
      if (!initial) input.value = 'Edited before hydration'
      await hydrate()
      const expected = controlled ? initial : !initial
      expect(node.open).toBe(expected)
      for (const part of [node, summary, node.querySelector('[data-slot=collapsible-content]')!])
        expect(part.getAttribute('data-state')).toBe(expected ? 'open' : 'closed')
      expect(host.querySelector('[data-owned]')!.getAttribute('data-owned')).toBe(String(expected))
      expect(ref.current).toBe(node)
      expect(node.querySelector('input')).toBe(input)
      expect(input.value).toBe('Edited before hydration')
      expect(node.querySelector('[data-slot=collapsible-content]')!.id).toBe(contentId)
      expect((node.querySelector('[data-slot=collapsible-content]') as HTMLElement).inert).toBe(
        !expected
      )
      if (controlled) expect(changed).not.toHaveBeenCalled()
      else {
        expect(changed).toHaveBeenCalledExactlyOnceWith(!initial)
        expect(observed).not.toHaveBeenCalled()
      }
      await act(async () => {
        summary.focus()
        await userEvent.keyboard(' ')
      })
      await act(async () => {
        await frame()
        await frame()
      })
      expect(changed).toHaveBeenLastCalledWith(!expected)
      expect(changed).toHaveBeenCalledTimes(controlled ? 1 : 2)
      expect(node.open).toBe(controlled ? initial : !expected)
    })
  }

for (const completed of [false, true]) {
  test(`${completed ? 'completed round trip' : 'queued toggle'} does not duplicate hydration notifications`, async () => {
    const changed = vi.fn()
    const tree = (
      <StrictMode>
        <Collapsible onOpenChange={changed}>
          <CollapsibleTrigger>Details</CollapsibleTrigger>
          <CollapsibleContent>
            <Snapshot />
          </CollapsibleContent>
        </Collapsible>
      </StrictMode>
    )
    const { host, hydrate } = await server(tree)
    const node = host.querySelector('details')!
    if (completed) {
      await nativeToggle(node)
      await nativeToggle(node)
    } else node.querySelector('summary')!.click()
    await hydrate()
    expect(node.open).toBe(!completed)
    expect(node.dataset.state).toBe(completed ? 'closed' : 'open')
    expect(changed.mock.calls).toEqual(completed ? [] : [[true]])
  })
}

test('unchanged initial markup does not emit a hydration change', async () => {
  const changed = vi.fn()
  const { host, hydrate } = await server(
    <StrictMode>
      <Collapsible
        defaultOpen
        onOpenChange={changed}
      >
        <CollapsibleTrigger>Unchanged</CollapsibleTrigger>
        <CollapsibleContent>Details</CollapsibleContent>
      </Collapsible>
    </StrictMode>
  )
  await hydrate()
  expect(host.querySelector('details')!.open).toBe(true)
  expect(changed).not.toHaveBeenCalled()
})

for (const initial of [false, true]) {
  test(`queued toggle restores controlled ${initial ? 'open' : 'closed'} state without a request`, async () => {
    const changed = vi.fn()
    const { host, hydrate } = await server(
      <StrictMode>
        <Collapsible
          open={initial}
          onOpenChange={changed}
        >
          <CollapsibleTrigger>Queued controlled</CollapsibleTrigger>
          <CollapsibleContent>
            <Snapshot />
          </CollapsibleContent>
        </Collapsible>
      </StrictMode>
    )
    const node = host.querySelector('details')!
    node.querySelector('summary')!.click()
    await hydrate()
    expect(node.open).toBe(initial)
    expect(node.dataset.state).toBe(initial ? 'open' : 'closed')
    expect(changed).not.toHaveBeenCalled()
  })
}

for (const multiple of [false, true])
  for (const controlled of [false, true]) {
    test(`${multiple ? 'multiple' : 'single'} Accordion with ${controlled ? 'controlled' : 'local'} root selection restores owned items`, async () => {
      const changed = vi.fn()
      const items = (
        <>
          <AccordionItem value="a">
            <AccordionTrigger>A</AccordionTrigger>
            <AccordionContent>
              <input
                name="a"
                defaultValue="A"
              />
              <Snapshot />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>B</AccordionTrigger>
            <AccordionContent>
              <input
                name="b"
                defaultValue="B"
              />
              <Snapshot />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem
            value="disabled"
            disabled
          >
            <AccordionTrigger>Unavailable</AccordionTrigger>
            <AccordionContent>Disabled</AccordionContent>
          </AccordionItem>
          <Selection />
        </>
      )
      const tree = (
        <StrictMode>
          <MotionProvider>
            {multiple ? (
              <Accordion
                type="multiple"
                {...(controlled ? { value: ['a'] } : { defaultValue: ['a'] })}
                onValueChange={changed}
              >
                {items}
              </Accordion>
            ) : (
              <Accordion
                {...(controlled ? { value: 'a' } : { defaultValue: 'a' })}
                onValueChange={changed}
              >
                {items}
              </Accordion>
            )}
          </MotionProvider>
        </StrictMode>
      )
      const { host, hydrate } = await server(tree)
      const nodes = [...host.querySelectorAll('details')]
      await nativeToggle(nodes[0])
      await nativeToggle(nodes[1])
      await nativeToggle(nodes[2])
      nodes[1].querySelector('input')!.value = 'Kept before hydration'
      expect(nodes.map(node => node.open)).toEqual([false, true, true])
      await hydrate()
      expect(nodes.map(node => node.open)).toEqual([true, false, false])
      expect(nodes.map(node => node.dataset.state)).toEqual(['open', 'closed', 'closed'])
      expect(host.querySelector('[data-selection]')!.getAttribute('data-selection')).toBe(
        JSON.stringify(multiple ? ['a'] : 'a')
      )
      expect(nodes[1].querySelector('input')!.value).toBe('Kept before hydration')
      expect(changed).not.toHaveBeenCalled()
      await act(async () => {
        nodes[1].querySelector('summary')!.focus()
        await userEvent.keyboard('{Enter}')
      })
      await act(async () => {
        await frame()
        await frame()
      })
      expect(changed).toHaveBeenCalledExactlyOnceWith(multiple ? ['a', 'b'] : 'b')
      expect(nodes.map(node => node.open)).toEqual(
        controlled ? [true, false, false] : [multiple, true, false]
      )
    })
  }
