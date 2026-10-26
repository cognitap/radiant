# DEV-162: Typography roles and font-aware starting points

Date: 2026-10-26. Status: proposal for owner review, before DEV-163 implementation.
This is the first design checkpoint within DEV-161, not completion of that chapter.
No public interface, component styling, package version or production workshop
changes in this proposal.

## Proposed decision

Use **one typography system with separate reading and interface rhythms**, four
font slots, reusable text roles and explicit role overrides. Offer **Product**,
**Editorial** and **Technical** starting combinations. Start the workshop with
Product; selecting another combination remains a deliberate user choice.

A numeric scale alone cannot describe a caption, a paragraph, a form label and a
landing headline. Keep their responsibilities visible instead of applying one
ratio or one global tracking value to every text node.

The [font study](dev-162-font-research.md) owns upstream sources, licenses,
verified artifacts, supported axes and script limitations. The values below are
Radiant design choices evaluated on the recorded specimens, not upstream
endorsements or evidence of a universally best reading speed.

## Roles and font ownership

Four slots choose independently loaded families: **reading**, **interface**,
**display**, and **code**. A role resolves a family, size, weight, unitless line
height, em tracking and optional maximum inline measure. The slots are related
defaults; an explicit role override can choose another family or metric.

| Role                | Purpose                                        | Family slot |
| ------------------- | ---------------------------------------------- | ----------- |
| `prose.body`        | Paragraphs and list items                      | reading     |
| `prose.lead`        | Article introduction                           | reading     |
| `prose.heading1`    | Article title                                  | reading     |
| `prose.heading2`    | Major reading section                          | reading     |
| `prose.heading3`    | Smaller reading section                        | reading     |
| `prose.caption`     | Figure captions and reading annotations        | reading     |
| `prose.quote`       | Block quotations                               | reading     |
| `interface.body`    | Product copy, control values and table cells   | interface   |
| `interface.label`   | Field labels, action labels and table headings | interface   |
| `interface.support` | Descriptions, instructions and error messages  | interface   |
| `interface.caption` | Metadata and short annotations                 | interface   |
| `interface.title`   | Card, dialog and disclosure titles             | interface   |
| `display`           | Landing headline                               | display     |
| `code.block`        | Preformatted code with its own scroll region   | code        |
| `code.inline`       | Identifiers within prose or product copy       | code        |

Roles express presentation, not heading levels, color or accessibility semantics.
An `h4`–`h6` can use the smaller heading treatment while retaining its real level;
a card title can remain an `h2` with the interface-title treatment. An error uses
the support role plus the existing invalid color and relationship contract.
Inline links inherit the surrounding typography and retain link presentation.
Do not introduce new catalog families as a prerequisite.

### Reference metrics

These values describe Product at a 16px root; production sizes use rem, tracking
uses em, and line height is unitless. The reading base is R = 18px and the
interface base is U = 14px. Changes to R and U are independent.

| Role              | Compact → wide size | Weight  | Leading | Tracking | Maximum measure |
| ----------------- | ------------------- | ------- | ------- | -------- | --------------- |
| prose.body        | R → R               | 400     | 1.65    | 0        | 64ch            |
| prose.lead        | 1.125R → 1.125R     | 400     | 1.5     | 0        | 55ch            |
| prose.heading1    | 32/18 R → 44/18 R   | 600     | 1.2     | -.015em  | 26ch            |
| prose.heading2    | 25/18 R → 30/18 R   | 600     | 1.2     | -.015em  | 26ch            |
| prose.heading3    | 20/18 R → 22/18 R   | 600     | 1.2     | -.015em  | 26ch            |
| prose.caption     | .8125R → .8125R     | 400     | 1.5     | 0        | reading measure |
| prose.quote       | 1.125R → 1.125R     | 400     | 1.5     | 0        | reading measure |
| interface.body    | U → U               | 400     | 1.45    | 0        | layout owned    |
| interface.label   | U → U               | 500     | 1.4     | 0        | layout owned    |
| interface.support | 13/14 U → 13/14 U   | 400     | 1.5     | 0        | layout owned    |
| interface.caption | 12/14 U → 12/14 U   | 400     | 1.5     | 0        | layout owned    |
| interface.title   | 18/14 U → 18/14 U   | 600     | 1.3     | -.01em   | layout owned    |
| display           | 2.25rem → 4rem      | 600     | 1.08    | -.025em  | 18ch            |
| code.block        | .875rem → .875rem   | 400     | 1.6     | 0        | 80ch            |
| code.inline       | .9 × inherited size | inherit | inherit | 0        | inline          |

