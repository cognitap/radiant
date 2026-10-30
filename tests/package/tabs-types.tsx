import { createElement, createRef } from 'react'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  useTabs,
  defineTheme,
  type TabsProps,
  type TabsTriggerProps,
  type TabsContentProps,
  type TabsRenderProps,
  type Orientation
} from '@cognitap/radiant'

const root: TabsProps = {
  defaultValue: 'general',
  activationMode: 'manual',
  orientation: 'vertical',
  loop: false,
  controlSize: 'small',
  ref: createRef<HTMLDivElement>(),
  style: { '--rad-tabs-list-radius': '1rem' },
  onValueChange(value) {
    const selected: string = value
    void selected
  }
}
createElement(
  Tabs,
  root,
  createElement(
    TabsList,
    { 'aria-label': 'Settings', ref: createRef<HTMLDivElement>() },
    createElement(
      TabsTrigger,
      {
        value: 'general',
        ref: createRef<HTMLButtonElement>(),
        render: resolved => createElement('button', resolved)
      },
      'General'
    )
  ),
  createElement(
    TabsContent,
    { value: 'general', keepMounted: true, ref: createRef<HTMLDivElement>() },
    'General settings'
  )
)
createElement(Tabs, {
  value: '',
  onValueChange(value) {
    value.toUpperCase()
  }
})
function Owner() {
  const tabs = useTabs()
  tabs?.setValue('general')
  return null
}
void Owner
defineTheme({
  id: 'tabs',
  name: 'Tabs',
  components: {
    tabs: {
      triggerHeight: '3rem',
      fontWeight: 600,
      triggerActiveBorder: 'purple',
      contentPadding: '1rem'
    }
  }
})
// @ts-expect-error Pick one value owner.
const mixed: TabsProps = { value: 'one', defaultValue: 'two' }
// @ts-expect-error An explicit initial selection makes server markup deterministic.
const missing: TabsProps = {}
// @ts-expect-error Tabs values are strings.
const numeric: TabsProps = { value: 1 }
// @ts-expect-error Activation modes are explicit.
const mode: TabsProps = { defaultValue: 'one', activationMode: 'hover' }
// @ts-expect-error Tabs is single selection.
const multiple: TabsProps = { value: ['one', 'two'] }
// @ts-expect-error Trigger relationships are owned by Tabs.
const triggerId: TabsTriggerProps = { value: 'one', id: 'other' }
// @ts-expect-error Triggers are native non-submitting buttons.
const submit: TabsTriggerProps = { value: 'one', type: 'submit' }
// @ts-expect-error Selection owns the role and accessible state.
const selected: TabsTriggerProps = { value: 'one', 'aria-selected': true }
// @ts-expect-error Tabs presentation has its own theme family.
const variant: TabsTriggerProps = { value: 'one', variant: 'solid' }
// @ts-expect-error Panel visibility belongs to the selection owner.
const hidden: TabsContentProps = { value: 'one', hidden: false }
// @ts-expect-error Panel names come from their associated trigger.
const label: TabsContentProps = { value: 'one', 'aria-labelledby': 'other' }
void [mixed, missing, numeric, mode, multiple, triggerId, submit, selected, variant, hidden, label]

const orientation: Orientation = 'vertical'
export const renderedTrigger = (
  <TabsTrigger
    value="general"
    render={(props: TabsRenderProps) => <button {...props} />}
  >
    General
  </TabsTrigger>
)
createElement(Tabs, { defaultValue: 'general', orientation })
