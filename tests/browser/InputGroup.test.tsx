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
test('the group gap and passive addons focus the input while its Button keeps focus', async () => {
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
  const group = host.querySelector<HTMLElement>('[data-slot~="input-group"]')!,
    addon = group.querySelector('[data-slot~="input-group-addon"]')!,
    groupBox = group.getBoundingClientRect(),
    inputBox = input.getBoundingClientRect(),
    x = (addon.getBoundingClientRect().right + inputBox.left) / 2,
    y = inputBox.top + inputBox.height / 2
  expect(document.elementFromPoint(x, y)).toBe(group)
  await act(async () => {
    await userEvent.click(group, {
      position: { x: x - groupBox.left - group.clientLeft, y: y - groupBox.top - group.clientTop }
    })
  })
  expect(document.activeElement).toBe(input)
  button.focus()
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
test('grouped Textarea keeps its sizing and native editing, submission and reset', async () => {
  const ref = createRef<HTMLTextAreaElement>()
  const submit = vi.fn()
  const { host, render } = await mount(
    <form
      onSubmit={event => {
        event.preventDefault()
        submit(new FormData(event.currentTarget).get('notes'))
      }}
    >
      <InputGroup
        style={{
          '--rad-control-radius': '9999px',
          '--rad-control-corner-shape': 'superellipse(1.5)'
        }}
      >
        <InputGroupTextarea
          ref={ref}
          aria-label="Notes"
          id="grouped-resize"
          name="notes"
          rows={4}
          defaultValue="Reviewed"
        />
        <InputGroupAddon aria-hidden>Notes</InputGroupAddon>
        <InputGroupAddon>
          <Button type="submit">Save</Button>
        </InputGroupAddon>
      </InputGroup>
      <Button type="reset">Reset</Button>
    </form>
  )
  const textarea = ref.current!,
    group = host.querySelector('[data-slot~="input-group"]')!,
    save = host.querySelector('button[type="submit"]')!
  expect(textarea.tagName).toBe('TEXTAREA')
  expect(textarea.rows).toBe(4)
  expect(textarea.getAttribute('data-slot')).toBe('textarea input-group-textarea')
  expect(getComputedStyle(textarea).resize).toBe('vertical')
  const resizer = getComputedStyle(textarea, '::-webkit-resizer')
  expect(resizer.getPropertyValue('border-shape')).toContain('curve to')
  expect(getComputedStyle(group).borderBottomRightRadius).toBe('20px')
  const before = group.getBoundingClientRect()
  await commands.resizeTextarea('#grouped-resize', 80)
  const after = group.getBoundingClientRect()
  expect(after.height).toBeGreaterThan(before.height + 60)
  expect(after.width).toBe(before.width)
  expect(document.activeElement).not.toBe(textarea)
  expect(getComputedStyle(group).borderBottomRightRadius).toBe('20px')
  await click(host.querySelector('[data-slot~="input-group-addon"]')!)
  expect(document.activeElement).toBe(textarea)
  await fill(textarea, 'First line\nSecond line')
  await click(save)
  expect(submit).toHaveBeenCalledWith('First line\nSecond line')
  expect(document.activeElement).toBe(save)
  await click(host.querySelector('button[type="reset"]')!)
  expect(textarea.value).toBe('Reviewed')
  await render(
    <InputGroup className="rounded-none">
      <InputGroupTextarea aria-label="Notes" />
    </InputGroup>
  )
  expect(getComputedStyle(host.firstElementChild!).borderBottomRightRadius).toBe('0px')
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
