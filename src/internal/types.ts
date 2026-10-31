/** Keep mutually exclusive state owners when composed families remove native props. */
export type DistributiveOmit<Value, Keys extends PropertyKey> = Value extends unknown
  ? Omit<Value, Keys>
  : never

type NoToggle = {
  pressed?: never
  defaultPressed?: never
  onPressedChange?: never
  'aria-pressed'?: never
}

/** Openers and actions are not toggles; `?: never` still lets callers pass `undefined`. */
export type WithoutToggle<Props> = DistributiveOmit<Props, keyof NoToggle> & NoToggle
