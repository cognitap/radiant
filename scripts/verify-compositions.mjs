import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { build, preview, version as viteVersion } from 'vite'
import { chromium } from 'playwright'
import { browserEnvironment } from './record-browser-environment.mjs'

export const root = fileURLToPath(new URL('../', import.meta.url))
export const integrity = filename =>
  `sha512-${createHash('sha512').update(readFileSync(filename)).digest('base64')}`

export function copyRecipes(directory, localExtension = '.js') {
  mkdirSync(directory, { recursive: true })
  const hashes = {}
  const adapt = source =>
    source
      .replace("'../../src/index.js'", "'@cognitap/radiant'")
      .replace(/'\.\/(ProfileForm|WorkspaceSettings)\.js'/g, `'./$1${localExtension}'`)
  for (const name of ['ProfileForm', 'WorkspaceSettings']) {
    const source = readFileSync(path.join(root, `.storybook/examples/${name}.tsx`), 'utf8')
    assert.ok(source.includes("'../../src/index.js'"))
    writeFileSync(path.join(directory, `${name}.tsx`), adapt(source))
    hashes[name] = createHash('sha256').update(source).digest('hex')
  }
  writeFileSync(
    path.join(directory, 'Compositions.tsx'),
    adapt(readFileSync(path.join(root, 'tests/consumer/Compositions.tsx'), 'utf8'))
  )
  return hashes
}

async function focused(locator) {
  await locator.waitFor({ state: 'visible' })
  await locator.page().waitForFunction(() => document.activeElement !== document.body)
  assert.equal(await locator.evaluate(node => node === document.activeElement), true)
}

async function disclose(summary, key, open) {
  const host = await summary.elementHandle()
  try {
    await summary.press(key)
    // Native details paint precedes its queued toggle observation and React's
    // controlled-state reconciliation. Wait for the public state to agree too.
    await summary.page().waitForFunction(
      ({ host, open }) => {
        const details = host.closest('details')
        return details.open === open && details.dataset.state === (open ? 'open' : 'closed')
      },
      { host, open }
    )
  } finally {
    await host.dispose()
  }
}

