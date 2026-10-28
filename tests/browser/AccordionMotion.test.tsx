import { act, createRef, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  ThemeScope,
  defineTheme,
  useAccordion
} from '../../src/index.js'
import { MotionProvider, useReducedMotion } from '../../src/motion/react.js'
import {
  AccordionGuideExample,
  AccordionSelectionExample
} from '../../.storybook/examples/AccordionExamples.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: Array<{ root: Root; host: HTMLDivElement }> = []
const theme = defineTheme({
  id: 'accordion-proof',
  name: 'Accordion proof',
  motion: { spring: { stiffness: 180, damping: 16 } }
})
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
async function mount(tree: ReactNode, hydrate = false) {
  const host = document.createElement('div')
  document.body.append(host)
  if (hydrate) host.innerHTML = renderToString(tree)
  let root: Root
  const errors: unknown[] = []
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
  for (let i = 0; i < 240; i++) {
    if (check()) return
    await act(async () => {
      await frame()
    })
  }
  throw new Error('Accordion did not reach the expected state')
}
const height = (node: HTMLElement) =>
  parseFloat(node.style.getPropertyValue('--_rad-spring-details-height'))
afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
  await commands.emulatePreferences({ reducedMotion: 'no-preference' })
})
const items = (tall = false) =>
  ['', 'b'].map((value, index) => (
    <AccordionItem
      key={value}
      value={value}
    >
      <AccordionTrigger level={index === 0 ? 2 : null}>
        {index === 0 ? 'Notes' : 'Rhythm'}
      </AccordionTrigger>
      <AccordionContent style={{ padding: 0, height: tall ? '240px' : '80px' }}>
        <input
          aria-label={`Draft ${index}`}
          name={`draft${index}`}
          defaultValue="Initial"
          style={{ height: '32px' }}
        />
      </AccordionContent>
    </AccordionItem>
  ))

for (const display of ['grid', 'flex']) {
  test(`root shrinks inside a narrow ${display} track`, async () => {
    const { host } = await mount(
      <div style={{ display, width: '180px' }}>
        <Accordion defaultValue="a">
          <AccordionItem value="a">
            <AccordionTrigger>A long heading within a narrow layout</AccordionTrigger>
            <AccordionContent>
              <div style={{ width: '400px', maxWidth: '100%' }}>Details</div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    )
    expect(
      host.querySelector('[data-slot=accordion]')!.getBoundingClientRect().width
    ).toBeLessThanOrEqual(180)
  })
}

for (const mode of ['light', 'dark'] as const)
  for (const multiple of [false, true]) {
    test(`${mode} ${multiple ? 'multiple' : 'single'}: immediate keyboard selection, interrupted heights and retained form data`, async () => {
      const changed = vi.fn()
      const tree = (tall = false) => (
        <StrictMode>
          <ThemeScope
            theme={theme}
            mode={mode}
          >
            <MotionProvider>
              <form>
                {multiple ? (
                  <Accordion
                    type="multiple"
                    defaultValue={['']}
                    onValueChange={changed}
                  >
                    {items(tall)}
                  </Accordion>
                ) : (
                  <Accordion
                    defaultValue=""
                    onValueChange={changed}
                  >
                    {items(tall)}
                  </Accordion>
                )}
                <button type="button">After</button>
              </form>
            </MotionProvider>
          </ThemeScope>
        </StrictMode>
      )
      const { host, root } = await mount(tree())
      const [a, b] = host.querySelectorAll('details')
      const [first, second] = host.querySelectorAll('summary')
      const input = a.querySelector('input')!
      const content = a.lastElementChild as HTMLElement
      await until(() => Math.abs(height(a) - 80) < 0.1)
      await act(async () => {
        await userEvent.clear(input)
        await userEvent.type(input, 'Retained')
      })
      await act(async () => {
        second.focus()
        await userEvent.keyboard('{Enter}')
      })
      await until(() => b.open && a.open === multiple)
      expect(content.inert).toBe(!multiple)
      expect(new FormData(host.querySelector('form')!).get('draft0')).toBe('Retained')
      await act(async () => {
        first.focus()
        await userEvent.keyboard(' ')
      })
      await until(() => a.open === !multiple)
      await act(async () => userEvent.keyboard(' '))
      await until(() => a.open === multiple)
      await act(async () => userEvent.keyboard(' '))
      await until(() => a.open === !multiple)
      if (!a.open) {
        await act(async () => userEvent.keyboard(' '))
        await until(() => a.open)
      }
      await act(async () => root.render(tree(true)))
      await until(() => Math.abs(height(a) - 240) < 0.1)
      expect(input.value).toBe('Retained')
      expect(input.getBoundingClientRect().height).toBe(32)
      expect(first.querySelector('h2')).not.toBeNull()
      expect(second.querySelector('h3')).toBeNull()
      await act(async () => host.querySelector('form')!.reset())
      expect(input.value).toBe('Initial')
      expect(a.open).toBe(true)
      expect(changed).toHaveBeenCalled()
    })
  }

