import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, preview, version as viteVersion } from 'vite'
import { chromium } from 'playwright'
import { browserEnvironment } from './record-browser-environment.mjs'

const output = fileURLToPath(new URL('../output/browser/installed-styles/', import.meta.url))
const rootSource = fileURLToPath(new URL('../src/', import.meta.url))
const routes = [
  { name: 'compiled', reset: false, imports: "@import '@cognitap/radiant/styles.css';" },
  {
    name: 'compiled-reset',
    reset: true,
    imports: "@import '@cognitap/radiant/reset.css';\n@import '@cognitap/radiant/styles.css';"
  },
  {
    name: 'tailwind',
    reset: true,
    imports: "@import 'tailwindcss';\n@import '@cognitap/radiant/tailwind.css';"
  },
  {
    name: 'tailwind-no-reset',
    reset: false,
    imports:
      "@layer theme, base, components, utilities;\n@import 'tailwindcss/theme.css' layer(theme);\n@import 'tailwindcss/utilities.css' layer(utilities);\n@import '@cognitap/radiant/tailwind.css';"
  }
]

export async function verifyInstalledStyles(consumer, archive, installTailwind) {
  mkdirSync(output, { recursive: true })
  const require = createRequire(path.join(consumer, 'package.json'))
  assert.throws(() => require.resolve('tailwindcss'), { code: 'MODULE_NOT_FOUND' })
  const library = realpathSync(path.join(consumer, 'node_modules/@cognitap/radiant'))
  const manifest = JSON.parse(readFileSync(path.join(library, 'package.json'), 'utf8'))
  const browser = await chromium.launch({ headless: true })
  const report = {
    ...browserEnvironment(browser),
    buildTools: { vite: viteVersion, react: require('react/package.json').version },
    package: {
      name: manifest.name,
      version: manifest.version,
      integrity: `sha512-${createHash('sha512').update(readFileSync(archive)).digest('base64')}`
    },
    fixture:
      'temporary installed archive; Vite production bundles; system fonts; no Storybook imports',
    result: 'incomplete',
    cases: []
  }
  const save = () =>
    writeFileSync(path.join(output, 'results.json'), `${JSON.stringify(report, null, 2)}\n`)
  save()
  const parity = new Map()
  let server, page, current
  try {
    for (const route of routes) {
      current = route.name
      if (route.name === 'tailwind') {
        installTailwind()
        report.buildTools.tailwindcss = require('tailwindcss/package.json').version
      }
      writeFileSync(
        path.join(consumer, 'index.html'),
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Installed styles</title></head><body data-route="${route.name}"><div id="root"></div><script type="module" src="/entry.js"></script></body></html>`
      )
      const appCSS = `.app-override{border-radius:31px;padding-inline:23px}.app-override:hover{background-color:#123456}.app-override:disabled{opacity:1}`
      writeFileSync(
        path.join(consumer, 'app.css'),
        `${route.imports}\n${route.name.startsWith('compiled') ? appCSS : ''}`
      )
      if (route.name.startsWith('tailwind')) {
        const cliManifest = require('@tailwindcss/cli/package.json')
        const cli = path.resolve(
          path.dirname(require.resolve('@tailwindcss/cli/package.json')),
          cliManifest.bin.tailwindcss
        )
        execFileSync(process.execPath, [cli, '-i', 'app.css', '-o', 'generated.css', '--minify'], {
          cwd: consumer,
          stdio: 'inherit'
        })
      }
      writeFileSync(
        path.join(consumer, 'entry.js'),
        `import './${route.name.startsWith('tailwind') ? 'generated' : 'app'}.css';\nimport './Appearance.tsx';\n`
      )
      const directory = path.join(output, route.name)
      const config = {
        root: consumer,
        configFile: false,
        logLevel: 'error',
        oxc: { jsx: { runtime: 'automatic' } },
        build: { outDir: directory, emptyOutDir: true }
      }
      const built = await build(config)
      const chunks = (Array.isArray(built) ? built : [built]).flatMap(result => result.output)
      const modules = chunks
        .filter(item => item.type === 'chunk')
        .flatMap(item => Object.keys(item.modules))
      assert.ok(
        modules.some(id => id === path.join(library, 'dist/library/Button.js')),
        `Expected installed Button in the production bundle: ${modules.filter(id => id.includes('/@cognitap/radiant/')).join(', ')}`
      )
      assert.ok(
        modules.every(id => !id.startsWith(rootSource)),
        'Production fixture must not import repository source'
      )
      const css = chunks
        .filter(item => item.type === 'asset' && item.fileName.endsWith('.css'))
        .map(item => String(item.source))
        .join('\n')
      assert.equal(
        css.match(/\.bg-\\\(--_btn-bg\\\)(?=\s*[{,])/g)?.length,
        1,
        `${route.name}: one library utility copy`
      )
      assert.doesNotMatch(css, /@(import|theme|source|tailwind)\b/)
      server = await preview({ ...config, preview: { host: '127.0.0.1', port: 0 } })
      page = await browser.newPage({
        viewport: { width: 1000, height: 1400 },
        reducedMotion: 'reduce'
      })
      const errors = []
      page.on('pageerror', error => {
        errors.push(error.message)
        report.browserErrors = errors
      })
      await page.goto(server.resolvedUrls.local[0])
      await page.getByLabel('Theme', { exact: true }).waitFor()
      const choices = await page
        .getByLabel('Theme', { exact: true })
        .locator('option')
        .evaluateAll(options => options.map(option => option.value))
      assert.equal(choices.length, 8)
      for (const theme of choices)
        for (const mode of ['light', 'dark']) {
          current = `${route.name}-${theme}-${mode}`
          await page.emulateMedia({ colorScheme: mode })
          await page.getByLabel('Theme', { exact: true }).selectOption(theme)
          await page.getByLabel('Mode', { exact: true }).selectOption(mode)
          await page.waitForFunction(() => {
            const action = document.querySelector('[data-testid=action]')
            const probe = document.createElement('span')
            probe.style.backgroundColor = 'var(--rad-color-accent)'
            action.append(probe)
            const expected = getComputedStyle(probe).backgroundColor
            probe.remove()
            return getComputedStyle(action).backgroundColor === expected
          })
          await page.evaluate(() =>
            Promise.all(
              document
                .getAnimations()
                .filter(animation => animation.effect.getComputedTiming().iterations !== Infinity)
                .map(animation => animation.finished.catch(() => {}))
            )
          )
          const measured = await page.evaluate(() => {
            const selected = document.querySelector('[data-testid=selected]')
            const styles = element =>
              Object.fromEntries(
                [
                  'color',
                  'background-color',
                  'background-image',
                  'border-radius',
                  'border-color',
                  'border-style',
                  'font-family',
                  'font-size',
                  'font-weight',
                  'box-shadow',
                  'padding',
                  'gap',
                  'min-height',
                  'text-decoration-line'
                ].map(property => [property, getComputedStyle(element).getPropertyValue(property)])
              )
            const snapshot = Object.fromEntries(
              [
                'button',
                'a',
                '[data-slot=field]',
                'input[type=text]',
                'input[type=checkbox]',
                '[data-slot~=radio-group]',
                'input[type=radio]',
                'dialog',
                'details',
                '[data-slot=accordion]',
                '[data-slot=card]'
              ].map(selector => [selector, styles(selected.querySelector(selector))])
            )
            const control = (scope, selector) =>
              styles(document.querySelector(`[data-testid=${scope}] ${selector}`))
            return {
              snapshot,
              brand: [control('brand', 'button'), control('brand', 'input')],
              reset: [control('reset', 'button'), control('reset', 'input')],
              sibling: [control('sibling', 'button'), control('sibling', 'input')],
              inherited: control('inherited', 'input'),
              baseline: styles(document.querySelector('[data-testid=baseline]')),
              caller: styles(document.querySelector('[data-testid=caller]')),
              disabledOpacity: getComputedStyle(
                document.querySelector('[data-testid=disabled-caller]')
              ).opacity,
              resetMargin: parseFloat(
                getComputedStyle(document.getElementById('reset-probe')).marginTop
              ),
              labelStyle: getComputedStyle(selected.querySelector('[data-slot=field-label]'))
                .fontStyle
            }
          })
          assert.equal(measured.snapshot['input[type=text]']['border-radius'], '29px')
          assert.equal(measured.inherited['border-radius'], '29px')
          assert.equal(measured.brand[0]['border-radius'], '21px')
          assert.equal(measured.brand[1]['border-radius'], '19px')
          assert.deepEqual(measured.reset, measured.sibling)
          assert.deepEqual(measured.baseline, measured.sibling[0])
          assert.equal(measured.caller['border-radius'], '31px')
          assert.equal(measured.caller.padding.split(' ')[1], '23px')
          assert.equal(measured.disabledOpacity, '1')
          assert.equal(measured.resetMargin === 0, route.reset)
          assert.equal(measured.labelStyle, 'italic')
          assert.equal(measured.snapshot.a['text-decoration-line'], 'none')
          const key = `${route.reset}-${theme}-${mode}`
          if (route.name.startsWith('compiled')) parity.set(key, measured.snapshot)
          else
            assert.deepEqual(
              measured.snapshot,
              parity.get(key),
              `${current}: installed route parity`
            )
          await page.getByTestId('caller').hover()
          await page.waitForFunction(
            () =>
              getComputedStyle(document.querySelector('[data-testid=caller]')).backgroundColor ===
              'rgb(18, 52, 86)'
          )
          if (theme === choices[0])
            for (const state of ['disabled', 'pending']) {
              const control = page.getByTestId(state)
              const background = await control.evaluate(
                node => getComputedStyle(node).backgroundColor
              )
              await control.hover()
              await page.evaluate(() =>
                Promise.all(
                  document
                    .getAnimations()
                    .filter(
                      animation => animation.effect.getComputedTiming().iterations !== Infinity
                    )
                    .map(animation => animation.finished.catch(() => {}))
                )
              )
              assert.equal(
                await control.evaluate(node => getComputedStyle(node).backgroundColor),
                background,
                `${current}: ${state} paint guard`
              )
            }
          const panel = page.getByRole('dialog', { includeHidden: true })
          assert.equal(await panel.isVisible(), false)
          await page.getByRole('button', { name: 'Open artifact dialog' }).press('Space')
          assert.equal(await panel.isVisible(), true)
          await page.getByRole('button', { name: 'Close artifact dialog' }).click()
          assert.equal(await panel.isVisible(), false)
          await page.getByText('Shipping', { exact: true }).click()
          assert.equal(await page.getByText('Ships tomorrow.', { exact: true }).isVisible(), true)
          await page.getByText('Shipping', { exact: true }).click()
          if (route.reset && ['glass', 'sharp-3d'].includes(theme))
            await page.screenshot({ path: path.join(output, `${current}.png`), fullPage: true })
          assert.deepEqual(errors, [])
          report.cases.push({
            route: route.name,
            reset: route.reset,
            theme,
            mode,
            result: 'pass',
            observed: {
              action: measured.snapshot.button,
              actionLinkDecoration: measured.snapshot.a['text-decoration-line'],
              callerRadius: measured.caller['border-radius'],
              callerPadding: measured.caller.padding,
              resetRadius: measured.reset[0]['border-radius'],
              brandRadius: measured.brand[0]['border-radius'],
              headingMargin: measured.resetMargin
            }
          })
        }
      await page.close()
      page = undefined
      await new Promise(resolve => server.httpServer.close(resolve))
      server = undefined
      save()
      console.log(`${route.name}: ${choices.length * 2} installed theme/mode cases passed.`)
    }
    report.result = 'pass'
    console.log(
      `Installed styles: ${report.cases.length} route/theme/mode cases passed from one package archive.`
    )
  } catch (error) {
    report.result = 'fail'
    report.failure = { case: current, message: error.message }
    if (page)
      await page
        .screenshot({ path: path.join(output, 'failure.png'), fullPage: true })
        .catch(() => {})
    throw error
  } finally {
    report.finishedAt = new Date().toISOString()
    save()
    await browser.close()
    if (server) await new Promise(resolve => server.httpServer.close(resolve))
  }
}
