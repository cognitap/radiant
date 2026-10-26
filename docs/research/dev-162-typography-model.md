# DEV-162: Typography model, second proposal

Date: 2026-10-26. Status: **revised proposal; owner acceptance pending**.
DEV-162 is the design checkpoint within DEV-161. DEV-163 stays blocked until
the model is accepted. This PR changes research documents only.

## Review outcome and direction

The owner rejected Study 01 across visual hierarchy/fonts/metrics, role/rhythm
structure, proof-sheet exploration, and naming, specifically “reading”. Its
Product/Editorial/Technical names, original font slots and fixed breakpoint model
are superseded. Study 01 is a historical experiment, not an accepted contract.

Study 02 separates **font assignments**, **text styles**, and **rhythm**. It adds
independent heading-font choice, explicit paragraph spacing, adjustable hierarchy,
composed pages and a selected-style inspector. Starting points identify their
fonts. These are new candidates for review, not owner-approved replacements.

## Proposed vocabulary

| Term            | Meaning                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Typeface        | A family and its available files, weights, styles and axes.                                                                                                  |
| Font assignment | Where a typeface is used by default: **Body**, **Headings**, **UI**, **Code**. These may all use one family; four assignments do not require four downloads. |
| Text style      | A reusable assignment, size, weight, leading, tracking and optional maximum measure.                                                                         |
| Prose rhythm    | Body size, leading, paragraph/block spacing, measure and heading hierarchy for continuous content.                                                           |
| UI rhythm       | Text size and leading for interface copy, controls and data. Geometry owns control dimensions and layout gaps.                                               |
| Style override  | An explicit change to one style that survives updates to generated defaults.                                                                                 |
| Proof           | A real composition at a declared CSS width, sharing settings and editable copy.                                                                              |

Body supplies paragraphs, lead, small text and quotations. Headings supplies prose
titles/sections and display; UI supplies product titles, labels, values and
metadata; Code supplies block and inline code. A style can override its assignment.
UI titles deliberately use UI rather than the editorial heading treatment.

Styles do not replace HTML semantics. A prose title and a UI title can each style
a real `h1`; smaller styles can serve `h3`–`h6` while retaining the real level.
Error copy adds invalid color/relationships to supporting text. Links, emphasis
and inline code retain their inline responsibilities. No new catalog families
are prerequisites.

## Font starting points

The [primary-source font study](dev-162-font-research.md) records exact artifacts,
licenses, axes, checksums and script limits. Keep four deliberately supported
families rather than suggesting arbitrary fonts have been calibrated.

| Starting point         | Body           | Headings       | UI            | Code          |
| ---------------------- | -------------- | -------------- | ------------- | ------------- |
| Inter                  | Inter          | Inter          | Inter         | IBM Plex Mono |
| Source Serif 4 + Inter | Source Serif 4 | Source Serif 4 | Inter         | IBM Plex Mono |
| Plex Sans + Plex Mono  | IBM Plex Sans  | IBM Plex Sans  | IBM Plex Sans | IBM Plex Mono |

The proposed default is Inter. Each assignment changes independently. These names
identify combinations, not product categories or quality ranks. Selecting a whole
starting point explicitly resets typography; other theme sections and deliberate
component exceptions remain untouched.

| Studied context/profile     | Size at 16px root | Leading | Maximum measure    |
| --------------------------- | ----------------- | ------- | ------------------ |
| Body / Inter                | 20px              | 1.6     | 64ch               |
| Body / Source Serif 4       | 21px              | 1.65    | 62ch               |
| Body / IBM Plex Sans        | 20px              | 1.6     | 62ch               |
| UI / Inter or IBM Plex Sans | 16px              | 1.5     | Layout owned       |
| Code / IBM Plex Mono        | 14px              | 1.65    | 80ch block maximum |

These candidate bases replace Study 01's 18/20px prose and 14px UI. They await
visual review. The observations establish rendering behavior on the recorded
specimens, not universally better reading performance.

Profiles are contextual: a serif in UI or mono in Body receives neutral manual
metrics and an uncalibrated label. Neutral Body is 20px/1.65/64ch; neutral UI is
16px/1.5. This is also the unfamiliar-custom-font path in DEV-164. No x-height
normalization, width squeezing, AI selection or readability score is implied.

Default width is 100%; optical sizing is automatic only where the file supports
it. Axis exploration is manual tuning. Weight/style choices must match available
files/ranges. Report incompatible retained overrides; do not silently claim an
unavailable requested weight renders exactly. The font study distinguishes
verified Roman axes from matching italic files whose axes were not inspected.

