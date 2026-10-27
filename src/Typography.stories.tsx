import { TypographyComponents } from '../.storybook/examples/TypographyComponents.js'
import { ThemeScope, defineTheme, generateTypography } from './index.js'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { typographyRoles } from './index.js'

const meta = {
  title: 'System/Typography',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Opt-in semantic HTML typography. The global theme and mode supply the same shared roles as installed consumers. Font files remain application-owned. Use data-rad-type-container for local responsive sizing; data-rad-prose styles its direct prose blocks, while data-rad-text selects a reusable style independently of HTML semantics.'
      }
    }
  }
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

export const Roles: Story = {
  render: () => (
    <section
      data-rad-type-container=""
      style={{ maxWidth: '50rem' }}
    >
      {typographyRoles.map(role => (
        <div
          key={role}
          style={{ paddingBlock: '1rem', borderBottom: '1px solid var(--rad-color-border)' }}
        >
          <div style={{ fontSize: '12px', fontFamily: 'system-ui' }}>{role}</div>
          <div data-rad-text={role}>Space for a clear thought.</div>
        </div>
      ))}
    </section>
  )
}

export const Prose: Story = {
  render: () => (
    <article
      data-rad-prose=""
      data-rad-type-container=""
    >
      <h1>A shared language for careful work</h1>
      <p data-rad-text="prose-lead">
        Prose and interfaces need related, distinct rhythms. A numeric scale is only one decision.
      </p>
      <p>
        Use semantic HTML, real <em>emphasis</em>, <strong>strong text</strong> and inline{' '}
        <code>workspace.theme</code>. The theme owns presentation, while the document keeps its
        structure.
      </p>
      <h2>Let the content find its width</h2>
      <p>
        This heading follows this article's container, including when the article sits in a narrow
        column on a wide screen.
      </p>
      <ul>
        <li>Body and UI sizes are independent.</li>
        <li>Explicit text styles preserve HTML semantics.</li>
        <li>Consumer utilities and ordinary CSS can override the result.</li>
      </ul>
      <h3>Keep the detail connected</h3>
      <p>
        Paragraph spacing and heading spacing share one prose rhythm. Component layout remains a
        separate responsibility.
      </p>
      <pre
        // The preformatted overflow region needs keyboard focus for scrolling.
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        // Preserve preformatted semantics while naming the scroll region.
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
        role="region"
        aria-label="Typography configuration example"
      >
        <code>{'const typography = generateTypography({ preset: "source-serif" })'}</code>
      </pre>
      <p data-rad-text="prose-small">
        The default works without downloaded fonts. Supply the families required by your chosen
        configuration.
      </p>
    </article>
  )
}

// The toolbar covers every preset and mode; these variants expose font and density changes.
export const Components: Story = { render: () => <TypographyComponents /> }
export const SerifInterface: Story = {
  render: () => (
    <ThemeScope
      theme={defineTheme({
        id: 'serif-interface',
        name: 'Serif interface',
        tokens: {
          typography: generateTypography({
            fonts: { ui: { family: 'Georgia', profile: 'manual' } },
            ui: { size: 18, lineHeight: 1.7 }
          }).tokens
        }
      })}
    >
      <TypographyComponents />
    </ThemeScope>
  )
}
export const MonoInterface: Story = {
  render: () => (
    <ThemeScope
      theme={defineTheme({
        id: 'mono-interface',
        name: 'Mono interface',
        tokens: {
          typography: generateTypography({
            fonts: { ui: { family: 'monospace', profile: 'manual' } },
            ui: { size: 14, lineHeight: 1.6 }
          }).tokens
        }
      })}
    >
      <TypographyComponents />
    </ThemeScope>
  )
}
