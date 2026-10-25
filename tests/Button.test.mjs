import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
for (const key of ['window', 'document', 'HTMLElement', 'Node', 'Element', 'MutationObserver']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const { act, createElement: h, createRef, Fragment } = await import('react')
const { createRoot } = await import('react-dom/client')
const { renderToStaticMarkup } = await import('react-dom/server')
const { Button, Dialog, DialogTrigger, DialogClose } = await import('../dist/library/index.js')
const mounted = []
afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
})

test('Button owns fully resolved native replacement props and pending presentation', () => {
  const ref = createRef()
  const style = { borderRadius: '12px' }
  for (const variant of ['solid', 'soft', 'outline', 'ghost']) {
    for (const pending of [false, true]) {
      let resolved
      const props = {
        variant,
        tone: 'danger',
        controlSize: 'small',
        pending,
        iconOnly: true,
        fullWidth: true,
        ref,
        style,
        className: 'rounded-none',
        'aria-busy': false,
        'data-variant': 'forged',
        'data-tone': 'forged',
        'data-control-size': 'forged'
      }
      const canonical = renderToStaticMarkup(h(Button, props, 'Save'))
      const adapted = renderToStaticMarkup(
        h(
          Button,
          {
            ...props,
            render: nativeProps => {
              resolved = nativeProps
              return h('button', nativeProps)
            }
          },
          'Save'
        )
      )
      assert.ok(resolved, 'Button invokes its own replacement callback')
      assert.equal(adapted, canonical)
      assert.equal(resolved.ref, ref)
      assert.equal(resolved.style, style)
      assert.equal(resolved['data-slot'], 'button')
      assert.equal(resolved['data-variant'], variant)
      assert.equal(resolved['data-tone'], 'danger')
      assert.equal(resolved['data-control-size'], 'small')
      assert.equal(resolved['aria-busy'], pending || false)
      assert.equal(resolved.type, 'button')
      for (const key of [
        'render',
        'variant',
        'tone',
        'controlSize',
        'iconOnly',
        'fullWidth',
        'pending'
      ]) {
        assert.equal(Object.hasOwn(resolved, key), false, `${key} is consumed by Button`)
      }
    }
  }
})

test('Button owns compatible-host validation for itself and composed Dialog actions', () => {
  for (const Action of [Button, DialogTrigger, DialogClose]) {
    for (const render of [
      () => null,
      () => 'Save',
      () => [h('button', { key: 'a' })],
      () => h(Fragment, null, h('button')),
      () => h('a'),
      () => h('div')
    ]) {
      const element = h(Action, { render }, 'Save')
      assert.throws(
        () => renderToStaticMarkup(Action === Button ? element : h(Dialog, null, element)),
        /Button render must return one button/
      )
    }
  }
})

test('Button custom hosts keep the real ref stable and preserve callback cleanup', async () => {
  function ConsumerButton(props) {
    return h('button', { ...props, 'data-adapter': 'consumer' })
  }
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  mounted.push({ root, host })
  const attached = []
  const cleaned = []
  const ref = node => {
    attached.push(node)
    return () => cleaned.push(node)
  }
  const render = props => h(ConsumerButton, props)
  const tree = pending => h(Button, { ref, render, pending }, 'Save')
  await act(async () => root.render(tree(false)))
  const button = host.querySelector('button')
  assert.equal(button.dataset.adapter, 'consumer')
  assert.deepEqual(attached, [button])
  await act(async () => root.render(tree(true)))
  assert.equal(host.querySelector('button'), button)
  assert.equal(button.getAttribute('aria-busy'), 'true')
  assert.deepEqual(attached, [button])
  assert.deepEqual(cleaned, [])
  const objectRef = createRef()
  await act(async () => root.render(h(Button, { ref: objectRef, render }, 'Save')))
  assert.deepEqual(cleaned, [button])
  assert.equal(objectRef.current, button)
  await act(async () => root.render(null))
  assert.equal(objectRef.current, null)
  assert.deepEqual(attached, [button], 'cleanup replaces the null callback')
})
