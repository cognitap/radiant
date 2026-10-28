# Select platform proof

Run `pnpm build`, then `node scripts/prove-select.mjs` with Node 26.
Install the pinned Playwright engines first:
`pnpm exec playwright install chromium firefox webkit`.

Use `node scripts/prove-select.mjs --serve` to inspect the fixtures.
`PORT` defaults to 3012. `--browser=chromium` limits an automated run.

The fixtures compare a traditional native select, progressive `base-select`
styling and a small custom listbox. The custom fixture deliberately uses only
a hidden input for form participation: the required-validation probe exposes
what that shortcut cannot provide. It is not a production component.

Results and screenshots go to `output/browser/select-proof/`. Browser engines
are automated samples, not Safari, Edge, physical mobile or screen-reader
verification. Research and the implementation decision belong in the PR.
