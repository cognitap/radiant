import { createRef } from 'react'
import {
  Command,
  CommandTrigger,
  CommandContent,
  CommandTitle,
  CommandDescription,
  CommandInput,
  CommandList,
  CommandClose,
  type CommandProps,
  type CommandInputProps
} from '@cognitap/radiant'
const items = [
  { value: 'new', label: 'Create project', group: 'Projects', shortcut: ['Ctrl', 'N'] }
]
export const supported = (
  <Command
    items={items}
    query=""
    onQueryChange={() => {}}
    open={false}
    onOpenChange={() => {}}
    onAction={() => {}}
  >
    <CommandTrigger>Open</CommandTrigger>
    <CommandContent
      ref={createRef<HTMLDialogElement>()}
      style={{ '--rad-command-results-max-height': '10rem' }}
    >
      <CommandTitle>Commands</CommandTitle>
      <CommandDescription>Find an action</CommandDescription>
      <CommandInput ref={createRef<HTMLInputElement>()} />
      <CommandList ref={createRef<HTMLDivElement>()} />
      <CommandClose>Close</CommandClose>
    </CommandContent>
  </Command>
)
// @ts-expect-error Search has exactly one owner.
export const both: CommandProps = { items, onAction: () => {}, query: 'a', defaultQuery: 'b' }
// @ts-expect-error Dialog has exactly one owner.
export const bothOpen: CommandProps = { items, onAction: () => {}, open: true, defaultOpen: false }
// @ts-expect-error A command has no submitted selection.
export const selection: CommandProps = { items, onAction: () => {}, value: 'new' }
// @ts-expect-error Search is not a native form submission carrier.
export const name: CommandInputProps = { name: 'command' }
// @ts-expect-error The query owner lives on the root.
export const inputValue: CommandInputProps = { value: 'other' }
// @ts-expect-error The state root has no DOM host.
export const rootStyle: CommandProps = { items, onAction: () => {}, className: 'custom' }
