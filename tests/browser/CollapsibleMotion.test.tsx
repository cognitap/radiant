import { act, createRef, StrictMode, useState, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  Button,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  ThemeScope,
  defineTheme
} from '../../src/index.js'
import { MotionProvider, useReducedMotion } from '../../src/motion/react.js'
import {
  CollapsibleSettingsExample,
  CollapsibleHeightExample
} from '../../.storybook/examples/CollapsibleExamples.js'
import { bindDisclosureMotion } from '../../src/motion/transitions.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: Array<{ root: Root; host: HTMLDivElement }> = []
const disposals: Array<() => void> = []
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
const theme = defineTheme({
  id: 'disclosure-proof',
  name: 'Disclosure proof',
  motion: { spring: { stiffness: 180, damping: 16 } }
})
async function mount(tree: ReactNode, hydrate = false) {
  const host = document.createElement('div')
  document.body.append(host)
  if (hydrate) host.innerHTML = renderToString(tree)
  const errors: unknown[] = []
  let root: Root
  await act(async () => {
    root = hydrate
      ? hydrateRoot(host, tree, { onRecoverableError: error => errors.push(error) })
      : createRoot(host)
    if (!hydrate) root.render(tree)
  })
  mounted.push({ root: root!, host })
  expect(errors).toEqual([])
  return { root: root!, host }
}
async function until(check: () => boolean) {
  await expect.poll(check, { timeout: 4_000 }).toBe(true)
}
const height = (node: HTMLElement) =>
  parseFloat(node.style.getPropertyValue('--_rad-spring-details-height'))
afterEach(async () => {
  for (const dispose of disposals.splice(0)) dispose()
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
  await commands.emulatePreferences({ reducedMotion: 'no-preference' })
})
function native() {
  const node = document.createElement('details')
  node.innerHTML = '<summary>Details</summary><div style="height:80px">First</div>'
  document.body.append(node)
  node.open = true
  const binding = bindDisclosureMotion(node, theme.motion)
  disposals.push(() => {
    binding.destroy()
    node.remove()
  })
  return node
}

test('replacement content remains measured as it changes size', async () => {
  const node = native()
  const content = document.createElement('div')
  content.style.height = '120px'
  node.lastElementChild!.replaceWith(content)
  await until(() => Math.abs(height(node) - 120) < 0.1)
  content.style.height = '240px'
  await until(() => Math.abs(height(node) - 240) < 0.1)
})

test('removed closed content regains its caller-owned inert and ARIA state', async () => {
  const node = native()
  const content = node.lastElementChild as HTMLElement
  content.setAttribute('aria-hidden', 'false')
  node.open = false
  await frame()
  expect(content.inert).toBe(true)
  content.remove()
  await frame()
  expect(content.inert).toBe(false)
  expect(content.getAttribute('aria-hidden')).toBe('false')
})

for (const local of [true, false]) {
  test(`${local ? 'local' : 'theme'} off suppresses height and marker transitions without a provider`, async () => {
    const { host } = await mount(
      <ThemeScope theme={local ? theme : { ...theme, motion: { ...theme.motion, mode: 'off' } }}>
        <Collapsible motion={local ? 'off' : 'inherit'}>
          <CollapsibleTrigger>Details</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      </ThemeScope>
    )
    const node = host.querySelector('details')!
    expect(getComputedStyle(node.querySelector('svg')!).transitionProperty).toBe('none')
    expect(getComputedStyle(node, '::details-content').transitionProperty).toBe('none')
  })
}

test('server-rendered motion disclosures keep closed native content out of keyboard navigation', async () => {
  const host = document.createElement('div')
  host.innerHTML = renderToString(
    <MotionProvider>
      <Collapsible>
        <CollapsibleTrigger>Details</CollapsibleTrigger>
        <CollapsibleContent>
          <input aria-label="Hidden" />
        </CollapsibleContent>
      </Collapsible>
      <button>After disclosure</button>
    </MotionProvider>
  )
  document.body.append(host)
  disposals.push(() => host.remove())
  const summary = host.querySelector('summary')!
  await userEvent.click(summary)
  await userEvent.click(summary)
  summary.focus()
  await userEvent.tab()
  expect(document.activeElement).toBe(host.querySelector('button'))
})

