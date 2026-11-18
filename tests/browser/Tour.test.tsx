import { act } from 'react'
import { expect, test, vi } from 'vitest'
import { Tour, TourTrigger } from '../../src/index.js'
import { click, key, mount, shown } from './familyHarness.js'

test('moves focus between available steps, skips missing targets, and restores the opener', async () => {
  const { host } = await mount(
    <Tour
      steps={[
        { target: '#unavailable', title: 'Missing' },
        { target: '#projects', title: 'Projects' },
        { target: '#billing', title: 'Billing' },
        { target: '#invite', title: 'Invite' }
      ]}
    >
      <TourTrigger>Start</TourTrigger>
      <div style={{ height: 120, overflow: 'auto' }}>
        <button id="projects">Find projects</button>
        <button
          id="billing"
          hidden
        >
          Billing
        </button>
        <div style={{ height: 400 }} />
        <button id="invite">Invite a teammate</button>
      </div>
    </Tour>,
    true
  )
  const opener = host.querySelector('button')!
  const popup = host.querySelector<HTMLElement>('[role="dialog"]')!
  const findAction = (name: string) =>
    Array.from(popup.querySelectorAll('button')).find(button => button.textContent === name)!
  await click(opener)
  await expect.poll(() => shown(popup)).toBe(true)
  expect(popup).toHaveAccessibleName('Projects')
  expect(popup.contains(document.activeElement)).toBe(true)
  expect(host.querySelector('#projects')).toHaveAttribute('data-rad-tour-target')
  await click(findAction('Next'))
  expect(popup).toHaveAccessibleName('Invite')
  expect(popup.contains(document.activeElement)).toBe(true)
  expect(host.querySelector('#invite')?.parentElement?.scrollTop).toBeGreaterThan(0)
  await click(findAction('Back'))
  expect(popup).toHaveAccessibleName('Projects')
  await key('{Escape}')
  await expect.poll(() => shown(popup)).toBe(false)
  expect(opener).toHaveFocus()
  expect(host.querySelector('[data-rad-tour-target]')).toBeNull()
  await click(opener)
  await expect.poll(() => shown(popup)).toBe(true)
  await click(findAction('Skip tour'))
  expect(opener).toHaveFocus()
})

test('an open request closes cleanly if none of the targets exist', async () => {
  const change = vi.fn()
  const { host } = await mount(
    <Tour
      steps={[{ target: '#missing', title: 'Missing' }]}
      onOpenChange={change}
    >
      <TourTrigger>Start</TourTrigger>
    </Tour>
  )
  await click(host.querySelector('button')!)
  await expect.poll(() => change.mock.calls.flat()).toEqual([true, false])
  expect(host.querySelector('[popover]:popover-open')).toBeNull()
})

test('closing after the active target is removed returns focus to the opener', async () => {
  const steps = [{ target: '#projects', title: 'Projects' }]
  const tree = (includeTarget: boolean) => (
    <Tour steps={steps}>
      <TourTrigger>Start</TourTrigger>
      {includeTarget && <button id="projects">Projects</button>}
    </Tour>
  )
  const { host, render } = await mount(tree(true))
  const opener = host.querySelector('button')!
  const popup = host.querySelector<HTMLElement>('[role="dialog"]')!
  await click(opener)
  await expect.poll(() => shown(popup)).toBe(true)
  await render(tree(false))
  await act(async () => {
    await new Promise(requestAnimationFrame)
  })
  await expect.poll(() => shown(popup)).toBe(false)
  expect(opener).toHaveFocus()
})
