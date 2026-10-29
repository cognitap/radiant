import { createRef, StrictMode } from 'react'
import { expect, test } from 'vitest'
import { commands } from 'vitest/browser'
import {
  Alert,
  AlertTitle,
  AlertDescription,
  Button,
  ThemeScope,
  defineTheme,
  type AlertAnnouncement
} from '../../src/index.js'
import { mount, click } from './familyHarness.js'
test('hydrates quiet static content, meaningful headings and named groups without focus changes', async () => {
  const ref = createRef<HTMLDivElement>()
  const title = createRef<HTMLHeadingElement>()
  const description = createRef<HTMLParagraphElement>()
  const { host } = await mount(
    <StrictMode>
      <Alert
        ref={ref}
        aria-label="Connection notice"
        tone="warning"
      >
        <AlertTitle
          ref={title}
          level={3}
        >
          Connection interrupted
        </AlertTitle>
        <AlertDescription ref={description}>Changes remain on your device.</AlertDescription>
      </Alert>
      <Button>Continue editing</Button>
    </StrictMode>,
    true
  )
  const node = ref.current!
  expect(node.getAttribute('role')).toBe('group')
  expect(node.hasAttribute('aria-live')).toBe(false)
  expect(title.current?.tagName).toBe('H3')
  expect(description.current?.tagName).toBe('P')
  await click(host.querySelector('button')!)
  expect(document.activeElement).toBe(host.querySelector('button'))
})
test('live feedback retains its mounted node and focus, and does not replay identical content', async () => {
  const fixture = (text: string, announce: AlertAnnouncement = 'polite') => (
    <>
      <Button>Edit</Button>
      <Alert
        announce={announce}
        aria-label="Save result"
      >
        <AlertDescription>{text}</AlertDescription>
      </Alert>
    </>
  )
  const { host, render } = await mount(fixture(''), true)
  const node = host.querySelector<HTMLElement>('[data-slot~=alert]')!
  await click(host.querySelector('button')!)
  const focused = document.activeElement
  await render(fixture('Saved. Continue editing.'))
  expect(host.querySelector('[role=status]')).toBe(node)
  expect(document.activeElement).toBe(focused)
  const mutations: MutationRecord[] = []
  const observer = new MutationObserver(records => mutations.push(...records))
  observer.observe(node, { subtree: true, childList: true, characterData: true, attributes: true })
  await render(fixture('Saved. Continue editing.'))
  expect([...mutations, ...observer.takeRecords()]).toEqual([])
  observer.disconnect()
  await render(fixture('Save failed. Try again.', 'assertive'))
  expect(node.getAttribute('role')).toBe('alert')
  expect(node.hasAttribute('aria-live')).toBe(false)
  expect(document.activeElement).toBe(focused)
  await render(null)
  expect(node.isConnected).toBe(false)
})
test('tone is independent of urgency and local styles/refs survive preference changes', async () => {
  const theme = defineTheme({
    id: 'alert-proof',
    name: 'Alert proof',
    components: {
      alert: { padding: '19px', radius: '17px', titleSize: '23px', descriptionSize: '15px' }
    }
  })
  const { host, render } = await mount(
    <ThemeScope
      theme={theme}
      mode="dark"
    >
      <Alert tone="danger">
        <AlertTitle>Save failed</AlertTitle>
        <AlertDescription>Retry when connected.</AlertDescription>
      </Alert>
    </ThemeScope>
  )
  const node = host.querySelector<HTMLElement>('[data-slot~=alert]')!
  expect(node.hasAttribute('role')).toBe(false)
  expect(getComputedStyle(node).padding).toBe('19px')
  expect(getComputedStyle(node).borderRadius).toBe('17px')
  expect(getComputedStyle(host.querySelector('h2')!).fontSize).toBe('23px')
  await commands.emulatePreferences({ reducedMotion: 'reduce', forcedColors: 'active' })
  expect(getComputedStyle(node).transitionProperty).toBe('none')
  expect(getComputedStyle(node).borderTopStyle).not.toBe('none')
  expect(getComputedStyle(node).backgroundColor).not.toBe(getComputedStyle(node).color)
  await render(
    <Alert
      className="p-0"
      style={{ padding: '7px' }}
    >
      Local style
    </Alert>
  )
  expect(getComputedStyle(host.querySelector('[data-slot~=alert]')!).padding).toBe('7px')
})
test('long feedback reflows inside a narrow container without horizontal overflow', async () => {
  const { host } = await mount(
    <div style={{ width: '240px' }}>
      <Alert>
        <AlertTitle>Connection interrupted while saving the current workspace</AlertTitle>
        <AlertDescription>{'unbroken'.repeat(30)}</AlertDescription>
      </Alert>
    </div>
  )
  const node = host.querySelector<HTMLElement>('[data-slot~=alert]')!
  expect(node.scrollWidth).toBeLessThanOrEqual(node.clientWidth + 1)
})
