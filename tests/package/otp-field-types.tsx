import { createRef } from 'react'
import { OTPField, type OTPFieldMode, type OTPFieldProps, defineTheme } from '@cognitap/radiant'
const mode: OTPFieldMode = 'alphanumeric'
const props: OTPFieldProps = {
  value: 'AB12',
  length: 8,
  mode,
  onChange: event => event.currentTarget.value,
  ref: createRef<HTMLInputElement>(),
  parts: {
    wrapper: { style: { gap: 8 } },
    slot: { className: 'rounded-none', style: { borderRadius: 0 } }
  }
}
export const code = <OTPField {...props} />
export const local = (
  <OTPField
    defaultValue="12"
    name="code"
    form="verify"
    controlSize="small"
  />
)
defineTheme({ id: 'otp', name: 'OTP', components: { otpField: { gap: '1rem', slotSize: '3rem' } } })
export const both = (
  // @ts-expect-error Native ownership is exclusive.
  <OTPField
    value="1"
    defaultValue="2"
  />
)
// @ts-expect-error A code is one string.
export const array = <OTPField value={['1', '2']} />
// @ts-expect-error Numeric is an editing mode, never a native number input.
export const number = <OTPField type="number" />
// @ts-expect-error The library owns SMS autofill semantics.
export const autofill = <OTPField autoComplete="off" />
// @ts-expect-error Code length owns the native maximum.
export const maximum = <OTPField maxLength={3} />
// @ts-expect-error Slots remain decorative; only their presentation is customizable.
export const slot = <OTPField parts={{ slot: { role: 'textbox' } }} />
// @ts-expect-error Each root ref reaches a native input.
export const wrongRef = <OTPField ref={createRef<HTMLDivElement>()} />
