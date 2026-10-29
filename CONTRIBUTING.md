# Maintaining Radiant

Radiant development and merge decisions belong to the owner and trusted
maintainers. Public source does not imply an open contribution process; discuss
proposed contributions with a maintainer before starting work.

Report bugs and accessibility problems through
[GitHub issues](https://github.com/cognitap/radiant/issues). Include reproduction
steps and relevant browser, operating-system and assistive-technology versions.

The maintainers' internal planning tool remains Linear.

Changes to `main` go through pull requests with passing CI.

Required checks apply to administrators too. Force pushes and deletion of `main`
are blocked.

Radiant's source, tooling and releases are maintained here independently of
Cognitap.

Follow [AGENTS.md](AGENTS.md) for component and styling conventions and
[RELEASE_POLICY.md](RELEASE_POLICY.md) for compatibility and publication rules.

The source is available under [MIT](LICENSE). Experimental npm releases use the
independent release workflow and verified package archives.

## Development

Use the Node.js version in `.nvmrc`. Any recent pnpm switches itself to the version
pinned in `package.json`:

```sh
nvm install && nvm use
npm install --global pnpm
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm storybook
```

Storybook runs at [localhost:6006](http://localhost:6006) and needs no Cognitap
checkout. Choose **Theme** and **Mode** in its toolbar; the selection applies
across component stories and Docs. Defaults are Radiant and System.
See the [Storybook guide](docs/storybook.md) for the shared story
structure and verification workflow.

| Command                | Purpose                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `pnpm storybook`       | Develop components in Storybook.                                                                                          |
| `pnpm build`           | Build JavaScript, declarations, and CSS into `dist/library`.                                                              |
| `pnpm watch`           | Rebuild on change, except `reset.css` (run `pnpm build` first).                                                           |
| `pnpm build:storybook` | Build static Storybook into `dist/storybook`.                                                                             |
| `pnpm lint`            | Run Oxlint, including accessibility rules.                                                                                |
| `pnpm format`          | Format with Oxfmt (`format:check` to check only).                                                                         |
| `pnpm typecheck`       | Check TypeScript.                                                                                                         |
| `pnpm test`            | Run style tests and verify the packed, installed package.                                                                 |
| `pnpm test:package`    | Verify the packed, installed package only.                                                                                |
| `pnpm test:browser`    | Run every story in every preset, plus native browser scenarios.                                                           |
| `pnpm check`           | Theme check, format, lint, types, docs policy, build, repo checks, packed package, Storybook, and Radiant light and dark. |
| `pnpm release:prepare` | Pack and verify a release candidate, then dry-run publishing.                                                             |

Package verification installs the archive with npm, so it needs network access.
A Husky pre-commit hook formats staged files with Oxfmt.
[CI](.github/workflows/ci.yml) runs `pnpm check` for pull requests and pushes
to `main`.
See [verification conventions](docs/testing.md) for focused browser runs,
failure artifacts, and the evidence required by migration issues.

Modules must stay free of import-time side effects, and client-dependent modules
need their own `use client` directive. Add `*.stories.tsx` next to each component,
like `src/Button.stories.tsx`. Storybook's Accessibility panel runs axe checks on
every story, but automated checks cover only part of WCAG, so still test keyboard,
focus, and screen reader behavior by hand.

### Live development in Cognitap

With this checkout at `../radiant` and its dependencies installed, `pnpm dev` in
Cognitap builds and watches it, points both apps at it, and starts this Storybook.
Cognitap's installed package, manifests, and lockfile stay untouched. See
[Cognitap's guide](https://github.com/cognitap/cognitap#live-radiant-development)
for other checkouts and type checking.
