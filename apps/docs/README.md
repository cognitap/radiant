# Radiant documentation app

Private Next.js app using Fumadocs Core and Fumadocs MDX. It renders the local
Radiant package through its public exports and compiled stylesheet. It has no
Fumadocs UI or other component-library dependency.

Run commands from the repository root with the pinned Node/pnpm toolchain.

```sh
pnpm install --frozen-lockfile
pnpm docs:dev
```

Open [localhost:3001](http://127.0.0.1:3001). The initial build creates Radiant's
JavaScript, declarations and styles before starting Next.js. The same command
watches library TypeScript, compiled CSS and generated theme CSS alongside the
docs dev server. Edit MDX in `apps/docs/content/docs` or library code in `src`;
the local workspace package follows the rebuilt public artifacts.

For a static production build and preview:

```sh
pnpm build:docs
pnpm docs:preview
```

`apps/docs/out` contains the exported site. The preview server serves real files
and directory indexes, including direct loads of `/docs/button/`, and returns
404 for unknown routes. It does not require a Next.js runtime or Python.

For verification:

```sh
pnpm docs:typecheck
pnpm exec playwright install chromium
pnpm test:docs
```

The browser smoke check builds the site, checks HTML without JavaScript, then
verifies navigation, direct-load hydration, pointer/keyboard activation, generated
CSS, a narrow viewport and 404 handling. Screenshots go to `output/docs`.
`pnpm check` includes this check after the existing library and Storybook gates.

The site always identifies itself as a **current source preview**. Its local
workspace dependency may contain APIs not yet published on npm. Production
hosting and registry-aligned public release instructions belong to DEV-141;
shared recipes and the reusable demo frame belong to DEV-137 and DEV-138.

Dependencies are scoped to this private workspace app. The root package's
publication allowlist excludes the app, generated MDX, Next.js artifacts and
static output.
