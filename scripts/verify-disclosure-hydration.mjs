import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { build, preview } from 'vite'
import { chromium } from 'playwright'
import { browserEnvironment } from './record-browser-environment.mjs'

export async function verifyInstalledDisclosureHydration(consumer, archive) {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const output = path.join(root, 'output/browser/installed-disclosure-hydration')
  mkdirSync(output, { recursive: true })
  const report = {
    package: {
      version: JSON.parse(
        readFileSync(path.join(consumer, 'node_modules/@cognitap/radiant/package.json'), 'utf8')
      ).version,
      integrity: `sha512-${createHash('sha512').update(readFileSync(archive)).digest('base64')}`
    },
    cases: [],
    result: 'incomplete'
  }
  const browser = await chromium.launch()
  Object.assign(report, browserEnvironment(browser))
  let server, page, releaseScripts
  try {
    writeFileSync(
      path.join(consumer, 'hydration-server.tsx'),
      `import {StrictMode} from 'react';import {renderToString} from 'react-dom/server';import {DisclosureHydration,hydrationCases} from './DisclosureHydration.js';export const pages=hydrationCases.map(scenario=>({scenario,html:renderToString(<StrictMode><DisclosureHydration scenario={scenario}/></StrictMode>)}));`
    )
    const config = {
      root: consumer,
      configFile: false,
      logLevel: 'error',
      oxc: { jsx: { runtime: 'automatic' } }
    }
    await build({
      ...config,
      build: {
        ssr: 'hydration-server.tsx',
        outDir: path.join(consumer, 'hydration-ssr'),
        rollupOptions: { output: { entryFileNames: 'server.mjs' } }
      }
    })
    const { pages } = await import(pathToFileURL(path.join(consumer, 'hydration-ssr/server.mjs')))
    writeFileSync(
      path.join(consumer, 'index.html'),
      '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Disclosure hydration</title></head><body><div id="root"></div><script>window.__nodes=[...document.querySelectorAll("details,input")];window.__errors=[];window.__toggles=0;document.addEventListener("toggle",()=>window.__toggles++,true);</script><script type="module" src="/hydration-entry.tsx"></script></body></html>'
    )
    writeFileSync(
      path.join(consumer, 'hydration-entry.tsx'),
      `import '@cognitap/radiant/styles.css';import {StrictMode} from 'react';import {hydrateRoot} from 'react-dom/client';import {DisclosureHydration,type HydrationCase} from './DisclosureHydration.js';const scenario=new URLSearchParams(location.search).get('scenario') as HydrationCase;hydrateRoot(document.getElementById('root')!,<StrictMode><DisclosureHydration scenario={scenario}/></StrictMode>,{onRecoverableError:error=>(window as any).__errors.push(String(error))});`
    )
    const client = path.join(output, 'client')
    const built = await build({ ...config, build: { outDir: client } })
    const modules = built.output
      .filter(item => item.type === 'chunk')
      .flatMap(item => Object.keys(item.modules))
    assert.ok(
      modules.includes(
        path.join(
          realpathSync(path.join(consumer, 'node_modules/@cognitap/radiant')),
          'dist/library/Collapsible.js'
        )
      )
    )
    assert.ok(modules.every(id => !id.startsWith(path.join(root, 'src/'))))
    const template = readFileSync(path.join(client, 'index.html'), 'utf8')
    for (const { scenario, html } of pages)
      writeFileSync(
        path.join(client, `${scenario}.html`),
        template.replace('<div id="root"></div>', `<div id="root">${html}</div>`)
      )
    server = await preview({
      ...config,
      build: { outDir: client },
      preview: { host: '127.0.0.1', port: 0 }
    })
    const base = server.resolvedUrls.local[0]
    for (const { scenario } of pages) {
      page = await browser.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => {
        if (message.type() === 'error') errors.push(message.text())
      })
      let scriptRequested
      const requested = new Promise(resolve => {
        scriptRequested = resolve
      })
      const scriptsHeld = new Promise(resolve => {
        releaseScripts = resolve
      })
      await page.route('**/*.js', async route => {
        scriptRequested()
        await scriptsHeld
        await route.continue()
      })
      await page.goto(`${base}${scenario}.html?scenario=${scenario}`, { waitUntil: 'commit' })
      await requested
      await page.locator('summary').first().waitFor()
      await page.evaluate(
        () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      )
      const nodes = page.locator('details')
      const accordion = scenario.startsWith('accordion-'),
        held = scenario.startsWith('held-') || scenario.endsWith('-held'),
        multiple = scenario.includes('-multiple-')
      const initial = scenario.endsWith('-open') || scenario === 'local-unchanged'
      async function toggle(index = 0) {
        const before = await page.evaluate(() => window.__toggles)
        await nodes.nth(index).locator('summary').press('Enter')
        await page.waitForFunction(count => window.__toggles > count, before)
      }
      if (accordion) {
        await toggle(0)
        await toggle(1)
        await toggle(2)
        await page
          .getByRole('textbox', { name: 'Draft B', exact: true })
          .fill('Kept before hydration')
      } else if (scenario === 'local-roundtrip') {
        await toggle()
        await toggle()
      } else if (scenario === 'local-queued')
        await nodes.locator('summary').evaluate(node => node.click())
      else if (scenario !== 'local-unchanged') {
        if (initial)
          await page
            .getByRole('textbox', { name: 'Draft', exact: true })
            .fill('Kept before hydration')
        await toggle()
        if (!initial)
          await page
            .getByRole('textbox', { name: 'Draft', exact: true })
            .fill('Kept before hydration')
      }
      assert.equal(await page.locator('html').getAttribute('data-hydrated'), null)
      releaseScripts()
      await page.locator('html[data-hydrated=true]').waitFor()
      await page.evaluate(
        () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      )
      const unchanged = scenario === 'local-roundtrip' || scenario === 'local-unchanged'
      const expectedOpen = accordion
        ? [true, false, false]
        : [held || unchanged ? initial : !initial]
      assert.deepEqual(
        await nodes.evaluateAll(items => items.map(item => item.open)),
        expectedOpen,
        `${scenario}: native state`
      )
      assert.deepEqual(
        await nodes.evaluateAll(items => items.map(item => item.dataset.state)),
        expectedOpen.map(open => (open ? 'open' : 'closed')),
        `${scenario}: owned attributes`
      )
      assert.deepEqual(
        await page
          .locator('[data-owned]')
          .evaluateAll(items => items.map(item => item.dataset.owned)),
        expectedOpen.slice(0, accordion ? 2 : 1).map(String)
      )
      const adopted = !accordion && !held && !unchanged
      assert.deepEqual(
        JSON.parse(await page.locator('[data-changes]').getAttribute('data-changes')),
        adopted ? [!initial] : [],
        `${scenario}: no duplicate requests`
      )
      assert.equal(
        await page.evaluate(() =>
          window.__nodes.every(
            (node, index) => node === document.querySelectorAll('details,input')[index]
          )
        ),
        true
      )
      assert.deepEqual(await page.evaluate(() => window.__errors), [])
      assert.deepEqual(errors, [], `${scenario}: no hydration warnings/errors`)
      if (!unchanged && scenario !== 'local-queued')
        assert.equal(
          await page.locator(accordion ? 'input[name=b]' : 'input[name=draft]').inputValue(),
          'Kept before hydration'
        )
      const target = accordion ? 1 : 0
      const next = accordion ? (multiple ? ['a', 'b'] : 'b') : !expectedOpen[0]
      await nodes.nth(target).locator('summary').press('Space')
      await page.waitForFunction(
        count =>
          JSON.parse(document.querySelector('[data-changes]').dataset.changes).length === count,
        adopted ? 2 : 1
      )
      assert.deepEqual(
        JSON.parse(await page.locator('[data-changes]').getAttribute('data-changes')),
        [...(adopted ? [!initial] : []), next]
      )
      const afterOpen = accordion
        ? held
          ? [true, false, false]
          : [multiple, true, false]
        : [held ? initial : !expectedOpen[0]]
      assert.deepEqual(
        await nodes.evaluateAll(items => items.map(item => item.open)),
        afterOpen,
        `${scenario}: subsequent native state`
      )
      assert.deepEqual(
        await nodes.evaluateAll(items => items.map(item => item.dataset.state)),
        afterOpen.map(open => (open ? 'open' : 'closed')),
        `${scenario}: subsequent owned attributes`
      )
      report.cases.push({ scenario, scriptsHeld: true, open: expectedOpen, result: 'pass' })
      await page.close()
      page = undefined
    }
    report.result = 'pass'
    console.log(
      `Installed disclosure hydration: ${report.cases.length} held-script SSR cases passed; native state, owner attributes, callbacks, retained hosts/values and subsequent keyboard interactions agree.`
    )
  } catch (error) {
    report.result = 'fail'
    report.failure = error.message
    if (page)
      await page
        .screenshot({ path: path.join(output, 'failure.png'), fullPage: true })
        .catch(() => {})
    throw error
  } finally {
    releaseScripts?.()
    report.finishedAt = new Date().toISOString()
    writeFileSync(path.join(output, 'results.json'), `${JSON.stringify(report, null, 2)}\n`)
    await browser.close()
    if (server) await new Promise(resolve => server.httpServer.close(resolve))
  }
}
