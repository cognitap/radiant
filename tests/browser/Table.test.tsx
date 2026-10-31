import { createRef, StrictMode, useState } from 'react'
import { expect, test } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { commands } from 'vitest/browser'
import {
  Table,
  TableCaption,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  TableContainer,
  Link,
  Button,
  ThemeScope,
  defineTheme
} from '../../src/index.js'
import { mount, click, key, pause } from './familyHarness.js'
test('native table hierarchy hydrates with captions, row headers, refs and interactive cells', async () => {
  const table = createRef<HTMLTableElement>(),
    cell = createRef<HTMLTableCellElement>()
  let calls = 0
  const { host } = await mount(
    <StrictMode>
      <button>Before table</button>
      <Table ref={table}>
        <TableCaption>Team members</TableCaption>
        <TableHead>
          <TableRow>
            <TableHeader id="name">Name</TableHeader>
            <TableHeader id="action">Action</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableHeader
              scope="row"
              id="jordan"
            >
              Jordan
            </TableHeader>
            <TableCell
              ref={cell}
              headers="action jordan"
            >
              <Link href="#profile">Profile</Link>
              <Button onClick={() => calls++}>Select Jordan</Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </StrictMode>,
    true
  )
  expect(table.current).toBe(host.querySelector('table'))
  expect(cell.current).toBe(host.querySelector('td'))
  expect(table.current!.caption!.textContent).toBe('Team members')
  expect(host.querySelector('th')!.scope).toBe('col')
  expect(host.querySelector('tbody th')!.getAttribute('scope')).toBe('row')
  expect(cell.current!.headers).toBe('action jordan')
  await click(host.querySelector('button')!)
  await key('{Tab}')
  expect(document.activeElement).toBe(host.querySelector('a'))
  await key('{Tab}')
  expect(document.activeElement).toBe(host.querySelector('td button'))
  await key('{Enter}')
  expect(calls).toBe(1)
})
test('named native overflow surface scrolls by keyboard and caller themes preserve reflow', async () => {
  const theme = defineTheme({
    id: 'table-proof',
    name: 'Table proof',
    components: {
      table: { paddingInline: '13px', paddingBlock: '9px', fontSize: '17px', radius: '11px' }
    }
  })
  function App() {
    const [wide, setWide] = useState(true)
    return (
      <ThemeScope
        theme={theme}
        mode="dark"
      >
        <button onClick={() => setWide(false)}>Reflow</button>
        <TableContainer
          aria-label="Scrollable members"
          style={{ width: '180px' }}
        >
          <Table style={{ minWidth: wide ? '500px' : undefined }}>
            <TableCaption>Members</TableCaption>
            <TableBody>
              <TableRow>
                <TableHeader scope="row">LongUnbrokenMemberNameThatWraps</TableHeader>
                <TableCell>Active member</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </ThemeScope>
    )
  }
  const { host } = await mount(<App />)
  const region = host.querySelector<HTMLElement>('[data-slot~="table-container"]')!,
    table = host.querySelector('table')!
  expect(region.scrollWidth).toBeGreaterThan(region.clientWidth)
  expect(getComputedStyle(table).display).toBe('table')
  expect(getComputedStyle(table).fontSize).toBe('17px')
  expect(getComputedStyle(host.querySelector('td')!).paddingInlineStart).toBe('13px')
  expect(getComputedStyle(region).borderRadius).toBe('11px')
  await click(host.querySelector('button')!) // Switch to wrapping content before keyboard focus.
  expect(region.scrollWidth).toBeLessThanOrEqual(region.clientWidth)
  // Restore wide markup to exercise native keyboard scrolling independently of app state.
  const { host: wideHost } = await mount(
    <>
      <button>Before wide table</button>
      <TableContainer
        aria-label="Wide records"
        style={{ width: '180px' }}
      >
        <Table style={{ minWidth: '500px' }}>
          <TableBody>
            <TableRow>
              <TableCell>Wide content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
  const wideRegion = wideHost.querySelector<HTMLElement>('[data-slot~="table-container"]')!
  await click(wideHost.querySelector('button')!)
  await key('{Tab}')
  expect(document.activeElement).toBe(wideRegion)
  await key('{ArrowRight}')
  await pause(150)
  expect(wideRegion.scrollLeft).toBeGreaterThan(0)
  await commands.emulatePreferences({ forcedColors: 'active', reducedMotion: 'reduce' })
  expect(getComputedStyle(wideHost.querySelector('table')!).display).toBe('table')
  expect(wideRegion.tabIndex).toBe(0)
})
test('TableContainer takes its name like every other named host', async () => {
  const { host } = await mount(
    <>
      <h2 id="members-heading">Members</h2>
      <TableContainer
        aria-label="Scrollable members"
        aria-labelledby="members-heading"
      >
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Jordan</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
  const region = host.querySelector('section')!
  expect(region.getAttribute('aria-labelledby')).toBe('members-heading')
  expect(region.getAttribute('aria-label')).toBe('Scrollable members')
  expect(() => renderToStaticMarkup(<TableContainer aria-label=" " />)).toThrow(
    'TableContainer requires aria-label or aria-labelledby.'
  )
})