/** The same installed flow runs against Vite, Astro islands and Next client boundaries. */
export async function exerciseCompositions(
  page,
  url,
  report,
  output,
  { presets, placements = ['workspace', 'standalone', 'card', 'dialog'] } = {}
) {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(url)
  await page.locator('html[data-hydrated=true]').waitFor()
  const actualPresets = await page
    .getByLabel('Theme', { exact: true })
    .locator('option')
    .evaluateAll(nodes => nodes.map(node => node.value))
  // Full runs discover the registry rather than maintaining a second preset list.
  presets ??= actualPresets
  const baseline = await page
    .getByTestId('nested-default')
    .evaluate(
      node =>
        getComputedStyle(node).cssText +
        getComputedStyle(node).backgroundColor +
        getComputedStyle(node).borderRadius
    )
  for (const theme of presets)
    for (const mode of ['light', 'dark'])
      for (const owner of ['native', 'tanstack'])
        for (const placement of placements) {
          report.current = { theme, mode, owner, placement }
          await page.getByLabel('Theme', { exact: true }).selectOption(theme)
          await page.getByLabel('Mode', { exact: true }).selectOption(mode)
          await page.getByLabel('Form owner', { exact: true }).selectOption(owner)
          await page.getByLabel('Composition', { exact: true }).selectOption(placement)
          assert.equal(
            await page.locator('[data-rad-theme]').first().getAttribute('data-rad-theme'),
            theme
          )
          assert.equal(
            await page.locator('[data-rad-mode]').first().getAttribute('data-rad-mode'),
            mode
          )
          const modal = ['workspace', 'dialog'].includes(placement)
          const recipe = page.getByRole('region', { name: 'Recipe', exact: true })
          const trigger = recipe.getByRole('button', { name: 'Edit profile' })
          if (modal) await trigger.press('Space')
          const email = recipe.getByRole('textbox', { name: 'Email', exact: true })
          const updates = recipe.getByRole('checkbox', { name: 'Send product updates' })
          const free = recipe.getByRole('radio', { name: 'Free', exact: true })
          const pro = recipe.getByRole('radio', { name: 'Pro', exact: true })
          const save = recipe.getByRole('button', { name: 'Save profile' })
          const reset = recipe.getByRole('button', { name: 'Reset', exact: true })
          const form = recipe.getByRole('form', { name: 'Profile', exact: true })
          assert.equal(await recipe.locator('form').count(), 1)
          assert.equal(await recipe.locator('form form').count(), 0)
          if (modal) await focused(email)
          assert.equal(await email.getAttribute('required'), '')
          assert.equal(await recipe.getByRole('textbox', { name: 'Workspace' }).isDisabled(), true)
          assert.equal(await recipe.getByRole('radio', { name: 'Retired' }).isDisabled(), true)
          await save.press('Enter')
          await page.waitForFunction(() =>
            document.querySelector('[role=alert]')?.textContent.includes('Enter an email.')
          )
          await focused(email)
          const relationships = await email.evaluate(node => ({
            label: node.labels[0]?.textContent,
            description: node
              .getAttribute('aria-describedby')
              .split(/\s+/)
              .map(id => document.getElementById(id)?.textContent)
              .join(' '),
            invalid: node.getAttribute('aria-invalid'),
            radius: getComputedStyle(node).borderRadius
          }))
          assert.match(relationships.label, /Email/)
          assert.match(relationships.description, /We send account updates here.*Enter an email\./)
          assert.equal(relationships.invalid, 'true')
          assert.equal(relationships.radius, '18px')
          await email.fill('ada@example.com')
          await email.press('Tab')
          await focused(updates)
          await updates.press('Space')
          await updates.press('Tab')
          await focused(free)
          await free.press('ArrowDown')
          await focused(pro)
          assert.equal(await pro.isChecked(), true)
          await pro.press('ArrowDown')
          assert.equal(await free.isChecked(), true)
          await free.press('ArrowDown')
          const values = await form.evaluate(node => Object.fromEntries(new FormData(node)))
          assert.deepEqual(values, { email: 'ada@example.com', plan: 'pro' })
          assert.equal(await recipe.getByRole('alert').count(), 0)
          await reset.press('Enter')
          assert.equal(await email.inputValue(), '')
          assert.equal(await updates.isChecked(), true)
          assert.equal(await free.isChecked(), true)
          assert.equal(await email.getAttribute('aria-invalid'), null)
          if (modal) {
            assert.equal(
              await recipe.getByRole('dialog').evaluate(node => node.matches(':modal')),
              true
            )
            const cancel = recipe.getByRole('button', { name: 'Cancel' })
            await cancel.focus()
            assert.equal(
              await cancel.evaluate(
                node =>
                  node.getBoundingClientRect().bottom <=
                  node.closest('dialog').getBoundingClientRect().bottom
              ),
              true
            )
            for (const key of ['Tab', 'Tab', 'Shift+Tab', 'Shift+Tab']) {
              await page.keyboard.press(key)
              assert.equal(
                await page.evaluate(
                  () =>
                    document.activeElement === document.body ||
                    document.querySelector(':modal')?.contains(document.activeElement)
                ),
                true
              )
            }
            await email.press('Escape')
            await page.waitForFunction(() => {
              const panel = document.querySelector('dialog')
              return !panel.open && panel.dataset.state === 'closed'
            })
            await focused(trigger)
            await trigger.press('Enter')
            await focused(email)
          }
          await email.fill('ada@example.com')
          await updates.press('Space')
          await free.press('ArrowDown')
          await save.press('Enter')
          await page.waitForFunction(() =>
            document
              .querySelector('output')
              ?.textContent.includes('Saved ada@example.com · pro · Updates off')
          )
          if (modal) {
            await recipe.getByRole('dialog', { includeHidden: true }).waitFor({ state: 'hidden' })
            await focused(trigger)
            assert.equal(await recipe.getByRole('dialog').count(), 0)
          }
          if (placement === 'workspace') {
            await disclose(recipe.locator('summary').filter({ hasText: 'Privacy' }), 'Enter', true)
            await recipe
              .locator('details[data-value=profile][data-state=closed]:not([open])')
              .waitFor()
            const retention = recipe.locator('summary').filter({ hasText: 'Data retention' })
            await disclose(retention, 'Space', true)
            assert.equal(
              await recipe
                .getByText('Profile preferences stay until you change or reset them.')
                .isVisible(),
              true
            )
            await disclose(retention, 'Enter', false)
            assert.equal(
              await recipe
                .getByText('Profile preferences stay until you change or reset them.')
                .isVisible(),
              false
            )
            await recipe.getByRole('link', { name: 'Read the privacy note' }).press('Enter')
            await focused(recipe.getByRole('region', { name: 'Privacy note' }))
            assert.equal(await recipe.locator('[data-slot=card]').getAttribute('tabindex'), null)
          }
          assert.equal(
            await page
              .getByTestId('nested-default')
              .evaluate(
                node =>
                  getComputedStyle(node).cssText +
                  getComputedStyle(node).backgroundColor +
                  getComputedStyle(node).borderRadius
              ),
            baseline
          )
          if (
            owner === 'native' &&
            placement === 'workspace' &&
            ['glass', 'sharp-3d'].includes(theme)
          ) {
            // Capture the assembled modal with its current theme, including validation and focus.
            await disclose(recipe.locator('summary').filter({ hasText: 'Profile' }), 'Enter', true)
            await trigger.press('Enter')
            await reset.press('Enter')
            await save.press('Enter')
            await page.screenshot({
              path: path.join(output, `${theme}-${mode}.png`),
              fullPage: true
            })
            await email.press('Escape')
          }
          report.cases.push({ theme, mode, owner, placement, result: 'pass', values })
        }
  // Removing an open native modal must release top-layer/inertness before remount.
  await page.getByLabel('Composition', { exact: true }).selectOption('dialog')
  await page.getByRole('button', { name: 'Edit profile' }).press('Enter')
  await page.getByRole('dialog').waitFor()
  // A real app can unmount a route externally while its dialog is open.
  await page
    .getByRole('button', { name: 'Unmount examples', exact: true })
    .evaluate(node => node.click())
  await page.getByRole('button', { name: 'Mount examples', exact: true }).waitFor()
  assert.equal(await page.locator(':modal').count(), 0)
  await page.getByRole('button', { name: 'Mount examples', exact: true }).press('Enter')
  await page.getByRole('button', { name: 'Edit profile' }).press('Enter')
  await page.getByRole('button', { name: 'Cancel', exact: true }).press('Enter')
  await focused(page.getByRole('button', { name: 'Edit profile' }))
  assert.deepEqual(errors, [])
  report.cleanup = 'open modal removed; background operable; remounted modal closes/restores focus'
  report.result = 'pass'
  delete report.current
}

