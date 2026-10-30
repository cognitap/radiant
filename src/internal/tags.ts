export function validateTags(values: readonly string[]) {
  if (
    !Array.isArray(values) ||
    values.some(value => typeof value !== 'string') ||
    new Set(values).size !== values.length
  )
    throw new TypeError('Tag values must be an array of distinct strings.')
}
export function tagSeparators(separators: readonly string[]) {
  if (
    !Array.isArray(separators) ||
    separators.some(value => typeof value !== 'string' || value.length !== 1)
  )
    throw new TypeError('TagsInput separators must be single characters.')
  return [...new Set([...separators, '\n', '\r'])]
}
export function splitTags(text: string, separators: readonly string[], final: boolean) {
  const segments: string[] = []
  let current = ''
  for (const character of text) {
    if (separators.includes(character)) {
      segments.push(current)
      current = ''
    } else current += character
  }
  if (final) {
    segments.push(current)
    current = ''
  }
  return { segments, remainder: current }
}
