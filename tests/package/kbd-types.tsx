import { createRef } from 'react'
import { Kbd, KbdGroup, type KbdProps, type KbdGroupProps, defineTheme } from '@cognitap/radiant'
const props: KbdProps = {
  children: 'Esc',
  ref: createRef<HTMLElement>(),
  style: { '--rad-kbd-radius': '4px' },
  'aria-hidden': true,
  'data-slot': 'help-key'
}
const combo: KbdGroupProps = {
  children: (
    <>
      <Kbd>Control</Kbd>+<Kbd>K</Kbd>
    </>
  ),
  dir: 'ltr',
  className: 'gap-2'
}
export const key = <Kbd {...props} />
export const group = <KbdGroup {...combo} />
defineTheme({
  id: 'keys',
  name: 'Keys',
  components: { kbd: { radius: '4px', gap: '3px', fontSize: '13px' } }
})
// @ts-expect-error A key displays content; it is not a button.
export const role: KbdProps = { children: 'K', role: 'button' }
// @ts-expect-error Key notation never creates a tab stop.
export const tab = <Kbd tabIndex={0}>K</Kbd>
// @ts-expect-error Keyboard bindings belong to the application.
export const shortcut = <Kbd shortcut="Control+K">K</Kbd>
// @ts-expect-error Modifier display is explicit consumer content, not OS detection.
export const platform = <Kbd platform="auto">K</Kbd>
// @ts-expect-error Content is required.
export const empty = <Kbd />
