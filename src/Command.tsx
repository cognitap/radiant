'use client'
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Grouped results use the actual Combobox ARIA listbox. */
import { createContext, useContext } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  useDialog,
  useDialogFamily,
  type DialogProps,
  type DialogContentProps,
  type DialogTriggerProps,
  type DialogTitleProps,
  type DialogDescriptionProps
} from './Dialog.js'
import {
  ComboboxRoot,
  ComboboxInput,
  ComboboxInlineContent,
  ComboboxItem,
  useCommandParts,
  type ComboboxOption,
  type ComboboxInputProps,
  type ComboboxItemProps
} from './Combobox.js'
import { WithoutField } from './Field.js'
import { Kbd, KbdGroup } from './Kbd.js'
import { cn } from './cn.js'
import { useControllableState } from './react/useControllableState.js'
import type { ControlSize } from './presentation.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type CommandOption = ComboboxOption & { group?: string; shortcut?: readonly string[] }
export type CommandProps = DialogProps &
  ({ query: string; defaultQuery?: never } | { query?: undefined; defaultQuery?: string }) & {
    items: readonly CommandOption[]
    onQueryChange?: (query: string) => void
    /** Runs on explicit activation, then requests Dialog close. */
    onAction: (value: string) => void
    filter?: ((item: CommandOption, query: string) => boolean) | null
    loading?: boolean
    error?: ReactNode
    loadingText?: string
    emptyText?: string
    controlSize?: ControlSize
  }
export type CommandTriggerProps = DialogTriggerProps
export type CommandCloseProps = DialogTriggerProps
export type CommandContentProps = DialogContentProps
export type CommandTitleProps = DialogTitleProps
export type CommandDescriptionProps = DialogDescriptionProps
export type CommandInputProps = ComboboxInputProps
export type CommandListProps = Omit<ComponentProps<'div'>, 'style' | 'role' | 'id'> & {
  style?: ThemeStyle
}
export type CommandItemProps = ComboboxItemProps
type Options = { items: readonly CommandOption[] }
const CommandContext = createContext<Options | null>(null)
function useCommandContext() {
  const context = useContext(CommandContext)
  const family = useDialogFamily()
  if (!context || family !== 'command') throw new Error('Command parts must render inside Command.')
  return context
}
/** Modal actions and editable query are independent; applications register their shortcuts. */
export function Command({
  query,
  defaultQuery,
  onQueryChange,
  items,
  onAction,
  filter,
  loading,
  error,
  loadingText,
  emptyText,
  controlSize,
  children,
  ...dialog
}: CommandProps) {
  const search = useControllableState({
    name: 'Command query',
    value: query,
    defaultValue: defaultQuery,
    initialValue: '',
    onChange: onQueryChange
  })
  if (
    typeof search.value !== 'string' ||
    (defaultQuery !== undefined && typeof defaultQuery !== 'string')
  )
    throw new TypeError('Command queries must be strings.')
  // Groups follow their first appearance. Keyboard and rendered order share this registry.
  const groups = new Map<string | undefined, CommandOption[]>()
  for (const item of items) {
    if (item.group !== undefined && !item.group.trim())
      throw new TypeError('Command groups need readable names.')
    const group = groups.get(item.group) ?? []
    group.push(item)
    groups.set(item.group, group)
  }
  const ordered = [...groups.values()].flat()
  return (
    <DialogRoot
      {...dialog}
      family="command"
    >
      <CommandContext.Provider value={{ items: ordered }}>
        <CommandResults
          query={search.value}
          onQueryChange={search.request}
          items={ordered}
          onAction={onAction}
          filter={filter}
          loading={loading}
          error={error}
          loadingText={loadingText}
          emptyText={emptyText}
          controlSize={controlSize}
        >
          {children}
        </CommandResults>
      </CommandContext.Provider>
    </DialogRoot>
  )
}
function CommandResults({
  items,
  onAction,
  filter,
  children,
  ...props
}: Pick<
  CommandProps,
  | 'items'
  | 'query'
  | 'onQueryChange'
  | 'onAction'
  | 'filter'
  | 'loading'
  | 'error'
  | 'loadingText'
  | 'emptyText'
  | 'controlSize'
  | 'children'
>) {
  const dialog = useDialog()!
  const registry = new Map(items.map(item => [item.value, item]))
  return (
    <WithoutField>
      <ComboboxRoot
        {...props}
        items={items}
        value={null}
        open={dialog.open}
        filter={
          filter === null
            ? null
            : filter
              ? (item, text) => filter(registry.get(item.value)!, text)
              : undefined
        }
        command={{
          onCommit(value) {
            onAction(value)
            dialog.setOpen(false)
          }
        }}
      >
        {children}
      </ComboboxRoot>
    </WithoutField>
  )
}
export function CommandTrigger(props: CommandTriggerProps) {
  useCommandContext()
  return <DialogTrigger {...props} />
}
export function CommandClose(props: CommandCloseProps) {
  useCommandContext()
  return <DialogClose {...props} />
}
export function CommandContent({ className, ...props }: CommandContentProps) {
  useCommandContext()
  return (
    <DialogContent
      {...props}
      className={cn('open:flex open:flex-col', className)}
    />
  )
}
export function CommandTitle(props: CommandTitleProps) {
  useCommandContext()
  return <DialogTitle {...props} />
}
export function CommandDescription(props: CommandDescriptionProps) {
  useCommandContext()
  return <DialogDescription {...props} />
}
export function CommandInput({ className, ...props }: CommandInputProps) {
  useCommandContext()
  useCommandParts()
  return (
    <ComboboxInput
      aria-label={props['aria-labelledby'] ? undefined : 'Search commands'}
      {...props}
      className={cn('shrink-0 pe-[var(--_rad-control-padding,1rem)]', className)}
    />
  )
}
export function CommandList({ children, className, ...props }: CommandListProps) {
  const { items } = useCommandContext()
  const box = useCommandParts()
  const visible = new Set(box.visible.map(item => item.value))
  const groups = new Map<string | undefined, CommandOption[]>()
  for (const item of items)
    if (visible.has(item.value)) {
      const group = groups.get(item.group) ?? []
      group.push(item)
      groups.set(item.group, group)
    }
  return (
    <ComboboxInlineContent
      {...props}
      className={cn(
        'min-h-[var(--_rad-control-height,2.5rem)] max-h-[min(50dvh,var(--rad-command-results-max-height,24rem))]',
        className
      )}
    >
      {children ??
        [...groups].map(([group, options]) =>
          group === undefined ? (
            options.map(item => (
              <CommandItem
                key={item.value}
                value={item.value}
              />
            ))
          ) : (
            <div
              key={group}
              role="group"
              aria-label={group}
              data-slot="command-group"
            >
              <p
                aria-hidden="true"
                className="m-0 px-3 py-2 text-sm font-semibold"
                data-slot="command-group-label"
              >
                {group}
              </p>
              {options.map(item => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                />
              ))}
            </div>
          )
        )}
    </ComboboxInlineContent>
  )
}
export function CommandItem({ children, value, ...props }: CommandItemProps) {
  const { items } = useCommandContext()
  useCommandParts()
  const item = items.find(item => item.value === value)
  return (
    <ComboboxItem
      {...props}
      value={value}
    >
      {children ?? (
        <>
          <span className="min-w-0 flex-1">{item?.label}</span>
          {item?.shortcut?.length ? (
            <KbdGroup className="shrink-0">
              {item.shortcut.map((label, index) => (
                <Kbd key={index}>{label}</Kbd>
              ))}
            </KbdGroup>
          ) : null}
        </>
      )}
    </ComboboxItem>
  )
}
