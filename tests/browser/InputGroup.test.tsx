import { act, createRef, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  InputGroup,
  InputGroupInput,
  InputGroupTextarea,
  InputGroupAddon,
  Field,
  Button,
  Kbd
} from '../../src/index.js'
import {
  FindProjectWithAddons,
  PostStudyUpdate
} from '../../.storybook/examples/InputGroupExamples.js'
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

test('real grouped hosts hydrate with stable Field relationships and exact refs', async () => {
  const root = createRef<HTMLDivElement>(),
    input = createRef<HTMLInputElement>(),
    addon = createRef<HTMLDivElement>()
  const { host } = await mount(
    <StrictMode>
      <Field
        label="Project"
        description="Project slug"
        controlId="group-project"
      >
        <InputGroup
          ref={root}
          style={{ borderRadius: 0 }}
        >
          <InputGroupAddon
            ref={addon}
            style={{ color: 'red' }}
          >
            radiant.dev/
          </InputGroupAddon>
          <InputGroupInput
            ref={input}
            defaultValue="reader"
            style={{ color: 'blue' }}
          />
        </InputGroup>
      </Field>
    </StrictMode>,
    true
  )
  expect(root.current?.tagName).toBe('DIV')
  expect(addon.current?.tagName).toBe('DIV')
  expect(input.current?.tagName).toBe('INPUT')
  expect(input.current?.getAttribute('data-slot')).toBe('input input-group-input')
  expect(host.querySelector('label')?.htmlFor).toBe(input.current?.id)
  expect(input.current?.getAttribute('aria-describedby')).toBe(
    host.querySelector('[data-slot="field-description"]')?.id
  )
  expect(input.current?.value).toBe('reader')
  expect(root.current?.style.borderRadius).toBe('0px')
  expect(addon.current?.style.color).toBe('red')
  expect(input.current?.style.color).toBe('blue')
  expect(host.querySelectorAll('input')).toHaveLength(1)
  expect(root.current?.hasAttribute('tabindex')).toBe(false)
})
test('decorative SVG and Kbd addons focus the input while a real addon Button keeps focus', async () => {
  const action = vi.fn()
  const { host } = await mount(
    <InputGroup>
      <InputGroupAddon aria-hidden>
        <svg
          width="16"
          height="16"
        >
          <circle
            cx="8"
            cy="8"
            r="6"
          />
        </svg>
      </InputGroupAddon>
      <InputGroupInput
        aria-label="Search"
        defaultValue="Reader"
      />
      <InputGroupAddon>
        <Kbd aria-hidden>K</Kbd>
        <Button onClick={action}>Search now</Button>
      </InputGroupAddon>
    </InputGroup>
  )
  const input = host.querySelector('input')!,
    button = host.querySelector('button')!
  await click(host.querySelector('circle')!)
  expect(document.activeElement).toBe(input)
  await click(button)
  expect(document.activeElement).toBe(button)
  expect(action).toHaveBeenCalledTimes(1)
  await click(host.querySelector('kbd')!)
  expect(document.activeElement).toBe(input)
  expect(input.value).toBe('Reader')
})
test('pointer cancellation and disabled native owners prevent addon focus handoff', async () => {
  const seen = vi.fn()
  const tree = (disabled = false) => (
    <>
      <Button>Before</Button>
      <Field
        label="Budget"
        disabled={disabled}
      >
        <InputGroup
          onPointerDown={event => {
            seen()
            event.preventDefault()
          }}
        >
          <InputGroupAddon>$</InputGroupAddon>
          <InputGroupInput defaultValue="250" />
        </InputGroup>
      </Field>
    </>
  )
  const { host, render } = await mount(tree())
  const before = host.querySelector('button')!
  await click(before)
  await click(host.querySelector('[data-slot~="input-group-addon"]')!)
  expect(document.activeElement).toBe(before)
  expect(seen).toHaveBeenCalledOnce()
  await render(
    <>
      <Button>Before</Button>
      <fieldset disabled>
        <legend>Budget</legend>
        <InputGroup>
          <InputGroupAddon>$</InputGroupAddon>
          <InputGroupInput
            aria-label="Amount"
            defaultValue="250"
          />
        </InputGroup>
      </fieldset>
    </>
  )
  await click(host.querySelector('button')!)
  await click(host.querySelector('[data-slot~="input-group-addon"]')!)
  expect(host.querySelector('input')?.matches(':disabled')).toBe(true)
  expect(document.activeElement).not.toBe(host.querySelector('input'))
})
test('Field invalid and read-only states remain on the native control and disabled addons do not disable the boundary', async () => {
  const { host } = await mount(
    <form>
      <Field
        label="Budget"
        error="Needs review"
        required
      >
        <InputGroup style={{ '--rad-input-group-invalid-border': 'rgb(255,0,0)' }}>
          <InputGroupAddon>$</InputGroupAddon>
          <InputGroupInput
            name="budget"
            readOnly
            defaultValue="250"
          />
          <InputGroupAddon>
            <Button disabled>Save</Button>
          </InputGroupAddon>
        </InputGroup>
      </Field>
    </form>
  )
  const input = host.querySelector('input')!,
    group = host.querySelector<HTMLElement>('[data-slot~="input-group"]')!
  expect(input.readOnly).toBe(true)
  expect(input.required).toBe(true)
  expect(input.getAttribute('aria-invalid')).toBe('true')
  expect(getComputedStyle(group).borderTopColor).toBe('rgb(255, 0, 0)')
  expect(getComputedStyle(group).cursor).not.toBe('not-allowed')
  await click(host.querySelector('[data-slot~="input-group-addon"]')!)
  expect(document.activeElement).toBe(input)
  await keys('8')
  expect(input.value).toBe('250')
  expect(new FormData(host.querySelector('form')!).get('budget')).toBe('250')
})
test('native forms submit and reset the real value and tab visits the actual addon action', async () => {
  const values: string[] = []
  const { host } = await mount(
    <form
      onSubmit={event => {
        event.preventDefault()
        values.push(String(new FormData(event.currentTarget).get('budget')))
      }}
    >
      <Field label="Budget">
        <InputGroup>
          <InputGroupAddon>$</InputGroupAddon>
          <InputGroupInput
            name="budget"
            defaultValue="250"
          />
          <InputGroupAddon>
            <Button type="submit">Save</Button>
          </InputGroupAddon>
        </InputGroup>
      </Field>
      <Button type="reset">Restore</Button>
    </form>
  )
  const input = host.querySelector('input')!,
    buttons = host.querySelectorAll('button')
  await fill(input, '350')
  await keys('{Tab}')
  expect(document.activeElement).toBe(buttons[0])
  await keys('{Enter}')
  expect(values).toEqual(['350'])
  expect(document.activeElement).toBe(buttons[0])
  await click(buttons[1]!)
  expect(input.value).toBe('250')
  expect(host.querySelectorAll('[tabindex]')).toHaveLength(0)
})
test('Textarea composition keeps its ref, native rows, editing, submission and reset', async () => {
  const ref = createRef<HTMLTextAreaElement>()
  const { host } = await mount(
    <InputGroup>
      <InputGroupTextarea
        ref={ref}
        aria-label="Update"
        rows={4}
        defaultValue="Reviewed"
      />
      <InputGroupAddon>characters</InputGroupAddon>
    </InputGroup>
  )
  expect(ref.current?.tagName).toBe('TEXTAREA')
  expect(ref.current?.rows).toBe(4)
  expect(ref.current?.getAttribute('data-slot')).toBe('textarea input-group-textarea')
  await click(host.querySelector('[data-slot~="input-group-addon"]')!)
  expect(document.activeElement).toBe(ref.current)
  const task = await mount(<PostStudyUpdate />)
  await fill(task.host.querySelector('textarea')!, 'Reviewed group behavior')
  await click(task.host.querySelector('button[type="submit"]')!)
  expect(task.host.querySelector('output')?.textContent).toBe('Posted: Reviewed group behavior')
  expect(document.activeElement).toBe(task.host.querySelector('button[type="submit"]'))
  await click(task.host.querySelector('button[type="reset"]')!)
  expect(task.host.querySelector('textarea')?.value).toBe('Reviewed the interview notes.')
})
test('all shared sizes keep one border and focus ring around RTL addons and native controls', async () => {
  for (const [controlSize, height] of [
    ['small', 32],
    ['medium', 40],
    ['large', 48]
  ] as const) {
    const { host } = await mount(
      <InputGroup
        controlSize={controlSize}
        dir="rtl"
        style={{ width: 360 }}
      >
        <InputGroupAddon>$</InputGroupAddon>
        <InputGroupInput
          aria-label="Budget"
          defaultValue="250"
        />
        <InputGroupAddon>
          <Kbd>USD</Kbd>
        </InputGroupAddon>
      </InputGroup>
    )
    const group = host.querySelector<HTMLElement>('[data-slot~="input-group"]')!,
      input = host.querySelector('input')!,
      addons = host.querySelectorAll<HTMLElement>('[data-slot~="input-group-addon"]'),
      box = group.getBoundingClientRect()
    expect(Math.abs(box.height - height)).toBeLessThan(0.5)
    expect(input.getAttribute('data-control-size')).toBe(controlSize)
    expect(getComputedStyle(input).borderWidth).toBe('0px')
    expect(getComputedStyle(input).paddingInlineStart).toBe('0px')
    expect(addons[0]!.getBoundingClientRect().x).toBeGreaterThan(input.getBoundingClientRect().x)
    for (const addon of addons) {
      const b = addon.getBoundingClientRect()
      expect(b.left).toBeGreaterThanOrEqual(box.left + 1)
      expect(b.right).toBeLessThanOrEqual(box.right - 1)
      expect(b.top).toBeGreaterThanOrEqual(box.top + 1)
      expect(b.bottom).toBeLessThanOrEqual(box.bottom - 1)
    }
    await click(input)
    expect(getComputedStyle(group).outlineWidth).toBe('2px')
    expect(getComputedStyle(input).outlineWidth).toBe('0px')
  }
})
test('the project task composes real nested Kbd hints with a consumer-owned shortcut and filtering', async () => {
  const { host, render } = await mount(<FindProjectWithAddons />)
  await click(host.querySelector('button')!)
  await fill(host.querySelector('input')!, 'Reader')
  await keys('{Control>}k{/Control}')
  const input = host.querySelector('input')!
  expect(document.activeElement).toBe(input)
  expect(input.selectionStart).toBe(0)
  expect(input.selectionEnd).toBe(6)
  expect(host.querySelectorAll('kbd')).toHaveLength(3)
  expect(host.querySelectorAll('li')).toHaveLength(1)
  await render(<FindProjectWithAddons modifier="Command" />)
  expect(host.querySelector('kbd')?.textContent).toContain('Command')
  await keys('{Meta>}k{/Meta}')
  expect(document.activeElement).toBe(host.querySelector('input'))
})

