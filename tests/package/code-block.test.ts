import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup as render } from 'react-dom/server'
import {
  CodeBlock,
  CodeBlockHeader,
  CodeBlockViewport,
  CodeBlockContent,
  CodeBlockCopy,
  InlineCode
} from '@cognitap/radiant'

test('CodeBlock renders native code, an explicitly named real ScrollArea and a non-submitting Button without using the clipboard on the server', () => {
  const source = '<script>alert("unsafe")</script>\r\nconst word = "café"\r\n'
  const html = render(
    h(
      CodeBlock,
      {
        code: source,
        language: 'typescript',
        lineNumbers: true,
        'data-slot': 'custom',
        style: { borderRadius: '17px' }
      },
      h(CodeBlockHeader, {}, 'example.ts', h(CodeBlockCopy, { 'data-slot': 'custom-copy' })),
      h(CodeBlockViewport, { 'aria-label': 'Example source' })
    )
  )
  assert.match(html, /data-slot="code-block custom"/)
  assert.match(html, /data-slot="scroll-area code-block-viewport"/)
  assert.match(html, /role="group"/)
  assert.match(html, /aria-label="Example source"/)
  assert.match(html, /<pre[^>]+data-slot="code-block-content"/)
  assert.match(html, /<code[^>]+data-slot="code-block-code"/)
  assert.match(html, /&lt;script&gt;/)
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /aria-hidden="true" data-slot="code-block-line-numbers"/)
  assert.match(html, /1\n2\n3/)
  assert.match(html, /type="button"/)
  assert.match(html, /data-slot="button code-block-copy custom-copy"/)
  assert.doesNotMatch(html, /aria-pressed=/)
  assert.match(html, /<output[^>]+aria-live="polite"/)
  assert.doesNotMatch(html, /Code copied\./)
})
test('consumer highlighting is React content while raw source and line numbers retain independent identities', () => {
  const html = render(
    h(
      CodeBlock,
      { code: 'const answer = 42\n', language: 'javascript', lineNumbers: true },
      h(
        CodeBlockViewport,
        { 'aria-label': 'Answer source' },
        h(
          CodeBlockContent,
          { 'data-slot': 'custom-code' },
          h('strong', {}, 'const'),
          ' answer = 42\n'
        )
      )
    )
  )
  assert.match(html, /<strong>const<\/strong> answer = 42/)
  assert.match(html, /data-slot="code-block-content custom-code"/)
  assert.match(html, /data-language="javascript"/)
  assert.match(
    render(h(InlineCode, { 'data-slot': 'custom', style: { padding: '7px' } }, 'a < b & c')),
    /<code[^>]+data-slot="inline-code custom"[^>]+style="padding:7px"/
  )
  assert.match(render(h(InlineCode, {}, 'a < b & c')), /a &lt; b &amp; c/)
})
test('orphan parts and unnamed scroll viewports fail clearly', () => {
  assert.throws(() => render(h(CodeBlockCopy)), /inside CodeBlock/)
  assert.throws(() => render(h(CodeBlockContent)), /inside CodeBlock/)
  assert.throws(
    () => render(h(CodeBlock, { code: 'hello' }, h(CodeBlockViewport, { 'aria-label': '' }))),
    /accessible name|aria-label|aria-labelledby/i
  )
})
