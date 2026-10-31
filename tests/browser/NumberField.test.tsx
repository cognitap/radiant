import { act, createRef, StrictMode, useState } from 'react'
import { createPortal } from 'react-dom'
import { expect, test } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  Field,
  NumberField,
  ThemeScope,
  defineTheme,
  type NumberFieldProps
} from '../../src/index.js'
import { mount, click, key, pause } from './familyHarness.js'
const fill = (node: HTMLInputElement, text: string) => act(async () => userEvent.fill(node, text))
function editor(host: ParentNode) {
  return host.querySelector<HTMLInputElement>('[data-slot~="number-field"]')!
}
function raw(host: ParentNode) {
  return new FormData(host.querySelector('form')!).get('amount')
}
function Amount(props: NumberFieldProps) {
  return (
    <Field
      label="Amount"
      description="Raw decimal"
      required={props.required}
    >
      <NumberField
        name="amount"
        {...props}
      />
    </Field>
  )
}

test('native Input refs hydrate with Field relationships, actual composed hosts, raw forms and independent themes', async () => {
  const ref = createRef<HTMLInputElement>()
  const { host } = await mount(
    <StrictMode>
      <ThemeScope
        theme={defineTheme({
          id: 'number-test',
          name: 'Number test',
          components: { numberField: { gap: '7px' }, input: { fontSize: '19px' } }
        })}
      >
        <form>
          <Amount
            ref={ref}
            defaultValue={1234.5}
            locale="de-DE"
            formatOptions={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }}
            required
            className="caller-number"
            style={{ color: 'rgb(10, 20, 30)' }}
            parts={{ increment: { style: { paddingInline: '13px' } } }}
          />
        </form>
      </ThemeScope>
    </StrictMode>,
    true
  )
  const input = editor(host)
  expect(ref.current).toBe(input)
  expect(input.type).toBe('text')
  expect(input.getAttribute('role')).toBe('spinbutton')
  expect(input.classList.contains('caller-number')).toBe(true)
  expect(getComputedStyle(input).fontSize).toBe('19px')
  expect(getComputedStyle(input).color).toBe('rgb(10, 20, 30)')
  expect(getComputedStyle(host.querySelector('[data-slot~="number-field-wrapper"]')!).gap).toBe(
    '7px'
  )
  expect(input.labels?.[0]?.textContent).toContain('Amount')
  expect(input.getAttribute('aria-describedby')).toBeTruthy()
  expect(raw(host)).toBe('1234.5')
  expect(input.required).toBe(true)
  const increment = host.querySelector<HTMLButtonElement>('[data-slot~="number-field-increment"]')!
  expect(increment.dataset.slot).toContain('button')
  expect(getComputedStyle(increment).paddingInlineStart).toBe('13px')
  expect(increment.type).toBe('button')
  expect(increment.tabIndex).toBe(-1)
  expect(increment.hasAttribute('aria-pressed')).toBe(false)
})

test('small and large keyboard steps use stable decimals, keep native editing keys and skip steppers in the tab order', async () => {
  const requested: (number | null)[] = []
  const { host } = await mount(
    <form>
      <Amount
        defaultValue={0.1}
        min={0}
        max={1}
        step={0.1}
        largeStep={0.5}
        onValueChange={value => requested.push(value)}
      />
      <button type="button">After field</button>
    </form>
  )
  const input = editor(host),
    increase = host.querySelector<HTMLButtonElement>('[data-slot~="number-field-increment"]')!
  await click(input)
  await key('{ArrowUp}{ArrowUp}')
  expect(input.value).toBe('0.3')
  expect(raw(host)).toBe('0.3')
  await key('{PageUp}')
  expect(raw(host)).toBe('0.8')
  await key('{PageDown}')
  expect(raw(host)).toBe('0.3')
  await key('{Home}')
  expect(input.selectionStart).toBe(0)
  expect(raw(host)).toBe('0.3')
  await key('{End}')
  expect(input.selectionStart).toBe(3)
  await key('{Tab}')
  expect(document.activeElement).toBe(host.querySelector('form > button'))
  await click(increase)
  expect(document.activeElement).toBe(input)
  expect(raw(host)).toBe('0.4')
  await fill(input, '1')
  expect(increase.disabled).toBe(true)
  const count = requested.length
  await key('{ArrowUp}')
  expect(requested.length).toBe(count)
  expect(requested).toContain(0.3)
})

