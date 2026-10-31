import { createRef } from 'react'
import {
  Form,
  FormField,
  FormError,
  Input,
  Button,
  defineTheme,
  useForm,
  type FormErrors
} from '../../src/index.js'
const errors: FormErrors = { fields: { email: 'Already registered.' }, form: 'Check the address.' }
export const form = (
  <Form
    aria-label="Registration"
    ref={createRef<HTMLFormElement>()}
    errors={errors}
    onErrorsChange={() => {}}
    validate={data => ({
      fields: String(data.get('email')).includes('@') ? {} : { email: 'Enter an email.' }
    })}
    onSubmitValues={async (data, { signal, form, submitter }) => {
      void data
      void signal
      void form
      void submitter
    }}
    style={{ '--rad-form-gap': '2rem' }}
  >
    {({ pending }) => (
      <>
        <FormField
          name="email"
          label="Email"
          required
        >
          <Input
            name="email"
            type="email"
          />
        </FormField>
        <FormError />
        <Button
          type="submit"
          pending={pending}
        >
          Save
        </Button>
      </>
    )}
  </Form>
)
export const themed = defineTheme({
  id: 'forms',
  name: 'Forms',
  components: { form: { gap: '2rem' } }
})
export function Hook() {
  const form = useForm()
  return <Button onClick={() => form?.focusInvalid()}>Review errors</Button>
}
// @ts-expect-error A form needs an accessible name.
export const unnamed = <Form />
// @ts-expect-error Error state has one owner.
export const contradictory = (
  <Form
    aria-label="Invalid"
    errors={errors}
    defaultErrors={{}}
  />
)
// @ts-expect-error FormField requires a matching input name.
export const noFieldName = <FormField label="Email" />
