# DEV-177 — grouped layout resize and reorder

`bindSpringLayout` and `useSpringLayout` measure direct-child natural-flow slots,
reserve their destination sizes, and project dedicated motion parts using the
existing persistent x/y/width/height springs. No new solver or Motion React
projection is introduced. Native content is never cloned, reparented or scaled.

The adapter releases all reservations before reading any natural bounds. Targets
therefore come from the same layout pass rather than each other's in-flight sizes.
Flex reservations hold their measured basis; grid/flex placement and nested content
retain browser layout ownership. At rest, off and disposal, authored inline values
are restored. Caller-reclaimed values and newly authored baselines survive cleanup.

## Local gate

- 124 runtime tests pass.
- 47 tests against the packed, installed package pass, followed by both NodeNext
  and Bundler declaration contracts. Root imports remain engine-free, and both
  layout entrypoints import on the server without browser reads.
- 236 Chromium cases across 45 files pass: every story in Radiant light/dark and
  the native browser platform project. The nine layout platform cases exercise
  repeated reorder/reversal, position and signed velocity continuity, interrupted
  width changes, text growth, root/outer scrolling, translated coordinate spaces,
  grid/flex sizing, selection/focus, native Enter/form submission, native modal
  dismissal/focus restoration, cleanup/replacement and invalid geometry/options.
- React SSR/hydration, StrictMode replay, live reduced motion, theme off and root
  replacement pass; spring frames do not render React state.
- Generated theme check, source/contract/build types, formatting, lint, JavaScript
  and compiled/reset CSS builds, and the production Storybook build pass.

Visual inspection of the production Storybook proof in Radiant light/dark passed,
including its real width control. Captures are retained locally under
`output/playwright/layout-{light-final,dark-final,dark-wide}.png`. This caught and
fixed missing Storybook-only utilities and overly long card-action labels.

Browser receipt: Node 26.11.1, Playwright 1.64.1, Vitest 5.0.5, Chromium
156.0.8078.4 on macOS 27.0.1 arm64. The revision receipt identifies the base
commit plus a dirty candidate, paired with the completed JUnit gate. Storybook's
proof utilities stay in its stylesheet, outside the consumer CSS scan.

## Limits

Use dedicated, unpadded/borderless slots and transform-free motion parts in an
unscaled/unrotated coordinate plane. Common ancestor translation and normal
scrolling are supported; transformed planes, fixed/sticky slots, independently
animated nested groups, shared-element morphing, drag sorting and enter/exit
presence are outside this interface. New/replaced items start at natural bounds;
removed items disappear immediately. Overflow/focus intent remains application
owned; moving a focused DOM node is still the consumer's reorder operation.

Read docs/motion.md for geometry, native ownership and imperative observer rules.
The public workshop/handoff and release remain DEV-178–180. No npm publication,
actual screen-reader audit or stable-release compatibility claim is made here.
