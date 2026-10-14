import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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
  execFileSync(command, args, { cwd: consumer, env, stdio: 'inherit', timeout: 180_000 })
try {
  writeFileSync(
    path.join(consumer, 'package.json'),
    JSON.stringify({
      private: true,
      type: 'module',
      dependencies: { '@cognitap/radiant': `file:${archive}` },
      devDependencies: Object.fromEntries(
        ['react', 'react-dom', '@types/react', '@types/react-dom', 'typescript'].map(name => [
          name,
          manifest.devDependencies[name]
        ])
      )
    })
  )
  for (const file of ['package.test.mjs', 'types.ts', 'tsconfig.json']) {
    cpSync(new URL(file, import.meta.url), path.join(consumer, file))
  }
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'])
  const require = createRequire(path.join(consumer, 'package.json'))
  const entry = require.resolve('@cognitap/radiant')
  const installed = path.resolve(path.dirname(entry), '../..')
  const installedManifest = JSON.parse(readFileSync(path.join(installed, 'package.json'), 'utf8'))
  assert.equal(installedManifest.license, 'MIT')
  for (const file of ['LICENSE', 'README.md', 'CHANGELOG.md', 'RELEASE_POLICY.md']) {
    assert.ok(readFileSync(path.join(installed, file)).length > 0, file)
  }
  assert.equal(
    realpathSync(createRequire(entry).resolve('react')),
    realpathSync(require.resolve('react'))
  )
  assert.throws(() => require.resolve('tailwindcss'), { code: 'MODULE_NOT_FOUND' })
  run(process.execPath, ['--test', 'package.test.mjs'])
  const tsc = require.resolve('typescript/bin/tsc')
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
  console.log(`Verified @cognitap/radiant@${installedManifest.version}: ${archive}`)
  console.log(`SHA-256: ${createHash('sha256').update(readFileSync(archive)).digest('hex')}`)
} finally {
  rmSync(consumer, { recursive: true, force: true })
}
