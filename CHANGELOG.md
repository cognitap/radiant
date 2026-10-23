# Changelog

See the [release policy](RELEASE_POLICY.md) for versioning and migration rules.

## Unreleased

- Button is a near-black control with a faint top highlight and a soft shadow.
  Pressing it scales to 97% and darkens. The motion is removed when the user
  prefers reduced motion.
- `pending` keeps the label's space, shows a spinner, and ignores activation.
  It does not set `disabled`, so focus can stay on the button.
- Keyboard, focus, and screen reader checks were not run in this change.
  Storybook has no interaction runner yet, and Button is not marked ready.

## 0.0.2

- Documentation and maintainer tooling cleanup. The Button API, styles and
  dependency requirements are unchanged; no migration is needed.
- Still experimental, with a single native Button. Automated package checks do
  not replace manual keyboard, focus and screen reader verification.

## 0.0.1

- Public package identity for the first, `0.0.1` release. Do not expect granular updates until package is mature enough to be used by third parties.
