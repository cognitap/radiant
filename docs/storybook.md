# Storybook

Run `pnpm storybook` and open [http://localhost:6006](http://localhost:6006).

The toolbar controls two independent settings across Canvas and Docs:

- **Theme** selects a preset from `@cognitap/radiant/examples` (default: `Radiant`).
- **Mode** selects `Light`, `Dark`, or `System`.

Each story renders inside the same `ThemeScope` that applications use. **System → Theming → Comparison** is the only story that renders multiple presets side by side.

## Writing stories

Stories live next to their component at `src/components/<Family>/<Family>.stories.tsx` and import from the public entry points.

- **No themes in stories.** Stories may set layout width, grid, or gap, but never a theme preset, mode, or canvas background.
- **Use public parts.** Raw native elements belong only in adapter examples (such as `Button` or `Link` `render` adapters, or `Field`'s `children(controlProps)`).
- **Keep navigation in the frame.** Use `#fragment` links so clicks do not navigate the preview iframe away.
- **Keep instances isolated.** Docs pages render multiple stories on one page, so give radio groups and forms distinct names or scopes.
- **Fit both Canvas and Docs.** Story layouts must fit inside the narrower Docs preview column without horizontal overflow. Story files are not scanned by the library Tailwind build; use inline styles or classes defined in `.storybook/styles.css`.
- **Do not mount modal dialogs open.** An initially open `<dialog>` steals focus and scrolls the Docs page; open dialogs from a trigger or inside `play`.

Shared multi-component examples live in `.storybook/examples/` (`FormExamples.tsx`, `ProfileForm.tsx`) and `src/recipes/Workspace.stories.tsx`.

## Verification

`pnpm test:browser` runs every story's `play` function and an axe scan across presets in light and dark modes; see [testing](testing.md).

When inspecting a story manually in the browser, add `&embed=true` to the story iframe URL to skip `play` functions. For visual, zoom, and screen-reader checks, see [accessibility](accessibility.md).
