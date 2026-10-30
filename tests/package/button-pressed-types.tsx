import { createRef } from 'react'
import { Button, Tabs, TabsList, TabsTrigger, type ButtonProps } from '@cognitap/radiant'
const ref = createRef<HTMLButtonElement>()
export const toggles = (
  <>
    <Button
      pressed={false}
      onPressedChange={next => {
        const pressed: boolean = next
        return pressed
      }}
      ref={ref}
    >
      Bold
    </Button>
    <Button
      defaultPressed
      onPressedChange={() => {}}
    >
      Bookmark
    </Button>
    <Button onPressedChange={() => {}}>Mute</Button>
    <Button aria-pressed="mixed">Consumer-owned state</Button>
  </>
)
// @ts-expect-error A pressed value and initial default cannot share ownership.
const collision: ButtonProps = { pressed: true, defaultPressed: false }
// @ts-expect-error The pressed API owns aria-pressed.
const rawState: ButtonProps = { pressed: false, 'aria-pressed': true }
// @ts-expect-error Pressed state is boolean, not a tri-state checkbox.
const mixed: ButtonProps = { pressed: 'mixed' }
const invalidTab = {
  value: 'a',
  // @ts-expect-error Tabs own selected state rather than Button pressed state.
  pressed: true
} satisfies import('@cognitap/radiant').TabsTriggerProps
const tab = (
  <Tabs defaultValue="a">
    <TabsList>
      <TabsTrigger value="a">A</TabsTrigger>
    </TabsList>
  </Tabs>
)
void invalidTab
void [collision, rawState, mixed, tab]
