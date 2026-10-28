import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { build, createServer as createViteServer } from 'vite'
import { chromium, firefox, webkit } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.join(root, 'output/browser/select-proof')
const fixture = path.join(root, 'tests/select-proof')
const serve = process.argv.includes('--serve')
const requestedBrowser = process.argv.find(arg => arg.startsWith('--browser='))?.split('=')[1]
assert.ok(Number(process.versions.node.split('.')[0]) >= 26, 'Use Node 26 or newer.')
const engines = { chromium, firefox, webkit }
assert.ok(!requestedBrowser || requestedBrowser in engines, 'Unknown browser engine.')
await mkdir(output, { recursive: true })

const vite = await createViteServer({
  root,
  configFile: false,
  logLevel: 'error',
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true, ws: false }
})
let markup
try {
  const { App } = await vite.ssrLoadModule('/tests/select-proof/App.jsx')
  markup = renderToString(createElement(App))
  assert.match(markup, /Select platform proof/)
} finally {
  await vite.close()
}
await build({
  root,
  configFile: false,
  logLevel: 'error',
  build: {
    outDir: path.join(output, 'client'),
    emptyOutDir: true,
    rollupOptions: { input: path.join(fixture, 'client.jsx'), output: { entryFileNames: 'app.js' } }
  }
})
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Select platform proof</title><link rel="stylesheet" href="/radiant.css"><link rel="stylesheet" href="/proof.css"></head><body><div id="root">${markup}</div><script type="module" src="/app.js"></script></body></html>`
const files = new Map([
  ['/', [null, 'text/html']],
  ['/app.js', [path.join(output, 'client/app.js'), 'text/javascript']],
  ['/radiant.css', [path.join(root, 'dist/library/styles.css'), 'text/css']],
  ['/proof.css', [path.join(fixture, 'proof.css'), 'text/css']]
])
const server = createServer(async (request, response) => {
  try {
    const entry = files.get(new URL(request.url, 'http://127.0.0.1').pathname)
    if (!entry) {
      response.writeHead(404).end()
      return
    }
    response.writeHead(200, { 'Content-Type': entry[1] })
    response.end(entry[0] ? await readFile(entry[0]) : html)
  } catch {
    response.writeHead(500).end()
  }
})
await new Promise(resolve =>
  server.listen(serve ? Number(process.env.PORT ?? 3012) : 0, '127.0.0.1', resolve)
)
const url = `http://127.0.0.1:${server.address().port}`
const results = {
  environment: {
    node: process.version,
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    source: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    changes: execFileSync('git', ['status', '--short'], { cwd: root, encoding: 'utf8' }).trim(),
    at: new Date().toISOString()
  },
  scope:
    'Local Playwright engines; no screen reader, physical mobile, branded Safari or Edge verification. Native popup screenshots may omit OS-owned surfaces. Custom fixture is deliberately incomplete.',
  browsers: []
}

