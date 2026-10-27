export interface SpringParameters {
  readonly stiffness: number
  readonly damping: number
  readonly mass: number
}
export const motionInteractions = [
  'press',
  'disclosure',
  'dialog',
  'follow',
  'drag',
  'layout'
] as const
export type MotionInteraction = (typeof motionInteractions)[number]
export interface MotionProfileInput {
  readonly mode?: 'system' | 'off'
  readonly spring?: Partial<SpringParameters>
  readonly interactions?: Partial<Record<MotionInteraction, Partial<SpringParameters>>>
}
export interface MotionProfile {
  readonly mode: 'system' | 'off'
  readonly spring: SpringParameters
  readonly interactions: Readonly<Record<MotionInteraction, SpringParameters>>
}
const baseline: SpringParameters = Object.freeze({ stiffness: 320, damping: 30, mass: 1 })
function record(value: unknown, allowed: readonly string[], path: string): void {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TypeError(`${path} must be an object.`)
  for (const key of Object.keys(value))
    if (!allowed.includes(key)) throw new TypeError(`Unknown key: ${path}.${key}.`)
}
export function resolveSpringParameters(
  input: Partial<SpringParameters> = {},
  base: SpringParameters = baseline
): SpringParameters {
  record(input, ['stiffness', 'damping', 'mass'], 'spring')
  const result = { ...base }
  for (const key of ['stiffness', 'damping', 'mass'] as const) {
    const value = input[key]
    if (value === undefined) continue
    const max = key === 'mass' ? 100 : 10000
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > max)
      throw new TypeError(`spring.${key} must be greater than zero and at most ${max}.`)
    result[key] = value
  }
  return Object.freeze(result)
}
/** Plain immutable theme data; importing configuration never loads an animation engine. */
export function defineMotionProfile(input: MotionProfileInput = {}): MotionProfile {
  record(input, ['mode', 'spring', 'interactions'], 'motion')
  if (input.mode !== undefined && input.mode !== 'system' && input.mode !== 'off')
    throw new TypeError('motion.mode must be system or off.')
  const spring = resolveSpringParameters(input.spring)
  if (input.interactions !== undefined)
    record(input.interactions, motionInteractions, 'motion.interactions')
  const interactions = Object.fromEntries(
    motionInteractions.map(name => [
      name,
      resolveSpringParameters(input.interactions?.[name], spring)
    ])
  ) as Record<MotionInteraction, SpringParameters>
  return Object.freeze({
    mode: input.mode ?? 'system',
    spring,
    interactions: Object.freeze(interactions)
  })
}
export const defaultMotionProfile = defineMotionProfile()
export function resolveMotion(
  profile: MotionProfile,
  interaction: MotionInteraction,
  reducedMotion: boolean
) {
  if (!motionInteractions.includes(interaction)) throw new TypeError('Unknown motion interaction.')
  return {
    enabled: profile.mode !== 'off' && !reducedMotion,
    parameters: profile.interactions[interaction]
  }
}
