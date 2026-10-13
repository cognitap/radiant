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

Cognitap pins exact published versions. Optional local integration installs a
built package through the same compiled exports; normal consumption after
migration does not require Radiant's source checkout.

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