Inline code inherits weight so emphasis can remain emphasis; an available font
weight must be loaded. The prototype's role table labels the normal 400 case.
Do not force a fixed line height on inline code that enlarges its parent line.
The study's form action uses a deliberate 600-weight label exception; ordinary
field labels use 500. Component exceptions continue to have their own owner.

Reading rhythm also owns paragraph/list/quote/code block spacing: 1em after a
block, 1.5em before a heading and .6em after it, with the first heading's leading
gap removed. Adjacent margins collapse rather than add. List indentation and
quote treatment remain semantic, locally scoped prose styling.

Interface rhythm owns size and leading, not control height or layout gaps.
Spacing & surfaces continues to own control metrics and layout spacing. Controls
need minimum heights and enough padding for wrapped/enlarged labels; typography
must not shrink or condense a label to make a fixed-height box fit. Existing
small/medium/large control-size relationships remain explicit in DEV-167.

### Responsive rule

Body, supporting type and interface sizes remain stable rem values. Prose
headings use the wide endpoint once **their specimen's content container** is at
least 32rem wide; display uses its wide endpoint at 48rem. The proof canvas itself
switches to a two-column comparison at 64rem. These are separate responsibilities.

Use an opt-in, documented typography container for these role relationships,
with the compact treatment as a safe fallback. A wide screen containing a narrow
card must not automatically receive a large article heading. Measure is a maximum,
never a minimum width. Prose wraps, including long words/URLs; preformatted code
and genuinely two-dimensional data may scroll inside their own labelled region.

The initial experiment selected heading sizes from the whole comparison width.
At a 768px canvas this produced wide headings inside a roughly 363px article
column. The revised model uses a specimen-local container and keeps the canvas
layout decision separate. DEV-163 must prove that distinction through installed
CSS, including nested scopes and both consumption routes.

## Supported starting combinations

| Combination | Reading                          | Interface                | Display        | Code          |
| ----------- | -------------------------------- | ------------------------ | -------------- | ------------- |
| Product     | Inter 18px / 1.65 / 64ch         | Inter 14px / 1.45        | Inter          | IBM Plex Mono |
| Editorial   | Source Serif 4 20px / 1.6 / 62ch | Inter 14px / 1.45        | Source Serif 4 | IBM Plex Mono |
| Technical   | IBM Plex Sans 18px / 1.6 / 62ch  | IBM Plex Sans 14px / 1.5 | IBM Plex Sans  | IBM Plex Mono |

Reading heading/lead/caption relationships scale from each combination's reading
base. Thus Editorial's heading1 is approximately 35.6px → 48.9px, not Product's
32px → 44px. Display is independent at 36px → 64px. Preserve the whole combination
as a starting point while allowing every slot and role to change independently.

The supported recommendation set is intentionally narrow: those three
combinations, Inter/Source Serif/Plex Sans reading profiles, Inter/Plex Sans
interface profiles, and Plex Mono code at normal width. All use actual regular,
italic and available 400/500/600 weights, automatic optical sizing where the
chosen font provides it, and tabular numerals for numeric data cells. Do not
automatically apply tabular figures to prose. A cross-slot combination can use
the known profile for each slot, but its overall composition still needs review.

Inter provides wght 100–900 and opsz 14–32; Source Serif provides wght 200–900 and
opsz 8–60; Plex Sans provides wght 100–700 and wdth 85–100; Plex Mono provides
wght 100–700. Default width is 100%. Explicit optical-size and width exploration
is manual advanced tuning; the study does not validate every axis combination.
The research note distinguishes verified Roman axes from the matching italic
files, whose axes were not separately inspected.

Font-aware here means **recorded, contextual starting metrics for known files**.
It does not mean a universal x-height formula, optical normalization, automatic
fallback metric matching, or AI selection. Use the actual file revision and
supported metadata when offering a recommendation. Never guess a font's axes or
weight coverage from its name.

## Overrides, custom fonts and theme integration

Separate generated defaults from deliberate author decisions. A manual reading
metric survives switching the reading family until that metric or reading
context is reset. Interface changes leave reading decisions alone, and vice
versa. Explicit role overrides survive regenerating the base rhythms; resetting
one role removes only its override. A typography reset leaves color, geometry,
motion and deliberate component exceptions untouched. Selecting a whole starting
combination can explicitly reset its typography recipe, with that effect stated
in the editor.

Custom/system/unfamiliar fonts use the same roles and manual controls. Start from
neutral metrics (18px/1.65/64ch reading, 14px/1.5 interface) and label them
uncalibrated. Let the user select available weights/styles, leading, tracking,
measure and responsive endpoints after inspecting actual content. A Mono-as-prose
or Serif-as-interface trial illustrates this path; it is not promoted into the
supported recommendation set.

