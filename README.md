# Radiant

React interaction components and presentation primitives, published as
[`@cognitap/radiant`](https://www.npmjs.com/package/@cognitap/radiant) under the
[MIT license](LICENSE). Radiant is experimental during 0.x. The current source
combines ten families through shared themes, native controls and composed actions
and surfaces.

Start with the [architecture doc](docs/architecture.md) for composition, hosts,
state ownership and canonical form/Dialog/Card examples. This
README is the detailed component reference. It describes the current source;
changes under [Unreleased](CHANGELOG.md#unreleased) need a release before npm
consumers can use them. Check your installed version's release notes.

## Usage

```sh
pnpm add --save-exact @cognitap/radiant
```

Import the stylesheet once in your application. It needs no Tailwind and only
styles Radiant components:

```tsx
import '@cognitap/radiant/styles.css'
import { Field, Input } from '@cognitap/radiant'

;<Field label="Email">
  <Input
    name="email"
    type="email"
    autoComplete="email"
  />
</Field>
```

All components share a neutral light/dark baseline: control dimensions,
typography, surfaces, focus, and motion. Follow the
[theming reference](docs/theming.md) to choose or author a
theme, or the [canonical recipes](docs/architecture.md#examples-and-type-fixtures)
to compose controls into a form, Card or Dialog.

For a global reset (Tailwind Preflight), also import `@cognitap/radiant/reset.css`
before `styles.css`. React 19.3+ is a peer dependency.

## Component reference

### Button

`Button` takes native button props, including `ref`, `aria-*` and form attributes,
and defaults to `type="button"`. Give every button an accessible name through its
text, `aria-label`, or `aria-labelledby`. The type does not reject a nameless
button. Use a link for navigation.

```tsx
import { Button } from '@cognitap/radiant'

<Button variant="solid" tone="danger" controlSize="small">Delete</Button>
<Button variant="outline" tone="neutral" className="rounded-full">Next</Button>
<Button iconOnly aria-label="Close"><CloseIcon /></Button>
```

| Prop          | Values                                                 | Default  |
| ------------- | ------------------------------------------------------ | -------- |
| `variant`     | `solid`, `soft`, `outline`, `ghost`                    | `solid`  |
| `tone`        | `accent`, `neutral`, `warning`, `danger`               | `accent` |
| `controlSize` | `small`, `medium`, `large`                             | `medium` |
| `iconOnly`    | Squares the button at its size. Pass `aria-label`.     | `false`  |
| `fullWidth`   | Fills the container width.                             | `false`  |
| `pending`     | Shows a spinner over the label and ignores activation. | `false`  |
| `render`      | Forward resolved props to one custom button host.      | —        |

The style prop is `variant`, because `type` stays the native attribute. An omitted
`type` is `button` even when `formAction` is set. Pass `type="submit"` to submit.
While `pending` is set, the label stays in place, a spinner covers it, and
activation does not run. It does not set `disabled`, so focus stays. Reduced
motion keeps the label and hides the spinner. Child SVGs are sized to the button.

Button owns host replacement through `render(resolvedNativeProps)`. The public
`ButtonRenderProps` type includes merged classes, caller styles, the real button
ref, guarded activation, computed presentation attributes and resolved children
(label and pending indicator). Forward these to one native/custom button:

```tsx
<Button
  variant="outline"
  render={props => <button {...props}>{props.children}</button>}
>
  Save draft
</Button>
```

Return one compatible element. Null, text, arrays, fragments and direct native
hosts other than buttons fail clearly. Custom components must forward every
resolved prop/ref/child to their button. Preserve resolved children and handlers
so pending presentation and activation guards survive. Set presentation on the
owning Button; resolved props already contain its styling and children.
Dialog actions inherit this same Button interface and compose Button in both
the default and replacement paths.

### Link

`Link` is for navigation: a real anchor with `href`, `target`, `download`, and
native click semantics untouched, so modified clicks and keyboard activation
behave normally. Use inline decoration for running text, subtle decoration that
underlines on hover, or the same solid/soft/outline/ghost treatments as Button. Tone always
selects a palette; controlSize selects dimensions for action-shaped links.
Inline and subtle links inherit the surrounding text size.

```tsx
import { Link } from '@cognitap/radiant'

<p>Read the <Link href="/guide">guide</Link> first.</p>
<Link href="/settings" variant="subtle">Settings</Link>
<Link href="/deletion" variant="solid" tone="danger" controlSize="small">Review deletion</Link>
<Link href="https://example.com" external>Example</Link>
```

| Prop          | Values                                                             | Default  |
| ------------- | ------------------------------------------------------------------ | -------- |
| `variant`     | `inline`, `subtle`, `solid`, `soft`, `outline`, `ghost`            | `inline` |
| `tone`        | `accent`, `neutral`, `warning`, `danger`                           | `accent` |
| `controlSize` | `small`, `medium`, `large` (action dimensions)                     | `medium` |
| `external`    | Adds `target="_blank"` and `rel="noopener noreferrer"` when unset. | `false`  |
| `render`      | Replace the anchor element; see below.                             | —        |

Links paint from `--rad-link-color` and `--rad-link-hover-color` (falling back to
readable ink derived from the selected tone and shared foreground) and from the
shared focus variables, so a theme styles links and buttons together. `defineTheme({ components: { link: { ... } } })` sets typed Link overrides:
`color`, `hoverColor`, `underlineOffset`, `decorationThickness`,
`decorationThicknessHover`, `colorDuration`, and `focusColor`, `focusWidth`,
`focusOffset`, `focusStyle`.

Routers stay outside the core. Pass `render` to hand the anchor props —
`href`, `className`, `children`, and every native attribute — to your router's
own link component:

```tsx
<Link
  href="/docs"
  render={props => <RouterLink {...props} />}
/>
```

The adapter must forward `href`, `className`, and `children`, and keep native
anchor semantics. When `render` is absent, `Link` renders a plain `<a>`.
Adapt router-specific destination props inside your adapter, and forward native
attributes and the ref to its final anchor.

`LinkRenderProps` includes the native anchor `ref` (object or callback, including
React's cleanup return), handlers, style, accessibility attributes and resolved
presentation. Forward that ref to the same anchor; Link adds no ref wrapper or
activation handler. Caller classes merge after defaults and caller style wins.
Identity and presentation attributes are protected: `data-slot="link"`,
`data-variant`, `data-tone` and `data-control-size` reflect the actual props.

A router adapter calls the supplied `onClick` once before its own navigation,
and honours `event.defaultPrevented`. It only intercepts the navigation its
router owns: modified/middle clicks, a different target, downloads and external
URLs must retain browser behaviour. Native click/Enter navigates; Space keeps
anchor behaviour. Links never acquire Button's disabled, pending or form-submit
semantics. `external` supplies `_blank` and `noopener noreferrer` only when the
corresponding attributes are omitted; explicit `target` and `rel` win.

**Breaking replacement contract:** `render` must return one anchor element or
one router component that forwards all resolved props/ref to an anchor. Null,
text, arrays, fragments and other direct native hosts now throw a descriptive
error; the return type is `ReactElement`. Link cannot inspect a router
component's implementation, so preserving the anchor remains the adapter's
responsibility. Migrate a fragment/wrapper by returning the router element
directly and placing surrounding layout outside Link.

### Action API migration (breaking)

Button, Link, DialogTrigger and DialogClose share `variant`, `tone` and
`controlSize`. `soft` is a quiet filled treatment in any tone. Unfilled and soft
actions mix tone colour toward the shared foreground to retain readable ink in
light and dark; solid uses the selected palette's foreground pair. Neutral
soft, outline and ghost preserve the previous neutral treatments. Theme action
effects, including Glass and Sharp 3D, apply to both Button and action-shaped Link.

| Previous API                                    | Replacement                                                                             |
| ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| Button `variant="primary"`                      | `variant="solid" tone="accent"` (the defaults)                                          |
| Button `variant="secondary"`                    | `variant="soft" tone="neutral"`                                                         |
| Button `variant="warning"` / `"destructive"`    | `variant="solid" tone="warning"` / `"danger"`                                           |
| Button `variant="outline"` / `"ghost"`          | Same variant, add `tone="neutral"` to retain the previous palette                       |
| Link `variant="button" tone={oldButtonVariant}` | Use the matching variant/tone pair above directly                                       |
| `size="small" / "default" / "large"`            | `controlSize="small" / "medium" / "large"`                                              |
| `radius="full"`                                 | `className="rounded-full"`, or a local `ThemeStyle`/`components.button.radius` override |
| `ButtonSize` / `ButtonRadius` types             | `ControlSize`; radius is a CSS/theme decision                                           |
| `[data-size]`                                   | `[data-control-size]`; presentation also exposes `data-variant` and `data-tone`         |

The exported `ButtonVariant` and `LinkVariant` types use the new treatments;
`Tone` and `ControlSize` are shared public types. The old props/values/types are
removed during the experimental 0.x series. Native Input's numeric `size`,
Button form attributes, accessible names and pending behaviour remain available.
Link remains an anchor with native navigation. Button owns `render` for custom
button hosts; Dialog actions inherit it and receive fully resolved Button
presentation, including pending markup.

### Field

`Field` is the form anatomy: it connects a label, an optional description, and
an optional error to one control, or captions a group. It does not validate and
it does not read form state. The consumer owns the error. Pass the message when
the value is invalid and clear it when the value recovers. An empty message
removes the invalid state.

```tsx
import { Field, Input } from '@cognitap/radiant'

;<Field
  label="Email"
  description="Work address"
  error={error}
  required
>
  <Input
    name="email"
    type="email"
    autoComplete="email"
  />
</Field>
```

Radiant controls read `useField()` and connect themselves. For a native or
custom control, explicitly forward `children(controlProps)` to its input,
textarea or select. Field leaves ordinary children untouched. The callback
supplies the owned `id`, `required`, `disabled`, `aria-invalid`, `aria-required`
and `aria-describedby` relationships:

```tsx
<Field
  label="Email"
  error={error}
>
  {control => (
    <input
      {...control}
      name="email"
    />
  )}
</Field>
```

`useField()` returns `null` outside a Field. Inside a group, `controlProps` is
`null`: the group element owns the description, and each control keeps its own
label.

| Prop                | Role                                                                          | Default   |
| ------------------- | ----------------------------------------------------------------------------- | --------- |
| `label`             | Accessible name. A `<label>` for one control, a `<legend>` for a group.       | —         |
| `description`       | Help text, included in `aria-describedby` while present.                      | —         |
| `error`             | Error message. Presence marks the field invalid and announces it as an alert. | —         |
| `layout`            | `control` or `group` (`<fieldset>`).                                          | `control` |
| `controlId`         | Owned control ID in control layout; omit to generate a stable ID.             | generated |
| `parts`             | `className`/`style` hooks for `label`, `description`, `error` and `required`. | —         |
| `required`          | Sets the control's `required` and `aria-required`. The marker is visual.      | `false`   |
| `disabled`          | Disables the control, or the whole `<fieldset>` for a group.                  | `false`   |
| `requiredIndicator` | Replaceable visual marker, hidden from assistive tech. `null` hides it.       | `*`       |

Group anatomy is a `<fieldset>` and `<legend>`, so a disabled group disables
its descendants natively. A radio group uses `RadioGroup`, which is this
fieldset of native radios, and does not add `role="radiogroup"`. Required and
invalid on a group are relationships on the fieldset, not on each control.

Set a custom control ID through `Field controlId`, rather than overriding its
child's ID. Otherwise IDs come from `useId()`, so server markup and hydration
agree. Radiant controls append external `aria-describedby` IDs to the owned
description/error IDs. Native adapters must preserve the callback's relationships
when adding their own descriptions. The label, description, error and required
marker are all consumer content.

Control layout accepts native div props and a div ref. Group layout accepts
native fieldset props, including `form`, `name`, and a fieldset ref; its children
are ordinary nodes. `className` and `style` target that root. Use
`parts={{ description: { style: { fontStyle: 'italic' } } }}` to style a text
part. These hooks accept only styling: Field keeps each part's ID, label
association, alert role and hidden required marker.

`components.field` in `defineTheme` maps typed keys to `--rad-field-*` variables: `gap`, `labelColor`,
`labelSize`, `labelWeight`, `descriptionColor`, `descriptionSize`, `errorColor`,
`errorSize`, `requiredColor`, and `disabledOpacity`. The root sets
`data-slot="field"`, `data-layout`, `data-invalid`, `data-disabled`, and
`data-required`. Parts set `data-slot` to `field-label`, `field-description`,
`field-error`, and `field-required`. Style a control from the field, for
example `[data-slot~="field"][data-invalid] input`.

A native `<form>` leaves the control uncontrolled: give it a `name`, and on
submit pass the message back through `error`. Text controls follow the value
contract documented on Input.

### Form styling targets

`className`, `style`, native props and `ref` reach the same host. Convenience
labels do not redirect input props to a wrapper. Use `parts` for the named
internal elements; each hook accepts only `className` and `style`.

| Component / part                 | Host / identity tokens                                                                      | Styling hook                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Field control / group root       | `div` / `fieldset`: `field`                                                                 | Root `className` / `style`                             |
| RadioGroup root                  | Field's `fieldset`: `field radio-group`                                                     | Root `className` / `style`                             |
| Field / RadioGroup label         | `label` / `legend`: `field-label`                                                           | `parts.label`                                          |
| Help / error / required marker   | `field-description` / `field-error` / `field-required`                                      | `parts.description` / `parts.error` / `parts.required` |
| RadioGroup options               | `div`: `radio-group-options`                                                                | `parts.options`                                        |
| Input / Checkbox / Radio control | Native `input`: `input` / `checkbox` / `radio`                                              | Root `className` / `style`                             |
| Checkbox / Radio wrapper         | Outer `label` when labelled, otherwise control `span`: `checkbox-wrapper` / `radio-wrapper` | `parts.wrapper`                                        |
| Checkbox / Radio label text      | `span`: `checkbox-label` / `radio-label` (only when labelled)                               | `parts.label`                                          |
| Checkbox / Radio indicator       | Check/mixed SVGs: `checkbox-indicator`; dot `span`: `radio-indicator`                       | `parts.indicator`                                      |

Identities are whitespace-separated tokens. Select parts with
`[data-slot~="radio-group"]` and `[data-slot~="radio-group-options"]`. This
replaces the old `[data-slot="radio-group"]` options selector. Composed roots
retain their base identity, including when extra tokens are supplied.

Part hooks leave owned IDs, label associations, ARIA, events and refs intact.
Checkbox's indicator hook styles both its check and mixed-state glyphs; the
control's state still determines which is visible. Local styles on a control or
part affect that subtree. The Customisation stories show neighbouring controls
without those overrides.

### Form recipes

Storybook's **Recipes → Forms → Native / TanStack** shows the same profile
form with two value owners. The **placement** control reuses either form
standalone, inside Card, or inside Dialog. Both inherit the toolbar's theme and
mode. The [live source](.storybook/examples/ProfileForm.tsx) shares field anatomy,
validation rules and Button actions; each adapter makes ownership explicit.

| Responsibility | Native recipe                                                         | TanStack recipe                                                                        |
| -------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Values         | `defaultValue` / `defaultChecked`; read `FormData` on submit          | Controlled `value` / `checked`; forward native changes to `handleChange`               |
| Blur           | The recipe marks email touched and validates                          | `handleBlur`; group blur ignores focus moves between its options                       |
| Validation     | The recipe validates on blur, change once touched, and submit         | Validators run on change/blur/submit; format errors and reveal them once touched       |
| Reset          | Browser restores defaults; the recipe clears its error/touched state  | Prevent the native reset and call `form.reset()` to reset values and metadata together |
| Submission     | Read named native inputs; unchecked and disabled controls are omitted | `handleSubmit()` delivers the library's values after validation                        |

Both use `noValidate` so the recipe can show the agreed errors through Field,
while inputs retain their native types, required/disabled state and form data.
Checkbox maps its boolean through `checked`; its `value="yes"` remains submitted
data. RadioGroup writes through one selection callback. Card and Dialog reuse
the form without nested forms or per-surface styling overrides. Saving a valid
Dialog form closes it and restores trigger focus; reset leaves the Dialog open.

TanStack is an optional development/example dependency. Neither the recipes nor
the integration are exported by the library. The ownership decisions are in
[the architecture doc](docs/architecture.md#state-and-forms).

### Input

`Input` is a native `<input>` with the text-field metrics. It keeps every
native attribute, including `name`, `type`, `autoComplete`, `placeholder`,
`size` (the character width), `defaultValue`, `value`, `onChange`, `onBlur`,
and `ref`. Inside a single-control Field it takes the field id, required,
disabled, and description relationships. Inside a group it keeps its own
identity, because the fieldset owns the description.

```tsx
import { Field, Input } from '@cognitap/radiant'

;<Field
  label="Email"
  description="Work address"
  error={error}
  required
>
  <Input
    name="email"
    type="email"
    autoComplete="email"
    defaultValue="ada@example.com"
  />
</Field>
```

| Mode         | How the value moves                                                                    | Reset                                                                                             |
| ------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Uncontrolled | Omit `value`. `defaultValue` is the initial value. Read it from `FormData` or the ref. | `form.reset()` restores `defaultValue`.                                                           |
| Controlled   | Pass `value` and update it from `onChange`.                                            | The browser reset does not change React state. Reset the state, or call the form library's reset. |

`onChange` and `onBlur` are the native events. Radiant does not store the value
and does not validate on blur. The native `size` attribute stays the character
width. `controlSize="small" | "medium" | "large"` selects shared height,
padding and font metrics, independently of native `size`. The default is
`medium`; explicit `--rad-input-height`, padding and font overrides still win.
Choose `value` or `defaultValue` for text inputs, and keep that owner for the
mounted lifetime. Mixed owners or changing modes throw; use a new key to
remount. Controlled text uses `''` for empty, never `null`. File, checkbox and
radio Input types retain their native type-specific value behavior.

Field's owned control ID, required state and active error cannot be erased by
conflicting child props. Descriptions append external IDs once. Disabled Field
owners propagate through nested Fields; a child `disabled={false}` cannot
re-enable them. Native fieldsets retain the platform's first-legend exception
for arbitrary native content.

`components.input` in `defineTheme` accepts `height`, `padding`, `fontFamily`, `fontSize`, `fontWeight`,
`color`, `background`, `borderWidth`, `borderStyle`, `borderColor`, `radius`,
`cornerShape`, `shadow`, `placeholder`, `invalidBorder`, `disabledBackground`,
`focusColor`, `focusWidth`, `focusOffset`, and `focusStyle`. An invalid field
uses the destructive border. The element sets `data-slot="input"`.

The [form recipes](#form-recipes) show controlled Input, Checkbox and RadioGroup
with optional TanStack state, validation and reset ownership.

Checkbox, radio, and file inputs are separate families. `type` still accepts
any native value. Use `RadioGroup` for a mutually exclusive choice.

### Checkbox

`Checkbox` is a native checkbox. `type` is always `checkbox`. The visible box
is drawn on that input, so keyboard activation, form submission, reset, and
label clicks stay the platform's.

```tsx
import { Checkbox, Field } from '@cognitap/radiant'

;<Checkbox label="Email" name="channels" value="email" defaultChecked />

<Field label="Notifications" layout="group" description="Choose any">
  <Checkbox label="Email" name="channels" value="email" />
  <Checkbox label="SMS" name="channels" value="sms" />
</Field>
```

| Mode         | How the check moves                                    | Reset                                        |
| ------------ | ------------------------------------------------------ | -------------------------------------------- |
| Uncontrolled | Omit `checked`. `defaultChecked` is the initial check. | `form.reset()` restores `defaultChecked`.    |
| Controlled   | Pass `checked` and update it from `onChange`.          | A browser reset does not change React state. |

`indeterminate` is the mixed state. It is a visual mark for a partial
selection, applied to the DOM property after mount. It is not a third submitted
value and not an HTML attribute. The form submits `checked`. A checked box
submits its `value`, or `on` when `value` is omitted. An unchecked box submits
nothing.

Checkbox and standalone Radio choose `checked` or `defaultChecked`, with one
owner per mount. Mixed owners or switching modes throw. Native default/reset
behavior stays with React and the browser. A controlled checkbox or radio
preserves its current check during browser reset, including after a change.
The consumer recomputes `indeterminate` after reset when it derives from other
selections.

`controlSize` uses the same small/medium/large vocabulary and defaults to
medium. It selects the shared indicator and label font metrics. Explicit
Checkbox/Radio size and label overrides still win; decorative marks follow
the actual input dimensions.

`label` wraps the input, so the text toggles it. Inside a single-control Field
the field id wins, and that label is the accessible name. Inside a group, each
checkbox keeps the `label` beside it and the fieldset keeps the caption. Pass
one name for the option, not both.
An ordinary Field group leaves each checkbox's native requirement independent:
a group marker does not require every box. The consumer validates rules such
as “choose at least one”. RadioGroup uses native radio validity for its one
required choice.

`className` merges onto the input. Replacing `appearance-none` puts the native
glyph back; the input stays in the tab order and in the form. The check and
dash are decorative and do not receive clicks.

`components.checkbox` in `defineTheme` accepts `size`, `radius`, `cornerShape`, `borderWidth`,
`borderStyle`, `borderColor`, `background`, `checkedBackground`,
`checkedBorder`, `mark`, `invalidBorder`, `gap`, `labelColor`, `labelSize`,
`disabledBorder`, `disabledBackground`, `focusColor`, `focusWidth`,
`focusOffset`, and `focusStyle`. The input sets `data-slot="checkbox"`.

### RadioGroup

`RadioGroup` is a Field group: a `<fieldset>` and `<legend>` of native radios.
The group owns `name`. Each `Radio` owns its `value` and `label`. The visible
disk is drawn on the input, so arrow keys, focus entry, focus exit, form
submission, reset, and label clicks stay the platform's. Tab lands on the
selected radio, or the first enabled radio when none is selected, and the next
Tab leaves the group. Arrow keys move among enabled radios that share the name
and skip a disabled choice. The group does not set `role="radiogroup"`, and
it does not put `aria-invalid` or `aria-required` on the radios. The fieldset
owns its description and invalid state; `aria-required` is not supported on a
fieldset. A required group sets each radio's native `required`
attribute, and an invalid group paints the disks from the field's invalid
state.

```tsx
import { Radio, RadioGroup } from '@cognitap/radiant'

;<RadioGroup
  label="Plan"
  name="plan"
  defaultValue="pro"
  description="Billed monthly"
>
  <Radio
    label="Free"
    value="free"
  />
  <Radio
    label="Pro"
    value="pro"
  />
  <Radio
    label="Retired"
    value="retired"
    disabled
  />
  <Radio
    label="Team"
    value="team"
  />
</RadioGroup>
```

| Mode         | How the selection moves                                             | Reset                                           |
| ------------ | ------------------------------------------------------------------- | ----------------------------------------------- |
| Uncontrolled | Omit `value`. The initial `defaultValue` checks its matching radio. | `form.reset()` restores that initial selection. |
| Controlled   | Pass `value` and update it from `onValueChange` or `onChange`.      | A browser reset does not change React state.    |

The checked radio submits `name=value`. When none is checked, the group submits
nothing. `onChange` is the selected radio's change event, and `onValueChange`
receives its value. React does not deliver a radio change through the
fieldset, so the group listens on each radio. Inside the group, the group name
and selection win, so a `checked` or `name` on `Radio` does not split the
group. Conflicting option names or supplied `checked`/`defaultChecked` throw;
put selection ownership on RadioGroup. Outside a group, `Radio` is an ordinary radio: pass `name` and
`defaultChecked` or `checked`.

Use `value={null}` to clear a controlled group. `value=""` selects a real
option whose value is the empty string. Never pass both `value` and
`defaultValue`, or switch modes during a mount. Group defaults are initial
snapshots; changing them does not replace a user's selection or reset baseline.
User selection notifies once; prop updates, reset and clearing do not emit a
selection callback. A controlled owner may decline a selection, and native
checked state reconciles to its unchanged prop.

Group `controlSize` supplies the default size for its Radio options. An option
may select its own `controlSize`. Group required state cannot be removed by an
option's `required={false}`.

`label` wraps the input. Pass one name for the option, not a Field label as
well. A disabled group disables every choice through the fieldset. A disabled
choice stays visible and is skipped by the arrow keys.

`className` merges onto the input. Replacing `appearance-none` puts the native
glyph back; the input stays in the tab order and in the form. The dot is
decorative and does not receive clicks.

The disk stays a circle. `--rad-radio-radius` defaults to `999px` and
`--rad-radio-corner-shape` defaults to `unset`, so shared squircle or scoop
control shapes do not pinch it. Checked fill follows `--rad-color-accent`.

`components.radio` in `defineTheme` accepts `size`, `radius`, `cornerShape`, `borderWidth`,
`borderStyle`, `borderColor`, `background`, `checkedBackground`,
`checkedBorder`, `mark`, `invalidBorder`, `labelGap`, `labelColor`,
`labelSize`, `disabledBorder`, `disabledBackground`, `focusColor`,
`focusWidth`, `focusOffset`, and `focusStyle`. Root and part identities and
styling hooks are listed in [Form styling targets](#form-styling-targets).

### Dialog

`Dialog` is the open-state owner and renders no DOM wrapper. `DialogContent`
renders the native `<dialog>`. It stays in the document that rendered it, so
an ancestor form still owns the fields inside. There is no portal. A modal
dialog calls `showModal()`, which gives it the browser's top layer, inert
background, focus containment, and focus restoration. `modal={false}` calls
`show()` instead, for a dialog that leaves the rest of the page active.

```tsx
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger
} from '@cognitap/radiant'

;<Dialog>
  <DialogTrigger>Edit profile</DialogTrigger>
  <DialogContent>
    <DialogTitle>Edit profile</DialogTitle>
    <DialogDescription>This name is visible to your team.</DialogDescription>
    <DialogClose>Close</DialogClose>
  </DialogContent>
</Dialog>
```

| Mode         | How it opens and closes                        | After a browser close                           |
| ------------ | ---------------------------------------------- | ----------------------------------------------- |
| Uncontrolled | Omit `open`. `defaultOpen` opens after mount.  | React follows the browser.                      |
| Controlled   | Pass `open` and update it from `onOpenChange`. | If `open` stays `true`, the dialog opens again. |

Dialog, Collapsible and Accordion keep one state owner for a mount. Omit the
controlled prop when using its initial default; do not supply both. To change
ownership or Accordion type, remount with a new key. No-op requests, prop
synchronisation and native restoration do not emit semantic change callbacks.

`showModal()` and `close()` run after mount. Server markup never includes the
`open` attribute, including when `defaultOpen` is set, so hydration matches.
The file is marked `'use client'` because those DOM methods cannot be
represented in HTML. `showModal()` puts the dialog in the top layer and makes
the rest of the document inert. It does not lock document scrolling, and this
component does not set `overflow: hidden` on the body. The panel scrolls its
own overflow. Closed content stays mounted and hidden by the user agent. A
field inside a closed dialog is still in an ancestor form.

`DialogTrigger` and `DialogClose` compose `Button` by default, accepting its
`variant`, `tone`, `controlSize`, `iconOnly`, `fullWidth`, and `pending` props.
They inherit Button's typography, theme effects, hover, press, focus, and pending
presentation. `DialogTrigger` adds `aria-haspopup="dialog"`, `aria-expanded`, and
`aria-controls` pointing at the dialog; `DialogClose` requests close. Native
disabled and pending guards run before the consumer click handler. A consumer
can prevent the open/close request with `event.preventDefault()`.

Dialog actions inherit Button's `render(resolvedNativeProps)` interface. Both
default and custom paths compose Button; Button resolves and validates the host.
The callback returns one button or a component that forwards
to one button. It receives merged Button classes, caller styles, the real ref,
resolved children (including pending presentation), protected relationships and
guarded activation. Forward all props and children without wrapping another
Button or composing the handler again. Null, text, arrays, fragments and direct
native hosts other than buttons are rejected; custom components must preserve
the button host themselves.

```tsx
<DialogClose
  variant="outline"
  tone="neutral"
  render={props => <button {...props}>{props.children}</button>}
>
  Cancel
</DialogClose>
```

**Replacement migration:** callbacks previously owned their presentation. Move
`render={props => <Button {...props} variant="outline" />}` to `variant="outline"`
on the Dialog action and forward the resolved props to a native/custom button.
Use caller `className`/`style` on the action for local overrides. Retain resolved
children so the pending label and decorative indicator remain consistent.
Button preserves its base identity when composition adds slot tokens; Dialog
protects the exact `button dialog-trigger` / `button dialog-close` token sets.
Resolved presentation attributes cannot be replaced with caller data attributes.

Ordinary actions should set presentation props directly on `DialogTrigger` or
`DialogClose`. A `<form method="dialog">` inside the
dialog also closes it, and the `close` event updates React. `closeOnBackdrop`
and `closeOnEscape` default to true and apply to modal dialogs. Escape is the
browser's cancel event. A backdrop click is a click on the dialog whose point
lies outside its border box, so a click on the padding does not close it.

`DialogTitle` names the dialog through `aria-labelledby`. Include it. The title
is an `h2`. `DialogDescription` fills `aria-describedby`. The ids come from
context, so the parts can be reordered. Omitting the description leaves
`aria-describedby` pointing at a missing id. Pass `aria-label` on
`DialogContent` when the dialog has no title; the labelled-by relationship is
then left to the consumer.

External `aria-describedby` IDs are deduplicated and appended to the owned
DialogDescription ID. Changing `modal` on an open Dialog switches the same
native host between `showModal()` and `show()` without requesting a state change.

| Part                        | DOM, styling and ref target                   | Identity                                        |
| --------------------------- | --------------------------------------------- | ----------------------------------------------- |
| Dialog                      | State owner; DOM props belong to its parts    | No host                                         |
| DialogContent               | Native `dialog` panel, including `::backdrop` | `dialog`                                        |
| DialogTitle                 | `h2`, with its owned label ID                 | `dialog-title`                                  |
| DialogDescription           | `p`, with its owned description ID            | `dialog-description`                            |
| DialogTrigger / DialogClose | Button's native `button` host                 | `button dialog-trigger` / `button dialog-close` |

Each DOM part accepts `className`, `style`, native props and the ref for that
same host. Content, title and description styles accept local theme variables.
Computed identities and IDs stay owned. Content's `data-state="open" | "closed"`
reflects the React state owner, just like Trigger's `aria-expanded`; native
`open`/`:modal` remain authoritative for the browser layer. Even untyped caller
props cannot supply Content's `open` attribute. Server markup stays closed and
hydration opens it after mount.

The open panel keeps a viewport margin of 1rem, a maximum height of
`min(40rem, 100dvh - 2rem)`, and its own scrolling/overscroll containment.
Set `style={{ '--rad-dialog-width': '24rem' }}` to choose a local width while
retaining the viewport bound. Caller classes merge after defaults; match the
`open:` prefix for open-only layout, such as `open:p-0`. Preserve visibility,
viewport bounds and scrolling when replacing functional styles.

Surface, typography, border and focus settings fall back to shared theme roles.
Panel/title/description color transitions use `motion.colorDuration` and turn
off under reduced motion. Native opening, dismissal and cleanup keep their
existing timing. Backdrop background and the panel's `backdropFilter` remain
independent settings, including Glass's blur correction.

Focus is the platform's. An `autoFocus` control inside the dialog takes initial
focus. Otherwise the browser focuses the first focusable control inside.
Shift+Tab from that control wraps to the last control. Tab from the last
control can land on the document body for one stop; the next Tab returns to
the first control, and background controls stay unfocused. Closing restores
the element that was focused when the dialog opened. A second dialog opened
with `showModal()` stacks on the first, and Escape closes the top one. `close`
and `cancel` bubble, and a parent ignores an event that started on a nested
dialog. `useDialog()` lets another control open the same dialog. It returns
`null` outside `Dialog`.

`className` merges onto the part it is passed to. The panel uses shared surface
radius and corner shape, so a scoop or squircle theme shapes the surface.
`components.dialog` in `defineTheme` accepts `width`, `padding`, `gap`, `radius`, `cornerShape`,
`background`, `color`, `borderWidth`, `borderStyle`, `borderColor`, `shadow`,
`backdrop`, `backdropFilter`, `titleSize`, `titleWeight`, `descriptionColor`, `descriptionSize`,
`focusColor`, `focusWidth`, `focusOffset`, and `focusStyle`. The dialog sets
`data-slot="dialog"`. The action identities are `button dialog-trigger` and
`button dialog-close`; use membership selectors such as
`[data-slot~="dialog-trigger"]`. Title and description retain `dialog-title`
and `dialog-description`.

### Collapsible

`Collapsible` is a native `<details>` element. `CollapsibleTrigger` is its
`<summary>`. The browser toggles it with a click, Space, or Enter, and keeps
focus on the summary. There is no separate open attribute to invent: `open` is
the disclosure's open state. Closed content stays in the document and is hidden
by the user agent, so a field inside a closed disclosure is still part of an
ancestor form.

```tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@cognitap/radiant'

;<Collapsible>
  <CollapsibleTrigger>Shipping</CollapsibleTrigger>
  <CollapsibleContent>Ships in two days.</CollapsibleContent>
</Collapsible>
```

| Mode         | How it opens                                        | After the browser toggles                           |
| ------------ | --------------------------------------------------- | --------------------------------------------------- |
| Uncontrolled | Omit `open`. `defaultOpen` is in the server markup. | React follows the summary.                          |
| Controlled   | Pass `open` and update it from `onOpenChange`.      | If `open` stays unchanged, the disclosure does too. |

`defaultOpen` is the `open` attribute on the server, so hydration matches.
The file is marked `'use client'` because the summary changes the DOM open
state and React state has to follow it. Parts can be reordered; the summary
still toggles every other child. `name` is the native exclusive group: opening
one disclosure closes another with the same name. A nested disclosure does not
toggle its parent.

The summary's text is its accessible name. Do not put a button or link inside
the summary. The marker is decorative. `useCollapsible()` reads the open state
and can request a change. It returns `null` outside `Collapsible`.

The panel height and the marker use shared disclosure motion timing. `prefers-reduced-motion`
removes those transitions, so the state change is instant. `data-state` is
`open` or `closed`.

`className` merges onto the part it is passed to. The surface inherits the
shared surface radius and corner shape. `components.collapsible` in `defineTheme` accepts `radius`,
`cornerShape`, `background`, `color`, `borderWidth`, `borderStyle`,
`borderColor`, `padding`, `gap`, `contentColor`, `contentSize`, `duration`,
`focusColor`, `focusWidth`, `focusOffset`, and `focusStyle`. The disclosure
sets `data-slot="collapsible"`. The summary and content set
`collapsible-trigger` and `collapsible-content`. Root, summary and content accept
native props/refs and typed local theme styles on those exact hosts. Their
owned `data-state` follows the open-state owner; a caller `data-slot` adds tokens
without replacing the owned identity. Use token selectors (`[data-slot~="collapsible"]`)
when targeting composed disclosures. Color transitions use shared color motion
and also stop under reduced motion. Keep the native closed-content visibility,
direct-child summary and details-content overflow/height rules when overriding
functional CSS. Closed fields stay mounted and remain successful form controls.

### Accordion

`Accordion` is a group of `Collapsible` sections. Each trigger is that
section's `<summary>`, and each panel is its content. The accordion chooses
which sections are open. The summary still toggles, and `open` is still the
disclosure's open state.

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@cognitap/radiant'

;<Accordion defaultValue="shipping">
  <AccordionItem value="shipping">
    <AccordionTrigger>Shipping</AccordionTrigger>
    <AccordionContent>Ships in two days.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="returns">
    <AccordionTrigger>Returns</AccordionTrigger>
    <AccordionContent>Returns are free for 30 days.</AccordionContent>
  </AccordionItem>
</Accordion>
```

| Mode       | What stays open                                       |
| ---------- | ----------------------------------------------------- |
| `single`   | One section. Opening another closes the previous one. |
| `multiple` | Each section, on its own.                             |

`single` is the default. Omit `value` and pass `defaultValue` for an
uncontrolled group. Pass `value` and update it from `onValueChange` for a
controlled group. If `value` does not change, the open sections do not change
either. Sections do not share a `name`: the accordion passes `open` to each
section, so a controlled value can restore the disclosure without fighting
the browser's exclusive group. Closed content stays mounted, so a field
inside a closed section is still part of an ancestor form.

The trigger label is a level-3 heading inside the summary. Set `level` to
another heading level, or `level={null}` for text with no heading. The summary
has to stay a direct child of `<details>`, so the heading cannot wrap the
summary. Do not put a button or link inside the trigger. The marker is
decorative. `useAccordion()` reads the value and can open or close a section.
It returns `null` outside `Accordion`.

Tab moves between summaries and into open content. Space and Enter toggle the
focused summary and leave focus there. ArrowDown leaves focus on the summary.
A disabled summary is removed from the tab order and does not toggle. A nested
disclosure does not change the accordion selection.

`className` merges onto the part it is passed to. Section surface, radius,
and motion come from `Collapsible`; set `components.collapsible` in the scoped
theme and the variables inherit. `components.accordion.gap` maps to `--rad-accordion-gap`,
the space between sections. The group sets `data-slot="accordion"` and
`data-type="single"` or `"multiple"`. Part props, styles and refs target the same native hosts as Collapsible:

| Part             | Host      | Owned identity tokens                   |
| ---------------- | --------- | --------------------------------------- |
| Accordion        | `div`     | `accordion`                             |
| AccordionItem    | `details` | `collapsible accordion-item`            |
| AccordionTrigger | `summary` | `collapsible-trigger accordion-trigger` |
| AccordionContent | `div`     | `collapsible-content accordion-content` |

Use `[data-slot~="accordion-trigger"]` (and token selectors for the underlying
Collapsible identities). Caller tokens are additive and deduplicated. Item,
trigger and content expose the item's owned `data-state`; content IDs remain
owned. Content must belong to an AccordionItem. The item ignores native `name`
even for JavaScript callers, so browser exclusive grouping cannot compete with
Accordion's selection owner. Local theme variables can be passed directly to
any part's `style`. Choose `value` or `defaultValue`, and `open` or `defaultOpen`
for standalone Collapsible; mixed owners are rejected by types and runtime.

### Card

`Card` is a grouped surface. It renders a `<div>`. It is not a button, a link,
or a region. Put a `Button` or a `Link` inside it when the card needs an
action. Those controls keep their own keyboard behavior. The card itself is
not in the tab order.

```tsx
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Link
} from '@cognitap/radiant'

;<Card>
  <CardHeader>
    <CardTitle>Shipping</CardTitle>
    <CardDescription>Leaves the studio tomorrow.</CardDescription>
  </CardHeader>
  <CardContent>Ships in two days.</CardContent>
  <CardFooter>
    <Button type="button">Track</Button>
    <Link href="/orders/1">Details</Link>
  </CardFooter>
</Card>
```

The title is a level-2 heading. Set `level` when the page outline needs a
different one. The description is a paragraph. Header, content, footer, and
title can be omitted or reordered. The consumer owns the words.

To name a region, wrap the card in a `<section>` and point
`aria-labelledby` at the title's `id`. The card does not add that role.

`className` merges onto the part it is passed to. The surface inherits the
shared surface radius and corner shape. `components.card` in `defineTheme` accepts `radius`, `cornerShape`,
`background`, `color`, `borderWidth`, `borderStyle`, `borderColor`,
`padding`, `gap`, `headerGap`, `footerGap`, `shadow`, `titleSize`,
`titleWeight`, `descriptionColor`, and `descriptionSize`. The card sets
`data-slot="card"`. The header, title, description, content, and footer set
`card-header`, `card-title`, `card-description`, `card-content`, and
`card-footer`. Each part accepts typed local theme variables and native props/refs
on its own host. Caller `data-slot` tokens are additive and deduplicated; owned
identities remain present. Use token selectors such as `[data-slot~="card-title"]`.

| Part                                      | Native host / ref target                      |
| ----------------------------------------- | --------------------------------------------- |
| Card, CardHeader, CardContent, CardFooter | `div` / `HTMLDivElement`                      |
| CardTitle                                 | `h1`–`h6` from `level` / `HTMLHeadingElement` |
| CardDescription                           | `p` / `HTMLParagraphElement`                  |

Root/title/description color transitions follow shared color motion and stop
under reduced motion. Local overrides retain the shared fallbacks on other
parts: for example, `style={{ '--rad-card-padding': '1.25rem' }}` changes root
padding and `style={{ '--rad-card-title-size': '1.25rem' }}` targets a title.
Caller classes merge after defaults. Preserve the grid layout, content wrapping
and footer wrapping when changing functional CSS; keep actions as Button/Link
children rather than making the surface itself interactive.

Card → Composition reuses the canonical native profile form under the global
Storybook theme. Recipes → Forms also offers the TanStack owner and Dialog
placement; these share the same fields and actions rather than separate demos.

### Theming

Use `defineTheme` for shared semantic tokens and deliberate `components`
exceptions; apply its result with `ThemeScope`. Theme and light/dark/system mode
are independent. The
[theming reference](docs/theming.md) explains scopes, precedence, fonts and local styling, and contains the canonical authoring example,
complete token defaults and preset reference.

Migrating older code? Follow the
[theme migration steps](docs/theming.md#migration-from-button-centred-themes)
and [action migration table](#action-api-migration-breaking). Family theme
helpers/types, `Theme.style`, `Theme.surface`, `radiantTheme` and old CSS aliases
are removed. Use `ThemeComponentOverrides` for reusable configuration and
`ThemeStyle` for local `--rad-*` styles.

### With Tailwind

For opt-in prose and reusable text styles, see
[responsive typography](docs/theming.md#responsive-typography).
Existing components consume the shared UI roles, while control sizes and explicit
component exceptions retain their metrics. See [component mapping and migration](docs/theming.md#component-roles-and-earlier-themes).

The pure
`@cognitap/radiant/typography` entry resolves font-aware starting points through
the existing theme compiler; applications still own font loading.

Applications on Tailwind 4.3.3+ can import the source entry instead of
`styles.css`, so their own build generates Radiant's utilities. Use one route,
not both, or the utilities are duplicated:

```css
@import 'tailwindcss';
@import '@cognitap/radiant/tailwind.css';
```

To skip Preflight, replace `@import 'tailwindcss'` with
[Tailwind's separate imports](https://tailwindcss.com/docs/preflight#disabling-preflight).

```css
@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities);
@import '@cognitap/radiant/tailwind.css';
```

Keep application source discovery enabled so caller utilities are generated;
using `source(none)` requires explicitly registering your application's sources.
Utilities passed in `className` replace matching defaults, including `hover:` and
`disabled:` variants: `<Button className="rounded-full hover:bg-red-500">`.

## Development

The [architecture doc](docs/architecture.md) defines the ten-family contract.
[GLOSSARY.md](GLOSSARY.md) defines the shared vocabulary.

The [React binding reference](docs/react-bindings.md) details the implemented
ref, event, ID, state ownership and mounted lifecycle conventions and their
private consumers.

Use the Node.js version in `.nvmrc`. Any recent pnpm switches itself to the version
pinned in `package.json`:

```sh
nvm install && nvm use
npm install --global pnpm
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm storybook
```

Storybook runs at [localhost:6006](http://localhost:6006) and needs no Cognitap
checkout. Choose **Theme** and **Mode** in its toolbar; the selection applies
across component stories and Docs. Defaults are Radiant and System.
See the [Storybook guide](docs/storybook.md) for the shared story
structure and verification workflow.

| Command                   | Purpose                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------- |
| `pnpm storybook`          | Develop components in Storybook.                                                    |
| `pnpm build`              | Build JavaScript, declarations, and CSS into `dist/library`.                        |
| `pnpm watch`              | Rebuild on change, except `reset.css` (run `pnpm build` first).                     |
| `pnpm build:storybook`    | Build static Storybook into `dist/storybook`.                                       |
| `pnpm lint`               | Run Oxlint, including accessibility rules.                                          |
| `pnpm format`             | Format with Oxfmt (`format:check` to check only).                                   |
| `pnpm typecheck`          | Check TypeScript.                                                                   |
| `pnpm test`               | Run style tests and verify the packed, installed package.                           |
| `pnpm test:package`       | Verify the packed, installed package only.                                          |
| `pnpm test:browser`       | Run Storybook plays and axe in every theme/mode, plus native browser scenarios.     |
| `pnpm test:browser:smoke` | Run every story in Radiant Light/Dark plus native browser scenarios.                |
| `pnpm check:ci`           | Run source checks, runtime/package tests, builds, and representative browser tests. |
| `pnpm check`              | Run the full theme, installed styling/composition, and browser audit.               |
| `pnpm release:prepare`    | Pack and verify a release candidate, then dry-run publishing.                       |

Package verification installs the archive with npm, so it needs network access.
A Husky pre-commit hook formats staged files with Oxfmt.
[CI](.github/workflows/ci.yml) runs `pnpm check:ci` for pull requests and pushes
to `main`. Run `pnpm check` for the exhaustive audit, locally or with the manual
workflow's **full** input.
See [verification conventions](docs/testing.md) for focused browser runs,
failure artifacts, and the evidence required by migration issues.

Modules must stay free of import-time side effects, and client-dependent modules
need their own `use client` directive. Add `*.stories.tsx` next to each component,
like `src/Button.stories.tsx`. Storybook's Accessibility panel runs axe checks on
every story, but automated checks cover only part of WCAG, so still test keyboard,
focus, and screen reader behavior by hand.

## Live development in Cognitap

With this checkout at `../radiant` and its dependencies installed, `pnpm dev` in
Cognitap builds and watches it, points both apps at it, and starts this Storybook.
Cognitap's installed package, manifests, and lockfile stay untouched. See
[Cognitap's guide](https://github.com/cognitap/cognitap#live-radiant-development)
for other checkouts and type checking.

## Further reading

- [Browser/accessibility matrix](docs/accessibility.md): support targets, manual checks, WCAG evidence and unverified combinations
- [System guide](docs/architecture.md): the current ten-family theming, composition and customisation contract
- [Theming reference](docs/theming.md): token defaults, presets, fonts and migration steps
- [Storybook inspection](docs/storybook.md): global Theme/Mode controls and canonical live recipes
- [Release policy](RELEASE_POLICY.md): versioning, compatibility, and the release workflow
- [Changelog](CHANGELOG.md): consumer-facing changes per release
- [CONTRIBUTING.md](CONTRIBUTING.md): maintainer workflow and bug reports
- [AGENTS.md](AGENTS.md): component and styling conventions

### Spring runtime (unreleased)

Configure serializable `defineTheme({motion: ...})` profiles and opt into
`@cognitap/radiant/motion` or `/motion/react`. See the [runtime and migration
guide](docs/motion.md) for physical values, native bindings, live reduced motion,
cleanup and the accepted Radiant layout boundary. Existing component animations
are unchanged until their individual integrations.