test('controlled refusals, cancellation, no-op requests and prop sync keep a single owner', async () => {
  const changed = vi.fn()
  function Action() {
    const state = useAccordion()
    return <button onClick={() => state?.setItemOpen('', true)}>Open</button>
  }
  const tree = (value: string | null, cancel = false) => (
    <MotionProvider>
      <Accordion
        value={value}
        onValueChange={changed}
      >
        <AccordionItem value="">
          <AccordionTrigger
            onClick={event => {
              if (cancel) event.preventDefault()
            }}
          >
            Held
          </AccordionTrigger>
          <AccordionContent>Details</AccordionContent>
        </AccordionItem>
        <Action />
      </Accordion>
    </MotionProvider>
  )
  const { host, root } = await mount(tree(null))
  const node = host.querySelector('details')!
  await act(async () => userEvent.click(host.querySelector('summary')!))
  await until(() => changed.mock.calls.length === 1 && !node.open)
  expect(changed).toHaveBeenLastCalledWith('')
  await act(async () => root.render(tree(null, true)))
  await act(async () => userEvent.click(host.querySelector('summary')!))
  expect(changed).toHaveBeenCalledTimes(1)
  await act(async () => root.render(tree('')))
  await act(async () => host.querySelector('button')!.click())
  await frame()
  expect(node.open).toBe(true)
  expect(changed).toHaveBeenCalledTimes(1)
})

test('disabled guards precede caller handlers, refs target native hosts and identities are additive', async () => {
  const rootRef = createRef<HTMLDivElement>(),
    itemRef = createRef<HTMLDetailsElement>(),
    triggerRef = createRef<HTMLElement>(),
    contentRef = createRef<HTMLDivElement>()
  const click = vi.fn(),
    key = vi.fn(),
    changed = vi.fn()
  const { host } = await mount(
    <Accordion
      disabled
      ref={rootRef}
      data-slot="custom-root"
      onValueChange={changed}
    >
      <AccordionItem
        ref={itemRef}
        value="a"
        data-slot="custom-item"
        disabled={false}
      >
        <AccordionTrigger
          ref={triggerRef}
          data-slot="custom-trigger"
          onClick={click}
          onKeyDown={key}
        >
          Disabled
        </AccordionTrigger>
        <AccordionContent
          ref={contentRef}
          data-slot="custom-content"
        >
          Details
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
  const summary = triggerRef.current!
  await act(async () => {
    summary.click()
    summary.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    )
  })
  expect(click).not.toHaveBeenCalled()
  expect(key).not.toHaveBeenCalled()
  expect(changed).not.toHaveBeenCalled()
  expect(summary.tabIndex).toBe(-1)
  expect(summary.getAttribute('aria-disabled')).toBe('true')
  expect(rootRef.current).toBe(host.firstElementChild)
  expect(itemRef.current!.tagName).toBe('DETAILS')
  expect(summary.parentElement).toBe(itemRef.current)
  expect(contentRef.current!.dataset.slot).toBe(
    'collapsible-content accordion-content custom-content'
  )
  expect(itemRef.current!.dataset.slot).toBe('collapsible accordion-item custom-item')
})

function Preference() {
  return <span data-reduced={String(useReducedMotion())} />
}
test('live item/theme off, reduced motion and disposal settle each item and restore caller state', async () => {
  const cleanup = vi.fn(),
    ref = vi.fn(() => cleanup)
  const tree = (open: boolean, localOff = false, off = false) => (
    <StrictMode>
      <ThemeScope theme={off ? { ...theme, motion: { ...theme.motion, mode: 'off' } } : theme}>
        <MotionProvider>
          <Preference />
          <Accordion
            type="multiple"
            value={open ? ['a', 'b'] : []}
          >
            <AccordionItem
              ref={ref}
              value="a"
              motion={localOff ? 'off' : 'inherit'}
            >
              <AccordionTrigger>A</AccordionTrigger>
              <AccordionContent
                aria-hidden="false"
                style={{ height: '120px', padding: 0 }}
              >
                A
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="b">
              <AccordionTrigger>B</AccordionTrigger>
              <AccordionContent style={{ height: '80px', padding: 0 }}>B</AccordionContent>
            </AccordionItem>
          </Accordion>
        </MotionProvider>
      </ThemeScope>
    </StrictMode>
  )
  const { host, root } = await mount(tree(true))
  const [a, b] = host.querySelectorAll('details')
  const content = a.lastElementChild as HTMLElement
  await until(() => height(a) === 120 && height(b) === 80)
  await act(async () => root.render(tree(true, true)))
  expect(a.style.getPropertyValue('--_rad-spring-details-height')).toBe('')
  expect(getComputedStyle(a.querySelector('svg')!).transitionProperty).toBe('none')
  expect(height(b)).toBe(80)
  await act(async () => root.render(tree(false)))
  expect(content.inert).toBe(true)
  await act(async () => {
    await commands.emulatePreferences({ reducedMotion: 'reduce' })
  })
  await until(() => host.querySelector('[data-reduced]')?.getAttribute('data-reduced') === 'true')
  expect(height(a)).toBe(0)
  expect(height(b)).toBe(0)
  await act(async () => {
    await commands.emulatePreferences({ reducedMotion: 'no-preference' })
  })
  await until(() => host.querySelector('[data-reduced]')?.getAttribute('data-reduced') === 'false')
  await act(async () => root.render(tree(true, false, true)))
  expect(height(a)).toBe(120)
  expect(content.getAttribute('aria-hidden')).toBe('false')
  for (const node of [a, b])
    expect(getComputedStyle(node.querySelector('svg')!).transitionProperty).toBe('none')
  await act(async () => root.render(tree(false, false, true)))
  expect(height(a)).toBe(0)
  expect(content.inert).toBe(true)
  const before = cleanup.mock.calls.length
  await act(async () => root.render(null))
  expect(cleanup).toHaveBeenCalledTimes(before + 1)
  expect(a.style.getPropertyValue('--_rad-spring-details-height')).toBe('')
  expect(content.inert).toBe(false)
})

