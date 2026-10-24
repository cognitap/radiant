import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor, within } from 'storybook/test'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  Link,
  Radio,
  RadioGroup,
  ThemeScope,
  themes
} from './index.js'

const meta = {
  title: 'System/Theming',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'One deliberate comparison of all public presets. Each named ThemeScope resets shared tokens and component exceptions while inheriting the global appearance selection. All ordinary component stories use the global theme instead. Fonts are loaded by the shared Storybook preview; preset selection does not download them.'
      }
    }
  }
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Comparison: Story = {
  play: async ({ canvasElement }) => {
    const palettes = {
      primary: ['accent', 'accent-foreground'],
      secondary: ['neutral', 'neutral-foreground'],
      destructive: ['danger', 'danger-foreground'],
      outline: ['surface', 'foreground'],
      ghost: [null, 'foreground']
    } as const
    const document = canvasElement.ownerDocument
    const view = document.defaultView!
    function normalize(property: 'color' | 'background', value: string) {
      const probe = document.createElement('span')
      probe.hidden = true
      probe.style[property] = value
      document.body.append(probe)
      try {
        const styles = view.getComputedStyle(probe)
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          backgroundImage: styles.backgroundImage
        }
      } finally {
        probe.remove()
      }
    }
    for (const theme of themes) {
      const row = within(canvasElement).getByTestId(`theme-${theme.id}`)
      // Check the real canvas as well as component colors: valid dark colors on
      // a stale light canvas still make ghost actions and hard shadows disappear.
      await waitFor(async () => {
        const styles = view.getComputedStyle(row)
        const canvas = styles.getPropertyValue('--rad-surface-canvas').trim()
        await expect(view.CSS.supports('background', canvas)).toBe(true)
        const expected = normalize('background', canvas)
        await expect(styles.backgroundColor).toBe(expected.backgroundColor)
        await expect(styles.backgroundImage).toBe(expected.backgroundImage)
      })
      for (const variant of Object.keys(palettes) as Array<keyof typeof palettes>) {
        const button = within(row).getByRole('button', { name: new RegExp(`^${variant}$`, 'i') })
        await waitFor(async () => {
          const styles = view.getComputedStyle(button)
          const [backgroundRole, foregroundRole] = palettes[variant]
          const background = backgroundRole
            ? styles.getPropertyValue(`--rad-color-${backgroundRole}`).trim()
            : 'transparent'
          const foreground = styles.getPropertyValue(`--rad-color-${foregroundRole}`).trim()
          // Missing mode flags concatenate light and dark colors into invalid CSS.
          await expect(view.CSS.supports('color', background)).toBe(true)
          await expect(view.CSS.supports('color', foreground)).toBe(true)
          await expect(styles.color).toBe(normalize('color', foreground).color)
          if (!button.matches(':hover, :active')) {
            await expect(styles.backgroundColor).toBe(normalize('color', background).color)
          }
          if (theme.id === 'sharp-3d') {
            const border = normalize('color', styles.getPropertyValue('--rad-color-border')).color
            await expect(styles.borderTopColor).toBe(border)
            await expect(styles.boxShadow).toContain('4px 4px 0px')
          }
        })
      }
    }
  },
  render: () => (
    <div
      style={{ display: 'grid', gap: '2rem', width: '100%', maxWidth: '64rem', margin: '0 auto' }}
    >
      {themes.map(theme => (
        <ThemeScope
          key={theme.id}
          theme={theme}
          data-testid={`theme-${theme.id}`}
          style={{ display: 'grid', gap: '1.5rem', padding: '1.5rem', borderRadius: '1.25rem' }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {(['primary', 'secondary', 'destructive', 'outline', 'ghost'] as const).map(variant => (
              <Button
                key={variant}
                variant={variant}
              >
                {variant}
              </Button>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{theme.name}</CardTitle>
              <CardDescription>
                {theme.id} — shared surfaces, controls, typography and focus.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={event => event.preventDefault()}
                style={{ display: 'grid', gap: '1.5rem' }}
              >
                <Field
                  label="Email"
                  description="Where to send updates"
                  required
                >
                  <Input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </Field>
                <Field
                  label="Display name"
                  error="Enter a display name."
                >
                  <Input
                    name="display-name"
                    aria-invalid
                  />
                </Field>
                <Checkbox
                  label="Email me product updates"
                  name="updates"
                  defaultChecked
                />
                <RadioGroup
                  label="Plan"
                  name={`plan-${theme.id}`}
                  defaultValue="pro"
                >
                  <Radio
                    label="Free"
                    value="free"
                  />
                  <Radio
                    label="Pro"
                    value="pro"
                  />
                </RadioGroup>
                <Collapsible>
                  <CollapsibleTrigger>Shipping details</CollapsibleTrigger>
                  <CollapsibleContent>
                    Ships in two days. All parts retain the same theme.
                  </CollapsibleContent>
                </Collapsible>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <Button type="submit">Save profile</Button>
                  <Button disabled>Unavailable</Button>
                  <Button pending>Saving</Button>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Link
                external
                href="https://github.com/cognitap/radiant/blob/main/docs/theming.md"
              >
                Read the guide
              </Link>
              <Dialog>
                <DialogTrigger
                  render={props => (
                    <Button
                      {...props}
                      variant="outline"
                    >
                      Inspect dialog
                    </Button>
                  )}
                />
                <DialogContent>
                  <DialogTitle>{theme.name} dialog</DialogTitle>
                  <DialogDescription>
                    The native top-layer dialog remains in this theme scope.
                  </DialogDescription>
                  <DialogClose render={props => <Button {...props}>Close dialog</Button>} />
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </ThemeScope>
      ))}
    </div>
  )
}
