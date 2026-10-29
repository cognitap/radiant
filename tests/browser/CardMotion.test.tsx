import {
  act,
  createElement,
  createRef,
  StrictMode,
  useLayoutEffect,
  useRef,
  type ReactNode
} from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  ThemeScope,
  defineTheme
} from '../../src/index.js'
import { useSpringLayout, useReducedMotion } from '../../src/motion/react.js'
import { CardDashboardExample } from '../../.storybook/examples/CardExamples.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const theme = defineTheme({
  id: 'card-proof',
  name: 'Card proof',
  motion: { spring: { stiffness: 180, damping: 16 } }
})
const mounted: Array<{ root: Root; host: HTMLDivElement }> = []
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
async function until(check: () => boolean) {
  await expect.poll(check, { timeout: 4_000 }).toBe(true)
}
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
afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
  await commands.emulatePreferences({ reducedMotion: 'no-preference' })
})

test('parts keep native hosts, heading semantics, caller styling, additive identities and DOM refs', async () => {
  const card = createRef<HTMLDivElement>(),
    header = createRef<HTMLDivElement>(),
    title = createRef<HTMLHeadingElement>(),
    description = createRef<HTMLParagraphElement>(),
    content = createRef<HTMLDivElement>(),
    footer = createRef<HTMLDivElement>()
  const cleanup = vi.fn(),
    ref = vi.fn((node: HTMLDivElement) => {
      card.current = node
      return cleanup
    })
  const { host, root } = await mount(
    <Card
      ref={ref}
      title="Caller surface"
      data-slot="project"
      className="p-0"
      style={{ transform: 'translateX(2px)' }}
    >
      <CardHeader ref={header}>
        <CardTitle
          ref={title}
          level={4}
        >
          Project
        </CardTitle>
        <CardDescription ref={description}>Details</CardDescription>
      </CardHeader>
      <CardContent ref={content}>
        <button>Action</button>
      </CardContent>
      <CardFooter ref={footer}>Footer</CardFooter>
    </Card>
  )
  expect(card.current).toBe(host.firstElementChild)
  expect(card.current!.getAttribute('role')).toBeNull()
  expect(card.current!.getAttribute('tabindex')).toBeNull()
  expect(card.current!.dataset.slot).toBe('card project')
  expect(card.current!.title).toBe('Caller surface')
  expect(card.current!.style.transform).toBe('translateX(2px)')
  expect(getComputedStyle(card.current!).padding).toBe('0px')
  expect(header.current!.tagName).toBe('DIV')
  expect(title.current!.tagName).toBe('H4')
  expect(description.current!.tagName).toBe('P')
  expect(content.current!.tagName).toBe('DIV')
  expect(footer.current!.tagName).toBe('DIV')
  await act(async () => root.render(null))
  expect(cleanup).toHaveBeenCalledTimes(1)
})

test('an explicit region and heading level stay on the card', async () => {
  const { host } = await mount(
    createElement(
      Card,
      { role: 'region', 'aria-labelledby': 'pack-title' },
      createElement(CardTitle, { id: 'pack-title', level: 3 }, 'Pack')
    )
  )
  const card = host.querySelector('[data-slot=card]')!
  expect(card.getAttribute('role')).toBe('region')
  expect(card.getAttribute('aria-labelledby')).toBe('pack-title')
  expect(card.querySelector('h3')?.id).toBe('pack-title')
})

