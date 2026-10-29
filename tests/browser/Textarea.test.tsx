import { act, createRef, StrictMode, useState, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { Field, Input, Textarea, ThemeScope, defineTheme } from '../../src/index.js'
import { TextareaDraftExample } from '../../.storybook/examples/TextareaExamples.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: { host: HTMLDivElement; root: Root }[] = []
async function mount(tree: ReactNode, hydrate = false) {
  const host = document.createElement('div')
  document.body.append(host)
  if (hydrate) host.innerHTML = renderToString(tree)
  const errors: unknown[] = []
  let root!: Root
  await act(async () => {
    root = hydrate
      ? hydrateRoot(host, tree, { onRecoverableError: error => errors.push(error) })
      : createRoot(host)
    if (!hydrate) root.render(tree)
  })
  mounted.push({ host, root })
  expect(errors).toEqual([])
  return { host, render: (tree: ReactNode) => act(async () => root.render(tree)) }
}
afterEach(async () => {
  for (const { host, root } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
  await commands.emulatePreferences({ reducedMotion: 'no-preference', forcedColors: 'none' })
})

for (const controlSize of ['small', 'medium', 'large'] as const) {
  test(`${controlSize}: rows determine height and first-line metrics match Input`, async () => {
    const { host } = await mount(
      <div style={{ width: 280 }}>
        <Input
          aria-label="Title"
          controlSize={controlSize}
        />
        <Textarea
          aria-label="One line"
          rows={1}
          controlSize={controlSize}
        />
        <Textarea
          aria-label="Four lines"
          rows={4}
          controlSize={controlSize}
        />
      </div>
    )
    const input = host.querySelector('input')!,
      [one, four] = host.querySelectorAll('textarea')
    const a = getComputedStyle(input),
      b = getComputedStyle(one)
    expect(b.fontFamily).toBe(a.fontFamily)
    expect(b.fontSize).toBe(a.fontSize)
    expect(b.lineHeight).toBe(a.lineHeight)
    expect(b.paddingInline).toBe(a.paddingInline)
    expect(one.getBoundingClientRect().height).toBeCloseTo(input.getBoundingClientRect().height, 0)
    expect(four.getBoundingClientRect().height - one.getBoundingClientRect().height).toBeCloseTo(
      3 * parseFloat(b.lineHeight),
      0
    )
    expect(b.resize).toBe('vertical')
    expect(one.getBoundingClientRect().width).toBe(280)
  })
}

test('multiline keyboard editing, selection, validation focus, submission and reset stay native after hydration', async () => {
  const ref = createRef<HTMLTextAreaElement>(),
    changes = vi.fn(),
    blurs = vi.fn(),
    compositions = vi.fn()
  const view = await mount(
    <StrictMode>
      <form>
        <Field
          label="Notes"
          required
          description="Line breaks are preserved."
        >
          <Textarea
            ref={ref}
            name="notes"
            defaultValue={'First\nSecond'}
            rows={3}
            maxLength={40}
            onChange={changes}
            onBlur={blurs}
            onCompositionStart={compositions}
            onCompositionEnd={compositions}
          />
        </Field>
        <button type="submit">Save</button>
        <button type="reset">Reset</button>
      </form>
    </StrictMode>,
    true
  )
  const textarea = ref.current!,
    form = view.host.querySelector('form')!
  await act(async () => {
    await userEvent.click(view.host.querySelector('label')!)
    textarea.setSelectionRange(0, 5)
    await userEvent.keyboard('Changed{End}{Enter}Third')
  })
  expect(document.activeElement).toBe(textarea)
  expect(textarea.value).toContain('\n')
  expect(new FormData(form).get('notes')).toBe(textarea.value)
  expect(changes).toHaveBeenCalled()
  await act(async () => {
    textarea.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }))
    textarea.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '文' }))
    await userEvent.tab()
  })
  expect(compositions).toHaveBeenCalledTimes(2)
  expect(blurs).toHaveBeenCalledTimes(1)
  await act(async () => {
    form.reset()
  })
  expect(textarea.value).toBe('First\nSecond')
  await act(async () => {
    await userEvent.clear(textarea)
    form.reportValidity()
  })
  expect(textarea.validity.valueMissing).toBe(true)
  expect(document.activeElement).toBe(textarea)
})

