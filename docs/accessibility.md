# Browser and accessibility verification

This is Radiant's support-target matrix and evidence process for the current
ten-family batch. It defines what to check and how to report it. A target is a
configuration we intend to verify; only a dated result identifies what passed.
DEV-134 audits harmonisation coverage, DEV-57 checks installed compositions, and
DEV-83 owns the complete-catalog release audit.

The reference is [WCAG 2.2 A/AA](https://www.w3.org/TR/WCAG22/).
Component tests contribute evidence; conformance applies to
[whole pages and complete processes](https://www.w3.org/TR/WCAG22/#conformance-reqs).
[Automated tools require human judgment](https://www.w3.org/WAI/test-evaluate/tools/selecting/#what-evaluation-tools-can-do-and-can-not-do).
This matrix supplies neither a library-wide conformance claim nor certification.

## Targets and recorded coverage

For manual targets, use a stable browser/AT release on a vendor-supported OS.
Record the installed versions/builds, device and settings at the time of testing;
"latest" is a target-selection rule, never a version in an evidence record.
Record built-in VoiceOver against the exact OS version/build if a separate AT
version is unavailable. A desktop engine test does not verify a mobile browser,
and Playwright WebKit does not establish Safari/VoiceOver behavior.

| Target                                                                                             | Input / AT                                                                      | Evidence as of 2026-10-25                                                                                |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Pinned Playwright Chromium on the local macOS host                                                 | Automated browser input and axe; no AT                                          | Version-complete environment captured                                                                    |
| Pinned Playwright Chromium on Linux CI                                                             | Same automated suite; no AT                                                     | Each new run records its own environment and JUnit report; inspect that run's artifacts                  |
| Windows + Firefox                                                                                  | Keyboard and NVDA                                                               | **Not run**; browser, OS and NVDA versions unrecorded                                                    |
| macOS + Safari                                                                                     | Keyboard and VoiceOver                                                          | **Not run**; installed OS availability is not a test result                                              |
| iOS + Safari on a physical iPhone/iPad                                                             | Touch exploration and VoiceOver; external keyboard when claimed                 | **Not run**; device, OS/build, Safari and AT configuration unrecorded                                    |
| Android + Chrome on a physical device                                                              | Touch exploration and TalkBack; external keyboard when claimed                  | **Not run**; device, OS/build, Chrome and TalkBack versions unrecorded                                   |
| Desktop Chrome / Edge on supported Windows/macOS; Firefox and Safari on their supported desktop OS | Keyboard, zoom, visual rendering; real Windows contrast themes where applicable | **Not run as a version-complete manual matrix**; the historical Chrome review below is narrower evidence |

The open manual rows are known evidence gaps, not failures observed on those systems.

## Prepare a reproducible run

1. Use a fixed revision and matching JavaScript/CSS. Record the package or source
   revision, working-tree changes, CSS route (compiled or Tailwind), optional
   reset, custom overrides and font loading. Installed-consumer evidence must
   also identify its package version/archive integrity and fixture revision.
2. Open the [canonical stories and assembled recipes](architecture.md#examples-and-type-fixtures).
   Inspect native and TanStack form owners, standalone/Card/Dialog placement,
   and both default and replacement action paths. Use default Radiant parts in
   the ordinary path so an adapter cannot hide a broken composition.
3. Use the global Theme/Mode selectors. Disable autoplay for manual interactions
   with `embed=true`; wait for the story scope, fonts and mode to settle. Check
   Canvas and Docs when changing preview integration. See
   [Storybook inspection](https://github.com/cognitap/radiant/blob/main/docs/storybook.md#verification).
4. Record each tested preset/mode rather than writing "all themes" from a sample.
   The visual target is every preset in explicit light/dark, relevant states,
   and System preference switching. For each claimed browser/AT combination,
   execute the applicable scenarios below; record sampled combinations and leave
   the rest unverified. Recheck a defect's affected combinations after its fix.
5. Capture OS/browser/AT versions and settings before acting. Include locale,
   browser zoom, viewport, orientation, OS text/display scaling, keyboard access
   and screen-reader mode/verbosity/gesture customisations. Record OS reduced
   motion/contrast settings separately from browser emulation.

## Manual scenarios

Run desktop keyboard cases with the screen reader off, then with it on.
Observe browser focus and the screen reader's reading cursor separately.
Record conveyed names/roles/states and actual announcements; exact speech wording
can vary by settings. The platform instructions below are operating guidance,
not results for Radiant.

| ID                     | Action and expected observation                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| K1 — actions           | Tab/Shift+Tab through Button, Link and Dialog actions, including default/custom hosts. Enter/Space activate buttons; Enter follows a link, while Space keeps native anchor behavior. Pending/disabled actions retain their documented guards/cues. Press, move away, then release to check cancellation. Visible text is included in the accessible name.                                                                               |
| K2 — forms             | Read Field labels/help/required/error text and RadioGroup legend/options. Exercise text entry, checkbox checked/unchecked/mixed state, radio arrows/Space and disabled options. Submit invalid then valid data; hear the error relationship and saved/reset result. Reset restores the right owner and clears stale feedback in native and TanStack recipes.                                                                            |
| K3 — Dialog            | Open through default Trigger and a compatible replacement. Confirm name/description, appropriate initial focus, keyboard focus containment, background inertness, a reachable visible close action, Escape and focus restoration. Repeat with long content and a narrow viewport. Check nonmodal behavior separately; a modal's standard exit makes its contained Tab cycle legitimate.                                                 |
| K4 — disclosures       | Enter/Space toggle native summary; expanded state and meaningful heading/order reach AT. Closed content is excluded from reading/focus navigation while remaining mounted. Check nested Collapsible and single/multiple Accordion, disabled sections and independent instances. Keep native summary behavior rather than inventing button or roving-focus rules.                                                                        |
| K5 — composition       | Complete Recipes → Workspace: open the profile Dialog, correct an error, save/reset, open Privacy/Data retention and follow its Link. Check Card's reading order/heading and contained actions without adding a focus stop to its passive wrapper. Test reused forms and actual navigation/form data, not only a rendered role.                                                                                                         |
| V1 — palette and state | For every claimed theme/mode, inspect rest/hover/press/focus, invalid/required, pending, selected/mixed and disabled states. Measure rendered text, outlines and state indicators against adjacent/composited backgrounds, especially Glass gradients. Record sizes, ratios and any criterion exception; keep non-color cues.                                                                                                           |
| V2 — resizing          | Test native browser zoom at 200% text resize and a 1280 CSS px viewport at 400% zoom (320 CSS px effective width), plus actual narrow viewports. Apply the text-spacing overrides below together. Check clipping, two-axis scrolling, modal scrolling, sticky/overlay focus obstruction and portrait/landscape. A resized viewport alone is not browser-zoom evidence.                                                                  |
| V3 — preferences       | Enable real OS reduced motion and, on Windows, contrast themes/forced colors. Verify visible focus, selected/disabled/mixed marks, pending feedback and readable controls after decorative paint disappears. Label browser-emulated media checks as emulation; they do not establish real OS or AT behavior.                                                                                                                            |
| T1 — mobile AT         | On iOS/Android, explore by touch and swipe reading order, use heading/link/form navigation, activate with double-tap, edit and dismiss the on-screen keyboard, select options and submit/correct/reset the form. Open/close Dialog and verify touch/reading containment and restoration. Ensure collapsed/disabled/background items are treated appropriately. Measure the real label/control hit area and spacing, not only its glyph. |

Native radio reverse-entry behavior can differ between browsers when no option
is checked; record the behavior instead of forcing the ARIA example's focus
model. [APG radio guidance](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).
Use the [modal Dialog guidance](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
for content-dependent initial focus and restoration. APG is informative guidance;
its examples do not certify a library's browser/AT compatibility.

### Operating the required AT pairs

| Pair                        | Procedure and primary reference                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NVDA + Firefox / Windows    | Record NVDA's installed version and browse/focus settings. Use `NVDA+Space` to switch browse/focus modes; Tab/Shift+Tab also exercise native focus. Browse with heading/link/form/button/checkbox/radio commands and test actual input in focus mode. Capture the relevant Speech Viewer output alongside focus observations. [NVDA browse mode](https://download.nvaccess.org/documentation/userGuide.html#BrowseMode), [Speech Viewer](https://download.nvaccess.org/documentation/userGuide.html#SpeechViewer). |
| VoiceOver + Safari / macOS  | Record Safari, OS/build, VoiceOver modifier and Safari/macOS keyboard navigation settings. Use `VO+Left/Right` to read, `VO+Space` to activate, and `VO+Shift+Down/Up` to enter/exit groups; use the rotor for headings/links/forms. Test plain Tab order as a separate observation. [Apple VoiceOver guide](https://support.apple.com/guide/voiceover/vo4be8816d70/mac), [rotor](https://support.apple.com/guide/voiceover/mchlp2719/mac).                                                                        |
| VoiceOver + Safari / iOS    | Record device, iOS build, Safari context and VoiceOver settings. Touch explores; swipe Right/Left moves next/previous; double-tap activates. Use the rotor's headings/links/form-control categories and check the on-screen keyboard and modal boundaries. [Apple gestures](https://support.apple.com/guide/iphone/iph3e2e2281/ios), [Safari](https://support.apple.com/guide/iphone/iphe4ee74be8/ios).                                                                                                            |
| TalkBack + Chrome / Android | Record Android/build, device, Chrome and installed TalkBack version/settings. Touch explores; swipe Right/Left moves next/previous; double-tap activates; two-finger swipe scrolls. Use reading controls for headings/links/controls, accounting for customised gestures. [Google Chrome guidance](https://support.google.com/accessibility/android/answer/2633135?hl=en), [TalkBack gestures](https://support.google.com/accessibility/android/answer/6151827?hl=en).                                             |

## WCAG evidence map

These are relevant requirements to assess, not passed criterion cells. Each run
records applicability and an observed outcome for the criteria it covers. Follow
the linked definitions/exception rules; the list is not a complete product audit.

| Scenario / requirement area       | Relevant A/AA criteria and evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| K1–K5, T1: semantics and content  | [1.1.1 A](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html), [1.3.1 A](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html), [1.3.2 A](https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html), [2.4.4 A](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html), [2.4.6 AA](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html), [2.5.3 A](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html), [3.3.2 A](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html), [4.1.2 A](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html): capture reading order, accessible names, grouping, roles/states and meaningful instructions. |
| K1–K5: keyboard and focus         | [2.1.1 A](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html), [2.1.2 A](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html), [2.4.3 A](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html), [2.4.7 AA](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html), [2.4.11 AA](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html): record the key sequence, focus order, visible indicator, exit and overlay/scroll behavior.                                                                                                                                                                                                                                                                      |
| K2/K5: input, errors and feedback | [1.3.5 AA](https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html), [3.2.1 A](https://www.w3.org/WAI/WCAG22/Understanding/on-focus.html), [3.2.2 A](https://www.w3.org/WAI/WCAG22/Understanding/on-input.html), [3.3.1 A](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html), [3.3.3 AA](https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html), [4.1.3 AA](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html): record purpose metadata where applicable, context changes, error/correction text and actual status announcements without focus theft. Opening a dialog is not itself a status message.                                                                                             |
| V1: visual information            | [1.4.1 A](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), [1.4.3 AA](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [1.4.11 AA](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html): record non-color cues and measured contrast on actual backgrounds. Normal text needs 4.5:1; large text needs 3:1; required control/state visual information needs 3:1 against adjacent colors.                                                                                                                                                                                                                                                                                                                           |
| V2/T1: adaptable layout           | [1.3.4 AA](https://www.w3.org/WAI/WCAG22/Understanding/orientation.html), [1.4.4 AA](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), [1.4.10 AA](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [1.4.12 AA](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html): retain content/function at the tested zoom, effective width, spacing and orientation; record any applicable exceptions.                                                                                                                                                                                                                                                                                                                                      |
| K1/T1: pointer and targets        | [2.5.2 A](https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation.html), [2.5.8 AA](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): record cancellation behavior and measured target/spacing, or the precise exception used.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Additional hover/focus content    | [1.4.13 AA](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html): if extra content appears, check dismissal, hoverability and persistence; an ordinary paint-only hover effect is not extra content.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

Keep these distinctions explicit:

- **Focus:** 2.4.7 and 2.4.11 are AA. Minimum non-obscuring forbids total coverage
  by author content. The stronger two-pixel-perimeter rule in
  [2.4.13 Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)
  is AAA, not an AA minimum.
- **Targets:** 2.5.8's AA minimum is 24×24 CSS px unless a specified exception
  applies. For its spacing exception, centre a 24px-diameter circle on each
  undersized target's bounding box: it must intersect neither another target
  nor another undersized target's circle. Other exceptions are an equivalent
  conforming control on the same page, inline text constraints, unmodified
  user-agent sizing, and essential/legally required presentation. Styled native
  controls are not automatically exempt. Record the chosen exception and geometry.
- **Contrast:** large text is at least 18pt, or 14pt bold. Apply the criterion's
  inactive/decorative/logotype and unmodified-UA exceptions where applicable;
  record disabled legibility as usability evidence even when exempt.
- **Spacing:** test line height 1.5×font size, paragraph spacing 2×font size,
  letter spacing 0.12×font size and word spacing 0.16×font size together, with
  applicable language/script exceptions. These are resilience tests, not required
  default typography settings.
- **Preferences:** forced-colors and reduced-motion checks are part of Radiant's
  functional CSS target. An emulated preference or a `motion-reduce` class proves
  neither an OS/AT result nor complete WCAG conformance.

## Record and retain evidence

`pnpm test:browser` first writes `output/browser/environment.json` from the
installed Chromium and host OS, then runs the existing tests. Preflight clears
prior environment/JUnit files first so an interrupted run cannot reuse an old
pass. Preserve an old run before starting the next. The receipt contains
exact browser/Node/Playwright/Vitest versions, OS/build details, revision, dirty
flag and CI run link. AT is explicitly `not-run`. It is environment metadata,
not a passing test result: pair it with the completed `junit.xml`, actual project/
case selection, logs and manual evidence. A failed or interrupted suite does not
inherit a prior pass from the receipt. The current command runs Chromium only.

CI uploads these files as **browser-results** with a 14-day retention period.
Before they expire, put the version/result summary and relevant captures in the
pull request, with a link to the exact CI run and commit.
A preview/run of the environment recorder alone has no test-result status.

Use this structure for each actual manual or automated run:

```text
Record ID, date/time, tester and method (manual / automated / emulated)
Source revision + dirty changes, package integrity/fixture, CSS/reset/fonts
OS/version/build, device, browser/version, AT/version (or bundled OS build)
AT mode/verbosity/custom gestures, keyboard/zoom/scaling/viewport/orientation
Preset/mode and state; scenario IDs; applicable WCAG criteria or N/A reason
Steps + expected outcome + observed outcome / actual announcement / ratio / geometry
Result per case: pass / fail / not-run / incomplete / not-applicable (with reason)
JUnit/log/capture/transcript links; defect issue + affected combinations
Retest revision and result; remaining untested combinations/criterion gaps
```

A failure gets a reproducible issue and an affected-combination list; link its
fix and retest instead of erasing it. An inconclusive axe result stays incomplete
until reviewed. Never turn a missing manual result into pass, N/A or "supported".
Publishing this process can complete DEV-47 while the manual matrix remains open;
those gaps continue into DEV-134/DEV-83's readiness decisions.

## Consumer responsibilities

Radiant supplies native semantics, relationships and functional styling. Product
owners provide meaningful names/headings/content, valid form instructions and
errors, appropriate initial focus, sensible navigation, validation/persistence,
font assets and theme/adapter choices. They must verify their rendered colors,
content, responsive layouts, complete tasks and any overrides/host replacements.
Page language/titles, consistent navigation, authentication, data-entry/error
prevention and other page/process criteria also need product-level applicability
and evidence. Neither a passing library matrix nor a paid certificate replaces
that evaluation. Follow the [architecture doc](architecture.md) when composing the controls.
