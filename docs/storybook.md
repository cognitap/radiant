# Inspecting Radiant in Storybook

Run `pnpm storybook` and open [localhost:6006](http://localhost:6006).

The toolbar has two independent choices:

- **Theme** (initially labelled **Radiant**) selects a preset from Radiant's public `themes` registry. Radiant is
  the default. Preset IDs, rather than labels or list positions, identify themes.
- **Mode** (initially labelled **System**) selects Light, Dark, or System. System is the default and follows the
  browser's appearance preference. An explicit Light or Dark choice overrides it.

The choices follow you between stories and documentation. Canvas backgrounds,
foregrounds, typography, and documentation previews use the same public
`ThemeScope` as applications. The Storybook sidebar and toolbars keep their own
appearance. There is no independent background selector to put a dark palette
on a light canvas.

**System → Theming → Comparison** is the deliberate exception to theme selection:
it shows every named preset side by side, while inheriting the selected mode.
Use ordinary component stories to inspect one preset across different families.
See [the theming guide](theming.md) for token defaults, font requirements, nested
scopes, and authoring a theme.

## Story conventions

Component stories use public exports from `./index.js`. A reader should find
the same small structure in each family:

| Kind          | Purpose                                                      | Examples                                                 |
| ------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| Default       | The smallest useful, named example, with adjustable controls | One Button, one labelled Input, one disclosure           |
| States        | Meaningful differences that need inspection                  | Disabled, pending, invalid, checked/mixed, open          |
| Composition   | How the family works with native elements and other families | Field relationships, native forms, actions inside Dialog |
| Customisation | A focused local styling or adaptation example                | A semantic token override, a class, a router adapter     |

Keep useful state names in the sidebar; these kinds describe the organisation,
not a requirement to create four copies of every example. Card does not need
invented disabled or pending states. A controlled example explains ownership;
it does not add a second theme wrapper. Examples use the currently implemented
public interface; later contract migrations update them with their modules.

Ordinary stories inherit the central theme and mode. Layout wrappers may set
width, grid, or spacing, but do not choose a preset, paint a fixed canvas, or
override the global mode. Keep preset comparisons in the one system comparison
page. Local customisation should demonstrate a narrow exception to the selected
theme, rather than another hardcoded theme gallery.

Meta descriptions identify the native host, relevant props, and named parts.
Preserve native form, controlled-state, focus, nesting, and adapter examples
when removing presentation duplication. Canonical application and TanStack
integration examples remain owned by their component migration issues.

Docs can render a story more than once. Give independent native radio examples
their own form owners or unique group names, so selecting an option in one
preview cannot silently clear another preview's selection.

## Verification

Use the existing **Accessibility** panel alongside keyboard, focus, and contrast
checks. Automated accessibility checks cover only part of WCAG.

The comparison story's play function checks the actual rendered canvases,
component palettes, and Sharp 3D borders/shadows. It runs when that story is
opened in a browser. `pnpm check` builds Storybook and runs the package/runtime
checks; it does not execute browser play functions. Browser test infrastructure
is tracked separately.

When changing global application, verify toolbar selection and navigation,
Canvas and Docs, Ticket to Default reset, explicit modes versus System, ghost
text against the actual canvas, and a native modal Dialog. Check the running
Storybook, not only a separately constructed stylesheet fixture.

The configuration follows Storybook's [globals and toolbar interface](https://storybook.js.org/docs/essentials/toolbars-and-globals)
and [custom documentation container interface](https://storybook.js.org/docs/writing-docs/autodocs#customize-the-docs-container).