for (const mode of ['light', 'dark'] as const) {
  test(`${mode}: native keyboard toggles stay immediate while content, focus and form values keep their owners`, async () => {
    const ref = createRef<HTMLDetailsElement>()
    const triggerRef = createRef<HTMLElement>()
    const contentRef = createRef<HTMLDivElement>()
    const changed = vi.fn()
    const observed = vi.fn()
    const { host } = await mount(
      <StrictMode>
        <ThemeScope
          theme={theme}
          mode={mode}
        >
          <MotionProvider>
            <form>
              <Collapsible
                ref={ref}
                title="Details host"
                onOpenChange={changed}
                onToggle={observed}
                style={{ transform: 'rotate(0deg)' }}
              >
                <CollapsibleTrigger ref={triggerRef}>Details</CollapsibleTrigger>
                <CollapsibleContent ref={contentRef}>
                  <input
                    aria-label="Draft"
                    name="draft"
                    defaultValue="Initial"
                    style={{ height: '40px' }}
                  />
                </CollapsibleContent>
              </Collapsible>
              <button type="button">After disclosure</button>
            </form>
          </MotionProvider>
        </ThemeScope>
      </StrictMode>
    )
    const node = ref.current!
    const summary = triggerRef.current!
    const content = contentRef.current!
    const input = content.querySelector('input')!
    await act(async () => {
      summary.focus()
      await userEvent.keyboard('{Enter}')
    })
    expect(node.open).toBe(true)
    await until(() => changed.mock.calls.length === 1)
    expect(changed).toHaveBeenLastCalledWith(true)
    expect(content.inert).toBe(false)
    await act(async () => {
      await userEvent.clear(input)
      await userEvent.type(input, 'Retained')
    })
    expect(input.getBoundingClientRect().height).toBe(40)
    await act(async () => {
      summary.focus()
      await userEvent.keyboard(' ')
    })
    expect(node.open).toBe(false)
    expect(content.inert).toBe(true)
    expect(content.getAttribute('aria-hidden')).toBe('true')
    expect(new FormData(host.querySelector('form')!).get('draft')).toBe('Retained')
    await act(async () => userEvent.tab())
    expect(document.activeElement).toBe(host.querySelector('button'))
    await act(async () => {
      summary.focus()
      await userEvent.keyboard(' ')
    })
    await act(async () => userEvent.keyboard(' '))
    await act(async () => userEvent.keyboard(' '))
    expect(node.open).toBe(true)
    await until(() => Math.abs(height(node) - content.getBoundingClientRect().height) < 0.1)
    expect(input.value).toBe('Retained')
    expect(input.getBoundingClientRect().height).toBe(40)
    expect(node.style.transform).toBe('rotate(0deg)')
    expect(node.title).toBe('Details host')
    expect(observed).toHaveBeenCalled()
    await act(async () => host.querySelector('form')!.reset())
    expect(node.open).toBe(true)
    expect(input.value).toBe('Initial')
  })
}

function Preference() {
  return <span data-reduced={String(useReducedMotion())} />
}
test('live local/theme/reduced policy and disposal restore attributes, style and callback refs', async () => {
  const cleanup = vi.fn()
  const ref = vi.fn(() => cleanup)
  const tree = (open: boolean, off = false, localOff = false) => (
    <StrictMode>
      <ThemeScope theme={off ? { ...theme, motion: { ...theme.motion, mode: 'off' } } : theme}>
        <MotionProvider>
          <Preference />
          <Collapsible
            ref={ref}
            open={open}
            onOpenChange={() => {}}
            motion={localOff ? 'off' : 'inherit'}
          >
            <CollapsibleTrigger>Live policy</CollapsibleTrigger>
            <CollapsibleContent aria-hidden="false">
              <input aria-label="Kept" />
              <div style={{ height: '120px' }} />
            </CollapsibleContent>
          </Collapsible>
        </MotionProvider>
      </ThemeScope>
    </StrictMode>
  )
  const { host, root } = await mount(tree(true))
  const node = host.querySelector('details')!
  const content = host.querySelector<HTMLElement>('[data-slot=collapsible-content]')!
  await until(() => height(node) > 100)
  await act(async () => root.render(tree(false)))
  expect(content.inert).toBe(true)
  await act(async () => {
    await commands.emulatePreferences({ reducedMotion: 'reduce' })
    await frame()
  })
  await until(() => host.querySelector('[data-reduced]')?.getAttribute('data-reduced') === 'true')
  expect(height(node)).toBe(0)
  await act(async () => root.render(tree(true)))
  expect(height(node)).toBe(content.getBoundingClientRect().height)
  expect(content.getAttribute('aria-hidden')).toBe('false')
  await act(async () => {
    await commands.emulatePreferences({ reducedMotion: 'no-preference' })
    await frame()
  })
  await until(() => host.querySelector('[data-reduced]')?.getAttribute('data-reduced') === 'false')
  await act(async () => root.render(tree(false, true)))
  expect(height(node)).toBe(0)
  expect(getComputedStyle(node.querySelector('svg')!).transitionProperty).toBe('none')
  await act(async () => root.render(tree(true, false, true)))
  expect(node.style.getPropertyValue('--_rad-spring-details-height')).toBe('')
  expect(content.inert).toBe(false)
  expect(content.getAttribute('aria-hidden')).toBe('false')
  await act(async () => root.render(tree(false)))
  expect(content.inert).toBe(true)
  const before = cleanup.mock.calls.length
  await act(async () => root.render(null))
  expect(cleanup).toHaveBeenCalledTimes(before + 1)
  expect(content.inert).toBe(false)
  expect(content.getAttribute('aria-hidden')).toBe('false')
  expect(node.style.getPropertyValue('--_rad-spring-details-height')).toBe('')
})

