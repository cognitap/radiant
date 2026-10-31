'use client'

import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { Field, type FieldProps } from './Field.js'
import { Alert, type AlertProps } from './Alert.js'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import { useControllableState } from './react/useControllableState.js'
import type { StateOwner } from './react/useNativeOwner.js'
import { useComposedRefs } from './react/useComposedRefs.js'
import type { DistributiveOmit } from './internal/types.js'
import type { AccessibleName } from './internal/accessibleName.js'
import { requireAccessibleName } from './internal/accessibleName.js'
import type { ThemeStyle } from './themes/defineTheme.js'

export type FormErrors = { fields?: Record<string, string | undefined>; form?: string }
export type FormSubmitContext = {
  form: HTMLFormElement
  submitter: HTMLElement | null
  signal: AbortSignal
}
export type FormState = {
  errors: FormErrors
  pending: boolean
  focusInvalid: () => void
}
export type FormProps = Omit<ComponentProps<'form'>, 'children' | 'style' | 'noValidate'> &
  StateOwner<'errors', FormErrors> &
  AccessibleName & {
    children?: ReactNode | ((state: Pick<FormState, 'errors' | 'pending'>) => ReactNode)
    style?: ThemeStyle
    'data-slot'?: string
    onErrorsChange?: (errors: FormErrors) => void
    validate?: (data: FormData) => FormErrors | void
    onSubmitValues?: (
      data: FormData,
      context: FormSubmitContext
    ) => FormErrors | void | Promise<FormErrors | void>
    submitErrorText?: string
  }
