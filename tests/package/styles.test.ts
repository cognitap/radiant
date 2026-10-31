import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

function packageRoot() {
  let dir = dirname(fileURLToPath(import.meta.url))
  while (true) {
    const manifestPath = join(dir, 'package.json')
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { name?: string }
      if (manifest.name === '@cognitap/radiant') return dir
    }
    if (existsSync(join(dir, 'node_modules/@cognitap/radiant'))) return dir
    const parent = dirname(dir)
    if (parent === dir) throw new Error('Could not find the Radiant package')
    dir = parent
  }
}

function readExport(name: string) {
  return readFileSync(require.resolve(`@cognitap/radiant/${name}`), 'utf8')
}

function tailwind(input: string) {
  const manifestURL = new URL(import.meta.resolve('@tailwindcss/cli/package.json'))
  const manifest = JSON.parse(readFileSync(manifestURL, 'utf8')) as { bin: { tailwindcss: string } }
  const cli = fileURLToPath(new URL(manifest.bin.tailwindcss, manifestURL))
  return execFileSync(process.execPath, [cli, '--input', '-'], {
    cwd: packageRoot(),
    encoding: 'utf8',
    input
  })
}

test('the customization entry generates library and application utilities once without a reset', () => {
  const css = tailwind(`@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities) source(none);
@import '@cognitap/radiant/tailwind.css';
@source inline('px-8');`)

  assert.match(css, /--rad-color-accent\s*:/)
  assert.doesNotMatch(
    css,
    /--(?:color-primary|color-background|radius-control|ease-spring|ease-snap|ease-settle)\s*:/
  )
  for (const selector of [/\.bg-\\\(--_btn-fill\\\)(?=\s*[{,])/g, /\.px-8(?=\s*[{,])/g]) {
    assert.equal(css.match(selector)?.length, 1, `Expected one generated ${selector}`)
  }
  assert.doesNotMatch(css, /@(import|theme|source|tailwind)\b/)
  assert.doesNotMatch(css, /(?:^|[{}])\s*h1\s*,\s*h2\s*,\s*h3\b/)
  assert.match(css, /@layer\b/)
})

test('the four public CSS routes compile to self-contained text', () => {
  const styles = readExport('styles.css')
  const reset = readExport('reset.css')
  for (const css of [styles, reset]) {
    assert.doesNotMatch(css, /@(import|theme|source|tailwind)\b/)
  }
  assert.match(styles, /--rad-color-accent\s*:/)
  assert.match(reset, /h1\s*,\s*h2\s*,\s*h3\b/)
  for (const input of [
    "@import '@cognitap/radiant/reset.css';\n@import '@cognitap/radiant/styles.css';\n",
    "@import 'tailwindcss';\n@import '@cognitap/radiant/tailwind.css';\n",
    `@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities);
@import '@cognitap/radiant/tailwind.css';
`
  ]) {
    const css = tailwind(input)
    assert.doesNotMatch(css, /@(import|theme|source|tailwind)\b/)
    assert.match(css, /@layer\b/)
  }
  assert.match(tailwind("@import '@cognitap/radiant/styles.css';\n"), /--rad-color-accent\s*:/)
})

test('the compiled stylesheet includes focus, disabled, and forced-colors rules', () => {
  const css = readExport('styles.css')

  assert.match(
    css,
    /:focus-visible\s*\{[^}]*outline-color:\s*var\(--rad-button-focus-color,var\(--rad-color-focus/
  )
  assert.match(
    css,
    /:disabled\s*\{[^}]*opacity:\s*var\(--_rad-disabled-opacity,var\(--rad-button-disabled-opacity/
  )
  // Anchors share action styles but match neither :enabled nor :disabled.
  assert.match(css, /:not\(:disabled\):not\(\[aria-busy=true\]\):hover/)
  assert.match(css, /--_btn-pe:\s*var\(--rad-button-press-ease/)
  assert.match(css, /:active\s*\{[^}]*transition-timing-function:\s*var\(--_btn-pe\)/)
  assert.doesNotMatch(
    css,
    /--(?:color-primary|color-background|radius-control|ease-spring|ease-snap|ease-settle)\s*:/
  )
  assert.match(css, /--rad-field-gap/)
  assert.match(css, /--rad-input-height/)
  assert.match(css, /--rad-checkbox-size/)
  assert.match(css, /--rad-radio-size/)
  assert.match(css, /--rad-dialog-width/)
  assert.match(css, /--rad-collapsible-radius/)
  assert.match(css, /--rad-accordion-gap/)
  assert.match(css, /--rad-card-radius/)
  const pressScale = css.match(/([^{}]*)\{scale:var\(--rad-button-press-scale/g) ?? []
  assert.equal(pressScale.length, 1, 'Expected one press scale rule')
  assert.match(pressScale[0], /motion-safe/)
  const motionSafe = css.indexOf('@media (prefers-reduced-motion:no-preference)')
  assert.ok(motionSafe > 0 && motionSafe < css.indexOf(pressScale[0]))
  assert.match(
    css,
    /@media\s*\(\s*forced-colors:\s*active\s*\)\s*\{[\s\S]*border-color:\s*buttontext[\s\S]*:disabled\s*\{[^}]*border-color:\s*graytext[\s\S]*:disabled\s*\{[^}]*color:\s*graytext/i
  )
})
