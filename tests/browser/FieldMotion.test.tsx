import { act, createRef, StrictMode, useLayoutEffect, useRef, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands } from 'vitest/browser'
import {
  Checkbox,
  Field,
  Input,
  Radio,
  RadioGroup,
  ThemeScope,
  defineTheme,
  useField,
  type FieldState
} from '../../src/index.js'
import { useSpringLayout } from '../../src/motion/react.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: Array<{ root: Root; host: HTMLDivElement }> = []
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
let layout: ReturnType<typeof useSpringLayout>
function Layout({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const controller = useSpringLayout(ref)
  useLayoutEffect(() => {
    layout = controller
  }, [controller])
  return (
    <div
      ref={ref}
      style={{ display: 'grid', gap: '24px', width: '400px' }}
    >
      {children}
    </div>
  )
}
const theme = defineTheme({
  id: 'field-motion',
  name: 'Field motion',
  motion: { spring: { stiffness: 180, damping: 18 } }
})
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
  await expect.poll(check, { timeout: 4_000 }).toBe(true)
}
afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
  await act(async () => {
    await commands.emulatePreferences({ reducedMotion: 'no-preference' })
    await frame()
  })
})

for (const mode of ['light', 'dark'] as const) {
  test(`${mode}: errors and descriptions change immediately while dedicated wrappers spring`, async () => {
    const fieldRef = createRef<HTMLDivElement>()
    const inputRef = createRef<HTMLInputElement>()
    const tree = (error?: string, help = true, off = false) => (
      <StrictMode>
        <ThemeScope
          theme={off ? { ...theme, motion: { ...theme.motion, mode: 'off' } } : theme}
          mode={mode}
        >
          <p id="extra-help">External hint</p>
          <Layout>
            <div
              data-rad-layout-slot=""
              style={{ display: 'flow-root' }}
            >
              <div data-rad-layout-part="">
                <Field
                  ref={fieldRef}
                  id="field-wrapper"
                  label="Project"
                  controlId="project-input"
                  required
                  description={help ? 'Helpful text' : undefined}
                  error={error}
                  parts={{ error: { style: { fontWeight: 600 } } }}
                >
                  <Input
                    ref={inputRef}
                    id="ignored-child-id"
                    required={false}
                    aria-invalid={false}
                    aria-describedby="extra-help extra-help"
                    defaultValue="Keep my draft"
                  />
                </Field>
              </div>
            </div>
            <div
              data-rad-layout-slot=""
              style={{ display: 'flow-root' }}
            >
              <div data-rad-layout-part="">
                <button type="button">Next field</button>
              </div>
            </div>
          </Layout>
        </ThemeScope>
      </StrictMode>
    )
    const { root, host } = await mount(tree())
    const input = host.querySelector('input')!
    const field = host.querySelector<HTMLElement>('[data-slot~=field]')!
    const part = field.parentElement!
    const slot = part.parentElement!
    const initialHeight = input.getBoundingClientRect().height
    input.focus()
    const initialDescribedBy = input.getAttribute('aria-describedby')!.split(' ')
    expect(new Set(initialDescribedBy).size).toBe(2)
    expect(inputRef.current).toBe(input)
    expect(fieldRef.current).toBe(field)
    expect(input.id).toBe('project-input')
    expect(field.id).toBe('field-wrapper')
    expect(input.required).toBe(true)
    await act(async () => root.render(tree('Enter a longer project name.')))
    expect(input.getAttribute('aria-invalid')).toBe('true')
    const error = host.querySelector<HTMLElement>('[role=alert]')!
    expect(error.textContent).toBe('Enter a longer project name.')
    expect(input.getAttribute('aria-describedby')!.split(' ')).toContain(error.id)
    expect(field.hasAttribute('data-invalid')).toBe(true)
    expect(getComputedStyle(error).fontWeight).toBe('600')
    expect(document.activeElement).toBe(input)
    expect(input.value).toBe('Keep my draft')
    expect(input.getBoundingClientRect().height).toBe(initialHeight)
    expect(layout.isAnimating()).toBe(true)
    expect(part.style.height).not.toBe('')
    expect(field.style.height).toBe('')
    expect(input.style.scale).toBe('')
    expect(getComputedStyle(input).transform).toBe('none')
    await until(() => !layout.isAnimating() && part.style.height === '')
    expect(part.style.height).toBe('')
    expect(slot.style.position).toBe('')
    await act(async () => root.render(tree(undefined, false)))
    expect(input.getAttribute('aria-invalid')).toBe('false')
    expect(input.getAttribute('aria-describedby')).toBe('extra-help')
    expect(host.querySelector('[role=alert]')).toBe(null)
    expect(document.activeElement).toBe(input)
    expect(layout.isAnimating()).toBe(true)
    await act(async () => root.render(tree(undefined, false, true)))
    expect(layout.isAnimating()).toBe(false)
    expect(part.style.cssText).toBe('')
    await act(async () => root.render(tree('Off mode error', true, true)))
    expect(layout.isAnimating()).toBe(false)
    expect(input.getAttribute('aria-invalid')).toBe('true')
    await act(async () => root.unmount())
    mounted.pop()
    expect(inputRef.current).toBe(null)
    expect(fieldRef.current).toBe(null)
    expect(slot.style.position).toBe('')
    host.remove()
  })
}

