import { createRef } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerHandle,
  DrawerTrigger,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  useDrawer,
  type DrawerProps,
  type DrawerHandleProps
} from '@cognitap/radiant'
export const drawerTypes = (
  <Drawer
    open={true}
    onOpenChange={open => void open}
    snapPoint={0.5}
    onSnapPointChange={point => void point}
    snapPoints={[0.5, 1]}
    modal={false}
  >
    <DrawerTrigger render={props => <button {...props} />}>Open</DrawerTrigger>
    <DrawerContent
      ref={createRef<HTMLDialogElement>()}
      side="start"
      style={{ '--rad-drawer-size': '30rem' }}
      parts={{ viewport: { className: 'gap-3', style: { padding: 20 } } }}
    >
      <DrawerHandle
        aria-label="Resize"
        ref={createRef<HTMLButtonElement>()}
      />
      <DrawerTitle>Title</DrawerTitle>
      <DrawerDescription>Description</DrawerDescription>
      <DrawerClose>Close</DrawerClose>
    </DrawerContent>
  </Drawer>
)
// @ts-expect-error one snap state owner
const conflicting: DrawerProps = { snapPoint: 1, defaultSnapPoint: 0.5 }
// @ts-expect-error one native dialog open owner
const conflictingOpen: DrawerProps = { open: true, defaultOpen: false }
// @ts-expect-error the handle needs an accessible name
const unnamed = <DrawerHandle />
const toggle = (
  <DrawerHandle
    aria-label="Resize"
    // @ts-expect-error the handle has no independent toggle state
    pressed
  />
)
function State() {
  const state = useDrawer()
  if (state) {
    state.setSnapPoint(state.snapPoints[0])
    state.setOpen(false)
    const controlled: boolean = state.snapControlled
    void controlled
  }
  return null
}
void conflicting
void conflictingOpen
void unnamed
void toggle
void State

// @ts-expect-error the resize handle owns its button type
const submitHandle: DrawerHandleProps = { 'aria-label': 'Resize', type: 'submit' }
// @ts-expect-error drag presentation belongs to Content, not Button press motion
const motionHandle: DrawerHandleProps = { 'aria-label': 'Resize', motion: 'inherit' }
void submitHandle
void motionHandle
