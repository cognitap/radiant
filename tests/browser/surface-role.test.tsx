import { expect, test } from 'vitest'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  Card,
  Carousel,
  CarouselIndicators,
  CarouselViewport,
  CodeBlock,
  CodeBlockContent,
  CodeBlockViewport,
  EmptyState,
  InlineCode,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  ThemeScope,
  Toast,
  ToastProvider,
  ToastViewport,
  defaultTheme,
  defineTheme
} from '../../src/index.js'
import { mount } from './familyHarness.js'

const shadow = 'rgb(1, 2, 3) 3px 3px 0px 0px'
const overlayShadow = 'rgb(4, 5, 6) 6px 6px 0px 0px'
const theme = defineTheme({
  id: 'surface-proof',
  name: 'Surface proof',
  tokens: {
    control: {
      radius: '1rem',
      cornerShape: 'bevel',
      action: { textTransform: 'uppercase' },
      selected: { background: 'rgb(7, 8, 9)' }
    },
    surface: {
      cornerShape: 'scoop',
      borderStyle: 'dotted',
      shadow: '3px 3px 0 0 rgb(1 2 3)',
      overlayShadow: '6px 6px 0 0 rgb(4 5 6)',
      backdropFilter: 'blur(4px)'
    }
  }
})

function Families() {
  return (
    <>
      <Card data-testid="card" />
      <Alert data-testid="alert">Saved</Alert>
      <ToastProvider>
        <ToastViewport style={{ position: 'relative', inset: 'auto' }}>
          <Toast
            data-testid="toast"
            defaultOpen
            motion="off"
          >
            Sent
          </Toast>
        </ToastViewport>
      </ToastProvider>
      <Accordion type="single">
        <AccordionItem
          value="billing"
          data-testid="accordion-item"
        >
          <AccordionTrigger>Billing</AccordionTrigger>
          <AccordionContent>Invoices</AccordionContent>
        </AccordionItem>
      </Accordion>
      <TableContainer
        aria-label="Team"
        data-testid="table"
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader data-testid="column-header">Name</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableHeader
                scope="row"
                data-testid="row-header"
              >
                Sam
              </TableHeader>
              <TableCell>Designer</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <EmptyState
        variant="first-use"
        data-testid="first-use"
      />
      <EmptyState
        variant="error"
        data-testid="error"
      />
      <CodeBlock
        code="pnpm add"
        language="shell"
        data-testid="code-block"
      >
        <CodeBlockViewport aria-label="Install">
          <CodeBlockContent />
        </CodeBlockViewport>
      </CodeBlock>
      <p style={{ fontSize: '16px' }}>
        Run <InlineCode data-testid="inline-code">pnpm</InlineCode>
      </p>
      <Carousel
        aria-label="Slides"
        items={[
          { value: 'a', children: 'A' },
          { value: 'b', children: 'B' }
        ]}
      >
        <CarouselViewport data-testid="carousel" />
        <CarouselIndicators />
      </Carousel>
      <Separator data-testid="separator" />
    </>
  )
}

function cornerShape(value: string) {
  const probe = document.createElement('span')
  probe.style.setProperty('corner-shape', value)
  document.body.append(probe)
  const computed = getComputedStyle(probe).getPropertyValue('corner-shape')
  probe.remove()
  return computed
}

test('a theme sets the surface role once and every surface family follows it', async () => {
  const { host } = await mount(
    <ThemeScope theme={theme}>
      <Families />
    </ThemeScope>
  )
  const style = (id: string) => getComputedStyle(host.querySelector(`[data-testid="${id}"]`)!)
  const scoop = cornerShape('scoop')
  for (const id of ['alert', 'toast', 'table', 'first-use', 'code-block', 'carousel'])
    expect(style(id).getPropertyValue('corner-shape'), id).toBe(scoop)
  for (const id of ['card', 'alert', 'toast', 'accordion-item'])
    expect(style(id).backdropFilter, id).toBe('blur(4px)')
  for (const id of ['accordion-item', 'table']) expect(style(id).boxShadow, id).toBe(shadow)
  expect(style('toast').boxShadow).toBe(overlayShadow)
  expect(style('alert').boxShadow).toBe('none')
  for (const id of ['table', 'error', 'code-block', 'separator'])
    expect(style(id).borderTopStyle, id).toBe('dotted')
  expect(style('first-use').borderTopStyle).toBe('dashed')
  expect(style('column-header').textTransform).toBe('uppercase')
  expect(style('row-header').textTransform).toBe('none')
  expect(style('inline-code').borderTopLeftRadius).toBe('5.25px')
  expect(style('inline-code').getPropertyValue('corner-shape')).toBe(cornerShape('bevel'))
  const current = host.querySelector<HTMLElement>('[aria-current="true"]')!
  expect(getComputedStyle(current).backgroundColor).toBe('rgb(7, 8, 9)')
})

test('the default theme keeps the unthemed surface look', async () => {
  const { host } = await mount(
    <ThemeScope theme={defaultTheme}>
      <Families />
    </ThemeScope>
  )
  const style = (id: string) => getComputedStyle(host.querySelector(`[data-testid="${id}"]`)!)
  expect(style('inline-code').borderTopLeftRadius).toBe('4px')
  expect(style('alert').boxShadow).toBe('none')
  for (const id of ['card', 'alert', 'accordion-item'])
    expect(style(id).backdropFilter).toBe('none')
  expect(style('separator').borderTopStyle).toBe('solid')
  const current = host.querySelector<HTMLElement>('[aria-current="true"]')!
  expect(getComputedStyle(current).backgroundColor).toBe('rgba(0, 0, 0, 0)')
})
