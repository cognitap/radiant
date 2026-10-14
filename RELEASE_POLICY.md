# Radiant release policy

Confirmed in DEV-84 on 13 October 2026. Radiant releases independently of Cognitap
deployments; the owner and trusted maintainers control development and merges.

## Identity and licensing

This repository is the authoritative Radiant source. Its selected GitHub identity
is `cognitap/radiant`; the npm package is `@cognitap/radiant`.

The source is licensed under MIT. [LICENSE](LICENSE) contains the complete text
and names Zoltán Cserei as the copyright holder. Corporate formation is not a
prerequisite for source opening or npm publication. This decision supersedes
DEV-84's initial incorporation gate.

Keep `private: true` in the package manifest until npm publication prerequisites
pass. This prevents package publication while public source development proceeds.

## Versions

Start with ordinary `0.0.1` and publish experimental `0.x` releases under
`latest`. Make experimental status clear in the README and release notes.
The first stable release is `1.0.0`, after the complete 31-family catalog,
documentation and agreed accessibility and compatibility verification pass.

| Change                                              | During `0.x` | From `1.0.0` |
| --------------------------------------------------- | ------------ | ------------ |
| Compatible correction                               | Patch        | Patch        |
| Compatible addition, cosmetic change or deprecation | Minor        | Minor        |
| Breaking change                                     | Minor        | Major        |

Use the largest applicable bump. A correction that requires consumers to adapt
is breaking, including accessibility or security corrections. Pure internal
changes can use a patch when they preserve the public contract. Published
versions are immutable; follow-up fixes receive a new version.

Future previews can use prerelease suffixes and separate tags without replacing
the ordinary release under `latest`. Version numbers follow
[SemVer](https://semver.org/); [npm tags](https://docs.npmjs.com/cli/v11/commands/npm-dist-tag/)
select distribution channels independently.

## Compatibility and consumer requirements

The public contract includes documented props and types, exports, behavior,
semantic tokens, named parts, state attributes and functional CSS requirements.
Incompatible changes to these, or sizing/layout changes requiring consumer
adaptation, are breaking.

Raising consumer dependency requirements or narrowing the declared environment
support policy is also breaking. Versions aging out of an unchanged rolling
browser or OS support target do not themselves require a breaking release.
Record tested combinations separately from support targets.

Generated utility strings and foundation internals remain private. Package
exports define the supported import surface; shipping source for editor
navigation does not make internal imports supported.

React remains a peer dependency. Keep the current range initially; changes need
installed-package verification. The [package manifest](package.json) declares
current peer ranges and runtime dependencies. Contributor Node, pnpm and
TypeScript pins belong to development configuration and do not establish
consumer runtime or declaration requirements.

Ordinary consumers use compiled `styles.css` without Tailwind. The optional
`reset.css` is a separate, global opt-in; importing components loads neither
stylesheet automatically. Tailwind belongs to the optional `tailwind.css`
customization route, which registers the library theme and sources for the
application's own CSS generation. Choose one component stylesheet route.

Cognitap pins exact published versions after its migration. Optional local
development watches this package's public build and selects its exports through
process-only aliases. The apps use compiled JavaScript/types and the supported
Tailwind entry. Installed dependencies stay unchanged, so stopping needs no
restore step. Normal consumption after migration requires
only the published package. Local updates complement archive and registry
verification and do not replace publication readiness checks.

## Support and upgrades

Maintain the current stable major through its latest minor and patch releases.
Before `1.0.0`, fixes land in the latest experimental release. There is no
standing commitment to older release branches or response deadlines.

Every published version has a changelog entry describing its consumer-facing
changes and relevant verification limits. Identify breaking changes and include
actionable migration instructions. After `1.0.0`, normally deprecate in a minor
before removal in a major, without a fixed waiting period. During `0.x`, direct
removal is allowed with migration guidance.

## Publication readiness

Public source opening requires the finalized MIT notice, repository control and
verified standalone tooling. Initial npm publication additionally
requires scope permissions, compiled CSS, verified installed archives and an
independent release workflow.

Archives include the public build, stylesheet, editor-navigation sources, README,
LICENSE, changelog and this policy; exclude tests, stories and Storybook output.
The manifest's allowlist and exports define what ships and what is public.

The selected publishing configuration uses public npm access and `latest`.
Keep publication disabled until its prerequisites pass. Neither public source
nor an experimental package establishes stable catalog readiness or conformance
for an entire consumer application.

## Release workflow

Releases use native pnpm versioning and reviewed changelog notes. In a pull
request, run `pnpm version patch --no-git-tag-version` (or `minor`, following
the table above), move the applicable Unreleased notes under a `## <version>`
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

### First publication (DEV-94)

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

Fix the cause, such as scope access or trusted-publisher configuration, and
rerun the failed publish job; it reuses the original candidate. Never change
source or regenerate a candidate to retry. After a timeout, check whether npm
accepted the upload before retrying:

```sh
pnpm view @cognitap/radiant@<version> dist.integrity
```

If it matches the receipt, the release succeeded; if it differs, stop and
investigate. Published versions are immutable, so fixes ship as a new version
with new notes.
