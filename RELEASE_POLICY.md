# Radiant release policy

Radiant releases independently of Cognitap deployments.

## Versions

Releases follow [SemVer](https://semver.org/). `0.x` releases are experimental
and publish under `latest`; say so in the README and release notes. `1.0.0`
follows once the full catalog, its documentation, and accessibility
and compatibility verification are complete.

Use the largest applicable bump. A fix that requires consumers to adapt is
breaking, even for accessibility or security. Published versions are immutable.
Prereleases use a version suffix and their own npm tag, never `latest`.

## Public contract

The contract covers documented props and types, package exports, behavior,
semantic tokens, named parts, state attributes and functional CSS requirements.
Breaking changes include incompatible changes to any of these, sizing or layout
changes consumers must adapt to, raised peer dependency ranges and narrowed
environment support.

## Support

Only the latest release is maintained: the latest `0.x` before `1.0.0`, then the
current major. There are no backports or response deadlines.

Every published version gets a changelog entry with one line per user-visible
change. Mark breaking changes and show a short before and after.
From `1.0.0`, deprecate in a minor before removing in a major; during `0.x`,
direct removal is allowed.

## Release workflow

Releases use native pnpm versioning and reviewed changelog notes. In a pull
request, run `pnpm version patch --no-git-tag-version` (or `minor`, following
the rules above), move the applicable Unreleased notes under a `## <version>`
heading in `CHANGELOG.md` and commit both. The first release keeps `0.0.1`.

From a clean checkout, `pnpm release:prepare` checks the version and notes,
builds and packs once, runs the installed consumer check against that archive
and dry-runs its publication. It writes `dist/release/radiant.tgz` and a
`release.json` receipt recording the version, source commit and SHA-512
integrity. Source checks are left to CI, which must pass before merging to
`main`.

Only experimental `0.x` versions are accepted. Enabling `1.0.0` requires a
reviewed change to the release script backed by the complete catalog,
documentation and accessibility/compatibility audit.

The manual **Release Radiant** workflow prepares and uploads a candidate. With
`publish` selected on `main`, a separate job holding npm OIDC permission
publishes that same archive and checks that npm's integrity matches the
receipt. Preparation refuses to publish while the manifest is `private`.

### First publication

Confirm the npm account can publish to the `@cognitap` scope and recheck the MIT
notice, then remove `private` in a reviewed change. Publish the first candidate
manually, since trusted publishing needs an existing package. When the next
release is ready, add an npm trusted publisher for repository
`cognitap/radiant`, workflow `release.yml` and environment `npm`, enable direct
publishing, restrict that GitHub environment to `main`, and publish through it
within two days before the unused configuration expires. Published versions cannot be republished to test
the setup. Later releases publish from the workflow with provenance and no
stored token; the first authenticated local publication has no CI provenance.

### Failed publication and fixes

Fix the cause and rerun the failed publish job; it reuses the original
candidate. The job checks npm before uploading, skips an existing version
only when its integrity matches, and retries verification while npm propagates
the release. A different integrity fails immediately. Never change source or
regenerate a candidate to retry. To verify manually:

```sh
pnpm view @cognitap/radiant@<version> dist.integrity
```

If it matches the receipt, the release succeeded; if it differs, stop and
investigate. Published versions are immutable, so fixes ship as a new version
with new notes.