test('forced colors retain the shared boundary, native focus cue and keyboard notation', async () => {
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  try {
    const { host } = await mount(
      <Field label="Project">
        <InputGroup>
          <InputGroupInput defaultValue="Reader" />
          <InputGroupAddon aria-hidden>
            <Kbd>K</Kbd>
          </InputGroupAddon>
        </InputGroup>
      </Field>
    )
    const group = host.querySelector<HTMLElement>('[data-slot~="input-group"]')!
    const input = host.querySelector('input')!
    await click(input)
    const style = getComputedStyle(group)
    expect(style.borderTopWidth).toBe('1px')
    expect(style.borderTopColor).not.toBe(style.backgroundColor)
    expect(style.outlineStyle).toBe('solid')
    expect(style.outlineWidth).toBe('2px')
    expect(getComputedStyle(host.querySelector('kbd')!).borderTopWidth).toBe('1px')
    expect(input.value).toBe('Reader')
  } finally {
    await commands.emulatePreferences({ forcedColors: 'none', reducedMotion: 'no-preference' })
  }
})

test('focusable containers outside the addon do not block native focus handoff', async () => {
  const { host } = await mount(
    <div tabIndex={-1}>
      <InputGroup>
        <InputGroupAddon>radiant.dev/</InputGroupAddon>
        <InputGroupInput
          aria-label="Project URL"
          defaultValue="reader"
        />
      </InputGroup>
      <InputGroup>
        <InputGroupTextarea
          aria-label="Study update"
          defaultValue="Reviewed"
        />
        <InputGroupAddon>
          <Kbd>K</Kbd>
          <Button>Attach note</Button>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
  const addons = host.querySelectorAll('[data-slot~="input-group-addon"]')
  await click(addons[0]!)
  expect(document.activeElement).toBe(host.querySelector('input'))
  await click(host.querySelector('kbd')!)
  expect(document.activeElement).toBe(host.querySelector('textarea'))
  await click(host.querySelector('button')!)
  expect(document.activeElement).toBe(host.querySelector('button'))
})
