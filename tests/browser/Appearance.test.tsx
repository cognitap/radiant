import { act, createRef, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, page, userEvent } from 'vitest/browser'
import {
  Button,
  Checkbox,
  Input,
  Radio,
  ThemeScope,
  defaultTheme,
  defineTheme,
  type Theme,
  type ThemeMode
} from '../../src/index.js'
import { themes } from '../../src/examples/index.js'
import { WorkspaceSettings } from '../../.storybook/examples/WorkspaceSettings.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
let root: Root
let host: HTMLDivElement

afterEach(async () => {
  await act(async () => userEvent.keyboard('{/Space}'))
  if (root) await act(async () => root.unmount())
  host?.remove()
  await commands.emulatePreferences({ colorScheme: null, reducedMotion: null, forcedColors: null })
})

async function mount(children: ReactNode) {
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  await act(async () => root.render(children))
}

function workspace(theme: Theme, mode: ThemeMode) {
  return (
    <ThemeScope
      theme={theme}
      mode={mode}
    >
      <Button pending>Saving changes</Button>
      <Button disabled>Unavailable</Button>
      <Checkbox
        label="Locked updates"
        disabled
        defaultChecked
      />
      <Checkbox
        label="Mixed updates"
        indeterminate
      />
      <Radio
        label="Locked plan"
        name="locked"
        value="locked"
        disabled
        defaultChecked
      />
      <WorkspaceSettings />
    </ThemeScope>
  )
}

function systemColor(color: string) {
  const probe = document.createElement('span')
  probe.style.cssText = `color:${color};forced-color-adjust:none`
  host.append(probe)
  const result = getComputedStyle(probe).color
  probe.remove()
  return result
}

