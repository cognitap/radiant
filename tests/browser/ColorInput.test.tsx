import { act } from 'react'
import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { ColorInput, Field } from '../../src/index.js'
import { click, key, mount, shown } from './familyHarness.js'

const swatches = [{ color: 'rgb(0 0 255 / .5)', label: 'Translucent blue' }]

test('hydration, native validation, Enter submission, and reset use the normalized color', async () => {
  const submit = vi.fn()
  const { host } = await mount(
    <form
      onSubmit={event => {
        event.preventDefault()
        submit(new FormData(event.currentTarget).get('accent'))
      }}
    >
      <Field
        label="Accent color"
        required
      >
        <ColorInput
          name="accent"
          swatches={swatches}
        />
      </Field>
      <button type="submit">Save</button>
    </form>,
    true
  )
  const form = host.querySelector('form')!
  const textbox = form.querySelector<HTMLInputElement>('input[type="text"]')!
  const trigger = form.querySelector<HTMLButtonElement>('[data-slot~="color-input-trigger"]')!
  expect(textbox).toHaveAccessibleName('Accent color')
  expect(form.checkValidity()).toBe(false)
  await act(async () => userEvent.fill(textbox, 'red'))
  expect(form.checkValidity()).toBe(false)
  expect(textbox).toHaveAttribute('aria-invalid', 'true')
  expect(textbox.validationMessage).toContain('Enter a hex')
  await act(async () => userEvent.fill(textbox, 'rgba(255, 0, 0, .5)'))
  expect(textbox.value).toBe('rgba(255, 0, 0, .5)')
  expect(form.checkValidity()).toBe(true)
  await key('{Enter}')
  expect(submit).toHaveBeenCalledExactlyOnceWith('#FF000080')
  await click(trigger)
  const popup = form.querySelector<HTMLElement>('[data-slot~="color-input-popup"]')!
  expect(shown(popup)).toBe(true)
  expect(popup).toHaveAccessibleName('Choose color')
  expect(textbox.value).toBe('#FF000080')
  await click(popup.querySelector<HTMLButtonElement>('[data-slot~="color-picker-swatch"]')!)
  expect(textbox.value).toBe('#0000FF80')
  expect(new FormData(form).get('accent')).toBe('#0000FF80')
  await key('{Escape}')
  expect(shown(popup)).toBe(false)
  expect(trigger).toHaveFocus()
  await act(async () => form.reset())
  await expect.poll(() => textbox.value).toBe('')
  expect(form.checkValidity()).toBe(false)
})

test('an external form owner receives canonical format and respects disabled and read-only state', async () => {
  const createView = (disabled = false, readOnly = false) => (
    <>
      <form id="theme" />
      <ColorInput
        aria-label="Theme color"
        name="accent"
        form="theme"
        format="oklch"
        defaultValue="oklch(.7 .15 30)"
        disabled={disabled}
        readOnly={readOnly}
      />
    </>
  )
  const { host, render } = await mount(createView())
  const form = host.querySelector('form')!
  const textbox = host.querySelector<HTMLInputElement>('input[type="text"]')!
  const trigger = host.querySelector<HTMLButtonElement>('[data-slot~="color-input-trigger"]')!
  expect(textbox.form).toBe(form)
  expect(new FormData(form).get('accent')).toBe('oklch(70% 0.15 30)')
  await render(createView(true))
  expect(trigger).toBeDisabled()
  expect(new FormData(form).has('accent')).toBe(false)
  await render(createView(false, true))
  expect(textbox).toHaveAttribute('readonly')
  expect(trigger).toBeDisabled()
  expect(new FormData(form).get('accent')).toBe('oklch(70% 0.15 30)')
})
