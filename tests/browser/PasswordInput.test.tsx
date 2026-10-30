import { act, createRef, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { createPortal } from 'react-dom'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { Button, PasswordInput, Field, ThemeScope, defineTheme } from '../../src/index.js'
import {
  PrepareWorkspaceSignIn,
  ChooseWorkspacePassword,
  ReviewConnectionPassword
} from '../../.storybook/examples/PasswordInputExamples.js'
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
const click = (node: Element) =>
  act(async () => {
    await userEvent.click(node)
  })
const choose = (node: HTMLSelectElement, value: string) =>
  act(async () => {
    await userEvent.selectOptions(node, value)
  })
test('password field hydrates into one native labelled autofill input and a real pressed Button', async () => {
  const ref = createRef<HTMLInputElement>(),
    { host } = await mount(
      <StrictMode>
        <Field
          label="Password"
          controlId="password"
          description="Current workspace password"
          required
        >
          <PasswordInput
            ref={ref}
            name="password"
            defaultValue="demo-password"
          />
        </Field>
      </StrictMode>,
      true
    ),
    input = host.querySelector('input')!,
    button = host.querySelector('button')!
  expect(ref.current).toBe(input)
  expect(input.type).toBe('password')
  expect(input.autocomplete).toBe('current-password')
  expect(input.labels?.[0]?.textContent).toContain('Password')
  expect(input.required).toBe(true)
  expect(input.getAttribute('aria-describedby')).toBe(
    host.querySelector('[data-slot="field-description"]')?.id
  )
  expect(button.type).toBe('button')
  expect(button.getAttribute('aria-pressed')).toBe('false')
  expect(button.getAttribute('aria-controls')).toBe(input.id)
  expect(input.dataset.slot).toBe('input input-group-input password-input')
  expect(button.dataset.slot).toBe('button password-input-toggle')
  expect(host.querySelectorAll('input')).toHaveLength(1)
})
test('pointer and keyboard reveal retain native value, caret, focus and identity without value callbacks', async () => {
  const change = vi.fn(),
    { host } = await mount(
      <>
        <PasswordInput
          aria-label="Password"
          defaultValue="demo-password"
          onChange={change}
          showLabel="Reveal credential"
          hideLabel="Conceal credential"
        />
        <Button>After</Button>
      </>
    ),
    input = host.querySelector('input')!,
    buttons = host.querySelectorAll('button')
  input.focus()
  input.setSelectionRange(2, 6)
  await click(buttons[0]!)
  expect(input.type).toBe('text')
  expect(input.value).toBe('demo-password')
  expect(input.selectionStart).toBe(2)
  expect(input.selectionEnd).toBe(6)
  expect(document.activeElement).toBe(buttons[0])
  expect(buttons[0]?.textContent).toBe('Conceal credential')
  expect(buttons[0]?.getAttribute('aria-pressed')).toBe('true')
  await act(async () => {
    await userEvent.keyboard(' ')
  })
  expect(input.type).toBe('password')
  expect(buttons[0]?.getAttribute('aria-pressed')).toBe('false')
  expect(buttons[0]?.textContent).toBe('Reveal credential')
  expect(host.querySelector('input')).toBe(input)
  expect(change).not.toHaveBeenCalled()
  input.focus()
  await act(async () => {
    await userEvent.keyboard('{Tab}')
  })
  expect(document.activeElement).toBe(buttons[0])
  await act(async () => {
    await userEvent.keyboard('{Tab}')
  })
  expect(document.activeElement).toBe(buttons[1])
})
test('submit hides synchronously before consumer handlers and preserves one successful native value', async () => {
  const snapshots: { type: string; value: FormDataEntryValue | null }[] = [],
    change = vi.fn(),
    { host } = await mount(
      <form
        onSubmit={event => {
          event.preventDefault()
          snapshots.push({
            type: event.currentTarget.querySelector('input')!.type,
            value: new FormData(event.currentTarget).get('password')
          })
        }}
      >
        <PasswordInput
          name="password"
          aria-label="Password"
          defaultValue="demo-password"
          onChange={change}
        />
        <Button type="submit">Sign in</Button>
      </form>
    ),
    input = host.querySelector('input')!,
    buttons = host.querySelectorAll('button')
  await click(buttons[0]!)
  expect(input.type).toBe('text')
  await click(buttons[1]!)
  expect(snapshots).toEqual([{ type: 'password', value: 'demo-password' }])
  expect(input.type).toBe('password')
  expect(buttons[0]?.getAttribute('aria-pressed')).toBe('false')
  expect(new FormData(host.querySelector('form')!).getAll('password')).toEqual(['demo-password'])
  expect(change).not.toHaveBeenCalled()
})
test('native and cancelled resets hide visibility while preserving their respective value rules', async () => {
  const { host } = await mount(
      <form>
        <PasswordInput
          aria-label="Password"
          defaultValue="initial-demo"
        />
        <Button type="reset">Restore</Button>
      </form>
    ),
    input = host.querySelector('input')!,
    buttons = host.querySelectorAll('button')
  await act(async () => {
    await userEvent.fill(input, 'edited-demo')
  })
  await click(buttons[0]!)
  await click(buttons[1]!)
  expect(input.type).toBe('password')
  expect(input.value).toBe('initial-demo')
  host.querySelector('form')!.addEventListener('reset', event => event.preventDefault())
  await act(async () => {
    await userEvent.fill(input, 'keep-demo')
  })
  await click(buttons[0]!)
  await click(buttons[1]!)
  expect(input.type).toBe('password')
  expect(input.value).toBe('keep-demo')
})
test('external forms added after mount and reassociation hide only their own password fields', async () => {
  const tree = (form: string) => (
      <>
        <PasswordInput
          aria-label="External password"
          form={form}
          defaultValue="demo"
        />
        <form id="unrelated">
          <PasswordInput
            aria-label="Other password"
            defaultValue="other-demo"
          />
        </form>
      </>
    ),
    { host, render } = await mount(tree('late-account')),
    inputs = host.querySelectorAll('input'),
    toggles = host.querySelectorAll('button')
  await click(toggles[0]!)
  await click(toggles[1]!)
  const late = document.createElement('form')
  late.id = 'late-account'
  host.append(late)
  await act(async () => {
    late.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
  expect(inputs[0]?.type).toBe('password')
  expect(inputs[1]?.type).toBe('text')
  await render(tree('unrelated'))
  await click(toggles[0]!)
  await act(async () => {
    host
      .querySelector('#unrelated')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
  expect(inputs[0]?.type).toBe('password')
  expect(inputs[1]?.type).toBe('password')
  late.remove()
})
test('Field disabled state hides a revealed password and does not reveal it again on re-enable', async () => {
  const tree = (disabled: boolean, readOnly = false) => (
      <Field
        label="Password"
        disabled={disabled}
        error="Review password"
      >
        <PasswordInput
          value="fixed-demo"
          readOnly={readOnly}
          onChange={() => {}}
        />
      </Field>
    ),
    { host, render } = await mount(tree(false)),
    input = host.querySelector('input')!,
    button = host.querySelector('button')!
  await click(button)
  expect(input.type).toBe('text')
  await render(tree(true))
  expect(input.type).toBe('password')
  expect(button.disabled).toBe(true)
  expect(input.disabled).toBe(true)
  await render(tree(false, true))
  expect(input.type).toBe('password')
  expect(input.readOnly).toBe(true)
  await click(button)
  expect(input.type).toBe('text')
  expect(input.getAttribute('aria-invalid')).toBe('true')
})
test('actual host and named parts honor styles, theme composition, size and direction', async () => {
  for (const [size, height] of [
    ['small', 32],
    ['medium', 40],
    ['large', 48]
  ] as const) {
    const ref = createRef<HTMLInputElement>(),
      { host } = await mount(
        <ThemeScope
          theme={defineTheme({
            id: 'password',
            name: 'Password',
            components: {
              passwordInput: { gap: '12px' },
              inputGroup: { background: 'rgb(230, 240, 230)' }
            }
          })}
        >
          <PasswordInput
            aria-label="Password"
            ref={ref}
            controlSize={size}
            dir="rtl"
            className="px-0"
            style={{ color: 'red' }}
            parts={{
              wrapper: { className: 'gap-0', style: { width: '300px' } },
              toggle: { style: { borderRadius: '2px' } }
            }}
          />
        </ThemeScope>
      ),
      input = host.querySelector('input')!,
      button = host.querySelector('button')!,
      wrapper = host.querySelector<HTMLElement>('[data-slot~="password-input-wrapper"]')!
    expect(ref.current).toBe(input)
    expect(input.style.color).toBe('red')
    expect(getComputedStyle(input).paddingInlineStart).toBe('0px')
    expect(getComputedStyle(wrapper).gap).toBe('0px')
    expect(getComputedStyle(wrapper).backgroundColor).toBe('rgb(230, 240, 230)')
    expect(getComputedStyle(button).borderRadius).toBe('2px')
    expect(Math.abs(wrapper.getBoundingClientRect().height - height)).toBeLessThan(0.5)
    expect(getComputedStyle(input).direction).toBe('rtl')
  }
})
test('real task forms preserve private values, controlled resets and record-specific reveal ownership', async () => {
  const signIn = await mount(<PrepareWorkspaceSignIn />),
    input = signIn.host.querySelector<HTMLInputElement>('input[name="password"]')!
  await act(async () => {
    await userEvent.fill(input, 'private-demo-password')
  })
  await click(signIn.host.querySelector('[data-slot~="password-input-toggle"]')!)
  await click(signIn.host.querySelector('button[type="submit"]')!)
  expect(input.type).toBe('password')
  expect(signIn.host.querySelector('output')?.textContent).toContain(
    'Sign-in request prepared for researcher@example.com.'
  )
  expect(signIn.host.textContent).not.toContain('private-demo-password')
  const update = await mount(<ChooseWorkspacePassword />),
    fields = update.host.querySelectorAll('input')
  await act(async () => {
    await userEvent.fill(fields[0]!, 'demo-new-password')
    await userEvent.fill(fields[1]!, 'demo-mismatch')
  })
  await click(update.host.querySelector('button[type="submit"]')!)
  expect(update.host.textContent).toContain('Passwords must match.')
  expect(document.activeElement).toBe(fields[1])
  await act(async () => {
    await userEvent.fill(fields[1]!, 'demo-new-password')
  })
  await click(update.host.querySelector('button[type="submit"]')!)
  expect(update.host.querySelector('output')?.textContent).toBe('New password request prepared.')
  await click(update.host.querySelector('button[type="reset"]')!)
  expect(Array.from(fields, n => n.value)).toEqual(['', ''])
  const review = await mount(<ReviewConnectionPassword />)
  await click(review.host.querySelector('button')!)
  expect(review.host.querySelector('input')?.type).toBe('text')
  await choose(review.host.querySelector('select')!, 'component')
  expect(review.host.querySelector('input')?.type).toBe('password')
  expect(review.host.querySelector('input')?.value).toBe('component-demo-password')
})
test('forced colors keep the shared boundary and native toggle focus visible without motion', async () => {
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  try {
    const { host } = await mount(<PasswordInput aria-label="Password" />),
      input = host.querySelector('input')!,
      button = host.querySelector('button')!,
      wrapper = host.querySelector<HTMLElement>('[data-slot~="password-input-wrapper"]')!
    input.focus()
    await act(async () => {
      await userEvent.keyboard('{Tab}')
    })
    expect(document.activeElement).toBe(button)
    expect(getComputedStyle(wrapper).outlineWidth).toBe('2px')
    expect(getComputedStyle(wrapper).borderTopColor).not.toBe(
      getComputedStyle(wrapper).backgroundColor
    )
    await act(async () => {
      await userEvent.keyboard('{Enter}')
    })
    expect(input.type).toBe('text')
  } finally {
    await commands.emulatePreferences({ forcedColors: 'none', reducedMotion: 'no-preference' })
  }
})

test('native forms inside a shadow root hide before consumer submission', async () => {
  const shell = document.createElement('div')
  document.body.append(shell)
  const shadow = shell.attachShadow({ mode: 'open' }),
    observed: string[] = []
  try {
    await mount(
      createPortal(
        <form
          onSubmit={event => {
            event.preventDefault()
            observed.push(event.currentTarget.querySelector('input')!.type)
          }}
        >
          <PasswordInput
            aria-label="Password"
            defaultValue="demo-password"
          />
          <button type="submit">Submit</button>
        </form>,
        shadow
      )
    )
    const input = shadow.querySelector('input')!
    await click(shadow.querySelector('button')!)
    expect(input.type).toBe('text')
    await click(shadow.querySelector('button[type="submit"]')!)
    expect(observed).toEqual(['password'])
    expect(input.type).toBe('password')
  } finally {
    shell.remove()
  }
})