test('controlled prop updates and refusal do not remount the native editor', async () => {
  const changes = vi.fn()
  function Editor({ readOnly = false }: { readOnly?: boolean }) {
    const [value, setValue] = useState('First\nSecond')
    return (
      <Textarea
        aria-label="Draft"
        value={value}
        readOnly={readOnly}
        onChange={event => {
          changes(event.target.value)
          if (!event.target.value.endsWith('!')) setValue(event.target.value)
        }}
      />
    )
  }
  const { host, render } = await mount(<Editor />)
  const textarea = host.querySelector('textarea')!
  await act(async () => {
    await userEvent.click(textarea)
    textarea.setSelectionRange(0, 0)
    await userEvent.keyboard('Hello')
  })
  expect(textarea.value).toBe('HelloFirst\nSecond')
  await act(async () => {
    textarea.setSelectionRange(textarea.value.length, textarea.value.length)
    await userEvent.keyboard('!')
  })
  expect(textarea.value).toBe('HelloFirst\nSecond')
  await render(<Editor readOnly />)
  expect(host.querySelector('textarea')).toBe(textarea)
  expect(textarea.readOnly).toBe(true)
  const calls = changes.mock.calls.length
  await act(async () => {
    await userEvent.keyboard('ignored')
  })
  expect(changes).toHaveBeenCalledTimes(calls)
})

test('long content scrolls in a bounded editor and caller sizing/resizing classes win', async () => {
  const { host } = await mount(
    <div style={{ width: 240 }}>
      <Textarea
        aria-label="Long notes"
        rows={2}
        defaultValue={Array.from({ length: 30 }, (_, i) => `Line ${i}`).join('\n')}
      />
      <Textarea
        aria-label="Custom notes"
        className="resize-none min-h-0 px-8 py-4 rounded-none"
        style={{ height: 150 }}
      />
    </div>
  )
  const [long, custom] = host.querySelectorAll('textarea')
  expect(long.scrollHeight).toBeGreaterThan(long.clientHeight)
  long.scrollTop = long.scrollHeight
  expect(long.scrollTop).toBeGreaterThan(0)
  const b = getComputedStyle(custom)
  expect(b.resize).toBe('none')
  expect(b.minHeight).toBe('0px')
  expect(b.paddingInline).toBe('32px')
  expect(b.paddingBlock).toBe('16px')
  expect(b.borderRadius).toBe('0px')
  expect(custom.getBoundingClientRect().height).toBe(150)
  expect(long.parentElement!.scrollWidth).toBe(240)
})

test('textarea overrides are independent of Input and reset at a nested theme boundary', async () => {
  const outer = defineTheme({
    id: 'textarea-outer',
    name: 'Outer',
    tokens: { control: { radius: '9px' } },
    components: { input: { radius: '31px' }, textarea: { radius: '17px', paddingBlock: '12px' } }
  })
  const inner = defineTheme({
    id: 'textarea-inner',
    name: 'Inner',
    tokens: { control: { radius: '6px' } }
  })
  const { host } = await mount(
    <ThemeScope
      theme={outer}
      mode="dark"
    >
      <Input aria-label="Title" />
      <Textarea aria-label="Outer" />
      <ThemeScope theme={inner}>
        <Textarea aria-label="Inner" />
      </ThemeScope>
      <Textarea
        aria-label="Local"
        style={{ '--rad-textarea-radius': '23px' }}
      />
    </ThemeScope>
  )
  const [outerArea, innerArea, local] = host.querySelectorAll('textarea')
  expect(getComputedStyle(host.querySelector('input')!).borderRadius).toBe('31px')
  expect(getComputedStyle(outerArea).borderRadius).toBe('17px')
  expect(getComputedStyle(outerArea).paddingBlock).toBe('12px')
  expect(getComputedStyle(innerArea).borderRadius).toBe('6px')
  expect(getComputedStyle(local).borderRadius).toBe('23px')
})

test('disabled Field controls stay out of tab order and submission; forced-colors keeps native cues', async () => {
  const { host } = await mount(
    <form>
      <button type="button">Before</button>
      <Field
        label="Disabled notes"
        disabled
      >
        <Textarea
          name="disabled"
          defaultValue="Hidden from data"
        />
      </Field>
      <Field label="Read-only notes">
        <Textarea
          name="readonly"
          readOnly
          defaultValue="Can copy"
        />
      </Field>
      <button type="button">After</button>
    </form>
  )
  const [disabled, readonly] = host.querySelectorAll('textarea')
  await act(async () => {
    await userEvent.click(host.querySelector('button')!)
    await userEvent.tab()
  })
  expect(document.activeElement).toBe(readonly)
  expect(new FormData(host.querySelector('form')!).has('disabled')).toBe(false)
  expect(new FormData(host.querySelector('form')!).get('readonly')).toBe('Can copy')
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  expect(getComputedStyle(disabled).color).not.toBe(getComputedStyle(readonly).color)
  expect(getComputedStyle(readonly).outlineStyle).not.toBe('none')
  expect(getComputedStyle(readonly).outlineWidth).not.toBe('0px')
})

