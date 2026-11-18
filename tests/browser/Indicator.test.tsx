import { expect, test, vi } from 'vitest'
import { Avatar, Button, Indicator, LocaleProvider } from '../../src/index.js'
import { key, mount } from './familyHarness.js'

test('capped text and marker are visual while the target owns its uncapped name and keyboard action', async () => {
  const activate = vi.fn()
  const tree = (count: number) => (
    <Indicator
      label="Inbox"
      statusText={`${count} unread messages`}
      count={count}
    >
      {props => (
        <Button
          {...props}
          onClick={activate}
        >
          Inbox
        </Button>
      )}
    </Indicator>
  )
  const { host, render } = await mount(tree(123), true)
  const button = host.querySelector('button')!
  const marker = host.querySelector('[data-slot~="indicator-marker"]')!
  expect(button).toHaveAccessibleName('Inbox, 123 unread messages')
  expect(marker).toHaveTextContent('99+')
  expect(marker).toHaveAttribute('aria-hidden', 'true')
  await key('{Tab}{Enter}')
  expect(button).toHaveFocus()
  expect(activate).toHaveBeenCalledOnce()
  await render(tree(9))
  expect(button).toHaveAccessibleName('Inbox, 9 unread messages')
  expect(marker).toHaveTextContent('9')
})

test('the logical end corner mirrors with locale direction and offsets move the marker outward', async () => {
  const example = (locale: string, offset: number) => (
    <LocaleProvider locale={locale}>
      <Indicator
        label="Mina Chen"
        statusText="Online"
        offset={offset}
      >
        {props => (
          <Avatar
            alt={props['aria-label']}
            fallback="MC"
          />
        )}
      </Indicator>
    </LocaleProvider>
  )
  const { host, render } = await mount(example('en', 0))
  const avatar = host.querySelector('[role="img"]')!
  const marker = host.querySelector('[data-slot~="indicator-marker"]')!
  const center = (element: Element) => {
    const { x, width } = element.getBoundingClientRect()
    return x + width / 2
  }
  expect(avatar).toHaveAccessibleName('Mina Chen, Online')
  expect(marker).toBeEmptyDOMElement()
  expect(center(marker)).toBeCloseTo(avatar.getBoundingClientRect().right, 1)
  await render(example('ar', 4))
  expect(center(marker)).toBeCloseTo(avatar.getBoundingClientRect().left - 4, 1)
})
