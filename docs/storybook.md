# Inspecting Radiant in Storybook

Use the [system guide](system.md) for the shared theme, state, host-target and
composition contract; this guide explains how to inspect its live examples.

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
when removing presentation duplication. **Recipes → Workspace → Settings** is the
canonical assembled product interface across all ten families. It combines Card,
Accordion, Collapsible and Link with the existing profile form in Dialog; that
form composes Field, Input, Checkbox, RadioGroup/Radio and Button. Its play saves
preferences, restores focus, opens nested help and verifies the Link destination.
The example inherits the toolbar's theme and mode without its own ThemeScope.

**Recipes → Forms** contains the canonical
native and TanStack profile forms. Its placement control reuses either recipe
standalone, in Card, or in Dialog. It replaces the small Field/Input form stories;
the source is `.storybook/examples/ProfileForm.tsx`, outside the shipped library.

Docs can render a story more than once. Give independent native radio examples
their own form owners or unique group names, so selecting an option in one
preview cannot silently clear another preview's selection.

Raw hosts belong to explicitly identified interoperability or Customisation
examples: Button's native adapter, Link's router adapter, Field's native control
adapter, Dialog's ancestor form and outside-trigger cases. Ordinary product
examples use the public Radiant parts and default Button composition. Native
forms, details/summary, headings and fragment destinations retain their semantics.
The comparison gallery and decorative art in Card Customisation remain deliberate
inspection/customisation examples rather than ordinary product styling.

Keep example navigation inside the preview with unique native fragment targets,
or use a deliberate external destination. Actions should expose a visible result.
Preserve supplied callbacks and adjustable args. Layout wrappers must fit both
Canvas and the narrower Docs frame; a percentage width alone can shrink to the
intrinsic child width in a centered preview. Stories are excluded from the
library utility scan: use inline layout styles, or explicitly register private
example utilities in `.storybook/styles.css`.

An initially open dialog can take focus and scroll the whole Docs page. Open
nonmodal Docs examples from a trigger; Canvas can still demonstrate their
initially open state.

## Verification

Use the **Accessibility** panel and testing widget alongside keyboard, focus,
and contrast checks. `pnpm test:browser` renders every story, runs its play and
fails on axe violations in all eight themes and both explicit modes. It also
runs native keyboard, modal, cancellation/ref, lifecycle and hydration scenarios.
`pnpm check` and CI require this browser matrix alongside runtime/package checks
and the Storybook build. See [verification conventions](testing.md) for setup,
focused runs, failure artifacts and migration evidence. Automated accessibility
checks cover only part of WCAG. Use the [browser/AT matrix](accessibility.md)
for versioned evidence, manual scenarios and the unverified combinations.

Dialog Default compares its unadapted Trigger and Close with a canonical Button
in the same scope. This guards the actual default call site; a comparison that
manually replaces every action with Button would hide a broken default.

The comparison story's play function checks the actual rendered canvases,
component palettes, Sharp 3D borders/shadows, and controls inside Card content
and footers. Checkbox and RadioGroup States
check disabled selection visibility and alignment; Field Customisation checks
the native host's visible boundary and forwarded relationships. These checks
read the rendered result without moving focus in Docs. Plays run when a Canvas
story is opened in a browser; Docs requires opting into autoplay or invoking
them explicitly. The browser test integration executes these same plays in CI;
it does not require visiting each story manually.

When changing global application, verify toolbar selection and navigation,
Canvas and Docs, Ticket to Default reset, explicit modes versus System, ghost
text against the actual canvas, and a native modal Dialog. Check the running
Storybook, not only a separately constructed stylesheet fixture.

For a shared styling change, inspect every story and Docs page in all eight
themes, in explicit Light and Dark, after fonts and rendering have settled.
Review screenshots as well as dimensions and computed colors. Add narrow
viewport checks, then exercise hover, press, keyboard focus, disabled selection,
native form reset, nested disclosures, and modal opening on the affected
families. Check translucent controls against their actual painted background.
Check default composition against the shared component contract as well as
visual legibility. A known default-action violation must be fixed or explicitly
reported as unresolved; a future migration issue is not a reason to call the
audit complete. Keep ordinary comparisons on default composition so explicit
replacement callbacks cannot mask missing component reuse.
For manual interaction checks, add `embed=true` to the iframe URL so Storybook's
play does not compete with your inputs. The normal browser matrix still executes
plays. Wait for the story scope as well as the Docs scope to apply the selected
theme/mode before capturing a toolbar change. If a long-running development
session retains stale Docs after story edits, repeat on a fresh Storybook server
before treating that state as a runtime regression.

Recheck corrected combinations after the source change. The
[October 2026 audit](storybook-audit-2026-10.md) records the first complete pass.

The configuration follows Storybook's [globals and toolbar interface](https://storybook.js.org/docs/essentials/toolbars-and-globals)
and [custom documentation container interface](https://storybook.js.org/docs/writing-docs/autodocs#customize-the-docs-container).