test('live reduced motion settles an in-flight Field layout and never delays error semantics', async () => {
  const tree = (error?: string) => (
    <ThemeScope theme={theme}>
      <Layout>
        <div
          data-rad-layout-slot=""
          style={{ display: 'flow-root' }}
        >
          <div data-rad-layout-part="">
            <Field
              label="Native adapter"
              error={error}
            >
              {control => <input {...control} />}
            </Field>
          </div>
        </div>
      </Layout>
    </ThemeScope>
  )
  const { root, host } = await mount(tree())
  await act(async () => root.render(tree('Immediate error')))
  expect(layout.isAnimating()).toBe(true)
  await act(async () => {
    await commands.emulatePreferences({ reducedMotion: 'reduce' })
    await frame()
  })
  await until(() => !layout.isAnimating())
  expect(layout.isAnimating()).toBe(false)
  expect(host.querySelector('input')!.getAttribute('aria-invalid')).toBe('true')
  await act(async () => root.render(tree()))
  expect(layout.isAnimating()).toBe(false)
  expect(host.querySelector('[role=alert]')).toBe(null)
  await act(async () => commands.emulatePreferences({ reducedMotion: 'no-preference' }))
  await act(async () => {
    await frame()
    await frame()
  })
  expect(layout.isAnimating()).toBe(false)
  await act(async () => root.render(tree('Another error')))
  expect(layout.isAnimating()).toBe(true)
})

test('Field adapters hydrate with stable IDs; group metadata stays on the fieldset', async () => {
  const states = new Map<string, FieldState | null>()
  function Probe({ name }: { name: string }) {
    states.set(name, useField())
    return null
  }
  const tree = (disabled = false) => (
    <StrictMode>
      <ThemeScope>
        <Probe name="outside" />
        <form>
          <Field
            layout="group"
            label="Channels"
            required
            disabled={disabled}
            error="Choose one"
            description="Group help"
          >
            <Probe name="group" />
            <Checkbox
              name="channel"
              value="email"
              label="Email"
              defaultChecked
              disabled={false}
            />
            <Field
              label="Custom address"
              required
              description="Native adapter help"
            >
              <Probe name="control" />
              <Input
                name="address"
                defaultValue="orbit"
                required={false}
                disabled={false}
              />
            </Field>
            <RadioGroup
              label="Cadence"
              name="cadence"
              defaultValue="weekly"
            >
              <Radio
                value="weekly"
                label="Weekly"
                disabled={false}
              />
            </RadioGroup>
          </Field>
        </form>
      </ThemeScope>
    </StrictMode>
  )
  const { root, host } = await mount(tree(), true)
  const ids = [...host.querySelectorAll('[id]')].map(node => node.id)
  expect(new Set(ids).size).toBe(ids.length)
  expect(states.get('outside')).toBe(null)
  expect(states.get('group')?.controlProps).toBe(null)
  expect(states.get('control')?.controlProps?.required).toBe(true)
  const fieldset = host.querySelector('fieldset')!
  const checkbox = host.querySelector<HTMLInputElement>('[type=checkbox]')!
  expect(fieldset.querySelector(':scope > legend')?.textContent).toBe('Channels*')
  expect(fieldset.getAttribute('aria-invalid')).toBe('true')
  expect(
    fieldset
      .getAttribute('aria-describedby')!
      .split(' ')
      .every(id => document.getElementById(id))
  ).toBe(true)
  expect(checkbox.required).toBe(false)
  expect(checkbox.getAttribute('aria-invalid')).toBe(null)
  expect(new FormData(host.querySelector('form')!).getAll('channel')).toEqual(['email'])
  await act(async () => root.render(tree(true)))
  for (const input of host.querySelectorAll('input')) expect(input.matches(':disabled')).toBe(true)
  expect(new FormData(host.querySelector('form')!).get('channel')).toBe(null)
  expect(states.get('control')?.disabled).toBe(true)
  expect([...host.querySelectorAll('[id]')].map(node => node.id)).toEqual(ids)
})

test('root aria-invalid and aria-describedby reach the control in control layout', async () => {
  const { host } = await mount(
    <>
      <p id="external-help">Shown on the invoice.</p>
      <Field
        label="Company"
        aria-invalid
        aria-describedby="external-help"
      >
        <Input />
      </Field>
    </>
  )
  const field = host.querySelector('[data-slot~=field]')!
  const input = host.querySelector('input')!
  expect(input.getAttribute('aria-invalid')).toBe('true')
  expect(input.hasAttribute('data-invalid')).toBe(true)
  expect(input.getAttribute('aria-describedby')!.split(' ')).toContain('external-help')
  expect(field.hasAttribute('aria-invalid')).toBe(false)
  expect(field.hasAttribute('aria-describedby')).toBe(false)
})