test('dragging the native resize grip changes height while preserving width and selection', async () => {
  const { host } = await mount(
    <Textarea
      id="native-resize"
      aria-label="Resizable notes"
      defaultValue={'First\nSecond'}
      style={{ width: 280 }}
    />
  )
  const textarea = host.querySelector('textarea')!
  textarea.focus()
  textarea.setSelectionRange(1, 4)
  const before = textarea.getBoundingClientRect()
  await commands.resizeTextarea('#native-resize', 80)
  expect(textarea.getBoundingClientRect().height).toBeGreaterThan(before.height + 60)
  expect(textarea.getBoundingClientRect().width).toBe(before.width)
  expect(textarea.value).toBe('First\nSecond')
  expect(textarea.selectionStart).toBe(1)
  expect(textarea.selectionEnd).toBe(4)
})

test('Field relationships, external form association, cancellation and ref cleanup reach the native textarea', async () => {
  let current: HTMLTextAreaElement | null = null
  const cleanup = vi.fn()
  const changes = vi.fn()
  const { host, render } = await mount(
    <>
      <form
        id="textarea-external"
        onReset={event => event.preventDefault()}
      />
      <p id="textarea-help">External help</p>
      <Field
        label="Introduction"
        controlId="owned-textarea"
        description="Description"
        error="Add more context"
        required
      >
        <Textarea
          id="ignored"
          form="textarea-external"
          name="notes"
          required={false}
          aria-invalid={false}
          aria-describedby="textarea-help textarea-help"
          defaultValue={'\nFirst\nSecond'}
          rows={4}
          cols={40}
          wrap="soft"
          maxLength={80}
          spellCheck={false}
          ref={node => {
            current = node
            return () => {
              current = null
              cleanup()
            }
          }}
          onChange={changes}
        />
      </Field>
    </>,
    true
  )
  const textarea = host.querySelector('textarea')!,
    form = host.querySelector('form')!
  expect(current).toBe(textarea)
  expect(textarea.id).toBe('owned-textarea')
  expect(textarea.value).toBe('\nFirst\nSecond')
  expect(textarea.form).toBe(form)
  expect(textarea.required).toBe(true)
  expect(textarea.getAttribute('aria-invalid')).toBe('true')
  const ids = textarea.getAttribute('aria-describedby')!.split(' ')
  expect(ids).toHaveLength(3)
  expect(ids.every(id => document.getElementById(id))).toBe(true)
  expect(textarea.rows).toBe(4)
  expect(textarea.cols).toBe(40)
  expect(textarea.wrap).toBe('soft')
  expect(textarea.maxLength).toBe(80)
  expect(textarea.spellcheck).toBe(false)
  await act(async () => {
    await userEvent.fill(textarea, 'Edited\nDraft')
    form.reset()
  })
  expect(textarea.value).toBe('Edited\nDraft')
  expect(changes).toHaveBeenCalledTimes(1)
  expect(new FormData(form).get('notes')).toBe('Edited\nDraft')
  await render(null)
  expect(current).toBe(null)
  expect(cleanup).toHaveBeenCalledTimes(1)
})

test('workspace example validates, submits multiline values and resets both value owners', async () => {
  const { host } = await mount(<TextareaDraftExample />)
  const [introduction, notes] = host.querySelectorAll('textarea')
  const [save, reset] = host.querySelectorAll('button')
  await act(async () => {
    await userEvent.clear(introduction)
    await userEvent.click(save)
  })
  expect(document.activeElement).toBe(introduction)
  expect(introduction.getAttribute('aria-invalid')).toBe('true')
  await act(async () => {
    await userEvent.fill(introduction, 'Make room for ideas.\nOne small step at a time.')
    await userEvent.fill(notes, 'Invite the team.')
    await userEvent.click(save)
  })
  expect(host.querySelector('output')!.textContent).toContain(
    'Saved locally: Make room for ideas.\nOne small step at a time. · Invite the team.'
  )
  expect(introduction.hasAttribute('aria-invalid')).toBe(false)
  await act(async () => {
    await userEvent.click(reset)
  })
  expect(introduction.value).toBe(
    'A quiet place to turn an idea into something useful.\nStart with a small sketch.'
  )
  expect(notes.value).toBe('Share a first draft on Friday.')
  expect(host.querySelector('[role=alert]')).toBe(null)
})
