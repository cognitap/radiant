# Maintaining Radiant

Radiant development and merge decisions belong to the owner and trusted
maintainers. Public source does not imply an open contribution process; discuss
proposed contributions with a maintainer before starting work.

Report bugs and accessibility problems through
[GitHub issues](https://github.com/cognitap/radiant/issues). Include reproduction
steps and relevant browser, operating-system and assistive-technology versions.
Linear remains the maintainers' internal planning tool.

Changes to `main` go through pull requests with passing CI. No approval from a
second reviewer is required; a maintainer may merge their own pull request.
Required checks apply to administrators too. Force pushes and deletion of `main`
are blocked.

Use the pinned toolchain and commands in [README.md](README.md). Keep dependency
changes with the lockfile, run `pnpm check` before proposing a change, and include
consumer-facing changes and migration guidance in [CHANGELOG.md](CHANGELOG.md).
The pre-commit hook formats staged files; CI runs the complete checks.

Radiant's source, tooling and releases are maintained here independently of
Cognitap. Changes spanning both repositories use coordinated commits. Cognitap's
workspace copy is transitional until its applications migrate to published
versions; subsequent Radiant changes originate here.

Follow [AGENTS.md](AGENTS.md) for component and styling conventions and
[RELEASE_POLICY.md](RELEASE_POLICY.md) for compatibility and publication rules.
The source is available under [MIT](LICENSE). npm publication remains disabled
until its package verification and release workflow are ready.
