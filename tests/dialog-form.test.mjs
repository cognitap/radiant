import assert from 'node:assert/strict'
import { test } from 'node:test'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/'
})

for (const key of [
  'window',
  'document',
  'HTMLElement',
  'HTMLDialogElement',
  'Node',
  'Element',
  'MutationObserver',
  'getComputedStyle',
  'DocumentFragment'
]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value: dom.window[key]
  })
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const { act, createElement, useState } = await import('react')
const { createRoot, hydrateRoot } = await import('react-dom/client')
const { renderToString } = await import('react-dom/server')
const {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  useDialog
} = await import('../dist/library/index.js')

function mount() {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  return { host, root }
}

function dialogTree(props = {}) {
  return createElement(
    Dialog,
    props,
    createElement(DialogTrigger, null, 'Edit'),
    createElement(
      DialogContent,
      null,
      createElement(DialogTitle, null, 'Edit profile'),
      createElement(DialogDescription, null, 'Visible to your team.'),
      createElement(DialogClose, null, 'Close'),
      createElement('button', { type: 'button' }, 'Continue')
    )
  )
}

test('a closed dialog hydrates without an open attribute', async () => {
  const html = renderToString(dialogTree({ defaultOpen: true }))
  const dialogTag = /<dialog\b[^>]*>/.exec(html)?.[0] ?? ''
  assert.doesNotMatch(dialogTag, /\sopen(?:=|\s|>)/)
  assert.match(html, /aria-haspopup="dialog"/)
  assert.match(html, /aria-expanded="true"/)

  const host = document.getElementById('root')
  host.innerHTML = html
  const recoverable = []
  let hydrated
  await act(async () => {
    hydrated = hydrateRoot(host, dialogTree({ defaultOpen: true }), {
      onRecoverableError(error) {
        recoverable.push(String(error))
      }
    })
  })
  assert.deepEqual(recoverable, [])
  assert.equal(host.querySelector('dialog').hasAttribute('open'), true)
  await act(async () => hydrated.unmount())
})

test('opening, closing, and a prevented trigger stay in React state', async () => {
  const { host, root } = mount()
  await act(async () => root.render(dialogTree()))
  const trigger = host.querySelector('[data-slot="dialog-trigger"]')
  const dialog = host.querySelector('dialog')
  assert.equal(dialog.hasAttribute('open'), false)
  assert.equal(trigger.getAttribute('aria-expanded'), 'false')
  assert.equal(trigger.getAttribute('aria-controls'), dialog.id)

  await act(async () => trigger.click())
  assert.equal(dialog.hasAttribute('open'), true)
  assert.equal(trigger.getAttribute('aria-expanded'), 'true')

  await act(async () => host.querySelector('[data-slot="dialog-close"]').click())
  assert.equal(dialog.hasAttribute('open'), false)

  trigger.addEventListener('click', event => event.preventDefault(), { capture: true })
  await act(async () => trigger.click())
  assert.equal(dialog.hasAttribute('open'), false)
  await act(async () => root.unmount())
})

test('Escape and backdrop dismissal follow the dialog flags', async () => {
  const { host, root } = mount()
  await act(async () => root.render(dialogTree({ defaultOpen: true })))
  const dialog = host.querySelector('dialog')
  dialog.getBoundingClientRect = () => ({
    x: 100,
    y: 80,
    left: 100,
    top: 80,
    right: 420,
    bottom: 320,
    width: 320,
    height: 240,
    toJSON() {}
  })

  const continueButton = [...host.querySelectorAll('dialog button')].find(
    button => button.textContent === 'Continue'
  )
  await act(async () => continueButton.click())
  assert.equal(dialog.hasAttribute('open'), true)

  await act(async () => {
    dialog.dispatchEvent(
      new dom.window.MouseEvent('click', { bubbles: true, clientX: 150, clientY: 120 })
    )
  })
  assert.equal(dialog.hasAttribute('open'), true)

  await act(async () => {
    dialog.dispatchEvent(
      new dom.window.MouseEvent('click', { bubbles: true, clientX: 0, clientY: 0 })
    )
  })
  assert.equal(dialog.hasAttribute('open'), false)

  await act(async () => host.querySelector('[data-slot="dialog-trigger"]').click())
  const closeEvent = new dom.window.Event('close', { bubbles: true })
  await act(async () => dialog.dispatchEvent(closeEvent))
  assert.equal(dialog.hasAttribute('open'), false)
  await act(async () => root.unmount())
})

