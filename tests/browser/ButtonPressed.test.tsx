import { act, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { Button, ThemeScope, ToggleGroup, ToggleGroupItem } from '../../src/index.js'
import { themes } from '../../src/examples/index.js'
import type {} from './mediaCommands.js'
import '../../.storybook/styles.css'
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const roots: Root[] = [],
  hosts: HTMLElement[] = []
const strict = (children: ReactNode) => <StrictMode>{children}</StrictMode>
async function mount(children: ReactNode, hydrate = false) {
  const host = document.createElement('div')
  document.body.append(host)
  hosts.push(host)
  if (hydrate) host.innerHTML = renderToString(strict(children))
  const original = host.querySelector('button'),
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

test('uncontrolled toggles hydrate, keep a stable name, use native Space/Enter, and retain state through form reset', async () => {
  const calls: string[] = [],
    cleanup = vi.fn(),
    ref = vi.fn((node: HTMLButtonElement | null) => {
      if (node) return cleanup
    })
  const view = (pending = false, cancel = false) => (
    <form>
      <Button
        ref={ref}
        defaultPressed
        name="format"
        value="bold"
        pending={pending}
        onClick={event => {
          expect(event.currentTarget.tagName).toBe('BUTTON')
          calls.push('click')
          if (cancel) event.preventDefault()
        }}
        onPressedChange={next => calls.push(`pressed:${next}`)}
        render={props => <button {...props} />}
      >
        Bold
      </Button>
    </form>
  )
  const { host, root, original, errors } = await mount(view(), true),
    button = host.querySelector('button')!
  expect(button).toBe(original)
  expect(errors).toEqual([])
  expect(calls).toEqual([])
  expect(button).toHaveAccessibleName('Bold')
  expect(button).toHaveAttribute('aria-pressed', 'true')
  expect(button.type).toBe('button')
  expect(button.name).toBe('format')
  expect(button.value).toBe('bold')
  await act(async () => userEvent.click(button))
  expect(calls).toEqual(['click', 'pressed:false'])
  expect(button).toHaveAttribute('aria-pressed', 'false')
  await act(async () => host.querySelector('form')!.reset())
  expect(button).toHaveAttribute('aria-pressed', 'false')
  expect(calls).toHaveLength(2)
  await act(async () => userEvent.keyboard(' '))
  expect(button).toHaveAttribute('aria-pressed', 'true')
  await act(async () => userEvent.keyboard('{Enter}'))
  expect(button).toHaveAttribute('aria-pressed', 'false')
  expect(calls).toEqual([
    'click',
    'pressed:false',
    'click',
    'pressed:true',
    'click',
    'pressed:false'
  ])
  await act(async () => root.render(strict(view(false, true))))
  await act(async () => userEvent.click(button))
  expect(button).toHaveAttribute('aria-pressed', 'false')
  expect(calls.at(-1)).toBe('click')
  expect(calls).toHaveLength(7)
  await act(async () => root.render(strict(view(true))))
  await act(async () => button.click())
  expect(calls).toHaveLength(7)
  expect(button).toHaveFocus()
  expect(button).toHaveAccessibleName('Bold')
  const cleaned = cleanup.mock.calls.length
  await act(async () => root.render(null))
  expect(cleanup).toHaveBeenCalledTimes(cleaned + 1)
})

test('controlled refusal, prop sync, disabled fieldsets and pending preserve one pressed-state owner', async () => {
  const changes = vi.fn(),
    clicks = vi.fn(),
    native: Record<string, unknown> = { 'aria-pressed': true }
  const view = (pressed = false, disabled = false, pending = false) => (
    <fieldset disabled={disabled}>
      <Button
        {...native}
        pressed={pressed}
        onPressedChange={changes}
        onClick={clicks}
        pending={pending}
      >
        Bookmark
      </Button>
    </fieldset>
  )
  const { host, root } = await mount(view()),
    button = host.querySelector('button')!
  expect(button).toHaveAttribute('aria-pressed', 'false')
  await act(async () => userEvent.click(button))
  expect(changes.mock.calls).toEqual([[true]])
  expect(clicks).toHaveBeenCalledOnce()
  expect(button).toHaveAttribute('aria-pressed', 'false')
  await act(async () => root.render(strict(view(true))))
  expect(changes).toHaveBeenCalledOnce()
  expect(button).toHaveAttribute('aria-pressed', 'true')
  await act(async () => root.render(strict(view(true, true))))
  await act(async () =>
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  )
  expect(changes).toHaveBeenCalledOnce()
  expect(clicks).toHaveBeenCalledOnce()
  await act(async () => root.render(strict(view(true, false, true))))
  await act(async () => button.click())
  expect(changes).toHaveBeenCalledOnce()
  expect(clicks).toHaveBeenCalledOnce()
  await act(async () => root.render(strict(view(true))))
  await act(async () => userEvent.click(button))
  expect(changes.mock.calls).toEqual([[true], [false]])
  expect(button).toHaveAttribute('aria-pressed', 'true')
})

test('pressed cues persist after release, respect caller classes and remain distinct in forced colors', async () => {
  const view = (override = false) => (
    <>
      <button>Before</button>
      <Button
        defaultPressed
        variant="outline"
        style={{ transform: 'rotate(2deg)' }}
        className={override ? 'aria-pressed:inset-ring-0' : undefined}
      >
        Italic
      </Button>
    </>
  )
  const { host, root } = await mount(view()),
    button = host.querySelectorAll('button')[1]!
  expect(getComputedStyle(button).getPropertyValue('--tw-inset-ring-shadow')).toContain('2px')
  expect(button.style.transform).toBe('rotate(2deg)')
  await act(async () => root.render(strict(view(true))))
  expect(getComputedStyle(button).getPropertyValue('--tw-inset-ring-shadow')).not.toContain('2px')
  await commands.emulatePreferences({ reducedMotion: 'reduce', forcedColors: 'active' })
  await act(async () => host.querySelector('button')!.focus())
  await act(async () => userEvent.keyboard('{Tab}'))
  expect(button).toHaveFocus()
  expect(getComputedStyle(button).textDecorationLine).toContain('underline')
  expect(getComputedStyle(button).outlineStyle).not.toBe('none')
  expect(button).toHaveAttribute('aria-pressed', 'true')
})

// One sRGB pixel painted from the layers, in OKLab, where a distance of about 0.02 is just noticeable.
const paint = (...layers: string[]) => {
  const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
  for (const layer of layers) {
    context.fillStyle = layer
    context.fillRect(0, 0, 1, 1)
  }
  const [r, g, b] = [...context.getImageData(0, 0, 1, 1).data].map(channel => {
    const c = channel / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  const [l, m, s] = [
    0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
    0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
    0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
  ].map(Math.cbrt) as [number, number, number]
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675778 * s
  ]
}
const distance = (a: number[], b: number[]) => Math.hypot(...a.map((value, i) => value - b[i]!))

for (const mode of ['light', 'dark'] as const) {
  test(`${mode}: every example theme fills pressed buttons visibly apart from released ones`, async () => {
    const variants = ['solid', 'soft', 'outline', 'ghost'] as const,
      tones = ['accent', 'neutral'] as const
    const { host } = await mount(
      <>
        {themes.map(theme => (
          <ThemeScope
            key={theme.id}
            theme={theme}
            mode={mode}
            data-theme-id={theme.id}
          >
            {variants.flatMap(variant =>
              tones.map(tone => (
                <span
                  key={variant + tone}
                  data-pair={`${variant} ${tone}`}
                >
                  {[false, true].map(pressed => (
                    <Button
                      key={String(pressed)}
                      variant={variant}
                      tone={tone}
                      controlSize="small"
                      aria-pressed={pressed}
                    >
                      Bold
                    </Button>
                  ))}
                </span>
              ))
            )}
            <ToggleGroup
              aria-label="Format"
              data-pair="toggle group"
              defaultValue="bold"
            >
              <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
              <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
            </ToggleGroup>
            <Button
              aria-pressed
              data-case="layer off"
              style={{ '--rad-button-selected-layer': '0%' }}
            >
              Bold
            </Button>
            <span
              data-case="role"
              style={{
                background: 'var(--rad-control-selected-background, transparent)',
                color: 'var(--rad-control-selected-foreground, transparent)'
              }}
            />
          </ThemeScope>
        ))}
      </>
    )
    const faint: string[] = []
    for (const scope of host.querySelectorAll<HTMLElement>('[data-theme-id]')) {
      const scopeFill = getComputedStyle(scope).backgroundColor
      const canvas =
        scopeFill === 'rgba(0, 0, 0, 0)'
          ? getComputedStyle(scope).getPropertyValue('--rad-color-surface')
          : scopeFill
      const fill = (element: Element) => paint(canvas, getComputedStyle(element).backgroundColor)
      for (const pair of scope.querySelectorAll('[data-pair]')) {
        const [released, pressed] = pair.querySelectorAll('button')
        expect(released).toHaveAttribute('aria-pressed', 'false')
        expect(pressed).toHaveAttribute('aria-pressed', 'true')
        const gap = distance(fill(released!), fill(pressed!))
        if (gap < 0.04)
          faint.push(
            `${scope.dataset.themeId} ${pair.getAttribute('data-pair')}: ${gap.toFixed(3)}`
          )
      }
      const role = scope.querySelector('[data-case=role]')!
      const theme = themes.find(({ id }) => id === scope.dataset.themeId)!
      if (theme.modes[mode]['--rad-control-selected-background'] !== 'initial') {
        const exact = scope.querySelector('[data-case="layer off"]')!
        expect(distance(fill(exact), fill(role)), theme.id).toBeLessThan(0.002)
        expect(getComputedStyle(exact).color, theme.id).toBe(getComputedStyle(role).color)
      }
    }
    expect(faint).toEqual([])
  })
}
