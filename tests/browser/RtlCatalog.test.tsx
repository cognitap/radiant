import { act, StrictMode } from 'react'
import { expect, test } from 'vitest'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  AppShell,
  AppShellHeader,
  AppShellMain,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  ButtonGroup,
  Calendar,
  Carousel,
  CarouselNext,
  CarouselPrevious,
  CarouselViewport,
  Cascader,
  Checkbox,
  CodeBlock,
  CodeBlockCopy,
  CodeBlockHeader,
  CodeBlockViewport,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  ColorInput,
  ColorPicker,
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxPortal,
  ComboboxTrigger,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  DataTable,
  DatePicker,
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
  Indicator,
  LocaleProvider,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarPortal,
  MenubarTrigger,
  MultiSelect,
  MultiSelectContent,
  MultiSelectControl,
  MultiSelectInput,
  MultiSelectItem,
  MultiSelectPortal,
  MultiSelectTags,
  MultiSelectTrigger,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  NavLink,
  NavLinkGroup,
  NavLinkGroupContent,
  NavLinkGroupTrigger,
  NumberField,
  OTPField,
  PasswordInput,
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
  Radio,
  RadioGroup,
  RangeSlider,
  Rating,
  Resizable,
  ResizableHandle,
  ResizablePanel,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectPortal,
  SelectTrigger,
  SelectValue,
  Sidebar,
  Stepper,
  Switch,
  TagsInput,
  TimeInput,
  Timeline,
  TimelineItem,
  Toast,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
  Tour,
  TourTrigger,
  Tree,
  TreeSelect
} from '../../src/index.js'
import { click, key, mount, pause, shown } from './familyHarness.js'

const expectRtlOrder = (first: HTMLElement, second: HTMLElement) => {
  expect(first.getBoundingClientRect().x).toBeGreaterThan(second.getBoundingClientRect().x)
}

const expectLtrOrder = (first: HTMLElement, second: HTMLElement) => {
  expect(first.getBoundingClientRect().x).toBeLessThan(second.getBoundingClientRect().x)
}

function rotationDegrees(element: Element) {
  const transform = getComputedStyle(element).transform
  const rotate = getComputedStyle(element).rotate
  if (rotate && rotate !== 'none') return Math.round(parseFloat(rotate))
  if (!transform || transform === 'none') return 0
  const values = transform
    .slice(transform.indexOf('(') + 1, transform.indexOf(')'))
    .split(',')
    .map(Number)
  return Math.round((Math.atan2(values[1]!, values[0]!) * 180) / Math.PI)
}

