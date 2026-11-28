import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { CopyButton, IconProvider } from '../../src/index.js'
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
  const width = button.offsetWidth
  expect(button).toHaveAccessibleName('Copy invoice ID')
  await key('{Enter}')
  expect(writeText).toHaveBeenCalledExactlyOnceWith(' INV-004\n')
  const status = host.querySelector('output')!
  expect(status).toHaveRole('status')
  expect(status).toHaveTextContent('Copied')
  expect(status).toHaveClass('sr-only')
  expect(button).toHaveAccessibleName('Copied')
  expect(button.offsetWidth).toBe(width)
  expect(button).toHaveFocus()
  expect(submit).not.toHaveBeenCalled()
  await pause(475)
  expect(status).toBeEmptyDOMElement()
  expect(button).toHaveAccessibleName('Copy invoice ID')
  expect(button.offsetWidth).toBe(width)
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
  expect(button).toHaveAttribute('aria-describedby', status.id)
  await click(button)
  expect(status).toHaveTextContent('Copied')
  expect(button).toHaveAccessibleName('Copied')
  expect(button).not.toHaveAttribute('aria-describedby')
  await render(example('new'))
  expect(status).toBeEmptyDOMElement()
})

test('icon-only actions use supplied glyphs and announce success with a stable button name', async () => {
  stubClipboard(async () => {})
  const { host } = await mount(
    <IconProvider
      icons={{
        copy: props => (
          <svg
            data-icon="copy"
            {...props}
          />
        ),
        check: props => (
          <svg
            data-icon="check"
            {...props}
          />
        )
      }}
    >
      <CopyButton
        value="INV-004"
        iconOnly
        aria-label="Copy invoice ID"
        copiedText="Invoice number copied"
      />
    </IconProvider>
  )
  const button = host.querySelector('button')!
  expect(button.querySelector('[data-icon="copy"]')).toBeVisible()
  await click(button)
  expect(button.querySelector('[data-icon="check"]')).toBeVisible()
  expect(button.querySelector('[data-icon="copy"]')).not.toBeVisible()
  expect(button).toHaveAccessibleName('Copy invoice ID')
  expect(host.querySelector('output')).toHaveTextContent('Invoice number copied')
})
