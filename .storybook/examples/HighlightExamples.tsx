import { useState } from 'react'
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxPortal,
  ComboboxStatus,
  Command,
  CommandContent,
  CommandInput,
  CommandItem,
  CommandList,
  CommandTitle,
  CommandTrigger,
  Highlight
} from '../../src/index.js'

const destinations = [
  { value: 'oslo', label: 'Oslo' },
  { value: 'london', label: 'London' },
  { value: 'stockholm', label: 'Stockholm' }
]
export function MatchDestination() {
  const [query, setQuery] = useState('')
  return (
    <div className="w-full max-w-xs">
      <Combobox
        items={destinations}
        query={query}
        onQueryChange={setQuery}
      >
        <ComboboxInput
          aria-label="Destination"
          placeholder="Search destinations"
        />
        <ComboboxPortal>
          <ComboboxContent>
            {destinations.map(item => (
              <ComboboxItem
                key={item.value}
                value={item.value}
                aria-label={item.label}
              >
                <Highlight
                  text={item.label}
                  query={query}
                />
              </ComboboxItem>
            ))}
            <ComboboxStatus />
          </ComboboxContent>
        </ComboboxPortal>
      </Combobox>
    </div>
  )
}

const actions = [
  { value: 'create', label: 'Create project' },
  { value: 'open', label: 'Open project' },
  { value: 'preferences', label: 'Open preferences' }
]
export function MatchCommand() {
  const [query, setQuery] = useState('')
  const [action, setAction] = useState('')
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Command
        items={actions}
        query={query}
        onQueryChange={setQuery}
        onAction={setAction}
      >
        <CommandTrigger>Open commands</CommandTrigger>
        <CommandContent>
          <CommandTitle>Workspace commands</CommandTitle>
          <CommandInput aria-label="Search commands" />
          <CommandList>
            {actions.map(item => (
              <CommandItem
                key={item.value}
                value={item.value}
                aria-label={item.label}
              >
                <Highlight
                  text={item.label}
                  query={query}
                />
              </CommandItem>
            ))}
          </CommandList>
        </CommandContent>
      </Command>
      <output className="text-sm">{actions.find(item => item.value === action)?.label}</output>
    </div>
  )
}
