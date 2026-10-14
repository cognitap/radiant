import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const directory = fileURLToPath(new URL('../dist/release/', import.meta.url))
const archive = `${directory}radiant.tgz`
const manifest = JSON.parse(readFileSync(`${root}package.json`, 'utf8'))
const changelog = readFileSync(`${root}CHANGELOG.md`, 'utf8')
const { version } = manifest
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const run = (command, args) => execFileSync(command, args, { cwd: root, stdio: 'inherit' })

rmSync(directory, { recursive: true, force: true })

assert.match(
  version,
  /^0\.\d+\.\d+$/,
  'Only experimental 0.x releases are enabled. 1.0.0 needs a reviewed catalog, documentation and accessibility/compatibility readiness change.'
)
const notes = changelog.split(/^## /m).find(section => section.startsWith(`${version}\n`))
assert.ok(notes?.slice(version.length).trim(), `Add CHANGELOG.md notes under ## ${version}.`)
if (process.env.RELEASE_PUBLISH === 'true') {
  assert.ok(!manifest.private, 'Publication stays disabled until DEV-94 removes private.')
}
assert.equal(git('status', '--porcelain'), '', 'Commit all changes before preparing a release.')

mkdirSync(directory, { recursive: true })
run('pnpm', ['build'])
run('pnpm', ['pack', '--out', archive])
run(process.execPath, ['scripts/verify-package.mjs', archive])
run('pnpm', ['publish', archive, '--dry-run', '--no-git-checks', '--ignore-scripts'])

const receipt = {
  version,
  sourceCommit: git('rev-parse', 'HEAD'),
  integrity: `sha512-${createHash('sha512').update(readFileSync(archive)).digest('base64')}`
}
writeFileSync(`${directory}release.json`, `${JSON.stringify(receipt, null, 2)}\n`)
console.log(`Prepared ${manifest.name}@${version} from ${receipt.sourceCommit} in ${directory}`)