test('controlled refusal restores the owner, no-op lexical edits keep their caret, and prop sync never requests changes', async () => {
  const requests: (number | null)[] = []
  const tree = (value: number) => (
    <form>
      <Amount
        value={value}
        onValueChange={value => requests.push(value)}
      />
    </form>
  )
  const { host, render } = await mount(tree(1)),
    input = editor(host)
  await fill(input, '01')
  expect(input.value).toBe('01')
  expect(requests).toEqual([])
  await fill(input, '99')
  expect(input.value).toBe('1')
  expect(raw(host)).toBe('1')
  expect(requests.at(-1)).toBe(99)
  const count = requests.length
  await render(tree(99))
  expect(input.value).toBe('99')
  expect(raw(host)).toBe('99')
  expect(requests.length).toBe(count)
  function Accept() {
    const [value, setValue] = useState<number | null>(2)
    return (
      <form>
        <Amount
          value={value}
          onValueChange={setValue}
        />
        <button type="reset">Reset</button>
      </form>
    )
  }
  await render(<Accept />)
  await fill(editor(host), '8')
  expect(raw(host)).toBe('8')
  host.querySelector('form')!.reset()
  await pause(15)
  expect(raw(host)).toBe('8')
  expect(editor(host).value).toBe('8')
})

test('native forms reject incomplete and out-of-range drafts before blur, then clamp accepted numbers on blur', async () => {
  const submitted: FormData[] = []
  const { host } = await mount(
    <form
      onSubmit={event => {
        event.preventDefault()
        submitted.push(new FormData(event.currentTarget))
      }}
    >
      <Amount
        defaultValue={3}
        min={1}
        max={12}
        required
      />
      <button type="submit">Submit</button>
    </form>
  )
  const input = editor(host),
    form = host.querySelector('form')!
  await fill(input, '25')
  expect(raw(host)).toBe('25')
  expect(input.validity.customError).toBe(true)
  await act(async () => form.requestSubmit())
  expect(submitted).toHaveLength(0)
  await click(host.querySelector('button[type="submit"]')!)
  expect(raw(host)).toBe('12')
  expect(submitted.at(-1)?.get('amount')).toBe('12')
  await fill(input, '-')
  expect(input.value).toBe('-')
  expect(raw(host)).toBe('12')
  expect(form.checkValidity()).toBe(false)
  await act(async () => form.requestSubmit())
  expect(submitted).toHaveLength(1)
  await fill(input, '')
  expect(raw(host)).toBe('')
  expect(input.validity.valueMissing).toBe(true)
  await fill(input, '5')
  expect(form.checkValidity()).toBe(true)
})

test('locale and display precision changes are silent and never round the raw numeric owner on blur or stepping', async () => {
  const requests: (number | null)[] = []
  const tree = (locale: string, digits: number) => (
    <form>
      <Amount
        defaultValue={12.5}
        locale={locale}
        formatOptions={{ style: 'currency', currency: 'EUR', maximumFractionDigits: digits }}
        step={1}
        onValueChange={value => requests.push(value)}
      />
      <button type="button">After</button>
    </form>
  )
  const { host, render } = await mount(tree('de-DE', 2)),
    input = editor(host)
  await fill(input, '1.234,50 €')
  expect(raw(host)).toBe('1234.5')
  await click(host.querySelector('form > button')!)
  const count = requests.length
  await render(tree('en-US', 0))
  expect(input.value).toBe('€1,235')
  expect(requests.length).toBe(count)
  await click(input)
  await key('{Tab}')
  expect(raw(host)).toBe('1234.5')
  expect(requests.length).toBe(count)
  await click(input)
  await key('{ArrowUp}')
  expect(raw(host)).toBe('1235.5')
  await render(
    <form>
      <Amount
        key="rounded-owner"
        value={0.951}
        max={0.95}
        formatOptions={{ maximumFractionDigits: 2 }}
      />
    </form>
  )
  expect(editor(host).value).toBe('0.95')
  expect(editor(host).validity.customError).toBe(true)
  await render(
    <form>
      <Amount
        key="percent-edit"
        defaultValue={0.85}
        formatOptions={{ style: 'percent', maximumFractionDigits: 1 }}
      />
    </form>
  )
  await fill(editor(host), '2.9%')
  expect(raw(host)).toBe('0.029')
})