test('overlays, popups and Toast honor logical positioning, RTL inheritance and explicit overrides', async () => {
  const { host, render } = await mount(
    <StrictMode>
      <LocaleProvider locale="he-IL">
        <div style={{ padding: '4rem 12rem', display: 'grid', gap: '2rem' }}>
          <ToastProvider>
            <ToastViewport aria-label="התראות">
              <Toast
                defaultOpen
                motion="off"
              >
                <ToastTitle>נשמר</ToastTitle>
              </Toast>
            </ToastViewport>
          </ToastProvider>

          <Popover>
            <PopoverTrigger>פרטים</PopoverTrigger>
            <PopoverPortal>
              <PopoverContent
                align="start"
                motion="off"
              >
                תוכן חלון קופץ
              </PopoverContent>
            </PopoverPortal>
          </Popover>

          <Popover>
            <PopoverTrigger>עקיפה</PopoverTrigger>
            <PopoverPortal>
              <PopoverContent
                dir="ltr"
                lang="en-US"
                align="end"
                motion="off"
              >
                Explicit LTR override
              </PopoverContent>
            </PopoverPortal>
          </Popover>

          <Tooltip
            openDelay={0}
            closeDelay={0}
          >
            <TooltipTrigger>עזרה</TooltipTrigger>
            <TooltipPortal>
              <TooltipContent
                align="start"
                motion="off"
              >
                מידע נוסף
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>

          <HoverCard
            openDelay={0}
            closeDelay={0}
          >
            <HoverCardTrigger href="#profile">פרופיל</HoverCardTrigger>
            <HoverCardPortal>
              <HoverCardContent
                align="start"
                motion="off"
              >
                פרטי משתמש
              </HoverCardContent>
            </HoverCardPortal>
          </HoverCard>

          <ContextMenu>
            <ContextMenuTrigger aria-label="אזור תפריט הקשר">תוכן</ContextMenuTrigger>
            <ContextMenuPortal>
              <ContextMenuContent motion="off">
                <ContextMenuSub>
                  <ContextMenuSubTrigger>ייצוא</ContextMenuSubTrigger>
                  <ContextMenuPortal>
                    <ContextMenuSubContent motion="off">
                      <ContextMenuItem>PDF</ContextMenuItem>
                    </ContextMenuSubContent>
                  </ContextMenuPortal>
                </ContextMenuSub>
              </ContextMenuContent>
            </ContextMenuPortal>
          </ContextMenu>

          <Tour
            motion="off"
            steps={[{ target: '#tour-step', title: 'שלב ראשון', description: 'הסבר' }]}
          >
            <TourTrigger>התחל סיור</TourTrigger>
            <Button id="tour-step">יעד</Button>
          </Tour>
        </div>
      </LocaleProvider>
    </StrictMode>,
    true
  )

  const viewport = host.querySelector<HTMLElement>('[data-slot~="toast-viewport"]')!
  expect(getComputedStyle(viewport).direction).toBe('rtl')
  expect(viewport.getBoundingClientRect().left).toBeLessThan(32)
  expect(window.innerWidth - viewport.getBoundingClientRect().right).toBeGreaterThan(200)

  const [popoverTrigger, overrideTrigger] = host.querySelectorAll<HTMLButtonElement>(
    '[data-slot~="popover-trigger"]'
  )
  await click(popoverTrigger!)
  const popover = host.querySelector<HTMLElement>('[data-slot~="popover-content"]:popover-open')!
  expect(popover.getAttribute('dir')).toBe('rtl')
  expect(popover.getAttribute('lang')).toBe('he-IL')
  await expect
    .poll(() =>
      Math.abs(
        popover.getBoundingClientRect().right - popoverTrigger!.getBoundingClientRect().right
      )
    )
    .toBeLessThan(2)
  await key('{Escape}')

  await click(overrideTrigger!)
  const overridePopover = host.querySelector<HTMLElement>(
    '[data-slot~="popover-content"]:popover-open'
  )!
  expect(overridePopover.getAttribute('dir')).toBe('ltr')
  expect(overridePopover.getAttribute('lang')).toBe('en-US')
  expect(getComputedStyle(overridePopover).direction).toBe('ltr')
  await key('{Escape}')

  const tooltipTrigger = host.querySelector<HTMLButtonElement>('[data-slot~="tooltip-trigger"]')!
  await act(async () => tooltipTrigger.focus())
  await expect
    .poll(() => host.querySelector<HTMLElement>('[role="tooltip"]:popover-open'))
    .not.toBeNull()
  const tooltip = host.querySelector<HTMLElement>('[role="tooltip"]:popover-open')!
  expect(getComputedStyle(tooltip).direction).toBe('rtl')
  expect(tooltip.lang).toBe('he-IL')
  await expect
    .poll(() =>
      Math.abs(tooltip.getBoundingClientRect().right - tooltipTrigger.getBoundingClientRect().right)
    )
    .toBeLessThan(2)

  const hoverTrigger = host.querySelector<HTMLAnchorElement>('[data-slot~="hover-card-trigger"]')!
  await act(async () => hoverTrigger.focus())
  await expect
    .poll(() => host.querySelector<HTMLElement>('[data-slot~="hover-card-content"]:popover-open'))
    .not.toBeNull()
  const hoverCard = host.querySelector<HTMLElement>(
    '[data-slot~="hover-card-content"]:popover-open'
  )!
  expect(getComputedStyle(hoverCard).direction).toBe('rtl')
  await expect
    .poll(() =>
      Math.abs(hoverCard.getBoundingClientRect().right - hoverTrigger.getBoundingClientRect().right)
    )
    .toBeLessThan(2)
  await key('{Escape}')

  const contextTrigger = host.querySelector<HTMLElement>('[data-slot~="context-menu-trigger"]')!
  await act(async () => contextTrigger.focus())
  await key('{Shift>}{F10}{/Shift}')
  const contextMenu = host.querySelector<HTMLElement>(
    '[data-slot~="context-menu-content"]:popover-open'
  )!
  expect(getComputedStyle(contextMenu).direction).toBe('rtl')
  await expect
    .poll(() =>
      Math.abs(
        contextMenu.getBoundingClientRect().right - contextTrigger.getBoundingClientRect().right
      )
    )
    .toBeLessThan(2)
  await key('{ArrowLeft}')
  const contextSub = host.querySelector<HTMLElement>(
    '[data-slot~="context-menu-sub-content"]:popover-open'
  )!
  expect(contextSub.dataset.side).toBe('left')
  await key('{ArrowRight}')
  expect(shown(contextSub)).toBe(false)
  await key('{Escape}')

  await click(host.querySelector<HTMLButtonElement>('[data-slot~="tour-trigger"]')!)
  await expect
    .poll(() => host.querySelector<HTMLElement>('[data-slot~="tour-popup"]:popover-open'))
    .not.toBeNull()
  const tourPopup = host.querySelector<HTMLElement>('[data-slot~="tour-popup"]:popover-open')!
  expect(getComputedStyle(tourPopup).direction).toBe('rtl')
  expect(tourPopup.lang).toBe('he-IL')

  await render(
    <LocaleProvider locale="fr-FR">
      <ToastProvider>
        <ToastViewport aria-label="Notifications">
          <Toast
            defaultOpen
            motion="off"
          >
            <ToastTitle>Enregistré</ToastTitle>
          </Toast>
        </ToastViewport>
      </ToastProvider>
    </LocaleProvider>
  )
  const ltrViewport = host.querySelector<HTMLElement>('[data-slot~="toast-viewport"]')!
  expect(window.innerWidth - ltrViewport.getBoundingClientRect().right).toBeLessThan(32)
})

