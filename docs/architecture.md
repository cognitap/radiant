# Architecture

Radiant wraps native HTML in React components. The browser provides behavior: button activation, radio grouping, modal focus. Radiant adds composition, state, and styling. Applications provide content and logic.

Component APIs live in the [component guides](https://github.com/cognitap/radiant-docs). Cross-family topics live in [theming](theming.md), [motion](motion.md), and [accessibility](accessibility.md).

## Package entries

- `@cognitap/radiant`: components
- `@cognitap/radiant/charts`: charts
- `@cognitap/radiant/examples`: theme presets

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

## Customization limits

`render(props)` on button and link parts must return a `<button>` or `<a>`, or a component that forwards to one, with all props, the ref, and the children.

Custom styling and rendering must keep:

- Connected labels and descriptions, and visible focus, invalid, disabled, and pending states.
- Closed dialog and disclosure content hidden, focus contained in modal dialogs, and `<summary>` as a direct child of `<details>`.
- `aria-hidden` on decorative indicators, and support for reduced motion and forced colors.

When a contract changes, update the component's stories and the compile checks in [tests/package](../tests/package).
