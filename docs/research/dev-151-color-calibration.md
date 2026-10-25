# DEV-151: Color-wall calibration research

Date: 2026-10-25. Status: research and candidate defaults for visual comparison;
owner aesthetic approval and the production interface remain open. No runtime
contract changes are implied.

## Reference and model

The requested reference is the **2014 Material wall**: many coordinated hue
families with 50–900 shades and additional accent shades, rather than only an
application's primary/secondary colors. Material's later palette tool generated
harmonies by adjusting hue, chroma and lightness algorithmically. This supports a
deterministic generator, without establishing Radiant's tuning values.
[Material's original palette reference](https://m2.material.io/guidelines/style/color.html).

Modern Material You is a different system. Its HCT implementation combines CAM16
hue/chroma with CIELAB L* tone, which relates directly to relative luminance.
Its tone-based contrast shortcuts must **not** be applied to OKLCH L.
[Material HCT source](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/hct/hct.ts).

Use Oklab/OKLCH to organize perceptual lightness, chroma and hue; it is a useful
approximation to perception, not a proof that mathematical uniformity produces
an aesthetically balanced wall. Equal hue angles are a starting grid, not an
art-direction verdict.
[Oklab's author and conversion matrices](https://bottosson.github.io/posts/oklab/).

## Candidate defaults to compare

These are **Radiant hypotheses**, not values prescribed by the sources.

| Concern            | Candidate                                                                                                                  | Comparison / limitation                                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Wall structure     | Shared lightness stops across named hue families; one brand-derived family plus tinted and untinted neutrals               | Start with 10–12 stops and inspect the whole wall at once. Stop count, names and exact lightness curve remain visual decisions.   |
| Vividness          | Hue/lightness-specific gamut-relative chroma with a smooth envelope, strongest in useful middle shades                     | Compare against fixed absolute chroma. Matching gamut fractions alone does not guarantee equally colorful-looking hues.           |
| Hue shaping        | Constant hue within each ramp as baseline                                                                                  | Compare gentle, explicit hue curvature only when it fixes a visible problem; avoid large hidden shifts.                           |
| Brand reference    | Preserve the supplied source color separately and show its location relative to the regular ramp                           | Do not silently rename the nearest regular stop as the exact brand.                                                               |
| Regular ramp       | Keep calibrated stops regular by default                                                                                   | Compare an exact inserted/anchored brand stop against a nearest-stop approximation and an explicitly adjusted source.             |
| Semantic accent    | Choose an appropriate related shade and foreground for the actual background and use                                       | An exact logo color need not be the action background or link color. Show when these differ.                                      |
| Near-neutral input | Treat C < 0.02 as a warning that hue-derived identity is unstable; offer a neutral-first result and an explicit hue choice | This threshold is a provisional UI heuristic. Do not infer a strong chromatic identity from gray or numerical conversion residue. |
| Working palette    | Suggest brand, one supporting family, neutrals and conventional status colors, with clear roles                            | Retain the full wall for additional needs; harmony alone does not establish chart distinguishability or status meaning.           |
| Gamut              | Calibrate against sRGB first; allow an explicit Display P3 enhancement with an sRGB fallback                               | Judge both outputs independently; do not make P3 hardware necessary for the default theme.                                        |

For gamut mapping, prefer deliberate perceptual chroma reduction over independent
RGB channel clipping, which can distort hue. The gamut boundary changes with
both hue and lightness. CSS Color 4 describes several mapping algorithms; do not
assume a hand-written strict chroma search reproduces every browser's mapping.
[Ottosson's gamut analysis](https://bottosson.github.io/posts/gamutclipping/),
[CSS Color 4 gamut mapping](https://www.w3.org/TR/css-color-4/#gamut-mapping).

Radix provides a useful **role-oriented** comparison: its steps have intended UI
uses and even its solid-color families differ in whether white or dark text is
appropriate. Its custom generator also exports wide-gamut definitions and sRGB
fallbacks. This is evidence to separate color-wall regularity from semantic
role guarantees, rather than copying the Radix step model wholesale.
[Radix scale uses](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale),
[Radix custom palettes](https://www.radix-ui.com/colors/docs/overview/custom-palettes).

Adobe Leonardo is a useful comparison for selecting colors by target contrast
against a chosen background. Its premise is contrast-directed interpolation,
not an assertion that one fixed lightness scale covers every UI role.
[Leonardo's first-party README](https://github.com/adobe/leonardo/blob/main/README.md).

## Reproducible difficult inputs

All hex values below are opaque sRGB test fixtures, not claimed brand assets.
Numbers are calculated from the unmodified inputs using Ottosson's published
linear-sRGB/Oklab matrices and WCAG's sRGB transfer function and luminance
weights. Ratios are displayed to four decimals; evaluate thresholds before
rounding. `L` is OKLCH lightness on the 0–1 scale.

| Input                 | Purpose                                                      |      L |      C | Contrast with white | Contrast with black |
| --------------------- | ------------------------------------------------------------ | -----: | -----: | ------------------: | ------------------: |
| `#FF0000`             | Vivid red; white text fails normal-text minimum              | 0.6280 | 0.2577 |              3.9985 |              5.2520 |
| `#0000FF`             | Deep blue at gamut boundary                                  | 0.4520 | 0.3132 |              8.5925 |              2.4440 |
| `#FFFF00`             | Very light, vivid yellow                                     | 0.9680 | 0.2110 |              1.0738 |             19.5560 |
| `#00FF00`             | Light, vivid green                                           | 0.8664 | 0.2948 |              1.3722 |             15.3040 |
| `#7F6A75`             | Muted plum                                                   | 0.5480 | 0.0310 |              4.9753 |              4.2209 |
| `#F5E6FF`             | Pale lavender                                                | 0.9442 | 0.0368 |              1.1901 |             17.6452 |
| `#17111F`             | Very dark tinted seed                                        | 0.1924 | 0.0290 |             18.4795 |              1.1364 |
| `#808080`             | Achromatic seed; hue must not come from floating-point noise | 0.5999 |     ~0 |              3.9494 |              5.3172 |
| `#000000` / `#FFFFFF` | Endpoints                                                    |  0 / 1 | 0 / ~0 |              21 / 1 |              1 / 21 |

Also exercise `color(display-p3 1 0.5 0)` as an explicit wider-gamut input;
compare its preserved source, P3 result and mapped sRGB approximation without
pretending their displayed colors are identical.

A strict sRGB boundary check illustrates the chroma problem: at L = 0.65,
maximum C is approximately 0.26010 at h = 0°, 0.13283 at 90°, 0.11242 at 210°,
and 0.29628 at 330°. Reproduce by holding L/h fixed, binary-searching C in
[0, 0.5] for 60 iterations and accepting only converted **linear** sRGB channel
values in [0, 1]. These are boundary measurements, not proposed wall chromas.

## Quantitative and visual checks

1. Record each candidate's original seed, actual mapped stop, ΔL, ΔC, shortest
   hue difference, and Euclidean ΔE OK in Oklab. Treat ΔE as a comparison aid;
   no single universal brand-acceptability threshold is established here.
2. Confirm deterministic regeneration, in-gamut fallback values, monotonic
   intended ramp lightness, no duplicate quantized adjacent stops and reported
   adjacent ΔE. Diagnose jumps; uniform adjacent ΔE is not itself the goal.
3. Compute contrast from the **final rendered colors**, after mapping and alpha
   compositing over the specified background. For sRGB:
   `Y = .2126 Rlinear + .7152 Glinear + .0722 Blinear` and
   `ratio = (Ylighter + .05) / (Ydarker + .05)`. OKLCH L is not Y. Normal text
   needs at least 4.5:1; qualifying large text needs 3:1. Never round a failure
   upward. Test P3 output using that space's proper conversion, not sRGB weights
   applied directly to P3 channel values.
   [WCAG contrast explanation and formula](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
4. Check meaningful control/state indicators at 3:1 against their adjacent
   colors where applicable. This is not a requirement that every decorative
   border or pair of hover/default swatches differ by 3:1.
   [WCAG non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
5. Review the full wall and limited suggestion together, then the same buttons,
   fields, text links, focus/invalid states and passive surfaces in light/dark.
   Include yellow, blue, muted and near-neutral inputs before approving defaults.

The current Radiant role registry (`src/themes/tokens.ts`) and theming guide
remain canonical. This research does not add palette roles or certify arbitrary
themes, custom backgrounds, translucent surfaces, or chart color distinguishability.
