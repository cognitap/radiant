import { act, createRef, StrictMode, useState, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  Radio,
  RadioGroup,
  Field,
  ThemeScope,
  defineTheme,
  type RadioProps
} from '../../src/index.js'
import { RadioFeedback, RadioPlanExample } from '../../.storybook/examples/RadioExamples.js'
import { useReducedMotion } from '../../src/motion/react.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: Array<{ root: Root; host: HTMLDivElement }> = []
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
const theme = defineTheme({
  id: 'radio-motion',
  name: 'Radio motion',
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
  for (let i = 0; i < 180; i++) {
    if (check()) return
    await act(async () => {
      await frame()
    })
  }
  throw new Error('Radio feedback did not settle')
}
const progress = (node: HTMLElement) =>
  Number(node.style.getPropertyValue('--example-radio-feedback'))
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
  test(`${mode}: native arrows skip disabled options while immediate selection and payloads drive the dot`, async () => {
    const ref = createRef<HTMLInputElement>()
    const requests = vi.fn()
    function Controlled() {
      const [value, setValue] = useState<string | null>(null)
      return (
        <form>
          <RadioGroup
            label="Plan"
            name="plan"
            value={value}
            onValueChange={next => {
              requests(next)
              setValue(next)
            }}
          >
            <RadioFeedback
              ref={ref}
              label="Personal"
              value=""
              selected={value === ''}
              style={{ transform: 'rotate(0deg)', opacity: 0.9 }}
            />
            <RadioFeedback
              label="Unavailable"
              value="retired"
              selected={value === 'retired'}
              disabled
            />
            <RadioFeedback
              label="Pro"
              value="pro"
              selected={value === 'pro'}
            />
          </RadioGroup>
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
    const [personal, , pro] = host.querySelectorAll('input')
    const wrapper = personal.closest<HTMLElement>('[data-radio-feedback]')!
    const styles = personal.style.cssText
    await act(async () => personal.focus())
    await act(async () => userEvent.keyboard(' '))
    expect(personal.checked).toBe(true)
    expect(requests).toHaveBeenCalledExactlyOnceWith('')
    expect(new FormData(host.querySelector('form')!).get('plan')).toBe('')
    expect(progress(wrapper)).toBeLessThan(1)
    await until(() => progress(wrapper) > 0.3 && progress(wrapper) < 0.7)
    await act(async () => userEvent.keyboard('{ArrowDown}'))
    expect(pro.checked).toBe(true)
    expect(document.activeElement).toBe(pro)
    expect(new FormData(host.querySelector('form')!).get('plan')).toBe('pro')
    // Reverse again while feedback is in flight. Exact velocity is the engine's contract;
    // native event timing may span several frames on a busy browser.
    await act(async () => userEvent.keyboard('{ArrowUp}'))
    expect(personal.checked).toBe(true)
    await until(() => progress(wrapper) === 1)
    const count = requests.mock.calls.length
    await act(async () => userEvent.keyboard(' '))
    expect(requests).toHaveBeenCalledTimes(count)
    expect(personal.style.cssText).toBe(styles)
    expect(ref.current).toBe(personal)
    expect(getComputedStyle(personal).outlineStyle).not.toBe('none')
    expect(personal.nextElementSibling!.getAttribute('aria-hidden')).toBe('true')
  })
}

test('Field disable, live off/reduced motion, custom indicator ownership and cleanup', async () => {
  const cleanup = vi.fn()
  const ref = vi.fn(() => cleanup)
  const tree = (selected: boolean, disabled = false, off = false, parts?: RadioProps['parts']) => (
    <StrictMode>
      <ThemeScope theme={off ? { ...theme, motion: { ...theme.motion, mode: 'off' } } : theme}>
        <Preference />
        <Field
          layout="group"
          label="Outer field"
          disabled={disabled}
        >
          <RadioGroup
            label="Plan"
            name="plan"
            value={selected ? 'pro' : null}
            onValueChange={() => {}}
          >
            <RadioFeedback
              ref={ref}
              label="Pro"
              value="pro"
              selected={selected}
              parts={parts}
            />
          </RadioGroup>
        </Field>
      </ThemeScope>
    </StrictMode>
  )
  const { root, host } = await mount(tree(false))
  const wrapper = host.querySelector<HTMLElement>('[data-radio-feedback]')!
  const input = host.querySelector('input')!
  await act(async () => root.render(tree(true)))
  await until(() => progress(wrapper) > 0.2)
  await act(async () => root.render(tree(true, true)))
  expect(input.matches(':disabled')).toBe(true)
  expect(progress(wrapper)).toBe(1)
  await act(async () => root.render(tree(true)))
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
  await act(async () => root.render(tree(false, false, true)))
  expect(progress(wrapper)).toBe(0)
  await act(async () =>
    root.render(tree(true, false, false, { indicator: { style: { scale: '.8', opacity: 0.6 } } }))
  )
  expect(wrapper.style.getPropertyValue('--example-radio-feedback')).toBe('')
  const dot = input.nextElementSibling as HTMLElement
  expect(dot.style.scale).toBe('0.8')
  expect(dot.style.opacity).toBe('0.6')
  await act(async () =>
    root.render(tree(false, false, false, { indicator: { className: 'scale-75' } }))
  )
  expect(dot.classList.contains('scale-75')).toBe(true)
  expect(dot.style.scale).toBe('')
  const cleaned = cleanup.mock.calls.length
  await act(async () => root.render(null))
  expect(cleanup).toHaveBeenCalledTimes(cleaned + 1)
  expect(wrapper.style.getPropertyValue('--example-radio-feedback')).toBe('')
})

test('controlled refusal and native cancellation leave the selection dot with its owner', async () => {
  const requests = vi.fn()
  const tree = (cancelled: boolean) => (
    <RadioGroup
      name="refused"
      label="Plan"
      value={null}
      onValueChange={requests}
    >
      <RadioFeedback
        label="Pro"
        value="pro"
        selected={false}
        onClick={event => {
          if (cancelled) event.preventDefault()
        }}
      />
    </RadioGroup>
  )
  const { host, root } = await mount(tree(false))
  const input = host.querySelector('input')!
  await act(async () => input.click())
  expect(requests).toHaveBeenCalledExactlyOnceWith('pro')
  expect(input.checked).toBe(false)
  await act(async () => root.render(tree(true)))
  await act(async () => input.click())
  // React's native change observation is not a cancellable state request.
  expect(requests).toHaveBeenLastCalledWith('pro')
  expect(input.checked).toBe(false)
  expect(progress(host.querySelector<HTMLElement>('[data-radio-feedback]')!)).toBe(0)
})

test('plan picker hydrates with distinct names, required metadata and both reset owners', async () => {
  const { host } = await mount(
    <StrictMode>
      <RadioPlanExample />
    </StrictMode>,
    true
  )
  const form = host.querySelector('form')!
  const [personal, pro, retired, team, monthly, yearly] = form.querySelectorAll('input')
  const ids = [...host.querySelectorAll('[id]')].map(node => node.id)
  expect(new Set(ids).size).toBe(ids.length)
  expect(personal.name).not.toBe(monthly.name)
  expect(personal.required).toBe(true)
  expect(retired.disabled).toBe(true)
  await act(async () => personal.click())
  expect(new FormData(form).get(personal.name)).toBe('')
  await act(async () => yearly.click())
  expect(personal.checked).toBe(true)
  await act(async () => form.reset())
  expect(pro.checked).toBe(true)
  expect(monthly.checked).toBe(true)
  expect(yearly.checked).toBe(false)
  await act(async () => team.click())
  const lock = host.querySelectorAll('input')[1]
  await act(async () => lock.click())
  expect(team.matches(':disabled')).toBe(true)
  expect(new FormData(form).has(personal.name)).toBe(false)
  expect(new FormData(form).get(monthly.name)).toBe('monthly')
  expect([...host.querySelectorAll('[id]')].map(node => node.id)).toEqual(ids)
})

test('long convenience labels wrap inside a narrow host without shrinking the native indicator', async () => {
  const { host } = await mount(
    <ThemeScope>
      <div style={{ width: '180px' }}>
        <Radio
          value="test"
          label="AnExtremelyLongPermissionNameWithoutSpacesForWorkspaceAdministration"
        />
      </div>
    </ThemeScope>
  )
  const container = host.querySelector('label')!.parentElement!
  const text = host.querySelector<HTMLElement>('[data-slot=radio-label]')!
  expect(text.getBoundingClientRect().right).toBeLessThanOrEqual(
    container.getBoundingClientRect().right + 1
  )
  expect(host.querySelector('input')!.getBoundingClientRect().width).toBeGreaterThanOrEqual(16)
})
