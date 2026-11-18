import type { Meta, StoryObj } from '@storybook/react-vite'
import { MatchCommand, MatchDestination } from '../../../.storybook/examples/HighlightExamples.js'
import { Highlight } from './Highlight.js'

const meta = {
  title: 'Components/Highlight',
  component: Highlight,
  args: { text: 'The café is beside the east entrance.', query: 'cafe', ignoreDiacritics: true }
} satisfies Meta<typeof Highlight>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const FindADestination: Story = { render: () => <MatchDestination /> }
export const FindAWorkspaceCommand: Story = { render: () => <MatchCommand /> }

export const FindAnExactIdentifier: Story = {
  args: {
    text: 'Use API_KEY in production and api_key in local fixtures.',
    query: 'API_KEY',
    caseSensitive: true
  }
}
