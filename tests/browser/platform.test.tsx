import { act, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import {
  Button,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  ThemeScope
} from '../../src/index.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const roots: Root[] = []
const hosts: HTMLDivElement[] = []

function host() {
  const node = document.createElement('div')
  document.body.append(node)
  hosts.push(node)
  return node
}

async function mount(children: ReactNode) {
  const node = host()
  const root = createRoot(node)
  roots.push(root)
  await act(async () => root.render(children))
  return { node, root }
}

afterEach(async () => {
  for (const root of roots.splice(0)) await act(async () => root.unmount())
  for (const node of hosts.splice(0)) node.remove()
})

for (const mode of ['light', 'dark'] as const) {
  test(`${mode}: native modal keyboard, cancellation, focus return and method=dialog`, async () => {
    let vetoTrigger = true
    let vetoClose = true
    const clicked = vi.fn()
    const { node } = await mount(
      <ThemeScope mode={mode}>
        <Dialog>
          <DialogTrigger
            onClick={event => {
              clicked()
              if (vetoTrigger) event.preventDefault()
            }}
          >
            Edit profile
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Visible to your team.</DialogDescription>
            <DialogClose
              onClick={event => {
                if (vetoClose) event.preventDefault()
              }}
            >
              Close
            </DialogClose>
            <form method="dialog">
              <Button type="submit">Done</Button>
            </form>
          </DialogContent>
        </Dialog>
      </ThemeScope>
    )
    const dialog = node.querySelector('dialog')!
    const trigger = page.getByRole('button', { name: 'Edit profile' })
    await act(async () => userEvent.click(trigger))
    expect(dialog.open).toBe(false)
    expect(clicked).toHaveBeenCalledTimes(1)
    vetoTrigger = false
    await act(async () => userEvent.click(trigger))
    expect(dialog.matches(':modal')).toBe(true)
    expect(dialog.contains(document.activeElement)).toBe(true)
    await act(async () => userEvent.tab())
    await expect.element(page.getByRole('button', { name: 'Done' })).toHaveFocus()
    await act(async () => userEvent.tab({ shift: true }))
    await expect.element(page.getByRole('button', { name: 'Close', exact: true })).toHaveFocus()
    await act(async () => userEvent.keyboard('{Enter}'))
    expect(dialog.open).toBe(true)
    vetoClose = false
    await act(async () => userEvent.keyboard('{Enter}'))
    await expect.poll(() => dialog.open).toBe(false)
    await expect.element(trigger).toHaveFocus()
    await act(async () => userEvent.keyboard('{Enter}'))
    expect(dialog.matches(':modal')).toBe(true)
    await act(async () => userEvent.keyboard('{Escape}'))
    await expect.poll(() => dialog.open).toBe(false)
    await expect.element(trigger).toHaveFocus()
    await act(async () => userEvent.keyboard('{Enter}'))
    await act(async () => userEvent.click(page.getByRole('button', { name: 'Done' })))
    await expect.poll(() => dialog.open).toBe(false)
    expect(node.querySelector('[aria-expanded]')?.getAttribute('aria-expanded')).toBe('false')
  })

  test(`${mode}: StrictMode unmount closes the modal and releases action refs before remount`, async () => {
    const released = vi.fn()
    const attached: HTMLButtonElement[] = []
    const closeRef = (node: HTMLButtonElement | null) => {
      if (!node) return
      attached.push(node)
      return () => released(node)
    }
    const tree = (key: string) => (
      <StrictMode>
        <ThemeScope mode={mode}>
          <Dialog
            key={key}
            defaultOpen
          >
            <DialogContent>
              <DialogTitle>Session</DialogTitle>
              <DialogDescription>Each mount starts a fresh session.</DialogDescription>
              <DialogClose ref={closeRef}>Close session</DialogClose>
            </DialogContent>
          </Dialog>
        </ThemeScope>
      </StrictMode>
    )
    const { node, root } = await mount(tree('first'))
    const original = node.querySelector('dialog')!
    const originalClose = node.querySelector('button')!
    await act(async () => new Promise(requestAnimationFrame))
    expect(original.matches(':modal')).toBe(true)
    expect(attached).toContain(originalClose)
    released.mockClear()
    await act(async () => root.render(null))
    expect(original.open).toBe(false)
    expect(original.isConnected).toBe(false)
    expect(released).toHaveBeenCalledExactlyOnceWith(originalClose)
    await act(async () => root.render(tree('second')))
    const fresh = node.querySelector('dialog')!
    expect(fresh).not.toBe(original)
    expect(fresh.matches(':modal')).toBe(true)
    await act(async () => userEvent.keyboard('{Escape}'))
    await expect.poll(() => fresh.open).toBe(false)
  })

  test(`${mode}: server markup hydrates with stable relationships and native form state`, async () => {
    const tree = (error?: string) => (
      <ThemeScope mode={mode}>
        <form aria-label="Preferences">
          <Field
            label="Email"
            description="Work address"
            error={error}
            required
          >
            <Input
              name="email"
              type="email"
              defaultValue="ada@example.com"
            />
          </Field>
          <Checkbox
            name="updates"
            value="yes"
            label="Product updates"
            defaultChecked
            indeterminate
          />
          <Collapsible defaultOpen>
            <CollapsibleTrigger>Shipping</CollapsibleTrigger>
            <CollapsibleContent>Ships in two days.</CollapsibleContent>
          </Collapsible>
          <Dialog>
            <DialogTrigger>Edit preferences</DialogTrigger>
            <DialogContent>
              <DialogTitle>Preferences</DialogTitle>
              <DialogDescription>Manage your settings.</DialogDescription>
              <DialogClose>Close preferences</DialogClose>
            </DialogContent>
          </Dialog>
        </form>
      </ThemeScope>
    )
    const node = host()
    node.innerHTML = renderToString(tree())
    const ids = [...node.querySelectorAll('[id]')].map(node => node.id)
    const serverInput = node.querySelector('input')!
    const errors: unknown[] = []
    let root!: Root
    await act(async () => {
      root = hydrateRoot(node, tree(), { onRecoverableError: error => errors.push(error) })
    })
    roots.push(root)
    expect(errors).toEqual([])
    expect(node.querySelector('input')).toBe(serverInput)
    expect([...node.querySelectorAll('[id]')].map(node => node.id)).toEqual(ids)
    expect(node.querySelector('details')?.open).toBe(true)
    expect(node.querySelector<HTMLInputElement>('[type="checkbox"]')?.indeterminate).toBe(true)
    await act(async () => userEvent.click(page.getByText('Shipping', { exact: true })))
    await expect.poll(() => node.querySelector('details')?.open).toBe(false)
    await act(async () =>
      userEvent.fill(page.getByRole('textbox', { name: 'Email' }), 'grace@example.com')
    )
    await act(async () => root.render(tree('Use a company address.')))
    expect(new FormData(node.querySelector('form')!).get('email')).toBe('grace@example.com')
    expect(new FormData(node.querySelector('form')!).get('updates')).toBe('yes')
    expect(serverInput.getAttribute('aria-invalid')).toBe('true')
    await expect
      .element(page.getByRole('textbox', { name: 'Email' }))
      .toHaveAccessibleDescription('Work address Use a company address.')
    expect(errors).toEqual([])
  })
}
