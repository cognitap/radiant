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

const { act, createElement, createRef, useState } = await import('react')
const { createRoot, hydrateRoot } = await import('react-dom/client')
const { renderToString } = await import('react-dom/server')
const {
  Button,
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

test('default dialog actions compose canonical Button presentation and pending markup', () => {
  for (const presentation of [
    {},
    { variant: 'outline', size: 'small', radius: 'full', pending: true }
  ]) {
    const reference = document.createElement('div')
    reference.innerHTML = renderToString(createElement(Button, presentation, 'Action'))
    const button = reference.querySelector('button')
    for (const [Action, identity] of [
      [DialogTrigger, 'dialog-trigger'],
      [DialogClose, 'dialog-close']
    ]) {
      const host = document.createElement('div')
      host.innerHTML = renderToString(
        createElement(Dialog, null, createElement(Action, presentation, 'Action'))
      )
      const action = host.querySelector('button')
      assert.equal(action.className, button.className, `${identity} uses Button presentation`)
      assert.equal(action.innerHTML, button.innerHTML, `${identity} uses Button pending markup`)
      assert.equal(action.getAttribute('aria-busy'), presentation.pending ? 'true' : null)
      assert.equal(action.type, 'button')
      assert.deepEqual(new Set(action.dataset.slot.split(' ')), new Set(['button', identity]))
      assert.equal(host.querySelectorAll('button').length, 1)
    }
  }
})

test('dialog action consumers can veto requests and a controlled owner can decline them', async () => {
  const { host, root } = mount()
  const events = []
  let preventTrigger = true
  let preventClose = true
  let accept = false
  let submits = 0
  function Example() {
    const [open, setOpen] = useState(false)
    return createElement(
      'form',
      {
        onSubmit(event) {
          event.preventDefault()
          submits++
        }
      },
      createElement(
        Dialog,
        {
          open,
          onOpenChange(next) {
            events.push(next)
            if (accept) setOpen(next)
          }
        },
        createElement(
          DialogTrigger,
          {
            onClick(event) {
              events.push('trigger')
              if (preventTrigger) event.preventDefault()
            },
            'aria-haspopup': 'menu',
            'aria-controls': 'caller-cannot-replace-content',
            'aria-expanded': true,
            'data-slot': 'caller-cannot-replace-identity'
          },
          'Edit'
        ),
        createElement(
          DialogContent,
          null,
          createElement(DialogTitle, null, 'Edit profile'),
          createElement(
            DialogClose,
            {
              onClick(event) {
                events.push('close')
                if (preventClose) event.preventDefault()
              }
            },
            'Close'
          )
        )
      )
    )
  }
  try {
    await act(async () => root.render(createElement(Example)))
    const trigger = host.querySelector('[data-slot~="dialog-trigger"]')
    const close = host.querySelector('[data-slot~="dialog-close"]')
    const dialog = host.querySelector('dialog')
    assert.equal(trigger.getAttribute('aria-haspopup'), 'dialog')
    assert.equal(trigger.getAttribute('aria-controls'), dialog.id)
    assert.equal(trigger.getAttribute('aria-expanded'), 'false')
    assert.equal(trigger.dataset.slot, 'button dialog-trigger')

    await act(async () => trigger.click())
    assert.deepEqual(events, ['trigger'])
    assert.equal(dialog.hasAttribute('open'), false)
    preventTrigger = false
    await act(async () => trigger.click())
    assert.deepEqual(events, ['trigger', 'trigger', true])
    assert.equal(dialog.hasAttribute('open'), false)
    accept = true
    await act(async () => trigger.click())
    assert.deepEqual(events, ['trigger', 'trigger', true, 'trigger', true])
    assert.equal(dialog.hasAttribute('open'), true)
    assert.equal(trigger.getAttribute('aria-expanded'), 'true')

    await act(async () => close.click())
    assert.equal(dialog.hasAttribute('open'), true)
    preventClose = false
    await act(async () => close.click())
    assert.deepEqual(events, ['trigger', 'trigger', true, 'trigger', true, 'close', 'close', false])
    assert.equal(dialog.hasAttribute('open'), false)
    assert.equal(submits, 0, 'default action buttons do not submit the surrounding form')
  } finally {
    await act(async () => root.unmount())
    host.remove()
  }
})

test('pending and native disabled actions block consumers, requests and form submission', async () => {
  for (const Action of [DialogTrigger, DialogClose]) {
    for (const render of [undefined, props => createElement('button', props)]) {
      const { host, root } = mount()
      const initiallyOpen = Action === DialogClose
      const requests = []
      let clicks = 0
      let submits = 0
      function tree({ pending = false, disabled = false, fieldsetDisabled = false }) {
        const action = createElement(
          Action,
          { pending, disabled, render, type: 'submit', onClick: () => clicks++ },
          'Action'
        )
        return createElement(
          'form',
          {
            onSubmit(event) {
              event.preventDefault()
              submits++
            }
          },
          createElement(
            'fieldset',
            { disabled: fieldsetDisabled },
            createElement(
              Dialog,
              { defaultOpen: initiallyOpen, onOpenChange: next => requests.push(next) },
              initiallyOpen ? null : action,
              createElement(
                DialogContent,
                null,
                createElement(DialogTitle, null, 'Guarded action'),
                initiallyOpen ? action : null
              )
            )
          )
        )
      }
      try {
        await act(async () => root.render(tree({ pending: true })))
        let action = host.querySelector('button')
        const dialog = host.querySelector('dialog')
        assert.equal(action.getAttribute('aria-busy'), 'true')
        await act(async () => action.click())
        assert.equal(clicks, 0)
        assert.deepEqual(requests, [])
        assert.equal(submits, 0)
        assert.equal(dialog.hasAttribute('open'), initiallyOpen)

        await act(async () => root.render(tree({ disabled: true })))
        action = host.querySelector('button')
        assert.equal(action.disabled, true)
        await act(async () => action.click())
        await act(async () => root.render(tree({ fieldsetDisabled: true })))
        action = host.querySelector('button')
        assert.equal(action.disabled, false)
        assert.equal(action.matches(':disabled'), true)
        await act(async () => {
          action.click()
          action.dispatchEvent(
            new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })
          )
        })
        assert.equal(clicks, 0)
        assert.deepEqual(requests, [])
        assert.equal(submits, 0)

        await act(async () => root.render(tree({})))
        await act(async () => host.querySelector('button').click())
        assert.equal(clicks, 1)
        assert.deepEqual(requests, [!initiallyOpen])
        assert.equal(dialog.hasAttribute('open'), !initiallyOpen)
        assert.equal(submits, 1, 'an explicit submit type retains native form behavior')
      } finally {
        await act(async () => root.unmount())
        host.remove()
      }
    }
  }
})

