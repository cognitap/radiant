import { createRef, StrictMode } from 'react'
import { expect, test } from 'vitest'
import { Stack, ThemeScope, defineTheme, type StackProps } from '../../src/index.js'
import { mount } from './familyHarness.js'

const modes = ['light', 'dark'] as const
const box = (node: Element) => node.getBoundingClientRect()
const items = (props: StackProps = {}) => (
  <Stack {...props}>
    <div style={{ minWidth: 40, minHeight: 20 }} />
    <div style={{ minWidth: 60, minHeight: 30 }} />
    <div style={{ minWidth: 80, minHeight: 40 }} />
  </Stack>
)

test.each(modes)(
  'Stack hydrates a flex host spaced by the theme scale with caller props in %s mode',
  async mode => {
    const ref = createRef<HTMLDivElement>()
    const { host } = await mount(
      <StrictMode>
        <ThemeScope mode={mode}>
          {items({
            ref,
            id: 'stack',
            className: 'p-[3px]',
            style: { width: 300, outline: '1px solid' },
            'data-slot': 'toolbar'
          })}
        </ThemeScope>
      </StrictMode>,
      true
    )
    const root = host.querySelector<HTMLDivElement>('#stack')!
    expect(ref.current).toBe(root)
    expect(root.dataset.slot).toBe('stack toolbar')
    expect(root.getAttribute('role')).toBeNull()
    const style = getComputedStyle(root)
    expect([style.display, style.flexDirection, style.rowGap, style.padding]).toEqual([
      'flex',
      'column',
      '16px',
      '3px'
    ])
    expect(style.width).toBe('300px')
    const [a, b] = [...root.children]
    expect(box(b!).top - box(a!).bottom).toBe(16)
    expect(box(a!).width).toBe(294)
  }
)

test.each(modes)(
  'direction, gap, align, justify and wrap lay children out in %s mode',
  async mode => {
    const ref = createRef<HTMLDivElement>()
    const { render } = await mount(<ThemeScope mode={mode}>{items({ ref })}</ThemeScope>)
    const layout = async (props: StackProps) => {
      await render(
        <ThemeScope mode={mode}>{items({ ref, style: { width: 400 }, ...props })}</ThemeScope>
      )
      return [...ref.current!.children].map(child => {
        const rect = box(child),
          root = box(ref.current!)
        return [rect.left - root.left, rect.top - root.top, rect.width, rect.height]
      })
    }
    expect(await layout({ direction: 'horizontal', gap: 'tight' })).toEqual([
      [0, 0, 40, 40],
      [48, 0, 60, 40],
      [116, 0, 80, 40]
    ])
    expect(await layout({ direction: 'horizontal', gap: 'airy', align: 'center' })).toEqual([
      [0, 10, 40, 20],
      [64, 5, 60, 30],
      [148, 0, 80, 40]
    ])
    expect(await layout({ direction: 'horizontal', align: 'end', justify: 'end' })).toEqual([
      [188, 20, 40, 20],
      [244, 10, 60, 30],
      [320, 0, 80, 40]
    ])
    expect((await layout({ direction: 'horizontal', justify: 'between' })).map(([x]) => x)).toEqual(
      [0, 150, 320]
    )
    expect(
      (await layout({ direction: 'horizontal', gap: 'tight', justify: 'stretch' })).map(
        ([, , w]) => w
      )
    ).toEqual([128, 128, 128])
    expect((await layout({ align: 'center' })).map(([x]) => x)).toEqual([180, 170, 160])
    const wrapped = await layout({ direction: 'horizontal', wrap: true, style: { width: 120 } })
    expect(wrapped.map(([x, y]) => [x, y])).toEqual([
      [0, 0],
      [56, 0],
      [0, 46]
    ])
    const unwrapped = await layout({ direction: 'horizontal', style: { width: 120 } })
    expect(unwrapped.every(([, y]) => y === 0)).toBe(true)
  }
)

test.each(modes)('themes and caller tokens change Stack spacing in %s mode', async mode => {
  const theme = defineTheme({
    id: 'stack-spacing',
    name: 'Stack spacing',
    tokens: { spacing: { normal: '2rem', tight: '3px' } }
  })
  const { host } = await mount(
    <ThemeScope
      theme={theme}
      mode={mode}
    >
      {items({ id: 'normal' })}
      {items({ id: 'tight', gap: 'tight' })}
      {items({ id: 'local', gap: 'airy', style: { '--rad-spacing-airy': '5px' } })}
      {items({ id: 'caller', className: 'gap-[7px]' })}
    </ThemeScope>
  )
  const gap = (id: string) => getComputedStyle(host.querySelector(`#${id}`)!).rowGap
  expect(['normal', 'tight', 'local', 'caller'].map(gap)).toEqual(['32px', '3px', '5px', '7px'])
})
