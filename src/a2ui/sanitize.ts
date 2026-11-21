export type A2uiMessage = Readonly<Record<string, unknown>>

function stripThemeFromObject(value: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (key === 'theme') continue
    if (key === 'metadata' && entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const cleanedMeta = stripThemeFromMetadata(entry as Record<string, unknown>)
      if (Object.keys(cleanedMeta).length > 0) next.metadata = cleanedMeta
      continue
    }
    next[key] = entry
  }
  return next
}

function stripThemeFromMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(metadata)) {
    if (key === 'theme') continue
    if (key === 'extensions' && entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const ext: Record<string, unknown> = {}
      for (const [extKey, extValue] of Object.entries(entry as Record<string, unknown>)) {
        if (extKey === 'theme') continue
        ext[extKey] = extValue
      }
      if (Object.keys(ext).length > 0) next.extensions = ext
      continue
    }
    next[key] = entry
  }
  return next
}

/**
 * Returns a copy of incoming A2UI messages with agent-supplied theme hints stripped so
 * the surrounding Radiant ThemeScope remains the sole styling authority.
 */
export function sanitizeA2uiMessages(messages: readonly A2uiMessage[]): readonly A2uiMessage[] {
  return messages.map(message => {
    if (!message || typeof message !== 'object' || Array.isArray(message)) return message
    const createSurface = message.createSurface
    if (!createSurface || typeof createSurface !== 'object' || Array.isArray(createSurface)) {
      return message
    }
    return {
      ...message,
      createSurface: stripThemeFromObject(createSurface as Record<string, unknown>)
    }
  })
}
