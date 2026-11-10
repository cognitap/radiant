import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import test from 'node:test'

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

test('every Node.js version pin names the release in .nvmrc', () => {
  const version = read('.nvmrc').trim()
  assert.match(version, /^\d+\.\d+\.\d+$/)
  assert.equal(JSON.parse(read('package.json')).devEngines.runtime.version, version)
  assert.equal(read('pnpm-workspace.yaml').match(/^nodeVersion: (.+)$/m)?.[1], version)
  for (const file of readdirSync(new URL('../.github/workflows/', import.meta.url))) {
    const workflow = read(`.github/workflows/${file}`)
    assert.equal(
      workflow.match(/node-version-file: \.nvmrc/g)?.length ?? 0,
      workflow.match(/uses: actions\/setup-node@/g)?.length ?? 0,
      `${file} sets up Node.js without reading .nvmrc`
    )
  }
})
