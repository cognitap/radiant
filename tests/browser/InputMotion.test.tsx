import {
  act,
  createRef,
  StrictMode,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode
} from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { Field, Input, ThemeScope, defineTheme, type InputProps } from '../../src/index.js'
import { useSpringLayout, useSpringStyle } from '../../src/motion/react.js'
import { InputProfileExample } from '../../.storybook/examples/InputExamples.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: Array<{ root: Root; host: HTMLDivElement }> = []
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
const theme = defineTheme({
  id: 'input-motion',
  name: 'Input motion',
  motion: { spring: { stiffness: 180, damping: 18 } }
})
let focusSpring: ReturnType<typeof useSpringStyle>
let layout: ReturnType<typeof useSpringLayout>
type EditingInputProps = Omit<InputProps, 'value' | 'defaultValue'>
function Editing({ error, inputProps }: { error?: string; inputProps: EditingInputProps }) {
  const [value, setValue] = useState('alpha beta')
  const form = useRef<HTMLFormElement>(null)
  const cue = useRef<HTMLSpanElement>(null)
  const focus = useSpringStyle(cue, 'opacity', 0, 'follow')
  const motion = useSpringLayout(form)
  useLayoutEffect(() => {
    focusSpring = focus
    layout = motion
  }, [focus, motion])
  return (
    <>
      <span
        ref={cue}
        aria-hidden="true"
        data-cue=""
        style={{ opacity: 0 }}
      />
      <form
        ref={form}
        style={{ display: 'grid', width: '360px', gap: '24px' }}
      >
        <div
          data-rad-layout-slot=""
          style={{ display: 'flow-root' }}
        >
          <div data-rad-layout-part="">
            <Field
              label="Name"
              required
              error={error}
              description="Native editing"
            >
              <Input
                {...inputProps}
                name="name"
                value={value}
                size={24}
                onChange={event => {
                  setValue(event.target.value)
                  inputProps.onChange?.(event)
                }}
                onFocus={event => {
                  focus.to(1)
                  inputProps.onFocus?.(event)
                }}
                onBlur={event => {
                  focus.to(0)
                  inputProps.onBlur?.(event)
                }}
              />
            </Field>
          </div>
        </div>
        <div
          data-rad-layout-slot=""
          style={{ display: 'flow-root' }}
        >
          <div data-rad-layout-part="">
            <button type="button">Next</button>
          </div>
        </div>
      </form>
    </>
  )
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
  mounted.push({ host, root: root! })
  expect(errors).toEqual([])
  return { host, root: root! }
}
async function until(check: () => boolean) {
  await expect.poll(check, { timeout: 4_000 }).toBe(true)
}
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
  test(`${mode}: native selection/editing and caller styles survive focus and validation springs`, async () => {
    const ref = createRef<HTMLInputElement>()
    const change = vi.fn()
    const focus = vi.fn()
    const blur = vi.fn()
    const composition = vi.fn()
    const props: EditingInputProps = {
      ref,
      onChange: change,
      onFocus: focus,
      onBlur: blur,
      onCompositionStart: composition,
      onCompositionEnd: composition,
      style: {
        borderRadius: '13px',
        opacity: 0.8,
        transition: 'color .2s',
        transform: 'translateX(0px)'
      }
    }
    const tree = (error?: string, off = false) => (
      <StrictMode>
        <ThemeScope
          theme={off ? { ...theme, motion: { ...theme.motion, mode: 'off' } } : theme}
          mode={mode}
        >
          <Editing
            error={error}
            inputProps={props}
          />
        </ThemeScope>
      </StrictMode>
    )
    const { root, host } = await mount(tree())
    const input = host.querySelector('input')!
    const styles = input.style.cssText
    const height = input.getBoundingClientRect().height
    await act(async () => input.focus())
    input.setSelectionRange(6, 10)
    await act(async () => userEvent.keyboard('B'))
    expect(input.value).toBe('alpha B')
    expect(input.selectionStart).toBe(7)
    expect(change).toHaveBeenCalledOnce()
    expect(focus).toHaveBeenCalledOnce()
    await act(async () => root.render(tree('Immediate error')))
    expect(host.querySelector('[role=alert]')?.textContent).toBe('Immediate error')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(layout.isAnimating()).toBe(true)
    expect(input.selectionStart).toBe(7)
    expect(input.selectionEnd).toBe(7)
    expect(document.activeElement).toBe(input)
    expect(ref.current).toBe(input)
    expect(input.size).toBe(24)
    expect(input.getBoundingClientRect().height).toBe(height)
    expect(input.style.cssText).toBe(styles)
    expect(getComputedStyle(input).outlineStyle).not.toBe('none')
    await until(() => focusSpring.get() > 0.95)
    for (const type of ['compositionstart', 'compositionend']) {
      await act(async () =>
        input.dispatchEvent(new CompositionEvent(type, { bubbles: true, data: '日本' }))
      )
    }
    expect(composition).toHaveBeenCalledTimes(2)
    expect(input.value).toBe('alpha B')
    await act(async () => root.render(tree(undefined, true)))
    expect(layout.isAnimating()).toBe(false)
    expect(input.selectionStart).toBe(7)
    await act(async () => input.blur())
    expect(blur).toHaveBeenCalledOnce()
    expect(focusSpring.get()).toBe(0)
    expect(input.style.cssText).toBe(styles)
  })
}