## Text styles and hierarchy

R is the Body reference size, U the UI reference size, Q the heading scale.
Study 02 offers Q = 1.125, 1.2, 1.25 or 1.333, starting at 1.25. Scale generates a
hierarchy; font choice, leading, paragraph spacing, measure and context remain
independent decisions. Reference values below use R = 20px, U = 16px, Q = 1.25.
Production sizes use rem, tracking em, and line height unitless numbers.

| Style              | Assignment | Narrow → wide reference   | Weight | Leading      | Tracking | Measure      |
| ------------------ | ---------- | ------------------------- | ------ | ------------ | -------- | ------------ |
| Prose / Title      | Headings   | R×Q³ → R×Q⁵ (39.1→61px)   | 600    | 1.12         | -.025em  | 22ch         |
| Prose / Heading    | Headings   | R×Q → R×Q² (25→31.25px)   | 600    | 1.25         | -.015em  | 30ch         |
| Prose / Subheading | Headings   | R×1.1 → R×Q (22→25px)     | 600    | 1.3          | -.01em   | 36ch         |
| Prose / Body       | Body       | R (20px)                  | 400    | Body leading | 0        | Body measure |
| Prose / Lead       | Body       | R×1.125 (22.5px)          | 400    | 1.5          | 0        | 55ch         |
| Prose / Small      | Body       | R×.8 (16px)               | 400    | 1.5          | 0        | Body measure |
| Prose / Quote      | Body       | R×1.25 (25px)             | 400    | 1.4          | -.01em   | Body measure |
| UI / Title         | UI         | U×1.25 (20px)             | 600    | 1.3          | -.015em  | Layout owned |
| UI / Body          | UI         | U (16px)                  | 400    | UI leading   | 0        | Layout owned |
| UI / Label         | UI         | U (16px)                  | 500    | 1.4          | 0        | Layout owned |
| UI / Supporting    | UI         | U×.9375 (15px)            | 400    | 1.5          | 0        | Layout owned |
| UI / Caption       | UI         | U×.875 (14px)             | 400    | 1.5          | 0        | Layout owned |
| UI / Metric        | UI         | U×2 (32px)                | 600    | 1.15         | -.03em   | Layout owned |
| UI / Eyebrow       | UI         | U×.75 (12px)              | 600    | 1.4          | .1em     | Layout owned |
| Display            | Headings   | R×Q³ → R×Q⁶ (39.1→76.3px) | 600    | 1.06         | -.035em  | 18ch         |
| Code / Block       | Code       | 14px                      | 400    | 1.65         | 0        | 80ch         |

Inline code uses Code at .9em with inherited weight/leading and zero tracking;
it does not adopt a standalone block line box. Emphasis uses real italic and
strong text an available weight. The inventory and names remain open for review.

### Responsive sizing and flow

Body and UI sizes remain stable rem values. Headings/display interpolate between
explicit narrow/wide endpoints over a **24rem–56rem local container** range,
bounded with `clamp`. The preferred value is a rem intercept plus a cqi slope
calculated from those endpoints/range. Use the content/specimen width, never the
whole workshop viewport. Nested prose columns establish their own container.
An opt-in documented container is required; compact values are the fallback.

Measure is a maximum, never a minimum or exact character count. `ch` depends on
the face's zero advance and optical size. Prose wraps instead of disappearing or
condensing. Code and genuinely two-dimensional data may scroll within labelled
regions; surrounding copy must reflow. Production browser zoom must be verified;
container-responsive text is not automatic evidence of 200% resize conformance.

Paragraph/block spacing is visible, initially 1.25em. Paragraphs, lists, figures,
quotes and code blocks use that flow amount; section headings receive 1.6× flow
before and .5× after. Flow styles stay local to prose. UI layout gaps, control
padding and minimum heights remain geometry responsibilities. Labels must wrap
and grow with text rather than be squeezed into a fixed-height control.

### Overrides and integration

Manual context metrics survive a font switch. A context reset removes only its
manual rhythm metrics, preserving explicit style overrides. Resetting a style
removes only its override. A whole starting-point selection explicitly resets the
typography recipe. None of these operations implicitly resets another theme
section or deliberate component exception.

