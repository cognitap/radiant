/** Keep mutually exclusive state owners when composed families remove native props. */
export type DistributiveOmit<Value, Keys extends PropertyKey> = Value extends unknown
  ? Omit<Value, Keys>
  : never
