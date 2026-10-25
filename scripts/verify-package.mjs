import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const { devDependencies } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)))
const consumer = mkdtempSync(path.join(tmpdir(), 'radiant-consumer-'))
const styles = process.argv.includes('--styles')
const archiveArg = process.argv.slice(2).find(argument => argument !== '--styles')
const archive = path.resolve(archiveArg ?? path.join(consumer, 'radiant.tgz'))
if (styles)
  rmSync(new URL('../output/browser/installed-styles/', import.meta.url), {
    recursive: true,
    force: true
  })
const run = (command, args, cwd = consumer) =>
  execFileSync(command, args, {
    cwd,
    env: { ...process.env, NODE_PATH: undefined },
    stdio: 'inherit',
    timeout: 180_000
  })

try {
  cpSync(new URL('../tests/consumer/', import.meta.url), consumer, { recursive: true })
  if (!archiveArg) run('pnpm', ['pack', '--out', archive], root)
  const install = [
    'install',
    '--no-save',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    archive,
    ...['react', 'react-dom', '@types/react', '@types/react-dom', 'typescript'].map(
      name => `${name}@${devDependencies[name]}`
    )
  ]
  run('npm', install)
  run('npm', ['test'])
  if (styles) {
    const { verifyInstalledStyles } = await import('./verify-installed-styles.mjs')
    await verifyInstalledStyles(consumer, archive, () =>
      run('npm', [
        ...install,
        ...['tailwindcss', '@tailwindcss/cli'].map(name => `${name}@${devDependencies[name]}`)
      ])
    )
  }
} finally {
  rmSync(consumer, { recursive: true, force: true })
}
