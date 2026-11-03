---
status: accepted
---

# Use Motion `springValue` for spring physics

`src/motion/runtime.ts` wraps `springValue` from `motion` in `createSpring`. Nothing else in `src/` imports `motion` or `motion/react`. `animate`, `motionValue`, React components, and layout projection stay out. Radiant owns DOM writes, gestures, layout measurement, reduced motion, and native element lifecycle, as described in [motion.md](../motion.md), so upgrading or replacing Motion touches one file.

Motion is MIT-licensed, and `springValue` is a standalone numeric solver that costs a fraction of `animate`, `motionValue`, or Motion's React runtime. GSAP's license restricts visual animation builders, which a public component library cannot rule out for its consumers, and React Spring has no layout engine. Motion's layout projection also resets velocity when a target changes mid-flight, whereas Radiant's layout springs keep momentum across retargets.