test('disclosures, hierarchy, menus, navigation, stepper and timeline mirror arrows and reading order in RTL', async () => {
  const treeItems = [
    {
      value: 'docs',
      label: 'מסמכים',
      children: [{ value: 'guide', label: 'מדריך' }]
    }
  ]
  const { host } = await mount(
    <StrictMode>
      <LocaleProvider locale="he-IL">
        <div style={{ width: '40rem', display: 'grid', gap: '1.5rem' }}>
          <Collapsible motion="off">
            <CollapsibleTrigger>פרטים נוספים</CollapsibleTrigger>
            <CollapsibleContent>תוכן נסתר</CollapsibleContent>
          </Collapsible>

          <Accordion defaultValue={null}>
            <AccordionItem
              value="a"
              motion="off"
            >
              <AccordionTrigger>שאלה ראשונה</AccordionTrigger>
              <AccordionContent>תשובה</AccordionContent>
            </AccordionItem>
          </Accordion>

          <NavLinkGroup motion="off">
            <NavLinkGroupTrigger>ניווט</NavLinkGroupTrigger>
            <NavLinkGroupContent>
              <NavLink
                href="#home"
                active
              >
                בית
              </NavLink>
            </NavLinkGroupContent>
          </NavLinkGroup>

          <Tree
            aria-label="קבצים"
            items={treeItems}
          />

          <Cascader
            aria-label="אזור"
            items={treeItems}
          />

          <TreeSelect
            aria-label="בחירת עץ"
            items={treeItems}
          />

          <Menubar aria-label="סרגל תפריטים">
            <MenubarMenu value="file">
              <MenubarTrigger>קובץ</MenubarTrigger>
              <MenubarPortal>
                <MenubarContent motion="off">
                  <MenubarItem>חדש</MenubarItem>
                </MenubarContent>
              </MenubarPortal>
            </MenubarMenu>
            <MenubarMenu value="edit">
              <MenubarTrigger>עריכה</MenubarTrigger>
              <MenubarPortal>
                <MenubarContent motion="off">
                  <MenubarItem>העתק</MenubarItem>
                </MenubarContent>
              </MenubarPortal>
            </MenubarMenu>
          </Menubar>

          <NavigationMenu aria-label="ראשי">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger value="products">מוצרים</NavigationMenuTrigger>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger value="docs">תיעוד</NavigationMenuTrigger>
              </NavigationMenuItem>
            </NavigationMenuList>
            <NavigationMenuViewport motion="off">
              <NavigationMenuContent value="products">
                <NavigationMenuLink href="#p">סקירה</NavigationMenuLink>
              </NavigationMenuContent>
              <NavigationMenuContent value="docs">
                <NavigationMenuLink href="#d">מדריך</NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuViewport>
          </NavigationMenu>

          <Breadcrumb aria-label="פירורי לחם">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#home">בית</BreadcrumbLink>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>הגדרות</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Stepper
            aria-label="שלבים"
            defaultValue="one"
            steps={[
              { value: 'one', label: 'שלב 1' },
              { value: 'two', label: 'שלב 2' },
              { value: 'three', label: 'שלב 3' }
            ]}
          />

          <Timeline>
            <TimelineItem
              label="נוצר"
              dateTime="2028-03-01"
              time="10:00"
              active
            >
              האירוע נרשם
            </TimelineItem>
            <TimelineItem
              label="הושלם"
              dateTime="2028-03-02"
              time="12:00"
            />
          </Timeline>
        </div>
      </LocaleProvider>
    </StrictMode>,
    true
  )

  for (const summary of host.querySelectorAll<HTMLElement>(
    '[data-slot~="collapsible-trigger"], [data-slot~="accordion-trigger"], [data-slot~="nav-link-group-trigger"]'
  )) {
    const svg = summary.querySelector('svg')!
    expect(Math.abs(rotationDegrees(svg))).toBe(180)
    await click(summary)
    await pause(20)
    expect(rotationDegrees(svg)).toBe(90)
  }

  const navLink = host.querySelector<HTMLAnchorElement>('[data-slot~="nav-link"]')!
  expect(getComputedStyle(navLink).borderRightWidth).toBe('3px')
  expect(getComputedStyle(navLink).borderLeftWidth).toBe('0px')

  const tree = host.querySelector<HTMLElement>('[role="tree"]')!
  await act(async () => tree.focus())
  await key('{ArrowLeft}')
  expect(tree.querySelector('[data-value="docs"]')).toHaveAttribute('aria-expanded', 'true')
  const childRow = tree.querySelector<HTMLElement>('[data-value="guide"] [data-slot="tree-row"]')!
  expect(parseFloat(getComputedStyle(childRow).paddingRight)).toBeGreaterThan(
    parseFloat(getComputedStyle(childRow).paddingLeft)
  )
  await key('{ArrowRight}')
  expect(tree.querySelector('[data-value="docs"]')).toHaveAttribute('aria-expanded', 'false')

  const cascaderTrigger = host.querySelector<HTMLButtonElement>('[data-slot~="cascader-trigger"]')!
  await click(cascaderTrigger)
  const branchChevron = host.querySelector<HTMLElement>(
    '[data-slot="cascader-option"] span:last-child'
  )!
  expect(Math.abs(rotationDegrees(branchChevron))).toBe(180)
  await key('{ArrowLeft}')
  const columns = host.querySelectorAll<HTMLElement>('[data-slot="cascader-column"]')
  expect(columns).toHaveLength(2)
  expectRtlOrder(columns[0]!, columns[1]!)
  await key('{ArrowRight}')
  expect(document.activeElement).toBe(columns[0])
  await key('{Escape}')

  const treeSelectTrigger = host.querySelector<HTMLButtonElement>(
    '[data-slot~="tree-select-trigger"]'
  )!
  await click(treeSelectTrigger)
  const popupTree = host.querySelector<HTMLElement>(
    '[data-slot~="tree-select-content"]:popover-open [role="tree"]'
  )!
  expect(getComputedStyle(popupTree).direction).toBe('rtl')
  await key('{ArrowLeft}')
  expect(popupTree.querySelector('[data-value="docs"]')).toHaveAttribute('aria-expanded', 'true')
  await key('{Escape}')

  const [fileMenu, editMenu] = host.querySelectorAll<HTMLButtonElement>(
    '[data-slot~="menubar-trigger"]'
  )
  expectRtlOrder(fileMenu!, editMenu!)
  await act(async () => fileMenu!.focus())
  await key('{ArrowLeft}')
  expect(editMenu).toHaveFocus()
  await key('{ArrowRight}')
  expect(fileMenu).toHaveFocus()

  const [productsNav, docsNav] = host.querySelectorAll<HTMLButtonElement>(
    '[data-slot~="navigation-menu-trigger"]'
  )
  expectRtlOrder(productsNav!, docsNav!)
  await act(async () => productsNav!.focus())
  await key('{ArrowLeft}')
  expect(docsNav).toHaveFocus()
  await click(productsNav!)
  const navViewport = host.querySelector<HTMLElement>('[data-slot~="navigation-menu-viewport"]')!
  await expect
    .poll(() =>
      Math.abs(
        navViewport.getBoundingClientRect().right - productsNav!.getBoundingClientRect().right
      )
    )
    .toBeLessThan(2)

  const breadcrumbHome = host.querySelector<HTMLElement>('[data-slot~="breadcrumb-link"]')!
  const breadcrumbPage = host.querySelector<HTMLElement>('[data-slot~="breadcrumb-page"]')!
  expectRtlOrder(breadcrumbHome, breadcrumbPage)

  const stepItems = host.querySelectorAll<HTMLElement>('[data-slot="stepper-item"]')
  expectRtlOrder(stepItems[0]!, stepItems[1]!)
  expectRtlOrder(stepItems[1]!, stepItems[2]!)
  const stepIndicator0 = stepItems[0]!.querySelector<HTMLElement>(
    '[data-slot="stepper-indicator"]'
  )!
  const stepConnector0 = stepItems[0]!.querySelector<HTMLElement>(
    '[data-slot="stepper-connector"]'
  )!
  expect(stepConnector0.getBoundingClientRect().right).toBeLessThanOrEqual(
    stepIndicator0.getBoundingClientRect().left + 1
  )

  const timelineIndicator = host.querySelector<HTMLElement>('[data-slot="timeline-indicator"]')!
  const timelineLabel = host.querySelector<HTMLElement>('[data-slot="timeline-label"]')!
  expectRtlOrder(timelineIndicator, timelineLabel)
})

