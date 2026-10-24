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
const { Link } = await import('../dist/library/index.js')
const mounted = []

afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
})

test('native and adapted Link protect resolved identity and presentation attributes', () => {
  for (const render of [undefined, props => h('a', props)]) {
    const host = document.createElement('div')
    host.innerHTML = renderToStaticMarkup(
      h(
        Link,
        {
          href: '/guide',
          variant: 'outline',
          tone: 'danger',
          controlSize: 'small',
          render,
          'data-slot': 'pretend-button',
          'data-variant': 'primary',
          'data-tone': 'ghost',
          'data-control-size': 'default',
          'data-consumer': 'retained'
        },
        'Guide'
      )
    )
    const anchor = host.querySelector('a')
    assert.equal(anchor.dataset.slot, 'link')
    assert.equal(anchor.dataset.variant, 'outline')
    assert.equal(anchor.dataset.tone, 'danger')
    assert.equal(anchor.dataset.controlSize, 'small')
    assert.equal(anchor.dataset.consumer, 'retained')
  }
})

test('router adapters receive fully resolved native props and the same presentation', () => {
  const ref = createRef()
  const onClick = () => {}
  const style = { color: 'rebeccapurple', '--rad-button-radius': '1rem' }
  for (const variant of ['inline', 'subtle', 'solid', 'soft', 'outline', 'ghost']) {
    let resolved
    const props = {
      href: '/guide',
      variant,
      tone: 'warning',
      controlSize: 'large',
      external: true,
      download: 'guide.txt',
      ref,
      onClick,
      style,
      className: 'rounded-full',
      'aria-describedby': 'help',
      id: 'guide-link'
    }
    const native = renderToStaticMarkup(h(Link, props, 'Guide'))
    const adapted = renderToStaticMarkup(
      h(
        Link,
        {
          ...props,
          render: anchorProps => {
            resolved = anchorProps
            return h('a', anchorProps)
          }
        },
        'Guide'
      )
    )
    assert.equal(adapted, native)
    assert.equal(resolved.ref, ref)
    assert.equal(resolved.onClick, onClick)
    assert.equal(resolved.style, style)
    assert.equal(resolved.children, 'Guide')
    assert.equal(resolved.target, '_blank')
    assert.equal(resolved.rel, 'noopener noreferrer')
    for (const name of ['variant', 'tone', 'controlSize', 'external', 'render']) {
      assert.equal(Object.hasOwn(resolved, name), false, `${name} is consumed before adaptation`)
    }
  }
})

test('Link replacements return one compatible element', () => {
  for (const render of [
    () => null,
    () => 'Guide',
    () => [h('a', { key: 'a', href: '/guide' })],
    () => h(Fragment, null, h('a', { href: '/guide' })),
    () => h('button', null, 'Guide')
  ]) {
    assert.throws(() => renderToStaticMarkup(h(Link, { render })), /Link.*render.*anchor/i)
  }
})

test('default and router Link refs reach one real anchor and preserve React cleanup', async () => {
  function RouterAnchor(props) {
    return h('a', { ...props, 'data-router': '' })
  }
  for (const render of [undefined, props => h(RouterAnchor, props)]) {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    mounted.push({ root, host })
    const attached = []
    const cleaned = []
    const ref = anchor => {
      attached.push(anchor)
      return () => cleaned.push(anchor)
    }
    const tree = title => h(Link, { href: '#guide', render, ref, title }, 'Guide')
    await act(async () => root.render(tree('Original')))
    const anchor = host.querySelector('a')
    assert.deepEqual(attached, [anchor])
    assert.equal(host.querySelectorAll('a').length, 1)
    await act(async () => root.render(tree('Updated')))
    assert.deepEqual(attached, [anchor])
    assert.deepEqual(cleaned, [])
    const nextRef = createRef()
    await act(async () => root.render(h(Link, { href: '#guide', render, ref: nextRef }, 'Guide')))
    assert.deepEqual(cleaned, [anchor])
    assert.equal(nextRef.current, anchor)
    await act(async () => root.render(null))
    assert.equal(nextRef.current, null)
  }
})