test('native SSR stays hidden before hydration and item identity survives reordering', async () => {
  const { host, root } = await mount(
    <MotionProvider>
      <Accordion defaultValue="b">{items()}</Accordion>
    </MotionProvider>,
    true
  )
  const b = host.querySelector('details[data-value=b]')!
  const input = b.querySelector('input')!
  await act(async () => {
    await userEvent.clear(input)
    await userEvent.type(input, 'Keep identity')
  })
  await act(async () =>
    root.render(
      <MotionProvider>
        <Accordion defaultValue="b">{items().reverse()}</Accordion>
      </MotionProvider>
    )
  )
  expect(host.querySelector('details')).toBe(b)
  expect(input.value).toBe('Keep identity')
  expect((b as HTMLDetailsElement).open).toBe(true)
  const staticHost = document.createElement('div')
  staticHost.innerHTML = renderToString(
    <MotionProvider>
      <Accordion>{items()}</Accordion>
      <button>After</button>
    </MotionProvider>
  )
  document.body.append(staticHost)
  try {
    const summaries = staticHost.querySelectorAll('summary')
    summaries[0].focus()
    await userEvent.tab()
    expect(document.activeElement).toBe(summaries[1])
    await userEvent.tab()
    expect(document.activeElement).toBe(staticHost.querySelector('button'))
  } finally {
    staticHost.remove()
  }
})

test('guide closes from content with focus restored and retains drafts and dynamic tips', async () => {
  const { host } = await mount(<AccordionGuideExample />, true)
  const [start, habits] = host.querySelectorAll('summary')
  const input = host.querySelector<HTMLInputElement>('[name=workspace]')!
  await act(async () => {
    await userEvent.clear(input)
    await userEvent.type(input, 'Our studio')
    await userEvent.click(habits)
  })
  await until(() => habits.parentElement!.hasAttribute('open'))
  await act(async () =>
    [...host.querySelectorAll('button')]
      .find(button => button.textContent === 'One more tip')!
      .click()
  )
  expect(host.textContent).toContain('Habit 2.')
  await act(async () =>
    [...host.querySelectorAll('button')].find(button => button.textContent === 'Got it')!.click()
  )
  expect(document.activeElement).toBe(habits)
  await act(async () => userEvent.click(start))
  expect(input.value).toBe('Our studio')
})

test('selection lab remounts type, preserves the app draft and cancels replay on disposal', async () => {
  const { host, root } = await mount(<AccordionSelectionExample />)
  const input = host.querySelector<HTMLInputElement>('[data-slot=input]')!
  const button = (name: string) =>
    [...host.querySelectorAll('button')].find(node => node.textContent === name)!
  const checkbox = (name: string) =>
    [...host.querySelectorAll('label')]
      .find(node => node.textContent === name)!
      .querySelector('input')!
  await act(async () => {
    await userEvent.clear(input)
    await userEvent.type(input, 'Keep the draft')
    checkbox('Allow multiple sections').click()
  })
  expect(host.querySelector<HTMLInputElement>('[data-slot=input]')!.value).toBe('Keep the draft')
  await act(async () => button('Open both').click())
  expect([...host.querySelectorAll('details')].map(node => node.open)).toEqual([true, true, false])
  await act(async () => button('Close all').click())
  expect([...host.querySelectorAll('details')].map(node => node.open)).toEqual([
    false,
    false,
    false
  ])
  await act(async () => button('Quick switch').click())
  const details = host.querySelector('details')!
  await act(async () => root.render(null))
  await new Promise(resolve => setTimeout(resolve, 120))
  expect(details.style.getPropertyValue('--_rad-spring-details-height')).toBe('')
  expect(host.children).toHaveLength(0)
})
