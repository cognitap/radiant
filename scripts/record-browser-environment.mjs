import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(import.meta.url)
const run = (command, args) => execFileSync(command, args, { cwd: root, encoding: 'utf8' }).trim()

export function browserEnvironment(browser) {
  const platform = {
    name: os.platform(),
    version: os.version(),
    kernel: os.release(),
    arch: os.arch()
  }
  if (os.platform() === 'darwin') {
    platform.productVersion = run('sw_vers', ['-productVersion'])
    platform.build = run('sw_vers', ['-buildVersion'])
  } else if (os.platform() === 'linux' && existsSync('/etc/os-release')) {
    platform.distribution = readFileSync('/etc/os-release', 'utf8')
      .split('\n')
      .find(line => line.startsWith('PRETTY_NAME='))
      ?.slice('PRETTY_NAME='.length)
      .replace(/^"|"$/g, '')
  }
  return {
    recordedAt: new Date().toISOString(),
    revision: run('git', ['rev-parse', 'HEAD']),
    dirty: Boolean(run('git', ['status', '--porcelain'])),
    platform,
    tools: {
      node: process.version,
      playwright: require('playwright/package.json').version,
      vitest: require('vitest/package.json').version
    },
    browser: { engine: 'chromium', version: browser.version(), headless: true },
    assistiveTechnology: { name: null, version: null, status: 'not-run' },
    ciRun:
      process.env.GITHUB_ACTIONS === 'true'
        ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : null,
    result: 'Environment only; pair with the completed JUnit report and manual evidence.'
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const output = new URL('../output/browser/', import.meta.url)
  mkdirSync(output, { recursive: true })
  // Clear earlier reports before a run can produce new environment metadata.
  for (const name of ['environment.json', 'junit.xml'])
    rmSync(new URL(name, output), { force: true })
  const browser = await chromium.launch({ headless: true })
  try {
    const receipt = browserEnvironment(browser)
    writeFileSync(new URL('environment.json', output), `${JSON.stringify(receipt, null, 2)}\n`)
    console.log(
      `Recorded ${receipt.browser.engine} ${receipt.browser.version} environment in output/browser/environment.json`
    )
  } finally {
    await browser.close()
  }
}
