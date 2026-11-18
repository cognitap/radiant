import { act } from 'react'
import { expect, test } from 'vitest'
import { LocaleProvider, Rating } from '../../src/index.js'
import { click, key, mount } from './familyHarness.js'

test('rating uses native radios and restores the initial form value on reset', async () => {
  const { host } = await mount(
    <form>
      <Rating
        label="Delivery"
        name="score"
        defaultValue={2}
        required
      />
    </form>,
    true
  )
  const form = host.querySelector('form')!
  const options = Array.from(form.querySelectorAll('input'))
  const selected = () => form.querySelector('input:checked')
  expect(selected()).toBe(options[1])
  expect(options[1]).toHaveAccessibleName('2 out of 5')
  await act(async () => options[1].focus())
  await key('{ArrowRight}')
  expect(selected()).toBe(options[2])
  expect(form.querySelectorAll('[data-filled]')).toHaveLength(3)
  expect(new FormData(form).get('score')).toBe('3')
  await act(async () => form.reset())
  await expect.poll(selected).toBe(options[1])
})

test('RTL renders in inline direction and a read-only rating exposes only score text', async () => {
  const { host } = await mount(
    <LocaleProvider locale="he-IL">
      <Rating
        label="Service"
        defaultValue={2}
      />
      <Rating
        label="Store rating"
        defaultValue={4}
        readOnly
      />
    </LocaleProvider>
  )
  const groups = host.querySelectorAll('fieldset')
  const [first, second] = groups[0].querySelectorAll('[data-slot="rating-icon"]')
  expect(first.getBoundingClientRect().x).toBeGreaterThan(second.getBoundingClientRect().x)
  await click(second.closest('label')!)
  expect(groups[0].querySelector('input:checked')).toHaveAttribute('value', '2')
  await act(async () => groups[0].querySelector<HTMLInputElement>('input:checked')?.focus())
  await key('{ArrowLeft}')
  expect(groups[0].querySelector('input:checked')).toHaveAttribute('value', '3')
  expect(groups[1].querySelector('input')).toBeNull()
  expect(groups[1].querySelector('.sr-only')).toHaveTextContent('4 out of 5')
})
