# E57 — Installed architecture-batch compositions

**Date:** 2026-10-25. **Status:** automated archive/Cognitap checkpoints pass;
the full DEV-57 acceptance remains open for actual screen-reader evidence and
the ten-family registry checkpoint. No package was published and Cognitap's
checked-in pins were not changed.

This follows the [E135 styling proof](2026-10-25-installed-styles.md), reusing its
archive verifier and the [canonical recipes](../system.md#reuse-the-canonical-examples).
It adds no second form implementation or theme migration. The only example
change lets Workspace select the existing native or TanStack form owner.

## What runs

| Consumer                   | Production route                                                              | Cases and observed result                                                                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Isolated installed archive | Vite SSR/hydration, compiled CSS + optional reset                             | 128 passing cases: eight presets × light/dark × native/TanStack × standalone/Card/Dialog/Workspace                                                                   |
| Cognitap Helicon           | Astro React island, application Tailwind entry                                | 24 passing archive cases: Default/Glass/Sharp 3D × light/dark × native/TanStack × Workspace/Dialog                                                                   |
| Cognitap Terminus          | Next server page → explicit React client boundary, application Tailwind entry | The same 24 archive cases pass                                                                                                                                       |
| Cognitap's registry pin    | Frozen installation of `@cognitap/radiant@0.0.1`                              | Both existing production pages build and render Button. The composed recipe build fails because this version exports only Button; this is **not** a ten-family pass. |

The isolated consumer types the copied recipes against the installed public
declarations in NodeNext and Bundler modes. It renders server markup from that
installation, hydrates in StrictMode, and observes the same input node and IDs
with no recoverable hydration errors. Its client bundle contains installed
`dist/library/Dialog.js` and no Radiant repository source.

Each recipe run submits empty/valid forms, observes required labels/help/errors,
checks native submitted email/plan values and the omission of an unchecked
checkbox/disabled workspace, exercises radio arrows and disabled-option skipping,
then resets values and validation together. Modal runs check initial email focus,
forward/reverse keyboard containment, reachable Cancel, Escape, save and trigger
focus restoration. Workspace runs toggle the Accordion and nested Collapsible,
verify closed content visibility, follow the real local Link and check the
passive Card adds no focus stop. Removing an open modal releases its native
top-layer state; remounting works and restores trigger focus on close.

Every run replaces theme/mode on the same harness, retains an inherited `18px`
Input radius override, and keeps a nested explicit default/light scope independent.
Browser chrome/body and a scrollable dialog itself can appear at native Tab
boundaries; the check excludes background controls rather than imposing a
JavaScript focus trap. Long panels retain native scrolling and a reachable close
action. This does not claim actual browser zoom or a manual contrast audit.

## Source, package and environment

- Radiant base: `771a0a2b256d4671ce627c99df15187e8c298d9a` (merged DEV-135),
  plus this PR's verification/example/documentation changes. No public runtime
  implementation changed in this checkpoint.
- Cognitap tracked snapshot: `4011e449e67589f65cdb891aefd2cc2e7f1a3073`.
  The runner requires a clean checkout, snapshots that revision, clears live
  development aliases, and checks afterward that its revision/status are unchanged.
  Temporary dependency installs and proof routes never touch that checkout.
- Archive manifest version: `0.0.2`, **unreleased local archive**, matching JS/CSS.
  The final SHA-512 and timestamped executions are recorded below.
- Registry pin integrity:
  `sha512-m+rJX6XCAA3at9rZBo2BU1ZsbpWVLXCReU2A62R/JZu1NxZvyQl4Jc0vw4vVh51AHMUlihQwUouq+/lliieVSw==`.
  The metadata matches the frozen Cognitap lockfile. Available runtime exports:
  `Button`. The actual attempted recipe-build error is retained.
- Host: macOS `27.0.1`, build `26A434`, arm64, Darwin kernel `27.0.0`.
- Automated browser: headless Chromium `156.0.8078.4`; Playwright `1.64.1`,
  Node `26.11.1`, Vitest `5.0.5`, Vite `8.3.4`, React/React DOM `19.3.0`,
  TanStack React Form `1.33.5`, Tailwind `4.3.3`. pnpm `12.11.2`.
- Cognitap frameworks: Astro `7.3.8`/React integration `7.0.1`, Next `16.4.0`.
  Locale/page language `en`, viewport `1000 × 1100` CSS px, browser-emulated
  reduced motion, explicit light/dark; system fonts, no downloaded preset fonts.
  No OS preference, mobile, AT, native zoom or complete visual-matrix pass is implied.

The full local gate passes **80 runtime, 41 installed package/type, 64 installed
styling, 128 installed composition and 1,037 Storybook/platform cases**. The
cross-repository checkpoint additionally passes 48 archive cases and the two
historical registry-page build/render checks. Theme/format/lint/types, production
Storybook and browser gates pass. Exact-head CI is linked from the PR/Linear issue;
CI records its own Linux environment and archive integrity.

## Lessons applied

1. **Registry evidence is version-specific.** The pinned 0.0.1 package cannot
   supply the harmonised nine additional families. The runner records this
   unavailable API and uses an explicit build/install checkpoint for unreleased
   changes. Once a reviewed release is published and Cognitap deliberately pins
   it, rerun the same checkpoint: it exercises the registry compositions when
   the needed exports are present. Archive success never changes registry status.
2. **A public package import is separate from local recipe resolution.** Next's
   current Turbopack cannot resolve the copied `.js` local recipe specifiers to
   TSX files. The Cognitap snapshot uses extensionless local imports; the isolated
   NodeNext fixture keeps `.js`. Both use `@cognitap/radiant` for the library.
   This is now explained in the system guide; it requires no source alias or
   new rendering API. TanStack stays a consumer dependency.
3. **Native browser behavior must be observed.** Summary keyboard input targets
   the actual `summary`, including Accordion's heading wrapper. Native Dialog
   close state settles before reopening; tests allow browser-chrome and native
   scroll-container focus without allowing background controls.
4. **A preview process must remain owned by the runner.** Astro 7.3.8 infers
   agent backgrounding. The checkpoint uses its documented `--ignore-lock`
   foreground mode, closes owned process groups and removes its temporary snapshot.
5. **Preserve unrelated findings.** Next reports a known vulnerability in the
   pinned 16.4.0 version. Its documented identical-command retry builds, while
   retaining the warning in `next-security-reminder.log`. This checkpoint does
   not upgrade Cognitap or claim that warning is resolved.

## Safari/VoiceOver attempt and remaining acceptance

The user authorised briefly enabling VoiceOver and restoring settings. Safari
`27.0.1` (`22625.1.29.11.28`) opened the installed production page. Its native
accessibility tree exposed the named modal, labelled email/checkbox/radio group,
checked/disabled states and visible close action; opening it focused Email and
excluded the background page from the exposed content. These are browser/AX
observations, **not screen-reader announcements**.

Installed VoiceOver metadata is version `10`, build `993`, on the OS above.
System Settings showed its switch move from off to on, but the tool could not
obtain speech/caption output: binding VoiceOver timed out (`-10005`), and app
inventory reported it not running. No actual utterances or reading-cursor flow
were verified. Its caption-panel preference was already on and was left alone.
The VoiceOver switch was restored and verified **off**. VoiceOver verbosity,
modifier, Quick Nav, actual Safari keyboard settings/zoom, speech language and
AT navigation settings were not verified and cannot be reported as a tested setup.

To finish DEV-57, a functioning browser/AT session must execute
[K1–K5](../accessibility.md#manual-scenarios) on the retained installed page,
including native/TanStack errors/reset/status announcements, modal reading/focus
containment/restoration, Accordion/nested disclosure state and Link navigation.
Record actual utterances, reading-cursor observations, precise settings and sampled
themes/modes separately from the automated counts. Complete the ten-family
registry run after a release/pin supplies that API. DEV-57/DEV-31 and broader
catalog dependencies remain open until the checkpoint is accepted; DEV-83 retains
the later complete-catalog compatibility/AT audit.

## Reproduction and retained evidence

Follow the [installed checkpoint commands](../testing.md#evidence-and-readiness).
The canonical recipe source SHA-256 values, archive integrity, environment,
timestamped cases and failures are machine-readable in:

- `output/browser/installed-compositions/results.json`, its `client/` production
  page and four Glass/Sharp 3D light/dark validation captures.
- `output/browser/cognitap-compositions/results.json`, original and temporary
  lockfiles, registry/API-limit logs, framework/typecheck/build/server logs and
  per-app captures. The runner resolves Radiant inside the temporary installation.
- `output/browser/installed-styles/results.json` and the separate
  `output/browser/environment.json` / `junit.xml` for the full browser gate.

The four isolated captures and representative Cognitap captures were inspected
for labelled controls, readable errors, focus, modal bounds, theme treatment and
the scrollable footer. This is a sampled visual review. CI uploads installed
styling/composition artifacts for 14 days; Cognitap is an opt-in local checkpoint.
Preserve its receipt summary here and in the PR before replacing local output.

### Final local receipt

- Explicit archive SHA-512: `sha512-tUJvbiRUUZF+vYfLMpSg6Q505VO47hqO1dmJ/fv+UKVcVIiWhoLdj0+bZ+vx/0+tQhxkXx3NzelqEX/eeMwNcg==`.
- Isolated archive execution: `2026-10-25T16:33:47.337Z`–`2026-10-25T16:34:07.753Z`, 128 cases passed, hydration/cleanup passed.
- Cognitap execution: `2026-10-25T16:35:18.501Z`–`2026-10-25T16:36:06.876Z`. Helicon and Terminus each resolved installed version `0.0.2` and passed 24 cases. Both used the same archive integrity above; the source checkout remained unchanged. Registry compositions remain unavailable.
- The complete gate's separate Chromium receipt was recorded at `2026-10-25T16:29:04.199Z`; its completed JUnit report contains 1,037 passing cases. The final archive check reran all 41 installed/package types, 64 styling and 128 composition cases after the packaged guide/changelog edits.
