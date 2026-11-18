export function localizedDigits(locale: string, numberingSystem: string) {
  const numbers = new Intl.NumberFormat(locale, {
    numberingSystem,
    useGrouping: false
  })
  const digits = Array.from({ length: 10 }, (_, i) => numbers.format(i))
  function ascii(text: string) {
    return Array.from(text, char =>
      digits.includes(char) ? String(digits.indexOf(char)) : char
    ).join('')
  }
  const localize = (text: string) => text.replace(/[0-9]/g, digit => digits[Number(digit)])
  return { ascii, localize }
}
