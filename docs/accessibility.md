# Accessibility

What to check by hand, on which browsers and screen readers, and how to record
it. Automated tests are described in [testing](testing.md). The reference is
[WCAG 2.2 A/AA](https://www.w3.org/TR/WCAG22/). Component checks are evidence
toward it, but conformance applies to whole pages, so this is not a
certification.

## Targets

| Target                                                                                             | Input / AT                                                                      | Status                                                                                  |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Pinned Playwright Chromium on the local macOS host                                                 | Automated browser input and axe; no AT                                          | Version-complete environment captured                                                   |
| Pinned Playwright Chromium on Linux CI                                                             | Same automated suite; no AT                                                     | Each new run records its own environment and JUnit report; inspect that run's artifacts |
| Windows + Firefox                                                                                  | Keyboard and NVDA                                                               | **Not run**; browser, OS and NVDA versions unrecorded                                   |
| macOS + Safari                                                                                     | Keyboard and VoiceOver                                                          | **Not run**; installed OS availability is not a test result                             |
| iOS + Safari on a physical iPhone/iPad                                                             | Touch exploration and VoiceOver; external keyboard when claimed                 | **Not run**; device, OS/build, Safari and AT configuration unrecorded                   |
| Android + Chrome on a physical device                                                              | Touch exploration and TalkBack; external keyboard when claimed                  | **Not run**; device, OS/build, Chrome and TalkBack versions unrecorded                  |
| Desktop Chrome / Edge on supported Windows/macOS; Firefox and Safari on their supported desktop OS | Keyboard, zoom, visual rendering; real Windows contrast themes where applicable | **Not run as a version-complete manual matrix**                                         |

A row marked **Not run** is a gap, not a failure. Record exact versions when you
test; "latest" is not a version. Playwright WebKit does not stand in for Safari
with VoiceOver, and a desktop engine does not stand in for a mobile browser.

## Prepare a run

1. Use a fixed commit with matching JavaScript and CSS. Note the CSS route,
   reset, overrides and fonts.
2. Open the [canonical examples](architecture.md#examples-and-type-fixtures).
   Cover native and TanStack forms, standalone, Card and Dialog placement, and
   both default and `render` actions.
3. Pick the theme and mode in the Storybook toolbar. Add `embed=true` to the
   iframe URL so plays do not interfere. See
   [Storybook](storybook.md#verification).
4. Record each preset and mode you test. Never write "all themes" from a sample.
5. Record OS, browser and screen reader versions and settings first: zoom,
   viewport, text scaling, reduced motion and contrast settings.

## Scenarios

Run keyboard cases with the screen reader off, then on. Record what is conveyed
(names, roles, states), not exact wording.

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

Native radio entry with no option checked differs between browsers; record it
rather than forcing the [APG radio](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
model. Use the [APG modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
guidance for initial focus and restoration.

### Screen reader pairs

| Pair                        | Procedure and primary reference                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NVDA + Firefox / Windows    | Record NVDA's installed version and browse/focus settings. Use `NVDA+Space` to switch browse/focus modes; Tab/Shift+Tab also exercise native focus. Browse with heading/link/form/button/checkbox/radio commands and test actual input in focus mode. Capture the relevant Speech Viewer output alongside focus observations. [NVDA browse mode](https://download.nvaccess.org/documentation/userGuide.html#BrowseMode), [Speech Viewer](https://download.nvaccess.org/documentation/userGuide.html#SpeechViewer). |
| VoiceOver + Safari / macOS  | Record Safari, OS/build, VoiceOver modifier and Safari/macOS keyboard navigation settings. Use `VO+Left/Right` to read, `VO+Space` to activate, and `VO+Shift+Down/Up` to enter/exit groups; use the rotor for headings/links/forms. Test plain Tab order as a separate observation. [Apple VoiceOver guide](https://support.apple.com/guide/voiceover/vo4be8816d70/mac), [rotor](https://support.apple.com/guide/voiceover/mchlp2719/mac).                                                                        |
| VoiceOver + Safari / iOS    | Record device, iOS build, Safari context and VoiceOver settings. Touch explores; swipe Right/Left moves next/previous; double-tap activates. Use the rotor's headings/links/form-control categories and check the on-screen keyboard and modal boundaries. [Apple gestures](https://support.apple.com/guide/iphone/iph3e2e2281/ios), [Safari](https://support.apple.com/guide/iphone/iphe4ee74be8/ios).                                                                                                            |
| TalkBack + Chrome / Android | Record Android/build, device, Chrome and installed TalkBack version/settings. Touch explores; swipe Right/Left moves next/previous; double-tap activates; two-finger swipe scrolls. Use reading controls for headings/links/controls, accounting for customised gestures. [Google Chrome guidance](https://support.google.com/accessibility/android/answer/2633135?hl=en), [TalkBack gestures](https://support.google.com/accessibility/android/answer/6151827?hl=en).                                             |

## WCAG criteria

These are the criteria to assess for each scenario, not passed results.

| Scenario / requirement area       | Relevant A/AA criteria and evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| K1–K5, T1: semantics and content  | [1.1.1 A](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html), [1.3.1 A](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html), [1.3.2 A](https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html), [2.4.4 A](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html), [2.4.6 AA](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html), [2.5.3 A](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html), [3.3.2 A](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html), [4.1.2 A](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html): capture reading order, accessible names, grouping, roles/states and meaningful instructions. |
| K1–K5: keyboard and focus         | [2.1.1 A](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html), [2.1.2 A](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html), [2.4.3 A](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html), [2.4.7 AA](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html), [2.4.11 AA](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html): record the key sequence, focus order, visible indicator, exit and overlay/scroll behavior.                                                                                                                                                                                                                                                                      |
| K2/K5: input, errors and feedback | [1.3.5 AA](https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html), [3.2.1 A](https://www.w3.org/WAI/WCAG22/Understanding/on-focus.html), [3.2.2 A](https://www.w3.org/WAI/WCAG22/Understanding/on-input.html), [3.3.1 A](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html), [3.3.3 AA](https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html), [4.1.3 AA](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html): record purpose metadata where applicable, context changes, error/correction text and actual status announcements without focus theft. Opening a dialog is not itself a status message.                                                                                             |
| V1: visual information            | [1.4.1 A](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), [1.4.3 AA](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [1.4.11 AA](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html): record non-color cues and measured contrast on actual backgrounds. Normal text needs 4.5:1; large text needs 3:1; required control/state visual information needs 3:1 against adjacent colors.                                                                                                                                                                                                                                                                                                                           |
| V2/T1: adaptable layout           | [1.3.4 AA](https://www.w3.org/WAI/WCAG22/Understanding/orientation.html), [1.4.4 AA](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), [1.4.10 AA](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [1.4.12 AA](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html): retain content/function at the tested zoom, effective width, spacing and orientation; record any applicable exceptions.                                                                                                                                                                                                                                                                                                                                      |
| K1/T1: pointer and targets        | [2.5.2 A](https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation.html), [2.5.8 AA](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): record cancellation behavior and measured target/spacing, or the precise exception used.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Additional hover/focus content    | [1.4.13 AA](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html): if extra content appears, check dismissal, hoverability and persistence; an ordinary paint-only hover effect is not extra content.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

Easy to get wrong:

- **Focus:** 2.4.7 and 2.4.11 are AA. The two-pixel perimeter rule (2.4.13) is
  AAA.
- **Targets:** 2.5.8 needs 24×24 CSS px unless an exception applies. For the
  spacing exception, a 24px circle centered on each small target must not touch
  another target or circle. Styled native controls are not exempt by default.
- **Contrast:** large text is 18pt, or 14pt bold. Disabled controls are exempt,
  but record their legibility anyway.
- **Text spacing:** apply line height 1.5×, paragraph spacing 2×, letter spacing
  0.12× and word spacing 0.16× the font size together.
- **Preferences:** emulated reduced motion or forced colors is not an OS result.

## Record results

Put the results in the pull request with a link to the CI run and commit. Use
this structure for each run:

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

A failure gets an issue listing the affected combinations; link the fix and
the retest. An inconclusive axe result stays incomplete until reviewed. Never
turn a missing result into a pass.

## What the application owns

Radiant supplies native semantics, relationships and functional styles. The
application supplies meaningful names, headings and content, form instructions
and errors, initial focus, navigation, and its own colors and overrides. It must
test its own pages and tasks; a passing library matrix does not cover them.