async function verify(name, engine) {
  const result = { engine: name, version: null, features: {}, cases: [], errors: [] }
  results.browsers.push(result)
  let browser
  try {
    browser = await engine.launch()
  } catch (error) {
    result.cases.push({ scenario: 'browser launch', status: 'failed', error: error.message })
    return
  }
  result.version = browser.version()
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  page.on('pageerror', error => result.errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') result.errors.push(message.text())
  })
  const check = async (scenario, run, status = 'passed') => {
    try {
      const evidence = await run()
      result.cases.push({ scenario, status: evidence?.notRun ? 'not-run' : status, evidence })
    } catch (error) {
      result.cases.push({ scenario, status: 'failed', error: error.message })
      console.error(`${name}: ${scenario}: ${error.message}`)
    }
  }
  const native = kind => page.locator(`[data-candidate=${kind}] select[name=${kind}]`)
  try {
    await page.goto(url)
    await page.waitForSelector('html[data-hydrated=true]')
    result.features = await page.evaluate(() => ({
      baseSelect: CSS.supports('appearance', 'base-select'),
      pickerSelector: CSS.supports('selector(::picker(select))'),
      selectedContent: 'HTMLSelectedContentElement' in window,
      popover: 'showPopover' in HTMLElement.prototype,
      enhancedAppearance: getComputedStyle(document.querySelector('.enhanced')).appearance
    }))
    for (const kind of ['classic', 'enhanced']) {
      const area = page.locator(`[data-candidate=${kind}]`)
      const select = native(kind)
      await check(`${kind}: native host, name and Field relationships`, async () => {
        assert.equal(await area.getByRole('combobox', { name: 'Place', exact: true }).count(), 1)
        const state = await select.evaluate(node => ({
          tag: node.tagName,
          label: node.labels[0].textContent,
          required: node.required,
          description: node
            .getAttribute('aria-describedby')
            ?.split(' ')
            .map(id => document.getElementById(id)?.textContent)
            .join(' ')
        }))
        assert.equal(state.tag, 'SELECT')
        assert.equal(state.required, true)
        assert.match(state.description, /single destination/)
        return state
      })
      await check(`${kind}: required validation, FormData, events and reset`, async () => {
        assert.equal(await select.evaluate(node => node.checkValidity()), false)
        await select.selectOption('rome')
        assert.equal(await area.getByLabel('Last native change').textContent(), 'rome')
        assert.equal(await select.evaluate(node => new FormData(node.form).get(node.name)), 'rome')
        assert.equal(await select.evaluate(node => node.checkValidity()), true)
        assert.equal(
          await select.evaluate(node => new FormData(node.form).has('disabled-place')),
          false
        )
        await area.getByRole('button', { name: 'Reset', exact: true }).click()
        assert.equal(await select.inputValue(), '')
        assert.equal(await select.evaluate(node => node.checkValidity()), false)
        return 'Invalid empty value; changed/submitted rome; disabled control omitted; reset restores empty.'
      })
      await check(`${kind}: native keyboard typeahead`, async () => {
        await select.selectOption('oslo')
        await select.focus()
        await page.keyboard.press('t')
        assert.equal(await select.inputValue(), 'tokyo')
        return 'Typing t selects Tokyo through native input.'
      })
      if (kind === 'enhanced' && result.features.baseSelect && result.features.pickerSelector) {
        await check('enhanced: popup keyboard skips disabled option and commits', async () => {
          await select.selectOption('oslo')
          await select.click()
          await page.keyboard.press('ArrowDown')
          await page.keyboard.press('Enter')
          assert.equal(await select.inputValue(), 'rome')
          return 'ArrowDown focuses Rome across disabled Paris; Enter commits and dismisses.'
        })
      } else {
        result.cases.push({
          scenario: `${kind}: platform-owned popup arrow navigation`,
          status: 'not-run',
          evidence:
            'Requires a headed platform/manual keyboard check; DOM selectOption is not evidence of popup keyboard behavior.'
        })
      }
      await check(`${kind}: controlled acceptance and refusal`, async () => {
        const controlled = area.getByRole('combobox', { name: 'Controlled place', exact: true })
        await controlled.selectOption('rome')
        assert.equal(await controlled.inputValue(), 'oslo')
        await area.getByLabel('Accept controlled changes').check()
        await controlled.selectOption('rome')
        assert.equal(await controlled.inputValue(), 'rome')
        return 'Refusal restores oslo; acceptance stores rome.'
      })
      await check(
        `${kind}: controlled reset needs the consumer adapter`,
        async () => {
          const controlled = area.getByRole('combobox', { name: 'Controlled place', exact: true })
          await area.getByRole('button', { name: 'Reset', exact: true }).click()
          const resetValue = await controlled.inputValue()
          await area.getByLabel('Accept controlled changes').uncheck()
          const renderedValue = await controlled.inputValue()
          assert.equal(renderedValue, 'rome')
          return {
            resetValue,
            renderedValue,
            note: 'Native reset does not write React state. The consumer must reset owned values; do not infer controlled reset from an uncontrolled pass.'
          }
        },
        'expected-gap'
      )
      await check(`${kind}: Field disabled reaches native host`, async () =>
        assert.equal(
          await area.getByRole('combobox', { name: 'Disabled place', exact: true }).isDisabled(),
          true
        )
      )
    }
    const custom = page.locator('[data-candidate=custom]')
    const trigger = custom.getByRole('combobox', { name: 'Place', exact: true })
    await check('custom: keyboard, disabled option, FormData and reset adapter', async () => {
      await trigger.click()
      await custom.locator('[role=combobox][aria-expanded=true]').waitFor()
      await trigger.press('End')
      await trigger.press('Enter')
      assert.equal(await trigger.textContent(), 'Tokyo')
      assert.equal(
        await custom
          .locator('input[name=custom]')
          .evaluate(node => new FormData(node.form).get('custom')),
        'tokyo'
      )
      await custom.getByRole('button', { name: 'Reset', exact: true }).click()
      assert.equal(await trigger.textContent(), 'Choose a place')
      await trigger.click()
      await custom.locator('[role=combobox][aria-expanded=true]').waitFor()
      await trigger.press('ArrowDown')
      await trigger.press('ArrowDown')
      await trigger.press('Enter')
      assert.equal(await trigger.textContent(), 'Rome')
      return 'App code owns active descendant, disabled skipping, commitment, hidden value and reset listener.'
    })
    await check(
      'custom: hidden input does not implement required validation',
      async () => {
        await custom.getByRole('button', { name: 'Reset', exact: true }).click()
        const state = await custom.locator('input[name=custom]').evaluate(node => ({
          value: node.value,
          required: node.required,
          willValidate: node.willValidate,
          valid: node.form.checkValidity()
        }))
        assert.equal(state.value, '')
        assert.equal(state.required, true)
        assert.equal(state.willValidate, false)
        assert.equal(state.valid, true)
        return state
      },
      'expected-gap'
    )
    await check('enhanced: open picker, Escape and modal focus', async () => {
      await page.getByRole('button', { name: 'Open dialog', exact: true }).click()
      const select = page.getByRole('combobox', { name: 'Dialog place', exact: true })
      await select.click()
      await page.keyboard.press('Escape')
      const state = await select.evaluate(node => ({
        modalOpen: node.closest('dialog').open,
        pickerOpen: node.matches(':open'),
        focusInside: node.closest('dialog').contains(document.activeElement),
        value: node.value
      }))
      assert.equal(state.modalOpen, true)
      assert.equal(state.focusInside, true)
      assert.equal(state.value, 'oslo')
      if (result.features.baseSelect && result.features.pickerSelector)
        assert.equal(state.pickerOpen, false)
      await page.getByRole('button', { name: 'Close dialog', exact: true }).click()
      return { ...state, notRun: !result.features.baseSelect || !result.features.pickerSelector }
    })
    await check(
      'all preset themes and modes: closed host inherits tokens without overflow',
      async () => {
        const themeNames = await page
          .getByLabel('Theme', { exact: true })
          .locator('option')
          .allTextContents()
        const samples = []
        for (const theme of themeNames)
          for (const mode of ['light', 'dark']) {
            await page.getByLabel('Theme', { exact: true }).selectOption(theme)
            await page.getByLabel('Mode', { exact: true }).selectOption(mode)
            const state = await native('enhanced').evaluate(node => {
              const css = getComputedStyle(node)
              return {
                theme: node.closest('[data-theme]')?.getAttribute('data-theme'),
                color: css.color,
                background: css.backgroundColor,
                radius: css.borderRadius,
                height: node.getBoundingClientRect().height,
                fits:
                  node.getBoundingClientRect().width <=
                  node.closest('section').getBoundingClientRect().width
              }
            })
            assert.equal(state.fits, true)
            assert.ok(state.height >= 24)
            samples.push({ theme, mode, ...state })
          }
        return samples
      }
    )
    await page.getByLabel('Theme', { exact: true }).selectOption('radiant')
    await page.getByLabel('Mode', { exact: true }).selectOption('dark')
    await page.screenshot({ path: path.join(output, `${name}-dark.png`), fullPage: true })
    await native('enhanced').click()
    await page.screenshot({ path: path.join(output, `${name}-picker.png`), fullPage: true })
    await page.keyboard.press('Escape')
    await check('narrow viewport: controls fit at 320px', async () => {
      await page.setViewportSize({ width: 320, height: 900 })
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true
      )
      await page.screenshot({ path: path.join(output, `${name}-320.png`), fullPage: true })
    })
    await check('forced colors: native arrow and visible border survive', async () => {
      await page.emulateMedia({ forcedColors: 'active' })
      const state = await native('enhanced').evaluate(node => ({
        emulated: matchMedia('(forced-colors: active)').matches,
        appearance: getComputedStyle(node).appearance,
        borderStyle: getComputedStyle(node).borderStyle
      }))
      // An engine that cannot emulate this media feature records the gap explicitly.
      if (state.emulated) {
        assert.equal(state.appearance, 'auto')
        assert.notEqual(state.borderStyle, 'none')
      }
      return { ...state, notRun: !state.emulated }
    })
    await context.close()
    const noJS = await browser.newContext({ javaScriptEnabled: false })
    const fallback = await noJS.newPage()
    await fallback.goto(url)
    await check('native: server-rendered selection works without JavaScript', async () => {
      const state = []
      for (const kind of ['classic', 'enhanced']) {
        const control = fallback.locator(`select[name=${kind}]`)
        await control.focus()
        await control.press('t')
        assert.equal(await control.inputValue(), 'tokyo')
        state.push({ kind, value: await control.inputValue() })
      }
      return state
    })
    await check(
      'custom: no JavaScript leaves the custom button inoperable',
      async () => {
        const button = fallback.locator('#custom-place')
        await button.click()
        assert.equal(await button.getAttribute('aria-expanded'), 'false')
        return 'Server markup remains visible, but opening requires application JavaScript.'
      },
      'expected-gap'
    )
    await noJS.close()
    const hydration = await browser.newContext()
    const held = await hydration.newPage()
    held.on('pageerror', error => result.errors.push(`hydration: ${error.message}`))
    held.on('console', message => {
      if (message.type() === 'error') result.errors.push(`hydration: ${message.text()}`)
    })
    let release
    const gate = new Promise(resolve => {
      release = resolve
    })
    await held.route('**/app.js', async route => {
      await gate
      await route.continue()
    })
    await held.goto(url, { waitUntil: 'commit' })
    await check('native: selection before hydration retains host and edited value', async () => {
      await held.evaluate(() => {
        window.beforeHosts = [
          ...document.querySelectorAll('select[name=classic],select[name=enhanced]')
        ]
      })
      for (const kind of ['classic', 'enhanced']) {
        await held.locator(`select[name=${kind}]`).focus()
        await held.locator(`select[name=${kind}]`).press('t')
      }
      release()
      await held.waitForSelector('html[data-hydrated=true]')
      const state = await held.evaluate(() =>
        window.beforeHosts.map(node => ({
          retained: node === document.querySelector(`select[name=${node.name}]`),
          value: node.value
        }))
      )
      assert.ok(state.every(item => item.retained && item.value === 'tokyo'))
      return state
    })
    release()
    await hydration.close()
    await check('hydrated fixture has no console or runtime errors', async () =>
      assert.deepEqual(result.errors, [])
    )
  } catch (error) {
    result.cases.push({ scenario: 'proof completion', status: 'failed', error: error.message })
  } finally {
    await browser.close()
  }
}

try {
  if (serve) {
    console.log(`Select comparison fixture: ${url}`)
    await new Promise(resolve => {
      process.once('SIGINT', resolve)
      process.once('SIGTERM', resolve)
    })
  } else {
    for (const [name, engine] of Object.entries(engines)) {
      if (requestedBrowser && requestedBrowser !== name) continue
      await verify(name, engine)
    }
    await writeFile(path.join(output, 'results.json'), `${JSON.stringify(results, null, 2)}\n`)
    for (const browser of results.browsers)
      console.log(
        `${browser.engine} ${browser.version}: ${browser.cases.filter(item => item.status === 'passed').length} passed, ${browser.cases.filter(item => item.status === 'expected-gap').length} expected gaps, ${browser.cases.filter(item => item.status === 'not-run').length} not run, ${browser.cases.filter(item => item.status === 'failed').length} failed; ${JSON.stringify(browser.features)}`
      )
    assert.ok(
      results.browsers.every(browser => browser.cases.every(item => item.status !== 'failed')),
      'Review failed proof cases in output/browser/select-proof/results.json.'
    )
  }
} finally {
  server.closeAllConnections()
  await new Promise(resolve => server.close(resolve))
}
