# Storybook visual audit — 24 October 2026

The audit used the running Storybook in Chrome, starting from commit `949db6f`.
It covered the public registry's Radiant, Default, Soft Squircle, Expressive,
Glass, Sharp 3D, Jelly, and Ticket presets in explicit Light and Dark modes.

## Coverage

| Baseline area                                  | Examples | Theme/mode combinations |
| ---------------------------------------------- | -------: | ----------------------: |
| Button, Link, Card Canvas                      |       16 |                     256 |
| Field, Input, Checkbox, RadioGroup Canvas      |       20 |                     320 |
| Collapsible, Accordion, Dialog, Theming Canvas |       22 |                     352 |
| All Docs pages                                 |       11 |                     176 |
| Total                                          |       69 |                   1,104 |

Screenshots were visually reviewed alongside rendered styles, overflow,
accessible names, and native state. Captures waited for the selected scope,
completed Storybook rendering, fonts, and layout to settle. The comparison page
was also exercised with all sixteen global selections, including named nested
scopes and modal dialogs.

Additional checks covered 375px layouts, keyboard focus, action hover/press,
native fragment navigation, disabled and mixed selection, native fieldset
disabling, form reset, controlled state, nested disclosure markers, and modal
opening/dismissal. Corrected examples were recaptured across all sixteen
theme/mode combinations. Every Docs page was rechecked at desktop and 375px
widths after the fixes.

## Corrections

- Input, Checkbox, and Radio outlines were too faint. One private derivation
  mixes the shared border with foreground, retaining explicit component and
  state overrides. The smallest observed enabled boundary contrast after the
  change was 3.13:1 against sampled inside and outside backgrounds.
- Disabled selection marks disappeared on neutral fills in fifteen of sixteen
  combinations. They now use muted foreground by default, with system GrayText
  for disabled marks in forced colors. Explicit component mark colors still win
  in ordinary color mode.
- Inherited large control radii made checkboxes resemble radios. The inherited
  checkbox radius is capped at 25% of its size; explicit overrides remain exact.
- Field's custom native input lost its visible surface under the reset. The
  example now supplies deliberate semantic styling while forwarding `useField`.
- A closed nested disclosure inherited the outer disclosure's rotated marker.
  The marker now follows its immediate native details/summary ancestry. Summary
  focus geometry uses the same theme roles as the root surface.
- Glass dialogs showed underlying trigger text through their form. A dedicated
  dialog panel filter frosts it without changing the modal overlay background.
- Sharp 3D Light subtle-link hover text had 1.79:1 contrast against its canvas.
  Its hover override now retains the readable semantic foreground.
- FullWidth Button did not actually fill its demonstration frame. Fixed-width
  disclosure examples overflowed narrow screens, and centered Docs frames could
  clip the left side of examples. Layouts now respect the available frame.
  The theme comparison also uses responsive padding, a shrinkable form grid,
  and bounded actions so Sharp 3D controls retain the Card's inner inset.
- Docs boolean labels and toolbar links used unsuitable fixed or accent colors.
  They now use readable semantic colors. Prop tables scroll inside their
  container while retaining native table semantics.
- An initially open nonmodal Dialog scrolled Docs to its focused button. Docs
  opens that example on reader interaction; Canvas retains the initial-open demo.
- Placeholder routes led to empty preview pages, and several actions gave no
  feedback. Examples now use unique native fragment destinations and visible
  consumer-owned action results.

The earlier Glass frame, Checkbox alignment, Ticket indicator, and button-link
interaction corrections in this PR were included in the baseline inspection.

## Ongoing checks

The initial audit missed Dialog's default action composition. Dialog still
rendered a separate button recipe, while the theme comparison explicitly
replaced its actions with Button. The audit verified theme rendering and
interaction without comparing the default actions to Button, and incorrectly
treated the known DEV-119 work as outside the visual review's scope.

The follow-up removes that recipe: default DialogTrigger and DialogClose now
compose Button, and the theme comparison uses those defaults. Dialog Default
has a read-only rendered-style comparison against a canonical Button in the
same scope. Its play rejects the old styling. Browser checks cover all eight
themes in both modes, Canvas and Docs, including hover, press, keyboard focus,
modal opening/closing, and focus restoration. Runtime tests cover presentation,
pending/disabled guards, cancellation, refs, replacement compatibility, and
compound part identities. A complete visual audit must include default
composition; screenshot counts alone do not establish that contract.

The existing comparison play checks canvases, component palettes, Sharp 3D
effects, and nested Card control bounds. New read-only plays guard disabled selected indicators and the native
Field customisation. Run these in a browser in addition to `pnpm check`, which
builds Storybook and checks the package but does not execute browser plays.
See [the inspection guide](storybook.md#verification) for the repeatable review
sequence. Browser CI infrastructure remains separate work.

This pass covers Chrome rendering and interaction. Cross-browser and screen
reader verification were not part of this audit.