test('a backdrop click can be ignored', async () => {
  const { host, root } = mount()
  await act(async () => root.render(dialogTree({ defaultOpen: true, closeOnBackdrop: false })))
  const dialog = host.querySelector('dialog')
  dialog.getBoundingClientRect = () => ({
    x: 100,
    y: 80,
    left: 100,
    top: 80,
    right: 420,
    bottom: 320,
    width: 320,
    height: 240,
    toJSON() {}
  })
  await act(async () => {
    dialog.dispatchEvent(
      new dom.window.MouseEvent('click', { bubbles: true, clientX: 0, clientY: 0 })
    )
  })
  assert.equal(dialog.hasAttribute('open'), true)
  await act(async () => root.unmount())
})

test('cancelling Escape leaves a dialog open', async () => {
  const { host, root } = mount()
  await act(async () => root.render(dialogTree({ defaultOpen: true, closeOnEscape: false })))
  const dialog = host.querySelector('dialog')
  const cancel = new dom.window.Event('cancel', { bubbles: true, cancelable: true })
  await act(async () => dialog.dispatchEvent(cancel))
  assert.equal(cancel.defaultPrevented, true)
  assert.equal(dialog.hasAttribute('open'), true)
  await act(async () => root.unmount())
})

test('a controlled dialog reopens when its open value stays true', async () => {
  const { host, root } = mount()
  await act(async () => root.render(dialogTree({ open: true, onOpenChange() {} })))
  const dialog = host.querySelector('dialog')
  assert.equal(dialog.hasAttribute('open'), true)
  await act(async () => {
    dialog.removeAttribute('open')
    dialog.dispatchEvent(new dom.window.Event('close', { bubbles: true }))
  })
  assert.equal(dialog.hasAttribute('open'), true)
  await act(async () => root.unmount())
})

test('dialog fields stay in the ancestor form', async () => {
  const seen = { note: '' }
  function Host() {
    return createElement(
      'form',
      {
        onSubmit(event) {
          event.preventDefault()
          seen.note = new dom.window.FormData(event.currentTarget).get('note') ?? ''
        }
      },
      createElement('input', { name: 'outside', defaultValue: 'yes' }),
      createElement(
        Dialog,
        null,
        createElement(DialogTrigger, null, 'Edit'),
        createElement(
          DialogContent,
          null,
          createElement(DialogTitle, null, 'Note'),
          createElement(DialogDescription, null, 'Saved with the form.'),
          createElement('input', { name: 'note', defaultValue: 'hello' })
        )
      )
    )
  }

  const { host, root } = mount()
  await act(async () => root.render(createElement(Host)))
  const dialog = host.querySelector('dialog')
  assert.equal(dialog.closest('form'), host.querySelector('form'))
  assert.equal(dialog.parentElement === document.body, false)
  await act(async () => {
    host
      .querySelector('form')
      .dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }))
  })
  assert.equal(seen.note, 'hello')
  await act(async () => root.unmount())
})

test('a custom trigger uses useDialog and nested close leaves the outer open', async () => {
  function Custom() {
    const dialog = useDialog()
    return createElement(
      'button',
      { type: 'button', onClick: () => dialog?.setOpen(true) },
      'Custom'
    )
  }
  function Nested() {
    const [outer, setOuter] = useState(false)
    return createElement(
      Dialog,
      { open: outer, onOpenChange: setOuter },
      createElement(Custom),
      createElement(
        DialogContent,
        null,
        createElement(DialogTitle, null, 'Outer'),
        createElement(DialogDescription, null, 'First layer.'),
        createElement(
          Dialog,
          null,
          createElement(DialogTrigger, null, 'Inner'),
          createElement(
            DialogContent,
            null,
            createElement(DialogTitle, null, 'Inner'),
            createElement(DialogDescription, null, 'Second layer.'),
            createElement(DialogClose, null, 'Close inner')
          )
        )
      )
    )
  }

  const { host, root } = mount()
  await act(async () => root.render(createElement(Nested)))
  await act(async () => host.querySelector('button').click())
  const [outer, inner] = host.querySelectorAll('dialog')
  assert.equal(outer.hasAttribute('open'), true)
  await act(async () => host.querySelector('[data-slot="dialog-trigger"]').click())
  assert.equal(inner.hasAttribute('open'), true)
  await act(async () => {
    inner.dispatchEvent(new dom.window.Event('close', { bubbles: true }))
  })
  assert.equal(inner.hasAttribute('open'), false)
  assert.equal(outer.hasAttribute('open'), true)
  await act(async () => root.unmount())
})

test('unmounting an open dialog closes it without throwing', async () => {
  const { host, root } = mount()
  await act(async () => root.render(dialogTree({ defaultOpen: true })))
  const dialog = host.querySelector('dialog')
  assert.equal(dialog.hasAttribute('open'), true)
  await act(async () => root.unmount())
  assert.equal(dialog.isConnected, false)
})
