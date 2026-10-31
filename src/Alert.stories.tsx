import type { Meta, StoryObj } from '@storybook/react-vite'
import { Alert, AlertTitle, AlertDescription } from './index.js'
import {
  AlertTonesExample,
  AlertActionExample,
  AlertAnnouncementsExample
} from '../.storybook/examples/AlertExamples.js'
const meta = {
  title: 'Components/Alert',
  component: Alert,
  parameters: {
    docs: {
      description: {
        component:
          'Inline feedback with independent tone and urgency. Static content is ordinary content by default (announce=off). Polite feedback uses role=status; assertive feedback uses role=alert, relying on their implicit live/atomic semantics. Keep a live region mounted before updating its message. Alert never steals focus, dismisses itself or replays unchanged text. Applications own meaningful messages, optional names, recovery actions and announcement frequency. Use explicit text for success/warning/error meaning; color is supplementary. Named static content becomes a group. Choose AlertTitle level for the surrounding outline; parts forward native props, styles and refs.'
      }
    }
  }
} satisfies Meta<typeof Alert>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  args: { tone: 'neutral', announce: 'off' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'accent', 'warning', 'danger'] },
    announce: { control: 'inline-radio', options: ['off', 'polite', 'assertive'] }
  },
  render: args => (
    <Alert {...args}>
      <AlertTitle>Scheduled maintenance</AlertTitle>
      <AlertDescription>
        Editing is available. Publishing pauses while maintenance runs.
      </AlertDescription>
    </Alert>
  )
}
export const Tones: Story = { render: () => <AlertTonesExample /> }
export const WithAction: Story = { render: () => <AlertActionExample /> }
export const Announcements: Story = { render: () => <AlertAnnouncementsExample /> }
export const Customisation: Story = {
  render: () => (
    <Alert
      style={{
        '--rad-alert-radius': '1.5rem',
        '--rad-alert-padding': '2rem',
        '--rad-alert-title-size': '1.5rem'
      }}
    >
      <AlertTitle level={3}>A quieter notice</AlertTitle>
      <AlertDescription>A local treatment with the same content semantics.</AlertDescription>
    </Alert>
  )
}
