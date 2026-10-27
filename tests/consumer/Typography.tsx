import {
  Button,
  ThemeScope,
  compileThemeDocument,
  defineThemeDocument,
  defaultTheme,
  typographyRoles,
  type ThemeMode
} from '@cognitap/radiant'

const document = defineThemeDocument({
  kind: 'radiant-theme',
  version: 1,
  id: 'installed-typesetting',
  name: 'Installed typesetting',
  sections: {
    typography: {
      typesetting: { preset: 'source-serif', styles: { 'ui-label': { weight: 650 } } },
      modes: { dark: { roles: { 'ui-caption': { letterSpacing: '0.02em' } } } }
    },
    components: { values: { button: { fontWeight: 775 } } }
  }
})
const theme = compileThemeDocument(document)
export function TypographyProof({ mode }: { mode: ThemeMode }) {
  return (
    <ThemeScope
      theme={theme}
      mode={mode}
      data-testid="typography-proof"
    >
      <h2
        data-rad-text="prose-title"
        data-testid="type-fallback"
      >
        Compact without a container
      </h2>
      <section
        data-rad-type-container=""
        data-testid="type-container"
        style={{ width: '800px' }}
      >
        <div
          data-rad-prose=""
          data-rad-text="ui-body"
          data-testid="type-explicit-host"
        >
          Explicit host style wins over prose defaults.
        </div>
        {typographyRoles.map(role => (
          <div
            key={role}
            data-rad-text={role}
            data-testid={`type-${role}`}
          >
            Typography {role}
          </div>
        ))}
        <h2
          data-rad-text="prose-title"
          data-testid="type-caller"
          className="type-app-override text-3xl leading-loose font-mono font-bold tracking-wide max-inline-none"
        >
          Caller typography
        </h2>
        <article
          data-rad-prose=""
          data-rad-type-container=""
          data-testid="type-prose"
        >
          <h1>Long headings wrap in their actual content column</h1>
          <p>
            Actual prose, <strong>strong text</strong>, <em>real italic when supplied</em> and{' '}
            <code>workspace.theme</code>.
          </p>
          <p data-testid="type-paragraph">
            A long identifier:
            extraordinarilylongunbrokenidentifierthatmustwrapwithoutclippingorwideningthearticle.
          </p>
          <h2 data-testid="type-heading">A new section</h2>
          <p data-testid="type-after-heading">
            The heading stays close to the content it introduces.
          </p>
          <pre
            // The preformatted overflow region needs keyboard focus for scrolling.
            // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            // Preserve preformatted semantics while naming the scroll region.
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
            role="region"
            aria-label="Scrollable code example"
          >
            const longLine = "code can scroll within its own region rather than widening the
            surrounding article"
          </pre>
          <h2
            data-rad-not-prose=""
            data-testid="type-optout"
            style={{ fontSize: '17px' }}
          >
            An opted-out block
          </h2>
          <h2
            data-rad-text="ui-title"
            data-testid="type-explicit"
          >
            Explicit UI role wins over automatic prose mapping
          </h2>
        </article>
        <ThemeScope
          mode="dark"
          data-testid="type-mode"
        >
          <span data-rad-text="ui-caption">Mode-only scope</span>
        </ThemeScope>
        <ThemeScope
          theme={defaultTheme}
          data-testid="type-reset"
        >
          <span data-rad-text="ui-label">Named reset</span>
        </ThemeScope>
        <Button data-testid="type-button">Existing component exception</Button>
      </section>
    </ThemeScope>
  )
}
