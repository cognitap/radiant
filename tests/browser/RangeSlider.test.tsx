import { commands } from 'vitest/browser'
import { expect, test, vi } from 'vitest'
import { Field, RangeSlider } from '../../src/index.js'
import { click, key, mount } from './familyHarness.js'

test('keeps two named native values ordered through hydration, key navigation, form reset and equal thumbs', async () => {
  const onValueChange = vi.fn()
  const { host } = await mount(
    <form>
      <Field
        label="Budget"
        description="Price in dollars"
      >
        <RangeSlider
          name="price"
          min={0}
          max={10}
          step={0.1}
          defaultValue={[2.3, 8.4]}
          lowerLabel="Minimum"
          upperLabel="Maximum"
          onValueChange={onValueChange}
        />
      </Field>
      <button type="reset">Reset</button>
    </form>,
    true
  )
  const sliders = host.querySelectorAll<HTMLInputElement>('input[type=range]')
  const [lower, upper] = sliders
  const values = () => new FormData(host.querySelector('form')!).getAll('price')
  expect(host.querySelector('fieldset[data-slot~=range-slider]')).toHaveAccessibleName('Budget')
  expect(lower).toHaveAccessibleName('Minimum')
  expect(upper).toHaveAccessibleName('Maximum')
  expect(values()).toEqual(['2.3', '8.4'])
  lower.focus()
  await key('{ArrowRight}')
  expect(values()).toEqual(['2.4', '8.4'])
  await key('{End}')
  expect(values()).toEqual(['8.4', '8.4'])
  expect(lower).toHaveAttribute('aria-valuemax', '8.4')
  await key('{Tab}{Home}{ArrowRight}')
  expect(upper).toHaveFocus()
  expect(values()).toEqual(['8.4', '8.5'])
  const calls = onValueChange.mock.calls.length
  await click(host.querySelector('button')!)
  await expect.poll(values).toEqual(['2.3', '8.4'])
  expect(onValueChange).toHaveBeenCalledTimes(calls)
})

test('native mouse and touch drags target the selected thumbs and RTL arrows move in writing direction', async () => {
  const { host } = await mount(
    <RangeSlider
      dir="rtl"
      aria-label="Price"
      lowerLabel="Minimum"
      upperLabel="Maximum"
      defaultValue={[25, 75]}
      style={{ width: 320 }}
    />
  )
  const [lower, upper] = host.querySelectorAll<HTMLInputElement>('input[type=range]')
  lower.focus()
  await key('{ArrowLeft}')
  expect(lower.valueAsNumber).toBe(26)
  await commands.dragSlider('[data-slot~="range-slider-lower"]', 0.4)
  expect(lower.valueAsNumber).toBeGreaterThan(30)
  expect(upper.valueAsNumber).toBe(75)
  await commands.dragSlider('[data-slot~="range-slider-upper"]', 0.9, true)
  expect(upper.valueAsNumber).toBeGreaterThan(82)
})

test('a controlled owner can decline requests and disabled values stay out of form data', async () => {
  const change = vi.fn()
  const tree = (disabled: boolean) => (
    <form>
      <RangeSlider
        aria-label="Price"
        lowerLabel="Minimum"
        upperLabel="Maximum"
        name="price"
        value={[20, 60]}
        onValueChange={change}
        disabled={disabled}
      />
    </form>
  )
  const { host, render } = await mount(tree(false))
  host.querySelector('input')!.focus()
  await key('{ArrowRight}')
  expect(change).toHaveBeenCalledWith([21, 60])
  expect(new FormData(host.querySelector('form')!).getAll('price')).toEqual(['20', '60'])
  await render(tree(true))
  expect(new FormData(host.querySelector('form')!).getAll('price')).toEqual([])
})
