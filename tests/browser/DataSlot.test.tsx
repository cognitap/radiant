import type { ReactNode } from 'react'
import { expect, test } from 'vitest'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  Autocomplete,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteStatus,
  AutocompleteTrigger,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  Button,
  Checkbox,
  Combobox,
  ComboboxClear,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxStatus,
  ComboboxTrigger,
  Command,
  CommandContent,
  CommandDescription,
  CommandInput,
  CommandItem,
  CommandList,
  CommandTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  FileInput,
  HoverCard,
  HoverCardTrigger,
  Input,
  InputGroup,
  InputGroupInput,
  InputGroupTextarea,
  Link,
  MultiSelect,
  MultiSelectContent,
  MultiSelectInput,
  MultiSelectItem,
  MultiSelectTags,
  MultiSelectTrigger,
  NumberField,
  OTPField,
  PasswordInput,
  Radio,
  Select,
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectTrigger,
  SelectValue,
  SelectViewport,
  Slider,
  Switch,
  TagsInput,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '../../src/index.js'
import { mount } from './familyHarness.js'

const items = [{ value: 'oslo', label: 'Oslo' }]
const caller = 'caller extra'

// Each host keeps its own identity tokens first and appends the caller's set.
const hosts: [name: string, own: string, render: (slot: string) => ReactNode][] = [
  ['Button', 'button', slot => <Button data-slot={slot}>Save</Button>],
  [
    'Link',
    'link',
    slot => (
      <Link
        href="#docs"
        data-slot={slot}
      >
        Docs
      </Link>
    )
  ],
  [
    'BreadcrumbLink',
    'link breadcrumb-link',
    slot => (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              href="#home"
              data-slot={slot}
            >
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  ],
  [
    'HoverCardTrigger',
    'link hover-card-trigger',
    slot => (
      <HoverCard>
        <HoverCardTrigger
          href="#profile"
          data-slot={slot}
        >
          Profile
        </HoverCardTrigger>
      </HoverCard>
    )
  ],
  [
    'Input',
    'input',
    slot => (
      <Input
        aria-label="Name"
        data-slot={slot}
      />
    )
  ],
  [
    'Textarea',
    'textarea',
    slot => (
      <Textarea
        aria-label="Notes"
        data-slot={slot}
      />
    )
  ],
  [
    'InputGroupInput',
    'input input-group-input',
    slot => (
      <InputGroup>
        <InputGroupInput
          aria-label="Query"
          data-slot={slot}
        />
      </InputGroup>
    )
  ],
  [
    'InputGroupTextarea',
    'textarea input-group-textarea',
    slot => (
      <InputGroup>
        <InputGroupTextarea
          aria-label="Message"
          data-slot={slot}
        />
      </InputGroup>
    )
  ],
  [
    'PasswordInput',
    'input input-group-input password-input',
    slot => (
      <PasswordInput
        aria-label="Password"
        data-slot={slot}
      />
    )
  ],
  [
    'NumberField',
    'input input-group-input number-field',
    slot => (
      <NumberField
        aria-label="Quantity"
        data-slot={slot}
      />
    )
  ],
  [
    'TagsInput',
    'input tags-input',
    slot => (
      <TagsInput
        aria-label="Labels"
        data-slot={slot}
      />
    )
  ],
  [
    'OTPField',
    'input otp-field',
    slot => (
      <OTPField
        aria-label="Code"
        data-slot={slot}
      />
    )
  ],
  [
    'Checkbox',
    'checkbox',
    slot => (
      <Checkbox
        label="Agree"
        data-slot={slot}
      />
    )
  ],
  [
    'Switch',
    'switch',
    slot => (
      <Switch
        label="Alerts"
        data-slot={slot}
      />
    )
  ],
  [
    'Radio',
    'radio',
    slot => (
      <Radio
        label="Pro"
        value="pro"
        data-slot={slot}
      />
    )
  ],
  [
    'Slider',
    'slider',
    slot => (
      <Slider
        aria-label="Volume"
        data-slot={slot}
      />
    )
  ],
  [
    'FileInput',
    'file-input',
    slot => (
      <FileInput
        aria-label="Avatar"
        data-slot={slot}
      />
    )
  ],
  [
    'TooltipContent',
    'tooltip-content',
    slot => (
      <Tooltip defaultOpen>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent data-slot={slot}>Saves the draft</TooltipContent>
      </Tooltip>
    )
  ]
]

const select = (part: ReactNode) => (
  <Select
    items={items}
    defaultValue="oslo"
  >
    {part}
  </Select>
)
const selectContent = (part: ReactNode) =>
  select(
    <>
      <SelectTrigger aria-label="City" />
      <SelectContent>{part}</SelectContent>
    </>
  )
hosts.push(
  [
    'SelectTrigger',
    'button select-trigger',
    slot =>
      select(
        <SelectTrigger
          aria-label="City"
          data-slot={slot}
        />
      )
  ],
  [
    'SelectValue',
    'select-value',
    slot =>
      select(
        <SelectTrigger aria-label="City">
          <SelectValue data-slot={slot} />
        </SelectTrigger>
      )
  ],
  [
    'SelectIcon',
    'select-icon',
    slot =>
      select(
        <SelectTrigger aria-label="City">
          <SelectIcon data-slot={slot} />
        </SelectTrigger>
      )
  ],
  [
    'SelectContent',
    'select-content',
    slot =>
      select(
        <>
          <SelectTrigger aria-label="City" />
          <SelectContent data-slot={slot} />
        </>
      )
  ],
  ['SelectViewport', 'select-viewport', slot => selectContent(<SelectViewport data-slot={slot} />)],
  [
    'SelectItem',
    'select-item',
    slot =>
      selectContent(
        <SelectItem
          value="oslo"
          data-slot={slot}
        />
      )
  ],
  [
    'SelectItemText',
    'select-item-text',
    slot =>
      selectContent(
        <SelectItem value="oslo">
          <SelectItemText data-slot={slot} />
        </SelectItem>
      )
  ],
  [
    'SelectItemIndicator',
    'select-item-indicator',
    slot =>
      selectContent(
        <SelectItem value="oslo">
          <SelectItemIndicator data-slot={slot} />
        </SelectItem>
      )
  ],
  [
    'SelectGroup',
    'select-group',
    slot =>
      selectContent(
        <SelectGroup
          label="Europe"
          data-slot={slot}
        >
          <SelectItem value="oslo" />
        </SelectGroup>
      )
  ]
)

// Combobox parts, and the Autocomplete and MultiSelect parts that keep Combobox hosts.
const comboboxFamilies = [
  {
    family: 'combobox',
    tokens: (name: string) => `combobox-${name}`,
    render: (parts: (slot?: string) => ReactNode, slot?: string) => (
      <Combobox
        aria-label="City"
        items={items}
      >
        {parts(slot)}
      </Combobox>
    ),
    Input: ComboboxInput,
    Trigger: ComboboxTrigger,
    Content: ComboboxContent,
    Item: ComboboxItem,
    Status: ComboboxStatus
  },
  {
    family: 'autocomplete',
    tokens: (name: string) => `combobox-${name} autocomplete-${name}`,
    render: (parts: (slot?: string) => ReactNode, slot?: string) => (
      <Autocomplete
        aria-label="City"
        items={items}
      >
        {parts(slot)}
      </Autocomplete>
    ),
    Input: AutocompleteInput,
    Trigger: AutocompleteTrigger,
    Content: AutocompleteContent,
    Item: AutocompleteItem,
    Status: AutocompleteStatus
  },
  {
    family: 'multi-select',
    tokens: (name: string) => `combobox-${name} multi-select-${name}`,
    render: (parts: (slot?: string) => ReactNode, slot?: string) => (
      <MultiSelect
        aria-label="Cities"
        items={items}
        defaultValue={['oslo']}
      >
        {parts(slot)}
      </MultiSelect>
    ),
    Input: MultiSelectInput,
    Trigger: MultiSelectTrigger,
    Content: MultiSelectContent,
    Item: MultiSelectItem,
    Status: ComboboxStatus
  }
]
for (const { family, tokens, render, Input, Trigger, Content, Item, Status } of comboboxFamilies) {
  hosts.push(
    [`${family} input`, tokens('input'), slot => render(() => <Input data-slot={slot} />)],
    [
      `${family} trigger`,
      `button ${tokens('trigger')}`,
      slot =>
        render(() => (
          <>
            <Input />
            <Trigger data-slot={slot} />
          </>
        ))
    ],
    [
      `${family} content`,
      tokens('content'),
      slot =>
        render(() => (
          <>
            <Input />
            <Content data-slot={slot} />
          </>
        ))
    ],
    [
      `${family} item`,
      tokens('item'),
      slot =>
        render(() => (
          <>
            <Input />
            <Content>
              <Item
                value="oslo"
                data-slot={slot}
              />
            </Content>
          </>
        ))
    ],
    [
      `${family} status`,
      tokens('status'),
      slot =>
        render(() => (
          <>
            <Input />
            <Content>
              <Status data-slot={slot} />
            </Content>
          </>
        ))
    ]
  )
}
hosts.push(
  [
    'ComboboxClear',
    'button combobox-clear',
    slot => (
      <Combobox
        aria-label="City"
        items={items}
        defaultValue="oslo"
      >
        <ComboboxInput />
        <ComboboxClear data-slot={slot} />
      </Combobox>
    )
  ],
  [
    'MultiSelectTags',
    'combobox-tags multi-select-tags',
    slot => (
      <MultiSelect
        aria-label="Cities"
        items={items}
        defaultValue={['oslo']}
      >
        <MultiSelectTags data-slot={slot} />
        <MultiSelectInput />
      </MultiSelect>
    )
  ]
)

// Dialog content parts keep the dialog identity and add their family's.
const dialogFamilies = [
  {
    prefix: '',
    render: (children: ReactNode, slot?: string) => (
      <Dialog>
        <DialogContent data-slot={slot}>{children}</DialogContent>
      </Dialog>
    ),
    Title: DialogTitle,
    Description: DialogDescription
  },
  {
    prefix: 'alert-dialog',
    render: (children: ReactNode, slot?: string) => (
      <AlertDialog>
        <AlertDialogContent data-slot={slot}>{children}</AlertDialogContent>
      </AlertDialog>
    ),
    Title: AlertDialogTitle,
    Description: AlertDialogDescription
  },
  {
    prefix: 'drawer',
    render: (children: ReactNode, slot?: string) => (
      <Drawer>
        <DrawerContent data-slot={slot}>{children}</DrawerContent>
      </Drawer>
    ),
    Title: DrawerTitle,
    Description: DrawerDescription
  }
]
for (const { prefix, render, Title, Description } of dialogFamilies) {
  const own = (part: string) => (prefix ? `dialog${part} ${prefix}${part}` : `dialog${part}`)
  const name = prefix || 'dialog'
  hosts.push(
    [
      `${name} content`,
      prefix ? `dialog ${prefix}` : 'dialog',
      slot => render(<Title>T</Title>, slot)
    ],
    [`${name} title`, own('-title'), slot => render(<Title data-slot={slot}>T</Title>)],
    [
      `${name} description`,
      own('-description'),
      slot => render(<Description data-slot={slot}>D</Description>)
    ]
  )
}

const command = (content: ReactNode, slot?: string) => (
  <Command
    items={items}
    onAction={() => {}}
  >
    <CommandContent data-slot={slot}>
      <CommandTitle>Commands</CommandTitle>
      {content}
    </CommandContent>
  </Command>
)
hosts.push(
  ['Command content', 'dialog command', slot => command(<CommandInput />, slot)],
  [
    'CommandTitle',
    'dialog-title command-title',
    slot => (
      <Command
        items={items}
        onAction={() => {}}
      >
        <CommandContent>
          <CommandTitle data-slot={slot}>Commands</CommandTitle>
        </CommandContent>
      </Command>
    )
  ],
  [
    'CommandDescription',
    'dialog-description command-description',
    slot => command(<CommandDescription data-slot={slot}>Run one</CommandDescription>)
  ],
  [
    'CommandInput',
    'combobox-input command-input',
    slot => command(<CommandInput data-slot={slot} />)
  ],
  [
    'CommandList',
    'combobox-content command-list',
    slot =>
      command(
        <>
          <CommandInput />
          <CommandList data-slot={slot} />
        </>
      )
  ],
  [
    'CommandItem',
    'combobox-item command-item',
    slot =>
      command(
        <>
          <CommandInput />
          <CommandList>
            <CommandItem
              value="oslo"
              data-slot={slot}
            />
          </CommandList>
        </>
      )
  ]
)

test.each(hosts)(
  '%s keeps its identity first and joins a caller data-slot',
  async (_, own, render) => {
    await mount(render(caller))
    const node = document.querySelector<HTMLElement>('[data-slot~="caller"]')
    expect(node, 'host carrying the caller tokens').not.toBe(null)
    expect(node!.dataset.slot).toBe(`${own} ${caller}`)
  }
)

test.each(hosts)(
  '%s emits each token once when a caller repeats its identity',
  async (_, own, render) => {
    await mount(render(`${own} caller`))
    const node = document.querySelector<HTMLElement>('[data-slot~="caller"]')!
    expect(node.dataset.slot).toBe(`${own} caller`)
  }
)
