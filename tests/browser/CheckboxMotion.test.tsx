import { act, createRef, StrictMode, useState, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { Checkbox, Field, ThemeScope, defineTheme, type CheckboxProps } from '../../src/index.js'
import {
  CheckboxFeedback,
  CheckboxPermissionsExample
} from '../../.storybook/examples/CheckboxExamples.js'
import { useReducedMotion } from '../../src/motion/react.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: Array<{ root: Root; host: HTMLDivElement }> = []
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
const theme = defineTheme({
  id: 'checkbox-motion',
  name: 'Checkbox motion',
  motion: { interactions: { press: { stiffness: 180, damping: 14 } } }
})
function Preference() {
  return <span data-reduced={String(useReducedMotion())} />
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
async function until(check: () => boolean) {
  await expect.poll(check, { timeout: 4_000 }).toBe(true)
}
const progress = (node: HTMLElement) =>
  Number(node.style.getPropertyValue('--example-checkbox-feedback'))
async function preference(reducedMotion: 'reduce' | 'no-preference') {
  await act(async () => {
    await commands.emulatePreferences({ reducedMotion })
    await frame()
  })
}
afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
  await preference('no-preference')
})

for (const mode of ['light', 'dark'] as const) {
  test(`${mode}: immediate native selection and payloads while rapid reversals retain indicator motion`, async () => {
    const ref = createRef<HTMLInputElement>()
    const changes = vi.fn()
    function Controlled() {
      const [checked, setChecked] = useState(false)
      return (
        <form>
          <CheckboxFeedback
            label="Publish"
            ref={ref}
            name="permissions"
            value="publish"
            checked={checked}
            onChange={event => {
              changes(event.target.checked)
              setChecked(event.target.checked)
            }}
            style={{ transform: 'rotate(0deg)', opacity: 0.9 }}
          />
        </form>
      )
    }
    const { host } = await mount(
      <StrictMode>
        <ThemeScope
          theme={theme}
          mode={mode}
        >
          <Controlled />
        </ThemeScope>
      </StrictMode>
    )
    const input = host.querySelector('input')!
    const wrapper = host.querySelector<HTMLElement>('[data-checkbox-feedback]')!
    const styles = input.style.cssText
    await act(async () => input.focus())
    await act(async () => userEvent.keyboard(' '))
    expect(input.checked).toBe(true)
    expect(changes).toHaveBeenCalledExactlyOnceWith(true)
    expect(new FormData(host.querySelector('form')!).getAll('permissions')).toEqual(['publish'])
    expect(progress(wrapper)).toBeLessThan(1)
    await until(() => progress(wrapper) > 0.3 && progress(wrapper) < 0.7)
    const before = progress(wrapper)
    await act(async () => userEvent.keyboard(' '))
    expect(input.checked).toBe(false)
    expect(new FormData(host.querySelector('form')!).has('permissions')).toBe(false)
    const samples: number[] = []
    for (let i = 0; i < 3; i++) {
      await frame()
      samples.push(progress(wrapper))
    }
    expect(samples.some(value => value > before)).toBe(true)
    await until(() => progress(wrapper) === 0)
    await act(async () => userEvent.keyboard(' '))
    await until(() => progress(wrapper) > 0.99)
    expect(input.style.cssText).toBe(styles)
    expect(ref.current).toBe(input)
    expect(document.activeElement).toBe(input)
    expect(getComputedStyle(input).outlineStyle).not.toBe('none')
    for (const mark of host.querySelectorAll('svg'))
      expect(mark.getAttribute('aria-hidden')).toBe('true')
  })
}

