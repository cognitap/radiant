import { act, createRef, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { Button, Field, FileInput } from '../../src/index.js'
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
const file = (name: string) => new File(['demo'], name, { type: 'text/plain' })
const upload = (input: HTMLInputElement, files: File[]) =>
  act(async () => {
    await userEvent.upload(input, files)
  })
const parts = (host: HTMLElement) => ({
  input: host.querySelector<HTMLInputElement>('input[type="file"]')!,
  trigger: host.querySelector<HTMLButtonElement>('[data-slot~="file-input-trigger"]')!,
  files: host.querySelector<HTMLElement>('[data-slot="file-input-files"]')!
})

test('hydrates as one labelled native file input with Field relationships and the exact ref', async () => {
  const ref = createRef<HTMLInputElement>()
  const { host } = await mount(
    <StrictMode>
      <Field
        label="Consent form"
        controlId="consent"
        description="PDF only."
        error="Attach the signed form."
        required
      >
        <FileInput
          ref={ref}
          name="consent"
          accept=".pdf"
        />
      </Field>
    </StrictMode>,
    true
  )
  const { input, trigger, files } = parts(host)
  expect(ref.current).toBe(input)
  expect(host.querySelectorAll('input')).toHaveLength(1)
  expect(input.id).toBe('consent')
  expect(input.labels?.[0]?.textContent).toContain('Consent form')
  expect(input.required).toBe(true)
  expect(input.accept).toBe('.pdf')
  expect(input.getAttribute('aria-invalid')).toBe('true')
  expect(input.dataset.slot).toBe('file-input')
  expect(input.getAttribute('aria-describedby')?.split(' ')).toEqual(
    expect.arrayContaining([
      host.querySelector('[data-slot="field-description"]')!.id,
      host.querySelector('[data-slot="field-error"]')!.id
    ])
  )
  expect(trigger.textContent).toBe('Choose file')
  expect(trigger.getAttribute('aria-hidden')).toBe('true')
  expect(trigger.tabIndex).toBe(-1)
  expect(files.textContent).toBe('No file chosen')
})

test('the native input is the only keyboard stop and shows focus on the visible action', async () => {
  const { host } = await mount(
    <>
      <Button>Before</Button>
      <FileInput aria-label="Attachment" />
      <Button>After</Button>
    </>
  )
  const { input, trigger } = parts(host)
  host.querySelector('button')!.focus()
  await act(async () => {
    await userEvent.keyboard('{Tab}')
  })
  expect(document.activeElement).toBe(input)
  expect(getComputedStyle(trigger).outlineStyle).toBe('solid')
  await act(async () => {
    await userEvent.keyboard('{Tab}')
  })
  expect(document.activeElement?.textContent).toBe('After')
})

test('the visible action activates and focuses the native input', async () => {
  const activations = vi.fn()
  const { host } = await mount(
    <FileInput
      aria-label="Attachment"
      onClick={event => {
        event.preventDefault()
        activations()
      }}
    />
  )
  const { input, trigger } = parts(host)
  await act(async () => {
    await userEvent.click(trigger)
  })
  expect(activations).toHaveBeenCalledTimes(1)
  expect(document.activeElement).toBe(input)
})

test('chosen file names replace the empty text and native change still fires', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <FileInput
      aria-label="Transcripts"
      multiple
      onChange={event => change(Array.from(event.currentTarget.files ?? [], f => f.name))}
      emptyText="Nothing attached"
      chooseLabel="Add transcripts"
    />
  )
  const { input, trigger, files } = parts(host)
  expect(trigger.textContent).toBe('Add transcripts')
  expect(files.textContent).toBe('Nothing attached')
  await upload(input, [file('one.txt'), file('two.txt')])
  expect(change).toHaveBeenLastCalledWith(['one.txt', 'two.txt'])
  expect(files.textContent).toBe('one.txt, two.txt')
})

test('multiple defaults to plural choose and empty text', async () => {
  const { host } = await mount(
    <FileInput
      aria-label="Transcripts"
      multiple
    />
  )
  const { trigger, files } = parts(host)
  expect(trigger.textContent).toBe('Choose files')
  expect(files.textContent).toBe('No files chosen')
})

test('submits through an owning or external form and clears its names on reset', async () => {
  const { host } = await mount(
    <>
      <form id="upload-form" />
      <FileInput
        aria-label="Attachment"
        name="attachment"
        form="upload-form"
      />
    </>
  )
  const form = host.querySelector('form')!
  const { input, files } = parts(host)
  expect(input.form).toBe(form)
  await upload(input, [file('notes.txt')])
  expect(files.textContent).toBe('notes.txt')
  expect((new FormData(form).get('attachment') as File).name).toBe('notes.txt')
  await act(async () => form.reset())
  await expect.poll(() => files.textContent).toBe('No file chosen')
  expect(input.files).toHaveLength(0)
})

test('a cancelled reset keeps the chosen names', async () => {
  const { host } = await mount(
    <form onReset={event => event.preventDefault()}>
      <FileInput aria-label="Attachment" />
    </form>
  )
  const form = host.querySelector('form')!
  const { input, files } = parts(host)
  await upload(input, [file('keep.txt')])
  await act(async () => form.reset())
  await new Promise(resolve => setTimeout(resolve, 20))
  expect(files.textContent).toBe('keep.txt')
})

test('Field disabled and required reach the native input and the action', async () => {
  const { host } = await mount(
    <Field
      label="Attachment"
      disabled
      required
    >
      <FileInput controlSize="large" />
    </Field>
  )
  const { input, trigger } = parts(host)
  expect(input.disabled).toBe(true)
  expect(input.required).toBe(true)
  expect(trigger.disabled).toBe(true)
  expect(input.dataset.controlSize).toBe('large')
  expect(trigger.dataset.controlSize).toBe('large')
})

test('parts style the wrapper, action and file text; className and style reach the input', async () => {
  const { host } = await mount(
    <FileInput
      aria-label="Attachment"
      className="custom-input"
      style={{ outlineColor: 'red' }}
      parts={{
        wrapper: { className: 'custom-wrapper' },
        trigger: { style: { minWidth: '9rem' } },
        files: { className: 'custom-files' }
      }}
    />
  )
  const { input, trigger, files } = parts(host)
  expect(input.classList.contains('custom-input')).toBe(true)
  expect(input.style.outlineColor).toBe('red')
  expect(input.closest('[data-slot="file-input-wrapper"]')?.classList).toContain('custom-wrapper')
  expect(trigger.style.minWidth).toBe('9rem')
  expect(files.classList.contains('custom-files')).toBe(true)
})
