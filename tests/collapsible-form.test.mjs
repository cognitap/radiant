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
  'HTMLDetailsElement',
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
const { Collapsible, CollapsibleContent, CollapsibleTrigger, useCollapsible } =
  await import('../dist/library/index.js')

function mount() {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  return { host, root }
}

function section(props = {}, content = 'Ships in two days.') {
  return createElement(
    Collapsible,
    props,
    createElement(CollapsibleTrigger, null, 'Shipping'),
    createElement(
      CollapsibleContent,
      null,
      content,
      createElement('button', { type: 'button' }, 'Track')
    )
  )
}

function toggle(details, next) {
  const opened = details.hasAttribute('open')
  const before = new dom.window.Event('beforetoggle', { bubbles: true, cancelable: true })
  before.oldState = opened ? 'open' : 'closed'
  before.newState = next ? 'open' : 'closed'
  details.dispatchEvent(before)
  if (before.defaultPrevented) return before
  if (next) details.setAttribute('open', '')
  else details.removeAttribute('open')
  const after = new dom.window.Event('toggle', { bubbles: true })
  after.oldState = before.oldState
  after.newState = before.newState
  details.dispatchEvent(after)
  return before
}

test('an open and a closed disclosure hydrate from the open attribute', async () => {
  const closed = renderToString(section())
  const opened = renderToString(section({ defaultOpen: true }))
  const closedTag = /<details\b[^>]*>/.exec(closed)?.[0] ?? ''
  const openedTag = /<details\b[^>]*>/.exec(opened)?.[0] ?? ''
  assert.doesNotMatch(closedTag, /\sopen(?:=|\s|>)/)
  assert.match(openedTag, /\sopen=""/)
  assert.match(closed, /<summary\b/)
  assert.match(closed, /data-state="closed"/)
  assert.match(opened, /data-state="open"/)

  const host = document.getElementById('root')
  host.innerHTML = opened
  const recoverable = []
  let hydrated
  await act(async () => {
    hydrated = hydrateRoot(host, section({ defaultOpen: true }), {
      onRecoverableError(error) {
        recoverable.push(String(error))
      }
    })
  })
  assert.deepEqual(recoverable, [])
  assert.equal(host.querySelector('details').open, true)
  await act(async () => hydrated.unmount())
})

test('opening a disclosure updates its state', async () => {
  const seen = { open: false }
  const { host, root } = mount()
  await act(async () =>
    root.render(
      section({
        onOpenChange(next) {
          seen.open = next
        }
      })
    )
  )
  const details = host.querySelector('details')
  assert.equal(details.open, false)
  await act(async () => host.querySelector('summary').click())
  if (!details.open) await act(async () => toggle(details, true))
  assert.equal(details.open, true)
  assert.equal(seen.open, true)
  assert.equal(host.querySelector('[data-slot="collapsible"]').getAttribute('data-state'), 'open')
  await act(async () => root.unmount())
})

test('a controlled disclosure stays closed when open stays false', async () => {
  const seen = { open: false }
  const { host, root } = mount()
  await act(async () =>
    root.render(
      section({
        open: false,
        onOpenChange(next) {
          seen.open = next
        }
      })
    )
  )
  const details = host.querySelector('details')
  await act(async () => host.querySelector('summary').click())
  assert.equal(seen.open, true)
  assert.equal(details.open, false)
  await act(async () => root.unmount())
})

test('a nested disclosure does not toggle its parent', async () => {
  function Nested() {
    const [outer, setOuter] = useState(true)
    return createElement(
      Collapsible,
      { open: outer, onOpenChange: setOuter },
      createElement(CollapsibleTrigger, null, 'Account'),
      createElement(
        CollapsibleContent,
        null,
        createElement(
          Collapsible,
          null,
          createElement(CollapsibleTrigger, null, 'Password'),
          createElement(CollapsibleContent, null, 'Use at least 10 characters.')
        )
      )
    )
  }

  const { host, root } = mount()
  await act(async () => root.render(createElement(Nested)))
  const [outer, inner] = host.querySelectorAll('details')
  assert.equal(outer.open, true)
  await act(async () => toggle(inner, true))
  assert.equal(inner.open, true)
  assert.equal(outer.open, true)
  await act(async () => root.unmount())
})

test('closed disclosure fields stay in the ancestor form', async () => {
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
      createElement(
        Collapsible,
        null,
        createElement(CollapsibleTrigger, null, 'Note'),
        createElement(
          CollapsibleContent,
          null,
          createElement('input', { name: 'note', defaultValue: 'hello' })
        )
      )
    )
  }

  const { host, root } = mount()
  await act(async () => root.render(createElement(Host)))
  const details = host.querySelector('details')
  assert.equal(details.open, false)
  assert.equal(details.closest('form'), host.querySelector('form'))
  await act(async () => {
    host
      .querySelector('form')
      .dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }))
  })
  assert.equal(seen.note, 'hello')
  await act(async () => root.unmount())
})

test('useCollapsible can open the disclosure', async () => {
  function Custom() {
    const collapsible = useCollapsible()
    return createElement(
      'button',
      { type: 'button', onClick: () => collapsible?.setOpen(true) },
      'Custom'
    )
  }
  const { host, root } = mount()
  await act(async () =>
    root.render(
      createElement(
        Collapsible,
        null,
        createElement(Custom),
        createElement(CollapsibleTrigger, null, 'Shipping'),
        createElement(CollapsibleContent, null, 'Ships in two days.')
      )
    )
  )
  await act(async () => host.querySelector('button').click())
  assert.equal(host.querySelector('details').open, true)
  await act(async () => root.unmount())
})
