import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, expect, test, vi } from 'vitest'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  AppShell,
  AppShellHeader,
  AppShellMain,
  Autocomplete,
  Combobox,
  Command,
  CommandClose,
  CommandContent,
  CommandDescription,
  CommandInput,
  CommandList,
  CommandTitle,
  CommandTrigger,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
  Field,
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
  Menu,
  MenuContent,
  MenuItem,
  MenuPortal,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarPortal,
  MenubarTrigger,
  MultiSelect,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
  Sidebar,
  SidebarTrigger,
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger
} from '../../src/index.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: { host: HTMLDivElement; root: Root }[] = []
afterEach(async () => {
  for (const { host, root } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
})

const items = [
  { value: 'oslo', label: 'Oslo' },
  { value: 'lima', label: 'Lima' }
]
// Callers cannot replace a trigger's open state.
const spoof = { 'data-state': 'spoofed' } as Record<string, string>

const cases: { family: string; triggers: string[]; tree: (open: boolean) => ReactNode }[] = [
  {
    family: 'Popover',
    triggers: ['popover-trigger'],
    tree: open => (
      <Popover open={open}>
        <PopoverTrigger {...spoof}>Filters</PopoverTrigger>
        <PopoverPortal>
          <PopoverContent>
            <PopoverClose>Done</PopoverClose>
          </PopoverContent>
        </PopoverPortal>
      </Popover>
    )
  },
  {
    family: 'Menu',
    triggers: ['menu-trigger'],
    tree: open => (
      <Menu open={open}>
        <MenuTrigger {...spoof}>Actions</MenuTrigger>
        <MenuPortal>
          <MenuContent motion="off">
            <MenuItem>Rename</MenuItem>
          </MenuContent>
        </MenuPortal>
      </Menu>
    )
  },
  {
    family: 'MenuSub',
    triggers: ['menu-sub-trigger'],
    tree: open => (
      <Menu open>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuPortal>
          <MenuContent motion="off">
            <MenuItem>Rename</MenuItem>
            <MenuSub open={open}>
              <MenuSubTrigger {...spoof}>Export</MenuSubTrigger>
              <MenuPortal>
                <MenuSubContent motion="off">
                  <MenuItem>PDF</MenuItem>
                </MenuSubContent>
              </MenuPortal>
            </MenuSub>
          </MenuContent>
        </MenuPortal>
      </Menu>
    )
  },
  {
    family: 'Menubar',
    triggers: ['menubar-trigger'],
    tree: open => (
      <Menubar
        value={open ? 'file' : null}
        aria-label="Editor"
      >
        <MenubarMenu value="file">
          <MenubarTrigger {...spoof}>File</MenubarTrigger>
          <MenubarPortal>
            <MenubarContent motion="off">
              <MenubarItem>Save</MenubarItem>
            </MenubarContent>
          </MenubarPortal>
        </MenubarMenu>
      </Menubar>
    )
  },
  {
    family: 'HoverCard',
    triggers: ['hover-card-trigger'],
    tree: open => (
      <HoverCard open={open}>
        <HoverCardTrigger
          href="#profile"
          {...spoof}
        >
          Lee Chen
        </HoverCardTrigger>
        <HoverCardPortal>
          <HoverCardContent>Design systems engineer.</HoverCardContent>
        </HoverCardPortal>
      </HoverCard>
    )
  },
  {
    family: 'Dialog',
    triggers: ['dialog-trigger'],
    tree: open => (
      <Dialog open={open}>
        <DialogTrigger {...spoof}>Edit</DialogTrigger>
        <DialogContent motion="off">
          <DialogTitle>Edit profile</DialogTitle>
          <DialogClose>Close</DialogClose>
        </DialogContent>
      </Dialog>
    )
  },
  {
    family: 'AlertDialog',
    triggers: ['alert-dialog-trigger'],
    tree: open => (
      <AlertDialog open={open}>
        <AlertDialogTrigger>Delete</AlertDialogTrigger>
        <AlertDialogContent motion="off">
          <AlertDialogTitle>Delete project?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          <AlertDialogCancel>Keep</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    )
  },
  {
    family: 'Drawer',
    triggers: ['drawer-trigger'],
    tree: open => (
      <Drawer open={open}>
        <DrawerTrigger>Settings</DrawerTrigger>
        <DrawerContent motion="off">
          <DrawerTitle>Settings</DrawerTitle>
          <DrawerClose>Close</DrawerClose>
        </DrawerContent>
      </Drawer>
    )
  },
  {
    family: 'Command',
    triggers: ['dialog-trigger'],
    tree: open => (
      <Command
        open={open}
        items={items}
        onAction={() => {}}
      >
        <CommandTrigger>Commands</CommandTrigger>
        <CommandContent motion="off">
          <CommandTitle>Commands</CommandTitle>
          <CommandDescription>Run an action.</CommandDescription>
          <CommandInput aria-label="Search commands" />
          <CommandList />
          <CommandClose>Close</CommandClose>
        </CommandContent>
      </Command>
    )
  },
  ...(
    [
      ['Combobox', Combobox],
      ['Autocomplete', Autocomplete],
      ['MultiSelect', MultiSelect]
    ] as const
  ).map(([family, Family]) => ({
    family,
    triggers: ['combobox-input', 'combobox-trigger'],
    tree: (open: boolean) => (
      <Field label="City">
        <Family
          items={items}
          open={open}
        />
      </Field>
    )
  })),
  {
    family: 'AppShell',
    triggers: ['sidebar-trigger'],
    tree: open => (
      <AppShell
        collapsed={!open}
        style={{ height: '300px', width: '900px' }}
      >
        <AppShellHeader>
          <SidebarTrigger {...spoof}>Navigation</SidebarTrigger>
        </AppShellHeader>
        <Sidebar label="Projects">Atlas</Sidebar>
        <AppShellMain>Workspace</AppShellMain>
      </AppShell>
    )
  }
]

test.each(cases)(
  '$family triggers mirror aria-expanded in data-state',
  async ({ tree, triggers }) => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    mounted.push({ host, root })
    for (const open of [false, true, false]) {
      await act(async () => root.render(tree(open)))
      for (const slot of triggers) {
        const nodes = document.querySelectorAll(`[data-slot~="${slot}"]`)
        expect(nodes.length, slot).toBeGreaterThan(0)
        for (const node of nodes) {
          expect(node.getAttribute('aria-expanded'), slot).toBe(String(open))
          expect(node.getAttribute('data-state'), slot).toBe(open ? 'open' : 'closed')
        }
      }
    }
    for (const close of document.querySelectorAll(
      '[data-slot~="dialog-close"], [data-slot~="popover-close"]:not([aria-haspopup])'
    ))
      expect(close.hasAttribute('data-state')).toBe(false)
  }
)

test('a tooltip trigger opens nothing, so it carries no disclosure state', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  mounted.push({ host, root })
  await act(async () =>
    root.render(
      <Tooltip open>
        <TooltipTrigger>Export</TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>Download a CSV file.</TooltipContent>
        </TooltipPortal>
      </Tooltip>
    )
  )
  const trigger = host.querySelector('[data-slot~="tooltip-trigger"]')!
  expect(trigger.hasAttribute('data-state')).toBe(false)
  expect(trigger.hasAttribute('aria-expanded')).toBe(false)
})