test('mixed state, Field disable, live off/reduced motion, custom parts and cleanup keep their owners', async () => {
  const cleanup = vi.fn()
  const ref = vi.fn(() => cleanup)
  const tree = (
    checked: boolean,
    mixed = false,
    disabled = false,
    off = false,
    parts?: CheckboxProps['parts']
  ) => (
    <StrictMode>
      <ThemeScope theme={off ? { ...theme, motion: { ...theme.motion, mode: 'off' } } : theme}>
        <Preference />
        <Field
          layout="group"
          label="Access"
          disabled={disabled}
        >
          <CheckboxFeedback
            ref={ref}
            label="Choose"
            checked={checked}
            onChange={() => {}}
            indeterminate={mixed}
            parts={parts}
          />
        </Field>
      </ThemeScope>
    </StrictMode>
  )
  const { root, host } = await mount(tree(false))
  const wrapper = host.querySelector<HTMLElement>('[data-checkbox-feedback]')!
  const input = host.querySelector('input')!
  await act(async () => root.render(tree(false, true)))
  expect(input.indeterminate).toBe(true)
  expect(input.checked).toBe(false)
  expect(progress(wrapper)).toBeLessThan(1)
  await until(() => progress(wrapper) > 0.2)
  await act(async () => root.render(tree(false, true, true)))
  expect(input.matches(':disabled')).toBe(true)
  expect(progress(wrapper)).toBe(1)
  await act(async () => root.render(tree(false, true)))
  expect(progress(wrapper)).toBe(1)
  await act(async () => root.render(tree(false)))
  await until(() => progress(wrapper) < 0.9)
  await preference('reduce')
  await until(() => host.querySelector('[data-reduced]')?.getAttribute('data-reduced') === 'true')
  expect(progress(wrapper)).toBe(0)
  await act(async () => root.render(tree(true)))
  expect(progress(wrapper)).toBe(1)
  await preference('no-preference')
  await until(() => host.querySelector('[data-reduced]')?.getAttribute('data-reduced') === 'false')
  expect(progress(wrapper)).toBe(1)
  await act(async () => root.render(tree(false, false, false, true)))
  expect(progress(wrapper)).toBe(0)
  const custom = { indicator: { style: { scale: '.8', opacity: 0.6 } } }
  await act(async () => root.render(tree(true, false, false, false, custom)))
  expect(wrapper.style.getPropertyValue('--example-checkbox-feedback')).toBe('')
  for (const mark of host.querySelectorAll<SVGElement>('svg')) {
    expect(mark.style.scale).toBe('0.8')
    expect(mark.style.opacity).toBe('0.6')
  }
  const cleaned = cleanup.mock.calls.length
  await act(async () => root.render(null))
  expect(cleanup).toHaveBeenCalledTimes(cleaned + 1)
  expect(wrapper.style.getPropertyValue('--example-checkbox-feedback')).toBe('')
})

test('controlled refusal/cancellation never invents a selection or native event', async () => {
  const changed = vi.fn()
  const { host, root } = await mount(
    <CheckboxFeedback
      label="Refused"
      checked={false}
      onChange={changed}
    />
  )
  const input = host.querySelector('input')!
  await act(async () => input.click())
  expect(changed).toHaveBeenCalledOnce()
  expect(input.checked).toBe(false)
  await act(async () =>
    root.render(
      <CheckboxFeedback
        label="Cancelled"
        checked={false}
        onClick={event => event.preventDefault()}
        onChange={changed}
      />
    )
  )
  await act(async () => input.click())
  expect(input.checked).toBe(false)
  expect(progress(host.querySelector<HTMLElement>('[data-checkbox-feedback]')!)).toBe(0)
})

test('permission list hydrates, select-all excludes disabled data and reset restores both owners', async () => {
  const { host } = await mount(
    <StrictMode>
      <CheckboxPermissionsExample />
    </StrictMode>,
    true
  )
  const form = host.querySelector('form')!
  const [all, invite, publish, , audit, summary] = form.querySelectorAll('input')
  const ids = [...host.querySelectorAll('[id]')].map(node => node.id)
  expect(all.indeterminate).toBe(true)
  expect(audit.disabled).toBe(true)
  await act(async () => all.click())
  expect(all.checked).toBe(true)
  expect(all.indeterminate).toBe(false)
  expect(invite.required).toBe(false)
  expect(new FormData(form).getAll('permissions')).toEqual(['invite', 'publish', 'export'])
  await act(async () => publish.click())
  expect(all.indeterminate).toBe(true)
  await act(async () => summary.click())
  expect(new FormData(form).has('summary')).toBe(false)
  await act(async () => form.reset())
  expect(invite.checked).toBe(true)
  expect(publish.checked).toBe(false)
  expect(all.indeterminate).toBe(true)
  expect(summary.checked).toBe(true)
  expect([...host.querySelectorAll('[id]')].map(node => node.id)).toEqual(ids)
})

test('long convenience labels wrap inside a narrow host without shrinking the native indicator', async () => {
  const { host } = await mount(
    <ThemeScope>
      <div style={{ width: '180px' }}>
        <Checkbox label="AnExtremelyLongPermissionNameWithoutSpacesForWorkspaceAdministration" />
      </div>
    </ThemeScope>
  )
  const container = host.querySelector('label')!.parentElement!
  const text = host.querySelector<HTMLElement>('[data-slot=checkbox-label]')!
  expect(text.getBoundingClientRect().right).toBeLessThanOrEqual(
    container.getBoundingClientRect().right + 1
  )
  expect(host.querySelector('input')!.getBoundingClientRect().width).toBeGreaterThanOrEqual(16)
})
