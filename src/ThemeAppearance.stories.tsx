import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { WorkspaceSettings } from '../.storybook/examples/WorkspaceSettings.js'
import {
  Button,
  Input,
  ThemeScope,
  compileThemeDocument,
  defaultTheme,
  generateColorWall,
  recommendColorPalette,
  themeDocumentFromDefinition,
  updateThemeAppearance
} from './index.js'

function AppearancePreview({
  brand,
  spacing,
  density,
  controlRadius,
  surfaceRadius,
  elevation
}: {
  brand: string
  spacing: number
  density: number
  controlRadius: number
  surfaceRadius: number
  elevation: 0 | 1 | 2 | 3
}) {
  const document = updateThemeAppearance(
    themeDocumentFromDefinition({
      id: 'workshop-appearance',
      name: 'Workshop appearance',
      components: { button: { radius: '13px' } }
    }),
    {
      palette: recommendColorPalette(generateColorWall({ brand })),
      geometry: {
        values: {
          spacing,
          density,
          controlRadius,
          surfaceRadius,
          controlBorderWidth: 2,
          surfaceBorderWidth: 2,
          elevation,
          backdropOpacity: 0.55
        },
        modes: { dark: { backdropOpacity: 0.75 } }
      }
    }
  )
  return (
    <ThemeScope
      theme={compileThemeDocument(document)}
      data-testid="appearance"
      style={{ padding: '1rem' }}
    >
      <h2>Generated theme across the existing families</h2>
      <WorkspaceSettings />
      <section
        aria-label="Control scale"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '1rem'
        }}
      >
        {(['small', 'medium', 'large'] as const).map(size => (
          <div key={size}>
            <Button
              controlSize={size}
              data-testid={`size-${size}`}
            >
              {size} action
            </Button>
            <Input
              controlSize={size}
              aria-label={`${size} input`}
              style={{ maxWidth: '12rem' }}
            />
          </div>
        ))}
      </section>
      <section
        aria-label="Override precedence"
        style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}
      >
        <Button data-testid="exception">Component radius exception</Button>
        <Button
          className="rounded-[31px]"
          data-testid="utility"
        >
          Caller utility radius
        </Button>
        <Button
          style={{ borderRadius: '35px' }}
          data-testid="inline"
        >
          Caller style radius
        </Button>
        <ThemeScope
          mode="dark"
          data-testid="nested"
          style={{ '--rad-input-radius': '19px' }}
        >
          <ThemeScope mode="light">
            <Input aria-label="Nested mode input" />
          </ThemeScope>
          <ThemeScope
            theme={defaultTheme}
            data-testid="reset"
          >
            <Button>Baseline reset</Button>
          </ThemeScope>
        </ThemeScope>
      </section>
    </ThemeScope>
  )
}
const meta = {
  title: 'System/Theme Appearance',
  component: AppearancePreview,
  args: {
    brand: '#7C3AED',
    spacing: 1.25,
    density: 1.1,
    controlRadius: 8,
    surfaceRadius: 16,
    elevation: 2
  },
  argTypes: {
    brand: { control: 'select', options: ['#7C3AED', '#FFFF00', '#808080', '#000000', '#FFFFFF'] },
    spacing: { control: { type: 'range', min: 0.5, max: 2, step: 0.05 } },
    density: { control: { type: 'range', min: 0.75, max: 1.5, step: 0.05 } },
    controlRadius: { control: { type: 'range', min: 0, max: 32, step: 1 } },
    surfaceRadius: { control: { type: 'range', min: 0, max: 48, step: 1 } },
    elevation: { control: 'select', options: [0, 1, 2, 3] }
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Generated color/canvas and bounded geometry use the existing document compiler and ThemeScope. The canonical workspace exercises all ten families; the probes verify control sizes and shared/component/caller/nested scope precedence. Public workshop UI belongs to radiant-docs.'
      }
    }
  }
} satisfies Meta<typeof AppearancePreview>
export default meta
type Story = StoryObj<typeof meta>
export const Workspace: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const view = canvasElement.ownerDocument.defaultView!
    const style = (id: string) => view.getComputedStyle(canvas.getByTestId(id))
    await expect(style('exception').borderRadius).toBe('13px')
    await expect(style('utility').borderRadius).toBe('31px')
    await expect(style('inline').borderRadius).toBe('35px')
    await expect(
      view.getComputedStyle(canvas.getByRole('textbox', { name: 'Nested mode input' })).borderRadius
    ).toBe('19px')
    await expect(
      view.getComputedStyle(within(canvas.getByTestId('reset')).getByRole('button')).borderRadius
    ).toBe('8px')
    const rem = parseFloat(
      view.getComputedStyle(canvasElement.ownerDocument.documentElement).fontSize
    )
    for (const [size, height] of [
      ['small', 2],
      ['medium', 2.5],
      ['large', 3]
    ] as const)
      await expect(parseFloat(style(`size-${size}`).minHeight)).toBeCloseTo(
        rem * height * args.density,
        2
      )
    const card = canvasElement.querySelector('[data-slot="card"]')!
    await expect(parseFloat(view.getComputedStyle(card).padding)).toBeCloseTo(
      rem * 1.5 * args.spacing,
      2
    )
    await expect(view.getComputedStyle(card).borderRadius).toBe(`${args.surfaceRadius}px`)
    const trigger = canvas.getByRole('button', { name: 'Edit profile' })
    await userEvent.click(trigger)
    const dialog = canvas.getByRole('dialog', { name: 'Profile preferences' })
    await expect(view.getComputedStyle(dialog).borderRadius).toBe(`${args.surfaceRadius}px`)
    await expect(parseFloat(view.getComputedStyle(dialog).padding)).toBeCloseTo(
      rem * 1.5 * args.spacing,
      2
    )
    await expect(view.getComputedStyle(dialog, '::backdrop').backgroundColor).toMatch(/0\.(55|75)/)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save profile' }))
    await expect(within(dialog).getByRole('alert')).toHaveTextContent('Enter an email.')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await expect(trigger).toHaveFocus()
    await userEvent.click(canvas.getByText('Privacy', { exact: true }))
    await userEvent.click(canvas.getByText('Data retention', { exact: true }))
    await expect(
      canvas.getByText('Profile preferences stay until you change or reset them.')
    ).toBeVisible()
  }
}
