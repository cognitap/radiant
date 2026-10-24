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
const { hydrateRoot, createRoot } = await import('react-dom/client')
const { renderToString } = await import('react-dom/server')
const { Field } = await import('../dist/library/index.js')

function fieldElement(error) {
  return createElement(
    Field,
    { label: 'Email', description: 'Work address', error, required: true },
    createElement('input', { name: 'email', type: 'email' })
  )
}

function DynamicField() {
  const [error, setError] = useState(undefined)
  return createElement(
    'div',
    null,
    fieldElement(error),
    createElement(
      'button',
      { type: 'button', onClick: () => setError('Enter an email.') },
      'Show error'
    )
  )
}

test('server markup hydrates and a later error keeps the control id', async () => {
  const html = renderToString(createElement(DynamicField))
  const serverId = /<input\b[^>]*\sid="([^"]+)"/.exec(html)?.[1]
  assert.ok(serverId)
  assert.doesNotMatch(html, /aria-invalid/)

  const root = document.getElementById('root')
  root.innerHTML = html
  const recoverable = []
  await act(async () => {
    hydrateRoot(root, createElement(DynamicField), {
      onRecoverableError(error) {
        recoverable.push(String(error))
      }
    })
  })
  assert.deepEqual(recoverable, [])
  assert.equal(root.querySelector('input').id, serverId)

  await act(async () => {
    root.querySelector('button').click()
  })
  const input = root.querySelector('input')
  assert.equal(input.id, serverId)
  assert.equal(input.getAttribute('aria-invalid'), 'true')
  assert.equal(input.getAttribute('aria-describedby').split(' ').length, 2)
  assert.equal(root.querySelector('[data-slot="field-error"]').textContent, 'Enter an email.')
})

test('a native form submit owns the error and leaves the control id stable', async () => {
  function Harness() {
    const [error, setError] = useState(undefined)
    return createElement(
      'form',
      {
        onSubmit(event) {
          event.preventDefault()
          const email = new dom.window.FormData(event.currentTarget).get('email')
          setError(typeof email === 'string' && email.trim() ? undefined : 'Enter an email.')
        }
      },
      createElement(
        Field,
        { label: 'Email', error, required: true },
        createElement('input', { name: 'email', type: 'email' })
      ),
      createElement('button', { type: 'submit' }, 'Save')
    )
  }

  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  await act(async () => {
    root.render(createElement(Harness))
  })
  const id = host.querySelector('input').id
  host.querySelector('input').value = ''
  const submit = () =>
    host
      .querySelector('form')
      .dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }))
  await act(async () => {
    submit()
  })
  const invalid = host.querySelector('input')
  assert.equal(invalid.id, id)
  assert.equal(invalid.getAttribute('aria-invalid'), 'true')
  assert.equal(host.querySelector('[data-slot="field-error"]')?.textContent, 'Enter an email.')

  invalid.value = 'ada@example.com'
  await act(async () => {
    submit()
  })
  const recovered = host.querySelector('input')
  assert.equal(recovered.id, id)
  assert.equal(recovered.getAttribute('aria-invalid'), null)
  assert.equal(host.querySelector('[data-slot="field-error"]'), null)
  root.unmount()
})