for (const mode of ['light', 'dark'] as const) {
  test(`${mode}: rendered scopes inherit, isolate, reset and follow system changes`, async () => {
    const brand = defineTheme({
      id: 'audit-brand',
      name: 'Audit brand',
      tokens: { control: { radius: '17px' }, color: { accent: 'rgb(10, 50, 90)' } },
      components: { button: { radius: '23px', shadow: '4px 4px 0 rgb(10, 50, 90)' } },
      modes: { dark: { tokens: { color: { accent: 'rgb(200, 220, 240)' } } } }
    })
    const controls = (
      <>
        <Button>Save</Button>
        <Input aria-label="Name" />
      </>
    )
    await commands.emulatePreferences({ colorScheme: mode })
    await mount(
      <>
        <ThemeScope
          theme={brand}
          mode="system"
          style={{ '--rad-input-radius': '19px' }}
        >
          <div data-case="parent">{controls}</div>
          <ThemeScope data-case="inherited">{controls}</ThemeScope>
          <ThemeScope
            mode={mode === 'light' ? 'dark' : 'light'}
            data-case="mode"
          >
            {controls}
          </ThemeScope>
          <ThemeScope
            theme={defaultTheme}
            data-case="reset"
          >
            {controls}
          </ThemeScope>
        </ThemeScope>
        <ThemeScope
          theme={defaultTheme}
          mode="system"
          data-case="sibling"
        >
          {controls}
        </ThemeScope>
      </>
    )
    const button = (name: string) =>
      host.querySelector<HTMLButtonElement>(`[data-case=${name}] button`)!
    const input = (name: string) =>
      host.querySelector<HTMLInputElement>(`[data-case=${name}] input`)!
    const light = 'rgb(10, 50, 90)'
    const dark = 'rgb(200, 220, 240)'
    expect(getComputedStyle(button('parent')).backgroundColor).toBe(mode === 'light' ? light : dark)
    expect(getComputedStyle(button('inherited')).borderRadius).toBe('23px')
    expect(getComputedStyle(input('inherited')).borderRadius).toBe('19px')
    expect(getComputedStyle(button('mode')).backgroundColor).toBe(mode === 'light' ? dark : light)
    expect(getComputedStyle(input('mode')).borderRadius).toBe('19px')
    for (const element of ['button', 'input']) {
      const reset = host.querySelector(`[data-case=reset] ${element}`)!
      const sibling = host.querySelector(`[data-case=sibling] ${element}`)!
      for (const property of ['border-radius', 'background-color', 'box-shadow']) {
        expect(getComputedStyle(reset).getPropertyValue(property)).toBe(
          getComputedStyle(sibling).getPropertyValue(property)
        )
      }
    }
    await commands.emulatePreferences({ colorScheme: mode === 'light' ? 'dark' : 'light' })
    await expect
      .poll(() => getComputedStyle(button('parent')).backgroundColor)
      .toBe(mode === 'light' ? dark : light)
    expect(getComputedStyle(button('mode')).backgroundColor).toBe(mode === 'light' ? dark : light)
  })

  for (const theme of themes) {
    test(`${theme.id} ${mode}: reduced motion preserves pending text and removes movement`, async () => {
      await commands.emulatePreferences({ reducedMotion: 'reduce' })
      await mount(workspace(theme, mode))
      expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true)
      const pending = host.querySelector('[aria-busy=true]')!
      expect(getComputedStyle(pending.firstElementChild!).opacity).toBe('1')
      expect(getComputedStyle(pending.querySelector('[aria-hidden]')!).display).toBe('none')
      const trigger = host.querySelector<HTMLButtonElement>('[data-slot~=dialog-trigger]')!
      trigger.focus()
      await act(async () => userEvent.keyboard('{Space>}'))
      expect(trigger.matches(':active')).toBe(true)
      expect(getComputedStyle(trigger).scale).toBe('none')
      expect(getComputedStyle(trigger).translate).toBe('none')
      expect(getComputedStyle(trigger).transitionProperty).toBe('background-color, color')
      await act(async () => userEvent.keyboard('{/Space}'))
      await expect.element(page.getByRole('dialog')).toBeVisible()
      for (const element of host.querySelectorAll(
        '[data-slot~=card], details, summary, summary svg, dialog, [data-slot~=link]'
      )) {
        expect(getComputedStyle(element).transitionProperty).toBe('none')
      }
      for (const details of host.querySelectorAll('details')) {
        expect(getComputedStyle(details, '::details-content').transitionProperty).toBe('none')
      }
      await act(async () => userEvent.keyboard('{Escape}'))
      await expect.element(page.getByRole('button', { name: 'Edit profile' })).toHaveFocus()
      await commands.emulatePreferences({ reducedMotion: 'no-preference' })
      await act(async () => userEvent.keyboard('{Space>}'))
      const styles = getComputedStyle(trigger)
      const scale =
        styles.getPropertyValue('--rad-button-press-scale').trim() ||
        styles.getPropertyValue('--rad-motion-press-scale').trim()
      await expect.poll(() => getComputedStyle(trigger).scale).toBe(scale || '0.97')
    })

    test(`${theme.id} ${mode}: forced colors retain selection, disabled cues and keyboard focus`, async () => {
      await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
      await mount(workspace(theme, mode))
      expect(matchMedia('(forced-colors: active)').matches).toBe(true)
      for (const input of host.querySelectorAll<HTMLInputElement>(
        'input[type=checkbox], input[type=radio]'
      )) {
        if (!input.checked && !input.indeterminate) continue
        const mark =
          input.parentElement!.querySelectorAll('[aria-hidden]')[input.indeterminate ? 1 : 0]
        const fill = getComputedStyle(input).backgroundColor
        const ink =
          input.type === 'radio'
            ? getComputedStyle(mark).backgroundColor
            : getComputedStyle(mark).color
        expect(getComputedStyle(mark).opacity).toBe('1')
        expect(ink).not.toBe(fill)
        expect(ink).toBe(systemColor(input.disabled ? 'GrayText' : 'HighlightText'))
      }
      const disabled = host.querySelector<HTMLButtonElement>('button:disabled')!
      expect(getComputedStyle(disabled).opacity).toBe('1')
      expect(getComputedStyle(disabled).color).toBe(systemColor('GrayText'))
      expect(getComputedStyle(disabled).borderTopColor).toBe(systemColor('GrayText'))
      await act(async () => userEvent.click(page.getByRole('button', { name: 'Edit profile' })))
      await act(async () => userEvent.tab())
      const focused = document.activeElement!
      expect(focused.matches(':focus-visible')).toBe(true)
      expect(getComputedStyle(focused).outlineStyle).not.toBe('none')
      expect(parseFloat(getComputedStyle(focused).outlineWidth)).toBeGreaterThan(0)
      await act(async () => userEvent.keyboard('{Escape}'))
      await expect.element(page.getByRole('button', { name: 'Edit profile' })).toHaveFocus()
    })
  }
}

test('a server-rendered scope hydrates onto one div and releases its ref', async () => {
  const brand = defineTheme({
    id: 'scope-brand',
    name: 'Scope brand',
    tokens: { color: { accent: 'red' }, control: { radius: '1rem' } },
    modes: { dark: { tokens: { color: { accent: 'pink' } } } }
  })
  const ref = createRef<HTMLDivElement>()
  let clicks = 0
  const tree = (
    <ThemeScope
      ref={ref}
      id="scope"
      theme={brand}
      mode="system"
      onClick={() => {
        clicks += 1
      }}
    >
      <Button>Save</Button>
    </ThemeScope>
  )
  host = document.createElement('div')
  host.innerHTML = renderToString(tree)
  document.body.append(host)
  const errors: unknown[] = []
  await act(async () => {
    root = hydrateRoot(host, tree, { onRecoverableError: error => errors.push(error) })
  })
  expect(errors).toEqual([])
  expect(ref.current?.tagName).toBe('DIV')
  expect(ref.current?.id).toBe('scope')
  await act(async () => ref.current?.click())
  expect(clicks).toBe(1)
  await act(async () => root.unmount())
  expect(ref.current).toBeNull()
})
