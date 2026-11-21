import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { prune } from '../scripts/prune-dist.ts'

const fixture = () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'radiant-prune-'))
  const write = file => {
    mkdirSync(path.dirname(path.join(directory, file)), { recursive: true })
    writeFileSync(path.join(directory, file), '')
    return path.join(directory, file)
  }
  return { directory, write }
}

test('pruning removes stale output and empty folders but keeps emitted files', t => {
  const { directory, write } = fixture()
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const keep = new Set([write('index.js'), write('styles.css'), write('Button/Button.js')])
  const stale = [write('Button/Old.js'), write('Removed/Removed.js'), write('Removed/Removed.d.ts')]

  assert.deepEqual(prune(directory, keep).sort(), stale.sort())
  for (const file of keep) assert.ok(existsSync(file), file)
  for (const file of stale) assert.ok(!existsSync(file), file)
  assert.ok(!existsSync(path.join(directory, 'Removed')))
  assert.ok(existsSync(path.join(directory, 'Button')))
})

test('pruning never removes the output folder itself', t => {
  const { directory, write } = fixture()
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  write('stale/old.js')

  prune(directory, new Set())
  assert.ok(existsSync(directory))
})

test('pruning deletes nothing when an expected file was not built', t => {
  const { directory, write } = fixture()
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const stale = write('old.js')

  assert.throws(() => prune(directory, new Set([path.join(directory, 'index.js')])), /missing/)
  assert.ok(existsSync(stale))
})