test('inputs, sliders, dates, times, color picker, table and indicator preserve RTL layout and semantics', async () => {
  const { host } = await mount(
    <StrictMode>
      <LocaleProvider locale="ar-EG">
        <div style={{ width: '36rem', padding: '1rem', display: 'grid', gap: '1.5rem' }}>
          <RangeSlider
            aria-label="نطاق السعر"
            lowerLabel="الحد الأدنى"
            upperLabel="الحد الأقصى"
            defaultValue={[20, 80]}
            step={5}
          />

          <Rating
            label="التقييم"
            defaultValue={2}
          />

          <Calendar
            aria-label="التقويم"
            today="2028-03-15"
            defaultFocusedDate="2028-03-15"
          />

          <DatePicker
            aria-label="تاريخ البدء"
            defaultValue="2028-03-15"
          />

          <TimeInput
            aria-label="الوقت"
            defaultValue="14:05"
          />

          <ColorPicker
            label="اللون"
            defaultValue="#3366cc"
          />

          <ColorInput
            aria-label="لون العلامة"
            defaultValue="#3366cc"
          />

          <Select
            items={[
              { value: 'a', label: 'الأول' },
              { value: 'b', label: 'الثاني' }
            ]}
          >
            <SelectTrigger aria-label="اختيار">
              <SelectValue />
            </SelectTrigger>
            <SelectPortal>
              <SelectContent
                position="popper"
                motion="off"
              >
                <SelectItem value="a">الأول</SelectItem>
                <SelectItem value="b">الثاني</SelectItem>
              </SelectContent>
            </SelectPortal>
          </Select>

          <Combobox items={[{ value: 'cairo', label: 'القاهرة' }]}>
            <ComboboxInput aria-label="المدينة" />
            <ComboboxTrigger aria-label="فتح" />
            <ComboboxPortal>
              <ComboboxContent motion="off">
                <ComboboxItem value="cairo">القاهرة</ComboboxItem>
              </ComboboxContent>
            </ComboboxPortal>
          </Combobox>

          <MultiSelect
            items={[
              { value: 'a', label: 'ألف' },
              { value: 'b', label: 'باء' }
            ]}
            defaultValue={['a']}
          >
            <MultiSelectControl>
              <MultiSelectTags />
              <MultiSelectInput aria-label="وسوم" />
              <MultiSelectTrigger aria-label="عرض الخيارات" />
            </MultiSelectControl>
            <MultiSelectPortal>
              <MultiSelectContent motion="off">
                <MultiSelectItem value="a">ألف</MultiSelectItem>
                <MultiSelectItem value="b">باء</MultiSelectItem>
              </MultiSelectContent>
            </MultiSelectPortal>
          </MultiSelect>

          <ButtonGroup>
            <Button>أول</Button>
            <Button>أوسط</Button>
            <Button>أخير</Button>
          </ButtonGroup>

          <DataTable
            caption="الطلبات"
            rows={[{ id: '1', name: 'تقرير', status: 'جاهز' }]}
            getRowId={row => row.id}
            columns={[
              { id: 'name', header: 'الاسم', cell: row => row.name },
              { id: 'status', header: 'الحالة', cell: row => row.status }
            ]}
          />

          <div style={{ display: 'flex', gap: '2rem', padding: '1rem' }}>
            <Indicator
              label="رسائل"
              statusText="3 غير مقروءة"
              count={3}
              position="top-end"
            >
              {props => <Button {...props}>صندوق</Button>}
            </Indicator>
            <Indicator
              label="تنبيهات"
              statusText="نشط"
              position="top-start"
            >
              {props => <Button {...props}>جرس</Button>}
            </Indicator>
          </div>
        </div>
      </LocaleProvider>
    </StrictMode>,
    true
  )

  const [lowerThumb] = host.querySelectorAll<HTMLInputElement>('[data-slot~="range-slider-thumb"]')
  const rangeBar = host.querySelector<HTMLElement>('[data-slot="range-slider-range"]')!
  expect(rangeBar.style.insetInlineStart).toBe('20%')
  expect(rangeBar.style.insetInlineEnd).toBe('20%')
  await act(async () => lowerThumb!.focus())
  await key('{ArrowLeft}')
  expect(lowerThumb!.valueAsNumber).toBe(25)

  const ratingOptions = host.querySelectorAll<HTMLElement>('[data-slot~="rating-option"]')
  const ratingLabels = host.querySelectorAll<HTMLElement>('[data-slot="rating-icon"]')
  expectRtlOrder(ratingLabels[0]!, ratingLabels[4]!)
  await act(async () => (ratingOptions[1] as HTMLInputElement).focus())
  await key('{ArrowLeft}')
  expect((ratingOptions[2] as HTMLInputElement).checked).toBe(true)

  const calendar = host.querySelector<HTMLElement>('[data-slot="calendar"]')!
  const prevChevron = calendar.querySelector<HTMLElement>(
    '[data-slot~="calendar-previous"] [aria-hidden="true"]'
  )!
  expect(Math.abs(rotationDegrees(prevChevron))).toBe(180)
  const day15 = calendar.querySelector<HTMLButtonElement>('[data-date="2028-03-15"]')!
  const day16 = calendar.querySelector<HTMLButtonElement>('[data-date="2028-03-16"]')!
  expectRtlOrder(day15, day16)
  await act(async () => day15.focus())
  await key('{ArrowLeft}')
  expect(document.activeElement?.getAttribute('data-date')).toBe('2028-03-16')

  const timeHour = host.querySelector<HTMLInputElement>(
    '[data-slot~="time-input"] [data-segment="hour"]'
  )!
  const timeMinute = host.querySelector<HTMLInputElement>(
    '[data-slot~="time-input"] [data-segment="minute"]'
  )!
  const timePeriod = host.querySelector<HTMLButtonElement>('[data-slot~="time-input-period"]')!
  expectLtrOrder(timeHour, timeMinute)
  expectRtlOrder(timeHour, timePeriod)

  const colorCanvas = host.querySelector<HTMLCanvasElement>(
    '[data-slot="color-picker-area"] canvas'
  )!
  expect(getComputedStyle(colorCanvas).scale).toContain('-1')

  const colorInput = host.querySelector<HTMLInputElement>('[data-slot~="color-input-input"]')!
  const colorTrigger = host.querySelector<HTMLButtonElement>('[data-slot~="color-input-trigger"]')!
  expectRtlOrder(colorInput, colorTrigger)

  const selectTrigger = host.querySelector<HTMLButtonElement>('[data-slot~="select-trigger"]')!
  await click(selectTrigger)
  const selectPopup = host.querySelector<HTMLElement>('[data-slot~="select-content"]:popover-open')!
  expect(getComputedStyle(selectPopup).direction).toBe('rtl')
  await expect
    .poll(() =>
      Math.abs(
        selectPopup.getBoundingClientRect().right - selectTrigger.getBoundingClientRect().right
      )
    )
    .toBeLessThan(2)
  await key('{Escape}')

  const multiInput = host.querySelector<HTMLInputElement>(
    '[data-slot~="multi-select-control"] input'
  )!
  const multiTag = host.querySelector<HTMLElement>(
    '[data-slot~="multi-select-control"] [data-slot~="tag"]'
  )!
  expectRtlOrder(multiTag, multiInput)

  const groupButtons = host.querySelectorAll<HTMLButtonElement>(
    '[data-slot~="button-group"] button'
  )
  expectRtlOrder(groupButtons[0]!, groupButtons[2]!)
  expect(parseFloat(getComputedStyle(groupButtons[0]!).borderTopRightRadius)).toBeGreaterThan(0)
  expect(parseFloat(getComputedStyle(groupButtons[0]!).borderTopLeftRadius)).toBe(0)
  expect(parseFloat(getComputedStyle(groupButtons[2]!).borderTopLeftRadius)).toBeGreaterThan(0)
  expect(parseFloat(getComputedStyle(groupButtons[2]!).borderTopRightRadius)).toBe(0)

  const headers = host.querySelectorAll<HTMLElement>('table thead th')
  expectRtlOrder(headers[0]!, headers[1]!)

  const [endIndicator, startIndicator] =
    host.querySelectorAll<HTMLElement>('[data-slot="indicator"]')
  const endMarker = endIndicator!.querySelector<HTMLElement>('[data-slot~="indicator-marker"]')!
  const endTarget = endIndicator!.querySelector<HTMLElement>('button')!
  expect(
    Math.abs(
      endMarker.getBoundingClientRect().left +
        endMarker.getBoundingClientRect().width / 2 -
        endTarget.getBoundingClientRect().left
    )
  ).toBeLessThan(2)
  const startMarker = startIndicator!.querySelector<HTMLElement>('[data-slot~="indicator-marker"]')!
  const startTarget = startIndicator!.querySelector<HTMLElement>('button')!
  expect(
    Math.abs(
      startMarker.getBoundingClientRect().left +
        startMarker.getBoundingClientRect().width / 2 -
        startTarget.getBoundingClientRect().right
    )
  ).toBeLessThan(2)
})

