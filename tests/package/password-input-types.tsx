import { createRef } from 'react'
import { PasswordInput, type PasswordInputProps, defineTheme } from '@cognitap/radiant'
export const uncontrolled = (
  <PasswordInput
    name="password"
    defaultValue=""
    autoComplete="current-password"
    ref={createRef<HTMLInputElement>()}
  />
)
export const controlled = (
  <PasswordInput
    value=""
    onChange={() => {}}
    autoComplete="section-signup new-password"
    form="profile"
    showLabel="Reveal"
    hideLabel="Conceal"
    parts={{ wrapper: { style: { gap: '8px' } }, toggle: { className: 'rounded-none' } }}
  />
)
export const theme = defineTheme({
  id: 'password',
  name: 'Password',
  components: { passwordInput: { gap: '8px' } }
})
// @ts-expect-error One native value owner.
export const both: PasswordInputProps = { value: 'one', defaultValue: 'two' }
// @ts-expect-error Password values are strings.
export const numeric: PasswordInputProps = { value: 123 }
// @ts-expect-error Null is not an empty password.
export const nullable: PasswordInputProps = { value: null }
// @ts-expect-error The component owns its native type.
export const type: PasswordInputProps = { type: 'text' }
// @ts-expect-error Native inputs have no children.
export const children: PasswordInputProps = { children: 'secret' }
// @ts-expect-error The ref is the actual input, not its wrapper.
export const wrapper: PasswordInputProps = { ref: createRef<HTMLDivElement>() }
