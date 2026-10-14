import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const manifest = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
const archives = path.join(root, 'dist/package')
if (!process.argv[2]) {
  mkdirSync(archives, { recursive: true })
  execFileSync('pnpm', ['pack', '--pack-destination', archives], { cwd: root, stdio: 'inherit' })
}
const archive = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(archives, `cognitap-radiant-${manifest.version}.tgz`)
const consumer = mkdtempSync(path.join(tmpdir(), 'radiant-consumer-'))
const env = { ...process.env }
delete env.NODE_PATH
const run = (command, args) =>
  execFileSync(command, args, {
    cwd: consumer,
    env,
    stdio: 'inherit',
    timeout: 180_000
  })
let browser
let server
try {
  cpSync(new URL('consumer/', import.meta.url), consumer, { recursive: true })
  for (const file of ['types.ts', 'tsconfig.json']) {
    cpSync(new URL(file, import.meta.url), path.join(consumer, file))
  }
  writeFileSync(
    path.join(consumer, 'package.json'),
    JSON.stringify(
      {
        name: 'radiant-isolated-consumer',
        private: true,
        type: 'module',
        dependencies: {
          '@cognitap/radiant': `file:${archive}`,
          react: manifest.devDependencies.react,
          'react-dom': manifest.devDependencies['react-dom']
        },
        devDependencies: Object.fromEntries(
          ['@types/react', '@types/react-dom', 'typescript', 'vite'].map(name => [
            name,
            manifest.devDependencies[name]
          ])
        )
      },
      null,
      2
    )
  )
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'])
  run(process.execPath, ['verify.mjs'])
  const tsc = path.join(consumer, 'node_modules/typescript/bin/tsc')
  run(process.execPath, [tsc, '-p', 'tsconfig.json'])
  run(process.execPath, [
    tsc,
    '-p',
    'tsconfig.json',
    '--module',
    'ESNext',
    '--moduleResolution',
    'Bundler'
  ])
  const vitePath = path.join(consumer, 'node_modules/vite/dist/node/index.js')
  const vite = await import(vitePath)
  await vite.build({ root: consumer, configFile: false })
  server = await vite.preview({
    root: consumer,
    configFile: false,
    preview: { host: '127.0.0.1', port: 0 }
  })
  browser = await chromium.launch()
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(server.resolvedUrls.local[0])
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true')
  const button = page.getByRole('button', { name: 'Continue', exact: true })
  const status = page.getByRole('status')
  assert.equal(await button.getAttribute('type'), 'button')
  await button.click()
  await page.waitForFunction(
    () => document.querySelector('output').textContent === 'Clicks: 1; Submits: 0'
  )
  await button.focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Space')
  await page.waitForFunction(
    () => document.querySelector('output').textContent === 'Clicks: 3; Submits: 0'
  )
  const disabled = page.getByRole('button', { name: 'Unavailable' })
  assert.equal(await disabled.isDisabled(), true)
  await disabled.evaluate(el => el.click())
  assert.equal(await status.textContent(), 'Clicks: 3; Submits: 0')
  // Tab skips the disabled native button and reaches the consumer-named submit control.
  await page.keyboard.press('Tab')
  assert.equal(
    await page
      .getByRole('button', { name: 'Save', exact: true })
      .evaluate(el => el === document.activeElement),
    true
  )
  await page.keyboard.press('Enter')
  await page.waitForFunction(
    () => document.querySelector('output').textContent === 'Clicks: 3; Submits: 1'
  )
  const styles = await button.evaluate(el => {
    const css = getComputedStyle(el)
    return { display: css.display, background: css.backgroundColor, radius: css.borderRadius }
  })
  assert.equal(styles.display, 'inline-flex')
  assert.notEqual(styles.background, 'rgba(0, 0, 0, 0)')
  assert.notEqual(styles.radius, '0px')
  // Default component CSS does not reset unrelated headings or the page margin.
  assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).margin), '8px')
  assert.notEqual(
    await page.locator('h1').evaluate(el => getComputedStyle(el).marginBlockStart),
    '0px'
  )
  await button.focus()
  assert.equal(await button.evaluate(el => el.matches(':focus-visible')), true)
  assert.notEqual(await button.evaluate(el => getComputedStyle(el).outlineStyle), 'none')
  assert.deepEqual(errors, [])
  assert.equal(await status.textContent(), 'Clicks: 3; Submits: 1')
  console.log(
    `Chromium ${browser.version()}: installed CSS, hydration, naming, mouse, keyboard, disabled and form behavior passed`
  )
  console.log(`Archive verified: ${archive}`)
  console.log(`SHA-256: ${createHash('sha256').update(readFileSync(archive)).digest('hex')}`)
} finally {
  await browser?.close()
  await server?.close()
  rmSync(consumer, { recursive: true, force: true })
}
