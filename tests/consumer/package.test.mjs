import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Button } from '@cognitap/radiant'

const root = new URL('node_modules/@cognitap/radiant/', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'))
const require = createRequire(import.meta.url)

test('public JavaScript imports and renders on the server', () => {
  const html = renderToStaticMarkup(createElement(Button, { disabled: true }, 'Save'))
  assert.match(html, /^<button\b[^>]*\stype="button"/)
  assert.match(html, /disabled=""/)
  assert.match(html, />Save<\/button>/)
})

test('an omitted type stays button when formAction is set', () => {
  const html = renderToStaticMarkup(createElement(Button, { formAction: '/publish' }, 'Publish'))
  assert.match(html, /\stype="button"/)
  assert.match(html, /formAction="\/publish"/)
  assert.match(html, />Publish<\/button>/)
})

test('an explicit type submit stays submit', () => {
  const html = renderToStaticMarkup(createElement(Button, { type: 'submit' }, 'Save'))
  assert.match(html, /\stype="submit"/)
  assert.match(html, />Save<\/button>/)
})

test('rounded-full replaces rounded-control on the class attribute', () => {
  const html = renderToStaticMarkup(createElement(Button, { className: 'rounded-full' }, 'Save'))
  const classAttribute = / class="([^"]*)"/.exec(html)?.[1] ?? ''
  assert.match(classAttribute, /\brounded-full\b/)
  assert.doesNotMatch(classAttribute, /\brounded-control\b/)
  assert.match(html, />Save<\/button>/)
})

test('public JavaScript and declaration maps point to shipped sources', () => {
  for (const artifact of Object.values(manifest.exports['.'])) {
    assert.ok(existsSync(new URL(artifact, root)), `Missing public artifact: ${artifact}`)
    const mapURL = new URL(`${artifact}.map`, root)
    const map = JSON.parse(readFileSync(mapURL, 'utf8'))
    for (const source of map.sources) {
      assert.ok(
        existsSync(new URL(`${map.sourceRoot ?? ''}${source}`, mapURL)),
        `Missing mapped source: ${source}`
      )
    }
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

test('the installed package declares shared React and needs no Tailwind', () => {
  const libraryRequire = createRequire(import.meta.resolve('@cognitap/radiant'))
  assert.equal(typeof manifest.peerDependencies?.react, 'string')
  assert.equal(libraryRequire.resolve('react'), require.resolve('react'))
  assert.equal(manifest.peerDependenciesMeta?.tailwindcss?.optional, true)
  assert.throws(() => require.resolve('tailwindcss'), { code: 'MODULE_NOT_FOUND' })
})

test('the archive includes MIT licensing and public documentation', () => {
  assert.equal(manifest.name, '@cognitap/radiant')
  assert.equal(manifest.license, 'MIT')
  assert.match(readFileSync(new URL('LICENSE', root), 'utf8'), /MIT License[\s\S]*Cserei Zoltán/)
  for (const file of ['README.md', 'CHANGELOG.md', 'RELEASE_POLICY.md']) {
    assert.ok(readFileSync(new URL(file, root), 'utf8').trim().length > 0, file)
  }
})
