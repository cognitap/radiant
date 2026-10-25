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

### Default-composition closeout

Completed 25 October 2026.

The follow-up review also checked the remaining default paths against the
composition contract, rather than assuming a themed screenshot proved reuse:

| Family                 | Checked default path                                                        |
| ---------------------- | --------------------------------------------------------------------------- |
| Button                 | Owns the native action host and shared action presentation.                 |
| Link                   | Button-styled links reuse the action recipe and retain an anchor.           |
| Dialog                 | Trigger/Close render Button with both part identities.                      |
| Accordion              | Item/Trigger/Content compose Collapsible and retain native details/summary. |
| RadioGroup             | Composes Field's fieldset; choices remain native labelled radios.           |
| Field, Input, Checkbox | Native input hosts retain their Field label relationships.                  |
| Card                   | Remains a passive surface; ordinary story actions use Button/Link.          |

Source inspection found no other parallel action recipe. The only raw action
buttons in stories are in Dialog's explicitly named native interoperability
example. Public-export server-rendered checks verify canonical action
presentation, single native hosts, disclosure composition, fieldset composition,
label relationships, and passive Card actions. These supplement the earlier
theme/mode screenshots and interaction results; they do not declare the later
public API and part-targeting migrations complete.

No further visual findings remain from the requested Chrome Storybook review.

### Dialog correction and regression checks

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

## 2026-10-25 — canonical example reconciliation (DEV-130)

This pass reviews the assembled examples after the family migrations. It extends
the earlier visual audit; it does not claim another screenshot pass over every
historical story and Docs page. Runtime contracts are unchanged.

| Family      | Reconciliation                                                                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Button      | Ordinary Composition uses the default host; the consumer-owned native adapter lives in Customisation. Keyboard actions keep visible counters.                                                                            |
| Link        | Existing public Link actions/router adapter retained; destinations remain real fragments or deliberate external links. Workspace adds a unique native privacy destination.                                               |
| Field       | Ordinary examples use Input/Checkbox. The explicit native adapter is named in the sidebar.                                                                                                                               |
| Input       | Existing labelled/controlled examples retained; Workspace reuses canonical Field ownership and validation.                                                                                                               |
| Checkbox    | Public native checkbox form retained; Reset now clears stale submission feedback, with a live status output.                                                                                                             |
| RadioGroup  | Field-composed native radio form retained; Reset clears submission feedback. Independent form owners remain intact.                                                                                                      |
| Dialog      | Default keeps unadapted Trigger/Close and native method=dialog submission; removed the inert Continue action. Ancestor-form composition is explicitly named interoperability. Workspace uses the canonical product form. |
| Collapsible | Summary remains native. Track now has visible feedback through shared ShipmentTracking; native exclusive group names are unique per example instance.                                                                    |
| Accordion   | Collapsible composition retained; the same ShipmentTracking replaces its inert action. No Button is inserted in summary.                                                                                                 |
| Card        | Existing canonical form and Button/Link examples retained. Workspace supplies the cross-family assembly without a new Card interaction model.                                                                            |

Recipes → Workspace → Settings is one interface across all ten families. It
reuses ProfileExample with native ownership and Dialog placement, with no new
profile form or per-family visual overrides. Shared preview selection supplies
theme and mode. Its play covers invalid submission, valid save, focus restoration,
nested disclosure use and destination identity. Existing disclosure/form plays
cover tracking feedback and native reset feedback.

A source scan leaves raw action/control hosts only in the documented Button,
Dialog, Link and Field adapters/interoperability examples. The named-theme gallery
is the sole story-level ThemeScope; the fixed Card illustration is confined to
Customisation. Ordinary styles supply layout or shared semantic spacing.

The assembled interface was exercised at 390px in all eight themes and both
explicit modes. Checks covered invalid/valid submit, reset defaults, keyboard
access to Cancel in the bounded scrolling modal, trigger focus restoration,
nested disclosures, real fragment navigation and viewport fit. The 32 modal and
workspace screenshots were visually reviewed. Docs was checked in Glass/Dark and
with actual toolbar switching to Default/Light on a fresh server. The older hot
reload session showed stale Docs; the fresh server applied both scopes correctly.
Manual checks disabled autoplay with embed=true; normal matrix plays stayed on.

Final verification results and the exact revision are recorded on the DEV-130 PR.
DEV-57 retains final installed-consumer architecture evidence; this pass owns
example coherence and its actual Storybook behavior.
