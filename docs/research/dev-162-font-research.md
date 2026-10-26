# DEV-162 — curated typography font research

Researched 2026-10-26. Scope: a deliberately small set of open fonts for the public Radiant typesetting workshop. Primary sources only. The family/recipe choices below are design recommendations, not universal claims about reading performance. The [role/rhythm proposal](dev-162-typography-model.md) records the actual specimen evaluation and proposed metrics.

## Recommendation

Start with four families: **Inter**, **Source Serif 4**, **IBM Plex Sans**, and **IBM Plex Mono**. This provides an interface workhorse, a prose serif with real optical sizing, an alternative sans with a distinct voice and width axis, and code. Expressive/display is a role rather than a fifth font: demonstrate Source Serif at display optical size, Inter's display range, and a deliberately stronger Plex Sans hierarchy. A small collection supports meaningful comparison without pretending that every possible font has been calibrated.

Use three starting combinations:

| Starting point         | Body           | Headings       | UI            | Code          |
| ---------------------- | -------------- | -------------- | ------------- | ------------- |
| Inter                  | Inter          | Inter          | Inter         | IBM Plex Mono |
| Source Serif 4 + Inter | Source Serif 4 | Source Serif 4 | Inter         | IBM Plex Mono |
| Plex Sans + Plex Mono  | IBM Plex Sans  | IBM Plex Sans  | IBM Plex Sans | IBM Plex Mono |

These combinations are our recommendation, not upstream endorsements. The role/rhythm proposal chooses starting metrics after actual-font specimen evaluation. Avoid using a single geometric ratio for labels, prose, controls, headings, and display: they have different jobs.

## Why these four

