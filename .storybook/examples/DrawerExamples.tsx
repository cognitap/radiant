import { useId, useRef, useState } from 'react'
import {
  Button,
  Checkbox,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerTitle,
  DrawerTrigger,
  Field,
  Input,
  type DrawerContentProps,
  type DrawerProps
} from '../../src/index.js'
export type DrawerOptions = Pick<DrawerContentProps, 'side' | 'motion' | 'className' | 'style'> &
  Pick<DrawerProps, 'modal' | 'closeOnBackdrop' | 'closeOnEscape'> & {
    dir?: 'ltr' | 'rtl'
    initialOpen?: boolean
    initialSize?: number
    disabled?: boolean
    pending?: boolean
  }
export function ProjectSettings({
  dir,
  initialOpen,
  initialSize = 1,
  disabled,
  pending,
  modal,
  closeOnBackdrop,
  closeOnEscape,
  ...surface
}: DrawerOptions) {
  const form = useId(),
    [saved, setSaved] = useState('Not saved'),
    [snap, setSnap] = useState(initialSize)
  return (
    <div
      dir={dir}
      className="grid gap-4"
    >
      <p>Keep the project in view while changing its settings.</p>
      <Drawer
        defaultOpen={initialOpen}
        snapPoint={snap}
        onSnapPointChange={setSnap}
        modal={modal}
        closeOnBackdrop={closeOnBackdrop}
        closeOnEscape={closeOnEscape}
      >
        <DrawerTrigger
          disabled={disabled}
          pending={pending}
        >
          Project settings
        </DrawerTrigger>
        <DrawerContent {...surface}>
          <DrawerHandle
            aria-label="Resize project settings"
            disabled={disabled}
            pending={pending}
          />
          <DrawerTitle>Project settings</DrawerTitle>
          <DrawerDescription>Update the name and notifications, then save.</DrawerDescription>
          <form
            id={form}
            className="grid gap-4"
            onSubmit={event => {
              event.preventDefault()
              setSaved(`Saved ${new FormData(event.currentTarget).get('project')}`)
            }}
          >
            <Field label="Project name">
              <Input
                name="project"
                defaultValue="Atlas"
              />
            </Field>
            <Checkbox
              label="Email me about comments"
              name="comments"
              defaultChecked
            />
            <Button type="submit">Save settings</Button>
          </form>
          <output>{saved}</output>
          <DrawerClose variant="outline">Close settings</DrawerClose>
        </DrawerContent>
      </Drawer>
      <Button
        variant="outline"
        onClick={() => setSaved('Project is still available')}
      >
        Open project
      </Button>
      <p>Size: {Math.round(snap * 100)}%</p>
    </div>
  )
}
export function ReportOutline({
  dir,
  initialOpen,
  initialSize = 1,
  modal = false,
  closeOnBackdrop,
  closeOnEscape,
  disabled,
  pending,
  ...surface
}: DrawerOptions) {
  return (
    <div
      dir={dir}
      className="grid gap-4"
    >
      <p>Read the report alongside a non-modal outline.</p>
      <Drawer
        defaultOpen={initialOpen}
        defaultSnapPoint={initialSize}
        modal={modal}
        closeOnBackdrop={closeOnBackdrop}
        closeOnEscape={closeOnEscape}
      >
        <DrawerTrigger
          disabled={disabled}
          pending={pending}
        >
          Report outline
        </DrawerTrigger>
        <DrawerContent {...surface}>
          <DrawerHandle
            aria-label="Resize report outline"
            disabled={disabled}
            pending={pending}
          />
          <DrawerTitle>Report outline</DrawerTitle>
          <DrawerDescription>Follow a section without blocking the page.</DrawerDescription>
          <ol className="grid gap-6">
            {['Overview', 'Research', 'Audience', 'Findings', 'Recommendations', 'References'].map(
              section => (
                <li key={section}>
                  <strong>{section}</strong>
                  <p>Review the supporting evidence and decisions for this section.</p>
                </li>
              )
            )}
          </ol>
          <DrawerClose>Close outline</DrawerClose>
        </DrawerContent>
      </Drawer>
      <Field label="Report notes">
        <Input defaultValue="Compare the findings" />
      </Field>
    </div>
  )
}
export function ReviewOrder({
  dir,
  initialOpen,
  initialSize = 1,
  disabled,
  pending,
  modal,
  closeOnBackdrop,
  closeOnEscape,
  ...surface
}: DrawerOptions) {
  const [open, setOpen] = useState(initialOpen ?? false),
    [allow, setAllow] = useState(false),
    [message, setMessage] = useState('Review your order before leaving.'),
    ref = useRef<HTMLDialogElement>(null)
  return (
    <div
      dir={dir}
      className="grid gap-4"
    >
      <p>Keep an unfinished order open until the owner accepts dismissal.</p>
      <Drawer
        open={open}
        onOpenChange={next => {
          if (next || allow) setOpen(next)
          else setMessage('Confirm that you are ready to leave.')
        }}
        defaultSnapPoint={initialSize}
        modal={modal}
        closeOnBackdrop={closeOnBackdrop}
        closeOnEscape={closeOnEscape}
      >
        <DrawerTrigger
          disabled={disabled}
          pending={pending}
        >
          Review order
        </DrawerTrigger>
        <DrawerContent
          {...surface}
          ref={ref}
        >
          <DrawerHandle
            aria-label="Resize order review"
            disabled={disabled}
            pending={pending}
          />
          <DrawerTitle>Review order</DrawerTitle>
          <DrawerDescription>Two notebooks and one pen, total €28.</DrawerDescription>
          <Checkbox
            label="I am ready to leave"
            checked={allow}
            onChange={event => setAllow(event.currentTarget.checked)}
          />
          <output>{message}</output>
          <DrawerClose
            variant="outline"
            render={props => <button {...props}>{props.children}</button>}
          >
            Leave review
          </DrawerClose>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