test('native reset follows current external form association and honors cancellation without emitting callbacks', async () => {
  const requests: (number | null)[] = []
  const tree = (form: string) => (
    <>
      <form id="external" />
      <form id="second" />
      <Amount
        defaultValue={3}
        form={form}
        onValueChange={value => requests.push(value)}
      />
    </>
  )
  const { host, render } = await mount(tree('external')),
    input = editor(host),
    first = host.querySelector<HTMLFormElement>('#external')!
  await fill(input, '8')
  const cancel = (event: Event) => event.preventDefault()
  first.addEventListener('reset', cancel)
  await act(async () => first.reset())
  await pause(15)
  expect(input.value).toBe('8')
  first.removeEventListener('reset', cancel)
  const count = requests.length
  await render(tree('second'))
  await act(async () => first.reset())
  await pause(15)
  expect(input.value).toBe('8')
  await act(async () => host.querySelector<HTMLFormElement>('#second')!.reset())
  await pause(15)
  expect(input.value).toBe('3')
  expect(requests.length).toBe(count)
  expect(new FormData(host.querySelector<HTMLFormElement>('#second')!).get('amount')).toBe('3')
})

test('composition keeps provisional text local and commits the raw value only after composition ends', async () => {
  const requests: (number | null)[] = []
  const { host } = await mount(
    <form>
      <Amount
        defaultValue={2}
        onValueChange={value => requests.push(value)}
      />
    </form>
  )
  const input = editor(host)
  await act(async () => {
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, '5')
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true, data: '5' }))
  })
  expect(input.value).toBe('5')
  expect(raw(host)).toBe('2')
  expect(requests).toEqual([])
  expect(input.validity.customError).toBe(true)
  await act(async () =>
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '5' }))
  )
  expect(raw(host)).toBe('5')
  expect(requests).toEqual([5])
  expect(input.validity.valid).toBe(true)
})

test('readonly and disabled enforce native form rules and cancellable keys run the consumer first', async () => {
  const requests: (number | null)[] = []
  const { host, render } = await mount(
    <form>
      <Amount
        defaultValue={3}
        readOnly
        onValueChange={value => requests.push(value)}
      />
    </form>
  )
  let input = editor(host)
  await click(input)
  await key('{ArrowUp}')
  expect(raw(host)).toBe('3')
  expect(input.readOnly).toBe(true)
  expect([...host.querySelectorAll('button')].every(button => button.disabled)).toBe(true)
  await render(
    <form>
      <Amount
        defaultValue={3}
        disabled
        onValueChange={value => requests.push(value)}
      />
    </form>
  )
  expect(raw(host)).toBe(null)
  expect(editor(host).matches(':disabled')).toBe(true)
  await render(
    <form>
      <Amount
        defaultValue={3}
        onKeyDown={event => event.preventDefault()}
        onValueChange={value => requests.push(value)}
      />
    </form>
  )
  input = editor(host)
  await click(input)
  await key('{ArrowUp}')
  expect(raw(host)).toBe('3')
  expect(requests).toEqual([])
})

test('shadow-root forms reset locally and narrow RTL forced-colors controls retain native hosts and bounds', async () => {
  const outside = document.createElement('div')
  document.body.append(outside)
  const shadow = outside.attachShadow({ mode: 'open' })
  try {
    const requests: (number | null)[] = []
    const { host } = await mount(
      <>
        {createPortal(
          <form>
            <Amount
              defaultValue={2}
              onValueChange={value => requests.push(value)}
            />
          </form>,
          shadow
        )}
      </>
    )
    const input = editor(shadow)
    await fill(input, '9')
    const count = requests.length
    await act(async () => shadow.querySelector('form')!.reset())
    await pause(15)
    expect(input.value).toBe('2')
    expect(requests.length).toBe(count)
    await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
    const rendered = await mount(
      <div
        style={{ width: '288px' }}
        dir="rtl"
      >
        <Amount
          defaultValue={0.85}
          formatOptions={{ style: 'percent' }}
          controlSize="large"
        />
      </div>
    )
    const wrapper = rendered.host.querySelector('[data-slot~="number-field-wrapper"]')!
    expect(wrapper.getBoundingClientRect().width).toBeLessThanOrEqual(288)
    expect(editor(rendered.host).getBoundingClientRect().width).toBeGreaterThan(50)
    expect(getComputedStyle(editor(rendered.host)).forcedColorAdjust).not.toBe('none')
    expect(host.textContent).toBe('')
  } finally {
    await act(async () => outside.remove())
  }
})
