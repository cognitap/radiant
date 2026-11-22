# Accessibility

What automation covers, what to check by hand, and who owns what. Radiant targets [WCAG 2.2 A/AA](https://www.w3.org/TR/WCAG22/).

## Automated checks

| Command             | Checks                                     |
| ------------------- | ------------------------------------------ |
| `pnpm test:browser` | axe on every story in Playwright Chromium  |
| `pnpm test:package` | Token contrast across every exported theme |

Automation does not cover screen readers, real browser zoom, OS forced colors or reduced motion, or contrast over translucent surfaces such as Glass. Playwright WebKit is not Safari with VoiceOver.

## A2UI surfaces

`validateA2uiAccessibility(messages, { registry, fix })` from `@cognitap/radiant/a2ui` checks a surface against the rules on each registry entry, without a DOM. Run it server-side before storing. Each error names `nodeId`, `component`, `rule`, `prop`, and `message`. With `fix: true` it returns a fixed copy, filling a missing `label` from author text such as `placeholder`; input is never mutated. `A2uiSurface` warns once per problem outside production.

Every `createA2uiRegistryEntry` call declares `accessibility` rules, or `[]` for none: `controlLabelRule` for form controls, `buttonNameRule` for buttons, `imageAltRule` for images, and `mediaNameRule` for video and audio. An image needs `description` or `accessibility.label`; mark a decorative one with `description: ""` or `accessibility.hidden: true`. Icons are hidden from assistive technology unless `accessibility.label` names them. Every tab needs a `title`. A `Modal` needs a Button `trigger`, whose text names the dialog; Escape and backdrop clicks close it, and `A2uiSurface` `labels.modalClose` adds a close button with host-supplied text. Toasts need a host `ToastProvider` viewport or `labels.notifications` naming their own. A `CompareItem` needs a `header` naming its option. A `Matrix` and its headers need labels. Without `labels.revealPrevious`, `revealNext` and `revealPosition`, a `Reveal` shows every step; without `labels.sortable*`, a `SortableList` cannot reorder; without `labels.audioPlay`, `audioPause` and `audioSeek`, an `AudioPlayer` stays native. A filterable `ChoicePicker` filters only with `labels.filter`.

The `A2UI/Conformance` stories replay every basic-catalog fixture in every theme and mode, failing on axe violations, error or fallback diagnostics, and `validateA2uiAccessibility` errors. Only fixtures breaking the rules on purpose skip axe.

## Right-to-left

Horizontal arrow navigation, drag/pointer geometry, chevron mirroring, logical alignment/positioning, horizontal and vertical scrolling, reading order, nested overrides, and SSR hydration are verified across overlays (`Popover`, `Tooltip`, `HoverCard`, `ContextMenu`, `Menu`, `Drawer`, `Toast`, `Tour`, `Select`, `Combobox`, `MultiSelect`, `Cascader`, `TreeSelect`), navigation (`Tabs`, `Toolbar`, `ToggleGroup`, `Menubar`, `NavigationMenu`, `Breadcrumb`, `Pagination`, `NavLink`, `AppShell`, `Stepper`, `Timeline`, `Tree`), controls (`Slider`, `RangeSlider`, `Rating`, `Calendar`, `DateField`, `DatePicker`, `DateRangePicker`, `TimeInput`, `ColorPicker`, `ColorInput`, `Switch`, `Checkbox`, `Radio`, `OTPField`, `TagsInput`, `NumberField`, `PasswordInput`, `FileInput`, `ButtonGroup`, `InputGroup`), and layout/data families (`Collapsible`, `Accordion`, `ScrollArea`, `Carousel`, `Resizable`, `DataTable`, `Indicator`, `CodeBlock`, `Charts`, `AnnotatedText`).

## Manual targets

| Platform | Setup                                                                 |
| -------- | --------------------------------------------------------------------- |
| Windows  | Firefox + NVDA, and Windows contrast themes (`forced-colors: active`) |
| macOS    | Safari + VoiceOver                                                    |
| iOS      | Safari + VoiceOver on a physical device                               |
| Android  | Chrome + TalkBack on a physical device                                |

## Manual checks

Open Storybook (`pnpm storybook`) and check the affected stories in each theme and mode.

- **Keyboard and screen reader.** Tab through actions, fields, disclosures, and dialogs, first with the screen reader off and then on. Check names, roles, and states (`disabled`, `aria-busy`, `aria-invalid`, `aria-expanded`, checked, mixed), error and description announcements (on each option of an invalid group), modal focus containment, Escape, and focus restoration.
- **Contrast.** Check rest, hover, press, focus, invalid, pending, selected, and disabled states against their real backgrounds, especially Glass gradients. Normal text needs 4.5:1. Large text, control boundaries, state indicators, and focus outlines need 3:1 against adjacent colors. Keep non-color cues.
- **Zoom and spacing.** Check 200% text resize and 400% browser zoom at a 1280 px viewport (320 px effective width), and WCAG text spacing (line height 1.5, paragraph spacing 2 em, letter spacing 0.12 em, word spacing 0.16 em). Look for clipped text, two-axis scrolling, and sticky or overlay elements hiding focus.
- **Pointer.** Targets need 24 × 24 px, or 24 px between target centers. Releasing outside a control cancels activation.
- **OS preferences.** With reduced motion on, springs and CSS lift or shift stop while state changes stay immediate. With Windows contrast themes on, focus outlines, selection marks, and boundaries stay visible once decorative backgrounds are stripped.

## Ownership

Radiant provides native elements, ARIA relationships, keyboard behavior, and theme tokens. Applications own accessible names, heading hierarchy, form instructions and error messages, landmarks, and any custom colors or style overrides.