type Layout = ReturnType<typeof useSpringLayout>
function Fixture({
  columns,
  tall = false,
  reversed = false,
  capture
}: {
  columns: number
  tall?: boolean
  reversed?: boolean
  capture: (layout: Layout) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const layout = useSpringLayout(ref)
  const reduced = useReducedMotion()
  useLayoutEffect(() => capture(layout))
  const names = reversed ? ['b', 'a'] : ['a', 'b']
  return (
    <>
      <span data-reduced={String(reduced)} />
      <div
        ref={ref}
        style={{
          display: 'grid',
          width: '600px',
          gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`,
          gap: '16px'
        }}
      >
        {names.map(name => (
          <div
            key={name}
            data-rad-layout-slot=""
            data-key={name}
            style={{ display: 'flow-root' }}
          >
            <div data-rad-layout-part="">
              <Card style={{ transform: 'translateX(2px)', '--rad-card-padding': '12px' }}>
                <CardHeader>
                  <CardTitle>{name}</CardTitle>
                  <CardDescription>Real text stays crisp.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form>
                    <label>
                      Draft {name}
                      <input
                        name="draft"
                        defaultValue="Initial"
                        style={{ height: '32px', fontSize: '16px' }}
                      />
                    </label>
                    <div style={{ height: tall ? '160px' : '40px' }} />
                  </form>
                </CardContent>
                <CardFooter>
                  <button type="button">Action {name}</button>
                </CardFooter>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

for (const mode of ['light', 'dark'] as const) {
  test(`${mode}: measured Card resize/reorder retains native editing, form data and caller transforms`, async () => {
    let layout: Layout
    const capture = (value: Layout) => {
      layout = value
    }
    const tree = (columns: number, tall = false, reversed = false) => (
      <StrictMode>
        <ThemeScope
          theme={theme}
          mode={mode}
        >
          <Fixture
            columns={columns}
            tall={tall}
            reversed={reversed}
            capture={capture}
          />
        </ThemeScope>
      </StrictMode>
    )
    const { host, root } = await mount(tree(2))
    const slot = host.querySelector<HTMLElement>('[data-key=a]')!,
      part = slot.firstElementChild as HTMLElement,
      card = slot.querySelector<HTMLElement>('[data-slot=card]')!,
      input = slot.querySelector('input')!
    await act(async () => {
      await userEvent.clear(input)
      await userEvent.type(input, 'Keep this draft')
      input.setSelectionRange(2, 6)
    })
    await act(async () => root.render(tree(1, true, true)))
    await until(() => layout!.isAnimating())
    expect(host.querySelector('[data-key=a]')).toBe(slot)
    expect(document.activeElement).toBe(input)
    expect(input.selectionStart).toBe(2)
    expect(input.selectionEnd).toBe(6)
    expect(input.getBoundingClientRect().height).toBe(32)
    expect(getComputedStyle(input).fontSize).toBe('16px')
    expect(card.style.transform).toBe('translateX(2px)')
    expect(card.style.width).toBe('')
    expect(card.style.height).toBe('')
    expect(card.style.translate).toBe('')
    expect(part.style.scale).toBe('')
    expect(part.style.transform).toBe('')
    await act(async () => root.render(tree(2, false)))
    await until(() => !layout!.isAnimating())
    expect(part.style.position).toBe('')
    expect(part.style.width).toBe('')
    expect(part.style.translate).toBe('')
    expect(new FormData(slot.querySelector('form')!).get('draft')).toBe('Keep this draft')
    await act(async () => slot.querySelector('form')!.reset())
    expect(input.value).toBe('Initial')
  })
}

test('live theme off/reduced motion settle layout and disposal restores dedicated parts only', async () => {
  let layout: Layout
  const capture = (value: Layout) => {
    layout = value
  }
  const tree = (columns: number, off = false) => (
    <StrictMode>
      <ThemeScope theme={off ? { ...theme, motion: { ...theme.motion, mode: 'off' } } : theme}>
        <Fixture
          columns={columns}
          capture={capture}
        />
      </ThemeScope>
    </StrictMode>
  )
  const { host, root } = await mount(tree(2))
  const slot = host.querySelector<HTMLElement>('[data-key=a]')!,
    part = slot.firstElementChild as HTMLElement,
    card = slot.querySelector<HTMLElement>('[data-slot=card]')!
  await act(async () => root.render(tree(1)))
  await until(() => layout!.isAnimating())
  await act(async () => {
    await commands.emulatePreferences({ reducedMotion: 'reduce' })
  })
  await until(() => host.querySelector('[data-reduced]')?.getAttribute('data-reduced') === 'true')
  expect(layout!.isAnimating()).toBe(false)
  expect(part.style.position).toBe('')
  await act(async () => {
    await commands.emulatePreferences({ reducedMotion: 'no-preference' })
  })
  await until(() => host.querySelector('[data-reduced]')?.getAttribute('data-reduced') === 'false')
  await act(async () => root.render(tree(2, true)))
  expect(layout!.isAnimating()).toBe(false)
  expect(part.style.width).toBe('')
  await act(async () => root.render(tree(1)))
  await until(() => layout!.isAnimating())
  await act(async () => root.render(null))
  expect(part.style.position).toBe('')
  expect(slot.style.height).toBe('')
  expect(card.style.transform).toBe('translateX(2px)')
})

test('dashboard hydrates, preserves keyed drafts and expanded content, and restores keyboard reorder focus', async () => {
  const { host } = await mount(<CardDashboardExample />, true)
  const article = host.querySelector<HTMLElement>('[data-project=inbox]')!
  const input = article.querySelector('input')!
  const button = (text: string) =>
    [...article.querySelectorAll('button')].find(node => node.textContent === text)!
  const move = article.querySelector<HTMLButtonElement>('[aria-label$=": Calmer inbox"]')!
  await act(async () => {
    await userEvent.clear(input)
    await userEvent.type(input, 'A quiet draft')
    button('Show details').click()
    button('Add step').click()
  })
  expect(article.textContent).toContain('Step 2.')
  await act(async () => {
    move.focus()
    await userEvent.keyboard(' ')
  })
  expect(
    [...host.querySelectorAll('[data-project]')].map(node => node.getAttribute('data-project'))
  ).toEqual(['welcome', 'inbox', 'launch'])
  expect(document.activeElement).toBe(move)
  expect(move.getAttribute('aria-label')).toContain(move.textContent)
  expect(article.querySelector('input')).toBe(input)
  expect(input.value).toBe('A quiet draft')
  await act(async () => button('Save note').click())
  expect(article.querySelector('output')!.textContent).toBe('Saved locally: A quiet draft')
  await act(async () => button('Reset note').click())
  expect(input.value).toBe('Keep the daily digest optional.')
  expect(button('Hide details').getAttribute('aria-expanded')).toBe('true')
})

test('static dashboard keeps real interactions and no projected styles', async () => {
  const { host } = await mount(<CardDashboardExample staticMotion />)
  const article = host.querySelector<HTMLElement>('[data-project=launch]')!
  await act(async () =>
    article.querySelector<HTMLButtonElement>('[aria-label$=": Launch notes"]')!.click()
  )
  expect(host.querySelector('[data-project]')).toBe(article)
  for (const part of host.querySelectorAll<HTMLElement>('[data-rad-layout-part]')) {
    expect(part.style.position).toBe('')
    expect(part.style.width).toBe('')
  }
  expect(host.querySelector('[data-slot=card]')!.getAttribute('tabindex')).toBeNull()
})

test('server dashboard remains native and readable without projected presentation', () => {
  const markup = renderToString(<CardDashboardExample />)
  expect(markup).not.toContain('position:absolute')
  const host = document.createElement('div')
  host.innerHTML = markup
  expect(host.querySelectorAll('article')).toHaveLength(3)
  expect(host.querySelector('a')!.getAttribute('href')).toBe('/docs/getting-started/')
  expect(host.querySelector<HTMLInputElement>('[name=note]')!.value).toBe(
    'Keep the daily digest optional.'
  )
  expect(host.querySelector<HTMLButtonElement>('[aria-expanded]')!.disabled).toBe(true)
})

test('wide-to-narrow dashboard reflow contains moving parts before they settle', async () => {
  const tree = (width: string) => (
    <div
      data-board=""
      style={{ width }}
    >
      <CardDashboardExample />
    </div>
  )
  const { host, root } = await mount(tree('900px'))
  await act(async () => root.render(tree('280px')))
  const board = host.querySelector<HTMLElement>('[data-board]')!
  expect(board.scrollWidth).toBeLessThanOrEqual(280)
  for (let i = 0; i < 12; i++) {
    await act(async () => {
      await frame()
    })
    expect(board.scrollWidth).toBeLessThanOrEqual(280)
  }
})
