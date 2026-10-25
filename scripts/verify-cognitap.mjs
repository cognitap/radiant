import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import {
  cpSync,
  createWriteStream,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { createRequire } from 'node:module'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { setTimeout } from 'node:timers/promises'
import { chromium } from 'playwright'
import { browserEnvironment } from './record-browser-environment.mjs'
import { copyRecipes, exerciseCompositions, integrity, root } from './verify-compositions.mjs'

// Opt-in checkpoint of a fixed Cognitap checkout. Never changes that checkout or publishes.
const [checkoutArg, archiveArg] = process.argv.slice(2)
assert.ok(
  checkoutArg && archiveArg,
  'Usage: node scripts/verify-cognitap.mjs /path/to/cognitap /path/to/radiant.tgz'
)
const checkout = path.resolve(checkoutArg)
const archive = path.resolve(archiveArg)
const archivePackage = JSON.parse(
  execFileSync('tar', ['-xOf', archive, 'package/package.json'], { encoding: 'utf8' })
)
assert.equal(archivePackage.name, '@cognitap/radiant')
const archiveIntegrity = integrity(archive)
const output = path.join(root, 'output/browser/cognitap-compositions')
rmSync(output, { recursive: true, force: true })
mkdirSync(output, { recursive: true })
const env = {
  ...process.env,
  CI: '1',
  NEXT_TELEMETRY_DISABLED: '1',
  ASTRO_TELEMETRY_DISABLED: '1',
  COGNITAP_RADIANT_PATH: undefined,
  COGNITAP_RADIANT_CONFIG: undefined
}
const run = (args, cwd = snapshot) => {
  const execute = () =>
    execFileSync('pnpm', args, {
      cwd,
      env,
      encoding: 'utf8',
      timeout: 240_000,
      maxBuffer: 8 * 1024 * 1024
    })
  try {
    return execute()
  } catch (error) {
    const warning = String(error.stderr ?? '')
    if (!warning.includes('SecurityFatalError') || !warning.includes('Retry the same command'))
      throw error
    // Next's documented one-time reminder permits the identical command on retry.
    // Retain it; do not suppress the advisory or change the pinned framework here.
    writeFileSync(path.join(output, 'next-security-reminder.log'), warning)
    report.nextSecurityReminder =
      'The pinned Next version reported a known vulnerability; identical-command retry retained the warning. Upgrade remains separate work.'
    return execute()
  }
}
const git = args => execFileSync('git', ['-C', checkout, ...args], { encoding: 'utf8' }).trim()
const initialStatus = git(['status', '--porcelain'])
assert.equal(
  initialStatus,
  '',
  'Commit or stash Cognitap changes before recording a fixed snapshot'
)
const browser = await chromium.launch({ headless: true })
const snapshot = mkdtempSync(path.join(tmpdir(), 'radiant-cognitap-'))
const report = {
  ...browserEnvironment(browser),
  consumerRevision: git(['rev-parse', 'HEAD']),
  archive: { version: archivePackage.version, integrity: archiveIntegrity },
  fixture:
    'tracked Cognitap snapshot; installed dependencies; production builds; live aliases disabled',
  registry: {},
  applications: {},
  result: 'incomplete'
}
let server

async function start(application) {
  const probe = createServer()
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve))
  const port = probe.address().port
  await new Promise(resolve => probe.close(resolve))
  const log = createWriteStream(path.join(output, `${application}-server.log`))
  const args =
    application === 'helicon'
      ? ['exec', 'astro', 'preview', '--ignore-lock', '--host', '127.0.0.1', '--port', String(port)]
      : ['exec', 'next', 'start', '--hostname', '127.0.0.1', '--port', String(port)]
  server = spawn('pnpm', args, {
    cwd: path.join(snapshot, 'packages/applications', application),
    env,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  })
  server.stdout.pipe(log)
  server.stderr.pipe(log)
  const url = `http://127.0.0.1:${port}`
  for (let attempt = 0; attempt < 200; attempt++) {
    if (server.exitCode !== null)
      throw new Error(`${application} server exited; see its retained log`)
    try {
      if ((await fetch(url)).ok) return url
    } catch {}
    await setTimeout(100)
  }
  throw new Error(`${application} server did not start`)
}

async function stop() {
  if (!server) return
  const child = server
  server = undefined
  if (child.exitCode === null) {
    process.kill(-child.pid, 'SIGTERM')
    await new Promise(resolve => child.once('exit', resolve))
  }
}

function installRecipes() {
  for (const application of ['helicon', 'terminus']) {
    const app = path.join(snapshot, 'packages/applications', application)
    report.recipes = copyRecipes(path.join(app, 'src/components/radiant-proof'), '')
    if (application === 'helicon')
      writeFileSync(
        path.join(app, 'src/pages/radiant-proof.astro'),
        `---\nimport Layout from '../layouts/Layout.astro'\nimport { Compositions } from '../components/radiant-proof/Compositions'\n---\n<Layout title="Installed workspace settings"><Compositions client:load /></Layout>\n`
      )
    else {
      mkdirSync(path.join(app, 'src/app/radiant-proof'), { recursive: true })
      writeFileSync(
        path.join(app, 'src/app/radiant-proof/page.tsx'),
        `import { Compositions } from '../../components/radiant-proof/Compositions';export default function Page(){return <Compositions />}`
      )
    }
  }
}

