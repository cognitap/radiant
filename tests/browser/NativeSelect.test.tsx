import { act, createRef, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { NativeSelect, Field, Button, ThemeScope, defineTheme } from '../../src/index.js'
import {
  BrowseGroupedStudies,
  FilterParticipantCohorts
} from '../../.storybook/examples/NativeSelectExamples.js'
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
const click = (node: Element) =>
  act(async () => {
    await userEvent.click(node)
  })

const choose = (node: HTMLSelectElement, values: string | string[]) =>
  act(async () => {
    await userEvent.selectOptions(node, values)
  })
test('native select hydrates with its exact ref, options and Field label/help relationships', async () => {
  const ref = createRef<HTMLSelectElement>()
  const { host } = await mount(
    <StrictMode>
      <Field
        label="Study"
        controlId="native-study"
        description="Choose a study"
      >
        <NativeSelect
          ref={ref}
          defaultValue="reader"
          style={{ color: 'red' }}
          className="rounded-none"
        >
          <optgroup label="Open">
            <option value="reader">Reader study</option>
            <option value="component">Component kit</option>
          </optgroup>
        </NativeSelect>
      </Field>
    </StrictMode>,
    true
  )
  expect(ref.current?.tagName).toBe('SELECT')
  expect(ref.current?.value).toBe('reader')
  expect(ref.current?.style.color).toBe('red')
  expect(getComputedStyle(ref.current!).borderRadius).toBe('0px')
  expect(host.querySelector('label')?.htmlFor).toBe(ref.current?.id)
  expect(ref.current?.getAttribute('aria-describedby')).toBe(
    host.querySelector('[data-slot="field-description"]')?.id
  )
  expect(host.querySelectorAll('select')).toHaveLength(1)
  expect(host.querySelectorAll('button,input,[popover]')).toHaveLength(0)
})
test('required placeholders, selection, native form values and reset stay browser-owned', async () => {
  const submitted: FormData[] = []
  const { host } = await mount(
    <form
      onSubmit={event => {
        event.preventDefault()
        submitted.push(new FormData(event.currentTarget))
      }}
    >
      <Field
        label="Phase"
        required
      >
        <NativeSelect
          name="phase"
          defaultValue=""
        >
          <option
            value=""
            disabled
          >
            Choose a phase
          </option>
          <option value="draft">Draft</option>
          <option value="analysis">Analysis</option>
        </NativeSelect>
      </Field>
      <Button type="submit">Save</Button>
      <Button type="reset">Restore</Button>
    </form>
  )
  const select = host.querySelector('select')!,
    buttons = host.querySelectorAll('button')
  expect(select.required).toBe(true)
  expect(select.checkValidity()).toBe(false)
  expect(new FormData(host.querySelector('form')!).get('phase')).toBe(null)
  await click(buttons[0]!)
  expect(submitted).toHaveLength(0)
  expect(document.activeElement).toBe(select)
  await choose(select, 'analysis')
  expect(select.checkValidity()).toBe(true)
  await click(buttons[0]!)
  expect(submitted[0]?.get('phase')).toBe('analysis')
  await click(buttons[1]!)
  expect(select.value).toBe('')
  expect(select.checkValidity()).toBe(false)
})
test('native multiple controls submit repeated values and reset their original options', async () => {
  const { host } = await mount(
    <form>
      <Field label="Cohorts">
        <NativeSelect
          multiple
          size={4}
          name="cohort"
          defaultValue={['reader']}
        >
          <option value="reader">Readers</option>
          <option value="component">Designers</option>
          <option value="release">Reviewers</option>
        </NativeSelect>
      </Field>
      <Button type="reset">Restore</Button>
    </form>
  )
  const select = host.querySelector('select')!,
    data = () => new FormData(host.querySelector('form')!).getAll('cohort')
  expect(select.multiple).toBe(true)
  expect(select.size).toBe(4)
  expect(data()).toEqual(['reader'])
  await choose(select, ['component', 'release'])
  expect(data()).toEqual(['component', 'release'])
  await click(host.querySelector('button')!)
  expect(data()).toEqual(['reader'])
  expect(getComputedStyle(select).height).not.toBe('40px')
})
test('disabled options, optgroups and Fields retain native successful-control rules', async () => {
  const tree = (disabled = false) => (
    <form>
      <Field
        label="Cohorts"
        disabled={disabled}
        required
        error="Review cohorts"
      >
        <NativeSelect
          multiple
          name="cohort"
          defaultValue={['reader', 'blocked', 'archived']}
        >
          <option value="reader">Readers</option>
          <option
            value="blocked"
            disabled
          >
            Full cohort
          </option>
          <optgroup
            label="Archived"
            disabled
          >
            <option value="archived">Archived cohort</option>
          </optgroup>
        </NativeSelect>
      </Field>
    </form>
  )
  const { host, render } = await mount(tree())
  const select = host.querySelector('select')!
  expect(select.options[1]?.matches(':disabled')).toBe(true)
  expect(select.options[2]?.matches(':disabled')).toBe(true)
  expect(select.getAttribute('aria-invalid')).toBe('true')
  expect(new FormData(host.querySelector('form')!).getAll('cohort')).toEqual(['reader'])
  await render(tree(true))
  expect(select.disabled).toBe(true)
  expect(select.checkValidity()).toBe(true)
  expect(new FormData(host.querySelector('form')!).getAll('cohort')).toEqual([])
})
test('controlled consumers may refuse changes and prop synchronization emits no callback', async () => {
  const change = vi.fn(),
    tree = (value: string) => (
      <NativeSelect
        aria-label="Study"
        value={value}
        onChange={change}
      >
        <option value="reader">Readers</option>
        <option value="component">Designers</option>
      </NativeSelect>
    )
  const { host, render } = await mount(tree('reader'))
  const select = host.querySelector('select')!
  await choose(select, 'component')
  expect(change).toHaveBeenCalledOnce()
  expect(select.value).toBe('reader')
  await render(tree('component'))
  expect(select.value).toBe('component')
  expect(change).toHaveBeenCalledOnce()
})
test('Tab visits the single actual select without an additional trigger or focus owner', async () => {
  const { host } = await mount(
    <>
      <Button>Before</Button>
      <Field label="Study">
        <NativeSelect defaultValue="reader">
          <option value="reader">Readers</option>
          <option value="component">Designers</option>
        </NativeSelect>
      </Field>
      <Button>After</Button>
    </>
  )
  const buttons = host.querySelectorAll('button')
  await click(buttons[0]!)
  await keys('{Tab}')
  expect(document.activeElement).toBe(host.querySelector('select'))
  await keys('{Tab}')
  expect(document.activeElement).toBe(buttons[1])
  await keys('{Shift>}{Tab}{/Shift}')
  expect(document.activeElement).toBe(host.querySelector('select'))
  expect(host.querySelectorAll('[tabindex]')).toHaveLength(0)
})
test('shared control sizes and native direction remain independent of Select overrides', async () => {
  for (const [controlSize, height] of [
    ['small', 32],
    ['medium', 40],
    ['large', 48]
  ] as const) {
    const { host } = await mount(
      <ThemeScope
        theme={defineTheme({
          id: 'native',
          name: 'Native',
          components: {
            select: { radius: '30px' },
            nativeSelect: { radius: '5px', shadow: '0 2px 0 red' }
          }
        })}
        mode="dark"
      >
        <Field label="Study">
          <NativeSelect
            controlSize={controlSize}
            dir="rtl"
            className="px-0 shadow-none"
            defaultValue="reader"
          >
            <option value="reader">Readers</option>
          </NativeSelect>
        </Field>
      </ThemeScope>
    )
    const select = host.querySelector('select')!,
      style = getComputedStyle(select)
    expect(Math.abs(select.getBoundingClientRect().height - height)).toBeLessThan(0.5)
    expect(style.borderRadius).toBe('5px')
    expect(style.paddingInlineStart).toBe('0px')
    expect(style.boxShadow).not.toContain('rgb(255, 0, 0)')
    expect(style.direction).toBe('rtl')
    expect(style.colorScheme).toBe('dark')
  }
})
test('task compositions switch grouped records and apply and restore controlled cohort forms', async () => {
  const browse = await mount(<BrowseGroupedStudies />)
  await choose(browse.host.querySelector('select')!, 'component')
  expect(browse.host.querySelector('h3')?.textContent).toBe('Component kit')
  expect(browse.host.textContent).toContain('8 participants')
  const filter = await mount(<FilterParticipantCohorts />)
  await choose(filter.host.querySelector('select')!, ['component'])
  await click(filter.host.querySelector('button[type="submit"]')!)
  expect(Array.from(filter.host.querySelectorAll('li'), node => node.textContent)).toEqual([
    'Lea',
    'Noah'
  ])
  await click(filter.host.querySelector('button[type="reset"]')!)
  expect(Array.from(filter.host.querySelectorAll('li'), node => node.textContent)).toEqual([
    'Maya',
    'Ivo'
  ])
  expect(
    Array.from(filter.host.querySelector('select')!.selectedOptions, option => option.value)
  ).toEqual(['reader'])
})
test('forced colors preserve the native boundary, options and visible keyboard focus', async () => {
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  try {
    const { host } = await mount(
      <>
        <Button>Before</Button>
        <Field label="Study">
          <NativeSelect defaultValue="reader">
            <option value="reader">Readers</option>
            <option
              value="component"
              disabled
            >
              Full study
            </option>
          </NativeSelect>
        </Field>
      </>
    )
    await click(host.querySelector('button')!)
    await keys('{Tab}')
    const select = host.querySelector('select')!,
      style = getComputedStyle(select)
    expect(document.activeElement).toBe(select)
    expect(style.borderTopColor).not.toBe(style.backgroundColor)
    expect(style.outlineWidth).toBe('2px')
    expect(select.options[1]?.disabled).toBe(true)
  } finally {
    await commands.emulatePreferences({ forcedColors: 'none', reducedMotion: 'no-preference' })
  }
})
