import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { Button, Field, FileInput, type FileInputProps } from './index.js'

type FileInputStoryArgs = Pick<
  FileInputProps,
  | 'controlSize'
  | 'dir'
  | 'disabled'
  | 'accept'
  | 'chooseLabel'
  | 'emptyText'
  | 'className'
  | 'style'
> & { invalid?: boolean; required?: boolean }

const width = { width: 'min(28rem,calc(100vw - 2rem))', maxWidth: '100%', minWidth: 0 }

const meta = {
  title: 'Components/FileInput',
  args: {
    controlSize: 'medium',
    dir: 'ltr',
    disabled: false,
    required: false,
    invalid: false,
    accept: '.pdf,.txt'
  },
  argTypes: {
    controlSize: { control: 'inline-radio', options: ['small', 'medium', 'large'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    invalid: { control: 'boolean' },
    accept: { control: 'text' },
    chooseLabel: { control: 'text' },
    emptyText: { control: 'text' },
    className: { control: 'text' },
    style: { control: 'object' }
  }
} satisfies Meta<FileInputStoryArgs>
export default meta
type Story = StoryObj<FileInputStoryArgs>

export const Default: Story = {
  render: ({ invalid, ...props }) => (
    <div style={width}>
      <FileInput
        {...props}
        aria-label="Consent form"
        aria-invalid={invalid || undefined}
        name="consent"
      />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    if (args.disabled) return
    const c = within(canvasElement)
    await userEvent.upload(
      c.getByLabelText('Consent form'),
      new File(['signed'], 'consent.pdf', { type: 'application/pdf' })
    )
    await expect(c.getByText('consent.pdf')).toBeVisible()
  }
}

export const WithField: Story = {
  render: ({ disabled, invalid, required, ...props }) => (
    <div style={width}>
      <Field
        label="Consent form"
        description="Upload the signed PDF."
        disabled={disabled}
        required={required}
        error={invalid ? 'Attach the signed consent form.' : undefined}
      >
        <FileInput
          {...props}
          name="consent"
        />
      </Field>
    </div>
  )
}

export const Multiple: Story = {
  args: { accept: '.txt,.csv' },
  render: ({ disabled, invalid, required, ...props }) => (
    <div style={width}>
      <Field
        label="Interview transcripts"
        description="Choose every transcript from the session."
        disabled={disabled}
        required={required}
        error={invalid ? 'Attach at least one transcript.' : undefined}
      >
        <FileInput
          {...props}
          name="transcripts"
          multiple
        />
      </Field>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    if (args.disabled) return
    const c = within(canvasElement)
    await userEvent.upload(c.getByLabelText(/^Interview transcripts/), [
      new File(['a'], 'session-1.txt', { type: 'text/plain' }),
      new File(['b'], 'session-2.txt', { type: 'text/plain' })
    ])
    await expect(c.getByText('session-1.txt, session-2.txt')).toBeVisible()
  }
}

function SubmitConsentForm({ disabled, invalid, required = true, ...props }: FileInputStoryArgs) {
  const [message, setMessage] = useState('Choose the signed form, then submit.')
  return (
    <form
      style={{ display: 'grid', gap: '1rem', ...width }}
      onSubmit={event => {
        event.preventDefault()
        const consent = event.currentTarget.elements.namedItem('consent') as HTMLInputElement
        setMessage(`Ready to upload ${consent.files?.[0]?.name}.`)
      }}
      onReset={() => setMessage('Form cleared.')}
    >
      <Field
        label="Consent form"
        disabled={disabled}
        required={required}
        error={invalid ? 'Attach the signed consent form.' : undefined}
      >
        <FileInput
          {...props}
          name="consent"
        />
      </Field>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
        <Button
          type="submit"
          disabled={disabled}
        >
          Submit
        </Button>
        <Button
          type="reset"
          variant="outline"
          disabled={disabled}
        >
          Clear
        </Button>
      </div>
      <output aria-live="polite">{message}</output>
    </form>
  )
}

export const InNativeForm: Story = {
  render: args => <SubmitConsentForm {...args} />,
  play: async ({ canvasElement, args }) => {
    if (args.disabled) return
    const c = within(canvasElement)
    await userEvent.upload(
      c.getByLabelText(/^Consent form/),
      new File(['signed'], 'consent.pdf', { type: 'application/pdf' })
    )
    await userEvent.click(c.getByRole('button', { name: 'Submit' }))
    await expect(c.getByRole('status')).toHaveTextContent('Ready to upload consent.pdf.')
  }
}

export const SharedControlSizes: Story = {
  argTypes: { controlSize: { control: false, table: { disable: true } } },
  render: ({ invalid: _invalid, required: _required, controlSize: _size, ...props }) => (
    <div style={{ display: 'grid', gap: '1rem', ...width }}>
      {(['small', 'medium', 'large'] as const).map(size => (
        <div
          key={size}
          style={{ display: 'flex', alignItems: 'end', gap: '.5rem' }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <Field label={`${size} attachment`}>
              <FileInput
                {...props}
                controlSize={size}
              />
            </Field>
          </div>
          <Button controlSize={size}>Upload</Button>
        </div>
      ))}
    </div>
  )
}
