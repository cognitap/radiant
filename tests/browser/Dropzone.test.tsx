import { act } from 'react'
import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { Dropzone, Field } from '../../src/index.js'
import { mount } from './familyHarness.js'

test('mixed drops retain accepted files for native submission and reset the status', async () => {
  const selected = vi.fn()
  const { host } = await mount(
    <form>
      <Field label="Attachments">
        <Dropzone
          name="files"
          accept=".txt"
          multiple
          maxFiles={1}
          maxSize={4}
          onFilesChange={selected}
        />
      </Field>
    </form>,
    true
  )
  const form = host.querySelector('form')!
  const input = host.querySelector('input')!
  const target = host.querySelector('[data-slot="dropzone"]')!
  expect(input).toHaveAccessibleName('Attachments')
  const transfer = new DataTransfer()
  transfer.items.add(new File(['ok'], 'notes.TXT'))
  transfer.items.add(new File(['ok'], 'next.txt'))
  transfer.items.add(new File(['too long'], 'large.txt'))
  transfer.items.add(new File(['no'], 'image.jpg'))
  await act(async () => {
    target.dispatchEvent(
      new DragEvent('dragenter', { dataTransfer: transfer, bubbles: true, cancelable: true })
    )
  })
  expect(target).toHaveAttribute('data-state', 'drag-over')
  await act(async () => {
    target.dispatchEvent(
      new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true })
    )
  })
  expect(target).toHaveAttribute('data-state', 'rejected')
  expect(
    selected.mock.calls[0][0].rejected.map((entry: { reason: string }) => entry.reason)
  ).toEqual(['count', 'size', 'type'])
  expect(new FormData(form).getAll('files').map(entry => (entry as File).name)).toEqual([
    'notes.TXT'
  ])
  await act(async () => form.reset())
  await expect.poll(() => target.getAttribute('data-state')).toBe('idle')
})

test('the native chooser accepts files and uses the visible prompt as its name', async () => {
  const { host } = await mount(
    <Dropzone
      chooseLabel="Attach a report"
      accept="text/*"
    />
  )
  const input = host.querySelector('input')!
  expect(input).toHaveAccessibleName('Attach a report')
  const file = new File(['Report'], 'report.txt', { type: 'text/plain' })
  await act(async () => userEvent.upload(input, [file]))
  expect(host.querySelector('[data-slot="dropzone"]')).toHaveAttribute('data-state', 'accepted')
  expect(host.querySelector('output')).toHaveTextContent('report.txt')
})
