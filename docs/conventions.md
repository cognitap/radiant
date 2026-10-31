# Component conventions

Every family follows these rules. A new family meets them when it ships; an
existing family meets them when it is next tidied. The shared contract they
build on is in [architecture](architecture.md).

## State

- Controlled state is `x`, `defaultX` and `onXChange(x)`. The callback gets the
  new value only, never an event or details object, and its parameter is named
  after the prop.
- Boolean state uses `open`, `checked` or `pressed` with the matching
  `onOpenChange`, `onCheckedChange` or `onPressedChange`. Native hosts keep the
  native `onChange`.
- Declare owner props with the shared types in `src/react/useNativeOwner.ts`.
  Do not write the controlled and default union inline.
- Choose one or many with `type: 'single' | 'multiple'`, defaulting to single.
  Many is `string[]`; an empty single value is `null`.

## Forms

- `name`, `form`, `required`, `disabled` and `aria-invalid` go on the root,
  which forwards them to the focus host.
- `readOnly` exists only where it is enforced at runtime.
- `error` is always a validation message. Other status text ends in `Text`:
  `loadingText`, `emptyText`, `errorText`.
- Option groups build on Field and take `label`. `legend` belongs to Fieldset
  alone. A family takes `items` when it must know every option up front, to
  filter, select all or render a popup list; otherwise options are children.

## Presentation

- Treatment is `variant`, color is `tone` and size is `controlSize`, defaulting
  to `medium`. Actions default to the `accent` tone and feedback to `neutral`.
- Orientation and side props share one exported type each.
- Every `parts` entry is a `PartStyle`. Recurring roles keep one key: `wrapper`,
  `label`, `description`, `error`, `indicator`, `remove`.

## Composition

- Parts are separate named exports. There is no `as` or `asChild`.
- Button and anchor hosts take `render(props)`. A family whose parts take
  `render` exports a `<Family>RenderProps` type.
- A trigger that opens something, and the actions inside it, do not accept
  `pressed`. A tooltip trigger opens nothing, so it keeps it.

## State attributes

- Disclosure uses `data-state="open"` or `"closed"`.
  Other `data-state` values describe a task's status, such as Progress's
  `indeterminate`, `loading` and `complete`.
- Selection uses a boolean `data-selected`, like `data-disabled`,
  `data-invalid` and `data-highlighted`. ARIA keeps its own attribute
  (`aria-selected`, `aria-pressed`, `aria-checked`).

## Names

- A host that needs an accessible name uses the `AccessibleName` type and
  `requireAccessibleName`.
  A native labelable host (input, progress, meter) is named by a `<label>` or
  Field instead, so it documents the requirement without that type.
- A visible name is `label: ReactNode`. A name for an element Radiant renders
  inside the component is a string ending in `Label`, such as `removeLabel`.
  Native names keep their meaning, such as Avatar's `alt`.
  Announcement text that replaces an element's content, rather than naming
  it, is `altText`, such as ToastAction's.

## Stories

Stories open with `Default`, then one story per task a reader would search for.
Form controls add `WithField`, `controlSize` families add `SharedControlSizes`,
and controlled examples are named `Controlled`. Every documented prop and state
is reachable from a story.

## Docs page

Each component page uses these headings in order, leaving one out only when the
component has nothing for it: Usage, Examples, State, Accessibility, Motion,
Styling, API. The docs site checks this.

## Changes

A change to public API gets one CHANGELOG line. Renames and removals are
breaking: give a before and after.
