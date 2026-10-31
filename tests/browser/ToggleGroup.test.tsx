import { act, createRef, StrictMode, useRef, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { Button, ToggleGroup, ToggleGroupItem, ThemeScope, defineTheme } from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'
import { CompositeFocusContext, useRovingFocus } from '../../src/react/useRovingFocus.js'
import type {} from './mediaCommands.js'
import '../../.storybook/styles.css'
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const roots: Root[] = [],
  hosts: HTMLElement[] = []
const strict = (children: ReactNode) => <StrictMode>{children}</StrictMode>
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
const until = (check: () => boolean) => expect.poll(check, { timeout: 3000 }).toBe(true)
async function mount(children: ReactNode, hydrate = false) {
  const host = document.createElement('div')
  document.body.append(host)
  hosts.push(host)
  if (hydrate) host.innerHTML = renderToString(strict(children))
  const original = host.querySelector('[data-slot~="toggle-group"]'),
    errors: unknown[] = []
  let root: Root
  await act(async () => {
    root = hydrate
      ? hydrateRoot(host, strict(children), { onRecoverableError: error => errors.push(error) })
      : createRoot(host)
    if (!hydrate) root.render(strict(children))
    roots.push(root)
  })
  return { host, root: root!, original, errors }
}
afterEach(async () => {
  for (const root of roots.splice(0)) await act(async () => root.unmount())
  hosts.splice(0).forEach(host => host.remove())
  await commands.emulatePreferences({ reducedMotion: 'no-preference', forcedColors: 'none' })
})
const group = (host: HTMLElement) =>
  host.querySelector<HTMLDivElement>('[data-slot~="toggle-group"]')!
const choices = (host: HTMLElement) =>
  Array.from(group(host).querySelectorAll<HTMLButtonElement>('button'))
const stops = (host: HTMLElement) => choices(host).filter(button => button.tabIndex === 0)
const mark = (host: HTMLElement) =>
  host.querySelector<HTMLElement>('[data-slot="toggle-group-indicator"]')!.parentElement!
function aligns(host: HTMLElement) {
  const panel = group(host),
    selected = panel.querySelector<HTMLButtonElement>('[aria-pressed="true"]')!,
    a = mark(host).getBoundingClientRect(),
    b = selected.getBoundingClientRect()
  const aligned =
    Math.abs(a.left - b.left) < 1 &&
    Math.abs(a.top - b.top) < 1 &&
    Math.abs(a.width - b.width) < 1 &&
    Math.abs(a.height - b.height) < 1
  return aligned
}

test('single toggles hydrate native Buttons, rove without selecting, activate with Space and retain logical state on form reset', async () => {
  const changes: (string | null)[] = [],
    ref = createRef<HTMLDivElement>(),
    itemRef = createRef<HTMLButtonElement>()
  const { host, original, errors } = await mount(
    <form>
      <input
        name="note"
        defaultValue="Original"
      />
      <ToggleGroup
        ref={ref}
        aria-label="Alignment"
        defaultValue="b"
        onValueChange={next => changes.push(next)}
      >
        <ToggleGroupItem
          value="a"
          ref={itemRef}
          name="format"
        >
          Alpha
        </ToggleGroupItem>
        <ToggleGroupItem value="b">Beta</ToggleGroupItem>
        <ToggleGroupItem
          value="c"
          disabled
        >
          Unavailable
        </ToggleGroupItem>
        <ToggleGroupItem value="d">Delta</ToggleGroupItem>
      </ToggleGroup>
      <button>After</button>
    </form>,
    true
  )
  const [a, b, c, d] = choices(host),
    input = host.querySelector('input')!,
    after = host.querySelector<HTMLButtonElement>('form > button')!
  expect(group(host)).toBe(original)
  expect(ref.current).toBe(original)
  expect(itemRef.current).toBe(a)
  expect(errors).toEqual([])
  expect(changes).toEqual([])
  expect(stops(host)).toEqual([b])
  expect(c).toBeDisabled()
  expect(a.type).toBe('button')
  await act(async () => input.focus())
  await act(async () => userEvent.keyboard('{Tab}'))
  expect(b).toHaveFocus()
  await act(async () => userEvent.keyboard('{ArrowRight}'))
  expect(d).toHaveFocus()
  await act(async () => userEvent.keyboard('{ArrowRight}'))
  expect(a).toHaveFocus()
  expect(changes).toEqual([])
  expect(b).toHaveAttribute('aria-pressed', 'true')
  await act(async () => userEvent.keyboard(' '))
  expect(changes).toEqual(['a'])
  expect(a).toHaveAttribute('aria-pressed', 'true')
  expect(b).toHaveAttribute('aria-pressed', 'false')
  input.value = 'Edited'
  await act(async () => host.querySelector('form')!.reset())
  expect(input.value).toBe('Original')
  expect(a).toHaveAttribute('aria-pressed', 'true')
  expect(new FormData(host.querySelector('form')!).get('format')).toBe(null)
  await act(async () => userEvent.keyboard(' '))
  expect(changes).toEqual(['a', null])
  expect(choices(host).every(button => button.getAttribute('aria-pressed') === 'false')).toBe(true)
  await act(async () => userEvent.keyboard('{Tab}'))
  expect(after).toHaveFocus()
  await act(async () => userEvent.keyboard('{Shift>}{Tab}{/Shift}'))
  expect(a).toHaveFocus()
  expect(stops(host)).toHaveLength(1)
})

test('variant chooses the segmented treatment and its indicator', async () => {
  const { host } = await mount(
    <>
      <ToggleGroup
        aria-label="View"
        variant="segmented"
        defaultValue="b"
        motion="off"
      >
        <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
        <ToggleGroupItem value="b">Beta</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup
        aria-label="Formatting"
        defaultValue="bold"
      >
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
      </ToggleGroup>
    </>
  )
  const [segmented, buttons] = Array.from(
    host.querySelectorAll<HTMLDivElement>('[data-slot~="toggle-group"]')
  )
  expect(segmented).toHaveAttribute('data-variant', 'segmented')
  expect(segmented).not.toHaveAttribute('variant')
  expect(buttons).toHaveAttribute('data-variant', 'buttons')
  expect(buttons.querySelector('[data-slot="toggle-group-indicator"]')).toBeNull()
  await until(() => aligns(host))
  await act(async () => userEvent.click(segmented.querySelector('button')!))
  await until(() => aligns(host))
})

test('data-selected marks pressed items beside aria-pressed in single and multiple groups', async () => {
  const { host } = await mount(
    <>
      <ToggleGroup
        aria-label="Alignment"
        defaultValue="b"
      >
        <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
        <ToggleGroupItem value="b">Beta</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup
        aria-label="Formatting"
        type="multiple"
        defaultValue={['bold']}
      >
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>
    </>
  )
  const [alpha, beta, bold, italic] = Array.from(host.querySelectorAll('button'))
  for (const item of [alpha, beta, bold, italic]) expect(item).not.toHaveAttribute('data-state')
  expect(beta).toHaveAttribute('data-selected', '')
  expect(beta).toHaveAttribute('aria-pressed', 'true')
  expect(alpha).not.toHaveAttribute('data-selected')
  expect(alpha).toHaveAttribute('aria-pressed', 'false')
  await act(async () => userEvent.click(alpha))
  expect(alpha).toHaveAttribute('data-selected', '')
  expect(beta).not.toHaveAttribute('data-selected')
  await act(async () => userEvent.click(italic))
  expect(bold).toHaveAttribute('data-selected', '')
  expect(italic).toHaveAttribute('data-selected', '')
  expect(italic).toHaveAttribute('aria-pressed', 'true')
  await act(async () => userEvent.click(bold))
  expect(bold).not.toHaveAttribute('data-selected')
  expect(bold).toHaveAttribute('aria-pressed', 'false')
})

test('multiple selection, controlled refusal, consumer cancellation and disabled requests have one owner', async () => {
  const changes = vi.fn(),
    clicks = vi.fn()
  const parts = (
    <>
      <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
      <ToggleGroupItem value="b">Beta</ToggleGroupItem>
      <ToggleGroupItem
        value="c"
        onClick={event => {
          clicks()
          event.preventDefault()
        }}
      >
        Cancelled
      </ToggleGroupItem>
    </>
  )
  const { host, root } = await mount(
    <ToggleGroup
      key="local"
      aria-label="Formatting"
      type="multiple"
      defaultValue={['a']}
      onValueChange={changes}
    >
      {parts}
    </ToggleGroup>
  )
  await act(async () => userEvent.click(choices(host)[1]))
  expect(changes.mock.calls).toEqual([[['a', 'b']]])
  expect(choices(host)[0]).toHaveAttribute('aria-pressed', 'true')
  expect(choices(host)[1]).toHaveAttribute('aria-pressed', 'true')
  await act(async () => userEvent.click(choices(host)[2]))
  expect(clicks).toHaveBeenCalledOnce()
  expect(changes).toHaveBeenCalledOnce()
  const controlled = (value: string[], disabled = false) => (
    <ToggleGroup
      key="owned"
      aria-label="Formatting"
      type="multiple"
      value={value}
      disabled={disabled}
      onValueChange={changes}
    >
      {parts}
    </ToggleGroup>
  )
  await act(async () => root.render(strict(controlled(['a']))))
  changes.mockClear()
  await act(async () => userEvent.click(choices(host)[1]))
  expect(changes.mock.calls).toEqual([[['a', 'b']]])
  expect(choices(host)[1]).toHaveAttribute('aria-pressed', 'false')
  await act(async () => root.render(strict(controlled(['b']))))
  expect(changes).toHaveBeenCalledOnce()
  expect(choices(host)[1]).toHaveAttribute('aria-pressed', 'true')
  await act(async () => root.render(strict(controlled(['b'], true))))
  await act(async () =>
    choices(host)[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  )
  expect(changes).toHaveBeenCalledOnce()
  expect(stops(host)).toHaveLength(0)
})

test('orientation, native RTL, non-looping edges, dynamic fieldsets and consumer keyboard cancellation preserve one tab stop', async () => {
  const view = (
    orientation: 'horizontal' | 'vertical' = 'horizontal',
    dir: 'ltr' | 'rtl' = 'rtl',
    cancel = false
  ) => (
    <fieldset>
      <legend>Editor</legend>
      <ToggleGroup
        aria-label="View"
        orientation={orientation}
        dir={dir}
        loop={false}
        defaultValue="a"
        onKeyDown={event => {
          if (cancel) event.preventDefault()
        }}
      >
        <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
        <ToggleGroupItem value="b">Beta</ToggleGroupItem>
        <ToggleGroupItem value="c">Gamma</ToggleGroupItem>
      </ToggleGroup>
    </fieldset>
  )
  const { host, root } = await mount(view()),
    [a, b, c] = choices(host)
  await act(async () => a.focus())
  await act(async () => userEvent.keyboard('{ArrowLeft}'))
  expect(b).toHaveFocus()
  await act(async () => userEvent.keyboard('{End}'))
  expect(c).toHaveFocus()
  await act(async () => userEvent.keyboard('{ArrowLeft}'))
  expect(c).toHaveFocus()
  await act(async () => userEvent.keyboard('{Home}'))
  expect(a).toHaveFocus()
  await act(async () => userEvent.keyboard('{ArrowRight}'))
  expect(a).toHaveFocus()
  await act(async () => root.render(strict(view('vertical'))))
  await act(async () => userEvent.keyboard('{ArrowDown}'))
  expect(b).toHaveFocus()
  await act(async () => root.render(strict(view('vertical', 'ltr', true))))
  await act(async () => userEvent.keyboard('{ArrowDown}'))
  expect(b).toHaveFocus()
  const fieldset = host.querySelector('fieldset')!
  await act(async () => {
    fieldset.disabled = true
  })
  await until(() => stops(host).length === 0)
  await act(async () => {
    fieldset.disabled = false
  })
  await until(() => stops(host).length === 1)
  await act(async () => {
    a.disabled = true
  })
  await until(() => stops(host)[0] !== a)
  expect(stops(host)).toHaveLength(1)
  await act(async () => {
    a.disabled = false
  })
  await until(() => stops(host).length === 1)
})

function Composite({ children }: { children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null),
    roving = useRovingFocus({
      host,
      selector: 'button',
      scope: '[data-composite-proof]',
      orientation: 'horizontal',
      loop: true
    })
  return (
    <CompositeFocusContext.Provider value="[data-composite-proof]">
      <div
        ref={host}
        role="toolbar"
        tabIndex={-1}
        aria-label="Editor"
        data-composite-proof=""
        onFocus={roving.onFocus}
        onBlur={roving.onBlur}
        onKeyDown={roving.onKeyDown}
      >
        <Button>Before</Button>
        {children}
        <Button>After</Button>
      </div>
    </CompositeFocusContext.Provider>
  )
}
test('a surrounding composite owns nested ToggleGroup tab stops without changing pressed semantics', async () => {
  const { host } = await mount(
      <>
        <Composite>
          <ToggleGroup
            aria-label="Formatting"
            defaultValue="b"
          >
            <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
            <ToggleGroupItem value="b">Beta</ToggleGroupItem>
          </ToggleGroup>
        </Composite>
        <button>Done</button>
      </>
    ),
    toolbar = host.querySelector('[role="toolbar"]')!,
    buttons = Array.from(toolbar.querySelectorAll<HTMLButtonElement>('button'))
  expect(buttons.filter(button => button.tabIndex === 0)).toEqual([buttons[0]])
  await act(async () => buttons[0].focus())
  await act(async () => userEvent.keyboard('{ArrowRight}'))
  expect(buttons[1]).toHaveFocus()
  await act(async () => userEvent.keyboard(' '))
  expect(buttons[1]).toHaveAttribute('aria-pressed', 'true')
  expect(buttons[2]).toHaveAttribute('aria-pressed', 'false')
  await act(async () => userEvent.keyboard('{ArrowRight}'))
  expect(buttons[2]).toHaveFocus()
  expect(buttons.filter(button => button.tabIndex === 0)).toEqual([buttons[2]])
  await act(async () => userEvent.keyboard('{Tab}'))
  expect(host.querySelector(':scope > button')).toHaveFocus()
})

test('the segmented indicator follows actual layout through borders, RTL, label resize and caller styling without a motion provider', async () => {
  const cleanup = vi.fn(),
    ref = vi.fn((node: HTMLDivElement | null) => (node ? cleanup : undefined))
  const view = (long = false, dir: 'ltr' | 'rtl' = 'ltr') => (
    <ToggleGroup
      ref={ref}
      aria-label="View"
      variant="segmented"
      defaultValue="b"
      dir={dir}
      motion="off"
      className="gap-7"
      style={{ border: '3px solid black', padding: '9px' }}
      parts={{ indicator: { className: 'rounded-none', style: { opacity: 0.7 } } }}
    >
      <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
      <ToggleGroupItem value="b">{long ? 'A much longer Beta label' : 'Beta'}</ToggleGroupItem>
    </ToggleGroup>
  )
  const { host, root, original, errors } = await mount(view(), true)
  expect(errors).toEqual([])
  expect(group(host)).toBe(original)
  await until(() => aligns(host))
  expect(getComputedStyle(group(host)).gap).toBe('28px')
  expect(getComputedStyle(mark(host).firstElementChild!).borderRadius).toBe('0px')
  await act(async () => root.render(strict(view(true, 'rtl'))))
  await until(() => aligns(host))
  expect(mark(host).firstElementChild).toHaveStyle({ opacity: '0.7' })
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  expect(getComputedStyle(mark(host).firstElementChild!).outlineStyle).toBe('solid')
  expect(choices(host)[1]).toHaveAttribute('aria-pressed', 'true')
  await act(async () => userEvent.click(choices(host)[0]))
  await until(() => aligns(host))
  await act(async () => userEvent.click(choices(host)[0]))
  expect(mark(host).hidden).toBe(true)
  const cleaned = cleanup.mock.calls.length
  await act(async () => root.render(null))
  expect(cleanup).toHaveBeenCalledTimes(cleaned + 1)
})

test('indicator springs use the follow profile, react to reduced motion and theme off, and keep caller visual styles', async () => {
  const slow = defineTheme({
      id: 'slow-indicator',
      name: 'Slow indicator',
      motion: { interactions: { follow: { stiffness: 70, damping: 13 } } }
    }),
    fast = defineTheme({
      id: 'fast-indicator',
      name: 'Fast indicator',
      motion: { interactions: { follow: { stiffness: 700, damping: 40 } } }
    }),
    off = defineTheme({ id: 'off-indicator', name: 'Off indicator', motion: { mode: 'off' } })
  const content = (theme = slow, motion: 'inherit' | 'off' = 'inherit') => (
    <ThemeScope theme={theme}>
      <MotionProvider>
        <ToggleGroup
          aria-label="View"
          variant="segmented"
          defaultValue="a"
          motion={motion}
          parts={{ indicator: { style: { transform: 'rotate(1deg)' } } }}
        >
          <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
          <ToggleGroupItem value="b">Beta</ToggleGroupItem>
        </ToggleGroup>
      </MotionProvider>
    </ThemeScope>
  )
  const first = await mount(content()),
    second = await mount(content(fast))
  await until(() => aligns(first.host) && aligns(second.host))
  const a = mark(first.host).getBoundingClientRect().left,
    b = mark(second.host).getBoundingClientRect().left
  await act(async () => {
    choices(first.host)[1].click()
    choices(second.host)[1].click()
  })
  for (let i = 0; i < 4; i++) await frame()
  const progress = (host: HTMLElement, start: number) =>
    (mark(host).getBoundingClientRect().left - start) /
    (choices(host)[1].getBoundingClientRect().left - start)
  expect(progress(second.host, b)).toBeGreaterThan(progress(first.host, a) + 0.1)
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  await until(() => aligns(first.host))
  await act(async () => choices(first.host)[0].click())
  for (let i = 0; i < 4; i++) {
    await frame()
    expect(aligns(first.host)).toBe(true)
  }
  await commands.emulatePreferences({ reducedMotion: 'no-preference' })
  await act(async () => first.root.render(strict(content(off))))
  await act(async () => choices(first.host)[1].click())
  await frame()
  expect(aligns(first.host)).toBe(true)
  await act(async () => first.root.render(strict(content(slow, 'off'))))
  await act(async () => choices(first.host)[0].click())
  await frame()
  expect(aligns(first.host)).toBe(true)
  expect((mark(first.host).firstElementChild as HTMLElement).style.transform).toBe('rotate(1deg)')
})
