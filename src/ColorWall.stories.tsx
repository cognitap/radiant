import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { generateColorWall, type ColorWallInput } from './color/index.js'

function ColorWallPreview(input: ColorWallInput) {
  const wall = generateColorWall(input)
  return (
    <section
      aria-label="Generated color wall"
      style={{ maxWidth: '72rem' }}
    >
      <h2>Brand {wall.color.brand.value}</h2>
      <p>
        {wall.color.fidelity === 'anchored'
          ? `Exact original at Brand ${wall.color.anchor!.stop}; neighboring shades reshape around it.`
          : 'Regular brand ramp; the original is retained separately.'}{' '}
        These are palette swatches; semantic role mapping is separate.
      </p>
      <section
        aria-label="Scrollable color swatches"
        style={{ overflowX: 'auto' }}
      >
        <div style={{ display: 'grid', gap: '0.375rem', minWidth: '42rem' }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: '6rem repeat(11, 1fr)', gap: '0.25rem' }}
          >
            <span>Family</span>
            {wall.color.palettes[0].swatches.map(s => (
              <span key={s.stop}>{s.stop}</span>
            ))}
          </div>
          {wall.color.palettes.map(palette => (
            <div
              key={palette.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '6rem repeat(11, 1fr)',
                gap: '0.25rem'
              }}
            >
              <span>{palette.name}</span>
              {palette.swatches.map(swatch => (
                <img
                  key={swatch.stop}
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E"
                  alt={`${palette.name} ${swatch.stop}: ${swatch.value}`}
                  title={`${palette.name} ${swatch.stop}: ${swatch.value}`}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '2rem',
                    borderRadius: '0.25rem',
                    backgroundColor: swatch.value
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </section>
      <p>
        Vividness {wall.input.vividness.toFixed(3)} ·{' '}
        {wall.neutralInput
          ? `Neutral source; explicit hue ${wall.input.neutralHue}°.`
          : 'Chromatic source.'}
      </p>
    </section>
  )
}

const meta = {
  title: 'System/Color Wall',
  component: ColorWallPreview,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Framework-neutral sRGB generator inspection. Choose the accepted reference inputs using Controls. The public workshop editor is separate documentation-app work.'
      }
    }
  },
  args: {
    brand: '#7C3AED',
    fidelity: 'anchored',
    lightness: 'hue-aware',
    distribution: 1,
    wallPreset: 'balanced',
    rampPreset: 'balanced',
    neutralHue: 255
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
    },
    wallPreset: { control: 'select', options: ['classic', 'balanced', 'expressive'] },
    rampPreset: { control: 'select', options: ['classic', 'balanced', 'expressive'] },
    brandVividness: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    fidelity: { control: 'select', options: ['anchored', 'unanchored'] },
    lightness: { control: 'select', options: ['hue-aware', 'shared'] },
    vividness: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    distribution: { control: { type: 'range', min: 0.75, max: 1.35, step: 0.05 } },
    neutralTint: { control: { type: 'range', min: 0, max: 0.035, step: 0.001 } },
    hueAlignment: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    neutralHue: { control: { type: 'range', min: 0, max: 359, step: 1 } }
  }
} satisfies Meta<typeof ColorWallPreview>
export default meta
type Story = StoryObj<typeof meta>
export const Reference: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('img')).toHaveLength(198)
    if (args.fidelity === 'anchored') {
      const anchor = canvas.getByRole('img', {
        name: new RegExp(`^Brand [0-9]+: ${args.brand}$`, 'i')
      })
      const rgb = [1, 3, 5].map(i => parseInt(args.brand.slice(i, i + 2), 16)).join(', ')
      await expect(
        canvasElement.ownerDocument.defaultView!.getComputedStyle(anchor).backgroundColor
      ).toBe(`rgb(${rgb})`)
    }
  }
}
