import { expect, test } from 'vitest'
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableRow,
  ThemeScope,
  defineTheme,
  type Spacing,
  type ThemeStyle
} from '../../src/index.js'
import { mount } from './familyHarness.js'

const steps: Spacing[] = ['tight', 'normal', 'airy']

function padding(node: Element) {
  const style = getComputedStyle(node)
  return [style.paddingInlineStart, style.paddingBlockStart].map(
    value => Math.round(parseFloat(value) * 100) / 100
  )
}

async function cards(theme?: Parameters<typeof defineTheme>[0], style?: ThemeStyle) {
  const { host } = await mount(
    <ThemeScope theme={theme && defineTheme(theme)}>
      <Card data-testid="default">Default</Card>
      {steps.map(step => (
        <Card
          key={step}
          padding={step}
          style={style}
          data-testid={step}
        >
          {step}
        </Card>
      ))}
    </ThemeScope>
  )
  return (id: string) => padding(host.querySelector(`[data-testid="${id}"]`)!)[0]
}

async function tables(theme?: Parameters<typeof defineTheme>[0], cellStyle?: ThemeStyle) {
  const { host } = await mount(
    <ThemeScope theme={theme && defineTheme(theme)}>
      {[undefined, ...steps].map(step => (
        <Table
          key={step ?? 'default'}
          density={step}
        >
          <TableBody>
            <TableRow>
              <TableCell
                data-testid={step ?? 'default'}
                style={cellStyle}
              >
                {step}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ))}
    </ThemeScope>
  )
  return (id: string) => padding(host.querySelector(`[data-testid="${id}"]`)!)
}

test('theme tokens emit the semantic spacing scale with today’s gaps at normal', async () => {
  const { host } = await mount(
    <ThemeScope
      theme={defineTheme({ id: 'airy', name: 'Airy', tokens: { spacing: { airy: '3rem' } } })}
    >
      <div data-testid="probe" />
    </ThemeScope>
  )
  const style = getComputedStyle(host.querySelector('[data-testid="probe"]')!)
  expect(style.getPropertyValue('--rad-spacing-tight').trim()).toBe('0.5rem')
  expect(style.getPropertyValue('--rad-spacing-normal').trim()).toBe(
    style.getPropertyValue('--rad-surface-gap').trim()
  )
  expect(style.getPropertyValue('--rad-spacing-airy').trim()).toBe('3rem')
})

test('Card padding steps keep normal as the default and scale from the card padding', async () => {
  const read = await cards()
  expect([read('default'), read('tight'), read('normal'), read('airy')]).toEqual([24, 16, 24, 32])
  const themed = await cards({
    id: 'card-steps',
    name: 'Card steps',
    components: { card: { padding: '30px', paddingAiry: '50px' } }
  })
  expect([themed('default'), themed('tight'), themed('airy')]).toEqual([30, 20, 50])
  const local = await cards(undefined, { '--rad-card-padding-tight': '4px' })
  expect(local('tight')).toBe(4)
})

test('Table density steps scale cell padding with existing overrides still winning', async () => {
  const read = await tables()
  expect(read('default')).toEqual([12, 10])
  expect(read('normal')).toEqual([12, 10])
  expect(read('tight')).toEqual([8, 6.67])
  expect(read('airy')).toEqual([16, 13.33])
  const themed = await tables({
    id: 'table-steps',
    name: 'Table steps',
    components: { table: { paddingInline: '18px', paddingBlockTight: '2px' } }
  })
  expect(themed('normal')).toEqual([18, 10])
  expect(themed('tight')).toEqual([12, 2])
  const cell = await tables(undefined, { '--rad-table-padding-inline': '30px' })
  expect(cell('normal')[0]).toBe(30)
  expect(cell('airy')[0]).toBe(40)
})
