# Accessibility

What automation covers, what to check by hand, and who owns what. Radiant targets [WCAG 2.2 A/AA](https://www.w3.org/TR/WCAG22/).

## Automated checks

| Command             | Checks                                     |
| ------------------- | ------------------------------------------ |
| `pnpm test:browser` | axe on every story in Playwright Chromium  |
| `pnpm test:package` | Token contrast across every exported theme |

Automation does not cover screen readers, real browser zoom, OS forced colors, or contrast over translucent surfaces such as Glass. Playwright WebKit is not Safari with VoiceOver, and browser media emulation is not OS reduced motion or forced colors.

## Manual targets

| Platform | Setup                                                                 |
| -------- | --------------------------------------------------------------------- |
| Windows  | Firefox + NVDA, and Windows contrast themes (`forced-colors: active`) |
| macOS    | Safari + VoiceOver                                                    |
| iOS      | Safari + VoiceOver on a physical device                               |
| Android  | Chrome + TalkBack on a physical device                                |

## Manual checks

Open Storybook (`pnpm storybook`) and check the affected stories in each theme and mode.

- **Keyboard and screen reader.** Tab through actions, fields, disclosures, and dialogs, first with the screen reader off and then on. Check names, roles, and states (`disabled`, `aria-busy`, `aria-invalid`, `aria-expanded`, checked, mixed), error and description announcements, modal focus containment, Escape, and focus restoration.
- **Contrast.** Check rest, hover, press, focus, invalid, pending, selected, and disabled states against their real backgrounds, especially Glass gradients. Normal text needs 4.5:1. Large text, control boundaries, state indicators, and focus outlines need 3:1 against adjacent colors. Keep non-color cues.
- **Zoom and spacing.** Check 200% text resize and 400% browser zoom at a 1280 px viewport (320 px effective width), and WCAG text spacing (line height 1.5, paragraph spacing 2 em, letter spacing 0.12 em, word spacing 0.16 em). Look for clipped text, two-axis scrolling, and sticky or overlay elements hiding focus.
- **Pointer.** Targets need 24 × 24 px, or 24 px between target centers. Releasing outside a control cancels activation.
- **OS preferences.** With reduced motion on, springs and CSS lift or shift stop while state changes stay immediate. With Windows contrast themes on, focus outlines, selection marks, and boundaries stay visible once decorative backgrounds are stripped.

## Ownership

Radiant provides native elements, ARIA relationships, keyboard behavior, and theme tokens. Applications own accessible names, heading hierarchy, form instructions and error messages, landmarks, and any custom colors or style overrides.