test('controlled refusal, cancellation and prop synchronization do not invent changes', async () => {
  const changed = vi.fn()
  const tree = (open: boolean, cancel = false) => (
    <MotionProvider>
      <Collapsible
        open={open}
        onOpenChange={changed}
      >
        <CollapsibleTrigger
          onClick={event => {
            if (cancel) event.preventDefault()
          }}
        >
          Held
        </CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    </MotionProvider>
  )
  const { host, root } = await mount(tree(false))
  const node = host.querySelector('details')!
  const summary = host.querySelector('summary')!
  await act(async () => userEvent.click(summary))
  await until(() => changed.mock.calls.length === 1 && !node.open)
  expect(changed).toHaveBeenCalledExactlyOnceWith(true)
  await act(async () => root.render(tree(false, true)))
  await act(async () => userEvent.click(summary))
  expect(changed).toHaveBeenCalledTimes(1)
  await act(async () => root.render(tree(true)))
  await frame()
  expect(node.open).toBe(true)
  expect(changed).toHaveBeenCalledTimes(1)
})

test('Accordion shares replacement measurement and immediate closed semantics', async () => {
  function Fixture() {
    const [key, setKey] = useState(0)
    const [tall, setTall] = useState(false)
    return (
      <>
        <Button onClick={() => setKey(value => value + 1)}>Replace</Button>
        <Button onClick={() => setTall(true)}>Grow</Button>
        <Accordion defaultValue="a">
          <AccordionItem value="a">
            <AccordionTrigger>Shared foundation</AccordionTrigger>
            <AccordionContent
              key={key}
              style={{ height: tall ? '240px' : '80px', padding: 0 }}
            >
              Details
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </>
    )
  }
  const { host } = await mount(
    <ThemeScope theme={theme}>
      <MotionProvider>
        <Fixture />
      </MotionProvider>
    </ThemeScope>
  )
  const node = host.querySelector('details')!
  const [replace, grow] = host.querySelectorAll('button')
  await until(() => Math.abs(height(node) - 80) < 0.1)
  await act(async () => replace.click())
  await frame()
  await act(async () => grow.click())
  await until(() => Math.abs(height(node) - 240) < 0.1)
  expect(node.dataset.slot).toBe('collapsible accordion-item')
  await act(async () => userEvent.click(host.querySelector('summary')!))
  expect(node.open).toBe(false)
  expect(host.querySelector<HTMLElement>('[data-slot~=accordion-content]')!.inert).toBe(true)
})

test('settings hydrate, retain folded form data and reset values without resetting disclosure state', async () => {
  const { host } = await mount(
    <StrictMode>
      <CollapsibleSettingsExample />
    </StrictMode>,
    true
  )
  const node = host.querySelector('details')!
  const summary = node.querySelector('summary')!
  const contentId = node.querySelector('[data-slot=collapsible-content]')!.id
  const form = host.querySelector('form')!
  await act(async () => userEvent.click(summary))
  const topic = form.querySelector<HTMLInputElement>('[name=topics]')!
  await act(async () => {
    await userEvent.clear(topic)
    await userEvent.type(topic, 'Design notes')
  })
  const add = [...node.querySelectorAll('button')].find(
    button => button.textContent === 'Add a topic'
  )!
  await act(async () => add.click())
  expect(form.querySelectorAll('[name=topics]')).toHaveLength(2)
  await act(async () => form.querySelector<HTMLInputElement>('[name=digest]')!.click())
  expect(form.querySelector('[name=digestAt]')).toBeNull()
  const done = [...node.querySelectorAll('button')].find(
    button => button.getAttribute('aria-label') === 'Done with advanced options'
  )!
  await act(async () => done.click())
  expect(node.open).toBe(false)
  expect(document.activeElement).toBe(summary)
  expect(new FormData(form).getAll('topics')).toEqual(['Design notes', 'Release notes'])
  expect(new FormData(form).has('digest')).toBe(false)
  await act(async () => form.reset())
  expect(node.open).toBe(false)
  expect(new FormData(form).getAll('topics')).toEqual(['Product updates'])
  expect(new FormData(form).get('digestAt')).toBe('09:00')
  expect(node.querySelector('[data-slot=collapsible-content]')!.id).toBe(contentId)
})

test('height lab retains controlled text through inner replacement and cancels pending replay on disposal', async () => {
  const { host, root } = await mount(<CollapsibleHeightExample />)
  const node = host.querySelector('details')!
  const input = node.querySelector('input')!
  await act(async () => {
    await userEvent.clear(input)
    await userEvent.type(input, 'Keep this thought')
  })
  const buttons = [...host.querySelectorAll('button')]
  await act(async () => buttons.find(button => button.textContent === 'Replace detail')!.click())
  expect(node.querySelector('input')!.value).toBe('Keep this thought')
  await act(async () => buttons.find(button => button.textContent === 'Add detail')!.click())
  expect(host.querySelector('output')!.textContent).toContain('2 notes')
  await act(async () =>
    buttons.find(button => button.textContent === 'Quick close and reopen')!.click()
  )
  expect(node.open).toBe(false)
  await act(async () => root.render(null))
  await new Promise(resolve => setTimeout(resolve, 120))
  expect(node.style.getPropertyValue('--_rad-spring-details-height')).toBe('')
  expect(host.querySelector('details')).toBeNull()
})