**Inter:** its designer explicitly targets interfaces through marketing and signage, includes text/display optical designs, true italic, tabular numbers, and disambiguation options. This makes it a useful control family for the workshop. The official site advertises 147 languages, but language lists should not be confused with universal script support. Use its tabular numeral feature in data samples and optional disambiguation in a diagnostic line rather than forcing stylistic sets everywhere. [Official family and features](https://rsms.me/inter/), [official web CSS](https://raw.githubusercontent.com/rsms/inter/v4.1/docs/inter.css).

**Source Serif 4:** Adobe describes it as a family for different sizes and languages, with Latin-4, Greek, Cyrillic, and five optical-size designs. It provides a substantive prose/display comparison without needing a decorative family. Use automatic optical sizing as the normal behavior; an advanced control can pin the optical size to explain the effect. [Adobe's specimen and design description](https://adobe-fonts.github.io/source-serif/), [official variable CSS](https://raw.githubusercontent.com/adobe-fonts/source-serif/4.005R/source-serif-variable.css), [release 4.005R](https://github.com/adobe-fonts/source-serif/releases/tag/4.005R).

**IBM Plex Sans:** IBM describes Plex as intended for UI and other media. Its contemporary variable artifact adds weight and width, useful for explaining that width changes are real font design variations rather than CSS scaling. Keep width 100% by default; do not silently condense interface text to fit a fixed control. The IBM family includes many separately packaged scripts; do not advertise all of them as coverage of this particular Sans file. [Official repository](https://github.com/IBM/plex), [IBM typeface description](https://www.ibm.com/design/language/typography/typeface/).

**IBM Plex Mono:** a compatible code family with real italic and varied weights. IBM describes its fixed-width design and code-snippet use. It also appears as the code face in Carbon's utility typography. Its Greek coverage differs from Sans, so a family-wide language badge would be misleading. [IBM typeface description](https://www.ibm.com/design/language/typography/typeface/), [Carbon type sets](https://www.carbondesignsystem.com/building-blocks/foundations/typography/type-sets).

## Verified artifacts and axes

Official repositories were queried directly. WOFF2 responses were fetched and their `wOF2` signatures verified. Matching Roman TTF files were fetched into `/private/tmp/dev162-research-fonts/`; `fvar` and `cmap` tables were read using Python standard-library binary parsing, without installing font software. The values below come from those actual Roman TTF files, not generic font catalog metadata. Inter is pinned at v4.1 (commit `e3a3d4c57d5ecc01453a575621882a384c1995a3`); Source Serif at 4.005R (`2823e993c53fca27c5c8749f529b56a5a7c77b6b`); Plex at `71f558992315a12ca1f06a2215d57962a1992162`.

| Family         | Roman axes, min/default/max       | Roman WOFF2 bytes | Sample coverage checked                                          |
| -------------- | --------------------------------- | ----------------: | ---------------------------------------------------------------- |
| Inter          | wght 100/400/900; opsz 14/14/32   |           352,240 | Hungarian ő/ű, accented Latin, Greek α/Ω, Cyrillic Ж/ж           |
| Source Serif 4 | wght 200/400/900; opsz 8/20/60    |           429,100 | Same sample coverage                                             |
| IBM Plex Sans  | wght 100/400/700; wdth 85/100/100 |           230,368 | Same sample coverage                                             |
| IBM Plex Mono  | wght 100/400/700                  |            83,488 | Hungarian, accented Latin and Cyrillic samples; Greek α/Ω absent |

Arabic ا and CJK 漢 were absent from all four checked files. These are codepoint presence checks, not shaping or full language coverage certification. Recheck the actual chosen subset if later optimizing files. The Roman axes are verified; matching italic URLs below have valid WOFF2 signatures but their axes were not separately inspected.

### Exact browser download URLs

Copy these upstream files unmodified to a local trial assets directory; do not make the final public workshop depend on GitHub raw file availability. Keep licenses with any redistributed assets. Full Roman collection is about 1.1 MB before matching italics; load selected families/styles on demand rather than preloading all eight files.

#### Inter

- [Roman WOFF2](https://raw.githubusercontent.com/rsms/inter/v4.1/docs/font-files/InterVariable.woff2)
- [Italic WOFF2](https://raw.githubusercontent.com/rsms/inter/v4.1/docs/font-files/InterVariable-Italic.woff2) — 387,976 bytes
- [Roman TTF, used to verify axes](https://raw.githubusercontent.com/rsms/inter/v4.1/docs/font-files/InterVariable.ttf)
- Roman WOFF2 SHA-256: `693b77d4f32ee9b8bfc995589b5fad5e99adf2832738661f5402f9978429a8e3`

#### Source Serif 4

- [Roman WOFF2](https://raw.githubusercontent.com/adobe-fonts/source-serif/4.005R/WOFF2/VAR/SourceSerif4Variable-Roman.ttf.woff2)
- [Italic WOFF2](https://raw.githubusercontent.com/adobe-fonts/source-serif/4.005R/WOFF2/VAR/SourceSerif4Variable-Italic.ttf.woff2) — 346,688 bytes
- [Roman TTF, used to verify axes](https://raw.githubusercontent.com/adobe-fonts/source-serif/4.005R/VAR/SourceSerif4Variable-Roman.ttf)
- Roman WOFF2 SHA-256: `940a76eda1388de39d38c8e7a79bf6ea058a387faee0a9f33c8d25c6ba05e1be`

#### IBM Plex Sans

- [Roman WOFF2](https://raw.githubusercontent.com/IBM/plex/71f558992315a12ca1f06a2215d57962a1992162/packages/plex-sans-variable/fonts/complete/woff2/IBM%20Plex%20Sans%20Var-Roman.woff2)
- [Italic WOFF2](https://raw.githubusercontent.com/IBM/plex/71f558992315a12ca1f06a2215d57962a1992162/packages/plex-sans-variable/fonts/complete/woff2/IBM%20Plex%20Sans%20Var-Italic.woff2) — 262,364 bytes
- [Roman TTF, used to verify axes](https://raw.githubusercontent.com/IBM/plex/71f558992315a12ca1f06a2215d57962a1992162/packages/plex-sans-variable/fonts/complete/ttf/IBM%20Plex%20Sans%20Var-Roman.ttf)
- Roman WOFF2 SHA-256: `e978248b6b56da9e372975322a98dd9a51135d1b375e32ed6d5ca69f3aab792d`

#### IBM Plex Mono

- [Roman WOFF2](https://raw.githubusercontent.com/IBM/plex/71f558992315a12ca1f06a2215d57962a1992162/packages/plex-mono-variable/fonts/complete/woff2/IBM%20Plex%20Mono%20Var-Roman.woff2)
- [Italic WOFF2](https://raw.githubusercontent.com/IBM/plex/71f558992315a12ca1f06a2215d57962a1992162/packages/plex-mono-variable/fonts/complete/woff2/IBM%20Plex%20Mono%20Var-Italic.woff2) — 96,788 bytes
- [Roman TTF, used to verify axes](https://raw.githubusercontent.com/IBM/plex/71f558992315a12ca1f06a2215d57962a1992162/packages/plex-mono-variable/fonts/complete/ttf/IBM%20Plex%20Mono%20Var-Roman.ttf)
- Roman WOFF2 SHA-256: `ef55d69e81baa6523a9b6e015d746e707bc7e9579f18703a169cb18c36dd567b`

## License sources

All four are licensed under SIL OFL 1.1 in their upstream repositories. The license permits embedding and redistribution under its stated conditions, including keeping the copyright and license with distributed copies and restrictions on Reserved Font Names for modified versions. Unmodified, pinned files plus the original license are the straightforward workshop trial approach. Source reserves “Source”; IBM reserves “Plex.” Do not treat a font's trademark as an endorsement of Radiant.

- [Inter v4.1 LICENSE.txt](https://raw.githubusercontent.com/rsms/inter/v4.1/LICENSE.txt)
- [Source Serif 4.005R LICENSE.md](https://raw.githubusercontent.com/adobe-fonts/source-serif/4.005R/LICENSE.md)
- [IBM Plex pinned LICENSE.txt](https://raw.githubusercontent.com/IBM/plex/71f558992315a12ca1f06a2215d57962a1992162/LICENSE.txt)

## Loading and CSS setup

Use one `@font-face` for each actual normal/italic asset, with the supported weight range. For Plex Sans, declare `font-stretch: 85% 100%` if exposing the width axis; the default is 100%. Give the workshop's loaded font an unambiguous family name to avoid accidentally measuring an installed older font. Declare `font-display: swap`; use an explicit generic fallback and a visible loading/failure state before presenting measurements as evidence.

```css
@font-face {
  font-family: 'Workshop Inter';
  src: url('./InterVariable.woff2') format('woff2');
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}
.prose {
  font-family: 'Workshop Inter', ui-sans-serif, system-ui, sans-serif;
  font-optical-sizing: auto;
  line-height: 1.5;
}
.numeric-data {
  font-variant-numeric: tabular-nums;
}
```

CSS Fonts specifies higher-level properties for registered axes: `font-weight` for wght, `font-style` for ital/slnt, `font-optical-sizing` for opsz, and `font-width` (or legacy `font-stretch` where supported) for wdth. Reserve `font-variation-settings` for explicit advanced demonstrations or nonstandard axes; it is a complete setting list that can unexpectedly override other intent. Automatic optical sizing uses the available font axis and clamps to its supported range; it does not create optical designs for fonts without that axis. [CSS Fonts Level 4, optical sizing and variation controls](https://www.w3.org/TR/css-fonts-4/#font-optical-sizing-def). This is a current Working Draft; test actual target-browser behavior.

For specimen evidence, await the selected face through `document.fonts.load(...)` and `document.fonts.ready`, and report which face/weight was requested. A success from a generic font existence test alone is not proof every character avoided fallback. Include failure/slow-loading trials and Hungarian, Greek, Cyrillic and code diagnostic lines. Font files and loading stay consumer-owned in exported themes; a workshop recipe may reference a curated family without embedding its bytes into a ThemeDocument.

## Typesetting guidance and limits

USWDS recommends checking measure, line height, alignment, and the relationship between text blocks, with 45–90 characters as a broad measure range and roughly 66 for long reading. Treat that as a starting reference, not an exact line-length guarantee from `ch`: the CSS unit follows the zero glyph's advance and does not count characters. [USWDS typography](https://designsystem.digital.gov/components/typography/).

WCAG 2.2 AA Text Spacing requires no loss of content or functionality when users override line height to 1.5×, paragraph spacing to 2× font size, letter spacing to .12em and word spacing to .16em. Those are override stress-test values, not mandatory authored defaults. Test them together in controls, tables, cards and long prose. [W3C understanding SC 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html).

The separate AAA Visual Presentation criterion describes a mechanism for, among other settings, no more than 80 characters/glyphs per line (40 for CJK), nonjustified text and increased spacing. Do not label every 80ch layout as AAA compliant: the criterion has additional requirements, and CSS `ch` is not a count of rendered characters. [W3C understanding SC 1.4.8](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html).

Carbon provides a useful precedent for productive/expressive type sets, distinct utility/body/heading/display roles, and fixed versus fluid heading behavior. It supports building contextual recipes rather than presenting only a row of size values. This does not mean adopting Carbon's exact sizes or naming. [Carbon type sets](https://www.carbondesignsystem.com/building-blocks/foundations/typography/type-sets).

## Curated recommendations versus unfamiliar-font tuning

Offer the four known families with explicit role suggestions and known bounds. A font record should identify file/revision, supported weights/styles/axes, scripts tested, suggested fallback, and specimen observations. A recipe can choose starting size/leading/measure/spacing and let users inspect those choices in article, product, forms, data, and code contexts.

For an unfamiliar font, preserve a manual path: family/asset entry, actual available weights and styles, and editable scale/leading/measure/tracking. Detect available metadata when possible, but do not invent calibrated axes or infer a readability score from x-height alone. Say “uncalibrated font — review the specimens” and retain the user's settings. Do not silently map all sans faces to Inter's tracking or use arbitrary width squeezing to force matching line breaks.

Recommend an observation loop: compare the same content at narrow and wide widths, default and enlarged text, ordinary and override spacing; check control label wrapping, table alignment, long identifiers, emphasis/italic, and unsupported-script fallback. Owner visual review plus those checks can support a product default. The evidence gathered here cannot establish the fastest-reading font, universal ideal ratio, or a single correct family for all users and languages.

## Local proof assets

All eight pinned WOFF2 files and the three complete, unmodified upstream license texts are embedded in the self-contained prototype linked from the role/rhythm proposal, preserved on its separate throwaway branch. The following checksums identify the exact assets. Keep complete licenses with redistributed copies; no binary font assets are added to the main library by this research.

| File                        | SHA-256                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| Inter.woff2                 | `693b77d4f32ee9b8bfc995589b5fad5e99adf2832738661f5402f9978429a8e3` |
| Inter-Italic.woff2          | `e564f652916db6c139570fefb9524a77c4d48f30c92928de9db19b6b5c7a262a` |
| Source-Serif-4.woff2        | `940a76eda1388de39d38c8e7a79bf6ea058a387faee0a9f33c8d25c6ba05e1be` |
| Source-Serif-4-Italic.woff2 | `9d28b5749a1ad096a295cb607c521bd1af4cd9979b6f37332daf70143149fb44` |
| IBM-Plex-Sans.woff2         | `e978248b6b56da9e372975322a98dd9a51135d1b375e32ed6d5ca69f3aab792d` |
| IBM-Plex-Sans-Italic.woff2  | `57c2e5e2d0a16054e83315a312d2d5d0166e4a6f5b27dbed28d7d9d05b5e4292` |
| IBM-Plex-Mono.woff2         | `ef55d69e81baa6523a9b6e015d746e707bc7e9579f18703a169cb18c36dd567b` |
| IBM-Plex-Mono-Italic.woff2  | `b1c1137b5de255336110167a3a66531bed1e7d14fc8a0a384bd0d7c06bdd433b` |
