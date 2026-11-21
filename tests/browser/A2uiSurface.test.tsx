import { act, StrictMode } from 'react'
import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { A2uiSurface, type A2uiActionPayload } from '../../src/a2ui/index.js'
import {
  PROFILE_SURFACE_ID,
  profileFixtureMessages,
  profileFixtureWithThemeHintMessages
} from '../../src/a2ui/fixtures.js'
import { ThemeScope, defaultTheme } from '../../src/index.js'
import { themes } from '../../src/examples/index.js'
import { mount } from './familyHarness.js'

test('renders the A2UI 1.0 tracer-bullet fixture with Radiant Field, Input, Button and Text, and hydrates cleanly', async () => {
  const onAction = vi.fn<(action: A2uiActionPayload) => void>()
  const { host } = await mount(
    <StrictMode>
      <A2uiSurface
        surfaceId={PROFILE_SURFACE_ID}
        messages={profileFixtureMessages}
        onAction={onAction}
      />
    </StrictMode>,
    true
  )

  expect(host.querySelector('[data-slot="a2ui-surface"]')).not.toBeNull()
  expect(host.textContent).toContain('Update how your name appears across shared workspaces.')
  expect(host.textContent).toContain('Changes apply immediately after saving.')

  const field = host.querySelector('[data-slot~="field"]')
  const input = host.querySelector<HTMLInputElement>('input[data-slot~="input"]')
  const label = host.querySelector<HTMLLabelElement>('label[data-slot~="field-label"]')
  const button = host.querySelector<HTMLButtonElement>('button[data-slot~="button"]')

  expect(field).not.toBeNull()
  expect(input).not.toBeNull()
  expect(label).not.toBeNull()
  expect(button).not.toBeNull()
  expect(label!.htmlFor).toBe(input!.id)
  expect(input!.value).toBe('Ada Lovelace')
  expect(button!.textContent).toBe('Save profile')

  // Typing updates the A2UI data model and the Button's action context carries the new value
  await act(async () => {
    input!.focus()
    await userEvent.clear(input!)
    await userEvent.type(input!, 'Grace Hopper')
  })
  expect(input!.value).toBe('Grace Hopper')

  await act(async () => {
    await userEvent.click(button!)
  })
  expect(onAction).toHaveBeenCalledTimes(1)
  const payload = onAction.mock.calls[0]![0]
  expect(payload.name).toBe('save_profile')
  expect(payload.surfaceId).toBe(PROFILE_SURFACE_ID)
  expect(payload.sourceComponentId).toBe('save_button')
  expect(payload.context).toEqual({ displayName: 'Grace Hopper' })
})

test('follows the surrounding ThemeScope and ignores agent-supplied theme hints', async () => {
  const ticketTheme = themes.find(theme => theme.id === 'ticket')!
  const { host } = await mount(
    <div style={{ display: 'grid', gap: '1rem' }}>
      <ThemeScope
        theme={defaultTheme}
        mode="light"
      >
        <div data-testid="default-scope">
          <A2uiSurface
            surfaceId={PROFILE_SURFACE_ID}
            messages={profileFixtureWithThemeHintMessages}
          />
        </div>
      </ThemeScope>
      <ThemeScope
        theme={ticketTheme}
        mode="light"
      >
        <div data-testid="ticket-scope">
          <A2uiSurface
            surfaceId={PROFILE_SURFACE_ID}
            messages={profileFixtureWithThemeHintMessages}
          />
        </div>
      </ThemeScope>
    </div>
  )

  const defaultButton = host.querySelector<HTMLButtonElement>(
    '[data-testid="default-scope"] button[data-slot~="button"]'
  )!
  const ticketButton = host.querySelector<HTMLButtonElement>(
    '[data-testid="ticket-scope"] button[data-slot~="button"]'
  )!

  const defaultStyle = getComputedStyle(defaultButton)
  const ticketStyle = getComputedStyle(ticketButton)

  // Surrounding ThemeScope controls the rendered Button accent fill
  expect(defaultStyle.backgroundColor).not.toBe(ticketStyle.backgroundColor)
  // Agent theme hints (#ff00ff -> rgb(255, 0, 255) and Comic Sans MS) must never be applied
  expect(defaultStyle.backgroundColor).not.toBe('rgb(255, 0, 255)')
  expect(ticketStyle.backgroundColor).not.toBe('rgb(255, 0, 255)')
  expect(defaultStyle.fontFamily).not.toContain('Comic Sans')
  expect(ticketStyle.fontFamily).not.toContain('Comic Sans')
})