test('scrolling, carousel, resizable, AppShell and CodeBlock obey RTL geometry and dynamic direction switches', async () => {
  const { host } = await mount(
    <StrictMode>
      <LocaleProvider locale="he-IL">
        <div style={{ width: '44rem', display: 'grid', gap: '1.5rem' }}>
          <ScrollArea
            aria-label="אזור גלילה"
            orientation="both"
            visibility="always"
            style={{ width: 240, height: 140 }}
          >
            <div style={{ width: 700, height: 400 }}>תוכן רחב</div>
          </ScrollArea>

          <Carousel
            aria-label="שקופיות"
            defaultValue="s1"
            items={[
              { value: 's1', label: 'אחת', children: <div style={{ height: 80 }}>שקופית 1</div> },
              { value: 's2', label: 'שתיים', children: <div style={{ height: 80 }}>שקופית 2</div> }
            ]}
          >
            <CarouselViewport style={{ width: 320 }} />
            <div>
              <CarouselPrevious>הקודם</CarouselPrevious>
              <CarouselNext>הבא</CarouselNext>
            </div>
          </Carousel>

          <Resizable
            defaultValue={[40, 60]}
            items={[{ value: 'nav' }, { value: 'main' }]}
            style={{ width: 400, height: 80 }}
          >
            <ResizablePanel value="nav">תפריט</ResizablePanel>
            <ResizableHandle
              value="nav"
              aria-label="שנה גודל"
              step={10}
            />
            <ResizablePanel value="main">ראשי</ResizablePanel>
          </Resizable>

          <AppShell
            motion="off"
            style={{ height: 220, width: 680 }}
          >
            <AppShellHeader>כותרת</AppShellHeader>
            <Sidebar label="ניווט צדדי">
              <NavLink
                href="#a"
                active
              >
                ראשי
              </NavLink>
            </Sidebar>
            <AppShellMain>תוכן עיקרי</AppShellMain>
          </AppShell>

          <CodeBlock code={'const x = 1\nconst y = 2'}>
            <CodeBlockHeader>
              <span>index.ts</span>
              <CodeBlockCopy />
            </CodeBlockHeader>
            <CodeBlockViewport aria-label="קוד" />
          </CodeBlock>
        </div>
      </LocaleProvider>
    </StrictMode>,
    true
  )

  const scrollArea = host.querySelector<HTMLElement>('[data-slot~="scroll-area"]')!
  const verticalBar = () =>
    scrollArea.querySelector<HTMLElement>('[data-scroll-area-hit][data-axis="vertical"]')!
  expect(
    verticalBar().getBoundingClientRect().left - scrollArea.getBoundingClientRect().left
  ).toBeLessThan(2)

  // Dynamically flip the LocaleProvider host dir without re-rendering ScrollArea.
  const scope = host.firstElementChild as HTMLElement
  await act(async () => {
    scope.setAttribute('dir', 'ltr')
  })
  await expect
    .poll(
      () => scrollArea.getBoundingClientRect().right - verticalBar().getBoundingClientRect().right
    )
    .toBeLessThan(2)
  await act(async () => {
    scope.setAttribute('dir', 'rtl')
  })
  await expect
    .poll(
      () => verticalBar().getBoundingClientRect().left - scrollArea.getBoundingClientRect().left
    )
    .toBeLessThan(2)

  const carouselViewport = host.querySelector<HTMLElement>('[data-slot~="carousel-viewport"]')!
  const slides = carouselViewport.querySelectorAll<HTMLElement>('[data-slot="carousel-slide"]')
  expectRtlOrder(slides[0]!, slides[1]!)
  await act(async () => carouselViewport.focus())
  await key('{ArrowLeft}')
  expect(slides[1]).toHaveAttribute('data-selected', '')
  await key('{ArrowRight}')
  expect(slides[0]).toHaveAttribute('data-selected', '')

  const [navPanel, mainPanel] = host.querySelectorAll<HTMLElement>('[data-slot~="resizable-panel"]')
  expectRtlOrder(navPanel!, mainPanel!)
  const handle = host.querySelector<HTMLElement>('[data-slot~="resizable-handle"]')!
  await act(async () => handle.focus())
  await key('{ArrowLeft}')
  expect(handle.getAttribute('aria-valuenow')).toBe('50')
  await key('{ArrowRight}')
  expect(handle.getAttribute('aria-valuenow')).toBe('40')

  const sidebar = host.querySelector<HTMLElement>('[data-slot~="sidebar"]')!
  const main = host.querySelector<HTMLElement>('[data-slot~="app-shell-main"]')!
  expectRtlOrder(sidebar, main)
  expect(getComputedStyle(sidebar).borderLeftWidth).toBe('1px')
  expect(getComputedStyle(sidebar).borderRightWidth).toBe('0px')

  const codeHeader = host.querySelector<HTMLElement>('[data-slot~="code-block-header"]')!
  expectRtlOrder(
    codeHeader.querySelector<HTMLElement>('span')!,
    codeHeader.querySelector<HTMLElement>('button')!
  )
  const codeViewport = host.querySelector<HTMLElement>('[data-slot~="code-block-viewport"]')!
  expect(getComputedStyle(codeViewport).direction).toBe('ltr')
})

