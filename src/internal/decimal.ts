function parts(value: number) {
  const [mantissa, exponent = '0'] = value.toString().split('e')
  return {
    coefficient: BigInt(mantissa!.replace('.', '')),
    exponent: Number(exponent) - (mantissa!.split('.')[1]?.length ?? 0)
  }
}

/** Add finite JavaScript numbers through decimal coefficients before conversion. */
export function addDecimal(left: number, right: number) {
  const a = parts(left),
    b = parts(right),
    exponent = Math.min(a.exponent, b.exponent)
  const coefficient =
    a.coefficient * 10n ** BigInt(a.exponent - exponent) +
    b.coefficient * 10n ** BigInt(b.exponent - exponent)
  return Number(coefficient.toString() + 'e' + exponent)
}

/** Scale a finite decimal step by a whole number of intervals. */
export function multiplyDecimal(value: number, whole: number) {
  const { coefficient, exponent } = parts(value)
  return Number((coefficient * BigInt(whole)).toString() + 'e' + exponent)
}
