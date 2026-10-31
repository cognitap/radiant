import { useId, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { SaveChanges } from '../.storybook/examples/ButtonExamples.js'
import { MotionProvider } from './motion/react.js'
import {
  Button,
  Checkbox,
  Field,
  Input,
  Textarea,
  type ButtonProps,
  type ButtonRenderProps
} from './index.js'

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Continue', disabled: false, onClick: fn() },
  render: args => (
    <MotionProvider>
      <Button {...args} />
    </MotionProvider>
  ),
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'inline-radio', options: ['solid', 'soft', 'outline', 'ghost'] },
    tone: { control: 'inline-radio', options: ['accent', 'neutral', 'warning', 'danger'] },
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    iconOnly: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    disabled: { control: 'boolean' },
    pending: { control: 'boolean' },
    motion: { control: 'inline-radio', options: ['inherit', 'off'] },
    pressed: { control: false },
    defaultPressed: { control: false },
    onPressedChange: { control: false },
    render: { control: false }
  }
} satisfies Meta<typeof Button>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const SavingWorkspace: Story = { render: args => <SaveChanges {...args} /> }

function Formatting({ controlSize, disabled, pending, motion }: ButtonProps) {
  const [bold, setBold] = useState(false),
    [italic, setItalic] = useState(true)
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="outline"
            controlSize={controlSize}
            disabled={disabled}
            pending={pending}
            motion={motion}
            iconOnly
            aria-label="Bold"
            pressed={bold}
            onPressedChange={setBold}
          >
            <strong>B</strong>
          </Button>
          <Button
            variant="outline"
            controlSize={controlSize}
            disabled={disabled}
            pending={pending}
            motion={motion}
            iconOnly
            aria-label="Italic"
            defaultPressed
            onPressedChange={setItalic}
          >
            <em>I</em>
          </Button>
        </div>
        <Field label="Draft">
          <Textarea
            defaultValue="Make the next step clear."
            style={{ fontWeight: bold ? 700 : 400, fontStyle: italic ? 'italic' : 'normal' }}
          />
        </Field>
      </div>
    </MotionProvider>
  )
}
export const FormattingText: Story = {
  render: args => <Formatting {...args} />,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement),
      bold = canvas.getByRole('button', { name: 'Bold' }),
      italic = canvas.getByRole('button', { name: 'Italic' })
    await expect(bold).toHaveAttribute('aria-pressed', 'false')
    await expect(italic).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(bold)
    await expect(bold).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(italic)
    await expect(italic).toHaveAttribute('aria-pressed', 'false')
    await expect(canvas.getByRole('textbox', { name: 'Draft' })).toHaveValue(
      'Make the next step clear.'
    )
  }
}
function Bookmark({ pending, disabled, ...args }: ButtonProps) {
  const [syncing, setSyncing] = useState(false),
    [saved, setSaved] = useState(false)
  return (
    <MotionProvider>
      <article
        style={{
          display: 'grid',
          gap: '1rem',
          width: 'min(26rem, calc(100vw - 2rem))',
          maxWidth: '100%'
        }}
      >
        <h3 style={{ margin: 0 }}>Designing a quieter workspace</h3>
        <p style={{ margin: 0 }}>Save this article to your reading list.</p>
        <Button
          {...args}
          disabled={disabled}
          pending={pending || syncing}
          fullWidth
          defaultPressed={false}
          pressed={undefined}
          aria-pressed={undefined}
          onPressedChange={setSaved}
        >
          Bookmark article
        </Button>
        <output aria-live="polite">
          {saved ? 'Saved to your reading list.' : 'Article is not bookmarked.'}
        </output>
        <Checkbox
          label="Sync in progress"
          checked={syncing}
          onChange={event => setSyncing(event.target.checked)}
        />
      </article>
    </MotionProvider>
  )
}
export const SavingForLater: Story = {
  render: args => <Bookmark {...args} />,
  args: { variant: 'soft' }
}
function ConsumerButton({ children, ...props }: ButtonRenderProps) {
  return <button {...props}>{children}</button>
}
function Exporting(args: ButtonProps) {
  const id = useId(),
    ref = useRef<HTMLButtonElement>(null),
    [result, setResult] = useState('No export requested.')
  return (
    <MotionProvider>
      <div
        style={{
          display: 'grid',
          gap: '1rem',
          width: 'min(26rem, calc(100vw - 2rem))',
          maxWidth: '100%'
        }}
      >
        <form
          id={id}
          onSubmit={event => {
            event.preventDefault()
            const data = new FormData(
              event.currentTarget,
              (event.nativeEvent as SubmitEvent).submitter
            )
            setResult(`Requested ${data.get('intent')}.`)
          }}
        />
        <Button
          {...args}
          ref={ref}
          form={id}
          type="submit"
          name="intent"
          value="report export"
          fullWidth
          style={{ '--rad-button-radius': '999px', ...args.style }}
          render={props => <ConsumerButton {...props} />}
        >
          Export the current report for your team
        </Button>
        <Button
          variant="ghost"
          onClick={() => ref.current?.focus()}
        >
          Focus export action
        </Button>
        <output aria-live="polite">{result}</output>
      </div>
    </MotionProvider>
  )
}
export const ExportingThroughAnAdapter: Story = {
  render: args => <Exporting {...args} />,
  args: { variant: 'outline', tone: 'neutral' }
}
function MuteNotifications({ controlSize, tone, disabled, pending, motion }: ButtonProps) {
  const [muted, setMuted] = useState(false)
  return (
    <MotionProvider>
      <div style={{ display: 'grid', gap: '1rem', width: 'min(26rem, calc(100vw - 2rem))' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Button
            variant="outline"
            tone={tone}
            controlSize={controlSize}
            disabled={disabled}
            pending={pending}
            motion={motion}
            pressed={muted}
            onPressedChange={setMuted}
          >
            Mute notifications
          </Button>
          <Button
            variant="ghost"
            disabled={!muted}
            onClick={() => setMuted(false)}
          >
            Resume all
          </Button>
        </div>
        <output aria-live="polite">
          {muted ? 'Notifications are muted.' : 'Notifications are on.'}
        </output>
      </div>
    </MotionProvider>
  )
}
export const Controlled: Story = {
  render: args => <MuteNotifications {...args} />,
  play: async ({ canvasElement, args, userEvent }) => {
    if (args.disabled || args.pending) return
    const canvas = within(canvasElement),
      mute = canvas.getByRole('button', { name: 'Mute notifications' })
    await userEvent.click(mute)
    await expect(mute).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(canvas.getByRole('button', { name: 'Resume all' }))
    await expect(mute).toHaveAttribute('aria-pressed', 'false')
    await expect(canvas.getByRole('status')).toHaveTextContent('Notifications are on.')
  }
}
export const SharedControlSizes: Story = {
  argTypes: { controlSize: { control: false, table: { disable: true } } },
  render: ({ controlSize: _size, ...args }) => (
    <MotionProvider>
      <div style={{ display: 'grid', gap: '1rem', width: 'min(28rem, calc(100vw - 2rem))' }}>
        {(['small', 'medium', 'large'] as const).map(size => (
          <div
            key={size}
            style={{ display: 'flex', alignItems: 'end', gap: '0.5rem' }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <Field label={`${size} search`}>
                <Input
                  type="search"
                  controlSize={size}
                />
              </Field>
            </div>
            <Button
              {...args}
              controlSize={size}
            >
              Search
            </Button>
          </div>
        ))}
      </div>
    </MotionProvider>
  )
}
