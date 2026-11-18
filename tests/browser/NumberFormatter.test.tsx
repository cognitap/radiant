import { expect, test } from 'vitest'
import { LocaleProvider, NumberFormatter } from '../../src/index.js'
import { mount } from './familyHarness.js'

const euro = { style: 'currency', currency: 'EUR' } satisfies Intl.NumberFormatOptions
const percent = { style: 'percent', maximumFractionDigits: 1 } satisfies Intl.NumberFormatOptions
const unit = { style: 'unit', unit: 'kilometer' } satisfies Intl.NumberFormatOptions

test('inherits locale, supports explicit overrides, and hydrates formatted values', async () => {
  const tree = (locale: string) => (
    <LocaleProvider locale={locale}>
      <NumberFormatter
        value={1_234.5}
        options={euro}
      />
      <NumberFormatter
        value={0.963}
        options={percent}
        locale="en-US"
      />
      <NumberFormatter
        value={42}
        options={unit}
      />
    </LocaleProvider>
  )
  let initial: string[] = []
  const values = (root: HTMLElement) =>
    Array.from(root.querySelectorAll('bdi'), value => value.textContent ?? '')
  const { host, render } = await mount(tree('fr-FR'), true, host => {
    initial = values(host)
  })
  expect(values(host)).toEqual([
    new Intl.NumberFormat('fr-FR', euro).format(1234.5),
    new Intl.NumberFormat('en-US', percent).format(0.963),
    new Intl.NumberFormat('fr-FR', unit).format(42)
  ])
  expect(values(host)).toEqual(initial)
  await render(tree('de-DE'))
  expect(values(host)[0]).toBe(new Intl.NumberFormat('de-DE', euro).format(1234.5))
  expect(host.querySelector('bdi')).toHaveAttribute('lang', 'de-DE')
})

test('preserves bigint precision and uses the declared fallback for an unsupported locale', async () => {
  const value = 98_765_432_101_234_567_890n
  const { host } = await mount(
    <NumberFormatter
      value={value}
      locale="zz-ZZ"
    />,
    true
  )
  expect(host.querySelector('bdi')).toHaveTextContent('98,765,432,101,234,567,890')
  expect(host.querySelector('bdi')).toHaveAttribute('lang', 'en-US')
})

test('keeps server text and its node when locale data differs, then updates with the value', async () => {
  const yen = { style: 'currency', currency: 'JPY' } satisfies Intl.NumberFormatOptions
  const tree = (value: number) => (
    <NumberFormatter
      value={value}
      locale="ja-JP"
      options={yen}
    />
  )
  const localText = new Intl.NumberFormat('ja-JP', yen).format(10_000)
  const serverText = localText.includes('￥')
    ? localText.replace('￥', '¥')
    : localText.replace('¥', '￥')
  const server: { node?: HTMLElement } = {}
  const { host, render } = await mount(tree(10_000), true, element => {
    server.node = element.querySelector('bdi')!
    server.node.textContent = serverText
  })
  expect(serverText).not.toBe(localText)
  expect(host.querySelector('bdi')).toBe(server.node)
  expect(server.node?.textContent).toBe(serverText)
  await render(tree(20_000))
  expect(host.querySelector('bdi')?.textContent).toBe(
    new Intl.NumberFormat('ja-JP', yen).format(20_000)
  )
})
