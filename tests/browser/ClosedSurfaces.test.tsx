import { expect, test } from 'vitest'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '../../src/index.js'
import { click, key, mount, pause } from './familyHarness.js'

// Application CSS is usually unlayered, so it outranks Radiant's layered utilities.
const style = document.createElement('style')
style.textContent = '.consumer-grid { display: grid; }'
document.head.append(style)

const display = (host: ParentNode, slot: string) => {
  const node = host.querySelector<HTMLElement>(`[data-slot~="${slot}"]`)
  return node ? getComputedStyle(node).display : 'absent'
}

test('a consumer display class never shows a closed Popover, Tooltip or Dialog', async () => {
  const { host } = await mount(
    <div>
      <Popover>
        <PopoverTrigger>Edit copy</PopoverTrigger>
        <PopoverContent
          aria-label="Edit copy"
          className="consumer-grid"
        >
          Fields
        </PopoverContent>
      </Popover>
      <Tooltip>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent className="consumer-grid">Saves the draft</TooltipContent>
      </Tooltip>
      <Dialog>
        <DialogTrigger>Open settings</DialogTrigger>
        <DialogContent className="consumer-grid">
          <DialogTitle>Settings</DialogTitle>
        </DialogContent>
      </Dialog>
    </div>
  )
  expect(display(host, 'popover-content')).toBe('none')
  expect(['none', 'absent']).toContain(display(document, 'tooltip-content'))
  expect(display(host, 'dialog')).toBe('none')

  const trigger = host.querySelector<HTMLButtonElement>('[data-slot~="popover-trigger"]')!
  await click(trigger)
  expect(display(host, 'popover-content')).toBe('grid')
  await key('{Escape}')
  await pause(50)
  expect(display(host, 'popover-content')).toBe('none')
})
