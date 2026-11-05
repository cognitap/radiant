# Architecture

Radiant builds React components on native HTML. The browser handles behavior such as button activation, radio grouping, and modal focus. Radiant adds composition, state, and styling. The application supplies content and business logic.

See the [component guides](https://github.com/cognitap/radiant-docs) for individual APIs, and [theming](theming.md), [motion](motion.md), and [accessibility](accessibility.md) for cross-family details.

## Package entries

`@cognitap/radiant` is the main entry. Import charts from `@cognitap/radiant/charts` and theme presets from `@cognitap/radiant/examples`. The full list of supported import paths, including CSS and motion, lives in [package.json](../package.json).

## Import and rendering rules

- `src/internal/` holds framework-free logic such as selection rules and event guards. `src/react/` wraps it in hooks and imports only React and internal modules. Component families can build on each other as long as the dependency graph stays acyclic.
- Keep browser APIs out of module initialization. In effects, use the host's `ownerDocument` and `defaultView` for iframe support and clean up on unmount.
- Match server markup to the first client render. `Dialog` opens in an effect, and `Collapsible` reconciles `<details open>` on mount. Use `"use client"` for modules that need React state, context, refs, or effects. Static components can share action styles through `src/components/shared/actionStyles.ts`.

[Architecture tests](../tests/architecture.test.mjs) cover import boundaries and server rendering.

## Composition

Use `Button` for actions and `Link` for navigation. Reuse the family that owns the behavior.

| Base family   | What it owns                   | Built on it                                   |
| ------------- | ------------------------------ | --------------------------------------------- |
| `Field`       | Label, help, and error wiring  | `RadioGroup`, `CheckboxGroup`, `Fieldset`     |
| `Dialog`      | Modal behavior and open state  | `AlertDialog`, `Drawer`, `Command`            |
| `Collapsible` | One native `<details>` element | `Accordion`, `NavLinkGroup`                   |
| `Popover`     | A positioned surface           | `HoverCard`, `Menu`, `ContextMenu`, `Menubar` |

Custom popups use `popover="manual"` to enter the top layer while staying in their theme and modal subtree.

## Hosts, parts, and styling

- Root `className`, `style`, native props, and `ref` go to the documented host. State-only roots such as `Dialog` leave the DOM to named parts such as `Trigger` and `Content`. Custom selects and comboboxes also render their native form controls.
- Use `parts` to style inner elements such as the label or indicator. Caller classes merge after defaults and caller styles take precedence. Radiant owns IDs, ARIA, events, refs, and state attributes.
- Composed hosts keep all their slot names, such as `data-slot="button dialog-trigger"`. Use `[data-slot~="button"]` to match a single slot.
- Style state with native selectors (`:disabled`, `:checked`, `[open]`), `aria-busy` for pending, and documented `data-state` values. Boolean attributes such as `data-selected` are present when true.
- Actions use `variant` for appearance, `tone` for intent, and `controlSize` for scale. Controls share `controlSize` and preserve native prop meanings, such as `Input.size` for character width. Set radius through the theme.

## State and events

Choose one owner for each state value for the life of a mount. Pass `x` to control it or `defaultX` to set its initial value. Passing both or switching ownership throws. Use a new `key` to remount.

`onXChange(next)` receives only the next value. For uncontrolled state Radiant applies the change, then calls the handler. For controlled state the handler requests a change from the application. If the application declines a controlled disclosure toggle, Radiant restores `<details open>`. No-op requests, prop syncs, and nested toggle or close events skip the callback.

For click and keydown actions, `composeAction` runs disabled and pending guards before the caller's handler. Calling `preventDefault()` there cancels the library action. Native `change`, `toggle`, and `blur` report behavior that has already happened.

## Forms

`Field` supplies label and description IDs and passes `disabled` and `required` down. Radiant controls read its context. Plain HTML controls get the same wiring through `children(controlProps)`.

Custom controls submit through native form elements.

| Component                  | Submitted value                                      |
| -------------------------- | ---------------------------------------------------- |
| `Select`                   | The selected value from a visually hidden `<select>` |
| `Combobox`                 | The committed key from a hidden input                |
| `Autocomplete`             | The input text, including values outside the list    |
| `MultiSelect`, `TagsInput` | One named value per item                             |
| `NumberField`              | A raw number, separate from the localized text       |
| `OTPField`                 | The whole code from a single input                   |

`Form` coordinates native validation and async submission. The application owns field values, validation rules, error messages, and persistence. Reset restores uncontrolled form controls, clears form errors, and aborts pending submissions. Widget state such as the active tab or open dialog is independent of form reset.

## What customization must keep

Use `render(props)` on button and link parts to render a compatible `<button>` or `<a>`. Forward all resolved props, the ref, and the children.

- Keep controls operable with connected labels and descriptions, and make focus, invalid, disabled, and pending states visible.
- Hide closed dialog and disclosure content, contain focus in modal dialogs, and keep `<summary>` a direct child of `<details>`.
- Mark decorative indicators with `aria-hidden` and support reduced motion and forced colors.

Update the component's Storybook stories when a contract changes. Compile-only package checks live in [tests/package](../tests/package).