Library capabilities own deterministic resolution, validation, serializable data
and generated CSS through the existing typography section and ThemeDocument.
No competing theme compiler or font-loader runtime. Before DEV-163/167 adopts
styles, prove legacy partial themes, component overrides, caller utilities,
nested scopes, modes, and existing control-size relationships. Exact public
function names/types belong to implementation after model acceptance.

## Proof-sheet workflow

Study 02 replaces stacked demonstration boxes with **Article, Product, Data and
Landing** compositions. Article has publication identity, title/lead/byline,
long prose, headings, figure/caption, list, quote, emphasis and inline/block code.
Product has a workspace frame, navigation, form, long action/error copy and
members. Data has metrics, project table and supporting panels. Landing has
navigation, hero, action, feature section, testimonial and footer.

Controls sit beside the proof. Click text to inspect and override its assignment,
endpoint sizes, weight, leading, tracking and measure. There are no hidden size
overrides in the proof's layout stylesheet. The study uses semantic HTML and
native controls; this does not replace production Radiant component evidence.

Views use 800/640/390/320 CSS px. Compare widths renders 800px and 390px frames
from one model and copy state. Frames are visually scaled to fit, with scale
stated; internal CSS widths remain as labelled. This is responsive proof, not
saved treatment comparisons. Editing stays in memory, without accounts or uploads.
Switching compositions/widths preserves edited copy and form values. Unedited
inline markup survives remounting; editing that copy is plain-text editing.

## References and observations

- Study 01, rejected: [snapshot f5243cf](https://github.com/cognitap/radiant-docs/blob/f5243cf/examples/workshop/typography-rhythm.prototype.html).
- Study 02, current candidate: [self-contained HTML](https://github.com/cognitap/radiant-docs/blob/a0c140a/examples/workshop/typography-rhythm.prototype.html), commit `a0c140a`, on `prototype/dev-162-typography-rhythms`.

Download one HTML and open it directly. Both snapshots embed eight actual pinned
WOFF2 files and complete upstream licenses. The experiment is website owned,
outside main. Do not merge it or its embedded assets into production. Captures
and raw observations remain in ignored `output/dev162/`; the pinned HTML is the
durable reference.

Study 02 uses headless Chromium **156.0.8078.4**, 1600×1100 host viewport, awaiting
all faces explicitly. **72 combinations**: three font starting points × four
compositions × four ordinary widths (48), plus spacing override, 200% root text
and dark at 320px for Inter and Source Serif (24). Eight faces loaded, with no
page runtime errors. Body/content/prose/panel/hero/stat/column boxes had no width
overflow beyond 1px; table/code scrolling stays local.

An initial run exposed the article's process figure overflowing at 320px with
enlarged text; it now stacks. Inspection also caught unedited emphasis/code
being flattened on remount; only actual edits are now stored as plain text.

Recorded interactions: edited article title shared across both widths; 1.85 body
leading retained after family switch and context reset; style reset restored the
Inter profile's 1.6; Source Serif headings with Inter body. The inspector follows
known font weight ranges and flags incompatible retained weights. Captures cover
all four compositions for Inter and Source Serif at 800px, plus the studio.

## Reference comparison and limits

The owner's [shadcn/typeset reference](https://ui.shadcn.com/docs/typeset) already
provides font/context presets, size/leading/flow, container-aware prose, themes
and copyable setup. Separate prose presets alone would not meet the ambition.
This proposal adds explicit UI styles, studied font profiles, independent heading
assignment, style inspection and shared responsive compositions; their production
value still needs proof.

Website delivery owns pinned curated assets/licenses, explicit loading/failure
states, local font trials, controls and font setup. The library never downloads
fonts. Exports identify required families, weights/styles/axes, fallback and
setup; local bytes/blob URLs stay local. Roles must round-trip through the shared
full/selective theme handoff.

The spacing probe applies leading 1.5, paragraph spacing 2em, tracking .12em and
word spacing .16em together ([W3C explanation](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html)).
These are user override tests, not required authored defaults. Embedded 320px
proof and 200% root-size probes do not establish browser zoom or WCAG conformance.
The font study records Latin/Greek/Cyrillic sample limits and absent Arabic/CJK
characters. No broad-script, shaping, RTL, AT or universal readability claim.
Production loading, keyboard/focus, hydration, installed CSS routes, scopes and
existing-family adoption remain DEV-163–169 work.

Owner review remains open for **visual typography, model/naming and exploration**.
Do not implement either experiment's model before acceptance. Diagnostics and
saved treatment comparisons remain future scope, as agreed for DEV-161.
