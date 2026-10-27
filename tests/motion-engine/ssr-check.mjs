import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { App } from './ssr.mjs'
assert.equal(typeof window, 'undefined')
const html = renderToString(createElement(App))
assert.match(html, /Spring engine suitability proof/)
assert.match(html, /<details/)
assert.match(html, /<dialog/)
console.log('SSR import/render passed without window/document globals.')
