# Storybook

Run `pnpm storybook` and open [localhost:6006](http://localhost:6006).

The toolbar has two independent choices, and both carry across stories and
Docs:

- **Theme** picks a preset from the public `themes` registry. The default is
  Radiant.
- **Mode** picks Light, Dark or System. The default is System, which follows the
  browser.

Stories are wrapped in the same `ThemeScope` that applications use. The
Storybook UI itself keeps its own look. **System → Theming → Comparison** shows
every preset side by side in the selected mode; it is the only story that
picks presets itself.

## Writing stories

Stories import from `./index.js`, the public exports. Each family uses the same
kinds of story:

| Kind          | Purpose                                              | Examples                                                 |
| ------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| Default       | The smallest useful example, with controls           | One Button, one labelled Input, one disclosure           |
| States        | Differences worth inspecting                         | Disabled, pending, invalid, checked/mixed, open          |
| Composition   | How the family works with native elements and others | Field relationships, native forms, actions inside Dialog |
| Customisation | One focused styling or adapter example               | A token override, a class, a router adapter              |

Only add the states a family really has. Card has no disabled state.

- **No themes in stories.** Layout wrappers may set width, grid or spacing, but
  never a preset, canvas or mode.
- **Use the public parts.** Raw native hosts belong only in clearly named
  adapter examples, such as Button's native adapter or Link's router adapter.
- **Make actions visible.** Show a result, and keep navigation inside the preview
  with fragment links unless the destination is deliberately external.
- **Keep instances independent.** Docs can render a story twice, so give radio
  examples their own form or a unique group name.
- **Fit both frames.** Layouts must fit Canvas and the narrower Docs frame.
  Stories are not scanned for library utilities, so use inline styles or
  register example classes in `.storybook/styles.css`.
- **Open dialogs from a trigger in Docs.** An initially open dialog takes focus
  and scrolls the Docs page.

The canonical forms are **Components → Form**
(`.storybook/examples/FormExamples.tsx`): workspace creation, server recovery
and optional TanStack values. The profile placement recipe
(`.storybook/examples/ProfileForm.tsx`) supports standalone, Card and Dialog
surfaces. **Recipes → Workspace → Settings** combines the original ten families.
Reuse these compositions when their tasks match.

## Verification

`pnpm test:browser` runs every story's play and axe in every preset and mode;
see [testing](testing.md). Plays run when you open a story in Canvas. In Docs
they only run if you opt in. Use the Accessibility panel and the testing widget
while you work.

For a shared styling change, check by hand:

- every story and Docs page in each preset, in explicit Light and Dark, after
  fonts load;
- a narrow viewport;
- hover, press, keyboard focus, disabled selection, form reset, nested
  disclosures and opening a modal on the affected families;
- translucent controls against their real background.

For a change to the Storybook preview itself, also check:

- toolbar selection and navigation, in both Canvas and Docs;
- that switching from Ticket to Default resets correctly;
- explicit modes against System;
- ghost text against the real canvas, and a native modal Dialog.

For manual interaction, add `embed=true` to the iframe URL so plays don't
interfere. If Docs look stale after editing a story, restart Storybook before
treating it as a bug. For screen readers and WCAG, see
[accessibility](accessibility.md).
