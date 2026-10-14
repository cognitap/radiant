import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Button } from '@cognitap/radiant'

test('public JavaScript imports and renders on the server', () => {
  const html = renderToStaticMarkup(createElement(Button, { disabled: true }, 'Save'))
  assert.match(html, /^<button\b[^>]*\stype="button"/)
  assert.match(html, /disabled=""/)
  assert.match(html, />Save<\/button>/)
})

test('public JavaScript and declaration exports have source maps', () => {
  const root = new URL('../../', import.meta.resolve('@cognitap/radiant'))
  const manifest = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'))
  for (const artifact of Object.values(manifest.exports['.'])) {
    assert.ok(existsSync(new URL(artifact, root)), `Missing public artifact: ${artifact}`)
    assert.ok(existsSync(new URL(`${artifact}.map`, root)), `Missing source map: ${artifact}`)
  }
})

test('exports reject implementation deep imports', async () => {
  for (const path of ['src/Button.tsx', 'dist/library/Button.js', 'cn', 'package.json']) {
    await assert.rejects(import(`@cognitap/radiant/${path}`), {
      code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'
    })
  }
})

test('default styles and the optional reset are compiled and self-contained', () => {
  const readExport = name =>
    readFileSync(new URL(import.meta.resolve(`@cognitap/radiant/${name}`)), 'utf8')
  for (const name of ['styles.css', 'reset.css']) {
    assert.doesNotMatch(readExport(name), /@(import|theme|source|tailwind)\b/)
  }
  const styles = readExport('styles.css')
  assert.match(styles, /--color-primary\s*:/)
  assert.match(styles, /\.bg-primary(?=\s*[{,])/)
  assert.doesNotMatch(styles, /h1\s*,\s*h2\s*,\s*h3\b/)
  assert.match(readExport('reset.css'), /h1\s*,\s*h2\s*,\s*h3\b/)
})