test('direct dir overrides on controls and dynamic ToggleGroup ancestor direction changes stay aligned', async () => {
  const { host } = await mount(
    <StrictMode>
      <LocaleProvider locale="fr-FR">
        <div style={{ width: '28rem', display: 'grid', gap: '1rem' }}>
          <Switch
            dir="rtl"
            label="התראות"
            defaultChecked
          />
          <Checkbox
            dir="rtl"
            label="אישור"
          />
          <RadioGroup label="תוכנית">
            <Radio
              dir="rtl"
              value="pro"
              label="מקצועי"
              description="גישה מלאה"
            />
          </RadioGroup>
          <TagsInput
            dir="rtl"
            aria-label="תגיות"
            defaultValue={['אחד']}
          />
          <NumberField
            dir="rtl"
            aria-label="כמות"
            defaultValue={4}
          />
          <PasswordInput
            dir="rtl"
            aria-label="סיסמה"
          />
          <OTPField
            dir="rtl"
            aria-label="קוד"
            defaultValue="12"
          />
          <div id="dynamic-toggle-scope">
            <ToggleGroup
              aria-label="תצוגה"
              variant="segmented"
              defaultValue="first"
              motion="off"
            >
              <ToggleGroupItem value="first">ראשון</ToggleGroupItem>
              <ToggleGroupItem value="second">שני</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </LocaleProvider>
    </StrictMode>,
    true
  )

  const switchInput = host.querySelector<HTMLElement>('[data-slot~="switch"]')!
  const switchLabel = host.querySelector<HTMLElement>('[data-slot="switch-label"]')!
  expectRtlOrder(switchInput, switchLabel)

  const checkboxInput = host.querySelector<HTMLElement>('[data-slot~="checkbox"]')!
  const checkboxLabel = host.querySelector<HTMLElement>('[data-slot="checkbox-label"]')!
  expectRtlOrder(checkboxInput, checkboxLabel)

  const radioInput = host.querySelector<HTMLElement>('[data-slot~="radio"]')!
  const radioLabel = host.querySelector<HTMLElement>('[data-slot="radio-label"]')!
  expectRtlOrder(radioInput, radioLabel)

  const tag = host.querySelector<HTMLElement>('[data-slot~="tag"]')!
  const tagsInput = host.querySelector<HTMLElement>('[data-slot~="tags-input"]')!
  expectRtlOrder(tag, tagsInput)

  const numberInput = host.querySelector<HTMLElement>('[data-slot~="number-field"]')!
  const numberActions = host.querySelector<HTMLElement>('[data-slot~="number-field-actions"]')!
  expectRtlOrder(numberInput, numberActions)

  const passwordInput = host.querySelector<HTMLElement>('[data-slot~="password-input"]')!
  const passwordToggle = host.querySelector<HTMLElement>('[data-slot~="password-input-toggle"]')!
  expectRtlOrder(passwordInput, passwordToggle)

  const otpSlots = host.querySelectorAll<HTMLElement>('[data-slot="otp-field-slot"]')
  expectRtlOrder(otpSlots[0]!, otpSlots[5]!)

  const toggleScope = host.querySelector<HTMLElement>('#dynamic-toggle-scope')!
  const firstToggle = toggleScope.querySelector<HTMLButtonElement>('[data-value="first"]')!
  const indicator = toggleScope.querySelector<HTMLElement>('[data-slot="toggle-group-indicator"]')!
  await expect
    .poll(() =>
      Math.abs(indicator.getBoundingClientRect().left - firstToggle.getBoundingClientRect().left)
    )
    .toBeLessThan(2)
  await act(async () => {
    toggleScope.style.direction = 'rtl'
  })
  await expect
    .poll(() =>
      Math.abs(indicator.getBoundingClientRect().left - firstToggle.getBoundingClientRect().left)
    )
    .toBeLessThan(2)
})
