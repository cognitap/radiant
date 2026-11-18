import { act } from 'react'
import { expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { MatchCommand, MatchDestination } from '../../.storybook/examples/HighlightExamples.js'
import { Highlight, LocaleProvider } from '../../src/index.js'
import { click, key, mount } from './familyHarness.js'

test('keeps source spelling and graphemes while applying case and diacritic matching options', async () => {
  const text = 'CAFÉ and Café and Cafe\u0301 and cafe'
  const { host, render } = await mount(
    <Highlight
      text={text}
      query="cafe"
      ignoreDiacritics
    />,
    true
  )
  const marks = () => Array.from(host.querySelectorAll('mark'), mark => mark.textContent)
  expect(marks()).toEqual(['CAFÉ', 'Café', 'Cafe\u0301', 'cafe'])
  expect(host.textContent).toBe(text)
  await render(
    <Highlight
      text={text}
      query="Café"
      caseSensitive
    />
  )
  expect(marks()).toEqual(['Café', 'Cafe\u0301'])
  await render(
    <Highlight
      text="👩‍💻 and 👩"
      query="👩"
    />
  )
  expect(marks()).toEqual(['👩'])
  await render(
    <Highlight
      text="a.b a-b"
      query="."
    />
  )
  expect(marks()).toEqual(['.'])
  await render(
    <Highlight
      text={text}
      query=""
    />
  )
  expect(marks()).toEqual([])
  expect(host.textContent).toBe(text)
})

test('uses locale case mapping and retains the original text', async () => {
  const { host } = await mount(
    <LocaleProvider locale="tr">
      <Highlight
        text="I İ ı i"
        query="i"
      />
    </LocaleProvider>
  )
  expect(Array.from(host.querySelectorAll('mark'), mark => mark.textContent)).toEqual(['İ', 'i'])
})

test('Combobox marks its query while keeping the full option name and keyboard selection', async () => {
  const { host } = await mount(<MatchDestination />)
  const input = host.querySelector('input[role="combobox"]')!
  await act(async () => userEvent.fill(input, 'lon'))
  const option = host.querySelector('[role="option"]')!
  expect(option).toHaveAccessibleName('London')
  expect(option.querySelector('mark')).toHaveTextContent('Lon')
  await key('{ArrowDown}{Enter}')
  expect(input).toHaveValue('London')
  expect(input).toHaveFocus()
})

test('Command marks a result and runs the selected action from the keyboard', async () => {
  const { host } = await mount(<MatchCommand />)
  await click(host.querySelector('button')!)
  const input = host.querySelector('input[role="combobox"]')!
  await act(async () => userEvent.fill(input, 'pref'))
  const option = host.querySelector('[role="option"]')!
  expect(option).toHaveAccessibleName('Open preferences')
  expect(option.querySelector('mark')).toHaveTextContent('pref')
  await key('{ArrowDown}{Enter}')
  expect(host.querySelector('dialog')).not.toHaveAttribute('open')
  expect(host.querySelector('output')).toHaveTextContent('Open preferences')
})