const emptyErrors: FormErrors = {}
const FormContext = createContext<FormState | null>(null)
export function useForm(): FormState | null {
  return useContext(FormContext)
}
function requiredForm() {
  const state = useForm()
  if (!state) throw new Error('Form parts must be inside Form.')
  return state
}
function namedError(errors: FormErrors, name: string) {
  const fields = errors.fields
  return fields && Object.hasOwn(fields, name) ? fields[name] : undefined
}
function hasErrors(errors: FormErrors) {
  return Boolean(errors.form || Object.values(errors.fields ?? {}).some(Boolean))
}
function eventName(target: EventTarget | null) {
  return target && 'name' in target && typeof target.name === 'string' ? target.name : ''
}
function equalErrors(left: FormErrors, right: FormErrors) {
  const entries = (errors: FormErrors) =>
    Object.entries(errors.fields ?? {})
      .filter(([, value]) => value)
      .sort(([a], [b]) => a.localeCompare(b))
  return (
    (left.form || '') === (right.form || '') &&
    JSON.stringify(entries(left)) === JSON.stringify(entries(right))
  )
}
function controls(form: HTMLFormElement) {
  return Array.from(form.elements).filter(
    (element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
      /^(INPUT|SELECT|TEXTAREA)$/.test(element.tagName)
  )
}
/** Native values stay in the browser or the application's form library. */
export function Form({
  children,
  errors: errorsProp,
  defaultErrors,
  onErrorsChange,
  validate,
  onSubmitValues,
  submitErrorText = 'Unable to save. Try again.',
  ref,
  className,
  onSubmit,
  onReset,
  onInput,
  onChange,
  ...props
}: FormProps) {
  requireAccessibleName('Form', props)
  const localRef = useRef<HTMLFormElement>(null)
  const composedRef = useComposedRefs(localRef, ref)
  const { value: errors, request: setErrors } = useControllableState({
    name: 'Form errors',
    value: errorsProp,
    defaultValue: defaultErrors,
    initialValue: emptyErrors,
    onChange: onErrorsChange,
    equal: equalErrors
  })
  const [pending, setPending] = useState(false)
  const operation = useRef<AbortController | null>(null)
  const revision = useRef(0)
  useEffect(() => () => operation.current?.abort(), [])
  const focusInvalid = useCallback(
    (next: FormErrors = errors) => {
      const form = localRef.current
      if (!form) return
      const target = controls(form).find(
        control =>
          !control.disabled &&
          control.type !== 'hidden' &&
          Boolean(
            namedError(next, control.name) ||
            (control.willValidate && !control.validity.valid) ||
            control.getAttribute('aria-invalid') === 'true'
          )
      )
      if (target) {
        const field = target.closest('[data-slot~="field"]')
        const replacement = field?.querySelector<HTMLElement>(
          'input:not([type="hidden"]):not([disabled]),textarea:not([disabled]),select:not([hidden]):not([disabled]),button[aria-haspopup]:not([disabled])'
        )
        ;(target.getClientRects().length ? target : replacement)?.focus()
      } else if (next.form) form.querySelector<HTMLElement>('[data-slot~="form-error"]')?.focus()
    },
    [errors]
  )
  const state: FormState = { errors, pending, focusInvalid: () => focusInvalid() }
  function edited(name: string) {
    revision.current++
    const old = errors
    if (old.form || namedError(old, name)) {
      const fields = { ...old.fields }
      delete fields[name]
      setErrors({ fields })
    }
  }
  return (
    <FormContext.Provider value={state}>
      <form
        {...props}
        ref={composedRef}
        noValidate
        aria-busy={pending || props['aria-busy'] || undefined}
        data-slot={joinIds('form', props['data-slot'])}
        data-pending={pending ? '' : undefined}
        data-invalid={hasErrors(errors) ? '' : undefined}
        className={cn(
          'grid min-w-0 gap-[var(--rad-form-gap,var(--rad-spacing-group-gap,1rem))]',
          className
        )}
        onInput={event => {
          onInput?.(event)
          edited(eventName(event.target))
        }}
        onChange={event => {
          onChange?.(event)
          edited(eventName(event.target))
        }}
        onReset={event => {
          onReset?.(event)
          if (event.defaultPrevented) return
          operation.current?.abort()
          operation.current = null
          revision.current++
          setPending(false)
          setErrors(emptyErrors)
        }}
        onSubmit={event => {
          if (operation.current) {
            event.preventDefault()
            return
          }
          onSubmit?.(event)
          if (event.defaultPrevented) return
          const form = event.currentTarget
          const submitter = (event.nativeEvent as SubmitEvent).submitter
          const data = new FormData(form, submitter)
          const nativeErrors: Record<string, string> = Object.create(null)
          let unnamedError: string | undefined
          if (!(submitter as HTMLButtonElement | null)?.formNoValidate) {
            for (const control of controls(form)) {
              if (control.willValidate && !control.validity.valid) {
                if (control.name) nativeErrors[control.name] ??= control.validationMessage
                else unnamedError ??= control.validationMessage
              }
            }
          }
          const custom = validate?.(data) ?? emptyErrors
          const next = {
            form: custom.form || unnamedError,
            fields: { ...custom.fields, ...nativeErrors }
          }
          setErrors(next)
          if (hasErrors(next)) {
            event.preventDefault()
            form.ownerDocument.defaultView?.requestAnimationFrame(() => focusInvalid(next))
            return
          }
          if (!onSubmitValues) return
          event.preventDefault()
          const controller = new AbortController()
          operation.current = controller
          const submittedRevision = revision.current
          setPending(true)
          void Promise.resolve()
            .then(() => onSubmitValues(data, { form, submitter, signal: controller.signal }))
            .catch(() => ({ form: submitErrorText }))
            .then(result => {
              if (controller.signal.aborted || submittedRevision !== revision.current) return
              const next = result ?? emptyErrors
              setErrors(next)
              if (hasErrors(next))
                form.ownerDocument.defaultView?.requestAnimationFrame(() => focusInvalid(next))
            })
            .finally(() => {
              if (operation.current !== controller) return
              operation.current = null
              if (!controller.signal.aborted) setPending(false)
            })
        }}
      >
        {typeof children === 'function' ? children({ errors, pending }) : children}
      </form>
    </FormContext.Provider>
  )
}
export type FormFieldProps = DistributiveOmit<FieldProps, 'name'> & { name: string }
/** Name matches the real input's name; Field retains label and error relationships. */
export function FormField({ name, error, ...props }: FormFieldProps) {
  const { errors } = requiredForm()
  return (
    <Field
      {...props}
      error={error ?? namedError(errors, name)}
      data-slot={joinIds('form-field', props['data-slot'])}
    />
  )
}
export type FormErrorProps = Omit<AlertProps, 'children' | 'tabIndex'>
export function FormError(props: FormErrorProps) {
  const { errors } = requiredForm()
  return errors.form ? (
    <Alert
      {...props}
      tone={props.tone ?? 'danger'}
      announce={props.announce ?? 'assertive'}
      tabIndex={-1}
      data-slot={joinIds('form-error', props['data-slot'])}
    >
      {errors.form}
    </Alert>
  ) : null
}
