import type { Meta, StoryObj } from '@storybook/react-vite'
import { Fragment } from 'react'
import { Highlight } from './Highlight.js'

const meta = {
  title: 'Components/Highlight',
  component: Highlight,
  args: {
    text: 'The café is beside the east entrance.',
    query: 'cafe',
    ignoreDiacritics: true,
    caseSensitive: false
  },
  argTypes: {
    text: { control: 'text' },
    query: { control: 'text' }
  }
} satisfies Meta<typeof Highlight>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

const positions = [
  { label: 'Whole word', text: 'Turn the light off.' },
  { label: 'Middle', text: 'Adjust the backlighting.' },
  { label: 'Prefix', text: 'Follow the lighthouse.' },
  { label: 'Suffix', text: 'Wait for daylight.' }
]

export const MatchPositions: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <dl
      style={{
        display: 'grid',
        gridTemplateColumns: 'max-content minmax(0, 1fr)',
        gap: '0.5rem 0.75rem',
        margin: 0
      }}
    >
      {positions.map(({ label, text }) => (
        <Fragment key={label}>
          <dt>{label}</dt>
          <dd style={{ margin: 0 }}>
            <Highlight
              text={text}
              query="light"
            />
          </dd>
        </Fragment>
      ))}
    </dl>
  )
}
