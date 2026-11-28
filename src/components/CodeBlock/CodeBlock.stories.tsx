import type { Meta, StoryObj } from '@storybook/react-vite'
import { MotionProvider } from '../../motion/react.js'
import { CodeBlock, CodeBlockCopy, CodeBlockHeader, CodeBlockViewport } from './CodeBlock.js'

const code = `export function greet(name: string): string {
  return 'Hello, ' + name + '!'
}

console.log(greet('Radiant'))`

const meta = {
  title: 'Components/CodeBlock',
  component: CodeBlock,
  parameters: {
    layout: 'padded',
    controls: { include: ['code', 'language', 'lineNumbers'] }
  },
  args: { code, language: 'typescript', lineNumbers: false },
  render: args => (
    <MotionProvider>
      <CodeBlock {...args}>
        <CodeBlockHeader>
          <span>greeting.ts</span>
          <CodeBlockCopy />
        </CodeBlockHeader>
        <CodeBlockViewport aria-label="greeting.ts" />
      </CodeBlock>
    </MotionProvider>
  )
} satisfies Meta<typeof CodeBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
