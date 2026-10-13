import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

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

test('the customization entry generates library and application utilities once without a reset', () => {
  const manifestURL = new URL(import.meta.resolve('@tailwindcss/cli/package.json'))
  const manifest = JSON.parse(readFileSync(manifestURL, 'utf8'))
  const cli = fileURLToPath(new URL(manifest.bin.tailwindcss, manifestURL))
  const css = execFileSync(process.execPath, [cli, '--input', '-', '--minify'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    encoding: 'utf8',
    input: `@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities) source(none);
@import '@cognitap/radiant/tailwind.css';
@source inline('rounded-full px-8 hover:bg-red-500');`
  })

  assert.match(css, /--color-primary:/)
  for (const selector of [
    '.bg-primary{',
    '.disabled\\:bg-disabled:disabled{',
    '.rounded-full{',
    '.px-8{',
    '.hover\\:bg-red-500:hover{'
  ]) {
    assert.equal(css.split(selector).length - 1, 1, `Expected one generated ${selector}`)
  }
  assert.doesNotMatch(css, /@(import|theme|source|tailwind)\b/)
  assert.doesNotMatch(css, /h1,h2,h3/)
})