test('dialog action refs reach the same native hosts and preserve callback cleanup', async () => {
  for (const render of [undefined, props => createElement('button', props)]) {
    const { host, root } = mount()
    const triggerRef = createRef()
    const attached = []
    const cleaned = []
    const closeRef = node => {
      attached.push(node)
      return () => {
        cleaned.push(node)
      }
    }
    await act(async () =>
      root.render(
        createElement(
          Dialog,
          null,
          createElement(DialogTrigger, { ref: triggerRef, render }, 'Edit'),
          createElement(DialogClose, { ref: closeRef, render }, 'Close')
        )
      )
    )
    const trigger = host.querySelector('[data-slot~="dialog-trigger"]')
    const close = host.querySelector('[data-slot~="dialog-close"]')
    assert.equal(triggerRef.current, trigger)
    assert.deepEqual(attached, [close])
    await act(async () => root.unmount())
    assert.equal(triggerRef.current, null)
    assert.deepEqual(attached, [close], 'a returned cleanup replaces the null callback')
    assert.deepEqual(cleaned, [close])
    host.remove()
  }
})

test('action replacements receive native props and preserve explicit Button adaptation', () => {
  let resolved
  const ref = createRef()
  const host = document.createElement('div')
  host.innerHTML = renderToString(
    createElement(
      Dialog,
      null,
      createElement(DialogTrigger, {
        variant: 'destructive',
        size: 'large',
        radius: 'full',
        iconOnly: true,
        fullWidth: true,
        pending: true,
        className: 'caller-class',
        ref,
        render: props => {
          resolved = props
          return createElement('button', props, 'Native replacement')
        }
      })
    )
  )
  assert.equal(resolved.className, 'caller-class')
  assert.equal(resolved.ref, ref)
  assert.equal(resolved['aria-busy'], true)
  assert.equal(resolved['data-slot'], 'button dialog-trigger')
  assert.equal(resolved.type, 'button')
  for (const name of ['variant', 'size', 'radius', 'iconOnly', 'fullWidth', 'pending']) {
    assert.equal(Object.hasOwn(resolved, name), false, `${name} is not a native replacement prop`)
    assert.equal(host.querySelector('button').hasAttribute(name.toLowerCase()), false)
  }

  const adapted = document.createElement('div')
  adapted.innerHTML = renderToString(
    createElement(
      Dialog,
      null,
      createElement(
        DialogClose,
        {
          variant: 'destructive',
          className: 'rounded-none',
          render: props => createElement(Button, { ...props, variant: 'outline' })
        },
        'Close'
      )
    )
  )
  const canonical = document.createElement('div')
  canonical.innerHTML = renderToString(
    createElement(Button, { variant: 'outline', className: 'rounded-none' }, 'Close')
  )
  assert.equal(
    adapted.querySelector('button').className,
    canonical.querySelector('button').className
  )
  assert.equal(adapted.querySelectorAll('button').length, 1)
  assert.equal(adapted.querySelector('button').dataset.slot, 'button dialog-close')
})

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
  const trigger = host.querySelector('[data-slot~="dialog-trigger"]')
  const dialog = host.querySelector('dialog')
  assert.equal(dialog.hasAttribute('open'), false)
  assert.equal(trigger.getAttribute('aria-expanded'), 'false')
  assert.equal(trigger.getAttribute('aria-controls'), dialog.id)

  await act(async () => trigger.click())
  assert.equal(dialog.hasAttribute('open'), true)
  assert.equal(trigger.getAttribute('aria-expanded'), 'true')

  await act(async () => host.querySelector('[data-slot~="dialog-close"]').click())
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

  await act(async () => host.querySelector('[data-slot~="dialog-trigger"]').click())
  const closeEvent = new dom.window.Event('close', { bubbles: true })
  // The native browser removes open before delivering close.
  dialog.removeAttribute('open')
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
  await act(async () => host.querySelector('[data-slot~="dialog-trigger"]').click())
  assert.equal(inner.hasAttribute('open'), true)
  await act(async () => {
    inner.removeAttribute('open')
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
