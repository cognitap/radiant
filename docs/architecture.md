# Architecture

Radiant wraps native HTML in React components. The browser provides behavior: button activation, radio grouping, modal focus. Radiant adds composition, state, and styling. Applications provide content and logic.

Component APIs live in the [component guides](https://github.com/cognitap/radiant-docs). Cross-family topics live in [theming](theming.md), [motion](motion.md), and [accessibility](accessibility.md). Generative UI boundaries and the A2UI renderer engine live in [ADR 0002](adr/0002-generative-ui-scope.md) and [ADR 0003](adr/0003-a2ui-renderer-engine.md).

## Package entries

- `@cognitap/radiant`: components
- `@cognitap/radiant/charts`: charts
- `@cognitap/radiant/examples`: theme presets
- `@cognitap/radiant/catalog`: canonical model-facing catalog

[package.json](../package.json) lists every import path, including CSS and motion.

## Module rules

- `src/internal/` is framework-free logic: selection rules, event guards. `src/react/` wraps it in hooks and imports only React and `src/internal/`. Families may depend on each other without cycles.
- Do not read browser globals during module initialization or server rendering. In effects, use the host's `ownerDocument` and `defaultView` so iframes work, and clean up on unmount.
- Server markup must equal the first client render. `Dialog` opens in an effect. `Collapsible` syncs `<details open>` on mount.
- Add `"use client"` to modules that use state, context, refs, or effects. Other modules stay static and may render client families, as `Pagination` renders `Button`. `Card`, `Link`, themes, and examples import nothing marked `"use client"`; they share styles through modules such as `src/components/shared/actionStyles.ts`.

[tests/architecture.test.mjs](../tests/architecture.test.mjs) enforces the import, cycle, `"use client"`, and browser-global rules. [tests/browser](../tests/browser) hydrates server markup.

## Composition

Each native element or behavior has one base family. Higher-level components compose that family instead of rendering raw elements or duplicating its state, keyboard, and focus logic.

`Button` owns `<button>` actions and `Link` owns `<a>` navigation, even when a link looks like a button. Triggers, close buttons, and action items in other families build on `Button`, and navigation items build on `Link`.

`Collapsible` owns `<details>` disclosures, `Dialog` owns modal `<dialog>` state and focus containment, and `Popover` owns the anchored popups of `Menu`, `ContextMenu`, `Menubar`, and `HoverCard`. `Select`, `Combobox`, and `Tooltip` render their own. All of these popups render inside the trigger's container with `popover="manual"`, so they enter the top layer and stay inside their theme and modal subtree.

## Hosts, parts, and styling

- Root `className`, `style`, `ref`, and native props go to the documented host element. State-only roots such as `Dialog` render no element; their named parts (`Trigger`, `Content`) do.
- `parts` styles inner elements such as `label` or `indicator`. Caller classes merge after Radiant's, and caller inline styles win. Radiant owns IDs, ARIA, events, refs, and state attributes.
- A composed host lists every slot: `data-slot="button dialog-trigger"`. Match one slot with `[data-slot~="button"]`.
- Style state with native selectors (`:disabled`, `:checked`, `[open]`), `aria-busy` for pending, and documented `data-state` values. Boolean attributes such as `data-selected` are present when true and absent otherwise.
- Actions take `variant` (appearance), `tone` (intent), and `controlSize` (scale). All controls share `controlSize`. Native props keep their native meaning: `Input.size` is a character width. Radius comes from the theme.

## State

Each state value has one owner for the life of a mount. Pass `x` to control it or `defaultX` to seed it. Passing both, or switching between them, throws. Remount with a new `key` to change owner.

`onXChange(next)` receives the next value only.

- Uncontrolled: Radiant applies the change, then calls the handler.
- Controlled: the handler is a request. If the application declines a disclosure toggle, Radiant restores `<details open>`.

## Events

For click and keydown, `composeAction` checks disabled and pending first, then calls the caller's handler, then the library action. `preventDefault()` in the caller's handler cancels the library action. Native `change`, `toggle`, and `blur` report what has already happened and cannot be cancelled.

## Forms

`Field` provides label and description IDs, passes `disabled` and `required` down, and renders a `<fieldset>` for control groups. Radiant controls read it from context. Plain HTML controls receive `children(controlProps)`.

Custom controls submit through a native form element:

| Component                  | Submitted value                                   |
| -------------------------- | ------------------------------------------------- |
| `Select`                   | Selected value, from a visually hidden `<select>` |
| `Combobox`                 | Committed key, from a hidden input                |
| `Autocomplete`             | Input text, including text not in the list        |
| `MultiSelect`, `TagsInput` | One named value per item                          |
| `NumberField`              | Raw number, separate from the localized display   |
| `OTPField`                 | Whole code, from one input                        |

`Form` runs native validation and async submission. The application owns values, rules, messages, and persistence. Reset restores uncontrolled controls, clears form errors, and aborts a pending submission. Widget state such as the active tab is not form state and survives reset.

## Localization

Resolve the locale in the app and use the same value for `<html {...getLocaleAttributes(locale)}>` and `<LocaleProvider locale={locale} scope="document">` inside the body. The helper runs on the server. Document scope renders no wrapper. The default subtree scope renders a `div` that sets native `lang` and script-derived `dir` for an explicit locale.

Omitting the locale inherits formatting and matching from the closest provider. Native markup still supplies language and direction. Formatting and matching fall back to `en-US` when there is no configured locale or no supported locale match. A component's explicit `locale` overrides its formatting. Popups carry their anchor's language and direction across a portal, with explicit content attributes taking precedence.

`NumberField` localizes its display and parsing. `NumberFormatter` preserves server text when browser locale data differs during hydration. Select and Menu use locale-aware prefix search. Combobox, Autocomplete and their composed families use locale-aware substring search. Built-in matching ignores case and distinguishes accents. Caller filters and text props still apply.

### Right-to-left (RTL)

Direction-sensitive behavior reads computed CSS direction from the host or anchor, so components follow `LocaleProvider`, document `dir`, nested subtree overrides, and direct control `dir` props without separate RTL props. Logical CSS properties (`inset-inline-*`, `padding-inline-*`, `border-inline-*`, `rounded-s-*`/`rounded-e-*`, `text-start`) drive alignment, borders, indicators, and `ToastViewport` placement.

- **Verified coverage:** Horizontal arrow navigation, drag/pointer geometry, disclosure/branch chevron mirroring, logical alignment/positioning, horizontal and vertical scrolling, reading order, nested overrides, and SSR hydration are verified across overlays (`Popover`, `Tooltip`, `HoverCard`, `ContextMenu`, `Menu`, `Drawer`, `Toast`, `Tour`, `Select`, `Combobox`, `MultiSelect`, `Cascader`, `TreeSelect`), navigation (`Tabs`, `Toolbar`, `ToggleGroup`, `Menubar`, `NavigationMenu`, `Breadcrumb`, `Pagination`, `NavLink`, `AppShell`, `Stepper`, `Timeline`, `Tree`), controls (`Slider`, `RangeSlider`, `Rating`, `Calendar`, `DateField`, `DatePicker`, `DateRangePicker`, `TimeInput`, `ColorPicker`, `ColorInput`, `Switch`, `Checkbox`, `Radio`, `OTPField`, `TagsInput`, `NumberField`, `PasswordInput`, `FileInput`, `ButtonGroup`, `InputGroup`), and layout/data families (`Collapsible`, `Accordion`, `ScrollArea`, `Carousel`, `Resizable`, `DataTable`, `Indicator`, `CodeBlock`, `Charts`).
- **Intentional exceptions and limitations:** `TimeInput` keeps numeric `hour:minute[:second]` segments left-to-right while placing `dayPeriod` in the ambient flow. `CodeBlockViewport` defaults to `dir="ltr"` for source code and accepts an explicit `dir` override. `Popover`, `Tooltip`, and `HoverCard` keep physical `side` values (`'left' | 'right'`) while `align` (`'start' | 'end'`), `MenuSubContent`, `Drawer` (`'start' | 'end'`), and `Indicator` resolve logically. `Charts` preserve left-to-right SVG plot geometry while reversing horizontal keyboard stepping in RTL. Caller-supplied icons and `BreadcrumbSeparator` content are not mirrored automatically.

## Customization limits

`render(props)` on button and link parts must return a `<button>` or `<a>`, or a component that forwards to one, with all props, the ref, and the children.

Custom styling and rendering must keep:

- Connected labels and descriptions, and visible focus, invalid, disabled, and pending states.
- Closed dialog and disclosure content hidden, focus contained in modal dialogs, and `<summary>` as a direct child of `<details>`.
- `aria-hidden` on decorative indicators, and support for reduced motion and forced colors.

## Model-facing catalog

Radiant separates its human React API from its model-facing contract in `@cognitap/radiant/catalog`. Human applications compose explicit sub-parts (`Select`, `SelectTrigger`, `SelectContent`, `SelectItem`), pass `className`, `style`, `render`, and refs, and wire native form and ARIA relationships. Models target a smaller, intent-driven catalog instead: one `Choice` entry with `presentation: 'segmented' | 'chips' | 'cards' | 'dropdown'`, semantic spacing (`tight | normal | airy`), JSON Schemas, slot constraints, state bindings, and action shapes.

Catalog entries never expose `className`, `style`, `render`, DOM event handlers, or raw ARIA attributes. The catalog module has no React, DOM, or wire-protocol dependencies; protocol adapters such as A2UI generate their basic and extension catalog schemas from it, and applications add custom entries through `extendCatalog` without shadowing Radiant names.

When a contract changes, update the component's stories and the compile checks in [tests/package](../tests/package).
