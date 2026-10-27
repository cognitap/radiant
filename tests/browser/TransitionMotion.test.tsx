import { act, StrictMode, useState, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, expect, test, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  Button,
  ThemeScope,
  defineTheme,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from '../../src/index.js'
import { MotionProvider } from '../../src/motion/react.js'
import type {} from './mediaCommands.js'
import '../../.storybook/styles.css'
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const roots: Root[] = []
const hosts: HTMLElement[] = []
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
async function until(check: () => boolean) {
  for (let i = 0; i < 180; i++) {
    if (check()) return
    await frame()
  }
  throw new Error('Transition did not reach expected state')
}
async function mount(children: ReactNode) {
  const host = document.createElement('div')
  document.body.append(host)
  hosts.push(host)
  const root = createRoot(host)
  roots.push(root)
  await act(async () =>
    root.render(
      <StrictMode>
        <ThemeScope
          theme={defineTheme({
            id: 'transition-proof',
            name: 'Transition',
            motion: { spring: { stiffness: 180, damping: 16 } }
          })}
        >
          <MotionProvider>{children}</MotionProvider>
        </ThemeScope>
      </StrictMode>
    )
  )
  return { host, root }
}
afterEach(async () => {
  for (const root of roots.splice(0)) await act(async () => root.unmount())
  hosts.splice(0).forEach(node => node.remove())
  await commands.emulatePreferences({ reducedMotion: 'no-preference' })
})
function Disclosure() {
  const [large, setLarge] = useState(false)
  return (
    <>
      <Button onClick={() => setLarge(!large)}>Resize content</Button>
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent style={{ padding: 0 }}>
          <div style={{ height: large ? 240 : 120 }}>
            <input aria-label="Inside" />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  )
}
test('native disclosure reverses from current height, observes content size and remains inert when closed', async () => {
  const { host } = await mount(<Disclosure />)
  const details = host.querySelector('details')!
  const content = host.querySelector('[data-slot~="collapsible-content"]') as HTMLElement
  const height = () => parseFloat(details.style.getPropertyValue('--_rad-spring-details-height'))
  const summary = host.querySelector('summary')!
  await act(async () => userEvent.click(summary))
  await until(() => height() > 40 && height() < 95)
  const before = height()
  await act(async () => {
    details.open = false
    await Promise.resolve()
  })
  const after: number[] = []
  for (let i = 0; i < 3; i++) {
    await frame()
    after.push(height())
  }
  expect(after.some(value => value > before + 0.1)).toBe(true)
  expect(details.open).toBe(false)
  expect(content.inert).toBe(true)
  expect(content.getAttribute('aria-hidden')).toBe('true')
  await act(async () => userEvent.click(summary))
  await until(() => height() > 110)
  await act(async () => userEvent.click(host.querySelector('button')!))
  await until(() => height() > 180)
  await until(() => Math.abs(height() - 240) < 0.1)
  expect(content.inert).toBe(false)
  expect(content.hasAttribute('aria-hidden')).toBe(false)
  await act(async () => {
    await commands.emulatePreferences({ reducedMotion: 'reduce' })
    await frame()
  })
  await act(async () => userEvent.click(summary))
  await until(() => height() === 0)
  expect(parseFloat(getComputedStyle(details, '::details-content').height)).toBe(0)
})
test('Dialog closes semantically now, exits inertly, preserves focus and reverses on reopen', async () => {
  const { host, root } = await mount(
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent style={{ transform: 'rotate(2deg)' }}>
        <DialogTitle>Spring modal</DialogTitle>
        <input
          name="dialog-value"
          aria-label="Value"
        />
        <DialogClose>Close</DialogClose>
      </DialogContent>
    </Dialog>
  )
  const dialog = host.querySelector('dialog')!
  const trigger = host.querySelector('button')!
  await act(async () => userEvent.click(trigger))
  await until(() => Number(dialog.style.scale) > 0.96 && Number(dialog.style.scale) < 0.999)
  expect(dialog.matches(':modal')).toBe(true)
  expect(dialog.style.transform).toBe('rotate(2deg)')
  dialog.addEventListener('cancel', event => event.preventDefault(), { once: true })
  await act(async () => userEvent.keyboard('{Escape}'))
  expect(dialog.open).toBe(true)
  await act(async () => userEvent.keyboard('{Escape}'))
  await until(() => !dialog.open)
  expect(dialog.matches(':modal')).toBe(false)
  expect(document.activeElement).toBe(trigger)
  const ghost = document.querySelector('[data-rad-motion-exit]') as HTMLElement
  expect(ghost).not.toBeNull()
  expect(ghost.inert).toBe(true)
  expect(ghost.tagName).toBe('DIV')
  expect(getComputedStyle(ghost).display).toBe('grid')
  expect(ghost.getAttribute('aria-hidden')).toBe('true')
  expect(ghost.querySelector('[id],[name],[autofocus],[form]')).toBeNull()
  expect((ghost.querySelector('input') as HTMLInputElement).disabled).toBe(true)
  const atClose = Number(dialog.style.scale)
  await act(async () => {
    trigger.click()
    await Promise.resolve()
  })
  expect(document.querySelector('[data-rad-motion-exit]')).toBeNull()
  expect(dialog.open).toBe(true)
  expect(Math.abs(Number(dialog.style.scale) - atClose)).toBeLessThan(0.03)
  await act(async () => userEvent.click(Array.from(dialog.querySelectorAll('button')).at(-1)!))
  await until(() => !dialog.open)
  await until(() => document.querySelector('[data-rad-motion-exit]') === null)
  await act(async () => root.render(null))
  expect(dialog.style.scale).toBe('')
  expect(document.querySelector('[data-rad-motion-exit]')).toBeNull()
})
test('Accordion composition and off transition preserve native keyboard/state', async () => {
  const { host } = await mount(
    <>
      <Accordion type="single">
        <AccordionItem value="a">
          <AccordionTrigger>Section A</AccordionTrigger>
          <AccordionContent>Alpha</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Section B</AccordionTrigger>
          <AccordionContent>Beta</AccordionContent>
        </AccordionItem>
      </Accordion>
      <Collapsible motion="off">
        <CollapsibleTrigger>No spring</CollapsibleTrigger>
        <CollapsibleContent>Immediate</CollapsibleContent>
      </Collapsible>
    </>
  )
  const summaries = host.querySelectorAll('summary')
  await userEvent.click(summaries[0])
  await userEvent.keyboard('{Enter}')
  expect(host.querySelector('details')!.open).toBe(false)
  await userEvent.click(summaries[1])
  expect(host.querySelectorAll('details')[1].open).toBe(true)
  await userEvent.click(summaries[2])
  expect(
    host.querySelectorAll('details')[2].style.getPropertyValue('--_rad-spring-details-height')
  ).toBe('')
})
