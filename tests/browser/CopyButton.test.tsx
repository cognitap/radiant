import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { CopyButton } from '../../src/index.js'
import { click, key, mount, pause } from './familyHarness.js'

let originalClipboard: PropertyDescriptor | undefined
beforeEach(() => {
  originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
})
afterEach(() => {
  if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard)
  else Reflect.deleteProperty(navigator, 'clipboard')
})

function stubClipboard(writeText: (value: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
}

test('keyboard writes the exact value, announces success, preserves focus and clears feedback', async () => {
  const writeText = vi.fn(async () => {})
  const submit = vi.fn(event => event.preventDefault())
  stubClipboard(writeText)
  const { host } = await mount(
    <form onSubmit={submit}>
      <CopyButton
        value={' INV-004\n'}
        resetDelay={450}
      >
        Copy invoice ID
      </CopyButton>
    </form>,
    true
  )
  await key('{Tab}')
  const button = host.querySelector('button')!
  expect(button).toHaveFocus()
  await key('{Enter}')
  expect(writeText).toHaveBeenCalledExactlyOnceWith(' INV-004\n')
  const status = host.querySelector('output')!
  expect(status).toHaveRole('status')
  expect(status).toHaveTextContent('Copied.')
  expect(button).toHaveFocus()
  expect(submit).not.toHaveBeenCalled()
  await pause(475)
  expect(status).toBeEmptyDOMElement()
})

test('reports a denied write and clears old feedback when the source changes', async () => {
  const writeText = vi
    .fn()
    .mockRejectedValueOnce(new DOMException('Denied', 'NotAllowedError'))
    .mockResolvedValueOnce(undefined)
  stubClipboard(writeText)
  const example = (value: string) => (
    <CopyButton
      value={value}
      errorText="Clipboard access denied."
    />
  )
  const { host, render } = await mount(example('old'))
  const button = host.querySelector('button')!
  const status = host.querySelector('output')!
  await click(button)
  expect(status).toBeVisible()
  expect(status).toHaveTextContent('Clipboard access denied.')
  await click(button)
  expect(status).toHaveTextContent('Copied.')
  await render(example('new'))
  expect(status).toBeEmptyDOMElement()
})
