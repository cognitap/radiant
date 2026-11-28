import { act } from 'react'
import { expect, test } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  Checkbox,
  Meter,
  Progress,
  Radio,
  RadioGroup,
  Skeleton,
  Slider,
  Switch,
  ThemeScope
} from '../../src/index.js'
import { jelly } from '../../src/examples/jelly.js'
import { sharp } from '../../src/examples/sharp-3d.js'
import { mount } from './familyHarness.js'

const parts = (host: HTMLElement) => ({
  checkbox: host.querySelector<HTMLInputElement>('[data-slot=checkbox]')!,
  radio: host.querySelector<HTMLInputElement>('input[type=radio]')!,
  track: host.querySelector<HTMLInputElement>('[data-slot=switch]')!,
  thumb: host.querySelector<HTMLElement>('[data-slot=switch-indicator]')!,
  progress: host.querySelector('progress')!,
  meter: host.querySelector('meter')!,
  skeleton: host.querySelector<HTMLElement>('[data-slot=skeleton]')!
})

const family = (
  <>
    <Checkbox label="Notify" />
    <RadioGroup label="Plan">
      <Radio
        value="pro"
        label="Pro"
      />
    </RadioGroup>
    <Switch label="Sync" />
    <Slider
      aria-label="Volume"
      defaultValue={40}
    />
    <Progress
      aria-label="Export"
      value={40}
    />
    <Meter
      aria-label="Disk"
      value={0.4}
    />
    <Skeleton />
  </>
)

const px = (value: string) => Number.parseFloat(value)

test('unthemed indicators and tracks keep their baseline shape and depth', async () => {
  const { host } = await mount(family)
  const { checkbox, radio, track, thumb, progress, meter, skeleton } = parts(host)
  expect(getComputedStyle(checkbox).boxShadow).toBe('none')
  expect(getComputedStyle(radio).boxShadow).toBe('none')
  expect(getComputedStyle(thumb).boxShadow).toBe('none')
  expect(getComputedStyle(track).borderTopLeftRadius).toBe('8px')
  for (const bar of [progress, meter]) {
    const style = getComputedStyle(bar)
    expect(style.borderTopLeftRadius).toBe('4px')
    expect(style.borderTopWidth).toBe('1px')
    expect(style.borderTopStyle).toBe('solid')
    expect(style.boxShadow).toBe('none')
  }
  expect(getComputedStyle(skeleton).borderTopWidth).toBe('0px')
  expect(getComputedStyle(skeleton).backgroundColor).toBe(
    getComputedStyle(progress).backgroundColor
  )
})

test('a hard-offset theme reaches every indicator and track, and zero radius gives bars', async () => {
  const { host } = await mount(<ThemeScope theme={sharp}>{family}</ThemeScope>)
  const { checkbox, radio, track, thumb, progress, meter, skeleton } = parts(host)
  for (const node of [checkbox, radio, track, thumb, progress, meter, skeleton])
    expect(getComputedStyle(node).boxShadow).toMatch(/ 2px 2px 0px 0px$/)
  expect(getComputedStyle(radio).borderTopLeftRadius).not.toBe('0px')
  expect(getComputedStyle(track).borderTopLeftRadius).toBe('0px')
  for (const bar of [progress, meter, skeleton]) {
    expect(getComputedStyle(bar).borderTopWidth).toBe('2px')
    expect(getComputedStyle(bar).borderTopLeftRadius).toBe('0px')
  }
})

test('a large radius caps tracks at half their thickness', async () => {
  const { host } = await mount(<ThemeScope theme={jelly}>{family}</ThemeScope>)
  const { track, thumb, progress } = parts(host)
  expect(px(getComputedStyle(track).borderTopLeftRadius)).toBeCloseTo(
    track.getBoundingClientRect().height / 2,
    1
  )
  expect(getComputedStyle(track).getPropertyValue('corner-shape')).toBe('superellipse(2)')
  expect(getComputedStyle(thumb).getPropertyValue('corner-shape')).toBe('superellipse(2)')
  expect(px(getComputedStyle(progress).borderTopLeftRadius)).toBeCloseTo(
    progress.getBoundingClientRect().height / 2,
    1
  )
  expect(getComputedStyle(progress).boxShadow).toContain('inset')
})

test('a checked checkbox draws a smaller square using the outer corner shape', async () => {
  const { host } = await mount(
    <ThemeScope theme={jelly}>
      <Checkbox
        label="Choice"
        defaultChecked
      />
    </ThemeScope>
  )
  const input = host.querySelector('input')!
  const mark = host.querySelector('[data-slot="checkbox-indicator"]')!
  const square = mark.getBoundingClientRect()
  expect(square.width).toBeCloseTo(square.height)
  expect(square.width).toBeLessThan(input.getBoundingClientRect().width)
  expect(getComputedStyle(mark).backgroundColor).toBe(getComputedStyle(mark).color)
  expect(getComputedStyle(mark).backgroundColor).not.toBe(getComputedStyle(input).backgroundColor)
  expect(getComputedStyle(mark).getPropertyValue('corner-shape')).toBe(
    getComputedStyle(input).getPropertyValue('corner-shape')
  )
})

test('checkbox labels use regular weight and allow a caller to make them bold', async () => {
  const { host } = await mount(
    <ThemeScope theme={jelly}>
      <Checkbox label="Default" />
      <Checkbox
        label="Custom"
        parts={{ label: { className: 'font-bold' } }}
      />
    </ThemeScope>
  )
  const labels = [...host.querySelectorAll('[data-slot="checkbox-label"]')]
  expect(labels.map(label => getComputedStyle(label).fontWeight)).toEqual(['400', '700'])
})

test('pressing a checkbox scales its box and mark together, never under reduced motion', async () => {
  const { host } = await mount(<ThemeScope theme={jelly}>{family}</ThemeScope>)
  const { checkbox } = parts(host)
  const wrapper = checkbox.parentElement!
  const label = checkbox.closest('label')!
  checkbox.focus()
  await act(async () => userEvent.keyboard('{Space>}'))
  await expect.poll(() => getComputedStyle(wrapper).scale).toBe('0.9')
  expect(getComputedStyle(label).scale).toBe('none')
  await act(async () => userEvent.keyboard('{/Space}'))
  await expect.poll(() => getComputedStyle(wrapper).scale).toBe('none')
  await commands.emulatePreferences({ reducedMotion: 'reduce' })
  await act(async () => userEvent.keyboard('{Space>}'))
  expect(checkbox.matches(':active')).toBe(true)
  expect(getComputedStyle(wrapper).scale).toBe('none')
  await act(async () => userEvent.keyboard('{/Space}'))
})
