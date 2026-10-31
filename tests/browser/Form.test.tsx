import { act, createRef, StrictMode, useEffect } from 'react'
import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  Form,
  FormField,
  FormError,
  Input,
  Button,
  useForm,
  type FormProps
} from '../../src/index.js'
import { EditProfileWithTanStack } from '../../.storybook/examples/FormExamples.js'
import type { DistributiveOmit } from '../../src/internal/types.js'
import { mount, click } from './familyHarness.js'
function Sample(props: DistributiveOmit<FormProps, 'aria-label'>) {
  return (
    <Form
      aria-label="Test form"
      {...props}
    >
      {({ pending }) => (
        <>
          <FormField
            name="email"
            label="Email"
            required
          >
            <Input
              name="email"
              type="email"
              defaultValue=""
            />
          </FormField>
          <FormField
            name="slug"
            label="Address"
            required
          >
            <Input
              name="slug"
              defaultValue=""
            />
          </FormField>
          <FormError />
          <Button
            type="submit"
            name="intent"
            value="save"
            pending={pending}
          >
            Save
          </Button>
          <Button type="reset">Reset</Button>
        </>
      )}
    </Form>
  )
}
const input = (host: ParentNode, name: string) =>
  host.querySelector<HTMLInputElement>(`input[name="${name}"]`)!
const button = (host: ParentNode, type = 'submit') =>
  host.querySelector<HTMLButtonElement>(`button[type="${type}"]`)!
