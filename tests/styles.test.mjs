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
  assert.match(styles, /--color-primary\s*:/)
  assert.match(styles, /\.bg-primary(?=\s*[{,])/)
  assert.doesNotMatch(styles, /h1\s*,\s*h2\s*,\s*h3\b/)
  assert.match(readExport('reset.css'), /h1\s*,\s*h2\s*,\s*h3\b/)
})

test('the customization entry generates library and application utilities once without a reset', () => {
  const manifestURL = new URL(import.meta.resolve('@tailwindcss/cli/package.json'))
  const manifest = JSON.parse(readFileSync(manifestURL, 'utf8'))
  const cli = fileURLToPath(new URL(manifest.bin.tailwindcss, manifestURL))
  const css = execFileSync(process.execPath, [cli, '--input', '-'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    encoding: 'utf8',
    input: `@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities) source(none);
@import '@cognitap/radiant/tailwind.css';
@source inline('px-8');`
  })

  assert.match(css, /--color-primary\s*:/)
  for (const selector of [/\.bg-primary(?=\s*[{,])/g, /\.px-8(?=\s*[{,])/g]) {
    assert.equal(css.match(selector)?.length, 1, `Expected one generated ${selector}`)
  }
  assert.doesNotMatch(css, /@(import|theme|source|tailwind)\b/)
  assert.doesNotMatch(css, /h1\s*,\s*h2\s*,\s*h3\b/)
})
