import assert from 'node:assert/strict'
import { readFileSync, realpathSync, readdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { App } from './App.mjs'

const require = createRequire(import.meta.url)
const entry = require.resolve('@cognitap/radiant')
const installed = new URL('./node_modules/@cognitap/radiant/', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('package.json', installed), 'utf8'))
assert.equal(manifest.license, 'MIT')
assert.equal(manifest.peerDependenciesMeta.tailwindcss.optional, true)
assert.ok(manifest.peerDependencies.react)
assert.ok(manifest.dependencies.cn)
assert.match(readFileSync(new URL('LICENSE', installed), 'utf8'), /Zoltán Cserei/)
for (const file of ['README.md', 'CHANGELOG.md', 'RELEASE_POLICY.md']) {
  assert.ok(readFileSync(new URL(file, installed), 'utf8').length > 0)
}
for (const target of [
  ...Object.values(manifest.exports['.']),
  ...Object.values(manifest.exports).filter(value => typeof value === 'string')
]) {
  assert.ok(readFileSync(new URL(target, installed)).length > 0, target)
}
for (const file of readdirSync(installed, { recursive: true })) {
  assert.doesNotMatch(
    file,
    /(^|\/)(tests|node_modules|\.storybook|storybook)(\/|$)|\.(test|stories)\./
  )
  if (file.startsWith('dist/library/') && (file.endsWith('.js') || file.endsWith('.d.ts'))) {
    const mapURL = new URL(`${file}.map`, installed)
    const map = JSON.parse(readFileSync(mapURL, 'utf8'))
    for (const source of map.sources) {
      assert.ok(readFileSync(new URL(source, mapURL)).length > 0, source)
    }
  }
}
// Resolution from the installed library and consumer must select one React.
const libraryRequire = createRequire(entry)
assert.equal(realpathSync(libraryRequire.resolve('react')), realpathSync(require.resolve('react')))
assert.ok(libraryRequire.resolve('cn'))
assert.throws(() => require.resolve('tailwindcss'), { code: 'MODULE_NOT_FOUND' })
for (const path of ['src/Button.tsx', 'dist/library/Button.js', 'package.json']) {
  assert.throws(() => require.resolve(`@cognitap/radiant/${path}`), {
    code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'
  })
}
// Render the installed JavaScript directly in Node, without a DOM or source loader.
const html = renderToString(createElement(App))
assert.match(html, /type="button"/)
assert.match(html, /disabled=""/)
assert.match(html, /aria-label="Save"/)
const template = new URL('index.html', import.meta.url)
writeFileSync(template, readFileSync(template, 'utf8').replace('<!--ssr-->', html))
console.log(`Installed @cognitap/radiant@${manifest.version}: archive, peers and SSR passed`)
