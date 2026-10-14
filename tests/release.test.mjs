import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { validateRelease } from '../scripts/prepare-release.mjs'

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const notes = `# Changelog\n\n## ${manifest.version}\n\n- Experimental release.\n`
const publication = { publish: true, ref: 'refs/heads/main', repository: 'cognitap/radiant' }

test('private experimental releases can be prepared, but cannot be published', () => {
  validateRelease({ ...manifest, private: true }, notes)
  assert.throws(
    () => validateRelease({ ...manifest, private: true }, notes, publication),
    /Publication is disabled/
  )
})

test('versions and changelog notes must identify the same reviewed release', () => {
  assert.throws(
    () => validateRelease(manifest, notes, { version: `${manifest.version}-different` }),
    /Requested version/
  )
  for (const changelog of ['## Unreleased\n\n- Pending.\n', `## ${manifest.version}\n\n`]) {
    assert.throws(() => validateRelease(manifest, changelog), /nonempty CHANGELOG/)
  }
})

test('stable and prerelease publication cannot bypass the experimental gate', () => {
  for (const version of ['1.0.0', '2.0.0', '0.1.0-beta.1', '0.01.0']) {
    assert.throws(
      () => validateRelease({ ...manifest, version }, `## ${version}\n\n- Notes.\n`),
      /Only ordinary experimental/
    )
  }
})

test('real publication requires reviewed public metadata and authoritative main', () => {
  const publicManifest = { ...manifest, private: false }
  validateRelease(publicManifest, notes, publication)
  assert.throws(
    () => validateRelease(publicManifest, notes, { ...publication, ref: 'refs/heads/topic' }),
    /merged main/
  )
  assert.throws(
    () => validateRelease(publicManifest, notes, { ...publication, repository: 'someone/radiant' }),
    /authoritative GitHub/
  )
  assert.throws(
    () =>
      validateRelease(
        {
          ...publicManifest,
          publishConfig: { ...manifest.publishConfig, registry: 'https://example.com/' }
        },
        notes,
        publication
      ),
    /Unexpected publication registry/
  )
})
