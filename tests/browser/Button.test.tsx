import { act, createRef, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { Button, ThemeScope, glass, type ButtonRenderProps } from '../../src/index.js'
import '../../.storybook/styles.css'

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
const mounted: Array<{ root: Root; host: HTMLDivElement }> = []
async function mount(children: ReactNode) {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  mounted.push({ root, host })
  await act(async () => root.render(children))
  return { root, host }
}
afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount())
    host.remove()
  }
})
function ConsumerButton({ children, ...props }: ButtonRenderProps) {
  return <button {...props}>{children}</button>
}
for (const mode of ['light', 'dark'] as const) {
  test(`${mode}: Button owns default, native and custom host guards and native submit/reset`, async () => {
    for (const render of [
      undefined,
      (props: ButtonRenderProps) => <button {...props}>{props.children}</button>,
      (props: ButtonRenderProps) => <ConsumerButton {...props} />
    ]) {
      const clicked = vi.fn()
      const submitted = vi.fn()
      const ref = createRef<HTMLButtonElement>()
      let veto = true
      const tree = (type?: 'submit' | 'reset', pending = false, disabled = false) => (
        <ThemeScope
          theme={glass}
          mode={mode}
        >
          <form
            onSubmit={event => {
              event.preventDefault()
              submitted()
            }}
          >
            <fieldset disabled={disabled}>
              <legend>Draft</legend>
              <label>
                Draft name{' '}
                <input
                  name="draft"
                  defaultValue="Original"
                />
              </label>
              <Button
                render={render}
                ref={ref}
                type={type}
                pending={pending}
                aria-busy={false}
                onClick={event => {
                  clicked()
                  if (veto) event.preventDefault()
                }}
              >
                Action
              </Button>
            </fieldset>
          </form>
        </ThemeScope>
      )
      const { root, host } = await mount(tree())
      const button = ref.current!
      const input = host.querySelector('input')!
      const action = page.getByRole('button', { name: 'Action' })
      expect(host.querySelectorAll('button')).toHaveLength(1)
      expect(button.type).toBe('button')
      await act(async () => userEvent.click(action))
      expect(clicked).toHaveBeenCalledTimes(1)
      expect(submitted).not.toHaveBeenCalled()
      await act(async () => root.render(tree('submit')))
      await act(async () => userEvent.keyboard('{Enter}'))
      expect(clicked).toHaveBeenCalledTimes(2)
      expect(submitted).not.toHaveBeenCalled()
      veto = false
      await act(async () => userEvent.keyboard('{Enter}'))
      expect(clicked).toHaveBeenCalledTimes(3)
      expect(submitted).toHaveBeenCalledTimes(1)
      input.value = 'Edited'
      await act(async () => root.render(tree('reset', true)))
      expect(button.getAttribute('aria-busy')).toBe('true')
      expect(button.disabled).toBe(false)
      expect(button.querySelector('[aria-hidden="true"]')).not.toBeNull()
      await act(async () => userEvent.click(action))
      await act(async () => userEvent.keyboard(' '))
      expect(clicked).toHaveBeenCalledTimes(3)
      expect(input.value).toBe('Edited')
      await expect.element(action).toHaveFocus()
      await act(async () => root.render(tree('reset', false, true)))
      expect(button.matches(':disabled')).toBe(true)
      await act(async () => button.click())
      expect(clicked).toHaveBeenCalledTimes(3)
      await act(async () => root.render(tree('reset')))
      await act(async () => userEvent.click(action))
      expect(input.value).toBe('Original')
      expect(clicked).toHaveBeenCalledTimes(4)
      expect(submitted).toHaveBeenCalledTimes(1)
      expect(ref.current).toBe(button)
      await act(async () => root.render(null))
      expect(ref.current).toBeNull()
    }
  })
}
