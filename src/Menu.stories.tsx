import { useId, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within, waitFor } from 'storybook/test'
import {
  Menu,
  MenuTrigger,
  MenuPortal,
  MenuContent,
  MenuItem,
  MenuGroup,
  MenuLabel,
  MenuSeparator,
  MenuCheckboxItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSub,
  MenuSubTrigger,
  MenuSubContent,
  Field,
  Input,
  Button,
  Checkbox,
  type MenuContentProps,
  type MenuRenderProps
} from './index.js'
import { MotionProvider } from './motion/react.js'
type Options = Pick<
  MenuContentProps,
  'side' | 'align' | 'sideOffset' | 'collisionPadding' | 'motion' | 'className' | 'style'
> & { initialOpen?: boolean; disabled?: boolean; pending?: boolean; dir?: 'ltr' | 'rtl' }
const layout = {
  display: 'grid',
  gap: '1rem',
  width: 'min(30rem,calc(100vw - 2rem))',
  maxWidth: '100%'
}
const meta = {
  title: 'Components/Menu',
  component: FileActions,
  args: {
    initialOpen: false,
    disabled: false,
    pending: false,
    side: 'bottom',
    align: 'start',
    sideOffset: 8,
    collisionPadding: 8,
    motion: 'inherit',
    dir: 'ltr'
  },
  argTypes: {
    initialOpen: { control: 'boolean' },
    disabled: { control: 'boolean' },
    pending: { control: 'boolean' },
    side: { control: 'inline-radio', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    motion: { control: 'inline-radio', options: ['inherit', 'off'] },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'] }
  },
  render: args => <FileActions {...args} />
} satisfies Meta<Options>
export default meta
type Story = StoryObj<typeof meta>
function FileActions({ initialOpen, disabled, pending, dir, ...surface }: Options) {
  const id = useId(),
    [name, setName] = useState('Project brief'),
    [owner, setOwner] = useState(false),
    [message, setMessage] = useState('No file action requested.')
  return (
    <div
      style={layout}
      dir={dir}
    >
      <Field label="File name">
        <Input
          value={name}
          onChange={event => setName(event.target.value)}
        />
      </Field>
      <Checkbox
        label="Owner tools"
        checked={owner}
        onChange={event => setOwner(event.target.checked)}
      />
      <Menu defaultOpen={initialOpen}>
        <MenuTrigger variant="outline">File actions</MenuTrigger>
        <MenuPortal>
          <MenuContent {...surface}>
            <MenuGroup aria-labelledby={id}>
              <MenuLabel id={id}>Current file</MenuLabel>
              <MenuItem
                disabled={disabled}
                onSelect={() => {
                  setName(`${name} v2`)
                  setMessage('File renamed.')
                }}
              >
                Rename
              </MenuItem>
              <MenuItem
                disabled={disabled}
                pending={pending}
                onSelect={() => {
                  setName(`${name} (copy)`)
                  setMessage('Copy created.')
                }}
              >
                Duplicate
              </MenuItem>
            </MenuGroup>
            <MenuSeparator />
            <MenuItem
              disabled={disabled || !owner}
              onSelect={() => setMessage(`Archived “${name}”.`)}
            >
              Archive · owner only
            </MenuItem>
          </MenuContent>
        </MenuPortal>
      </Menu>
      <output aria-live="polite">{message}</output>
    </div>
  )
}
export const Default: Story = {
  play: async ({ canvasElement, userEvent, args }) => {
    if (args.disabled || args.pending) return
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'File actions' })
    if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger)
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Duplicate' }))
    await expect(canvas.getByRole('textbox', { name: 'File name' })).toHaveValue(
      'Project brief (copy)'
    )
  }
}
function SortMenu({
  dir,
  initialOpen: _initialOpen,
  disabled: _disabled,
  pending: _pending,
  ...surface
}: Options) {
  const [open, setOpen] = useState(false),
    [order, setOrder] = useState('Newest first')
  return (
    <div
      style={layout}
      dir={dir}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Menu
          open={open}
          onOpenChange={setOpen}
        >
          <MenuTrigger variant="outline">Sort records</MenuTrigger>
          <MenuPortal>
            <MenuContent {...surface}>
              {['Newest first', 'Oldest first', 'Name A to Z'].map(value => (
                <MenuItem
                  key={value}
                  textValue={value}
                  onSelect={() => setOrder(value)}
                >
                  {value === order ? `• ${value}` : value}
                </MenuItem>
              ))}
            </MenuContent>
          </MenuPortal>
        </Menu>
        <Button
          variant="ghost"
          onClick={() => setOpen(true)}
        >
          Open sort menu
        </Button>
      </div>
      <output aria-live="polite">
        Menu {open ? 'open' : 'closed'}. Sorted by {order.toLowerCase()}.
      </output>
    </div>
  )
}
export const Controlled: Story = {
  render: args => <SortMenu {...args} />,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Open sort menu' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Menu open.')
    await userEvent.keyboard('o')
    await expect(canvas.getByRole('menuitem', { name: 'Oldest first' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Menu closed. Sorted by oldest first.'
    )
  }
}
function CanvasSettings({ initialOpen, disabled, pending, dir, ...surface }: Options) {
  const id = useId(),
    [features, setFeatures] = useState(['grid']),
    [view, setView] = useState<string | null>('list'),
    all = features.length === 2,
    mixed = features.length === 1
  return (
    <div
      style={layout}
      dir={dir}
    >
      <Menu defaultOpen={initialOpen}>
        <MenuTrigger variant="outline">Canvas settings</MenuTrigger>
        <MenuPortal>
          <MenuContent {...surface}>
            <MenuGroup aria-labelledby={id}>
              <MenuLabel id={id}>Canvas guides</MenuLabel>
              <MenuCheckboxItem
                checked={all}
                indeterminate={mixed}
                disabled={disabled}
                onCheckedChange={checked => setFeatures(checked ? ['grid', 'rulers'] : [])}
                parts={{ indicator: { style: { color: 'var(--rad-color-accent)' } } }}
              >
                All guides
              </MenuCheckboxItem>
              {['grid', 'rulers'].map(value => (
                <MenuCheckboxItem
                  key={value}
                  checked={features.includes(value)}
                  disabled={disabled}
                  pending={pending}
                  onCheckedChange={checked =>
                    setFeatures(current =>
                      checked
                        ? [...new Set([...current, value])]
                        : current.filter(item => item !== value)
                    )
                  }
                >
                  {value === 'grid' ? 'Grid lines' : 'Rulers'}
                </MenuCheckboxItem>
              ))}
            </MenuGroup>
            <MenuSeparator />
            <MenuRadioGroup
              aria-label="Record layout"
              defaultValue="list"
              onValueChange={setView}
            >
              <MenuLabel>Record layout</MenuLabel>
              <MenuRadioItem
                value="list"
                disabled={disabled}
              >
                List
              </MenuRadioItem>
              <MenuRadioItem
                value="grid"
                disabled={disabled}
              >
                Grid
              </MenuRadioItem>
            </MenuRadioGroup>
          </MenuContent>
        </MenuPortal>
      </Menu>
      <section
        aria-label="Canvas preview"
        style={{
          padding: '1.5rem',
          border: '1px solid var(--rad-color-border)',
          borderRadius: 'var(--rad-control-radius)',
          backgroundImage: features.includes('grid')
            ? 'linear-gradient(var(--rad-color-border) 1px,transparent 1px),linear-gradient(90deg,var(--rad-color-border) 1px,transparent 1px)'
            : 'none',
          backgroundSize: '24px 24px'
        }}
      >
        {features.includes('rulers') && <p>0 — 100 — 200 — 300</p>}
        <ul
          style={{
            display: view === 'grid' ? 'grid' : 'block',
            gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
            gap: '1rem'
          }}
        >
          {['Website', 'Mobile app', 'Research', 'Documentation'].map(name => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
export const ConfiguringCanvas: Story = {
  render: args => (
    <MotionProvider>
      <CanvasSettings {...args} />
    </MotionProvider>
  ),
  play: async ({ canvasElement, userEvent, args }) => {
    if (args.disabled || args.pending) return
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Canvas settings' })
    if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger)
    const all = canvas.getByRole('menuitemcheckbox', { name: 'All guides' })
    await expect(all).toHaveAttribute('aria-checked', 'mixed')
    await userEvent.click(all)
    await expect(all).toHaveAttribute('aria-checked', 'true')
    await waitFor(
      () =>
        expect(Number(getComputedStyle(canvas.getByRole('menu')).opacity)).toBeGreaterThan(0.99),
      { timeout: 3000 }
    )
  }
}
function Exporting({ initialOpen, disabled, pending, dir, ...surface }: Options) {
  const [format, setFormat] = useState<string | null>('pdf'),
    [notes, setNotes] = useState(true),
    [result, setResult] = useState('No export prepared.')
  const prepare = (destination: string) =>
    setResult(
      `Prepared ${format?.toUpperCase() ?? 'PDF'} for ${destination}${notes ? ' with notes' : ''}.`
    )
  return (
    <div
      style={layout}
      dir={dir}
    >
      <Menu defaultOpen={initialOpen}>
        <MenuTrigger variant="outline">Export report</MenuTrigger>
        <MenuPortal>
          <MenuContent {...surface}>
            <MenuRadioGroup
              aria-label="Export format"
              value={format}
              onValueChange={setFormat}
            >
              <MenuLabel>Format</MenuLabel>
              <MenuRadioItem
                value="pdf"
                disabled={disabled}
              >
                PDF
              </MenuRadioItem>
              <MenuRadioItem
                value="csv"
                disabled={disabled}
              >
                CSV
              </MenuRadioItem>
            </MenuRadioGroup>
            <MenuCheckboxItem
              defaultChecked
              disabled={disabled}
              onCheckedChange={setNotes}
            >
              Include notes
            </MenuCheckboxItem>
            <MenuSeparator />
            <MenuSub>
              <MenuSubTrigger
                disabled={disabled}
                pending={pending}
                parts={{ indicator: { style: { color: 'var(--rad-color-accent)' } } }}
              >
                Save to
              </MenuSubTrigger>
              <MenuPortal>
                <MenuSubContent motion={surface.motion}>
                  <MenuItem
                    disabled={disabled}
                    onSelect={() => prepare('Downloads')}
                  >
                    Downloads
                  </MenuItem>
                  <MenuSub>
                    <MenuSubTrigger disabled={disabled}>Shared drives</MenuSubTrigger>
                    <MenuPortal>
                      <MenuSubContent motion={surface.motion}>
                        <MenuItem
                          disabled={disabled}
                          onSelect={() => prepare('Design team')}
                        >
                          Design team
                        </MenuItem>
                        <MenuItem
                          disabled={disabled}
                          onSelect={() => prepare('Engineering')}
                        >
                          Engineering
                        </MenuItem>
                      </MenuSubContent>
                    </MenuPortal>
                  </MenuSub>
                </MenuSubContent>
              </MenuPortal>
            </MenuSub>
          </MenuContent>
        </MenuPortal>
      </Menu>
      <output aria-live="polite">{result}</output>
    </div>
  )
}
export const ExportingReport: Story = {
  render: args => (
    <MotionProvider>
      <Exporting {...args} />
    </MotionProvider>
  ),
  play: async ({ canvasElement, userEvent, args }) => {
    if (args.disabled || args.pending) return
    const canvas = within(canvasElement),
      trigger = canvas.getByRole('button', { name: 'Export report' })
    if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger)
    canvas.getByRole('menuitem', { name: 'Save to' }).focus()
    await userEvent.keyboard(args.dir === 'rtl' ? '{ArrowLeft}' : '{ArrowRight}')
    canvas.getByRole('menuitem', { name: 'Shared drives' }).focus()
    await userEvent.keyboard(args.dir === 'rtl' ? '{ArrowLeft}' : '{ArrowRight}')
    await expect(canvas.getByRole('menuitem', { name: 'Design team' })).toHaveFocus()
    await waitFor(
      () => {
        const panels = Array.from(
          canvasElement.querySelectorAll<HTMLElement>('[role="menu"]')
        ).filter(node => node.matches(':popover-open'))
        expect(panels).toHaveLength(3)
        expect(panels.every(node => Number(getComputedStyle(node).opacity) > 0.99)).toBe(true)
      },
      { timeout: 3000 }
    )
  }
}
function ConsumerButton(props: MenuRenderProps) {
  return <button {...props}>{props.children}</button>
}
function NativeActions({ initialOpen, disabled, pending, dir, ...surface }: Options) {
  const id = useId(),
    trigger = useRef<HTMLButtonElement>(null),
    [open, setOpen] = useState(initialOpen ?? false),
    [keep, setKeep] = useState(false),
    [review, setReview] = useState(false),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState('No report action requested.')
  return (
    <div
      style={layout}
      dir={dir}
    >
      <form
        id={id}
        onSubmit={event => {
          event.preventDefault()
          const data = new FormData(
            event.currentTarget,
            (event.nativeEvent as SubmitEvent).submitter
          )
          setResult(`${data.get('intent')} requested for “${data.get('report')}”.`)
        }}
        onReset={() => setResult('Report draft reset.')}
      >
        <Field
          label="Report name"
          required
        >
          <Input
            name="report"
            defaultValue="Quarterly review"
          />
        </Field>
      </form>
      <Checkbox
        label="Keep commands open"
        checked={keep}
        onChange={event => setKeep(event.target.checked)}
      />
      <Checkbox
        label="Review before export"
        checked={review}
        onChange={event => setReview(event.target.checked)}
      />
      <Checkbox
        label="Export in progress"
        checked={busy}
        onChange={event => setBusy(event.target.checked)}
      />
      <Button
        variant="ghost"
        onClick={() => trigger.current?.focus()}
      >
        Focus report actions
      </Button>
      <Menu
        open={open}
        onOpenChange={next => {
          if (next || !keep) setOpen(next)
        }}
      >
        <MenuTrigger
          ref={trigger}
          variant="outline"
        >
          Report actions
        </MenuTrigger>
        <MenuPortal>
          <MenuContent
            {...surface}
            style={{ '--rad-menu-width': '18rem', '--rad-menu-padding': '.5rem', ...surface.style }}
          >
            <MenuItem
              type="submit"
              form={id}
              name="intent"
              value="Export"
              disabled={disabled}
              pending={pending || busy}
              render={props => <ConsumerButton {...props} />}
              onSelect={event => {
                if (review) {
                  event.preventDefault()
                  setResult('Review the report before exporting.')
                }
              }}
            >
              Export report
            </MenuItem>
            <MenuItem
              closeOnSelect={false}
              onSelect={() => setResult('Report preview ready. Choose another action.')}
            >
              Show preview
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              type="reset"
              form={id}
            >
              Discard draft
            </MenuItem>
          </MenuContent>
        </MenuPortal>
      </Menu>
      <output aria-live="polite">{result}</output>
    </div>
  )
}
export const SubmittingReportActions: Story = {
  render: args => (
    <MotionProvider>
      <NativeActions {...args} />
    </MotionProvider>
  ),
  play: async ({ canvasElement, userEvent, args }) => {
    if (args.disabled || args.pending) return
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Report actions' })
    if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger)
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Export report' }))
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Export requested for “Quarterly review”.'
    )
  }
}
