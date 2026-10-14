import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export function validateRelease(
  manifest,
  changelog,
  { version = manifest.version, publish = false, ref, repository } = {}
) {
  assert.equal(manifest.name, '@cognitap/radiant', 'Unexpected package identity.')
  assert.equal(manifest.version, version, 'Requested version must match package.json.')
  assert.match(
    version,
    /^0\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/,
    'Only ordinary experimental 0.x releases are enabled. Stable publication needs a reviewed catalog/documentation/accessibility/compatibility readiness change.'
  )
  assert.equal(manifest.license, 'MIT', 'The selected MIT license is required.')
  assert.equal(
    manifest.repository?.url,
    'git+https://github.com/cognitap/radiant.git',
    'Repository metadata must identify the authoritative public source.'
  )
  assert.equal(
    manifest.publishConfig?.registry,
    'https://registry.npmjs.org/',
    'Unexpected publication registry.'
  )
  assert.equal(manifest.publishConfig?.access, 'public', 'The package must be public.')
  assert.equal(manifest.publishConfig?.tag, 'latest', 'Experimental releases use latest.')
  const section = changelog
    .replaceAll('\r\n', '\n')
    .split(/^## /m)
    .find(value => value.startsWith(`${version}\n`))
  assert.ok(
    section?.slice(version.length).trim(),
    `Add nonempty CHANGELOG.md notes under ## ${version}.`
  )
  if (publish) {
    assert.ok(
      !manifest.private,
      'Publication is disabled. DEV-94 must verify npm permissions and deliberately remove private in a reviewed change.'
    )
    assert.equal(
      repository,
      'cognitap/radiant',
      'Publication requires the authoritative GitHub repository.'
    )
    assert.equal(ref, 'refs/heads/main', 'Publication requires a merged main commit.')
  }
}

export function computeIntegrity(buffer) {
  return `sha512-${createHash('sha512').update(buffer).digest('base64')}`
}

export function verifyCandidate(receipt, archiveBuffer, { sourceCommit, version }) {
  assert.equal(receipt.name, '@cognitap/radiant', 'Unexpected receipt package identity.')
  assert.equal(receipt.version, version, 'Receipt version must match requested version.')
  assert.equal(receipt.sourceCommit, sourceCommit, 'Receipt commit must match current commit.')
  assert.equal(receipt.archive, 'radiant.tgz', 'Unexpected receipt archive filename.')
  assert.equal(receipt.registry, 'https://registry.npmjs.org/', 'Unexpected receipt registry.')
  assert.equal(receipt.tag, 'latest', 'Unexpected receipt publication tag.')
  assert.equal(
    receipt.integrity,
    computeIntegrity(archiveBuffer),
    'Archive integrity must match receipt.'
  )
}

export function verifyRegistryIntegrity(receipt, registryIntegrity) {
  assert.equal(registryIntegrity, receipt.integrity, 'Registry integrity must match receipt.')
}

if (import.meta.main) {
  const mode = process.argv[2] ?? 'prepare'
  const root = fileURLToPath(new URL('../', import.meta.url))
  const directory = new URL('../dist/release/', import.meta.url)
  const archive = new URL('radiant.tgz', directory)
  const receiptFile = new URL('release.json', directory)

  if (mode === 'verify-candidate') {
    const receipt = JSON.parse(readFileSync(receiptFile, 'utf8'))
    verifyCandidate(receipt, readFileSync(archive), {
      sourceCommit: process.env.GITHUB_SHA,
      version: process.env.RELEASE_VERSION
    })
  } else if (mode === 'verify-registry') {
    const receipt = JSON.parse(readFileSync(receiptFile, 'utf8'))
    const registryIntegrity = JSON.parse(
      readFileSync(new URL('registry-integrity.json', directory), 'utf8')
    )
    verifyRegistryIntegrity(receipt, registryIntegrity)
  } else {
    assert.equal(mode, 'prepare', `Unknown release mode: ${mode}`)
    rmSync(directory, { recursive: true, force: true })
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
    validateRelease(manifest, readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8'), {
      version: process.env.RELEASE_VERSION ?? manifest.version,
      publish: process.env.RELEASE_PUBLISH === 'true',
      ref: process.env.GITHUB_REF,
      repository: process.env.GITHUB_REPOSITORY
    })
    const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
    const run = (command, args) => execFileSync(command, args, { cwd: root, stdio: 'inherit' })
    assert.equal(
      git('status', '--porcelain'),
      '',
      'Commit version/changelog and source changes before preparing a release.'
    )
    const sourceCommit = git('rev-parse', 'HEAD')
    run('pnpm', ['check:source'])
    mkdirSync(directory, { recursive: true })
    run('pnpm', ['pack', '--out', fileURLToPath(archive)])
    run(process.execPath, ['scripts/verify-package.mjs', fileURLToPath(archive)])
    assert.equal(
      git('status', '--porcelain'),
      '',
      'Release preparation changed tracked source files.'
    )
    const receipt = {
      name: manifest.name,
      version: manifest.version,
      sourceCommit,
      archive: 'radiant.tgz',
      registry: manifest.publishConfig.registry,
      tag: manifest.publishConfig.tag,
      integrity: computeIntegrity(readFileSync(archive))
    }
    run('pnpm', [
      'publish',
      fileURLToPath(archive),
      '--dry-run',
      '--no-git-checks',
      '--ignore-scripts',
      '--access',
      manifest.publishConfig.access,
      '--tag',
      receipt.tag,
      '--registry',
      receipt.registry
    ])
    writeFileSync(receiptFile, `${JSON.stringify(receipt, null, 2)}\n`)
    console.log(`Verified release candidate: ${fileURLToPath(directory)} (${sourceCommit})`)
  }
}
