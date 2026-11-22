import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { AnnotatedText, type AnnotatedTextProps } from '../../index.js'

const meta = {
  title: 'Components/AnnotatedText',
  component: AnnotatedText,
  parameters: {
    docs: {
      description: {
        component:
          'Text split into `tokens`, with tagged `spans`, stacked token `labels` and `arcs` between tokens. Spans may overlap and nest; each takes a lane and a series color. Arcs are measured from the token boxes and redrawn when the text wraps, resizes or changes direction; an arc across a wrap leaves toward the line end and enters from the next line start. One token is in the tab order; arrow keys, Home and End move between tokens, and each token announces its text, labels, spans and arcs.'
      }
    }
  }
} satisfies Meta<typeof AnnotatedText>

export default meta
type Story = StoryObj<typeof meta>

const review: AnnotatedTextProps = {
  'aria-label': 'Review of the retry call',
  tokens: [
    { text: 'const', labels: ['keyword'] },
    { text: 'delay', labels: ['binding'] },
    { text: '=', labels: ['operator'] },
    { text: 'retry', labels: ['call'] },
    { text: '(', labels: [] },
    { text: 'attempts', labels: ['argument'] },
    { text: ')', labels: [] }
  ],
  spans: [
    { start: 0, end: 6, label: 'Statement', series: 1 },
    { start: 3, end: 6, label: 'Call', series: 2 },
    { start: 5, end: 5, label: 'Unchecked', series: 8 }
  ],
  arcs: [
    { from: 1, to: 3, label: 'assigned from' },
    { from: 5, to: 3, label: 'passed to', series: 2 }
  ]
}

const sentence: AnnotatedTextProps = {
  'aria-label': 'Labelled sentence',
  tokens: [
    { text: 'The', labels: ['determiner'] },
    { text: 'committee', labels: ['noun', 'subject head'] },
    { text: 'approved', labels: ['verb'] },
    { text: 'the', labels: ['determiner'] },
    { text: 'revised', labels: ['adjective'] },
    { text: 'budget', labels: ['noun', 'object head'] },
    { text: 'on', labels: ['preposition'] },
    { text: 'Friday', labels: ['noun'] }
  ],
  spans: [
    { start: 0, end: 1, label: 'Organization', series: 1 },
    { start: 3, end: 5, label: 'Document', series: 3 },
    { start: 4, end: 5, label: 'Changed item', series: 4 },
    { start: 5, end: 7, label: 'Overlap', series: 7 },
    { start: 7, end: 7, label: 'Date', series: 6 }
  ],
  arcs: [
    { from: 2, to: 1, label: 'agent' },
    { from: 2, to: 5, label: 'theme' },
    { from: 2, to: 7, label: 'time' },
    { from: 5, to: 4, label: 'modifier', series: 4 }
  ]
}

const rtl: AnnotatedTextProps = {
  'aria-label': 'Annotated Hebrew sentence',
  tokens: [
    { text: 'הוועדה', labels: ['noun'] },
    { text: 'אישרה', labels: ['verb'] },
    { text: 'את', labels: ['particle'] },
    { text: 'התקציב', labels: ['noun'] },
    { text: 'ביום', labels: ['noun'] },
    { text: 'שישי', labels: ['adjective'] }
  ],
  spans: [
    { start: 0, end: 0, label: 'Organization', series: 1 },
    { start: 2, end: 3, label: 'Document', series: 3 },
    { start: 4, end: 5, label: 'Date', series: 6 }
  ],
  arcs: [
    { from: 1, to: 0, label: 'agent' },
    { from: 1, to: 3, label: 'theme' },
    { from: 1, to: 5, label: 'time' }
  ]
}

export const Default: Story = {
  args: review,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const token = canvas.getByRole('listitem', { name: 'delay' })
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    await expect(token).toHaveFocus()
    await expect(token).toHaveAccessibleDescription(
      'binding. Statement. delay → retry: assigned from'
    )
  }
}

function Widths(props: AnnotatedTextProps) {
  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {['360px', '720px'].map(width => (
        <div
          key={width}
          style={{ width, maxWidth: '100%' }}
        >
          <AnnotatedText
            {...props}
            aria-label={`${props['aria-label']} at ${width}`}
          />
        </div>
      ))}
    </div>
  )
}

export const OverlappingSpans: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Nested spans sit nearer the text than the spans around them, and overlapping spans take separate lanes. The same text at 360px and 720px: spans and arcs follow the wrap.'
      }
    }
  },
  args: sentence,
  render: args => <Widths {...args} />
}

export const RightToLeft: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tokens, spans and arcs follow the reading direction set by `dir` or `LocaleProvider`.'
      }
    }
  },
  args: rtl,
  render: args => (
    <div
      dir="rtl"
      lang="he"
    >
      <Widths {...args} />
    </div>
  )
}

export const LabelsOnly: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Stacked labels without spans or arcs, such as a type and a value under each field.'
      }
    }
  },
  args: {
    'aria-label': 'Request log line',
    tokens: [
      { text: '12:04:31', labels: ['time', 'UTC'] },
      { text: 'GET', labels: ['method'] },
      { text: '/orders/1042', labels: ['path', 'order 1042'] },
      { text: '200', labels: ['status', 'OK'] },
      { text: '84ms', labels: ['duration'] }
    ]
  }
}
