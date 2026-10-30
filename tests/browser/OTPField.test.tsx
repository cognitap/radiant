import { act, createRef, StrictMode, useState, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { OTPField, Field, Button, type OTPFieldProps } from '../../src/index.js'
import '../../.storybook/styles.css'
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: { root: Root; host: HTMLDivElement }[] = []
async function mount(tree: ReactNode, hydrate = false) {
  const host = document.createElement('div')
  document.body.append(host)
  if (hydrate) host.innerHTML = renderToString(tree)
  let root!: Root
  const errors: unknown[] = []
  await act(async () => {
    root = hydrate
      ? hydrateRoot(host, tree, { onRecoverableError: error => errors.push(error) })
      : createRoot(host)
    if (!hydrate) root.render(tree)
  })
  mounted.push({ root, host })
  expect(errors).toEqual([])
  return { host, render: (tree: ReactNode) => act(async () => root.render(tree)) }
}
afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
})
const keys = (text: string) =>
  act(async () => {
    await userEvent.keyboard(text)
  })
const fill = (node: Element, text: string) =>
  act(async () => {
    await userEvent.fill(node, text)
  })
const click = (node: Element) =>
  act(async () => {
    await userEvent.click(node)
  })
const input = (host: HTMLElement) => host.querySelector<HTMLInputElement>('input')!
const slots = (host: HTMLElement) => [
  ...host.querySelectorAll<HTMLElement>('[data-slot="otp-field-slot"]')
]
const shown = (host: HTMLElement) =>
  slots(host)
    .map(slot => slot.textContent?.trim())
    .join('')
