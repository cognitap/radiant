import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  ButtonGroup,
  Button,
  Field,
  Input,
  Menu,
  MenuTrigger,
  MenuPortal,
  MenuContent,
  MenuItem,
  type ButtonGroupProps,
  type ButtonProps
} from '../../src/index.js'
import { StandardIcon } from '../../src/components/IconProvider/IconProvider.js'
export type ButtonGroupTaskOptions = Pick<
  ButtonGroupProps,
  'orientation' | 'dir' | 'className' | 'style'
> &
  Pick<ButtonProps, 'controlSize' | 'disabled' | 'pending' | 'motion'>
export function EditProjectActions({
  orientation,
  dir,
  className,
  style,
  ...buttons
}: ButtonGroupTaskOptions) {
  const [message, setMessage] = useState('Edit the project title before saving.')
  return (
    <form
      dir={dir}
      style={{ display: 'grid', gap: '1rem', width: 'min(30rem,100%)' }}
      onSubmit={event => {
        event.preventDefault()
        setMessage(`Saved ${new FormData(event.currentTarget).get('title')}.`)
      }}
      onReset={() => setMessage('Project title restored.')}
    >
      <Field
        label="Project title"
        required
      >
        <Input
          name="title"
          defaultValue="Reader study"
        />
      </Field>
      <ButtonGroup
        aria-label="Project actions"
        orientation={orientation}
        className={className}
        style={style}
      >
        <Button
          {...buttons}
          type="submit"
          variant="outline"
        >
          Save project
        </Button>
        <Button
          {...buttons}
          type="reset"
          variant="outline"
        >
          Restore title
        </Button>
      </ButtonGroup>
      <output aria-live="polite">{message}</output>
    </form>
  )
}
export function PublishReportActions({
  orientation,
  dir,
  className,
  style,
  ...buttons
}: ButtonGroupTaskOptions) {
  const [message, setMessage] = useState('The report is ready to publish.')
  return (
    <div
      dir={dir}
      style={{ display: 'grid', gap: '1rem', width: 'min(30rem,100%)' }}
    >
      <p>Publish the research summary now or choose another delivery action.</p>
      <ButtonGroup
        aria-label="Report publication"
        orientation={orientation}
        className={className}
        style={style}
      >
        <Button
          {...buttons}
          onClick={() => setMessage('Report published.')}
        >
          Publish report
        </Button>
        <Menu>
          <MenuTrigger
            {...buttons}
            iconOnly
            aria-label="More publication actions"
          >
            <StandardIcon
              name="chevronDown"
              fallback={
                <ChevronDown
                  aria-hidden
                  strokeWidth={1.75}
                />
              }
            />
          </MenuTrigger>
          <MenuPortal>
            <MenuContent>
              <MenuItem onClick={() => setMessage('Report scheduled for tomorrow.')}>
                Schedule for tomorrow
              </MenuItem>
              <MenuItem onClick={() => setMessage('A review copy is ready to share.')}>
                Create review copy
              </MenuItem>
            </MenuContent>
          </MenuPortal>
        </Menu>
      </ButtonGroup>
      <output aria-live="polite">{message}</output>
    </div>
  )
}
