import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

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
  for (const selector of [/\.bg-\\\(--_btn-bg\\\)(?=\s*[{,])/g, /\.px-8(?=\s*[{,])/g]) {
    assert.equal(css.match(selector)?.length, 1, `Expected one generated ${selector}`)
  }
  assert.doesNotMatch(css, /@(import|theme|source|tailwind)\b/)
  assert.doesNotMatch(css, /h1\s*,\s*h2\s*,\s*h3\b/)
})

test('the compiled stylesheet includes focus, disabled, and forced-colors rules', () => {
  const css = readFileSync(new URL('../dist/library/styles.css', import.meta.url), 'utf8')

  assert.match(css, /:focus-visible\s*\{[^}]*outline-color:\s*var\(\s*--color-focus\s*\)/)
  assert.match(css, /:disabled\s*\{[^}]*opacity:\s*var\(--button-disabled-opacity/)
  assert.match(css, /:enabled:not\(\[aria-busy=true\]\):hover/)
  assert.match(css, /--_btn-pe:\s*var\(--button-press-ease/)
  assert.match(css, /:active\s*\{[^}]*transition-timing-function:\s*var\(--_btn-pe\)/)
  assert.match(css, /--ease-spring:\s*linear\(/)
  assert.match(
    css,
    /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*\{[^@]*--button-press-scale/
  )
  assert.match(css, /@property --_btn-angle/)
  assert.match(
    css,
    /@media\s*\(\s*forced-colors:\s*active\s*\)\s*\{[\s\S]*border-color:\s*buttontext[\s\S]*:disabled\s*\{[^}]*border-color:\s*graytext[\s\S]*:disabled\s*\{[^}]*color:\s*graytext/i
  )
})
