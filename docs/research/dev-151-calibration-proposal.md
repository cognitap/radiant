# DEV-151: Color calibration proposal

Date: 2026-10-25. Status: ready for owner visual review. These are selected
candidate defaults for the production generator, not an approved public API.

## Recommended brand-fidelity default

**Preserve the original source exactly, alongside a calibrated shade ramp.**
Keep the source identity separate from a numbered shade and from semantic action
or text colors. Label the closest regular shade as an approximation. Never
silently replace the supplied brand with that approximation.

Offer **anchor exact color in the ramp** as an explicit option. Choose its stop
by nearest lightness, reshape neighboring lightness/chroma smoothly, and retain
the exact input at the anchor. This is viable; the data does not establish that
it is universally less balanced. The default preference for stable calibrated
curves is a product judgment, not a theorem about adjacent color distances.

Reject silent snapping of the source to a regular stop. For example, the
prototype's nearest generated shade is about 0.1302 ΔE OK from pure yellow and
0.2393 from black. These are observed differences, not universal acceptability
thresholds. They should not be described as harmless small adjustments.

## Comparison artifact

Open `src/themes/dev-151-color-calibration.prototype.html` directly in a browser.
It is self-contained and needs no packages, server or network. Its four guided
comparisons cover vivid, muted, pale, and dark/neutral cases. Free controls expose
the exact source, source-derived vividness, tone distribution, neutral tint, hue
alignment, near-neutral fallback hue, and shared/hue-aware shade curves.

The left-hand comparison offers two exact-preserving methods: replace one stop,
or reshape the brand ramp around it. The right-hand comparison offers a regular
ramp with the source kept separately, or an explicitly adjusted source. Both
sides show the full wall, a smaller working palette and light/dark illustrations.

The experiment is disposable and belongs on `prototype/dev-151-color-calibration`,
outside main. Production code still follows DEV-152/153/154/155 and their gates.
Public workshop presentation belongs in radiant-docs later; this HTML is a
color-behavior experiment beside the theme module, not a new production route.

## Selected candidate calibration

| Concern            | Candidate default                                                                                                                                | Reason / limit                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Target             | sRGB first; explicit, separately checked P3 enhancement/fallback later                                                                           | An ordinary display can judge the default. This prototype accepts opaque sRGB hex only and does not validate P3.                              |
| Mapping            | Reduce chroma at constant OKLCH L/h to fit sRGB, then calculate metrics from actual 8-bit output                                                 | Conservative, deterministic comparison method; not a claim to reproduce browser CSS gamut mapping. Evaluate the production mapper in DEV-153. |
| Shade structure    | 11 steps: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950                                                                                   | A whole wall of 16 hue families, plus Brand and Neutral. Step labels order a ramp and carry no contrast guarantee.                            |
| Reference curve    | L = .985, .965, .93, .87, .79, .70, .61, .52, .43, .34, .24                                                                                      | A reproducible control curve, compared with hue-aware curves.                                                                                 |
| Hue-aware curve    | Move the middle toward the hue's measured gamut cusp: clamp(.70 + .70 × (cuspL − .70), .60, .86); preserve endpoints and monotonic interpolation | Keeps yellow/blue from receiving identical middle lightness. Exact curve values remain open to visual refinement.                             |
| Chroma             | Hue/lightness-relative gamut fraction with a smooth absolute-chroma cap                                                                          | Matching gamut fractions still needs visual review; it does not guarantee equal apparent strength.                                            |
| Initial vividness  | Source C / available C at its L/h, clamped to .10–.92; .35 for near-neutral input                                                                | Carries a muted source's restraint into the wall. Expose a clear user override.                                                               |
| Near-neutral input | C < .02 uses a neutral brand ramp and an explicit hue fallback; candidate 255°                                                                   | Avoid deriving identity from numerical hue noise. Threshold and fallback are UI hypotheses.                                                   |
| Neutral tint       | .012 peak chroma, user-adjustable to zero                                                                                                        | Subtle brand relationship while retaining an untinted option.                                                                                 |
| Hue behavior       | Constant hue within each regular chromatic ramp; modest family alignment toward the source                                                       | Avoid hidden, large shifts. Exact anchoring adapts its own row separately.                                                                    |
| Human controls     | Brand input/fidelity, vividness, tone distribution, neutral tint, hue relationship; advanced L/C/h inspection                                    | Repeatable local math; AI is not a prerequisite.                                                                                              |

## What the evidence supports

[Machine-readable results](dev-151-calibration-results.json) record 12 input
fixtures under two tone models and four policies: **96 profiles**. They include
the exact source, actual brand ramp, mapped semantic colors, contrast ratios and
adjacent ΔE, plus the prototype SHA-256 and runtime for reproduction.

At the selected defaults all profiles have strictly descending rendered
lightness, no duplicate adjacent swatches, and unchanged source identity under
the reference, anchored and simple-pin policies. The measured illustrative
body/muted/link/action-text pairs meet 4.5:1, while field and action-boundary
pairs meet 3:1. Ratios are evaluated before rounding. These observations are
limited to the recorded opaque fixtures and example role policy.

Anchoring is a credible alternative: for the violet fixture, its largest
adjacent ΔE is approximately .1374 versus .1403 for the regular ramp. For vivid
red the figures are .1489 versus .1327. Preserving the source separately keeps
the same calibrated row behavior across different seed lightness/chroma values;
anchoring trades that regularity for an exact numbered stop.

The initial experiment also caught a real policy pitfall: choosing an exact
insertion point by nearest overall ΔE can break lightness order for yellow and
green. The comparison now chooses exact insertion by lightness. The nearest
regular approximation remains measured by ΔE; those are different questions.

The UI illustrates one simple semantic selection policy: choose a related action
fill with sufficient text and panel contrast. An exact bright fill plus a
contrasting outline can also be appropriate. Therefore a darker example action
is not evidence that the brand itself must change. Full role/state mapping and
working-palette recommendations remain DEV-154 work.

## Verification and remaining review

- Primary-source research and conversion/contrast baselines are in
  [the research note](dev-151-color-calibration.md). The experiment reproduces
  the red/white ratio and hue-dependent chroma-boundary measurements there.
- Local Chromium rendered the file without page errors. Vivid/muted/pale/dark
  and neutral controls, guided steps, keyboard tabs, and a 390px layout were
  inspected; swatch overflow stays inside each scrollable wall.
- Visual review covered violet, vivid yellow and muted plum walls and both
  light/dark illustrations. This is not production component, broad font,
  chart-distinguishability or assistive-technology certification.
- No tests or dependencies were added to the production library, and no public
  theme API was changed. Preserve the prototype on its throwaway branch.

Before the production generator commits to these defaults, the owner should
review **the regular-ramp versus exact-anchored preference** and the overall
hue-aware wall's visual character. The source-preservation contract is the
recommended invariant in either case.
