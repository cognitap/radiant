import { act, createRef, StrictMode } from 'react'
import { createPortal } from 'react-dom'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  CodeBlock,
  CodeBlockHeader,
  CodeBlockViewport,
  CodeBlockContent,
  CodeBlockCopy,
  InlineCode,
  ThemeScope,
  defineTheme,
  type CodeBlockProps,
  type CodeBlockCopyProps
} from '../../src/index.js'
import {
  InstallRadiant,
  ConfigureStudyExport,
  InspectSessionExport
} from '../../.storybook/examples/CodeBlockExamples.js'
import { mount, click, key, pause } from './familyHarness.js'
let original: PropertyDescriptor | undefined
beforeEach(() => {
  original = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
})
afterEach(() => {
  if (original) Object.defineProperty(navigator, 'clipboard', original)
  else Reflect.deleteProperty(navigator, 'clipboard')
})
function clipboard(writeText: (source: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
}
function Sample({
  code = 'const x = 1\n',
  copyProps,
  ...props
}: Partial<CodeBlockProps> & { copyProps?: CodeBlockCopyProps }) {
  return (
    <CodeBlock
      {...props}
      code={code}
    >
      <CodeBlockHeader>
        example.ts
        <CodeBlockCopy {...copyProps} />
      </CodeBlockHeader>
      <CodeBlockViewport aria-label="Example source">
        <CodeBlockContent>
          <span>{code}</span>
        </CodeBlockContent>
      </CodeBlockViewport>
    </CodeBlock>
  )
}
test('native refs hydrate with real ScrollArea, inline code and independent theme/caller overrides', async () => {
  const root = createRef<HTMLDivElement>(),
    view = createRef<HTMLDivElement>(),
    pre = createRef<HTMLPreElement>(),
    button = createRef<HTMLButtonElement>(),
    inline = createRef<HTMLElement>()
  const { host } = await mount(
    <StrictMode>
      <ThemeScope
        theme={defineTheme({
          id: 'code-test',
          name: 'Code test',
          components: {
            codeBlock: {
              borderWidth: '3px',
              radius: '19px',
              padding: '21px',
              fontSize: '18px',
              lineHeight: '1.8',
              headerPadding: '13px',
              headerGap: '9px',
              maxHeight: '120px',
              numberGap: '17px'
            },
            inlineCode: {
              paddingInline: '7px',
              paddingBlock: '3px',
              fontSize: '20px',
              radius: '9px'
            }
          }
        })}
      >
        <CodeBlock
          ref={root}
          code={'one\r\ntwo\r\n'}
          lineNumbers
          dir="rtl"
          className="caller-code"
          style={{ background: 'rgb(240, 240, 240)' }}
        >
          <CodeBlockHeader>
            Source
            <CodeBlockCopy ref={button} />
          </CodeBlockHeader>
          <CodeBlockViewport
            ref={view}
            aria-label="Hydrated code"
          >
            <CodeBlockContent ref={pre} />
          </CodeBlockViewport>
        </CodeBlock>
        <InlineCode ref={inline}>value</InlineCode>
        <CodeBlock
          code="plain"
          className="border-0 rounded-none"
          data-testid="override"
        >
          <CodeBlockViewport aria-label="Override code" />
        </CodeBlock>
      </ThemeScope>
    </StrictMode>,
    true
  )
  expect(root.current).toBe(host.querySelector('[data-slot="code-block"]'))
  expect(view.current!.dataset.slot).toBe('scroll-area code-block-viewport')
  expect(pre.current!.tagName).toBe('PRE')
  expect(button.current!.tagName).toBe('BUTTON')
  expect(inline.current!.tagName).toBe('CODE')
  expect(getComputedStyle(root.current!).borderTopWidth).toBe('3px')
  expect(getComputedStyle(root.current!).borderRadius).toBe('19px')
  expect(getComputedStyle(root.current!).direction).toBe('rtl')
  expect(getComputedStyle(view.current!).direction).toBe('ltr')
  expect(getComputedStyle(view.current!).maxHeight).toBe('120px')
  expect(getComputedStyle(pre.current!).paddingTop).toBe('21px')
  expect(getComputedStyle(pre.current!).fontSize).toBe('18px')
  expect(getComputedStyle(pre.current!.querySelector('code')!).fontSize).toBe('18px')
  expect(getComputedStyle(pre.current!.querySelector('code')!).fontFamily).toBe(
    getComputedStyle(pre.current!).fontFamily
  )
  expect(
    getComputedStyle(root.current!.querySelector('[data-slot="code-block-header"]')!).paddingTop
  ).toBe('13px')
  expect(getComputedStyle(inline.current!).paddingLeft).toBe('7px')
  expect(getComputedStyle(inline.current!).fontSize).toBe('20px')
  expect(getComputedStyle(host.querySelector('[data-testid="override"]')!).borderTopWidth).toBe(
    '0px'
  )
  expect(getComputedStyle(host.querySelector('[data-testid="override"]')!).borderRadius).toBe('0px')
  expect(pre.current!.querySelector('[data-slot="code-block-line-numbers"]')!.textContent).toBe(
    '1\n2\n3'
  )
  expect(
    pre.current!.querySelector('[data-slot="code-block-line-numbers"]')!.getAttribute('aria-hidden')
  ).toBe('true')
})
test('copy writes raw source once, waits for success, keeps focus and never submits or toggles', async () => {
  const writes: string[] = []
  let finish!: () => void
  clipboard(source => {
    writes.push(source)
    return new Promise<void>(resolve => {
      finish = resolve
    })
  })
  let submits = 0
  const source = '<b>café & reading</b>\r\n  indented\r\n'.repeat(12)
  const unsafe = Object.fromEntries([
    ['type', 'submit'],
    ['pressed', true],
    ['aria-pressed', 'true']
  ])
  const { host } = await mount(
    <form
      style={{ height: '200px', overflow: 'auto' }}
      onSubmit={event => {
        event.preventDefault()
        submits++
      }}
    >
      <Sample
        code={source}
        lineNumbers
        copyProps={unsafe}
      />
    </form>
  )
  const button = host.querySelector('button')!,
    status = host.querySelector('output')!
  await click(button)
  expect(writes).toEqual([source])
  expect(status.textContent).toBe('Copying code…')
  expect(button.getAttribute('aria-busy')).toBe('true')
  expect(button.disabled).toBe(false)
  expect(document.activeElement).toBe(button)
  expect(button.type).toBe('button')
  expect(button.hasAttribute('aria-pressed')).toBe(false)
  await act(() => {
    button.click()
    button.click()
  })
  expect(writes).toHaveLength(1)
  await act(async () => finish())
  expect(status.textContent).toBe('Code copied.')
  const formBox = host.querySelector('form')!.getBoundingClientRect(),
    statusBox = status.getBoundingClientRect()
  expect(statusBox.top).toBeGreaterThanOrEqual(formBox.top)
  expect(statusBox.bottom).toBeLessThanOrEqual(formBox.bottom)
  expect(status.getAttribute('aria-live')).toBe('polite')
  expect(button.getAttribute('aria-busy')).toBeNull()
  expect(submits).toBe(0)
  expect(document.activeElement).toBe(button)
  expect(host.querySelector('b')).toBeNull()
})
test('replaced source clears feedback, serializes pending writes and never announces an old completion', async () => {
  const writes: string[] = []
  let finish!: () => void
  clipboard(source => {
    writes.push(source)
    return writes.length === 1
      ? new Promise<void>(resolve => {
          finish = resolve
        })
      : Promise.resolve()
  })
  const { host, render } = await mount(<Sample code="old source" />)
  const button = host.querySelector('button')!
  await click(button)
  await render(
    <Sample
      code="new source"
      copiedText="New source copied."
    />
  )
  expect(host.querySelector('output')!.textContent).toBe('')
  await act(() => button.click())
  expect(writes).toEqual(['old source'])
  await act(async () => finish())
  expect(host.querySelector('output')!.textContent).toBe('')
  await click(button)
  expect(writes).toEqual(['old source', 'new source'])
  expect(host.querySelector('output')!.textContent).toBe('New source copied.')
  await render(<Sample code="third source" />)
  expect(host.querySelector('output')!.textContent).toBe('')
  expect(writes).toHaveLength(2)
})
test('unavailable and denied clipboard writes show honest feedback; caller cancellation and retry keep code usable', async () => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
  const { host, render } = await mount(<Sample />),
    button = host.querySelector('button')!
  await click(button)
  expect(host.querySelector('output')!.textContent).toContain(
    'Select the code and copy it manually.'
  )
  expect(host.querySelector('code')!.textContent).toBe('const x = 1\n')
  let calls = 0
  clipboard(async () => {
    calls++
    throw new Error('Denied')
  })
  await click(button)
  expect(calls).toBe(1)
  expect(host.querySelector('output')!.textContent).not.toBe('Code copied.')
  await render(<Sample copyProps={{ onClick: event => event.preventDefault() }} />)
  await click(button)
  expect(calls).toBe(1)
  clipboard(async () => {
    calls++
  })
  await render(<Sample />)
  await click(button)
  expect(calls).toBe(2)
  expect(host.querySelector('output')!.textContent).toBe('Code copied.')
  expect(document.activeElement).toBe(button)
})
test('the native code viewport is keyboard reachable and scrolls long source in both axes under forced colors', async () => {
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  const source = Array.from(
    { length: 40 },
    (_, index) => 'line ' + index + ': ' + 'long source '.repeat(60)
  ).join('\n')
  const { host } = await mount(
    <CodeBlock
      code={source}
      dir="rtl"
      lineNumbers
      style={{ width: '260px', '--rad-code-block-max-height': '120px' }}
    >
      <CodeBlockViewport aria-label="Long source" />
    </CodeBlock>
  )
  const view = host.querySelector<HTMLDivElement>('[data-slot~="code-block-viewport"]')!
  await act(() => view.focus())
  expect(document.activeElement).toBe(view)
  expect(view.scrollWidth).toBeGreaterThan(view.clientWidth)
  await key('{ArrowRight}')
  await pause(180)
  expect(view.scrollLeft).toBeGreaterThan(0)
  await key('{PageDown}')
  await pause(180)
  expect(view.scrollTop).toBeGreaterThan(0)
  expect(getComputedStyle(view).outlineOffset).toBe('-3px')
  expect(getComputedStyle(view).direction).toBe('ltr')
})
test('canonical tasks generate native configuration and filter real table records and raw CSV', async () => {
  const writes: string[] = []
  clipboard(async source => {
    writes.push(source)
  })
  const { host, render } = await mount(<InstallRadiant />)
  await act(() => userEvent.selectOptions(host.querySelector('select')!, 'npm'))
  expect(host.querySelector('code[data-slot="code-block-code"]')!.textContent).toBe(
    'npm install @cognitap/radiant'
  )
  await click(host.querySelector('button')!)
  expect(writes[0]).toBe('npm install @cognitap/radiant')
  await render(<ConfigureStudyExport />)
  await act(() =>
    userEvent.fill(host.querySelector('input[name="collection"]')!, 'participant_notes')
  )
  expect(host.querySelector('[data-slot="code-block-code"]')!.textContent).toContain(
    'reading_sessions'
  )
  await click(host.querySelector('input[type="checkbox"]')!)
  await click(host.querySelector('button[type="submit"]')!)
  expect(host.querySelector('[data-slot="code-block-code"]')!.textContent).toContain(
    '"collection": "participant_notes"'
  )
  expect(host.querySelector('[data-slot="code-block-code"]')!.textContent).not.toContain(
    'durationMs'
  )
  expect(host.querySelector('output[aria-label="Generated export plan"]')!.textContent).toContain(
    'participant_notes'
  )
  expect(
    host.querySelector('output[aria-label="Generated export plan"]')!.getAttribute('aria-live')
  ).toBe('polite')
  await render(<InspectSessionExport />)
  await click(host.querySelector('input[type="checkbox"]')!)
  expect(host.querySelector('caption')!.textContent).toBe('2 session records')
  expect(host.querySelector('tbody')!.textContent).not.toContain('Jonas')
  await click(host.querySelector<HTMLButtonElement>('[data-slot~="code-block-copy"]')!)
  expect(writes.at(-1)).toContain('\r\n')
  expect(writes.at(-1)).toContain('"S-104"')
  expect(writes.at(-1)).not.toContain('Jonas')
})
test('copy uses its own document and ignores asynchronous completion after unmount', async () => {
  const frame = document.createElement('iframe')
  document.body.append(frame)
  try {
    const owner = frame.contentDocument!,
      win = frame.contentWindow!,
      writes: string[] = []
    let finish!: (reason: Error) => void
    Object.defineProperty(win.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (source: string) => {
          writes.push(source)
          return new Promise<void>((_, reject) => {
            finish = reject
          })
        }
      }
    })
    clipboard(async () => {
      throw new Error('Wrong document')
    })
    const { render } = await mount(createPortal(<Sample code="iframe source" />, owner.body))
    const button = owner.querySelector('button')!
    await act(() => button.click())
    expect(writes).toEqual(['iframe source'])
    expect(owner.querySelector('output')!.textContent).toBe('Copying code…')
    await render(null)
    await act(async () => finish(new Error('Permission refused after unmount')))
    expect(owner.querySelector('output')).toBeNull()
  } finally {
    frame.remove()
  }
})
