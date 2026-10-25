import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ProfileExample } from '../.storybook/examples/ProfileForm.js'
import { Button, Field, Input, Link, ThemeScope, defineTheme } from './index.js'
import { generateColorWall, recommendColorPalette } from './color/index.js'

function PalettePreview({ brand }: { brand: string }) {
  const palette = recommendColorPalette(generateColorWall({ brand }))
  const theme = defineTheme({
    id: 'generated-palette',
    name: 'Generated palette',
    modes: {
      light: { tokens: { color: palette.color.modes.light, surface: palette.surface.modes.light } },
      dark: { tokens: { color: palette.color.modes.dark, surface: palette.surface.modes.dark } }
    }
  })
  return (
    <section aria-label="Semantic palette comparison">
      <h2>
        Brand {brand} · {palette.pass ? 'Checked semantic pairs pass' : 'Review contrast failures'}
      </h2>
      <p>
        Exact source and all wall families are retained. Semantic shades can differ from the source.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,28rem),1fr))',
          gap: '1rem',
          maxWidth: '76rem'
        }}
      >
        {(['light', 'dark'] as const).map(mode => (
          <ThemeScope
            key={mode}
            data-testid={`palette-${mode}`}
            theme={theme}
            mode={mode}
            style={{ padding: '1.25rem', minWidth: 0 }}
          >
            <h3>{mode === 'light' ? 'Light' : 'Dark'} palette</h3>
            <div
              aria-label={`${mode} working palette`}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }}
            >
              {Object.entries(palette.working).map(([role, choice]) => (
                <span
                  key={role}
                  title={choice.paletteId}
                  style={{
                    background: choice[mode].background,
                    color: choice[mode].foreground,
                    padding: '0.375rem 0.5rem',
                    borderRadius: '0.25rem'
                  }}
                >
                  {role}
                </span>
              ))}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr)',
                gap: '1rem',
                minWidth: 0
              }}
            >
              <Field label="Search">
                <Input placeholder="Search profiles" />
              </Field>
              <ProfileExample
                owner="native"
                placement="card"
                label={`${mode} profile`}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <Button tone="warning">Caution</Button>
                <Button tone="danger">Delete</Button>
                <Button variant="soft">Soft action</Button>
                <Button variant="outline">Outline action</Button>
                <Button variant="ghost">Ghost action</Button>
                <Button pending>Saving</Button>
                <Button disabled>Unavailable</Button>
              </div>
              <Link href="#semantic-details">Review details</Link>
            </div>
          </ThemeScope>
        ))}
      </div>
    </section>
  )
}
const meta = {
  title: 'System/Color Palette',
  component: PalettePreview,
  args: { brand: '#7C3AED' },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Working palette and semantic role inspection using the canonical profile form in independent light/dark scopes. Check the measured base pairs separately from component effects and deliberate overrides. Public editor presentation belongs to radiant-docs.'
      }
    }
  },
  argTypes: {
    brand: {
      control: 'select',
      options: [
        '#7C3AED',
        '#FF0000',
        '#0000FF',
        '#FFFF00',
        '#00FF00',
        '#00FFFF',
        '#7F6A75',
        '#F5E6FF',
        '#17111F',
        '#808080',
        '#000000',
        '#FFFFFF'
      ]
    }
  }
} satisfies Meta<typeof PalettePreview>
export default meta
type Story = StoryObj<typeof meta>
export const Reference: Story = {
  play: async ({ canvasElement }) => {
    for (const mode of ['light', 'dark']) {
      const scope = within(within(canvasElement).getByTestId(`palette-${mode}`))
      const save = scope.getByRole('button', { name: 'Save profile' })
      const email = scope.getByRole('textbox', { name: 'Email' })
      await userEvent.click(save)
      await expect(scope.getByRole('alert')).toHaveTextContent('Enter an email.')
      await expect(email).toHaveAttribute('aria-invalid', 'true')
      await expect(scope.getByRole('checkbox', { name: 'Send product updates' })).toBeChecked()
      await expect(scope.getByRole('textbox', { name: 'Workspace' })).toBeDisabled()
      await userEvent.click(scope.getByRole('textbox', { name: 'Search' }))
      await userEvent.tab()
      await expect(email).toHaveFocus()
    }
  }
}
