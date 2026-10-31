import { createRef, type ReactElement } from 'react'
import {
  CodeBlock,
  CodeBlockHeader,
  CodeBlockViewport,
  CodeBlockContent,
  CodeBlockCopy,
  InlineCode,
  type CodeBlockRenderProps,
  type CodeBlockProps,
  type CodeBlockCopyProps
} from '@cognitap/radiant'
const render = (props: CodeBlockRenderProps): ReactElement => <button {...props} />
const copy: CodeBlockCopyProps = { controlSize: 'small', render }
;<CodeBlock
  code={'const x = 1\n'}
  language="javascript"
  lineNumbers
  ref={createRef<HTMLDivElement>()}
  style={{ '--rad-code-block-padding': '12px' }}
  parts={{ status: { className: 'message', style: { color: 'red' } } }}
>
  <CodeBlockHeader ref={createRef<HTMLDivElement>()}>
    example.js
    <CodeBlockCopy
      {...copy}
      ref={createRef<HTMLButtonElement>()}
    />
  </CodeBlockHeader>
  <CodeBlockViewport
    aria-label="Example"
    ref={createRef<HTMLDivElement>()}
  >
    <CodeBlockContent ref={createRef<HTMLPreElement>()}>
      <strong>const</strong>
      {' x = 1\n'}
    </CodeBlockContent>
  </CodeBlockViewport>
</CodeBlock>
;<InlineCode
  ref={createRef<HTMLElement>()}
  style={{ '--rad-inline-code-radius': '3px' }}
>
  token
</InlineCode>
// @ts-expect-error Raw source is required.
;<CodeBlock />
const invalidOwner: CodeBlockProps = {
  code: 'raw',
  // @ts-expect-error A code string has one consumer owner.
  defaultCode: 'other'
}
void invalidOwner
// @ts-expect-error The actual scroll viewport needs a name.
;<CodeBlockViewport />
// @ts-expect-error Copy is an action, not toggle state.
;<CodeBlockCopy pressed />
// @ts-expect-error Copy cannot gain toggle ARIA.
;<CodeBlockCopy aria-pressed="true" />
// @ts-expect-error Copy never submits a surrounding form.
;<CodeBlockCopy type="submit" />
