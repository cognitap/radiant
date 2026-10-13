# Changelog

See the [release policy](RELEASE_POLICY.md) for versioning and migration rules.

## Unreleased

- Compiled `styles.css` for consumers without Tailwind, an optional compiled
  `reset.css` and a source `tailwind.css` customization entry. Tailwind is now
  an optional peer dependency.
- Button inherits application fonts and sets its own box sizing and border
  style, so its default appearance does not require a global reset.
- Migration for Tailwind consumers: replace the old source `styles.css` import
  with `tailwind.css` alongside your own Tailwind entry. Ordinary consumers
  retain the `styles.css` import. Choose one route to avoid duplicate utilities;
  import `reset.css` separately if you want Preflight.
- Public source under MIT, with the copyright notice naming Zoltán Cserei and
  a documented maintainer workflow and public bug/accessibility reporting.
- Initial experimental Button with ESM JavaScript, TypeScript declarations and
  source maps.
- Public package identity, release policy and publishing metadata prepared for
  the first `0.1.0` release.
