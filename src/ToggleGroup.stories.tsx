import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import {
  ToggleGroup,
  ToggleGroupItem,
  Button,
  Checkbox,
  Field,
  Textarea,
  type ToggleGroupProps
} from './index.js'
import { MotionProvider } from './motion/react.js'

type Options = Pick<
  ToggleGroupProps,
  'orientation' | 'loop' | 'disabled' | 'controlSize' | 'motion' | 'variant'
>
const meta = {
  title: 'Components/ToggleGroup',
  component: ToggleGroup,
  args: {
    'aria-label': 'Text alignment',
    orientation: 'horizontal',
    loop: true,
    disabled: false,
    controlSize: 'medium',
    motion: 'inherit',
    variant: 'buttons'
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    variant: { control: 'inline-radio', options: ['buttons', 'segmented'] },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    motion: { control: 'inline-radio', options: ['inherit', 'off'] },
    loop: { control: 'boolean' },
    disabled: { control: 'boolean' },
    value: { control: false },
    defaultValue: { control: false },
    type: { control: false },
    onValueChange: { control: false }
  },
  render: args => <Alignment {...args} />
} satisfies Meta<typeof ToggleGroup>
export default meta
type Story = StoryObj<typeof meta>
const fixed = { parameters: { controls: { disable: true } } }
function AlignmentItems() {
  return (
    <>
      <ToggleGroupItem value="left">Left</ToggleGroupItem>
      <ToggleGroupItem value="center">Center</ToggleGroupItem>
      <ToggleGroupItem value="right">Right</ToggleGroupItem>
    </>
  )
}
function Alignment(options: Options) {
  return (
    <ToggleGroup
      {...options}
      aria-label="Text alignment"
      defaultValue="left"
    >
      <AlignmentItems />
    </ToggleGroup>
  )
}
export const Default: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement),
      center = canvas.getByRole('button', { name: 'Center' })
    await userEvent.click(center)
    await expect(center).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole('button', { name: 'Left' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  }
}
function ControlledAlignment(options: Options) {
  const [alignment, setAlignment] = useState<string | null>('left')
  return (
    <div
      style={{
        display: 'grid',
        gap: '1rem',
        width: 'min(28rem, calc(100vw - 2rem))',
        maxWidth: '100%'
      }}
    >
      <ToggleGroup
        {...options}
        aria-label="Text alignment"
        value={alignment}
        onValueChange={setAlignment}
      >
        <AlignmentItems />
      </ToggleGroup>
      <p
        style={{
          margin: 0,
          textAlign: alignment === 'center' ? 'center' : alignment === 'right' ? 'right' : 'left'
        }}
      >
        Related actions share one tab stop. Choose where this paragraph starts.
      </p>
    </div>
  )
}
export const Controlled: Story = {
  render: args => <ControlledAlignment {...args} />,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement),
      right = canvas.getByRole('button', { name: 'Right' })
    await userEvent.click(right)
    await expect(right).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByText(/Choose where this paragraph starts/)).toHaveStyle({
      textAlign: 'right'
    })
  }
}
export const SharedControlSizes: Story = {
  ...fixed,
  render: () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {(['small', 'medium', 'large'] as const).map(controlSize => (
        <div
          key={controlSize}
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}
        >
          <ToggleGroup
            aria-label={`Text alignment, ${controlSize}`}
            controlSize={controlSize}
            defaultValue="left"
          >
            <AlignmentItems />
          </ToggleGroup>
          <ToggleGroup
            aria-label={`Record view, ${controlSize}`}
            controlSize={controlSize}
            variant="segmented"
            defaultValue="list"
          >
            <ToggleGroupItem value="list">List</ToggleGroupItem>
            <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
          </ToggleGroup>
          <Button
            controlSize={controlSize}
            variant="outline"
            tone="neutral"
          >
            Reset
          </Button>
        </div>
      ))}
    </div>
  )
}
function Formatting({ variant: _variant, ...options }: Options) {
  const [styles, setStyles] = useState(['bold'])
  return (
    <MotionProvider>
      <div
        style={{
          display: 'grid',
          gap: '1rem',
          width: 'min(30rem, calc(100vw - 2rem))',
          maxWidth: '100%'
        }}
      >
        <ToggleGroup
          {...options}
          aria-label="Note formatting"
          type="multiple"
          defaultValue={['bold']}
          onValueChange={setStyles}
        >
          <ToggleGroupItem value="bold">
            <strong>Bold</strong>
          </ToggleGroupItem>
          <ToggleGroupItem value="italic">
            <em>Italic</em>
          </ToggleGroupItem>
          <ToggleGroupItem value="strike">Strikethrough</ToggleGroupItem>
        </ToggleGroup>
        <Field label="Note">
          <Textarea
            defaultValue="Keep the useful details."
            style={{
              fontWeight: styles.includes('bold') ? 700 : 400,
              fontStyle: styles.includes('italic') ? 'italic' : 'normal',
              textDecoration: styles.includes('strike') ? 'line-through' : 'none'
            }}
          />
        </Field>
      </div>
    </MotionProvider>
  )
}
export const FormattingANote: Story = {
  render: args => <Formatting {...args} />,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement),
      italic = canvas.getByRole('button', { name: 'Italic' })
    await userEvent.click(italic)
    await expect(italic).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole('button', { name: 'Bold' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  }
}
function Views({ variant: _variant, ...options }: Options) {
  const [view, setView] = useState<string | null>('list')
  return (
    <MotionProvider>
      <div
        style={{
          display: 'grid',
          gap: '1rem',
          width: 'min(30rem, calc(100vw - 2rem))',
          maxWidth: '100%'
        }}
      >
        <ToggleGroup
          {...options}
          aria-label="Record view"
          variant="segmented"
          defaultValue="list"
          onValueChange={setView}
          parts={{ indicator: { style: { '--rad-toggle-group-indicator-radius': '999px' } } }}
          style={{ '--rad-toggle-group-radius': '999px' }}
        >
          <ToggleGroupItem value="list">List</ToggleGroupItem>
          <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
          <ToggleGroupItem
            value="timeline"
            disabled
          >
            Timeline
          </ToggleGroupItem>
        </ToggleGroup>
        {view ? (
          <ul
            aria-label="Project records"
            style={{
              margin: 0,
              padding: '1rem',
              display: view === 'grid' ? 'grid' : 'block',
              gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
              gap: '1rem'
            }}
          >
            {['Website', 'Mobile app', 'Documentation', 'Research'].map(name => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        ) : (
          <p>Choose a record view.</p>
        )}
      </div>
    </MotionProvider>
  )
}
export const SwitchingRecordViews: Story = { render: args => <Views {...args} /> }
function Filtering({ variant: _variant, ...options }: Options) {
  const [filter, setFilter] = useState<string | null>('all'),
    [allow, setAllow] = useState(false),
    [request, setRequest] = useState('No filter requested.'),
    [rtl, setRtl] = useState(false),
    ref = useRef<HTMLDivElement>(null)
  return (
    <MotionProvider>
      <div
        style={{
          display: 'grid',
          gap: '1rem',
          width: 'min(30rem, calc(100vw - 2rem))',
          maxWidth: '100%'
        }}
      >
        <ToggleGroup
          {...options}
          ref={ref}
          dir={rtl ? 'rtl' : 'ltr'}
          aria-label="Project filter"
          value={filter}
          onValueChange={next => {
            setRequest(`Requested ${next ?? 'no filter'}.`)
            if (allow) setFilter(next)
          }}
          style={{ '--rad-toggle-group-gap': '0.5rem' }}
        >
          <ToggleGroupItem value="all">All projects</ToggleGroupItem>
          <ToggleGroupItem value="active">Active</ToggleGroupItem>
          <ToggleGroupItem value="archived">Archived</ToggleGroupItem>
        </ToggleGroup>
        <output aria-live="polite">{request}</output>
        <p style={{ margin: 0 }}>Showing {filter ?? 'unfiltered'} projects.</p>
        <Checkbox
          label="Apply filter requests"
          checked={allow}
          onChange={event => setAllow(event.target.checked)}
        />
        <Checkbox
          label="Right-to-left layout"
          checked={rtl}
          onChange={event => setRtl(event.target.checked)}
        />
        <Button
          variant="ghost"
          onClick={() =>
            ref.current?.querySelector<HTMLButtonElement>('button[tabindex="0"]')?.focus()
          }
        >
          Focus project filter
        </Button>
      </div>
    </MotionProvider>
  )
}
export const ReviewingFilterRequests: Story = { render: args => <Filtering {...args} /> }
