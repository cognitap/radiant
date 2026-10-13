import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const readExport = name =>
  readFileSync(new URL(import.meta.resolve(`@cognitap/radiant/${name}`)), 'utf8')

test('default styles and the optional reset are compiled and self-contained', () => {
  for (const name of ['styles.css', 'reset.css']) {
    const css = readExport(name)
    assert.doesNotMatch(css, /@(import|theme|source|tailwind)\b/)
  }
  const styles = readExport('styles.css')
  assert.match(styles, /--color-primary:/)
  assert.match(styles, /\.bg-primary\{/)
  assert.match(styles, /\.disabled\\:bg-disabled:disabled\{/)
  assert.match(styles, /\.focus-visible\\:outline-focus:focus-visible\{/)
  assert.match(styles, /forced-colors:active/)
  assert.doesNotMatch(styles, /h1,h2,h3/)
  assert.match(readExport('reset.css'), /h1,h2,h3/)
})

test('the default build excludes story-only utilities', () => {
  const styles = readExport('styles.css')
  assert.doesNotMatch(styles, /\.rounded-full\{/)
  assert.doesNotMatch(styles, /\.px-8\{/)
  assert.doesNotMatch(styles, /\.hover\\:bg-red-500/)
})

test('the customization entry registers library sources without generating a second utility sheet', () => {
  const source = readExport('tailwind.css')
  assert.match(source, /@theme static/)
  assert.match(source, /@source '\.'/)
  assert.doesNotMatch(source, /@(import|tailwind)\b/)
})