test('live reduced motion snaps focus presentation without changing the native input or replaying it', async () => {
  const { host } = await mount(
    <ThemeScope theme={theme}>
      <Editing inputProps={{}} />
    </ThemeScope>
  )
  const input = host.querySelector('input')!
  await act(async () => input.focus())
  await until(() => focusSpring.get() > 0.1 && focusSpring.get() < 0.95)
  await preference('reduce')
  expect(focusSpring.get()).toBe(1)
  expect(focusSpring.isAnimating()).toBe(false)
  expect(input.style.opacity).toBe('')
  expect(document.activeElement).toBe(input)
  await act(async () => input.blur())
  expect(focusSpring.get()).toBe(0)
  await preference('no-preference')
  expect(focusSpring.isAnimating()).toBe(false)
  expect(focusSpring.get()).toBe(0)
})

test('profile demo hydrates, forwards composition, resets both value owners and cancels pending save on unmount', async () => {
  const { host, root } = await mount(
    <StrictMode>
      <InputProfileExample />
    </StrictMode>,
    true
  )
  const form = host.querySelector('form')!
  const name = form.querySelector<HTMLInputElement>('[name=displayName]')!
  const email = form.querySelector<HTMLInputElement>('[name=email]')!
  const id = name.id
  await act(async () => name.focus())
  name.setSelectionRange(0, name.value.length)
  await act(async () => userEvent.keyboard('x'))
  await act(async () => name.blur())
  expect(name.getAttribute('aria-invalid')).toBe('true')
  await act(async () =>
    name.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
  )
  expect(name.getAttribute('aria-invalid')).toBe(null)
  await act(async () =>
    name.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'x' }))
  )
  expect(name.getAttribute('aria-invalid')).toBe('true')
  await act(async () => form.reset())
  expect(name.value).toBe('Ada Lovelace')
  expect(email.value).toBe('ada@example.com')
  expect(name.id).toBe(id)
  expect(name.getAttribute('aria-invalid')).toBe(null)
  await act(async () => form.requestSubmit())
  expect(name.readOnly).toBe(true)
  expect(email.readOnly).toBe(true)
  expect(new FormData(form).get('displayName')).toBe('Ada Lovelace')
  const output = form.querySelector('output')!
  expect(output.textContent).toBe('Saving your profile…')
  await act(async () => root.render(null))
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 750))
  })
  expect(output.textContent).toBe('Saving your profile…')
  expect(name.readOnly).toBe(true)
})
