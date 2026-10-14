import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  computeIntegrity,
  validateRelease,
  verifyCandidate,
  verifyRegistryIntegrity
} from '../scripts/prepare-release.mjs'

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const committedChangelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8')
const notes = `# Changelog\n\n## ${manifest.version}\n\n- Experimental release.\n`
const publication = { publish: true, ref: 'refs/heads/main', repository: 'cognitap/radiant' }

test('private experimental releases can be prepared, but cannot be published', () => {
  validateRelease({ ...manifest, private: true }, committedChangelog)
  assert.throws(
    () => validateRelease({ ...manifest, private: true }, committedChangelog, publication),
    /Publication is disabled/
  )
})

test('versions and changelog notes must identify the same reviewed release', () => {
  validateRelease(manifest, notes.replaceAll('\n', '\r\n'))
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

test('candidate and registry verification enforce receipt metadata and SHA-512 integrity', () => {
  const archive = Buffer.from('radiant-archive')
  const receipt = {
    name: '@cognitap/radiant',
    version: manifest.version,
    sourceCommit: 'abc1234',
    archive: 'radiant.tgz',
    registry: 'https://registry.npmjs.org/',
    tag: 'latest',
    integrity: computeIntegrity(archive)
  }
  verifyCandidate(receipt, archive, { sourceCommit: 'abc1234', version: manifest.version })
  verifyRegistryIntegrity(receipt, receipt.integrity)
  assert.throws(
    () =>
      verifyCandidate(receipt, archive, { sourceCommit: 'different', version: manifest.version }),
    /Receipt commit/
  )
  assert.throws(
    () => verifyCandidate(receipt, archive, { sourceCommit: 'abc1234', version: '0.0.2' }),
    /Receipt version/
  )
  assert.throws(
    () =>
      verifyCandidate({ ...receipt, name: '@cognitap/other' }, archive, {
        sourceCommit: 'abc1234',
        version: manifest.version
      }),
    /package identity/
  )
  assert.throws(
    () =>
      verifyCandidate(receipt, Buffer.from('tampered'), {
        sourceCommit: 'abc1234',
        version: manifest.version
      }),
    /Archive integrity/
  )
  assert.throws(() => verifyRegistryIntegrity(receipt, 'sha512-different'), /Registry integrity/)
})
