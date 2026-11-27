# Architecture

Radiant wraps native HTML in React components. The browser provides behavior: button activation, radio grouping, modal focus. Radiant adds composition, state, and styling. Applications provide content and logic.

Component APIs live in the [component guides](https://github.com/cognitap/radiant-docs). Cross-family topics live in [theming](theming.md), [motion](motion.md), and [accessibility](accessibility.md).

## Package entries

- `@cognitap/radiant`: components
- `@cognitap/radiant/charts`: charts
- `@cognitap/radiant/examples`: theme presets
- `@cognitap/radiant/catalog` and `@cognitap/radiant/a2ui`: the [agent layer](#agent-layer)

[package.json](../package.json) lists every import path, including CSS and motion.

## Module rules

- `src/internal/` is framework-free logic: selection rules, event guards. `src/react/` wraps it in hooks and imports only React and `src/internal/`. Families may depend on each other without cycles.
- Do not read browser globals during module initialization or server rendering. In effects, use the host's `ownerDocument` and `defaultView` so iframes work, and clean up on unmount.
- Server markup must equal the first client render. `Dialog` opens in an effect. `Collapsible` syncs `<details open>` on mount.
- Add `"use client"` to modules that use state, context, refs, or effects. Other modules stay static and may render client families, as `Pagination` renders `Button`. `Card`, `Link`, themes, and examples import nothing marked `"use client"`; they share styles through modules such as `src/components/shared/actionStyles.ts`.

[tests/architecture.test.mjs](../tests/architecture.test.mjs) enforces the import, cycle, `"use client"`, and browser-global rules. [tests/browser](../tests/browser) hydrates server markup.

## Composition

Each native element or behavior has one base family. Higher-level components compose it rather than duplicate it. `Stack` is the one-dimensional layout, spaced by the spacing scale.

`Button` owns `<button>` actions and `Link` owns `<a>` navigation, even when a link looks like a button. Triggers, close buttons, and action items in other families build on `Button`, and navigation items build on `Link`.

`Collapsible` owns `<details>` disclosures, `Dialog` owns modal `<dialog>` state and focus containment, and `Popover` owns the popups of `Menu`, `ContextMenu`, `Menubar`, and `HoverCard`; `Select`, `Combobox`, and `Tooltip` render their own. Each popup renders in its trigger's or `anchor` element's container (rect anchors: nearest HTML ancestor) with `popover="manual"`, entering the top layer inside its theme and modal subtree.

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

For click and keydown, `composeAction` checks disabled and pending first, then calls the caller's handler, then the library action. `preventDefault()` in the caller's handler cancels the library action. Native `change`, `toggle`, and `blur` report what already happened and cannot be cancelled.

## Forms

`Field` gives Radiant controls label and description IDs, `disabled`, and `required` through context; plain HTML controls receive `children(controlProps)`. A group's `<fieldset>` keeps help; its controls get `aria-invalid` and the error.

Custom controls submit through a native form element:

| Component                                  | Submitted value                                   |
| ------------------------------------------ | ------------------------------------------------- |
| `Select`                                   | Selected value, from a visually hidden `<select>` |
| `Combobox`                                 | Committed key, from a hidden input                |
| `Autocomplete`                             | Input text, including text not in the list        |
| `MultiSelect`, `TagsInput`, `SortableList` | One named value per item                          |
| `DragAndDrop`                              | Container contents as one JSON object             |
| `NumberField`                              | Raw number, separate from the localized display   |
| `OTPField`                                 | Whole code, from one input                        |

`Form` runs native validation and async submission. The application owns values, rules, messages, and persistence. Reset restores uncontrolled controls, clears form errors, and aborts a pending submission. Widget state, such as the active tab, survives reset.

## Localization

Resolve the locale in the app and use the same value for `<html {...getLocaleAttributes(locale)}>` and `<LocaleProvider locale={locale} scope="document">` inside the body. The helper runs on the server. Document scope renders no wrapper. The default subtree scope renders a `div` that sets native `lang` and script-derived `dir` for an explicit locale.

Omitting the locale inherits formatting and matching from the closest provider. Native markup still supplies language and direction. Formatting and matching fall back to `en-US` when no configured or supported locale matches. A component's explicit `locale` overrides its formatting. Popups carry their anchor's language and direction across a portal; explicit content attributes win.

`NumberField` localizes its display and parsing. `NumberFormatter` preserves server text when browser locale data differs during hydration. Select and Menu use locale-aware prefix search. Combobox, Autocomplete and their composed families use locale-aware substring search. Built-in matching ignores case and distinguishes accents. Caller filters and text props still apply.

### Right-to-left (RTL)

Direction-sensitive behavior reads computed CSS direction from the host or anchor, so components follow `LocaleProvider` and any `dir` without RTL props. Logical CSS properties drive alignment, borders, indicators, and `ToastViewport` placement.

[Accessibility](accessibility.md#right-to-left) lists verified families. Exceptions: `TimeInput` keeps numeric `hour:minute[:second]` segments left-to-right while placing `dayPeriod` in the ambient flow. `CodeBlockViewport` defaults to `dir="ltr"` for source code. `Popover`, `Tooltip`, and `HoverCard` keep physical `side` values while `align`, `MenuSubContent`, `Drawer`, and `Indicator` resolve logically. `Charts` preserve left-to-right SVG plot geometry while reversing horizontal keyboard stepping in RTL. Caller icons and `BreadcrumbSeparator` content are not mirrored.

## Customization limits

`render(props)` on button and link parts must return a `<button>` or `<a>`, or a component that forwards to one, with all props, the ref, and the children.

Custom styling and rendering must keep:

- Connected labels and descriptions, and visible focus, invalid, disabled, and pending states.
- Closed dialog and disclosure content hidden, focus contained in modal dialogs, and `<summary>` as a direct child of `<details>`.
- `aria-hidden` on decorative indicators, and support for reduced motion and forced colors.

## Agent layer

Agents compose interfaces from Radiant. Radiant never calls a model and needs no API key; the application owns prompts, model calls, storage, and what actions do ([ADR 0002](adr/0002-generative-ui-scope.md), [ADR 0003](adr/0003-a2ui-renderer-engine.md)). The agent entries keep `@a2ui/web_core` out of the core entry, so React-only apps load no protocol code.

### Catalog

`@cognitap/radiant/catalog` is the canonical contract, free of React, DOM, and wire-protocol code, so servers can load it and protocol catalogs are generated from it.

Entries never expose `className`, `style`, `render`, refs, DOM handlers, or raw ARIA, whose contracts a model cannot keep. One entry covers one intent, such as `Choice` with a `presentation`, with JSON Schemas, slot constraints, state bindings, and action shapes. `extendCatalog` adds app entries but never shadows a Radiant name.

Entry `guidance` (use, avoid, two examples) fits `CATALOG_GUIDANCE_TOKEN_BUDGET`, so the catalog fits a prompt. `renderCatalogGuidance` renders it for non-A2UI adapters (the docs site's `llms.txt`), `renderCatalogInstructions` the design rules, and `describeCatalogEntry` one entry. A2UI renames entries and props and supplies its own guidance, so A2UI agents get only `toCatalogJson()`.

### Registries

`@cognitap/radiant/a2ui` renders A2UI 1.0. Each `createA2uiRegistryEntry` pairs a Radiant component with a JSON schema (forbidden host props rejected), an adapter, and accessibility rules. `radiantA2uiRegistry` implements the basic catalog at `A2UI_BASIC_CATALOG_REVISION`; `radiantA2uiExtensionRegistry`, the default, adds form, feedback, data, and layout components, and a `Row` with `wrap`. `createA2uiRegistry({ extends })` inherits a base registry; `findA2uiRegistry` finds one by catalog ID. `pnpm catalog:check` keeps the generated `catalog.json` and `extension-catalog.json` in sync.

Apps add components: `createA2uiExtensionEntry` derives schema and guidance from an `extendCatalog` entry, and `createA2uiExtensionRegistry(catalog, { catalogId, entries })` extends the default registry. Adapters use `readA2uiValue`, `writeA2uiBinding`, `runA2uiAction`, and `isA2uiChildNode`, and style only with [public tokens](theming.md#public-tokens) so they follow every theme.

### Surface

`A2uiSurface` treats messages as untrusted and never throws on them, unlike the React core. At render it coerces invalid, forbidden, or mixed controlled/uncontrolled props (servers can run `coerceA2uiMessages` first), degrades unknown components to text, and isolates failing nodes in error boundaries, reporting each to `onDiagnostic` (errors carry a `code`). Controls bind to surface state; named actions reach `onAction` as `{ action, surfaceId, nodeId, state }`, and the app decides their effect. It never runs `openUrl`; the host navigates.

The host's `ThemeScope` owns appearance, so the surface strips agent theme hints: a model cannot restyle the app or its contrast. `headingLevel`, `prose`, and `labels` fit the surface into the host page.

Components stream in any order: missing ones become `aria-hidden` Skeletons with the surface `aria-busy`; a refused message clears both until the next accepted one. Updates sent before `createSurface` wait. Identical replays and appended patches keep the engine and surviving controls (state, focus, scroll, drags); edits to applied history rebuild it. In an active document, focus lost in a patch returns to its moved control, the nearest tabbable control, or the surface root (`tabIndex={-1}`), never `document.body`. Deleted or failed surfaces render nothing.

`A2uiMediaProvider` supplies `icons` (`/a2ui/lucide` maps `lucide-react`) and `urlPolicy`. Unmapped icons report `UNKNOWN_ICON`; media URLs outside http(s), blob, or data, or rejected by `urlPolicy`, report `UNSAFE_URL` and never load. Also set CSP `img-src` and `media-src`.

### Accessibility check

`validateA2uiAccessibility` checks accessibility rules, not schemas. It needs no DOM, so servers reject or fix a surface before storing it. [Accessibility](accessibility.md#a2ui-surfaces) owns the rules.

When a contract changes, update the component's stories and the compile checks in [tests/package](../tests/package).
