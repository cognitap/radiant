# Radiant

> [!WARNING]  
> Radiant is under heavy development. Things _will_ change and things _will_ break. Use at your own risk.

React components built on native HTML elements, with shared themes, for your
app and for the interfaces your agents compose. Published as
[`@cognitap/radiant`](https://www.npmjs.com/package/@cognitap/radiant) under the
[MIT license](LICENSE). Radiant is experimental during 0.x.

Radiant never calls a model and needs no API key. Your agent writes
[A2UI](https://a2ui.org) messages; Radiant supplies the catalog it picks from, a
validator for your server and a renderer for the browser:

```tsx
'use client'
import '@cognitap/radiant/styles.css'
import { A2uiSurface, type A2uiMessage } from '@cognitap/radiant/a2ui'

export function AgentReply({ messages }: { messages: A2uiMessage[] }) {
  return (
    <A2uiSurface
      surfaceId="reply"
      messages={messages}
      onAction={({ action, state }) => sendToAgent(action, state)}
    />
  )
}
```

Check each surface on the server before storing it:

```ts
import { validateA2uiAccessibility } from '@cognitap/radiant/a2ui'

const { errors, messages: fixed } = validateA2uiAccessibility(messages, { fix: true })
```

`@cognitap/radiant/catalog` renders the catalog as prompt text, and apps add
their own components to it. The same families, covering actions, forms,
overlays, navigation, feedback, layout and data display, work directly in React. Charts ship at `@cognitap/radiant/charts`.

## Install

```sh
pnpm add --save-exact @cognitap/radiant
```

React 19.3+ and React DOM 19.3+ are peer dependencies. Import the stylesheet once. It needs no
Tailwind and styles only Radiant components:

```tsx
import '@cognitap/radiant/styles.css'
import { Button, Field, Input } from '@cognitap/radiant'

export function Signup() {
  return (
    <form>
      <Field label="Email">
        <Input
          name="email"
          type="email"
          autoComplete="email"
        />
      </Field>
      <Button type="submit">Sign up</Button>
    </form>
  )
}
```

For a global reset, also import `@cognitap/radiant/reset.css` before
`styles.css`.

### With Tailwind

Applications on Tailwind 4.3.3+ can import the source entry instead of
`styles.css`, so their own build generates Radiant's utilities. Use one route,
not both:

```css
@import 'tailwindcss';
@import '@cognitap/radiant/tailwind.css';
```

Keep source discovery on so your own utilities are generated. Utilities you pass
in `className` replace the matching defaults, including `hover:` and
`disabled:` variants.

## Documentation

- [Docs site](https://radiant-docs.pages.dev): a guide and live example for each component
- [Agent guide](https://radiant-docs.pages.dev/docs/agents/): render, validate and extend A2UI surfaces
- [Architecture](docs/architecture.md): how the families and the agent layer fit together and why
- [Theming](docs/theming.md): tokens, presets, fonts and modes
- [Motion](docs/motion.md): opt-in spring animation
- [Accessibility](docs/accessibility.md): support targets and manual checks
- [Glossary](GLOSSARY.md): shared vocabulary
- [Changelog](CHANGELOG.md): what changed in each release, including unreleased work
- [Contributing](CONTRIBUTING.md): setup, commands and how changes get merged
