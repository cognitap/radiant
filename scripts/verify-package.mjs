import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const { devDependencies } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)))
const consumer = mkdtempSync(path.join(tmpdir(), 'radiant-consumer-'))
const archive = path.resolve(process.argv[2] ?? path.join(consumer, 'radiant.tgz'))
const run = (command, args, cwd = consumer) =>
  execFileSync(command, args, {
    cwd,
    env: { ...process.env, NODE_PATH: undefined },
    stdio: 'inherit',
    timeout: 180_000
  })

try {
  cpSync(new URL('../tests/consumer/', import.meta.url), consumer, { recursive: true })
  if (!process.argv[2]) run('pnpm', ['pack', '--out', archive], root)
  run('npm', [
    'install',
    '--no-save',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    archive,
    ...['react', 'react-dom', '@types/react', '@types/react-dom', 'typescript'].map(
      name => `${name}@${devDependencies[name]}`
    )
  ])
  run('npm', ['test'])
} finally {
  rmSync(consumer, { recursive: true, force: true })
}
