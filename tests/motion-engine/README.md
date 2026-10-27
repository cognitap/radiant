# Installed motion engine proof

Run `node scripts/prove-motion-engine.mjs --require-suitable` or
`node scripts/prove-motion-engine.mjs --serve` (Node 26+) from the repository root.
This isolated locked consumer uses published Radiant and candidate engines. It is
excluded from the production package and has no authority over native semantics.
See [the evidence and limits](../../docs/verification/2026-10-27-spring-engine.md).