async function fill(host: ParentNode, email = 'owner@example.com', slug = 'atlas') {
  await act(async () => {
    await userEvent.fill(input(host, 'email'), email)
    await userEvent.fill(input(host, 'slug'), slug)
  })
}
test('SSR hydration preserves native form, Field relationships, refs and theme overrides', async () => {
  const ref = createRef<HTMLFormElement>()
  const { host } = await mount(
    <StrictMode>
      <Sample
        ref={ref}
        onSubmitValues={() => {}}
        style={{ '--rad-form-gap': '25px' }}
        className="outline"
      />
    </StrictMode>,
    true
  )
  expect(ref.current?.tagName).toBe('FORM')
  expect(ref.current?.classList.contains('outline')).toBe(true)
  expect(getComputedStyle(ref.current!).gap).toBe('25px')
  expect(host.querySelector('label')?.htmlFor).toBe(input(host, 'email').id)
})
test('native constraints report through Field and focus first invalid in DOM order', async () => {
  const submit = vi.fn()
  const { host } = await mount(<Sample onSubmitValues={submit} />)
  await click(button(host))
  await vi.waitFor(() => expect(document.activeElement).toBe(input(host, 'email')))
  const error = input(host, 'email').getAttribute('aria-describedby')!
  expect(document.getElementById(error)?.textContent).toBe(input(host, 'email').validationMessage)
  expect(input(host, 'slug').getAttribute('aria-invalid')).toBe('true')
  expect(submit).not.toHaveBeenCalled()
})
test('custom validation, native values, repeated entries and submitter data share one submit boundary', async () => {
  const submit = vi.fn()
  const { host } = await mount(
    <Sample
      validate={data =>
        String(data.get('slug')).includes(' ')
          ? { fields: { slug: 'Use a single address.' } }
          : undefined
      }
      onSubmitValues={submit}
    />
  )
  await fill(host, 'owner@example.com', 'bad address')
  await click(button(host))
  await vi.waitFor(() => expect(document.activeElement).toBe(input(host, 'slug')))
  expect(host.textContent).toContain('Use a single address.')
  await act(async () => userEvent.fill(input(host, 'slug'), 'atlas'))
  await click(button(host))
  await vi.waitFor(() => expect(submit).toHaveBeenCalledTimes(1))
  expect(submit.mock.calls[0][0].get('intent')).toBe('save')
  expect(submit.mock.calls[0][0].get('slug')).toBe('atlas')
})
test('server field and form errors compose Field and Alert, then clear for the edited field', async () => {
  const { host } = await mount(
    <Sample
      onSubmitValues={() => ({
        fields: { email: 'Already invited.' },
        form: 'Invitation not sent.'
      })}
    />
  )
  await fill(host)
  await click(button(host))
  await vi.waitFor(() =>
    expect(host.querySelector('[data-slot~="form-error"]')?.textContent).toBe(
      'Invitation not sent.'
    )
  )
  await vi.waitFor(() => expect(document.activeElement).toBe(input(host, 'email')))
  expect(host.querySelector('[data-slot~="form-error"]')?.getAttribute('role')).toBe('alert')
  await act(async () => userEvent.fill(input(host, 'email'), 'another@example.com'))
  expect(host.textContent).not.toContain('Already invited.')
  expect(host.querySelector('[data-slot~="form-error"]')).toBeNull()
})
test('pending blocks duplicate submissions and reset aborts stale server errors', async () => {
  let resolve!: (value: { form: string }) => void
  let signal!: AbortSignal
  const submit = vi.fn((_data, context) => {
    signal = context.signal
    return new Promise<{ form: string }>(done => {
      resolve = done
    })
  })
  const { host } = await mount(<Sample onSubmitValues={submit} />)
  await fill(host)
  await click(button(host))
  expect(host.querySelector('form')?.getAttribute('aria-busy')).toBe('true')
  await act(async () => host.querySelector('form')!.requestSubmit(button(host)))
  expect(submit).toHaveBeenCalledTimes(1)
  await click(button(host, 'reset'))
  expect(signal.aborted).toBe(true)
  await act(async () => resolve({ form: 'Stale failure.' }))
  expect(host.textContent).not.toContain('Stale failure.')
  expect(input(host, 'email').value).toBe('')
  expect(host.querySelector('form')?.hasAttribute('data-pending')).toBe(false)
})
test('edits during an in-flight submission discard stale field errors without duplicating the request', async () => {
  let resolve!: (value: { fields: { email: string } }) => void
  const submit = vi.fn(
    () =>
      new Promise<{ fields: { email: string } }>(done => {
        resolve = done
      })
  )
  const { host } = await mount(<Sample onSubmitValues={submit} />)
  await fill(host)
  await click(button(host))
  await act(async () => userEvent.fill(input(host, 'email'), 'new@example.com'))
  await act(async () => resolve({ fields: { email: 'Old address failed.' } }))
  expect(host.textContent).not.toContain('Old address failed.')
  expect(host.querySelector('form')?.hasAttribute('data-pending')).toBe(false)
})
test('rejected submissions show safe form error and focus its actual Alert host', async () => {
  const { host } = await mount(
    <Sample
      onSubmitValues={() => Promise.reject(new Error('private server information'))}
      submitErrorText="Connection failed. Retry."
    />
  )
  await fill(host)
  await click(button(host))
  await vi.waitFor(() =>
    expect(document.activeElement).toBe(host.querySelector('[data-slot~="form-error"]'))
  )
  expect(host.textContent).toContain('Connection failed. Retry.')
  expect(host.textContent).not.toContain('private server information')
})
test('consumer submit/reset cancellation wins and controlled errors may refuse requests', async () => {
  const submit = vi.fn(),
    change = vi.fn()
  const { host, render } = await mount(
    <Sample
      onSubmit={event => event.preventDefault()}
      onSubmitValues={submit}
    />
  )
  await fill(host)
  await click(button(host))
  expect(submit).not.toHaveBeenCalled()
  await render(
    <Sample
      key="controlled"
      errors={{ fields: { email: 'Externally owned.' } }}
      onErrorsChange={change}
      onReset={event => event.preventDefault()}
      onSubmitValues={submit}
    />
  )
  await click(button(host, 'reset'))
  expect(input(host, 'email').value).toBe('')
  expect(change).not.toHaveBeenCalled()
})
test('TanStack controls values through the same wrapper and reset restores its owner', async () => {
  const { host } = await mount(<EditProfileWithTanStack />)
  await act(async () => userEvent.fill(input(host, 'email'), 'changed@example.com'))
  await click(button(host))
  await vi.waitFor(() =>
    expect(host.querySelector('output')?.textContent).toContain('changed@example.com')
  )
  await click(button(host, 'reset'))
  expect(input(host, 'email').value).toBe('researcher@example.com')
})
test('hooks return null outside a form and unmount aborts its own request', async () => {
  let state: ReturnType<typeof useForm> = null
  function Probe() {
    const current = useForm()
    useEffect(() => {
      state = current
    }, [current])
    return null
  }
  const outside = await mount(<Probe />)
  expect(state).toBeNull()
  let signal!: AbortSignal
  await outside.render(
    <Sample
      onSubmitValues={(_data, context) => {
        signal = context.signal
        return new Promise(() => {})
      }}
    />
  )
  await fill(outside.host)
  await click(button(outside.host))
  await outside.render(null)
  expect(signal.aborted).toBe(true)
})
