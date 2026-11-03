# Component conventions

Every component family follows these conventions. See [architecture](architecture.md) for the runtime contract.

## State

- Controlled and uncontrolled state use `x`, `defaultX`, and `onXChange(x)`. The callback receives the next value only, never a DOM event or details object.
- Boolean state uses `open` / `onOpenChange`, `checked` / `onCheckedChange`, or `pressed` / `onPressedChange`. Native input hosts (`Input`, `Textarea`, `NativeSelect`, `Checkbox`, `Switch`, `Radio`, `Slider`) keep native `onChange`.
- Declare state props with `ControlledOrUncontrolled` from `src/react/useNativeOwner.ts` rather than writing union types inline.
- Single vs. multiple selection uses `type: 'single' | 'multiple'` (default `'single'`). Multiple values are `string[]`; an empty single value is `null`.

## Forms

- `name`, `form`, `required`, `disabled`, and `aria-invalid` go on the family root, which forwards them to the focus or form host.
- Expose `readOnly` only on families that enforce it at runtime.
- `error` is a validation message. Status messages end in `Text` (`loadingText`, `emptyText`, `errorText`).
- Option groups build on `Field` and take `label`; `legend` belongs to `Fieldset` alone. Take an `items` prop only when the component needs all options up front (to filter, select all, or render a hidden native `<select>`); otherwise take children.

## Presentation and composition

- Visual treatment is `variant`, color palette is `tone`, and size is `controlSize` (`'small' | 'medium' | 'large'`, default `'medium'`). Actions default to `tone="accent"`; feedback components default to `tone="neutral"`. Menu items take `tone` (`'neutral' | 'warning' | 'danger'`) without `variant`.
- Every `parts` entry uses `PartStyle` (`{ className?: string; style?: ThemeStyle }`). Standard keys are `wrapper`, `label`, `description`, `error`, `indicator`, `options`, and `remove`.
- Sub-parts are separate named exports; there is no `as` or `asChild`.
- Button and anchor hosts accept `render(props)` and export a `<Family>RenderProps` type.
- Triggers that open a popup (`DialogTrigger`, `PopoverTrigger`, `MenuTrigger`, `SelectTrigger`) and action buttons inside dialogs do not take `pressed`. `TooltipTrigger` does not open an interactive popup, so it keeps `pressed`.

## State attributes

- Disclosures and overlays set `data-state="open"` or `"closed"`. Task-status components set domain states (such as `Progress`'s `indeterminate`, `loading`, and `complete`).
- Boolean state attributes (`data-selected`, `data-disabled`, `data-invalid`, `data-required`, `data-highlighted`) are `""` when true and omitted when false. ARIA attributes (`aria-selected`, `aria-pressed`, `aria-checked`, `aria-current`) keep their standard `"true"` / `"false"` values.

## Accessible names

- Hosts without visible text require an explicit accessible name via `AccessibleName` and `requireAccessibleName`, with no English fallback string. Native labelable elements (`input`, `textarea`, `select`, `progress`, `meter`) can be named by an associated `<label>` or `Field`.
- Visible labels use `label: ReactNode`. Labels for internal controls end in `Label` (such as `Tag`'s `removeLabel` or `Pagination`'s `nextLabel`). Native attributes keep their HTML names (`Avatar`'s `alt`). Screen-reader replacement text for an action uses `altText` (`ToastAction`).

## Stories and docs

- Stories start with `Default`, followed by task-focused stories (`WithField` for form controls, `SharedControlSizes` for sized controls, `Controlled` for controlled state). Every documented prop and state is exercised by a story.
- Component docs pages in `cognitap/radiant-docs` use these headings in order, omitting sections that do not apply: `Usage`, `Examples`, `State`, `Accessibility`, `Motion`, `Styling`, `API`.
- Public API changes get one line under `## Unreleased` in `CHANGELOG.md`. Breaking changes show before and after.
