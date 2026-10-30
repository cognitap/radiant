import { act, createRef, StrictMode, useState } from 'react'
import { expect, test } from 'vitest'
import { commands } from 'vitest/browser'
import {
  Fieldset,
  Field,
  Input,
  Checkbox,
  Button,
  ThemeScope,
  defineTheme
} from '../../src/index.js'
import { mount, click, key } from './familyHarness.js'
test('a hydrated fieldset retains its native host, independent field labels and group descriptions', async () => {
  const ref = createRef<HTMLFieldSetElement>()
  const { host } = await mount(
    <StrictMode>
      <p id="group-extra">Extra group help</p>
      <Fieldset
        ref={ref}
        legend="Shipping address"
        description="Destination details"
        error="Check destination"
        aria-describedby="group-extra"
      >
        <Field
          label="Street"
          description="Street help"
        >
          <Input
            name="street"
            defaultValue="10 Main St"
          />
        </Field>
        <Field label="City">
          <Input
            name="city"
            defaultValue="Budapest"
          />
        </Field>
      </Fieldset>
    </StrictMode>,
    true
  )
  const group = host.querySelector('fieldset')!,
    input = host.querySelector('input')!
  expect(ref.current).toBe(group)
  expect(group.firstElementChild!.tagName).toBe('LEGEND')
  expect(group.dataset.slot).toBe('field fieldset')
  const texts = group
    .getAttribute('aria-describedby')!
    .split(' ')
    .map(id => document.getElementById(id)!.textContent)
  expect(texts).toEqual(['Destination details', 'Check destination', 'Extra group help'])
  expect(group.getAttribute('aria-invalid')).toBe('true')
  expect(input.labels![0]!.textContent).toBe('Street')
  expect(document.getElementById(input.getAttribute('aria-describedby')!)!.textContent).toBe(
    'Street help'
  )
  expect(host.querySelectorAll('[role="alert"]').length).toBe(1)
})
test('native disabled grouping skips every body control and form entry; unlock and reset preserve individual ownership', async () => {
  function App() {
    const [locked, setLocked] = useState(true)
    return (
      <form>
        <button
          type="button"
          onClick={() => setLocked(!locked)}
        >
          {locked ? 'Unlock' : 'Lock'}
        </button>
        <Fieldset
          legend="Saved address"
          disabled={locked}
        >
          <Field label="Street">
            <Input
              name="street"
              defaultValue="Original"
            />
          </Field>
          <Checkbox
            name="default"
            label="Default address"
            defaultChecked
          />
          <Button>Apply</Button>
        </Fieldset>
        <button type="reset">Reset</button>
      </form>
    )
  }
  const { host } = await mount(<App />, true)
  const form = host.querySelector('form')!,
    group = host.querySelector('fieldset')!,
    toggle = host.querySelector('button')!,
    input = host.querySelector('input')!
  expect([...group.querySelectorAll('input,button')].every(node => node.matches(':disabled'))).toBe(
    true
  )
  expect([...new FormData(form)]).toEqual([])
  // Focus a separate enabled control, then Tab backwards across the disabled group.
  await click(host.querySelector<HTMLButtonElement>('[type="reset"]')!)
  await key('{Shift>}{Tab}{/Shift}')
  expect(document.activeElement).toBe(toggle)
  await key('{Enter}')
  expect([...group.querySelectorAll('input,button')].some(node => node.matches(':disabled'))).toBe(
    false
  )
  await key('{Tab}')
  expect(document.activeElement).toBe(input)
  await key(' updated')
  expect(input.value).not.toBe('Original')
  expect(new FormData(form).get('street')).toBe(input.value)
  expect(new FormData(form).get('default')).toBe('on')
  await act(async () => form.reset())
  expect(input.value).toBe('Original')
})
test('group spacing and legend overrides preserve named themes, narrow layout and forced colors', async () => {
  const theme = defineTheme({
    id: 'fieldset-proof',
    name: 'Fieldset proof',
    components: { fieldset: { gap: '17px' } }
  })
  const { host } = await mount(
    <ThemeScope
      theme={theme}
      mode="dark"
    >
      <Fieldset
        legend="A delivery address with a long group title"
        parts={{ legend: { style: { fontSize: '19px' } } }}
        style={{ width: '180px' }}
      >
        <Field label="Street">
          <Input defaultValue="Address" />
        </Field>
      </Fieldset>
    </ThemeScope>
  )
  const group = host.querySelector('fieldset')!
  expect(getComputedStyle(group).gap).toBe('17px')
  const legend = group.querySelector('legend')!
  const firstField = group.querySelector<HTMLElement>(':scope > [data-slot~="field"]')!
  expect(
    firstField.getBoundingClientRect().top - legend.getBoundingClientRect().bottom
  ).toBeGreaterThanOrEqual(16)
  expect(getComputedStyle(group.querySelector('legend')!).fontSize).toBe('19px')
  expect(group.scrollWidth).toBeLessThanOrEqual(180)
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  expect(group.firstElementChild!.tagName).toBe('LEGEND')
})
