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

const { act, createElement, createRef, Fragment, useState } = await import('react')
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
  for (const presentation of [{}, { variant: 'outline', controlSize: 'small', pending: true }]) {
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
  for (const Action of [Button, DialogTrigger, DialogClose]) {
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
        assert.deepEqual(requests, Action === Button ? [] : [!initiallyOpen])
        assert.equal(dialog.hasAttribute('open'), Action === Button ? false : !initiallyOpen)
        assert.equal(submits, 1, 'an explicit submit type retains native form behavior')
      } finally {
        await act(async () => root.unmount())
        host.remove()
      }
    }
  }
})

test('Button and composed action refs survive rerenders, ref changes and callback cleanup', async () => {
  function ConsumerButton(props) {
    return createElement('button', props)
  }
  for (const Action of [Button, DialogTrigger, DialogClose]) {
    for (const render of [undefined, props => createElement(ConsumerButton, props)]) {
      const { host, root } = mount()
      const attached = []
      const cleaned = []
      const ref = node => {
        attached.push(node)
        return () => cleaned.push(node)
      }
      const tree = props =>
        createElement(Dialog, null, createElement(Action, { ref, render, ...props }, 'Action'))
      await act(async () => root.render(tree({})))
      const button = host.querySelector('button')
      await act(async () => root.render(tree({ pending: true })))
      assert.equal(host.querySelector('button'), button)
      assert.deepEqual(attached, [button])
      assert.deepEqual(cleaned, [])
      const objectRef = createRef()
      await act(async () => root.render(tree({ ref: objectRef })))
      assert.equal(objectRef.current, button)
      assert.deepEqual(cleaned, [button])
      await act(async () => root.unmount())
      assert.equal(objectRef.current, null)
      assert.deepEqual(attached, [button], 'returned cleanup replaces the null callback')
      host.remove()
    }
  }
})

test('Button resolves presentation once and protects native props through Dialog composition', () => {
  const ref = createRef()
  const style = { borderRadius: '12px' }
  const presentation = {
    variant: 'outline',
    tone: 'danger',
    controlSize: 'large',
    pending: true,
    iconOnly: true,
    fullWidth: true,
    className: 'rounded-none',
    style
  }
  const reference = document.createElement('div')
  reference.innerHTML = renderToString(createElement(Button, presentation, 'Action'))
  const canonical = reference.querySelector('button')
  for (const [Action, slot] of [
    [Button, 'button caller'],
    [DialogTrigger, 'button dialog-trigger'],
    [DialogClose, 'button dialog-close']
  ]) {
    let resolved
    const host = document.createElement('div')
    host.innerHTML = renderToString(
      createElement(
        Dialog,
        null,
        createElement(
          Action,
          {
            ...presentation,
            ref,
            'aria-busy': false,
            'data-slot': 'caller',
            'data-variant': 'forged',
            'data-tone': 'forged',
            'data-control-size': 'forged',
            render: props => {
              resolved = props
              return createElement('button', props)
            }
          },
          'Action'
        )
      )
    )
    const action = host.querySelector('button')
    assert.ok(resolved, 'Button owns the callback, including through Dialog')
    assert.equal(action.className, canonical.className)
    assert.equal(action.innerHTML, canonical.innerHTML, 'label and pending mark are resolved once')
    assert.equal(resolved.ref, ref)
    assert.equal(resolved.style, style)
    assert.equal(action.dataset.slot, slot)
    assert.equal(action.dataset.variant, 'outline')
    assert.equal(action.dataset.tone, 'danger')
    assert.equal(action.dataset.controlSize, 'large')
    assert.equal(action.getAttribute('aria-busy'), 'true')
    assert.equal(action.type, 'button')
    assert.equal(host.querySelectorAll('button').length, 1)
    for (const key of [
      'render',
      'variant',
      'tone',
      'controlSize',
      'iconOnly',
      'fullWidth',
      'pending'
    ]) {
      assert.equal(Object.hasOwn(resolved, key), false, `${key} is consumed before replacement`)
    }
  }
})

test('Button validates replacement hosts, including composed Dialog actions', () => {
  const invalid = [
    () => null,
    () => 'Action',
    () => [createElement('button', { key: 'a' })],
    () => createElement(Fragment),
    () => createElement('a')
  ]
  for (const Action of [Button, DialogTrigger, DialogClose]) {
    for (const render of Action === Button ? invalid : [invalid[0]]) {
      assert.throws(
        () => renderToString(createElement(Dialog, null, createElement(Action, { render }))),
        /Button render must return one button/
      )
    }
  }
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
