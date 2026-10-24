# Radiant

React interaction components and presentation primitives, published as
[`@cognitap/radiant`](https://www.npmjs.com/package/@cognitap/radiant) under the
[MIT license](LICENSE). Radiant is experimental: `0.0.2` contains a single native
Button.

## Usage

```sh
pnpm add --save-exact @cognitap/radiant@0.0.2
```

Import the stylesheet once in your application. It needs no Tailwind and only
styles Radiant components:

```tsx
import '@cognitap/radiant/styles.css'
import { Button } from '@cognitap/radiant'

<Button onClick={handleContinue}>Continue</Button>
<Button disabled>Unavailable</Button>
<Button type="submit">Save</Button>
```

All components share a neutral light/dark baseline: control dimensions,
typography, surfaces, focus, and motion. Use the [theme system](#theming) to
customise the library or a subtree.

For a global reset (Tailwind Preflight), also import `@cognitap/radiant/reset.css`
before `styles.css`. React 19.3+ is a peer dependency.

`Button` takes native button props, including `ref`, `aria-*` and form attributes,
and defaults to `type="button"`. Give every button an accessible name through its
text, `aria-label`, or `aria-labelledby`. The type does not reject a nameless
button. Use a link for navigation.

```tsx
<Button variant="destructive" size="small">Delete</Button>
<Button variant="outline" radius="full">Next</Button>
<Button iconOnly aria-label="Close"><CloseIcon /></Button>
```

| Prop        | Values                                                               | Default   |
| ----------- | -------------------------------------------------------------------- | --------- |
| `variant`   | `primary`, `secondary`, `warning`, `destructive`, `outline`, `ghost` | `primary` |
| `size`      | `small`, `default`, `large`                                          | `default` |
| `radius`    | `none`, `small`, `default`, `large`, `full`                          | `default` |
| `iconOnly`  | Squares the button at its size. Pass `aria-label`.                   | `false`   |
| `fullWidth` | Fills the container width.                                           | `false`   |
| `pending`   | Shows a spinner over the label and ignores activation.               | `false`   |

The style prop is `variant`, because `type` stays the native attribute. An omitted
`type` is `button` even when `formAction` is set. Pass `type="submit"` to submit.
While `pending` is set, the label stays in place, a spinner covers it, and
activation does not run. It does not set `disabled`, so focus stays. Reduced
motion keeps the label and hides the spinner. Child SVGs are sized to the button.

### Link

`Link` is for navigation: a real anchor with `href`, `target`, `download`, and
native click semantics untouched, so modified clicks and keyboard activation
behave normally. Three forms: an underlined accent link for running text, a
subtle link that underlines on hover, and a button-styled link that reuses the
button variants.

```tsx
import { Link } from '@cognitap/radiant'

<p>Read the <Link href="/guide">guide</Link> first.</p>
<Link href="/settings" variant="subtle">Settings</Link>
<Link href="/start" variant="button" tone="destructive" size="small">Delete space</Link>
<Link href="https://example.com" external>Example</Link>
```

| Prop       | Values                                                             | Default   |
| ---------- | ------------------------------------------------------------------ | --------- |
| `variant`  | `inline`, `subtle`, `button`                                       | `inline`  |
| `tone`     | Button variants, for `variant="button"`                            | `primary` |
| `size`     | `small`, `default`, `large`, for `variant="button"`                | `default` |
| `radius`   | Button radii, for `variant="button"`                               | `default` |
| `external` | Adds `target="_blank"` and `rel="noopener noreferrer"` when unset. | `false`   |
| `render`   | Replace the anchor element; see below.                             | —         |

Links paint from `--rad-link-color` and `--rad-link-hover-color` (falling back to
the shared accent role) and from the shared focus variables, so a theme
styles links and buttons together. `linkTheme` sets them with typed keys:
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

### Field

`Field` is the form anatomy: it connects a label, an optional description, and
an optional error to one control, or captions a group. It does not validate and
it does not read form state. The consumer owns the error. Pass the message when
the value is invalid and clear it when the value recovers. An empty message
removes the invalid state.

```tsx
import { Field } from '@cognitap/radiant'

;<Field
  label="Email"
  description="Work address"
  error={error}
  required
>
  <input
    name="email"
    type="email"
    autoComplete="email"
  />
</Field>
```

A single host control (`input`, `textarea`, `select`) receives `id`,
`required`, `disabled`, `aria-invalid`, `aria-required`, and
`aria-describedby`. The label uses that `id`. A component child calls
`useField()` and forwards `controlProps`. `Input` does this already. A render
function receives the same props, for an adapter that is not a host element:

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
| `required`          | Sets the control's `required` and `aria-required`. The marker is visual.      | `false`   |
| `disabled`          | Disables the control, or the whole `<fieldset>` for a group.                  | `false`   |
| `requiredIndicator` | Replaceable visual marker, hidden from assistive tech. `null` hides it.       | `*`       |

Group anatomy is a `<fieldset>` and `<legend>`, so a disabled group disables
its descendants natively. A radio group uses `RadioGroup`, which is this
fieldset of native radios, and does not add `role="radiogroup"`. Required and
invalid on a group are relationships on the fieldset, not on each control.

Ids come from `useId()`, so server markup and hydration agree. A host control's
own `id` wins, and its `aria-describedby` is kept alongside the description and
error. There is no built-in English sentence; the label, description, error,
and required marker are all consumer content.

`fieldTheme` maps typed keys to `--rad-field-*` variables: `gap`, `labelColor`,
`labelSize`, `labelWeight`, `descriptionColor`, `descriptionSize`, `errorColor`,
`errorSize`, `requiredColor`, and `disabledOpacity`. The root sets
`data-slot="field"`, `data-layout`, `data-invalid`, `data-disabled`, and
`data-required`. Parts set `data-slot` to `field-label`, `field-description`,
`field-error`, and `field-required`. Style a control from the field, for
example `[data-slot="field"][data-invalid] input`.

A native `<form>` leaves the control uncontrolled: give it a `name`, and on
submit pass the message back through `error`. Text controls follow the value
contract documented on Input.

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
width. Visual size is `--rad-input-height`, padding, and font tokens, which fall
back to shared control metrics.

`inputTheme` maps `height`, `padding`, `fontFamily`, `fontSize`, `fontWeight`,
`color`, `background`, `borderWidth`, `borderStyle`, `borderColor`, `radius`,
`cornerShape`, `shadow`, `placeholder`, `invalidBorder`, `disabledBackground`,
`focusColor`, `focusWidth`, `focusOffset`, and `focusStyle`. An invalid field
uses the destructive border. The element sets `data-slot="input"`.

TanStack Form is a reference integration, not a dependency. Drive Input in
controlled mode and pass the library's message to Field:

```tsx
<form.Field
  name="email"
  validators={{ onBlur: ({ value }) => (value.trim() ? undefined : 'Enter an email.') }}
>
  {field => (
    <Field
      label="Email"
      error={field.state.meta.errors[0]}
    >
      <Input
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={event => field.handleChange(event.target.value)}
      />
    </Field>
  )}
</form.Field>
```

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

`label` wraps the input, so the text toggles it. Inside a single-control Field
the field id wins, and that label is the accessible name. Inside a group, each
checkbox keeps the `label` beside it and the fieldset keeps the caption. Pass
one name for the option, not both.

`className` merges onto the input. Replacing `appearance-none` puts the native
glyph back; the input stays in the tab order and in the form. The check and
dash are decorative and do not receive clicks.

`checkboxTheme` maps `size`, `radius`, `cornerShape`, `borderWidth`,
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
owns those relationships. A required group sets the native `required`
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

| Mode         | How the selection moves                                        | Reset                                        |
| ------------ | -------------------------------------------------------------- | -------------------------------------------- |
| Uncontrolled | Omit `value`. `defaultValue` checks the matching radio.        | `form.reset()` restores `defaultValue`.      |
| Controlled   | Pass `value` and update it from `onValueChange` or `onChange`. | A browser reset does not change React state. |

The checked radio submits `name=value`. When none is checked, the group submits
nothing. `onChange` is the selected radio's change event, and `onValueChange`
receives its value. React does not deliver a radio change through the
fieldset, so the group listens on each radio. Inside the group, the group name
and selection win, so a `checked` or `name` on `Radio` does not split the
group. Outside a group, `Radio` is an ordinary radio: pass `name` and
`defaultChecked` or `checked`.

`label` wraps the input. Pass one name for the option, not a Field label as
well. A disabled group disables every choice through the fieldset. A disabled
choice stays visible and is skipped by the arrow keys.

`className` merges onto the input. Replacing `appearance-none` puts the native
glyph back; the input stays in the tab order and in the form. The dot is
decorative and does not receive clicks.

The disk stays a circle. `--rad-radio-radius` defaults to `999px` and
`--rad-radio-corner-shape` defaults to `unset`, so shared squircle or scoop
control shapes do not pinch it. Checked fill follows `--rad-color-accent`.

`radioTheme` maps `size`, `radius`, `cornerShape`, `borderWidth`,
`borderStyle`, `borderColor`, `background`, `checkedBackground`,
`checkedBorder`, `mark`, `invalidBorder`, `labelGap`, `labelColor`,
`labelSize`, `disabledBorder`, `disabledBackground`, `focusColor`,
`focusWidth`, `focusOffset`, and `focusStyle`. The fieldset keeps
`data-slot="field"`. The options set `data-slot="radio-group"`, and each input
sets `data-slot="radio"`.

### Dialog

`Dialog` is a native `<dialog>`. It stays in the document that rendered it, so
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

`showModal()` and `close()` run after mount. Server markup never includes the
`open` attribute, including when `defaultOpen` is set, so hydration matches.
The file is marked `'use client'` because those DOM methods cannot be
represented in HTML. `showModal()` puts the dialog in the top layer and makes
the rest of the document inert. It does not lock document scrolling, and this
component does not set `overflow: hidden` on the body. The panel scrolls its
own overflow. Closed content stays mounted and hidden by the user agent. A
field inside a closed dialog is still in an ancestor form.

`DialogTrigger` is a button with `aria-haspopup="dialog"`, `aria-expanded`, and
`aria-controls` pointing at the dialog. `render` hands those props to another
button. `DialogClose` requests close. A `<form method="dialog">` inside the
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

`className` merges onto the part it is passed to. The panel inherits the button
radius and corner shape, so a scoop or squircle theme shapes the surface.
`dialogTheme` maps `width`, `padding`, `gap`, `radius`, `cornerShape`,
`background`, `color`, `borderWidth`, `borderStyle`, `borderColor`, `shadow`,
`backdrop`, `titleSize`, `titleWeight`, `descriptionColor`, `descriptionSize`,
`focusColor`, `focusWidth`, `focusOffset`, and `focusStyle`. The dialog sets
`data-slot="dialog"`. The trigger, title, description, and close control set
`dialog-trigger`, `dialog-title`, `dialog-description`, and `dialog-close`.

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
shared surface radius and corner shape. `collapsibleTheme` maps `radius`,
`cornerShape`, `background`, `color`, `borderWidth`, `borderStyle`,
`borderColor`, `padding`, `gap`, `contentColor`, `contentSize`, `duration`,
`focusColor`, `focusWidth`, `focusOffset`, and `focusStyle`. The disclosure
sets `data-slot="collapsible"`. The summary and content set
`collapsible-trigger` and `collapsible-content`.

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
and motion come from `Collapsible`; set `collapsibleTheme` on the accordion
and the variables inherit. `accordionTheme` maps `gap` to `--accordion-gap`,
the space between sections. The group sets `data-slot="accordion"` and
`data-type="single"` or `"multiple"`. Each section keeps the Collapsible
slots.

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
shared surface radius and corner shape. `cardTheme` maps `radius`, `cornerShape`,
`background`, `color`, `borderWidth`, `borderStyle`, `borderColor`,
`padding`, `gap`, `headerGap`, `footerGap`, `shadow`, `titleSize`,
`titleWeight`, `descriptionColor`, and `descriptionSize`. The card sets
`data-slot="card"`. The header, title, description, content, and footer set
`card-header`, `card-title`, `card-description`, `card-content`, and
`card-footer`.

### Theming

Use `defineTheme` for shared semantic tokens and deliberate component
exceptions, and `ThemeScope` to apply a named theme and mode to a subtree:

```tsx
import { Button, Field, Input, ThemeScope, defineTheme } from '@cognitap/radiant'

const brand = defineTheme({
  id: 'garden',
  name: 'Garden',
  tokens: {
    control: { radius: '0.75rem' },
    typography: { family: 'system-ui, sans-serif' }
  },
  components: { button: { fontWeight: 650 } }
})

;<ThemeScope
  theme={brand}
  mode="system"
>
  <Field label="Garden name">
    <Input name="garden" />
  </Field>
  <Button>Save</Button>
</ThemeScope>
```

The stylesheet supplies the baseline without a provider. `ThemeScope` adds a
normal `div`, applies canvas and body typography, and supports light, dark,
and system appearance. Named themes reset omitted settings; partial local CSS
overrides inherit within their scope. Component overrides resolve before
shared tokens and never become another component's defaults.

Built-in presets are available through the readonly `themes` registry and
individual exports such as `radiant`, `defaultTheme`, and `ticket`. Select by
stable `id`. Load preset fonts in your application; choosing a theme does not
download them.

See the [theming guide](docs/theming.md) for the complete token/default reference,
presets and fonts, nested scopes, mode inheritance, and migration from old
CSS variables and theme wrappers. Existing family helpers remain local style
compatibility conveniences; `Theme.style`, `Theme.surface`, and `radiantTheme`
are deprecated in favour of `ThemeScope`.

### With Tailwind

Applications on Tailwind 4.3.3+ can import the source entry instead of
`styles.css`, so their own build generates Radiant's utilities. Use one route,
not both, or the utilities are duplicated:

```css
@import 'tailwindcss';
@import '@cognitap/radiant/tailwind.css';
```

To skip Preflight, replace `@import 'tailwindcss'` with
[Tailwind's separate imports](https://tailwindcss.com/docs/preflight#disabling-preflight).
Utilities passed in `className` replace matching defaults, including `hover:` and
`disabled:` variants: `<Button className="rounded-full hover:bg-red-500">`.

## Development

The [shared design and component contract](docs/contracts/README.md) records the
DEV-104 harmonisation target, with a [migration inventory](docs/contracts/migration.md)
and compile-only acceptance examples. The [theming guide](docs/theming.md)
describes the implemented theme APIs; the remaining contract migrations are
tracked separately. [GLOSSARY.md](GLOSSARY.md)
defines the shared vocabulary. Run `pnpm typecheck:contracts` to check those
specifications; the normal typecheck and CI include that check.

Use the Node.js version in `.nvmrc`. Any recent pnpm switches itself to the version
pinned in `package.json`:

```sh
nvm install && nvm use
npm install --global pnpm
pnpm install --frozen-lockfile
pnpm storybook
```

Storybook runs at [localhost:6006](http://localhost:6006) and needs no Cognitap
checkout. Choose **Theme** and **Mode** in its toolbar; the selection applies
across component stories and Docs. Defaults are Radiant and System.
See the [Storybook guide](docs/storybook.md) for the shared story
structure and verification workflow.

| Command                | Purpose                                                         |
| ---------------------- | --------------------------------------------------------------- |
| `pnpm storybook`       | Develop components in Storybook.                                |
| `pnpm build`           | Build JavaScript, declarations, and CSS into `dist/library`.    |
| `pnpm watch`           | Rebuild on change, except `reset.css` (run `pnpm build` first). |
| `pnpm build:storybook` | Build static Storybook into `dist/storybook`.                   |
| `pnpm lint`            | Run Oxlint, including accessibility rules.                      |
| `pnpm format`          | Format with Oxfmt (`format:check` to check only).               |
| `pnpm typecheck`       | Check TypeScript.                                               |
| `pnpm test`            | Run style tests and verify the packed, installed package.       |
| `pnpm test:package`    | Verify the packed, installed package only.                      |
| `pnpm check`           | Run formatting, lint, types, tests, and builds, as CI does.     |
| `pnpm release:prepare` | Pack and verify a release candidate, then dry-run publishing.   |

Package verification installs the archive with npm, so it needs network access.
A Husky pre-commit hook formats staged files with Oxfmt.
[CI](.github/workflows/ci.yml) runs `pnpm check`.

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

- [Release policy](RELEASE_POLICY.md): versioning, compatibility, and the release workflow
- [Changelog](CHANGELOG.md): consumer-facing changes per release
- [CONTRIBUTING.md](CONTRIBUTING.md): maintainer workflow and bug reports
- [AGENTS.md](AGENTS.md): component and styling conventions
