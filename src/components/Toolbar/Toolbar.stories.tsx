import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuPortal,
  MenuTrigger,
  Separator,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  type ToolbarProps
} from '../../index.js'
import { MotionProvider } from '../../motion/react.js'

type ToolbarOptions = Pick<ToolbarProps, 'orientation' | 'dir' | 'loop'>

const meta = {
  title: 'Components/Toolbar',
  component: Toolbar,
  args: { 'aria-label': 'Formatting', orientation: 'horizontal', dir: 'ltr', loop: true },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    loop: { control: 'boolean' }
  },
  parameters: { controls: { include: ['orientation', 'dir', 'loop'] } }
} satisfies Meta<typeof Toolbar>

export default meta
type Story = StoryObj<typeof meta>

const layout = { display: 'grid', gap: '1rem', maxWidth: '100%' }

function FormatText(options: ToolbarOptions) {
  const [format, setFormat] = useState<string[]>([])

  return (
    <MotionProvider>
      <div style={layout}>
        <Toolbar
          {...options}
          aria-label="Formatting"
        >
          <Button
            variant="outline"
            disabled={format.length === 0}
            onClick={() => setFormat([])}
          >
            Clear
          </Button>
          <Separator
            decorative
            orientation={options.orientation === 'vertical' ? 'horizontal' : 'vertical'}
          />
          <ToggleGroup
            aria-label="Text style"
            orientation={options.orientation}
            type="multiple"
            value={format}
            onValueChange={setFormat}
          >
            <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
            <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
          </ToggleGroup>
        </Toolbar>
        <p
          style={{
            margin: 0,
            fontWeight: format.includes('bold') ? 700 : 400,
            fontStyle: format.includes('italic') ? 'italic' : 'normal'
          }}
        >
          Project notes
        </p>
      </div>
    </MotionProvider>
  )
}

export const Default: Story = {
  render: ({ orientation, dir, loop }) => <FormatText {...{ orientation, dir, loop }} />,
  play: async ({ canvasElement, userEvent, args, step }) => {
    const toolbar = within(canvasElement).getByRole('toolbar', { name: 'Formatting' })
    const { getByRole } = within(toolbar)
    const bold = getByRole('button', { name: 'Bold' })
    const italic = getByRole('button', { name: 'Italic' })
    const clear = getByRole('button', { name: 'Clear' })
    const next =
      args.orientation === 'vertical'
        ? 'ArrowDown'
        : args.dir === 'rtl'
          ? 'ArrowLeft'
          : 'ArrowRight'

    await step('Arrow keys move focus without applying formatting', async () => {
      await expect(clear).toBeDisabled()
      await expect(bold).toHaveAttribute('tabindex', '0')
      bold.focus()
      await userEvent.keyboard(`{${next}}`)
      await expect(italic).toHaveFocus()
      await expect(italic).toHaveAttribute('aria-pressed', 'false')
    })
    await step('Space toggles the focused action', async () => {
      await userEvent.keyboard(' ')
      await expect(italic).toHaveAttribute('aria-pressed', 'true')
      await expect(clear).toBeEnabled()
      await userEvent.click(clear)
      await expect(italic).toHaveAttribute('aria-pressed', 'false')
    })
  }
}

function ZoomActions(options: ToolbarOptions) {
  const [zoom, setZoom] = useState(100)

  return (
    <MotionProvider>
      <div style={layout}>
        <Toolbar
          {...options}
          aria-label="Zoom actions"
        >
          <Button
            variant="outline"
            onClick={() => setZoom(value => value + 10)}
          >
            Zoom in
          </Button>
          <Menu>
            <MenuTrigger variant="outline">Presets</MenuTrigger>
            <MenuPortal>
              <MenuContent>
                <MenuItem onSelect={() => setZoom(100)}>100%</MenuItem>
                <MenuItem onSelect={() => setZoom(200)}>200%</MenuItem>
              </MenuContent>
            </MenuPortal>
          </Menu>
        </Toolbar>
        <output>{zoom}%</output>
      </div>
    </MotionProvider>
  )
}

export const WithMenu: Story = {
  args: { 'aria-label': 'Zoom actions' },
  render: ({ orientation, dir, loop }) => <ZoomActions {...{ orientation, dir, loop }} />
}
