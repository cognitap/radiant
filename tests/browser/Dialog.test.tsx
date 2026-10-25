import { act, createRef, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
  ThemeScope,
  glass,
  type DialogRenderProps
} from '../../src/index.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: Array<{ root: Root; host: HTMLDivElement }> = []
async function mount(children: ReactNode) {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  mounted.push({ root, host })
  await act(async () => root.render(children))
  return { root, host }
}
afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
})
function ConsumerButton({ children, ...props }: DialogRenderProps) {
  return (
    <button
      {...props}
      data-adapter="consumer"
    >
      {children}
    </button>
  )
}

for (const mode of ['light', 'dark'] as const) {
  for (const adapter of ['native', 'component'] as const) {
    test(`${mode}: ${adapter} Dialog replacements preserve native activation, guards, refs and form behavior`, async () => {
      const render = (props: DialogRenderProps) =>
        adapter === 'native' ? (
          <button {...props}>{props.children}</button>
        ) : (
          <ConsumerButton {...props} />
        )
      const triggerRef = createRef<HTMLButtonElement>()
      const attached: Array<HTMLButtonElement | null> = []
      const released = vi.fn()
      const closeRef = (node: HTMLButtonElement | null) => {
        attached.push(node)
        return () => released(node)
      }
      const requested = vi.fn()
      const submitted = vi.fn()
      const clicked = vi.fn()
      const closeClicked = vi.fn()
      let veto = true
      let vetoTrigger = true
      let revision = 0
      const tree = (
        pendingTrigger = false,
        pendingClose = false,
        disabled = false,
        submit = false
      ) => (
        <ThemeScope
          theme={glass}
          mode={mode}
        >
          <form
            onSubmit={event => {
              event.preventDefault()
              submitted()
            }}
          >
            <fieldset disabled={disabled}>
              <legend>Profile settings</legend>
              <Dialog onOpenChange={requested}>
                <DialogTrigger
                  ref={triggerRef}
                  render={render}
                  pending={pendingTrigger}
                  aria-busy={false}
                  type={submit ? 'submit' : undefined}
                  onClick={event => {
                    clicked(revision)
                    if (vetoTrigger) event.preventDefault()
                  }}
                >
                  Edit settings
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>Edit settings</DialogTitle>
                  <DialogDescription>Replacement actions use native buttons.</DialogDescription>
                  <DialogClose
                    ref={closeRef}
                    render={render}
                    pending={pendingClose}
                    onClick={event => {
                      closeClicked(revision)
                      if (veto) event.preventDefault()
                    }}
                  >
                    Close settings
                  </DialogClose>
                </DialogContent>
              </Dialog>
            </fieldset>
          </form>
        </ThemeScope>
      )
      const { root, host } = await mount(tree(true))
      const trigger = triggerRef.current!
      const close = host.querySelector<HTMLButtonElement>('[data-slot~="dialog-close"]')!
      const dialog = host.querySelector('dialog')!
      expect(host.querySelectorAll('button')).toHaveLength(2)
      expect(attached).toEqual([close])
      expect(trigger.getAttribute('aria-controls')).toBe(dialog.id)
      expect(trigger.getAttribute('aria-busy')).toBe('true')
      expect(trigger.querySelector('[aria-hidden="true"]')).not.toBeNull()
      await act(async () => {
        trigger.focus()
      })
      await act(async () => userEvent.keyboard('{Enter}'))
      expect(requested).not.toHaveBeenCalled()
      expect(clicked).not.toHaveBeenCalled()
      expect(submitted).not.toHaveBeenCalled()

      await act(async () => root.render(tree(false, false, true)))
      expect(trigger.matches(':disabled')).toBe(true)
      await act(async () => trigger.click())
      expect(clicked).not.toHaveBeenCalled()
      await act(async () => root.render(tree()))
      await act(async () => {
        trigger.focus()
      })
      await act(async () => userEvent.keyboard('{Enter}'))
      expect(dialog.open).toBe(false)
      expect(clicked).toHaveBeenCalledExactlyOnceWith(0)
      expect(requested).not.toHaveBeenCalled()
      vetoTrigger = false
      await act(async () => userEvent.keyboard('{Enter}'))
      expect(dialog.matches(':modal')).toBe(true)
      expect(clicked.mock.calls).toEqual([[0], [0]])
      expect(requested).toHaveBeenCalledExactlyOnceWith(true)
      await expect.element(page.getByRole('button', { name: 'Close settings' })).toHaveFocus()
      await act(async () => userEvent.keyboard(' '))
      expect(closeClicked).toHaveBeenCalledExactlyOnceWith(0)
      expect(dialog.open).toBe(true)
      expect(requested).toHaveBeenCalledTimes(1)
      expect(submitted).not.toHaveBeenCalled()

      veto = false
      revision = 1
      await act(async () => root.render(tree(false, true)))
      await act(async () => userEvent.keyboard('{Enter}'))
      expect(closeClicked).toHaveBeenCalledTimes(1)
      expect(dialog.open).toBe(true)
      await act(async () => root.render(tree()))
      expect(triggerRef.current).toBe(trigger)
      expect(attached).toEqual([close])
      expect(released).not.toHaveBeenCalled()
      await act(async () => userEvent.keyboard('{Enter}'))
      await expect.poll(() => dialog.open).toBe(false)
      expect(closeClicked.mock.calls).toEqual([[0], [1]])
      expect(requested.mock.calls).toEqual([[true], [false]])
      await expect.element(page.getByRole('button', { name: 'Edit settings' })).toHaveFocus()
      expect(submitted).not.toHaveBeenCalled()

      await act(async () => root.render(tree(false, false, false, true)))
      await act(async () => userEvent.keyboard('{Enter}'))
      expect(submitted).toHaveBeenCalledTimes(1)
      expect(dialog.matches(':modal')).toBe(true)
      expect(clicked.mock.calls).toEqual([[0], [0], [1]])
      await act(async () => root.render(null))
      expect(triggerRef.current).toBeNull()
      expect(released).toHaveBeenCalledExactlyOnceWith(close)
      expect(attached).toEqual([close])
      expect(dialog.open).toBe(false)
    })
  }
}
