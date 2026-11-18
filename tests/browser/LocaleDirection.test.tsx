import { act } from 'react'
import { expect, test, vi } from 'vitest'
import {
  Button,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHandle,
  DrawerTitle,
  DrawerTrigger,
  getLocaleAttributes,
  LocaleProvider,
  Menu,
  MenuContent,
  MenuItem,
  MenuPortal,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  Pagination,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
  Slider,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar
} from '../../src/index.js'
import { click, key, mount, shown } from './familyHarness.js'

function DirectionControls({ navigate }: { navigate: (href: string) => void }) {
  return (
    <div style={{ maxWidth: '28rem' }}>
      <Slider
        aria-label="Volume"
        defaultValue={40}
        step={5}
      />
      <Tabs
        defaultValue="summary"
        loop={false}
      >
        <TabsList aria-label="Views">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="summary">Summary view</TabsContent>
        <TabsContent value="history">History view</TabsContent>
      </Tabs>
      <Toolbar
        aria-label="Actions"
        loop={false}
      >
        <Button>Save</Button>
        <Button>Share</Button>
      </Toolbar>
      <ToggleGroup
        aria-label="Density"
        variant="segmented"
        defaultValue="compact"
        loop={false}
      >
        <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
        <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
      </ToggleGroup>
      <Pagination aria-label="Pages">
        <PaginationList>
          <PaginationItem>
            <PaginationPrevious href="#page-1" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#page-2"
              current
            >
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#page-3"
              onClick={event => {
                event.preventDefault()
                navigate(event.currentTarget.hash)
              }}
            />
          </PaginationItem>
        </PaginationList>
      </Pagination>
      <div style={{ position: 'fixed', left: '45vw', top: '15vh' }}>
        <Menu>
          <MenuTrigger>Report actions</MenuTrigger>
          <MenuPortal>
            <MenuContent
              motion="off"
              align="start"
            >
              <MenuSub>
                <MenuSubTrigger>Export</MenuSubTrigger>
                <MenuPortal>
                  <MenuSubContent motion="off">
                    <MenuItem>PDF</MenuItem>
                  </MenuSubContent>
                </MenuPortal>
              </MenuSub>
            </MenuContent>
          </MenuPortal>
        </Menu>
      </div>
      <Drawer
        modal={false}
        defaultSnapPoint={0.5}
        snapPoints={[0.5, 1]}
      >
        <DrawerTrigger>Open filters</DrawerTrigger>
        <DrawerContent
          side="start"
          motion="off"
        >
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerHandle aria-label="Resize filters" />
          <DrawerClose>Close filters</DrawerClose>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

const cases = [
  { documentLocale: 'he-IL', scope: null, direction: 'rtl' },
  { documentLocale: 'fr-FR', scope: null, direction: 'ltr' },
  { documentLocale: 'he-IL', scope: 'fr-FR', direction: 'ltr' },
  { documentLocale: 'fr-FR', scope: 'he-IL', direction: 'rtl' }
] as const

test.each(cases)(
  'direction-sensitive controls follow $documentLocale with scope $scope',
  async ({ documentLocale, scope, direction }) => {
    const html = document.documentElement
    const previousLang = html.getAttribute('lang')
    const previousDir = html.getAttribute('dir')
    const { lang, dir } = getLocaleAttributes(documentLocale)
    html.setAttribute('lang', lang!)
    html.setAttribute('dir', dir!)

    const navigate = vi.fn()
    try {
      const { host } = await mount(
        scope ? (
          <LocaleProvider
            locale={documentLocale}
            scope="document"
          >
            <LocaleProvider locale={scope}>
              <DirectionControls navigate={navigate} />
            </LocaleProvider>
          </LocaleProvider>
        ) : (
          <DirectionControls navigate={navigate} />
        ),
        true
      )

      const forward = direction === 'rtl' ? '{ArrowLeft}' : '{ArrowRight}'
      const backward = direction === 'rtl' ? '{ArrowRight}' : '{ArrowLeft}'
      const inOrder = (first: HTMLElement, last: HTMLElement) => {
        const difference = last.getBoundingClientRect().x - first.getBoundingClientRect().x
        expect(direction === 'rtl' ? -difference : difference).toBeGreaterThan(0)
      }
      const slider = host.querySelector<HTMLInputElement>('input[type="range"]')!
      expect(getComputedStyle(slider).direction).toBe(direction)
      await act(async () => slider.focus())
      await key(backward)
      expect(slider.valueAsNumber).toBe(35)
      await key(forward)
      expect(slider.valueAsNumber).toBe(40)

      const [summary, history] = host.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      const [save, share] = host.querySelectorAll<HTMLButtonElement>('[role="toolbar"] button')
      const [compact, comfortable] = host.querySelectorAll<HTMLButtonElement>(
        '[data-slot~="toggle-group-item"]'
      )
      for (const [first, second] of [
        [summary, history],
        [save, share],
        [compact, comfortable]
      ]) {
        inOrder(first, second)
        await act(async () => first.focus())
        await key(backward)
        expect(first).toHaveFocus()
        await key(forward)
        expect(second).toHaveFocus()
      }
      expect(history).toHaveAttribute('aria-selected', 'true')
      await key('{Space}')
      expect(comfortable).toHaveAttribute('aria-pressed', 'true')

      const [previous, current, next] = host.querySelectorAll<HTMLAnchorElement>('nav a')
      inOrder(previous, current)
      inOrder(current, next)
      expect(current).toHaveAttribute('aria-current', 'page')
      await act(async () => next.focus())
      await key('{Enter}')
      expect(navigate).toHaveBeenCalledExactlyOnceWith('#page-3')

      const trigger = host.querySelector<HTMLButtonElement>('[data-slot~="menu-trigger"]')!
      await click(trigger)
      const menu = host.querySelector<HTMLElement>('[role="menu"]:popover-open')!
      expect(menu.lang).toBe(scope ?? documentLocale)
      expect(getComputedStyle(menu).direction).toBe(direction)
      const edge = direction === 'rtl' ? 'right' : 'left'
      const inlineStartGap = () =>
        Math.abs(menu.getBoundingClientRect()[edge] - trigger.getBoundingClientRect()[edge])
      await expect.poll(inlineStartGap).toBeLessThan(2)
      const submenuTrigger = menu.querySelector<HTMLButtonElement>(
        '[data-slot~="menu-sub-trigger"]'
      )!
      expect(submenuTrigger).toHaveFocus()
      await key(forward)
      const submenu = host.querySelector<HTMLElement>('[data-slot~="menu-sub-content"]')!
      expect(shown(submenu)).toBe(true)
      expect(submenu.lang).toBe(scope ?? documentLocale)
      expect(submenu.dataset.side).toBe(direction === 'rtl' ? 'left' : 'right')
      expect(submenu.querySelector('button')).toHaveFocus()
      await key(backward)
      expect(shown(submenu)).toBe(false)
      expect(submenuTrigger).toHaveFocus()
      await key('{Escape}')
      expect(shown(menu)).toBe(false)

      await click(host.querySelector<HTMLButtonElement>('[data-slot~="drawer-trigger"]')!)
      const drawer = host.querySelector('dialog')!
      const drawerViewport = drawer.querySelector<HTMLElement>('[data-slot="drawer-viewport"]')!
      expect(drawer.open).toBe(true)
      const side = direction === 'rtl' ? 'right' : 'left'
      expect(drawer.dataset.physicalSide).toBe(side)
      const viewportEdge = side === 'right' ? window.innerWidth : 0
      const initialWidth = drawerViewport.getBoundingClientRect().width
      const handle = drawer.querySelector<HTMLButtonElement>('[data-slot~="drawer-handle"]')!
      await act(async () => handle.focus())
      await key(forward)
      await expect
        .poll(() => drawerViewport.getBoundingClientRect().width)
        .toBeGreaterThan(initialWidth)
      expect(Math.abs(drawer.getBoundingClientRect()[side] - viewportEdge)).toBeLessThan(2)
      await click(drawer.querySelector<HTMLButtonElement>('[data-slot~="drawer-close"]')!)
      expect(drawer.open).toBe(false)
    } finally {
      await act(async () => {
        if (previousLang === null) html.removeAttribute('lang')
        else html.setAttribute('lang', previousLang)
        if (previousDir === null) html.removeAttribute('dir')
        else html.setAttribute('dir', previousDir)
      })
    }
  }
)
