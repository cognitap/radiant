import { expect, test, vi } from 'vitest'
import { ColorPicker } from '../../src/index.js'
import { click, key, mount } from './familyHarness.js'
import { userEvent } from 'vitest/browser'
import { act } from 'react'

test('hydrated picker shares keyboard axes, pointer plane, alpha and swatches', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <ColorPicker
      label="Accent"
      defaultValue="oklch(50% 0.12 240)"
      format="oklch"
      onValueChange={change}
      swatches={[{ color: '#FF000080', label: 'Rose' }]}
    />,
    true
  )
  const output = host.querySelector('[data-slot="color-picker-value"]')!
  const axis = (name: string) =>
    host.querySelector<HTMLInputElement>(`[data-slot~="color-picker-${name}"]`)!
  expect(output).toHaveTextContent('oklch(50% 0.12 240)')
  expect(axis('lightness')).toHaveAccessibleName('Lightness')
  expect(axis('lightness')).toHaveAttribute('aria-valuetext', '50%')
  await act(async () => axis('lightness').focus())
  await key('{ArrowRight}')
  expect(output).toHaveTextContent('oklch(51% 0.12 240)')
  await act(async () => axis('alpha').focus())
  await key('{ArrowLeft}')
  expect(output).toHaveTextContent('oklch(51% 0.12 240 / 0.99)')
  const area = host.querySelector<HTMLElement>('[data-slot="color-picker-area"]')!
  await act(async () => userEvent.click(area))
  expect(Number(axis('lightness').value)).toBeCloseTo(0.5, 1)
  expect(Number(axis('chroma').value)).toBeCloseTo(0.2, 1)
  const swatch = host.querySelector<HTMLButtonElement>('[data-slot~="color-picker-swatch"]')!
  await click(swatch)
  expect(swatch).toHaveAttribute('aria-pressed', 'true')
  expect(Number(axis('alpha').value)).toBeCloseTo(0.5, 1)
  expect(change).toHaveBeenCalledTimes(4)
})

test('controlled color and changing formats stay synchronized with their owner', async () => {
  const request = vi.fn()
  const view = (value: string, format: 'hex' | 'rgb') => (
    <ColorPicker
      label="Accent"
      value={value}
      format={format}
      onValueChange={request}
      swatches={[{ color: '#FF0000', label: 'Red' }]}
    />
  )
  const { host, render } = await mount(view('#123456', 'hex'))
  const output = host.querySelector('[data-slot="color-picker-value"]')!
  await click(host.querySelector<HTMLButtonElement>('[data-slot~="color-picker-swatch"]')!)
  expect(request).toHaveBeenCalledExactlyOnceWith('#FF0000')
  expect(output).toHaveTextContent('#123456')
  await render(view('#FF0000', 'rgb'))
  expect(output).toHaveTextContent('rgb(255 0 0)')
})

test('browser sampling is optional and commits the sampled color', async () => {
  const original = Object.getOwnPropertyDescriptor(window, 'EyeDropper')
  const open = vi.fn().mockResolvedValue({ sRGBHex: '#451E79' })
  Object.defineProperty(window, 'EyeDropper', {
    configurable: true,
    value: class {
      open = open
    }
  })
  try {
    const { host } = await mount(
      <ColorPicker
        label="Accent"
        eyedropper
      />
    )
    const button = host.querySelector('button')!
    expect(button).toHaveAccessibleName('Sample a color')
    await click(button)
    expect(open).toHaveBeenCalledExactlyOnceWith({ signal: expect.any(AbortSignal) })
    await expect.poll(() => host.querySelector('output')?.textContent).toBe('#451E79')
  } finally {
    if (original) Object.defineProperty(window, 'EyeDropper', original)
    else Reflect.deleteProperty(window, 'EyeDropper')
  }
})

test('an invalid picker marks each channel slider and links its error there, not on the fieldset', async () => {
  const { host } = await mount(
    <ColorPicker
      label="Accent"
      error="Pick a darker color"
      defaultValue="oklch(50% 0.12 240)"
    />
  )
  const group = host.querySelector('fieldset')!
  const sliders = [...host.querySelectorAll('input[type="range"]')]
  expect(group.hasAttribute('aria-invalid')).toBe(false)
  expect(group.hasAttribute('aria-describedby')).toBe(false)
  expect(sliders).toHaveLength(4)
  for (const slider of sliders) {
    expect(slider).toHaveAttribute('aria-invalid', 'true')
    expect(slider).toHaveAccessibleDescription('Pick a darker color')
  }
  expect(host.querySelectorAll('[data-slot~="field"][data-invalid]')).toHaveLength(1)
})