Library responsibilities in DEV-163: pure deterministic role resolution, typed
serializable values, validation, CSS generation and existing theme compilation.
Use the current typography section and ThemeDocument seam; do not create a
second theme compiler or font-loader runtime. Keep existing partial-theme leaves
and component exceptions working, with a documented precedence/migration rule
before adopting roles across existing families in DEV-167. Exact function names
and types belong to the implementation PR, not this research note.

Website responsibilities in DEV-164/165/166/168: curated asset metadata, explicit
loading and failure states, browser-local FontFace trials, real editable proof
sheets and controls, font setup guidance and shared-configuration presentation.
Loaded files stay local; exported themes carry family, file/source requirements,
weights/styles/axes and fallback instructions, never local bytes or blob URLs.
Choose a theme without silently requesting fonts. Public curated loading must
use pinned self-hosted assets with the complete upstream licenses, loaded only
when selected; do not depend on raw GitHub URLs at runtime.

## Study and reference specimens

The self-contained [typography rhythm prototype](https://github.com/cognitap/radiant-docs/blob/f5243cf/examples/workshop/typography-rhythm.prototype.html)
is preserved at commit `f5243cf` on `prototype/dev-162-typography-rhythms` in
radiant-docs. Download the HTML and open it directly; all eight actual WOFF2
files and their complete licenses are embedded. The prototype is outside main
and must not be merged or copied into production.

It contains an editable article with long title, lead, headings, lists, quotation,
caption, link, real italic/emphasis and code; a form with accented names, long
action and error text; a dense project table with aligned currency; and editable
landing copy. These remain the same content while selecting combinations,
widths, independent metrics and reading/interface resets. An isolated-reading
view makes maximum measure visible without the comparison grid constraining it.

Observation method: headless Playwright with Chromium **156.0.8078.4**, 1440×1000
viewport, each selected font explicitly awaited at regular 400/600 and italic
400 before measurement. Four scenarios (three supported combinations plus an
uncalibrated Mono-reading/Serif-interface trial), four proof widths (1120, 768,
390, 320 CSS px), and four settings (normal, spacing override, 200% root font
size, dark): **64 rendered combinations**, each containing all four compositions.
No page runtime errors were observed; all eight faces loaded. The proof, sheet,
article, interface and landing boxes had no scrollWidth/clientWidth overflow
beyond 1px. Tables/code intentionally retain their own scroll regions.

| Observation, ordinary setting         | Product | Editorial | Technical | Manual trial |
| ------------------------------------- | ------- | --------- | --------- | ------------ |
| Isolated maximum reading width        | 722.2px | 620px     | 669.6px   | 691.2px      |
| First paragraph lines at 1120px proof | 4       | 4         | 4         | 5            |
| First paragraph lines at 390px proof  | 7       | 7         | 6         | 8            |
| First paragraph lines at 320px proof  | 8       | 9         | 8         | 11           |

At 20px, the measured `x` ink ascent was approximately 10.72px for Inter, 9.5px
for Source Serif, and 10.32px for both Plex faces. The zero advances were 12.5,
10, 12 and 12px respectively. This supports inspecting size and measure per
font; it does not prove equal legibility. Automatic optical sizing also means
the physical value of `ch` can vary with size. A `64ch` measure is not a promise
of 64 actual characters on a line.

Reference captures were inspected at 1120px and 390px for all four scenarios.
The three supported combinations preserve a clear article/UI distinction;
the manual Mono trial visibly expands line count and needs deliberate tuning.
The prototype's controls also expose independent resets and editable copy for
owner review. Raw captures and measurement JSON stay in ignored local
`output/dev162/`; the pinned HTML is the durable reference source.

### Evidence limits and downstream acceptance

The spacing stress applies line-height 1.5, paragraph spacing 2em, tracking .12em
and word spacing .16em together. These are user override tests, not required
authored defaults ([W3C explanation](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html)).
The 320px proof is a layout probe; the 200% root-size case is a text-scaling
probe. Neither substitutes for full-page browser zoom, production component
behavior or manual assistive-technology acceptance. Keep actual browser zoom,
keyboard/focus, hydration, fallback/failed fonts, component role adoption and
installed compiled-CSS/Tailwind proof in their downstream delivery issues.

The specimen is English-first Latin text with a Hungarian name. Font table checks
cover selected Latin/Greek/Cyrillic codepoints; Plex Mono lacks the checked Greek
characters, and all four lack the checked Arabic/CJK characters. No broad-script,
RTL, shaping, accessibility-conformance or universal readability claim follows.

Owner review remains open: keep Product as the default with Editorial/Technical
available, or adjust the role hierarchy, rhythm or starting combinations before
DEV-163 fixes their public contract. Diagnostics and saved side-by-side treatments
remain future scope, as agreed for DEV-161.
