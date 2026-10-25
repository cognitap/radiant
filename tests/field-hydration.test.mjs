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

const { act, createElement, createRef, useState } = await import('react')
const { hydrateRoot, createRoot } = await import('react-dom/client')
const { renderToString } = await import('react-dom/server')
const { Field } = await import('../dist/library/index.js')

function fieldElement(error) {
  return createElement(
    Field,
    { label: 'Email', description: 'Work address', error, required: true },
    control => createElement('input', { ...control, name: 'email', type: 'email' })
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
  let hydrated
  await act(async () => {
    hydrated = hydrateRoot(root, createElement(DynamicField), {
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
  await act(async () => hydrated.unmount())
})

test('native form validation preserves explicit control IDs and both Field host refs', async () => {
  const controlRef = createRef()
  const groupRef = createRef()
  const inputRef = createRef()
  function Harness() {
    const [error, setError] = useState(undefined)
    return createElement(
      'form',
      {
        id: 'profile',
        onSubmit(event) {
          event.preventDefault()
          const email = new dom.window.FormData(event.currentTarget).get('email')
          setError(typeof email === 'string' && email.trim() ? undefined : 'Enter an email.')
        }
      },
      createElement(
        Field,
        {
          layout: 'group',
          label: 'Profile',
          ref: groupRef,
          form: 'profile',
          name: 'profile-fields'
        },
        createElement(
          Field,
          { label: 'Email', error, required: true, controlId: 'email', ref: controlRef },
          control =>
            createElement('input', { ...control, ref: inputRef, name: 'email', type: 'email' })
        )
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
  assert.equal(controlRef.current.tagName, 'DIV')
  assert.equal(groupRef.current.tagName, 'FIELDSET')
  assert.equal(groupRef.current.form, host.querySelector('form'))
  assert.equal(groupRef.current.name, 'profile-fields')
  assert.equal(inputRef.current, host.querySelector('input'))
  const id = host.querySelector('input').id
  assert.equal(id, 'email')
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
  await act(async () => root.unmount())
  assert.equal(controlRef.current, null)
  assert.equal(groupRef.current, null)
  assert.equal(inputRef.current, null)
  host.remove()
})