export async function verifyInstalledCompositions(consumer, archive) {
  const output = path.join(root, 'output/browser/installed-compositions')
  mkdirSync(output, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const require = createRequire(path.join(consumer, 'package.json'))
  const report = {
    ...browserEnvironment(browser),
    package: {
      name: '@cognitap/radiant',
      version: JSON.parse(
        readFileSync(path.join(consumer, 'node_modules/@cognitap/radiant/package.json'), 'utf8')
      ).version,
      archive: path.basename(archive),
      integrity: integrity(archive)
    },
    buildTools: {
      vite: viteVersion,
      react: require('react/package.json').version,
      tanstackForm: require('@tanstack/react-form/package.json').version
    },
    recipes: copyRecipes(consumer),
    cases: [],
    result: 'incomplete'
  }
  let server, page
  try {
    writeFileSync(
      path.join(consumer, 'server.tsx'),
      `import { StrictMode } from 'react';import { renderToString } from 'react-dom/server';import { Compositions } from './Compositions.js';export const html=renderToString(<StrictMode><Compositions /></StrictMode>);`
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
        ssr: 'server.tsx',
        outDir: path.join(consumer, 'ssr'),
        rollupOptions: { output: { entryFileNames: 'server.mjs' } }
      }
    })
    const { html } = await import(pathToFileURL(path.join(consumer, 'ssr/server.mjs')))
    writeFileSync(
      path.join(consumer, 'index.html'),
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Installed compositions</title></head><body><div id="root">${html}</div><script>window.__serverInput=document.querySelector('input');window.__serverIds=[...document.querySelectorAll('[id]')].map(n=>n.id);window.__hydrationErrors=[];</script><script type="module" src="/entry.tsx"></script></body></html>`
    )
    writeFileSync(
      path.join(consumer, 'entry.tsx'),
      `import '@cognitap/radiant/reset.css';import '@cognitap/radiant/styles.css';import { StrictMode } from 'react';import { hydrateRoot } from 'react-dom/client';import { Compositions } from './Compositions.js';hydrateRoot(document.getElementById('root')!,<StrictMode><Compositions /></StrictMode>,{onRecoverableError:error=>(window as any).__hydrationErrors.push(String(error))});`
    )
    const built = await build({ ...config, build: { outDir: path.join(output, 'client') } })
    const modules = built.output
      .filter(item => item.type === 'chunk')
      .flatMap(item => Object.keys(item.modules))
    assert.ok(
      modules.includes(
        path.join(
          realpathSync(path.join(consumer, 'node_modules/@cognitap/radiant')),
          'dist/library/Dialog.js'
        )
      )
    )
    assert.ok(modules.every(id => !id.startsWith(path.join(root, 'src/'))))
    server = await preview({
      ...config,
      build: { outDir: path.join(output, 'client') },
      preview: { host: '127.0.0.1', port: 0 }
    })
    page = await browser.newPage({
      viewport: { width: 1000, height: 1100 },
      reducedMotion: 'reduce'
    })
    await page.goto(server.resolvedUrls.local[0])
    await page.locator('html[data-hydrated=true]').waitFor()
    report.hydration = await page.evaluate(() => ({
      errors: window.__hydrationErrors,
      sameInput: window.__serverInput === document.querySelector('input'),
      sameIds:
        JSON.stringify(window.__serverIds) ===
        JSON.stringify([...document.querySelectorAll('[id]')].map(node => node.id))
    }))
    assert.deepEqual(report.hydration, { errors: [], sameInput: true, sameIds: true })
    await exerciseCompositions(page, server.resolvedUrls.local[0], report, output)
    console.log(
      `Installed compositions: ${report.cases.length} recipe/theme/mode/owner cases passed; SSR hydration and open-modal cleanup passed.`
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
    report.finishedAt = new Date().toISOString()
    writeFileSync(path.join(output, 'results.json'), `${JSON.stringify(report, null, 2)}\n`)
    await browser.close()
    if (server) await new Promise(resolve => server.httpServer.close(resolve))
  }
}
