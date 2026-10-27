import { useRef } from 'react'
import { Button, ThemeScope, defineTheme, type MotionProfile } from '@cognitap/radiant'
import { createSpring, createLayoutSpring, bindSpringStyle } from '@cognitap/radiant/motion'
import { useSpring, useSpringStyle, useReducedMotion } from '@cognitap/radiant/motion/react'

const theme = defineTheme({
  id: 'motion-consumer',
  name: 'Motion consumer',
  motion: { interactions: { press: { stiffness: 400 } } }
})
const profile: MotionProfile = theme.motion
const spring = createSpring(0, { parameters: profile.interactions.follow })
spring.to(120)
spring.configure({ enabled: false })
const layout = createLayoutSpring({ x: 0, y: 0, width: 120, height: 60 })
layout.to({ x: 0, y: 20, width: 180, height: 80 })
function Bound() {
  const ref = useRef<HTMLButtonElement>(null)
  const scale = useSpringStyle(ref, 'scale', 1, 'press', 1)
  const value = useSpring(0, 'follow')
  const reduced = useReducedMotion()
  return (
    <ThemeScope theme={theme}>
      <Button
        ref={ref}
        onClick={() => {
          scale.to(0.96)
          value.to(reduced ? 0 : 100)
        }}
      >
        Save
      </Button>
    </ThemeScope>
  )
}
void Bound
void bindSpringStyle
// @ts-expect-error arbitrary transform ownership is unsupported
bindSpringStyle(document.createElement('button'), spring, 'transform')
// @ts-expect-error arbitrary CSS-unit strings are unsupported
spring.to('10rem')