async function paste(node: HTMLInputElement, text: string) {
  await act(async () => {
    const data = new DataTransfer()
    data.setData('text', text)
    node.dispatchEvent(
      new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data })
    )
  })
}
async function reset(form: HTMLFormElement) {
  await act(async () => {
    form.reset()
    await new Promise(resolve => setTimeout(resolve, 10))
  })
}
function Code(props: OTPFieldProps) {
  return (
    <Field
      label="Verification code"
      description="From your message"
    >
      <OTPField {...props} />
    </Field>
  )
}
test('hydrates one named native input and decorative slots with original refs and styles', async () => {
  const ref = createRef<HTMLInputElement>()
  const { host } = await mount(
    <StrictMode>
      <Code
        defaultValue="12"
        ref={ref}
        name="code"
        spellCheck
        style={{ color: 'red' }}
        parts={{ wrapper: { style: { gap: 9 } }, slot: { style: { borderRadius: 0 } } }}
      />
    </StrictMode>,
    true
  )
  const node = input(host)
  expect(ref.current).toBe(node)
  expect(host.querySelectorAll('input')).toHaveLength(1)
  expect(node.labels?.[0]?.textContent).toContain('Verification code')
  expect(node.getAttribute('autocomplete')).toBe('one-time-code')
  expect(node.inputMode).toBe('numeric')
  expect(node.style.color).toBe('red')
  expect(node.spellcheck).toBe(true)
  expect(slots(host)).toHaveLength(6)
  expect(slots(host).every(slot => slot.getAttribute('aria-hidden') === 'true')).toBe(true)
  expect(shown(host)).toBe('12')
  expect(node.parentElement?.style.gap).toBe('9px')
})
test('native entry advances, Backspace retreats and arrows move the active slot without changing DOM focus', async () => {
  const { host } = await mount(<Code />)
  const node = input(host)
  await click(node)
  await keys('123')
  expect(node.value).toBe('123')
  expect(node.selectionStart).toBe(3)
  expect(slots(host)[3]?.hasAttribute('data-active')).toBe(true)
  await keys('{Backspace}')
  expect(node.value).toBe('12')
  expect(node.selectionStart).toBe(2)
  await keys('{ArrowLeft}')
  expect(node.selectionStart).toBe(1)
  expect(slots(host)[1]?.hasAttribute('data-active')).toBe(true)
  await keys('{ArrowRight}')
  expect(node.selectionStart).toBe(2)
  expect(document.activeElement).toBe(node)
  await keys('a!3')
  expect(node.value).toBe('123')
  expect(shown(host)).toBe('123')
})
test('full paste filters before the native length limit and replaces the selected range', async () => {
  const change = vi.fn()
  const { host } = await mount(<Code onChange={change} />)
  const node = input(host)
  await click(node)
  await paste(node, 'Your code: 123 456')
  expect(node.value).toBe('123456')
  expect(shown(host)).toBe('123456')
  expect(change).toHaveBeenCalledTimes(1)
  await act(async () => node.setSelectionRange(1, 5))
  await paste(node, '98')
  expect(node.value).toBe('1986')
  expect(node.selectionStart).toBe(3)
})
test('alphanumeric mode preserves case and submits exactly one original native form value', async () => {
  const { host } = await mount(
    <form>
      <Code
        mode="alphanumeric"
        length={8}
        name="otp"
        required
      />
      <Button type="submit">Verify</Button>
    </form>
  )
  const node = input(host),
    form = host.querySelector('form')!
  await click(node)
  await paste(node, 'AB-12 cd34')
  expect(node.value).toBe('AB12cd34')
  expect(node.checkValidity()).toBe(true)
  expect([...new FormData(form)]).toEqual([['otp', 'AB12cd34']])
  await fill(node, 'ABC')
  expect(node.validity.patternMismatch).toBe(true)
  await fill(node, '')
  expect(node.validity.valueMissing).toBe(true)
})
test('controlled refusal preserves accepted slots, props sync is silent and accepted changes remain native', async () => {
  const change = vi.fn()
  const { host, render } = await mount(
    <Code
      value="12"
      onChange={change}
    />
  )
  await fill(input(host), '1234')
  expect(input(host).value).toBe('12')
  expect(shown(host)).toBe('12')
  expect(change).toHaveBeenCalledTimes(1)
  await render(
    <Code
      value="987"
      onChange={change}
    />
  )
  expect(shown(host)).toBe('987')
  expect(change).toHaveBeenCalledTimes(1)
  function Owned() {
    const [value, setValue] = useState('')
    return (
      <Code
        value={value}
        onChange={event => setValue(event.target.value)}
      />
    )
  }
  await render(<Owned />)
  await fill(input(host), '1x2')
  expect(input(host).value).toBe('12')
  expect(shown(host)).toBe('12')
})
test('uncontrolled native reset restores slots silently, including external form association and cancellation', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <>
      <form id="code-form" />
      <Code
        defaultValue="12"
        name="otp"
        form="code-form"
        onChange={change}
      />
    </>
  )
  const node = input(host),
    form = host.querySelector('form')!
  await fill(node, '987')
  const count = change.mock.calls.length
  await reset(form)
  expect(node.value).toBe('12')
  expect(shown(host)).toBe('12')
  expect(change).toHaveBeenCalledTimes(count)
  await fill(node, '456')
  form.addEventListener('reset', event => event.preventDefault(), { once: true })
  await reset(form)
  expect(shown(host)).toBe('456')
  expect([...new FormData(form)]).toEqual([['otp', '456']])
})
test('readOnly retains one form value while native fieldset disabled omits it', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <form>
      <Code
        defaultValue="123456"
        readOnly
        name="read"
        onChange={change}
      />
      <fieldset disabled>
        <Code
          defaultValue="654321"
          name="disabled"
        />
      </fieldset>
    </form>
  )
  const node = input(host)
  await click(node)
  await keys('{Backspace}9')
  await paste(node, '999999')
  expect(node.value).toBe('123456')
  expect(change).not.toHaveBeenCalled()
  expect([...new FormData(host.querySelector('form')!)]).toEqual([['read', '123456']])
})
test('SMS-style native input events fill the same field without a separate submission control', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <Code
      name="otp"
      onChange={change}
    />
  )
  await act(async () => {
    const node = input(host)
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(node, '123456')
    node.dispatchEvent(
      new InputEvent('input', { bubbles: true, inputType: 'insertReplacementText', data: '123456' })
    )
  })
  expect(shown(host)).toBe('123456')
  expect(change).toHaveBeenCalledTimes(1)
  expect(host.querySelectorAll('input[name="otp"]')).toHaveLength(1)
})
test('IME text is not filtered mid-composition and normalizes on completion', async () => {
  const { host } = await mount(<Code />)
  const node = input(host)
  await act(async () => {
    node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(node, 'あ1')
    node.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true, data: 'あ1' }))
  })
  expect(node.value).toBe('あ1')
  await act(async () =>
    node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'あ1' }))
  )
  expect(node.value).toBe('1')
  expect(shown(host)).toBe('1')
})
test('cancellable paste and arrow handlers retain native selection, with live RTL navigation', async () => {
  const { host, render } = await mount(
    <Code
      defaultValue="123"
      onPaste={event => event.preventDefault()}
      onKeyDown={event => event.preventDefault()}
    />
  )
  const node = input(host)
  await click(node)
  await paste(node, '999')
  expect(node.value).toBe('123')
  await act(async () => node.setSelectionRange(1, 1))
  await keys('{ArrowRight}')
  expect(node.selectionStart).toBe(1)
  await render(
    <Code
      defaultValue="123"
      dir="rtl"
    />
  )
  await act(async () => node.setSelectionRange(1, 1))
  await keys('{ArrowLeft}')
  expect(node.selectionStart).toBe(2)
})

test('slot configuration changes require remounting before a native value could be hidden', async () => {
  const { host, render } = await mount(<Code defaultValue="123456" />)
  await expect(
    render(
      <Code
        defaultValue="123456"
        length={4}
      />
    )
  ).rejects.toThrow('Remount with a new key')
  expect(host.querySelector('input')).toBeNull()
})

test('plain arrows collapse a selected code range at the corresponding edge', async () => {
  const { host } = await mount(<Code defaultValue="123456" />)
  const node = input(host)
  await click(node)
  await act(async () => node.setSelectionRange(1, 5))
  await keys('{ArrowRight}')
  expect(node.selectionStart).toBe(5)
  expect(node.selectionEnd).toBe(5)
  await act(async () => node.setSelectionRange(1, 5))
  await keys('{ArrowLeft}')
  expect(node.selectionStart).toBe(1)
  expect(node.selectionEnd).toBe(1)
  await keys('{Shift>}{ArrowRight}{/Shift}')
  expect(node.selectionStart).toBe(1)
  expect(node.selectionEnd).toBe(2)
  expect(slots(host)[2]?.hasAttribute('data-active')).toBe(true)
})
