# Accessibility

`pnpm test:browser` runs axe on every story in Playwright Chromium, and `pnpm test:package` checks token contrast across exported themes; see [testing](testing.md). Automated checks do not cover screen readers, real browser zoom, OS forced colors, or contrast over translucent surfaces such as Glass. Check those by hand against [WCAG 2.2 A/AA](https://www.w3.org/TR/WCAG22/).

## Manual targets

- Windows: Firefox + NVDA, plus Windows contrast themes (`forced-colors: active`).
- macOS: Safari + VoiceOver.
- iOS: Safari + VoiceOver on a physical device.
- Android: Chrome + TalkBack on a physical device.

Playwright WebKit does not replace Safari with VoiceOver, and browser media emulation does not replace OS reduced motion or forced colors.

## What to check

Open Storybook (`pnpm storybook`) and test the [canonical examples](architecture.md#examples-and-type-fixtures) in each affected theme and mode.

- **Keyboard and screen reader.** Tab through actions, fields, disclosures, and dialogs with the screen reader off, then on. Verify accessible names, roles, states (`disabled`, `aria-busy`, `aria-invalid`, `aria-expanded`, checked, and mixed), error and description announcements, modal focus containment, Escape dismissal, and focus restoration.
- **Contrast and states.** Check rest, hover, press, focus, invalid, pending, selected, and disabled states against their actual backgrounds, especially over Glass gradients. Normal text needs 4.5:1, large text (18pt or 14pt bold) needs 3:1, and required control boundaries, state indicators, and focus outlines need 3:1 against adjacent colors. Keep non-color cues.
- **Zoom, reflow, and spacing.** Test 200% text resize and 400% browser zoom at a 1280 CSS px viewport (320 CSS px effective width), plus WCAG text spacing (line height 1.5, paragraph spacing 2, letter spacing 0.12, word spacing 0.16 em). Check for clipped text, two-axis scrolling, and sticky or overlay focus obstruction.
- **Pointer and target size.** Interactive targets need at least 24 by 24 CSS px, or 24 px spacing between target centers. Pressing and releasing outside a control must cancel activation.
- **OS preferences.** With OS reduced motion enabled, springs and CSS lift or shift stop while state changes stay immediate. With Windows contrast themes enabled, focus outlines, selection marks, and boundaries remain visible after decorative backgrounds are stripped.

## What the application owns

Radiant provides native elements, ARIA relationships, keyboard behavior, and theme tokens. Applications own accessible names, heading hierarchy, form instructions and error messages, page landmarks, and any custom colors or style overrides.
