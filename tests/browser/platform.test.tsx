import { act, createRef, StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import {
  Button,
  type ButtonRenderProps,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  Link,
  Radio,
  RadioGroup,
  defaultTheme,
  ThemeScope
} from '../../src/index.js'
import '../../.storybook/styles.css'
import { ProfileExample } from '../../.storybook/examples/ProfileForm.js'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const roots: Root[] = []
const hosts: HTMLDivElement[] = []
const originalURL = location.href

function host() {
  const node = document.createElement('div')
  document.body.append(node)
  hosts.push(node)
  return node
}

async function mount(children: ReactNode) {
  const node = host()
  const root = createRoot(node)
  roots.push(root)
  await act(async () => root.render(children))
  return { node, root }
}

afterEach(async () => {
  for (const root of roots.splice(0)) await act(async () => root.unmount())
  for (const node of hosts.splice(0)) node.remove()
  history.replaceState(history.state, '', originalURL)
})

function ConsumerButton({ children, ...props }: ButtonRenderProps) {
  return <button {...props}>{children}</button>
}
const renderButton = (props: ButtonRenderProps) => <ConsumerButton {...props} />

for (const mode of ['light', 'dark'] as const) {
  test(`${mode}: native control sizes and disabled Field inheritance`, async () => {
    const { node } = await mount(
      <ThemeScope
        theme={defaultTheme}
        mode={mode}
      >
        {(['small', 'medium', 'large'] as const).map(controlSize => (
          <div
            key={controlSize}
            data-size-row={controlSize}
          >
            <Input
              aria-label={`${controlSize} text`}
              size={24}
              controlSize={controlSize}
            />
            <Checkbox
              label={`${controlSize} check`}
              defaultChecked
              controlSize={controlSize}
            />
            <Radio
              name={controlSize}
              value="yes"
              label={`${controlSize} radio`}
              defaultChecked
              controlSize={controlSize}
            />
          </div>
        ))}
        <Field
          layout="group"
          label={
            <>
              Locked settings{' '}
              <input
                type="checkbox"
                aria-label="Legend choice"
              />
            </>
          }
          disabled
        >
          <Field
            label="Nested text"
            disabled={false}
          >
            <Input disabled={false} />
          </Field>
          <Checkbox
            label="Locked check"
            disabled={false}
          />
          <RadioGroup
            label="Locked plan"
            name="locked-plan"
            disabled={false}
            defaultValue="pro"
          >
            <Radio
              label="Locked pro"
              value="pro"
              disabled={false}
            />
          </RadioGroup>
        </Field>
      </ThemeScope>
    )
    const sizes = [...node.querySelectorAll('[data-size-row]')].map(row => {
      const [text, check, radio] = row.querySelectorAll('input')
      expect(text.size).toBe(24)
      for (const input of [text, check, radio])
        expect(input.dataset.controlSize).toBe(row.getAttribute('data-size-row'))
      for (const [input, ratio] of [
        [check, 0.65],
        [radio, 0.4]
      ] as const) {
        const mark = input.parentElement!.querySelector('[aria-hidden]')!
        expect(
          mark.getBoundingClientRect().width / input.getBoundingClientRect().width
        ).toBeCloseTo(ratio, 1)
      }
      return [
        text.getBoundingClientRect().height,
        check.getBoundingClientRect().width,
        radio.getBoundingClientRect().width
      ]
    })
    for (let index = 1; index < sizes.length; index++) {
      sizes[index].forEach((value, dimension) =>
        expect(value).toBeGreaterThan(sizes[index - 1][dimension])
      )
    }
    await expect.element(page.getByRole('textbox', { name: 'Nested text' })).toBeDisabled()
    await expect.element(page.getByRole('checkbox', { name: 'Locked check' })).toBeDisabled()
    await expect.element(page.getByRole('radio', { name: 'Locked pro' })).toBeDisabled()
    await expect.element(page.getByRole('checkbox', { name: 'Legend choice' })).toBeEnabled()
  })

  test(`${mode}: controlled RadioGroup keeps null, empty values, native callbacks and reset distinct`, async () => {
    const requests = vi.fn()
    const observations = vi.fn()
    const groupRef = createRef<HTMLFieldSetElement>()
    const tree = (value: string | null) => (
      <ThemeScope mode={mode}>
        <form>
          <RadioGroup
            label="Plan"
            name="plan"
            ref={groupRef}
            title="Available plans"
            className="p-4"
            style={{ margin: 0 }}
            data-slot="custom radio-group"
            parts={{ options: { className: 'flex', style: { gap: '1rem' } } }}
            value={value}
            onValueChange={requests}
            onChange={event => observations(event.currentTarget.name, event.currentTarget.value)}
          >
            <Radio
              label="Pro"
              value="pro"
            />
            <Radio
              label="Free"
              value=""
            />
            <Radio
              label="Retired"
              value="retired"
              disabled
            />
          </RadioGroup>
          <Button type="reset">Reset plan</Button>
        </form>
      </ThemeScope>
    )
    const { node, root } = await mount(tree(null))
    const form = node.querySelector('form')!
    const group = node.querySelector('fieldset')!
    const options = group.querySelector<HTMLElement>('[data-slot~="radio-group-options"]')!
    expect(groupRef.current).toBe(group)
    expect(group.dataset.slot).toBe('field radio-group custom')
    expect(group.title).toBe('Available plans')
    expect(getComputedStyle(group).padding).toBe('16px')
    expect(group.style.margin).toBe('0px')
    expect(getComputedStyle(options).display).toBe('flex')
    expect(getComputedStyle(options).gap).toBe('16px')
    expect(options.classList.contains('p-4')).toBe(false)
    const pro = page.getByRole('radio', { name: 'Pro' })
    const free = page.getByRole('radio', { name: 'Free' })
    expect(new FormData(form).get('plan')).toBe(null)
    await act(async () => userEvent.click(pro))
    expect(requests).toHaveBeenCalledExactlyOnceWith('pro')
    expect(observations).toHaveBeenCalledExactlyOnceWith('plan', 'pro')
    await expect.element(pro).not.toBeChecked()
    await act(async () => root.render(tree('pro')))
    await act(async () => userEvent.click(pro))
    expect(requests).toHaveBeenCalledTimes(1)
    await act(async () => userEvent.keyboard('{ArrowDown}'))
    expect(requests).toHaveBeenLastCalledWith('')
    expect(observations).toHaveBeenLastCalledWith('plan', '')
    expect(requests).toHaveBeenCalledTimes(2)
    await expect.element(pro).toBeChecked()
    await expect.element(free).not.toBeChecked()
    await act(async () => root.render(tree('')))
    await expect.element(free).toBeChecked()
    expect(new FormData(form).get('plan')).toBe('')
    await act(async () => userEvent.click(page.getByRole('button', { name: 'Reset plan' })))
    await expect.element(free).toBeChecked()
    await act(async () => root.render(tree(null)))
    expect(new FormData(form).get('plan')).toBe(null)
    expect(node.querySelectorAll('input:checked')).toHaveLength(0)
    expect(requests).toHaveBeenCalledTimes(2)
    expect(observations).toHaveBeenCalledTimes(2)
  })

  test(`${mode}: native and TanStack recipes reuse their form inside Card and Dialog`, async () => {
    for (const owner of ['native', 'tanstack'] as const) {
      for (const placement of ['card', 'dialog'] as const) {
        const { node, root } = await mount(
          <ThemeScope mode={mode}>
            <ProfileExample
              owner={owner}
              placement={placement}
            />
          </ThemeScope>
        )
        const trigger = page.getByRole('button', { name: 'Edit profile' })
        if (placement === 'dialog') await act(async () => userEvent.click(trigger))
        expect(node.querySelectorAll('form')).toHaveLength(1)
        expect(node.querySelector('form form')).toBe(null)
        const email = page.getByRole('textbox', { name: 'Email' })
        await act(async () => userEvent.type(email, 'grace@example.com'))
        await act(async () => userEvent.click(page.getByRole('radio', { name: 'Pro' })))
        await act(async () => userEvent.click(page.getByRole('button', { name: 'Reset' })))
        await expect.element(email).toHaveValue('')
        await expect.element(page.getByRole('radio', { name: 'Free' })).toBeChecked()
        await act(async () => userEvent.type(email, 'ada@example.com'))
        await act(async () => userEvent.click(page.getByRole('radio', { name: 'Pro' })))
        await act(async () =>
          userEvent.click(page.getByRole('checkbox', { name: 'Send product updates' }))
        )
        await act(async () => userEvent.click(page.getByRole('button', { name: 'Save profile' })))
        await expect
          .element(page.getByRole('status'))
          .toHaveTextContent('Saved ada@example.com · pro · Updates off')
        if (placement === 'dialog') {
          await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
          await expect.element(trigger).toHaveFocus()
        } else expect(node.querySelector('[data-slot~="card-content"] form')).not.toBe(null)
        await act(async () => root.render(null))
      }
    }
  })

  test(`${mode}: changing modal and dismissal props reconciles the same native dialog`, async () => {
    const requests = vi.fn()
    const tree = (modal: boolean, closeOnEscape: boolean, open = true) => (
      <ThemeScope mode={mode}>
        <Dialog
          open={open}
          modal={modal}
          closeOnEscape={closeOnEscape}
          onOpenChange={requests}
        >
          <DialogContent>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Changing the modal policy preserves this session.</DialogDescription>
            <DialogClose>Close settings</DialogClose>
          </DialogContent>
        </Dialog>
      </ThemeScope>
    )
    const { node, root } = await mount(tree(true, false))
    const dialog = node.querySelector('dialog')!
    expect(dialog.matches(':modal')).toBe(true)
    await act(async () => root.render(tree(false, false)))
    expect(dialog.open).toBe(true)
    expect(dialog.matches(':modal')).toBe(false)
    await act(async () => root.render(tree(true, false)))
    expect(dialog.matches(':modal')).toBe(true)
    await act(async () => userEvent.keyboard('{Escape}'))
    expect(dialog.open).toBe(true)
    expect(requests).not.toHaveBeenCalled()
    await act(async () => root.render(tree(true, true)))
    await act(async () => userEvent.keyboard('{Escape}'))
    await expect.poll(() => requests.mock.calls.length).toBe(1)
    expect(requests).toHaveBeenCalledWith(false)
    await expect.poll(() => dialog.matches(':modal')).toBe(true)
    await act(async () => root.render(tree(true, true, false)))
    await act(async () => new Promise(requestAnimationFrame))
    expect(dialog.open).toBe(false)
    expect(requests).toHaveBeenCalledTimes(1)
  })

  test(`${mode}: native disclosure restoration and prop updates emit one request`, async () => {
    const requests = vi.fn()
    const observations = vi.fn()
    const tree = (open: boolean) => (
      <ThemeScope mode={mode}>
        <Collapsible
          open={open}
          onOpenChange={requests}
          onToggle={observations}
        >
          <CollapsibleTrigger>Shipping details</CollapsibleTrigger>
          <CollapsibleContent>Ships in two days.</CollapsibleContent>
        </Collapsible>
      </ThemeScope>
    )
    const { node, root } = await mount(tree(false))
    const details = node.querySelector('details')!
    await act(async () => userEvent.click(page.getByText('Shipping details', { exact: true })))
    await expect.poll(() => requests.mock.calls.length).toBe(1)
    await expect.poll(() => details.open).toBe(false)
    await act(async () => root.render(tree(true)))
    await act(async () => new Promise(requestAnimationFrame))
    expect(details.open).toBe(true)
    expect(requests).toHaveBeenCalledExactlyOnceWith(true)
    expect(observations).toHaveBeenCalled()
  })

  test.each([
    { host: 'default', render: undefined },
    { host: 'replacement', render: renderButton }
  ])(`${mode}: native modal actions ($host)`, async ({ render }) => {
    let vetoTrigger = true
    let vetoClose = true
    const clicked = vi.fn()
    const { node } = await mount(
      <ThemeScope mode={mode}>
        <Dialog>
          <DialogTrigger
            render={render}
            onClick={event => {
              clicked()
              if (vetoTrigger) event.preventDefault()
            }}
          >
            Edit profile
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Visible to your team.</DialogDescription>
            <DialogClose
              render={render}
              onClick={event => {
                if (vetoClose) event.preventDefault()
              }}
            >
              Close
            </DialogClose>
            <form method="dialog">
              <Button
                type="submit"
                render={render}
              >
                Done
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </ThemeScope>
    )
    const dialog = node.querySelector('dialog')!
    const trigger = page.getByRole('button', { name: 'Edit profile' })
    await act(async () => userEvent.click(trigger))
    expect(dialog.open).toBe(false)
    expect(clicked).toHaveBeenCalledTimes(1)
    vetoTrigger = false
    await act(async () => userEvent.click(trigger))
    expect(dialog.matches(':modal')).toBe(true)
    expect(dialog.contains(document.activeElement)).toBe(true)
    await act(async () => userEvent.tab())
    await expect.element(page.getByRole('button', { name: 'Done' })).toHaveFocus()
    await act(async () => userEvent.tab({ shift: true }))
    await expect.element(page.getByRole('button', { name: 'Close', exact: true })).toHaveFocus()
    await act(async () => userEvent.keyboard('{Enter}'))
    expect(dialog.open).toBe(true)
    vetoClose = false
    await act(async () => userEvent.keyboard('{Enter}'))
    await expect.poll(() => dialog.open).toBe(false)
    await expect.element(trigger).toHaveFocus()
    await act(async () => userEvent.keyboard('{Enter}'))
    expect(dialog.matches(':modal')).toBe(true)
    await act(async () => userEvent.keyboard('{Escape}'))
    await expect.poll(() => dialog.open).toBe(false)
    await expect.element(trigger).toHaveFocus()
    await act(async () => userEvent.keyboard('{Enter}'))
    await act(async () => userEvent.click(page.getByRole('button', { name: 'Done' })))
    await expect.poll(() => dialog.open).toBe(false)
    expect(node.querySelector('[aria-expanded]')?.getAttribute('aria-expanded')).toBe('false')
  })

  test(`${mode}: composed actions preserve ancestor form values and Dialog state`, async () => {
    const submitted = vi.fn()
    const { node } = await mount(
      <ThemeScope mode={mode}>
        <form
          onSubmit={event => {
            event.preventDefault()
            submitted(new FormData(event.currentTarget).get('draft'))
          }}
        >
          <Dialog>
            <DialogTrigger render={renderButton}>Edit draft</DialogTrigger>
            <DialogContent>
              <DialogTitle>Edit draft</DialogTitle>
              <DialogDescription>Actions share the surrounding form.</DialogDescription>
              <label>
                Draft{' '}
                <input
                  name="draft"
                  defaultValue="Original"
                />
              </label>
              <Button render={renderButton}>Action</Button>
              <Button
                render={renderButton}
                type="submit"
              >
                Save
              </Button>
              <Button
                render={renderButton}
                type="reset"
              >
                Reset
              </Button>
              <Link
                href="#draft-help"
                variant="outline"
              >
                Draft help
              </Link>
              <p
                id="draft-help"
                tabIndex={-1}
              >
                Changes are saved with the surrounding form.
              </p>
              <DialogClose render={renderButton}>Close draft</DialogClose>
            </DialogContent>
          </Dialog>
        </form>
      </ThemeScope>
    )
    const draft = page.getByRole('textbox', { name: 'Draft' })
    const trigger = page.getByRole('button', { name: 'Edit draft' })
    const dialog = node.querySelector('dialog')!
    await act(async () => userEvent.click(trigger))
    expect(dialog.matches(':modal')).toBe(true)
    await act(async () =>
      userEvent.click(page.getByRole('button', { name: 'Action', exact: true }))
    )
    expect(submitted).not.toHaveBeenCalled()
    await act(async () => userEvent.fill(draft, 'Edited'))
    await act(async () => userEvent.click(page.getByRole('link', { name: 'Draft help' })))
    await expect.poll(() => location.hash).toBe('#draft-help')
    expect(dialog.open).toBe(true)
    await expect
      .element(page.getByText('Changes are saved with the surrounding form.'))
      .toHaveFocus()
    expect(submitted).not.toHaveBeenCalled()
    await act(async () => userEvent.click(page.getByRole('button', { name: 'Save', exact: true })))
    expect(submitted).toHaveBeenCalledExactlyOnceWith('Edited')
    expect(dialog.open).toBe(true)
    await act(async () => userEvent.click(page.getByRole('button', { name: 'Reset', exact: true })))
    await expect.element(draft).toHaveValue('Original')
    expect(dialog.open).toBe(true)
    expect(submitted).toHaveBeenCalledTimes(1)
    await act(async () => userEvent.click(page.getByRole('button', { name: 'Close draft' })))
    await expect.poll(() => dialog.open).toBe(false)
    await expect.element(trigger).toHaveFocus()
    expect(new FormData(node.querySelector('form')!).get('draft')).toBe('Original')
    expect(submitted).toHaveBeenCalledTimes(1)
  })

  test(`${mode}: StrictMode unmount closes the modal and releases action refs before remount`, async () => {
    const released = vi.fn()
    const attached: HTMLButtonElement[] = []
    const closeRef = (node: HTMLButtonElement | null) => {
      if (!node) return
      attached.push(node)
      return () => released(node)
    }
    const tree = (key: string) => (
      <StrictMode>
        <ThemeScope mode={mode}>
          <Dialog
            key={key}
            defaultOpen
          >
            <DialogContent>
              <DialogTitle>Session</DialogTitle>
              <DialogDescription>Each mount starts a fresh session.</DialogDescription>
              <DialogClose ref={closeRef}>Close session</DialogClose>
            </DialogContent>
          </Dialog>
        </ThemeScope>
      </StrictMode>
    )
    const { node, root } = await mount(tree('first'))
    const original = node.querySelector('dialog')!
    const originalClose = node.querySelector('button')!
    await act(async () => new Promise(requestAnimationFrame))
    expect(original.matches(':modal')).toBe(true)
    expect(attached).toContain(originalClose)
    released.mockClear()
    await act(async () => root.render(null))
    expect(original.open).toBe(false)
    expect(original.isConnected).toBe(false)
    expect(released).toHaveBeenCalledExactlyOnceWith(originalClose)
    await act(async () => root.render(tree('second')))
    const fresh = node.querySelector('dialog')!
    expect(fresh).not.toBe(original)
    expect(fresh.matches(':modal')).toBe(true)
    await act(async () => userEvent.keyboard('{Escape}'))
    await expect.poll(() => fresh.open).toBe(false)
  })

  test(`${mode}: server markup hydrates with stable relationships and native form state`, async () => {
    const tree = (error?: string) => (
      <ThemeScope mode={mode}>
        <form aria-label="Preferences">
          <Field
            label="Email"
            description="Work address"
            error={error}
            required
          >
            <Input
              name="email"
              type="email"
              defaultValue="ada@example.com"
            />
          </Field>
          <Checkbox
            name="updates"
            value="yes"
            label="Product updates"
            defaultChecked
            indeterminate
          />
          <Collapsible defaultOpen>
            <CollapsibleTrigger>Shipping</CollapsibleTrigger>
            <CollapsibleContent>Ships in two days.</CollapsibleContent>
          </Collapsible>
          <Dialog>
            <DialogTrigger>Edit preferences</DialogTrigger>
            <DialogContent>
              <DialogTitle>Preferences</DialogTitle>
              <DialogDescription>Manage your settings.</DialogDescription>
              <DialogClose>Close preferences</DialogClose>
            </DialogContent>
          </Dialog>
        </form>
      </ThemeScope>
    )
    const node = host()
    node.innerHTML = renderToString(tree())
    const ids = [...node.querySelectorAll('[id]')].map(node => node.id)
    const serverInput = node.querySelector('input')!
    const errors: unknown[] = []
    let root!: Root
    await act(async () => {
      root = hydrateRoot(node, tree(), { onRecoverableError: error => errors.push(error) })
    })
    roots.push(root)
    expect(errors).toEqual([])
    expect(node.querySelector('input')).toBe(serverInput)
    expect([...node.querySelectorAll('[id]')].map(node => node.id)).toEqual(ids)
    expect(node.querySelector('details')?.open).toBe(true)
    expect(node.querySelector<HTMLInputElement>('[type="checkbox"]')?.indeterminate).toBe(true)
    await act(async () => userEvent.click(page.getByText('Shipping', { exact: true })))
    await expect.poll(() => node.querySelector('details')?.open).toBe(false)
    await act(async () =>
      userEvent.fill(page.getByRole('textbox', { name: 'Email' }), 'grace@example.com')
    )
    await act(async () => root.render(tree('Use a company address.')))
    expect(new FormData(node.querySelector('form')!).get('email')).toBe('grace@example.com')
    expect(new FormData(node.querySelector('form')!).get('updates')).toBe('yes')
    expect(serverInput.getAttribute('aria-invalid')).toBe('true')
    await expect
      .element(page.getByRole('textbox', { name: 'Email' }))
      .toHaveAccessibleDescription('Work address Use a company address.')
    expect(errors).toEqual([])
  })
}

test('mounted dialog effects and cleanup use the host document inside an iframe', async () => {
  const holder = host()
  const iframe = document.createElement('iframe')
  iframe.title = 'Independent preview'
  holder.append(iframe)
  const owner = iframe.contentDocument!
  const foreignHost = owner.createElement('div')
  owner.body.append(foreignHost)
  const released = vi.fn()
  const root = createRoot(foreignHost)
  roots.push(root)
  await act(async () =>
    root.render(
      <Dialog defaultOpen>
        <DialogContent ref={node => (node ? () => released(node) : undefined)}>
          <DialogTitle>Independent panel</DialogTitle>
          <DialogDescription>This panel belongs to its own document.</DialogDescription>
          <DialogClose>Close independent panel</DialogClose>
        </DialogContent>
      </Dialog>
    )
  )
  const dialog = owner.querySelector('dialog')!
  expect(dialog.ownerDocument).toBe(owner)
  expect(dialog.matches(':modal')).toBe(true)
  expect(document.querySelector(':modal')).toBeNull()
  expect(owner.activeElement).toBe(owner.querySelector('button'))
  await act(async () => root.render(null))
  expect(dialog.open).toBe(false)
  expect(released).toHaveBeenCalledExactlyOnceWith(dialog)
})
