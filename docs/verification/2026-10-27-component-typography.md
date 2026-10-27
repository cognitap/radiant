# Production component typography (DEV-167)

The existing ten families now consume UI Body/Title/Label/Supporting roles.
The mapping and migration contract live in [the theming guide](../theming.md#component-roles-and-earlier-themes).
No component family, prop, named part or theme-document key was added.

## Contract and regressions

- A recipe previously changed semantic text specimens while components still
  consumed the earlier typography leaves. Production component text now follows
  role assignment, weight, tracking and leading. UI titles/ordinary labels/body/
  supporting text also follow role size; size-constrained controls deliberately
  retain their existing small/medium/large font-size and geometry metrics.
- The neutral UI baseline bridges earlier family/size/weight/tracking leaves.
  Every built-in preset retains those authored settings and Button exceptions.
  Explicit role/recipe values replace the bridge without deleting earlier data.
  Selection/disclosure labels deliberately adopt label weight; UI leading is now
  explicit. These layout changes are marked breaking in the changelog.
- Inline/subtle links inherit surrounding text. Action-shaped links and Dialog
  actions reuse Button; Accordion reuses Collapsible.
- The packed no-reset fixture exposed a summary wider than its container by
  twice its horizontal padding. Border-box sizing now keeps Collapsible and
  Accordion triggers within the container.
- The Tailwind fixture exposed caller text-size utilities losing to arbitrary
  CSS-property declarations. Typed Tailwind typography utilities now merge with
  caller utilities. Leading follows size in the defaults so class merging does
  not discard the deliberately authored role leading.

## Executable evidence

One shared production specimen, `.storybook/examples/TypographyComponents.tsx`,
exercises all ten families and all three control sizes. The package verifier
copies that same source into an isolated installed consumer, replacing only its
import target. Browser checks consume the packed public JS and CSS, without
repository source imports or Storybook styles.

`pnpm test:package --styles` and the exhaustive `pnpm check` run:

- 72 installed route/theme/mode cases, including all presets and the authored
  workshop theme. A browser probe compares earlier title/label family, size,
  weight and tracking with the rendered component; selection labels also match
  the earlier label weight. Compiled/Tailwind routes compare rendered results.
- 32 installed typography cases: 320/390/640/800px × light/dark × compiled and
  Tailwind, each with/without reset. All 16 semantic styles remain checked.
  The component specimen additionally checks distinct Body/Title/Supporting
  assignments, an 18px Label versus 16px Body, role leading, all control metrics,
  component exceptions, caller size/family/weight/leading, inherited inline links,
  wrapping and native input label/error relationships.
- Named and mode-only scope isolation, container sizing, enlarged-root and
  text-spacing probes retain their existing checks. The installed composition
  checkpoint verifies canonical native/TanStack forms and keyboard/modal flows.

Storybook adds Components, Serif Interface and Mono Interface variants under
System → Typography. They include all three control sizes; the global matrix
covers every preset in both modes. The serif/mono variants use platform family
fallbacks and independent UI rhythm; no new font loader or font assets are added.

Raw receipts are `output/browser/installed-styles/results.json`,
`output/browser/installed-compositions/` and `output/browser/environment.json`
with `junit.xml`. The complete check log and PR CI identify the tested revision;
receipts record the archive integrity and installed runtime/browser versions.
Representative captures remain in the corresponding ignored output folders.

## Limits and release boundary

Chromium automation is not manual browser/assistive-technology certification or
broad font/script coverage. Font loading stays application-owned. Caller
`className` utilities require the Tailwind route; ordinary application CSS and
local style variables work with the compiled route. The package remains a
prepared, unpublished 0.0.5 candidate; DEV-169 owns publication and the exact
public documentation pin.
