import { createRef } from 'react'
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  AppShellSkipLink,
  Sidebar,
  SidebarTrigger,
  SidebarLabel,
  SidebarContent,
  type AppShellProps,
  type AppShellRenderProps,
  type SidebarRenderProps
} from '../../src/index.js'
export const native = (
  <AppShell
    collapsed={false}
    open={false}
    onCollapsedChange={(collapsed: boolean) => void collapsed}
    onOpenChange={(open: boolean) => void open}
    ref={createRef<HTMLDivElement>()}
  >
    <AppShellSkipLink render={(props: AppShellRenderProps) => <a {...props}>{props.children}</a>}>
      Skip
    </AppShellSkipLink>
    <AppShellHeader ref={createRef<HTMLElement>()}>
      <SidebarTrigger render={(props: SidebarRenderProps) => <button {...props} />}>
        Toggle
      </SidebarTrigger>
    </AppShellHeader>
    <Sidebar
      label="Projects"
      ref={createRef<HTMLElement>()}
    >
      <SidebarContent expandedOnly>
        <SidebarLabel>Project</SidebarLabel>
      </SidebarContent>
    </Sidebar>
    <AppShellMain ref={createRef<HTMLElement>()}>Content</AppShellMain>
  </AppShell>
)
// @ts-expect-error Each axis has one owner.
export const mixedCollapse: AppShellProps = { collapsed: true, defaultCollapsed: false }
// @ts-expect-error Mobile disclosure also has one owner.
export const mixedOpen: AppShellProps = { open: true, defaultOpen: false }
// @ts-expect-error Sidebar needs a visible navigation label.
export const unnamed = <Sidebar />
// @ts-expect-error Opening navigation is not a pressed-state toggle.
export const pressed = <SidebarTrigger pressed>Navigation</SidebarTrigger>
export const undefinedToggle = (
  <SidebarTrigger
    pressed={undefined}
    defaultPressed={undefined}
    onPressedChange={undefined}
  >
    Navigation
  </SidebarTrigger>
)
// @ts-expect-error Main owns the skip destination; set its ID on AppShell.
export const mainId = <AppShellMain id="other" />
