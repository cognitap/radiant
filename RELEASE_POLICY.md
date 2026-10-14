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

Start with ordinary `0.1.0` and publish experimental `0.x` releases under
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

Use native pnpm versioning and a reviewed changelog; no release framework is
needed for this single package. Prepare a release in a normal pull request:

```sh
pnpm version patch --no-git-tag-version # or minor, following the policy above
```

Move the applicable Unreleased notes into a nonempty `## <version>` section in
`CHANGELOG.md`, then commit the manifest, lockfile changes if any, and notes.
The first experimental release already has version `0.1.0` and prepared notes;
do not bump it just to publish it. Keep `private: true` until DEV-94 verifies npm
scope access and enables publication through a reviewed source change.

From a clean committed checkout, run:

```sh
pnpm release:prepare
```

This validates identity/version/notes, runs source checks, packs once, runs the
installed consumer check against that exact archive, and dry-runs its
publication. `dist/release/radiant.tgz` and `release.json` retain the candidate,
source commit, version, registry, tag and SHA-512 integrity. Public consumer
checks run once in this path. Dry-run does not prove authentication or namespace
permissions. A failed preparation does not authorize publishing its outputs.
Preparation replaces the previous local candidate; its receipt is written only
after every check and the publication dry-run succeed.

The **Release Radiant** GitHub Actions workflow accepts the committed version
and defaults to `publish: false`. Select the reviewed `main` commit for a real
release. Candidate artifacts are uploaded before a separate publishing job
receives OIDC permission. The publishing job checks source/integrity, publishes
the same archive, waits for registry availability, and compares npm's integrity
with the receipt. It never removes `private` or repacks after verification.
Workflow attempts retain separate artifacts. Rerunning only a failed publishing
job reuses its original prepared candidate.

Only ordinary experimental `0.x` releases under `latest` are currently enabled.
Stable versions and formal previews are rejected. Enabling the first `1.0.0`
requires a reviewed change to the release gate, linked to complete catalog,
documentation and accessibility/compatibility evidence. No workflow checkbox
can substitute for that audit.

### npm setup and first publication (DEV-94)

Confirm the authenticated account can publish within the `@cognitap` scope and
recheck the full MIT notice naming Zoltán Cserei before removing `private`.
Corporate formation is not required. Prepare and verify a new candidate after
that source change; do not edit an existing archive to make it public.

The package must exist before configuring npm trusted publishing. Perform the
first authenticated publication of the exact candidate in DEV-94, then bind npm
trust to GitHub organization `cognitap`, repository `radiant`, workflow filename
`release.yml`, and environment `npm`. Enable the direct publish action. Configure
that GitHub environment to allow only `main`, with maintainer-controlled
protection. Complete the trusted publisher's first successful publication within
two days of adding it; an unused configuration expires.

Later workflow publishes use pnpm 12's native OIDC support and automatic
provenance for this public repository/package; no stored write token is needed.
The initial authenticated local publication has no CI provenance. Setup does
not couple Radiant publication to any Cognitap deployment.

See [pnpm publishing](https://pnpm.io/cli/publish) and
[npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

### Failed publication and follow-up fixes

Retain the workflow's candidate and receipt. Authentication failures require
checking scope access and the exact repository/workflow/environment trust
configuration. Never change source or regenerate a candidate silently on retry.

An availability timeout can occur after npm accepts the upload. Inspect the exact
version's `dist.integrity` and compare it with `release.json` before any retry:

```sh
pnpm view @cognitap/radiant@0.1.0 dist.integrity --json
```

If the version exists with matching integrity, do not republish it; finish
registry verification. If it differs, stop and investigate. If no version was
accepted, retry the same reviewed candidate after correcting the failure.
Published versions are immutable: consumer-facing fixes require a new version,
new notes and a newly verified archive. Preserve release artifacts outside
GitHub's 30-day retention window when a durable historical record is needed.