async function verifyApplications(phase, results) {
  for (const application of ['helicon', 'terminus']) {
    const appOutput = path.join(output, `${phase}-${application}`)
    mkdirSync(appOutput)
    const app = path.join(snapshot, 'packages/applications', application)
    // Read the current pnpm link after replacing the registry package. Node's
    // same-process require.resolve cache can still point at its old installation.
    const library = realpathSync(path.join(app, 'node_modules/@cognitap/radiant'))
    assert.ok(
      library.startsWith(`${realpathSync(snapshot)}${path.sep}`),
      'Resolve installed Radiant inside the snapshot'
    )
    const version = JSON.parse(readFileSync(path.join(library, 'package.json'), 'utf8')).version
    assert.equal(version, phase === 'archive' ? archivePackage.version : report.registry.version)
    const manifest = JSON.parse(readFileSync(path.join(app, 'package.json'), 'utf8'))
    const result = (results[application] = {
      installedVersion: version,
      dependencies: { ...manifest.dependencies, ...manifest.devDependencies },
      cases: [],
      result: 'incomplete'
    })
    writeFileSync(
      path.join(appOutput, 'typecheck.log'),
      run(['--filter', `@cognitap/${application}`, 'typecheck'])
    )
    writeFileSync(
      path.join(appOutput, 'build.log'),
      run(['--filter', `@cognitap/${application}`, 'build'])
    )
    const page = await browser.newPage({
      viewport: { width: 1000, height: 1100 },
      reducedMotion: 'reduce'
    })
    try {
      await exerciseCompositions(
        page,
        `${await start(application)}/radiant-proof/`,
        result,
        appOutput,
        { presets: ['default', 'glass', 'sharp-3d'], placements: ['workspace', 'dialog'] }
      )
      console.log(
        `Cognitap ${phase} ${application}: ${result.cases.length} installed composition cases passed.`
      )
    } finally {
      await page.close()
      await stop()
    }
  }
}

try {
  execFileSync('tar', ['-x', '-C', snapshot], {
    input: execFileSync('git', ['-C', checkout, 'archive', report.consumerRevision], {
      maxBuffer: 32 * 1024 * 1024
    })
  })
  writeFileSync(
    path.join(output, 'registry-install.log'),
    run(['install', '--frozen-lockfile', '--ignore-scripts'])
  )
  const helicon = path.join(snapshot, 'packages/applications/helicon')
  const require = createRequire(path.join(helicon, 'package.json'))
  const pinned = JSON.parse(
    readFileSync(
      path.join(path.dirname(require.resolve('@cognitap/radiant')), '../../package.json'),
      'utf8'
    )
  )
  const exports = Object.keys(
    await import(pathToFileURL(require.resolve('@cognitap/radiant')))
  ).sort()
  report.registry = {
    version: pinned.version,
    exports,
    dist: JSON.parse(run(['view', `@cognitap/radiant@${pinned.version}`, 'dist', '--json']))
  }
  assert.ok(
    readFileSync(path.join(snapshot, 'pnpm-lock.yaml'), 'utf8').includes(
      report.registry.dist.integrity
    )
  )
  cpSync(path.join(snapshot, 'pnpm-lock.yaml'), path.join(output, 'registry-pnpm-lock.yaml'))
  for (const application of ['helicon', 'terminus']) {
    writeFileSync(
      path.join(output, `${application}-registry-build.log`),
      run(['--filter', `@cognitap/${application}`, 'build'])
    )
    const page = await browser.newPage()
    try {
      await page.goto(await start(application))
      assert.equal(await page.getByRole('button', { name: 'Radiant button' }).count(), 1)
      report.registry[application] = 'existing pinned-package page builds and renders Button'
    } finally {
      await page.close()
      await stop()
    }
  }
  const { devDependencies } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
  for (const application of ['helicon', 'terminus'])
    run([
      '--filter',
      `@cognitap/${application}`,
      'add',
      `@tanstack/react-form@${devDependencies['@tanstack/react-form']}`,
      '--save-exact',
      '--ignore-scripts'
    ])
  installRecipes()
  const missing = [
    'Button',
    'Link',
    'Field',
    'Input',
    'Checkbox',
    'RadioGroup',
    'Dialog',
    'Collapsible',
    'Accordion',
    'Card',
    'ThemeScope'
  ].filter(name => !exports.includes(name))
  if (missing.length) {
    try {
      run(['--filter', '@cognitap/helicon', 'build'])
      throw new Error('Expected the historical registry package to lack the harmonised API')
    } catch (error) {
      const text = `${error.stdout ?? ''}\n${error.stderr ?? ''}`
      assert.match(text, /is not exported|No matching export/)
      writeFileSync(path.join(output, 'registry-composition-unavailable.log'), text)
      report.registry.compositions = { result: 'unavailable', missing }
    }
  } else {
    report.registry.compositions = {}
    await verifyApplications('registry', report.registry.compositions)
  }
  for (const application of ['helicon', 'terminus']) {
    writeFileSync(
      path.join(output, `${application}-archive-install.log`),
      run([
        '--filter',
        `@cognitap/${application}`,
        'add',
        archive,
        `@tanstack/react-form@${devDependencies['@tanstack/react-form']}`,
        '--save-exact',
        '--ignore-scripts'
      ])
    )
  }
  cpSync(path.join(snapshot, 'pnpm-lock.yaml'), path.join(output, 'archive-pnpm-lock.yaml'))
  await verifyApplications('archive', report.applications)
  report.result = missing.length ? 'pass-with-registry-api-limit' : 'pass'
} catch (error) {
  report.result = 'fail'
  report.failure = error.stack
  throw error
} finally {
  await stop()
  await browser.close()
  report.checkoutUnchanged =
    git(['status', '--porcelain']) === initialStatus &&
    git(['rev-parse', 'HEAD']) === report.consumerRevision
  report.finishedAt = new Date().toISOString()
  writeFileSync(path.join(output, 'results.json'), `${JSON.stringify(report, null, 2)}\n`)
  rmSync(snapshot, { recursive: true, force: true })
}
